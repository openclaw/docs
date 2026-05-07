---
read_when:
    - Programación de tareas en segundo plano o activaciones
    - Conectar activadores externos (Webhooks, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Tareas programadas, Webhooks y desencadenadores PubSub de Gmail para el planificador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-05-07T13:13:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Conserva los trabajos, despierta al agente en el momento adecuado y puede entregar la salida a un canal de chat o a un endpoint de Webhook.

## Inicio rápido

<Steps>
  <Step title="Agrega un recordatorio de una sola ejecución">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Revisa tus trabajos">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ve el historial de ejecuciones">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cómo funciona Cron

- Cron se ejecuta **dentro del proceso del Gateway** (no dentro del modelo).
- Las definiciones de trabajos se conservan en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no pierden programaciones.
- El estado de ejecución en tiempo de ejecución se conserva junto a él en `~/.openclaw/cron/jobs-state.json`. Si registras las definiciones de Cron en git, registra `jobs.json` y agrega `jobs-state.json` a gitignore.
- Después de la separación, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero pueden tratar los trabajos como nuevos porque los campos de tiempo de ejecución ahora viven en `jobs-state.json`.
- Cuando `jobs.json` se edita mientras el Gateway está en ejecución o detenido, OpenClaw compara los campos de programación modificados con los metadatos de ranura de tiempo de ejecución pendientes y borra los valores obsoletos de `nextRunAtMs`. Las reescrituras que solo cambian el formato o el orden de claves conservan la ranura pendiente.
- Todas las ejecuciones de Cron crean registros de [tarea en segundo plano](/es/automation/tasks).
- Al iniciar el Gateway, los trabajos de turnos de agente aislados vencidos se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse de inmediato, de modo que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo después de reinicios.
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada.
- Las ejecuciones aisladas de Cron cierran, con el mejor esfuerzo, pestañas/procesos de navegador rastreados para su sesión `cron:<jobId>` cuando la ejecución termina, de modo que la automatización de navegador desacoplada no deje procesos huérfanos.
- Las ejecuciones aisladas de Cron que reciben la concesión limitada de autolimpieza de Cron aún pueden leer el estado del programador y una lista autofitrada de su trabajo actual, por lo que las comprobaciones de estado/Heartbeat pueden inspeccionar su propia programación sin obtener acceso más amplio para mutar Cron.
- Las ejecuciones aisladas de Cron también se protegen contra respuestas de confirmación obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
- Las ejecuciones aisladas de Cron prefieren metadatos estructurados de denegación de ejecución de la ejecución incrustada y luego recurren a marcadores conocidos de resumen/salida final como `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, de modo que un comando bloqueado no se informe como una ejecución correcta.
- Las ejecuciones aisladas de Cron también tratan los errores de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce ningún payload de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de error y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo de turno de agente aislado alcanza `timeoutSeconds`, Cron aborta la ejecución de agente subyacente y le da una ventana breve de limpieza. Si la ejecución no se vacía, la limpieza propiedad del Gateway fuerza la eliminación de la propiedad de sesión de esa ejecución antes de que Cron registre el tiempo de espera agotado, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para Cron primero es propiedad del tiempo de ejecución y, en segundo lugar, está respaldada por el historial duradero: una tarea activa de Cron permanece activa mientras el tiempo de ejecución de Cron siga rastreando ese trabajo como en ejecución, incluso si aún existe una fila de sesión secundaria antigua. Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira la ventana de gracia de 5 minutos, las comprobaciones de mantenimiento revisan los registros de ejecución persistidos y el estado del trabajo para la ejecución `cron:<jobId>:<startedAt>` correspondiente. Si ese historial duradero muestra un resultado terminal, el libro mayor de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría CLI sin conexión puede recuperarse a partir del historial duradero, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución de Cron propiedad del Gateway desapareció.
</Note>

## Tipos de programación

| Tipo    | Marca CLI  | Descripción                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`)    |
| `every` | `--every` | Intervalo fijo                                          |
| `cron`  | `--cron`  | Expresión Cron de 5 o 6 campos con `--tz` opcional |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para programar con la hora local de reloj.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones Cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando tanto el campo de día del mes como el de día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara unas 5-6 veces al mes en lugar de 0-1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa según un campo y valida el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo           | Valor de `--session`   | Se ejecuta en                  | Ideal para                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal    | `main`              | Siguiente turno de Heartbeat      | Recordatorios, eventos del sistema        |
| Aislado        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas de mantenimiento en segundo plano      |
| Sesión actual | `current`           | Vinculada en el momento de creación   | Trabajo recurrente con contexto    |
| Sesión personalizada  | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada frente a personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Esos eventos del sistema no extienden la frescura de restablecimiento diario/inactivo para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.
  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para los trabajos aislados">
    Para los trabajos aislados, "sesión nueva" significa un nuevo identificador de transcripción/sesión para cada ejecución. OpenClaw puede llevar preferencias seguras como ajustes de pensamiento/rápido/detallado, etiquetas y anulaciones explícitas seleccionadas por el usuario de modelo/autenticación, pero no hereda contexto de conversación ambiental de una fila antigua de Cron: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación de tiempo de ejecución ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza en tiempo de ejecución">
    Para los trabajos aislados, el desmontaje en tiempo de ejecución ahora incluye limpieza de navegador de mejor esfuerzo para esa sesión de Cron. Los fallos de limpieza se ignoran para que el resultado real de Cron siga prevaleciendo.

    Las ejecuciones aisladas de Cron también desechan cualquier instancia de tiempo de ejecución MCP incluida que se haya creado para el trabajo mediante la ruta compartida de limpieza de tiempo de ejecución. Esto coincide con la forma en que se desmontan los clientes MCP de sesión principal y sesión personalizada, de modo que los trabajos aislados de Cron no filtren procesos secundarios stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones aisladas de Cron orquestan subagentes, la entrega también prefiere la salida final descendiente frente al texto provisional obsoleto del padre. Si los descendientes siguen en ejecución, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía el texto final canónico del asistente una vez en lugar de reproducir tanto los payloads de texto transmitidos/intermedios como la respuesta final. Los payloads multimedia y estructurados de Discord siguen entregándose como payloads separados para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Opciones de payload para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Anulación de modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--thinking" type="string">
  Anulación del nivel de pensamiento.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una anulación `/model` de sesión de chat: las cadenas de respaldo configuradas siguen aplicándose cuando falla el principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, Cron hace fallar la ejecución con un error de validación explícito en lugar de recurrir silenciosamente a la selección de modelo del agente/predeterminada del trabajo.

