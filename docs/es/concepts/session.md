---
read_when:
    - Quieres comprender el enrutamiento y el aislamiento de las sesiones
    - Se quiere configurar el ámbito de los mensajes directos para entornos multiusuario
    - Estás depurando los restablecimientos diarios o por inactividad de las sesiones
summary: Cómo gestiona OpenClaw las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-07-12T14:26:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw dirige cada mensaje entrante a una **sesión** según su procedencia:
mensajes directos, chats grupales, tareas Cron, etc. Todo el estado de las
sesiones pertenece al **Gateway**; los clientes de interfaz consultan al Gateway
para obtener los datos de las sesiones.

## Cómo se dirigen los mensajes

| Origen            | Comportamiento                        |
| ----------------- | ------------------------------------- |
| Mensajes directos | Sesión compartida de forma predeterminada |
| Chats grupales    | Aislada por grupo                     |
| Salas/canales     | Aislada por sala                      |
| Tareas Cron       | Sesión nueva en cada ejecución        |
| Webhooks          | Aislada por Webhook                   |

## Aislamiento de mensajes directos

De forma predeterminada, todos los mensajes directos comparten una sesión para
mantener la continuidad, lo cual resulta adecuado para configuraciones de un
solo usuario.

<Warning>
Si varias personas pueden enviar mensajes al agente, habilite el aislamiento de
mensajes directos. Sin él, todos los usuarios comparten el mismo contexto de
conversación, por lo que los mensajes privados de Alice serían visibles para
Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // aislar por canal + remitente
  },
}
```

Opciones de `session.dmScope`:

| Valor                      | Comportamiento                                  |
| -------------------------- | ----------------------------------------------- |
| `main` (predeterminado)    | Todos los mensajes directos comparten una sesión |
| `per-peer`                 | Aislar por remitente entre canales             |
| `per-channel-peer`         | Aislar por canal + remitente (recomendado)      |
| `per-account-channel-peer` | Aislar por cuenta + canal + remitente           |

<Tip>
Si la misma persona se pone en contacto desde varios canales, use
`session.identityLinks` para asignar sus identidades a un único identificador
canónico de interlocutor, de modo que compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento trasladan la ruta de respuesta de la sesión actual de chat directo a otro
canal vinculado sin iniciar una sesión nueva. Consulte
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos, configuración y
solución de problemas.

Verifique la configuración con `openclaw security audit`.

## Ciclo de vida de las sesiones

Las sesiones se reutilizan hasta que caducan según `session.reset`:

- **Restablecimiento diario** (`mode: "daily"` de forma predeterminada): se inicia una sesión nueva a una hora local
  configurada (`session.reset.atHour`, valor predeterminado `4`, 0-23) en el host del Gateway. La
  vigencia diaria se basa en el momento en que se inició el `sessionId` actual, no en escrituras
  posteriores de metadatos.
- **Restablecimiento por inactividad** (`mode: "idle"`): se inicia una sesión nueva después de `session.reset.idleMinutes`
  de inactividad. La vigencia por inactividad se basa en la última interacción real del usuario o del canal,
  por lo que los eventos del sistema de Heartbeat, Cron y ejecución no mantienen activa la
  sesión.
- **Restablecimiento manual**: escriba `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran tanto el restablecimiento diario como el restablecimiento por inactividad, prevalece el que caduque primero.
Los turnos de Heartbeat, Cron, ejecución y otros eventos del sistema pueden escribir metadatos de la sesión,
pero esas escrituras no prolongan la vigencia del restablecimiento diario ni por inactividad. Cuando un restablecimiento
renueva la sesión, se descartan las notificaciones de eventos del sistema en cola correspondientes a la sesión anterior
para evitar que las actualizaciones obsoletas en segundo plano se antepongan al primer prompt de
la sesión nueva.

Las sesiones con una sesión de CLI activa gestionada por el proveedor no se interrumpen por el valor predeterminado
diario implícito. Use `/reset` o configure `session.reset` explícitamente cuando esas
sesiones deban caducar según un temporizador.

Anule el valor predeterminado por tipo de chat o por canal:

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
La opción heredada de nivel superior `session.idleMinutes` sigue funcionando como alias de compatibilidad para
un valor predeterminado del modo de inactividad cuando no se configura ningún bloque `session.reset`/`resetByType`.

## Dónde reside el estado

- **Filas de sesión en tiempo de ejecución:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Archivos de transcripciones archivadas:** `~/.openclaw/agents/<agentId>/sessions/`
- **Origen de migración de filas heredadas:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Las filas de sesión de la base de datos SQLite por agente mantienen marcas de tiempo
separadas para el ciclo de vida:

