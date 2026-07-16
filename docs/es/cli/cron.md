---
read_when:
    - Quiere tareas programadas y activaciones.
    - Está depurando la ejecución y los registros de Cron
summary: Referencia de la CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-16T11:31:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestiona trabajos Cron para el planificador del Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver todos los comandos disponibles. Consulta [Trabajos Cron](/es/automation/cron-jobs) para acceder a la guía conceptual.
</Tip>

<Note>
Todas las modificaciones de Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) requieren `operator.admin`. Las ejecuciones con una carga útil de comando se realizan directamente en el proceso del Gateway, no como una llamada de herramienta `tools.exec` de un agente; `tools.exec.*` y las aprobaciones de ejecución siguen rigiendo las herramientas de ejecución visibles para el modelo.
</Note>

## Crear trabajos rápidamente

`openclaw cron create` es un alias de `openclaw cron add`. Para trabajos nuevos, coloca primero la programación y después la instrucción:

```bash
openclaw cron create "0 7 * * *" \
  "Resume las actualizaciones de la noche." \
  --name "Resumen matutino" \
  --agent ops
```

Usa `--webhook <url>` cuando el trabajo deba enviar mediante POST la carga útil terminada en lugar de entregarla a un destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Resume como JSON los despliegues de hoy." \
  --name "Resumen de despliegues" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` para trabajos deterministas de estilo shell que se ejecuten dentro de Cron de OpenClaw sin iniciar una ejecución aislada de agente o modelo:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Sondeo de profundidad de la cola" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` para la ejecución exacta de argv. Los trabajos de comando capturan stdout/stderr, registran el historial normal de Cron y enrutan la salida mediante los mismos modos de entrega `announce`, `webhook` o `none` que los trabajos aislados. Se suprime un comando que solo imprime `NO_REPLY`.

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
    Las ejecuciones aisladas restablecen el contexto de conversación del entorno. El enrutamiento de canales y grupos, la política de envío y colas, la elevación, el origen y la vinculación al entorno de ejecución de ACP se restablecen para la nueva ejecución. Las preferencias seguras y las anulaciones de modelo o autenticación seleccionadas explícitamente por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió desde la sesión principal o actual, o si generará un fallo cerrado.

Los destinos con prefijo de proveedor pueden eliminar la ambigüedad de los canales de anuncio sin resolver. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el Plugin cargado actúan como selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; se rechaza `channel: "whatsapp"` con `to: "telegram:123"`. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo una sintaxis de destino gestionada por el canal.

<Note>
Los trabajos `cron add` aislados usan de forma predeterminada la entrega `--announce`. Usa `--no-deliver` para mantener la salida interna. `--deliver` se conserva como alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat de Cron aislada se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente mediante la herramienta `message` cuando hay disponible una ruta de chat.
- `announce` entrega como alternativa la respuesta final solo cuando el agente no la envió directamente al destino resuelto.
- `webhook` envía la carga útil terminada mediante POST a una URL.
- `none` desactiva la entrega alternativa del ejecutor.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` para configurar la entrega mediante Webhook. No combines `--webhook` con indicadores de entrega por chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` puede eliminar campos individuales de enrutamiento de entrega mediante `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` (cada uno se rechaza cuando se combina con su indicador de configuración correspondiente). A diferencia de `--no-deliver`, que solo desactiva la entrega alternativa del ejecutor, estos eliminan el campo almacenado para que el trabajo vuelva a resolver esa parte de su ruta a partir de los valores predeterminados.

`--announce` es la entrega alternativa del ejecutor para la respuesta final. `--no-deliver` desactiva esa alternativa, pero no elimina la herramienta `message` del agente cuando hay disponible una ruta de chat.

Los recordatorios creados desde un chat activo conservan el destino de entrega del chat en curso para la entrega alternativa de anuncios. Las claves de sesión internas pueden estar en minúsculas; no las uses como fuente de verdad para identificadores de proveedor que distinguen entre mayúsculas y minúsculas, como los identificadores de salas de Matrix.

### Entrega de fallos

Las notificaciones de fallos se resuelven en este orden:

1. `delivery.failureDestination` en el trabajo.
2. `cron.failureDestination` global.
3. El destino de anuncio principal del trabajo (cuando ninguno de los anteriores se resuelve en un destino concreto).

<Note>
Los trabajos de la sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Los trabajos aislados lo aceptan en todos los modos.
</Note>

Las ejecuciones aisladas de Cron tratan los fallos del agente en el nivel de ejecución como errores del trabajo, incluso cuando no se produce una carga útil de respuesta, por lo que los fallos del modelo o proveedor siguen incrementando los contadores de errores y activando las notificaciones de fallos.

Los trabajos de comando de Cron no inician un turno de agente aislado. Un código de salida cero registra `ok`; una salida distinta de cero, una señal, un tiempo de espera agotado o un tiempo de espera sin salida agotado registran `error` y pueden activar la misma ruta de notificación de fallos.

Si una ejecución aislada agota el tiempo de espera antes de la primera solicitud al modelo, `openclaw cron show` y `openclaw cron runs` incluyen un error específico de la fase, como `setup timed out before runner start`, o un mensaje de bloqueo que indica la última fase de inicio conocida (por ejemplo, `context-engine`). Para los proveedores basados en CLI, el supervisor previo al modelo permanece activo hasta que comienza el turno de la CLI externa, por lo que los bloqueos en la búsqueda de sesión, el enlace, la autenticación, la instrucción y la configuración de la CLI se notifican como fallos de Cron previos al modelo.

## Programación

### Trabajos de una sola ejecución

`--at <datetime>` programa una ejecución única. Las fechas y horas sin desplazamiento se tratan como UTC, salvo que también se proporcione `--tz <iana>`, que interpreta la hora local según la zona horaria indicada.

<Note>
De forma predeterminada, los trabajos de una sola ejecución se eliminan tras completarse correctamente. Usa `--keep-after-run` para conservarlos.
</Note>

### Trabajos recurrentes

Los trabajos recurrentes usan un retroceso exponencial de reintentos después de errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan al retroceso de reintentos, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` permite incluir notificaciones reiteradas de ejecuciones omitidas en las alertas de fallos.

