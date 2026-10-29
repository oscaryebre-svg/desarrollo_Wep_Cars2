#!/usr/bin/env bash
# Genera el texto de las capturas a partir de respuestas reales del API.
# Requiere la API corriendo y la base recién cargada desde bdDump.sql.
set -u

BASE="${BASE:-http://localhost:3000}"
SALIDA="${SALIDA:-/tmp/opencode/capturas-txt}"
mkdir -p "$SALIDA"

seccion=0
ULTIMO="$SALIDA/ultimo.json"

grupo() {
  seccion=$1
  : > "$SALIDA/seccion-$seccion.txt"
  printf '# %s\n' "$2" >> "$SALIDA/seccion-$seccion.txt"
}

# ejecutar "comando completo"  (se evalúa para poder usar tuberías y jq)
ejecutar() {
  printf '$ %s\n' "$1" >> "$SALIDA/seccion-$seccion.txt"
  eval "$1" >> "$SALIDA/seccion-$seccion.txt" 2>&1
  printf '\n' >> "$SALIDA/seccion-$seccion.txt"
}

# peticion METODO RUTA [JSON] -> guarda el cuerpo en $ULTIMO y lo imprime con jq
peticion() {
  local metodo=$1 ruta=$2 datos="${3:-}"

  if [ -n "$datos" ]; then
    {
      printf '$ curl -s -X %s %s%s \\\n' "$metodo" "$BASE" "$ruta"
      printf '    -H "Content-Type: application/json" \\\n'
      printf "    -d '%s'\n" "$(printf '%s' "$datos" | jq .)"
    } >> "$SALIDA/seccion-$seccion.txt"
    curl -s -o "$ULTIMO" -X "$metodo" -H 'Content-Type: application/json' \
      -d "$datos" "$BASE$ruta"
  else
    printf '$ curl -s -X %s %s%s\n' "$metodo" "$BASE" "$ruta" \
      >> "$SALIDA/seccion-$seccion.txt"
    curl -s -o "$ULTIMO" -X "$metodo" "$BASE$ruta"
  fi

  jq . "$ULTIMO" >> "$SALIDA/seccion-$seccion.txt"
  printf '\n' >> "$SALIDA/seccion-$seccion.txt"
}

# ============================================================ 1
grupo 1 "API en TypeScript: estado y catálogo de juegos"
ejecutar "curl -s $BASE/ | jq ."
ejecutar "curl -s $BASE/api/games | jq 'map({id: .[\"id-game-car\"], Title, Price, Categoria})'"
ejecutar "curl -s '$BASE/api/games/buscar/nombre?q=forza' | jq 'map(.Title)'"
ejecutar "curl -s '$BASE/api/games/buscar/descripcion?q=mundo' | jq 'map(.Title)'"

# ============================================================ 2
grupo 2 "CRUD completo del catálogo games"
JUEGO='{"Title":"Juego de prueba","Desc":"Creado para comprobar el CRUD en TypeScript","Relace_date":"2026-10-25","Price":499,"Developer":"Equipo","Publisher":"Equipo","Rating":"E","Platform":"PC","Game_mode":"Individual","Categori-id":1,"tracks":[{"Track-name":"Circuito de prueba","Location":"Jalisco","Track-type":"Circuito","Length-km":5,"difficulty-level":"Media"}],"features":[{"Feature-name":"Modo foto","Feature-value":"Si"}]}'
peticion POST "/api/games" "$JUEGO"
ID_JUEGO=$(jq -r '.["id-game-car"]' "$ULTIMO")

ACTUALIZADO="{\"Title\":\"Juego de prueba actualizado\",\"Desc\":\"CRUD verificado\",\"Relace_date\":\"2026-10-25\",\"Price\":599,\"Developer\":\"Equipo\",\"Publisher\":\"Equipo\",\"Rating\":\"E\",\"Platform\":\"PC\",\"Game_mode\":\"Individual\",\"Categori-id\":1,\"tracks\":[{\"Track-name\":\"Circuito nuevo A\",\"Location\":\"Jalisco\",\"Track-type\":\"Circuito\",\"Length-km\":4,\"difficulty-level\":\"Facil\"},{\"Track-name\":\"Circuito nuevo B\",\"Location\":\"Nayarit\",\"Track-type\":\"Rally\",\"Length-km\":6,\"difficulty-level\":\"Media\"}],\"features\":[{\"Feature-name\":\"HDR\",\"Feature-value\":\"10 bits\"}]}"
peticion PUT "/api/games/$ID_JUEGO" "$ACTUALIZADO"
ejecutar "curl -s $BASE/api/games/$ID_JUEGO | jq '{Title, Price, Categoria}'"

