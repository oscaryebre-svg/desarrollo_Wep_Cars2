#!/usr/bin/env python3
"""Convierte el texto real de las pruebas (pruebas/capturas.sh) en capturas PNG
con aspecto de terminal. No inventa contenido: solo dibuja la transcripción."""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FUENTE = "/usr/share/fonts/noto/NotoSansMono-Regular.ttf"
FUENTE_NEGRITA = "/usr/share/fonts/noto/NotoSansMono-Bold.ttf"

ANCHO = 1000
MARGEN = 24
TAMANO = 15
INTERLINEADO = 22
MAX_CARACTERES = 100
MAX_LINEAS = 140

FONDO = "#0b0f14"
BARRA = "#161b22"
TEXTO = "#d7dde5"
PROMPT = "#7ee787"
HTTP = "#79c0ff"
AVISO = "#8b949e"

NOMBRES = {
    1: "evidencia-1-api-games.png",
    2: "evidencia-2-crud-games.png",
    3: "evidencia-3-crud-categories.png",
    4: "evidencia-4-crud-tracks-features.png",
    5: "evidencia-5-vista-estante-validaciones.png",
    6: "evidencia-6-cars-nm.png",
    7: "evidencia-7-typescript-typeorm.png",
}


def envolver(texto: str) -> list[str]:
    """Corta líneas largas respetando la indentación de JSON."""
    salida: list[str] = []

    for original in texto.rstrip("\n").split("\n"):
        linea = original

        while len(linea) > MAX_CARACTERES:
            sangria = len(linea) - len(linea.lstrip(" "))
            corte = linea.rfind(" ", 0, MAX_CARACTERES)

            # Si el único espacio está en la sangría, se corta por caracteres.
            if corte <= sangria:
                corte = MAX_CARACTERES

            salida.append(linea[:corte])
            linea = " " * (sangria + 2) + linea[corte:].lstrip()

        salida.append(linea)

    return salida


def color_de(linea: str) -> str:
    if linea.startswith("$ "):
        return PROMPT
    if linea.startswith("HTTP "):
        return HTTP
    if linea.startswith("TypeScript compila"):
        return PROMPT
    return TEXTO


def renderizar(entrada: Path, salida: Path) -> None:
    crudo = entrada.read_text(encoding="utf-8")
    lineas = crudo.split("\n")
    titulo = lineas[0].lstrip("# ").strip()
    cuerpo = "\n".join(lineas[1:])
    dibujo_lineas = envolver(cuerpo)[:MAX_LINEAS]

    if len(envolver(cuerpo)) > MAX_LINEAS:
        dibujo_lineas.append("... (transcripción completa en pruebas/)")

    fuente = ImageFont.truetype(FUENTE, TAMANO)
    negrita = ImageFont.truetype(FUENTE_NEGRITA, 16)

    alto = 62 + MARGEN + INTERLINEADO * len(dibujo_lineas) + MARGEN
    imagen = Image.new("RGB", (ANCHO, alto), FONDO)
    dibujo = ImageDraw.Draw(imagen)

    dibujo.rectangle([0, 0, ANCHO, 46], fill=BARRA)
    for indice, color in enumerate(("#ff5f56", "#ffbd2e", "#27c93f")):
        x = 20 + indice * 20
        dibujo.ellipse([x, 17, x + 12, 29], fill=color)

    dibujo.text((90, 13), titulo, font=negrita, fill=TEXTO)

    y = 62 + MARGEN
    for linea in dibujo_lineas:
        dibujo.text((MARGEN, y), linea, font=fuente, fill=color_de(linea))
        y += INTERLINEADO

    imagen.save(salida)
    print(f"{salida} ({ANCHO}x{alto})")


def main() -> int:
    directorio = Path(
        sys.argv[1] if len(sys.argv) > 1 else "/tmp/opencode/capturas-txt"
    )
    destino = Path(sys.argv[2] if len(sys.argv) > 2 else "evidencias")
    destino.mkdir(parents=True, exist_ok=True)

    secciones = sorted(directorio.glob("seccion-*.txt"))

    if not secciones:
        print(f"No hay secciones en {directorio}", file=sys.stderr)
        return 1

    for seccion in secciones:
        numero = int(seccion.stem.split("-")[1])
        nombre = NOMBRES.get(numero, f"evidencia-{numero}.png")
        renderizar(seccion, destino / nombre)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
