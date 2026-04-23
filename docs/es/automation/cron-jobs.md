---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conexión de desencadenadores externos (Webhooks, Gmail) en OpenClaw
    - Decidir entre Heartbeat y Cron para tareas programadas
summary: Trabajos programados, Webhooks y desencadenadores de Gmail PubSub para el programador del Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-04-23T13:57:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tareas programadas (Cron)

Cron es el programador integrado del Gateway. Conserva los trabajos, activa el agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

## Inicio rápido

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso del Gateway** (no dentro del modelo).
- Las definiciones de trabajos se conservan en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no hacen que se pierdan las programaciones.
- El estado de ejecución en tiempo de ejecución se conserva junto a él en `~/.openclaw/cron/jobs-state.json`. Si rastreas definiciones de cron en git, rastrea `jobs.json` y añade `jobs-state.json` a gitignore.
- Después de la división, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero pueden tratar los trabajos como nuevos porque los campos de tiempo de ejecución ahora viven en `jobs-state.json`.
- Todas las ejecuciones de cron crean registros de [tarea en segundo plano](/es/automation/tasks).
- Los trabajos de una sola vez (`--at`) se eliminan automáticamente después de ejecutarse con éxito de forma predeterminada.
- Las ejecuciones aisladas de cron cierran, en la medida de lo posible, las pestañas/procesos del navegador rastreados para su sesión `cron:<jobId>` cuando finaliza la ejecución, para que la automatización desacoplada del navegador no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de confirmación obsoletas. Si el
  primer resultado es solo una actualización provisional de estado (`on it`, `pulling everything
together` y pistas similares) y ninguna ejecución descendiente de subagente sigue siendo
  responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el
  resultado real antes de la entrega.

<a id="maintenance"></a>

La reconciliación de tareas para cron es propiedad del entorno de ejecución: una tarea cron activa sigue viva mientras el
entorno de ejecución de cron todavía rastree ese trabajo como en ejecución, incluso si aún existe una fila antigua de sesión hija.
Una vez que el entorno de ejecución deja de ser propietario del trabajo y expira el período de gracia de 5 minutos, el mantenimiento puede
marcar la tarea como `lost`.

## Tipos de programación

| Tipo    | Opción CLI | Descripción                                               |
| ------- | ---------- | --------------------------------------------------------- |
| `at`    | `--at`     | Marca de tiempo de una sola vez (ISO 8601 o relativa como `20m`) |
| `every` | `--every`  | Intervalo fijo                                            |
| `cron`  | `--cron`   | Expresión cron de 5 o 6 campos con `--tz` opcional        |

Las marcas de tiempo sin zona horaria se tratan como UTC. Añade `--tz America/New_York` para programación local según la hora de pared.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar una sincronización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando tanto los campos de día del mes como de día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no cuando ambos coinciden. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se activa unas 5–6 veces al mes en lugar de 0–1 veces al mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para requerir ambas condiciones, usa el modificador `+` de día de la semana de Croner (`0 9 15 * +1`) o programa en un campo y controla el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en             | Ideal para                    |
| --------------- | -------------------- | ------------------------- | ----------------------------- |
| Sesión principal | `main`              | Siguiente turno de Heartbeat | Recordatorios, eventos del sistema |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado   | Informes, tareas en segundo plano |
| Sesión actual   | `current`            | Vinculada al momento de creación | Trabajo recurrente con reconocimiento de contexto |
| Sesión personalizada | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

Los trabajos de **sesión principal** encolan un evento del sistema y opcionalmente activan el Heartbeat (`--wake now` o `--wake next-heartbeat`). Los trabajos **aislados** ejecutan un turno dedicado del agente con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como reuniones diarias de seguimiento que se basan en resúmenes anteriores.

Para los trabajos aislados, el desmontaje en tiempo de ejecución ahora incluye, en la medida de lo posible, la limpieza del navegador para esa sesión de cron. Los errores de limpieza se ignoran para que siga prevaleciendo el resultado real de cron.

Las ejecuciones aisladas de cron también eliminan cualquier instancia agrupada de entorno de ejecución MCP creada para el trabajo a través de la ruta compartida de limpieza del entorno de ejecución. Esto coincide con la forma en que se desmontan los clientes MCP de sesión principal y de sesión personalizada, por lo que los trabajos aislados de cron no filtran procesos hijo stdio ni conexiones MCP de larga duración entre ejecuciones.

Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prioriza la
salida final descendiente sobre el texto provisional obsoleto del padre. Si los descendientes siguen
ejecutándose, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

### Opciones de carga útil para trabajos aislados

- `--message`: texto del prompt (obligatorio para aislado)
- `--model` / `--thinking`: anulaciones del modelo y del nivel de razonamiento
- `--light-context`: omite la inyección del archivo de arranque del espacio de trabajo
- `--tools exec,read`: restringe qué herramientas puede usar el trabajo

`--model` usa el modelo permitido seleccionado para ese trabajo. Si el modelo solicitado
no está permitido, cron registra una advertencia y recurre a la selección de modelo
predeterminada/del agente para ese trabajo. Las cadenas de reserva configuradas siguen aplicándose, pero una simple
anulación del modelo sin una lista explícita de reserva por trabajo ya no añade el modelo principal del
agente como un objetivo oculto adicional de reintento.

La precedencia de selección de modelo para trabajos aislados es:

