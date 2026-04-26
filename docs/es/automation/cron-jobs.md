---
read_when:
    - Programar trabajos en segundo plano o activaciones
    - Conectar desencadenadores externos (Webhooks, Gmail) con OpenClaw
    - Decidir entre Heartbeat y Cron para las tareas programadas
sidebarTitle: Scheduled tasks
summary: Trabajos programados, Webhooks y desencadenadores de Gmail PubSub para el programador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-04-26T11:23:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron es el programador integrado del Gateway. Conserva los trabajos, activa el agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

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

- Cron se ejecuta **dentro del proceso Gateway** (no dentro del modelo).
- Las definiciones de trabajos se conservan en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no hacen perder las programaciones.
- El estado de ejecución en tiempo de ejecución se conserva junto a él en `~/.openclaw/cron/jobs-state.json`. Si haces seguimiento de definiciones de cron en git, registra `jobs.json` y agrega `jobs-state.json` a gitignore.
- Después de la división, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero podrían tratar los trabajos como nuevos porque los campos de tiempo de ejecución ahora viven en `jobs-state.json`.
- Todas las ejecuciones de cron crean registros de [tareas en segundo plano](/es/automation/tasks).
- Los trabajos de una sola vez (`--at`) se eliminan automáticamente tras un éxito de forma predeterminada.
- Las ejecuciones aisladas de cron cierran, en la medida de lo posible, las pestañas/procesos del navegador rastreados para su sesión `cron:<jobId>` cuando la ejecución termina, para que la automatización desacoplada del navegador no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de confirmación obsoletas. Si el primer resultado es solo una actualización provisional de estado (`on it`, `pulling everything together` y sugerencias similares) y ninguna ejecución descendiente de subagente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de entregarlo.

<a id="maintenance"></a>

<Note>
La reconciliación de tareas para cron es primero propiedad del tiempo de ejecución y en segundo lugar está respaldada por historial duradero: una tarea cron activa sigue viva mientras el tiempo de ejecución de cron todavía rastree ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión hija. Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira el período de gracia de 5 minutos, las comprobaciones de mantenimiento inspeccionan los registros de ejecución conservados y el estado del trabajo para la ejecución coincidente `cron:<jobId>:<startedAt>`. Si ese historial duradero muestra un resultado terminal, el registro de tareas se finaliza a partir de él; de lo contrario, el mantenimiento propiedad de Gateway puede marcar la tarea como `lost`. La auditoría offline de CLI puede recuperarse a partir del historial duradero, pero no trata su propio conjunto vacío en proceso de trabajos activos como prueba de que una ejecución cron propiedad de Gateway haya desaparecido.
</Note>

## Tipos de programación

| Tipo    | Opción de CLI | Descripción                                                   |
| ------- | ------------- | ------------------------------------------------------------- |
| `at`    | `--at`        | Marca de tiempo de una sola vez (ISO 8601 o relativa como `20m`) |
| `every` | `--every`     | Intervalo fijo                                                |
| `cron`  | `--cron`      | Expresión cron de 5 o 6 campos con `--tz` opcional           |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para programar según la hora local.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se activa ~5–6 veces por mes en lugar de 0–1 veces por mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador `+` de día de la semana de Croner (`0 9 15 * +1`) o programa con un campo y valida el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | valor de `--session` | Se ejecuta en            | Ideal para                     |
| --------------- | -------------------- | ------------------------ | ------------------------------ |
| Sesión principal | `main`              | Siguiente turno de Heartbeat | Recordatorios, eventos del sistema |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado  | Informes, tareas en segundo plano |
| Sesión actual   | `current`            | Vinculada al momento de la creación | Trabajo recurrente con reconocimiento de contexto |
| Sesión personalizada | `session:custom-id` | Sesión nombrada persistente | Flujos de trabajo que se basan en el historial |

