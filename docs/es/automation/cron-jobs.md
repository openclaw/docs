---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conectar activadores externos (Webhook, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, webhooks y activadores de Gmail PubSub para el programador de Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-05-02T20:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Conserva los trabajos, despierta al agente en el momento correcto y puede entregar la salida de vuelta a un canal de chat o a un endpoint de webhook.

## Inicio rápido

<Steps>
  <Step title="Agregar un recordatorio de una sola ejecución">
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
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Ver el historial de ejecuciones">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso del Gateway** (no dentro del modelo).
- Las definiciones de trabajos persisten en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no pierden las programaciones.
- El estado de ejecución en tiempo de ejecución persiste junto a él en `~/.openclaw/cron/jobs-state.json`. Si haces seguimiento de las definiciones de cron en git, incluye `jobs.json` e ignora con git `jobs-state.json`.
- Después de la división, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero pueden tratar los trabajos como nuevos porque los campos de ejecución ahora viven en `jobs-state.json`.
- Cuando se edita `jobs.json` mientras el Gateway se está ejecutando o está detenido, OpenClaw compara los campos de programación modificados con los metadatos de ranuras de ejecución pendientes y borra los valores `nextRunAtMs` obsoletos. Las reescrituras que solo cambian el formato o el orden de claves conservan la ranura pendiente.
- Todas las ejecuciones de cron crean registros de [tarea en segundo plano](/es/automation/tasks).
- Al iniciar el Gateway, los trabajos atrasados de turnos de agente aislados se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse inmediatamente, de modo que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo después de reinicios.
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente tras completarse correctamente de forma predeterminada.
- Las ejecuciones aisladas de cron hacen un mejor esfuerzo por cerrar las pestañas/procesos del navegador rastreados para su sesión `cron:<jobId>` cuando la ejecución se completa, de modo que la automatización de navegador desprendida no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de confirmación obsoletas. Si el primer resultado es solo una actualización provisional de estado (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
- Las ejecuciones aisladas de cron prefieren metadatos estructurados de denegación de ejecución de la ejecución embebida y luego recurren a marcadores conocidos de resumen/salida final como `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, de modo que un comando bloqueado no se informe como una ejecución correcta.
- Las ejecuciones aisladas de cron también tratan los fallos de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce ninguna carga útil de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de error y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo aislado de turno de agente alcanza `timeoutSeconds`, cron aborta la ejecución de agente subyacente y le da una breve ventana de limpieza. Si la ejecución no se vacía, la limpieza propiedad del Gateway borra por la fuerza la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron es primero propiedad del tiempo de ejecución y, en segundo lugar, está respaldada por el historial durable: una tarea cron activa permanece en vivo mientras el tiempo de ejecución de cron todavía rastrea ese trabajo como en ejecución, incluso si aún existe una fila antigua de sesión hija. Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira la ventana de gracia de 5 minutos, el mantenimiento revisa los registros de ejecución persistidos y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial durable muestra un resultado terminal, el libro mayor de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría de CLI sin conexión puede recuperarse a partir del historial durable, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución cron propiedad del Gateway haya desaparecido.
</Note>

## Tipos de programación

| Tipo    | Marca de CLI | Descripción                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`)    |
| `every` | `--every` | Intervalo fijo                                          |
| `cron`  | `--cron`  | Expresión cron de 5 o 6 campos con `--tz` opcional |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para programación con hora local de reloj.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una sincronización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron son analizadas por [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se dispara unas 5-6 veces al mes en lugar de 0-1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa sobre un campo y protege el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo           | Valor de `--session`   | Se ejecuta en                  | Ideal para                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sesión principal    | `main`              | Siguiente turno de Heartbeat      | Recordatorios, eventos del sistema        |
| Aislada        | `isolated`          | `cron:<jobId>` dedicado | Informes, tareas en segundo plano      |
| Sesión actual | `current`           | Vinculada al momento de creación   | Trabajo recurrente con contexto    |
| Sesión personalizada  | `session:custom-id` | Sesión con nombre persistente | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada frente a personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema y opcionalmente despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Esos eventos del sistema no extienden la frescura del reinicio diario/por inactividad para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que habilita flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.
  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos aislados">
    Para trabajos aislados, "sesión nueva" significa un nuevo id de transcripción/sesión para cada ejecución. OpenClaw puede llevar preferencias seguras como ajustes de razonamiento/rápido/detallado, etiquetas y sobrescrituras explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda el contexto de conversación ambiental de una fila cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o enlace de tiempo de ejecución ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza de tiempo de ejecución">
    Para trabajos aislados, el desmontaje de tiempo de ejecución ahora incluye limpieza de navegador de mejor esfuerzo para esa sesión cron. Los fallos de limpieza se ignoran para que el resultado real de cron siga prevaleciendo.

    Las ejecuciones aisladas de cron también desechan cualquier instancia de tiempo de ejecución MCP incluida creada para el trabajo mediante la ruta compartida de limpieza de tiempo de ejecución. Esto coincide con la forma en que se desmontan los clientes MCP de sesión principal y sesión personalizada, de modo que los trabajos cron aislados no filtren procesos hijos stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prefiere la salida final del descendiente por encima del texto provisional obsoleto del padre. Si los descendientes todavía se están ejecutando, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía el texto final canónico del asistente una vez, en lugar de reproducir tanto las cargas útiles de texto transmitidas/intermedias como la respuesta final. Las cargas útiles multimedia y estructuradas de Discord se entregan todavía como cargas útiles separadas para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Opciones de carga útil para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislados).
</ParamField>
<ParamField path="--model" type="string">
  Sobrescritura de modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--thinking" type="string">
  Sobrescritura del nivel de razonamiento.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección del archivo de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una sobrescritura `/model` de sesión de chat: las cadenas de fallback configuradas aún se aplican cuando falla el principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, cron falla la ejecución con un error de validación explícito en lugar de recurrir silenciosamente a la selección de modelo del agente/predeterminada del trabajo.

Los trabajos cron también pueden llevar `fallbacks` a nivel de carga útil. Cuando está presente, esa lista reemplaza la cadena de fallback configurada para el trabajo. Usa `fallbacks: []` en la carga útil/API del trabajo cuando quieras una ejecución cron estricta que pruebe solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene fallbacks de carga útil ni configurados, OpenClaw pasa una sobrescritura de fallback vacía explícita para que el principal del agente no se agregue como un destino de reintento extra oculto.

La precedencia de selección de modelo para trabajos aislados es:

1. Sobrescritura de modelo del hook de Gmail (cuando la ejecución provino de Gmail y esa sobrescritura está permitida)
2. `model` de la carga útil por trabajo
3. Sobrescritura de modelo de sesión cron almacenada seleccionada por el usuario
4. Selección de modelo del agente/predeterminada

El modo rápido también sigue la selección en vivo resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado lo usa de forma predeterminada. Una sobrescritura almacenada de sesión `fastMode` todavía prevalece sobre la configuración en ambas direcciones.

Si una ejecución aislada alcanza una transferencia de cambio de modelo en vivo, cron reintenta con el proveedor/modelo cambiado y conserva esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también lleva un nuevo perfil de autenticación, cron también conserva esa sobrescritura de perfil de autenticación para la ejecución activa. Los reintentos están limitados: después del intento inicial más 2 reintentos de cambio, cron aborta en lugar de entrar en un bucle infinito.

Antes de que una ejecución cron aislada entre en el ejecutor del agente, OpenClaw comprueba endpoints de proveedores locales alcanzables para proveedores configurados `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` es local loopback, de red privada o `.local`. Si ese endpoint está caído, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada al modelo. El resultado del endpoint se almacena en caché durante 5 minutos, por lo que muchos trabajos vencidos que usan el mismo servidor local Ollama, vLLM, SGLang o LM Studio caído comparten una pequeña sonda en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por preflight de proveedor no incrementan el backoff de errores de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué sucede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega de fallback del texto final al destino si el agente no lo envió |
| `webhook`  | Hace POST de la carga útil del evento finalizado a una URL                                |
| `none`     | Sin entrega de fallback del ejecutor                                         |

Usa `--announce --channel telegram --to "-1001234567890"` para la entrega al canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; los llamadores directos RPC/config también pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de salas de Matrix distinguen mayúsculas y minúsculas; usa el ID exacto de la sala o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncio usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo de destino debe nombrar el mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>` siguen siendo sintaxis de destino propia del canal, no selectores de proveedor.

Para trabajos aislados, la entrega por chat es compartida. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de respaldo. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que el ejecutor hace con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo conservado para la ruta de anuncio de respaldo. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega de proveedor no se reconstruyen a partir de esas claves cuando el contexto de chat actual está disponible.

La entrega de anuncio implícita usa listas de permitidos de canal configuradas para validar y redirigir destinos obsoletos. Las aprobaciones del almacén de emparejamiento de DM no son destinatarios de automatización de respaldo; define `delivery.to` o configura la entrada `allowFrom` del canal cuando un trabajo programado deba enviar proactivamente a un DM.

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo sobrescribe por trabajo.
- Si no se define ninguno y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino de anuncio principal.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` salvo que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` habilita para un trabajo o una política global de alertas de cron las alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones separado, por lo que no afectan al retroceso de errores de ejecución.

## Ejemplos de CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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

Gateway puede exponer endpoints Webhook HTTP para disparadores externos. Habilítalos en la configuración:

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de local loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación de Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Define `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` salvo que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, define también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de clave de sesión.
- Las cargas de hook se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración con Gmail PubSub

Conecta disparadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático de Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está definido, Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Define `OPENCLAW_SKIP_GMAIL_WATCHER=1` para excluirte.

### Configuración manual de una sola vez

<Steps>
  <Step title="Select the GCP project">
    Selecciona el proyecto GCP que posee el cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Anulación del modelo de Gmail

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
Nota sobre la anulación de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, cron falla la ejecución con un error de validación explícito.
- Las cadenas de respaldo configuradas siguen aplicándose porque `--model` de cron es un principal del trabajo, no una anulación de `/model` de sesión.
- La carga `fallbacks` reemplaza los respaldos configurados para ese trabajo; `fallbacks: []` deshabilita el respaldo y hace que la ejecución sea estricta.
- Un `--model` simple sin lista de respaldos explícita o configurada no cae al principal del agente como destino silencioso adicional de reintento.

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

`maxConcurrentRuns` limita tanto el despacho de cron programado como la ejecución de turnos de agente aislados. Los turnos de agente cron aislados usan internamente la vía de ejecución dedicada `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM de cron independientes avancen en paralelo en lugar de iniciar solo sus envoltorios cron externos. La vía compartida no cron `nested` no se amplía con esta opción.

El sidecar de estado de runtime se deriva de `cron.store`: un almacén `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén sin sufijo `.json` añade `-state.json`.

Si editas manualmente `jobs.json`, deja `jobs-state.json` fuera del control de código fuente. OpenClaw usa ese sidecar para ranuras pendientes, marcadores activos, metadatos de última ejecución y la identidad de programación que indica al programador cuándo un trabajo editado externamente necesita un nuevo `nextRunAtMs`.

Deshabilitar cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Reintento puntual**: los errores transitorios (límite de tasa, sobrecarga, red, error de servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se deshabilitan de inmediato.

    **Reintento recurrente**: retroceso exponencial (30 s a 60 min) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Maintenance">
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
  <Accordion title="Cron not firing">
    - Comprueba `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirma que Gateway esté ejecutándose continuamente.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron se activó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío de reserva del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), se omitió la salida.
    - Para Matrix, los trabajos copiados o heredados con ID de sala `delivery.to` en minúsculas pueden fallar porque los ID de sala de Matrix distinguen entre mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de reserva, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la rotación /new-style">
    - La actualización de reinicio diario e inactivo no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Los despertares de Cron, las ejecuciones de Heartbeat, las notificaciones de ejecución y la contabilidad de Gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` desde el encabezado de sesión JSONL de la transcripción cuando el archivo aún está disponible. Las filas inactivas heredadas sin `lastInteractionAt` usan esa hora de inicio recuperada como su línea base de inactividad.

  </Accordion>
  <Accordion title="Detalles importantes de zona horaria">
    - Cron sin `--tz` usa la zona horaria del host de Gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
