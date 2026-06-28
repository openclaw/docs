---
read_when:
    - Você quer conectar eventos Pub/Sub do Gmail ao OpenClaw
    - Você precisa da lista completa de flags e dos valores padrão
summary: Referência da CLI para `openclaw webhooks` (configuração e executor do Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-05-10T19:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw webhooks`

Auxiliares e integrações de Webhook. Hoje, esta superfície é limitada a fluxos Gmail Pub/Sub que se integram ao observador `gog` incluído.

## Subcomandos

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcomando    | Descrição                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------ |
| `gmail setup` | Configura o Gmail watch, o tópico/assinatura Pub/Sub e o destino de entrega de webhook do OpenClaw. |
| `gmail run`   | Executa `gog watch serve` junto com o loop de renovação automática do watch.               |

## `webhooks gmail setup`

Configure o Gmail watch, o Pub/Sub e a entrega de Webhook do OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Obrigatório

| Flag                | Descrição                    |
| ------------------- | ---------------------------- |
| `--account <email>` | Conta do Gmail a observar.   |

### Opções de Pub/Sub

| Flag                    | Padrão                | Descrição                                                   |
| ----------------------- | --------------------- | ----------------------------------------------------------- |
| `--project <id>`        | (nenhum)              | ID do projeto GCP (o proprietário do cliente OAuth).        |
| `--topic <name>`        | `gog-gmail-watch`     | Nome do tópico Pub/Sub.                                     |
| `--subscription <name>` | `gog-gmail-watch-push` | Nome da assinatura Pub/Sub.                                |
| `--label <label>`       | `INBOX`               | Rótulo do Gmail a observar.                                 |
| `--push-endpoint <url>` | (nenhum)              | Endpoint push explícito do Pub/Sub. Substitui Tailscale.    |

### Opções de entrega do OpenClaw

| Flag                   | Padrão   | Descrição                                |
| ---------------------- | -------- | ---------------------------------------- |
| `--hook-url <url>`     | (nenhum) | URL de Webhook do OpenClaw.              |
| `--hook-token <token>` | (nenhum) | Token de Webhook do OpenClaw.            |
| `--push-token <token>` | (nenhum) | Token push encaminhado para `gog watch serve`. |

### Opções de `gog watch serve`

| Flag                  | Padrão          | Descrição                                                           |
| --------------------- | --------------- | ------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Host de bind do `gog watch serve`.                                  |
| `--port <port>`       | `8788`          | Porta do `gog watch serve`.                                         |
| `--path <path>`       | `/gmail-pubsub` | Caminho do `gog watch serve`.                                       |
| `--include-body`      | `true`          | Inclui trechos do corpo do email. Passe `--no-include-body` para desativar. |
| `--max-bytes <n>`     | `20000`         | Máximo de bytes por trecho do corpo.                                |
| `--renew-minutes <n>` | `720` (12h)     | Renova o Gmail watch a cada N minutos.                              |

### Exposição via Tailscale

| Flag                      | Padrão   | Descrição                                                               |
| ------------------------- | -------- | ----------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Expõe o endpoint push via tailscale: `funnel`, `serve` ou `off`.        |
| `--tailscale-path <path>` | (nenhum) | Caminho para tailscale serve/funnel.                                    |
| `--tailscale-target <t>`  | (nenhum) | Destino do Tailscale serve/funnel (porta, `host:port` ou URL).          |

### Saída

| Flag     | Descrição                                             |
| -------- | ----------------------------------------------------- |
| `--json` | Imprime um resumo legível por máquina em vez de texto. |

## `webhooks gmail run`

Execute `gog watch serve` junto com o loop de renovação automática do watch em primeiro plano.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` aceita as mesmas flags de `gog watch serve`, entrega do OpenClaw, Pub/Sub e Tailscale que `setup`, exceto:

- `--account` é **opcional** em `run` (usa a conta configurada como fallback).
- `run` **não** aceita `--project`, `--push-endpoint` nem `--json`.
- As flags de `run` não têm padrões incorporados; valores ausentes usam como fallback os valores gravados por `setup`.

| Categoria         | Flags                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| Entrega OpenClaw  | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Para `run`, o valor de `--topic` é o caminho completo do tópico Pub/Sub (`projects/.../topics/...`), não apenas o nome curto do tópico.
</Note>

## Fluxo de ponta a ponta

Consulte [integração Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration) para a configuração do projeto GCP, OAuth e do lado do gateway que funciona com estes comandos da CLI.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Automação de Webhook](/pt-BR/automation/cron-jobs)
- [Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration)
