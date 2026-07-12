---
read_when:
    - Quieres tareas programadas y activaciones.
    - Estás depurando la ejecución y los registros de cron
summary: Referencia de la CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-11T22:55:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestiona tareas Cron para el planificador del Gateway.

<Tip>
Ejecuta `openclaw cron --help` para consultar todos los comandos disponibles. Consulta [Tareas Cron](/es/automation/cron-jobs) para ver la guía conceptual.
</Tip>

<Note>
Todas las modificaciones de Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) requieren `operator.admin`. Las ejecuciones de cargas de comandos se realizan directamente en el proceso del Gateway, no como una llamada a la herramienta `tools.exec` de un agente; `tools.exec.*` y las aprobaciones de ejecución siguen rigiendo las herramientas de ejecución visibles para el modelo.
</Note>

## Crear tareas rápidamente

`openclaw cron create` es un alias de `openclaw cron add`. Para las tareas nuevas, indica primero la programación y después la instrucción:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Usa `--webhook <url>` cuando la tarea deba enviar mediante POST la carga finalizada en lugar de entregarla a un destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` para tareas deterministas de estilo shell que se ejecutan dentro de Cron de OpenClaw sin iniciar una ejecución aislada de agente/modelo:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` para ejecutar argumentos exactos. Las tareas de comandos capturan stdout/stderr, registran el historial normal de Cron y encaminan la salida mediante los mismos modos de entrega `announce`, `webhook` o `none` que las tareas aisladas. Se suprime un comando que solo imprime `NO_REPLY`.

## Sesiones

`--session` acepta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Claves de sesión">
    - `main` se vincula a la sesión principal del agente.
    - `isolated` crea una transcripción y un identificador de sesión nuevos para cada ejecución.
    - `current` se vincula a la sesión activa en el momento de la creación.
    - `session:<id>` se fija a una clave de sesión persistente explícita.

  </Accordion>
  <Accordion title="Semántica de las sesiones aisladas">
    Las ejecuciones aisladas restablecen el contexto de conversación del entorno. El encaminamiento por canal y grupo, la política de envío/cola, la elevación, el origen y la vinculación del entorno de ejecución ACP se restablecen para la nueva ejecución. Las preferencias seguras y las anulaciones de modelo o autenticación seleccionadas explícitamente por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la ruta de entrega resuelta. Para `channel: "last"`, la vista previa indica si la ruta se resolvió desde la sesión principal o la actual, o si fallará de forma cerrada.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio no resueltos. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el Plugin cargado actúan como selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; se rechaza `channel: "whatsapp"` con `to: "telegram:123"`. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo sintaxis de destino propia del canal.

<Note>
Las tareas aisladas de `cron add` usan de forma predeterminada la entrega mediante `--announce`. Usa `--no-deliver` para mantener la salida interna. `--deliver` se mantiene como alias obsoleto de `--announce`.
</Note>

### Responsabilidad de la entrega

La entrega de chat de tareas Cron aisladas se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente mediante la herramienta `message` cuando hay una ruta de chat disponible.
- Como alternativa, `announce` entrega la respuesta final solo cuando el agente no la envió directamente al destino resuelto.
- `webhook` publica la carga finalizada en una URL.
- `none` desactiva la entrega alternativa del ejecutor.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` para configurar la entrega mediante Webhook. No combines `--webhook` con opciones de entrega de chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` puede borrar campos individuales de encaminamiento de entrega mediante `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` (cada uno se rechaza cuando se combina con su opción de configuración correspondiente). A diferencia de `--no-deliver`, que solo desactiva la entrega alternativa del ejecutor, estas opciones eliminan el campo almacenado para que la tarea vuelva a resolver esa parte de la ruta a partir de los valores predeterminados.

`--announce` es la entrega alternativa del ejecutor para la respuesta final. `--no-deliver` desactiva esa alternativa, pero no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Los recordatorios creados desde un chat activo conservan el destino de entrega del chat en curso para la entrega alternativa mediante anuncio. Las claves internas de sesión pueden estar en minúsculas; no las uses como fuente de verdad para identificadores de proveedor que distinguen entre mayúsculas y minúsculas, como los identificadores de salas de Matrix.

### Entrega de errores

