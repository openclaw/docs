---
read_when:
    - Programación de trabajos en segundo plano o activaciones
    - Conexión de desencadenadores externos (Webhooks, Gmail) a OpenClaw
    - Decidir entre Heartbeat y Cron para las tareas programadas
summary: Trabajos programados, Webhooks y desencadenadores de Gmail PubSub para el programador de Gateway
title: Tareas programadas
x-i18n:
    generated_at: "2026-04-21T13:35:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tareas programadas (Cron)

Cron es el programador integrado de Gateway. Conserva los trabajos, activa al agente en el momento adecuado y puede entregar la salida de vuelta a un canal de chat o a un endpoint de Webhook.

## Inicio rápido

```bash
# Agregar un recordatorio de una sola vez
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Consultar tus trabajos
openclaw cron list
openclaw cron show <job-id>

# Ver el historial de ejecuciones
openclaw cron runs --id <job-id>
```

## Cómo funciona cron

- Cron se ejecuta **dentro del proceso Gateway** (no dentro del modelo).
- Las definiciones de trabajos se conservan en `~/.openclaw/cron/jobs.json`, por lo que los reinicios no hacen que se pierdan las programaciones.
- El estado de ejecución en tiempo de ejecución se conserva junto a él en `~/.openclaw/cron/jobs-state.json`. Si llevas un seguimiento de las definiciones de cron en git, incluye `jobs.json` y agrega `jobs-state.json` a gitignore.
- Después de la separación, las versiones anteriores de OpenClaw pueden leer `jobs.json`, pero pueden tratar los trabajos como nuevos porque los campos de tiempo de ejecución ahora viven en `jobs-state.json`.
- Todas las ejecuciones de cron crean registros de [tareas en segundo plano](/es/automation/tasks).
- Los trabajos de una sola vez (`--at`) se eliminan automáticamente después de completarse con éxito de forma predeterminada.
- Las ejecuciones aisladas de cron cierran con el mejor esfuerzo las pestañas/procesos del navegador rastreados para su sesión `cron:<jobId>` cuando la ejecución finaliza, para que la automatización desacoplada del navegador no deje procesos huérfanos.
- Las ejecuciones aisladas de cron también protegen contra respuestas de confirmación obsoletas. Si el
  primer resultado es solo una actualización provisional de estado (`on it`, `pulling everything
together` y pistas similares) y ninguna ejecución descendiente de subagente sigue siendo
  responsable de la respuesta final, OpenClaw vuelve a preguntar una vez para obtener el resultado
  real antes de la entrega.

<a id="maintenance"></a>

La reconciliación de tareas para cron pertenece al tiempo de ejecución: una tarea cron activa sigue viva mientras el
tiempo de ejecución de cron todavía rastrea ese trabajo como en ejecución, incluso si aún existe una fila antigua de sesión hija.
Una vez que el tiempo de ejecución deja de ser propietario del trabajo y expira el período de gracia de 5 minutos, el mantenimiento puede
marcar la tarea como `lost`.

## Tipos de programación

| Tipo    | Opción de CLI | Descripción                                                   |
| ------- | ------------- | ------------------------------------------------------------- |
| `at`    | `--at`        | Marca de tiempo de una sola vez (ISO 8601 o relativa como `20m`) |
| `every` | `--every`     | Intervalo fijo                                                |
| `cron`  | `--cron`      | Expresión cron de 5 o 6 campos con `--tz` opcional            |

Las marcas de tiempo sin zona horaria se tratan como UTC. Agrega `--tz America/New_York` para una programación local según la hora de pared.

Las expresiones recurrentes al inicio de la hora se escalonan automáticamente hasta 5 minutos para reducir los picos de carga. Usa `--exact` para forzar una temporización precisa o `--stagger 30s` para una ventana explícita.

### El día del mes y el día de la semana usan lógica OR

