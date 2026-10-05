
const AUTH_KEY='empowermentRegistryLoggedIn';
const LOGIN_USERNAME='admin';
const LOGIN_PASSWORD='Admin@123';

function login(e){
  e.preventDefault();
  const u=document.getElementById('loginUsername').value.trim();
  const p=document.getElementById('loginPassword').value;
  const err=document.getElementById('loginError');
  if(u===LOGIN_USERNAME && p===LOGIN_PASSWORD){
    localStorage.setItem(AUTH_KEY,'true');
    localStorage.setItem('empowermentLoggedIn','true');
    document.getElementById('loginScreen').classList.add('hidden');
    err.classList.remove('show');
    toast('Login successful');
  }else{
    err.classList.add('show');
    document.getElementById('loginPassword').value='';
    document.getElementById('loginPassword').focus();
  }
}
function logout(){
  sessionStorage.removeItem('empowermentAdminToken');
  sessionStorage.removeItem('empowermentAdminUser');
  localStorage.removeItem('empowermentLoggedIn');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('empowermentRegistryLoggedIn');
  window.location.replace('login.html');
}
function checkLogin(){
  const loginScreen=document.getElementById('loginScreen');
  if(!loginScreen) return;
  const loggedIn=!!(sessionStorage.getItem('empowermentAdminToken') ||
                    localStorage.getItem('empowermentAdminToken'));
  loginScreen.classList.toggle('hidden',loggedIn);
}