ejecutar "curl -s $BASE/api/tracks/todos | jq '[.[] | select(.[\"id-game-car\"] == $ID_JUEGO and .[\"Deleted-at\"] == null)] | length'"

peticion DELETE "/api/games/$ID_JUEGO"
ejecutar "curl -s $BASE/api/games/todos | jq '.[] | select(.[\"id-game-car\"] == $ID_JUEGO) | .[\"Deleted-at\"]'"
peticion PATCH "/api/games/$ID_JUEGO/restaurar"
ejecutar "curl -s $BASE/api/games/todos | jq '.[] | select(.[\"id-game-car\"] == $ID_JUEGO) | .[\"Deleted-at\"]'"

# ============================================================ 3
grupo 3 "Catálogo categories con CRUD"
peticion POST "/api/categories" '{"Name":"Categoria de prueba"}'
ID_CATEGORIA=$(jq -r '.["Categori-id"]' "$ULTIMO")
peticion PUT "/api/categories/$ID_CATEGORIA" '{"Name":"Categoria actualizada"}'
peticion GET "/api/categories/$ID_CATEGORIA"
peticion DELETE "/api/categories/$ID_CATEGORIA"
peticion PATCH "/api/categories/$ID_CATEGORIA/restaurar"
ejecutar "curl -s '$BASE/api/categories/buscar/nombre?q=actualizada' | jq 'map(.[\"Categori-id\"])'"

# ============================================================ 4
grupo 4 "Catálogos tracks y features"
peticion POST "/api/tracks" '{"id-game-car":1,"Track-name":"Pista de prueba","Location":"Jalisco","Track-type":"Circuito","Length-km":4,"difficulty-level":"Facil"}'
ID_PISTA=$(jq -r '.["Tracks-id"]' "$ULTIMO")
peticion PUT "/api/tracks/$ID_PISTA" '{"id-game-car":1,"Track-name":"Pista actualizada","Location":"Nayarit","Track-type":"Rally","Length-km":5,"difficulty-level":"Media"}'
peticion DELETE "/api/tracks/$ID_PISTA"
peticion PATCH "/api/tracks/$ID_PISTA/restaurar"
ejecutar "curl -s '$BASE/api/tracks/buscar/nombre?q=circuito' | jq 'map(.[\"Track-name\"])'"

peticion POST "/api/features" '{"id-game-car":1,"Feature-name":"HDR","Feature-value":"10 bits"}'
ID_FEATURE=$(jq -r '.["Features-id"]' "$ULTIMO")
peticion PUT "/api/features/$ID_FEATURE" '{"id-game-car":1,"Feature-name":"HDR avanzado","Feature-value":"12 bits"}'
peticion DELETE "/api/features/$ID_FEATURE"
peticion PATCH "/api/features/$ID_FEATURE/restaurar"

# ============================================================ 5
grupo 5 "Vista estante y validaciones"
ejecutar "curl -s $BASE/api/estante | jq '.[0]'"
ejecutar "curl -s -o /dev/null -w '%{http_code}\\n' -X POST $BASE/api/games -H 'Content-Type: application/json' -d '{}'"
ejecutar "curl -s -o /dev/null -w '%{http_code}\\n' $BASE/api/games/9999"
ejecutar "curl -s -o /dev/null -w '%{http_code}\\n' $BASE/api/no-existe"

# ============================================================ 6
grupo 6 "Catálogo cars y relación N:M games ↔ CAR"
peticion POST "/api/cars" '{"Car-name":"Auto de prueba","Manufacturer":"Equipo","Year":2026,"Car-class":"Concept"}'
ID_AUTO=$(jq -r '.["Car-id"]' "$ULTIMO")
peticion GET "/api/cars/$ID_AUTO"
peticion POST "/api/games/1/cars" "{\"cars\":[{\"Car-id\":$ID_AUTO,\"max-speed\":280,\"Rarity\":\"Rara\",\"Unlockable\":true}]}"
ejecutar "curl -s $BASE/api/games/1 | jq '{Title, tracks: (.tracks|length), features: (.features|length), cars: [.cars[] | {Car: .[\"Car-name\"], \"max-speed\", Rarity}]}'"
peticion DELETE "/api/games/1/cars/$ID_AUTO"
peticion DELETE "/api/cars/$ID_AUTO"
peticion PATCH "/api/cars/$ID_AUTO/restaurar"

# ============================================================ 7
grupo 7 "Módulos en TypeScript y TypeORM"
ejecutar "npm run typecheck --silent && echo 'TypeScript compila sin errores'"
ejecutar "find src -name '*.ts' | sort"
ejecutar "jq '{typeorm: .dependencies.typeorm, typescript: .devDependencies.typescript}' package.json"