Las notificaciones de errores se resuelven en este orden:

1. `delivery.failureDestination` de la tarea.
2. El valor global `cron.failureDestination`.
3. El destino principal de anuncio de la tarea (cuando ninguno de los anteriores se resuelve en un destino concreto).

<Note>
Las tareas de la sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Las tareas aisladas lo aceptan en todos los modos.
</Note>

Las ejecuciones aisladas de Cron tratan los errores del agente a nivel de ejecución como errores de la tarea incluso cuando no se produce ninguna carga de respuesta, por lo que los errores del modelo/proveedor siguen incrementando los contadores de errores y activando las notificaciones correspondientes.

Las tareas Cron de comandos no inician un turno de agente aislado. Un código de salida cero registra `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera sin salida agotado registran `error` y pueden activar la misma ruta de notificación de errores.

Si una ejecución aislada agota el tiempo de espera antes de la primera solicitud al modelo, `openclaw cron show` y `openclaw cron runs` incluyen un error específico de la fase, como `setup timed out before runner start`, o un mensaje de bloqueo que indica la última fase de inicio conocida (por ejemplo, `context-engine`). Para los proveedores respaldados por una CLI, el supervisor previo al modelo permanece activo hasta que comienza el turno de la CLI externa, de modo que los bloqueos en la búsqueda de sesión, los enlaces, la autenticación, la instrucción y la configuración de la CLI se notifican como errores de Cron previos al modelo.

## Programación

### Tareas de una sola ejecución

`--at <datetime>` programa una ejecución única. Las fechas y horas sin desplazamiento se tratan como UTC, salvo que también pases `--tz <iana>`, que interpreta la hora local según la zona horaria indicada.

<Note>
Las tareas de una sola ejecución se eliminan de forma predeterminada después de completarse correctamente. Usa `--keep-after-run` para conservarlas.
</Note>

### Tareas recurrentes

Las tareas recurrentes aplican un intervalo exponencial entre reintentos después de errores consecutivos: 30 s, 1 min, 5 min, 15 min y 60 min. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan al intervalo entre reintentos, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` permite incluir notificaciones repetidas de ejecuciones omitidas en las alertas de errores.

Para las tareas aisladas que usan un proveedor de modelos local configurado (URL base en local loopback, una red privada o `.local`), Cron realiza una comprobación preliminar ligera del proveedor antes de iniciar el turno del agente: los proveedores `api: "ollama"` se comprueban en `/api/tags`; los demás proveedores locales compatibles con OpenAI (`api: "openai-completions"`, por ejemplo, vLLM, SGLang y LM Studio) se comprueban en `/models`. Si no se puede acceder al endpoint, la ejecución se registra como `skipped` y se reintenta en una programación posterior; el resultado de accesibilidad se almacena en caché por endpoint durante 5 minutos para que muchas tareas dirigidas al mismo servidor local no lo saturen con comprobaciones repetidas.

Las tareas Cron, el estado pendiente del entorno de ejecución y el historial de ejecuciones se almacenan en la base de datos de estado SQLite compartida. Los archivos heredados `jobs.json`, `<name>-state.json` y `runs/*.jsonl` se importan una vez y se renombran con el sufijo `.migrated`. Después de la importación, edita las programaciones con `openclaw cron add|edit|remove` en lugar de modificar los archivos JSON.

### Ejecuciones manuales