Para los trabajos aislados que usan un proveedor de modelos local configurado (URL base en la interfaz de bucle invertido, una red privada o `.local`), Cron realiza una comprobación previa ligera del proveedor antes de iniciar el turno del agente: los proveedores `api: "ollama"` se sondean en `/api/tags`; los demás proveedores locales compatibles con OpenAI (`api: "openai-completions"`, por ejemplo, vLLM, SGLang, LM Studio) se sondean en `/models`. Si no se puede acceder al punto de conexión, la ejecución se registra como `skipped` y se reintenta en una programación posterior; el resultado de accesibilidad se almacena en caché por punto de conexión durante 5 minutos para que muchos trabajos dirigidos al mismo servidor local no lo saturen con sondeos repetidos.

Los trabajos de Cron, el estado pendiente del entorno de ejecución y el historial de ejecuciones se almacenan en la base de datos de estado SQLite compartida. Los archivos heredados `jobs.json`, `<name>-state.json` y `runs/*.jsonl` se importan una vez y se renombran con el sufijo `.migrated`. Después de la importación, edita las programaciones mediante `openclaw cron add|edit|remove` en lugar de editar archivos JSON.

### Ejecuciones manuales

`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada y devuelve el resultado en cuanto la ejecución manual entra en la cola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa el `runId` devuelto para consultar el resultado posteriormente:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Añade `--wait` cuando un script deba bloquearse hasta que esa ejecución exacta en cola registre un estado terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI sigue llamando primero a `cron.run` y después consulta periódicamente `cron.runs` para el `runId` devuelto. El comando solo termina con `0` cuando la ejecución finaliza con el estado `ok`. Termina con un código distinto de cero cuando la ejecución finaliza con `error` o `skipped`, cuando la respuesta del Gateway no incluye un `runId` o cuando vence `--wait-timeout` (valor predeterminado: `10m`, con consultas cada `2s` de forma predeterminada). `--poll-interval` debe ser mayor que cero.

<Note>
Usa `--due` cuando se quiera que el comando manual se ejecute solo si el trabajo está pendiente en ese momento. Si `--due --wait` no pone una ejecución en cola, el comando devuelve la respuesta normal de no ejecución en lugar de consultar periódicamente.
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para el trabajo. `cron add|edit --fallbacks <list>` establece modelos alternativos por trabajo, por ejemplo, `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; proporciona `--fallbacks ""` para una ejecución estricta sin alternativas. `cron edit <job-id> --clear-fallbacks` elimina la anulación de alternativas por trabajo. `cron edit <job-id> --clear-model` elimina la anulación de modelo por trabajo para que este siga la precedencia normal de selección de modelos de Cron (una anulación almacenada de la sesión de Cron, si existe; de lo contrario, el modelo del agente o el predeterminado); no se puede combinar con `--model`. `cron add|edit --thinking <level>` establece una anulación del razonamiento por trabajo; `cron edit <job-id> --clear-thinking` la elimina para que el trabajo siga la precedencia normal de razonamiento de Cron y no se puede combinar con `--thinking`.

