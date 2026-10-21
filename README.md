# games-cars

API REST del catálogo **Games-Cars** (videojuegos), construida con **Node.js + Express** sobre la base de datos **`Car_2`** (MySQL/MariaDB).

Incluye **CRUD**, **borrado lógico** (columna `Deleted-at`), **restauración** y **búsquedas** por texto, más un endpoint de solo lectura sobre la vista `estante`.

> 🔑 **Todas las peticiones llevan los datos en el `body` (JSON): la API no usa argumentos (`:id`) ni query string.** El id del registro viaja en el cuerpo, igual que el texto de las búsquedas.

---

## Contenido del proyecto

```
games-cars/
├── bdDump.sql              # Volcado COMPLETO y POBLADO de la base Car_2 (esquema actual)
├── bdDump_games_cars.sql   # Esquema anterior games_cars (respaldo, no se usa)
├── package.json            # Dependencias (express, mysql2)
├── README.md               # Este archivo
├── src/
│   ├── app.js              # Servidor Express y montaje de rutas
│   ├── db.js               # Pool de conexiones MySQL (mysql2/promise)
│   ├── helpers.js          # Funciones compartidas (ids, validación, errores)
│   └── routes/
│       ├── Car2.js         # `games` (catálogo principal)
│       ├── Categories.js   # `GAME_CATEGORIES`
│       ├── Tracks.js       # `TRACKS`
│       ├── Features.js     # `FEATURES`
│       ├── Cars.js         # `GAME-CARS` (intermedia juegos ↔ coches)
│       └── Estante.js      # Vista `estante` (solo lectura)
└── evidencias/             # Capturas y resumen de las pruebas
```

## Requisitos

- Node.js 18+ (probado con Node 26)
- MySQL 8 o MariaDB 10.x+ (probado con MariaDB 13)

## Puesta en marcha

```bash
# 1) Crear y poblar la base de datos Car_2
mysql -u root -p < bdDump.sql

# 2) Instalar dependencias
npm install

# 3) Arrancar el servidor
npm start            # http://localhost:3000
```

La conexión está fijada en `src/db.js`: host `localhost`, usuario `root`, sin contraseña y base de datos `Car_2`. El puerto también está fijado en `src/app.js` (3000).

## Modelo de datos (`Car_2`)

| Tabla             | Tipo     | Descripción                                                                                            |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `games`           | tabla    | Catálogo principal de videojuegos (PK `id-game-car`, FK `Categori-id` a `GAME_CATEGORIES`).            |
| `GAME_CATEGORIES` | tabla    | Categorías de juego (PK `Categori-id`).                                                                |
| `CAR`             | catálogo | Coches (PK `Car-id` autoincremental: `Car-name`, `Manufacturer`, `Year`, `Car-class`).                 |
| `TRACKS`          | catálogo | Pistas (PK `Tracks-id`). Ya no guarda el juego: se relaciona con la tabla puente.                      |
| `FEATURES`        | catálogo | Características (PK `Features-id`, incluye `Feature-value`).                                           |
| `GAME-TRACKS`     | puente   | Relación N:M `games` ↔ `TRACKS` (`Game-track-id`, `id-game-car`, `Tracks-id`, `Deleted-at`).           |
| `GAME-FEATURES`   | puente   | Relación N:M `games` ↔ `FEATURES` (`Game-feature-id`, `id-game-car`, `Features-id`, `Deleted-at`).     |
| `GAME-CARS`       | puente   | Relación N:M `games` ↔ `CAR` (`Game-car-id`, `id-game-car`, `Car-id`, `max-speed`, `Rarity`, ...).     |
| `estante`         | vista    | **Vista** (games ⋈ GAME_CATEGORIES): `game_id`, `Title`, `Desc_resumen`, `Categoria`, `Image_portada`. |

El borrado es **lógico**: `DELETE` fija `Deleted-at = NOW()` y `PATCH .../restaurar` lo vuelve a `NULL`.

El catálogo `CAR` **no tiene ruta propia**: sus coches se referencian por su `Car-id` desde la intermedia, y esta se administra en `/api/cars` (`GAME-CARS`).

## Endpoints

Cada tabla expone el mismo esquema salvo `Features` y `Cars` (sin búsquedas de texto), `Categories` (una sola) y la vista `estante` (solo lectura).

> 🔑 **El id nunca viaja en la URL.** Todas las operaciones que necesitan un id lo reciben en el **body** (JSON), así que hay que enviar `Content-Type: application/json` y el cuerpo. Un body sin el id devuelve `400`.

