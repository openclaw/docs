---
read_when:
    - Adición o modificación de integraciones externas de CLI
    - Depuración de adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLI externas (signal-cli, imsg) y patrones de Gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-07-11T23:30:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLI externas mediante JSON-RPC. Actualmente se utilizan dos patrones.

## Patrón A: demonio HTTP (signal-cli)

- `signal-cli` se ejecuta como demonio con JSON-RPC sobre HTTP.
- El flujo de eventos utiliza SSE (`/api/v1/events`).
- Comprobación de estado: `/api/v1/check`.
- OpenClaw controla el ciclo de vida cuando `channels.signal.autoStart=true`.

Consulta [Signal](/es/channels/signal) para obtener información sobre la configuración y los endpoints.

## Patrón B: proceso hijo mediante stdio (imsg)

- OpenClaw inicia `imsg rpc` como proceso hijo para [iMessage](/es/channels/imessage).
- JSON-RPC se delimita por líneas a través de stdin/stdout (un objeto JSON por línea).
- No se requiere ningún puerto TCP ni demonio.

Métodos principales utilizados:

- `watch.subscribe` → notificaciones (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (comprobación/diagnóstico)

Consulta [iMessage](/es/channels/imessage) para obtener información sobre la configuración y el direccionamiento (se prefiere `chat_id` a las cadenas de visualización).

## Directrices para adaptadores

- Gateway controla el proceso (el inicio y la detención están vinculados al ciclo de vida del proveedor).
- Mantén la resiliencia de los clientes RPC: tiempos de espera y reinicio al finalizar.
- Prefiere identificadores estables (p. ej., `chat_id`) a las cadenas de visualización.

## Temas relacionados

- [Protocolo de Gateway](/es/gateway/protocol)
