#!/usr/bin/env bash
# Pruebas de humo del API games-cars.
# Uso: bash pruebas/pruebas-api.sh
# Requiere la API corriendo en http://localhost:3000 y la base recién cargada
# desde bdDump.sql (los ids nuevos que crea este script no chocan con el dump).
set -u

BASE="${BASE:-http://localhost:3000}"
SALIDA="${SALIDA:-/tmp/opencode/evidencias-txt}"
mkdir -p "$SALIDA"

pasan=0
fallan=0
seccion=0
ULTIMO="$SALIDA/ultimo.json"

grupo() {
  seccion=$1
  : > "$SALIDA/seccion-$seccion.txt"
  printf '# %s\n' "$2" >> "$SALIDA/seccion-$seccion.txt"
  printf '\n===== %s =====\n' "$2"
}

# peticion METODO RUTA [JSON] [CODIGO_ESPERADO]
# Guarda el cuerpo de la respuesta en $ULTIMO.
peticion() {
  local metodo=$1 ruta=$2 datos="${3:-}" esperado="${4:-}"
  local codigo

  if [ -n "$datos" ]; then
    codigo=$(curl -s -o "$ULTIMO" -w '%{http_code}' -X "$metodo" \
      -H 'Content-Type: application/json' -d "$datos" "$BASE$ruta")
    printf '$ curl -s -X %s %s%s -H "Content-Type: application/json" -d %s\n' \
      "$metodo" "$BASE" "$ruta" "'$datos'" | tee -a "$SALIDA/seccion-$seccion.txt"
  else
    codigo=$(curl -s -o "$ULTIMO" -w '%{http_code}' -X "$metodo" "$BASE$ruta")
    printf '$ curl -s -X %s %s%s\n' "$metodo" "$BASE" "$ruta" \
      | tee -a "$SALIDA/seccion-$seccion.txt"
  fi

  printf 'HTTP %s\n' "$codigo" | tee -a "$SALIDA/seccion-$seccion.txt"
  { jq . "$ULTIMO" 2>/dev/null || cat "$ULTIMO"; } \
    | tee -a "$SALIDA/seccion-$seccion.txt"
  printf '\n' | tee -a "$SALIDA/seccion-$seccion.txt"

  if [ -n "$esperado" ]; then
    if [ "$codigo" = "$esperado" ]; then
      pasan=$((pasan + 1))
    else
      fallan=$((fallan + 1))
      printf 'FALLO: se esperaba HTTP %s y llego %s (%s %s)\n' \
        "$esperado" "$codigo" "$metodo" "$ruta" >&2
    fi
  fi
}

grupo 1 "API en TypeScript: estado y catálogo de juegos"
peticion GET "/"
peticion GET "/api/games" "" 200
peticion GET "/api/games/1" "" 200
peticion GET "/api/games/buscar/nombre?q=forza" "" 200
peticion GET "/api/games/buscar/descripcion?q=mundo" "" 200

grupo 2 "CRUD completo del catálogo games"
JUEGO='{"Title":"Juego de prueba","Desc":"Creado para comprobar el CRUD en TypeScript","Relace_date":"2026-10-25","Price":499,"Developer":"Equipo","Publisher":"Equipo","Rating":"E","Platform":"PC","Game_mode":"Individual","Categori-id":1,"tracks":[{"Track-name":"Circuito de prueba","Location":"Jalisco","Track-type":"Circuito","Length-km":5,"difficulty-level":"Media"}],"features":[{"Feature-name":"Modo foto","Feature-value":"Si"}]}'
peticion POST "/api/games" "$JUEGO" 201
ID_JUEGO=$(jq -r '.["id-game-car"]' "$ULTIMO")

ACTUALIZADO="{\"Title\":\"Juego de prueba actualizado\",\"Desc\":\"CRUD verificado\",\"Relace_date\":\"2026-10-25\",\"Price\":599,\"Developer\":\"Equipo\",\"Publisher\":\"Equipo\",\"Rating\":\"E\",\"Platform\":\"PC\",\"Game_mode\":\"Individual\",\"Categori-id\":1,\"tracks\":[{\"Track-name\":\"Circuito nuevo A\",\"Location\":\"Jalisco\",\"Track-type\":\"Circuito\",\"Length-km\":4,\"difficulty-level\":\"Facil\"},{\"Track-name\":\"Circuito nuevo B\",\"Location\":\"Nayarit\",\"Track-type\":\"Rally\",\"Length-km\":6,\"difficulty-level\":\"Media\"}],\"features\":[{\"Feature-name\":\"HDR\",\"Feature-value\":\"10 bits\"}]}"
peticion PUT "/api/games/$ID_JUEGO" "$ACTUALIZADO" 200

