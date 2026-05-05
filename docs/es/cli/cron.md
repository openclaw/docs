---
read_when:
    - Quieres trabajos programados y reactivaciones
    - Estás depurando la ejecución y los registros de Cron
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Gestiona trabajos de Cron para el planificador del Gateway.

<Tip>
Ejecuta `openclaw cron --help` para ver toda la superficie de comandos. Consulta [trabajos de Cron](/es/automation/cron-jobs) para la guía conceptual.
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
  <Accordion title="Semántica de sesiones aisladas">
    Las ejecuciones aisladas restablecen el contexto de conversación ambiental. El enrutamiento de canal y grupo, la política de envío/cola, la elevación, el origen y el enlace de runtime de ACP se restablecen para la nueva ejecución. Las preferencias seguras y las anulaciones explícitas de modelo o autenticación seleccionadas por el usuario pueden conservarse entre ejecuciones.
  </Accordion>
</AccordionGroup>

## Entrega

`openclaw cron list` y `openclaw cron show <job-id>` previsualizan la ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la ruta se resolvió desde la sesión principal o actual, o si fallará de forma cerrada.

Los destinos con prefijo de proveedor pueden desambiguar canales de anuncio no resueltos. Por ejemplo, `to: "telegram:123"` selecciona Telegram cuando `delivery.channel` se omite o es `last`. Solo los prefijos anunciados por el Plugin cargado son selectores de proveedor. Si `delivery.channel` es explícito, el prefijo debe coincidir con ese canal; `channel: "whatsapp"` con `to: "telegram:123"` se rechaza. Los prefijos de servicio como `imessage:` y `sms:` siguen siendo sintaxis de destino propiedad del canal.

<Note>
Los trabajos aislados de `cron add` usan entrega `--announce` de forma predeterminada. Usa `--no-deliver` para mantener la salida interna. `--deliver` permanece como alias obsoleto de `--announce`.
</Note>

### Propiedad de la entrega

La entrega de chat de Cron aislado se comparte entre el agente y el ejecutor:

- El agente puede enviar directamente con la herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como respaldo la respuesta final solo cuando el agente no envió directamente al destino resuelto.
- `webhook` publica la carga útil finalizada en una URL.
- `none` desactiva la entrega de respaldo del ejecutor.

`--announce` es la entrega de respaldo del ejecutor para la respuesta final. `--no-deliver` desactiva ese respaldo, pero no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Los recordatorios creados desde un chat activo conservan el destino de entrega del chat en vivo para la entrega de anuncio de respaldo. Las claves de sesión internas pueden estar en minúsculas; no las uses como fuente de verdad para IDs de proveedor que distinguen mayúsculas y minúsculas, como los IDs de sala de Matrix.

### Entrega de fallos

Las notificaciones de fallo se resuelven en este orden:

1. `delivery.failureDestination` en el trabajo.
2. `cron.failureDestination` global.
3. El destino de anuncio principal del trabajo (cuando no se establece un destino de fallo explícito).

<Note>
Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo de entrega principal es `webhook`. Los trabajos aislados lo aceptan en todos los modos.
</Note>

Nota: las ejecuciones aisladas de Cron tratan los fallos del agente a nivel de ejecución como errores de trabajo incluso cuando
no se produce una carga útil de respuesta, por lo que los fallos de modelo/proveedor siguen incrementando los contadores de errores
y activan notificaciones de fallo.

## Programación

### Trabajos de ejecución única

`--at <datetime>` programa una ejecución única. Las fechas y horas sin desplazamiento se tratan como UTC a menos que también pases `--tz <iana>`, que interpreta la hora de reloj de pared en la zona horaria indicada.

<Note>
Los trabajos de ejecución única se eliminan después del éxito de forma predeterminada. Usa `--keep-after-run` para conservarlos.
</Note>

### Trabajos recurrentes

Los trabajos recurrentes usan reintentos con espera exponencial después de errores consecutivos: 30s, 1m, 5m, 15m, 60m. La programación vuelve a la normalidad después de la siguiente ejecución correcta.

Las ejecuciones omitidas se registran por separado de los errores de ejecución. No afectan la espera de reintento, pero `openclaw cron edit <job-id> --failure-alert-include-skipped` puede hacer que las alertas de fallo incluyan notificaciones repetidas de ejecuciones omitidas.

Para trabajos aislados que apuntan a un proveedor de modelos local configurado, Cron ejecuta una comprobación previa ligera del proveedor antes de iniciar el turno del agente. Los proveedores `api: "ollama"` de loopback, red privada y `.local` se sondean en `/api/tags`; los proveedores locales compatibles con OpenAI, como vLLM, SGLang y LM Studio, se sondean en `/models`. Si el endpoint no es accesible, la ejecución se registra como `skipped` y se reintenta en una programación posterior; los endpoints inactivos coincidentes se almacenan en caché durante 5 minutos para evitar que muchos trabajos saturen el mismo servidor local.

