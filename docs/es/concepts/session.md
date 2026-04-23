---
read_when:
    - Quieres entender el enrutamiento y el aislamiento de sesiones
    - Quieres configurar el alcance de DM para configuraciones multiusuario
summary: Cómo OpenClaw gestiona las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-04-23T05:15:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Gestión de sesiones

OpenClaw organiza las conversaciones en **sesiones**. Cada mensaje se enruta a una
sesión según de dónde proviene: DM, chats grupales, trabajos de Cron, etc.

## Cómo se enrutan los mensajes

| Origen          | Comportamiento                |
| --------------- | ----------------------------- |
| Mensajes directos | Sesión compartida de forma predeterminada |
| Chats grupales  | Aislados por grupo            |
| Salas/canales   | Aislados por sala             |
| Trabajos de Cron | Sesión nueva por ejecución    |
| Webhooks        | Aislados por hook             |

## Aislamiento de DM

De forma predeterminada, todos los DM comparten una sesión para mantener la continuidad. Esto está bien para
configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, habilita el aislamiento de DM. Sin él, todos los
usuarios comparten el mismo contexto de conversación: los mensajes privados de Alice serían
visibles para Bob.
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

- `main` (predeterminado) -- todos los DM comparten una sesión.
- `per-peer` -- aísla por remitente (entre canales).
- `per-channel-peer` -- aísla por canal + remitente (recomendado).
- `per-account-channel-peer` -- aísla por cuenta + canal + remitente.

<Tip>
Si la misma persona se pone en contacto contigo desde varios canales, usa
`session.identityLinks` para vincular sus identidades de modo que compartan una sesión.
</Tip>

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de la sesión

Las sesiones se reutilizan hasta que expiran:

- **Restablecimiento diario** (predeterminado) -- nueva sesión a las 4:00 a. m., hora local, en el host del Gateway.
- **Restablecimiento por inactividad** (opcional) -- nueva sesión después de un período de inactividad. Configura
  `session.reset.idleMinutes`.
- **Restablecimiento manual** -- escribe `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran tanto los restablecimientos diarios como por inactividad, prevalece el que expire primero.

Las sesiones con una sesión de CLI activa administrada por el proveedor no se cierran por el valor
predeterminado diario implícito. Usa `/reset` o configura `session.reset` explícitamente cuando esas
sesiones deban expirar con un temporizador.

## Dónde vive el estado

Todo el estado de la sesión pertenece al **Gateway**. Los clientes de UI consultan al gateway para obtener
los datos de la sesión.

- **Almacenamiento:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripciones:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Mantenimiento de sesiones

OpenClaw limita automáticamente el almacenamiento de sesiones con el tiempo. De forma predeterminada, se ejecuta
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

Obtén una vista previa con `openclaw sessions cleanup --dry-run`.

## Inspección de sesiones

- `openclaw status` -- ruta del almacenamiento de sesiones y actividad reciente.
- `openclaw sessions --json` -- todas las sesiones (filtra con `--active <minutes>`).
- `/status` en el chat -- uso del contexto, modelo y alternadores.
- `/context list` -- qué hay en el prompt del sistema.

## Lectura adicional

- [Session Pruning](/es/concepts/session-pruning) -- recorte de resultados de herramientas
- [Compaction](/es/concepts/compaction) -- resumen de conversaciones largas
- [Session Tools](/es/concepts/session-tool) -- herramientas del agente para trabajo entre sesiones
- [Session Management Deep Dive](/es/reference/session-management-compaction) --
  esquema de almacenamiento, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multi-Agent](/es/concepts/multi-agent) — enrutamiento y aislamiento de sesiones entre agentes
- [Background Tasks](/es/automation/tasks) — cómo el trabajo desacoplado crea registros de tareas con referencias de sesión
- [Channel Routing](/es/channels/channel-routing) — cómo los mensajes entrantes se enrutan a sesiones
