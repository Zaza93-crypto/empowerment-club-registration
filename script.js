const API='https://empowerment-api.mikotembo129.workers.dev/api/data';
let data={groups:[],members:[]};
let adminToken=sessionStorage.getItem('emp_admin_token')||'';
let currentUser=null;
let bulkPendingRows=[];

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const api=async(body=null)=>{
  const opts=body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{};
  const r=await fetch(API,opts);
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.error||`Request failed (${r.status})`);
  return j;
};

function showRegistryLogin(message=''){
  const gate=document.getElementById('authGate');
  const error=document.getElementById('authError');
  if(gate)gate.classList.remove('hidden');
  if(error)error.textContent=message;
}
function hideRegistryLogin(){
  const gate=document.getElementById('authGate');
  if(gate)gate.classList.add('hidden');
}
async function registryLogin(e){
  e.preventDefault();
  const error=document.getElementById('authError');
  error.textContent='';
  try{
    const body={action:'adminLogin',username:document.getElementById('registryUsername').value.trim(),password:document.getElementById('registryPassword').value};
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Login failed');
    adminToken=j.token||'';
    currentUser=j.user||null;
    sessionStorage.setItem('emp_admin_token',adminToken);
    sessionStorage.setItem('emp_admin_user',JSON.stringify(currentUser||{}));
    hideRegistryLogin();
    await document.getElementById('registryLoginForm')?.addEventListener('submit',registryLogin);
try{currentUser=JSON.parse(sessionStorage.getItem('emp_admin_user')||'null')}catch{}
if(adminToken){hideRegistryLogin();loadData()}else{showRegistryLogin('')}

    toast(`Signed in as ${currentUser?.name||currentUser?.username||'Administrator'}`);
  }catch(err){
    error.textContent=err.message||'Login failed';
  }
}
function logoutRegistry(){
  sessionStorage.removeItem('emp_admin_token');
  sessionStorage.removeItem('emp_admin_user');
  adminToken='';
  currentUser=null;
  showRegistryLogin('You have been signed out.');
}

