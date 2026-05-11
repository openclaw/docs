---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conectar activadores externos (webhooks, Gmail) a OpenClaw
    - Elegir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Tareas programadas, Webhooks y activadores de Gmail PubSub para el planificador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-05-11T20:20:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Conserva los trabajos, despierta al agente en el momento correcto y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

## Inicio rápido

<Steps>
  <Step title="Agregar un recordatorio de una sola vez">
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
  <Step title="Revisar tus trabajos">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ver el historial de ejecuciones">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cómo funciona Cron

- Cron se ejecuta **dentro del proceso del Gateway** (no dentro del modelo).
- Las definiciones de trabajos se conservan en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no pierden programaciones.
- El estado de ejecución en runtime se conserva junto a él en `~/.openclaw/cron/jobs-state.json`. Si haces seguimiento de las definiciones de Cron en git, haz seguimiento de `jobs.json` y agrega `jobs-state.json` a gitignore.
- Tras la separación, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero podrían tratar los trabajos como nuevos porque los campos de runtime ahora viven en `jobs-state.json`.
- Cuando `jobs.json` se edita mientras el Gateway se está ejecutando o está detenido, OpenClaw compara los campos de programación modificados con los metadatos de ranuras de runtime pendientes y borra los valores `nextRunAtMs` obsoletos. Las reescrituras solo de formato o solo de orden de claves conservan la ranura pendiente.
- Todas las ejecuciones de Cron crean registros de [tareas en segundo plano](/es/automation/tasks).
- Al iniciar el Gateway, los trabajos atrasados de turnos de agente aislados se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse de inmediato, de modo que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo después de los reinicios.
- Los trabajos de una sola vez (`--at`) se eliminan automáticamente después de ejecutarse correctamente de forma predeterminada.
- Las ejecuciones aisladas de Cron cierran con el mejor esfuerzo las pestañas/procesos del navegador registrados para su sesión `cron:<jobId>` cuando la ejecución termina, de modo que la automatización de navegador desconectada no deje procesos huérfanos.
- Las ejecuciones aisladas de Cron que reciben la concesión estrecha de autolimpieza de Cron aún pueden leer el estado del programador, una lista autofiltada de su trabajo actual y el historial de ejecuciones de ese trabajo, de modo que las comprobaciones de estado/Heartbeat puedan inspeccionar su propia programación sin obtener acceso más amplio de mutación de Cron.
- Las ejecuciones aisladas de Cron también protegen contra respuestas de acuse obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` e indicios similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de entregarlo.
- Las ejecuciones aisladas de Cron prefieren metadatos estructurados de denegación de ejecución de la ejecución integrada y luego recurren a marcadores conocidos de resumen/salida final como `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, de modo que un comando bloqueado no se informe como una ejecución correcta.
- Las ejecuciones aisladas de Cron también tratan los fallos de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce una carga de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de error y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo de turno de agente aislado alcanza `timeoutSeconds`, Cron aborta la ejecución subyacente del agente y le da una breve ventana de limpieza. Si la ejecución no se drena, la limpieza propiedad del Gateway fuerza la eliminación de la propiedad de sesión de esa ejecución antes de que Cron registre el tiempo de espera, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.
- Si un turno de agente aislado se atasca antes de que el ejecutor comience o antes de la primera llamada al modelo, Cron registra un tiempo de espera específico de la fase, como `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Estos watchdogs cubren proveedores integrados y proveedores respaldados por CLI antes de que su proceso de CLI externo se inicie realmente, y se limitan de forma independiente respecto de valores largos de `timeoutSeconds`, de modo que los fallos de arranque en frío/autenticación/contexto aparezcan rápido en lugar de esperar todo el presupuesto del trabajo.

<a id="maintenance"></a>

<Note>
La conciliación de tareas para Cron es primero propiedad del runtime y, en segundo lugar, respaldada por historial durable: una tarea de Cron activa permanece viva mientras el runtime de Cron todavía rastrea ese trabajo como en ejecución, incluso si aún existe una fila antigua de sesión hija. Una vez que el runtime deja de poseer el trabajo y vence la ventana de gracia de 5 minutos, las comprobaciones de mantenimiento revisan los registros de ejecución conservados y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial durable muestra un resultado terminal, el registro de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría de CLI offline puede recuperarse desde el historial durable, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución de Cron propiedad del Gateway desapareció.
</Note>

## Tipos de programación

| Tipo    | Flag de CLI | Descripción                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Marca de tiempo de una sola vez (ISO 8601 o relativa como `20m`)    |
| `every` | `--every` | Intervalo fijo                                          |
| `cron`  | `--cron`  | Expresión de Cron de 5 o 6 campos con `--tz` opcional |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para programar según la hora local de pared.

Las expresiones recurrentes de inicio de hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### Día del mes y día de la semana usan lógica OR

Las expresiones de Cron son analizadas por [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner coincide cuando **cualquiera** de los dos campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara unas 5-6 veces al mes en lugar de 0-1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa sobre un campo y valida el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo           | Valor de `--session` | Se ejecuta en                  | Ideal para                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal    | `main`              | Siguiente turno de Heartbeat      | Recordatorios, eventos del sistema        |
| Aislado        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas en segundo plano      |
| Sesión actual | `current`           | Vinculada en el momento de creación   | Trabajo recurrente con contexto    |
| Sesión personalizada  | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada frente a personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Esos eventos del sistema no amplían la frescura del restablecimiento diario/inactivo para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes previos.
  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos aislados">
    Para trabajos aislados, "sesión nueva" significa un nuevo id de transcripción/sesión para cada ejecución. OpenClaw puede portar preferencias seguras como ajustes de razonamiento/rápido/detallado, etiquetas y anulaciones explícitas seleccionadas por el usuario de modelo/autenticación, pero no hereda contexto de conversación ambiental de una fila de Cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o enlace de runtime ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza de runtime">
    Para trabajos aislados, el desmontaje del runtime ahora incluye limpieza del navegador con el mejor esfuerzo para esa sesión de Cron. Los fallos de limpieza se ignoran para que el resultado real de Cron siga prevaleciendo.

    Las ejecuciones aisladas de Cron también desechan cualquier instancia de runtime MCP incluida creada para el trabajo a través de la ruta compartida de limpieza de runtime. Esto coincide con la forma en que los clientes MCP de sesión principal y sesión personalizada se desmontan, de modo que los trabajos aislados de Cron no filtren procesos hijo stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones aisladas de Cron orquestan subagentes, la entrega también prefiere la salida final descendiente por encima del texto provisional obsoleto del padre. Si los descendientes aún se están ejecutando, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía una vez el texto final canónico del asistente en lugar de reproducir tanto las cargas de texto transmitidas/intermedias como la respuesta final. Las cargas multimedia y estructuradas de Discord aún se entregan como cargas separadas para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Opciones de carga para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Anulación de modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--thinking" type="string">
  Anulación del nivel de razonamiento.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección de archivos de arranque del workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una anulación `/model` de sesión de chat: las cadenas de fallback configuradas siguen aplicándose cuando falla el principal del trabajo. Si el modelo solicitado no está permitido o no puede resolverse, Cron falla la ejecución con un error de validación explícito en lugar de recurrir silenciosamente a la selección de modelo de agente/predeterminada del trabajo.

Los trabajos de Cron también pueden portar `fallbacks` a nivel de carga. Cuando está presente, esa lista reemplaza la cadena de fallback configurada para el trabajo. Usa `fallbacks: []` en la carga/API del trabajo cuando quieras una ejecución de Cron estricta que intente solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene fallbacks ni en la carga ni configurados, OpenClaw pasa una anulación explícita de fallback vacía para que el principal del agente no se agregue como destino extra oculto de reintento.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución provino de Gmail y esa anulación está permitida)
2. `model` de la carga por trabajo
3. Anulación de modelo almacenada seleccionada por el usuario para la sesión de Cron
4. Selección de modelo de agente/predeterminada

El modo rápido también sigue la selección en vivo resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, Cron aislado lo usa de forma predeterminada. Una anulación `fastMode` almacenada en la sesión sigue teniendo prioridad sobre la configuración en cualquier dirección.

Si una ejecución aislada encuentra una transferencia de cambio de modelo en vivo, Cron reintenta con el proveedor/modelo cambiado y conserva esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también porta un nuevo perfil de autenticación, Cron conserva también esa anulación de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos de cambio, Cron aborta en lugar de entrar en un bucle infinito.

Antes de que una ejecución de Cron aislada entre en el ejecutor del agente, OpenClaw comprueba los endpoints de proveedores locales alcanzables para proveedores configurados con `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea local loopback, de red privada o `.local`. Si ese endpoint no está disponible, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada al modelo. El resultado del endpoint se almacena en caché durante 5 minutos, de modo que muchos trabajos vencidos que usan el mismo servidor local de Ollama, vLLM, SGLang o LM Studio inactivo comparten una pequeña comprobación en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por preflight de proveedor no incrementan el backoff por error de ejecución; activa `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué ocurre                                                        |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Entrega de respaldo del texto final al destino si el agente no lo envió |
| `webhook`  | Envía por POST la carga útil del evento finalizado a una URL      |
| `none`     | Sin entrega de respaldo del ejecutor                              |

Usa `--announce --channel telegram --to "-1001234567890"` para la entrega a canales. Para temas de foros de Telegram, usa `-1001234567890:topic:123`; los llamadores directos de RPC/configuración también pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de salas de Matrix distinguen mayúsculas y minúsculas; usa el ID exacto de la sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncio usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que Cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo de destino debe nombrar al mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio, como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>`, siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para trabajos aislados, la entrega por chat es compartida. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de respaldo. De lo contrario, `announce`, `webhook` y `none` solo controlan qué hace el ejecutor con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta de anuncio de respaldo. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando el contexto de chat actual está disponible.

