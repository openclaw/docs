---
read_when:
    - Quieres entender el enrutamiento y el aislamiento de sesiones
    - Quieres configurar el alcance de los mensajes directos para entornos multiusuario
    - Estás depurando restablecimientos de sesión diarios o por inactividad
summary: Cómo OpenClaw gestiona las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-04-26T11:27:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organiza las conversaciones en **sesiones**. Cada mensaje se enruta a una sesión según su origen: mensajes directos, chats grupales, trabajos Cron, etc.

## Cómo se enrutan los mensajes

| Origen          | Comportamiento              |
| --------------- | --------------------------- |
| Mensajes directos | Sesión compartida por defecto |
| Chats grupales  | Aislados por grupo          |
| Salas/canales   | Aislados por sala           |
| Trabajos Cron   | Sesión nueva por ejecución  |
| Webhooks        | Aislados por hook           |

## Aislamiento de mensajes directos

De forma predeterminada, todos los mensajes directos comparten una sesión para mantener la continuidad. Esto funciona bien en configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, habilita el aislamiento de mensajes directos. Sin él, todos los usuarios comparten el mismo contexto de conversación: los mensajes privados de Alice serían visibles para Bob.
</Warning>

**La solución:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // aislar por canal + remitente
  },
}
```

Otras opciones:

- `main` (predeterminado) — todos los mensajes directos comparten una sesión.
- `per-peer` — aísla por remitente (entre canales).
- `per-channel-peer` — aísla por canal + remitente (recomendado).
- `per-account-channel-peer` — aísla por cuenta + canal + remitente.

<Tip>
Si la misma persona te contacta desde varios canales, usa `session.identityLinks` para vincular sus identidades y que compartan una sola sesión.
</Tip>

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de la sesión

Las sesiones se reutilizan hasta que expiran:

- **Restablecimiento diario** (predeterminado) — sesión nueva a las 4:00 AM hora local en el host del gateway. La frescura diaria se basa en cuándo comenzó el `sessionId` actual, no en escrituras posteriores de metadatos.
- **Restablecimiento por inactividad** (opcional) — sesión nueva tras un período de inactividad. Establece `session.reset.idleMinutes`. La frescura por inactividad se basa en la última interacción real de usuario/canal, por lo que los eventos del sistema de Heartbeat, Cron y exec no mantienen viva la sesión.
- **Restablecimiento manual** — escribe `/new` o `/reset` en el chat. `/new <model>` también cambia el modelo.

Cuando se configuran tanto el restablecimiento diario como el de inactividad, prevalece el que expire primero.
Los eventos de Heartbeat, Cron, exec y otros eventos del sistema pueden escribir metadatos de sesión, pero esas escrituras no amplían la frescura del restablecimiento diario ni por inactividad. Cuando un restablecimiento cambia la sesión, los avisos de eventos del sistema en cola de la sesión antigua se descartan para que las actualizaciones en segundo plano obsoletas no se antepongan al primer prompt de la nueva sesión.

Las sesiones con una sesión CLI activa propiedad del proveedor no se cortan por el valor predeterminado diario implícito. Usa `/reset` o configura `session.reset` explícitamente cuando esas sesiones deban expirar con un temporizador.

## Dónde vive el estado

Todo el estado de la sesión pertenece al **gateway**. Los clientes de UI consultan al gateway para obtener los datos de la sesión.

- **Almacén:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripciones:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene marcas de tiempo separadas del ciclo de vida:

- `sessionStartedAt`: cuándo comenzó el `sessionId` actual; el restablecimiento diario usa este valor.
- `lastInteractionAt`: última interacción de usuario/canal que amplía el tiempo de vida por inactividad.
- `updatedAt`: última mutación de fila del almacén; útil para listar y depurar, pero no es autoritativa para la frescura del restablecimiento diario/por inactividad.

Las filas antiguas sin `sessionStartedAt` se resuelven desde la cabecera de sesión JSONL de la transcripción cuando está disponible. Si una fila antigua tampoco tiene `lastInteractionAt`, la frescura por inactividad recurre a la hora de inicio de esa sesión, no a escrituras administrativas posteriores.

## Mantenimiento de sesiones

OpenClaw limita automáticamente el almacenamiento de sesiones con el tiempo. De forma predeterminada, se ejecuta en modo `warn` (informa de lo que se limpiaría). Establece `session.maintenance.mode` en `"enforce"` para limpieza automática:

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

Haz una vista previa con `openclaw sessions cleanup --dry-run`.

## Inspección de sesiones

- `openclaw status` — ruta del almacén de sesiones y actividad reciente.
- `openclaw sessions --json` — todas las sesiones (filtra con `--active <minutes>`).
- `/status` en el chat — uso de contexto, modelo y conmutadores.
- `/context list` — qué hay en el prompt del sistema.

## Lectura adicional

- [Session Pruning](/es/concepts/session-pruning) — recorte de resultados de herramientas
- [Compaction](/es/concepts/compaction) — resumen de conversaciones largas
- [Session Tools](/es/concepts/session-tool) — herramientas del agente para trabajo entre sesiones
- [Session Management Deep Dive](/es/reference/session-management-compaction) — esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multi-Agent](/es/concepts/multi-agent) — enrutamiento y aislamiento de sesiones entre agentes
- [Background Tasks](/es/automation/tasks) — cómo el trabajo desacoplado crea registros de tareas con referencias de sesión
- [Channel Routing](/es/channels/channel-routing) — cómo los mensajes entrantes se enrutan a las sesiones

## Relacionado

- [Session pruning](/es/concepts/session-pruning)
- [Session tools](/es/concepts/session-tool)
- [Command queue](/es/concepts/queue)
