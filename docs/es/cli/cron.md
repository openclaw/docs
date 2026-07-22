---
read_when:
    - Se necesitan tareas programadas y activaciones.
    - Está depurando la ejecución y los registros de Cron
summary: Referencia de la CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-21T22:38:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0368a02283b0a3e107e6f41b71110d571e097461877ed6aea494614feaa092ca
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestiona las tareas Cron del planificador del Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver todos los comandos disponibles. Consulta [Tareas Cron](/es/automation/cron-jobs) para ver la guía conceptual.
</Tip>

<Note>
Todas las modificaciones de Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) requieren `operator.admin`. Las ejecuciones de cargas útiles de comandos se realizan directamente en el proceso del Gateway, no como una llamada de herramienta `tools.exec` del agente; `tools.exec.*` y las aprobaciones de ejecución siguen rigiendo las herramientas de ejecución visibles para el modelo.
</Note>

## Crear tareas rápidamente

`openclaw cron create` es un alias de `openclaw cron add`. Para las tareas nuevas, indica primero la programación y después la instrucción:

```bash
openclaw cron create "0 7 * * *" \
  "Resume las actualizaciones de la noche." \
  --name "Resumen matutino" \
  --agent ops
```

Usa `--webhook <url>` cuando la tarea deba enviar mediante POST la carga útil finalizada en lugar de entregarla a un destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Resume como JSON los despliegues de hoy." \
  --name "Resumen de despliegues" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` para tareas deterministas de estilo shell que se ejecuten dentro del Cron de OpenClaw sin iniciar una ejecución aislada de agente o modelo:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Sondeo de profundidad de cola" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` para una ejecución exacta de argv. Las tareas de comandos capturan stdout/stderr, registran el historial normal de Cron y encaminan la salida mediante los mismos modos de entrega `announce`, `webhook` o `none` que las tareas aisladas. Se suprime un comando que solo imprime `NO_REPLY`.

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
    Las ejecuciones aisladas restablecen el contexto de conversación del entorno. El enrutamiento de canales y grupos, la política de envío y cola, la elevación, el origen y la vinculación al entorno de ejecución de ACP se restablecen para la nueva ejecución. Las preferencias seguras y las anulaciones de modelo o autenticación seleccionadas explícitamente por el usuario pueden mantenerse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió a partir de la sesión principal o actual, o si se cerrará de forma segura con un error.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio sin resolver. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el Plugin cargado actúan como selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; se rechaza `channel: "whatsapp"` con `to: "telegram:123"`. Los prefijos de servicio, como `imessage:` y `sms:`, siguen siendo sintaxis de destino propia del canal.

<Note>
Las tareas `cron add` aisladas usan de forma predeterminada la entrega `--announce`. Usa `--no-deliver` para mantener la salida interna. `--deliver` se conserva como alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat de tareas Cron aisladas se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente mediante la herramienta `message` cuando hay disponible una ruta de chat.
- `announce` entrega de forma alternativa la respuesta final únicamente cuando el agente no la ha enviado directamente al destino resuelto.
- `webhook` envía la carga útil finalizada a una URL.
- `none` desactiva la entrega alternativa del ejecutor.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` para configurar la entrega mediante Webhook. No combines `--webhook` con opciones de entrega por chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` puede eliminar campos individuales del enrutamiento de entrega con `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` (cada uno se rechaza cuando se combina con su opción de configuración correspondiente). A diferencia de `--no-deliver`, que solo desactiva la entrega alternativa del ejecutor, estas opciones eliminan el campo almacenado para que la tarea vuelva a resolver esa parte de su ruta a partir de los valores predeterminados.

`--announce` es la entrega alternativa del ejecutor para la respuesta final. `--no-deliver` desactiva esa alternativa, pero no elimina la herramienta `message` del agente cuando hay disponible una ruta de chat.

Los recordatorios creados desde un chat activo conservan el destino de entrega del chat en curso para la entrega alternativa de anuncios. Las claves de sesión internas pueden estar en minúsculas; no deben usarse como fuente de verdad para identificadores de proveedor que distinguen entre mayúsculas y minúsculas, como los identificadores de sala de Matrix.

### Entrega de fallos

Las notificaciones de fallos se resuelven en este orden:

1. `delivery.failureDestination` en la tarea.
2. `cron.failureDestination` global.
3. El destino principal de anuncios de la tarea (cuando ninguno de los anteriores se resuelve como un destino concreto).

<Note>
Las tareas de la sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Las tareas aisladas lo aceptan en todos los modos.
</Note>

Las ejecuciones aisladas de Cron tratan los fallos del agente en el ámbito de la ejecución como errores de la tarea, aunque no se produzca ninguna carga útil de respuesta; por tanto, los fallos del modelo o proveedor siguen incrementando los contadores de errores y activando las notificaciones de fallos.

Las tareas Cron de comandos no inician un turno aislado del agente. Un código de salida cero registra `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera sin salida agotado registra `error` y puede activar la misma ruta de notificación de fallos.

