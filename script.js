const KEY='empowermentRegistryV1';
let data=JSON.parse(localStorage.getItem(KEY)||'null')||{groups:[],members:[]};
data.members=(data.members||[]).map(m=>({...m,identityNumber:m.identityNumber||''}));
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
<div class="field full"><label>Specific Identity Number *</label><input id="midentity" required value="${esc(m.identityNumber)}" placeholder="e.g. LUN-001"><small class="hint">Enter the identity number manually. It must be unique.</small></div>
<div class="field full"><label>Group *</label><select id="mgroup" required><option value="">Select group</option>${data.groups.map(g=>`<option value="${g.id}" ${m.groupId===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div>
<div class="field"><label>Full Name *</label><input id="mname" required value="${esc(m.name)}"></div>
<div class="field"><label>NRC/ID Number</label><input id="mnrc" value="${esc(m.nrc)}"></div>
<div class="field"><label>Gender *</label><select id="mgender" required><option value="">Select</option><option ${m.gender==='Male'?'selected':''}>Male</option><option ${m.gender==='Female'?'selected':''}>Female</option></select></div>
<div class="field"><label>Age</label><input id="mage" type="number" min="1" max="120" value="${m.age||''}"></div>
<div class="field"><label>Phone</label><input id="mphone" value="${esc(m.phone)}"></div>
<div class="field"><label>Position</label><select id="mposition"><option>Member</option><option ${m.position==='Chairperson'?'selected':''}>Chairperson</option><option ${m.position==='Secretary'?'selected':''}>Secretary</option><option ${m.position==='Treasurer'?'selected':''}>Treasurer</option><option ${m.position==='Other'?'selected':''}>Other</option></select></div>
</div><div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary">Save Member</button></div></form>`)}

