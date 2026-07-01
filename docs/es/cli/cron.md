---
read_when:
    - Quieres trabajos programados y activaciones
    - Está depurando la ejecución de Cron y los registros
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-01T02:57:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Administra trabajos Cron para el programador del Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver toda la superficie de comandos. Consulta [Trabajos Cron](/es/automation/cron-jobs) para la guía conceptual.
</Tip>

## Crear trabajos rápidamente

`openclaw cron create` es un alias de `openclaw cron add`. Para trabajos nuevos, coloca primero la programación y después el prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Usa `--webhook <url>` cuando el trabajo deba hacer POST del payload terminado en lugar de entregarlo a un destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` para trabajos deterministas de estilo shell que deban ejecutarse dentro de OpenClaw Cron sin iniciar una ejecución aislada de agente/modelo:

<Note>
Los trabajos Cron de comando son automatización del Gateway creada por administradores. Crearlos, editarlos,
eliminarlos o ejecutarlos manualmente requiere `operator.admin`; la ejecución programada
posterior se ejecuta en el proceso del Gateway, no como una llamada a herramienta `tools.exec` del agente.
`tools.exec.*` y las aprobaciones de exec siguen rigiendo las herramientas exec visibles para el modelo.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` para ejecución exacta de argv. Los trabajos de comando capturan stdout/stderr, registran el historial Cron normal y enrutan la salida mediante los mismos modos de entrega `announce`, `webhook` o `none` que los trabajos aislados. Un comando que imprime solo `NO_REPLY` se suprime.

## Sesiones

`--session` acepta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Claves de sesión">
    - `main` se enlaza a la sesión principal del agente.
    - `isolated` crea una transcripción y un id de sesión nuevos para cada ejecución.
    - `current` se enlaza a la sesión activa en el momento de la creación.
    - `session:<id>` fija una clave de sesión persistente explícita.

  </Accordion>
  <Accordion title="Semántica de sesión aislada">
    Las ejecuciones aisladas restablecen el contexto ambiental de conversación. El enrutamiento de canal y grupo, la política de envío/cola, la elevación, el origen y el enlace de runtime ACP se restablecen para la nueva ejecución. Las preferencias seguras y las sobrescrituras explícitas de modelo o autenticación seleccionadas por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió desde la sesión principal o actual, o si fallará de forma cerrada.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio no resueltos. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo sintaxis de destino propiedad del canal.

<Note>
Los trabajos aislados de `cron add` usan de forma predeterminada la entrega `--announce`. Usa `--no-deliver` para mantener la salida interna. `--deliver` permanece como alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat de Cron aislado se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente usando la herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como fallback la respuesta final solo cuando el agente no envió directamente al destino resuelto.
- `webhook` publica el payload terminado en una URL.
- `none` desactiva la entrega fallback del ejecutor.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` para configurar la entrega por Webhook. No combines `--webhook` con flags de entrega de chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` puede desconfigurar campos individuales de enrutamiento de entrega con `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` (cada uno se rechaza cuando se combina con su flag de configuración correspondiente). A diferencia de `--no-deliver`, que solo desactiva la entrega fallback del ejecutor, estos eliminan el campo almacenado para que el trabajo vuelva a resolver esa parte de su ruta desde los valores predeterminados.

`--announce` es la entrega fallback del ejecutor para la respuesta final. `--no-deliver` desactiva ese fallback, pero no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Los recordatorios creados desde un chat activo conservan el destino de entrega de chat en vivo para la entrega fallback de anuncio. Las claves de sesión internas pueden estar en minúsculas; no las uses como fuente de verdad para IDs de proveedor sensibles a mayúsculas y minúsculas, como los IDs de sala de Matrix.

### Entrega de fallos

Las notificaciones de fallo se resuelven en este orden:

1. `delivery.failureDestination` en el trabajo.
2. `cron.failureDestination` global.
3. El destino de anuncio principal del trabajo (cuando no se define ningún destino de fallo explícito).

<Note>
Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Los trabajos aislados lo aceptan en todos los modos.
</Note>

Nota: las ejecuciones Cron aisladas tratan los fallos de agente a nivel de ejecución como errores del trabajo incluso cuando
no se produce ningún payload de respuesta, por lo que los fallos de modelo/proveedor siguen incrementando los contadores
de errores y activando notificaciones de fallo.

Los trabajos Cron de comando no inician un turno de agente aislado. Un código de salida cero registra
`ok`; una salida distinta de cero, señal, timeout o timeout sin salida registra `error` y
puede activar la misma ruta de notificación de fallo.

Si una ejecución aislada agota el tiempo antes de la primera solicitud al modelo, `openclaw cron show`
y `openclaw cron runs` incluyen un error específico de fase, como
`setup timed out before runner start` o
`stalled before first model call (last phase: context-engine)`.
Para proveedores respaldados por CLI, el watchdog previo al modelo permanece activo hasta que el turno externo de
CLI empieza, por lo que bloqueos en búsqueda de sesión, hook, autenticación, prompt y configuración de CLI se
informan como fallos Cron previos al modelo.

