---
read_when:
    - Publicación de almas
    - Depuración de fallos de publicación de soul
summary: Formato del paquete de alma, archivos obligatorios, límites.
x-i18n:
    generated_at: "2026-05-12T23:29:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Formato de soul

## En disco

Un soul es un único archivo:

- `SOUL.md` (o `soul.md`)

Por ahora, onlycrabs.ai rechaza cualquier archivo adicional.

## `SOUL.md`

- Markdown con frontmatter YAML opcional.
- El servidor extrae metadatos del frontmatter durante la publicación.
- `description` se usa como resumen del soul en la UI/búsqueda.

## Límites

- Tamaño total del paquete: 50MB.
- El texto de incrustación incluye solo `SOUL.md`.

## Slugs

- Se derivan del nombre de la carpeta de forma predeterminada.
- Deben estar en minúsculas y ser aptos para URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionado + etiquetas

- Cada publicación crea una nueva versión (semver).
- Las etiquetas son punteros de cadena a una versión; `latest` se usa comúnmente.
