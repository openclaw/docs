---
read_when:
    - Quieres comprender el enrutamiento y el aislamiento de sesiones
    - Quieres configurar el alcance de los DM para configuraciones multiusuario
    - Estás depurando restablecimientos de sesión diarios o por inactividad
summary: Cómo OpenClaw gestiona las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-07-05T11:16:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ad901508e6c39e34fba7cb944b2d8db72524a0327f2bbc1738b3ed449e34b7d
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw enruta cada mensaje entrante a una **sesión** según su origen:
mensajes directos, chats grupales, trabajos cron, etc. Todo el estado de la sesión pertenece al
**Gateway**; los clientes de UI consultan al Gateway para obtener los datos de sesión.

## Cómo se enrutan los mensajes

| Origen             | Comportamiento                         |
| ------------------ | -------------------------------------- |
| Mensajes directos  | Sesión compartida de forma predeterminada |
| Chats grupales     | Aislado por grupo                      |
| Salas/canales      | Aislado por sala                       |
| Trabajos Cron      | Sesión nueva por ejecución             |
| Webhooks           | Aislado por hook                       |

## Aislamiento de DM

De forma predeterminada, todos los DM comparten una sesión para mantener la continuidad, lo cual está bien para
configuraciones de un solo usuario.

<Warning>
Si varias personas pueden enviar mensajes a tu agente, activa el aislamiento de DM. Sin él, todos
los usuarios comparten el mismo contexto de conversación, por lo que los mensajes privados de Alice serían
visibles para Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Opciones de `session.dmScope`:

| Valor                      | Comportamiento                                  |
| -------------------------- | ----------------------------------------------- |
| `main` (predeterminado)    | Todos los DM comparten una sesión               |
| `per-peer`                 | Aislar por remitente, entre canales             |
| `per-channel-peer`         | Aislar por canal + remitente (recomendado)      |
| `per-account-channel-peer` | Aislar por cuenta + canal + remitente           |

<Tip>
Si la misma persona te contacta desde varios canales, usa
`session.identityLinks` para mapear sus identidades a un id de peer canónico, de modo que
compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento mueven la ruta de respuesta de la sesión actual de chat directo a otro
canal vinculado sin iniciar una sesión nueva. Consulta
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos, configuración y
solución de problemas.

Verifica tu configuración con `openclaw security audit`.

## Ciclo de vida de la sesión

Las sesiones se reutilizan hasta que caducan según `session.reset`:

- **Restablecimiento diario** (predeterminado `mode: "daily"`) - sesión nueva a una hora local
  configurada (`session.reset.atHour`, predeterminado `4`, 0-23) en el host del Gateway. La
  vigencia diaria se basa en cuándo comenzó el `sessionId` actual, no en escrituras posteriores
  de metadatos.
- **Restablecimiento por inactividad** (`mode: "idle"`) - sesión nueva después de `session.reset.idleMinutes`
  de inactividad. La vigencia por inactividad se basa en la última interacción real de usuario/canal,
  por lo que los eventos de sistema de Heartbeat, Cron y exec no mantienen viva la
  sesión.
- **Restablecimiento manual** - escribe `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran restablecimientos diarios y por inactividad, gana el que caduque primero.
Los turnos de Heartbeat, Cron, exec y otros eventos de sistema pueden escribir metadatos de sesión,
pero esas escrituras no extienden la vigencia del restablecimiento diario ni por inactividad. Cuando un
restablecimiento cambia la sesión, los avisos de eventos de sistema en cola para la sesión anterior se
descartan para que las actualizaciones de fondo obsoletas no se antepongan al primer prompt de
la nueva sesión.

Las sesiones con una sesión CLI activa propiedad del proveedor no se cortan por el valor diario
implícito predeterminado. Usa `/reset` o configura `session.reset` explícitamente cuando esas
sesiones deban caducar con un temporizador.

Anula el valor predeterminado por tipo de chat o por canal:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` admite `direct` (alias heredado `dm`), `group` y `thread`.
El valor heredado de nivel superior `session.idleMinutes` sigue funcionando como alias de compatibilidad para
un valor predeterminado de modo inactivo cuando no hay ningún bloque `session.reset`/`resetByType` configurado.

