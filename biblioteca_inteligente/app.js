const DEFAULT_BOOKS = [
  'Cien años de soledad',
  'El principito',
  'Don Quijote de la Mancha',
  'Memorias del Subsuelo',
  '1984'
];

let libros = [...DEFAULT_BOOKS];
let pila = [];
let cola = [];
let inicioCola = 0;
let raizArbol = null;
let estadoEntrada = 'menu';
let textoPrompt = 'Seleccione:';

const terminal = document.querySelector('#terminal-output');
const form = document.querySelector('#terminal-form');
const input = document.querySelector('#terminal-input');
const promptLabel = document.querySelector('#prompt-label');
const restartButton = document.querySelector('#restart-button');

function escribir(texto = '', tipo = '') {
  String(texto).split('\n').forEach(contenido => {
    const linea = document.createElement('div');
    linea.className = 'terminal-line';
    if (!contenido) {
      linea.classList.add('blank');
      linea.textContent = ' ';
    } else {
      const limpio = contenido.trim();
      if (tipo) {
        linea.classList.add(tipo);
      } else if (limpio.startsWith('=====')) {
        linea.classList.add('menu-title');
      } else if (/^(?:\d+|0)\./.test(limpio)) {
        linea.classList.add('menu-option');
      } else if (/Opción inválida|no puede estar|número entero válido|debe estar entre|No se encontró|No encontrado/.test(contenido)) {
        linea.classList.add('warning-line');
      } else if (/agregado correctamente|Se insertó|Encontrado en posición/.test(contenido)) {
        linea.classList.add('success-line');
      }
      linea.textContent = contenido;
    }
    terminal.append(linea);
  });
  terminal.scrollTop = terminal.scrollHeight;
}

function establecerPrompt(texto, estado) {
  textoPrompt = texto;
  estadoEntrada = estado;
  promptLabel.textContent = texto;
  input.disabled = estado === 'finalizado';
  restartButton.hidden = estado !== 'finalizado';
  if (!input.disabled) input.focus();
}

function pedirEntrada(texto, estado, lineaEnBlanco = false) {
  if (lineaEnBlanco) escribir('');
  establecerPrompt(texto, estado);
}

function mostrarMenuPrincipal() {
  escribir('\n===== BIBLIOTECA INTELIGENTE =====');
  escribir('1. Registrar libro');
  escribir('2. Mostrar libros');
  escribir('3. Buscar libro');
  escribir('4. Ordenar libros');
  escribir('5. Trabajar con vectores');
  escribir('6. Trabajar con matrices');
  escribir('7. Búsqueda lineal');
  escribir('8. Búsqueda binaria');
  escribir('9. Administrar lista simplemente enlazada');
  escribir('10. Administrar pila (LIFO)');
  escribir('11. Administrar cola (FIFO)');
  escribir('12. Ejemplo de recursividad (factorial)');
  escribir('13. Administrar árbol binario de búsqueda');
  escribir('0. Salir');
  establecerPrompt('Seleccione:', 'menu');
}

function mostrarLibros() {
  if (libros.length === 0) {
    escribir('\nNo hay libros disponibles');
    return;
  }
  escribir('\n LIBROS DISPONIBLES');
  libros.forEach((libro, indice) => escribir(`${indice + 1}. ${libro}`));
}

function representarTexto(texto) {
  const comilla = texto.includes("'") && !texto.includes('"') ? '"' : "'";
  const escapado = texto
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(new RegExp(comilla, 'g'), `\\${comilla}`);
  return `${comilla}${escapado}${comilla}`;
}

function representarLista(valores, sonTextos = false) {
  return `[${valores.map(valor => sonTextos ? representarTexto(valor) : String(valor)).join(', ')}]`;
}

function agregarLibro(titulo, volverAlMenu) {
  if (titulo) {
    libros.push(titulo);
    escribir(`Libro "${titulo}" agregado correctamente.`, 'success-line');
  } else {
    escribir('El nombre del libro no puede estar vacio.', 'warning-line');
  }
  volverAlMenu();
}