function saveMember(e,id){e.preventDefault();if(!data.groups.length){toast('Register a group first');return}const identity=midentity.value.trim();if(!identity){toast('Identity Number is required');midentity.focus();return}const duplicate=data.members.some(m=>m.identityNumber&&m.identityNumber.toLowerCase()===identity.toLowerCase()&&m.id!==id);if(duplicate){toast('This Identity Number is already assigned');midentity.focus();return}let obj={id:id||Date.now().toString(),identityNumber:identity,groupId:mgroup.value,name:mname.value.trim(),nrc:mnrc.value.trim(),gender:mgender.value,age:mage.value,phone:mphone.value.trim(),position:mposition.value};if(id){let i=data.members.findIndex(x=>x.id===id);data.members[i]=obj}else data.members.push(obj);save();closeModal();toast('Member saved successfully')}
function renderGroups(){let q=(document.getElementById('groupSearch')?.value||'').toLowerCase();let rows=data.groups.filter(g=>[g.name,g.area,g.contact,g.category].join(' ').toLowerCase().includes(q));document.getElementById('groupTable').innerHTML=rows.length?rows.map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${esc(g.category)}</td><td>${esc(g.area)}</td><td>${esc(g.contact)}<br>${esc(g.phone)}</td><td>${data.members.filter(m=>m.groupId===g.id).length}</td><td><button class="action" onclick="openGroupForm('${g.id}')">Edit</button><button class="action danger" onclick="deleteGroup('${g.id}')">Delete</button></td></tr>`).join(''):`<tr><td colspan="6" class="empty">No groups registered.</td></tr>`}
function renderMembers(){let q=(document.getElementById('memberSearch')?.value||'').toLowerCase();let rows=data.members.filter(m=>{let g=data.groups.find(x=>x.id===m.groupId);return[m.identityNumber,m.name,m.nrc,g?.name,m.phone].join(' ').toLowerCase().includes(q)});document.getElementById('memberTable').innerHTML=rows.length?rows.map(m=>{let g=data.groups.find(x=>x.id===m.groupId);return `<tr><td><b>${esc(m.identityNumber||'')}</b></td><td><b>${esc(m.name)}</b><br>${esc(m.nrc)}</td><td>${esc(g?.name||'Unknown')}</td><td>${esc(m.gender)}</td><td>${esc(m.age)}</td><td>${esc(m.phone)}</td><td>${esc(m.position)}</td><td><button class="action" onclick="openMemberForm('${m.id}')">Edit</button><button class="action danger" onclick="deleteMember('${m.id}')">Delete</button></td></tr>`}).join(''):`<tr><td colspan="8" class="empty">No members registered.</td></tr>`}
function updateDashboard(){totalGroups.textContent=data.groups.length;totalMembers.textContent=data.members.length;maleMembers.textContent=data.members.filter(x=>x.gender==='Male').length;femaleMembers.textContent=data.members.filter(x=>x.gender==='Female').length;let recent=[...data.groups].reverse().slice(0,5);recentGroups.innerHTML=recent.length?recent.map(g=>`<div style="padding:12px 0;border-bottom:1px solid #eee"><b>${esc(g.name)}</b> — ${esc(g.category)}<br><small>${esc(g.area)} · ${data.members.filter(m=>m.groupId===g.id).length} members</small></div>`).join(''):'<div class="empty">No groups registered yet.</div>'}
function renderReports(){let amount=data.groups.reduce((a,g)=>a+Number(g.amount||0),0);reportSummary.innerHTML=`<p><b>Total groups:</b> ${data.groups.length}</p><p><b>Total members:</b> ${data.members.length}</p><p><b>Male:</b> ${data.members.filter(x=>x.gender==='Male').length} &nbsp; <b>Female:</b> ${data.members.filter(x=>x.gender==='Female').length}</p><p><b>Total empowerment recorded:</b> K${amount.toLocaleString()}</p>`}
function deleteGroup(id){if(!confirm('Delete this group and its members?'))return;data.groups=data.groups.filter(x=>x.id!==id);data.members=data.members.filter(x=>x.groupId!==id);save();toast('Group deleted')}
function deleteMember(id){if(!confirm('Delete this member?'))return;data.members=data.members.filter(x=>x.id!==id);save();toast('Member deleted')}
function csvEscape(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function download(content,name,type='text/csv'){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click()}
function exportCSV(type){let rows=type==='groups'?data.groups.map(g=>({Group:g.name,Category:g.category,Area:g.area,Date:g.date,Contact:g.contact,Phone:g.phone,EmpowermentType:g.empowermentType,Amount:g.amount,Activity:g.activity})) : data.members.map(m=>({IdentityNumber:m.identityNumber||'',Name:m.name,NRC:m.nrc,Group:data.groups.find(g=>g.id===m.groupId)?.name||'',Gender:m.gender,Age:m.age,Phone:m.phone,Position:m.position}));let keys=Object.keys(rows[0]||{Data:''});let csv=[keys.join(','),...rows.map(r=>keys.map(k=>csvEscape(r[k])).join(','))].join('\n');download(csv,`${type}-registry.csv`);toast('CSV exported')}
function backupData(){download(JSON.stringify(data,null,2),'empowerment-registry-backup.json','application/json');toast('Backup created')}
function restoreData(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!x.groups||!x.members)throw 0;data=x;save();toast('Backup restored')}catch{alert('Invalid backup file')}};r.readAsText(f)}

function openBulkMemberForm(){
  if(!data.groups.length){toast('Register a group first');return}
  const rows=Array.from({length:5},(_,i)=>bulkMemberRow(i,{})).join('');
  openModal(`<h2>Bulk Member Entry</h2>
  <div class="bulk-help"><b>Enter multiple members at once.</b> Each row is one member. Identity Number must be unique. NRC is also checked for duplicates. You can add more rows before saving.</div>
  <div class="bulk-table-wrap"><table class="bulk-table"><thead><tr>
  <th>Identity No. *</th><th>Group *</th><th>Full Name *</th><th>NRC/ID</th><th>Gender *</th><th>Age</th><th>Phone</th><th>Position</th><th>Status</th>
  </tr></thead><tbody id="bulkMemberBody">${rows}</tbody></table></div>
  <div class="form-actions"><button type="button" class="secondary" onclick="addBulkRows(5)">+ 5 Rows</button><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button class="primary" type="button" onclick="saveBulkMembers()">Save All Members</button></div>`);
}
function bulkMemberRow(i,m){
  const groupOptions=data.groups.map(g=>`<option value="${g.id}" ${m.groupId===g.id?'selected':''}>${esc(g.name)}</option>`).join('');
  return `<tr data-row="${i}">
    <td><input class="bi" value="${esc(m.identityNumber||'')}" placeholder="LUN-001"></td>
    <td><select class="bg"><option value="">Select</option>${groupOptions}</select></td>
    <td><input class="bn" value="${esc(m.name||'')}"></td>
    <td><input class="bc" value="${esc(m.nrc||'')}"></td>
    <td><select class="bgen"><option value="">Select</option><option>Male</option><option>Female</option></select></td>
    <td><input class="ba" type="number" min="1" max="120" value="${esc(m.age||'')}"></td>
    <td><input class="bp" value="${esc(m.phone||'')}"></td>
    <td><select class="bpos"><option>Member</option><option>Chairperson</option><option>Secretary</option><option>Treasurer</option><option>Other</option></select></td>
    <td class="bulk-status"></td>
  </tr>`;
}
function addBulkRows(n=5){
  const body=document.getElementById('bulkMemberBody');
  const start=body.querySelectorAll('tr').length;
  for(let i=0;i<n;i++) body.insertAdjacentHTML('beforeend',bulkMemberRow(start+i,{}));
}
function saveBulkMembers(){
  const rows=[...document.querySelectorAll('#bulkMemberBody tr')];
  const newMembers=[], identities=new Set(data.members.map(m=>(m.identityNumber||'').trim().toLowerCase()).filter(Boolean));
  const nrcs=new Set(data.members.map(m=>(m.nrc||'').trim().toLowerCase()).filter(Boolean));
  let errors=0, entered=0;
  rows.forEach(row=>{
    const identity=row.querySelector('.bi').value.trim(), groupId=row.querySelector('.bg').value,
      name=row.querySelector('.bn').value.trim(), nrc=row.querySelector('.bc').value.trim(),
      gender=row.querySelector('.bgen').value, age=row.querySelector('.ba').value,
      phone=row.querySelector('.bp').value.trim(), position=row.querySelector('.bpos').value,
      status=row.querySelector('.bulk-status');
    const blank=[identity,groupId,name,nrc,gender,age,phone].every(x=>!x);
    if(blank){status.textContent='';return}
    entered++;
    let msg='';
    if(!identity||!groupId||!name||!gender) msg='Missing required field';
    const ik=identity.toLowerCase(), nk=nrc.toLowerCase();
    if(!msg && identities.has(ik)) msg='Duplicate Identity No.';
    if(!msg && nrc && nrcs.has(nk)) msg='Duplicate NRC/ID';
    if(!msg && newMembers.some(m=>m.identityNumber.toLowerCase()===ik)) msg='Duplicate Identity in batch';
    if(!msg && nrc && newMembers.some(m=>(m.nrc||'').toLowerCase()===nk)) msg='Duplicate NRC in batch';
    if(msg){status.textContent=msg;status.className='bulk-status error';errors++;return}
    const obj={id:Date.now().toString()+Math.random().toString(36).slice(2),identityNumber:identity,groupId,name,nrc,gender,age,phone,position};
    newMembers.push(obj);identities.add(ik);if(nrc)nrcs.add(nk);
    status.textContent='Ready';status.className='bulk-status ok';
  });
  if(errors){toast(`${errors} row(s) need correction`);return}
  if(!entered){toast('Enter at least one member');return}
  data.members.push(...newMembers);save();closeModal();toast(`${newMembers.length} members saved successfully`);
}
function parseCSVLine(line){
  const out=[];let cur='',quote=false;
  for(let i=0;i<line.length;i++){const ch=line[i];
    if(ch==='"' && line[i+1]==='"'){cur+='"';i++}
    else if(ch==='"') quote=!quote;
    else if(ch===',' && !quote){out.push(cur.trim());cur='';}
    else cur+=ch;
  } out.push(cur.trim()); return out;
}
function importMembersCSV(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      if(!data.groups.length){toast('Register a group first');e.target.value='';return}
      const lines=reader.result.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());
      if(lines.length<2)throw new Error('CSV has no member rows');
      const headers=parseCSVLine(lines[0]).map(x=>x.toLowerCase().replace(/[^a-z0-9]/g,''));
      const idx=(...names)=>names.map(n=>headers.indexOf(n)).find(i=>i>=0);
      const map={identity:idx('identitynumber','identityno','identity'),name:idx('name','fullname'),nrc:idx('nrc','idnumber','nrcid'),group:idx('group','groupname'),gender:idx('gender'),age:idx('age'),phone:idx('phone','phonenumber'),position:idx('position')};
      if(map.identity<0||map.name<0||map.group<0||map.gender<0) throw new Error('Required columns: IdentityNumber, Name, Group, Gender');
      let imported=0, skipped=0, messages=[];
      const existingIds=new Set(data.members.map(m=>(m.identityNumber||'').toLowerCase()));
      const existingNrc=new Set(data.members.map(m=>(m.nrc||'').toLowerCase()).filter(Boolean));
      lines.slice(1).forEach((line,num)=>{
        const v=parseCSVLine(line);const get=k=>map[k]>=0?(v[map[k]]||'').trim():'';
        const identity=get('identity'),name=get('name'),groupName=get('group'),gender=get('gender'),nrc=get('nrc');
        if(!identity&&!name&&!groupName){return}
        const g=data.groups.find(x=>x.name.toLowerCase()===groupName.toLowerCase()||x.id===groupName);
        let reason=!identity||!name||!groupName||!gender?'missing required data':!g?'group not found':existingIds.has(identity.toLowerCase())?'duplicate Identity No.':(nrc&&existingNrc.has(nrc.toLowerCase()))?'duplicate NRC/ID':'';
        if(reason){skipped++;messages.push(`Row ${num+2}: ${reason}`);return}
        data.members.push({id:Date.now().toString()+Math.random().toString(36).slice(2),identityNumber:identity,groupId:g.id,name,nrc,gender,age:get('age'),phone:get('phone'),position:get('position')||'Member'});
        existingIds.add(identity.toLowerCase());if(nrc)existingNrc.add(nrc.toLowerCase());imported++;
      });
      save();
      alert(`Import complete.\nImported: ${imported}\nSkipped: ${skipped}${messages.length?'\n\n'+messages.slice(0,15).join('\n'):''}`);
    }catch(err){alert('Import failed: '+err.message)}
    e.target.value='';
  };
  reader.readAsText(file);
}
function downloadMemberTemplate(){
  const csv='IdentityNumber,Name,NRC,Group,Gender,Age,Phone,Position\nLUN-001,John Banda,123456/10/1,Example Group,Male,30,0970000000,Member\n';
  download(csv,'member-import-template.csv');
}

updateDashboard();renderReports();