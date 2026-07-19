---
read_when:
    - Se desea ejecutar un turno del agente desde scripts (con entrega opcional de la respuesta)
summary: Referencia de la CLI para `openclaw agent` (envía un turno del agente mediante el Gateway)
title: Agente
x-i18n:
    generated_at: "2026-07-19T01:49:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c057e8e1209442007b99bc9e27019e2d9c1d08c55390f6b3c2223c7a7c13d7f5
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Ejecuta un turno del agente a través del Gateway. Recurre al agente integrado si falla la solicitud al Gateway; pasa `--local` para forzar desde el principio la ejecución integrada.

Pasa al menos un selector de sesión: `--to`, `--session-key`, `--session-id` o `--agent`.

Relacionado: [Herramienta de envío del agente](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje
- `--message-file <path>`: lee el cuerpo del mensaje desde un archivo UTF-8
- `-t, --to <dest>`: destinatario utilizado para derivar la clave de sesión
- `--session-key <key>`: clave de sesión explícita que se utilizará para el enrutamiento
- `--session-id <id>`: id. de sesión explícito
- `--agent <id>`: id. del agente; reemplaza las vinculaciones de enrutamiento
- `--model <id>`: reemplazo del modelo para esta ejecución (`provider/model` o id. del modelo)
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados admitidos por el proveedor, como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: conserva el nivel de detalle para la sesión
- `--channel <channel>`: canal de entrega; se omite para usar el canal de la sesión principal
- `--reply-to <target>`: reemplazo del destino de entrega
- `--reply-channel <channel>`: reemplazo del canal de entrega
- `--reply-account <id>`: reemplazo de la cuenta de entrega
- `--local`: ejecuta directamente el agente integrado (después de precargar el registro de plugins)
- `--deliver`: envía la respuesta al canal o destino seleccionado
- `--timeout <seconds>`: reemplaza el plazo del turno del agente de este comando (valor predeterminado: 600 o `agents.defaults.timeoutSeconds`); `0` desactiva el plazo general. El valor alternativo de 600 segundos pertenece a este comando de la CLI, no a los turnos normales del Gateway, cuyo valor predeterminado es de 48 horas.
- `--json`: genera la salida en JSON

## Ejemplos

```bash
openclaw agent --to +15555550123 --message "actualización de estado" --deliver
openclaw agent --agent ops --message "Resume los registros"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Resume los registros"
openclaw agent --session-key agent:ops:incident-42 --message "Resume el estado"
openclaw agent --agent ops --session-key incident-42 --message "Resume el estado"
openclaw agent --session-id 1234 --message "Resume la bandeja de entrada" --thinking medium
openclaw agent --to +15555550123 --message "Rastrea los registros" --verbose on --json
openclaw agent --agent ops --message "Genera el informe" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Ejecuta localmente" --local
```

## Notas

- Pasa exactamente uno de `--message` o `--message-file`. `--message-file` elimina un BOM UTF-8 inicial y conserva el contenido multilínea; rechaza los archivos que no sean UTF-8 válido. Los archivos mayores de 4 MiB se rechazan antes del envío.
- Los comandos con barra diagonal (por ejemplo, `/compact`) no pueden ejecutarse mediante `--message`. La CLI los rechaza e indica que se use en su lugar el comando específico (`openclaw sessions compact <key>` para Compaction).
- `--local` y las ejecuciones alternativas integradas son de una sola vez: los recursos de bucle invertido de MCP incluidos y las sesiones stdio activas de Claude abiertas para la ejecución se retiran después de la respuesta, por lo que las invocaciones mediante scripts no dejan procesos secundarios locales en ejecución. En cambio, las ejecuciones respaldadas por el Gateway mantienen los recursos de bucle invertido de MCP propiedad del Gateway en el proceso del Gateway en ejecución.
- La ejecución integrada independiente (`--local` y la alternativa de transporte) se niega a reutilizar una sesión principal existente mientras esté pendiente la recuperación tras un reinicio. Ejecuta el turno a través de un Gateway en buen estado o restablécelo allí con `/new` o `/reset`; un proceso integrado independiente no puede coordinar de forma segura al propietario de esa recuperación con el analizador del Gateway.
- Con `--agent`, `--channel` y `--to` juntos, el enrutamiento de la sesión sigue al destinatario canónico del canal y a `session.dmScope`. Los canales con una identidad de destinatario estable exclusivamente saliente utilizan una sesión propiedad del proveedor aislada de la sesión principal del agente. `--reply-channel` y `--reply-account` solo afectan a la entrega.
- `--session-key` selecciona una clave de sesión explícita. Las claves con prefijo de agente deben usar `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con el id. de agente de la clave cuando se proporcionan ambos. Las claves simples que no sean centinela se asignan al ámbito de `--agent` cuando se proporciona, o al agente predeterminado configurado en caso contrario; por ejemplo, `--agent ops --session-key incident-42` se enruta a `agent:ops:incident-42`. Las claves literales `global` y `unknown` solo permanecen sin ámbito cuando no se proporciona `--agent`.
- `--json` reserva stdout para la respuesta JSON; los diagnósticos del Gateway, los plugins y la alternativa integrada se envían a stderr para que los scripts puedan analizar stdout directamente.
- El JSON de la alternativa integrada incluye `meta.transport: "embedded"` y `meta.fallbackFrom: "gateway"` para que los scripts puedan detectar una ejecución alternativa.
- Si el Gateway acepta una ejecución, pero se agota el tiempo de espera de la CLI mientras espera la respuesta final, la alternativa integrada utiliza un id. nuevo de sesión o ejecución `gateway-fallback-*` e informa de `meta.fallbackReason: "gateway_timeout"` junto con los campos de la sesión alternativa, en lugar de competir con la transcripción propiedad del Gateway o reemplazar silenciosamente la sesión original.
- `SIGTERM`/`SIGINT` interrumpen una solicitud respaldada por el Gateway que está en espera; si el Gateway ya ha aceptado la ejecución, la CLI también envía `chat.abort` para ese id. de ejecución antes de salir. `--local` y las ejecuciones alternativas integradas reciben la misma señal, pero no envían `chat.abort`. Si la clave interna de desduplicación de ejecuciones ya tiene una ejecución activa para esta sesión, la respuesta informa de `status: "in_flight"` y la CLI sin JSON imprime un diagnóstico en stderr en lugar de una respuesta vacía. Para los envoltorios externos de cron/systemd, conserva un mecanismo de terminación forzada de respaldo, como `timeout -k 60 600 openclaw agent ...`, para que el supervisor pueda recoger el proceso si el cierre no puede completarse.
- Cuando este comando activa la regeneración de `models.json`, las credenciales del proveedor administradas mediante SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), nunca como texto sin formato del secreto resuelto. Las escrituras de marcadores proceden de la instantánea de configuración de origen activa, no de los valores secretos resueltos en tiempo de ejecución.

## Estado de entrega en JSON

Con `--json --deliver`, la respuesta JSON de la CLI incluye `deliveryStatus` en el nivel superior para que los scripts puedan distinguir los envíos entregados, suprimidos, parciales y fallidos:

```json
{
  "payloads": [{ "text": "Informe listo", "mediaUrl": null }],
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

Las respuestas de la CLI respaldadas por el Gateway también conservan la forma sin procesar del resultado del Gateway en `result.deliveryStatus`.

`deliveryStatus.status` es uno de los siguientes:

| Estado           | Significado                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | La entrega se completó.                                                                                                                        |
| `suppressed`     | La entrega no se envió intencionadamente (por ejemplo, un hook de envío de mensajes la canceló o no hubo ningún resultado visible). Es terminal y no se reintenta. |
| `partial_failed` | Se envió al menos una carga antes de que fallara una carga posterior.                                                                                   |
| `failed`         | No se completó ningún envío persistente o falló la comprobación previa de la entrega.                                                                                   |

Campos comunes:

- `requested`: siempre es `true` cuando el objeto está presente.
- `attempted`: `true` una vez ejecutada la ruta de envío persistente; `false` para errores de comprobación previa o cuando no hay cargas visibles.
- `succeeded`: `true`, `false` o `"partial"`; `"partial"` se combina con `status: "partial_failed"`.
- `reason`: motivo en minúsculas y formato snake_case procedente de la entrega persistente o de la validación previa. Los valores conocidos incluyen `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` y `no_delivery_target`; los envíos persistentes fallidos también pueden indicar la etapa que falló. Trata los valores desconocidos como opacos, ya que el conjunto puede ampliarse.
- `resultCount`: número de resultados de envío del canal, cuando están disponibles.
- `sentBeforeError`: `true` cuando un fallo parcial envió al menos una carga antes de producirse el error.
- `error`: `true` para envíos fallidos o parcialmente fallidos.
- `errorMessage`: solo está presente cuando se ha capturado un mensaje de error de entrega subyacente. Los errores de comprobación previa incluyen `error`/`reason`, pero no `errorMessage`.
- `payloadOutcomes`: resultados opcionales por carga con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadatos del hook cuando estén disponibles.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Entorno de ejecución del agente](/es/concepts/agent)
