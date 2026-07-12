---
read_when:
    - Quieres ejecutar un turno del agente desde scripts (y, opcionalmente, entregar la respuesta)
summary: Referencia de la CLI para `openclaw agent` (enviar un turno del agente mediante el Gateway)
title: Agente
x-i18n:
    generated_at: "2026-07-11T22:58:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Ejecuta un turno del agente a través del Gateway. Recurre al agente integrado si falla la solicitud al Gateway; usa `--local` para forzar desde el principio la ejecución integrada.

Indica al menos un selector de sesión: `--to`, `--session-key`, `--session-id` o `--agent`.

Relacionado: [Herramienta de envío del agente](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje
- `--message-file <path>`: lee el cuerpo del mensaje desde un archivo UTF-8
- `-t, --to <dest>`: destinatario utilizado para derivar la clave de sesión
- `--session-key <key>`: clave de sesión explícita que se utilizará para el enrutamiento
- `--session-id <id>`: identificador de sesión explícito
- `--agent <id>`: identificador del agente; anula las vinculaciones de enrutamiento
- `--model <id>`: modelo alternativo para esta ejecución (`provider/model` o identificador del modelo)
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados compatibles con el proveedor, como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: conserva el nivel de detalle para la sesión
- `--channel <channel>`: canal de entrega; omítelo para usar el canal principal de la sesión
- `--reply-to <target>`: destinatario de entrega alternativo
- `--reply-channel <channel>`: canal de entrega alternativo
- `--reply-account <id>`: cuenta de entrega alternativa
- `--local`: ejecuta directamente el agente integrado (después de precargar el registro de plugins)
- `--deliver`: envía la respuesta al canal o destinatario seleccionado
- `--timeout <seconds>`: anula el tiempo de espera del agente (valor predeterminado: 600 o `agents.defaults.timeoutSeconds`); `0` desactiva el tiempo de espera
- `--json`: genera la salida en formato JSON

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

- Indica exactamente una de las opciones `--message` o `--message-file`. `--message-file` elimina un BOM UTF-8 inicial y conserva el contenido multilínea; rechaza los archivos que no sean UTF-8 válido.
- Los comandos con barra diagonal (por ejemplo, `/compact`) no pueden ejecutarse mediante `--message`. La CLI los rechaza e indica el comando específico correspondiente (`openclaw sessions compact <key>` para la compactación).
- Las ejecuciones con `--local` y las de reserva integrada son de un solo uso: los recursos de local loopback de MCP incluidos y las sesiones activas de Claude mediante stdio que se abran para la ejecución se cierran después de la respuesta, por lo que las invocaciones mediante scripts no dejan procesos secundarios locales en ejecución. En cambio, las ejecuciones respaldadas por el Gateway mantienen los recursos de local loopback de MCP propiedad del Gateway dentro del proceso del Gateway en ejecución.
- Al usar conjuntamente `--agent`, `--channel` y `--to`, el enrutamiento de la sesión sigue al destinatario canónico del canal y a `session.dmScope`. Los canales con una identidad estable de destinatario exclusivamente saliente usan una sesión propiedad del proveedor, aislada de la sesión principal del agente. `--reply-channel` y `--reply-account` solo afectan a la entrega.
- `--session-key` selecciona una clave de sesión explícita. Las claves con prefijo de agente deben usar `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con el identificador de agente de la clave cuando se proporcionen ambos. Las claves simples que no sean valores centinela se asignan al ámbito de `--agent` cuando se proporciona o, en caso contrario, al agente predeterminado configurado; por ejemplo, `--agent ops --session-key incident-42` enruta a `agent:ops:incident-42`. Las claves literales `global` y `unknown` permanecen sin ámbito solo cuando no se proporciona `--agent`.
- `--json` reserva stdout para la respuesta JSON; los diagnósticos del Gateway, del plugin y de la reserva integrada se envían a stderr para que los scripts puedan analizar stdout directamente.
- El JSON de la reserva integrada incluye `meta.transport: "embedded"` y `meta.fallbackFrom: "gateway"` para que los scripts puedan detectar una ejecución de reserva.
- Si el Gateway acepta una ejecución, pero se agota el tiempo de espera de la CLI mientras espera la respuesta final, la reserva integrada utiliza un identificador nuevo de sesión/ejecución `gateway-fallback-*` e informa de `meta.fallbackReason: "gateway_timeout"` junto con los campos de la sesión de reserva, en lugar de competir con la transcripción propiedad del Gateway o sustituir silenciosamente la sesión original.
- `SIGTERM`/`SIGINT` interrumpen una solicitud respaldada por el Gateway que esté en espera; si el Gateway ya ha aceptado la ejecución, la CLI también envía `chat.abort` para ese identificador de ejecución antes de salir. Las ejecuciones con `--local` y las de reserva integrada reciben la misma señal, pero no envían `chat.abort`. Si la clave interna de desduplicación de ejecuciones ya tiene una ejecución activa para esta sesión, la respuesta informa de `status: "in_flight"` y la CLI sin JSON imprime un diagnóstico en stderr en lugar de una respuesta vacía. Para envoltorios externos de cron/systemd, mantén un mecanismo de respaldo de terminación forzada como `timeout -k 60 600 openclaw agent ...`, de modo que el supervisor pueda finalizar el proceso si el cierre no logra completarse.
- Cuando este comando activa la regeneración de `models.json`, las credenciales del proveedor administradas mediante SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), nunca como texto sin formato del secreto resuelto. Los marcadores se escriben a partir de la instantánea activa de la configuración de origen, no de los valores secretos resueltos en tiempo de ejecución.

## Estado de entrega JSON

Con `--json --deliver`, la respuesta JSON de la CLI incluye `deliveryStatus` en el nivel superior para que los scripts puedan distinguir entre envíos entregados, suprimidos, parciales y fallidos:

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

Las respuestas de la CLI respaldadas por el Gateway también conservan la estructura original del resultado del Gateway en `result.deliveryStatus`.

`deliveryStatus.status` es uno de los siguientes:

| Estado           | Significado                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | La entrega se completó.                                                                                                                                                                   |
| `suppressed`     | La entrega no se envió intencionadamente (por ejemplo, un hook de envío de mensajes la canceló o no hubo ningún resultado visible). Estado terminal, sin reintentos.                       |
| `partial_failed` | Se envió al menos una carga útil antes de que fallara una carga útil posterior.                                                                                                            |
| `failed`         | No se completó ningún envío persistente o falló la validación previa de la entrega.                                                                                                       |

Campos habituales:

- `requested`: siempre es `true` cuando el objeto está presente.
- `attempted`: es `true` una vez que se ejecuta la ruta de envío persistente; es `false` cuando falla la validación previa o no hay cargas útiles visibles.
- `succeeded`: puede ser `true`, `false` o `"partial"`; `"partial"` se corresponde con `status: "partial_failed"`.
- `reason`: motivo en minúsculas y formato snake_case procedente de la entrega persistente o de la validación previa. Los valores conocidos incluyen `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` y `no_delivery_target`; los envíos persistentes fallidos también pueden indicar la etapa que falló. Trata los valores desconocidos como opacos, ya que el conjunto puede ampliarse.
- `resultCount`: número de resultados de envío del canal, cuando está disponible.
- `sentBeforeError`: es `true` cuando un fallo parcial envió al menos una carga útil antes de producirse el error.
- `error`: es `true` para los envíos fallidos o parcialmente fallidos.
- `errorMessage`: solo está presente cuando se ha capturado un mensaje de error de entrega subyacente. Los fallos de validación previa incluyen `error`/`reason`, pero no `errorMessage`.
- `payloadOutcomes`: resultados opcionales de cada carga útil con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadatos del hook cuando estén disponibles.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Entorno de ejecución del agente](/es/concepts/agent)
