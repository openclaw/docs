---
read_when:
    - Programación de trabajos en segundo plano o activaciones despertadoras
    - Conexión de desencadenadores externos (Webhooks, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para las tareas programadas
summary: Trabajos programados, Webhooks y desencadenadores de PubSub de Gmail para el programador de Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-04-21T05:12:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e25f4dc8ee7b8f88e22d5cbc86e4527a9f5ac0ab4921e7874f76b186054682a3
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tareas programadas (Cron)

Cron es el programador integrado de Gateway. Persiste los trabajos, despierta al agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

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

# See run history
openclaw cron runs --id <job-id>
```

## Cómo funciona cron

- Cron se ejecuta **dentro** del proceso de Gateway (no dentro del modelo).
- Las definiciones de trabajos persisten en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no pierden los horarios.
- El estado de ejecución en tiempo de ejecución persiste junto a él en `~/.openclaw/cron/jobs-state.json`. Si registras definiciones de cron en git, registra `jobs.json` y aplica gitignore a `jobs-state.json`.
- Después de la división, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero pueden tratar los trabajos como nuevos porque los campos de ejecución ahora viven en `jobs-state.json`.
- Todas las ejecuciones de cron crean registros de [tareas en segundo plano](/es/automation/tasks).
- Los trabajos de una sola ejecución (`--at`) se eliminan automáticamente después del éxito de forma predeterminada.
- Las ejecuciones aisladas de cron cierran con el mejor esfuerzo las pestañas/procesos del navegador rastreados para su sesión `cron:<jobId>` cuando la ejecución termina, para que la automatización desacoplada del navegador no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de acuse de recibo obsoletas. Si el primer resultado es solo una actualización de estado provisional (`on it`, `pulling everything together` y pistas similares) y ninguna ejecución descendiente de subagente sigue siendo responsable de la respuesta final, OpenClaw vuelve a solicitar una vez el resultado real antes de la entrega.

<a id="maintenance"></a>

La conciliación de tareas para cron es propiedad del tiempo de ejecución: una tarea de cron activa sigue viva mientras el tiempo de ejecución de cron siga rastreando ese trabajo como en ejecución, incluso si todavía existe una fila antigua de sesión hija.
Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira la ventana de gracia de 5 minutos, el mantenimiento puede marcar la tarea como `lost`.

## Tipos de programación

| Tipo    | Opción de CLI | Descripción                                                |
| ------- | ------------- | ---------------------------------------------------------- |
| `at`    | `--at`        | Marca de tiempo de una sola ejecución (ISO 8601 o relativa como `20m`) |
| `every` | `--every`     | Intervalo fijo                                             |
| `cron`  | `--cron`      | Expresión cron de 5 o 6 campos con `--tz` opcional         |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para una programación local según la hora de pared.

Las expresiones recurrentes al inicio de cada hora se escalonan automáticamente hasta 5 minutos para reducir picos de carga. Usa `--exact` para forzar tiempos precisos o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron se analizan con [croner](https://github.com/Hexagon/croner). Cuando tanto los campos de día del mes como de día de la semana no son comodines, croner coincide cuando **cualquiera** de los campos coincide, no ambos. Este es el comportamiento estándar de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Esto se ejecuta ~5–6 veces por mes en lugar de 0–1 veces por mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para requerir ambas condiciones, usa el modificador de día de la semana `+` de Croner (`0 9 15 * +1`) o programa con un campo y valida el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | Valor de `--session` | Se ejecuta en             | Mejor para                      |
| --------------- | -------------------- | ------------------------- | ------------------------------- |
| Sesión principal | `main`              | Siguiente turno de Heartbeat | Recordatorios, eventos del sistema |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado   | Informes, tareas en segundo plano |
| Sesión actual   | `current`            | Vinculada al momento de creación | Trabajo recurrente con reconocimiento de contexto |
| Sesión personalizada | `session:custom-id` | Sesión nombrada persistente | Flujos de trabajo que se basan en el historial |

Los trabajos de **sesión principal** encolan un evento del sistema y opcionalmente despiertan Heartbeat (`--wake now` o `--wake next-heartbeat`). Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) persisten el contexto entre ejecuciones, lo que habilita flujos de trabajo como reuniones diarias que se basan en resúmenes previos.

Para los trabajos aislados, el desmontaje en tiempo de ejecución ahora incluye limpieza del navegador con el mejor esfuerzo para esa sesión de cron. Los errores de limpieza se ignoran para que el resultado real de cron siga prevaleciendo.

Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prefiere la salida final descendiente sobre el texto provisional obsoleto del padre. Si los descendientes siguen en ejecución, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

### Opciones de carga útil para trabajos aislados

- `--message`: texto del prompt (obligatorio para aislado)
- `--model` / `--thinking`: sobrescrituras del modelo y del nivel de razonamiento
- `--light-context`: omitir la inyección del archivo bootstrap del espacio de trabajo
- `--tools exec,read`: restringir qué herramientas puede usar el trabajo

`--model` usa el modelo permitido seleccionado para ese trabajo. Si el modelo solicitado no está permitido, cron registra una advertencia y vuelve a la selección del modelo predeterminado/del agente del trabajo. Las cadenas de respaldo configuradas siguen aplicándose, pero una sobrescritura simple de modelo sin una lista explícita de respaldo por trabajo ya no agrega el primario del agente como un objetivo extra de reintento oculto.

La precedencia de selección de modelo para trabajos aislados es:

1. Sobrescritura de modelo del hook de Gmail (cuando la ejecución vino de Gmail y esa sobrescritura está permitida)
2. `model` de la carga útil por trabajo
3. Sobrescritura de modelo de la sesión de cron almacenada
4. Selección del modelo predeterminado/del agente

El modo rápido también sigue la selección activa resuelta. Si la configuración del modelo seleccionado tiene `params.fastMode`, el cron aislado lo usa de forma predeterminada. Una sobrescritura almacenada de `fastMode` de la sesión sigue prevaleciendo sobre la configuración en cualquier dirección.

Si una ejecución aislada encuentra una transferencia en vivo de cambio de modelo, cron vuelve a intentarlo con el proveedor/modelo cambiado y persiste esa selección activa antes del reintento. Cuando el cambio también incluye un nuevo perfil de autenticación, cron persiste también esa sobrescritura del perfil de autenticación. Los reintentos están acotados: después del intento inicial más 2 reintentos de cambio, cron aborta en lugar de entrar en un bucle infinito.

## Entrega y salida

| Modo       | Qué sucede                                              |
| ---------- | ------------------------------------------------------- |
| `announce` | Entrega un resumen al canal de destino (predeterminado para aislado) |
| `webhook`  | Hace POST de la carga útil del evento terminado a una URL |
| `none`     | Solo interno, sin entrega                               |

Usa `--announce --channel telegram --to "-1001234567890"` para entrega al canal. Para temas de foros de Telegram, usa `-1001234567890:topic:123`. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`).

