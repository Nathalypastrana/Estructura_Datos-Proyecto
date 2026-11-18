"""Estructuras de datos propias usadas por la Biblioteca Inteligente.

Cada estructura es genérica; en biblioteca.py se aplica a un problema real
de una biblioteca (catálogo, índices, préstamos, categorías, recomendaciones).
"""

import unicodedata
from collections import deque
from dataclasses import dataclass


def normalizar(texto):
    """Minúsculas y sin tildes, para comparar títulos/autores de forma justa."""
    descompuesto = unicodedata.normalize("NFD", str(texto))
    sin_tildes = "".join(c for c in descompuesto if unicodedata.category(c) != "Mn")
    return sin_tildes.casefold().strip()


@dataclass
class Libro:
    codigo: str
    titulo: str
    autor: str
    genero: str
    anio: int
    paginas: int
    disponible: bool = True

    def __str__(self):
        estado = "Disponible" if self.disponible else "Prestado"
        return (f"[{self.codigo}] {self.titulo} - {self.autor} "
                f"({self.genero}, {self.anio}, {self.paginas} págs.) · {estado}")


# ---------------------------------------------------------------- Ordenamiento
def merge_sort(vector, clave=lambda x: x):
    """Ordenamiento por mezcla (recursivo y estable). Devuelve una lista nueva."""
    if len(vector) <= 1:
        return list(vector)
    medio = len(vector) // 2
    izquierda = merge_sort(vector[:medio], clave)
    derecha = merge_sort(vector[medio:], clave)
    resultado, i, j = [], 0, 0
    while i < len(izquierda) and j < len(derecha):
        if clave(izquierda[i]) <= clave(derecha[j]):
            resultado.append(izquierda[i])
            i += 1
        else:
            resultado.append(derecha[j])
            j += 1
    resultado.extend(izquierda[i:])
    resultado.extend(derecha[j:])
    return resultado


# ---------------------------------------------------------- Lista enlazada
class NodoLista:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None


class ListaEnlazada:
    """Lista simplemente enlazada con referencia a la cabeza y a la cola."""

    def __init__(self):
        self.cabeza = None
        self.cola = None
        self.tamano = 0

    def __iter__(self):
        actual = self.cabeza
        while actual is not None:
            yield actual.dato
            actual = actual.siguiente

    def __len__(self):
        return self.tamano

    def agregar_final(self, dato):
        nodo = NodoLista(dato)
        if self.cabeza is None:
            self.cabeza = nodo
        else:
            self.cola.siguiente = nodo
        self.cola = nodo
        self.tamano += 1

    def eliminar_si(self, predicado):
        """Elimina el primer nodo cuyo dato cumple el predicado. Devuelve el dato."""
        anterior, actual = None, self.cabeza
        while actual is not None:
            if predicado(actual.dato):
                if anterior is None:
                    self.cabeza = actual.siguiente
                else:
                    anterior.siguiente = actual.siguiente
                if actual is self.cola:
                    self.cola = anterior
                self.tamano -= 1
                return actual.dato
            anterior, actual = actual, actual.siguiente
        return None

    def contar_recursivo(self, predicado, nodo="inicio"):
        """Cuenta los elementos que cumplen el predicado usando recursividad."""
        if nodo == "inicio":
            nodo = self.cabeza
        if nodo is None:
            return 0
        suma = 1 if predicado(nodo.dato) else 0
        return suma + self.contar_recursivo(predicado, nodo.siguiente)

    def sumar_recursivo(self, funcion, nodo="inicio"):
        """Suma funcion(dato) de todos los elementos usando recursividad."""
        if nodo == "inicio":
            nodo = self.cabeza
        if nodo is None:
            return 0
        return funcion(nodo.dato) + self.sumar_recursivo(funcion, nodo.siguiente)


