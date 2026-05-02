---
read_when:
    - Programación de trabajos en segundo plano o reactivaciones
    - Conectar activadores externos (webhooks, Gmail) a OpenClaw
    - Elegir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, webhooks y activadores PubSub de Gmail para el programador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-05-02T05:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdda94c3c31e4530e0944cd8f5667a7eb567fcff8e602d6a86d5699d078e9b48
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Persiste trabajos, despierta al agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un endpoint Webhook.

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
- Las definiciones de trabajos persisten en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no pierden programaciones.
- El estado de ejecución en tiempo de ejecución persiste junto a ellas en `~/.openclaw/cron/jobs-state.json`. Si llevas las definiciones de cron en git, lleva `jobs.json` y agrega `jobs-state.json` a gitignore.
- Después de la división, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero pueden tratar los trabajos como nuevos porque los campos de tiempo de ejecución ahora viven en `jobs-state.json`.
- Cuando `jobs.json` se edita mientras el Gateway está en ejecución o detenido, OpenClaw compara los campos de programación modificados con los metadatos de ranura de tiempo de ejecución pendientes y borra los valores `nextRunAtMs` obsoletos. Las reescrituras que son solo de formato o solo de orden de claves preservan la ranura pendiente.
- Todas las ejecuciones de cron crean registros de [tareas en segundo plano](/es/automation/tasks).
- Al iniciar el Gateway, los trabajos atrasados de turno de agente aislado se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse inmediatamente, de modo que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo después de los reinicios.
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada.
- Las ejecuciones aisladas de cron cierran en modo de mejor esfuerzo las pestañas/procesos del navegador rastreados para su sesión `cron:<jobId>` cuando se completa la ejecución, de modo que la automatización de navegador desacoplada no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de confirmación obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
- Las ejecuciones aisladas de cron prefieren metadatos estructurados de denegación de ejecución de la ejecución integrada y luego recurren a marcadores conocidos de resumen/salida final como `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, de modo que un comando bloqueado no se reporte como una ejecución correcta.
- Las ejecuciones aisladas de cron también tratan los fallos de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce ninguna carga útil de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de error y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo aislado de turno de agente alcanza `timeoutSeconds`, cron aborta la ejecución subyacente del agente y le da una breve ventana de limpieza. Si la ejecución no se vacía, la limpieza propiedad del Gateway borra por fuerza la propiedad de sesión de esa ejecución antes de que cron registre el timeout, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron es primero propiedad del tiempo de ejecución y, en segundo lugar, respaldada por historial duradero: una tarea cron activa sigue viva mientras el tiempo de ejecución de cron todavía rastree ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión secundaria. Una vez que el tiempo de ejecución deja de ser propietario del trabajo y vence la ventana de gracia de 5 minutos, las comprobaciones de mantenimiento revisan los registros de ejecución persistidos y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial duradero muestra un resultado terminal, el libro mayor de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría CLI sin conexión puede recuperarse desde el historial duradero, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución cron propiedad del Gateway haya desaparecido.
</Note>

## Tipos de programación

| Tipo    | Marca CLI | Descripción                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`) |
| `every` | `--every` | Intervalo fijo                                          |
| `cron`  | `--cron`  | Expresión cron de 5 o 6 campos con `--tz` opcional      |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para la programación con hora local de pared.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### Día del mes y día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando tanto los campos de día del mes como de día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se activa unas 5-6 veces por mes en lugar de 0-1 veces por mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa en un campo y protege el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en           | Ideal para                      |
| --------------- | -------------------- | ----------------------- | ------------------------------- |
| Sesión principal | `main`              | Siguiente turno de Heartbeat | Recordatorios, eventos del sistema |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado | Informes, tareas en segundo plano |
| Sesión actual   | `current`            | Vinculada al crear      | Trabajo recurrente consciente del contexto |
| Sesión personalizada | `session:custom-id` | Sesión nombrada persistente | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal vs aislada vs personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema y, opcionalmente, despiertan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Esos eventos del sistema no extienden la frescura del reinicio diario/inactivo para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) persisten el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.
  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos aislados">
    Para trabajos aislados, "sesión nueva" significa un nuevo id de transcripción/sesión para cada ejecución. OpenClaw puede llevar preferencias seguras como ajustes de pensamiento/rápido/detallado, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda contexto de conversación ambiental de una fila cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación de tiempo de ejecución ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza de tiempo de ejecución">
    Para trabajos aislados, el desmontaje de tiempo de ejecución ahora incluye limpieza de navegador en modo de mejor esfuerzo para esa sesión cron. Los fallos de limpieza se ignoran para que el resultado cron real siga prevaleciendo.

    Las ejecuciones aisladas de cron también desechan cualquier instancia de tiempo de ejecución MCP incluida creada para el trabajo mediante la ruta compartida de limpieza de tiempo de ejecución. Esto coincide con la forma en que se desmontan los clientes MCP de sesión principal y sesión personalizada, por lo que los trabajos cron aislados no filtran procesos secundarios stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prefiere la salida final del descendiente sobre texto provisional obsoleto del padre. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord solo de texto, OpenClaw envía una vez el texto final canónico del asistente en lugar de reproducir tanto las cargas útiles de texto transmitidas/intermedias como la respuesta final. Las cargas útiles de Discord multimedia y estructuradas se entregan todavía como cargas útiles separadas para que los adjuntos y componentes no se descarten.

  </Accordion>