function buscarLibro(termino) {
  const encontrados = libros
    .map((libro, indice) => ({ libro, indice }))
    .filter(({ libro }) => libro.toLowerCase().includes(termino.toLowerCase()));
  if (encontrados.length === 0) {
    escribir('No se encontró ningún libro con ese nombre.', 'warning-line');
    return;
  }
  encontrados.forEach(({ libro, indice }) => escribir(`${indice + 1}. ${libro}`));
}

function buscarLineal(titulo) {
  return libros.findIndex(libro => libro.toLowerCase() === titulo.toLowerCase());
}

function buscarBinaria(titulo) {
  const ordenados = [...libros].sort();
  let izquierda = 0;
  let derecha = ordenados.length - 1;
  while (izquierda <= derecha) {
    const medio = Math.floor((izquierda + derecha) / 2);
    const libro = ordenados[medio].toLowerCase();
    const objetivo = titulo.toLowerCase();
    if (libro === objetivo) return medio;
    if (libro < objetivo) izquierda = medio + 1;
    else derecha = medio - 1;
  }
  return -1;
}

function mostrarVector() {
  const vector = libros.map(libro => Array.from(libro).length);
  escribir('\nVector de longitudes de los títulos:');
  escribir(representarLista(vector));
}

function mostrarMatriz() {
  escribir('\nMatriz (índice - título):');
  libros.forEach((libro, indice) => {
    escribir(`[${indice + 1}, ${representarTexto(libro)}]`);
  });
}

function mostrarMenuLista() {
  escribir('\n===== LISTA SIMPLEMENTE ENLAZADA =====');
  mostrarLibros();
  escribir('1. Agregar libro');
  escribir('2. Quitar el primer libro');
  escribir('0. Volver');
  establecerPrompt('Seleccione:', 'lista');
}

function mostrarMenuPila() {
  escribir('\n===== PILA (LIFO) =====');
  escribir(`Elementos (cima primero): ${representarLista([...pila].reverse(), true)}`);
  escribir('1. Apilar elemento');
  escribir('2. Desapilar elemento');
  escribir('0. Volver');
  establecerPrompt('Seleccione:', 'pila');
}

function mostrarMenuCola() {
  escribir('\n===== COLA (FIFO) =====');
  escribir(`Elementos (primero en salir): ${representarLista(cola.slice(inicioCola), true)}`);
  escribir('1. Encolar elemento');
  escribir('2. Desencolar elemento');
  escribir('0. Volver');
  establecerPrompt('Seleccione:', 'cola');
}

function factorialRecursivo(numero) {
  if (numero <= 1n) return 1n;
  return numero * factorialRecursivo(numero - 1n);
}

function leerEntero(valor) {
  if (!/^[+-]?\d+$/.test(valor)) return null;
  return BigInt(valor);
}

function insertarArbol(nodo, valor) {
  if (nodo === null) return { valor, izquierda: null, derecha: null };
  if (valor < nodo.valor) nodo.izquierda = insertarArbol(nodo.izquierda, valor);
  else if (valor > nodo.valor) nodo.derecha = insertarArbol(nodo.derecha, valor);
  return nodo;
}

function contieneArbol(nodo, valor) {
  if (nodo === null) return false;
  if (valor === nodo.valor) return true;
  return valor < nodo.valor
    ? contieneArbol(nodo.izquierda, valor)
    : contieneArbol(nodo.derecha, valor);
}

function recorridoInorden(nodo, resultado = []) {
  if (nodo === null) return resultado;
  recorridoInorden(nodo.izquierda, resultado);
  resultado.push(nodo.valor);
  recorridoInorden(nodo.derecha, resultado);
  return resultado;
}