`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada y devuelve el control en cuanto la ejecución manual queda en cola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa el valor `runId` devuelto para consultar el resultado posteriormente:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Añade `--wait` cuando un script deba bloquearse hasta que esa ejecución exacta en cola registre un estado terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI sigue llamando primero a `cron.run` y después consulta periódicamente `cron.runs` para el `runId` devuelto. El comando finaliza con `0` solo cuando la ejecución termina con el estado `ok`. Finaliza con un valor distinto de cero cuando la ejecución termina con `error` o `skipped`, cuando la respuesta del Gateway no incluye un `runId` o cuando vence `--wait-timeout` (valor predeterminado: `10m`, con consultas cada `2s` de forma predeterminada). `--poll-interval` debe ser mayor que cero.

<Note>
Usa `--due` cuando quieras que el comando manual se ejecute solo si la tarea está programada para ese momento. Si `--due --wait` no pone una ejecución en cola, el comando devuelve la respuesta normal de no ejecución en lugar de iniciar consultas periódicas.
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para la tarea. `cron add|edit --fallbacks <list>` configura modelos alternativos por tarea, por ejemplo, `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; pasa `--fallbacks ""` para una ejecución estricta sin alternativas. `cron edit <job-id> --clear-fallbacks` elimina la anulación de alternativas por tarea. `cron edit <job-id> --clear-model` elimina la anulación de modelo por tarea para que esta siga la precedencia normal de selección de modelos de Cron (una anulación almacenada en la sesión de Cron, si existe; de lo contrario, el modelo del agente o el predeterminado); no puede combinarse con `--model`. `cron add|edit --thinking <level>` configura una anulación del nivel de razonamiento por tarea; `cron edit <job-id> --clear-thinking` la elimina para que la tarea siga la precedencia normal de razonamiento de Cron y no puede combinarse con `--thinking`.

<Warning>
Si el modelo no está permitido o no puede resolverse, Cron marca la ejecución como errónea con un error de validación explícito en lugar de recurrir a la selección del agente de la tarea o del modelo predeterminado.
</Warning>

El valor `--model` de Cron es el **modelo principal de la tarea**, no una anulación de `/model` de la sesión de chat. Esto significa lo siguiente:

- Las alternativas de modelo configuradas siguen aplicándose cuando falla el modelo seleccionado para la tarea.
- La carga `fallbacks` por tarea sustituye la lista de alternativas configurada cuando está presente.
- Una lista vacía de alternativas por tarea (`--fallbacks ""` o `fallbacks: []` en la carga/API de la tarea) hace que la ejecución de Cron sea estricta.
- Cuando una tarea tiene `--model`, pero no hay ninguna lista de alternativas configurada, OpenClaw pasa una anulación vacía explícita de alternativas para que el modelo principal del agente no se añada como destino oculto de reintento.
- Las comprobaciones preliminares de proveedores locales recorren las alternativas configuradas antes de marcar una ejecución de Cron como `skipped`.

`openclaw doctor` informa de las tareas que ya tienen configurado `payload.model`, incluidos los recuentos por espacio de nombres del proveedor y las discrepancias con `agents.defaults.model`. Usa esa comprobación cuando el comportamiento de autenticación, proveedor o facturación parezca diferente entre el chat en directo y las tareas programadas.

### Precedencia del modelo de Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Anulación del enlace de Gmail.
2. `--model` por tarea.
3. Anulación de modelo almacenada en la sesión de Cron (cuando el usuario seleccionó una).
4. Selección del modelo del agente o del predeterminado.

### Modo rápido

El modo rápido de Cron aislado sigue la selección resuelta del modelo activo. La configuración del modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación `fastMode` almacenada en la sesión sigue teniendo prioridad sobre la configuración. Cuando el modo resuelto es `auto`, el umbral usa el valor `params.fastAutoOnSeconds` del modelo seleccionado, con un valor predeterminado de 60 segundos.

### Reintentos por cambio de modelo activo

Si una ejecución aislada genera `LiveSessionModelSwitchError`, Cron conserva el proveedor y el modelo cambiados (y la anulación del perfil de autenticación cambiado, si existe) para la ejecución activa antes de reintentar. El bucle externo de reintentos se limita a dos reintentos de cambio después del intento inicial y después se cancela en lugar de repetirse indefinidamente.

## Salida y denegaciones de las ejecuciones

### Supresión de confirmaciones obsoletas

Los turnos aislados de Cron suprimen las respuestas obsoletas que solo contienen una confirmación. Si el primer resultado es únicamente una actualización provisional del estado y ninguna ejecución de un subagente descendiente es responsable de la respuesta final, Cron vuelve a solicitar una vez el resultado real antes de entregarlo.

### Supresión silenciosa de tokens

Si una ejecución aislada de Cron devuelve únicamente el token silencioso (`NO_REPLY` o `no_reply`), Cron suprime tanto la entrega saliente directa como la ruta alternativa de resumen en cola, por lo que no se publica nada en el chat.

### Denegaciones estructuradas

