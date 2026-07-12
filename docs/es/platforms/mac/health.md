---
read_when:
    - Depuración de los indicadores de estado de la app para Mac
summary: Cómo informa la aplicación para macOS sobre los estados de salud del Gateway y de los canales
title: Comprobaciones de estado (macOS)
x-i18n:
    generated_at: "2026-07-11T23:16:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Comprobaciones de estado en macOS

Cómo consultar el estado de los canales vinculados desde la aplicación de la barra de menús.

## Barra de menús

Indicador de estado:

- Verde: vinculado y comprobación correcta.
- Naranja: vinculado, pero la comprobación de un canal indica que está degradado o no conectado.
- Rojo: aún no está vinculado.

La línea secundaria muestra «vinculado · autenticación hace 12 min» o el motivo del fallo.
La opción "Run Health Check Now" del menú inicia una comprobación bajo demanda.

## Ajustes

- La pestaña General muestra una tarjeta de estado: indicador de estado, línea de resumen (estado de vinculación +
  antigüedad de la autenticación) y una línea opcional con los detalles del fallo, además de los botones **Retry now** y
  **Open logs**.
- La **pestaña Channels** muestra el estado y los controles de cada canal (código QR de inicio de sesión,
  cierre de sesión, comprobación, última desconexión/error) para WhatsApp y Telegram.

## Cómo funciona la comprobación

La aplicación llama al RPC `health` del Gateway mediante su conexión WebSocket
existente (sin invocar un shell de la CLI) aproximadamente cada 60 s y bajo demanda. El RPC carga
las credenciales e informa del estado sin enviar mensajes. La aplicación almacena en caché por separado la última
instantánea correcta y el último error para que la interfaz se cargue al instante y
no parpadee mientras está sin conexión.

## En caso de duda

Utilice el flujo de la CLI descrito en [Estado del Gateway](/es/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) y siga
`/tmp/openclaw/openclaw-*.log`, filtrando por `web-heartbeat` / `web-reconnect`.

## Contenido relacionado

- [Estado del Gateway](/es/gateway/health)
- [Aplicación para macOS](/es/platforms/macos)