function mostrarMenuArbol() {
  escribir('\n===== ÁRBOL BINARIO DE BÚSQUEDA =====');
  const valores = recorridoInorden(raizArbol).map(String);
  escribir(`Recorrido inorden: ${valores.length ? representarLista(valores) : 'árbol vacío'}`);
  escribir('1. Insertar número');
  escribir('2. Buscar número');
  escribir('0. Volver');
  establecerPrompt('Seleccione:', 'arbol');
}

function mostrarMenuDespuesDeAccion() {
  if (estadoEntrada.startsWith('lista')) mostrarMenuLista();
  else if (estadoEntrada.startsWith('pila')) mostrarMenuPila();
  else if (estadoEntrada.startsWith('cola')) mostrarMenuCola();
  else if (estadoEntrada.startsWith('arbol')) mostrarMenuArbol();
  else mostrarMenuPrincipal();
}

function procesarMenuPrincipal(valor) {
  switch (valor) {
    case '1':
      pedirEntrada('Ingrese el nombre del libro:', 'agregar-libro', true);
      break;
    case '2':
      mostrarLibros();
      mostrarMenuPrincipal();
      break;
    case '3':
      pedirEntrada('Ingrese el nombre a buscar:', 'buscar-libro', true);
      break;
    case '4':
      libros.sort();
      escribir('\nLibros ordenados alfabéticamente:');
      mostrarLibros();
      mostrarMenuPrincipal();
      break;
    case '5':
      mostrarVector();
      mostrarMenuPrincipal();
      break;
    case '6':
      mostrarMatriz();
      mostrarMenuPrincipal();
      break;
    case '7':
      pedirEntrada('Ingrese el título exacto a buscar:', 'busqueda-lineal', true);
      break;
    case '8':
      pedirEntrada('Ingrese el título exacto a buscar:', 'busqueda-binaria', true);
      break;
    case '9':
      mostrarMenuLista();
      break;
    case '10':
      mostrarMenuPila();
      break;
    case '11':
      mostrarMenuCola();
      break;
    case '12':
      pedirEntrada('Ingrese un entero entre 0 y 12 para calcular su factorial:', 'factorial', true);
      break;
    case '13':
      mostrarMenuArbol();
      break;
    case '0':
      escribir('Saliendo...');
      establecerPrompt('', 'finalizado');
      break;
    default:
      escribir('Opción inválida.', 'warning-line');
      mostrarMenuPrincipal();
  }
}

