---
read_when:
    - Adição ou alteração de integrações externas da CLI
    - Depuração de adaptadores RPC (signal-cli, imsg)
summary: Adaptadores RPC para CLIs externas (signal-cli, imsg) e padrões de Gateway
title: Adaptadores RPC
x-i18n:
    generated_at: "2026-07-12T00:22:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

O OpenClaw integra CLIs externas via JSON-RPC. Atualmente, são usados dois padrões.

## Padrão A: daemon HTTP (signal-cli)

- O `signal-cli` é executado como um daemon com JSON-RPC via HTTP.
- O fluxo de eventos usa SSE (`/api/v1/events`).
- Sonda de integridade: `/api/v1/check`.
- O OpenClaw gerencia o ciclo de vida quando `channels.signal.autoStart=true`.

Consulte [Signal](/pt-BR/channels/signal) para ver a configuração e os endpoints.

## Padrão B: processo filho via stdio (imsg)

- O OpenClaw inicia `imsg rpc` como um processo filho para o [iMessage](/pt-BR/channels/imessage).
- O JSON-RPC é delimitado por linhas em stdin/stdout (um objeto JSON por linha).
- Nenhuma porta TCP e nenhum daemon são necessários.

Principais métodos usados:

- `watch.subscribe` → notificações (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sondagem/diagnóstico)

Consulte [iMessage](/pt-BR/channels/imessage) para ver a configuração e o endereçamento (prefira `chat_id` a strings de exibição).

## Diretrizes para adaptadores

- O Gateway gerencia o processo (início/parada vinculados ao ciclo de vida do provedor).
- Mantenha os clientes RPC resilientes: use tempos limite e reinicie após o encerramento.
- Prefira IDs estáveis (por exemplo, `chat_id`) a strings de exibição.

## Relacionado

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
