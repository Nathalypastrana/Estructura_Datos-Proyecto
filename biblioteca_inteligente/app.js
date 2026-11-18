/* Biblioteca inteligente - front.
   Replica en JavaScript las mismas reglas de biblioteca.py / estructuras.py
   para mostrar cada estructura de datos funcionando. */
"use strict";

const COLUMNAS = 5;

/* ------------------------------------------------------------ utilidades */
const norm = (t) => String(t).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const corto = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

function mergeSort(v, clave = (x) => x) {            // recursivo y estable
  if (v.length <= 1) return [...v];
  const m = v.length >> 1, a = mergeSort(v.slice(0, m), clave), b = mergeSort(v.slice(m), clave);
  const r = []; let i = 0, j = 0;
  while (i < a.length && j < b.length) r.push(clave(a[i]) <= clave(b[j]) ? a[i++] : b[j++]);
  return r.concat(a.slice(i), b.slice(j));
}
function hashIndice(clave, capacidad) {               // misma función hash que TablaHash en Python
  let h = 0;
  for (const c of String(clave)) h = (h * 31 + c.codePointAt(0)) % 1000000007;
  return h % capacidad;
}

/* ---------------------------------------------------------------- estado */
const S = {
  libros: [],            // lista enlazada (orden de ingreso)
  contador: 0,
  prestamos: new Map(),  // codigo -> lector
  esperas: new Map(),    // codigo -> cola (array)
  pila: [],              // carrito de devoluciones (cima = último)
  estanteria: [],        // matriz filas x COLUMNAS (codigos)
  tab: "catalogo", orden: "ingreso", busqueda: "", sel: null, resBusq: null, prefijo: "",
};

const porCodigo = (c) => S.libros.find((l) => l.codigo === c);

function registrar({ titulo, autor, genero, anio, paginas }) {
  titulo = titulo.trim(); autor = autor.trim(); genero = genero.trim();
  if (!titulo || !autor || !genero) throw new Error("Título, autor y género no pueden estar vacíos.");
  const hoy = new Date().getFullYear();
  if (!Number.isInteger(anio) || anio < 1 || anio > hoy) throw new Error(`El año debe estar entre 1 y ${hoy}.`);
  if (!Number.isInteger(paginas) || paginas <= 0) throw new Error("Las páginas deben ser mayores que cero.");
  if (S.libros.some((l) => norm(l.titulo) === norm(titulo) && norm(l.autor) === norm(autor)))
    throw new Error("Ese libro ya está registrado.");
  S.contador++;
  const libro = { codigo: "LIB-" + String(S.contador).padStart(3, "0"), titulo, autor, genero, anio, paginas, disponible: true };
  S.libros.push(libro);
  S.esperas.set(libro.codigo, []);
  ubicarEnEstante(libro.codigo);
  return libro;
}
function ubicarEnEstante(codigo) {
  for (const fila of S.estanteria) { const c = fila.indexOf(null); if (c >= 0) { fila[c] = codigo; return; } }
  const nueva = Array(COLUMNAS).fill(null); nueva[0] = codigo; S.estanteria.push(nueva);
}
function ubicacion(codigo) {
  for (let f = 0; f < S.estanteria.length; f++) { const c = S.estanteria[f].indexOf(codigo); if (c >= 0) return [f + 1, c + 1]; }
  return null;
}
function darDeBaja(codigo) {
  const l = porCodigo(codigo);
  if (!l.disponible) throw new Error("No se puede dar de baja un libro que está prestado.");
  S.libros = S.libros.filter((x) => x.codigo !== codigo);
  S.esperas.delete(codigo);
  S.pila = S.pila.filter((c) => c !== codigo);
  S.estanteria.forEach((f) => f.forEach((c, i) => { if (c === codigo) f[i] = null; }));
  if (S.sel === codigo) S.sel = null;
  return l;
}
function prestar(codigo, lector) {
  const l = porCodigo(codigo); lector = lector.trim();
  if (!lector) throw new Error("Escribe el nombre del lector.");
  if (l.disponible) { l.disponible = false; S.prestamos.set(codigo, lector); S.pila = S.pila.filter((c) => c !== codigo); return { estado: "prestado" }; }
  const cola = S.esperas.get(codigo);
  if (norm(S.prestamos.get(codigo)) === norm(lector) || cola.some((u) => norm(u) === norm(lector)))
    throw new Error(`${lector} ya tiene o espera este libro.`);
  cola.push(lector);
  return { estado: "espera", posicion: cola.length };
}
function devolver(codigo) {
  const l = porCodigo(codigo);
  if (l.disponible) throw new Error("Ese libro no está prestado.");
  const quien = S.prestamos.get(codigo); S.prestamos.delete(codigo);
  const siguiente = S.esperas.get(codigo).shift() ?? null;
  if (siguiente) S.prestamos.set(codigo, siguiente); else { l.disponible = true; S.pila.push(codigo); }
  return { quien, siguiente };
}
function reacomodar() {
  const c = S.pila.pop();
  return c ? { libro: porCodigo(c), ubic: ubicacion(c) } : null;
}

