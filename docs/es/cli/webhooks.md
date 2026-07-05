---
read_when:
    - Quieres conectar eventos de Gmail Pub/Sub a OpenClaw
    - Necesitas la lista completa de marcas y los valores predeterminados
summary: Referencia de CLI para `openclaw webhooks` (configuración y ejecutor de Pub/Sub de Gmail)
title: Webhooks
x-i18n:
    generated_at: "2026-07-05T11:12:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Ayudantes e integraciones de Webhook. Actualmente, esta superficie está limitada a flujos de Gmail Pub/Sub creados sobre el observador `gog` incluido.

## Subcomandos

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcomando    | Descripción                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| `gmail setup` | Asistente de una sola vez: observación de Gmail, tema/suscripción Pub/Sub y entrega de hook de OpenClaw. |
| `gmail run`   | Ejecuta `gog watch serve` más el bucle de renovación automática de la observación en primer plano.               |

<Note>
El Gateway también inicia automáticamente `gog gmail watch serve` al arrancar una vez que `hooks.enabled=true` y `hooks.gmail.account` están configurados (lo configura `gmail setup`). `gmail run` es la misma lógica en primer plano, útil para depurar o cuando el observador del Gateway está deshabilitado. Consulta [Integración de Gmail Pub/Sub](/es/automation/cron-jobs#gmail-pubsub-integration) para ver los detalles de inicio automático y la exclusión con `OPENCLAW_SKIP_GMAIL_WATCHER`.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Instala `gcloud` y `gog` si faltan, autentica `gcloud`, crea el tema y la suscripción de Pub/Sub, inicia la observación de Gmail y escribe la configuración `hooks.gmail` con `hooks.enabled=true`. Imprime `Next: openclaw webhooks gmail run`.

### Obligatorio

| Flag                | Descripción             |
| ------------------- | ----------------------- |
| `--account <email>` | Cuenta de Gmail que se observará. |

### Opciones de Pub/Sub

| Flag                    | Predeterminado                | Descripción                                                                                                                             |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (ninguno)                 | ID del proyecto de GCP (el propietario del cliente OAuth). Recurre al ID de proyecto propio del tema y luego al proyecto resuelto desde las credenciales de `gog`. |
| `--topic <name>`        | `gog-gmail-watch`      | Nombre del tema de Pub/Sub.                                                                                                                     |
| `--subscription <name>` | `gog-gmail-watch-push` | Nombre de la suscripción de Pub/Sub.                                                                                                              |
| `--label <label>`       | `INBOX`                | Etiqueta de Gmail que se observará.                                                                                                                   |
| `--push-endpoint <url>` | (ninguno)                 | Endpoint push explícito de Pub/Sub. Anula Tailscale.                                                                                    |

### Opciones de entrega de OpenClaw

| Flag                   | Predeterminado                                      | Descripción                                |
| ---------------------- | -------------------------------------------- | ------------------------------------------ |
| `--hook-url <url>`     | Creada a partir de `hooks.path` y el puerto del Gateway | URL de webhook de OpenClaw.                      |
| `--hook-token <token>` | `hooks.token` o un token generado          | Token de webhook de OpenClaw.                    |
| `--push-token <token>` | Token generado                              | Token push reenviado a `gog watch serve`. |

### Opciones de `gog watch serve`

| Flag                  | Predeterminado         | Descripción                                                                                                                                  |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Host de enlace de `gog watch serve`.                                                                                                                 |
| `--port <port>`       | `8788`          | Puerto de `gog watch serve`.                                                                                                                      |
| `--path <path>`       | `/gmail-pubsub` | Ruta de `gog watch serve`. Se fuerza a `/` cuando Tailscale está habilitado sin un destino explícito, porque Tailscale elimina la ruta antes de hacer proxy. |
| `--include-body`      | `true`          | Incluye fragmentos del cuerpo del correo. No hay ningún flag de CLI para desactivarlo; configura `hooks.gmail.includeBody: false` en la configuración.                  |
| `--max-bytes <n>`     | `20000`         | Máximo de bytes por fragmento de cuerpo.                                                                                                                  |
| `--renew-minutes <n>` | `720` (12h)     | Renueva la observación de Gmail cada N minutos.                                                                                                           |

### Exposición de Tailscale

| Flag                      | Predeterminado  | Descripción                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Expone el endpoint push mediante tailscale: `funnel`, `serve` u `off`. |
| `--tailscale-path <path>` | (ninguno)   | Ruta para tailscale serve/funnel.                                 |
| `--tailscale-target <t>`  | (ninguno)   | Destino de Tailscale serve/funnel (puerto, `host:port` o URL).       |

### Salida

| Flag     | Descripción                                       |
| -------- | ------------------------------------------------- |
| `--json` | Imprime un resumen legible por máquina en lugar de texto. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Ejecuta `gog watch serve` más el bucle de renovación automática de la observación en primer plano, reiniciando `gog watch serve` después de una demora de 2 s si se cierra inesperadamente.

`run` acepta los mismos flags de Pub/Sub, entrega de OpenClaw, `gog watch serve` y Tailscale que `setup`, excepto:

- `--account` es **opcional** en `run`; recurre a `hooks.gmail.account`.
- `run` **no** acepta `--project`, `--push-endpoint` ni `--json`.
- Cada flag recurre al valor de configuración `hooks.gmail.*` correspondiente (escrito por `setup`) y luego al mismo valor predeterminado integrado que usa `setup`, con una excepción: `--tailscale` tiene como valor predeterminado `off` en `run` (no `funnel`) cuando no se configura ni el flag ni `hooks.gmail.tailscale.mode`.

| Categoría          | Flags                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| Entrega de OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Para `run`, el valor de `--topic` es la ruta completa del tema de Pub/Sub (`projects/.../topics/...`), no solo el nombre corto del tema.
</Note>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Automatización de Webhook](/es/automation/cron-jobs)
- [Integración de Gmail Pub/Sub](/es/automation/cron-jobs#gmail-pubsub-integration)
