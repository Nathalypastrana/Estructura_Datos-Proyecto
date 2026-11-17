const DEFAULT_BOOKS = [
  'Cien años de soledad',
  'El principito',
  'Don Quijote de la Mancha',
  'Memorias del Subsuelo',
  '1984'
];
const STORAGE_KEY = 'lectura-club-books-v1';
let books = loadBooks();
let searchMode = 'lineal';
let sorted = false;

const list = document.querySelector('#book-list');
const searchInput = document.querySelector('#search-input');
const feedback = document.querySelector('#search-feedback');
const emptyState = document.querySelector('#empty-state');
const dialog = document.querySelector('#add-dialog');
const form = document.querySelector('#add-form');
const titleInput = document.querySelector('#book-title');

function loadBooks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.every(book => typeof book === 'string') ? saved : [...DEFAULT_BOOKS];
  } catch {
    return [...DEFAULT_BOOKS];
  }
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function normalize(value) {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function duplicateKey(value) {
  return normalize(value).replace(/[^a-z0-9]/g, '');
}

function findMatches(query) {
  if (!query) return books.map((title, index) => ({ title, index }));
  if (searchMode === 'binaria') {
    const ordered = books.map((title, index) => ({ title, index })).sort((a, b) => normalize(a.title).localeCompare(normalize(b.title), 'es'));
    let left = 0;
    let right = ordered.length - 1;
    let match = -1;
    while (left <= right) {
      const middle = Math.floor((left + right) / 2);
      const value = normalize(ordered[middle].title);
      if (value === query) { match = middle; break; }
      if (value < query) left = middle + 1;
      else right = middle - 1;
    }
    if (match < 0) return [];
    let start = match;
    while (start > 0 && normalize(ordered[start - 1].title) === query) start--;
    const matches = [];
    for (let i = start; i < ordered.length && normalize(ordered[i].title) === query; i++) matches.push(ordered[i]);
    return matches;
  }
  return books.map((title, index) => ({ title, index })).filter(book => normalize(book.title).includes(query));
}

function render() {
  const query = normalize(searchInput.value.trim());
  const matches = findMatches(query);
  list.replaceChildren();
  matches.forEach(({ title, index }, visibleIndex) => {
    const row = document.createElement('article');
    row.className = 'book-row';
    const number = document.createElement('span');
    number.className = 'book-number';
    number.textContent = String(visibleIndex + 1).padStart(2, '0');
    const cover = document.createElement('span');
    cover.className = 'cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.textContent = title.trim().charAt(0).toLocaleUpperCase('es') || 'L';
    const description = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'book-title';
    name.textContent = title;
    const subtitle = document.createElement('div');
    subtitle.className = 'book-subtitle';
    subtitle.textContent = 'En tu colección';
    description.append(name, subtitle);
    const tag = document.createElement('span');
    tag.className = 'book-tag';
    tag.textContent = '✦  Para leer';
    const remove = document.createElement('button');
    remove.className = 'delete-button';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Eliminar ${title}`);
    remove.title = 'Eliminar libro';
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      books.splice(index, 1);
      saveBooks();
      render();
    });
    row.append(number, cover, description, tag, remove);
    list.append(row);
  });

  const hasQuery = Boolean(query);
  emptyState.hidden = matches.length > 0;
  list.hidden = matches.length === 0;
  emptyState.querySelector('h3').textContent = books.length === 0
    ? 'Tu colección está esperando su primer libro'
    : 'No encontramos ese libro';
  emptyState.querySelector('p').textContent = books.length === 0
    ? 'Agrega un título para empezar a construir tu biblioteca.'
    : 'Prueba con otro título o agrega un libro nuevo a tu colección.';
  feedback.textContent = hasQuery
    ? (matches.length
      ? `${matches.length} resultado${matches.length === 1 ? '' : 's'} · búsqueda ${searchMode}${searchMode === 'binaria' ? ' exacta' : ''}`
      : `Sin coincidencias · búsqueda ${searchMode}${searchMode === 'binaria' ? ' exacta' : ''}`)
    : '';
  document.querySelector('#total-books').textContent = books.length;
  document.querySelector('#nav-count').textContent = books.length;
  document.querySelector('#collection-count').textContent = `(${books.length})`;
  document.querySelector('#list-summary').textContent = `Mostrando ${matches.length} de ${books.length} libros`;
  document.querySelector('#sort-status').textContent = sorted ? 'A — Z' : 'Personal';
  document.querySelector('#sort-button').innerHTML = `<span>↕</span> ${sorted ? 'Ordenado A — Z' : 'Ordenar A — Z'}`;
}

document.querySelector('#open-add').addEventListener('click', () => {
  dialog.showModal();
  titleInput.focus();
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-add').addEventListener('click', () => dialog.close());
form.addEventListener('submit', event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  const existingTitle = books.find(book => duplicateKey(book) === duplicateKey(title));
  const duplicateMessage = document.querySelector('#duplicate-message');
  if (existingTitle) {
    duplicateMessage.textContent = `“${existingTitle}” ya está en tu biblioteca. No se agregó otra copia.`;
    titleInput.setAttribute('aria-invalid', 'true');
    titleInput.focus();
    return;
  }
  duplicateMessage.textContent = '';
  titleInput.removeAttribute('aria-invalid');
  books.push(title);
  saveBooks();
  searchInput.value = '';
  titleInput.value = '';
  sorted = false;
  dialog.close();
  render();
});
titleInput.addEventListener('input', () => {
  document.querySelector('#duplicate-message').textContent = '';
  titleInput.removeAttribute('aria-invalid');
});
document.querySelector('#sort-button').addEventListener('click', () => {
  books.sort((a, b) => normalize(a).localeCompare(normalize(b), 'es'));
  sorted = true;
  saveBooks();
  render();
});
document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => {
  searchMode = button.dataset.mode;
  document.querySelectorAll('.mode-button').forEach(item => item.classList.toggle('active', item === button));
  render();
}));
searchInput.addEventListener('input', render);
document.querySelector('#clear-search').addEventListener('click', () => {
  searchInput.value = '';
  render();
  searchInput.focus();
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === 'Escape' && dialog.open) dialog.close();
});

render();

// Demonstrations below use independent structures so they do not modify the catalog.
class LinkedNode {
  constructor(value) { this.value = value; this.next = null; }
}
class SinglyLinkedList {
  constructor(values = []) {
    this.head = null;
    values.forEach(value => this.append(value));
  }
  append(value) {
    const node = new LinkedNode(value);
    if (!this.head) { this.head = node; return; }
    let current = this.head;
    while (current.next) current = current.next;
    current.next = node;
  }
  removeFirst() {
    if (!this.head) return null;
    const value = this.head.value;
    this.head = this.head.next;
    return value;
  }
  values() {
    const result = [];
    for (let current = this.head; current; current = current.next) result.push(current.value);
    return result;
  }
}

const linkedList = new SinglyLinkedList(['Cien años', 'El principito', '1984']);
const stack = ['Don Quijote', 'Memorias'];
const queue = ['Cien años', 'El principito'];
let queueFront = 0;

function renderLinkedList() {
  const visual = document.querySelector('#linked-visual');
  visual.replaceChildren();
  if (!linkedList.head) return;
  const headLabel = document.createElement('span');
  headLabel.className = 'head-label';
  headLabel.textContent = 'HEAD';
  visual.append(headLabel);
  linkedList.values().forEach((value, index) => {
    const node = document.createElement('span');
    node.className = 'linked-node';
    const box = document.createElement('span');
    box.className = 'node-box';
    box.textContent = value;
    node.append(box);
    const next = document.createElement('span');
    next.className = 'node-next';
    next.textContent = index === linkedList.values().length - 1 ? '∅' : '→';
    node.append(next);
    visual.append(node);
  });
}
function renderLinear(items, selector, emptyText) {
  const visual = document.querySelector(selector);
  visual.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('span');
    empty.className = 'tree-empty';
    empty.textContent = emptyText;
    visual.append(empty);
    return;
  }
  items.forEach(value => {
    const item = document.createElement('span');
    item.className = 'linear-item';
    item.textContent = value;
    visual.append(item);
  });
}
function attachInputAction(inputSelector, action, resultSelector) {
  const input = document.querySelector(inputSelector);
  const value = input.value.trim();
  if (!value) {
    document.querySelector(resultSelector).textContent = 'Escribe un valor para continuar.';
    input.focus();
    return null;
  }
  input.value = '';
  return value;
}

document.querySelector('#linked-add').addEventListener('click', () => {
  const value = attachInputAction('#linked-input', null, '#linked-result');
  if (value === null) return;
  linkedList.append(value);
  renderLinkedList();
  document.querySelector('#linked-result').textContent = 'Nodo agregado al final · insertar O(n), recorrer O(n).';
});
document.querySelector('#linked-remove').addEventListener('click', () => {
  const removed = linkedList.removeFirst();
  renderLinkedList();
  document.querySelector('#linked-result').textContent = removed === null ? 'La lista está vacía.' : `Se quitó “${removed}” desde HEAD · quitar primero O(1).`;
});

document.querySelector('#stack-push').addEventListener('click', () => {
  const value = attachInputAction('#stack-input', null, '#stack-result');
  if (value === null) return;
  stack.push(value);
  renderLinear([...stack].reverse(), '#stack-visual', 'Pila vacía');
  document.querySelector('#stack-result').textContent = `“${value}” quedó en la cima · push O(1).`;
});
document.querySelector('#stack-pop').addEventListener('click', () => {
  const value = stack.pop();
  renderLinear([...stack].reverse(), '#stack-visual', 'Pila vacía');
  document.querySelector('#stack-result').textContent = value === undefined ? 'La pila está vacía.' : `Salió “${value}” de la cima · pop O(1).`;
});

document.querySelector('#queue-enqueue').addEventListener('click', () => {
  const value = attachInputAction('#queue-input', null, '#queue-result');
  if (value === null) return;
  queue.push(value);
  renderLinear(queue.slice(queueFront), '#queue-visual', 'Cola vacía');
  document.querySelector('#queue-result').textContent = `“${value}” se agregó al final · encolar O(1).`;
});
document.querySelector('#queue-dequeue').addEventListener('click', () => {
  const value = queueFront < queue.length ? queue[queueFront++] : undefined;
  renderLinear(queue.slice(queueFront), '#queue-visual', 'Cola vacía');
  document.querySelector('#queue-result').textContent = value === undefined ? 'La cola está vacía.' : `Salió “${value}” por el frente · desencolar O(1) en una cola enlazada.`;
});

function factorial(number) {
  if (number <= 1) return 1;
  return number * factorial(number - 1);
}
function calculateFactorial() {
  const input = document.querySelector('#factorial-input');
  const result = document.querySelector('#factorial-result');
  const number = Number(input.value);
  if (!Number.isInteger(number) || number < 0 || number > 12) {
    result.textContent = 'Elige un entero entre 0 y 12.';
    return;
  }
  result.textContent = `${number}! = ${factorial(number).toLocaleString('es')}`;
}
document.querySelector('#factorial-run').addEventListener('click', calculateFactorial);
document.querySelector('#factorial-input').addEventListener('keydown', event => {
  if (event.key === 'Enter') calculateFactorial();
});

class TreeNode {
  constructor(value) { this.value = value; this.left = null; this.right = null; }
}
let treeRoot = null;
function insertTree(node, value) {
  if (!node) return new TreeNode(value);
  if (value < node.value) node.left = insertTree(node.left, value);
  else if (value > node.value) node.right = insertTree(node.right, value);
  return node;
}
function containsTree(node, value) {
  if (!node) return false;
  if (value === node.value) return true;
  return value < node.value ? containsTree(node.left, value) : containsTree(node.right, value);
}
function inOrder(node, result = []) {
  if (!node) return result;
  inOrder(node.left, result);
  result.push(node.value);
  inOrder(node.right, result);
  return result;
}
function buildTreeElement(node) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-node';
  const value = document.createElement('span');
  value.className = 'tree-value';
  value.textContent = node.value;
  wrapper.append(value);
  if (node.left || node.right) {
    const children = document.createElement('div');
    children.className = 'tree-children';
    if (node.left) children.append(buildTreeElement(node.left));
    if (node.right) children.append(buildTreeElement(node.right));
    wrapper.append(children);
  }
  return wrapper;
}
function renderTree() {
  const visual = document.querySelector('#tree-visual');
  visual.replaceChildren();
  if (treeRoot) visual.append(buildTreeElement(treeRoot));
  else {
    const empty = document.createElement('span');
    empty.className = 'tree-empty';
    empty.textContent = 'Árbol vacío';
    visual.append(empty);
  }
  const values = inOrder(treeRoot);
  document.querySelector('#tree-result').textContent = `Inorden: ${values.length ? values.join(' · ') : '—'}`;
}
function readTreeNumber() {
  const input = document.querySelector('#tree-input');
  if (input.value.trim() === '' || !Number.isFinite(Number(input.value))) {
    document.querySelector('#tree-result').textContent = 'Escribe un número entero.';
    input.focus();
    return null;
  }
  const value = Number(input.value);
  if (!Number.isInteger(value)) {
    document.querySelector('#tree-result').textContent = 'Usa un número entero.';
    input.focus();
    return null;
  }
  input.value = '';
  return value;
}
document.querySelector('#tree-insert').addEventListener('click', () => {
  const value = readTreeNumber();
  if (value === null) return;
  const existed = containsTree(treeRoot, value);
  treeRoot = insertTree(treeRoot, value);
  renderTree();
  document.querySelector('#tree-result').textContent = existed ? `${value} ya estaba en el árbol · duplicados ignorados.` : `Se insertó ${value} · inorden: ${inOrder(treeRoot).join(' · ')}`;
});
document.querySelector('#tree-find').addEventListener('click', () => {
  const value = readTreeNumber();
  if (value === null) return;
  const found = containsTree(treeRoot, value);
  const result = document.querySelector('#tree-result');
  result.textContent = found ? `${value} sí está en el árbol.` : `${value} no está en el árbol.`;
  result.className = `structure-result ${found ? 'tree-result-found' : 'tree-result-missing'}`;
});

renderLinkedList();
renderLinear([...stack].reverse(), '#stack-visual', 'Pila vacía');
renderLinear(queue, '#queue-visual', 'Cola vacía');
treeRoot = [8, 4, 12, 2, 6, 10, 14].reduce((root, value) => insertTree(root, value), null);
renderTree();
