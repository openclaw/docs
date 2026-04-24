---
read_when:
    - Quieres buscar en la documentación activa de OpenClaw desde la terminal
summary: Referencia de la CLI para `openclaw docs` (buscar en el índice activo de la documentación)
title: Documentación
x-i18n:
    generated_at: "2026-04-24T05:22:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Busca en el índice activo de la documentación.

Argumentos:

- `[query...]`: términos de búsqueda para enviar al índice activo de la documentación

Ejemplos:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Notas:

- Sin consulta, `openclaw docs` abre el punto de entrada de búsqueda de la documentación activa.
- Las consultas de varias palabras se envían como una sola solicitud de búsqueda.

## Relacionado

- [Referencia de la CLI](/es/cli)
