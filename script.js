let addCat = null;
let editCat = null;
let editIndex = null;
let deleteIndex = null;

function showScreen(which){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelector('.screen-' + which).classList.add('active');

  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(b => b.classList.remove('active'));
  if(which === 'home') tabs[0].classList.add('active');
  else tabs[1].classList.add('active');

  if(which === 'history') loadHistory();
}

function openOverlay(id){
  document.getElementById(id).classList.add('show');
  const banner = document.getElementById('overlay-banner');
  const title = id === "overlay-add" ? "Aggiungi spesa" :
                id === "overlay-edit" ? "Modifica spesa" :
                id === "overlay-delete" ? "Elimina voce" : "";
  document.getElementById("overlay-title").textContent = title;
  banner.classList.add('show');
}

function closeOverlay(id){
  document.getElementById(id).classList.remove('show');
  document.getElementById('overlay-banner').classList.remove('show');
}

function selectAddCat(btn){
  document.querySelectorAll('#overlay-add .cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  addCat = btn.dataset.cat;
}

function selectEditCat(btn){
  document.querySelectorAll('#overlay-edit .cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  editCat = btn.dataset.cat;
}

function formatEuro(val){
  if(isNaN(val) || val === null) return "€ 0,00";
  return "€ " + val.toFixed(2).replace(".", ",");
}

function getMonthKey(offset = 0){
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.getFullYear() + "_" + (d.getMonth()+1);
}

function getSpese(key){
  return JSON.parse(localStorage.getItem("spese_" + key) || "[]");
}

function setSpese(key, arr){
  localStorage.setItem("spese_" + key, JSON.stringify(arr));
}

function saveNewSpesa(){
  const amount = parseFloat(document.getElementById('add-amount').value || "0");
  const desc = document.getElementById('add-desc').value || "";
  const date = document.getElementById('add-date').value || "";
  const cat = addCat || "Necessità";

  if(amount <= 0 || !desc) return;

  const key = getMonthKey();
  const arr = getSpese(key);
  arr.push({ amount, desc, date, cat });
  setSpese(key, arr);

  closeOverlay('overlay-add');
  renderRecent();
  updateTotals();
  animateLastEntry();
}

function openEdit(desc, amount, cat, index){
  editIndex = index;
  openOverlay('overlay-edit');
  document.getElementById('edit-desc').value = desc;
  document.getElementById('edit-amount').value = amount;
  document.getElementById('edit-date').value = "";
  editCat = cat;
  document.querySelectorAll('#overlay-edit .cat-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
}

function saveEditSpesa(){
  if(editIndex === null) return;
  const key = getMonthKey();
  const arr = getSpese(key);

  const amount = parseFloat(document.getElementById('edit-amount').value || "0");
  const desc = document.getElementById('edit-desc').value || "";
  const date = document.getElementById('edit-date').value || "";
  const cat = editCat || arr[editIndex].cat;

  if(amount <= 0 || !desc) return;

  arr[editIndex] = { amount, desc, date, cat };
  setSpese(key, arr);

  closeOverlay('overlay-edit');
  renderRecent();
  updateTotals();
}

function openDelete(desc, index){
  deleteIndex = index;
  document.getElementById('delete-text').textContent =
    'Vuoi eliminare "' + desc + '"?';
  openOverlay('overlay-delete');
}

function confirmDelete(){
  if(deleteIndex === null) return;
  const key = getMonthKey();
  const arr = getSpese(key);
  arr.splice(deleteIndex, 1);
  setSpese(key, arr);
  deleteIndex = null;
  closeOverlay('overlay-delete');
  renderRecent();
  updateTotals();
}

function calcBudget(){
  const income = parseFloat(document.getElementById('income').value || "0");
  let budget = parseFloat(document.getElementById('budget').value || "0");
  if(budget <= 0) budget = income;

  const nec = budget * 0.5;
  const des = budget * 0.3;
  const ris = budget * 0.2;

  document.getElementById('nec-val').textContent = formatEuro(nec);
  document.getElementById('des-val').textContent = formatEuro(des);
  document.getElementById('ris-val').textContent = formatEuro(ris);

  document.getElementById('cat-nec-amount').textContent = formatEuro(nec);
  document.getElementById('cat-des-amount').textContent = formatEuro(des);
  document.getElementById('cat-ris-amount').textContent = formatEuro(ris);

  localStorage.setItem("budget_" + getMonthKey(), budget);

  updateTotals();
}

function updateTotals(){
  const key = getMonthKey();
  const budget = parseFloat(localStorage.getItem("budget_" + key) || "0");
  const arr = getSpese(key);

  let total = 0;
  let necTotal = 0;
  let desTotal = 0;
  let risTotal = 0;

  arr.forEach(s => {
    total += s.amount;
    if(s.cat === "Necessità") necTotal += s.amount;
    if(s.cat === "Desideri") desTotal += s.amount;
    if(s.cat === "Risparmio") risTotal += s.amount;
  });

  document.getElementById('spent-total').textContent = formatEuro(total);

  const usedPerc = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const leftPerc = 100 - usedPerc;
  const leftVal = budget - total;

  document.getElementById('budget-fill').style.width = usedPerc + "%";
  document.getElementById('budget-meta').textContent =
    usedPerc.toFixed(0) + "% del budget mensile";

  document.getElementById('left-fill').style.width = Math.max(0, leftPerc) + "%";
  document.getElementById('left-meta').textContent =
    formatEuro(Math.max(0, leftVal)) + " rimasti";

  const totalCat = necTotal + desTotal + risTotal || 1;
  const necPerc = (necTotal / totalCat) * 100;
  const desPerc = (desTotal / totalCat) * 100;
  const risPerc = (risTotal / totalCat) * 100;

  document.getElementById('nec-perc').textContent = necPerc.toFixed(0) + "%";
  document.getElementById('des-perc').textContent = desPerc.toFixed(0) + "%";
  document.getElementById('ris-perc').textContent = risPerc.toFixed(0) + "%";

  document.getElementById('cat-nec-fill').style.width = necPerc + "%";
  document.getElementById('cat-des-fill').style.width = desPerc + "%";
  document.getElementById('cat-ris-fill').style.width = risPerc + "%";

  document.getElementById('ring-text').textContent =
    "Budget " + formatEuro(budget);

  drawRing(necPerc, desPerc, risPerc);
}

function renderRecent(){
  const key = getMonthKey();
  const arr = getSpese(key);
  const container = document.getElementById('recent-list');
  container.innerHTML = "";

  arr.slice().reverse().forEach((s, idxRev) => {
    const idx = arr.length - 1 - idxRev;
    const div = document.createElement('div');
    div.className = "entry entry-" + s.cat;
    div.innerHTML = `
      <div class="entry-main">
        <div class="entry-desc">${s.desc}</div>
        <div class="entry-amount">${formatEuro(s.amount)}</div>
        <span class="entry-edit" onclick="openEdit('${s.desc}','${s.amount}','${s.cat}',${idx})">✎</span>
        <span class="entry-delete" onclick="openDelete('${s.desc}',${idx})">🗑</span>
      </div>
      <div class="entry-meta">
        ${s.cat} • ${s.date || "Data non impostata"}
      </div>
    `;
    container.appendChild(div);
  });
}

function animateLastEntry(){
  const container = document.getElementById('recent-list');
  const first = container.firstElementChild;
  if(first) first.classList.add('entry-added');
}

function loadHistory(){
  const monthSel = document.getElementById('history-month').value;
  const catSel = document.getElementById('history-category').value;
  const minVal = parseFloat(document.getElementById('history-min').value || "0");
  const maxVal = parseFloat(document.getElementById('history-max').value || "0");

  let offset = 0;
  if(monthSel === "prev1") offset = -1;

  const key = getMonthKey(offset);
  const arr = getSpese(key);
  const container = document.getElementById('history-list');
  container.innerHTML = "";

  arr.forEach((s, idx) => {
    if(catSel !== "all" && s.cat !== catSel) return;
    if(minVal > 0 && s.amount < minVal) return;
    if(maxVal > 0 && s.amount > maxVal) return;

    const div = document.createElement('div');
    div.className = "entry entry-" + s.cat;
    div.innerHTML = `
      <div class="entry-main">
        <div class="entry-desc">${s.desc}</div>
        <div class="entry-amount">${formatEuro(s.amount)}</div>
        <span class="entry-edit" onclick="openEdit('${s.desc}','${s.amount}','${s.cat}',${idx})">✎</span>
        <span class="entry-delete" onclick="openDelete('${s.desc}',${idx})">🗑</span>
      </div>
      <div class="entry-meta">
        ${s.cat} • ${s.date || "Data non impostata"}
      </div>
    `;
    container.appendChild(div);
  });
}

/* GRAFICO DINAMICO CANVAS */
function drawRing(necPerc, desPerc, risPerc){
  const canvas = document.getElementById('ringCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 50;
  const lineWidth = 16;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const total = necPerc + desPerc + risPerc || 1;
  const necAngle = (necPerc / total) * Math.PI * 2;
  const desAngle = (desPerc / total) * Math.PI * 2;
  const risAngle = (risPerc / total) * Math.PI * 2;

  let start = -Math.PI / 2;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.strokeStyle = "#ff3b3b";
  ctx.arc(cx, cy, r, start, start + necAngle);
  ctx.stroke();
  start += necAngle;

  ctx.beginPath();
  ctx.strokeStyle = "#3b7bff";
  ctx.arc(cx, cy, r, start, start + desAngle);
  ctx.stroke();
  start += desAngle;

  ctx.beginPath();
  ctx.strokeStyle = "#00c96b";
  ctx.arc(cx, cy, r, start, start + risAngle);
  ctx.stroke();
}

document.addEventListener('DOMContentLoaded', () => {
  renderRecent();
  updateTotals();
});