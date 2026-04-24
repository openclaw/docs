---
read_when:
    - Quieres trabajos programados y activaciones
    - Estás depurando la ejecución de Cron y los registros
summary: Referencia de CLI para `openclaw cron` (programar y ejecutar trabajos en segundo plano)
title: Cron
x-i18n:
    generated_at: "2026-04-24T05:22:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gestiona trabajos de Cron para el programador del Gateway.

Relacionado:

- Trabajos de Cron: [Trabajos de Cron](/es/automation/cron-jobs)

Consejo: ejecuta `openclaw cron --help` para ver toda la superficie de comandos.

Nota: `openclaw cron list` y `openclaw cron show <job-id>` previsualizan la
ruta de entrega resuelta. Para `channel: "last"`, la previsualización muestra si la
ruta se resolvió desde la sesión principal/actual o si fallará de forma cerrada.

Nota: los trabajos aislados de `cron add` usan `--announce` como entrega predeterminada. Usa `--no-deliver` para mantener
la salida como interna. `--deliver` se mantiene como alias obsoleto de `--announce`.

Nota: la entrega de chat de Cron aislado es compartida. `--announce` es la entrega
de respaldo del ejecutor para la respuesta final; `--no-deliver` desactiva ese respaldo, pero
no elimina la herramienta `message` del agente cuando hay una ruta de chat disponible.

Nota: los trabajos de una sola ejecución (`--at`) se eliminan después del éxito de forma predeterminada. Usa `--keep-after-run` para conservarlos.

Nota: `--session` admite `main`, `isolated`, `current` y `session:<id>`.
Usa `current` para vincularlo a la sesión activa en el momento de la creación, o `session:<id>` para
una clave de sesión persistente explícita.

Nota: para trabajos CLI de una sola ejecución, las fechas y horas de `--at` sin desplazamiento se tratan como UTC salvo que también pases
`--tz <iana>`, que interpreta esa hora local de pared en la zona horaria indicada.

Nota: los trabajos recurrentes ahora usan retroceso exponencial de reintentos tras errores consecutivos (30s → 1m → 5m → 15m → 60m), y luego vuelven a la programación normal tras la siguiente ejecución correcta.

Nota: `openclaw cron run` ahora devuelve en cuanto la ejecución manual queda en cola para su ejecución. Las respuestas correctas incluyen `{ ok: true, enqueued: true, runId }`; usa `openclaw cron runs --id <job-id>` para seguir el resultado final.

Nota: `openclaw cron run <job-id>` fuerza la ejecución de forma predeterminada. Usa `--due` para mantener el
comportamiento anterior de "ejecutar solo si corresponde".

Nota: los turnos de Cron aislado suprimen respuestas obsoletas que solo contienen acuse de recibo. Si el
primer resultado es solo una actualización provisional de estado y ninguna ejecución descendiente de subagente
es responsable de la respuesta final, Cron vuelve a solicitar una vez el resultado real
antes de la entrega.

Nota: si una ejecución aislada de Cron devuelve solo el token silencioso (`NO_REPLY` /
`no_reply`), Cron suprime tanto la entrega saliente directa como la ruta de resumen
en cola de respaldo, así que no se publica nada de vuelta en el chat.

Nota: `cron add|edit --model ...` usa ese modelo permitido seleccionado para el trabajo.
Si el modelo no está permitido, Cron avisa y recurre a la selección
de modelo predeterminada/del agente para el trabajo. Las cadenas de respaldo configuradas siguen aplicándose, pero una simple
sobrescritura de modelo sin una lista explícita de respaldos por trabajo ya no añade el modelo principal del
agente como destino adicional oculto de reintento.

Nota: la precedencia de modelo en Cron aislado es primero la sobrescritura del hook de Gmail, luego `--model` por trabajo,
después cualquier sobrescritura de modelo almacenada en la sesión de Cron y, por último, la selección
normal predeterminada/del agente.

Nota: el modo rápido de Cron aislado sigue la selección activa de modelo resuelta. La configuración del
modelo `params.fastMode` se aplica de forma predeterminada, pero una sobrescritura almacenada de `fastMode`
de la sesión sigue teniendo prioridad sobre la configuración.

Nota: si una ejecución aislada lanza `LiveSessionModelSwitchError`, Cron persiste el
proveedor/modelo cambiado (y la sobrescritura cambiada del perfil de autenticación, cuando existe) antes de
reintentar. El bucle externo de reintento está limitado a 2 reintentos de cambio tras el intento inicial;
después aborta en lugar de entrar en un bucle infinito.

Nota: las notificaciones de fallo usan primero `delivery.failureDestination`, luego
`cron.failureDestination` global y, por último, recurren al destino principal de
anuncio del trabajo cuando no hay configurado un destino de fallo explícito.

Nota: la retención/depuración se controla en la configuración:

- `cron.sessionRetention` (predeterminado `24h`) depura sesiones completadas de ejecuciones aisladas.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` depuran `~/.openclaw/cron/runs/<jobId>.jsonl`.

Nota de actualización: si tienes trabajos de Cron antiguos de antes del formato actual de entrega/almacenamiento, ejecuta
`openclaw doctor --fix`. Doctor ahora normaliza campos heredados de Cron (`jobId`, `schedule.cron`,
campos de entrega de nivel superior, incluido el heredado `threadId`, alias de entrega `provider` en la carga útil) y migra
trabajos simples de respaldo a Webhook con `notify: true` a entrega explícita por Webhook cuando `cron.webhook` está
configurado.

## Ediciones comunes

Actualizar la configuración de entrega sin cambiar el mensaje:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Desactivar la entrega para un trabajo aislado:

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

Crear un trabajo aislado con contexto de arranque ligero:

```bash
openclaw cron add \
  --name "Resumen matutino ligero" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Resume las actualizaciones nocturnas." \
  --light-context \
  --no-deliver
```

`--light-context` solo se aplica a trabajos aislados de turnos de agente. Para ejecuciones de Cron, el modo ligero mantiene vacío el contexto de arranque en lugar de inyectar el conjunto completo de arranque del espacio de trabajo.

Nota sobre la propiedad de la entrega:

- La entrega de chat de Cron aislado es compartida. El agente puede enviar directamente con la
  herramienta `message` cuando hay una ruta de chat disponible.
- `announce` entrega por respaldo la respuesta final solo cuando el agente no envió
  directamente al destino resuelto. `webhook` publica la carga útil finalizada en una URL.
  `none` desactiva la entrega de respaldo del ejecutor.

## Comandos administrativos comunes

Ejecución manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Las entradas de `cron runs` incluyen diagnósticos de entrega con el destino de Cron previsto,
el destino resuelto, los envíos de la herramienta message, el uso del respaldo y el estado de entrega.

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
