---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conectar desencadenadores externos (Webhooks, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, Webhooks y activadores de PubSub de Gmail para el programador de Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-04-30T05:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron es el programador integrado del Gateway. Conserva los trabajos, despierta al agente en el momento correcto y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

## Inicio rápido

<Steps>
  <Step title="Agrega un recordatorio único">
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
  <Step title="Comprueba tus trabajos">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Consulta el historial de ejecuciones">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso del Gateway** (no dentro del modelo).
- Las definiciones de trabajos persisten en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no pierden las programaciones.
- El estado de ejecución en tiempo de ejecución persiste junto a ellas en `~/.openclaw/cron/jobs-state.json`. Si llevas las definiciones de cron en git, incluye `jobs.json` e ignora en git `jobs-state.json`.
- Después de la separación, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero pueden tratar los trabajos como nuevos porque los campos de tiempo de ejecución ahora viven en `jobs-state.json`.
- Cuando `jobs.json` se edita mientras el Gateway está en ejecución o detenido, OpenClaw compara los campos de programación modificados con los metadatos de ranuras pendientes en tiempo de ejecución y borra los valores `nextRunAtMs` obsoletos. Las reescrituras puramente de formato o solo de orden de claves conservan la ranura pendiente.
- Todas las ejecuciones de cron crean registros de [tarea en segundo plano](/es/automation/tasks).
- Al iniciar el Gateway, los trabajos atrasados de turno de agente aislado se reprograman fuera de la ventana de conexión del canal en lugar de reproducirse de inmediato, de modo que el inicio de Discord/Telegram y la configuración de comandos nativos sigan respondiendo después de los reinicios.
- Los trabajos únicos (`--at`) se eliminan automáticamente después de completarse correctamente de forma predeterminada.
- Las ejecuciones aisladas de cron hacen el mayor esfuerzo por cerrar las pestañas/procesos de navegador rastreados para su sesión `cron:<jobId>` cuando se completa la ejecución, de modo que la automatización de navegador desacoplada no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de acuse de recibo obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución de subagente descendiente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.
- Las ejecuciones aisladas de cron prefieren metadatos estructurados de denegación de ejecución de la ejecución integrada y luego recurren a marcadores conocidos de resumen/salida final como `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, para que un comando bloqueado no se informe como una ejecución correcta.
- Las ejecuciones aisladas de cron también tratan los fallos de agente a nivel de ejecución como errores de trabajo incluso cuando no se produce ninguna carga de respuesta, de modo que los fallos de modelo/proveedor incrementen los contadores de errores y activen notificaciones de fallo en lugar de marcar el trabajo como correcto.
- Cuando un trabajo aislado de turno de agente alcanza `timeoutSeconds`, cron anula la ejecución subyacente del agente y le da una breve ventana de limpieza. Si la ejecución no se vacía, la limpieza propiedad del Gateway fuerza la liberación de la propiedad de sesión de esa ejecución antes de que cron registre el tiempo de espera, de modo que el trabajo de chat en cola no quede detrás de una sesión de procesamiento obsoleta.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron pertenece primero al tiempo de ejecución y, en segundo lugar, se respalda en el historial durable: una tarea activa de cron permanece activa mientras el tiempo de ejecución de cron siga rastreando ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión hija. Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira la ventana de gracia de 5 minutos, el mantenimiento comprueba los registros de ejecución persistidos y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial durable muestra un resultado terminal, el libro mayor de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad del Gateway puede marcar la tarea como `lost`. La auditoría offline de la CLI puede recuperarse desde el historial durable, pero no trata su propio conjunto vacío de trabajos activos en proceso como prueba de que una ejecución de cron propiedad del Gateway haya desaparecido.
</Note>

## Tipos de programación

| Tipo    | Opción de CLI | Descripción                                                     |
| ------- | ------------- | --------------------------------------------------------------- |
| `at`    | `--at`        | Marca de tiempo única (ISO 8601 o relativa como `20m`)          |
| `every` | `--every`     | Intervalo fijo                                                  |
| `cron`  | `--cron`      | Expresión cron de 5 o 6 campos con `--tz` opcional              |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para programación con hora local de reloj.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### Día del mes y día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se activa unas 5–6 veces al mes en lugar de 0–1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa en un campo y protege el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en              | Ideal para                              |
| --------------- | -------------------- | -------------------------- | --------------------------------------- |
| Sesión principal | `main`              | Siguiente turno de Heartbeat | Recordatorios, eventos del sistema      |
| Aislada         | `isolated`          | `cron:<jobId>` dedicado    | Informes, tareas en segundo plano       |
| Sesión actual   | `current`           | Vinculada en el momento de creación | Trabajo recurrente con contexto         |
| Sesión personalizada | `session:custom-id` | Sesión con nombre persistente | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal frente a aislada frente a personalizada">
    Los trabajos de **sesión principal** ponen en cola un evento del sistema y, opcionalmente, activan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Esos eventos del sistema no amplían la vigencia del restablecimiento diario/por inactividad para la sesión de destino. Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias que se basan en resúmenes anteriores.
  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos aislados">
    Para los trabajos aislados, "sesión nueva" significa un nuevo identificador de transcripción/sesión para cada ejecución. OpenClaw puede conservar preferencias seguras como ajustes de razonamiento/rápido/detallado, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda el contexto ambiental de conversación de una fila de Cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación de tiempo de ejecución ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza del tiempo de ejecución">
    Para los trabajos aislados, el desmontaje del tiempo de ejecución ahora incluye limpieza del navegador con el mejor esfuerzo para esa sesión de Cron. Los fallos de limpieza se ignoran para que el resultado real de Cron siga teniendo prioridad.

    Las ejecuciones de Cron aisladas también descartan cualquier instancia de tiempo de ejecución MCP incluida creada para el trabajo mediante la ruta compartida de limpieza de tiempo de ejecución. Esto coincide con la forma en que se desmontan los clientes MCP de sesión principal y sesión personalizada, por lo que los trabajos de Cron aislados no filtran procesos secundarios stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones de Cron aisladas orquestan subagentes, la entrega también prefiere la salida final del descendiente frente a texto provisional obsoleto del padre. Si los descendientes siguen ejecutándose, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para destinos de anuncio de Discord de solo texto, OpenClaw envía una vez el texto final canónico del asistente en lugar de reproducir tanto las cargas de texto transmitidas/intermedias como la respuesta final. Las cargas de medios y Discord estructuradas se siguen entregando como cargas separadas para que los adjuntos y componentes no se descarten.

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
  Omitir la inyección del archivo de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringir qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado como modelo principal de ese trabajo. No es lo mismo que una anulación `/model` de sesión de chat: las cadenas de respaldo configuradas siguen aplicándose cuando falla el modelo principal del trabajo. Si el modelo solicitado no está permitido o no se puede resolver, Cron falla la ejecución con un error de validación explícito en lugar de recurrir silenciosamente a la selección de modelo del agente/predeterminada del trabajo.

Los trabajos de Cron también pueden llevar `fallbacks` a nivel de carga. Cuando está presente, esa lista reemplaza la cadena de respaldos configurada para el trabajo. Usa `fallbacks: []` en la carga/API del trabajo cuando quieras una ejecución de Cron estricta que intente solo el modelo seleccionado. Si un trabajo tiene `--model` pero no tiene respaldos ni en la carga ni configurados, OpenClaw pasa una anulación explícita de respaldos vacía para que el modelo principal del agente no se añada como un destino adicional oculto de reintento.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución vino de Gmail y esa anulación está permitida)
2. `model` de carga por trabajo
3. Anulación de modelo almacenada de sesión de Cron seleccionada por el usuario
4. Selección de modelo del agente/predeterminada

El modo rápido también sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, el Cron aislado lo usa de forma predeterminada. Una anulación `fastMode` de sesión almacenada sigue teniendo prioridad sobre la configuración en ambas direcciones.

Si una ejecución aislada encuentra una transferencia de cambio de modelo en vivo, Cron reintenta con el proveedor/modelo cambiado y conserva esa selección en vivo para la ejecución activa antes de reintentar. Cuando el cambio también lleva un nuevo perfil de autenticación, Cron también conserva esa anulación de perfil de autenticación para la ejecución activa. Los reintentos están acotados: después del intento inicial más 2 reintentos por cambio, Cron aborta en lugar de entrar en un bucle indefinido.

Antes de que una ejecución de Cron aislada entre en el ejecutor del agente, OpenClaw comprueba los endpoints de proveedores locales alcanzables para proveedores configurados `api: "ollama"` y `api: "openai-completions"` cuyo `baseUrl` sea local loopback, de red privada o `.local`. Si ese endpoint está caído, la ejecución se registra como `skipped` con un error claro de proveedor/modelo en lugar de iniciar una llamada de modelo. El resultado del endpoint se almacena en caché durante 5 minutos, por lo que muchos trabajos vencidos que usan el mismo servidor local Ollama, vLLM, SGLang o LM Studio caído comparten una pequeña comprobación en lugar de crear una tormenta de solicitudes. Las ejecuciones omitidas por comprobación previa del proveedor no incrementan el retroceso por error de ejecución; habilita `failureAlert.includeSkipped` cuando quieras notificaciones repetidas de omisión.

## Entrega y salida

| Modo       | Qué ocurre                                                        |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Entrega de respaldo del texto final al destino si el agente no lo envió |
| `webhook`  | POST de la carga del evento finalizado a una URL                  |
| `none`     | Sin entrega de respaldo del ejecutor                              |

Usa `--announce --channel telegram --to "-1001234567890"` para entrega en canales. Para temas de foro de Telegram, usa `-1001234567890:topic:123`; los llamadores directos de RPC/config también pueden pasar `delivery.threadId` como cadena o número. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los ID de sala de Matrix distinguen mayúsculas y minúsculas; usa el ID de sala exacto o la forma `room:!room:server` de Matrix.

Para trabajos aislados, la entrega por chat se comparte. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de reserva. De lo contrario, `announce`, `webhook` y `none` solo controlan lo que el ejecutor hace con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw almacena el destino de entrega en vivo preservado para la ruta de anuncio de reserva. Las claves de sesión internas pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando el contexto de chat actual está disponible.

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo sobrescribe por trabajo.
- Si ninguno está definido y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo se admite en trabajos `sessionTarget="isolated"` a menos que el modo de entrega principal sea `webhook`.
- `failureAlert.includeSkipped: true` hace que un trabajo o una política global de alertas de cron incluya alertas repetidas de ejecuciones omitidas. Las ejecuciones omitidas mantienen un contador consecutivo de omisiones separado, por lo que no afectan al retroceso de errores de ejecución.

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

Gateway puede exponer endpoints de Webhook HTTP para disparadores externos. Habilítalo en la configuración:

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

Cada solicitud debe incluir el token del hook mediante una cabecera:

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
    Los nombres de hook personalizados se resuelven mediante `hooks.mappings` en la configuración. Las asignaciones pueden transformar cargas arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación del Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Define `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` a menos que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, define también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas de hook se envuelven con límites de seguridad de forma predeterminada.

</Warning>

## Integración de Gmail PubSub

Conecta disparadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preset de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está definido, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la observación. Define `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.

### Configuración manual de una sola vez

<Steps>
  <Step title="Select the GCP project">
    Selecciona el proyecto de GCP que posee el cliente OAuth usado por `gog`:

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
Nota sobre sobrescritura del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución del agente aislado.
- Si no está permitido o no se puede resolver, cron falla la ejecución con un error de validación explícito.
- Las cadenas de reserva configuradas siguen aplicándose porque `--model` de cron es un primario del trabajo, no una sobrescritura de `/model` de la sesión.
- La carga `fallbacks` reemplaza las reservas configuradas para ese trabajo; `fallbacks: []` deshabilita la reserva y hace que la ejecución sea estricta.
- Un `--model` simple sin una lista de reservas explícita o configurada no recurre al primario del agente como destino extra de reintento silencioso.

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

`maxConcurrentRuns` limita tanto el despacho programado de cron como la ejecución de turnos de agente aislados. Los turnos de agente de cron aislados usan internamente el carril de ejecución dedicado `cron-nested` de la cola, por lo que aumentar este valor permite que ejecuciones LLM de cron independientes avancen en paralelo en lugar de iniciar solo sus envoltorios externos de cron. Este ajuste no amplía el carril `nested` compartido que no es de cron.

El sidecar de estado en tiempo de ejecución se deriva de `cron.store`: un almacén `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén sin sufijo `.json` agrega `-state.json`.

Si editas manualmente `jobs.json`, deja `jobs-state.json` fuera del control de versiones. OpenClaw usa ese sidecar para ranuras pendientes, marcadores activos, metadatos de la última ejecución y la identidad de programación que indica al programador cuándo un trabajo editado externamente necesita un `nextRunAtMs` nuevo.

Deshabilitar cron: `cron.enabled: false` u `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Reintento de una sola ejecución**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se deshabilitan de inmediato.

    **Reintento recurrente**: retroceso exponencial (30 s a 60 min) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (valor predeterminado `24h`) poda entradas de sesión de ejecución aislada. `cron.runLog.maxBytes` / `cron.runLog.keepLines` podan automáticamente los archivos de registro de ejecución.
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
    - Confirma que el Gateway se esté ejecutando de forma continua.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - El modo de entrega `none` significa que no se espera ningún envío de reserva del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Un destino de entrega ausente/no válido (`channel`/`to`) significa que se omitió el envío saliente.
    - Para Matrix, los trabajos copiados o heredados con ID de sala `delivery.to` en minúsculas pueden fallar porque los ID de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo al valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que las credenciales bloquearon la entrega.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen encolada de reserva, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar mensajes al usuario por sí mismo, comprueba que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

  </Accordion>
  <Accordion title="Cron o Heartbeat parece impedir la renovación /new-style">
    - La actualización diaria y por inactividad no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de Cron, las ejecuciones de Heartbeat, las notificaciones de ejecución y el mantenimiento del Gateway pueden actualizar la fila de sesión para enrutamiento/estado, pero no amplían `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que esos campos existieran, OpenClaw puede recuperar `sessionStartedAt` desde el encabezado de sesión del transcript JSONL cuando el archivo aún está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan esa hora de inicio recuperada como su referencia de inactividad.

  </Accordion>
  <Accordion title="Problemas comunes de zona horaria">
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