const KEY='empowermentRegistryV1';
let data=JSON.parse(localStorage.getItem(KEY)||'null')||{groups:[],members:[]};
const save=()=>{localStorage.setItem(KEY,JSON.stringify(data));updateDashboard();renderGroups();renderMembers();renderReports()};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function toggleNav(){document.getElementById('nav').classList.toggle('open')}
function showPage(id,btn){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');document.getElementById('nav').classList.remove('open');if(id==='groups')renderGroups();if(id==='members')renderMembers();if(id==='reports')renderReports()}
function openModal(html){document.getElementById('modalContent').innerHTML=html;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
function toast(msg){let t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',2200)}
function openGroupForm(id=null){let g=data.groups.find(x=>x.id===id)||{};openModal(`<h2>${id?'Edit':'Register'} Group</h2><form onsubmit="saveGroup(event,'${id||''}')"><div class="form-grid">
<div class="field"><label>Group Name *</label><input id="gname" required value="${esc(g.name)}"></div>
<div class="field"><label>Group Category *</label><select id="gcat" required><option value="">Select</option>${['Women','Youth','Men','Mixed','Cooperative','Other'].map(x=>`<option ${g.category===x?'selected':''}>${x}</option>`).join('')}</select></div>
<div class="field"><label>Area/Ward *</label><input id="garea" required value="${esc(g.area)}"></div>
<div class="field"><label>Registration Date</label><input id="gdate" type="date" value="${g.date||new Date().toISOString().slice(0,10)}"></div>
<div class="field"><label>Contact Person *</label><input id="gcontact" required value="${esc(g.contact)}"></div>
<div class="field"><label>Phone Number *</label><input id="gphone" required value="${esc(g.phone)}"></div>
<div class="field"><label>Empowerment Type</label><input id="getype" value="${esc(g.empowermentType)}" placeholder="Grant, loan, equipment..."></div>
<div class="field"><label>Amount Received (K)</label><input id="gamount" type="number" min="0" step="0.01" value="${g.amount||''}"></div>
<div class="field full"><label>Main Activity/Business</label><input id="gactivity" value="${esc(g.activity)}" placeholder="e.g. Poultry, tailoring, farming"></div>
<div class="field full"><label>Purpose/Notes</label><input id="gnote" value="${esc(g.note)}"></div>
</div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Save Group</button></div></form>`)}
function saveGroup(e,id){e.preventDefault();let obj={id:id||Date.now().toString(),name:gname.value.trim(),category:gcat.value,area:garea.value.trim(),date:gdate.value,contact:gcontact.value.trim(),phone:gphone.value.trim(),empowermentType:getype.value.trim(),amount:Number(gamount.value||0),activity:gactivity.value.trim(),note:gnote.value.trim()};if(id){let i=data.groups.findIndex(x=>x.id===id);data.groups[i]=obj}else data.groups.push(obj);save();closeModal();toast('Group saved successfully')}
function openMemberForm(id=null){let m=data.members.find(x=>x.id===id)||{};openModal(`<h2>${id?'Edit':'Register'} Member</h2><form onsubmit="saveMember(event,'${id||''}')"><div class="form-grid">
<div class="field full"><label>Group *</label><select id="mgroup" required><option value="">Select group</option>${data.groups.map(g=>`<option value="${g.id}" ${m.groupId===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div>
<div class="field"><label>Full Name *</label><input id="mname" required value="${esc(m.name)}"></div>
<div class="field"><label>NRC/ID Number</label><input id="mnrc" value="${esc(m.nrc)}" oninput="checkNRCField('${id||''}')"><div id="nrcWarning" class="nrc-warning"></div></div>
<div class="field"><label>Gender *</label><select id="mgender" required><option value="">Select</option><option ${m.gender==='Male'?'selected':''}>Male</option><option ${m.gender==='Female'?'selected':''}>Female</option></select></div>
<div class="field"><label>Age</label><input id="mage" type="number" min="1" max="120" value="${m.age||''}"></div>
<div class="field"><label>Phone</label><input id="mphone" value="${esc(m.phone)}"></div>
<div class="field"><label>Position</label><select id="mposition"><option>Member</option><option ${m.position==='Chairperson'?'selected':''}>Chairperson</option><option ${m.position==='Secretary'?'selected':''}>Secretary</option><option ${m.position==='Treasurer'?'selected':''}>Treasurer</option><option ${m.position==='Other'?'selected':''}>Other</option></select></div>
</div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Save Member</button></div></form>`)}
function normalizeNRC(n){return String(n||'').toUpperCase().replace(/\\s+/g,'').replace(/[-]/g,'/')}
function getNRCMatches(nrc,excludeId=''){let key=normalizeNRC(nrc);if(!key)return[];return data.members.filter(m=>m.id!==excludeId&&normalizeNRC(m.nrc)===key)}
function getGroupName(groupId){return data.groups.find(g=>g.id===groupId)?.name||'Unknown group'}
function checkNRCField(id=''){let el=document.getElementById('nrcWarning');if(!el)return;let nrc=document.getElementById('mnrc')?.value||'';let matches=getNRCMatches(nrc,id);if(matches.length){el.innerHTML=`⚠️ This NRC is already registered: ${matches.map(m=>`<b>${esc(m.name)}</b> (${esc(getGroupName(m.groupId))})`).join(', ')}`;el.className='nrc-warning show'}else{el.textContent='';el.className='nrc-warning'}}
function saveMember(e,id){e.preventDefault();if(!data.groups.length){toast('Register a group first');return}let nrc=mnrc.value.trim();let matches=getNRCMatches(nrc,id);if(nrc&&matches.length){let details=matches.map(m=>`${m.name} — ${getGroupName(m.groupId)}`).join('\\n');if(!confirm(`⚠️ DUPLICATE NRC DETECTED\\n\\nThis NRC is already registered in another group:\\n\\n${details}\\n\\nSave this member in the new group anyway?`))return}let obj={id:id||Date.now().toString(),groupId:mgroup.value,name:mname.value.trim(),nrc:nrc,gender:mgender.value,age:mage.value,phone:mphone.value.trim(),position:mposition.value};if(id){let i=data.members.findIndex(x=>x.id===id);data.members[i]=obj}else data.members.push(obj);save();closeModal();toast(matches.length?'Member saved — duplicate NRC flagged':'Member saved successfully')}
function renderGroups(){let q=(document.getElementById('groupSearch')?.value||'').toLowerCase();let rows=data.groups.filter(g=>[g.name,g.area,g.contact,g.category].join(' ').toLowerCase().includes(q));document.getElementById('groupTable').innerHTML=rows.length?rows.map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${esc(g.category)}</td><td>${esc(g.area)}</td><td>${esc(g.contact)}<br>${esc(g.phone)}</td><td>${data.members.filter(m=>m.groupId===g.id).length}</td><td><button class="action" onclick="openGroupForm('${g.id}')">Edit</button><button class="action danger" onclick="deleteGroup('${g.id}')">Delete</button></td></tr>`).join(''):`<tr><td colspan="6" class="empty">No groups registered.</td></tr>`}
function renderMembers(){let q=(document.getElementById('memberSearch')?.value||'').toLowerCase();let rows=data.members.filter(m=>{let g=data.groups.find(x=>x.id===m.groupId);return[m.name,m.nrc,g?.name,m.phone].join(' ').toLowerCase().includes(q)});document.getElementById('memberTable').innerHTML=rows.length?rows.map(m=>{let g=data.groups.find(x=>x.id===m.groupId);let duplicates=getNRCMatches(m.nrc,m.id);let duplicateGroups=[...new Set(duplicates.map(x=>getGroupName(x.groupId)))];let flagged=duplicates.length>0;return `<tr class="${flagged?'duplicate-row':''}"><td><b>${esc(m.name)}</b><br>${esc(m.nrc)}${flagged?`<span class="duplicate-badge">⚠ DUPLICATE NRC</span><div class="duplicate-note">Also registered in: ${esc(duplicateGroups.join(', '))}</div>`:''}</td><td>${esc(g?.name||'Unknown')}</td><td>${esc(m.gender)}</td><td>${esc(m.age)}</td><td>${esc(m.phone)}</td><td>${esc(m.position)}</td><td><button class="action" onclick="openMemberForm('${m.id}')">Edit</button><button class="action danger" onclick="deleteMember('${m.id}')">Delete</button></td></tr>`}).join(''):`<tr><td colspan="7" class="empty">No members registered.</td></tr>`}
function updateDashboard(){totalGroups.textContent=data.groups.length;totalMembers.textContent=data.members.length;maleMembers.textContent=data.members.filter(x=>x.gender==='Male').length;femaleMembers.textContent=data.members.filter(x=>x.gender==='Female').length;let recent=[...data.groups].reverse().slice(0,5);recentGroups.innerHTML=recent.length?recent.map(g=>`<div style="padding:12px 0;border-bottom:1px solid #eee"><b>${esc(g.name)}</b> — ${esc(g.category)}<br><small>${esc(g.area)} · ${data.members.filter(m=>m.groupId===g.id).length} members</small></div>`).join(''):'<div class="empty">No groups registered yet.</div>'}
function renderReports(){let amount=data.groups.reduce((a,g)=>a+Number(g.amount||0),0);reportSummary.innerHTML=`<p><b>Total groups:</b> ${data.groups.length}</p><p><b>Total members:</b> ${data.members.length}</p><p><b>Male:</b> ${data.members.filter(x=>x.gender==='Male').length} &nbsp; <b>Female:</b> ${data.members.filter(x=>x.gender==='Female').length}</p><p><b>Total empowerment recorded:</b> K${amount.toLocaleString()}</p>`}
function deleteGroup(id){if(!confirm('Delete this group and its members?'))return;data.groups=data.groups.filter(x=>x.id!==id);data.members=data.members.filter(x=>x.groupId!==id);save();toast('Group deleted')}
function deleteMember(id){if(!confirm('Delete this member?'))return;data.members=data.members.filter(x=>x.id!==id);save();toast('Member deleted')}
function csvEscape(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function download(content,name,type='text/csv'){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click()}
function exportCSV(type){let rows=type==='groups'?data.groups.map(g=>({Group:g.name,Category:g.category,Area:g.area,Date:g.date,Contact:g.contact,Phone:g.phone,EmpowermentType:g.empowermentType,Amount:g.amount,Activity:g.activity})) : data.members.map(m=>({Name:m.name,NRC:m.nrc,Group:data.groups.find(g=>g.id===m.groupId)?.name||'',Gender:m.gender,Age:m.age,Phone:m.phone,Position:m.position}));let keys=Object.keys(rows[0]||{Data:''});let csv=[keys.join(','),...rows.map(r=>keys.map(k=>csvEscape(r[k])).join(','))].join('\n');download(csv,`${type}-registry.csv`);toast('CSV exported')}
function backupData(){download(JSON.stringify(data,null,2),'empowerment-registry-backup.json','application/json');toast('Backup created')}
function restoreData(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!x.groups||!x.members)throw 0;data=x;save();toast('Backup restored')}catch{alert('Invalid backup file')}};r.readAsText(f)}
checkLogin();updateDashboard();renderReports();