---
read_when:
    - Quieres ejecutar un turno de agente desde scripts (opcionalmente entregar la respuesta)
summary: Referencia de CLI para `openclaw agent` (enviar un turno de agente mediante el Gateway)
title: Agente
x-i18n:
    generated_at: "2026-07-05T11:08:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a0e1dcf7fb08e592cadf99380dcf700c82685a74d6fda2883ac2fdbb79267e
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Ejecuta un turno de agente a través del Gateway. Recurre al agente integrado si la solicitud al Gateway falla; pasa `--local` para forzar la ejecución integrada desde el inicio.

Pasa al menos un selector de sesión: `--to`, `--session-key`, `--session-id` o `--agent`.

Relacionado: [Herramienta de envío al agente](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje
- `--message-file <path>`: lee el cuerpo del mensaje desde un archivo UTF-8
- `-t, --to <dest>`: destinatario usado para derivar la clave de sesión
- `--session-key <key>`: clave de sesión explícita que se usará para el enrutamiento
- `--session-id <id>`: id de sesión explícito
- `--agent <id>`: id del agente; reemplaza los enlaces de enrutamiento
- `--model <id>`: reemplazo de modelo para esta ejecución (`provider/model` o id de modelo)
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados compatibles con el proveedor, como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: conserva el nivel detallado para la sesión
- `--channel <channel>`: canal de entrega; omítelo para usar el canal principal de la sesión
- `--reply-to <target>`: reemplazo del destino de entrega
- `--reply-channel <channel>`: reemplazo del canal de entrega
- `--reply-account <id>`: reemplazo de la cuenta de entrega
- `--local`: ejecuta directamente el agente integrado (después de la precarga del registro de plugins)
- `--deliver`: envía la respuesta de vuelta al canal/destino seleccionado
- `--timeout <seconds>`: reemplaza el tiempo de espera del agente (predeterminado 600, o `agents.defaults.timeoutSeconds`); `0` desactiva el tiempo de espera
- `--json`: genera JSON

## Ejemplos

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notas

- Pasa exactamente uno de `--message` o `--message-file`. `--message-file` elimina un BOM UTF-8 inicial y conserva el contenido multilínea; rechaza archivos que no son UTF-8 válido.
- Los comandos con barra (por ejemplo `/compact`) no pueden ejecutarse a través de `--message`. La CLI los rechaza y te dirige al comando de primera clase correspondiente (`openclaw sessions compact <key>` para Compaction).
- `--local` y las ejecuciones de respaldo integradas son de un solo uso: los recursos de loopback MCP empaquetados y las sesiones stdio cálidas de Claude abiertas para la ejecución se retiran después de la respuesta, por lo que las invocaciones con scripts no dejan procesos secundarios locales en ejecución. En cambio, las ejecuciones respaldadas por Gateway mantienen los recursos de loopback MCP propiedad de Gateway bajo el proceso de Gateway en ejecución.
- `--channel`, `--reply-channel` y `--reply-account` afectan la entrega de la respuesta, no el enrutamiento de sesión.
- `--session-key` selecciona una clave de sesión explícita. Las claves con prefijo de agente deben usar `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con el id de agente de la clave cuando ambos se proporcionan. Las claves simples que no son centinela se limitan a `--agent` cuando se proporciona, o al agente predeterminado configurado en caso contrario; por ejemplo, `--agent ops --session-key incident-42` se enruta a `agent:ops:incident-42`. Las claves literales `global` y `unknown` permanecen sin ámbito solo cuando no se proporciona `--agent`.
- `--json` reserva stdout para la respuesta JSON; los diagnósticos del Gateway, del Plugin y del respaldo integrado van a stderr para que los scripts puedan analizar stdout directamente.
- El JSON del respaldo integrado incluye `meta.transport: "embedded"` y `meta.fallbackFrom: "gateway"` para que los scripts puedan detectar una ejecución de respaldo.
- Si el Gateway acepta una ejecución pero la CLI agota el tiempo de espera mientras espera la respuesta final, el respaldo integrado usa un id de sesión/ejecución nuevo `gateway-fallback-*` e informa `meta.fallbackReason: "gateway_timeout"` junto con los campos de sesión de respaldo, en lugar de competir con la transcripción propiedad del Gateway o reemplazar silenciosamente la sesión original.
- `SIGTERM`/`SIGINT` interrumpen una solicitud respaldada por Gateway en espera; si el Gateway ya aceptó la ejecución, la CLI también envía `chat.abort` para ese id de ejecución antes de salir. Las ejecuciones con `--local` y de respaldo integrado reciben la misma señal, pero no envían `chat.abort`. Si la clave interna de desduplicación de ejecución ya tiene una ejecución activa para esta sesión, la respuesta informa `status: "in_flight"` y la CLI no JSON imprime un diagnóstico en stderr en lugar de una respuesta vacía. Para envoltorios externos de cron/systemd, conserva un respaldo de cierre forzado como `timeout -k 60 600 openclaw agent ...` para que el supervisor pueda recolectar el proceso si el apagado no puede vaciarlo.
- Cuando este comando activa la regeneración de `models.json`, las credenciales de proveedor administradas por SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), nunca como texto plano secreto resuelto. Las escrituras de marcadores provienen de la instantánea de configuración de origen activa, no de los valores secretos resueltos en tiempo de ejecución.

## Estado de entrega JSON

Con `--json --deliver`, la respuesta JSON de la CLI incluye `deliveryStatus` de nivel superior para que los scripts puedan distinguir envíos entregados, suprimidos, parciales y fallidos:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

Las respuestas de la CLI respaldadas por Gateway también conservan la forma sin procesar del resultado de Gateway en `result.deliveryStatus`.

`deliveryStatus.status` es uno de los siguientes:

| Estado           | Significado                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | La entrega se completó.                                                                                                                                     |
| `suppressed`     | La entrega no se envió intencionalmente (por ejemplo, un hook de envío de mensajes la canceló, o no había un resultado visible). Terminal, sin reintento. |
| `partial_failed` | Al menos un payload se envió antes de que fallara un payload posterior.                                                                                     |
| `failed`         | No se completó ningún envío durable, o falló la verificación previa de entrega.                                                                             |

Campos comunes:

- `requested`: siempre `true` cuando el objeto está presente.
- `attempted`: `true` una vez que se ejecutó la ruta de envío durable; `false` para fallos de verificación previa o cuando no hay payloads visibles.
- `succeeded`: `true`, `false` o `"partial"`; `"partial"` se combina con `status: "partial_failed"`.
- `reason`: motivo en minúsculas y snake-case procedente de la entrega durable o la validación previa. Los valores conocidos incluyen `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` y `no_delivery_target`; los envíos durables fallidos también pueden informar la etapa fallida. Trata los valores desconocidos como opacos, ya que el conjunto puede ampliarse.
- `resultCount`: número de resultados de envío del canal, cuando está disponible.
- `sentBeforeError`: `true` cuando un fallo parcial envió al menos un payload antes de producir un error.
- `error`: `true` para envíos fallidos o parcialmente fallidos.
- `errorMessage`: presente solo cuando se capturó un mensaje de error de entrega subyacente. Los fallos de verificación previa llevan `error`/`reason` pero no `errorMessage`.
- `payloadOutcomes`: resultados opcionales por payload con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadatos de hook cuando están disponibles.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runtime del agente](/es/concepts/agent)
