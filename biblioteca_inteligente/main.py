#LISTA LIBROS
libros = [
    "Cien años de soledad",
    "El principito",
    "Don Quijote de la Mancha",
    "Memorias del Subsuelo",
    "1984"
]

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