/* ----------------------------------------------------- estructuras derivadas */
function construirABB() {
  let raiz = null;
  const ins = (n, libro, k) => {
    if (!n) return { k, libro, i: null, d: null };
    if (k < n.k) n.i = ins(n.i, libro, k); else if (k > n.k) n.d = ins(n.d, libro, k);
    return n;
  };
  for (const l of S.libros) raiz = ins(raiz, l, norm(l.titulo));
  return raiz;
}
const alturaABB = (n) => (n ? 1 + Math.max(alturaABB(n.i), alturaABB(n.d)) : 0);
function inorden(n, r = []) { if (n) { inorden(n.i, r); r.push(n); inorden(n.d, r); } return r; }

const relacion = (a, b) => [norm(a.autor) === norm(b.autor) && "mismo autor", norm(a.genero) === norm(b.genero) && "mismo género"].filter(Boolean).join(" y ");
function construirGrafo() {
  const ady = new Map(S.libros.map((l) => [l.codigo, []]));
  S.libros.forEach((a, i) => S.libros.slice(0, i).forEach((b) => {
    if (relacion(a, b)) { ady.get(a.codigo).push(b.codigo); ady.get(b.codigo).push(a.codigo); }
  }));
  return ady;
}
function bfs(ady, inicio) {
  const vis = new Set([inicio]), cola = [[inicio, 0]], orden = [];
  while (cola.length) {
    const [v, n] = cola.shift(); orden.push([v, n]);
    for (const w of ady.get(v)) if (!vis.has(w)) { vis.add(w); cola.push([w, n + 1]); }
  }
  return orden;
}
function dfs(ady, inicio) {
  const vis = new Set(), orden = [];
  (function visitar(v) { vis.add(v); orden.push(v); for (const w of ady.get(v)) if (!vis.has(w)) visitar(w); })(inicio);
  return orden;
}
// recursividad sobre el catálogo
const contarRec = (i, pred) => (i >= S.libros.length ? 0 : (pred(S.libros[i]) ? 1 : 0) + contarRec(i + 1, pred));
const sumarRec = (i, f) => (i >= S.libros.length ? 0 : f(S.libros[i]) + sumarRec(i + 1, f));
const factorial = (n) => (n <= 1 ? 1n : BigInt(n) * factorial(n - 1));

/* ------------------------------------------------------------------ vistas */
const bloque = (tag, titulo, desc, cuerpo) =>
  `<section class="card"><header><span class="tag">${tag}</span><h2>${titulo}</h2><p>${desc}</p></header>${cuerpo}</section>`;

