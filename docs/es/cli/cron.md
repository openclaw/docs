---
read_when:
    - Quieres tareas programadas y activaciones
    - Estás depurando la ejecución de cron y los registros
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Administra trabajos de Cron para el programador de Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver la interfaz completa de comandos. Consulta [trabajos de Cron](/es/automation/cron-jobs) para la guía conceptual.
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
    Las ejecuciones aisladas restablecen el contexto de conversación ambiental. El enrutamiento de canal y grupo, la política de envío/cola, la elevación, el origen y la vinculación del runtime ACP se restablecen para la nueva ejecución. Las preferencias seguras y las anulaciones explícitas de modelo o autenticación seleccionadas por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` previsualizan la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió desde la sesión principal o actual, o si fallará de forma cerrada.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio no resueltos. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo sintaxis de destino propiedad del canal.

<Note>
Los trabajos `cron add` aislados usan entrega `--announce` de forma predeterminada. Usa `--no-deliver` para mantener la salida interna. `--deliver` permanece como alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat de Cron aislado se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente mediante la herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como alternativa la respuesta final solo cuando el agente no envió directamente al destino resuelto.
- `webhook` publica la carga útil finalizada en una URL.
- `none` desactiva la entrega alternativa del ejecutor.

`--announce` es la entrega alternativa del ejecutor para la respuesta final. `--no-deliver` desactiva esa alternativa, pero no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Los recordatorios creados desde un chat activo conservan el destino de entrega del chat en vivo para la entrega alternativa de anuncio. Las claves de sesión internas pueden estar en minúsculas; no las uses como fuente de verdad para IDs de proveedor sensibles a mayúsculas y minúsculas, como los IDs de sala de Matrix.

### Entrega de fallos

Las notificaciones de fallo se resuelven en este orden:

1. `delivery.failureDestination` en el trabajo.
2. `cron.failureDestination` global.
3. El destino principal de anuncio del trabajo (cuando no se define un destino de fallo explícito).

<Note>
Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Los trabajos aislados lo aceptan en todos los modos.
</Note>

Nota: las ejecuciones de Cron aisladas tratan los fallos de agente a nivel de ejecución como errores de trabajo incluso cuando
no se produce una carga útil de respuesta, por lo que los fallos de modelo/proveedor siguen incrementando los contadores de error
y activando notificaciones de fallo.

## Programación

### Trabajos de una sola ejecución

`--at <datetime>` programa una ejecución de una sola vez. Las fechas y horas sin desplazamiento se tratan como UTC a menos que también pases `--tz <iana>`, que interpreta la hora de reloj en la zona horaria indicada.

<Note>
Los trabajos de una sola ejecución se eliminan después de tener éxito de forma predeterminada. Usa `--keep-after-run` para conservarlos.
</Note>

### Trabajos recurrentes

Los trabajos recurrentes usan retroceso exponencial de reintento tras errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan al retroceso de reintento, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` puede hacer que las alertas de fallo incluyan notificaciones repetidas de ejecuciones omitidas.

Para trabajos aislados que apuntan a un proveedor de modelo local configurado, Cron ejecuta una comprobación previa ligera del proveedor antes de iniciar el turno del agente. Los proveedores `api: "ollama"` de local loopback, red privada y `.local` se sondean en `/api/tags`; los proveedores locales compatibles con OpenAI, como vLLM, SGLang y LM Studio, se sondean en `/models`. Si no se puede acceder al endpoint, la ejecución se registra como `skipped` y se reintenta en una programación posterior; los endpoints inactivos coincidentes se almacenan en caché durante 5 minutos para evitar que muchos trabajos saturen el mismo servidor local.

Nota: las definiciones de trabajos de Cron viven en `jobs.json`, mientras que el estado pendiente del runtime vive en `jobs-state.json`. Si `jobs.json` se edita externamente, el Gateway recarga las programaciones cambiadas y borra los turnos pendientes obsoletos; las reescrituras solo de formato no borran el turno pendiente.

### Ejecuciones manuales

`openclaw cron run` devuelve en cuanto la ejecución manual se pone en cola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` para seguir el resultado eventual.

<Note>
`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada. Usa `--due` para conservar el comportamiento anterior de "ejecutar solo si corresponde".
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para el trabajo.

<Warning>
Si el modelo no está permitido o no puede resolverse, Cron falla la ejecución con un error de validación explícito en lugar de recurrir al agente del trabajo o a la selección de modelo predeterminada.
</Warning>