<AccordionGroup>
  <Accordion title="Sesión principal vs aislada vs personalizada">
    Los trabajos de **sesión principal** encolan un evento del sistema y opcionalmente activan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Esos eventos del sistema no amplían la frescura del restablecimiento diario/inactivo de la sesión de destino. Los trabajos **aislados** ejecutan un turno dedicado del agente con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones de seguimiento diarias que se basan en resúmenes anteriores.
  </Accordion>
  <Accordion title="Qué significa 'sesión nueva' para trabajos aislados">
    Para los trabajos aislados, "sesión nueva" significa un nuevo id de transcripción/sesión para cada ejecución. OpenClaw puede conservar preferencias seguras como ajustes de thinking/fast/verbose, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario, pero no hereda el contexto ambiental de conversación de una fila cron anterior: enrutamiento de canal/grupo, política de envío o cola, elevación, origen o vinculación en tiempo de ejecución de ACP. Usa `current` o `session:<id>` cuando un trabajo recurrente deba basarse deliberadamente en el mismo contexto de conversación.
  </Accordion>
  <Accordion title="Limpieza en tiempo de ejecución">
    Para los trabajos aislados, el desmontaje en tiempo de ejecución ahora incluye la limpieza del navegador para esa sesión cron en la medida de lo posible. Los fallos de limpieza se ignoran para que siga prevaleciendo el resultado real de cron.

    Las ejecuciones aisladas de cron también eliminan cualquier instancia de tiempo de ejecución MCP empaquetada creada para el trabajo mediante la ruta compartida de limpieza en tiempo de ejecución. Esto coincide con cómo se desmontan los clientes MCP de sesión principal y sesión personalizada, por lo que los trabajos cron aislados no filtran procesos hijo stdio ni conexiones MCP de larga duración entre ejecuciones.

  </Accordion>
  <Accordion title="Entrega de subagente y Discord">
    Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prefiere la salida final descendiente frente al texto provisional obsoleto del padre. Si los descendientes aún se están ejecutando, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

    Para objetivos de anuncio de Discord solo de texto, OpenClaw envía el texto final canónico del asistente una sola vez en lugar de reproducir tanto las cargas de texto transmitidas/intermedias como la respuesta final. Las cargas de Discord de medios y estructuradas siguen entregándose como cargas separadas para que no se pierdan adjuntos ni componentes.

  </Accordion>
</AccordionGroup>

### Opciones de carga útil para trabajos aislados

<ParamField path="--message" type="string" required>
  Texto del prompt (obligatorio para aislado).
</ParamField>
<ParamField path="--model" type="string">
  Anulación de modelo; usa el modelo permitido seleccionado para el trabajo.
</ParamField>
<ParamField path="--thinking" type="string">
  Anulación del nivel de thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Omite la inyección del archivo de arranque del espacio de trabajo.
</ParamField>
<ParamField path="--tools" type="string">
  Restringe qué herramientas puede usar el trabajo, por ejemplo `--tools exec,read`.
</ParamField>

`--model` usa el modelo permitido seleccionado para ese trabajo. Si el modelo solicitado no está permitido, cron registra una advertencia y en su lugar vuelve a la selección de modelo predeterminada/del agente del trabajo. Las cadenas de respaldo configuradas siguen aplicándose, pero una simple anulación de modelo sin una lista explícita de respaldo por trabajo ya no agrega el principal del agente como destino adicional oculto de reintento.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del gancho de Gmail (cuando la ejecución provino de Gmail y esa anulación está permitida)
2. `model` de la carga útil por trabajo
3. Anulación de modelo de sesión cron almacenada seleccionada por el usuario
4. Selección de modelo predeterminada/del agente

El modo rápido también sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, el cron aislado usa eso de forma predeterminada. Una anulación almacenada de `fastMode` en la sesión sigue teniendo prioridad sobre la configuración en ambas direcciones.

Si una ejecución aislada encuentra una transferencia en vivo de cambio de modelo, cron vuelve a intentar con el proveedor/modelo cambiado y conserva esa selección activa para la ejecución activa antes de reintentar. Cuando el cambio también trae un nuevo perfil de autenticación, cron conserva también esa anulación del perfil de autenticación para la ejecución activa. Los reintentos son limitados: después del intento inicial más 2 reintentos por cambio, cron aborta en lugar de entrar en un bucle infinito.

## Entrega y salida

| Modo      | Qué sucede                                                         |
| --------- | ------------------------------------------------------------------ |
| `announce` | Entrega el texto final al destino como respaldo si el agente no lo envió |
| `webhook` | Hace POST de la carga del evento terminado a una URL              |
| `none`    | Sin entrega de respaldo del ejecutor                              |

Usa `--announce --channel telegram --to "-1001234567890"` para entrega a canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`). Los id de sala de Matrix distinguen mayúsculas y minúsculas; usa el id exacto de la sala o el formato `room:!room:server` de Matrix.

Para trabajos aislados, la entrega de chat es compartida. Si hay una ruta de chat disponible, el agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el agente envía al destino configurado/actual, OpenClaw omite el anuncio de respaldo. En caso contrario, `announce`, `webhook` y `none` solo controlan lo que el ejecutor hace con la respuesta final después del turno del agente.

Cuando un agente crea un recordatorio aislado desde un chat activo, OpenClaw conserva el destino de entrega activo preservado para la ruta de anuncio de respaldo. Las claves internas de sesión pueden estar en minúsculas; los destinos de entrega del proveedor no se reconstruyen a partir de esas claves cuando el contexto actual del chat está disponible.

Las notificaciones de fallo siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para notificaciones de fallo.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si no se establece ninguno y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora vuelven a ese destino principal de anuncio.
- `delivery.failureDestination` solo es compatible en trabajos `sessionTarget="isolated"`, a menos que el modo principal de entrega sea `webhook`.

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
  <Tab title="Anulación de modelo y thinking">
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

Gateway puede exponer endpoints HTTP de Webhook para desencadenadores externos. Actívalo en la configuración:

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

Cada solicitud debe incluir el token del gancho mediante un encabezado:

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
    Ejecuta un turno aislado del agente:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campos: `message` (obligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hooks mapeados (POST /hooks/<name>)">
    Los nombres de hooks personalizados se resuelven mediante `hooks.mappings` en la configuración. Los mapeos pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.
  </Accordion>
</AccordionGroup>

<Warning>
Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.

- Usa un token de hook dedicado; no reutilices tokens de autenticación de Gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` a menos que necesites sesiones seleccionadas por la persona que llama.
- Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de clave de sesión.
- Las cargas útiles de hook se envuelven con límites de seguridad de forma predeterminada.
  </Warning>

