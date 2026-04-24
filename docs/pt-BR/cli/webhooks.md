---
read_when:
    - Você quer conectar eventos do Gmail Pub/Sub ao OpenClaw
    - Você quer comandos auxiliares de Webhook
summary: Referência da CLI para `openclaw webhooks` (helpers de Webhook + Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T05:47:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Helpers e integrações de Webhook (Gmail Pub/Sub, helpers de Webhook).

Relacionados:

- Webhooks: [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configure Gmail watch, Pub/Sub e entrega por Webhook do OpenClaw.

Obrigatório:

- `--account <email>`

Opções:

- `--project <id>`
- `--topic <name>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`
- `--push-endpoint <url>`
- `--json`

Exemplos:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Execute `gog watch serve` junto com o loop de renovação automática do watch.

Opções:

- `--account <email>`
- `--topic <topic>`
- `--subscription <name>`
- `--label <label>`
- `--hook-url <url>`
- `--hook-token <token>`
- `--push-token <token>`
- `--bind <host>`
- `--port <port>`
- `--path <path>`
- `--include-body`
- `--max-bytes <n>`
- `--renew-minutes <n>`
- `--tailscale <funnel|serve|off>`
- `--tailscale-path <path>`
- `--tailscale-target <target>`

Exemplo:

```bash
openclaw webhooks gmail run --account you@example.com
```

Consulte a [documentação do Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration) para o fluxo completo de configuração e detalhes operacionais.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Automação por Webhook](/pt-BR/automation/cron-jobs)
