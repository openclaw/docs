---
read_when:
    - Quieres tareas programadas y activaciones
    - Está depurando la ejecución de Cron y los registros
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-05-11T20:26:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad261871e48704061be7147f0a2722001cdc7e95156c0dc44f46c41d7e415cc6
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestiona trabajos Cron para el programador del Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver toda la superficie de comandos. Consulta [Trabajos Cron](/es/automation/cron-jobs) para la guía conceptual.
</Tip>

## Sesiones

`--session` acepta `main`, `isolated`, `current` o `session:<id>`.

<AccordionGroup>
  <Accordion title="Claves de sesión">
    - `main` se vincula a la sesión principal del agente.
    - `isolated` crea una transcripción nueva y un id de sesión para cada ejecución.
    - `current` se vincula a la sesión activa en el momento de la creación.
    - `session:<id>` fija una clave de sesión persistente explícita.

  </Accordion>
  <Accordion title="Semántica de sesión aislada">
    Las ejecuciones aisladas restablecen el contexto de conversación ambiental. El enrutamiento de canal y grupo, la política de envío/cola, la elevación, el origen y el enlace de runtime de ACP se restablecen para la nueva ejecución. Las preferencias seguras y las anulaciones explícitas de modelo o autenticación seleccionadas por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` previsualizan la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió desde la sesión principal o actual, o si fallará de forma cerrada.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio no resueltos. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo sintaxis de destino propiedad del canal.

<Note>
Los trabajos aislados de `cron add` usan entrega `--announce` de forma predeterminada. Usa `--no-deliver` para mantener la salida interna. `--deliver` permanece como alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat Cron aislada se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente usando la herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como respaldo la respuesta final solo cuando el agente no envió directamente al destino resuelto.
- `webhook` publica la carga útil finalizada en una URL.
- `none` desactiva la entrega de respaldo del ejecutor.

`--announce` es la entrega de respaldo del ejecutor para la respuesta final. `--no-deliver` desactiva ese respaldo, pero no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Los recordatorios creados desde un chat activo conservan el destino de entrega del chat en vivo para la entrega de anuncio de respaldo. Las claves de sesión internas pueden estar en minúsculas; no las uses como fuente de verdad para IDs de proveedor sensibles a mayúsculas y minúsculas, como los IDs de sala de Matrix.

### Entrega de fallos

Las notificaciones de fallo se resuelven en este orden:

1. `delivery.failureDestination` en el trabajo.
2. `cron.failureDestination` global.
3. El destino de anuncio principal del trabajo (cuando no se define un destino de fallo explícito).

<Note>
Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Los trabajos aislados lo aceptan en todos los modos.
</Note>

Nota: las ejecuciones Cron aisladas tratan los fallos de agente a nivel de ejecución como errores del trabajo incluso cuando
no se produce una carga útil de respuesta, por lo que los fallos de modelo/proveedor siguen incrementando los contadores de error
y activan notificaciones de fallo.

Si una ejecución aislada agota el tiempo antes de la primera solicitud al modelo, `openclaw cron show`
y `openclaw cron runs` incluyen un error específico de fase como
`setup timed out before runner start` o
`stalled before first model call (last phase: context-engine)`.
Para proveedores respaldados por CLI, el watchdog previo al modelo permanece activo hasta que comienza el turno de la CLI externa,
por lo que los bloqueos en búsqueda de sesión, hook, autenticación, prompt y configuración de CLI
se informan como fallos Cron previos al modelo.

## Programación

### Trabajos de una sola ejecución

`--at <datetime>` programa una ejecución de una sola vez. Las fechas y horas sin desplazamiento se tratan como UTC salvo que también pases `--tz <iana>`, que interpreta la hora de reloj en la zona horaria indicada.

<Note>
Los trabajos de una sola ejecución se eliminan tras completarse correctamente de forma predeterminada. Usa `--keep-after-run` para conservarlos.
</Note>

### Trabajos recurrentes

Los trabajos recurrentes usan retroceso exponencial de reintento tras errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad tras la siguiente ejecución correcta.

Las ejecuciones omitidas se rastrean por separado de los errores de ejecución. No afectan al retroceso de reintento, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` puede hacer que las alertas de fallo incluyan notificaciones repetidas de ejecuciones omitidas.

Para trabajos aislados que apuntan a un proveedor de modelo local configurado, Cron ejecuta una prevalidación ligera del proveedor antes de iniciar el turno del agente. Los proveedores `api: "ollama"` de loopback, red privada y `.local` se sondean en `/api/tags`; los proveedores locales compatibles con OpenAI, como vLLM, SGLang y LM Studio, se sondean en `/models`. Si el endpoint no está accesible, la ejecución se registra como `skipped` y se reintenta en una programación posterior; los endpoints inactivos coincidentes se almacenan en caché durante 5 minutos para evitar que muchos trabajos saturen el mismo servidor local.

Nota: las definiciones de trabajos Cron viven en `jobs.json`, mientras que el estado de runtime pendiente vive en `jobs-state.json`. Si `jobs.json` se edita externamente, el Gateway recarga las programaciones cambiadas y borra los espacios pendientes obsoletos; las reescrituras solo de formato no borran el espacio pendiente.