Los trabajos de Cron también pueden llevar `fallbacks` a nivel de payload. Cuando está presente, esa lista reemplaza la cadena de respaldo configurada para el trabajo. Usa `fallbacks: []` en el payload/API del trabajo cuando quieras una ejecución estricta de Cron que pruebe solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene respaldos ni de payload ni configurados, OpenClaw pasa una anulación explícita de respaldos vacía para que el principal del agente no se agregue como destino adicional oculto de reintento.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución provino de Gmail y esa anulación está permitida)
2. `model` del payload por trabajo
3. Anulación de modelo de sesión de Cron almacenada seleccionada por el usuario
4. Selección de modelo de agente/predeterminada

El modo rápido también sigue la selección en vivo resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, Cron aislado la usa de forma predeterminada. Una anulación `fastMode` de sesión almacenada sigue teniendo prioridad sobre la configuración en ambas direcciones.

Si una ejecución aislada alcanza una transferencia de cambio de modelo en vivo, Cron vuelve a intentar con el proveedor/modelo cambiado y conserva esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también trae un nuevo perfil de autenticación, Cron también conserva esa anulación de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos de cambio, Cron aborta en lugar de entrar en un bucle infinito.

Antes de que una ejecución aislada de Cron entre en el ejecutor de agente, OpenClaw comprueba endpoints de proveedores locales alcanzables para proveedores configurados con `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea de bucle local, red privada o `.local`. Si ese endpoint está caído, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada al modelo. El resultado del endpoint se almacena en caché durante 5 minutos, de modo que muchos trabajos vencidos que usan el mismo servidor local Ollama, vLLM, SGLang o LM Studio caído compartan una pequeña sonda en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por preflight de proveedor no incrementan el backoff de errores de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué sucede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega de respaldo del texto final al destino si el agente no envió |
| `webhook`  | Envía por POST el payload de evento terminado a una URL                                |
| `none`     | Sin entrega de respaldo del ejecutor                                         |

Usa `--announce --channel telegram --to "-1001234567890"` para la entrega a canales. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; los llamadores directos de RPC/configuración también pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de salas de Matrix distinguen mayúsculas y minúsculas; usa el ID exacto de la sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncios usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe nombrar el mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio, como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>`, siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para trabajos aislados, la entrega de chat se comparte. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de reserva. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que el ejecutor hace con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta de anuncio de reserva. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando el contexto de chat actual está disponible.