## Dónde vive el estado

- **Almacén:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripciones:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` mantiene marcas de tiempo de ciclo de vida separadas:

- `sessionStartedAt`: cuándo comenzó el `sessionId` actual; el restablecimiento diario usa esto.
- `lastInteractionAt`: última interacción de usuario/canal que extiende la vida útil por inactividad.
- `updatedAt`: última mutación de fila del almacén; útil para listar y podar, pero no
  autoritativa para la vigencia de restablecimiento diario/por inactividad.

Las filas antiguas sin `sessionStartedAt` se resuelven desde el encabezado de sesión JSONL de la transcripción
cuando está disponible. Si a una fila antigua también le falta `lastInteractionAt`,
la vigencia por inactividad recurre a la hora de inicio de esa sesión, no a escrituras posteriores de
mantenimiento interno.

## Mantenimiento de sesiones

OpenClaw limita el almacenamiento de sesiones con el tiempo mediante `session.maintenance`; se muestran los valores
predeterminados:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" applies cleanup; "warn" only reports
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Para límites `maxEntries` de tamaño de producción, las escrituras del runtime del Gateway usan un pequeño
búfer de marca alta y limpian por lotes hasta volver al límite configurado.
Las lecturas del almacén de sesiones no podan ni limitan entradas durante el inicio del Gateway, por lo que
el inicio y las sesiones Cron aisladas no pagan el costo de una limpieza completa del almacén.
`openclaw sessions cleanup --enforce` aplica el límite inmediatamente.

Las sesiones de sondeo de ejecución de modelo del Gateway son de vida corta de forma predeterminada. Las filas que coinciden con
`agent:*:explicit:model-run-<uuid>` usan una retención fija de `24h`, pero la limpieza está
limitada por presión: solo elimina filas de sondeo obsoletas cuando se alcanza la presión de
mantenimiento/límite de entradas de sesión, y se ejecuta antes del corte de edad de entradas obsoletas
más amplio y del límite de entradas. Las sesiones directas, grupales, de hilo, Cron, hook, Heartbeat,
ACP y de subagente normales no heredan esta retención de 24h.

El mantenimiento conserva punteros duraderos a conversaciones externas, incluidas las sesiones de grupo
y las sesiones de chat con ámbito de hilo, mientras permite que las entradas sintéticas de Cron,
hook, Heartbeat, ACP y subagente caduquen.

Si antes usabas aislamiento de DM y luego devolviste `session.dmScope` a
`main`, previsualiza las filas de DM obsoletas basadas en claves de peer con
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Aplicar el mismo flag
retira esas filas antiguas de DM directo y conserva sus transcripciones como archivos eliminados.

Previsualiza cualquier ejecución de mantenimiento con `openclaw sessions cleanup --dry-run`.

## Inspeccionar sesiones

| Comando                    | Muestra                                           |
| -------------------------- | ------------------------------------------------- |
| `openclaw status`          | Ruta del almacén de sesiones y actividad reciente |
| `openclaw sessions --json` | Todas las sesiones (filtra con `--active <minutes>`) |
| `/status` en el chat       | Uso de contexto, modelo y conmutadores            |
| `/context list`            | Qué hay en el prompt del sistema                  |

## Lecturas adicionales

- [Poda de sesiones](/es/concepts/session-pruning) - recortar resultados de herramientas
- [Compaction](/es/concepts/compaction) - resumir conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool) - herramientas de agente para trabajo entre sesiones
- [Análisis profundo de la gestión de sesiones](/es/reference/session-management-compaction) -
  esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multiagente](/es/concepts/multi-agent) - enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks) - cómo el trabajo desacoplado crea registros de tareas con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing) - cómo los mensajes entrantes se enrutan a sesiones

## Relacionado

- [Poda de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