### Ejecuciones manuales

`openclaw cron run` devuelve tan pronto como la ejecución manual queda en cola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` para seguir el resultado eventual.

<Note>
`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada. Usa `--due` para conservar el comportamiento anterior de "ejecutar solo si vence".
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para el trabajo.

<Warning>
Si el modelo no está permitido o no puede resolverse, Cron falla la ejecución con un error de validación explícito en lugar de recurrir al agente del trabajo o a la selección de modelo predeterminada.
</Warning>

Cron `--model` es un **principal del trabajo**, no una anulación `/model` de sesión de chat. Eso significa:

- Los fallbacks de modelo configurados siguen aplicándose cuando falla el modelo de trabajo seleccionado.
- La carga útil por trabajo `fallbacks` reemplaza la lista de fallback configurada cuando está presente.
- Una lista de fallback por trabajo vacía (`fallbacks: []` en la carga útil/API del trabajo) hace que la ejecución Cron sea estricta.
- Cuando un trabajo tiene `--model` pero no hay lista de fallback configurada, OpenClaw pasa una anulación de fallback vacía explícita para que el principal del agente no se añada como destino de reintento oculto.

### Precedencia de modelo en Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Anulación de hook de Gmail.
2. `--model` por trabajo.
3. Anulación de modelo almacenada de la sesión Cron (cuando el usuario seleccionó una).
4. Selección de modelo del agente o predeterminada.

### Modo rápido

El modo rápido de Cron aislado sigue la selección de modelo en vivo resuelta. La configuración de modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación `fastMode` de sesión almacenada sigue prevaleciendo sobre la configuración.

### Reintentos de cambio de modelo en vivo

Si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron persiste el proveedor y el modelo cambiados (y la anulación de perfil de autenticación cambiada, cuando está presente) para la ejecución activa antes de reintentar. El bucle externo de reintento está limitado a dos reintentos de cambio tras el intento inicial, y luego aborta en lugar de repetirse indefinidamente.

## Salida de ejecución y denegaciones

### Supresión de acuses obsoletos

Los turnos Cron aislados suprimen respuestas obsoletas que solo son acuses. Si el primer resultado es solo una actualización de estado intermedia y ninguna ejecución de subagente descendiente es responsable de la respuesta eventual, Cron vuelve a solicitar una vez el resultado real antes de la entrega.

### Supresión de token silencioso

Si una ejecución Cron aislada devuelve solo el token silencioso (`NO_REPLY` o `no_reply`), Cron suprime tanto la entrega saliente directa como la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta al chat.

### Denegaciones estructuradas

Las ejecuciones Cron aisladas prefieren metadatos estructurados de denegación de ejecución de la ejecución incrustada y luego recurren a marcadores de denegación conocidos en la salida final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` y frases de rechazo de enlace de aprobación.

`cron list` y el historial de ejecuciones muestran el motivo de denegación en lugar de informar un comando bloqueado como `ok`.

## Retención

La retención y la poda se controlan en la configuración:

- `cron.sessionRetention` (predeterminado `24h`) poda las sesiones completadas de ejecución aislada.
- `cron.runLog.maxBytes` y `cron.runLog.keepLines` podan `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migración de trabajos antiguos

<Note>
Si tienes trabajos Cron de antes del formato actual de entrega y almacenamiento, ejecuta `openclaw doctor --fix`. Doctor normaliza campos Cron heredados (`jobId`, `schedule.cron`, campos de entrega de nivel superior, incluido `threadId` heredado, alias de entrega `provider` de carga útil) y migra trabajos simples de fallback Webhook con `notify: true` a entrega Webhook explícita cuando `cron.webhook` está configurado.
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
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos de turno de agente aislados. Para ejecuciones Cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

## Comandos de administración comunes

Ejecución manual e inspección:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` muestra todos los trabajos coincidentes de forma predeterminada. Pasa `--agent <id>` para mostrar solo los trabajos cuyo id de agente normalizado efectivo coincida; los trabajos sin id de agente almacenado cuentan como el agente predeterminado configurado.

`openclaw cron get <job-id>` devuelve directamente el JSON del trabajo almacenado. Usa `cron show <job-id>` cuando quieras la vista legible por humanos con vista previa de ruta de entrega.

`cron list --json` y `cron show <job-id> --json` incluyen un campo `status` de nivel superior en cada trabajo, calculado a partir de `enabled`, `state.runningAtMs` y `state.lastRunStatus`. Valores: `disabled`, `running`, `ok`, `error`, `skipped` o `idle`. Esto refleja la columna de estado legible por humanos para que las herramientas externas puedan leer el estado del trabajo sin volver a derivarlo.

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino Cron previsto, el destino resuelto, envíos de la herramienta de mensajes, uso de fallback y estado entregado.

Redireccionamiento de agente y sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` advierte cuando `--agent` se omite en trabajos de turno de agente y recurre al agente predeterminado (`main`). Pasa `--agent <id>` en el momento de creación para fijar un agente específico.

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tareas programadas](/es/automation/cron-jobs)
