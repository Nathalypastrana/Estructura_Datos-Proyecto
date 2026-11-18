"""Biblioteca Inteligente - menú de consola.

Ejecutar:  python3 biblioteca_inteligente/main.py
"""

from biblioteca import crear_biblioteca_demo
from estructuras import normalizar

biblioteca = crear_biblioteca_demo()


# ------------------------------------------------------------- utilidades
def leer_texto(mensaje):
    return input(mensaje).strip()


def leer_entero(mensaje):
    try:
        return int(input(mensaje).strip())
    except ValueError:
        print("Ingrese un número entero válido.")
        return None


def elegir_libro(mensaje="Código del libro (ej. LIB-001): "):
    """Pide un código y devuelve el Libro (o None) usando el Hash Map."""
    codigo = leer_texto(mensaje)
    libro, _ = biblioteca.buscar_por_codigo(codigo)
    if libro is None:
        print("No existe un libro con ese código.")
    return libro


def titulo_menu(texto):
    print(f"\n===== {texto} =====")


# ------------------------------------------------- 1-4: registro y consulta
def registrar_libro():
    titulo_menu("REGISTRAR LIBRO")
    titulo = leer_texto("Título: ")
    autor = leer_texto("Autor: ")
    genero = leer_texto("Género (Novela, Fábula, Ciencia ficción...): ")
    anio = leer_entero("Año de publicación: ")
    paginas = leer_entero("Número de páginas: ")
    if anio is None or paginas is None:
        return
    try:
        libro = biblioteca.registrar(titulo, autor, genero, anio, paginas)
    except ValueError as error:
        print(f"No se pudo registrar: {error}")
        return
    fila, col = biblioteca.ubicacion(libro.codigo)
    print(f"Libro registrado con código {libro.codigo}. "
          f"Estante {fila}, posición {col}.")
    relacionados = biblioteca.recomendaciones_bfs(libro.codigo)
    if relacionados:
        print(f"Quedó relacionado con {len(relacionados)} libro(s) del catálogo.")


def mostrar_libros():
    titulo_menu("CATÁLOGO DE LA BIBLIOTECA")
    if not len(biblioteca.catalogo):
        print("No hay libros registrados.")
        return
    for i, libro in enumerate(biblioteca.catalogo, start=1):
        print(f"{i}. {libro}")


def buscar_libro():
    titulo_menu("BUSCAR LIBRO (título, autor o género)")
    termino = leer_texto("Texto a buscar: ")
    if not termino:
        print("Escriba algo para buscar.")
        return
    resultados = biblioteca.buscar_texto(termino)
    if not resultados:
        print("No se encontró ningún libro.")
    for libro in resultados:
        print(f"- {libro}")


def ordenar_libros():
    titulo_menu("ORDENAR CATÁLOGO (merge sort)")
    print("1. Por título   2. Por autor   3. Por año   4. Por páginas")
    criterio = {"1": "titulo", "2": "autor", "3": "anio", "4": "paginas"}.get(
        leer_texto("Seleccione: "))
    if criterio is None:
        print("Opción inválida.")
        return
    for i, libro in enumerate(biblioteca.ordenar(criterio), start=1):
        print(f"{i}. {libro}")


# --------------------------------------------------- 5-6: vector y matriz
def trabajar_con_vectores():
    titulo_menu("VECTORES: ESTADÍSTICAS DEL CATÁLOGO")
    est = biblioteca.estadisticas()
    if est is None:
        print("No hay libros registrados.")
        return
    print(f"Vector de años de publicación: {est['anios']}")
    print(f"Vector de páginas:             {est['paginas']}")
    print(f"Libro más antiguo:  {est['mas_antiguo'].titulo} ({est['mas_antiguo'].anio})")
    print(f"Libro más reciente: {est['mas_reciente'].titulo} ({est['mas_reciente'].anio})")
    print(f"Libro más extenso:  {est['mas_largo'].titulo} ({est['mas_largo'].paginas} págs.)")
    print(f"Año promedio: {est['promedio_anio']:.0f} · "
          f"Páginas promedio: {est['promedio_paginas']:.0f}")


