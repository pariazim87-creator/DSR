const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let nextId = 7;
let activeFilter = 'all';
let searchTerm = '';
let sortAscending = true;
let goalHours = Number(localStorage.getItem('dsr-goal') || 6);
let toastTimer;

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function openModal(id) { $('#'+id).classList.remove('hidden'); document.body.style.overflow='hidden'; const input=$('#'+id+' input'); if(input) setTimeout(()=>input.focus(),100); }
function closeModal(id) { $('#'+id).classList.add('hidden'); if (!$$('.modal-backdrop:not(.hidden)').length) document.body.style.overflow=''; }
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$$('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal-backdrop:not(.hidden)').forEach(m=>closeModal(m.id));if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus();}});

function switchView(view) {
  const map={overview:'overviewView',planner:'plannerView',reports:'reportsView'};
  Object.entries(map).forEach(([key,id])=>$('#'+id).classList.toggle('hidden',key!==view));
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $('#crumbTitle').textContent={overview:'Overview',planner:'Study planner',reports:'Reports & insights'}[view]||'Overview';
  $('#sidebar').classList.remove('open');
  if(view==='planner')renderPlanner();
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
document.addEventListener('click',e=>{if(window.innerWidth<=900 && !$('#sidebar').contains(e.target) && !$('#mobileMenu').contains(e.target))$('#sidebar').classList.remove('open')});

function getRows(){return $$('.task-row[data-id]');}
function updateCounts(){
  const rows=getRows(), done=rows.filter(r=>r.dataset.status==='done').length, total=rows.length;
  $('#completedCount').textContent=12+Math.max(0,done-1);
  $('#taskProgress').style.width=(total?done/total*100:0)+'%';
  $('#taskProgressText').textContent=(total?Math.round(done/total*100):0)+'%';
  $('#taskCountBadge').textContent=String(total).padStart(2,'0');
  $('#emptyState').classList.toggle('hidden', rows.some(r=>!r.classList.contains('filtered-out')));
  renderPlanner();
}
function filterRows(){
  const rows=getRows();
  rows.forEach(row=>{
    const status=row.dataset.status;
    const matchesStatus=activeFilter==='all'||(activeFilter==='pending'&&status==='pending')||(activeFilter==='done'&&status==='done');
    const haystack=(row.innerText+' '+row.dataset.subject).toLowerCase();
    const matchesSearch=!searchTerm||haystack.includes(searchTerm);
    const plannerSubject=$('#subjectFilter')?.value||'all';
    const plannerStatus=$('#statusFilter')?.value||'all';
    const inPlanner=$('#plannerView')&&!$('#plannerView').classList.contains('hidden');
    const matchesPlanner=!inPlanner||((plannerSubject==='all'||row.dataset.subject===plannerSubject)&&(plannerStatus==='all'||status===plannerStatus));
    const hidden=!(matchesStatus&&matchesSearch&&matchesPlanner);
    row.classList.toggle('filtered-out',hidden);
    row.classList.toggle('hidden',hidden);
  });
  $('#emptyState').classList.toggle('hidden',rows.some(r=>!r.classList.contains('filtered-out')));
  renderPlanner();
}
function renderPlanner(){
  const container=$('#plannerTaskList'); if(!container)return;
  const rows=getRows().filter(row=>{
    const subject=$('#subjectFilter').value,status=$('#statusFilter').value;
    return (subject==='all'||row.dataset.subject===subject)&&(status==='all'||row.dataset.status===status)&&(!searchTerm||(row.innerText+' '+row.dataset.subject).toLowerCase().includes(searchTerm));
  }).sort((a,b)=>sortAscending?a.dataset.time.localeCompare(b.dataset.time):b.dataset.time.localeCompare(a.dataset.time));
  container.innerHTML='';
  rows.forEach(row=>{const clone=row.cloneNode(true);clone.classList.remove('hidden','filtered-out');container.appendChild(clone);});
  if(!rows.length)container.innerHTML='<div class="empty-state"><span>✳</span><strong>No matching tasks</strong><p>Try adjusting your filters.</p></div>';
  bindTaskControls(container);
}
function bindTaskControls(root=document){
  $$('.task-check',root).forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.addEventListener('click',()=>{
    const row=btn.closest('.task-row'); const original=getRows().find(r=>r.dataset.id===row.dataset.id);
    if(!original)return;
    const done=original.dataset.status!=='done';original.dataset.status=done?'done':'pending';original.classList.toggle('completed',done);
    const check=$('.task-check',original);check.classList.toggle('checked',done);check.textContent=done?'✓':'';
    updateCounts();filterRows();showToast(done?'Task marked complete. Nice work!':'Task moved back to your to-do list.');
  });});
  $$('.task-more',root).forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.addEventListener('click',()=>{const row=btn.closest('.task-row');const id=row.dataset.id;const original=getRows().find(r=>r.dataset.id===id);if(original&&confirm('Delete this study task?')){original.remove();updateCounts();filterRows();showToast('Task removed from your plan.')}})});
}
bindTaskControls();
$$('.filter-tab').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-tab').forEach(b=>b.classList.toggle('active',b===btn));activeFilter=btn.dataset.filter;filterRows();}));
$('#globalSearch').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();filterRows();});
$('#subjectFilter').addEventListener('change',filterRows);$('#statusFilter').addEventListener('change',filterRows);
$('#sortBtn').addEventListener('click',()=>{sortAscending=!sortAscending;const list=$('#taskList');getRows().sort((a,b)=>sortAscending?a.dataset.time.localeCompare(b.dataset.time):b.dataset.time.localeCompare(a.dataset.time)).forEach(r=>list.appendChild(r));filterRows();showToast(sortAscending?'Tasks sorted by earliest time.':'Tasks sorted by latest time.');});
$('#newTaskBtn').addEventListener('click',()=>openModal('taskModal'));$('#addTaskBottom').addEventListener('click',()=>openModal('taskModal'));$('#plannerAddBtn').addEventListener('click',()=>openModal('taskModal'));

