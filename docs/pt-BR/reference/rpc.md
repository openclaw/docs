---
read_when:
    - Adicionar ou alterar integrações com CLI externa
    - Depurar adaptadores RPC (`signal-cli`, `imsg`)
summary: Adaptadores RPC para CLIs externas (`signal-cli`, `imsg` legado) e padrões de gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-04-24T06:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

O OpenClaw integra CLIs externas via JSON-RPC. Dois padrões são usados hoje.

## Padrão A: daemon HTTP (`signal-cli`)

- `signal-cli` é executado como daemon com JSON-RPC por HTTP.
- O stream de eventos é SSE (`/api/v1/events`).
- Probe de integridade: `/api/v1/check`.
- O OpenClaw controla o ciclo de vida quando `channels.signal.autoStart=true`.

Consulte [Signal](/pt-BR/channels/signal) para configuração e endpoints.

## Padrão B: processo filho via stdio (legado: `imsg`)

> **Observação:** Para novas configurações de iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles) no lugar.

- O OpenClaw inicia `imsg rpc` como processo filho (integração legada com iMessage).
- JSON-RPC é delimitado por linha em stdin/stdout (um objeto JSON por linha).
- Sem porta TCP, sem necessidade de daemon.

Métodos principais usados:

- `watch.subscribe` → notificações (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnósticos)

Consulte [iMessage](/pt-BR/channels/imessage) para configuração legada e endereçamento (`chat_id` é preferido).

## Diretrizes de adaptador

- O Gateway controla o processo (início/parada vinculados ao ciclo de vida do provedor).
- Mantenha clientes RPC resilientes: timeouts, reinício ao sair.
- Prefira IDs estáveis (por exemplo `chat_id`) em vez de strings de exibição.

## Relacionado

- [Gateway Protocol](/pt-BR/gateway/protocol)
