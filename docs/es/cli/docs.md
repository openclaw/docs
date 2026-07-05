---
read_when:
    - Quieres buscar en la documentación en vivo de OpenClaw desde la terminal
    - Necesitas saber a qué API de búsqueda alojada llama la CLI de la documentación
summary: Referencia de CLI para `openclaw docs` (buscar en el índice de documentación en vivo)
title: Documentación
x-i18n:
    generated_at: "2026-07-05T11:07:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0b575f0b76d40a53dd4f79c55fd65969a24eae27e27bd1c46d395f61fe89e42
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Busca en el índice activo de la documentación de OpenClaw desde la terminal.

## Uso

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

| Argumento    | Descripción                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `[query...]` | Consulta de búsqueda de formato libre. Las consultas de varias palabras se unen con espacios y se envían como una sola. |

Sin consulta, `openclaw docs` imprime la URL del punto de entrada de la documentación y un comando de búsqueda de ejemplo en lugar de ejecutar una búsqueda.

## Ejemplos

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

## Cómo funciona

`openclaw docs` llama a `https://docs.openclaw.ai/api/search` y renderiza los resultados JSON. La solicitud de búsqueda usa un tiempo de espera fijo de 30 segundos.

## Salida

En una terminal enriquecida (TTY), los resultados se renderizan como un encabezado seguido de una lista con viñetas: título de la página, URL enlazada de la documentación y un breve fragmento en la línea siguiente. Los resultados vacíos imprimen "Sin resultados.".

En la salida no enriquecida (canalizada, `--no-color`, scripts), los mismos datos se renderizan como Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Códigos de salida

| Código | Significado                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `0`    | La búsqueda se realizó correctamente, incluidas las respuestas sin resultados. |
| `1`    | La llamada a la API de búsqueda de documentación alojada falló; stderr imprime el mensaje de error. |

## Relacionado

- [Referencia de CLI](/es/cli)
- [Documentación en vivo](https://docs.openclaw.ai)
