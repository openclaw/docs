---
read_when:
    - Quieres trabajos programados y activaciones
    - Estás depurando la ejecución y los registros de cron
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:25:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Administra trabajos de cron para el programador del Gateway.

Relacionado:

- Trabajos de cron: [Trabajos de cron](/es/automation/cron-jobs)

Consejo: ejecuta `openclaw cron --help` para ver toda la superficie de comandos.

Nota: `openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la
ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la
ruta se resolvió desde la sesión principal/actual o si fallará de forma cerrada.

Nota: los trabajos aislados de `cron add` usan `--announce` como entrega predeterminada. Usa `--no-deliver` para mantener
la salida interna. `--deliver` sigue disponible como alias obsoleto de `--announce`.

Nota: la entrega de chat en cron aislado es compartida. `--announce` es la entrega
de respaldo del ejecutor para la respuesta final; `--no-deliver` desactiva ese respaldo, pero no
elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Nota: los trabajos de una sola vez (`--at`) se eliminan después del éxito de forma predeterminada. Usa `--keep-after-run` para conservarlos.

Nota: `--session` admite `main`, `isolated`, `current` y `session:<id>`.
Usa `current` para vincularlo a la sesión activa en el momento de la creación, o `session:<id>` para
una clave de sesión persistente explícita.

Nota: `--session isolated` crea un nuevo id de transcripción/sesión para cada ejecución.
Las preferencias seguras y las anulaciones explícitas de modelo/autenticación seleccionadas por la persona usuaria pueden mantenerse, pero
el contexto ambiental de la conversación no: el enrutamiento de canal/grupo, la política de envío/cola,
la elevación, el origen y la vinculación en tiempo de ejecución de ACP se restablecen para la nueva ejecución aislada.

Nota: para trabajos de CLI de una sola vez, los valores de fecha y hora `--at` sin desplazamiento se tratan como UTC a menos que también pases
`--tz <iana>`, que interpreta esa hora local de reloj en la zona horaria indicada.

Nota: los trabajos recurrentes ahora usan backoff exponencial de reintento tras errores consecutivos (30s → 1m → 5m → 15m → 60m), y luego vuelven a la programación normal después de la siguiente ejecución correcta.

Nota: `openclaw cron run` ahora regresa en cuanto la ejecución manual queda en cola para ejecutarse. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` para seguir el resultado final.

Nota: `openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada. Usa `--due` para mantener el
comportamiento anterior de "ejecutar solo si corresponde".

Nota: los turnos aislados de cron suprimen respuestas obsoletas que solo contienen confirmaciones. Si el
primer resultado es solo una actualización provisional de estado y ninguna ejecución descendiente de subagente es
responsable de la respuesta final, cron vuelve a solicitar una vez el resultado real
antes de entregarlo.

Nota: si una ejecución aislada de cron devuelve solo el token silencioso (`NO_REPLY` /
`no_reply`), cron suprime la entrega saliente directa y también la ruta de resumen
en cola de respaldo, por lo que no se publica nada de vuelta en el chat.

Nota: `cron add|edit --model ...` usa ese modelo permitido seleccionado para el trabajo.
Si el modelo no está permitido, cron emite una advertencia y vuelve a la selección de modelo
predeterminada/del agente del trabajo. Las cadenas de respaldo configuradas siguen aplicándose, pero una simple
anulación de modelo sin una lista explícita de respaldo por trabajo ya no agrega el
principal del agente como destino adicional oculto de reintento.

Nota: la precedencia del modelo en cron aislado es primero la anulación del hook de Gmail, luego `--model`
por trabajo, luego cualquier anulación de modelo de sesión cron almacenada seleccionada por la persona usuaria, y después la
selección normal del agente/predeterminada.

Nota: el modo rápido en cron aislado sigue la selección de modelo activa resuelta. La
configuración del modelo `params.fastMode` se aplica de forma predeterminada, pero una anulación almacenada de `fastMode`
en la sesión sigue teniendo prioridad sobre la configuración.

Nota: si una ejecución aislada lanza `LiveSessionModelSwitchError`, cron conserva el
proveedor/modelo cambiado (y la anulación del perfil de autenticación cambiado cuando exista) para
la ejecución activa antes de reintentar. El bucle externo de reintentos se limita a 2 reintentos
por cambio después del intento inicial, y luego aborta en lugar de entrar en un bucle infinito.

Nota: las notificaciones de fallo usan primero `delivery.failureDestination`, luego
`cron.failureDestination` global y, por último, vuelven al destino principal de
anuncio del trabajo cuando no se configura un destino de fallo explícito.

Nota: la retención/poda se controla en la configuración:

- `cron.sessionRetention` (predeterminado `24h`) poda las sesiones completadas de ejecuciones aisladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota de actualización: si tienes trabajos de cron antiguos de antes del formato actual de entrega/almacenamiento, ejecuta
`openclaw doctor --fix`. Doctor ahora normaliza campos heredados de cron (`jobId`, `schedule.cron`,
campos de entrega de nivel superior, incluido el `threadId` heredado, alias de entrega `provider` en la carga útil) y migra
trabajos simples de respaldo a Webhook con `notify: true` a una entrega explícita por Webhook cuando `cron.webhook` está
configurado.

## Ediciones comunes

Actualiza la configuración de entrega sin cambiar el mensaje:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desactiva la entrega para un trabajo aislado:

```bash
openclaw cron edit <job-id> --no-deliver
```

Habilita un contexto de arranque liviano para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncia en un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crea un trabajo aislado con contexto de arranque liviano:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos aislados de turno de agente. Para ejecuciones de cron, el modo liviano mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

Nota sobre la propiedad de la entrega:

- La entrega de chat en cron aislado es compartida. El agente puede enviar directamente con la
  herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como respaldo la respuesta final solo cuando el agente no envió
  directamente al destino resuelto. `webhook` hace POST de la carga finalizada a una URL.
  `none` desactiva la entrega de respaldo del ejecutor.
- Los recordatorios creados desde un chat activo conservan el destino de entrega activo del chat
  para la entrega de anuncio de respaldo. Las claves internas de sesión pueden estar en minúsculas; no
  las uses como fuente de verdad para ids de proveedor sensibles a mayúsculas y minúsculas, como los ids de
  sala de Matrix.

## Comandos administrativos comunes

Ejecución manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino cron previsto,
el destino resuelto, envíos de la herramienta de mensajes, uso de respaldo y estado entregado.

Redirección de agente/sesión:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustes de entrega:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Nota sobre la entrega de fallos:

- `delivery.failureDestination` es compatible con trabajos aislados.
- Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo principal
  de entrega es `webhook`.
- Si no defines ningún destino de fallo y el trabajo ya anuncia en un
  canal, las notificaciones de fallo reutilizan ese mismo destino de anuncio.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Tareas programadas](/es/automation/cron-jobs)
