---
read_when:
    - Depuración de los indicadores de estado de la app para Mac
summary: Cómo informa la app de macOS los estados de salud del gateway/canal
title: Comprobaciones de estado (macOS)
x-i18n:
    generated_at: "2026-07-05T11:31:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Comprobaciones de estado en macOS

Cómo leer el estado de salud del canal vinculado desde la aplicación de la barra de menús.

## Barra de menús

Punto de estado:

- Verde: vinculado + sondeo correcto.
- Naranja: vinculado, pero un sondeo de canal informa degradación/no conectado.
- Rojo: aún no vinculado.

La línea secundaria dice "vinculado · autenticación 12m" o muestra el motivo del error.
"Ejecutar comprobación de estado ahora" en el menú activa un sondeo bajo demanda.

## Ajustes

- La pestaña General muestra una tarjeta de estado: punto de estado, línea de resumen (estado del vínculo +
  antigüedad de la autenticación) y una línea opcional de detalle del error, con botones **Reintentar ahora** y
  **Abrir registros**.
- La **pestaña Canales** muestra el estado y los controles por canal (QR de inicio de sesión,
  cierre de sesión, sondeo, última desconexión/error) para WhatsApp y Telegram.

## Cómo funciona el sondeo

La aplicación llama al RPC `health` del Gateway a través de su conexión WebSocket
existente (no mediante una llamada a la CLI) cada ~60 s y bajo demanda. El RPC carga
credenciales e informa el estado sin enviar mensajes. La aplicación almacena en caché la última
instantánea correcta y el último error por separado para que la UI cargue al instante y
no parpadee mientras está sin conexión.

## En caso de duda

Use el flujo de CLI en [Salud del Gateway](/es/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) y siga
`/tmp/openclaw/openclaw-*.log`, filtrando por `web-heartbeat` / `web-reconnect`.

## Relacionado

- [Salud del Gateway](/es/gateway/health)
- [Aplicación de macOS](/es/platforms/macos)
