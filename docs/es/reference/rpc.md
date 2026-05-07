---
read_when:
    - Agregar o cambiar integraciones externas de CLI
    - Depuración de adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLI externas (signal-cli, imsg) y patrones de Gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-05-07T01:53:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLI externas mediante JSON-RPC. Actualmente se usan dos patrones.

## Patrón A: daemon HTTP (signal-cli)

- `signal-cli` se ejecuta como daemon con JSON-RPC sobre HTTP.
- El flujo de eventos es SSE (`/api/v1/events`).
- Sondeo de salud: `/api/v1/check`.
- OpenClaw controla el ciclo de vida cuando `channels.signal.autoStart=true`.

Consulta [Signal](/es/channels/signal) para la configuración y los endpoints.

## Patrón B: proceso hijo stdio (heredado: imsg)

> **Nota:** Para nuevas configuraciones de iMessage, usa [BlueBubbles](/es/channels/bluebubbles) en su lugar.

- OpenClaw inicia `imsg rpc` como proceso hijo (integración heredada de iMessage).
- JSON-RPC se delimita por líneas sobre stdin/stdout (un objeto JSON por línea).
- No se requiere puerto TCP ni daemon.

Métodos principales usados:

- `watch.subscribe` → notificaciones (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sondeo/diagnóstico)

Consulta [iMessage](/es/channels/imessage) para la configuración heredada y el direccionamiento (`chat_id` preferido).

## Pautas para adaptadores

- Gateway controla el proceso (inicio/detención vinculados al ciclo de vida del proveedor).
- Mantén los clientes RPC resilientes: tiempos de espera, reinicio al salir.
- Prefiere identificadores estables (por ejemplo, `chat_id`) en lugar de cadenas de visualización.

## Relacionado

- [Protocolo de Gateway](/es/gateway/protocol)
