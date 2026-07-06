---
read_when:
    - Quieres tareas programadas y activaciones
    - Estás depurando la ejecución de Cron y los registros
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-07-06T10:47:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Administra trabajos cron para el programador del Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver toda la superficie de comandos. Consulta [Trabajos Cron](/es/automation/cron-jobs) para la guía conceptual.
</Tip>

<Note>
Todas las mutaciones de cron (`add`/`create`, `update`/`edit`, `remove`, `run`) requieren `operator.admin`. Las ejecuciones de payloads de comando se ejecutan directamente en el proceso del Gateway, no como una llamada de herramienta `tools.exec` de agente; `tools.exec.*` y las aprobaciones de exec siguen rigiendo las herramientas exec visibles para el modelo.
</Note>

## Crear trabajos rápidamente

`openclaw cron create` es un alias de `openclaw cron add`. Para trabajos nuevos, coloca primero la programación y después el prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Usa `--webhook <url>` cuando el trabajo deba hacer POST del payload finalizado en lugar de entregarlo a un destino de chat:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Usa `--command` para trabajos deterministas de estilo shell que se ejecutan dentro de OpenClaw cron sin iniciar una ejecución aislada de agente/modelo:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` almacena `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` para una ejecución argv exacta. Los trabajos de comando capturan stdout/stderr, registran el historial cron normal y enrutan la salida mediante los mismos modos de entrega `announce`, `webhook` o `none` que los trabajos aislados. Se suprime un comando que imprime solo `NO_REPLY`.

## Sesiones

`--session` acepta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Claves de sesión">
    - `main` se vincula a la sesión principal del agente.
    - `isolated` crea una transcripción nueva y un id de sesión para cada ejecución.
    - `current` se vincula a la sesión activa en el momento de la creación.
    - `session:<id>` fija una clave de sesión persistente explícita.

  </Accordion>
  <Accordion title="Semántica de sesiones aisladas">
    Las ejecuciones aisladas restablecen el contexto de conversación ambiental. El enrutamiento de canal y grupo, la política de envío/cola, la elevación, el origen y la vinculación de runtime ACP se restablecen para la nueva ejecución. Las preferencias seguras y las anulaciones explícitas de modelo o autenticación seleccionadas por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió desde la sesión principal o actual, o si fallará de forma cerrada.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio no resueltos. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo sintaxis de destino propiedad del canal.

<Note>
Los trabajos `cron add` aislados usan de forma predeterminada la entrega `--announce`. Usa `--no-deliver` para mantener la salida interna. `--deliver` permanece como un alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat de cron aislado se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente usando la herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como fallback la respuesta final solo cuando el agente no envió directamente al destino resuelto.
- `webhook` publica el payload finalizado en una URL.
- `none` desactiva la entrega fallback del ejecutor.

Usa `cron add|create --webhook <url>` o `cron edit <job-id> --webhook <url>` para configurar la entrega por Webhook. No combines `--webhook` con flags de entrega de chat como `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` o `--account`.

`cron edit <job-id>` puede borrar campos individuales de enrutamiento de entrega con `--clear-channel`, `--clear-to`, `--clear-thread-id` y `--clear-account` (cada uno se rechaza cuando se combina con su flag de establecimiento correspondiente). A diferencia de `--no-deliver`, que solo desactiva la entrega fallback del ejecutor, estos eliminan el campo almacenado para que el trabajo vuelva a resolver esa parte de su ruta desde los valores predeterminados.

`--announce` es la entrega fallback del ejecutor para la respuesta final. `--no-deliver` desactiva ese fallback, pero no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Los recordatorios creados desde un chat activo conservan el destino de entrega del chat en vivo para la entrega fallback de anuncio. Las claves internas de sesión pueden estar en minúsculas; no las uses como fuente de verdad para IDs de proveedor sensibles a mayúsculas y minúsculas, como IDs de salas de Matrix.

### Entrega de fallos

Las notificaciones de fallo se resuelven en este orden:

1. `delivery.failureDestination` en el trabajo.
2. `cron.failureDestination` global.
3. El destino de anuncio principal del trabajo (cuando ninguno de los anteriores se resuelve a un destino concreto).

<Note>
Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Los trabajos aislados lo aceptan en todos los modos.
</Note>

Las ejecuciones cron aisladas tratan los fallos de agente a nivel de ejecución como errores del trabajo incluso cuando no se produce ningún payload de respuesta, por lo que los fallos de modelo/proveedor siguen incrementando los contadores de error y activando notificaciones de fallo.

Los trabajos cron de comando no inician un turno de agente aislado. Un código de salida cero registra `ok`; una salida distinta de cero, señal, timeout o timeout sin salida registra `error` y puede activar la misma ruta de notificación de fallos.

Si una ejecución aislada agota el tiempo antes de la primera solicitud al modelo, `openclaw cron show` y `openclaw cron runs` incluyen un error específico de fase como `setup timed out before runner start` o un mensaje de bloqueo que nombra la última fase de inicio conocida (por ejemplo `context-engine`). Para proveedores respaldados por CLI, el watchdog previo al modelo permanece activo hasta que comienza el turno de CLI externo, por lo que bloqueos en búsqueda de sesión, hook, autenticación, prompt y configuración de CLI se reportan como fallos cron previos al modelo.

## Programación

### Trabajos de una sola ejecución

`--at <datetime>` programa una ejecución única. Las fechas y horas sin offset se tratan como UTC salvo que también pases `--tz <iana>`, que interpreta la hora de reloj en la zona horaria indicada.

<Note>
Los trabajos de una sola ejecución se eliminan después del éxito de forma predeterminada. Usa `--keep-after-run` para conservarlos.
</Note>

### Trabajos recurrentes

Los trabajos recurrentes usan backoff exponencial de reintento tras errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan el backoff de reintento, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` puede hacer que las alertas de fallo incluyan notificaciones repetidas de ejecuciones omitidas.

