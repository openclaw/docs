---
read_when:
    - Quieres entender el enrutamiento y el aislamiento de sesiones
    - Quieres configurar el alcance de mensajes directos para configuraciones multiusuario
summary: Cómo OpenClaw gestiona las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-04-24T05:26:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organiza las conversaciones en **sesiones**. Cada mensaje se enruta a una
sesión según su origen: mensajes directos, chats de grupo, trabajos de Cron, etc.

## Cómo se enrutan los mensajes

| Origen          | Comportamiento                 |
| --------------- | ------------------------------ |
| Mensajes directos | Sesión compartida de forma predeterminada |
| Chats de grupo  | Aislados por grupo             |
| Salas/canales   | Aislados por sala              |
| Trabajos de Cron | Sesión nueva en cada ejecución |
| Webhooks        | Aislados por hook              |

## Aislamiento de mensajes directos

De forma predeterminada, todos los mensajes directos comparten una sesión para mantener la continuidad. Esto es adecuado para configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, habilita el aislamiento de mensajes directos. Sin él, todos los usuarios comparten el mismo contexto de conversación: los mensajes privados de Alice serían visibles para Bob.
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

- `main` (predeterminado): todos los mensajes directos comparten una sola sesión.
- `per-peer`: aísla por remitente (entre canales).
- `per-channel-peer`: aísla por canal + remitente (recomendado).
- `per-account-channel-peer`: aísla por cuenta + canal + remitente.

<Tip>
Si la misma persona se pone en contacto contigo desde varios canales, usa
`session.identityLinks` para vincular sus identidades y que compartan una sola sesión.
</Tip>

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de la sesión

Las sesiones se reutilizan hasta que caducan:

- **Restablecimiento diario** (predeterminado): nueva sesión a las 4:00 AM hora local en el host del gateway.
- **Restablecimiento por inactividad** (opcional): nueva sesión después de un período de inactividad. Establece `session.reset.idleMinutes`.
- **Restablecimiento manual**: escribe `/new` o `/reset` en el chat. `/new <model>` también cambia el modelo.

Cuando están configurados tanto el restablecimiento diario como el de inactividad, prevalece el que caduque primero.

Las sesiones con una sesión CLI activa propiedad del proveedor no se cortan por el valor implícito predeterminado diario. Usa `/reset` o configura `session.reset` explícitamente cuando esas sesiones deban caducar según un temporizador.

## Dónde vive el estado

Todo el estado de sesión pertenece al **gateway**. Los clientes de UI consultan al gateway para obtener datos de sesión.

- **Almacén:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripciones:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Mantenimiento de sesiones

OpenClaw limita automáticamente el almacenamiento de sesiones con el tiempo. De forma predeterminada, se ejecuta
en modo `warn` (informa de lo que se limpiaría). Establece `session.maintenance.mode`
en `"enforce"` para una limpieza automática:

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

## Inspeccionar sesiones

- `openclaw status`: ruta del almacén de sesiones y actividad reciente.
- `openclaw sessions --json`: todas las sesiones (filtra con `--active <minutes>`).
- `/status` en el chat: uso del contexto, modelo y alternancias.
- `/context list`: qué hay en el prompt del sistema.

## Lecturas adicionales

- [Depuración de sesiones](/es/concepts/session-pruning): recorte de resultados de herramientas
- [Compaction](/es/concepts/compaction): resumir conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool): herramientas del agente para trabajo entre sesiones
- [Análisis en profundidad de la gestión de sesiones](/es/reference/session-management-compaction): esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multi-Agent](/es/concepts/multi-agent) — enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks) — cómo el trabajo desacoplado crea registros de tareas con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se enrutan los mensajes entrantes a las sesiones

## Relacionado

- [Depuración de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