`--model` de Cron es un **principal del trabajo**, no una anulación `/model` de sesión de chat. Eso significa:

- Las alternativas de modelo configuradas siguen aplicándose cuando falla el modelo seleccionado del trabajo.
- La carga útil por trabajo `fallbacks` reemplaza la lista configurada de alternativas cuando está presente.
- Una lista vacía de alternativas por trabajo (`fallbacks: []` en la carga útil/API del trabajo) hace que la ejecución de Cron sea estricta.
- Cuando un trabajo tiene `--model` pero no hay lista de alternativas configurada, OpenClaw pasa una anulación explícita de alternativas vacía para que el modelo principal del agente no se añada como destino de reintento oculto.

### Precedencia del modelo de Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Anulación de Gmail-hook.
2. `--model` por trabajo.
3. Anulación de modelo almacenada de sesión de Cron (cuando el usuario seleccionó una).
4. Selección de modelo del agente o predeterminada.

### Modo rápido

El modo rápido de Cron aislado sigue la selección de modelo en vivo resuelta. La configuración de modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación `fastMode` de sesión almacenada sigue teniendo prioridad sobre la configuración.

### Reintentos de cambio de modelo en vivo

Si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron conserva el proveedor y el modelo cambiados (y la anulación de perfil de autenticación cambiado cuando esté presente) para la ejecución activa antes de reintentar. El bucle externo de reintentos está limitado a dos reintentos de cambio después del intento inicial y luego aborta en lugar de quedar en bucle indefinidamente.

## Salida de ejecución y denegaciones

### Supresión de confirmaciones obsoletas

Los turnos de Cron aislado suprimen las respuestas obsoletas que solo son confirmaciones. Si el primer resultado es solo una actualización de estado provisional y ninguna ejecución descendiente de subagente es responsable de la respuesta eventual, Cron vuelve a solicitar una vez el resultado real antes de la entrega.

### Supresión de token silencioso

Si una ejecución de Cron aislada devuelve solo el token silencioso (`NO_REPLY` o `no_reply`), Cron suprime tanto la entrega saliente directa como la ruta de resumen en cola alternativa, por lo que no se publica nada de vuelta en el chat.

### Denegaciones estructuradas

Las ejecuciones de Cron aislado prefieren metadatos estructurados de denegación de ejecución de la ejecución embebida y luego recurren a marcadores de denegación conocidos en la salida final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` y frases de rechazo de vinculación de aprobación.

`cron list` y el historial de ejecuciones muestran el motivo de la denegación en lugar de informar un comando bloqueado como `ok`.

## Retención

La retención y la poda se controlan en la configuración:

- `cron.sessionRetention` (valor predeterminado `24h`) poda las sesiones de ejecución aislada completadas.
- `cron.runLog.maxBytes` y `cron.runLog.keepLines` podan `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migración de trabajos antiguos

<Note>
Si tienes trabajos de Cron de antes del formato actual de entrega y almacenamiento, ejecuta `openclaw doctor --fix`. Doctor normaliza campos heredados de Cron (`jobId`, `schedule.cron`, campos de entrega de nivel superior, incluido `threadId` heredado, aliases de entrega `provider` de carga útil) y migra trabajos simples de alternativa de Webhook con `notify: true` a entrega Webhook explícita cuando `cron.webhook` está configurado.

Doctor también elimina centinelas persistidos de Cron `payload.model`, como `"default"`, `"null"`, cadenas en blanco y `null` de JSON. El runtime de Cron sigue tratando cualquier cadena no vacía de `payload.model` como una anulación explícita de modelo y la valida contra `agents.defaults.models`; omite la clave de modelo cuando un trabajo debe usar la selección de modelo del agente/predeterminada.
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
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos de turno de agente aislados. Para ejecuciones de Cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

## Comandos comunes de administración

Ejecución manual e inspección:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` muestra todos los trabajos coincidentes de forma predeterminada. Pasa `--agent <id>` para mostrar solo los trabajos cuyo id de agente normalizado efectivo coincida; los trabajos sin id de agente almacenado cuentan como el agente predeterminado configurado.

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino de Cron previsto, el destino resuelto, envíos de la herramienta de mensajes, uso de alternativa y estado entregado.

Redestinación de agente y sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` advierte cuando `--agent` se omite en trabajos de turno de agente y recurre al agente predeterminado (`main`). Pasa `--agent <id>` en el momento de la creación para fijar un agente específico.

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
