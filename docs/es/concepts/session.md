---
read_when:
    - Quiere comprender el enrutamiento y el aislamiento de las sesiones
    - Quieres configurar el ámbito de los mensajes directos para entornos multiusuario
    - Está depurando los reinicios diarios o por inactividad de las sesiones
summary: Cómo gestiona OpenClaw las sesiones de conversación
title: Gestión de sesiones
x-i18n:
    generated_at: "2026-07-22T10:31:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 620891700d89a02186a13d6da24fcf872717e395131657a26a7d4a964c36ac38
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw dirige cada mensaje entrante a una **sesión** según su procedencia:
mensajes directos, chats grupales, trabajos de Cron, etc. Todo el estado de las
sesiones pertenece al **Gateway**; los clientes de IU consultan al Gateway para
obtener los datos de las sesiones.

Para conocer la configuración predeterminada del agente personal —una
conversación continua compartida por todos los canales de mensajes directos,
a la que se incorporan la actividad grupal y el trabajo en segundo plano—,
consulte [La sesión principal](/es/concepts/main-session).

## Cómo se dirigen los mensajes

| Origen            | Comportamiento                            |
| ----------------- | ----------------------------------------- |
| Mensajes directos | Sesión compartida de forma predeterminada |
| Chats grupales    | Aislada por grupo                         |
| Salas/canales     | Aislada por sala                          |
| Trabajos de Cron  | Sesión nueva en cada ejecución            |
| Webhooks          | Aislada por Webhook                       |

## Aislamiento de mensajes directos

De forma predeterminada, todos los mensajes directos comparten una sesión para
mantener la continuidad, lo cual resulta adecuado para configuraciones de un
solo usuario.

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

| Valor                      | Comportamiento                                                    |
| -------------------------- | ----------------------------------------------------------------- |
| `main` (predeterminado)           | Todos los mensajes directos comparten la [sesión principal](/es/concepts/main-session) |
| `per-peer`                 | Aislar por remitente entre distintos canales                      |
| `per-channel-peer`         | Aislar por canal + remitente (recomendado)                         |
| `per-account-channel-peer` | Aislar por cuenta + canal + remitente                              |

<Tip>
Si la misma persona se pone en contacto desde varios canales, use
`session.identityLinks` para asignar sus identidades a un único id canónico de par,
de modo que compartan una sesión.
</Tip>

### Acoplar canales vinculados

Los comandos de acoplamiento trasladan la ruta de respuesta de la sesión actual
de chat directo a otro canal vinculado sin iniciar una sesión nueva. Consulte
[Acoplamiento de canales](/es/concepts/channel-docking) para ver ejemplos,
configuración y resolución de problemas.

Verifique la configuración con `openclaw security audit`.

## Recordar entre conversaciones

Las transcripciones separadas controlan el historial local de cada
conversación. Para un agente personal o de plena confianza,
`memory.search.rememberAcrossConversations: true` añade un paso opcional de recuperación entre las demás
conversaciones privadas de ese agente; no combina sus transcripciones.

Las conversaciones directas privadas y las conversaciones persistentes
explícitas de la IU pueden proporcionarse contexto relevante entre sí. Los
grupos y canales permanecen separados en ambas direcciones: sus transcripciones
no son fuentes privadas de recuerdo, y las respuestas de esas conversaciones
no reciben contexto de transcripciones privadas. La conversación actual también
se excluye porque su historial ya está cargado.

