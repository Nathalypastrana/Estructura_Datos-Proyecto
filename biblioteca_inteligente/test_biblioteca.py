import unittest

from biblioteca import crear_biblioteca_demo, Biblioteca
from estructuras import Grafo, TablaHash, merge_sort


class PruebasBiblioteca(unittest.TestCase):
    def setUp(self):
        self.b = crear_biblioteca_demo()

    def test_registro_y_validaciones(self):
        self.assertEqual(len(self.b.catalogo), 11)
        with self.assertRaises(ValueError):
            self.b.registrar("1984", "George Orwell", "Ciencia ficción", 1949, 328)
        with self.assertRaises(ValueError):
            self.b.registrar("", "x", "y", 2000, 10)
        with self.assertRaises(ValueError):
            self.b.registrar("Nuevo", "x", "y", 2000, 0)

    def test_hash_y_busquedas(self):
        libro, _ = self.b.buscar_por_codigo("lib-005")
        self.assertEqual(libro.titulo, "1984")
        self.assertEqual(self.b.busqueda_lineal("EL PRINCIPITO")[0], 1)
        self.assertEqual(self.b.busqueda_lineal("no existe")[0], -1)
        libro, pos, pasos, _ = self.b.busqueda_binaria("pedro paramo")
        self.assertEqual(libro.titulo, "Pedro Páramo")
        self.assertIsNone(self.b.busqueda_binaria("zzz")[0])

    def test_ordenar(self):
        anios = [l.anio for l in self.b.ordenar("anio")]
        self.assertEqual(anios, sorted(anios))
        self.assertEqual(self.b.ordenar("titulo")[0].titulo, "1984")

    def test_abb_inorden_y_prefijo(self):
        titulos = [l.titulo for l in self.b.indice_titulos.inorden()]
        self.assertEqual(titulos[0], "1984")
        self.assertEqual(len(titulos), 11)
        self.assertEqual(len(self.b.indice_titulos.con_prefijo("cr")), 1)

    def test_prestamo_cola_y_pila(self):
        self.assertEqual(self.b.prestar("LIB-001", "Ana"), ("prestado", 0))
        self.assertEqual(self.b.prestar("LIB-001", "Luis"), ("en espera", 1))
        self.assertEqual(self.b.prestar("LIB-001", "Marta"), ("en espera", 2))
        with self.assertRaises(ValueError):
            self.b.prestar("LIB-001", "luis")
        # FIFO: Luis recibe primero
        self.assertEqual(self.b.devolver("LIB-001"), ("Ana", "Luis"))
        self.assertEqual(len(self.b.devoluciones), 0)
        self.assertEqual(self.b.devolver("LIB-001"), ("Luis", "Marta"))
        self.assertEqual(self.b.devolver("LIB-001"), ("Marta", None))
        # Pila: LIFO
        self.b.prestar("LIB-002", "Ana")
        self.b.devolver("LIB-002")
        self.b.prestar("LIB-003", "Ana")
        self.b.devolver("LIB-003")
        libro, ubic = self.b.reacomodar()
        self.assertEqual(libro.codigo, "LIB-003")
        self.assertEqual(ubic, (1, 3))
        self.assertEqual(self.b.reacomodar()[0].codigo, "LIB-002")
        self.assertEqual(self.b.reacomodar()[0].codigo, "LIB-001")  # devuelto antes
        self.assertEqual(self.b.reacomodar(), (None, None))

    def test_baja(self):
        self.b.prestar("LIB-004", "Ana")
        with self.assertRaises(ValueError):
            self.b.dar_de_baja("LIB-004")
        self.b.dar_de_baja("LIB-005")
        self.assertEqual(len(self.b.catalogo), 10)
        self.assertIsNone(self.b.buscar_por_codigo("LIB-005")[0])
        self.assertEqual(len(self.b.indice_titulos), 10)
        self.assertNotIn("LIB-005", self.b.relaciones.adyacencia)
        self.assertIsNone(self.b.ubicacion("LIB-005"))
        self.assertEqual(self.b.categorias.contar_hojas(), 10)

    def test_matriz_crece(self):
        for i in range(10):
            self.b.registrar(f"Libro extra {i}", "Autor", "Novela", 2000, 100)
        self.assertEqual(len(self.b.estanteria), 5)
        self.assertEqual(self.b.ubicacion("LIB-021"), (5, 1))

    def test_recursividad(self):
        self.assertEqual(self.b.contar_disponibles(), 11)
        self.assertEqual(self.b.total_paginas(), 471 + 96 + 863 + 136 + 328 + 144
                         + 368 + 551 + 255 + 253 + 124)
        self.assertEqual(self.b.contar_genero("novela"), 6)
        self.assertEqual(Biblioteca.ordenes_de_lectura(5), 120)
        self.assertEqual(Biblioteca.ordenes_de_lectura(0), 1)

    def test_grafo_bfs_dfs(self):
        niveles = {l.titulo: d for l, d in self.b.recomendaciones_bfs("LIB-005")}
        self.assertEqual(niveles["Fundación"], 1)               # mismo género
        self.assertEqual(niveles["Rebelión en la granja"], 1)   # mismo autor
        self.assertEqual(niveles["El principito"], 2)           # vía Rebelión (fábula)
        self.assertNotIn("Cien años de soledad", niveles)       # otro componente
        self.assertEqual(len(self.b.exploracion_dfs("LIB-005")), 5)
        self.assertEqual(len(self.b.exploracion_dfs("LIB-001")), 6)  # las 6 novelas

    def test_estructuras_basicas(self):
        t = TablaHash(2)
        for i in range(50):
            t.poner(f"k{i}", i)
        self.assertEqual(len(t), 50)
        self.assertEqual(t.obtener("k37"), 37)
        self.assertEqual(t.eliminar("k37"), 37)
        self.assertIsNone(t.obtener("k37"))
        self.assertEqual(merge_sort([5, 2, 9, 1, 2]), [1, 2, 2, 5, 9])
        g = Grafo()
        g.agregar_arista("a", "b")
        g.agregar_arista("b", "c")
        self.assertEqual(g.bfs("a"), [("a", 0), ("b", 1), ("c", 2)])


if __name__ == "__main__":
    unittest.main()
