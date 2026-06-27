---
read_when:
    - Agregar o cambiar integraciones externas de CLI
    - Depuración de adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLI externas (signal-cli, imsg) y patrones de Gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-05-11T20:52:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw integra CLI externas mediante JSON-RPC. Hoy se utilizan dos patrones.

## Patrón A: demonio HTTP (signal-cli)

- `signal-cli` se ejecuta como demonio con JSON-RPC sobre HTTP.
- El flujo de eventos es SSE (`/api/v1/events`).
- Sondeo de estado: `/api/v1/check`.
- OpenClaw controla el ciclo de vida cuando `channels.signal.autoStart=true`.

Consulta [Signal](/es/channels/signal) para la configuración y los puntos de conexión.

## Patrón B: proceso hijo stdio (imsg)

- OpenClaw genera `imsg rpc` como proceso hijo para [iMessage](/es/channels/imessage).
- JSON-RPC está delimitado por líneas sobre stdin/stdout (un objeto JSON por línea).
- No se requiere puerto TCP ni demonio.

Métodos principales utilizados:

- `watch.subscribe` → notificaciones (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sondeo/diagnóstico)

Consulta [iMessage](/es/channels/imessage) para la configuración heredada y el direccionamiento (`chat_id` preferido).

## Directrices para adaptadores

- Gateway controla el proceso (inicio/detención vinculados al ciclo de vida del proveedor).
- Mantén resilientes los clientes RPC: tiempos de espera, reinicio al salir.
- Prefiere IDs estables (por ejemplo, `chat_id`) en lugar de cadenas de visualización.

## Relacionado

- [Protocolo de Gateway](/es/gateway/protocol)
