"""Lógica de la Biblioteca Inteligente.

Cada estructura de datos resuelve un problema concreto de la biblioteca:

  Lista enlazada ........ catálogo principal de libros
  Hash Map .............. búsqueda instantánea por código; estado de préstamos
  Vectores .............. estadísticas (años, páginas) y ordenamientos
  Matriz ................ estantería física (filas x posiciones)
  Pila (LIFO) ........... carrito de devoluciones por reacomodar
  Cola (FIFO) ........... lista de espera de un libro prestado
  Árbol general ......... clasificación género -> autor -> libro
  Árbol binario búsqueda  índice de títulos (orden alfabético, autocompletado)
  Grafo + BFS / DFS ..... libros relacionados y recomendaciones
  Recursividad .......... conteos, sumas, merge sort, DFS, órdenes de lectura
"""

from datetime import date

from estructuras import (
    ArbolBinarioBusqueda, ArbolCategorias, Cola, Grafo, Libro, ListaEnlazada,
    Pila, TablaHash, merge_sort, normalizar,
)

COLUMNAS_ESTANTE = 5


class Biblioteca:
    def __init__(self):
        self.catalogo = ListaEnlazada()          # lista enlazada de Libro
        self.por_codigo = TablaHash()            # hash: codigo -> Libro
        self.indice_titulos = ArbolBinarioBusqueda()
        self.categorias = ArbolCategorias()
        self.relaciones = Grafo()
        self.estanteria = []                     # matriz: filas x COLUMNAS_ESTANTE
        self.devoluciones = Pila()               # carrito de devoluciones
        self.esperas = TablaHash()               # codigo -> Cola de usuarios
        self.prestamos = TablaHash()             # codigo -> usuario actual
        self._contador = 0

    # ------------------------------------------------------------ registro
    def registrar(self, titulo, autor, genero, anio, paginas):
        titulo, autor, genero = titulo.strip(), autor.strip(), genero.strip()
        if not titulo or not autor or not genero:
            raise ValueError("Título, autor y género no pueden estar vacíos.")
        if not 1 <= anio <= date.today().year:
            raise ValueError(f"El año debe estar entre 1 y {date.today().year}.")
        if paginas <= 0:
            raise ValueError("El número de páginas debe ser mayor que cero.")
        for libro in self.catalogo:
            if normalizar(libro.titulo) == normalizar(titulo) and \
               normalizar(libro.autor) == normalizar(autor):
                raise ValueError("Ese libro ya está registrado.")

        self._contador += 1
        libro = Libro(f"LIB-{self._contador:03d}", titulo, autor, genero, anio, paginas)
        self.catalogo.agregar_final(libro)
        self.por_codigo.poner(libro.codigo, libro)
        self.esperas.poner(libro.codigo, Cola())
        self._ubicar_en_estante(libro)
        self._indexar(libro)
        return libro

    def _indexar(self, libro):
        """Inserta el libro en el ABB, el árbol de categorías y el grafo."""
        self.indice_titulos.insertar(normalizar(libro.titulo), libro)
        self.categorias.insertar([libro.genero, libro.autor, libro.titulo], libro)
        self.relaciones.agregar_vertice(libro.codigo)
        for otro in self.catalogo:
            if otro is not libro and self.motivo_relacion(libro, otro):
                self.relaciones.agregar_arista(libro.codigo, otro.codigo)

    def _ubicar_en_estante(self, libro):
        for fila in self.estanteria:
            for c in range(COLUMNAS_ESTANTE):
                if fila[c] is None:
                    fila[c] = libro.codigo
                    return
        nueva = [None] * COLUMNAS_ESTANTE
        nueva[0] = libro.codigo
        self.estanteria.append(nueva)

    def _reconstruir_indices(self):
        self.indice_titulos = ArbolBinarioBusqueda()
        self.categorias = ArbolCategorias()
        self.relaciones = Grafo()
        for libro in self.catalogo:
            self._indexar(libro)

    def dar_de_baja(self, codigo):
        libro = self.por_codigo.obtener(codigo)
        if libro is None:
            raise KeyError(codigo)
        if not libro.disponible:
            raise ValueError("No se puede dar de baja un libro que está prestado.")
        self.catalogo.eliminar_si(lambda l: l.codigo == codigo)
        self.por_codigo.eliminar(codigo)
        self.esperas.eliminar(codigo)
        self.devoluciones.quitar_si(lambda l: l.codigo == codigo)
        for fila in self.estanteria:
            for c in range(COLUMNAS_ESTANTE):
                if fila[c] == codigo:
                    fila[c] = None
        self._reconstruir_indices()
        return libro

    # ----------------------------------------------------------- búsquedas
    def buscar_texto(self, termino):
        """Búsqueda lineal parcial por título, autor o género."""
        t = normalizar(termino)
        return [l for l in self.catalogo
                if t in normalizar(l.titulo) or t in normalizar(l.autor)
                or t in normalizar(l.genero)]

    def busqueda_lineal(self, titulo):
        """Devuelve (posición o -1, comparaciones)."""
        objetivo = normalizar(titulo)
        for i, libro in enumerate(self.catalogo):
            if normalizar(libro.titulo) == objetivo:
                return i, i + 1
        return -1, len(self.catalogo)

    def vector_ordenado_por_titulo(self):
        return merge_sort(list(self.catalogo), clave=lambda l: normalizar(l.titulo))

    def busqueda_binaria(self, titulo):
        """Devuelve (libro o None, posición, pasos, vector ordenado)."""
        vector = self.vector_ordenado_por_titulo()
        objetivo = normalizar(titulo)
        izq, der, pasos = 0, len(vector) - 1, 0
        while izq <= der:
            pasos += 1
            medio = (izq + der) // 2
            actual = normalizar(vector[medio].titulo)
            if actual == objetivo:
                return vector[medio], medio, pasos, vector
            if actual < objetivo:
                izq = medio + 1
            else:
                der = medio - 1
        return None, -1, pasos, vector

    def buscar_por_codigo(self, codigo):
        """Hash Map: acceso directo. Devuelve (libro o None, cubeta)."""
        codigo = codigo.strip().upper()
        return self.por_codigo.obtener(codigo), self.por_codigo.indice_de(codigo)

    # ----------------------------------------------------------- ordenar
    CRITERIOS = {
        "titulo": lambda l: normalizar(l.titulo),
        "autor": lambda l: (normalizar(l.autor), normalizar(l.titulo)),
        "anio": lambda l: l.anio,
        "paginas": lambda l: l.paginas,
    }

    def ordenar(self, criterio):
        """Devuelve un vector ordenado con merge sort (no altera el catálogo)."""
        return merge_sort(list(self.catalogo), clave=self.CRITERIOS[criterio])

    # ----------------------------------------------------------- vectores
    def estadisticas(self):
        libros = list(self.catalogo)
        if not libros:
            return None
        anios = [l.anio for l in libros]
        paginas = [l.paginas for l in libros]
        return {
            "anios": anios,
            "paginas": paginas,
            "mas_antiguo": min(libros, key=lambda l: l.anio),
            "mas_reciente": max(libros, key=lambda l: l.anio),
            "mas_largo": max(libros, key=lambda l: l.paginas),
            "promedio_anio": sum(anios) / len(anios),
            "promedio_paginas": sum(paginas) / len(paginas),
        }

    # ------------------------------------------------------------- matriz
    def ubicacion(self, codigo):
        """(fila, columna) del libro en la estantería, base 1; None si no está."""
        for f, fila in enumerate(self.estanteria):
            for c, celda in enumerate(fila):
                if celda == codigo:
                    return f + 1, c + 1
        return None

    def matriz_estanteria(self, ancho=14):
        """Devuelve las filas de la estantería como texto de celdas fijas."""
        lineas = []
        encabezado = "         " + "".join(f"Pos {c + 1}".ljust(ancho + 1)
                                          for c in range(COLUMNAS_ESTANTE))
        lineas.append(encabezado)
        for f, fila in enumerate(self.estanteria, start=1):
            celdas = []
            for codigo in fila:
                if codigo is None:
                    texto = "(vacío)"
                else:
                    libro = self.por_codigo.obtener(codigo)
                    marca = "" if libro.disponible else "*"
                    texto = libro.titulo[:ancho - len(marca)] + marca
                celdas.append(texto.ljust(ancho))
            lineas.append(f"Estante {f}: " + " ".join(celdas))
        lineas.append("(* = prestado, el espacio queda reservado)")
        return lineas

    # ---------------------------------------------- préstamo y devolución
    def prestar(self, codigo, usuario):
        """Presta el libro o pone al usuario en la cola de espera.

        Devuelve ("prestado", 0) o ("en espera", posición en la cola)."""
        libro = self.por_codigo.obtener(codigo)
        if libro is None:
            raise KeyError(codigo)
        usuario = usuario.strip()
        if not usuario:
            raise ValueError("El nombre del usuario no puede estar vacío.")
        if libro.disponible:
            libro.disponible = False
            self.prestamos.poner(codigo, usuario)
            self.devoluciones.quitar_si(lambda l: l.codigo == codigo)
            return "prestado", 0
        espera = self.esperas.obtener(codigo)
        if normalizar(self.prestamos.obtener(codigo)) == normalizar(usuario) or \
           any(normalizar(u) == normalizar(usuario) for u in espera):
            raise ValueError(f"{usuario} ya tiene o espera este libro.")
        espera.encolar(usuario)
        return "en espera", len(espera)

    def devolver(self, codigo):
        """Registra la devolución.

        Si hay usuarios esperando, el libro pasa al primero de la cola (FIFO).
        Si no, va al carrito de devoluciones (pila) para reacomodarse.
        Devuelve (quien devolvió, siguiente usuario o None)."""
        libro = self.por_codigo.obtener(codigo)
        if libro is None:
            raise KeyError(codigo)
        if libro.disponible:
            raise ValueError("Ese libro no está prestado.")
        quien = self.prestamos.eliminar(codigo)
        siguiente = self.esperas.obtener(codigo).desencolar()
        if siguiente is not None:
            self.prestamos.poner(codigo, siguiente)
        else:
            libro.disponible = True
            self.devoluciones.apilar(libro)
        return quien, siguiente

    def reacomodar(self):
        """Saca de la pila el último libro devuelto. Devuelve (libro, ubicación)."""
        libro = self.devoluciones.desapilar()
        if libro is None:
            return None, None
        return libro, self.ubicacion(libro.codigo)

    # ------------------------------------------------- recursividad
    def contar_disponibles(self):
        return self.catalogo.contar_recursivo(lambda l: l.disponible)

    def total_paginas(self):
        return self.catalogo.sumar_recursivo(lambda l: l.paginas)

    def contar_genero(self, genero):
        g = normalizar(genero)
        return self.catalogo.contar_recursivo(lambda l: normalizar(l.genero) == g)

    @staticmethod
    def ordenes_de_lectura(n):
        """Factorial recursivo: formas de ordenar n libros para leerlos."""
        if n <= 1:
            return 1
        return n * Biblioteca.ordenes_de_lectura(n - 1)

    # ------------------------------------------------------------- grafo
    @staticmethod
    def motivo_relacion(a, b):
        motivos = []
        if normalizar(a.autor) == normalizar(b.autor):
            motivos.append("mismo autor")
        if normalizar(a.genero) == normalizar(b.genero):
            motivos.append("mismo género")
        return " y ".join(motivos)

    def recomendaciones_bfs(self, codigo):
        """Libros relacionados ordenados por cercanía: [(libro, distancia)]."""
        return [(self.por_codigo.obtener(v), d)
                for v, d in self.relaciones.bfs(codigo) if d > 0]

    def exploracion_dfs(self, codigo):
        return [self.por_codigo.obtener(v) for v in self.relaciones.dfs(codigo)]


def crear_biblioteca_demo():
    """Catálogo de ejemplo para poder probar todas las opciones."""
    b = Biblioteca()
    datos = [
        ("Cien años de soledad", "Gabriel García Márquez", "Novela", 1967, 471),
        ("El principito", "Antoine de Saint-Exupéry", "Fábula", 1943, 96),
        ("Don Quijote de la Mancha", "Miguel de Cervantes", "Novela", 1605, 863),
        ("Memorias del subsuelo", "Fiódor Dostoievski", "Novela", 1864, 136),
        ("1984", "George Orwell", "Ciencia ficción", 1949, 328),
        ("Rebelión en la granja", "George Orwell", "Fábula", 1945, 144),
        ("El amor en los tiempos del cólera", "Gabriel García Márquez", "Novela", 1985, 368),
        ("Crimen y castigo", "Fiódor Dostoievski", "Novela", 1866, 551),
        ("Fundación", "Isaac Asimov", "Ciencia ficción", 1951, 255),
        ("Yo, robot", "Isaac Asimov", "Ciencia ficción", 1950, 253),
        ("Pedro Páramo", "Juan Rulfo", "Novela", 1955, 124),
    ]
    for d in datos:
        b.registrar(*d)
    return b
