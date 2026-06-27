---
read_when:
    - Quieres abrir la interfaz de control con tu token actual
    - Quiere mostrar la URL sin abrir un navegador
summary: Referencia de la CLI para `openclaw dashboard` (abrir la interfaz de control)
title: Panel de control
x-i18n:
    generated_at: "2026-05-05T01:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

Abre la IU de Control con tu autenticación actual.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notas:

- `dashboard` resuelve las SecretRefs configuradas de `gateway.auth.token` cuando es posible.
- `dashboard` respeta `gateway.tls.enabled`: las instancias de Gateway con TLS habilitado imprimen/abren URL de la IU de Control con `https://` y se conectan mediante `wss://`.
- Si falla la entrega al portapapeles/navegador de una URL de dashboard autenticada con token, `dashboard` registra una indicación segura de autenticación manual que nombra `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` y la clave de fragmento `token` sin imprimir el valor del token.
- Para tokens administrados por SecretRef (resueltos o sin resolver), `dashboard` imprime/copia/abre una URL sin token para evitar exponer secretos externos en la salida del terminal, el historial del portapapeles o los argumentos de inicio del navegador.
- Si `gateway.auth.token` está administrado por SecretRef pero no se resuelve en esta ruta de comando, el comando imprime una URL sin token y una guía de corrección explícita en lugar de incrustar un marcador de posición de token no válido.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Dashboard](/es/web/dashboard)