def trabajar_con_matrices():
    titulo_menu("MATRIZ: ESTANTERÍA (filas = estantes, columnas = posiciones)")
    for linea in biblioteca.matriz_estanteria():
        print(linea)
    if leer_texto("¿Ubicar un libro? (s/n): ").lower() != "s":
        return
    libro = elegir_libro()
    if libro:
        fila, col = biblioteca.ubicacion(libro.codigo)
        print(f'"{libro.titulo}" está en el estante {fila}, posición {col}.')


# ------------------------------------------------ 7-9: búsquedas
def busqueda_lineal():
    titulo_menu("BÚSQUEDA LINEAL (por título exacto)")
    titulo = leer_texto("Título: ")
    pos, comparaciones = biblioteca.busqueda_lineal(titulo)
    if pos == -1:
        print(f"No encontrado ({comparaciones} comparaciones).")
    else:
        libro = list(biblioteca.catalogo)[pos]
        print(f"Encontrado en la posición {pos + 1} del catálogo tras "
              f"{comparaciones} comparación(es):\n  {libro}")


def busqueda_binaria():
    titulo_menu("BÚSQUEDA BINARIA (catálogo ordenado por título)")
    titulo = leer_texto("Título: ")
    libro, pos, pasos, vector = biblioteca.busqueda_binaria(titulo)
    if libro is None:
        print(f"No encontrado ({pasos} paso(s) sobre {len(vector)} libros).")
    else:
        print(f"Encontrado en la posición {pos + 1} del vector ordenado tras "
              f"{pasos} paso(s) de {len(vector)} libros:\n  {libro}")


def busqueda_hash():
    titulo_menu("HASH MAP: BÚSQUEDA INSTANTÁNEA POR CÓDIGO")
    codigo = leer_texto("Código (ej. LIB-003): ")
    libro, cubeta = biblioteca.buscar_por_codigo(codigo)
    print(f"Cubeta consultada: {cubeta} (de {len(biblioteca.por_codigo)} libros indexados)")
    print(libro if libro else "No existe ese código.")


# -------------------------------------------- 10: lista enlazada (catálogo)
def gestionar_lista_enlazada():
    while True:
        titulo_menu("CATÁLOGO (LISTA ENLAZADA)")
        print(f"Libros en la lista: {len(biblioteca.catalogo)}")
        print("1. Mostrar catálogo en orden de ingreso")
        print("2. Registrar libro (agrega al final)")
        print("3. Dar de baja un libro")
        print("0. Volver")
        opcion = leer_texto("Seleccione: ")
        if opcion == "1":
            partes = [l.titulo for l in biblioteca.catalogo]
            print((" → ".join(partes) + " → None") if partes else "Lista vacía.")
        elif opcion == "2":
            registrar_libro()
        elif opcion == "3":
            libro = elegir_libro()
            if libro:
                try:
                    biblioteca.dar_de_baja(libro.codigo)
                    print(f'Se dio de baja "{libro.titulo}".')
                except ValueError as error:
                    print(error)
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


# ------------------------------------- 11-12: pila y cola (préstamos)
def prestar_libro():
    titulo_menu("PRESTAR LIBRO")
    libro = elegir_libro()
    if not libro:
        return
    usuario = leer_texto("Nombre del lector: ")
    try:
        estado, posicion = biblioteca.prestar(libro.codigo, usuario)
    except ValueError as error:
        print(error)
        return
    if estado == "prestado":
        print(f'"{libro.titulo}" prestado a {usuario}.')
    else:
        print(f'"{libro.titulo}" está prestado. {usuario} quedó en la lista '
              f"de espera (posición {posicion}).")


def devolver_libro():
    titulo_menu("DEVOLVER LIBRO")
    libro = elegir_libro()
    if not libro:
        return
    try:
        quien, siguiente = biblioteca.devolver(libro.codigo)
    except ValueError as error:
        print(error)
        return
    print(f'{quien} devolvió "{libro.titulo}".')
    if siguiente:
        print(f"Se le entregó de inmediato a {siguiente} (primero en la cola de espera).")
    else:
        print("Sin lista de espera: el libro va al carrito de devoluciones (pila).")