# ----------------------------------------------------------------- Hash Map
class TablaHash:
    """Mapa clave -> valor con encadenamiento (cada cubeta es una lista)."""

    def __init__(self, capacidad=8):
        self._cubetas = [[] for _ in range(capacidad)]
        self._tamano = 0

    def __len__(self):
        return self._tamano

    def __contains__(self, clave):
        return self.obtener(clave) is not None

    @staticmethod
    def _hash(clave, capacidad):
        h = 0
        for caracter in str(clave):
            h = (h * 31 + ord(caracter)) % 1_000_000_007
        return h % capacidad

    def indice_de(self, clave):
        """Número de cubeta donde vive (o viviría) la clave."""
        return self._hash(clave, len(self._cubetas))

    def poner(self, clave, valor):
        cubeta = self._cubetas[self.indice_de(clave)]
        for i, (k, _) in enumerate(cubeta):
            if k == clave:
                cubeta[i] = (clave, valor)
                return
        cubeta.append((clave, valor))
        self._tamano += 1
        if self._tamano > 0.75 * len(self._cubetas):
            self._redimensionar()

    def obtener(self, clave, defecto=None):
        for k, v in self._cubetas[self.indice_de(clave)]:
            if k == clave:
                return v
        return defecto

    def eliminar(self, clave):
        cubeta = self._cubetas[self.indice_de(clave)]
        for i, (k, v) in enumerate(cubeta):
            if k == clave:
                del cubeta[i]
                self._tamano -= 1
                return v
        return None

    def items(self):
        for cubeta in self._cubetas:
            yield from cubeta

    def _redimensionar(self):
        viejas = self._cubetas
        self._cubetas = [[] for _ in range(len(viejas) * 2)]
        self._tamano = 0
        for cubeta in viejas:
            for k, v in cubeta:
                self.poner(k, v)


# --------------------------------------------------------------- Pila y cola
class Pila:
    """LIFO: el último en entrar es el primero en salir."""

    def __init__(self):
        self._elementos = []

    def __len__(self):
        return len(self._elementos)

    def __iter__(self):
        """Recorre desde la cima hacia el fondo."""
        return iter(reversed(self._elementos))

    def apilar(self, elemento):
        self._elementos.append(elemento)

    def desapilar(self):
        return self._elementos.pop() if self._elementos else None

    def cima(self):
        return self._elementos[-1] if self._elementos else None

    def quitar_si(self, predicado):
        self._elementos = [e for e in self._elementos if not predicado(e)]


class Cola:
    """FIFO: el primero en entrar es el primero en salir."""

    def __init__(self):
        self._elementos = deque()

    def __len__(self):
        return len(self._elementos)

    def __iter__(self):
        return iter(self._elementos)

    def encolar(self, elemento):
        self._elementos.append(elemento)

    def desencolar(self):
        return self._elementos.popleft() if self._elementos else None

    def frente(self):
        return self._elementos[0] if self._elementos else None


# ------------------------------------------------------------------- Árboles
class NodoCategoria:
    def __init__(self, nombre, libro=None):
        self.nombre = nombre
        self.libro = libro          # solo las hojas guardan un libro
        self.hijos = {}


class ArbolCategorias:
    """Árbol general: raíz -> género -> autor -> libro."""

    def __init__(self, nombre="Biblioteca"):
        self.raiz = NodoCategoria(nombre)

    def insertar(self, ruta, libro):
        nodo = self.raiz
        for nombre in ruta:
            nodo = nodo.hijos.setdefault(nombre, NodoCategoria(nombre))
        nodo.libro = libro

    def lineas(self, nodo=None, nivel=0):
        """Dibuja el árbol con sangría (recorrido preorden recursivo)."""
        nodo = nodo or self.raiz
        etiqueta = nodo.nombre
        if nodo.libro is not None:
            marca = "✔" if nodo.libro.disponible else "✘"
            etiqueta += f"  ({nodo.libro.anio}) {marca}"
        resultado = ["    " * nivel + ("└─ " if nivel else "") + etiqueta]
        for nombre in sorted(nodo.hijos, key=normalizar):
            resultado.extend(self.lineas(nodo.hijos[nombre], nivel + 1))
        return resultado

    def contar_hojas(self, nodo=None):
        nodo = nodo or self.raiz
        if not nodo.hijos:
            return 1 if nodo.libro is not None else 0
        return sum(self.contar_hojas(h) for h in nodo.hijos.values())


