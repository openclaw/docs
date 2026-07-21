---
read_when:
    - Se desea ejecutar un turno del agente desde scripts (con entrega opcional de la respuesta)
summary: Referencia de la CLI para `openclaw agent` (enviar un turno del agente mediante el Gateway)
title: Agente
x-i18n:
    generated_at: "2026-07-21T08:57:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1a4c139a3b235d6a56ba63063737b80f93448c2dbb7a92c6d0756fb19a9f95e4
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Ejecuta un turno del agente a través del Gateway. La marca explícita `--local` es la única ruta de ejecución integrada.

Pasa al menos un selector de sesión: `--to`, `--session-key`, `--session-id` o `--agent`.

Relacionado: [Herramienta de envío del agente](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje
- `--message-file <path>`: lee el cuerpo del mensaje desde un archivo UTF-8
- `-t, --to <dest>`: destinatario utilizado para derivar la clave de sesión
- `--session-key <key>`: clave de sesión explícita que se utilizará para el enrutamiento
- `--session-id <id>`: id. de sesión explícito
- `--agent <id>`: id. del agente; anula las vinculaciones de enrutamiento
- `--model <id>`: sustitución del modelo para esta ejecución (`provider/model` o id. del modelo)
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados admitidos por el proveedor, como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: conserva el nivel de detalle para la sesión
- `--channel <channel>`: canal de entrega; omítelo para utilizar el canal de la sesión principal
- `--reply-to <target>`: sustitución del destino de entrega
- `--reply-channel <channel>`: sustitución del canal de entrega
- `--reply-account <id>`: sustitución de la cuenta de entrega
- `--local`: ejecuta directamente el agente integrado (después de la precarga del registro de plugins)
- `--deliver`: devuelve la respuesta al canal o destino seleccionado
- `--timeout <seconds>`: sustituye el plazo del turno del agente para este comando (valor predeterminado: 600 o `agents.defaults.timeoutSeconds`); `0` desactiva el plazo general. El valor de reserva de 600 segundos pertenece a este comando de la CLI, no a los turnos normales del Gateway, cuyo valor predeterminado es de 48 horas.
- `--json`: genera JSON

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

- Pasa exactamente uno de `--message` o `--message-file`. `--message-file` elimina una marca BOM UTF-8 inicial y conserva el contenido multilínea; rechaza los archivos que no sean UTF-8 válido. Los archivos de más de 4 MiB se rechazan antes del envío.
- Los comandos de barra diagonal (por ejemplo, `/compact`) no pueden ejecutarse mediante `--message`. La CLI los rechaza y remite al comando específico correspondiente (`openclaw sessions compact <key>` para Compaction).
- Las ejecuciones de `--local` son de un solo uso: los recursos de bucle invertido de MCP incluidos y las sesiones stdio de Claude activas que se abran para la ejecución se retiran después de la respuesta, de modo que las invocaciones mediante scripts no dejen procesos secundarios locales en ejecución. En cambio, las ejecuciones respaldadas por el Gateway mantienen los recursos de bucle invertido de MCP propiedad del Gateway dentro del proceso del Gateway en ejecución.
- La ejecución integrada independiente con `--local` se niega a reutilizar una sesión principal existente mientras esté pendiente la recuperación tras un reinicio. Ejecuta el turno mediante un Gateway en buen estado o restablécelo allí con `/new` o `/reset`; un proceso integrado independiente no puede coordinar de forma segura al responsable de esa recuperación con el analizador del Gateway.
- Cuando se utilizan conjuntamente `--agent`, `--channel` y `--to`, el enrutamiento de la sesión sigue al destinatario canónico del canal y a `session.dmScope`. Los canales con una identidad de destinatario estable solo de salida utilizan una sesión propiedad del proveedor y aislada de la sesión principal del agente. `--reply-channel` y `--reply-account` solo afectan a la entrega.
- `--session-key` selecciona una clave de sesión explícita. Las claves con prefijo de agente deben utilizar `agent:<agent-id>:<session-key>`, y `--agent` debe coincidir con el id. de agente de la clave cuando se proporcionen ambos. Las claves simples que no sean centinelas se limitan al ámbito de `--agent` cuando se proporciona o, de lo contrario, al agente predeterminado configurado; por ejemplo, `--agent ops --session-key incident-42` se enruta a `agent:ops:incident-42`. Las claves literales `global` y `unknown` solo permanecen sin ámbito cuando no se proporciona `--agent`.
- `--json` reserva stdout para la respuesta JSON; los diagnósticos del Gateway, del plugin y de `--local` se envían a stderr para que los scripts puedan analizar stdout directamente.
- Una vez agotados los reintentos transitorios del protocolo de enlace, un tiempo de espera agotado del Gateway o una conexión cerrada hacen que el comando falle; la CLI nunca vuelve a ejecutar silenciosamente el turno de forma integrada. La pérdida del transporte es ambigua: puede que el Gateway haya aceptado el turno y aún pueda terminarlo, por lo que la indicación de stderr recomienda comprobar `openclaw gateway status` y la transcripción de la sesión antes de volver a intentarlo o ejecutarlo con `--local`, a fin de evitar ejecutar el turno dos veces.
- `SIGTERM`/`SIGINT` interrumpen una solicitud respaldada por el Gateway que está en espera; si el Gateway ya aceptó la ejecución, la CLI también envía `chat.abort` para ese id. de ejecución antes de salir. Las ejecuciones de `--local` reciben la misma señal, pero no envían `chat.abort`. Un proceso secundario del iniciador que termina debido al primer `SIGINT` o `SIGTERM` reenviado sale con el estado 130 o 143, respectivamente. Si la clave interna de desduplicación de ejecuciones ya tiene una ejecución activa para esta sesión, la respuesta informa de `status: "in_flight"` y la CLI sin JSON imprime un diagnóstico en stderr en lugar de una respuesta vacía. Para los contenedores externos de cron/systemd, conserva una medida de respaldo de terminación forzada como `timeout -k 60 600 openclaw agent ...` para que el supervisor pueda recoger el proceso si no es posible completar el cierre.
- Cuando este comando activa la regeneración de `models.json`, las credenciales del proveedor gestionadas mediante SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), nunca como texto sin formato del secreto resuelto. Las escrituras de marcadores proceden de la instantánea de configuración de origen activa, no de los valores secretos resueltos en tiempo de ejecución.

