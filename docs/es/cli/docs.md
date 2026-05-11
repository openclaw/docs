---
read_when:
    - Quieres buscar en la documentación en vivo de OpenClaw desde la terminal
    - Necesitas saber a qué binarios auxiliares invoca la CLI de documentación
summary: Referencia de la CLI para `openclaw docs` (buscar en el índice de la documentación en vivo)
title: Documentación
x-i18n:
    generated_at: "2026-05-11T20:26:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0f733083bf455695ed24b13db6fe53e95aa3804fa8696a2fd29e749f24324c8
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Busca en el índice activo de la documentación de OpenClaw desde la terminal. El comando invoca el endpoint público de búsqueda MCP de la documentación alojada en Mintlify en `https://docs.openclaw.ai/mcp.SearchOpenClaw` y muestra los resultados en tu terminal.

## Uso

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumentos:

| Argumento    | Descripción                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------- |
| `[query...]` | Consulta de búsqueda de formato libre. Las consultas con varias palabras se unen con espacios y se envían como una sola. |

## Ejemplos

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Sin consulta, `openclaw docs` imprime la URL de entrada de la documentación junto con un comando de búsqueda de ejemplo en lugar de ejecutar una búsqueda.

## Cómo funciona

`openclaw docs` invoca la CLI `mcporter` para llamar a la herramienta MCP de búsqueda de la documentación y luego analiza los bloques `Title: / Link: / Content:` de la salida de la herramienta en una lista de resultados.

Para resolver `mcporter`, OpenClaw comprueba en orden:

1. `mcporter` en `PATH` (se usa directamente si está presente).
2. `pnpm dlx mcporter ...` si `pnpm` está instalado.
3. `npx -y mcporter ...` si `npx` está instalado.

Si ninguno está disponible, el comando falla con una sugerencia para instalar `pnpm` (`npm install -g pnpm`).

La llamada de búsqueda usa un tiempo de espera fijo de 30 segundos. Los fragmentos de resultados se truncan a ~220 caracteres por entrada.

## Salida

En una terminal enriquecida (TTY), los resultados se muestran como un encabezado seguido de una lista con viñetas. Cada viñeta muestra el título de la página, la URL enlazada de la documentación y un fragmento breve en la línea siguiente. Los resultados vacíos imprimen "Sin resultados.".

En salida no enriquecida (redirigida, `--no-color`, scripts), los mismos datos se muestran como Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Códigos de salida

| Código | Significado                                                    |
| ------ | -------------------------------------------------------------- |
| `0`    | La búsqueda se completó correctamente (incluidas respuestas sin resultados). |
| `1`    | La llamada a la herramienta MCP falló; stderr se imprime en línea. |

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Documentación activa](https://docs.openclaw.ai)