Si una ejecución aislada agota el tiempo de espera antes de la primera solicitud al modelo, `openclaw cron show` y `openclaw cron runs` incluyen un error específico de la fase, como `setup timed out before runner start`, o un mensaje de bloqueo que indica la última fase de inicio conocida (por ejemplo, `context-engine`). Para los proveedores respaldados por una CLI, el supervisor previo al modelo permanece activo hasta que se inicia el turno de la CLI externa; de este modo, los bloqueos durante la búsqueda de sesión, los hooks, la autenticación, la instrucción y la configuración de la CLI se notifican como fallos de Cron previos al modelo.

## Programación

### Tareas de una sola ejecución

`--at <datetime>` programa una ejecución única. Las fechas y horas sin desplazamiento se tratan como UTC, salvo que también se proporcione `--tz <iana>`, que interpreta la hora local en la zona horaria indicada.

<Note>
Las tareas de una sola ejecución se eliminan de forma predeterminada tras completarse correctamente. Usa `--keep-after-run` para conservarlas.
</Note>

### Tareas recurrentes

Las tareas recurrentes usan un retroceso exponencial de reintentos después de errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan al retroceso de reintentos, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` permite incluir notificaciones repetidas de ejecuciones omitidas en las alertas de fallos.

Para las tareas aisladas dirigidas a un proveedor de modelos local configurado (URL base en la interfaz de bucle invertido, una red privada o `.local`), Cron ejecuta una comprobación preliminar ligera del proveedor antes de iniciar el turno del agente: los proveedores `api: "ollama"` se sondean en `/api/tags`; los demás proveedores locales compatibles con OpenAI (`api: "openai-completions"`, por ejemplo, vLLM, SGLang y LM Studio) se sondean en `/models`. Si no se puede acceder al punto de conexión, la ejecución se registra como `skipped` y se vuelve a intentar en una programación posterior; el resultado de accesibilidad se almacena en caché durante 5 minutos por punto de conexión para que múltiples tareas dirigidas al mismo servidor local no lo saturen con sondeos repetidos.

Las tareas Cron, el estado pendiente del entorno de ejecución y el historial de ejecuciones se almacenan en la base de datos de estado SQLite compartida. Los archivos heredados `jobs.json`, `<name>-state.json` y `runs/*.jsonl` se importan una vez y se renombran con el sufijo `.migrated`. Después de la importación, edita las programaciones con `openclaw cron add|edit|remove` en lugar de editar archivos JSON.

### Ejecuciones manuales

`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada y regresa en cuanto la ejecución manual queda en cola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa el valor `runId` devuelto para consultar posteriormente el resultado:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Añade `--wait` cuando un script deba bloquearse hasta que esa ejecución exacta en cola registre un estado terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI sigue llamando primero a `cron.run` y después consulta periódicamente `cron.runs` para el valor `runId` devuelto. El comando solo termina con `0` cuando la ejecución finaliza con el estado `ok`. Termina con un código distinto de cero cuando la ejecución finaliza con `error` o `skipped`, cuando la respuesta del Gateway no incluye un `runId`, o cuando vence `--wait-timeout` (valor predeterminado: `10m`; consulta cada `2s` de forma predeterminada). `--poll-interval` debe ser mayor que cero.

<Note>
Usa `--due` cuando se desee que el comando manual se ejecute solo si la tarea debe ejecutarse en ese momento. Si `--due --wait` no pone una ejecución en cola, el comando devuelve la respuesta normal de no ejecución en lugar de iniciar la consulta periódica.
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para la tarea. `cron add|edit --fallbacks <list>` establece modelos alternativos por tarea, por ejemplo, `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; proporciona `--fallbacks ""` para una ejecución estricta sin modelos alternativos. `cron edit <job-id> --clear-fallbacks` elimina la anulación de modelos alternativos por tarea. `cron edit <job-id> --clear-model` elimina la anulación de modelo por tarea para que esta siga la precedencia normal de selección de modelos de Cron (una anulación almacenada en la sesión de Cron, si existe; en caso contrario, el modelo del agente o el predeterminado); no puede combinarse con `--model`. `cron add|edit --thinking <level>` establece una anulación de razonamiento por tarea; `cron edit <job-id> --clear-thinking` la elimina para que la tarea siga la precedencia normal de razonamiento de Cron y no puede combinarse con `--thinking`.

<Warning>
Si el modelo no está permitido o no puede resolverse, Cron marca la ejecución como fallida con un error de validación explícito, en lugar de recurrir a la selección de modelo del agente de la tarea o al modelo predeterminado.
</Warning>

El valor `--model` de Cron es un **modelo principal de la tarea**, no una anulación `/model` de la sesión de chat. Esto significa:

- Los modelos alternativos configurados siguen aplicándose cuando falla el modelo seleccionado para la tarea.
- El valor `fallbacks` de la carga útil por tarea sustituye la lista de modelos alternativos configurada cuando está presente.
- Una lista vacía de modelos alternativos por tarea (`--fallbacks ""` o `fallbacks: []` en la carga útil o API de la tarea) hace que la ejecución de Cron sea estricta.
- Cuando una tarea tiene `--model`, pero no hay ninguna lista de modelos alternativos configurada, OpenClaw proporciona una anulación vacía explícita de modelos alternativos para que el modelo principal del agente no se añada como destino de reintento oculto.
- Las comprobaciones preliminares de proveedores locales recorren los modelos alternativos configurados antes de marcar una ejecución de Cron como `skipped`.

`openclaw doctor` informa de las tareas que ya tienen configurado `payload.model`, incluidos los recuentos por espacio de nombres de proveedor y las discrepancias con `agents.defaults.model`. Usa esta comprobación cuando el comportamiento de autenticación, proveedor o facturación parezca diferente entre el chat en directo y las tareas programadas.

### Precedencia de modelos de Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Anulación del hook de Gmail.
2. `--model` por tarea.
3. Anulación de modelo almacenada en la sesión de Cron (cuando el usuario ha seleccionado una).
4. Selección del modelo del agente o del modelo predeterminado.

### Modo rápido

El modo rápido de cron aislado sigue la selección de modelo en vivo resuelta. La configuración del modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación almacenada de sesión `fastMode` sigue teniendo prioridad sobre la configuración. Cuando el modo resuelto es `auto`, el límite usa el valor `params.fastAutoOnSeconds` del modelo seleccionado, con un valor predeterminado de 60 segundos.

### Reintentos de cambio de modelo en vivo

Si una ejecución aislada genera `LiveSessionModelSwitchError`, cron conserva el proveedor y el modelo cambiados (y la anulación del perfil de autenticación cambiado, cuando está presente) para la ejecución activa antes de volver a intentarlo. El bucle externo de reintentos está limitado a dos reintentos de cambio después del intento inicial y, a continuación, se cancela en lugar de repetirse indefinidamente.

## Salida de ejecución y denegaciones

### Supresión de confirmaciones obsoletas

Los turnos de cron aislados suprimen las respuestas obsoletas que solo contienen una confirmación. Si el primer resultado es únicamente una actualización provisional de estado y ninguna ejecución de subagente descendiente es responsable de la respuesta final, cron vuelve a solicitar una vez el resultado real antes de la entrega.

### Supresión del token silencioso

Si una ejecución de cron aislada devuelve únicamente el token silencioso (`NO_REPLY` o `no_reply`), cron suprime tanto la entrega saliente directa como la ruta alternativa del resumen en cola, por lo que no se publica nada en el chat.

### Denegaciones estructuradas

Las ejecuciones de cron aisladas usan los metadatos estructurados de denegación de ejecución de la ejecución integrada (errores fatales de la herramienta de ejecución con código `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) como señal de denegación autoritativa. También admiten los envoltorios `UNAVAILABLE` del host de Node alrededor de un error estructurado anidado que contiene uno de esos códigos.

Cron no clasifica como denegaciones el texto de la salida final ni las frases de rechazo que parecen solicitar aprobación, salvo que la ejecución integrada también proporcione metadatos estructurados de denegación, por lo que el texto normal del asistente no se trata como un comando bloqueado.

`cron list` y el historial de ejecuciones muestran el motivo de la denegación en lugar de informar de un comando bloqueado como `ok`.

## Retención

Comportamiento de retención:

- `cron.sessionRetention` (valor predeterminado `24h`, o `false` para desactivarlo) elimina las sesiones de ejecuciones aisladas completadas.
- El historial de ejecuciones conserva las 2000 filas terminales más recientes por trabajo de cron. Las filas perdidas mantienen el periodo estándar de limpieza de tareas perdidas de 24 horas.

## Migración de trabajos antiguos

<Note>
Si hay trabajos de cron anteriores al formato actual de entrega y almacenamiento, ejecute `openclaw doctor --fix`. Doctor normaliza los campos de cron heredados (`jobId`, `schedule.cron`, los campos de entrega de nivel superior, incluido el `threadId` heredado, y los alias de entrega `provider` de la carga útil) y migra los trabajos alternativos de Webhook `notify: true` del valor sin procesar retirado `cron.webhook` a una entrega explícita por Webhook antes de eliminar esa clave de configuración. Los trabajos que ya realizan anuncios en un chat conservan esa entrega y reciben un destino de Webhook de finalización. Sin un Webhook heredado, el marcador inerte de nivel superior `notify` se elimina de los trabajos que no tienen un destino de migración (la entrega existente se conserva sin cambios), por lo que `doctor --fix` deja de mostrar advertencias repetidas sobre ellos.
</Note>

## Ediciones comunes

Actualice la configuración de entrega sin cambiar el mensaje:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desactive la entrega de un trabajo aislado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Active el contexto de arranque ligero para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Realice el anuncio en un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Realice el anuncio en un tema de foro de Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Cree un trabajo aislado con contexto de arranque ligero:

```bash
openclaw cron create "0 7 * * *" \
  "Resume las novedades de la noche." \
  --name "Resumen matutino ligero" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` se aplica únicamente a los trabajos aislados de turno del agente. En las ejecuciones de cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

Cree un trabajo de comando con valores exactos de argv, cwd, entorno, stdin y límites de salida:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Exportación de posiciones" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Comandos administrativos comunes

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

`openclaw cron list` muestra los trabajos activados de forma predeterminada. Pase `--all` para incluir los trabajos desactivados, o `--agent <id>` para mostrar únicamente los trabajos cuyo identificador de agente normalizado efectivo coincida; los trabajos sin un identificador de agente almacenado cuentan como pertenecientes al agente predeterminado configurado.

`openclaw cron get <job-id>` devuelve directamente el JSON almacenado del trabajo. Use `cron show <job-id>` cuando se necesite la vista legible para personas con una vista previa de la ruta de entrega.

`cron list --json` y `cron show <job-id> --json` incluyen un campo de nivel superior `status` en cada trabajo, calculado a partir de `enabled`, `state.runningAtMs` y `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. El estado JSON permanece canónico y sin adornos para que las herramientas externas puedan leer el estado del trabajo sin volver a derivarlo; la salida para personas puede complementar los estados `error` repetidos con un recuento de fallos.

Las entradas `cron runs` incluyen diagnósticos de entrega con el destino de cron previsto, el destino resuelto, los envíos de la herramienta de mensajes, el uso de la alternativa y el estado de entrega.

Redirección de agentes y sesiones:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` muestra una advertencia cuando se omite `--agent` en los trabajos de turno del agente y recurre al agente predeterminado (`main`). Pase `--agent <id>` durante la creación para fijar un agente específico.

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
