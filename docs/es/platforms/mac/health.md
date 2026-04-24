---
read_when:
    - Depurar los indicadores de estado de la app para Mac
summary: Cómo la app de macOS informa los estados de salud de gateway/Baileys
title: Comprobaciones de estado (macOS)
x-i18n:
    generated_at: "2026-04-24T05:38:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Comprobaciones de estado en macOS

Cómo ver si el canal vinculado está en buen estado desde la app de barra de menús.

## Barra de menús

- El punto de estado ahora refleja el estado de Baileys:
  - Verde: vinculado + socket abierto recientemente.
  - Naranja: conectando/reintentando.
  - Rojo: sesión cerrada o fallo del sondeo.
- La línea secundaria muestra "linked · auth 12m" o el motivo del fallo.
- El elemento de menú "Run Health Check" activa un sondeo bajo demanda.

## Configuración

- La pestaña General incorpora una tarjeta de estado que muestra: antigüedad de autenticación vinculada, ruta/recuento del almacén de sesiones, hora de la última comprobación, último error/código de estado y botones para Run Health Check / Reveal Logs.
- Usa una instantánea en caché para que la UI cargue al instante y tenga un comportamiento de respaldo correcto cuando no hay conexión.
- La **pestaña Channels** muestra el estado del canal + controles para WhatsApp/Telegram (QR de inicio de sesión, cierre de sesión, sondeo, último error/desconexión).

## Cómo funciona el sondeo

- La app ejecuta `openclaw health --json` mediante `ShellExecutor` aproximadamente cada 60 s y bajo demanda. El sondeo carga credenciales e informa el estado sin enviar mensajes.
- Almacena en caché por separado la última instantánea válida y el último error para evitar parpadeos; muestra la marca de tiempo de cada uno.

## En caso de duda

- Aún puedes usar el flujo de CLI en [Estado de Gateway](/es/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) y seguir `/tmp/openclaw/openclaw-*.log` para `web-heartbeat` / `web-reconnect`.

## Relacionado

- [Estado de Gateway](/es/gateway/health)
- [App de macOS](/es/platforms/macos)
