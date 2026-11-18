from collections import deque


class NodoLibro:
    def __init__(self, titulo):
        self.titulo = titulo
        self.siguiente = None


class ListaSimplementeEnlazada:
    def __init__(self, titulos=()):
        self.cabeza = None
        self.cola = None
        self.tamano = 0
        for titulo in titulos:
            self.agregar_final(titulo)

    def __iter__(self):
        actual = self.cabeza
        while actual is not None:
            yield actual.titulo
            actual = actual.siguiente

    def __len__(self):
        return self.tamano

    def agregar_final(self, titulo):
        nodo = NodoLibro(titulo)
        if self.cabeza is None:
            self.cabeza = nodo
        else:
            self.cola.siguiente = nodo
        self.cola = nodo
        self.tamano += 1

    def quitar_primero(self):
        if self.cabeza is None:
            return None
        titulo = self.cabeza.titulo
        self.cabeza = self.cabeza.siguiente
        self.tamano -= 1
        if self.cabeza is None:
            self.cola = None
        return titulo

    def ordenar(self):
        titulos_ordenados = sorted(self)
        self.cabeza = None
        self.cola = None
        self.tamano = 0
        for titulo in titulos_ordenados:
            self.agregar_final(titulo)


class Pila:
    def __init__(self):
        self.elementos = []

    def apilar(self, elemento):
        self.elementos.append(elemento)

    def desapilar(self):
        return self.elementos.pop() if self.elementos else None


class Cola:
    def __init__(self):
        self.elementos = deque()

    def encolar(self, elemento):
        self.elementos.append(elemento)

    def desencolar(self):
        return self.elementos.popleft() if self.elementos else None


class NodoArbol:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None


class ArbolBinarioBusqueda:
    def __init__(self):
        self.raiz = None

    def insertar(self, valor):
        self.raiz, agregado = self._insertar(self.raiz, valor)
        return agregado

    def _insertar(self, nodo, valor):
        if nodo is None:
            return NodoArbol(valor), True
        if valor < nodo.valor:
            nodo.izquierda, agregado = self._insertar(nodo.izquierda, valor)
        elif valor > nodo.valor:
            nodo.derecha, agregado = self._insertar(nodo.derecha, valor)
        else:
            return nodo, False
        return nodo, agregado

    def contiene(self, valor):
        return self._contiene(self.raiz, valor)

    def _contiene(self, nodo, valor):
        if nodo is None:
            return False
        if valor == nodo.valor:
            return True
        if valor < nodo.valor:
            return self._contiene(nodo.izquierda, valor)
        return self._contiene(nodo.derecha, valor)

    def recorrido_inorden(self):
        valores = []
        self._recorrido_inorden(self.raiz, valores)
        return valores

    def _recorrido_inorden(self, nodo, valores):
        if nodo is None:
            return
        self._recorrido_inorden(nodo.izquierda, valores)
        valores.append(nodo.valor)
        self._recorrido_inorden(nodo.derecha, valores)


libros = ListaSimplementeEnlazada([
    "Cien años de soledad",
    "El principito",
    "Don Quijote de la Mancha",
    "Memorias del Subsuelo",
    "1984"
])
pila = Pila()
cola = Cola()
arbol = ArbolBinarioBusqueda()

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
        libros.agregar_final(titulo)
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
    libros.ordenar()
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


def factorial_recursivo(numero):
    """Calcula el factorial mediante llamadas recursivas."""
    if numero <= 1:
        return 1
    return numero * factorial_recursivo(numero - 1)


def leer_entero(mensaje):
    """Lee un entero y comunica el error si la entrada no es válida."""
    try:
        return int(input(mensaje).strip())
    except ValueError:
        print("Ingrese un número entero válido.")
        return None


def gestionar_lista_enlazada():
    while True:
        print("\n===== LISTA SIMPLEMENTE ENLAZADA =====")
        mostrar_libros()
        print("1. Agregar libro")
        print("2. Quitar el primer libro")
        print("0. Volver")
        opcion = input("Seleccione: ").strip()
        if opcion == "1":
            agregar_libro()
        elif opcion == "2":
            titulo = libros.quitar_primero()
            print(f'Se quitó "{titulo}".' if titulo else "La lista está vacía.")
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


def gestionar_pila():
    while True:
        print("\n===== PILA (LIFO) =====")
        print(f"Elementos (cima primero): {list(reversed(pila.elementos))}")
        print("1. Apilar elemento")
        print("2. Desapilar elemento")
        print("0. Volver")
        opcion = input("Seleccione: ").strip()
        if opcion == "1":
            elemento = input("Ingrese el elemento: ").strip()
            if elemento:
                pila.apilar(elemento)
            else:
                print("El elemento no puede estar vacío.")
        elif opcion == "2":
            elemento = pila.desapilar()
            print(f"Salió de la cima: {elemento}" if elemento else "La pila está vacía.")
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


def gestionar_cola():
    while True:
        print("\n===== COLA (FIFO) =====")
        print(f"Elementos (primero en salir): {list(cola.elementos)}")
        print("1. Encolar elemento")
        print("2. Desencolar elemento")
        print("0. Volver")
        opcion = input("Seleccione: ").strip()
        if opcion == "1":
            elemento = input("Ingrese el elemento: ").strip()
            if elemento:
                cola.encolar(elemento)
            else:
                print("El elemento no puede estar vacío.")
        elif opcion == "2":
            elemento = cola.desencolar()
            print(f"Salió de la cola: {elemento}" if elemento else "La cola está vacía.")
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


def trabajar_con_recursividad():
    numero = leer_entero("\nIngrese un entero entre 0 y 12 para calcular su factorial: ")
    if numero is None:
        return
    if not 0 <= numero <= 12:
        print("El número debe estar entre 0 y 12.")
        return
    print(f"{numero}! = {factorial_recursivo(numero)}")


def gestionar_arbol_binario():
    while True:
        print("\n===== ÁRBOL BINARIO DE BÚSQUEDA =====")
        valores = arbol.recorrido_inorden()
        print(f"Recorrido inorden: {valores if valores else 'árbol vacío'}")
        print("1. Insertar número")
        print("2. Buscar número")
        print("0. Volver")
        opcion = input("Seleccione: ").strip()
        if opcion == "1":
            valor = leer_entero("Ingrese el número: ")
            if valor is not None:
                if arbol.insertar(valor):
                    print(f"Se insertó {valor}.")
                else:
                    print(f"{valor} ya existe; no se permiten duplicados.")
        elif opcion == "2":
            valor = leer_entero("Ingrese el número a buscar: ")
            if valor is not None:
                print(
                    f"{valor} está en el árbol."
                    if arbol.contiene(valor)
                    else f"{valor} no está en el árbol."
                )
        elif opcion == "0":
            break
        else:
            print("Opción inválida.")


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
        print("9. Administrar lista simplemente enlazada")
        print("10. Administrar pila (LIFO)")
        print("11. Administrar cola (FIFO)")
        print("12. Ejemplo de recursividad (factorial)")
        print("13. Administrar árbol binario de búsqueda")
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
        elif opcion == "9":
            gestionar_lista_enlazada()
        elif opcion == "10":
            gestionar_pila()
        elif opcion == "11":
            gestionar_cola()
        elif opcion == "12":
            trabajar_con_recursividad()
        elif opcion == "13":
            gestionar_arbol_binario()
        elif opcion == "0":
            print("Saliendo...")
            break
        else:
            print("Opción inválida.")


if __name__ == "__main__":
    main()