| Método | Ruta                         | Body                       | Descripción                              |
| ------ | ---------------------------- | -------------------------- | ---------------------------------------- |
| GET    | `/api/<recurso>`             | —                          | Lista los activos (`Deleted-at IS NULL`) |
| GET    | `/api/<recurso>/todos`       | —                          | Lista incluyendo eliminados              |
| POST   | `/api/<recurso>/buscarPorId` | `{ "<pk>": N }`            | Obtiene uno por su id                    |
| POST   | `/api/<recurso>`             | campos del recurso         | Crea                                     |
| PUT    | `/api/<recurso>`             | `{ "<pk>": N, ...campos }` | Actualiza                                |
| DELETE | `/api/<recurso>`             | `{ "<pk>": N }`            | Borrado lógico (`Deleted-at = NOW()`)    |
| PATCH  | `/api/<recurso>/restaurar`   | `{ "<pk>": N }`            | Restaura (`Deleted-at = NULL`)           |

`<pk>` es el nombre de la columna primaria de cada recurso:

| Recurso      | `<pk>`        |
| ------------ | ------------- |
| `games`      | `id-game-car` |
| `tracks`     | `Tracks-id`   |
| `features`   | `Features-id` |
| `cars`       | `Game-car-id` |
| `categories` | `Categori-id` |

> Las **búsquedas de texto** también son `POST` con el dato en el body. Ver "Búsquedas con body (POST)".

Recursos y sus búsquedas de texto:

| Recurso           | Búsqueda        | Endpoint                 | Body                       | Columna      |
| ----------------- | --------------- | ------------------------ | -------------------------- | ------------ |
| `/api/games`      | por nombre      | `/api/games/buscarNm`    | `{ "nombre": "..." }`      | `Title`      |
| `/api/games`      | por descripción | `/api/games/buscarDesc`  | `{ "descripcion": "..." }` | `Desc`       |
| `/api/categories` | por nombre      | `/api/categories/buscar` | `{ "nombre": "..." }`      | `Name`       |
| `/api/tracks`     | por nombre      | `/api/tracks/buscarNm`   | `{ "nombre": "..." }`      | `Track-name` |
| `/api/tracks`     | por descripción | `/api/tracks/buscarDesc` | `{ "descripcion": "..." }` | `Location`   |
| `/api/cars`       | —               | —                        | —                          | —            |
| `/api/features`   | —               | —                        | —                          | —            |
| `/api/estante`    | —               | —                        | —                          | —            |

> `POST` y `PUT` de `/api/games` aceptan los arreglos opcionales `tracks` y `features` con **ids del catálogo** (ej. `"tracks": [1, 2]`). Se guardan como **vínculos** en las tablas puente `GAME-TRACKS` / `GAME-FEATURES`, dentro de la **misma transacción** que el juego. En el `PUT`, los vínculos anteriores se reemplazan. Los vínculos con **coches** se administran aparte, en `/api/cars` (`GAME-CARS`).

## URLs completas

Base: `http://localhost:3000` (el puerto está fijo en `src/app.js`). Todas las rutas que necesitan un id lo reciben en el **body**.

### `games` → `/api/games`

| Método | URL completa                                     | Body                       |
| ------ | ------------------------------------------------ | -------------------------- |
| GET    | `http://localhost:3000/api/games`                | —                          |
| GET    | `http://localhost:3000/api/games/todos`          | —                          |
| POST   | `http://localhost:3000/api/games/buscarPorId`    | `{"id-game-car": 1}`       |
| POST   | `http://localhost:3000/api/games`                | campos del juego           |
| POST   | `http://localhost:3000/api/games/buscarNm`       | `{"nombre": "forza"}`      |
| POST   | `http://localhost:3000/api/games/buscarDesc`     | `{"descripcion": "mundo"}` |
| POST   | `http://localhost:3000/api/games/buscarTracks`   | `{"id-game-car": 1}`       |
| POST   | `http://localhost:3000/api/games/buscarFeatures` | `{"id-game-car": 1}`       |
| PUT    | `http://localhost:3000/api/games`                | `{"id-game-car": 1, ...}`  |
| DELETE | `http://localhost:3000/api/games`                | `{"id-game-car": 1}`       |
| PATCH  | `http://localhost:3000/api/games/restaurar`      | `{"id-game-car": 1}`       |

### `categories` → `/api/categories`

| Método | URL completa                                       | Body                      |
| ------ | -------------------------------------------------- | ------------------------- |
| GET    | `http://localhost:3000/api/categories`             | —                         |
| GET    | `http://localhost:3000/api/categories/todos`       | —                         |
| POST   | `http://localhost:3000/api/categories/buscarPorId` | `{"Categori-id": 1}`      |
| POST   | `http://localhost:3000/api/categories`             | `{"Name": "..."}`         |
| POST   | `http://localhost:3000/api/categories/buscar`      | `{"nombre": "juegos"}`    |
| PUT    | `http://localhost:3000/api/categories`             | `{"Categori-id": 1, ...}` |
| DELETE | `http://localhost:3000/api/categories`             | `{"Categori-id": 1}`      |
| PATCH  | `http://localhost:3000/api/categories/restaurar`   | `{"Categori-id": 1}`      |

