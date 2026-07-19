---
read_when:
    - Se desea comprender el enrutamiento y el aislamiento de sesiones
    - Se desea configurar el ámbito de los mensajes directos para entornos multiusuario
    - Está depurando los restablecimientos diarios o por inactividad de las sesiones
summary: Cómo gestiona OpenClaw las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-07-19T13:35:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f088fe128201a53b10a1b103c9a7be4dd45162e8bbbb174c2a3c4b9663f1eeb6
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw dirige cada mensaje entrante a una **sesión** según su procedencia:
mensajes directos, chats grupales, trabajos de Cron, etc. Todo el estado de las
sesiones pertenece al **Gateway**; los clientes de interfaz consultan al Gateway
para obtener los datos de las sesiones.

Para conocer la configuración predeterminada del agente personal —una
conversación continua compartida por todos los canales de mensajes directos,
a la que se incorporan la actividad grupal y el trabajo en segundo plano—,
consulte [La sesión principal](/concepts/main-session).

## Cómo se dirigen los mensajes

| Origen             | Comportamiento                         |
| ------------------ | -------------------------------------- |
| Mensajes directos  | Sesión compartida de forma predeterminada |
| Chats grupales     | Aislada por grupo                      |
| Salas/canales      | Aislada por sala                       |
| Trabajos de Cron   | Sesión nueva en cada ejecución         |
| Webhooks           | Aislada por enlace                     |

## Aislamiento de mensajes directos

De forma predeterminada, todos los mensajes directos comparten una sesión para
mantener la continuidad, lo cual resulta adecuado en configuraciones de un solo
usuario.

<Warning>
Si varias personas pueden enviar mensajes al agente, active el aislamiento de
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

| Valor                      | Comportamiento                                                 |
| -------------------------- | -------------------------------------------------------------- |
| `main` (predeterminado) | Todos los mensajes directos comparten la [sesión principal](/concepts/main-session) |
| `per-peer`                 | Aislar por remitente entre distintos canales                   |
| `per-channel-peer`         | Aislar por canal + remitente (recomendado)                      |
| `per-account-channel-peer` | Aislar por cuenta + canal + remitente                           |

<Tip>
Si la misma persona establece contacto desde varios canales, use
`session.identityLinks` para asociar sus identidades con un identificador canónico
de interlocutor y que así compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento trasladan la ruta de respuesta de la sesión actual
del chat directo a otro canal vinculado sin iniciar una sesión nueva. Consulte
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos,
configuración y solución de problemas.

Verifique la configuración con `openclaw security audit`.

## Recordar entre conversaciones

Las transcripciones independientes controlan el historial local de cada
conversación. Para un agente personal o de plena confianza,
`memorySearch.rememberAcrossConversations: true` añade un paso opcional de recuperación entre las demás
conversaciones privadas de ese agente; no combina sus transcripciones.

Las conversaciones directas privadas y las conversaciones explícitas
persistentes de la interfaz pueden proporcionarse contexto relevante entre sí.
Los grupos y canales permanecen separados en ambas direcciones: sus
transcripciones no son fuentes de recuperación privada, y las respuestas de
esas conversaciones no reciben contexto de transcripciones privadas. También
se excluye la conversación actual porque su historial ya está cargado.