Para trabajos aislados que apuntan a un proveedor de modelo configurado localmente (URL base en loopback, una red privada o `.local`), cron ejecuta una precomprobación ligera del proveedor antes de iniciar el turno del agente: los proveedores `api: "ollama"` se prueban en `/api/tags`; otros proveedores locales compatibles con OpenAI (`api: "openai-completions"`, por ejemplo vLLM, SGLang, LM Studio) se prueban en `/models`. Si el endpoint no es alcanzable, la ejecución se registra como `skipped` y se reintenta en una programación posterior; el resultado de alcanzabilidad se almacena en caché por endpoint durante 5 minutos para que muchos trabajos contra el mismo servidor local no lo saturen con pruebas repetidas.

Los trabajos cron, el estado de runtime pendiente y el historial de ejecuciones viven en la base de datos de estado SQLite compartida. Los archivos heredados `jobs.json`, `<name>-state.json` y `runs/*.jsonl` se importan una vez y se renombran con un sufijo `.migrated`. Después de la importación, edita las programaciones con `openclaw cron add|edit|remove` en lugar de editar archivos JSON.

### Ejecuciones manuales

`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada y devuelve en cuanto la ejecución manual se encola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa el `runId` devuelto para inspeccionar el resultado posterior:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Agrega `--wait` cuando un script deba bloquearse hasta que esa ejecución encolada exacta registre un estado terminal:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Con `--wait`, la CLI sigue llamando primero a `cron.run` y luego consulta `cron.runs` para el `runId` devuelto. El comando sale con `0` solo cuando la ejecución termina con estado `ok`. Sale con un valor distinto de cero cuando la ejecución termina con `error` o `skipped`, cuando la respuesta del Gateway no incluye un `runId` o cuando vence `--wait-timeout` (valor predeterminado `10m`, consultado cada `2s` de forma predeterminada). `--poll-interval` debe ser mayor que cero.

<Note>
Usa `--due` cuando quieras que el comando manual se ejecute solo si el trabajo vence actualmente. Si `--due --wait` no encola una ejecución, el comando devuelve la respuesta normal sin ejecución en lugar de consultar.
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para el trabajo. `cron add|edit --fallbacks <list>` configura modelos fallback por trabajo, por ejemplo `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; pasa `--fallbacks ""` para una ejecución estricta sin fallbacks. `cron edit <job-id> --clear-fallbacks` elimina la anulación de fallback por trabajo. `cron edit <job-id> --clear-model` elimina la anulación de modelo por trabajo para que el trabajo siga la precedencia normal de selección de modelo de cron (una anulación de sesión cron almacenada si existe, de lo contrario el agente/modelo predeterminado); no puede combinarse con `--model`. `cron add|edit --thinking <level>` configura una anulación de thinking por trabajo; `cron edit <job-id> --clear-thinking` la elimina para que el trabajo siga la precedencia normal de thinking de cron, y no puede combinarse con `--thinking`.

<Warning>
Si el modelo no está permitido o no puede resolverse, cron falla la ejecución con un error de validación explícito en lugar de recurrir al agente del trabajo o a la selección de modelo predeterminada.
</Warning>

Cron `--model` es un **primario de trabajo**, no una anulación de `/model` de sesión de chat. Eso significa:

- Los fallbacks de modelo configurados siguen aplicándose cuando falla el modelo de trabajo seleccionado.
- El payload `fallbacks` por trabajo reemplaza la lista de fallback configurada cuando está presente.
- Una lista de fallback por trabajo vacía (`--fallbacks ""` o `fallbacks: []` en el payload/API del trabajo) hace que la ejecución cron sea estricta.
- Cuando un trabajo tiene `--model` pero no hay una lista de fallback configurada, OpenClaw pasa una anulación de fallback vacía explícita para que el primario del agente no se agregue como destino de reintento oculto.
- Las comprobaciones de preflight de proveedores locales recorren los fallbacks configurados antes de marcar una ejecución cron como `skipped`.