<Warning>
Si el modelo no está permitido o no se puede resolver, Cron marca la ejecución como fallida con un error de validación explícito, en lugar de recurrir a la selección del modelo del agente del trabajo o del modelo predeterminado.
</Warning>

El `--model` de Cron es un **modelo principal del trabajo**, no una anulación de `/model` de la sesión de chat. Esto significa lo siguiente:

- Las alternativas de modelo configuradas siguen aplicándose cuando falla el modelo seleccionado para el trabajo.
- La carga útil `fallbacks` por trabajo sustituye la lista de alternativas configurada cuando está presente.
- Una lista vacía de alternativas por trabajo (`--fallbacks ""` o `fallbacks: []` en la carga útil o API del trabajo) hace que la ejecución de Cron sea estricta.
- Cuando un trabajo tiene `--model`, pero no hay ninguna lista de alternativas configurada, OpenClaw proporciona una anulación de alternativas vacía explícita para que el modelo principal del agente no se añada como destino de reintento oculto.
- Las comprobaciones previas del proveedor local recorren las alternativas configuradas antes de marcar una ejecución de Cron como `skipped`.

`openclaw doctor` informa de los trabajos que ya tienen establecido `payload.model`, incluidos los recuentos de espacios de nombres de proveedores y las discrepancias con `agents.defaults.model`. Usa esa comprobación cuando el comportamiento de autenticación, proveedor o facturación parezca distinto entre el chat en directo y los trabajos programados.

### Precedencia del modelo de Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Anulación del enlace de Gmail.
2. `--model` por trabajo.
3. Anulación de modelo almacenada de la sesión de Cron (cuando el usuario haya seleccionado una).
4. Selección del modelo del agente o del modelo predeterminado.

### Modo rápido

El modo rápido de Cron aislado sigue la selección de modelo activa resuelta. La configuración del modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación almacenada de la sesión `fastMode` sigue teniendo prioridad sobre la configuración. Cuando el modo resuelto es `auto`, el límite usa el valor `params.fastAutoOnSeconds` del modelo seleccionado, con un valor predeterminado de 60 segundos.

### Reintentos al cambiar el modelo activo

Si una ejecución aislada genera `LiveSessionModelSwitchError`, Cron conserva el proveedor y el modelo seleccionados tras el cambio (así como la anulación del perfil de autenticación seleccionado tras el cambio, si está presente) para la ejecución activa antes de volver a intentarlo. El bucle externo de reintentos se limita a dos reintentos de cambio después del intento inicial y luego se cancela en lugar de continuar indefinidamente.

## Resultados de ejecución y denegaciones

### Supresión de confirmaciones obsoletas

Los turnos de Cron aislados suprimen las respuestas obsoletas que solo contienen una confirmación. Si el primer resultado es únicamente una actualización provisional de estado y ninguna ejecución de un subagente descendiente es responsable de la respuesta final, Cron vuelve a solicitar una vez el resultado real antes de entregarlo.

### Supresión del token silencioso

Si una ejecución de Cron aislada devuelve únicamente el token silencioso (`NO_REPLY` o `no_reply`), Cron suprime tanto la entrega saliente directa como la ruta alternativa del resumen en cola, por lo que no se publica nada en el chat.

