---
read_when:
    - Quieres trabajos programados y activaciones
    - Estás depurando la ejecución de Cron y los registros
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-06-27T10:57:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestiona tareas Cron para el programador de Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver toda la superficie de comandos. Consulta [Tareas Cron](/es/automation/cron-jobs) para la guía conceptual.
</Tip>

## Crear tareas rápidamente

`openclaw cron create` es un alias de `openclaw cron add`. Para tareas nuevas, pon primero la programación y luego el prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Usa `--webhook <url>` cuando la tarea deba enviar por POST la carga terminada en lugar de entregarla a un destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` para tareas deterministas de estilo shell que deban ejecutarse dentro de OpenClaw cron sin iniciar una ejecución aislada de agente/modelo:

<Note>
Las tareas Cron de comandos son automatización de Gateway creada por administradores. Crearlas, editarlas,
eliminarlas o ejecutarlas manualmente requiere `operator.admin`; la ejecución programada
posterior se ejecuta en el proceso de Gateway, no como una llamada de herramienta `tools.exec` de agente.
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

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` para ejecutar argv exactamente. Las tareas de comandos capturan stdout/stderr, registran el historial Cron normal y enrutan la salida mediante los mismos modos de entrega `announce`, `webhook` o `none` que las tareas aisladas. Se suprime un comando que imprime solo `NO_REPLY`.

## Sesiones

`--session` acepta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Claves de sesión">
    - `main` se vincula a la sesión principal del agente.
    - `isolated` crea una transcripción nueva y un id de sesión para cada ejecución.
    - `current` se vincula a la sesión activa en el momento de creación.
    - `session:<id>` fija una clave de sesión persistente explícita.

  </Accordion>
  <Accordion title="Semántica de sesión aislada">
    Las ejecuciones aisladas restablecen el contexto de conversación ambiental. El enrutamiento de canal y grupo, la política de envío/cola, la elevación, el origen y la vinculación del runtime ACP se restablecen para la nueva ejecución. Las preferencias seguras y los reemplazos explícitos de modelo o autenticación seleccionados por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió desde la sesión principal o actual, o si fallará de forma cerrada.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio no resueltos. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo sintaxis de destino propiedad del canal.

<Note>
Las tareas aisladas de `cron add` usan por defecto la entrega `--announce`. Usa `--no-deliver` para mantener la salida interna. `--deliver` permanece como alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat de Cron aislado se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente usando la herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como fallback la respuesta final solo cuando el agente no envió directamente al destino resuelto.
- `webhook` publica la carga terminada en una URL.
- `none` deshabilita la entrega fallback del ejecutor.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` para configurar la entrega Webhook. No combines `--webhook` con marcas de entrega de chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` puede deshacer campos individuales de enrutamiento de entrega con `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` (cada uno se rechaza cuando se combina con su marca de configuración correspondiente). A diferencia de `--no-deliver`, que solo deshabilita la entrega fallback del ejecutor, estos eliminan el campo almacenado para que la tarea vuelva a resolver esa parte de su ruta desde los valores predeterminados.

`--announce` es la entrega fallback del ejecutor para la respuesta final. `--no-deliver` deshabilita ese fallback, pero no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Los recordatorios creados desde un chat activo conservan el destino de entrega de chat en vivo para la entrega de anuncio fallback. Las claves internas de sesión pueden estar en minúsculas; no las uses como fuente de verdad para IDs de proveedor sensibles a mayúsculas y minúsculas, como los IDs de salas de Matrix.

### Entrega de fallos

Las notificaciones de fallo se resuelven en este orden:

1. `delivery.failureDestination` en la tarea.
2. `cron.failureDestination` global.
3. El destino de anuncio principal de la tarea (cuando no se establece un destino de fallo explícito).

<Note>
Las tareas de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Las tareas aisladas lo aceptan en todos los modos.
</Note>

Nota: las ejecuciones Cron aisladas tratan los fallos de agente a nivel de ejecución como errores de tarea incluso cuando
no se produce ninguna carga de respuesta, de modo que los fallos de modelo/proveedor siguen incrementando los contadores
de error y activan notificaciones de fallo.

Las tareas Cron de comandos no inician un turno de agente aislado. Un código de salida cero registra
`ok`; una salida distinta de cero, señal, tiempo de espera o tiempo de espera sin salida registra `error` y
puede activar la misma ruta de notificación de fallo.

Si una ejecución aislada agota el tiempo antes de la primera solicitud al modelo, `openclaw cron show`
y `openclaw cron runs` incluyen un error específico de fase, como
`setup timed out before runner start` o
`stalled before first model call (last phase: context-engine)`.
Para proveedores respaldados por CLI, el watchdog previo al modelo permanece activo hasta que comienza el turno de la
CLI externa, por lo que bloqueos en búsqueda de sesión, hook, autenticación, prompt y configuración de CLI se
informan como fallos Cron previos al modelo.