### `tracks` → `/api/tracks`

| Método | URL completa                                    | Body                       |
| ------ | ----------------------------------------------- | -------------------------- |
| GET    | `http://localhost:3000/api/tracks`              | —                          |
| GET    | `http://localhost:3000/api/tracks/todos`        | —                          |
| POST   | `http://localhost:3000/api/tracks/buscarPorId`  | `{"Tracks-id": 1}`         |
| POST   | `http://localhost:3000/api/tracks`              | campos de la pista         |
| POST   | `http://localhost:3000/api/tracks/buscarNm`     | `{"nombre": "circuito"}`   |
| POST   | `http://localhost:3000/api/tracks/buscarDesc`   | `{"descripcion": "japon"}` |
| POST   | `http://localhost:3000/api/tracks/buscarJuegos` | `{"Tracks-id": 1}`         |
| PUT    | `http://localhost:3000/api/tracks`              | `{"Tracks-id": 1, ...}`    |
| DELETE | `http://localhost:3000/api/tracks`              | `{"Tracks-id": 1}`         |
| PATCH  | `http://localhost:3000/api/tracks/restaurar`    | `{"Tracks-id": 1}`         |

### `features` → `/api/features`

| Método | URL completa                                     | Body                      |
| ------ | ------------------------------------------------ | ------------------------- |
| GET    | `http://localhost:3000/api/features`             | —                         |
| GET    | `http://localhost:3000/api/features/todos`       | —                         |
| POST   | `http://localhost:3000/api/features/buscarPorId` | `{"Features-id": 1}`      |
| POST   | `http://localhost:3000/api/features`             | `{"Feature-name": "..."}` |
| PUT    | `http://localhost:3000/api/features`             | `{"Features-id": 1, ...}` |
| DELETE | `http://localhost:3000/api/features`             | `{"Features-id": 1}`      |
| PATCH  | `http://localhost:3000/api/features/restaurar`   | `{"Features-id": 1}`      |

### `cars` → `/api/cars` (tabla intermedia `GAME-CARS`)

| Método | URL completa                                 | Body                                |
| ------ | -------------------------------------------- | ----------------------------------- |
| GET    | `http://localhost:3000/api/cars`             | —                                   |
| GET    | `http://localhost:3000/api/cars/todos`       | —                                   |
| POST   | `http://localhost:3000/api/cars/buscarPorId` | `{"Game-car-id": 1}`                |
| POST   | `http://localhost:3000/api/cars`             | `{"id-game-car":1,"Car-id":1, ...}` |
| PUT    | `http://localhost:3000/api/cars`             | `{"Game-car-id": 1, ...}`           |
| DELETE | `http://localhost:3000/api/cars`             | `{"Game-car-id": 1}`                |
| PATCH  | `http://localhost:3000/api/cars/restaurar`   | `{"Game-car-id": 1}`                |

### `estante` (vista, solo lectura) → `/api/estante`

| Método | URL completa                        |
| ------ | ----------------------------------- |
| GET    | `http://localhost:3000/api/estante` |

## Búsquedas con body (POST)

El texto viaja en el cuerpo (body) de la petición, no en la URL:

| Método | URL completa                                  | Body                         | Busca en     |
| ------ | --------------------------------------------- | ---------------------------- | ------------ |
| POST   | `http://localhost:3000/api/games/buscarNm`    | `{ "nombre": "forza" }`      | `Title`      |
| POST   | `http://localhost:3000/api/games/buscarDesc`  | `{ "descripcion": "mundo" }` | `Desc`       |
| POST   | `http://localhost:3000/api/categories/buscar` | `{ "nombre": "juegos" }`     | `Name`       |
| POST   | `http://localhost:3000/api/tracks/buscarNm`   | `{ "nombre": "circuito" }`   | `Track-name` |
| POST   | `http://localhost:3000/api/tracks/buscarDesc` | `{ "descripcion": "japon" }` | `Location`   |

### Relaciones entre juegos, pistas y características

Devuelven las pistas/características **vinculadas** a un juego, y los juegos a los que pertenece una pista (JOIN con las tablas puente `GAME-TRACKS` / `GAME-FEATURES`). Sin vínculos devuelven un arreglo vacío `[]`.

| Método | URL completa                                     | Body                 | Devuelve                            |
| ------ | ------------------------------------------------ | -------------------- | ----------------------------------- |
| POST   | `http://localhost:3000/api/games/buscarTracks`   | `{"id-game-car": 1}` | Pistas vinculadas al juego          |
| POST   | `http://localhost:3000/api/games/buscarFeatures` | `{"id-game-car": 1}` | Características vinculadas al juego |
| POST   | `http://localhost:3000/api/tracks/buscarJuegos`  | `{"Tracks-id": 1}`   | Juegos a los que pertenece la pista |

