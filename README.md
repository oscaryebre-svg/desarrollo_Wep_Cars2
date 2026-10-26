# games-cars

API REST del catálogo de videojuegos **games-cars**, construida con **Node.js + Express + TypeScript + TypeORM** sobre la base de datos **`Car_2`** (MariaDB/MySQL).

Incluye CRUD completo, borrado lógico (`Deleted-at`), restauración y búsquedas por nombre/descripción en los catálogos `games`, `categories` y `tracks`; `features` tiene CRUD sin búsquedas y la vista `estante` es de solo lectura.

---

## Stack

| Pieza       | Versión | Uso                                  |
| ----------- | ------- | ------------------------------------ |
| Node.js     | 18+     | Runtime (probado con Node 26)        |
| Express     | 4.x     | Servidor HTTP                        |
| TypeScript  | 6.0.3   | Todo el código de `src/` es `.ts`    |
| TypeORM     | 1.1.2   | Repositorios, transacciones y mapeo  |
| mysql2      | 3.x     | Driver de MySQL que usa TypeORM      |
| MariaDB     | 13.x    | Base de datos (compatible MySQL 8)   |

No queda código JavaScript en `src/`: la entrada es `src/app.ts` y las cinco rutas están migradas a TypeScript con repositorios de TypeORM.

## Estructura

```
games-cars/
├── bdDump.sql                  # Base Car_2 completa y poblada
├── package.json
├── tsconfig.json
├── src/
│   ├── app.ts                  # Express, montaje de rutas y arranque
│   ├── data-source.ts          # Conexión TypeORM y entidades
│   ├── entities/
│   │   ├── Category.ts         # GAME_CATEGORIES
│   │   ├── Game.ts             # games
│   │   ├── Track.ts            # TRACKS
│   │   └── Feature.ts          # GAMES-FEATURES
│   ├── routes/
│   │   ├── games.ts
│   │   ├── categories.ts
│   │   ├── tracks.ts
│   │   ├── features.ts
│   │   └── estante.ts
│   └── utils/http.ts           # validación, ids y errores comunes
├── pruebas/
│   ├── pruebas-api.sh          # 39 comprobaciones del API
│   ├── capturas.sh             # genera la transcripción de las evidencias
│   └── render_evidencias.py    # convierte esa transcripción en PNG
└── evidencias/                 # Capturas del API funcionando
```

## Puesta en marcha

```bash
# 1) Crear y poblar la base de datos
mysql -u root -p < bdDump.sql

# 2) Instalar dependencias
npm install

# 3) Arrancar la API en http://localhost:3000
npm start
```

`npm start` ejecuta TypeScript directamente con `ts-node`. También existen:

```bash
npm run typecheck   # tsc --noEmit: comprueba tipos sin generar archivos
npm run build       # compila a dist/
npm run start:prod  # ejecuta dist/app.js
npm run dev         # recarga al guardar
```

La conexión por defecto es `localhost:3306`, usuario `root`, sin contraseña y base `Car_2`. Se puede cambiar sin editar código con variables de entorno: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `PORT`.

## Base de datos (`bdDump.sql`)

El dump crea la base `Car_2` y la deja poblada. Se importa de una sola pasada y sin errores.

| Tabla / vista     | Filas | Contenido                                              |
| ----------------- | ----: | ------------------------------------------------------ |
| `games`           |     5 | Catálogo principal de videojuegos                      |
| `GAME_CATEGORIES` |     1 | Categorías de juego                                    |
| `TRACKS`          |    29 | Pistas, ligadas a un juego por `id-game-car`           |
| `GAMES-FEATURES`  |    25 | Características, ligadas a un juego por `id-game-car`  |
| `estante` (vista) |     5 | JOIN `games` ⋈ `GAME_CATEGORIES` para las tarjetas     |

El dump conserva además las tablas `CAR`, `GAME-CARS`, `USER` y `USER-GAMES` del diseño original de la materia; esta API no las modifica.

El borrado es **lógico**: `DELETE` guarda `Deleted-at = NOW()` y `PATCH .../restaurar` lo vuelve a `NULL`. Las llaves primarias no usan `AUTO_INCREMENT`; el id se calcula con `MAX(columna) + 1` dentro de la misma transacción del `INSERT`.

## Endpoints

Cada recurso expone el mismo esquema (salvo `features`, sin búsquedas, y `estante`, solo lectura):

