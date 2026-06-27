---
read_when:
    - Quieres ejecutar un turno de agente desde scripts (opcionalmente entregar la respuesta)
summary: Referencia de CLI para `openclaw agent` (enviar un turno de agente mediante el Gateway)
title: Agente
x-i18n:
    generated_at: "2026-06-27T10:56:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Ejecuta un turno de agente mediante el Gateway (usa `--local` para el modo integrado).
Usa `--agent <id>` para apuntar directamente a un agente configurado.

Pasa al menos un selector de sesión:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Herramienta de envío de agente: [Envío de agente](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje
- `--message-file <path>`: lee el cuerpo del mensaje desde un archivo UTF-8
- `-t, --to <dest>`: destinatario usado para derivar la clave de sesión
- `--session-key <key>`: clave de sesión explícita que se usará para el enrutamiento
- `--session-id <id>`: id de sesión explícito
- `--agent <id>`: id del agente; anula los enlaces de enrutamiento
- `--model <id>`: anulación de modelo para esta ejecución (`provider/model` o id de modelo)
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados admitidos por el proveedor, como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: persiste el nivel detallado para la sesión
- `--channel <channel>`: canal de entrega; omítelo para usar el canal principal de la sesión
- `--reply-to <target>`: anulación del destino de entrega
- `--reply-channel <channel>`: anulación del canal de entrega
- `--reply-account <id>`: anulación de la cuenta de entrega
- `--local`: ejecuta directamente el agente integrado (después de la precarga del registro de plugins)
- `--deliver`: envía la respuesta de vuelta al canal/destino seleccionado
- `--timeout <seconds>`: anula el tiempo de espera del agente (600 predeterminado o valor de configuración)
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

- Pasa exactamente una de `--message` o `--message-file`. `--message-file` conserva el contenido de archivo multilínea después de quitar un BOM UTF-8 opcional, y rechaza archivos que no sean UTF-8 válido.
- El modo Gateway recurre al agente integrado cuando falla la solicitud al Gateway. Usa `--local` para forzar la ejecución integrada desde el principio.
- `--local` sigue precargando primero el registro de plugins, por lo que los proveedores, herramientas y canales proporcionados por plugins siguen disponibles durante las ejecuciones integradas.
- `--local` y las ejecuciones integradas de reserva se tratan como ejecuciones de una sola vez. Los recursos de loopback MCP empaquetados y las sesiones stdio de Claude en caliente abiertas para ese proceso local se retiran después de la respuesta, por lo que las invocaciones con scripts no mantienen vivos los procesos secundarios locales.
- Las ejecuciones respaldadas por Gateway dejan los recursos de loopback MCP propiedad del Gateway bajo el proceso Gateway en ejecución; los clientes más antiguos aún pueden enviar el indicador histórico de limpieza, pero el Gateway lo acepta como una operación sin efecto por compatibilidad.
- `--channel`, `--reply-channel` y `--reply-account` afectan la entrega de respuestas, no el enrutamiento de sesiones.
- `--session-key` selecciona una clave de sesión explícita. Las claves con prefijo de agente deben usar `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con el id de agente de la clave cuando se proporcionan ambos. Las claves simples no centinela se acotan a `--agent` cuando se suministra, o al agente predeterminado configurado en caso contrario; por ejemplo, `--agent ops --session-key incident-42` enruta a `agent:ops:incident-42`. Los literales `global` y `unknown` permanecen sin acotar solo cuando no se suministra `--agent`; en ese caso, la reserva integrada y la propiedad del almacén usan el agente predeterminado configurado.
- `--json` mantiene stdout reservado para la respuesta JSON. Los diagnósticos de Gateway, plugin y reserva integrada se enrutan a stderr para que los scripts puedan analizar stdout directamente.
- El JSON de reserva integrada incluye `meta.transport: "embedded"` y `meta.fallbackFrom: "gateway"` para que los scripts puedan distinguir las ejecuciones de reserva de las ejecuciones de Gateway.
- Si el Gateway acepta una ejecución de agente pero la CLI agota el tiempo de espera mientras espera la respuesta final, la reserva integrada usa un id explícito nuevo de sesión/ejecución `gateway-fallback-*` e informa `meta.fallbackReason: "gateway_timeout"` además de los campos de sesión de reserva. Esto evita competir por el bloqueo de la transcripción propiedad del Gateway o reemplazar silenciosamente la sesión original de conversación enrutada.
- Para ejecuciones respaldadas por Gateway, `SIGTERM` y `SIGINT` interrumpen la solicitud de CLI en espera. Si el Gateway ya aceptó la ejecución, la CLI también envía `chat.abort` para ese id de ejecución aceptado antes de salir. Las ejecuciones locales `--local` y las ejecuciones de reserva integrada reciben la misma señal de cancelación, pero no envían `chat.abort`. Si un `--run-id` duplicado llega al Gateway mientras la ejecución de agente original sigue activa, la respuesta duplicada informa `status: "in_flight"` y la CLI no JSON imprime un diagnóstico en stderr en lugar de una respuesta vacía. Para envoltorios externos de Cron/systemd, mantén un respaldo externo de terminación forzada, como `timeout -k 60 600 openclaw agent ...`, para que el supervisor aún pueda recoger el proceso si el apagado no puede vaciarse.
- Cuando este comando activa la regeneración de `models.json`, las credenciales de proveedor administradas por SecretRef se persisten como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), no como texto plano secreto resuelto.
- Las escrituras de marcadores tienen la fuente como autoridad: OpenClaw persiste marcadores de la instantánea de configuración de fuente activa, no de los valores secretos de runtime resueltos.

## Estado de entrega JSON

Cuando se usa `--json --deliver`, la respuesta JSON de la CLI puede incluir `deliveryStatus` de nivel superior para que los scripts puedan distinguir envíos entregados, suprimidos, parciales y fallidos:

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

`deliveryStatus.status` es uno de `sent`, `suppressed`, `partial_failed` o `failed`. `suppressed` significa que la entrega no se envió intencionalmente; por ejemplo, un hook de envío de mensajes la canceló o no hubo resultado visible; sigue siendo un resultado terminal sin reintentos. `partial_failed` significa que se envió al menos una carga útil antes de que fallara una carga útil posterior. `failed` significa que no se completó ningún envío duradero o que falló la comprobación previa de entrega.

Las respuestas de CLI respaldadas por Gateway también conservan la forma sin procesar del resultado de Gateway, donde el mismo objeto está disponible en `result.deliveryStatus`.

Campos comunes:

- `requested`: siempre `true` cuando el objeto está presente.
- `attempted`: `true` después de que se ejecutó la ruta de envío duradero; `false` para errores de comprobación previa o cuando no hay cargas útiles visibles.
- `succeeded`: `true`, `false` o `"partial"`; `"partial"` se empareja con `status: "partial_failed"`.
- `reason`: una razón en minúsculas y snake-case procedente de la entrega duradera o la validación previa. Las razones conocidas incluyen `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` y `no_delivery_target`; los envíos duraderos fallidos también pueden informar la etapa fallida. Trata los valores desconocidos como opacos porque el conjunto puede ampliarse.
- `resultCount`: número de resultados de envío de canal cuando está disponible.
- `sentBeforeError`: `true` cuando un fallo parcial envió al menos una carga útil antes del error.
- `error`: booleano `true` para envíos fallidos o parcialmente fallidos.
- `errorMessage`: se incluye solo cuando se captura un mensaje de error de entrega subyacente. Los errores de comprobación previa llevan `error` y `reason`, pero no `errorMessage`.
- `payloadOutcomes`: resultados opcionales por carga útil con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadatos de hook cuando estén disponibles.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Runtime del agente](/es/concepts/agent)
