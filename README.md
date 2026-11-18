# Biblioteca Inteligente - Estructuras de Datos

Sistema de consola en Python para administrar una biblioteca. Cada estructura de datos
del curso resuelve un problema **real de una biblioteca**, no un ejemplo suelto.

## Cómo ejecutarlo

```bash
python3 biblioteca_inteligente/main.py          # menú interactivo
cd biblioteca_inteligente && python3 -m unittest test_biblioteca   # pruebas
```

No requiere librerías externas. Arranca con un catálogo de ejemplo de 11 libros.

## Archivos

| Archivo | Contenido |
|---|---|
| `estructuras.py` | Estructuras implementadas desde cero (lista enlazada, hash map, pila, cola, árboles, grafo, merge sort) |
| `biblioteca.py` | Clase `Biblioteca`: aplica cada estructura a un proceso de la biblioteca |
| `main.py` | Menú de consola |
| `test_biblioteca.py` | Pruebas automáticas |

## Qué hace cada estructura en la biblioteca

| # | Proceso (menú) | Estructura / algoritmo | Para qué sirve en la biblioteca |
|---|---|---|---|
| 1 | Registrar libro | Lista enlazada + validaciones | Alta de libros con código automático (`LIB-001`...) |
| 2 | Mostrar catálogo | Lista enlazada | Listado en orden de ingreso |
| 3 | Buscar libro | Búsqueda parcial | Por título, autor o género (sin importar tildes/mayúsculas) |
| 4 | Ordenar catálogo | Merge sort (recursivo) | Por título, autor, año o páginas |
| 5 | Vectores | Vectores | Vector de años y de páginas; libro más antiguo, más extenso, promedios |
| 6 | Matrices | Matriz filas × posiciones | Estantería: en qué estante y posición está cada libro |
| 7 | Búsqueda lineal | Búsqueda lineal | Título exacto, mostrando cuántas comparaciones hizo |
| 8 | Búsqueda binaria | Búsqueda binaria | Título exacto sobre el catálogo ordenado, mostrando los pasos |
| 9 | Hash Map | Tabla hash con encadenamiento | Acceso inmediato a un libro por su código |
| 10 | Lista enlazada | Lista enlazada | Catálogo principal; dar de baja libros |
| 11 | Pila (LIFO) | Pila | Carrito de devoluciones: el último libro devuelto es el primero en reacomodarse |
| 12 | Cola (FIFO) | Cola | Lista de espera: si el libro está prestado, el primero en la fila lo recibe al devolverse |
| 13 | Recursividad | Recursión | Conteo de disponibles, total de páginas, libros por género y "órdenes posibles de lectura" (factorial) |
| 14 | Árbol | Árbol general | Clasificación género → autor → libro |
| 15 | Árbol binario de búsqueda | ABB | Índice alfabético de títulos: inorden, búsqueda y autocompletado por prefijo |
| 16 | Grafo | Grafo no dirigido | Libros relacionados por mismo autor o mismo género |
| 17 | BFS y DFS | Recorridos de grafo | BFS: recomendaciones de más cerca a más lejos; DFS: exploración en profundidad |
| 18 | Prestar libro | Hash Map + Cola | Presta o agrega al lector a la lista de espera |
| 19 | Devolver libro | Cola + Pila | Entrega al siguiente en espera, o envía al carrito de devoluciones |

## Flujo de ejemplo

1. `18` Prestar `LIB-001` a Ana → queda prestado.
2. `18` Prestar `LIB-001` a Luis → entra a la **cola** de espera.
3. `19` Devolver `LIB-001` → Ana lo devuelve y Luis lo recibe (FIFO).
4. `19` Devolver `LIB-001` → Luis lo devuelve; sin espera, va a la **pila** de devoluciones.
5. `11` → Reacomodar: saca de la pila el último libro devuelto y dice su estante y posición (**matriz**).

> Nota: la carpeta contiene además `index.html`, `app.js` y `styles.css`, un simulador web de la
> versión anterior de `main.py`. No refleja todavía esta versión.
