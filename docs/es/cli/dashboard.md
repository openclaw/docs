---
read_when:
    - Quieres abrir la Control UI con tu token actual
    - Quieres imprimir la URL sin iniciar un navegador
summary: Referencia de CLI para `openclaw dashboard` (abrir la interfaz de Control)
title: Panel de control
x-i18n:
    generated_at: "2026-07-05T11:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79c5e0884fca90c582499b73d49a72dccb09dd60cd1777c95040f540a3e539f3
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Abre la interfaz de control usando tu autenticación actual.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: imprime la URL, pero no abre un navegador.
- `--yes`: inicia/instala el Gateway sin pedir confirmación cuando sea necesario.

Notas:

- Resuelve los SecretRefs configurados en `gateway.auth.token` cuando es posible.
- Sigue `gateway.tls.enabled`: los gateways con TLS habilitado imprimen/abren URL de la interfaz de control con `https://` y se conectan mediante `wss://`.
- Para tokens gestionados por SecretRef (resueltos o no resueltos), la URL impresa/copiada/abierta nunca incluye el token, por lo que los secretos externos no se filtran en la salida del terminal, el historial del portapapeles ni los argumentos de apertura del navegador.
- Si `gateway.auth.token` está gestionado por SecretRef pero no se ha resuelto, el comando imprime una URL sin token y orientación de corrección en lugar de un marcador de posición de token no válido.
- Si falla la entrega al portapapeles/navegador para una URL autenticada con token, el comando registra una sugerencia segura de autenticación manual que nombra `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` y la clave de fragmento de URL `token`, sin imprimir el valor del token.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Dashboard](/es/web/dashboard)