def gestionar_pila():
    while True:
        titulo_menu("CARRITO DE DEVOLUCIONES (PILA - LIFO)")
        pendientes = [l.titulo for l in biblioteca.devoluciones]
        print("Pendientes de reacomodar (la cima primero): "
              f"{pendientes if pendientes else 'carrito vacío'}")
        print("1. Reacomodar el último libro devuelto (desapilar)")
        print("2. Devolver un libro (apilar)")
        print("0. Volver")
        opcion = leer_texto("Seleccione: ")
        if opcion == "1":
            libro, ubicacion = biblioteca.reacomodar()
            if libro is None:
                print("El carrito está vacío.")
            else:
                print(f'Reacomode "{libro.titulo}" en el estante {ubicacion[0]}, '
                      f"posición {ubicacion[1]}.")
        elif opcion == "2":
            devolver_libro()
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


def gestionar_cola():
    while True:
        titulo_menu("LISTA DE ESPERA DE UN LIBRO (COLA - FIFO)")
        print("1. Ver la lista de espera de un libro")
        print("2. Anotarse / prestar un libro (encolar)")
        print("3. Devolver un libro (el primero en espera lo recibe)")
        print("0. Volver")
        opcion = leer_texto("Seleccione: ")
        if opcion == "1":
            libro = elegir_libro()
            if libro:
                espera = biblioteca.esperas.obtener(libro.codigo)
                actual = biblioteca.prestamos.obtener(libro.codigo)
                print(f'"{libro.titulo}" - prestado a: {actual or "nadie (disponible)"}')
                if len(espera):
                    for i, usuario in enumerate(espera, start=1):
                        print(f"  {i}. {usuario}")
                else:
                    print("  Nadie en espera.")
        elif opcion == "2":
            prestar_libro()
        elif opcion == "3":
            devolver_libro()
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


# ----------------------------------------------------- 13: recursividad
def trabajar_con_recursividad():
    titulo_menu("RECURSIVIDAD APLICADA A LA BIBLIOTECA")
    total = len(biblioteca.catalogo)
    print(f"Libros disponibles (conteo recursivo en la lista): "
          f"{biblioteca.contar_disponibles()} de {total}")
    print(f"Total de páginas del catálogo (suma recursiva): {biblioteca.total_paginas()}")
    genero = leer_texto("Género a contar (Enter para omitir): ")
    if genero:
        print(f"Libros de '{genero}' (conteo recursivo): {biblioteca.contar_genero(genero)}")
    n = leer_entero(f"¿Cuántos libros quieres leer? (1 a {min(total, 15)}) para saber "
                    "de cuántas formas podrías ordenar tu lectura: ")
    if n is None:
        return
    if not 1 <= n <= min(total, 15):
        print(f"Debe estar entre 1 y {min(total, 15)}.")
        return
    print(f"{n} libros se pueden leer en {biblioteca.ordenes_de_lectura(n):,} órdenes "
          f"distintos ({n}! factorial recursivo).")


# ------------------------------------------------------- 14-15: árboles
def gestionar_arbol_categorias():
    titulo_menu("ÁRBOL DE CATEGORÍAS (género → autor → libro)")
    for linea in biblioteca.categorias.lineas():
        print(linea)
    print(f"\nTotal de libros en el árbol: {biblioteca.categorias.contar_hojas()}"
          "  (✔ disponible, ✘ prestado)")


def gestionar_arbol_binario():
    while True:
        titulo_menu("ÍNDICE DE TÍTULOS (ÁRBOL BINARIO DE BÚSQUEDA)")
        print(f"Títulos indexados: {len(biblioteca.indice_titulos)} · "
              f"Altura del árbol: {biblioteca.indice_titulos.altura()}")
        print("1. Mostrar títulos en orden alfabético (recorrido inorden)")
        print("2. Buscar un título exacto")
        print("3. Autocompletar por prefijo")
        print("0. Volver")
        opcion = leer_texto("Seleccione: ")
        if opcion == "1":
            for i, libro in enumerate(biblioteca.indice_titulos.inorden(), start=1):
                print(f"{i}. {libro.titulo} ({libro.autor})")
        elif opcion == "2":
            titulo = leer_texto("Título: ")
            libro, pasos = biblioteca.indice_titulos.buscar(normalizar(titulo))
            print(f"{libro}  [{pasos} paso(s) en el árbol]" if libro
                  else f"No encontrado ({pasos} paso(s)).")
        elif opcion == "3":
            prefijo = normalizar(leer_texto("Prefijo: "))
            coincidencias = biblioteca.indice_titulos.con_prefijo(prefijo) if prefijo else []
            if not coincidencias:
                print("Sin coincidencias.")
            for _, libro in coincidencias:
                print(f"- {libro.titulo} ({libro.autor})")
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