async function loadData(){
  try{
    const j=await api();
    data={groups:j.groups||[],members:j.members||[]};
    updateDashboard();renderGroups();renderMembers();renderReports();
  }catch(err){
    console.error(err);
    toast('Database connection failed: '+err.message);
  }
}
async function saveRemote(action,payload){
  try{
    if(!adminToken){showRegistryLogin('Please sign in before entering or changing data.');return false}
    const opts={method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${adminToken}`},body:JSON.stringify({action,...payload})};
    const r=await fetch(API,opts);
    const j=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error||`Request failed (${r.status})`);

    await loadData();
    return true;
  }catch(err){
    console.error(err);
    toast(err.message||'Could not save data');
    return false;
  }
}
function toggleNav(){document.getElementById('nav').classList.toggle('open')}
function showPage(id,btn){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('nav').classList.remove('open');
  if(id==='groups')renderGroups();
  if(id==='members')renderMembers();
  if(id==='reports')renderReports();
}
function openModal(html){document.getElementById('modalContent').innerHTML=html;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
function toast(msg){let t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',2800)}

function openGroupForm(id=null){
  let g=data.groups.find(x=>x.id===id)||{};
  openModal(`<h2>${id?'Edit':'Register'} Group</h2><form onsubmit="saveGroup(event,'${id||''}')"><div class="form-grid">
  <div class="field"><label>Group Specific Identity Number *</label><input id="gidnumber" required value="${esc(g.groupNumber)}" placeholder="e.g. GRP-001"><small class="hint">Assign a unique identity number specifically to this group. Example: GRP-001.</small></div>
  <div class="field"><label>Club Registration Number</label><input id="gclubreg" value="${esc(g.clubRegistrationNumber||g.clubRegNumber)}" placeholder="e.g. CBO/CLUB/001"></div>
  <div class="field"><label>Group Name *</label><input id="gname" required value="${esc(g.name)}"></div>
  <div class="field"><label>Group Category *</label><select id="gcat" required><option value="">Select</option>${['Women','Youth','Men','Mixed','Cooperative','Other'].map(x=>`<option ${g.category===x?'selected':''}>${x}</option>`).join('')}</select></div>
  <div class="field"><label>Area/Ward *</label><input id="garea" required value="${esc(g.area)}"></div>
  <div class="field"><label>Registration Date</label><input id="gdate" type="date" value="${g.date||new Date().toISOString().slice(0,10)}"></div>
  <div class="field"><label>Contact Person</label><input id="gcontact" value="${esc(g.contact)}"></div>
  <div class="field"><label>Phone Number</label><input id="gphone" value="${esc(g.phone)}"></div>
  <div class="field"><label>Empowerment Type</label><input id="getype" value="${esc(g.empowermentType)}" placeholder="Grant, loan, equipment..."></div>
  <div class="field"><label>Amount Received (K)</label><input id="gamount" type="number" min="0" step="0.01" value="${g.amount||''}"></div>
  <div class="field full"><label>Main Activity/Business</label><input id="gactivity" value="${esc(g.activity)}" placeholder="e.g. Poultry, tailoring, farming"></div>
  <div class="field full"><label>Purpose/Notes</label><input id="gnote" value="${esc(g.note)}"></div>
  </div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Save Group</button></div></form>`)
}
async function saveGroup(e,id){
  e.preventDefault();
  let obj={id:id||crypto.randomUUID(),groupNumber:gidnumber.value.trim(),clubRegistrationNumber:gclubreg.value.trim(),name:gname.value.trim(),category:gcat.value,area:garea.value.trim(),date:gdate.value,contact:gcontact.value.trim(),phone:gphone.value.trim(),empowermentType:getype.value.trim(),amount:Number(gamount.value||0),activity:gactivity.value.trim(),note:gnote.value.trim()};
  if(await saveRemote('saveGroup',{group:obj})){closeModal();toast('Group saved successfully')}
}

function openMemberForm(id=null){
  let m=data.members.find(x=>x.id===id)||{};
  openModal(`<h2>${id?'Edit':'Register'} Member</h2><form onsubmit="saveMember(event,'${id||''}')"><div class="form-grid">
  <div class="field full"><label>Specific Identity Number *</label><input id="midentity" required value="${esc(m.identityNumber)}" placeholder="e.g. LUN-001"><small class="hint">Enter the identity number manually. It must be unique.</small></div>
  <div class="field full"><label>Group *</label><select id="mgroup" required><option value="">Select group</option>${data.groups.map(g=>`<option value="${g.id}" ${m.groupId===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div>
  <div class="field"><label>Full Name *</label><input id="mname" required value="${esc(m.name)}"></div>
  <div class="field"><label>NRC/ID Number</label><input id="mnrc" value="${esc(m.nrc)}"></div>
  <div class="field"><label>Gender *</label><select id="mgender" required><option value="">Select</option><option ${m.gender==='Male'?'selected':''}>Male</option><option ${m.gender==='Female'?'selected':''}>Female</option></select></div>
  <div class="field"><label>Age</label><input id="mage" type="number" min="1" max="120" value="${m.age||''}"></div>
  <div class="field"><label>Phone</label><input id="mphone" value="${esc(m.phone)}"></div>
  <div class="field"><label>Position</label><select id="mposition"><option>Member</option><option ${m.position==='Chairperson'?'selected':''}>Chairperson</option><option ${m.position==='Secretary'?'selected':''}>Secretary</option><option ${m.position==='Treasurer'?'selected':''}>Treasurer</option><option ${m.position==='Other'?'selected':''}>Other</option></select></div>
  </div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Save Member</button></div></form>`)
}
async function saveMember(e,id){
  e.preventDefault();
  if(!data.groups.length){toast('Register a group first');return}
  const identity=midentity.value.trim();
  if(!identity){toast('Identity Number is required');midentity.focus();return}
  const duplicate=data.members.some(m=>m.identityNumber&&m.identityNumber.toLowerCase()===identity.toLowerCase()&&m.id!==id);
  if(duplicate){toast('This Identity Number is already assigned');midentity.focus();return}
  const obj={id:id||crypto.randomUUID(),identityNumber:identity,groupId:mgroup.value,name:mname.value.trim(),nrc:mnrc.value.trim(),gender:mgender.value,age:mage.value,phone:mphone.value.trim(),position:mposition.value};
  if(await saveRemote('saveMember',{member:obj})){closeModal();toast('Member saved successfully')}
}

function renderGroups(){
  let q=(document.getElementById('groupSearch')?.value||'').toLowerCase();
  let rows=data.groups.filter(g=>[g.groupNumber,g.clubRegistrationNumber,g.clubRegNumber,g.name,g.area,g.contact,g.category].join(' ').toLowerCase().includes(q));
  document.getElementById('groupTable').innerHTML=rows.length?rows.map(g=>`<tr><td><b>${esc(g.groupNumber||'—')}</b><br>${esc(g.name)}${g.clubRegistrationNumber||g.clubRegNumber?`<br><small>Club Reg: ${esc(g.clubRegistrationNumber||g.clubRegNumber)}</small>`:''}</td><td>${esc(g.category)}</td><td>${esc(g.area)}</td><td>${esc(g.contact)}<br>${esc(g.phone)}</td><td>${data.members.filter(m=>m.groupId===g.id).length}</td><td><button class="action" onclick="openGroupForm('${g.id}')">Edit</button><button class="action danger" onclick="deleteGroup('${g.id}')">Delete</button></td></tr>`).join(''):`<tr><td colspan="6" class="empty">No groups registered.</td></tr>`
}
function renderMembers(){
  let q=(document.getElementById('memberSearch')?.value||'').toLowerCase();
  let rows=data.members.filter(m=>{let g=data.groups.find(x=>x.id===m.groupId);return[m.identityNumber,m.name,m.nrc,g?.name,m.phone].join(' ').toLowerCase().includes(q)});
  document.getElementById('memberTable').innerHTML=rows.length?rows.map(m=>{let g=data.groups.find(x=>x.id===m.groupId);return `<tr><td><b>${esc(m.identityNumber||'')}</b></td><td><b>${esc(m.name)}</b><br>${esc(m.nrc)}</td><td>${esc(g?.name||'Unknown')}</td><td>${esc(m.gender)}</td><td>${esc(m.age)}</td><td>${esc(m.phone)}</td><td>${esc(m.position)}</td><td><button class="action" onclick="openMemberForm('${m.id}')">Edit</button><button class="action danger" onclick="deleteMember('${m.id}')">Delete</button></td></tr>`}).join(''):`<tr><td colspan="8" class="empty">No members registered.</td></tr>`
}
function updateDashboard(){
  totalGroups.textContent=data.groups.length;
  totalMembers.textContent=data.members.length;
  maleMembers.textContent=data.members.filter(x=>x.gender==='Male').length;
  femaleMembers.textContent=data.members.filter(x=>x.gender==='Female').length;
  let recent=[...data.groups].reverse().slice(0,5);
  recentGroups.innerHTML=recent.length?recent.map(g=>`<div style="padding:12px 0;border-bottom:1px solid #eee"><b>${esc(g.name)}</b> — ${esc(g.category)}<br><small>${esc(g.area)} · ${data.members.filter(m=>m.groupId===g.id).length} members</small></div>`).join(''):'<div class="empty">No groups registered yet.</div>'
}
function renderReports(){
  let amount=data.groups.reduce((a,g)=>a+Number(g.amount||0),0);
  reportSummary.innerHTML=`<p><b>Total groups:</b> ${data.groups.length}</p><p><b>Total members:</b> ${data.members.length}</p><p><b>Male:</b> ${data.members.filter(x=>x.gender==='Male').length} &nbsp; <b>Female:</b> ${data.members.filter(x=>x.gender==='Female').length}</p><p><b>Total empowerment recorded:</b> K${amount.toLocaleString()}</p>`
}
async function deleteGroup(id){
  if(!confirm('Delete this group and its members?'))return;
  if(await saveRemote('deleteGroup',{id})){toast('Group deleted')}
}
async function deleteMember(id){
  if(!confirm('Delete this member?'))return;
  if(await saveRemote('deleteMember',{id})){toast('Member deleted')}
}

function normalizeHeader(v){return String(v??'').trim().toLowerCase().replace(/[\s_\-\/]+/g,'').replace(/[^a-z0-9]/g,'')}
function getCell(row,names){const wanted=names.map(normalizeHeader);const key=Object.keys(row).find(k=>wanted.includes(normalizeHeader(k)));return key===undefined?'':row[key]}
function openBulkImport(){
  if(!data.groups.length){toast('Register at least one group first');return}
  openModal(`<h2>Bulk Import Group Members</h2>
  <p class="hint">Prepare an Excel file using the template. Each row is one member. The <b>Group Name</b> must match a registered group.</p>
  <div class="bulk-help"><b>Required:</b> Identity Number, Full Name, Group Name, Gender<br><b>Optional:</b> NRC/ID Number, Age, Phone, Position</div>
  <div class="bulk-actions"><button class="secondary" type="button" onclick="downloadMemberTemplate()">Download Excel Template</button><label class="primary file-label">Choose Excel File<input id="bulkFile" type="file" accept=".xlsx,.xls,.csv" onchange="previewBulkImport(event)"></label></div>
  <div id="bulkPreview"></div>`)
}
function downloadMemberTemplate(){
  if(typeof XLSX==='undefined'){toast('Excel library is not available');return}
  const rows=[
    {'Identity Number':'GRP-001-001','Full Name':'Example Member','Group Name':data.groups[0]?.name||'Existing Group','NRC/ID Number':'123456/78/1','Gender':'Female','Age':30,'Phone':'0970000000','Position':'Member'},
    {'Identity Number':'GRP-001-002','Full Name':'Second Member','Group Name':data.groups[0]?.name||'Existing Group','NRC/ID Number':'','Gender':'Male','Age':35,'Phone':'','Position':'Member'}
  ];
  const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Members');
  XLSX.writeFile(wb,'empowerment-member-import-template.xlsx');toast('Template downloaded')
}
function findGroupByName(name){const q=String(name??'').trim().toLowerCase();return data.groups.find(g=>String(g.name??'').trim().toLowerCase()===q)}
function existingIdentity(identity,ignoreIds=[]){const q=String(identity??'').trim().toLowerCase();return data.members.find(m=>String(m.identityNumber??'').trim().toLowerCase()===q&&!ignoreIds.includes(m.id))}
function existingNRC(nrc){const q=String(nrc??'').trim().toLowerCase();if(!q)return null;return data.members.find(m=>String(m.nrc??'').trim().toLowerCase()===q)}
function normalizeGender(v){const q=String(v??'').trim().toLowerCase();if(q==='m'||q==='male')return 'Male';if(q==='f'||q==='female')return 'Female';return ''}
function normalizePosition(v){const q=String(v??'').trim();return q||'Member'}

function previewBulkImport(event){
  const file=event.target.files?.[0];if(!file)return;
  const box=document.getElementById('bulkPreview');box.innerHTML='<div class="bulk-loading">Reading Excel file...</div>';
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      if(typeof XLSX==='undefined')throw new Error('Excel library is not available. Check your internet connection.');
      const wb=XLSX.read(e.target.result,{type:'array'});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
      if(!rows.length){box.innerHTML='<div class="import-error">No data rows were found in the first worksheet.</div>';return}
      const seenIdentity=new Set();const valid=[];const errors=[];const warnings=[];
      rows.forEach((row,i)=>{
        const excelRow=i+2;
        const identity=String(getCell(row,['Identity Number','Identity No','IdentityNumber'])).trim();
        const name=String(getCell(row,['Full Name','Name','Member Name'])).trim();
        const groupName=String(getCell(row,['Group Name','Group'])).trim();
        const nrc=String(getCell(row,['NRC/ID Number','NRC','NRC Number','ID Number'])).trim();
        const gender=normalizeGender(getCell(row,['Gender','Sex']));
        const age=String(getCell(row,['Age'])).trim();
        const phone=String(getCell(row,['Phone','Phone Number','Mobile'])).trim();
        const position=normalizePosition(getCell(row,['Position','Role']));
        const rowErrors=[];
        if(!identity)rowErrors.push('Identity Number missing');
        if(!name)rowErrors.push('Full Name missing');
        if(!groupName)rowErrors.push('Group Name missing');
        if(!gender)rowErrors.push('Gender must be Male/Female');
        const group=findGroupByName(groupName);if(groupName&&!group)rowErrors.push('Group not found');
        const idKey=identity.toLowerCase();
        if(identity&&seenIdentity.has(idKey))rowErrors.push('Duplicate Identity Number in this Excel file');
        if(identity&&existingIdentity(identity))rowErrors.push('Identity Number already registered');
        if(identity)seenIdentity.add(idKey);
        if(nrc){const old=existingNRC(nrc);if(old){const oldGroup=data.groups.find(g=>g.id===old.groupId);if(oldGroup&&group&&old.groupId!==group.id)warnings.push({row:excelRow,type:'NRC',message:`NRC ${nrc} is already registered under ${oldGroup.name}`});else rowErrors.push('NRC/ID Number already registered');}}
        if(age&&(isNaN(Number(age))||Number(age)<1||Number(age)>120))rowErrors.push('Invalid age');
        const item={excelRow,identityNumber:identity,name,groupId:group?.id||'',groupName,nrc,gender,age,phone,position,errors:rowErrors};
        if(rowErrors.length)errors.push(item);else valid.push(item);
      });
      bulkPendingRows=valid;
      const warningRows=warnings.map(w=>`<li>Row ${w.row}: ${esc(w.message)}</li>`).join('');
      const previewRows=[...valid,...errors].slice(0,100).map(x=>`<tr><td>${x.excelRow}</td><td>${esc(x.identityNumber)}</td><td>${esc(x.name)}</td><td>${esc(x.groupName)}</td><td>${esc(x.gender)}</td><td>${x.errors.length?`<span class="status-bad">${esc(x.errors.join('; '))}</span>`:'<span class="status-ok">Ready</span>'}</td></tr>`).join('');
      box.innerHTML=`<div class="import-summary"><b>${rows.length}</b> rows found · <b>${valid.length}</b> ready to import · <b>${errors.length}</b> with errors${warnings.length?` · <b>${warnings.length}</b> NRC warnings`:''}</div>
      ${warnings.length?`<div class="import-warning"><b>Cross-group NRC warning:</b><ul>${warningRows}</ul><p>These rows can still be imported. Review them before continuing.</p></div>`:''}
      <div class="table-wrap"><table class="preview-table"><thead><tr><th>Excel Row</th><th>Identity</th><th>Name</th><th>Group</th><th>Gender</th><th>Status</th></tr></thead><tbody>${previewRows||'<tr><td colspan="6" class="empty">No rows to preview.</td></tr>'}</tbody></table></div>
      <div class="form-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" ${valid.length?'':'disabled'} onclick="commitBulkImport(bulkPendingRows)">Import ${valid.length} Valid Member${valid.length===1?'':'s'}</button></div>`;
    }catch(err){console.error(err);box.innerHTML=`<div class="import-error">Could not read the Excel file: ${esc(err.message||String(err))}</div>`}
  };
  reader.readAsArrayBuffer(file)
}
async function commitBulkImport(rows){
  if(!Array.isArray(rows)||!rows.length)return;
  try{
    const result=await api({action:'bulkMembers',members:rows.map(r=>({id:crypto.randomUUID(),identityNumber:r.identityNumber,groupId:r.groupId,name:r.name,nrc:r.nrc,gender:r.gender,age:r.age,phone:r.phone,position:r.position}))});
    await loadData();closeModal();toast(`${result.added||0} member${result.added===1?'':'s'} imported${result.skipped?`; ${result.skipped} skipped`:''}`)
  }catch(err){console.error(err);toast(err.message||'Bulk import failed')}
}

function csvEscape(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function download(content,name,type='text/csv'){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function exportCSV(type){
  let rows=type==='groups'?data.groups.map(g=>({GroupID:g.groupNumber||'',ClubRegistrationNumber:g.clubRegistrationNumber||g.clubRegNumber||'',Group:g.name,Category:g.category,Area:g.area,Date:g.date,Contact:g.contact,Phone:g.phone,EmpowermentType:g.empowermentType,Amount:g.amount,Activity:g.activity})) : data.members.map(m=>({IdentityNumber:m.identityNumber||'',Name:m.name,NRC:m.nrc,Group:data.groups.find(g=>g.id===m.groupId)?.name||'',Gender:m.gender,Age:m.age,Phone:m.phone,Position:m.position}));
  let keys=Object.keys(rows[0]||{Data:''});let csv=[keys.join(','),...rows.map(r=>keys.map(k=>csvEscape(r[k])).join(','))].join('\n');download(csv,`${type}-registry.csv`);toast('CSV exported')
}
async function backupData(){download(JSON.stringify(data,null,2),'empowerment-registry-backup.json','application/json');toast('Backup created')}
async function restoreData(e){
  let f=e.target.files[0];if(!f)return;
  let r=new FileReader();
  r.onload=async()=>{
    try{
      let x=JSON.parse(r.result);if(!x.groups||!x.members)throw new Error('Invalid backup file');
      if(!confirm('Restore this backup to the central database? Existing registry records will be replaced.'))return;
      const ok=await saveRemote('restoreData',{data:x});
      if(ok)toast('Backup restored');
    }catch(err){alert(err.message||'Invalid backup file')}
  };
  r.readAsText(f)
}

loadData();