Las ejecuciones aisladas de Cron utilizan los metadatos estructurados de denegación de ejecución de la ejecución integrada (errores fatales de la herramienta de ejecución con los códigos `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) como señal de denegación autoritativa. También reconocen los contenedores `UNAVAILABLE` del host del Node en torno a un error estructurado anidado que contenga uno de esos códigos.

Cron no clasifica como denegaciones el texto en prosa de la salida final ni las frases de rechazo que parezcan solicitudes de aprobación, a menos que la ejecución integrada también proporcione metadatos estructurados de denegación; de este modo, el texto ordinario del asistente no se trata como un comando bloqueado.

`cron list` y el historial de ejecuciones muestran el motivo de la denegación en lugar de indicar que un comando bloqueado tiene el estado `ok`.

## Retención

La retención y la depuración se controlan en la configuración:

- `cron.sessionRetention` (valor predeterminado: `24h`; use `false` para desactivarla) depura las sesiones completadas de ejecuciones aisladas.
- `cron.runLog.keepLines` (valor predeterminado: `2000`) depura por trabajo las filas conservadas del historial de ejecuciones de SQLite. `cron.runLog.maxBytes` (valor predeterminado: `2000000`) se sigue aceptando por compatibilidad con registros de ejecuciones antiguos almacenados en archivos; la depuración de SQLite se basa en el número de filas.

## Migración de trabajos antiguos

<Note>
Si tiene trabajos de Cron anteriores al formato actual de entrega y almacenamiento, ejecute `openclaw doctor --fix`. Doctor normaliza los campos heredados de Cron (`jobId`, `schedule.cron`, los campos de entrega de nivel superior, incluido el `threadId` heredado, y los alias de entrega `provider` de la carga útil) y migra los trabajos de reserva de Webhook con `notify: true` desde `cron.webhook` a una entrega explícita mediante Webhook. Los trabajos que ya realizan anuncios en un chat conservan esa entrega y reciben un destino de Webhook de finalización. Cuando `cron.webhook` no está definido, el marcador inerte de nivel superior `notify` se elimina de los trabajos que no tienen un destino de migración (la entrega existente se conserva sin cambios), por lo que `doctor --fix` deja de generar advertencias repetidas sobre ellos.
</Note>

## Ediciones habituales

Actualice la configuración de entrega sin cambiar el mensaje:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desactive la entrega de un trabajo aislado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Active un contexto de inicialización ligero para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncie en un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Anuncie en un tema de un foro de Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Cree un trabajo aislado con un contexto de inicialización ligero:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` se aplica únicamente a los trabajos aislados de turno del agente. En las ejecuciones de Cron, el modo ligero mantiene vacío el contexto de inicialización en lugar de inyectar el conjunto completo de inicialización del espacio de trabajo.

Cree un trabajo de comandos con valores exactos para argv, cwd, las variables de entorno, la entrada estándar y los límites de salida:

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

## Comandos administrativos habituales

Ejecución e inspección manuales:

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

`openclaw cron list` muestra de forma predeterminada todos los trabajos coincidentes. Pase `--agent <id>` para mostrar únicamente los trabajos cuyo identificador normalizado efectivo del agente coincida; los trabajos que no tengan almacenado un identificador del agente se consideran pertenecientes al agente predeterminado configurado.

`openclaw cron get <job-id>` devuelve directamente el JSON almacenado del trabajo. Use `cron show <job-id>` cuando quiera una vista legible para personas con una vista previa de la ruta de entrega.

`cron list --json` y `cron show <job-id> --json` incluyen en cada trabajo un campo `status` de nivel superior, calculado a partir de `enabled`, `state.runningAtMs` y `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. El estado JSON se mantiene canónico y sin elementos decorativos para que las herramientas externas puedan leer el estado del trabajo sin volver a deducirlo; la salida para personas puede complementar los estados `error` repetidos con un contador de fallos.

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino previsto de Cron, el destino resuelto, los envíos de la herramienta de mensajes, el uso de la ruta alternativa y el estado de entrega.

Redireccionamiento del agente y de la sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` muestra una advertencia cuando se omite `--agent` en los trabajos de turno del agente y utiliza el agente predeterminado (`main`). Pase `--agent <id>` durante la creación para fijar un agente específico.

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Tareas programadas](/es/automation/cron-jobs)