`openclaw doctor` informa trabajos que ya tienen `payload.model` configurado, incluidos conteos de namespaces de proveedor y discrepancias frente a `agents.defaults.model`. Usa esa comprobación cuando el comportamiento de autenticación, proveedor o facturación parezca distinto entre el chat en vivo y los trabajos programados.

### Precedencia de modelo de cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Anulación de hook de Gmail.
2. `--model` por trabajo.
3. Anulación de modelo de sesión cron almacenada (cuando el usuario seleccionó una).
4. Selección de agente o modelo predeterminado.

### Modo rápido

El modo rápido de cron aislado sigue la selección de modelo en vivo resuelta. La configuración de modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación de sesión `fastMode` almacenada sigue teniendo prioridad sobre la configuración. Cuando el modo resuelto es `auto`, el umbral usa el valor `params.fastAutoOnSeconds` del modelo seleccionado, con un valor predeterminado de 60 segundos.

### Reintentos de cambio de modelo en vivo

Si una ejecución aislada lanza `LiveSessionModelSwitchError`, cron persiste el proveedor y modelo cambiados (y la anulación de perfil de autenticación cambiada cuando esté presente) para la ejecución activa antes de reintentar. El bucle externo de reintento se limita a dos reintentos de cambio después del intento inicial y luego aborta en lugar de iterar indefinidamente.

## Salida de ejecución y denegaciones

### Supresión de acuses obsoletos

Los turnos de cron aislado suprimen respuestas obsoletas que solo son acuses. Si el primer resultado es solo una actualización de estado provisional y ninguna ejecución de subagente descendiente es responsable de la respuesta final, cron vuelve a solicitar una vez el resultado real antes de la entrega.

### Supresión del token silencioso

Si una ejecución de cron aislada devuelve solo el token silencioso (`NO_REPLY` o `no_reply`), cron suprime tanto la entrega saliente directa como la ruta alternativa de resumen en cola, por lo que no se publica nada de vuelta en el chat.

### Denegaciones estructuradas

Las ejecuciones de cron aisladas usan metadatos estructurados de denegación de ejecución de la ejecución integrada (errores fatales de herramienta de ejecución codificados como `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`) como señal de denegación autoritativa. También respetan envoltorios `UNAVAILABLE` del host de Node alrededor de un error estructurado anidado que contiene uno de esos códigos.

Cron no clasifica la prosa de salida final ni las frases de rechazo con apariencia de aprobación como denegaciones, a menos que la ejecución integrada también proporcione metadatos estructurados de denegación, por lo que el texto ordinario del asistente no se trata como un comando bloqueado.

`cron list` y el historial de ejecuciones muestran el motivo de denegación en lugar de informar un comando bloqueado como `ok`.

## Retención

La retención y el recorte se controlan en la configuración:

- `cron.sessionRetention` (valor predeterminado `24h`, o `false` para desactivar) recorta las sesiones de ejecución aislada completadas.
- `cron.runLog.keepLines` (valor predeterminado `2000`) recorta las filas retenidas del historial de ejecuciones de SQLite por trabajo. `cron.runLog.maxBytes` (valor predeterminado `2000000`) sigue aceptándose por compatibilidad con registros de ejecuciones antiguos respaldados por archivos; el recorte de SQLite se basa en el recuento de filas.

## Migrar trabajos antiguos

<Note>
Si tienes trabajos de cron anteriores al formato actual de entrega y almacenamiento, ejecuta `openclaw doctor --fix`. Doctor normaliza campos de cron heredados (`jobId`, `schedule.cron`, campos de entrega de nivel superior, incluido el `threadId` heredado, alias de entrega `provider` de carga útil) y migra trabajos de reserva de Webhook con `notify: true` desde `cron.webhook` a una entrega Webhook explícita. Los trabajos que ya anuncian a un chat conservan esa entrega y reciben un destino de Webhook de finalización. Cuando `cron.webhook` no está definido, el marcador inerte de nivel superior `notify` se elimina para trabajos sin destino de migración (la entrega existente se conserva sin cambios), por lo que `doctor --fix` ya no vuelve a advertir sobre ellos.
</Note>

## Ediciones comunes

Actualiza la configuración de entrega sin cambiar el mensaje:

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

Anuncia a un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Anuncia a un tema de foro de Telegram:

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

`--light-context` se aplica solo a trabajos aislados de turno de agente. Para ejecuciones de cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

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

`openclaw cron get <job-id>` devuelve directamente el JSON del trabajo almacenado. Usa `cron show <job-id>` cuando quieras la vista legible por humanos con una vista previa de la ruta de entrega.

`cron list --json` y `cron show <job-id> --json` incluyen un campo `status` de nivel superior en cada trabajo, calculado a partir de `enabled`, `state.runningAtMs` y `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. El estado JSON permanece canónico y sin decorar para que las herramientas externas puedan leer el estado del trabajo sin volver a derivarlo; la salida humana puede decorar estados `error` repetidos con un recuento de fallos.

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino de cron previsto, el destino resuelto, envíos de herramienta de mensajes, uso de alternativa y estado entregado.

Redirección de agente y sesión:

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