function vistaCatalogo() {
  let lista = [...S.libros];
  const q = norm(S.busqueda);
  if (q) lista = lista.filter((l) => [l.titulo, l.autor, l.genero].some((t) => norm(t).includes(q)));
  const claves = { titulo: (l) => norm(l.titulo), autor: (l) => [norm(l.autor), norm(l.titulo)].join("|"), anio: (l) => l.anio, paginas: (l) => l.paginas };
  if (S.orden !== "ingreso") lista = mergeSort(lista, claves[S.orden]);
  const cadena = S.libros.map((l) => `<span class="nodo">${esc(corto(l.titulo, 18))}</span>`).join('<span class="flecha">→</span>') + '<span class="flecha">→</span><span class="muted">None</span>';
  const filas = lista.map((l) => `<tr><td class="mono">${l.codigo}</td><td><b>${esc(l.titulo)}</b></td><td>${esc(l.autor)}</td><td>${esc(l.genero)}</td><td>${l.anio}</td><td>${l.paginas}</td>
    <td><span class="badge ${l.disponible ? "" : "pre"}">${l.disponible ? "Disponible" : "Prestado"}</span></td>
    <td><button class="btn sec mini" data-baja="${l.codigo}">Dar de baja</button></td></tr>`).join("");
  return bloque("Lista enlazada", "Catálogo", "Cada libro es un nodo que apunta al siguiente. Registrar agrega al final; dar de baja enlaza el anterior con el siguiente.",
      `<div class="cadena">${cadena || '<span class="muted">Lista vacía</span>'}</div>`) +
    bloque("Registro", "Registrar libro", "El código se asigna solo y el libro recibe un lugar libre en la estantería.",
      `<form class="fila" id="f-registro">
        <label>Título<input name="titulo" required></label><label>Autor<input name="autor" required></label>
        <label>Género<input name="genero" list="generos" required></label>
        <datalist id="generos">${[...new Set(S.libros.map((l) => l.genero))].map((g) => `<option value="${esc(g)}">`).join("")}</datalist>
        <label>Año<input name="anio" type="number" style="width:90px" required></label>
        <label>Páginas<input name="paginas" type="number" style="width:90px" required></label>
        <button class="btn">Registrar</button></form>`) +
    bloque("Búsqueda y merge sort", `Libros (${lista.length} de ${S.libros.length})`, "Busca por título, autor o género sin importar tildes. Ordenar usa merge sort (recursivo).",
      `<div class="fila" style="margin-bottom:12px"><label>Buscar<input id="q" value="${esc(S.busqueda)}" placeholder="García, novela, 1984…"></label>
        <label>Ordenar por<select id="orden">${[["ingreso", "Orden de ingreso"], ["titulo", "Título"], ["autor", "Autor"], ["anio", "Año"], ["paginas", "Páginas"]]
          .map(([v, t]) => `<option value="${v}" ${S.orden === v ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
      <div class="tabla-wrap"><table><thead><tr><th>Código</th><th>Título</th><th>Autor</th><th>Género</th><th>Año</th><th>Págs.</th><th>Estado</th><th></th></tr></thead><tbody>${filas || '<tr><td colspan="8" class="muted">Sin resultados</td></tr>'}</tbody></table></div>`);
}

function vistaEstanteria() {
  const filas = S.estanteria.map((fila, f) => `<div class="fila-est"><div class="rot">Estante ${f + 1}</div>${fila.map((cod, c) => {
    if (!cod) return `<div class="celda vacia"><b>Pos ${c + 1}</b>vacío</div>`;
    const l = porCodigo(cod);
    return `<div class="celda ${l.disponible ? "" : "pre"} ${S.sel === cod ? "sel" : ""}" data-sel="${cod}" title="${esc(l.titulo)}"><b>Pos ${c + 1} · ${cod}</b>${esc(corto(l.titulo, 26))}${l.disponible ? "" : "<br><i>prestado</i>"}</div>`;
  }).join("")}</div>`).join("");
  const s = S.sel && porCodigo(S.sel);
  const ub = s && ubicacion(s.codigo);
  return bloque("Matriz", "Estantería", "Una matriz de filas (estantes) × columnas (posiciones). Un libro prestado conserva su lugar reservado. Si se llena, se agrega un estante nuevo. Haz clic en un libro para ubicarlo.",
      `<div class="estante">${filas}</div>`) +
    (s ? bloque("Ubicación", esc(s.titulo), "", `<p>Está en la <b>fila ${ub[0]}, columna ${ub[1]}</b> de la matriz → <code>estanteria[${ub[0] - 1}][${ub[1] - 1}]</code></p>`) : "");
}

function vistaPrestamos() {
  const opts = S.libros.map((l) => `<option value="${l.codigo}" ${S.sel === l.codigo ? "selected" : ""}>${l.codigo} · ${esc(l.titulo)} ${l.disponible ? "" : "(prestado)"}</option>`).join("");
  const cod = S.sel && porCodigo(S.sel) ? S.sel : S.libros[0]?.codigo;
  const libro = cod && porCodigo(cod);
  const cola = cod ? S.esperas.get(cod) : [];
  const pila = [...S.pila].reverse().map((c) => `<div class="item">${esc(porCodigo(c).titulo)}</div>`).join("");
  return bloque("Hash Map + Cola", "Prestar y devolver", "Si el libro está libre se presta. Si ya está prestado, el lector entra a la cola de espera (FIFO) y recibe el libro cuando se devuelva.",
      `<div class="fila"><label>Libro<select id="p-libro">${opts}</select></label><label>Lector<input id="p-lector" placeholder="Nombre del lector"></label>
        <button class="btn" data-accion="prestar">Prestar / anotarse</button><button class="btn sec" data-accion="devolver">Devolver</button></div>`) +
    `<div class="cols">${bloque("Cola (FIFO)", "Lista de espera", libro ? esc(libro.titulo) : "",
      libro ? `<p style="margin-bottom:10px">Lo tiene: <b>${esc(S.prestamos.get(cod) ?? "nadie (disponible)")}</b></p>
        <div class="cola">${cola.map((u) => `<div class="item">${esc(u)}</div>`).join("") || '<span class="muted">Nadie en espera</span>'}</div>
        <p class="muted" style="margin-top:8px;font-size:.82rem">El primero (azul) recibe el libro al devolverse.</p>` : '<span class="muted">Sin libros</span>')}
    ${bloque("Pila (LIFO)", "Carrito de devoluciones", "Los libros devueltos sin lista de espera se apilan. El último en llegar es el primero en reacomodarse.",
      `<div class="pila">${pila || '<span class="muted">Carrito vacío</span>'}</div>
       <p style="margin-top:10px"><button class="btn" data-accion="reacomodar" ${S.pila.length ? "" : "disabled"}>Reacomodar el de la cima</button></p>`)}</div>`;
}

function vistaBusquedas() {
  const r = S.resBusq;
  let cuerpo = "";
  if (r) {
    const tarjeta = (t, d, ok, x) => `<div class="res"><h3>${t}</h3><p class="muted">${d}</p><p class="big">${x}</p><p>${ok}</p></div>`;
    cuerpo = `<div class="resultados">
      ${tarjeta("Búsqueda lineal", "Recorre uno por uno", r.lineal.libro ? `Encontrado: <b>${esc(r.lineal.libro.titulo)}</b>` : "No encontrado", `${r.lineal.pasos} comparaciones`)}
      ${tarjeta("Búsqueda binaria", "Divide el catálogo ordenado a la mitad", r.binaria.libro ? `Encontrado: <b>${esc(r.binaria.libro.titulo)}</b>` : "No encontrado", `${r.binaria.pasos} pasos`)}
      ${tarjeta("Hash Map", "Salta directo a la cubeta", r.hash.libro ? `Encontrado: <b>${esc(r.hash.libro.titulo)}</b>` : "No encontrado", r.hash.libro ? `cubeta ${r.hash.cubeta}` : "—")}
    </div>`;
  }
  return bloque("Lineal · Binaria · Hash", "Compara los tres métodos", "Escribe un título exacto (lineal y binaria) o un código (hash). Mira cuántos pasos necesita cada uno con el catálogo actual.",
    `<form class="fila" id="f-busq"><label>Título exacto<input name="titulo" placeholder="Pedro Páramo" required></label>
      <button class="btn">Buscar por título</button></form>
     <form class="fila" id="f-hash" style="margin-top:10px"><label>Código<input name="codigo" placeholder="LIB-005" required></label>
      <button class="btn sec">Buscar por código</button></form>${cuerpo}`);
}

function arbolCategorias() {
  const gen = new Map();
  for (const l of S.libros) { if (!gen.has(l.genero)) gen.set(l.genero, new Map()); const a = gen.get(l.genero); if (!a.has(l.autor)) a.set(l.autor, []); a.get(l.autor).push(l); }
  const ord = (m) => [...m.keys()].sort((x, y) => norm(x).localeCompare(norm(y)));
  return `<ul class="arbol">${ord(gen).map((g) => `<li><span class="k-gen">${esc(g)}</span><ul>${ord(gen.get(g)).map((a) =>
    `<li><span class="k-aut">${esc(a)}</span><ul>${gen.get(g).get(a).map((l) => `<li>${esc(l.titulo)} <span class="muted">(${l.anio})</span> <span class="badge ${l.disponible ? "" : "pre"}">${l.disponible ? "✔" : "✘"}</span></li>`).join("")}</ul></li>`).join("")}</ul></li>`).join("")}</ul>`;
}
function dibujarABB(raiz) {
  if (!raiz) return '<p class="muted">Árbol vacío</p>';
  const nodos = inorden(raiz); nodos.forEach((n, i) => (n.x = 50 + i * 78));
  const pos = [];
  (function rec(n, d) { if (!n) return; n.y = 30 + d * 62; pos.push(n); rec(n.i, d + 1); rec(n.d, d + 1); })(raiz, 0);
  const pref = norm(S.prefijo);
  const lineas = pos.flatMap((n) => [n.i, n.d].filter(Boolean).map((h) => `<line x1="${n.x}" y1="${n.y}" x2="${h.x}" y2="${h.y}" stroke="var(--line)" stroke-width="2"/>`)).join("");
  const circ = pos.map((n) => {
    const hit = pref && n.k.startsWith(pref);
    return `<g><circle cx="${n.x}" cy="${n.y}" r="17" fill="${hit ? "var(--accent)" : "var(--soft)"}" stroke="var(--accent)" stroke-width="2"/>
      <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="10" fill="${hit ? "var(--accent-ink)" : "var(--ink)"}">${esc(n.libro.codigo.slice(4))}</text>
      <text x="${n.x}" y="${n.y + 34}" text-anchor="middle" font-size="10" fill="var(--muted)">${esc(corto(n.libro.titulo, 11))}</text></g>`;
  }).join("");
  const w = 100 + nodos.length * 78, h = 40 + alturaABB(raiz) * 62 + 20;
  return `<div class="svg-wrap"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Árbol binario de búsqueda de títulos">${lineas}${circ}</svg></div>`;
}
function vistaArboles() {
  const abb = construirABB();
  const coin = S.prefijo ? inorden(abb).filter((n) => n.k.startsWith(norm(S.prefijo))) : [];
  return bloque("Árbol general", "Clasificación: género → autor → libro", "La jerarquía de la biblioteca. Cada rama agrupa libros relacionados.", arbolCategorias()) +
    bloque("Árbol binario de búsqueda", "Índice de títulos", `Menores a la izquierda, mayores a la derecha. Altura actual: <b>${alturaABB(abb)}</b> (buscar un título cuesta como máximo esos pasos). Escribe un prefijo para autocompletar; los nodos coincidentes se resaltan.`,
      `<div class="fila" style="margin-bottom:10px"><label>Autocompletar<input id="prefijo" value="${esc(S.prefijo)}" placeholder="cr, el, f…"></label></div>
       ${S.prefijo ? `<p style="margin-bottom:8px">${coin.length ? coin.map((n) => `<span class="badge">${esc(n.libro.titulo)}</span>`).join(" ") : '<span class="muted">Sin coincidencias</span>'}</p>` : ""}
       ${dibujarABB(abb)}
       <p class="muted" style="margin-top:10px;font-size:.85rem"><b>Inorden (alfabético):</b> ${inorden(abb).map((n) => esc(n.libro.titulo)).join(" · ")}</p>`);
}

function vistaGrafo() {
  const ady = construirGrafo();
  const ini = S.sel && ady.has(S.sel) ? S.sel : S.libros[0]?.codigo;
  if (!ini) return bloque("Grafo", "Sin libros", "", "");
  const niv = new Map(bfs(ady, ini));
  const n = S.libros.length, R = 175, cx = 250, cy = 235;
  const p = new Map(S.libros.map((l, i) => { const a = (2 * Math.PI * i) / n - Math.PI / 2; return [l.codigo, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a }]; }));
  const col = (c) => (niv.has(c) ? ["var(--n0)", "var(--n1)", "var(--n2)", "var(--n3)"][Math.min(niv.get(c), 3)] : "var(--nx)");
  const aristas = S.libros.flatMap((l) => ady.get(l.codigo).filter((o) => o > l.codigo).map((o) => `<line x1="${p.get(l.codigo).x}" y1="${p.get(l.codigo).y}" x2="${p.get(o).x}" y2="${p.get(o).y}" stroke="var(--line)" stroke-width="1.6"/>`)).join("");
  const puntos = S.libros.map((l) => {
    const q = p.get(l.codigo), lx = cx + (R + 30) * Math.cos(q.a), ly = cy + (R + 30) * Math.sin(q.a);
    const anchor = Math.cos(q.a) > 0.25 ? "start" : Math.cos(q.a) < -0.25 ? "end" : "middle";
    return `<g data-sel="${l.codigo}" style="cursor:pointer"><circle cx="${q.x}" cy="${q.y}" r="${l.codigo === ini ? 17 : 13}" fill="${col(l.codigo)}" stroke="var(--panel)" stroke-width="3"/>
      <text x="${q.x}" y="${q.y + 4}" text-anchor="middle" font-size="10" fill="#fff" font-weight="700">${l.codigo.slice(4)}</text>
      <text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" font-size="11" fill="var(--ink)">${esc(corto(l.titulo, 20))}</text></g>`;
  }).join("");
  const porNivel = {};
  for (const [c, d] of niv) (porNivel[d] ??= []).push(porCodigo(c));
  const lvls = Object.keys(porNivel).map(Number).sort((a, b) => a - b);
  const sinAlcance = S.libros.filter((l) => !niv.has(l.codigo));
  const origen = porCodigo(ini);
  return bloque("Grafo · BFS · DFS", "Libros relacionados", "Dos libros se conectan si tienen el mismo autor o el mismo género. Haz clic en un libro para ver sus recomendaciones: BFS las ordena de más cerca a más lejos; DFS explora una rama hasta el fondo.",
      `<div class="cols"><div class="svg-wrap"><svg viewBox="-70 0 640 470" width="100%" style="min-width:440px" role="img" aria-label="Grafo de libros relacionados">${aristas}${puntos}</svg>
        <div class="leyenda"><span><i style="background:var(--n0)"></i>origen</span><span><i style="background:var(--n1)"></i>nivel 1</span><span><i style="background:var(--n2)"></i>nivel 2</span><span><i style="background:var(--n3)"></i>nivel 3+</span><span><i style="background:var(--nx)"></i>sin conexión</span></div></div>
      <div><h3>BFS desde «${esc(origen.titulo)}»</h3>
        <ol class="niveles" style="list-style:none;padding:0">${lvls.filter((d) => d > 0).map((d) => `<li style="margin-top:8px"><b>Nivel ${d}</b><br>${porNivel[d].map((l) => esc(l.titulo)).join(" · ")}</li>`).join("") || '<li class="muted">Este libro no tiene relaciones.</li>'}</ol>
        ${sinAlcance.length ? `<p class="muted" style="margin-top:10px;font-size:.85rem">No alcanzables: ${sinAlcance.map((l) => esc(l.titulo)).join(", ")}</p>` : ""}
        <h3 style="margin-top:16px">DFS (exploración en profundidad)</h3>
        <p style="margin-top:6px">${dfs(ady, ini).map((c) => esc(porCodigo(c).titulo)).join(' <span class="flecha">→</span> ')}</p></div></div>`);
}

function vistaAnalisis() {
  const L = S.libros;
  if (!L.length) return bloque("Vectores", "Sin libros", "", "");
  const anios = L.map((l) => l.anio), pags = L.map((l) => l.paginas);
  const min = L.reduce((a, b) => (b.anio < a.anio ? b : a)), max = L.reduce((a, b) => (b.anio > a.anio ? b : a)), largo = L.reduce((a, b) => (b.paginas > a.paginas ? b : a));
  const vec = (v) => `<div class="vector">${v.map((x) => `<span>${x}</span>`).join("")}</div>`;
  const stat = (t, v) => `<div class="stat"><span>${t}</span><b>${v}</b></div>`;
  const n = Math.min(S.leer ?? 4, Math.min(L.length, 15));
  return bloque("Vectores", "Estadísticas del catálogo", "Los años y las páginas viven en vectores (arreglos); de ahí salen los resultados.",
      `<p class="muted">Años de publicación</p>${vec(anios)}<p class="muted">Páginas</p>${vec(pags)}
       <div class="stats" style="margin-top:12px">${stat("Más antiguo", esc(corto(min.titulo, 24)) + ` (${min.anio})`)}${stat("Más reciente", esc(corto(max.titulo, 24)) + ` (${max.anio})`)}${stat("Más extenso", esc(corto(largo.titulo, 24)) + ` (${largo.paginas})`)}
       ${stat("Año promedio", Math.round(anios.reduce((a, b) => a + b, 0) / anios.length))}${stat("Páginas promedio", Math.round(pags.reduce((a, b) => a + b, 0) / pags.length))}</div>`) +
    bloque("Recursividad", "Conteos recursivos sobre la lista", "Cada función se llama a sí misma avanzando un nodo hasta llegar al final de la lista.",
      `<div class="stats">${stat("Libros disponibles", contarRec(0, (l) => l.disponible) + " de " + L.length)}${stat("Total de páginas", sumarRec(0, (l) => l.paginas).toLocaleString("es"))}
       ${stat("Libros del género más común", (() => { const c = {}; L.forEach((l) => (c[l.genero] = (c[l.genero] || 0) + 1)); const g = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; return contarRec(0, (l) => l.genero === g) + " · " + esc(g); })())}</div>
       <div class="fila" style="margin-top:14px"><label>¿Cuántos libros quieres leer?<input id="leer" type="number" min="1" max="${Math.min(L.length, 15)}" value="${n}" style="width:110px"></label>
         <p>→ se pueden leer en <b class="big">${factorial(n).toLocaleString("es")}</b> órdenes distintos (${n}! con factorial recursivo)</p></div>`);
}

const VISTAS = { catalogo: vistaCatalogo, estanteria: vistaEstanteria, prestamos: vistaPrestamos, busquedas: vistaBusquedas, arboles: vistaArboles, grafo: vistaGrafo, analisis: vistaAnalisis };

/* ----------------------------------------------------------- render y eventos */
let temporizador;
function aviso(msg, error = false) {
  const el = document.getElementById("aviso");
  el.textContent = msg; el.className = "ver" + (error ? " error" : "");
  clearTimeout(temporizador); temporizador = setTimeout(() => (el.className = ""), 3500);
}
function render() {
  const foco = document.activeElement?.id;
  document.getElementById("vista").innerHTML = VISTAS[S.tab]();
  document.querySelectorAll("#tabs button").forEach((b) => { b.classList.toggle("on", b.dataset.tab === S.tab); b.setAttribute("aria-selected", b.dataset.tab === S.tab); });
  if (foco && ["q", "prefijo", "leer"].includes(foco)) { const e = document.getElementById(foco); if (e) { e.focus(); try { e.setSelectionRange(e.value.length, e.value.length); } catch { /* input numérico */ } } }
}
function intentar(fn) { try { return fn(); } catch (e) { aviso(e.message, true); } }

document.getElementById("tabs").addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t) { S.tab = t.dataset.tab; render(); } });

