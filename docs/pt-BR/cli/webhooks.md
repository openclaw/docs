---
read_when:
    - Você quer integrar eventos do Pub/Sub do Gmail ao OpenClaw
    - Você precisa da lista completa de flags e dos valores padrão
summary: Referência da CLI para `openclaw webhooks` (configuração e executor do Pub/Sub do Gmail)
title: Webhooks
x-i18n:
    generated_at: "2026-07-12T15:03:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Auxiliares e integrações de Webhook. Atualmente, essa interface é limitada aos fluxos do Gmail Pub/Sub criados com o observador `gog` incluído.

## Subcomandos

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcomando    | Descrição                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| `gmail setup` | Assistente de configuração inicial: observação do Gmail, tópico/assinatura do Pub/Sub e entrega ao hook do OpenClaw. |
| `gmail run`   | Executa `gog watch serve` e o ciclo de renovação automática da observação em primeiro plano.   |

<Note>
O Gateway também inicia automaticamente `gog gmail watch serve` durante a inicialização quando `hooks.enabled=true` e `hooks.gmail.account` estão definidos (configurados por `gmail setup`). `gmail run` usa a mesma lógica em primeiro plano, sendo útil para depuração ou quando o observador do Gateway está desativado. Consulte [Integração com o Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration) para obter detalhes sobre a inicialização automática e a opção de desativação `OPENCLAW_SKIP_GMAIL_WATCHER`.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Instala `gcloud` e `gog` caso estejam ausentes, autentica o `gcloud`, cria o tópico e a assinatura do Pub/Sub, inicia a observação do Gmail e grava a configuração `hooks.gmail` com `hooks.enabled=true`. Exibe `Next: openclaw webhooks gmail run`.

### Obrigatório

| Opção               | Descrição                         |
| ------------------- | --------------------------------- |
| `--account <email>` | Conta do Gmail a ser observada.   |

### Opções do Pub/Sub

| Opção                   | Padrão                 | Descrição                                                                                                                                                       |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (nenhum)               | ID do projeto do GCP (proprietário do cliente OAuth). Usa como alternativas o ID do projeto do próprio tópico e, depois, o projeto determinado pelas credenciais do `gog`. |
| `--topic <name>`        | `gog-gmail-watch`      | Nome do tópico do Pub/Sub.                                                                                                                                      |
| `--subscription <name>` | `gog-gmail-watch-push` | Nome da assinatura do Pub/Sub.                                                                                                                                  |
| `--label <label>`       | `INBOX`                | Marcador do Gmail a ser observado.                                                                                                                              |
| `--push-endpoint <url>` | (nenhum)               | Endpoint de push explícito do Pub/Sub. Substitui o Tailscale.                                                                                                   |

### Opções de entrega do OpenClaw

| Opção                  | Padrão                                         | Descrição                          |
| ---------------------- | ---------------------------------------------- | ---------------------------------- |
| `--hook-url <url>`     | Criada com `hooks.path` e a porta do Gateway   | URL do Webhook do OpenClaw.        |
| `--hook-token <token>` | `hooks.token` ou um token gerado               | Token do Webhook do OpenClaw.      |
| `--push-token <token>` | Token gerado                                   | Token de push encaminhado ao `gog watch serve`. |

### Opções de `gog watch serve`

| Opção                 | Padrão          | Descrição                                                                                                                                                                                        |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`     | Host de vinculação do `gog watch serve`.                                                                                                                                                          |
| `--port <port>`       | `8788`          | Porta do `gog watch serve`.                                                                                                                                                                      |
| `--path <path>`       | `/gmail-pubsub` | Caminho do `gog watch serve`. Forçado para `/` quando o Tailscale está ativado sem um destino explícito, pois o Tailscale remove o caminho antes de encaminhar pelo proxy.                         |
| `--include-body`      | `true`          | Inclui trechos do corpo do e-mail. Não há uma opção da CLI para desativar isso; defina `hooks.gmail.includeBody: false` na configuração.                                                          |
| `--max-bytes <n>`     | `20000`         | Máximo de bytes por trecho do corpo.                                                                                                                                                              |
| `--renew-minutes <n>` | `720` (12h)     | Renova a observação do Gmail a cada N minutos.                                                                                                                                                    |

### Exposição pelo Tailscale

| Opção                     | Padrão   | Descrição                                                                 |
| ------------------------- | -------- | ------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Expõe o endpoint de push pelo Tailscale: `funnel`, `serve` ou `off`.       |
| `--tailscale-path <path>` | (nenhum) | Caminho para serve/funnel do Tailscale.                                   |
| `--tailscale-target <t>`  | (nenhum) | Destino de serve/funnel do Tailscale (porta, `host:port` ou URL).          |

### Saída

| Opção    | Descrição                                                    |
| -------- | ------------------------------------------------------------ |
| `--json` | Exibe um resumo legível por máquina em vez de texto.          |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Executa `gog watch serve` e o ciclo de renovação automática da observação em primeiro plano, reiniciando `gog watch serve` após um atraso de 2s caso ele seja encerrado inesperadamente.

`run` aceita as mesmas opções de Pub/Sub, entrega do OpenClaw, `gog watch serve` e Tailscale que `setup`, exceto:

- `--account` é **opcional** em `run`; usa `hooks.gmail.account` como alternativa.
- `run` **não** aceita `--project`, `--push-endpoint` nem `--json`.
- Cada opção usa como alternativa o valor correspondente da configuração `hooks.gmail.*` (gravado por `setup`) e, depois, o mesmo padrão interno usado por `setup`, com uma exceção: o padrão de `--tailscale` é `off` em `run` (não `funnel`) quando nem a opção nem `hooks.gmail.tailscale.mode` estão definidos.

| Categoria           | Opções                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub             | `--account`, `--topic`, `--subscription`, `--label`                              |
| Entrega do OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`   | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale           | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Para `run`, o valor de `--topic` é o caminho completo do tópico do Pub/Sub (`projects/.../topics/...`), e não apenas o nome curto do tópico.
</Note>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Automação de Webhook](/pt-BR/automation/cron-jobs)
- [Integração com o Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration)