Nota: las definiciones de trabajos de Cron viven en `jobs.json`, mientras que el estado de runtime pendiente vive en `jobs-state.json`. Si `jobs.json` se edita externamente, el Gateway recarga las programaciones cambiadas y limpia los espacios pendientes obsoletos; las reescrituras solo de formato no limpian el espacio pendiente.

### Ejecuciones manuales

`openclaw cron run` devuelve la respuesta en cuanto la ejecución manual se encola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`. Usa `openclaw cron runs --id <job-id>` para seguir el resultado eventual.

<Note>
`openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada. Usa `--due` para conservar el comportamiento anterior de "ejecutar solo si está vencido".
</Note>

## Modelos

`cron add|edit --model <ref>` selecciona un modelo permitido para el trabajo.

<Warning>
Si el modelo no está permitido o no se puede resolver, Cron hace fallar la ejecución con un error de validación explícito en lugar de recurrir al agente del trabajo o a la selección de modelo predeterminada.
</Warning>

`--model` de Cron es un **primario de trabajo**, no una anulación de `/model` de sesión de chat. Eso significa:

- Los respaldos de modelo configurados siguen aplicándose cuando falla el modelo de trabajo seleccionado.
- `fallbacks` por carga útil de trabajo reemplaza la lista de respaldos configurada cuando está presente.
- Una lista vacía de respaldos por trabajo (`fallbacks: []` en la carga útil/API del trabajo) hace que la ejecución de Cron sea estricta.
- Cuando un trabajo tiene `--model` pero no hay una lista de respaldos configurada, OpenClaw pasa una anulación de respaldos vacía explícita para que el primario del agente no se agregue como destino de reintento oculto.

### Precedencia de modelos de Cron aislado

Cron aislado resuelve el modelo activo en este orden:

1. Anulación de hook de Gmail.
2. `--model` por trabajo.
3. Anulación de modelo de sesión de Cron almacenada (cuando el usuario seleccionó una).
4. Selección de modelo del agente o predeterminada.

### Modo rápido

El modo rápido de Cron aislado sigue la selección de modelo en vivo resuelta. La configuración de modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación `fastMode` de sesión almacenada sigue teniendo prioridad sobre la configuración.

### Reintentos de cambio de modelo en vivo

Si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron conserva el proveedor y el modelo cambiados (y la anulación de perfil de autenticación cambiado cuando está presente) para la ejecución activa antes de reintentar. El bucle exterior de reintento se limita a dos reintentos de cambio después del intento inicial, y luego aborta en lugar de entrar en un bucle infinito.

## Salida de ejecución y denegaciones

### Supresión de acuses obsoletos

Los turnos de Cron aislado suprimen respuestas obsoletas que son solo acuses. Si el primer resultado es solo una actualización de estado intermedia y ninguna ejecución de subagente descendiente es responsable de la respuesta eventual, Cron vuelve a solicitar una vez el resultado real antes de la entrega.

### Supresión de token silencioso

Si una ejecución aislada de Cron devuelve solo el token silencioso (`NO_REPLY` o `no_reply`), Cron suprime tanto la entrega saliente directa como la ruta de resumen en cola de respaldo, por lo que no se publica nada de vuelta al chat.

### Denegaciones estructuradas

Las ejecuciones aisladas de Cron prefieren metadatos estructurados de denegación de ejecución de la ejecución incrustada, y luego recurren a marcadores de denegación conocidos en la salida final, como `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` y frases de rechazo de enlace de aprobación.

`cron list` y el historial de ejecuciones muestran el motivo de denegación en lugar de reportar un comando bloqueado como `ok`.

## Retención

La retención y la poda se controlan en la configuración:

- `cron.sessionRetention` (predeterminado `24h`) poda las sesiones completadas de ejecuciones aisladas.
- `cron.runLog.maxBytes` y `cron.runLog.keepLines` podan `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Migración de trabajos antiguos

<Note>
Si tienes trabajos de Cron de antes del formato actual de entrega y almacenamiento, ejecuta `openclaw doctor --fix`. Doctor normaliza campos heredados de Cron (`jobId`, `schedule.cron`, campos de entrega de nivel superior incluido `threadId` heredado, alias de entrega `provider` de carga útil) y migra trabajos simples de respaldo de Webhook `notify: true` a entrega de Webhook explícita cuando `cron.webhook` está configurado.
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

Activa el contexto ligero de arranque para un trabajo aislado:

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

Crea un trabajo aislado con contexto ligero de arranque:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos de turno de agente aislado. Para ejecuciones de Cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

## Comandos de administración comunes

Ejecución manual e inspección:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` muestra todos los trabajos coincidentes de forma predeterminada. Pasa `--agent <id>` para mostrar solo los trabajos cuyo id efectivo normalizado de agente coincide; los trabajos sin id de agente almacenado cuentan como el agente predeterminado configurado.

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino previsto de Cron, el destino resuelto, envíos de la herramienta de mensajes, uso de respaldo y estado de entrega.

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