La entrega de anuncios implícita usa listas de permitidos de canales configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de DM no son destinatarios de automatización de reserva; define `delivery.to` o configura la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

Las notificaciones de fallo siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo sobrescribe por trabajo.
- Si ninguno está definido y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino de anuncio principal.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` permite que una política de alerta cron global o de trabajo incluya alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones independiente, por lo que no afectan al retroceso por errores de ejecución.

## Ejemplos de CLI

<Tabs>
  <Tab title="Recordatorio único">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Trabajo aislado recurrente">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Sobrescritura de modelo y razonamiento">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway puede exponer endpoints Webhook HTTP para activadores externos. Habilítalos en la configuración:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autenticación

Cada solicitud debe incluir el token del hook mediante un encabezado:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Los tokens en cadenas de consulta se rechazan.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Encola un evento del sistema para la sesión principal:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descripción del evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` o `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Ejecuta un turno de agente aislado:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks asignados (POST /hooks/<name>)">
    Los nombres de hook personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación de Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Define `hooks.allowedAgentIds` para limitar el enrutamiento explícito por `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, define también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de hook se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración con Gmail PubSub

Conecta activadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI de `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático de Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` están definidos, Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente el watch. Define `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.

### Configuración manual de una sola vez

<Steps>
  <Step title="Seleccionar el proyecto de GCP">
    Selecciona el proyecto de GCP propietario del cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crear el tema y conceder acceso push a Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Iniciar el watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Sobrescritura del modelo de Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gestión de trabajos

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Nota sobre la sobrescritura de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no se puede resolver, cron falla la ejecución con un error de validación explícito.
- Las cadenas de reserva configuradas siguen aplicándose porque `--model` de cron es un primario de trabajo, no una sobrescritura de sesión `/model`.
- La carga útil `fallbacks` reemplaza las reservas configuradas para ese trabajo; `fallbacks: []` deshabilita la reserva y hace que la ejecución sea estricta.
- Un `--model` simple sin una lista de reservas explícita o configurada no pasa al primario del agente como un destino de reintento adicional silencioso.

</Note>

## Configuración

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` limita tanto el envío de cron programado como la ejecución de turnos de agente aislados. Los turnos aislados de agentes de cron usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM de cron independientes avancen en paralelo en lugar de iniciar solo sus envoltorios de cron externos. El carril compartido no cron `nested` no se amplía con esta configuración.

El sidecar de estado en tiempo de ejecución se deriva de `cron.store`: un almacén `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén sin sufijo `.json` agrega `-state.json`.

Si editas `jobs.json` manualmente, deja `jobs-state.json` fuera del control de código fuente. OpenClaw usa ese sidecar para ranuras pendientes, marcadores activos, metadatos de última ejecución y la identidad de programación que le indica al programador cuándo un trabajo editado externamente necesita un `nextRunAtMs` nuevo.

Deshabilitar cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintentos">
    **Reintento único**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se deshabilitan inmediatamente.

    **Reintento recurrente**: retroceso exponencial (30 s a 60 min) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (predeterminado `24h`) depura entradas de sesiones de ejecución aisladas. `cron.runLog.maxBytes` / `cron.runLog.keepLines` depuran automáticamente los archivos de registro de ejecución.
  </Accordion>
</AccordionGroup>

## Solución de problemas

### Escalera de comandos

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron no se dispara">
    - Comprueba `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirma que Gateway se esté ejecutando de forma continua.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron se activó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío de respaldo del runner. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Un destino de entrega ausente o no válido (`channel`/`to`) significa que se omitió el envío saliente.
    - Para Matrix, los trabajos copiados o heredados con ID de sala `delivery.to` en minúsculas pueden fallar porque los ID de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación de canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat previo, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la rotación /new-style">
    - La vigencia de los reinicios diarios y por inactividad no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, las ejecuciones de Heartbeat, las notificaciones de exec y la contabilidad del Gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no amplían `sessionStartedAt` ni `lastInteractionAt`.
    - Para las filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión de la transcripción JSONL cuando el archivo aún está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan esa hora de inicio recuperada como referencia de inactividad.

  </Accordion>
  <Accordion title="Consideraciones sobre zonas horarias">
    - Cron sin `--tz` usa la zona horaria del host del Gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de Cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