Esta configuración no cambia las claves de sesión, el alcance de los mensajes
directos, el enrutamiento, la entrega ni `tools.sessions.visibility`. La memoria
compartida del espacio de trabajo en `MEMORY.md` y
`memory/*.md` también conserva su comportamiento existente. El proveedor
de memoria actual debe admitir la recuperación protegida de transcripciones
privadas; los motores de contexto como Lossless Claw siguen siendo
independientes y pueden ejecutarse junto con ella. Consulte
[Active Memory](/es/concepts/active-memory#remember-across-conversations) para
obtener detalles sobre la configuración y la ejecución.

## Ciclo de vida de las sesiones

Las sesiones se reutilizan hasta que se restablecen manualmente o se habilita
una política de restablecimiento automático:

- **Sin restablecimiento automático** (`mode: "none"` predeterminado): las sesiones conservan el mismo
  `sessionId`; Compaction administra el contexto activo a medida que crece la conversación.
- **Restablecimiento diario** (`mode: "daily"`): habilita una sesión nueva a una hora local
  configurada (`session.reset.atHour`, `4` de forma predeterminada, 0-23) en el host del Gateway. La
  vigencia diaria se basa en cuándo comenzó el `sessionId` actual, no en escrituras
  posteriores de metadatos.
- **Restablecimiento por inactividad** (`mode: "idle"`): habilita una sesión nueva después de `session.reset.idleMinutes`
  de inactividad. La vigencia por inactividad se basa en la última interacción
  real del usuario o canal, por lo que los eventos del sistema de Heartbeat,
  Cron y ejecución no mantienen activa la sesión.
- **Restablecimiento manual**: escriba `/new` o `/reset` en el chat. `/new <model>` también
  cambia el modelo.

Cuando se configuran restablecimientos tanto diarios como por inactividad, se
aplica el que venza primero. Los turnos de Heartbeat, Cron, ejecución y otros
eventos del sistema pueden escribir metadatos de sesión, pero esas escrituras
no prolongan la vigencia del restablecimiento diario ni por inactividad. Cuando
un restablecimiento renueva la sesión, se descartan los avisos de eventos del
sistema en cola de la sesión anterior para que las actualizaciones obsoletas en
segundo plano no se antepongan al primer prompt de la sesión nueva.

Las sesiones con una sesión de CLI activa perteneciente al proveedor siguen el
mismo comportamiento predeterminado sin restablecimiento automático. Use
`/reset` o configure `session.reset` explícitamente cuando esas
sesiones deban caducar mediante un temporizador.

Habilite los restablecimientos automáticos globalmente y, a continuación,
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

`resetByType` admite `direct`, `group` y `thread`. Doctor migra las entradas heredadas `dm` a `direct` y `session.idleMinutes` a `session.reset.idleMinutes`; el esquema rechaza ambas formas retiradas.

## Dónde reside el estado

- **Filas de sesión en tiempo de ejecución:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Archivos de transcripciones archivadas:** `~/.openclaw/agents/<agentId>/sessions/`
- **Origen de migración de filas heredadas:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Las filas de sesión de la base de datos SQLite de cada agente mantienen marcas
de tiempo independientes para el ciclo de vida:

- `sessionStartedAt`: momento en que comenzó el `sessionId` actual; el restablecimiento diario utiliza este valor.
- `lastInteractionAt`: última interacción del usuario o canal que prolonga la duración por inactividad.
- `updatedAt`: última modificación de la fila del almacén; resulta útil para enumerar y depurar, pero no
  es la referencia determinante de la vigencia de los restablecimientos diarios o por inactividad.

Durante la migración desde instalaciones anteriores, el inicio del Gateway y
`openclaw doctor
--fix` importan automáticamente en SQLite las filas heredadas
`sessions.json` y el historial reciente de transcripciones JSONL. Las filas
sin `sessionStartedAt` se resuelven a partir del encabezado de sesión de la
transcripción JSONL heredada cuando está disponible. Si una fila anterior
tampoco contiene `lastInteractionAt`, la vigencia por inactividad recurre a la
hora de inicio de esa sesión, no a escrituras administrativas posteriores. Use
`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y la [secuencia de migración de
Doctor](/es/cli/doctor#session-sqlite-migration) cuando necesite pruebas explícitas
de inspección o validación.

## Mantenimiento de sesiones

OpenClaw limita el almacenamiento de sesiones a lo largo del tiempo mediante
`session.maintenance`; se muestran los valores predeterminados:

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
escrituras del Gateway en tiempo de ejecución utilizan un pequeño margen por
encima del límite máximo y realizan la limpieza por lotes hasta volver al
límite configurado. Las lecturas del almacén de sesiones no depuran ni limitan
las entradas durante el inicio del Gateway, por lo que el inicio y las sesiones
aisladas de Cron no asumen el coste de una limpieza completa del almacén.
`openclaw sessions cleanup --enforce` aplica el límite inmediatamente.

Las sesiones de sondeo de ejecución de modelos del Gateway tienen una duración
breve de forma predeterminada. Las filas que coinciden con
`agent:*:explicit:model-run-<uuid>` utilizan una retención fija de `24h`, pero la
limpieza depende de la presión: solo elimina las filas de sondeo obsoletas
cuando se alcanza la presión de mantenimiento o del límite de entradas de
sesión, y se ejecuta antes que el límite general de antigüedad de entradas
obsoletas y que el límite de entradas. Las sesiones normales directas, de
grupo, hilo, Cron, Webhook, Heartbeat, ACP y subagente no heredan esta retención
de 24h.

El mantenimiento conserva los punteros duraderos a conversaciones externas,
incluidas las sesiones grupales y las sesiones de chat vinculadas a un hilo, al
tiempo que permite que las entradas sintéticas de Cron, Webhook, Heartbeat, ACP
y subagente caduquen.

Las sesiones archivadas son apartadas por el usuario y están exentas de todas
las rutas de mantenimiento automático, incluidas la depuración por antigüedad,
los límites de entradas, la limpieza de ejecuciones de modelos y la expulsión
por presupuesto de disco. Permanecen archivadas hasta que se desarchivan o se
eliminan explícitamente.

Si anteriormente se utilizó el aislamiento de mensajes directos y después se
devolvió `session.dmScope` a `main`, obtenga una vista previa de
las filas obsoletas de mensajes directos con claves por par mediante
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Aplicar la misma opción retira esas antiguas filas de
mensajes directos y conserva sus transcripciones como archivos eliminados.

Obtenga una vista previa de cualquier ejecución de mantenimiento con
`openclaw sessions cleanup --dry-run`.

## Inspección de sesiones

| Comando                    | Muestra                                                  |
| -------------------------- | -------------------------------------------------------- |
| `openclaw status`          | Ruta del almacén de sesiones y actividad reciente        |
| `openclaw sessions --json` | Todas las sesiones (filtre con `--active <minutes>`) |
| `/status` en el chat          | Uso del contexto, modelo y opciones                      |
| `/context list`            | Contenido del prompt del sistema                          |

## Lecturas adicionales

- [Búsqueda de sesiones](/es/concepts/session-search): recuperación de texto completo en transcripciones anteriores
- [Depuración de sesiones](/es/concepts/session-pruning): reducción de los resultados de herramientas
- [Compaction](/es/concepts/compaction): resumen de conversaciones largas
- [Herramientas de sesión](/es/concepts/session-tool): herramientas del agente para trabajar entre sesiones
- [Análisis detallado de la administración de sesiones](/es/reference/session-management-compaction):
  esquema del almacén, transcripciones, política de envío, metadatos de origen y configuración avanzada
- [Varios agentes](/es/concepts/multi-agent): enrutamiento y aislamiento de sesiones entre agentes
- [Tareas en segundo plano](/es/automation/tasks): cómo el trabajo desvinculado crea registros de tareas con referencias de sesión
- [Enrutamiento de canales](/es/channels/channel-routing): cómo se dirigen los mensajes entrantes a las sesiones

## Temas relacionados

- [Depuración de sesiones](/es/concepts/session-pruning)
- [Herramientas de sesión](/es/concepts/session-tool)
- [Cola de comandos](/es/concepts/queue)
