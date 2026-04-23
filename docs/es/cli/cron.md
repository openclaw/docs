---
read_when:
    - Quieres trabajos programados y activaciones programadas
    - Estás depurando la ejecución y los registros de cron
summary: Referencia de la CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: cron
x-i18n:
    generated_at: "2026-04-23T14:00:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Administra trabajos Cron para el programador del Gateway.

Relacionado:

- Trabajos Cron: [Trabajos Cron](/es/automation/cron-jobs)

Consejo: ejecuta `openclaw cron --help` para ver toda la superficie de comandos.

Nota: `openclaw cron list` y `openclaw cron show <job-id>` muestran una vista previa de la
ruta de entrega resuelta. Para `channel: "last"`, la vista previa muestra si la
ruta se resolvió desde la sesión principal/actual o si fallará de forma cerrada.

Nota: los trabajos aislados de `cron add` usan `--announce` como entrega predeterminada. Usa `--no-deliver` para mantener la
salida interna. `--deliver` sigue existiendo como alias desaprobado de `--announce`.

Nota: la entrega de chat de Cron aislado es compartida. `--announce` es la entrega
de respaldo del ejecutor para la respuesta final; `--no-deliver` desactiva ese respaldo, pero no
elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Nota: los trabajos de una sola ejecución (`--at`) se eliminan después del éxito de forma predeterminada. Usa `--keep-after-run` para conservarlos.

Nota: `--session` admite `main`, `isolated`, `current` y `session:<id>`.
Usa `current` para vincular la sesión activa en el momento de la creación, o `session:<id>` para
una clave de sesión persistente explícita.

Nota: para trabajos CLI de una sola ejecución, las fechas y horas `--at` sin desplazamiento se tratan como UTC, a menos que también pases
`--tz <iana>`, que interpreta esa hora local de pared en la zona horaria indicada.

Nota: los trabajos recurrentes ahora usan retroceso exponencial de reintentos tras errores consecutivos (30s → 1m → 5m → 15m → 60m), y luego vuelven a la programación normal después de la siguiente ejecución correcta.

Nota: `openclaw cron run` ahora regresa tan pronto como la ejecución manual queda en cola. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` para seguir el resultado final.

Nota: `openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada. Usa `--due` para conservar el
comportamiento anterior de "ejecutar solo si corresponde".

Nota: los turnos Cron aislados suprimen respuestas obsoletas solo de confirmación. Si el
primer resultado es solo una actualización de estado provisional y ninguna ejecución descendiente de subagente
es responsable de la respuesta final, Cron vuelve a solicitar una vez el resultado real
antes de entregarlo.

Nota: si una ejecución aislada de Cron devuelve solo el token silencioso (`NO_REPLY` /
`no_reply`), Cron suprime tanto la entrega directa saliente como la ruta de resumen
en cola de respaldo, por lo que no se publica nada de vuelta en el chat.

Nota: `cron add|edit --model ...` usa ese modelo permitido seleccionado para el trabajo.
Si el modelo no está permitido, Cron advierte y recurre a la selección normal de
modelo del agente/predeterminado del trabajo. Las cadenas de respaldo configuradas siguen aplicándose, pero una simple
sobrescritura de modelo sin una lista explícita de respaldos por trabajo ya no agrega el
modelo principal del agente como destino oculto adicional de reintento.

Nota: la precedencia del modelo de Cron aislado es primero la sobrescritura de Gmail-hook, luego el
`--model` por trabajo, luego cualquier sobrescritura de modelo almacenada en la sesión de Cron, y después la selección normal
del agente/predeterminada.

Nota: el modo rápido de Cron aislado sigue la selección de modelo en vivo resuelta. La configuración del
modelo `params.fastMode` se aplica de forma predeterminada, pero una sobrescritura de `fastMode`
almacenada en la sesión sigue teniendo prioridad sobre la configuración.

Nota: si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron persiste el
proveedor/modelo cambiado (y la sobrescritura del perfil de autenticación cambiado, cuando exista) antes de
reintentar. El bucle externo de reintentos está limitado a 2 reintentos de cambio después del intento
inicial y luego aborta en lugar de entrar en un bucle infinito.

Nota: las notificaciones de fallo usan primero `delivery.failureDestination`, luego
`cron.failureDestination` global, y por último recurren al destino principal de
anuncio del trabajo cuando no hay configurado un destino explícito de fallo.

Nota: la retención/poda se controla en la configuración:

- `cron.sessionRetention` (predeterminado `24h`) poda las sesiones completadas de ejecuciones aisladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota de actualización: si tienes trabajos Cron antiguos de antes del formato actual de entrega/almacenamiento, ejecuta
`openclaw doctor --fix`. Doctor ahora normaliza campos heredados de Cron (`jobId`, `schedule.cron`,
campos de entrega de nivel superior, incluido `threadId` heredado, alias de entrega `provider` en la carga útil) y migra trabajos simples de
respaldo de Webhook con `notify: true` a entrega explícita por Webhook cuando `cron.webhook` está
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

Habilita contexto de arranque ligero para un trabajo aislado:

```bash
openclaw cron edit <job-id> --light-context
```

Anuncia en un canal específico:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Crea un trabajo aislado con contexto de arranque ligero:

```bash
openclaw cron add \
  --name "Resumen matutino ligero" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Resume las actualizaciones de la noche." \
  --light-context \
  --no-deliver
```

`--light-context` se aplica solo a trabajos aislados de turnos de agente. Para ejecuciones Cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

Nota sobre propiedad de la entrega:

- La entrega de chat de Cron aislado es compartida. El agente puede enviar directamente con la
  herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega como respaldo la respuesta final solo cuando el agente no envió
  directamente al destino resuelto. `webhook` publica la carga útil terminada en una URL.
  `none` desactiva la entrega de respaldo del ejecutor.

## Comandos comunes de administración

Ejecución manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino Cron previsto,
el destino resuelto, envíos de la herramienta message, uso de respaldo y estado de entrega.

Reasignación de agente/sesión:

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

Nota sobre entrega de fallos:

- `delivery.failureDestination` se admite para trabajos aislados.
- Los trabajos de sesión principal solo pueden usar `delivery.failureDestination` cuando el modo
  principal de entrega es `webhook`.
- Si no configuras ningún destino de fallo y el trabajo ya anuncia en un
  canal, las notificaciones de fallo reutilizan ese mismo destino de anuncio.
