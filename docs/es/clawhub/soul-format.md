---
read_when:
    - Publicación de almas
    - Depuración de errores de publicación de soul
summary: Formato del paquete Soul, archivos requeridos, límites.
x-i18n:
    generated_at: "2026-05-12T15:42:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Formato de alma

## En disco

Un alma es un único archivo:

- `SOUL.md` (o `soul.md`)

Por ahora, onlycrabs.ai rechaza cualquier archivo adicional.

## `SOUL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae metadatos del frontmatter durante la publicación.
- `description` se usa como resumen del alma en la interfaz de usuario/búsqueda.

## Límites

- Tamaño total del paquete: 50 MB.
- El texto de embedding incluye solo `SOUL.md`.

## Slugs

- Derivados del nombre de la carpeta de forma predeterminada.
- Deben estar en minúsculas y ser seguros para URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionado + etiquetas

- Cada publicación crea una versión nueva (semver).
- Las etiquetas son punteros de cadena a una versión; `latest` se usa comúnmente.