</AccordionGroup>

### Opciones de carga útil para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto de prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Anulación de modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--thinking" type="string">
  Anulación del nivel de pensamiento.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omitir la inyección del archivo de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringir qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una anulación `/model` de sesión de chat: las cadenas de fallback configuradas siguen aplicándose cuando falla el principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, cron falla la ejecución con un error de validación explícito en lugar de volver silenciosamente a la selección de modelo del agente/predeterminada del trabajo.

Los trabajos cron también pueden llevar `fallbacks` a nivel de carga útil. Cuando está presente, esa lista reemplaza la cadena de fallback configurada para el trabajo. Usa `fallbacks: []` en la carga útil/API del trabajo cuando quieras una ejecución cron estricta que pruebe solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene fallbacks de carga útil ni configurados, OpenClaw pasa una anulación explícita de fallback vacía para que el principal del agente no se agregue como un destino de reintento adicional oculto.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo de hook de Gmail (cuando la ejecución vino de Gmail y esa anulación está permitida)
2. `model` de carga útil por trabajo
3. Anulación de modelo de sesión cron almacenada seleccionada por el usuario
4. Selección de modelo del agente/predeterminada

El modo rápido también sigue la selección en vivo resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, cron aislado lo usa de forma predeterminada. Una anulación de sesión almacenada `fastMode` sigue prevaleciendo sobre la configuración en cualquier dirección.

Si una ejecución aislada llega a una transferencia de cambio de modelo en vivo, cron reintenta con el proveedor/modelo cambiado y persiste esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también lleva un nuevo perfil de autenticación, cron persiste también esa anulación de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos de cambio, cron aborta en lugar de hacer un bucle infinito.