Esta opción no modifica las claves de sesión, el ámbito de los mensajes
directos, el enrutamiento, la entrega ni `tools.sessions.visibility`. La memoria
compartida del espacio de trabajo en `MEMORY.md` y
`memory/*.md` también conserva su comportamiento actual. El proveedor de
memoria actual debe admitir la recuperación protegida de transcripciones
privadas; los motores de contexto como Lossless Claw permanecen independientes
y pueden ejecutarse junto con ella. Consulte
[Active Memory](/es/concepts/active-memory#remember-across-conversations) para
conocer los detalles de configuración y ejecución.

## Ciclo de vida de las sesiones

Las sesiones se reutilizan hasta que se restablecen manualmente o se habilita
una política de restablecimiento automático:

- **Sin restablecimiento automático** (`mode: "none"` predeterminado): las sesiones conservan el mismo
  `sessionId`; Compaction administra el contexto activo a medida que crece la conversación.
- **Restablecimiento diario** (`mode: "daily"`): habilita una sesión nueva a una hora local
  configurada (`session.reset.atHour`, `4` de forma predeterminada, 0-23) en el host del Gateway. La
  vigencia diaria se basa en el momento en que comenzó el `sessionId` actual, no en escrituras posteriores
  de metadatos.
- **Restablecimiento por inactividad** (`mode: "idle"`): habilita una sesión nueva después de `session.reset.idleMinutes`
  de inactividad. La vigencia por inactividad se basa en la última interacción
  real del usuario o canal, por lo que los eventos del sistema de Heartbeat,
  Cron y ejecución no mantienen activa la sesión.
- **Restablecimiento manual**: escriba `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran tanto el restablecimiento diario como el restablecimiento
por inactividad, se aplica el que venza primero. Los turnos de Heartbeat, Cron,
ejecución y otros eventos del sistema pueden escribir metadatos de sesión, pero
esas escrituras no amplían la vigencia del restablecimiento diario ni por
inactividad. Cuando un restablecimiento renueva la sesión, se descartan los
avisos de eventos del sistema en cola de la sesión anterior para evitar que se
antepongan actualizaciones antiguas en segundo plano al primer prompt de la
sesión nueva.

Las sesiones con una sesión activa de CLI perteneciente al proveedor siguen el
mismo comportamiento predeterminado sin restablecimiento automático. Use
`/reset` o configure `session.reset` explícitamente cuando esas
sesiones deban vencer según un temporizador.

Habilite los restablecimientos automáticos globalmente y, después,
sobrescríbalos por tipo de chat o canal:

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
El valor heredado de nivel superior `session.idleMinutes` continúa funcionando
como alias de compatibilidad para un valor predeterminado en modo de
inactividad cuando no se define ningún bloque
`session.reset`/`resetByType`.

## Ubicación del estado

- **Filas de sesiones en ejecución:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Archivos de transcripciones archivadas:** `~/.openclaw/agents/<agentId>/sessions/`
- **Origen de migración de filas heredadas:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Las filas de sesiones de la base de datos SQLite de cada agente conservan
marcas de tiempo independientes del ciclo de vida:

- `sessionStartedAt`: momento en el que comenzó el `sessionId` actual; el restablecimiento diario utiliza este valor.
- `lastInteractionAt`: última interacción del usuario o canal que amplía el periodo de actividad.
- `updatedAt`: última modificación de la fila del almacén; resulta útil para enumerar y depurar, pero no
  es la referencia oficial para la vigencia del restablecimiento diario o por inactividad.

Durante la migración desde instalaciones anteriores, el inicio del Gateway y
`openclaw doctor
--fix` importan automáticamente a SQLite las filas heredadas de
`sessions.json` y el historial activo de transcripciones JSONL. Las filas
sin `sessionStartedAt` se resuelven a partir del encabezado de sesión de la
transcripción JSONL heredada cuando está disponible. Si una fila anterior
tampoco contiene `lastInteractionAt`, la vigencia por inactividad recurre a la
hora de inicio de esa sesión, no a escrituras administrativas posteriores. Use
`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y la [secuencia de migración de
Doctor](/es/cli/doctor#session-sqlite-migration) cuando se necesiten pruebas
explícitas de inspección o validación.

## Mantenimiento de sesiones

OpenClaw limita el almacenamiento de sesiones a lo largo del tiempo mediante
`session.maintenance`; a continuación se muestran los valores predeterminados:

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

Para límites de `maxEntries` propios de entornos de producción, las
escrituras del Gateway durante la ejecución utilizan un pequeño búfer por
encima del límite máximo y realizan una limpieza por lotes hasta alcanzar el
límite configurado. Las lecturas del almacén de sesiones no depuran ni limitan
las entradas durante el inicio del Gateway, por lo que el inicio y las sesiones
aisladas de Cron no afrontan el coste de una limpieza completa del almacén.
`openclaw sessions cleanup --enforce` aplica el límite inmediatamente.

Las sesiones de sondeo de ejecución de modelos del Gateway tienen una duración
breve de forma predeterminada. Las filas que coinciden con
`agent:*:explicit:model-run-<uuid>` utilizan una retención fija de `24h`, pero la
limpieza depende de la presión: solo elimina las filas de sondeo obsoletas
cuando se alcanza la presión de mantenimiento o del límite de entradas de
sesión, y se ejecuta antes del límite general de antigüedad de las entradas
obsoletas y del límite de entradas. Las sesiones normales directas, grupales,
de hilos, Cron, enlaces, Heartbeat, ACP y subagentes no heredan esta retención
de 24h.

El mantenimiento conserva los punteros externos duraderos de conversaciones,
incluidas las sesiones grupales y las sesiones de chat delimitadas por hilos,
al tiempo que permite que las entradas sintéticas de Cron, enlaces, Heartbeat,
ACP y subagentes caduquen.

Si anteriormente se utilizó el aislamiento de mensajes directos y después se
restableció `session.dmScope` a `main`, previsualice las filas
obsoletas de mensajes directos con claves por interlocutor mediante
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Al aplicar la misma opción, se retiran esas filas antiguas
de mensajes directos y sus transcripciones se conservan como archivos
eliminados.

Previsualice cualquier ejecución de mantenimiento con `openclaw sessions cleanup --dry-run`.

## Inspección de sesiones

| Comando                    | Muestra                                           |
| -------------------------- | ------------------------------------------------- |
| `openclaw status`          | Ruta del almacén de sesiones y actividad reciente |
| `openclaw sessions --json` | Todas las sesiones (filtrar con `--active <minutes>`) |
| `/status` en el chat          | Uso del contexto, modelo y opciones               |
| `/context list`            | Contenido del prompt del sistema                  |

## Lecturas adicionales

- [Búsqueda de sesiones](/es/concepts/session-search): recuperación de texto completo en transcripciones anteriores
- [Depuración de sesiones](/es/concepts/session-pruning): reducción de los resultados de herramientas
- [Compaction](/es/concepts/compaction): resumen de conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool): herramientas del agente para trabajar entre sesiones
- [Análisis detallado de la administración de sesiones](/es/reference/session-management-compaction):
  esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Varios agentes](/es/concepts/multi-agent): enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks): cómo el trabajo desacoplado crea registros de tareas con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing): cómo se dirigen los mensajes entrantes a las sesiones

## Contenido relacionado

- [Depuración de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
