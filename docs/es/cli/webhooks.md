---
read_when:
    - Quieres conectar eventos de Gmail Pub/Sub a OpenClaw
    - Quieres comandos auxiliares de Webhook
summary: Referencia de CLI para `openclaw webhooks` (ayudantes de Webhook + Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-04-24T05:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce9b085904918f1fea4daa7728470d492ab3e7d92ad43a6b1e7efe8d9f70868f
    source_path: cli/webhooks.md
    workflow: 15
---

# `openclaw webhooks`

Ayudantes e integraciones de Webhook (Gmail Pub/Sub, ayudantes de Webhook).

Relacionado:

- Webhooks: [Webhooks](/es/automation/cron-jobs#webhooks)
- Gmail Pub/Sub: [Gmail Pub/Sub](/es/automation/cron-jobs#gmail-pubsub-integration)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

### `webhooks gmail setup`

Configura Gmail watch, Pub/Sub y la entrega por Webhook de OpenClaw.

Obligatorio:

- `--account <email>`

Opciones:

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

Ejemplos:

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### `webhooks gmail run`

Ejecuta `gog watch serve` junto con el bucle de renovación automática de watch.

Opciones:

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

Ejemplo:

```bash
openclaw webhooks gmail run --account you@example.com
```

Consulta la [documentación de Gmail Pub/Sub](/es/automation/cron-jobs#gmail-pubsub-integration) para ver el flujo completo de configuración y los detalles operativos.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Automatización con Webhook](/es/automation/cron-jobs)