const vista = document.getElementById("vista");
vista.addEventListener("click", (e) => {
  const baja = e.target.closest("[data-baja]");
  if (baja) return intentar(() => { const l = darDeBaja(baja.dataset.baja); aviso(`Se dio de baja «${l.titulo}».`); render(); });
  const sel = e.target.closest("[data-sel]");
  if (sel) { S.sel = sel.dataset.sel; return render(); }
  const acc = e.target.closest("[data-accion]")?.dataset.accion;
  if (!acc) return;
  const cod = document.getElementById("p-libro")?.value, lector = document.getElementById("p-lector")?.value ?? "";
  intentar(() => {
    if (acc === "prestar") {
      const r = prestar(cod, lector), l = porCodigo(cod);
      aviso(r.estado === "prestado" ? `«${l.titulo}» prestado a ${lector.trim()}.` : `«${l.titulo}» está prestado: ${lector.trim()} queda en la cola (posición ${r.posicion}).`);
    } else if (acc === "devolver") {
      const r = devolver(cod), l = porCodigo(cod);
      aviso(r.siguiente ? `${r.quien} devolvió «${l.titulo}»; pasa de inmediato a ${r.siguiente} (primero en la cola).` : `${r.quien} devolvió «${l.titulo}»: va al carrito de devoluciones.`);
    } else if (acc === "reacomodar") {
      const r = reacomodar();
      aviso(`Reacomoda «${r.libro.titulo}» en el estante ${r.ubic[0]}, posición ${r.ubic[1]}.`);
    }
    S.sel = cod || S.sel; render();
  });
});
vista.addEventListener("change", (e) => {
  if (e.target.id === "orden") { S.orden = e.target.value; render(); }
  if (e.target.id === "p-libro") { S.sel = e.target.value; render(); }
});
vista.addEventListener("input", (e) => {
  if (e.target.id === "q") { S.busqueda = e.target.value; render(); }
  if (e.target.id === "prefijo") { S.prefijo = e.target.value; render(); }
  if (e.target.id === "leer") { const v = parseInt(e.target.value, 10); if (v >= 1) { S.leer = v; render(); } }
});
vista.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (e.target.id === "f-registro") intentar(() => {
    const l = registrar({ titulo: f.get("titulo"), autor: f.get("autor"), genero: f.get("genero"), anio: parseInt(f.get("anio"), 10), paginas: parseInt(f.get("paginas"), 10) });
    const u = ubicacion(l.codigo); aviso(`Registrado ${l.codigo}. Estante ${u[0]}, posición ${u[1]}.`); render();
  });
  if (e.target.id === "f-busq") { S.resBusq = comparar(String(f.get("titulo"))); render(); }
  if (e.target.id === "f-hash") {
    // el hash busca por código; luego se buscan los mismos libros por título para comparar pasos
    const c = String(f.get("codigo")).trim().toUpperCase(), l = porCodigo(c) ?? null;
    S.resBusq = comparar(l ? l.titulo : "", { libro: l, cubeta: hashIndice(c, capacidadHash()) });
    aviso(l ? `Hash: ${c} → cubeta ${S.resBusq.hash.cubeta}, encontrado.` : `Hash: ${c} no existe.`, !l); render();
  }
});
function comparar(titulo, hash) {
  const t = norm(titulo);
  const i = S.libros.findIndex((l) => norm(l.titulo) === t);
  const lineal = { libro: i >= 0 ? S.libros[i] : null, pasos: i >= 0 ? i + 1 : S.libros.length };
  const v = mergeSort(S.libros, (l) => norm(l.titulo));
  let a = 0, b = v.length - 1, pasos = 0, hallado = null;
  while (a <= b) { pasos++; const m = (a + b) >> 1, k = norm(v[m].titulo); if (k === t) { hallado = v[m]; break; } if (k < t) a = m + 1; else b = m - 1; }
  const l = lineal.libro;
  return { lineal, binaria: { libro: hallado, pasos }, hash: hash ?? { libro: l, cubeta: l ? hashIndice(l.codigo, capacidadHash()) : null } };
}
function capacidadHash() { let cap = 8; while (S.libros.length > 0.75 * cap) cap *= 2; return cap; }

/* --------------------------------------------------------------- datos demo */
[
  ["Cien años de soledad", "Gabriel García Márquez", "Novela", 1967, 471],
  ["El principito", "Antoine de Saint-Exupéry", "Fábula", 1943, 96],
  ["Don Quijote de la Mancha", "Miguel de Cervantes", "Novela", 1605, 863],
  ["Memorias del subsuelo", "Fiódor Dostoievski", "Novela", 1864, 136],
  ["1984", "George Orwell", "Ciencia ficción", 1949, 328],
  ["Rebelión en la granja", "George Orwell", "Fábula", 1945, 144],
  ["El amor en los tiempos del cólera", "Gabriel García Márquez", "Novela", 1985, 368],
  ["Crimen y castigo", "Fiódor Dostoievski", "Novela", 1866, 551],
  ["Fundación", "Isaac Asimov", "Ciencia ficción", 1951, 255],
  ["Yo, robot", "Isaac Asimov", "Ciencia ficción", 1950, 253],
  ["Pedro Páramo", "Juan Rulfo", "Novela", 1955, 124],
].forEach(([t, a, g, y, p]) => registrar({ titulo: t, autor: a, genero: g, anio: y, paginas: p }));

render();