La entrega de anuncio implícita usa listas de permitidos de canales configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de DM no son destinatarios de automatización de respaldo; configura `delivery.to` o la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` establece un valor global predeterminado para las notificaciones de fallo.
- `job.delivery.failureDestination` lo sobrescribe por trabajo.
- Si ninguno está definido y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo se admite en trabajos con `sessionTarget="isolated"` salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` hace que un trabajo o una política global de alertas de Cron opte por alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones separado, por lo que no afectan el backoff por error de ejecución.

## Ejemplos de CLI

<Tabs>
  <Tab title="Recordatorio de una sola vez">
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

Gateway puede exponer endpoints de Webhook HTTP para desencadenadores externos. Actívalos en la configuración:

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

Cada solicitud debe incluir el token del hook mediante encabezado:

- `Authorization: Bearer <token>` (recomendado)
- `x-openclaw-token: <token>`

Los tokens en la cadena de consulta se rechazan.

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
    Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hooks detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación del Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Define `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que requieras sesiones seleccionadas por el llamador.
- Si activas `hooks.allowRequestSessionKey`, define también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de hooks se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración con Gmail PubSub

Conecta los desencadenadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI de `gcloud`, `gog` (gogcli), hooks de OpenClaw activados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, activa el preset de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está definido, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Define `OPENCLAW_SKIP_GMAIL_WATCHER=1` para excluirte.

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
  <Step title="Crear tema y conceder acceso push de Gmail">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Iniciar la vigilancia">
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

# Get one stored job as JSON
openclaw cron get <jobId>

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
Nota de sobrescritura de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no se puede resolver, Cron falla la ejecución con un error de validación explícito.
- Las cadenas de fallback configuradas siguen aplicándose porque `--model` de Cron es un primario del trabajo, no una sobrescritura de `/model` de sesión.
- La carga útil `fallbacks` reemplaza los fallbacks configurados para ese trabajo; `fallbacks: []` desactiva el fallback y hace que la ejecución sea estricta.
- Un `--model` simple sin lista de fallback explícita o configurada no cae al primario del agente como un destino de reintento adicional silencioso.

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

`maxConcurrentRuns` limita tanto el despacho programado de Cron como la ejecución de turnos aislados del agente. Los turnos aislados de agente de Cron usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM de Cron independientes progresen en paralelo en lugar de solo iniciar sus envoltorios externos de Cron. El carril compartido no Cron `nested` no se amplía con esta configuración.

El sidecar de estado de runtime se deriva de `cron.store`: un almacén `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén sin sufijo `.json` añade `-state.json`.