## Estado de entrega JSON

Con `--json --deliver`, la respuesta JSON de la CLI incluye `deliveryStatus` en el nivel superior para que los scripts puedan distinguir entre envíos entregados, suprimidos, parciales y fallidos:

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

Las respuestas de la CLI respaldadas por el Gateway también conservan la estructura sin procesar del resultado del Gateway en `result.deliveryStatus`.

`deliveryStatus.status` es uno de los siguientes:

| Estado           | Significado                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | La entrega se completó.                                                                                                                        |
| `suppressed`     | La entrega no se envió de forma intencionada (por ejemplo, un hook de envío de mensajes la canceló o no hubo ningún resultado visible). Terminal, sin reintento. |
| `partial_failed` | Se envió al menos una carga útil antes de que fallara una posterior.                                                                                   |
| `failed`         | No se completó ningún envío persistente o falló la comprobación previa de la entrega.                                                                                   |

Campos comunes:

- `requested`: siempre `true` cuando el objeto está presente.
- `attempted`: `true` una vez que se ejecuta la ruta de envío persistente; `false` para fallos de comprobación previa o cuando no hay cargas útiles visibles.
- `succeeded`: `true`, `false` o `"partial"`; `"partial"` se empareja con `status: "partial_failed"`.
- `reason`: motivo en minúsculas y formato snake_case procedente de la entrega persistente o de la validación previa. Entre los valores conocidos se incluyen `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` y `no_delivery_target`; los envíos persistentes fallidos también pueden indicar la etapa que falló. Trata los valores desconocidos como opacos, ya que el conjunto puede ampliarse.
- `resultCount`: número de resultados de envío del canal, cuando estén disponibles.
- `sentBeforeError`: `true` cuando un fallo parcial envía al menos una carga útil antes de producirse el error.
- `error`: `true` para envíos fallidos o parcialmente fallidos.
- `errorMessage`: solo está presente cuando se captura un mensaje de error de entrega subyacente. Los fallos de comprobación previa incluyen `error`/`reason`, pero no `errorMessage`.
- `payloadOutcomes`: resultados opcionales por carga útil con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadatos del hook cuando estén disponibles.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Entorno de ejecución del agente](/es/concepts/agent)