Las expresiones cron son analizadas por [croner](https://github.com/Hexagon/croner). Cuando los campos de día del mes y día de la semana no son comodines, croner hace coincidencia cuando **cualquiera** de los dos campos coincide, no cuando ambos coinciden. Este es el comportamiento estándar de Vixie cron.

```
# Intención: "9 AM el día 15, solo si es lunes"
# Real:      "9 AM cada día 15 Y 9 AM cada lunes"
0 9 15 * 1
```

Esto se ejecuta unas ~5–6 veces por mes en lugar de 0–1 veces por mes. OpenClaw usa aquí el comportamiento OR predeterminado de Croner. Para exigir ambas condiciones, usa el modificador `+` de día de la semana de Croner (`0 9 15 * +1`) o programa un campo y valida el otro en el prompt o comando de tu trabajo.

## Estilos de ejecución

| Estilo          | valor de `--session` | Se ejecuta en            | Mejor para                     |
| --------------- | -------------------- | ------------------------ | ------------------------------ |
| Sesión principal | `main`              | Siguiente turno de Heartbeat | Recordatorios, eventos del sistema |
| Aislado         | `isolated`           | `cron:<jobId>` dedicado  | Informes, tareas en segundo plano |
| Sesión actual   | `current`            | Vinculada en el momento de creación | Trabajo recurrente con conocimiento de contexto |
| Sesión personalizada | `session:custom-id` | Sesión persistente con nombre | Flujos de trabajo que se basan en el historial |

Los trabajos de **sesión principal** ponen en cola un evento del sistema y opcionalmente activan Heartbeat (`--wake now` o `--wake next-heartbeat`). Los trabajos **aislados** ejecutan un turno de agente dedicado con una sesión nueva. Las **sesiones personalizadas** (`session:xxx`) conservan el contexto entre ejecuciones, lo que permite flujos de trabajo como resúmenes diarios que se basan en resúmenes anteriores.

Para los trabajos aislados, el desmontaje en tiempo de ejecución ahora incluye la limpieza del navegador con el mejor esfuerzo para esa sesión cron. Los fallos de limpieza se ignoran para que el resultado real de cron siga prevaleciendo.

Cuando las ejecuciones aisladas de cron orquestan subagentes, la entrega también prioriza la salida final
descendiente sobre el texto provisional obsoleto del padre. Si los descendientes aún se están
ejecutando, OpenClaw suprime esa actualización parcial del padre en lugar de anunciarla.

### Opciones de carga útil para trabajos aislados

- `--message`: texto del prompt (obligatorio para aislado)
- `--model` / `--thinking`: reemplazos de modelo y nivel de razonamiento
- `--light-context`: omite la inyección del archivo bootstrap del espacio de trabajo
- `--tools exec,read`: restringe qué herramientas puede usar el trabajo

`--model` usa el modelo permitido seleccionado para ese trabajo. Si el modelo solicitado
no está permitido, cron registra una advertencia y vuelve a la selección del modelo
del agente/predeterminado para ese trabajo. Las cadenas de respaldo configuradas siguen aplicándose, pero un simple
reemplazo de modelo sin una lista explícita de respaldo por trabajo ya no agrega el modelo primario del
agente como un objetivo adicional oculto de reintento.

La precedencia de selección de modelo para trabajos aislados es:

1. Reemplazo de modelo del hook de Gmail (cuando la ejecución vino de Gmail y ese reemplazo está permitido)
2. `model` de la carga útil por trabajo
3. Reemplazo de modelo de sesión cron almacenado
4. Selección de modelo del agente/predeterminado

El modo rápido también sigue la selección resuelta en vivo. Si la configuración del modelo seleccionado
tiene `params.fastMode`, el cron aislado usa eso de forma predeterminada. Un reemplazo almacenado de
`fastMode` de la sesión sigue prevaleciendo sobre la configuración en cualquier dirección.

Si una ejecución aislada encuentra una transferencia en vivo de cambio de modelo, cron reintenta con el
proveedor/modelo cambiado y conserva esa selección en vivo antes de volver a intentar. Cuando
el cambio también incluye un nuevo perfil de autenticación, cron conserva también ese reemplazo del perfil de autenticación.
Los reintentos son limitados: después del intento inicial más 2 reintentos por cambio,
cron aborta en lugar de entrar en un bucle infinito.

## Entrega y salida

| Modo       | Qué sucede                                                          |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Entrega el texto final al destino como respaldo si el agente no lo envió |
| `webhook`  | Hace POST de la carga útil del evento finalizado a una URL          |
| `none`     | No hay entrega de respaldo del ejecutor                             |

Usa `--announce --channel telegram --to "-1001234567890"` para entrega en canal. Para temas de foro de Telegram, usa `-1001234567890:topic:123`. Los destinos de Slack/Discord/Mattermost deben usar prefijos explícitos (`channel:<id>`, `user:<id>`).

Para los trabajos aislados, la entrega de chat es compartida. Si hay una ruta de chat disponible, el
agente puede usar la herramienta `message` incluso cuando el trabajo usa `--no-deliver`. Si el
agente envía al destino configurado/actual, OpenClaw omite el anuncio de respaldo.
En caso contrario, `announce`, `webhook` y `none` solo controlan lo que el
ejecutor hace con la respuesta final después del turno del agente.

Las notificaciones de fallos siguen una ruta de destino independiente:

- `cron.failureDestination` establece un valor predeterminado global para las notificaciones de fallo.
- `job.delivery.failureDestination` lo reemplaza por trabajo.
- Si ninguno está configurado y el trabajo ya entrega mediante `announce`, las notificaciones de fallo ahora vuelven de forma predeterminada a ese destino principal de anuncio.
- `delivery.failureDestination` solo es compatible con trabajos `sessionTarget="isolated"` a menos que el modo principal de entrega sea `webhook`.

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

Trabajo recurrente aislado con entrega:

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

Trabajo aislado con reemplazo de modelo y razonamiento:

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

Gateway puede exponer endpoints HTTP de Webhook para desencadenadores externos. Actívalos en la configuración:

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

Pone en cola un evento del sistema para la sesión principal:

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
- Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para restringir las formas permitidas de las claves de sesión.
- Las cargas útiles de hooks se envuelven con límites de seguridad de forma predeterminada.

## Integración de Gmail PubSub

Conecta los desencadenadores de la bandeja de entrada de Gmail a OpenClaw mediante Google PubSub.

**Requisitos previos**: CLI `gcloud`, `gog` (gogcli), hooks de OpenClaw habilitados, Tailscale para el endpoint HTTPS público.

### Configuración con asistente (recomendada)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Esto escribe la configuración `hooks.gmail`, habilita el preajuste de Gmail y usa Tailscale Funnel para el endpoint push.

### Inicio automático de Gateway

Cuando `hooks.enabled=true` y `hooks.gmail.account` está configurado, Gateway inicia `gog gmail watch serve` al arrancar y renueva automáticamente la suscripción watch. Establece `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desactivarlo.

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

3. Inicia la suscripción watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Reemplazo de modelo de Gmail

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
# Listar todos los trabajos
openclaw cron list

# Mostrar un trabajo, incluida la ruta de entrega resuelta
openclaw cron show <jobId>

# Editar un trabajo
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Forzar la ejecución de un trabajo ahora
openclaw cron run <jobId>

# Ejecutar solo si corresponde
openclaw cron run <jobId> --due

# Ver el historial de ejecuciones
openclaw cron runs --id <jobId> --limit 50

# Eliminar un trabajo
openclaw cron remove <jobId>

# Selección de agente (configuraciones con varios agentes)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Nota sobre el reemplazo de modelo:

- `openclaw cron add|edit --model ...` cambia el modelo seleccionado del trabajo.
- Si el modelo está permitido, ese proveedor/modelo exacto llega a la ejecución
  del agente aislado.
- Si no está permitido, cron muestra una advertencia y vuelve a la selección de
  modelo del agente/predeterminada del trabajo.
- Las cadenas de respaldo configuradas siguen aplicándose, pero un reemplazo simple de `--model`
  sin una lista explícita de respaldo por trabajo ya no recurre al modelo
  primario del agente como un objetivo adicional de reintento silencioso.

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

El archivo sidecar de estado de tiempo de ejecución se deriva de `cron.store`: un almacén `.json` como
`~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mientras que una ruta de almacén
sin sufijo `.json` agrega `-state.json`.

Desactiva cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

**Reintento de una sola vez**: los errores transitorios (límite de tasa, sobrecarga, red, error del servidor) reintentan hasta 3 veces con backoff exponencial. Los errores permanentes se desactivan de inmediato.

**Reintento recurrente**: backoff exponencial (de 30 s a 60 m) entre reintentos. El backoff se restablece después de la siguiente ejecución correcta.

**Mantenimiento**: `cron.sessionRetention` (predeterminado `24h`) elimina las entradas de sesión de ejecuciones aisladas. `cron.runLog.maxBytes` / `cron.runLog.keepLines` eliminan automáticamente archivos de registro de ejecución.

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

- Verifica `cron.enabled` y la variable de entorno `OPENCLAW_SKIP_CRON`.
- Confirma que Gateway se esté ejecutando de forma continua.
- Para programaciones `cron`, verifica la zona horaria (`--tz`) frente a la zona horaria del host.
- `reason: not-due` en la salida de ejecución significa que la ejecución manual se verificó con `openclaw cron run <jobId> --due` y que todavía no correspondía ejecutar el trabajo.

### Cron se ejecutó pero no hubo entrega

- El modo de entrega `none` significa que no se espera ningún envío de respaldo del ejecutor. El agente
  aún puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
- Un destino de entrega faltante/inválido (`channel`/`to`) significa que la salida se omitió.
- Los errores de autenticación del canal (`unauthorized`, `Forbidden`) significan que la entrega fue bloqueada por las credenciales.
- Si la ejecución aislada devuelve solo el token silencioso (`NO_REPLY` / `no_reply`),
  OpenClaw suprime la entrega saliente directa y también suprime la ruta de resumen
  en cola de respaldo, por lo que no se publica nada de vuelta en el chat.
- Si el agente debe enviar el mensaje al usuario por sí mismo, verifica que el trabajo tenga una
  ruta utilizable (`channel: "last"` con un chat anterior, o un canal/destino explícito).

### Aspectos a tener en cuenta sobre la zona horaria

- Cron sin `--tz` usa la zona horaria del host de gateway.
- Las programaciones `at` sin zona horaria se tratan como UTC.
- `activeHours` de Heartbeat usa la resolución de zona horaria configurada.

## Relacionado

- [Automatización y tareas](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Tareas en segundo plano](/es/automation/tasks) — registro de tareas para ejecuciones de cron
- [Heartbeat](/es/gateway/heartbeat) — turnos periódicos de la sesión principal
- [Zona horaria](/es/concepts/timezone) — configuración de zona horaria
