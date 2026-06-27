---
read_when:
    - Quiere conectar los eventos Pub/Sub de Gmail con OpenClaw
    - Necesitas la lista completa de opciones y valores predeterminados
summary: Referencia de CLI para `openclaw webhooks` (configuración y ejecutor de Gmail Pub/Sub)
title: Webhooks
x-i18n:
    generated_at: "2026-05-11T20:29:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw webhooks`

Funciones auxiliares e integraciones de Webhook. Actualmente, esta superficie se limita a los flujos de Gmail Pub/Sub que se integran con el watcher `gog` incluido.

## Subcomandos

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcomando    | Descripción                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | Configura la vigilancia de Gmail, el tema/suscripción de Pub/Sub y el destino de entrega de Webhook de OpenClaw. |
| `gmail run`   | Ejecuta `gog watch serve` más el bucle de renovación automática de la vigilancia.             |

## `webhooks gmail setup`

Configura la vigilancia de Gmail, Pub/Sub y la entrega de Webhook de OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Obligatorio

| Flag                | Descripción                   |
| ------------------- | ----------------------------- |
| `--account <email>` | Cuenta de Gmail que vigilar.  |

### Opciones de Pub/Sub

| Flag                    | Valor predeterminado | Descripción                                          |
| ----------------------- | -------------------- | ---------------------------------------------------- |
| `--project <id>`        | (ninguno)            | ID de proyecto de GCP (el propietario del cliente OAuth). |
| `--topic <name>`        | `gog-gmail-watch`    | Nombre del tema de Pub/Sub.                          |
| `--subscription <name>` | `gog-gmail-watch-push` | Nombre de la suscripción de Pub/Sub.               |
| `--label <label>`       | `INBOX`              | Etiqueta de Gmail que vigilar.                       |
| `--push-endpoint <url>` | (ninguno)            | Endpoint push explícito de Pub/Sub. Anula Tailscale. |

### Opciones de entrega de OpenClaw

| Flag                   | Valor predeterminado | Descripción                                |
| ---------------------- | -------------------- | ------------------------------------------ |
| `--hook-url <url>`     | (ninguno)            | URL de Webhook de OpenClaw.                |
| `--hook-token <token>` | (ninguno)            | Token de Webhook de OpenClaw.              |
| `--push-token <token>` | (ninguno)            | Token push reenviado a `gog watch serve`.  |

### Opciones de `gog watch serve`

| Flag                  | Valor predeterminado | Descripción                                                       |
| --------------------- | -------------------- | ----------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`          | Host de enlace de `gog watch serve`.                              |
| `--port <port>`       | `8788`               | Puerto de `gog watch serve`.                                      |
| `--path <path>`       | `/gmail-pubsub`      | Ruta de `gog watch serve`.                                        |
| `--include-body`      | `true`               | Incluye fragmentos del cuerpo del correo. Pasa `--no-include-body` para desactivarlo. |
| `--max-bytes <n>`     | `20000`              | Máximo de bytes por fragmento de cuerpo.                          |
| `--renew-minutes <n>` | `720` (12h)          | Renueva la vigilancia de Gmail cada N minutos.                    |

### Exposición de Tailscale

| Flag                      | Valor predeterminado | Descripción                                                      |
| ------------------------- | -------------------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`             | Expone el endpoint push mediante Tailscale: `funnel`, `serve` u `off`. |
| `--tailscale-path <path>` | (ninguno)            | Ruta para Tailscale serve/funnel.                                |
| `--tailscale-target <t>`  | (ninguno)            | Destino de Tailscale serve/funnel (puerto, `host:port` o URL).   |

### Salida

| Flag     | Descripción                                       |
| -------- | ------------------------------------------------- |
| `--json` | Imprime un resumen legible por máquina en lugar de texto. |

## `webhooks gmail run`

Ejecuta `gog watch serve` más el bucle de renovación automática de la vigilancia en primer plano.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` acepta los mismos flags de `gog watch serve`, entrega de OpenClaw, Pub/Sub y Tailscale que `setup`, excepto:

- `--account` es **opcional** en `run` (recurre a la cuenta configurada).
- `run` **no** acepta `--project`, `--push-endpoint` ni `--json`.
- Los flags de `run` no tienen valores predeterminados integrados; los valores faltantes recurren a los valores escritos por `setup`.

| Categoría          | Flags                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| Entrega de OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                    |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Para `run`, el valor de `--topic` es la ruta completa del tema de Pub/Sub (`projects/.../topics/...`), no solo el nombre corto del tema.
</Note>

## Flujo de extremo a extremo

Consulta [Integración de Gmail Pub/Sub](/es/automation/cron-jobs#gmail-pubsub-integration) para ver la configuración del proyecto de GCP, OAuth y del lado del Gateway que se combina con estos comandos de CLI.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Automatización de Webhook](/es/automation/cron-jobs)
- [Gmail Pub/Sub](/es/automation/cron-jobs#gmail-pubsub-integration)