| Método | Ruta                                  | Descripción                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/api/<recurso>`                      | Lista los activos (`Deleted-at IS NULL`) |
| GET    | `/api/<recurso>/todos`                | Lista incluyendo eliminados              |
| GET    | `/api/<recurso>/buscar/nombre?q=`     | Búsqueda por nombre (si aplica)          |
| GET    | `/api/<recurso>/buscar/descripcion?q=`| Búsqueda por ubicación/descripción       |
| GET    | `/api/<recurso>/:id`                  | Obtiene un registro                      |
| POST   | `/api/<recurso>`                      | Crea (HTTP 201)                          |
| PUT    | `/api/<recurso>/:id`                  | Actualiza                                |
| DELETE | `/api/<recurso>/:id`                  | Borrado lógico                           |
| PATCH  | `/api/<recurso>/:id/restaurar`        | Restaura un registro eliminado           |

| Recurso           | Tabla             | Busca por nombre  | Busca por descripción |
| ----------------- | ----------------- | ----------------- | --------------------- |
| `/api/games`      | `games`           | `Title`           | `Desc`                |
| `/api/categories` | `GAME_CATEGORIES` | `Name`            | —                     |
| `/api/tracks`     | `TRACKS`          | `Track-name`      | `Location`            |
| `/api/features`   | `GAMES-FEATURES`  | —                 | —                     |
| `/api/estante`    | vista `estante`   | —                 | —                     |

`POST` y `PUT` de `/api/games` aceptan los arreglos opcionales `tracks` y `features`. Se guardan dentro de la misma transacción que el juego; en el `PUT`, los anteriores se dan de baja lógica y se insertan los nuevos.

### Códigos de respuesta

| Código | Cuándo                                                      |
| ------ | ----------------------------------------------------------- |
| 200    | Consulta o actualización correcta                           |
| 201    | Recurso creado                                              |
| 400    | Faltan campos obligatorios, `q` vacío o id no numérico      |
| 404    | Recurso o ruta no encontrados                               |
| 500    | Error del servidor (el detalle queda en la consola)         |

Los errores se responden en JSON con `{ "mensaje": "...", "codigo": "..." }` cuando el motor de base de datos entrega un código.

## Ejemplos

```bash
# Listado con el nombre de la categoría
curl http://localhost:3000/api/games
curl "http://localhost:3000/api/games/buscar/nombre?q=forza"

# Crear un juego con una pista y una característica
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "Title": "Juego de prueba",
    "Desc": "Creado desde la documentación",
    "Relace_date": "2026-10-25",
    "Price": 499,
    "Developer": "Equipo",
    "Publisher": "Equipo",
    "Rating": "E",
    "Platform": "PC",
    "Game_mode": "Individual",
    "Categori-id": 1,
    "tracks": [
      { "Track-name": "Circuito de prueba", "Location": "Jalisco", "Track-type": "Circuito", "Length-km": 5, "difficulty-level": "Media" }
    ],
    "features": [
      { "Feature-name": "Modo foto", "Feature-value": "Si" }
    ]
  }'

# Actualizar (los campos obligatorios van completos)
curl -X PUT http://localhost:3000/api/games/6 \
  -H "Content-Type: application/json" \
  -d '{"Title":"Juego actualizado","Desc":"CRUD verificado","Relace_date":"2026-10-25","Price":599,"Developer":"Equipo","Publisher":"Equipo","Rating":"E","Platform":"PC","Game_mode":"Individual","Categori-id":1}'

# Borrado lógico y restauración
curl -X DELETE http://localhost:3000/api/games/6
curl -X PATCH  http://localhost:3000/api/games/6/restaurar

# Vista estante (solo lectura)
curl http://localhost:3000/api/estante
```

## Pruebas y evidencias

Con la API corriendo y la base recién importada:

```bash
bash pruebas/pruebas-api.sh
```

El script recorre los cinco recursos y comprueba códigos HTTP, búsquedas, borrado lógico, restauración y validaciones (39 comprobaciones). Con la misma base se regeneran las capturas:

```bash
SALIDA=/tmp/capturas bash pruebas/capturas.sh
python3 pruebas/render_evidencias.py /tmp/capturas evidencias
```

Las imágenes de `evidencias/` muestran respuestas reales de la API:

1. `evidencia-1-api-games.png` — estado del servicio y catálogo `games`.
2. `evidencia-2-crud-games.png` — POST, PUT, DELETE y PATCH sobre `games`.
3. `evidencia-3-crud-categories.png` — CRUD del catálogo `categories`.
4. `evidencia-4-crud-tracks-features.png` — CRUD de `tracks` y `features`.
5. `evidencia-5-vista-estante-validaciones.png` — vista `estante` y respuestas 400/404.
6. `evidencia-6-typescript-typeorm.png` — compilación de TypeScript y módulos del proyecto.

`evidencias/resumen-pruebas.txt` resume la importación del dump y las pruebas ejecutadas.