Si editas manualmente `jobs.json`, deja `jobs-state.json` fuera del control de código fuente. OpenClaw usa ese sidecar para ranuras pendientes, marcadores activos, metadatos de la última ejecución y la identidad de programación que indica al programador cuándo un trabajo editado externamente necesita un `nextRunAtMs` nuevo.

Desactivar Cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintentos">
    **Reintento de una sola vez**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con backoff exponencial. Los errores permanentes se desactivan inmediatamente.

    **Reintento recurrente**: backoff exponencial (30 s a 60 min) entre reintentos. El backoff se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (valor predeterminado `24h`) elimina entradas aisladas de sesiones de ejecución. `cron.runLog.maxBytes` / `cron.runLog.keepLines` recortan automáticamente los archivos de registro de ejecución.
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
  <Accordion title="Cron no se ejecuta">
    - Comprueba `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirma que el Gateway se esté ejecutando de forma continua.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que se comprobó una ejecución manual con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron se ejecutó pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío de respaldo del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), se omitió el envío saliente.
    - Para Matrix, los trabajos copiados o heredados con ID de sala `delivery.to` en minúsculas pueden fallar porque los ID de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar mensajes al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la renovación de estilo /new">
    - La actualización del reinicio diario y por inactividad no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Los despertares de Cron, las ejecuciones de Heartbeat, las notificaciones de exec y la contabilidad del Gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión del transcript JSONL cuando el archivo aún está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan esa hora de inicio recuperada como su referencia de inactividad.

  </Accordion>
  <Accordion title="Problemas típicos de zona horaria">
    - Cron sin `--tz` usa la zona horaria del host del Gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