function procesarEntrada(valor) {
  switch (estadoEntrada) {
    case 'menu':
      procesarMenuPrincipal(valor);
      break;
    case 'agregar-libro':
      agregarLibro(valor, mostrarMenuPrincipal);
      break;
    case 'buscar-libro':
      buscarLibro(valor);
      mostrarMenuPrincipal();
      break;
    case 'busqueda-lineal': {
      const resultado = buscarLineal(valor);
      escribir(resultado !== -1 ? `Encontrado en posición ${resultado}` : 'No encontrado',
        resultado !== -1 ? 'success-line' : 'warning-line');
      mostrarMenuPrincipal();
      break;
    }
    case 'busqueda-binaria': {
      const resultado = buscarBinaria(valor);
      escribir(
        resultado !== -1 ? `Encontrado en posición ${resultado} (lista ordenada)` : 'No encontrado',
        resultado !== -1 ? 'success-line' : 'warning-line'
      );
      mostrarMenuPrincipal();
      break;
    }
    case 'lista':
      if (valor === '1') pedirEntrada('Ingrese el nombre del libro:', 'lista-agregar', true);
      else if (valor === '2') {
        const titulo = libros.shift();
        escribir(titulo ? `Se quitó "${titulo}".` : 'La lista está vacía.');
        mostrarMenuLista();
      } else if (valor === '0') mostrarMenuPrincipal();
      else {
        escribir('Opción inválida.', 'warning-line');
        mostrarMenuLista();
      }
      break;
    case 'lista-agregar':
      agregarLibro(valor, mostrarMenuLista);
      break;
    case 'pila':
      if (valor === '1') pedirEntrada('Ingrese el elemento:', 'pila-apilar');
      else if (valor === '2') {
        const elemento = pila.pop();
        escribir(elemento ? `Salió de la cima: ${elemento}` : 'La pila está vacía.');
        mostrarMenuPila();
      } else if (valor === '0') mostrarMenuPrincipal();
      else {
        escribir('Opción inválida.', 'warning-line');
        mostrarMenuPila();
      }
      break;
    case 'pila-apilar':
      if (valor) pila.push(valor);
      else escribir('El elemento no puede estar vacío.', 'warning-line');
      mostrarMenuPila();
      break;
    case 'cola':
      if (valor === '1') pedirEntrada('Ingrese el elemento:', 'cola-encolar');
      else if (valor === '2') {
        const elemento = inicioCola < cola.length ? cola[inicioCola++] : null;
        if (inicioCola === cola.length) {
          cola = [];
          inicioCola = 0;
        }
        escribir(elemento ? `Salió de la cola: ${elemento}` : 'La cola está vacía.');
        mostrarMenuCola();
      } else if (valor === '0') mostrarMenuPrincipal();
      else {
        escribir('Opción inválida.', 'warning-line');
        mostrarMenuCola();
      }
      break;
    case 'cola-encolar':
      if (valor) cola.push(valor);
      else escribir('El elemento no puede estar vacío.', 'warning-line');
      mostrarMenuCola();
      break;
    case 'factorial': {
      const numero = leerEntero(valor);
      if (numero === null) {
        escribir('Ingrese un número entero válido.', 'warning-line');
      } else if (numero < 0n || numero > 12n) {
        escribir('El número debe estar entre 0 y 12.', 'warning-line');
      } else {
        escribir(`${numero}! = ${factorialRecursivo(numero)}`, 'success-line');
      }
      mostrarMenuPrincipal();
      break;
    }
    case 'arbol':
      if (valor === '1') pedirEntrada('Ingrese el número:', 'arbol-insertar');
      else if (valor === '2') pedirEntrada('Ingrese el número a buscar:', 'arbol-buscar');
      else if (valor === '0') mostrarMenuPrincipal();
      else {
        escribir('Opción inválida.', 'warning-line');
        mostrarMenuArbol();
      }
      break;
    case 'arbol-insertar': {
      const numero = leerEntero(valor);
      if (numero === null) {
        escribir('Ingrese un número entero válido.', 'warning-line');
      } else if (contieneArbol(raizArbol, numero)) {
        escribir(`${numero} ya existe; no se permiten duplicados.`);
      } else {
        raizArbol = insertarArbol(raizArbol, numero);
        escribir(`Se insertó ${numero}.`, 'success-line');
      }
      mostrarMenuArbol();
      break;
    }
    case 'arbol-buscar': {
      const numero = leerEntero(valor);
      if (numero === null) {
        escribir('Ingrese un número entero válido.', 'warning-line');
      } else {
        escribir(
          contieneArbol(raizArbol, numero)
            ? `${numero} está en el árbol.`
            : `${numero} no está en el árbol.`
        );
      }
      mostrarMenuArbol();
      break;
    }
    default:
      mostrarMenuPrincipal();
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (estadoEntrada === 'finalizado') return;
  const entrada = input.value.trim();
  escribir(`${textoPrompt} ${input.value}`, 'command-line');
  input.value = '';
  procesarEntrada(entrada);
  if (!input.disabled) input.focus();
});

restartButton.addEventListener('click', () => {
  libros = [...DEFAULT_BOOKS];
  pila = [];
  cola = [];
  inicioCola = 0;
  raizArbol = null;
  terminal.replaceChildren();
  mostrarMenuPrincipal();
});

mostrarMenuPrincipal();