Para trabajos aislados propiedad de cron, el ejecutor es propietario de la ruta de entrega final. Se le solicita al agente que devuelva un resumen en texto plano, y luego ese resumen se envía mediante `announce`, `webhook`, o se mantiene interno para `none`. `--no-deliver` no devuelve la entrega al agente; mantiene la ejecución interna.

Si la tarea original dice explícitamente que se debe enviar un mensaje a algún destinatario externo, el agente debe indicar quién/dónde debe ir ese mensaje en su salida en lugar de intentar enviarlo directamente.

Las notificaciones de error siguen una ruta de destino separada:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de error.
- `job.delivery.failureDestination` lo sobrescribe por trabajo.
- Si ninguno está establecido y el trabajo ya entrega mediante `announce`, las notificaciones de error ahora recurren a ese destino principal de anuncio.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` a menos que el modo principal de entrega sea `webhook`.

## Ejemplos de CLI

Recordatorio de una sola ejecución (sesión principal):

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

Trabajo aislado con sobrescritura de modelo y razonamiento:

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

Los tokens en la cadena de consulta se rechazan.

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

Ejecuta un turno de agente aislado:

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

- Mantén los endpoints de hook detrás de loopback, tailnet o un proxy inverso de confianza.
- Usa un token de hook dedicado; no reutilices tokens de autenticación de gateway.
- Mantén `hooks.path` en una subruta dedicada; `/` se rechaza.
- Establece `hooks.allowedAgentIds` para limitar el enrutamiento explícito de `agentId`.
- Mantén `hooks.allowRequestSessionKey=false` a menos que necesites sesiones seleccionadas por el llamador.
- Si habilitas `hooks.allowRequestSessionKey`, también establece `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de hook se encapsulan con límites de seguridad de forma predeterminada.

## Integración de Gmail PubSub

Conecta los desencadenadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

**Requisitos previos**: CLI de `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preset de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático de Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está establecido, Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la vigilancia. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para excluirte.

### Configuración manual única

1. Selecciona el proyecto de GCP que es propietario del cliente OAuth usado por `gog`:

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

### Sobrescritura de modelo de Gmail

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

## Administración de trabajos

```bash
# List all jobs
openclaw cron list

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

Nota sobre la sobrescritura del modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución aislada del agente.
- Si no está permitido, cron muestra una advertencia y vuelve a la selección del modelo predeterminado/del agente del trabajo.
- Las cadenas de respaldo configuradas siguen aplicándose, pero una sobrescritura simple con `--model` sin una lista explícita de respaldo por trabajo ya no recurre al primario del agente como un objetivo extra de reintento silencioso.

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

El sidecar de estado en tiempo de ejecución se deriva de `cron.store`: un almacén `.json` como `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén sin sufijo `.json` añade `-state.json`.

Desactiva cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

**Reintento de una sola ejecución**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) se reintentan hasta 3 veces con retroceso exponencial. Los errores permanentes se desactivan de inmediato.

**Reintento recurrente**: retroceso exponencial (de 30 s a 60 m) entre reintentos. El retroceso se restablece después de la siguiente ejecución exitosa.

**Mantenimiento**: `cron.sessionRetention` (predeterminado `24h`) elimina entradas de sesión de ejecución aislada. `cron.runLog.maxBytes` / `cron.runLog.keepLines` eliminan automáticamente archivos de registro de ejecución.

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

### Cron no se ejecuta

- Comprueba `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
- Confirma que Gateway se está ejecutando de forma continua.
- Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
- `reason: not-due` en la salida de ejecución significa que la ejecución manual se comprobó con `openclaw cron run <jobId> --due` y que el trabajo aún no vencía.

### Cron se ejecutó pero no hubo entrega

- El modo de entrega `none` significa que no se espera ningún mensaje externo.
- Un destino de entrega faltante/no válido (`channel`/`to`) significa que se omitió la salida.
- Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
- Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`), OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
- Para trabajos aislados propiedad de cron, no esperes que el agente use la herramienta de mensajes como respaldo. El ejecutor es propietario de la entrega final; `--no-deliver` la mantiene interna en lugar de permitir un envío directo.

### Errores comunes de zona horaria

- Cron sin `--tz` usa la zona horaria del host de gateway.
- Las programaciones `at` sin zona horaria se tratan como UTC.
- `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de la zona horaria
