---
read_when:
    - Adicionar ou alterar integrações externas de CLI
    - Depuração de adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLIs externas (signal-cli, imsg) e padrões de Gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-05-07T01:53:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw integra CLIs externos via JSON-RPC. Dois padrões são usados atualmente.

## Padrão A: daemon HTTP (signal-cli)

- `signal-cli` é executado como um daemon com JSON-RPC sobre HTTP.
- O fluxo de eventos é SSE (`/api/v1/events`).
- Sonda de integridade: `/api/v1/check`.
- OpenClaw gerencia o ciclo de vida quando `channels.signal.autoStart=true`.

Consulte [Signal](/pt-BR/channels/signal) para configuração e endpoints.

## Padrão B: processo filho stdio (legado: imsg)

> **Observação:** Para novas configurações do iMessage, use [BlueBubbles](/pt-BR/channels/bluebubbles).

- OpenClaw inicia `imsg rpc` como um processo filho (integração legada do iMessage).
- JSON-RPC é delimitado por linha sobre stdin/stdout (um objeto JSON por linha).
- Nenhuma porta TCP, nenhum daemon necessário.

Métodos principais usados:

- `watch.subscribe` → notificações (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonda/diagnósticos)

Consulte [iMessage](/pt-BR/channels/imessage) para configuração legada e endereçamento (`chat_id` preferencial).

## Diretrizes para adaptadores

- Gateway gerencia o processo (início/parada vinculados ao ciclo de vida do provedor).
- Mantenha os clientes RPC resilientes: timeouts, reinício ao sair.
- Prefira IDs estáveis (por exemplo, `chat_id`) em vez de strings de exibição.

## Relacionado

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
