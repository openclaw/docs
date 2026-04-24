---
read_when:
    - Quieres abrir la interfaz de Control con tu token actual
    - Quieres imprimir la URL sin abrir un navegador
summary: Referencia de CLI para `openclaw dashboard` (abrir la interfaz de Control)
title: Panel de control
x-i18n:
    generated_at: "2026-04-24T05:22:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Abre la interfaz de Control usando tu autenticación actual.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notas:

- `dashboard` resuelve los SecretRef configurados de `gateway.auth.token` cuando es posible.
- Para tokens gestionados por SecretRef (resueltos o no resueltos), `dashboard` imprime/copia/abre una URL sin token para evitar exponer secretos externos en la salida del terminal, el historial del portapapeles o los argumentos de apertura del navegador.
- Si `gateway.auth.token` está gestionado por SecretRef pero no se resuelve en esta ruta de comando, el comando imprime una URL sin token y una guía explícita de corrección en lugar de incrustar un marcador de posición de token no válido.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Panel de control](/es/web/dashboard)
