---
read_when:
    - Quiere comprender el enrutamiento y el aislamiento de sesiones
    - Desea configurar el alcance de los mensajes directos para configuraciones multiusuario
    - Estás depurando restablecimientos de sesión diarios o por inactividad
summary: Cómo OpenClaw gestiona las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-05-07T13:15:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiza las conversaciones en **sesiones**. Cada mensaje se enruta a una
sesión según su origen: DMs, chats grupales, trabajos Cron, etc.

## Cómo se enrutan los mensajes

| Fuente          | Comportamiento                  |
| --------------- | ------------------------------- |
| Mensajes directos | Sesión compartida por defecto |
| Chats grupales  | Aislado por grupo               |
| Salas/canales   | Aislado por sala                |
| Trabajos Cron   | Sesión nueva por ejecución      |
| Webhooks        | Aislado por hook                |

## Aislamiento de DM

Por defecto, todos los DMs comparten una sesión para mantener la continuidad. Esto está bien para
configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, habilita el aislamiento de DM. Sin él, todos
los usuarios comparten el mismo contexto de conversación: los mensajes privados de Alice serían
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

- `main` (predeterminado) -- todos los DMs comparten una sesión.
- `per-peer` -- aislar por remitente (entre canales).
- `per-channel-peer` -- aislar por canal + remitente (recomendado).
- `per-account-channel-peer` -- aislar por cuenta + canal + remitente.

<Tip>
Si la misma persona se contacta contigo desde varios canales, usa
`session.identityLinks` para vincular sus identidades, de modo que compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento permiten que un usuario mueva la ruta de respuesta de la sesión actual de chat directo a
otro canal vinculado sin iniciar una sesión nueva. Consulta
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos, configuración y
solución de problemas.

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de la sesión

Las sesiones se reutilizan hasta que expiran:

- **Restablecimiento diario** (predeterminado) -- sesión nueva a las 4:00 AM hora local en el host de Gateway. La frescura diaria se basa en cuándo comenzó el `sessionId` actual, no
  en escrituras de metadatos posteriores.
- **Restablecimiento por inactividad** (opcional) -- sesión nueva después de un período de inactividad. Configura
  `session.reset.idleMinutes`. La frescura por inactividad se basa en la última interacción real
  de usuario/canal, por lo que los eventos del sistema de heartbeat, Cron y exec no
  mantienen viva la sesión.
- **Restablecimiento manual** -- escribe `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran restablecimientos diarios y por inactividad, gana el que expire primero.
Los turnos de Heartbeat, Cron, exec y otros eventos del sistema pueden escribir metadatos de sesión,
pero esas escrituras no extienden la frescura del restablecimiento diario o por inactividad. Cuando un restablecimiento
cambia la sesión, los avisos de eventos del sistema en cola para la sesión anterior se
descartan para que las actualizaciones en segundo plano obsoletas no se antepongan al primer prompt en
la nueva sesión.

Las sesiones con una sesión CLI activa propiedad del proveedor no se cortan por el valor diario
predeterminado implícito. Usa `/reset` o configura `session.reset` explícitamente cuando esas
sesiones deban expirar con un temporizador.

## Dónde vive el estado

Todo el estado de sesión pertenece al **Gateway**. Los clientes de UI consultan al Gateway para obtener
datos de sesión.

- **Almacén:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripciones:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene marcas de tiempo de ciclo de vida separadas:

- `sessionStartedAt`: cuándo comenzó el `sessionId` actual; el restablecimiento diario usa esto.
- `lastInteractionAt`: última interacción de usuario/canal que extiende la duración por inactividad.
- `updatedAt`: última mutación de la fila del almacén; útil para listar y podar, pero no
  autoritativa para la frescura del restablecimiento diario/por inactividad.

Las filas antiguas sin `sessionStartedAt` se resuelven desde el encabezado de sesión JSONL de la transcripción
cuando está disponible. Si a una fila antigua también le falta `lastInteractionAt`,
la frescura por inactividad recae en la hora de inicio de esa sesión, no en escrituras posteriores
de mantenimiento.

## Mantenimiento de sesiones

OpenClaw limita automáticamente el almacenamiento de sesiones con el tiempo. Por defecto, se ejecuta
en modo `warn` (informa qué se limpiaría). Configura `session.maintenance.mode`
en `"enforce"` para limpieza automática:

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

Para límites `maxEntries` de tamaño de producción, las escrituras en tiempo de ejecución de Gateway usan un pequeño búfer de marca alta y limpian en lotes hasta volver al límite configurado. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el arranque de Gateway. Esto evita ejecutar una limpieza completa del almacén en cada arranque o sesión Cron aislada. `openclaw sessions cleanup --enforce` aplica el límite inmediatamente.

El mantenimiento conserva punteros duraderos a conversaciones externas, incluidas sesiones de grupo
y sesiones de chat con alcance de hilo, mientras aún permite que entradas sintéticas de Cron,
hook, Heartbeat, ACP y subagente envejezcan y se eliminen.

Si antes usabas aislamiento de mensajes directos y luego devolviste
`session.dmScope` a `main`, previsualiza filas de DM obsoletas con clave de peer con
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Aplicar la misma bandera
retira esas filas antiguas de DM directo y mantiene sus transcripciones como archivos
eliminados.

Previsualiza con `openclaw sessions cleanup --dry-run`.

## Inspeccionar sesiones

- `openclaw status` -- ruta del almacén de sesiones y actividad reciente.
- `openclaw sessions --json` -- todas las sesiones (filtra con `--active <minutes>`).
- `/status` en el chat -- uso de contexto, modelo y opciones.
- `/context list` -- qué hay en el prompt del sistema.

## Lecturas adicionales

- [Poda de sesiones](/es/concepts/session-pruning) -- recortar resultados de herramientas
- [Compaction](/es/concepts/compaction) -- resumir conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool) -- herramientas de agente para trabajo entre sesiones
- [Análisis profundo de gestión de sesiones](/es/reference/session-management-compaction) --
  esquema de almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multiagente](/es/concepts/multi-agent) — enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks) — cómo el trabajo desacoplado crea registros de tarea con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo los mensajes entrantes se enrutan a sesiones

## Relacionado

- [Poda de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
