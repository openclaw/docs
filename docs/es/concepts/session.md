---
read_when:
    - Quieres comprender el enrutamiento y el aislamiento de las sesiones
    - Desea configurar el alcance de DM para configuraciones multiusuario
    - Estás depurando restablecimientos diarios o por inactividad de la sesión
summary: Cómo OpenClaw gestiona las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-04-30T05:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiza las conversaciones en **sesiones**. Cada mensaje se enruta a una
sesión según de dónde provenga: DM, chats grupales, trabajos cron, etc.

## Cómo se enrutan los mensajes

| Origen          | Comportamiento                  |
| --------------- | ------------------------------- |
| Mensajes directos | Sesión compartida por defecto |
| Chats grupales  | Aislada por grupo               |
| Salas/canales   | Aislada por sala                |
| Trabajos cron   | Sesión nueva por ejecución      |
| Webhooks        | Aislada por hook                |

## Aislamiento de DM

Por defecto, todos los DM comparten una sesión para mantener la continuidad. Esto está bien para
configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, habilita el aislamiento de DM. Sin él, todos
los usuarios comparten el mismo contexto de conversación: los mensajes privados de Alice serían
visibles para Bob.
</Warning>

**La solución:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Otras opciones:

- `main` (por defecto) -- todos los DM comparten una sesión.
- `per-peer` -- aísla por remitente (entre canales).
- `per-channel-peer` -- aísla por canal + remitente (recomendado).
- `per-account-channel-peer` -- aísla por cuenta + canal + remitente.

<Tip>
Si la misma persona te contacta desde varios canales, usa
`session.identityLinks` para vincular sus identidades y que compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento permiten que un usuario mueva la ruta de respuesta de la sesión actual de chat directo a
otro canal vinculado sin iniciar una sesión nueva. Consulta
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos, configuración y
solución de problemas.

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de la sesión

Las sesiones se reutilizan hasta que caducan:

- **Restablecimiento diario** (por defecto) -- nueva sesión a las 4:00 a. m., hora local del
  host del Gateway. La actualización diaria se basa en cuándo comenzó el `sessionId` actual, no
  en escrituras posteriores de metadatos.
- **Restablecimiento por inactividad** (opcional) -- nueva sesión tras un periodo de inactividad. Configura
  `session.reset.idleMinutes`. La actualización por inactividad se basa en la última interacción real de
  usuario/canal, por lo que los eventos de sistema de heartbeat, cron y exec no
  mantienen viva la sesión.
- **Restablecimiento manual** -- escribe `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran restablecimientos diarios y por inactividad, gana el que caduque primero.
Heartbeat, cron, exec y otros turnos de eventos de sistema pueden escribir metadatos de sesión,
pero esas escrituras no amplían la actualización del restablecimiento diario ni por inactividad. Cuando un restablecimiento
rota la sesión, los avisos de eventos de sistema en cola para la sesión antigua se
descartan para que las actualizaciones en segundo plano obsoletas no se antepongan al primer prompt de
la nueva sesión.

Las sesiones con una sesión CLI activa propiedad del proveedor no se cortan por el valor predeterminado
diario implícito. Usa `/reset` o configura `session.reset` explícitamente cuando esas
sesiones deban caducar con un temporizador.

## Dónde vive el estado

Todo el estado de sesión pertenece al **Gateway**. Los clientes de UI consultan el Gateway para obtener
datos de sesión.

- **Almacén:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripciones:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene marcas de tiempo de ciclo de vida separadas:

- `sessionStartedAt`: cuándo comenzó el `sessionId` actual; el restablecimiento diario usa esto.
- `lastInteractionAt`: última interacción de usuario/canal que extiende la vida útil por inactividad.
- `updatedAt`: última mutación de fila del almacén; útil para listar y podar, pero no
  autoritativa para la actualización del restablecimiento diario/por inactividad.

Las filas antiguas sin `sessionStartedAt` se resuelven desde el encabezado de sesión JSONL de la transcripción
cuando está disponible. Si una fila antigua tampoco tiene `lastInteractionAt`,
la actualización por inactividad recurre a esa hora de inicio de sesión, no a escrituras posteriores
de mantenimiento.

## Mantenimiento de sesiones

OpenClaw limita automáticamente el almacenamiento de sesiones con el tiempo. Por defecto, se ejecuta
en modo `warn` (informa qué se limpiaría). Configura `session.maintenance.mode`
en `"enforce"` para la limpieza automática:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Para límites de `maxEntries` de tamaño de producción, las escrituras en tiempo de ejecución del Gateway usan un pequeño búfer de marca alta y limpian en lotes hasta volver al límite configurado. Esto evita ejecutar una limpieza completa del almacén en cada sesión cron aislada. `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.

Previsualiza con `openclaw sessions cleanup --dry-run`.

## Inspeccionar sesiones

- `openclaw status` -- ruta del almacén de sesiones y actividad reciente.
- `openclaw sessions --json` -- todas las sesiones (filtra con `--active <minutes>`).
- `/status` en el chat -- uso de contexto, modelo y conmutadores.
- `/context list` -- qué hay en el prompt del sistema.

## Lecturas adicionales

- [Poda de sesiones](/es/concepts/session-pruning) -- recortar resultados de herramientas
- [Compaction](/es/concepts/compaction) -- resumir conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool) -- herramientas de agente para trabajo entre sesiones
- [Análisis profundo de gestión de sesiones](/es/reference/session-management-compaction) --
  esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multiagente](/es/concepts/multi-agent) — enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks) — cómo el trabajo desacoplado crea registros de tarea con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se enrutan los mensajes entrantes a sesiones

## Relacionado

- [Poda de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
