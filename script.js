'use strict';

const STORAGE_KEY = 'student-manager:students';

const form = document.getElementById('form');
const nameInput = document.getElementById('name');
const groupInput = document.getElementById('group');
const gradeInput = document.getElementById('grade');
const submitBtn = document.getElementById('submit');
const cancelBtn = document.getElementById('cancel');
const searchInput = document.getElementById('search');
const rows = document.getElementById('rows');
const empty = document.getElementById('empty');
const statCount = document.getElementById('stat-count');
const statAvg = document.getElementById('stat-avg');

let students = load();
let editingId = null;

/* ---------- Storage (wrapped in try/catch: it can be blocked) ---------- */
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch {
    /* storage unavailable: the app still works until the page is closed */
  }
}

/* ---------- Rendering ---------- */
function formatGrade(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '');
}

function cell(text, className) {
  const td = document.createElement('td');
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function button(label, className, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn btn--small ${className}`;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const visible = students.filter((s) =>
    s.name.toLowerCase().includes(query) || s.group.toLowerCase().includes(query)
  );

  rows.replaceChildren(...visible.map((s) => {
    const tr = document.createElement('tr');
    if (s.id === editingId) tr.classList.add('is-editing');

    const actions = document.createElement('td');
    actions.className = 'actions';
    actions.append(
      button('Edit', '', () => startEdit(s.id)),
      button('Delete', 'btn--danger', () => remove(s.id))
    );

    tr.append(cell(s.name), cell(s.group), cell(`${formatGrade(s.grade)} / 20`, s.grade < 10 ? 'grade--low' : ''), actions);
    return tr;
  }));

  empty.hidden = visible.length > 0;
  if (!visible.length) {
    empty.textContent = students.length ? 'No student matches your search.' : 'No students yet. Add the first one above.';
  }

  statCount.textContent = `${students.length} ${students.length === 1 ? 'student' : 'students'}`;
  statAvg.textContent = students.length
    ? `Class average: ${formatGrade(Math.round(students.reduce((sum, s) => sum + s.grade, 0) / students.length * 100) / 100)} / 20`
    : 'No average yet';
}

/* ---------- Actions ---------- */
function startEdit(id) {
  const s = students.find((item) => item.id === id);
  if (!s) return;
  editingId = id;
  nameInput.value = s.name;
  groupInput.value = s.group;
  gradeInput.value = s.grade;
  submitBtn.textContent = 'Save changes';
  cancelBtn.hidden = false;
  nameInput.focus();
  render();
}

function stopEdit() {
  editingId = null;
  form.reset();
  submitBtn.textContent = 'Add student';
  cancelBtn.hidden = true;
  render();
}

function remove(id) {
  const s = students.find((item) => item.id === id);
  if (!s || !confirm(`Delete ${s.name}?`)) return;
  students = students.filter((item) => item.id !== id);
  save();
  if (editingId === id) stopEdit(); else render();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = {
    name: nameInput.value.trim(),
    group: groupInput.value.trim(),
    grade: Number(gradeInput.value),
  };
  if (!data.name || !data.group || Number.isNaN(data.grade)) return;

  if (editingId) {
    students = students.map((s) => (s.id === editingId ? { ...s, ...data } : s));
  } else {
    students.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...data });
  }
  save();
  stopEdit();
  nameInput.focus();
});

cancelBtn.addEventListener('click', stopEdit);
searchInput.addEventListener('input', render);

render();