# ------------------------------------------------------ 16-17: grafo
def mostrar_grafo():
    titulo_menu("GRAFO DE LIBROS RELACIONADOS")
    for libro in biblioteca.catalogo:
        vecinos = [biblioteca.por_codigo.obtener(v)
                   for v in biblioteca.relaciones.vecinos(libro.codigo)]
        print(f"\n{libro.titulo} ({libro.codigo}) se relaciona con {len(vecinos)}:")
        for otro in vecinos:
            print(f"   - {otro.titulo}  [{biblioteca.motivo_relacion(libro, otro)}]")


def recorrer_grafo():
    titulo_menu("RECOMENDACIONES (BFS) Y EXPLORACIÓN (DFS)")
    libro = elegir_libro("Código del libro que te gustó: ")
    if not libro:
        return
    print(f'\nBFS - recomendaciones desde "{libro.titulo}" (de más cerca a más lejos):')
    recomendados = biblioteca.recomendaciones_bfs(libro.codigo)
    if not recomendados:
        print("   Este libro todavía no tiene relaciones.")
    for otro, distancia in recomendados:
        print(f"   Nivel {distancia}: {otro.titulo} ({otro.autor})")
    print(f'\nDFS - exploración en profundidad desde "{libro.titulo}":')
    print("   " + " → ".join(l.titulo for l in biblioteca.exploracion_dfs(libro.codigo)))


# ---------------------------------------------------------------- menú
OPCIONES = [
    ("Registrar libro", registrar_libro),
    ("Mostrar catálogo", mostrar_libros),
    ("Buscar libro (título, autor, género)", buscar_libro),
    ("Ordenar catálogo (merge sort)", ordenar_libros),
    ("Vectores: estadísticas del catálogo", trabajar_con_vectores),
    ("Matrices: estantería", trabajar_con_matrices),
    ("Búsqueda lineal por título", busqueda_lineal),
    ("Búsqueda binaria por título", busqueda_binaria),
    ("Hash Map: búsqueda por código", busqueda_hash),
    ("Lista enlazada: catálogo / dar de baja", gestionar_lista_enlazada),
    ("Pila: carrito de devoluciones", gestionar_pila),
    ("Cola: lista de espera de préstamos", gestionar_cola),
    ("Recursividad: conteos y órdenes de lectura", trabajar_con_recursividad),
    ("Árbol: categorías (género → autor → libro)", gestionar_arbol_categorias),
    ("Árbol binario de búsqueda: índice de títulos", gestionar_arbol_binario),
    ("Grafo: libros relacionados", mostrar_grafo),
    ("BFS y DFS: recomendaciones", recorrer_grafo),
    ("Prestar libro", prestar_libro),
    ("Devolver libro", devolver_libro),
]


def main():
    while True:
        print("\n===== BIBLIOTECA INTELIGENTE =====")
        for i, (texto, _) in enumerate(OPCIONES, start=1):
            print(f"{i}. {texto}")
        print("0. Salir")
        try:
            opcion = leer_texto("Seleccione: ")
        except (EOFError, KeyboardInterrupt):
            print("\nSaliendo...")
            break
        if opcion == "0":
            print("Saliendo...")
            break
        if opcion.isdigit() and 1 <= int(opcion) <= len(OPCIONES):
            try:
                OPCIONES[int(opcion) - 1][1]()
            except (EOFError, KeyboardInterrupt):
                print("\nOperación cancelada.")
        else:
            print("Opción inválida.")


if __name__ == "__main__":
    main()