## Programación

### Tareas de una sola ejecución

`--at <datetime>` programa una ejecución única. Las fechas y horas sin desplazamiento se tratan como UTC a menos que también pases `--tz <iana>`, que interpreta la hora de reloj de pared en la zona horaria indicada.

<Note>
Las tareas de una sola ejecución se eliminan tras completarse correctamente de forma predeterminada. Usa `--keep-after-run` para conservarlas.
</Note>

### Tareas recurrentes

Las tareas recurrentes usan backoff de reintento exponencial después de errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan al backoff de reintento, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` puede optar por incluir notificaciones repetidas de ejecuciones omitidas en las alertas de fallo.

Para tareas aisladas que apuntan a un proveedor de modelo configurado localmente, cron ejecuta una precomprobación ligera del proveedor antes de iniciar el turno del agente. Los proveedores `api: "ollama"` de Loopback, red privada y `.local` se sondean en `/api/tags`; los proveedores locales compatibles con OpenAI, como vLLM, SGLang y LM Studio, se sondean en `/models`. Si el endpoint no es accesible, la ejecución se registra como `skipped` y se reintenta en una programación posterior; los endpoints muertos coincidentes se cachean durante 5 minutos para evitar que muchas tareas golpeen el mismo servidor local.

Nota: las tareas Cron, el estado runtime pendiente y el historial de ejecuciones viven en la base de datos SQLite de estado compartido. Los archivos heredados `jobs.json`, `jobs-state.json` y `runs/*.jsonl` se importan una vez y se renombran con el sufijo `.migrated`. Después de la importación, edita las programaciones con `openclaw cron add|edit|remove` en lugar de editar archivos JSON.

### Ejecuciones manuales

`openclaw cron run <job-id>` ejecuta forzosamente de forma predeterminada y devuelve en cuanto la ejecución manual se pone en cola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa el `runId` devuelto para inspeccionar el resultado posterior:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Añade `--wait` cuando un script deba bloquearse hasta que esa ejecución exacta en cola registre un estado terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI sigue llamando primero a `cron.run`, y luego sondea `cron.runs` para el `runId` devuelto. El comando sale con `0` solo cuando la ejecución termina con estado `ok`. Sale con un valor distinto de cero cuando la ejecución termina con `error` o `skipped`, cuando la respuesta de Gateway no incluye un `runId` o cuando expira `--wait-timeout`. `--poll-interval` debe ser mayor que cero.

<Note>
Usa `--due` cuando quieras que el comando manual se ejecute solo si la tarea está vencida actualmente. Si `--due --wait` no pone una ejecución en cola, el comando devuelve la respuesta normal sin ejecución en lugar de sondear.
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para la tarea. `cron add|edit --fallbacks <list>` establece modelos fallback por tarea, por ejemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; pasa `--fallbacks ""` para una ejecución estricta sin fallbacks. `cron edit <job-id> --clear-fallbacks` elimina el reemplazo de fallback por tarea. `cron edit <job-id> --clear-model` elimina el reemplazo de modelo por tarea para que la tarea siga la precedencia normal de selección de modelo de Cron (un reemplazo de sesión Cron almacenado si existe; de lo contrario, el modelo del agente/predeterminado); no puede combinarse con `--model`.

<Warning>
Si el modelo no está permitido o no se puede resolver, Cron falla la ejecución con un error de validación explícito en lugar de volver a la selección de modelo del agente de la tarea o predeterminada.
</Warning>

Cron `--model` es un **principal de tarea**, no un reemplazo de `/model` de sesión de chat. Eso significa:

- Los fallbacks de modelo configurados siguen aplicándose cuando falla el modelo de tarea seleccionado.
- `fallbacks` en la carga por tarea reemplaza la lista de fallback configurada cuando está presente.
- Una lista de fallback por tarea vacía (`--fallbacks ""` o `fallbacks: []` en la carga/API de la tarea) hace que la ejecución Cron sea estricta.
- Cuando una tarea tiene `--model` pero no hay lista de fallback configurada, OpenClaw pasa un reemplazo fallback vacío explícito para que el principal del agente no se añada como destino de reintento oculto.
- Las precomprobaciones de proveedores locales recorren los fallbacks configurados antes de marcar una ejecución Cron como `skipped`.

`openclaw doctor` informa de las tareas que ya tienen `payload.model` establecido, incluidos los recuentos de espacios de nombres de proveedor y las discrepancias con `agents.defaults.model`. Usa esa comprobación cuando el comportamiento de autenticación, proveedor o facturación se vea diferente entre el chat en vivo y las tareas programadas.

### Precedencia de modelo de Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Reemplazo de hook de Gmail.
2. `--model` por tarea.
3. Reemplazo de modelo de sesión Cron almacenado (cuando el usuario seleccionó uno).
4. Selección de modelo del agente o predeterminado.

### Modo rápido

El modo rápido de Cron aislado sigue la selección de modelo en vivo resuelta. La configuración de modelo `params.fastMode` se aplica de forma predeterminada, pero un reemplazo de sesión `fastMode` almacenado sigue ganando sobre la configuración. Cuando el modo resuelto es `auto`, el umbral usa el valor `params.fastAutoOnSeconds` del modelo seleccionado, con valor predeterminado de 60 segundos.

### Reintentos de cambio de modelo en vivo

Si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron persiste el proveedor y el modelo cambiados (y el reemplazo de perfil de autenticación cambiado cuando está presente) para la ejecución activa antes de reintentar. El bucle externo de reintento se limita a dos reintentos de cambio después del intento inicial, y luego aborta en lugar de quedar en bucle indefinidamente.

## Salida de ejecución y denegaciones

### Supresión de acuses obsoletos

Los turnos de Cron aislado suprimen respuestas obsoletas que solo son acuses. Si el primer resultado es solo una actualización de estado provisional y ninguna ejecución de subagente descendiente es responsable de la respuesta final, Cron vuelve a solicitar una vez el resultado real antes de la entrega.

### Supresión de token silencioso

Si una ejecución Cron aislada devuelve solo el token silencioso (`NO_REPLY` o `no_reply`), Cron suprime tanto la entrega saliente directa como la ruta de resumen en cola fallback, por lo que no se publica nada de vuelta en el chat.

### Denegaciones estructuradas

Las ejecuciones de cron aisladas usan los metadatos estructurados de denegación de ejecución de la ejecución incrustada como la señal de denegación autoritativa. También respetan los envoltorios `UNAVAILABLE` del host de Node cuando el mensaje de error estructurado anidado empieza con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`.

Cron no clasifica la prosa de salida final ni las frases de rechazo con apariencia de aprobación como denegaciones a menos que la ejecución incrustada también proporcione metadatos estructurados de denegación, por lo que el texto ordinario del asistente no se trata como un comando bloqueado.

`cron list` y el historial de ejecuciones muestran el motivo de denegación en lugar de informar un comando bloqueado como `ok`.

## Retención

La retención y la poda se controlan en la configuración:

- `cron.sessionRetention` (predeterminado `24h`) poda las sesiones de ejecución aisladas completadas.
- `cron.runLog.keepLines` poda las filas retenidas del historial de ejecuciones de SQLite por trabajo. `cron.runLog.maxBytes` sigue aceptándose por compatibilidad con registros de ejecución antiguos respaldados por archivos.

## Migrar trabajos antiguos

<Note>
Si tienes trabajos de cron anteriores al formato actual de entrega y almacenamiento, ejecuta `openclaw doctor --fix`. Doctor normaliza campos de cron heredados (`jobId`, `schedule.cron`, campos de entrega de nivel superior incluido el `threadId` heredado, alias de entrega `provider` de la carga útil) y migra trabajos de fallback de webhook con `notify: true` de `cron.webhook` a entrega explícita por webhook. Los trabajos que ya anuncian en un chat conservan esa entrega y obtienen un destino de webhook de finalización. Cuando `cron.webhook` no está definido, el marcador inerte de nivel superior `notify` se elimina para trabajos sin destino de migración (la entrega existente se conserva sin cambios), por lo que `doctor --fix` ya no vuelve a advertir sobre ellos.
</Note>

## Ediciones comunes

Actualizar la configuración de entrega sin cambiar el mensaje:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Deshabilitar la entrega para un trabajo aislado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilitar contexto de arranque ligero para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Anunciar en un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Anunciar en un tema de foro de Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Crear un trabajo aislado con contexto de arranque ligero:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos de turno de agente aislados. Para ejecuciones de cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

Crear un trabajo de comando con argv exacto, cwd, env, stdin y límites de salida:

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

## Comandos comunes de administración

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

`openclaw cron get <job-id>` devuelve directamente el JSON del trabajo almacenado. Usa `cron show <job-id>` cuando quieras la vista legible por humanos con vista previa de la ruta de entrega.

`cron list --json` y `cron show <job-id> --json` incluyen un campo `status` de nivel superior en cada trabajo, calculado a partir de `enabled`, `state.runningAtMs` y `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Esto refleja la columna de estado legible por humanos para que las herramientas externas puedan leer el estado del trabajo sin volver a derivarlo.

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino de cron previsto, el destino resuelto, envíos de herramientas de mensaje, uso de fallback y estado entregado.

Reorientación de agente y sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` advierte cuando se omite `--agent` en trabajos de turno de agente y recurre al agente predeterminado (`main`). Pasa `--agent <id>` en el momento de la creación para fijar un agente específico.

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
