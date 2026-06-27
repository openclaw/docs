---
read_when:
    - Quieres entender el enrutamiento y el aislamiento de sesiones
    - Quieres configurar el alcance de los MD para configuraciones multiusuario
    - Estás depurando restablecimientos diarios o de sesiones inactivas
summary: Cómo gestiona OpenClaw las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-06-27T11:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiza las conversaciones en **sesiones**. Cada mensaje se enruta a una
sesión según de dónde provenga: DMs, chats grupales, trabajos Cron, etc.

## Cómo se enrutan los mensajes

| Origen             | Comportamiento                  |
| ------------------ | -------------------------------- |
| Mensajes directos  | Sesión compartida por defecto    |
| Chats grupales     | Aislada por grupo                |
| Salas/canales      | Aislada por sala                 |
| Trabajos Cron      | Sesión nueva por ejecución       |
| Webhooks           | Aislada por hook                 |

## Aislamiento de DMs

Por defecto, todos los DMs comparten una sesión para mantener la continuidad. Esto está bien para
configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, habilita el aislamiento de DMs. Sin él, todos
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

- `main` (predeterminado) -- todos los DMs comparten una sesión.
- `per-peer` -- aislar por remitente (entre canales).
- `per-channel-peer` -- aislar por canal + remitente (recomendado).
- `per-account-channel-peer` -- aislar por cuenta + canal + remitente.

<Tip>
Si la misma persona se comunica contigo desde varios canales, usa
`session.identityLinks` para vincular sus identidades de modo que compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento permiten a un usuario mover la ruta de respuesta de la sesión actual de chat directo a
otro canal vinculado sin iniciar una sesión nueva. Consulta
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos, configuración y
solución de problemas.

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de las sesiones

Las sesiones se reutilizan hasta que caducan:

- **Restablecimiento diario** (predeterminado) -- nueva sesión a las 4:00 a. m., hora local, en el host del Gateway.
  La vigencia diaria se basa en cuándo se inició el `sessionId` actual, no
  en escrituras de metadatos posteriores.
- **Restablecimiento por inactividad** (opcional) -- nueva sesión después de un período de inactividad. Configura
  `session.reset.idleMinutes`. La vigencia por inactividad se basa en la última interacción real
  de usuario/canal, por lo que los eventos del sistema de Heartbeat, Cron y exec no
  mantienen viva la sesión.
- **Restablecimiento manual** -- escribe `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran restablecimientos diario y por inactividad, prevalece el que caduque primero.
Los turnos de Heartbeat, Cron, exec y otros eventos del sistema pueden escribir metadatos de sesión,
pero esas escrituras no prolongan la vigencia de restablecimiento diario ni por inactividad. Cuando un restablecimiento
renueva la sesión, los avisos de eventos del sistema en cola para la sesión anterior se
descartan para que las actualizaciones obsoletas en segundo plano no se antepongan al primer prompt en
la nueva sesión.

Las sesiones con una sesión CLI activa propiedad del proveedor no se cortan por el valor predeterminado diario
implícito. Usa `/reset` o configura `session.reset` explícitamente cuando esas
sesiones deban caducar según un temporizador.

## Dónde vive el estado

Todo el estado de sesión pertenece al **Gateway**. Los clientes de UI consultan el Gateway para obtener
datos de sesión.

- **Almacén:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripciones:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene marcas de tiempo de ciclo de vida separadas:

- `sessionStartedAt`: cuándo comenzó el `sessionId` actual; el restablecimiento diario usa esto.
- `lastInteractionAt`: última interacción de usuario/canal que extiende la vida útil por inactividad.
- `updatedAt`: última mutación de fila del almacén; útil para listar y depurar, pero no
  autoritativa para la vigencia de restablecimiento diario/por inactividad.

Las filas antiguas sin `sessionStartedAt` se resuelven desde el encabezado de sesión JSONL de la transcripción
cuando está disponible. Si una fila antigua tampoco tiene `lastInteractionAt`,
la vigencia por inactividad recurre a esa hora de inicio de sesión, no a escrituras posteriores de
contabilidad.

## Mantenimiento de sesiones

OpenClaw limita automáticamente el almacenamiento de sesiones con el tiempo. Por defecto, se ejecuta
en modo `enforce` y aplica la limpieza durante el mantenimiento. Configura
`session.maintenance.mode` como `"warn"` para informar qué se limpiaría sin mutar el almacén/los archivos:

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

Para límites `maxEntries` de tamaño de producción, las escrituras del runtime del Gateway usan un pequeño búfer de margen superior y limpian en lotes hasta volver al límite configurado. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el arranque del Gateway. Esto evita ejecutar una limpieza completa del almacén en cada arranque o sesión Cron aislada. `openclaw sessions cleanup --enforce` aplica el límite de inmediato.

Las sesiones de sondeo de ejecución de modelo del Gateway tienen vida corta por defecto. Las filas coincidentes con
claves explícitas estrictas como `agent:*:explicit:model-run-<uuid>` usan retención fija de `24h`,
pero la limpieza está condicionada por presión: solo elimina filas de sondeo obsoletas cuando
se alcanza la presión de mantenimiento/límite de entradas de sesión. Cuando se ejecuta la limpieza de ejecuciones de modelo,
se ejecuta antes del corte de antigüedad de entradas obsoletas más amplio y del límite de entradas. Las sesiones normales directas,
de grupo, hilo, Cron, hook, Heartbeat, ACP y subagente no heredan
esta retención de 24 h.

El mantenimiento conserva punteros duraderos de conversaciones externas, incluidas las sesiones de grupo
y las sesiones de chat con ámbito de hilo, mientras sigue permitiendo que las entradas sintéticas de Cron,
hook, Heartbeat, ACP y subagente caduquen.

Si antes usabas aislamiento de mensajes directos y luego devolviste
`session.dmScope` a `main`, previsualiza las filas de DM obsoletas con clave de par con
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Aplicar la misma marca
retira esas filas antiguas de DM directos y conserva sus transcripciones como archivos eliminados.

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
- [Análisis detallado de gestión de sesiones](/es/reference/session-management-compaction) --
  esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multiagente](/es/concepts/multi-agent) — enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks) — cómo el trabajo desacoplado crea registros de tareas con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo los mensajes entrantes se enrutan a sesiones

## Relacionado

- [Poda de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