Antes de que una ejecución cron aislada entre en el ejecutor de agentes, OpenClaw comprueba endpoints de proveedores locales alcanzables para proveedores configurados `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea local loopback, de red privada o `.local`. Si ese endpoint está caído, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada al modelo. El resultado del endpoint se almacena en caché durante 5 minutos, por lo que muchos trabajos vencidos que usan el mismo servidor local Ollama, vLLM, SGLang o LM Studio caído comparten una pequeña sonda en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por preflight de proveedor no incrementan el backoff por errores de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué ocurre                                                        |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Entrega de fallback del texto final al destino si el agente no lo envió |
| `webhook`  | POST de la carga útil del evento finalizado a una URL             |
| `none`     | Sin entrega de fallback del ejecutor                              |

Use `--announce --channel telegram --to "-1001234567890"` para la entrega a canales. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; los llamadores directos de RPC/config también pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de sala de Matrix distinguen entre mayúsculas y minúsculas; usa el ID de sala exacto o la forma `room:!room:server` de Matrix.

Cuando la entrega de anuncios usa `channel: "last"` u omite `channel`, un destino con prefijo de proveedor como `telegram:123` puede seleccionar el canal antes de que cron recurra al historial de sesión o a un único canal configurado. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo del destino debe nombrar al mismo proveedor; por ejemplo, `channel: "whatsapp"` con `to: "telegram:123"` se rechaza en lugar de permitir que WhatsApp interprete el ID de Telegram como un número de teléfono. Los prefijos de tipo de destino y servicio, como `channel:<id>`, `user:<id>`, `imessage:<handle>` y `sms:<number>`, siguen siendo sintaxis de destino propiedad del canal, no selectores de proveedor.

Para trabajos aislados, la entrega por chat se comparte. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de reserva. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que el ejecutor hace con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta de anuncio de reserva. Las claves de sesión internas pueden estar en minúsculas; los destinos de entrega de proveedor no se reconstruyen a partir de esas claves cuando hay contexto de chat actual disponible.

Las notificaciones de error siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de error.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si ninguno está establecido y el trabajo ya entrega mediante `announce`, las notificaciones de error ahora recurren a ese destino de anuncio principal.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` a menos que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` incluye un trabajo o una política global de alerta de cron en alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones separado, por lo que no afectan el retroceso de errores de ejecución.

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
  <Tab title="Anulación de modelo y razonamiento">
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

Gateway puede exponer endpoints de Webhook HTTP para disparadores externos. Actívalos en la configuración:

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
    Los nombres de hook personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación de gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` a menos que requieras sesiones seleccionadas por el llamador.
- Si activas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de clave de sesión.
- Las cargas útiles de hook se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración con Gmail PubSub

Conecta disparadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw activados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, activa el preset de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático de Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está establecido, Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para excluirte.

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
  <Step title="Crear tema y conceder acceso push a Gmail">
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
Nota sobre la anulación del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido o no puede resolverse, cron falla la ejecución con un error de validación explícito.
- Las cadenas de reserva configuradas siguen aplicándose porque `--model` de cron es un primario de trabajo, no una anulación de `/model` de sesión.
- La carga útil `fallbacks` reemplaza las reservas configuradas para ese trabajo; `fallbacks: []` desactiva la reserva y hace que la ejecución sea estricta.
- Un `--model` simple sin lista de reservas explícita o configurada no recae en el primario del agente como un destino adicional de reintento silencioso.

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

`maxConcurrentRuns` limita tanto el despacho cron programado como la ejecución de turnos de agente aislados. Los turnos de agente cron aislados usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM cron independientes progresen en paralelo en lugar de iniciar solo sus envoltorios cron externos. Este ajuste no amplía el carril compartido no cron `nested`.

El sidecar de estado en tiempo de ejecución se deriva de `cron.store`: un almacén `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén sin sufijo `.json` añade `-state.json`.

Si editas manualmente `jobs.json`, deja `jobs-state.json` fuera del control de código fuente. OpenClaw usa ese sidecar para espacios pendientes, marcadores activos, metadatos de última ejecución y la identidad de programación que indica al programador cuándo un trabajo editado externamente necesita un `nextRunAtMs` nuevo.

Desactivar cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintentos">
    **Reintento único**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se desactivan de inmediato.

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
    - Confirma que Gateway se está ejecutando continuamente.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y el trabajo todavía no vencía.

  </Accordion>
  <Accordion title="Cron se ejecutó, pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío alternativo del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Si falta el destino de entrega o no es válido (`channel`/`to`), se omitió el envío saliente.
    - Para Matrix, los trabajos copiados o heredados con ID de sala `delivery.to` en minúsculas pueden fallar porque los ID de sala de Matrix distinguen entre mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta alternativa de resumen en cola, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la rotación de /new-style">
    - La actualización del reinicio diario y por inactividad no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, las ejecuciones de Heartbeat, las notificaciones de exec y la contabilidad del Gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no extienden `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` desde el encabezado de sesión JSONL de la transcripción cuando el archivo aún está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan esa hora de inicio recuperada como referencia de inactividad.

  </Accordion>
  <Accordion title="Consideraciones sobre zonas horarias">
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
