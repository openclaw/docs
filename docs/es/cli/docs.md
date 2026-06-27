---
read_when:
    - Quieres buscar en la documentación activa de OpenClaw desde la terminal
    - Necesitas saber a qué API de búsqueda alojada llama la CLI de documentación
summary: Referencia de CLI para `openclaw docs` (buscar en el índice de documentación en vivo)
title: Documentación
x-i18n:
    generated_at: "2026-06-27T10:58:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Busca en el índice activo de la documentación de OpenClaw desde la terminal. El comando llama a la API de búsqueda de documentación de OpenClaw alojada en Cloudflare y muestra los resultados en tu terminal.

## Uso

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumentos:

| Argumento    | Descripción                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| `[query...]` | Consulta de búsqueda de formato libre. Las consultas de varias palabras se unen con espacios y se envían como una sola. |

## Ejemplos

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Sin consulta, `openclaw docs` imprime la URL del punto de entrada de la documentación más un comando de búsqueda de ejemplo en lugar de ejecutar una búsqueda.

## Cómo funciona

`openclaw docs` llama a `https://docs.openclaw.ai/api/search` y muestra los resultados JSON. La llamada de búsqueda usa un tiempo de espera fijo de 30 segundos.

## Salida

En una terminal enriquecida (TTY), los resultados se muestran como un encabezado seguido de una lista con viñetas. Cada viñeta muestra el título de la página, la URL enlazada de la documentación y un breve fragmento en la línea siguiente. Los resultados vacíos imprimen "Sin resultados.".

En salida no enriquecida (canalizada, `--no-color`, scripts), los mismos datos se muestran como Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Códigos de salida

| Código | Significado                                                                  |
| ------ | ---------------------------------------------------------------------------- |
| `0`    | La búsqueda se completó correctamente (incluidas las respuestas sin resultados). |
| `1`    | Falló la llamada a la API de búsqueda de documentación alojada; stderr se imprime en línea. |

## Relacionado

- [Referencia de CLI](/es/cli)
- [Documentación activa](https://docs.openclaw.ai)
