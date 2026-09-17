#LISTA LIBROS
libros = [
    "Cien años de soledad",
    "El principito",
    "Don Quijote de la Mancha",
    "Memorias del Subsuelo",
    "1984"
]

#Funciones 
def mostrar_libros():
    """Muestra los libros disponible"""
    if not libros:
        print("\nNo hay libros disponibles")
    else:
        print("\n LIBROS DISPONIBLES")
        for i, libro in enumerate(libros, start=1):
            print(f"{i}. {libro}")

def agregar_libro():
    """Agrega un nuevo libro a la lista"""
    titulo = input("\nIngrese el nombre del libro: ").strip()

    if titulo:
        libros.append(titulo)
        print(f'Libro "{titulo}" agregado correctamente.')
    else:
        print("El nombre del libro no puede estar vacio.")

def buscar_libro():
    """Busca un libro por nombre (búsqueda lineal)"""
    termino = input("\nIngrese el nombre a buscar: ").strip().lower()
    encontrado = False
    for i, libro in enumerate(libros, start=1):
        if termino in libro.lower():
            print(f"{i}. {libro}")
            encontrado = True
    if not encontrado:
        print("No se encontró ningún libro con ese nombre.")


def ordenar_libros():
    """Ordena la lista de libros alfabéticamente"""
    libros.sort()
    print("\nLibros ordenados alfabéticamente:")
    mostrar_libros()


def trabajar_con_vectores():
    """Ejemplo de manejo de un vector (arreglo unidimensional)"""
    vector = [len(libro) for libro in libros]
    print("\nVector de longitudes de los títulos:")
    print(vector)


def trabajar_con_matrices():
    """Ejemplo de manejo de una matriz (arreglo bidimensional)"""
    matriz = [[i + 1, libro] for i, libro in enumerate(libros)]
    print("\nMatriz (índice - título):")
    for fila in matriz:
        print(fila)


def busqueda_lineal(titulo):
    """Recorre la lista uno por uno hasta encontrar coincidencia exacta"""
    for i, libro in enumerate(libros):
        if libro.lower() == titulo.lower():
            return i
    return -1


def busqueda_binaria(titulo):
    """Requiere la lista ordenada. Divide el rango a la mitad en cada paso"""
    libros_ordenados = sorted(libros)
    izquierda, derecha = 0, len(libros_ordenados) - 1
    while izquierda <= derecha:
        medio = (izquierda + derecha) // 2
        if libros_ordenados[medio].lower() == titulo.lower():
            return medio
        elif libros_ordenados[medio].lower() < titulo.lower():
            izquierda = medio + 1
        else:
            derecha = medio - 1
    return -1        


#Menu de opciones 
def main():
    while True:
        print("\n===== BIBLIOTECA INTELIGENTE =====")
        print("1. Registrar libro")
        print("2. Mostrar libros")
        print("3. Buscar libro")
        print("4. Ordenar libros")
        print("5. Trabajar con vectores")
        print("6. Trabajar con matrices")
        print("7. Búsqueda lineal")
        print("8. Búsqueda binaria")
        print("0. Salir")
        opcion = input("Seleccione: ").strip()

        if opcion == "1":
            agregar_libro()
        elif opcion == "2":
            mostrar_libros()
        elif opcion == "3":
            buscar_libro()
        elif opcion == "4":
            ordenar_libros()
        elif opcion == "5":
            trabajar_con_vectores()
        elif opcion == "6":
            trabajar_con_matrices()
        elif opcion == "7":
            titulo = input("\nIngrese el título exacto a buscar: ").strip()
            resultado = busqueda_lineal(titulo)
            print(f"Encontrado en posición {resultado}" if resultado != -1 else "No encontrado")
        elif opcion == "8":
            titulo = input("\nIngrese el título exacto a buscar: ").strip()
            resultado = busqueda_binaria(titulo)
            print(f"Encontrado en posición {resultado} (lista ordenada)" if resultado != -1 else "No encontrado")
        elif opcion == "0":
            print("Saliendo...")
            break
        else:
            print("Opción inválida.")


if __name__ == "__main__":
    main()