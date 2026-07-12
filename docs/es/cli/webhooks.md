---
read_when:
    - Quieres conectar los eventos de Pub/Sub de Gmail con OpenClaw
    - Necesitas la lista completa de indicadores y los valores predeterminados
summary: Referencia de la CLI para `openclaw webhooks` (configuración y ejecutor de Pub/Sub de Gmail)
title: Webhooks
x-i18n:
    generated_at: "2026-07-11T23:02:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Utilidades e integraciones de Webhook. Actualmente, esta interfaz se limita a los flujos de Pub/Sub de Gmail basados en el observador `gog` incluido.

## Subcomandos

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subcomando    | Descripción                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `gmail setup` | Asistente de configuración inicial: observación de Gmail, tema/suscripción de Pub/Sub y entrega al hook de OpenClaw. |
| `gmail run`   | Ejecuta `gog watch serve` junto con el bucle de renovación automática de la observación en primer plano.             |

<Note>
El Gateway también inicia automáticamente `gog gmail watch serve` al arrancar una vez que se establece `hooks.enabled=true` y se configura `hooks.gmail.account` (mediante `gmail setup`). `gmail run` ejecuta la misma lógica en primer plano, lo que resulta útil para depurar o cuando el observador del Gateway está desactivado. Consulta [Integración de Pub/Sub de Gmail](/es/automation/cron-jobs#gmail-pubsub-integration) para obtener información sobre el inicio automático y la opción `OPENCLAW_SKIP_GMAIL_WATCHER` para desactivarlo.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Instala `gcloud` y `gog` si no están disponibles, autentica `gcloud`, crea el tema y la suscripción de Pub/Sub, inicia la observación de Gmail y escribe la configuración `hooks.gmail` con `hooks.enabled=true`. Muestra `Next: openclaw webhooks gmail run`.

### Obligatorio

| Opción              | Descripción                        |
| ------------------- | ---------------------------------- |
| `--account <email>` | Cuenta de Gmail que se observará.  |

### Opciones de Pub/Sub

| Opción                  | Valor predeterminado   | Descripción                                                                                                                                                                                        |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (ninguno)              | ID del proyecto de GCP (el propietario del cliente de OAuth). Si no se proporciona, se usa el ID del proyecto del propio tema y, después, el proyecto obtenido de las credenciales de `gog`.       |
| `--topic <name>`        | `gog-gmail-watch`      | Nombre del tema de Pub/Sub.                                                                                                                                                                        |
| `--subscription <name>` | `gog-gmail-watch-push` | Nombre de la suscripción de Pub/Sub.                                                                                                                                                                |
| `--label <label>`       | `INBOX`                | Etiqueta de Gmail que se observará.                                                                                                                                                                 |
| `--push-endpoint <url>` | (ninguno)              | Endpoint push explícito de Pub/Sub. Reemplaza Tailscale.                                                                                                                                            |

### Opciones de entrega de OpenClaw

| Opción                 | Valor predeterminado                          | Descripción                         |
| ---------------------- | -------------------------------------------- | ----------------------------------- |
| `--hook-url <url>`     | Se crea a partir de `hooks.path` y el puerto del Gateway | URL del Webhook de OpenClaw.        |
| `--hook-token <token>` | `hooks.token` o un token generado            | Token del Webhook de OpenClaw.      |
| `--push-token <token>` | Token generado                               | Token push reenviado a `gog watch serve`. |

### Opciones de `gog watch serve`

| Opción                | Valor predeterminado | Descripción                                                                                                                                                                                                                        |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`          | Host de enlace de `gog watch serve`.                                                                                                                                                                                               |
| `--port <port>`       | `8788`               | Puerto de `gog watch serve`.                                                                                                                                                                                                       |
| `--path <path>`       | `/gmail-pubsub`      | Ruta de `gog watch serve`. Se fuerza a `/` cuando Tailscale está habilitado sin un destino explícito, ya que Tailscale elimina la ruta antes de reenviar mediante el proxy.                                                         |
| `--include-body`      | `true`               | Incluye fragmentos del cuerpo del correo electrónico. No existe ninguna opción de la CLI para desactivarlo; establece `hooks.gmail.includeBody: false` en la configuración.                                                        |
| `--max-bytes <n>`     | `20000`              | Número máximo de bytes por fragmento del cuerpo.                                                                                                                                                                                    |
| `--renew-minutes <n>` | `720` (12 h)         | Renueva la observación de Gmail cada N minutos.                                                                                                                                                                                     |

### Exposición mediante Tailscale

| Opción                    | Valor predeterminado | Descripción                                                                                 |
| ------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`             | Expone el endpoint push mediante Tailscale: `funnel`, `serve` u `off`.                      |
| `--tailscale-path <path>` | (ninguno)            | Ruta para serve/funnel de Tailscale.                                                         |
| `--tailscale-target <t>`  | (ninguno)            | Destino de serve/funnel de Tailscale (puerto, `host:port` o URL).                            |

### Salida

| Opción   | Descripción                                                     |
| -------- | --------------------------------------------------------------- |
| `--json` | Muestra un resumen legible por máquinas en lugar de texto.       |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Ejecuta `gog watch serve` junto con el bucle de renovación automática de la observación en primer plano y reinicia `gog watch serve` tras un retraso de 2 s si termina inesperadamente.

`run` acepta las mismas opciones de Pub/Sub, entrega de OpenClaw, `gog watch serve` y Tailscale que `setup`, excepto por lo siguiente:

- `--account` es **opcional** en `run`; si no se proporciona, se usa `hooks.gmail.account`.
- `run` **no** acepta `--project`, `--push-endpoint` ni `--json`.
- Cada opción usa como alternativa el valor de configuración `hooks.gmail.*` correspondiente (escrito por `setup`) y, después, el mismo valor predeterminado integrado que usa `setup`, con una excepción: el valor predeterminado de `--tailscale` en `run` es `off` (no `funnel`) cuando no se establece ni la opción ni `hooks.gmail.tailscale.mode`.

| Categoría           | Opciones                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub             | `--account`, `--topic`, `--subscription`, `--label`                              |
| Entrega de OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`   | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale           | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Para `run`, el valor de `--topic` es la ruta completa del tema de Pub/Sub (`projects/.../topics/...`), no solo el nombre corto del tema.
</Note>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Automatización mediante Webhook](/es/automation/cron-jobs)
- [Integración de Pub/Sub de Gmail](/es/automation/cron-jobs#gmail-pubsub-integration)
