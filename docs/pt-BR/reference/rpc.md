---
read_when:
    - Adicionar ou alterar integrações externas de CLI
    - Depuração de adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLIs externas (signal-cli, imsg) e padrões de Gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-05-10T19:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLIs externas via JSON-RPC. Dois padrões são usados hoje.

## Padrão A: daemon HTTP (signal-cli)

- `signal-cli` é executado como um daemon com JSON-RPC sobre HTTP.
- O fluxo de eventos é SSE (`/api/v1/events`).
- Sonda de integridade: `/api/v1/check`.
- OpenClaw controla o ciclo de vida quando `channels.signal.autoStart=true`.

Consulte [Signal](/pt-BR/channels/signal) para configuração e endpoints.

## Padrão B: processo filho stdio (imsg)

- OpenClaw inicia `imsg rpc` como um processo filho para [iMessage](/pt-BR/channels/imessage).
- JSON-RPC é delimitado por linhas sobre stdin/stdout (um objeto JSON por linha).
- Sem porta TCP, sem daemon necessário.

Métodos principais usados:

- `watch.subscribe` → notificações (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonda/diagnósticos)

Consulte [iMessage](/pt-BR/channels/imessage) para configuração legada e endereçamento (`chat_id` preferencial).

## Diretrizes para adaptadores

- Gateway controla o processo (início/parada vinculados ao ciclo de vida do provedor).
- Mantenha os clientes RPC resilientes: timeouts, reiniciar ao sair.
- Prefira IDs estáveis (por exemplo, `chat_id`) a strings de exibição.

## Relacionado

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