## Programación

### Trabajos de una sola ejecución

`--at <datetime>` programa una ejecución de una sola vez. Las fechas y horas sin offset se tratan como UTC a menos que también pases `--tz <iana>`, que interpreta la hora de reloj de pared en la zona horaria indicada.

<Note>
Los trabajos de una sola ejecución se eliminan después de completarse correctamente de forma predeterminada. Usa `--keep-after-run` para conservarlos.
</Note>

### Trabajos recurrentes

Los trabajos recurrentes usan backoff exponencial de reintento después de errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan el backoff de reintento, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` puede hacer que las alertas de fallo incluyan notificaciones repetidas de ejecuciones omitidas.

Para trabajos aislados que apuntan a un proveedor de modelo local configurado, Cron ejecuta una preflight ligera del proveedor antes de iniciar el turno del agente. Los proveedores `api: "ollama"` de loopback, red privada y `.local` se sondean en `/api/tags`; los proveedores locales compatibles con OpenAI, como vLLM, SGLang y LM Studio, se sondean en `/models`. Si el endpoint no es accesible, la ejecución se registra como `skipped` y se reintenta en una programación posterior; los endpoints inactivos coincidentes se almacenan en caché durante 5 minutos para evitar que muchos trabajos saturen el mismo servidor local.

Nota: los trabajos Cron, el estado de runtime pendiente y el historial de ejecuciones viven en la base de datos de estado SQLite compartida. Los archivos heredados `jobs.json`, `jobs-state.json` y `runs/*.jsonl` se importan una vez y se renombran con el sufijo `.migrated`. Después de la importación, edita las programaciones con `openclaw cron add|edit|remove` en lugar de editar archivos JSON.

### Ejecuciones manuales

`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada y retorna en cuanto la ejecución manual se encola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa el `runId` devuelto para inspeccionar el resultado posterior:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Añade `--wait` cuando un script deba bloquearse hasta que esa ejecución encolada exacta registre un estado terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI sigue llamando primero a `cron.run` y luego sondea `cron.runs` para el `runId` devuelto. El comando sale con `0` solo cuando la ejecución termina con estado `ok`. Sale con un valor distinto de cero cuando la ejecución termina con `error` o `skipped`, cuando la respuesta del Gateway no incluye un `runId` o cuando vence `--wait-timeout`. `--poll-interval` debe ser mayor que cero.

<Note>
Usa `--due` cuando quieras que el comando manual se ejecute solo si el trabajo vence actualmente. Si `--due --wait` no encola una ejecución, el comando devuelve la respuesta normal sin ejecución en lugar de sondear.
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para el trabajo. `cron add|edit --fallbacks <list>` configura modelos fallback por trabajo, por ejemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; pasa `--fallbacks ""` para una ejecución estricta sin fallbacks. `cron edit <job-id> --clear-fallbacks` elimina la sobrescritura de fallbacks por trabajo. `cron edit <job-id> --clear-model` elimina la sobrescritura de modelo por trabajo para que el trabajo siga la precedencia normal de selección de modelo de Cron (una sobrescritura de sesión Cron almacenada si existe; de lo contrario, el modelo del agente/predeterminado); no puede combinarse con `--model`. `cron add|edit --thinking <level>` configura una sobrescritura de thinking por trabajo; `cron edit <job-id> --clear-thinking` la elimina para que el trabajo siga la precedencia normal de thinking de Cron, y no puede combinarse con `--thinking`.

<Warning>
Si el modelo no está permitido o no puede resolverse, Cron falla la ejecución con un error de validación explícito en lugar de recurrir a la selección de modelo del agente del trabajo o predeterminada.
</Warning>

Cron `--model` es un **principal del trabajo**, no una sobrescritura de `/model` de sesión de chat. Eso significa:

- Los fallbacks de modelo configurados siguen aplicándose cuando el modelo de trabajo seleccionado falla.
- El payload por trabajo `fallbacks` reemplaza la lista de fallback configurada cuando está presente.
- Una lista de fallback por trabajo vacía (`--fallbacks ""` o `fallbacks: []` en el payload/API del trabajo) hace que la ejecución Cron sea estricta.
- Cuando un trabajo tiene `--model` pero no hay lista de fallback configurada, OpenClaw pasa una sobrescritura fallback vacía explícita para que el modelo principal del agente no se añada como destino de reintento oculto.
- Las comprobaciones preflight de proveedor local recorren los fallbacks configurados antes de marcar una ejecución Cron como `skipped`.

`openclaw doctor` informa de los trabajos que ya tienen `payload.model` configurado, incluidos recuentos por namespace de proveedor y desajustes frente a `agents.defaults.model`. Usa esa comprobación cuando el comportamiento de autenticación, proveedor o facturación se vea diferente entre el chat en vivo y los trabajos programados.

### Precedencia de modelo de Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Sobrescritura de hook de Gmail.
2. `--model` por trabajo.
3. Sobrescritura de modelo de sesión Cron almacenada (cuando el usuario seleccionó una).
4. Selección de modelo del agente o predeterminada.

### Modo rápido

El modo rápido de Cron aislado sigue la selección de modelo en vivo resuelta. La configuración de modelo `params.fastMode` se aplica de forma predeterminada, pero una sobrescritura de sesión `fastMode` almacenada sigue teniendo prioridad sobre la configuración. Cuando el modo resuelto es `auto`, el corte usa el valor `params.fastAutoOnSeconds` del modelo seleccionado, con valor predeterminado de 60 segundos.

### Reintentos de cambio de modelo en vivo

Si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron persiste el proveedor y modelo cambiados (y la sobrescritura de perfil de autenticación cambiada cuando está presente) para la ejecución activa antes de reintentar. El bucle externo de reintentos está limitado a dos reintentos de cambio después del intento inicial, y luego aborta en lugar de iterar indefinidamente.

## Salida de ejecución y denegaciones

### Supresión de reconocimientos obsoletos

Los turnos de Cron aislado suprimen respuestas obsoletas que solo son reconocimientos. Si el primer resultado es solo una actualización de estado provisional y ninguna ejecución de subagente descendiente es responsable de la respuesta final, Cron vuelve a pedir una vez el resultado real antes de la entrega.

### Supresión silenciosa de tokens

Si una ejecución cron aislada devuelve solo el token silencioso (`NO_REPLY` o `no_reply`), cron suprime tanto la entrega saliente directa como la ruta alternativa de resumen en cola, por lo que no se publica nada de vuelta en el chat.

### Denegaciones estructuradas

Las ejecuciones cron aisladas usan los metadatos estructurados de denegación de ejecución de la ejecución integrada como señal de denegación autoritativa. También respetan los envoltorios `UNAVAILABLE` del host de Node cuando el mensaje de error estructurado anidado empieza con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`.

Cron no clasifica la prosa de salida final ni las frases de rechazo que parecen aprobaciones como denegaciones a menos que la ejecución integrada también proporcione metadatos estructurados de denegación, por lo que el texto normal del asistente no se trata como un comando bloqueado.

`cron list` y el historial de ejecuciones muestran el motivo de la denegación en lugar de informar un comando bloqueado como `ok`.

## Retención

La retención y la depuración se controlan en la configuración:

- `cron.sessionRetention` (predeterminado `24h`) depura las sesiones de ejecución aislada completadas.
- `cron.runLog.keepLines` depura las filas de historial de ejecuciones de SQLite retenidas por trabajo. `cron.runLog.maxBytes` sigue aceptándose por compatibilidad con registros de ejecución más antiguos respaldados por archivos.

## Migrar trabajos antiguos

<Note>
Si tienes trabajos cron de antes del formato actual de entrega y almacenamiento, ejecuta `openclaw doctor --fix`. Doctor normaliza los campos cron heredados (`jobId`, `schedule.cron`, campos de entrega de nivel superior, incluido el `threadId` heredado, alias de entrega `provider` de la carga útil) y migra los trabajos de respaldo de Webhook con `notify: true` desde `cron.webhook` a entrega Webhook explícita. Los trabajos que ya anuncian en un chat conservan esa entrega y reciben un destino de Webhook de finalización. Cuando `cron.webhook` no está definido, el marcador inerte de nivel superior `notify` se elimina para los trabajos sin destino de migración (la entrega existente se conserva sin cambios), por lo que `doctor --fix` ya no sigue volviendo a advertir sobre ellos.
</Note>

## Ediciones comunes

Actualiza los ajustes de entrega sin cambiar el mensaje:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desactiva la entrega para un trabajo aislado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Activa el contexto de arranque ligero para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncia en un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Anuncia en un tema de foro de Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crea un trabajo aislado con contexto de arranque ligero:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos aislados de turno de agente. Para las ejecuciones cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

Crea un trabajo de comando con argv, cwd, env, stdin y límites de salida exactos:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Comandos de administración comunes

Ejecución manual e inspección:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` muestra todos los trabajos coincidentes de forma predeterminada. Pasa `--agent <id>` para mostrar solo los trabajos cuyo id de agente normalizado efectivo coincida; los trabajos sin un id de agente almacenado cuentan como el agente predeterminado configurado.

`openclaw cron get <job-id>` devuelve directamente el JSON del trabajo almacenado. Usa `cron show <job-id>` cuando quieras la vista legible para humanos con una vista previa de la ruta de entrega.

`cron list --json` y `cron show <job-id> --json` incluyen un campo `status` de nivel superior en cada trabajo, calculado a partir de `enabled`, `state.runningAtMs` y `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Esto refleja la columna de estado legible para humanos para que las herramientas externas puedan leer el estado del trabajo sin volver a derivarlo.

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino cron previsto, el destino resuelto, los envíos de la herramienta de mensajes, el uso de respaldo y el estado entregado.

Redireccionamiento de agente y sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` advierte cuando se omite `--agent` en trabajos de turno de agente y recurre al agente predeterminado (`main`). Pasa `--agent <id>` al crearlo para fijar un agente específico.

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tareas programadas](/es/automation/cron-jobs)