peticion GET "/api/tracks/todos" "" 200
printf '$ jq "[.[] | select(.\\"id-game-car\\" == %s and .\\"Deleted-at\\" == null)] | length"\n' \
  "$ID_JUEGO" | tee -a "$SALIDA/seccion-$seccion.txt"
CANTIDAD=$(jq "[.[] | select(.[\"id-game-car\"] == $ID_JUEGO and .[\"Deleted-at\"] == null)] | length" "$ULTIMO")
printf '%s\n\n' "$CANTIDAD" | tee -a "$SALIDA/seccion-$seccion.txt"
if [ "$CANTIDAD" = "2" ]; then
  pasan=$((pasan + 1))
else
  fallan=$((fallan + 1))
  printf 'FALLO: el PUT debia dejar 2 pistas y dejó %s\n' "$CANTIDAD" >&2
fi

peticion DELETE "/api/games/$ID_JUEGO" "" 200
peticion GET "/api/games/$ID_JUEGO" "" 200
peticion PATCH "/api/games/$ID_JUEGO/restaurar" "" 200
peticion PATCH "/api/games/$ID_JUEGO/restaurar" "" 404
peticion GET "/api/games/todos" "" 200

grupo 3 "Catálogo categories con CRUD"
peticion GET "/api/categories" "" 200
peticion GET "/api/categories/buscar/nombre?q=juegos" "" 200
peticion POST "/api/categories" '{"Name":"Categoria de prueba"}' 201
ID_CATEGORIA=$(jq -r '.["Categori-id"]' "$ULTIMO")
peticion GET "/api/categories/$ID_CATEGORIA" "" 200
peticion PUT "/api/categories/$ID_CATEGORIA" '{"Name":"Categoria actualizada"}' 200
peticion DELETE "/api/categories/$ID_CATEGORIA" "" 200
peticion PATCH "/api/categories/$ID_CATEGORIA/restaurar" "" 200
peticion GET "/api/categories/buscar/nombre?q=actualizada" "" 200

grupo 4 "Catálogos tracks y features"
peticion GET "/api/tracks" "" 200
peticion GET "/api/tracks/buscar/nombre?q=circuito" "" 200
peticion GET "/api/tracks/buscar/descripcion?q=alemania" "" 200
peticion POST "/api/tracks" '{"id-game-car":1,"Track-name":"Pista de prueba","Location":"Jalisco","Track-type":"Circuito","Length-km":4,"difficulty-level":"Facil"}' 201
ID_PISTA=$(jq -r '.["Tracks-id"]' "$ULTIMO")
peticion GET "/api/tracks/$ID_PISTA" "" 200
peticion PUT "/api/tracks/$ID_PISTA" '{"id-game-car":1,"Track-name":"Pista de prueba actualizada","Location":"Nayarit","Track-type":"Rally","Length-km":5,"difficulty-level":"Media"}' 200
peticion DELETE "/api/tracks/$ID_PISTA" "" 200
peticion PATCH "/api/tracks/$ID_PISTA/restaurar" "" 200

peticion GET "/api/features" "" 200
peticion POST "/api/features" '{"id-game-car":1,"Feature-name":"HDR","Feature-value":"10 bits"}' 201
ID_FEATURE=$(jq -r '.["Features-id"]' "$ULTIMO")
peticion GET "/api/features/$ID_FEATURE" "" 200
peticion PUT "/api/features/$ID_FEATURE" '{"id-game-car":1,"Feature-name":"HDR avanzado","Feature-value":"12 bits"}' 200
peticion DELETE "/api/features/$ID_FEATURE" "" 200
peticion PATCH "/api/features/$ID_FEATURE/restaurar" "" 200

grupo 5 "Vista estante y validaciones"
peticion GET "/api/estante" "" 200
peticion GET "/api/games/9999" "" 404
peticion POST "/api/games" '{}' 400
peticion GET "/api/no-existe" "" 404

echo
echo "Resultado: $pasan pruebas correctas, $fallan fallidas"
[ "$fallan" -eq 0 ]