1. Anulación de modelo del hook de Gmail (cuando la ejecución proviene de Gmail y esa anulación está permitida)
2. `model` de la carga útil por trabajo
3. Anulación de modelo de sesión cron almacenada
4. Selección de modelo predeterminada/del agente

El modo rápido también sigue la selección activa resuelta. Si la configuración del modelo
seleccionado tiene `params.fastMode`, cron aislado usa eso de forma predeterminada. Una anulación almacenada de
`fastMode` de la sesión sigue teniendo prioridad sobre la configuración en cualquier dirección.

Si una ejecución aislada encuentra una transferencia por cambio de modelo en vivo, cron reintenta con el
proveedor/modelo cambiado y conserva esa selección en vivo antes de reintentar. Cuando
el cambio también incluye un nuevo perfil de autenticación, cron también conserva esa anulación del perfil de autenticación.
Los reintentos son limitados: después del intento inicial más 2 reintentos por cambio,
cron aborta en lugar de entrar en un bucle infinito.

## Entrega y salida

| Modo       | Qué sucede                                                          |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega de respaldo del texto final al destino si el agente no lo envió |
| `webhook`  | Hace POST de la carga útil del evento finalizado a una URL          |
| `none`     | Sin entrega de respaldo del ejecutor                                |

Usa `--announce --channel telegram --to "-1001234567890"` para la entrega al canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`).

Para los trabajos aislados, la entrega de chat es compartida. Si hay una ruta de chat disponible, el
agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el
agente envía al destino configurado/actual, OpenClaw omite el anuncio de respaldo.
En caso contrario, `announce`, `webhook` y `none` solo controlan lo que hace el
ejecutor con la respuesta final después del turno del agente.

Las notificaciones de fallo siguen una ruta de destino separada:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo anula por trabajo.
- Si ninguno está configurado y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` a menos que el modo de entrega principal sea `webhook`.

## Ejemplos de CLI

Recordatorio de una sola vez (sesión principal):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Trabajo aislado recurrente con entrega:

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

Trabajo aislado con anulación de modelo y razonamiento:

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

## Webhooks

Gateway puede exponer endpoints HTTP de Webhook para desencadenadores externos. Habilítalo en la configuración:

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

Se rechazan los tokens en la cadena de consulta.

### POST /hooks/wake

Encola un evento del sistema para la sesión principal:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obligatorio): descripción del evento
- `mode` (opcional): `now` (predeterminado) o `next-heartbeat`

### POST /hooks/agent

Ejecuta un turno aislado del agente:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Campos: `message` (obligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hooks mapeados (POST /hooks/\<name\>)

Los nombres de hook personalizados se resuelven mediante `hooks.mappings` en la configuración. Los mapeos pueden transformar cargas útiles arbitrarias en acciones `wake` o `agent` con plantillas o transformaciones de código.

### Seguridad

- Mantén los endpoints de hook detrás de loopback, una tailnet o un proxy inverso de confianza.
- Usa un token de hook dedicado; no reutilices tokens de autenticación del gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` a menos que necesites sesiones seleccionadas por el solicitante.
- Si habilitas `hooks.allowRequestSessionKey`, también establece `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de la clave de sesión.
- Las cargas útiles de hook se envuelven con límites de seguridad de forma predeterminada.

## Integración de Gmail PubSub

Conecta los desencadenadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

**Requisitos previos**: CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el ajuste preestablecido de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático del Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está establecido, el Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para no participar.

### Configuración manual única

1. Selecciona el proyecto de GCP que posee el cliente OAuth usado por `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Crea el tema y concede a Gmail acceso push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Inicia la vigilancia:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

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

Nota sobre la anulación de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución
  aislada del agente.
- Si no está permitido, cron muestra una advertencia y vuelve a la selección de
  modelo predeterminada/del agente del trabajo.
- Las cadenas de reserva configuradas siguen aplicándose, pero una simple anulación
  `--model` sin una lista explícita de reserva por trabajo ya no recurre al modelo
  principal del agente como un objetivo silencioso adicional de reintento.

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

El sidecar de estado de tiempo de ejecución se deriva de `cron.store`: un almacén `.json` como
`~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén
sin sufijo `.json` añade `-state.json`.

Desactiva cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

**Reintento de una sola vez**: los errores transitorios (límite de frecuencia, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se desactivan inmediatamente.

**Reintento recurrente**: retroceso exponencial (de 30s a 60m) entre reintentos. El retroceso se restablece después de la siguiente ejecución correcta.

**Mantenimiento**: `cron.sessionRetention` (predeterminado `24h`) depura las entradas de sesión de ejecución aislada. `cron.runLog.maxBytes` / `cron.runLog.keepLines` depuran automáticamente los archivos de registro de ejecución.

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

### Cron no se activa

- Comprueba `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
- Confirma que el Gateway se está ejecutando de forma continua.
- Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
- `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

### Cron se activó pero no hubo entrega

- El modo de entrega `none` significa que no se espera ningún envío de respaldo del ejecutor. El agente
  aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
- Un destino de entrega ausente/no válido (`channel`/`to`) significa que la salida se omitió.
- Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
- Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`),
  OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen
  en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
- Si el agente debe enviar un mensaje al usuario por sí mismo, comprueba que el trabajo tenga una
  ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

### Aspectos a tener en cuenta sobre la zona horaria

- Cron sin `--tz` usa la zona horaria del host del gateway.
- Las programaciones `at` sin zona horaria se tratan como UTC.
- `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de la zona horaria