## Integración de Gmail PubSub

Conecta desencadenadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

<Note>
**Requisitos previos:** CLI de `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.
</Note>

### Configuración con asistente (recomendado)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático de Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está configurado, Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para excluirte.

### Configuración manual única

<Steps>
  <Step title="Seleccionar el proyecto de GCP">
    Selecciona el proyecto de GCP que posee el cliente OAuth usado por `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crear el tema y conceder acceso push de Gmail">
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

### Anulación de modelo de Gmail

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
- Si no está permitido, cron emite una advertencia y vuelve a la selección de modelo predeterminada/del agente del trabajo.
- Las cadenas de respaldo configuradas siguen aplicándose, pero una anulación simple de `--model` sin una lista explícita de respaldo por trabajo ya no pasa al principal del agente como un destino adicional silencioso de reintento.
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

El sidecar de estado en tiempo de ejecución se deriva de `cron.store`: un almacén `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén sin el sufijo `.json` agrega `-state.json`.

Deshabilita cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamiento de reintento">
    **Reintento de una sola vez**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) reintentan hasta 3 veces con backoff exponencial. Los errores permanentes se deshabilitan inmediatamente.

    **Reintento recurrente**: backoff exponencial (de 30s a 60m) entre reintentos. El backoff se restablece después de la siguiente ejecución correcta.

  </Accordion>
  <Accordion title="Mantenimiento">
    `cron.sessionRetention` (predeterminado `24h`) poda las entradas de sesión de ejecuciones aisladas. `cron.runLog.maxBytes` / `cron.runLog.keepLines` podan automáticamente los archivos de registro de ejecución.
  </Accordion>
</AccordionGroup>

## Solución de problemas

### Secuencia de comandos

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
  <Accordion title="Cron no se activa">
    - Verifica `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
    - Confirma que Gateway se esté ejecutando continuamente.
    - Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
    - `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo todavía no vencía.
  </Accordion>
  <Accordion title="Cron se activó pero no hubo entrega">
    - El modo de entrega `none` significa que no se espera ningún envío de respaldo del ejecutor. El agente aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
    - Un destino de entrega faltante/no válido (`channel`/`to`) significa que se omitió la salida.
    - En Matrix, los trabajos copiados o heredados con id de sala `delivery.to` en minúsculas pueden fallar porque los id de sala de Matrix distinguen mayúsculas y minúsculas. Edita el trabajo con el valor exacto `!room:server` o `room:!room:server` de Matrix.
    - Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por credenciales.
    - Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
    - Si el agente debe enviar un mensaje a la persona usuaria por sí mismo, verifica que el trabajo tenga una ruta utilizable (`channel: "last"` con un chat previo, o un canal/destino explícito).
  </Accordion>
  <Accordion title="Cron o Heartbeat parecen impedir el cambio al estilo /new">
    - La frescura del restablecimiento diario y por inactividad no se basa en `updatedAt`; consulta [Gestión de sesiones](/es/concepts/session#session-lifecycle).
    - Las activaciones de cron, las ejecuciones de Heartbeat, las notificaciones de exec y la administración interna de gateway pueden actualizar la fila de sesión para el enrutamiento/estado, pero no amplían `sessionStartedAt` ni `lastInteractionAt`.
    - Para filas heredadas creadas antes de que existieran esos campos, OpenClaw puede recuperar `sessionStartedAt` del encabezado de sesión JSONL de la transcripción cuando el archivo todavía está disponible. Las filas heredadas inactivas sin `lastInteractionAt` usan ese tiempo de inicio recuperado como base de inactividad.
  </Accordion>
  <Accordion title="Detalles de zona horaria">
    - Cron sin `--tz` usa la zona horaria del host del gateway.
    - Las programaciones `at` sin zona horaria se tratan como UTC.
    - `activeHours` de Heartbeat usa la resolución de zona horaria configurada.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