- `sessionStartedAt`: momento en que comenzó el `sessionId` actual; el restablecimiento diario usa este valor.
- `lastInteractionAt`: última interacción del usuario/canal que prolonga la duración de la inactividad.
- `updatedAt`: última modificación de la fila del almacén; resulta útil para listar y depurar, pero no
  es la referencia autoritativa para determinar la vigencia del restablecimiento diario o por inactividad.

Durante la migración desde instalaciones anteriores, el inicio del Gateway y `openclaw doctor
--fix` importan automáticamente en SQLite las filas heredadas de `sessions.json` y el historial
activo de transcripciones JSONL. Las filas sin `sessionStartedAt` se resuelven a partir del
encabezado de sesión de la transcripción JSONL heredada cuando está disponible. Si una fila anterior
tampoco tiene `lastInteractionAt`, la vigencia de la inactividad recurre a la hora de inicio de esa sesión,
no a escrituras administrativas posteriores. Use `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y la [secuencia de migración de
Doctor](/es/cli/doctor#session-sqlite-migration) cuando necesite pruebas explícitas
de inspección o validación.

## Mantenimiento de sesiones

OpenClaw limita el almacenamiento de sesiones a lo largo del tiempo mediante `session.maintenance`; a
continuación se muestran los valores predeterminados:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" aplica la limpieza; "warn" solo informa
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Para límites de `maxEntries` propios de entornos de producción, las escrituras del entorno de ejecución del Gateway usan un pequeño
búfer de límite superior y realizan la limpieza por lotes hasta volver al máximo configurado.
Las lecturas del almacén de sesiones no depuran ni limitan las entradas durante el inicio del Gateway, por lo que
el inicio y las sesiones Cron aisladas no soportan el coste de una limpieza completa del almacén.
`openclaw sessions cleanup --enforce` aplica el límite inmediatamente.

Las sesiones de sondeo de ejecuciones de modelos del Gateway tienen una duración corta de forma predeterminada. Las filas que coinciden con
`agent:*:explicit:model-run-<uuid>` usan una retención fija de `24h`, pero la limpieza está
condicionada por la presión: solo elimina filas de sondeo obsoletas cuando se alcanza la presión
del mantenimiento o del límite de entradas de sesión, y se ejecuta antes que el límite general
de antigüedad de entradas obsoletas y el límite de entradas. Las sesiones normales directas, de grupo,
de hilo, Cron, hook, Heartbeat, ACP y de subagente no heredan esta retención de 24h.

El mantenimiento conserva los punteros duraderos a conversaciones externas, incluidas las sesiones de grupo
y las sesiones de chat asociadas a hilos, al tiempo que permite que las entradas sintéticas de Cron,
hook, Heartbeat, ACP y subagentes caduquen.

Si anteriormente usaba el aislamiento de DM y después volvió a establecer `session.dmScope` en
`main`, previsualice las filas obsoletas de DM con claves por par mediante
`openclaw sessions cleanup --dry-run --fix-dm-scope`. La aplicación de la misma opción
retira esas antiguas filas de DM directos y conserva sus transcripciones como archivos
eliminados.

Previsualice cualquier ejecución de mantenimiento con `openclaw sessions cleanup --dry-run`.

## Inspección de sesiones

| Comando                    | Muestra                                           |
| -------------------------- | ------------------------------------------------- |
| `openclaw status`          | Ruta del almacén de sesiones y actividad reciente |
| `openclaw sessions --json` | Todas las sesiones (filtre con `--active <minutes>`) |
| `/status` en el chat       | Uso del contexto, modelo y opciones               |
| `/context list`            | Contenido del prompt del sistema                  |

## Lecturas adicionales

- [Búsqueda de sesiones](/concepts/session-search) - recuperación de texto completo en transcripciones anteriores
- [Depuración de sesiones](/es/concepts/session-pruning) - recorte de resultados de herramientas
- [Compaction](/es/concepts/compaction) - resumen de conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool) - herramientas de agente para el trabajo entre sesiones
- [Análisis detallado de la gestión y Compaction de sesiones](/es/reference/session-management-compaction) -
  esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Multiagente](/es/concepts/multi-agent) - enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks) - cómo el trabajo desvinculado crea registros de tareas con referencias a sesiones
- [Enrutamiento de canales](/es/channels/channel-routing) - cómo se enrutan los mensajes entrantes a las sesiones

## Relacionado

- [Depuración de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