> Todos los datos viajan en el **body**: la API **no usa argumentos ni query string** en ninguna ruta.

## Códigos de respuesta

| Código | Cuándo                                                            |
| ------ | ----------------------------------------------------------------- |
| 200    | Consulta o actualización correcta                                 |
| 201    | Recurso creado                                                    |
| 400    | Faltan campos obligatorios en el body, o falta el id del registro |
| 404    | Recurso no encontrado (también en rutas inexistentes, en JSON)    |
| 500    | Error del servidor                                                |

Las rutas van envueltas en `try/catch`: los errores se registran en consola y se responde `500` con el formato `{ mensaje, error, codigo, stack }`. Las **búsquedas** normalizan el texto antes de validarlo (`String((req.body ?? {}).nombre ?? "").trim()`), así que un body vacío devuelve `400` en vez de romper el proceso. En `app.js` hay además un **manejador de errores global** al final, que cubre los errores síncronos y los que llegan con `next(error)` (no las promesas de un handler `async`: por eso cada ruta async conserva su propio `try/catch`).

## Ejemplos rápidos

```bash
# Catálogo principal
curl http://localhost:3000/api/games

# Resto de recursos y la vista
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/tracks
curl http://localhost:3000/api/features
curl http://localhost:3000/api/estante

# Búsquedas (POST, el texto va en el body)
curl -X POST http://localhost:3000/api/games/buscarNm \
     -H "Content-Type: application/json" \
     -d '{"nombre":"forza"}'
curl -X POST http://localhost:3000/api/games/buscarDesc \
     -H "Content-Type: application/json" \
     -d '{"descripcion":"mundo abierto"}'
curl -X POST http://localhost:3000/api/categories/buscar \
     -H "Content-Type: application/json" \
     -d '{"nombre":"juegos"}'
curl -X POST http://localhost:3000/api/tracks/buscarNm \
     -H "Content-Type: application/json" \
     -d '{"nombre":"circuito"}'
curl -X POST http://localhost:3000/api/tracks/buscarDesc \
     -H "Content-Type: application/json" \
     -d '{"descripcion":"japon"}'

# Crear, actualizar, eliminar lógicamente y restaurar
curl -X POST http://localhost:3000/api/games \
     -H "Content-Type: application/json" \
     -d '{"Title":"Forza Horizon","Desc":"Carreras en mundo abierto","Relace_date":"2012-10-23","Price":59.99,"Developer":"Playground Games","Publisher":"Microsoft","Rating":9.5,"Platform":"Xbox","Game_mode":"Single-player","Categori-id":1}'

# Crear un juego vinculando pistas y características del catálogo (misma transacción)
curl -X POST http://localhost:3000/api/games \
     -H "Content-Type: application/json" \
     -d '{"Title":"Gran Turismo 7","Desc":"Simulador de carreras","Relace_date":"2022-03-04","Price":1499,"Developer":"Polyphony Digital","Publisher":"Sony","Rating":"E","Platform":"PlayStation","Game_mode":"Individual y multijugador","Categori-id":1,"tracks":[12,13,14],"features":[11,12,13]}'

# Consultar uno por id (el id va en el body)
curl -X POST http://localhost:3000/api/games/buscarPorId \
     -H "Content-Type: application/json" \
     -d '{"id-game-car":1}'

# Relaciones de un juego y de una pista (también con el id en el body)
curl -X POST http://localhost:3000/api/games/buscarTracks \
     -H "Content-Type: application/json" \
     -d '{"id-game-car":1}'
curl -X POST http://localhost:3000/api/games/buscarFeatures \
     -H "Content-Type: application/json" \
     -d '{"id-game-car":1}'
curl -X POST http://localhost:3000/api/tracks/buscarJuegos \
     -H "Content-Type: application/json" \
     -d '{"Tracks-id":13}'

# Actualizar (PUT en la colección: el id va DENTRO del body)
curl -X PUT http://localhost:3000/api/games \
     -H "Content-Type: application/json" \
     -d '{"id-game-car":1,"Title":"Forza Horizon","Desc":"Carreras en mundo abierto","Relace_date":"2012-10-23","Price":39.99,"Developer":"Playground Games","Publisher":"Microsoft","Rating":9.5,"Platform":"Xbox","Game_mode":"Single-player","Categori-id":1}'

# Borrado lógico y restauración (id en el body)
curl -X DELETE http://localhost:3000/api/games \
     -H "Content-Type: application/json" \
     -d '{"id-game-car":1}'
curl -X PATCH http://localhost:3000/api/games/restaurar \
     -H "Content-Type: application/json" \
     -d '{"id-game-car":1}'
```
