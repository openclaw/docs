---
read_when:
    - Quieres entender el enrutamiento y el aislamiento de sesiones
    - Desea configurar el alcance de los mensajes directos para configuraciones multiusuario
    - Está depurando restablecimientos de sesión diarios o por inactividad
summary: Cómo OpenClaw gestiona las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-05-02T20:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiza las conversaciones en **sesiones**. Cada mensaje se enruta a una
sesión según su origen: DM, chats grupales, trabajos Cron, etc.

## Cómo se enrutan los mensajes

| Origen             | Comportamiento                         |
| ------------------ | -------------------------------------- |
| Mensajes directos  | Sesión compartida de forma predeterminada |
| Chats grupales     | Aislada por grupo                      |
| Salas/canales      | Aislada por sala                       |
| Trabajos Cron      | Sesión nueva en cada ejecución         |
| Webhooks           | Aislada por hook                       |

## Aislamiento de DM

De forma predeterminada, todos los DM comparten una sesión para mantener la continuidad. Esto está bien para
configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, habilita el aislamiento de DM. Sin él, todos los
usuarios comparten el mismo contexto de conversación: los mensajes privados de Alice serían
visibles para Bob.
</Warning>

**La corrección:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Otras opciones:

- `main` (predeterminado): todos los DM comparten una sesión.
- `per-peer`: aislar por remitente (entre canales).
- `per-channel-peer`: aislar por canal + remitente (recomendado).
- `per-account-channel-peer`: aislar por cuenta + canal + remitente.

<Tip>
Si la misma persona te contacta desde varios canales, usa
`session.identityLinks` para vincular sus identidades de modo que compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento permiten que un usuario mueva la ruta de respuesta de la sesión actual de chat directo a
otro canal vinculado sin iniciar una sesión nueva. Consulta
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos, configuración y
solución de problemas.

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de la sesión

Las sesiones se reutilizan hasta que caducan:

- **Restablecimiento diario** (predeterminado): sesión nueva a las 4:00 a. m., hora local, en el host del Gateway. La frescura diaria se basa en cuándo comenzó el `sessionId` actual, no
  en escrituras de metadatos posteriores.
- **Restablecimiento por inactividad** (opcional): sesión nueva tras un período de inactividad. Configura
  `session.reset.idleMinutes`. La frescura por inactividad se basa en la última interacción real de
  usuario/canal, por lo que los eventos de sistema Heartbeat, Cron y exec no
  mantienen viva la sesión.
- **Restablecimiento manual**: escribe `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran tanto el restablecimiento diario como el de inactividad, gana el que caduque primero.
Los turnos de Heartbeat, Cron, exec y otros eventos de sistema pueden escribir metadatos de sesión,
pero esas escrituras no extienden la frescura del restablecimiento diario ni por inactividad. Cuando un restablecimiento
cambia la sesión, los avisos de eventos de sistema en cola para la sesión anterior se
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
- `lastInteractionAt`: última interacción de usuario/canal que extiende la vida por inactividad.
- `updatedAt`: última mutación de fila del almacén; útil para listar y podar, pero no
  autoritativa para la frescura del restablecimiento diario/por inactividad.

Las filas antiguas sin `sessionStartedAt` se resuelven desde el encabezado de sesión JSONL de la transcripción
cuando está disponible. Si una fila antigua tampoco tiene `lastInteractionAt`,
la frescura por inactividad recurre a la hora de inicio de esa sesión, no a escrituras de contabilidad
posteriores.

## Mantenimiento de sesiones

OpenClaw limita automáticamente el almacenamiento de sesiones con el tiempo. De forma predeterminada, se ejecuta
en modo `warn` (informa lo que se limpiaría). Configura `session.maintenance.mode`
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

Para límites de `maxEntries` de tamaño de producción, las escrituras en runtime del Gateway usan un pequeño búfer de marca alta y limpian por lotes hasta volver al límite configurado. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el inicio del Gateway. Esto evita ejecutar una limpieza completa del almacén en cada inicio o sesión Cron aislada. `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.

El mantenimiento conserva punteros duraderos a conversaciones externas, incluidas sesiones de grupo
y sesiones de chat con alcance de hilo, mientras permite que las entradas sintéticas de Cron,
hook, Heartbeat, ACP y subagente caduquen.

Previsualiza con `openclaw sessions cleanup --dry-run`.

## Inspección de sesiones

- `openclaw status`: ruta del almacén de sesiones y actividad reciente.
- `openclaw sessions --json`: todas las sesiones (filtra con `--active <minutes>`).
- `/status` en el chat: uso de contexto, modelo y toggles.
- `/context list`: qué hay en el prompt del sistema.

## Lecturas adicionales

- [Poda de sesiones](/es/concepts/session-pruning): recorte de resultados de herramientas
- [Compaction](/es/concepts/compaction): resumen de conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool): herramientas de agente para trabajo entre sesiones
- [Análisis profundo de gestión de sesiones](/es/reference/session-management-compaction):
  esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multiagente](/es/concepts/multi-agent) — enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks) — cómo el trabajo separado crea registros de tareas con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo los mensajes entrantes se enrutan a sesiones

## Relacionado

- [Poda de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
