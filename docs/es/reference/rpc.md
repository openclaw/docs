---
read_when:
    - Agregar o cambiar integraciones externas de CLI
    - Depurar adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLI externas (signal-cli, imsg) y patrones de Gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-07-05T11:45:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLI externas mediante JSON-RPC. Hoy se usan dos patrones.

## Patrón A: daemon HTTP (signal-cli)

- `signal-cli` se ejecuta como daemon con JSON-RPC sobre HTTP.
- El flujo de eventos es SSE (`/api/v1/events`).
- Sondeo de estado: `/api/v1/check`.
- OpenClaw gestiona el ciclo de vida cuando `channels.signal.autoStart=true`.

Consulta [Signal](/es/channels/signal) para la configuración y los endpoints.

## Patrón B: proceso hijo stdio (imsg)

- OpenClaw genera `imsg rpc` como proceso hijo para [iMessage](/es/channels/imessage).
- JSON-RPC está delimitado por líneas sobre stdin/stdout (un objeto JSON por línea).
- No se requiere puerto TCP ni daemon.

Métodos principales usados:

- `watch.subscribe` → notificaciones (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sondeo/diagnósticos)

Consulta [iMessage](/es/channels/imessage) para la configuración y el direccionamiento (se prefiere `chat_id` a las cadenas de visualización).

## Directrices del adaptador

- Gateway gestiona el proceso (inicio/detención vinculados al ciclo de vida del proveedor).
- Mantén resilientes los clientes RPC: tiempos de espera, reinicio al salir.
- Prefiere identificadores estables (por ejemplo, `chat_id`) a cadenas de visualización.

## Relacionado

- [Protocolo de Gateway](/es/gateway/protocol)