### Denegaciones estructuradas

Las ejecuciones de Cron aisladas usan los metadatos estructurados de denegación de ejecución de la ejecución integrada (errores fatales de la herramienta de ejecución con los códigos `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) como señal de denegación autoritativa. También admiten contenedores `UNAVAILABLE` del host Node alrededor de un error estructurado anidado que incluya uno de esos códigos.

Cron no clasifica como denegaciones el texto de la salida final ni las frases de rechazo que parezcan solicitar aprobación, salvo que la ejecución integrada también proporcione metadatos estructurados de denegación, por lo que el texto normal del asistente no se trata como un comando bloqueado.

`cron list` y el historial de ejecuciones muestran el motivo de la denegación en lugar de informar de un comando bloqueado como `ok`.

## Retención

Comportamiento de retención:

- `cron.sessionRetention` (valor predeterminado: `24h`; use `false` para desactivarlo) elimina las sesiones completadas de ejecuciones aisladas.
- El historial de ejecuciones conserva las 2000 filas terminales más recientes por trabajo de Cron. Las filas perdidas mantienen el periodo estándar de limpieza de tareas perdidas de 24 horas.

## Migración de trabajos antiguos

<Note>
Si hay trabajos de Cron anteriores al formato actual de almacenamiento y entrega, ejecute `openclaw doctor --fix`. Doctor normaliza los campos heredados de Cron (`jobId`, `schedule.cron`, los campos de entrega de nivel superior, incluido el campo heredado `threadId`, y los alias de entrega `provider` de la carga útil) y migra los trabajos alternativos de Webhook `notify: true` de `cron.webhook` a una entrega explícita mediante Webhook. Los trabajos que ya envían avisos a un chat conservan esa entrega y reciben un destino de Webhook de finalización. Cuando `cron.webhook` no está configurado, se elimina el marcador inerte de nivel superior `notify` de los trabajos que no tienen un destino de migración (la entrega existente se conserva sin cambios), por lo que `doctor --fix` deja de mostrar advertencias repetidas sobre ellos.
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

Active el contexto ligero de arranque para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Envíe un aviso a un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Envíe un aviso a un tema de foro de Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Cree un trabajo aislado con contexto ligero de arranque:

```bash
openclaw cron create "0 7 * * *" \
  "Resumir las actualizaciones de la noche." \
  --name "Resumen matutino ligero" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` se aplica únicamente a los trabajos aislados de turno del agente. En las ejecuciones de Cron, el modo ligero mantiene vacío el contexto de arranque en lugar de insertar el conjunto completo de arranque del espacio de trabajo.

Cree un trabajo de comando con valores exactos de argv, cwd, entorno, entrada estándar y límites de salida:

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

## Comandos habituales de administración

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

`openclaw cron list` muestra de forma predeterminada todos los trabajos coincidentes. Proporcione `--agent <id>` para mostrar únicamente los trabajos cuyo identificador normalizado efectivo de agente coincida; los trabajos sin un identificador de agente almacenado se consideran pertenecientes al agente predeterminado configurado.

`openclaw cron get <job-id>` devuelve directamente el JSON almacenado del trabajo. Use `cron show <job-id>` cuando se necesite una vista legible con una vista previa de la ruta de entrega.

`cron list --json` y `cron show <job-id> --json` incluyen un campo de nivel superior `status` en cada trabajo, calculado a partir de `enabled`, `state.runningAtMs` y `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. El estado JSON permanece canónico y sin elementos decorativos para que las herramientas externas puedan leer el estado del trabajo sin volver a derivarlo; la salida legible puede decorar los estados `error` repetidos con un recuento de errores.

Las entradas `cron runs` incluyen diagnósticos de entrega con el destino de Cron previsto, el destino resuelto, los envíos de la herramienta de mensajes, el uso de la alternativa y el estado de entrega.

Cambio de destino del agente y de la sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` muestra una advertencia cuando se omite `--agent` en trabajos de turno del agente y recurre al agente predeterminado (`main`). Proporcione `--agent <id>` al crear el trabajo para fijar un agente específico.

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