class NodoABB:
    def __init__(self, clave, valor):
        self.clave = clave
        self.valor = valor
        self.izquierda = None
        self.derecha = None


class ArbolBinarioBusqueda:
    """ABB indexado por una clave (aquí: título normalizado)."""

    def __init__(self):
        self.raiz = None
        self.tamano = 0

    def __len__(self):
        return self.tamano

    def insertar(self, clave, valor):
        """Devuelve False si la clave ya existía (no se permiten duplicados)."""
        self.raiz, agregado = self._insertar(self.raiz, clave, valor)
        if agregado:
            self.tamano += 1
        return agregado

    def _insertar(self, nodo, clave, valor):
        if nodo is None:
            return NodoABB(clave, valor), True
        if clave < nodo.clave:
            nodo.izquierda, agregado = self._insertar(nodo.izquierda, clave, valor)
        elif clave > nodo.clave:
            nodo.derecha, agregado = self._insertar(nodo.derecha, clave, valor)
        else:
            return nodo, False
        return nodo, agregado

    def buscar(self, clave):
        """Devuelve (valor, pasos). valor es None si no existe."""
        nodo, pasos = self.raiz, 0
        while nodo is not None:
            pasos += 1
            if clave == nodo.clave:
                return nodo.valor, pasos
            nodo = nodo.izquierda if clave < nodo.clave else nodo.derecha
        return None, pasos

    def inorden(self):
        """Valores en orden ascendente de clave."""
        resultado = []
        self._inorden(self.raiz, resultado)
        return resultado

    def _inorden(self, nodo, resultado):
        if nodo is None:
            return
        self._inorden(nodo.izquierda, resultado)
        resultado.append(nodo.valor)
        self._inorden(nodo.derecha, resultado)

    def altura(self, nodo="raiz"):
        if nodo == "raiz":
            nodo = self.raiz
        if nodo is None:
            return 0
        return 1 + max(self.altura(nodo.izquierda), self.altura(nodo.derecha))

    def con_prefijo(self, prefijo):
        """Valores cuya clave empieza por el prefijo (autocompletado)."""
        return [v for v in self.inorden_claves() if v[0].startswith(prefijo)]

    def inorden_claves(self):
        resultado = []

        def recorrer(nodo):
            if nodo is None:
                return
            recorrer(nodo.izquierda)
            resultado.append((nodo.clave, nodo.valor))
            recorrer(nodo.derecha)

        recorrer(self.raiz)
        return resultado


# --------------------------------------------------------------------- Grafo
class Grafo:
    """Grafo no dirigido con listas de adyacencia."""

    def __init__(self):
        self.adyacencia = {}

    def agregar_vertice(self, v):
        self.adyacencia.setdefault(v, [])

    def agregar_arista(self, a, b):
        self.agregar_vertice(a)
        self.agregar_vertice(b)
        if b not in self.adyacencia[a]:
            self.adyacencia[a].append(b)
            self.adyacencia[b].append(a)

    def vecinos(self, v):
        return self.adyacencia.get(v, [])

    def bfs(self, inicio):
        """Recorrido en anchura. Devuelve [(vertice, distancia), ...]."""
        if inicio not in self.adyacencia:
            return []
        visitados = {inicio}
        cola = deque([(inicio, 0)])
        orden = []
        while cola:
            vertice, nivel = cola.popleft()
            orden.append((vertice, nivel))
            for vecino in self.adyacencia[vertice]:
                if vecino not in visitados:
                    visitados.add(vecino)
                    cola.append((vecino, nivel + 1))
        return orden

    def dfs(self, inicio):
        """Recorrido en profundidad (recursivo). Devuelve la lista de vértices."""
        orden, visitados = [], set()

        def visitar(v):
            visitados.add(v)
            orden.append(v)
            for vecino in self.adyacencia[v]:
                if vecino not in visitados:
                    visitar(vecino)

        if inicio in self.adyacencia:
            visitar(inicio)
        return orden
