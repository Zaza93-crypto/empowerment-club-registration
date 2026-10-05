// Add the admin/auth functions below to the EXISTING empowerment-api Worker.
// Keep the existing public registration actions (GET, saveGroup, saveMember,
// bulkMembers, deleteGroup, deleteMember) working as they do now.
// The admin actions require Authorization: Bearer <token>.
//
// Cloudflare Worker secrets required:
// PRIMARY_ADMIN_USERNAME
// PRIMARY_ADMIN_PASSWORD
//
// The first successful login can be used to create secondary users.
// For production, move the primary password to a generated secret and do not
// hard-code it in the frontend.

const ADMIN_TOKEN_TTL = 8 * 60 * 60 * 1000;

function b64url(bytes) {
  let s = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function randomB64(n=16) { const b=new Uint8Array(n); crypto.getRandomValues(b); return b64url(b); }
async function sha256(text) {
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return b64url(b);
}
async function passwordHash(password,salt) { return sha256(`${salt}:${password}`); }

async function signToken(payload,secret) {
  const header=btoa(JSON.stringify({alg:'HS256',typ:'JWT'})).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  const body=btoa(JSON.stringify(payload)).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}
async function verifyToken(token,secret) {
  try {
    const [h,p,s]=token.split('.');
    if(!h||!p||!s) return null;
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    const pad=x=>x.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-x.length%4)%4);
    const ok=await crypto.subtle.verify('HMAC',key,Uint8Array.from(atob(pad(s)),c=>c.charCodeAt(0)),new TextEncoder().encode(`${h}.${p}`));
    if(!ok)return null;
    const payload=JSON.parse(atob(pad(p))); if(payload.exp<Date.now())return null; return payload;
  }catch{return null}
}
async function audit(env,user,action,targetId=null) {
  await env.DB.prepare(`INSERT INTO admin_audit (user_id,username,action,target_id) VALUES (?,?,?,?)`).bind(user.id,user.username,action,targetId).run();
}
async function authenticateAdmin(request,env) {
  const auth=request.headers.get('Authorization')||'';
  const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  return verifyToken(token,env.PRIMARY_ADMIN_PASSWORD);
}
async function adminLogin(env,body) {
  const username=String(body.username||'').trim();
  const password=String(body.password||'');
  if(username===env.PRIMARY_ADMIN_USERNAME && password===env.PRIMARY_ADMIN_PASSWORD) {
    const user={id:'primary-admin',username,name:'Primary Administrator',role:'primary'};
    const token=await signToken({sub:user.id,username:user.username,role:user.role,exp:Date.now()+ADMIN_TOKEN_TTL},env.PRIMARY_ADMIN_PASSWORD);
    return {token,user};
  }
  const u=await env.DB.prepare(`SELECT * FROM admin_users WHERE username=? AND active=1`).bind(username).first();
  if(u) {
    const hash=await passwordHash(password,u.password_salt);
    if(hash===u.password_hash) {
      const user={id:u.id,username:u.username,name:u.name,role:u.role};
      const token=await signToken({sub:user.id,username:user.username,role:user.role,exp:Date.now()+ADMIN_TOKEN_TTL},env.PRIMARY_ADMIN_PASSWORD);
      return {token,user};
    }
  }
  throw new Error('Invalid username or password');
}

async function adminData(env,user) {
  const groups=await env.DB.prepare(`SELECT * FROM groups ORDER BY created_at ASC`).all();
  const members=await env.DB.prepare(`SELECT * FROM members ORDER BY created_at ASC`).all();
  return {groups:groups.results||[],members:members.results||[]};
}
async function adminUsers(env,user) {
  if(user.role!=='primary') throw new Error('Primary Administrator access required');
  const r=await env.DB.prepare(`SELECT id,username,name,role,active,created_at FROM admin_users ORDER BY created_at ASC`).all();
  return {users:r.results||[]};
}
async function createUser(env,user,body) {
  if(user.role!=='primary') throw new Error('Primary Administrator access required');
  if(!body.username||!body.password||!body.name) throw new Error('Name, username and password are required');
  if(String(body.password).length<8) throw new Error('Password must be at least 8 characters');
  const salt=randomB64(16), hash=await passwordHash(String(body.password),salt);
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO admin_users(id,username,name,role,password_hash,password_salt) VALUES(?,?,?,?,?,?)`)
    .bind(id,String(body.username).trim(),String(body.name).trim(),body.role==='viewer'?'viewer':'data_officer',hash,salt).run();
  await audit(env,user,'create_secondary_user',id);
  return {ok:true};
}
async function setUserStatus(env,user,body) {
  if(user.role!=='primary') throw new Error('Primary Administrator access required');
  await env.DB.prepare(`UPDATE admin_users SET active=? WHERE id=?`).bind(body.active?1:0,body.id).run();
  await audit(env,user,body.active?'enable_user':'disable_user',body.id);
  return {ok:true};
}
async function adminAction(env,user,body) {
  if(body.action==='adminData') return adminData(env,user);
  if(body.action==='adminUsers') return adminUsers(env,user);
  if(body.action==='createUser') return createUser(env,user,body);
  if(body.action==='setUserStatus') return setUserStatus(env,user,body);
  if(body.action==='audit') {
    const r=await env.DB.prepare(`SELECT username,action,target_id,created_at FROM admin_audit ORDER BY created_at DESC LIMIT 200`).all();
    return {rows:r.results||[]};
  }
  if(user.role==='viewer' && ['saveGroup','saveMember','deleteGroup','deleteMember'].includes(body.action)) throw new Error('Viewer access is read-only');
  if(body.action==='saveGroup') { await saveGroup(env,body.group); await audit(env,user,'edit_group',body.group.id); return {ok:true}; }
  if(body.action==='saveMember') { await saveMember(env,body.member); await audit(env,user,'edit_member',body.member.id); return {ok:true}; }
  if(body.action==='deleteGroup') { await env.DB.prepare(`DELETE FROM groups WHERE id=?`).bind(body.id).run(); await audit(env,user,'delete_group',body.id); return {ok:true}; }
  if(body.action==='deleteMember') { await env.DB.prepare(`DELETE FROM members WHERE id=?`).bind(body.id).run(); await audit(env,user,'delete_member',body.id); return {ok:true}; }
  throw new Error('Unknown admin action');
}

/*
Integration point inside the existing Worker fetch():
1. Before processing admin actions, handle:
   if (body.action === 'adminLogin') return json(await adminLogin(env,body));
2. For all actions beginning with admin, plus save/delete actions made from
   the admin dashboard, authenticate using authenticateAdmin().
3. Do NOT put PRIMARY_ADMIN_PASSWORD in public JavaScript.
*/