const subjectColors={Biology:'sage',Chemistry:'clay',Physics:'gold',Mathematics:'lilac',Literature:'lilac',Other:'gold'};
function timeLabel(value){const [h,m]=value.split(':').map(Number);const ap=h>=12?'PM':'AM';return `${String(h%12||12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`;}
$('#taskForm').addEventListener('submit',e=>{
  e.preventDefault();
  const title=$('#taskTitleInput').value.trim(),subject=$('#taskSubjectInput').value,time=$('#taskTimeInput').value,duration=Number($('#taskDurationInput').value);
  if(!title)return;
  const color=subjectColors[subject]||'gold', letter=subject==='Mathematics'?'M':subject[0];
  const row=document.createElement('article');row.className='task-row';row.dataset.id=String(nextId++);row.dataset.subject=subject;row.dataset.status='pending';row.dataset.time=time;
  row.innerHTML=`<button class="task-check" aria-label="Mark ${subject} task complete"></button><span class="task-subject-icon ${color}-bg">${letter}</span><div class="task-details"><strong></strong><span></span></div><span class="task-time"></span><button class="task-more" aria-label="Task options">···</button>`;
  $('.task-details strong',row).textContent=title;$('.task-details span',row).textContent=`${subject} · ${duration} min`;$('.task-time',row).textContent=timeLabel(time);
  $('#taskList').appendChild(row);bindTaskControls(row);$('#taskTitleInput').value='';closeModal('taskModal');activeFilter='all';$$('.filter-tab').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));filterRows();updateCounts();showToast('Added to your study plan.');
});
$('#loginOpen').addEventListener('click',()=>openModal('loginModal'));$('#profileBtn').addEventListener('click',()=>openModal('loginModal'));
$('#loginForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#loginNameInput').value.trim();if(!name)return;localStorage.setItem('dsr-display-name',name);$('#profileName').textContent=name;$('.avatar').textContent=name.charAt(0).toUpperCase();$('#loginOpen').textContent='My space ↗';closeModal('loginModal');showToast(`Welcome to your study space, ${name}.`);});
const savedName=localStorage.getItem('dsr-display-name');if(savedName){$('#profileName').textContent=savedName;$('.avatar').textContent=savedName.charAt(0).toUpperCase();$('#loginOpen').textContent='My space ↗';$('#loginNameInput').value=savedName;}
$('#editGoalBtn').addEventListener('click',()=>{ $('#goalInput').value=String(goalHours);openModal('goalModal');});
$('#goalForm').addEventListener('submit',e=>{e.preventDefault();goalHours=Number($('#goalInput').value);localStorage.setItem('dsr-goal',String(goalHours));updateGoal();closeModal('goalModal');showToast('Daily goal updated.');});
function updateGoal(){const totalMinutes=205, goalMinutes=goalHours*60, pct=Math.min(100,Math.round(totalMinutes/goalMinutes*100));$('#goalPercent').textContent=pct+'%';$('#dailyRing').style.strokeDashoffset=String(308-(pct/100*308));$('.focus-card .focus-bottom span').innerHTML=`<i class="tiny-check">✓</i> Daily goal: ${goalHours} hours`;}
updateGoal();
$('#saveReflection').addEventListener('click',()=>{const text=$('#reflectionInput').value.trim();if(!text){showToast('Write one small thing you learned first.');$('#reflectionInput').focus();return;}localStorage.setItem('dsr-reflection',text);$('#reflectionSaved').classList.remove('hidden');showToast('Reflection saved on this device.');});
$('#reflectionInput').value=localStorage.getItem('dsr-reflection')||'';
$('#reflectionInput').addEventListener('input',()=>$('#reflectionSaved').classList.add('hidden'));
$('#focusBtn').addEventListener('click',()=>{let mins=25;const start=Date.now();const end=Date.now()+mins*60*1000;showToast('Focus session started — 25 minutes. Put distractions away.');const btn=$('#focusBtn');btn.textContent='Focus session active · 25:00';btn.disabled=true;const timer=setInterval(()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000));btn.textContent=`Focus session active · ${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(left===0){clearInterval(timer);btn.textContent='Start focus session ↗';btn.disabled=false;showToast('Focus session complete. Take a short break!');}},1000);});
$('#themeBtn').addEventListener('click',()=>{document.body.classList.toggle('dark-mode');localStorage.setItem('dsr-dark',document.body.classList.contains('dark-mode')?'1':'0');showToast(document.body.classList.contains('dark-mode')?'Evening mode enabled.':'Light mode enabled.');});
if(localStorage.getItem('dsr-dark')==='1')document.body.classList.add('dark-mode');
$('#periodBtn').addEventListener('click',()=>showToast('Showing your current weekly overview.'));
$('#reportPeriodBtn').addEventListener('click',()=>showToast('Report range: last 7 days.'));
$('#addSubjectBtn').addEventListener('click',()=>{const name=prompt('Name your new subject:');if(!name||!name.trim())return;const clean=name.trim().slice(0,28);const btn=document.createElement('button');btn.className='subject-item';btn.dataset.subject=clean;btn.innerHTML=`<i class="subject-dot gold"></i><span class="subject-name"></span><span>00</span>`;$('.subject-name',btn).textContent=clean;$('#subjectList').appendChild(btn);btn.addEventListener('click',()=>{searchTerm=clean.toLowerCase();$('#globalSearch').value=clean;switchView('overview');filterRows();});showToast(`Subject "${clean}" added to your sidebar.`);});
$$('.subject-item').forEach(btn=>btn.addEventListener('click',()=>{searchTerm=btn.dataset.subject.toLowerCase();$('#globalSearch').value=btn.dataset.subject;switchView('overview');filterRows();}));
