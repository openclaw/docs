---
read_when:
    - Você quer integrar eventos do Pub/Sub do Gmail ao OpenClaw
    - Você precisa da lista completa de flags e dos valores padrão
summary: Referência da CLI para `openclaw webhooks` (configuração e executor do Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-07-11T23:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Utilitários e integrações de Webhook. Atualmente, essa interface é voltada aos fluxos do Gmail Pub/Sub criados com o observador `gog` incluído.

## Subcomandos

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcomando    | Descrição                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| `gmail setup` | Assistente de uso único: observação do Gmail, tópico/assinatura Pub/Sub e entrega ao hook do OpenClaw. |
| `gmail run`   | Executa `gog watch serve` junto com o ciclo de renovação automática da observação em primeiro plano. |

<Note>
O Gateway também inicia automaticamente `gog gmail watch serve` durante a inicialização quando `hooks.enabled=true` e `hooks.gmail.account` estão definidos (configurados por `gmail setup`). `gmail run` usa a mesma lógica em primeiro plano, sendo útil para depuração ou quando o observador do Gateway está desativado. Consulte [Integração do Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration) para obter detalhes sobre a inicialização automática e a opção `OPENCLAW_SKIP_GMAIL_WATCHER` para desativá-la.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Instala `gcloud` e `gog` caso estejam ausentes, autentica o `gcloud`, cria o tópico e a assinatura Pub/Sub, inicia a observação do Gmail e grava a configuração `hooks.gmail` com `hooks.enabled=true`. Exibe `Próximo: openclaw webhooks gmail run`.

### Obrigatório

| Opção               | Descrição                         |
| ------------------- | --------------------------------- |
| `--account <email>` | Conta do Gmail a ser observada.   |

### Opções do Pub/Sub

| Opção                   | Padrão                 | Descrição                                                                                                                                                                              |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (nenhum)               | ID do projeto do GCP (o proprietário do cliente OAuth). Como alternativas, usa o ID do projeto do próprio tópico e, depois, o projeto determinado pelas credenciais do `gog`.          |
| `--topic <name>`        | `gog-gmail-watch`      | Nome do tópico Pub/Sub.                                                                                                                                                                |
| `--subscription <name>` | `gog-gmail-watch-push` | Nome da assinatura Pub/Sub.                                                                                                                                                            |
| `--label <label>`       | `INBOX`                | Marcador do Gmail a ser observado.                                                                                                                                                     |
| `--push-endpoint <url>` | (nenhum)               | Endpoint push explícito do Pub/Sub. Substitui o Tailscale.                                                                                                                             |

### Opções de entrega do OpenClaw

| Opção                  | Padrão                                       | Descrição                          |
| ---------------------- | -------------------------------------------- | ---------------------------------- |
| `--hook-url <url>`     | Criada com `hooks.path` e a porta do Gateway | URL do Webhook do OpenClaw.        |
| `--hook-token <token>` | `hooks.token` ou um token gerado             | Token do Webhook do OpenClaw.      |
| `--push-token <token>` | Token gerado                                 | Token push encaminhado ao `gog watch serve`. |

### Opções do `gog watch serve`

| Opção                 | Padrão          | Descrição                                                                                                                                                                                                          |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`     | Host de vinculação do `gog watch serve`.                                                                                                                                                                           |
| `--port <port>`       | `8788`          | Porta do `gog watch serve`.                                                                                                                                                                                        |
| `--path <path>`       | `/gmail-pubsub` | Caminho do `gog watch serve`. Forçado para `/` quando o Tailscale está ativado sem um destino explícito, pois o Tailscale remove o caminho antes de encaminhar pelo proxy.                                           |
| `--include-body`      | `true`          | Inclui trechos do corpo do e-mail. Não há uma opção da CLI para desativar isso; em vez disso, defina `hooks.gmail.includeBody: false` na configuração.                                                              |
| `--max-bytes <n>`     | `20000`         | Número máximo de bytes por trecho do corpo.                                                                                                                                                                        |
| `--renew-minutes <n>` | `720` (12h)     | Renova a observação do Gmail a cada N minutos.                                                                                                                                                                     |

### Exposição pelo Tailscale

| Opção                     | Padrão   | Descrição                                                                    |
| ------------------------- | -------- | ---------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Expõe o endpoint push pelo Tailscale: `funnel`, `serve` ou `off`.             |
| `--tailscale-path <path>` | (nenhum) | Caminho para o `serve`/`funnel` do Tailscale.                                 |
| `--tailscale-target <t>`  | (nenhum) | Destino do `serve`/`funnel` do Tailscale (porta, `host:port` ou URL).         |

### Saída

| Opção    | Descrição                                                        |
| -------- | ---------------------------------------------------------------- |
| `--json` | Exibe um resumo legível por máquina em vez de texto.              |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Executa `gog watch serve` junto com o ciclo de renovação automática da observação em primeiro plano, reiniciando `gog watch serve` após um atraso de 2s caso ele seja encerrado inesperadamente.

`run` aceita as mesmas opções do Pub/Sub, de entrega do OpenClaw, do `gog watch serve` e do Tailscale que `setup`, exceto:

- `--account` é **opcional** em `run`; como alternativa, usa `hooks.gmail.account`.
- `run` **não** aceita `--project`, `--push-endpoint` nem `--json`.
- Cada opção usa como alternativa o valor correspondente da configuração `hooks.gmail.*` (gravado por `setup`) e, depois, o mesmo padrão interno usado por `setup`, com uma exceção: `--tailscale` usa `off` como padrão em `run` (não `funnel`) quando nem a opção nem `hooks.gmail.tailscale.mode` estão definidos.

| Categoria          | Opções                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| Entrega do OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                    |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Para `run`, o valor de `--topic` é o caminho completo do tópico Pub/Sub (`projects/.../topics/...`), não apenas o nome curto do tópico.
</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Automação de Webhook](/pt-BR/automation/cron-jobs)
- [Integração do Gmail Pub/Sub](/pt-BR/automation/cron-jobs#gmail-pubsub-integration)
