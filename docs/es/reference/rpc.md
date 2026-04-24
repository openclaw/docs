---
read_when:
    - Agregar o cambiar integraciones de CLI externas
    - Depurar adaptadores RPC (`signal-cli`, `imsg`)
summary: Adaptadores RPC para CLIs externas (`signal-cli`, `imsg` heredado) y patrones de gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-04-24T05:48:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw integra CLIs externas mediante JSON-RPC. Hoy se usan dos patrones.

## Patrón A: daemon HTTP (`signal-cli`)

- `signal-cli` se ejecuta como daemon con JSON-RPC sobre HTTP.
- El flujo de eventos es SSE (`/api/v1/events`).
- Probe de estado: `/api/v1/check`.
- OpenClaw es propietario del ciclo de vida cuando `channels.signal.autoStart=true`.

Consulta [Signal](/es/channels/signal) para la configuración y los endpoints.

## Patrón B: proceso hijo stdio (heredado: `imsg`)

> **Nota:** Para configuraciones nuevas de iMessage, usa [BlueBubbles](/es/channels/bluebubbles) en su lugar.

- OpenClaw genera `imsg rpc` como proceso hijo (integración heredada de iMessage).
- JSON-RPC está delimitado por líneas sobre stdin/stdout (un objeto JSON por línea).
- No se requiere puerto TCP ni daemon.

Métodos principales usados:

- `watch.subscribe` → notificaciones (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnóstico)

Consulta [iMessage](/es/channels/imessage) para la configuración heredada y el direccionamiento (se prefiere `chat_id`).

## Guías para adaptadores

- El gateway es propietario del proceso (inicio/parada vinculados al ciclo de vida del proveedor).
- Mantén los clientes RPC resilientes: tiempos de espera, reinicio al salir.
- Prefiere IDs estables (por ejemplo `chat_id`) en lugar de cadenas visibles.

## Relacionado

- [Protocolo del Gateway](/es/gateway/protocol)
