---
read_when:
    - Es necesario depurar los identificadores de sesión, los eventos de transcripción o los campos de las filas de sesión.
    - Está cambiando el comportamiento de la compactación automática o añadiendo tareas de mantenimiento «previas a la compactación»
    - Quiere implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacenamiento de sesiones y transcripciones, ciclo de vida y funcionamiento interno de la Compaction (automática)'
title: Análisis en profundidad de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-16T12:00:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un único **proceso del Gateway** controla el estado de la sesión de principio a fin. Las interfaces de usuario (aplicación para macOS, interfaz web de Control, TUI) consultan al Gateway las listas de sesiones y los recuentos de tokens. En modo remoto, los archivos de sesión se encuentran en el host remoto, por lo que examinar los archivos del Mac local no reflejará lo que utiliza el Gateway.

Documentación general primero: [Gestión de sesiones](/es/concepts/session), [Compaction](/es/concepts/compaction), [Descripción general de la memoria](/es/concepts/memory), [Búsqueda en la memoria](/es/concepts/memory-search), [Depuración de sesiones](/es/concepts/session-pruning), [Higiene de las transcripciones](/es/reference/transcript-hygiene), referencia completa de configuración en [Configuración del agente](/es/gateway/config-agents).

## Dos capas de persistencia

1. **Filas de sesión (SQLite por agente)** - mapa de clave/valor `sessionKey -> SessionEntry`. Estado mutable en tiempo de ejecución controlado por el Gateway. Registra metadatos: id. de la sesión actual, última actividad, opciones, contadores de tokens.
2. **Eventos de transcripción (SQLite por agente)** - solo anexables y estructurados como árbol (las entradas tienen `id` + `parentId`). Almacena la conversación, las llamadas a herramientas y los resúmenes de compactación; reconstruye el contexto del modelo para turnos futuros. Los puntos de control de compactación son metadatos sobre la transcripción sucesora compactada; una nueva compactación no escribe una segunda copia de `.checkpoint.*.jsonl`.

Las instalaciones anteriores pueden conservar archivos `sessions.json` en el directorio `sessions/`
del agente. Estos archivos deben tratarse como entradas de migración de filas de sesión heredadas o como destinos explícitos
de mantenimiento sin conexión. El inicio del Gateway y `openclaw doctor --fix` importan
automáticamente las filas heredadas activas y el historial de transcripciones en el almacén SQLite por agente.
Ejecute `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y, después, siga la [secuencia de migración de
Doctor](/es/cli/doctor#session-sqlite-migration) cuando necesite
pruebas explícitas de inspección o validación. Si una migración falla después de archivar los artefactos
de transcripción heredados, utilice el modo de recuperación de Doctor de esa secuencia.
La recuperación utiliza manifiestos de migración, restaura únicamente los artefactos de soporte archivados
afectados, prepara un informe saneado de incidencias de GitHub cuando se solicita y no
hace que el entorno de ejecución activo vuelva a leer archivos JSONL.

Los lectores del historial del Gateway evitan materializar toda la transcripción a menos que la superficie necesite acceso arbitrario al historial. El historial de la primera página, el historial de chat integrado, la recuperación tras un reinicio y las comprobaciones de tokens/uso utilizan lecturas limitadas del final de SQLite. Los análisis completos de transcripciones pasan por el índice asíncrono de transcripciones y se comparten entre lectores simultáneos.

## Ubicaciones en disco

Por agente, en el host del Gateway (resueltas mediante `src/config/sessions.ts`):

- Almacén de filas de sesión en tiempo de ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Filas de transcripción en tiempo de ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefactos de transcripción heredados/archivados: `~/.openclaw/agents/<agentId>/sessions/`
- Entrada de migración de filas heredadas: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Mantenimiento del almacén y controles de disco

`session.maintenance` controla el mantenimiento automático de las filas de sesión de SQLite, las filas de transcripción de SQLite, los artefactos archivados y los archivos auxiliares de trayectorias:

| Clave                     | Valor predeterminado               | Notas                                                                                       |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | o `"warn"` (solo informa, sin modificaciones)                                                      |
| `pruneAfter`            | `"30d"`               | límite de antigüedad para entradas obsoletas                                                                      |
| `maxEntries`            | `500`                 | límite de entradas de sesión                                                                      |
| `resetArchiveRetention` | conservar (sin límite de antigüedad)  | límite de antigüedad para los archivos de transcripción `*.reset.*`/`*.deleted.*`; una duración activa la eliminación |
| `maxDiskBytes`          | `2gb`                 | presupuesto de disco para las sesiones de cada agente; `false` lo desactiva                                            |
| `highWaterBytes`        | 80% de `maxDiskBytes` | objetivo después de la limpieza por presupuesto                                                                 |

Las transcripciones archivadas se conservan de forma predeterminada y se comprimen con zstd (`*.jsonl.<reason>.<timestamp>.zst`) cuando el entorno de ejecución lo admite, por lo que eliminar o restablecer una sesión nunca descarta silenciosamente el historial de conversaciones. El presupuesto de disco expulsa primero los archivos más antiguos antes de afectar a las sesiones activas.

La aplicación activa en SQLite de `maxDiskBytes` mide los bytes del JSON de las filas de sesión más los del JSON de los eventos de transcripción por sesión; la aplicación del mantenimiento heredado sin conexión mide los archivos del directorio de sesiones seleccionado.

Las sesiones de sondeo de ejecución del modelo del Gateway (claves que coinciden con `agent:*:explicit:model-run-<uuid>`) tienen una retención fija e independiente de `24h`. Esta depuración está condicionada por la presión: solo se ejecuta cuando se alcanza la presión de mantenimiento/límite de entradas de sesión y únicamente antes del paso global de limpieza/límite de entradas obsoletas. Las demás sesiones explícitas no utilizan esta retención.

Orden de aplicación de la limpieza por presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos de transcripción archivados más antiguos, los artefactos heredados huérfanos o los artefactos de trayectoria huérfanos.
2. Si aún se supera el objetivo, expulsar las entradas de sesión más antiguas y sus filas de transcripción o artefactos de trayectoria.
3. Repetir hasta que el uso sea igual o inferior a `highWaterBytes`.

`mode: "warn"` informa de posibles expulsiones sin modificar el almacén ni los archivos.

Ejecute el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

El mantenimiento conserva los punteros duraderos a conversaciones externas, como las sesiones de grupo y las sesiones de chat delimitadas por hilo, pero las entradas sintéticas del entorno de ejecución (Cron, enlaces, Heartbeat, ACP y subagentes) pueden eliminarse cuando superan la antigüedad, la cantidad o el presupuesto de disco configurados. Las ejecuciones aisladas de Cron utilizan un control `cron.sessionRetention` independiente de la retención de sondeos de ejecución del modelo.

Las escrituras normales del Gateway pasan por el acceso a sesiones, que serializa las mutaciones de SQLite de cada agente mediante la ruta de escritura del entorno de ejecución. El código del entorno de ejecución debe utilizar preferentemente las funciones auxiliares de acceso de `src/config/sessions/session-accessor.ts`; las funciones auxiliares heredadas de `sessions.json` son herramientas de migración y mantenimiento sin conexión. Cuando hay un Gateway disponible, las operaciones que no son de simulación `openclaw sessions cleanup` y `openclaw agents delete` delegan las mutaciones del almacén al Gateway para que la limpieza se incorpore a la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para un almacén heredado seleccionado y siempre permanece local (al igual que `--dry-run`). La limpieza de `maxEntries` se realiza por lotes para almacenes de tamaño apto para producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de límite máximo lo reduzca. Las lecturas nunca depuran ni limitan las entradas durante el inicio del Gateway; solo lo hacen las escrituras o `openclaw sessions cleanup --enforce`, y esta última también aplica el límite inmediatamente y depura los artefactos antiguos y no referenciados de transcripciones heredadas, puntos de control y trayectorias, incluso cuando no se ha configurado un presupuesto de disco.

OpenClaw ya no crea automáticamente copias de seguridad de rotación `sessions.json.bak.*` durante las escrituras del Gateway. El esquema actual rechaza la clave heredada `session.maintenance.rotateBytes` y `openclaw doctor --fix` la elimina de configuraciones anteriores.

Las mutaciones de transcripciones utilizan la cola de escritura de sesiones para el destino de transcripciones de SQLite:

| Configuración                              | Valor predeterminado   | Sustitución mediante variable de entorno                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` indica cuánto tiempo debe esperar un bloqueo antes de generar un error de sesión ocupada y abandonar; auméntelo únicamente cuando las tareas legítimas de preparación, limpieza, compactación o replicación de transcripciones compitan durante más tiempo en equipos lentos. `staleMs` indica cuándo se puede recuperar como obsoleto un bloqueo existente. `maxHoldMs` es el umbral de liberación del supervisor dentro del proceso.

### Regreso a una versión anterior tras el cambio a SQLite

Restaure los artefactos de transcripción heredados archivados antes de ejecutar una versión anterior
de OpenClaw basada en archivos:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

La migración conserva los archivos heredados `sessions.json` para tareas de soporte y
reversión, pero los archivos JSONL de transcripción activos que se importaron en SQLite se
cambian de nombre a `session-sqlite-import-archive/`. Los entornos de ejecución anteriores basados en archivos siguen
las rutas `sessionFile` de `sessions.json`, por lo que necesitan que esos artefactos se restauren
antes del inicio. La restauración utiliza manifiestos de migración, mueve únicamente los artefactos archivados
registrados cuyas rutas originales no existen y conserva la base de datos SQLite
para permitir una recuperación posterior.

Las sesiones creadas después del cambio a SQLite solo existen en SQLite y no aparecerán en un
entorno de ejecución anterior basado en archivos. Si vuelve a actualizar después de regresar a una versión anterior, ejecute de nuevo la secuencia
de inspección y validación de Doctor para que OpenClaw pueda verificar los artefactos heredados
restaurados antes de importarlos.

## Sesiones de Cron y registros de ejecución

Las ejecuciones aisladas de Cron crean sus propias entradas/transcripciones de sesión con una retención específica:

- `cron.sessionRetention` (valor predeterminado `"24h"`) depura del almacén las sesiones antiguas de ejecuciones aisladas de Cron; `false` lo desactiva.
- El historial de ejecución conserva las 2000 filas terminales más recientes por tarea de Cron. Las filas perdidas mantienen su periodo de limpieza de 24 horas.

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila: conserva las preferencias seguras (ajustes de pensamiento/rapidez/detalle/razonamiento, etiquetas y nombre para mostrar) y las sustituciones explícitas de modelo/autenticación seleccionadas por el usuario, pero descarta el contexto ambiental de la conversación (enrutamiento de canal/grupo, política de envío/cola, elevación, origen y vinculación del entorno de ejecución de ACP) para que una ejecución aislada nueva no pueda heredar de una ejecución anterior permisos obsoletos de entrega o del entorno de ejecución.

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica el contenedor de conversación en el que se encuentra (enrutamiento + aislamiento). Reglas canónicas: [/concepts/session](/es/concepts/session).

| Patrón                      | Ejemplo                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Chat principal/directo (por agente) | `agent:<agentId>:<mainKey>` (valor predeterminado `main`)                |
| Grupo                        | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack) | `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (salvo que se sustituya)                           |

## Id. de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (la identidad de la transcripción de SQLite que continúa la conversación). La lógica de decisión se encuentra en `initSessionState()` dentro de `src/auto-reply/reply/session.ts`.

- **Restablecimiento** (`/new`, `/reset`) crea un nuevo `sessionId` para ese `sessionKey`.
- **Restablecimiento diario** (de forma predeterminada, a las 4:00 a. m., hora local del host del Gateway) crea un nuevo `sessionId` con el siguiente mensaje después del límite de restablecimiento.
- **Expiración por inactividad** (`session.reset.idleMinutes`, o el valor heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después del intervalo de inactividad. Si están configurados tanto el restablecimiento diario como el de inactividad, prevalece el que expire primero.
- **Reanudación al reconectar la interfaz de control** conserva la sesión visible actualmente para un envío tras una reconexión cuando el Gateway recibe el `sessionId` correspondiente de un cliente de interfaz de operador. Es una señal de un solo uso; los envíos obsoletos ordinarios siguen creando un nuevo `sessionId`.
- **Eventos del sistema** (Heartbeat, activaciones de Cron, notificaciones de ejecución, contabilidad del Gateway) pueden modificar la fila de la sesión, pero nunca prolongan la vigencia del restablecimiento diario o por inactividad. La transición del restablecimiento descarta los avisos de eventos del sistema en cola de la sesión anterior antes de generar el nuevo prompt.
- **Política de bifurcación principal** usa la rama activa de OpenClaw al crear una bifurcación de hilo o subagente. Si esa rama es demasiado grande (supera un límite interno fijo, actualmente 100K tokens), OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar un historial inutilizable. El dimensionamiento es automático y no se puede configurar; `openclaw doctor --fix` elimina la configuración heredada `session.parentForkMaxTokens`.
- **Bifurcaciones del operador**: `sessions.create { parentSessionKey, fork: true }` crea una nueva sesión cuya transcripción se bifurca desde el estado actual de la sesión principal (el mismo mecanismo de bifurcación que en la creación de subagentes, incluido el límite de tamaño anterior). La bifurcación se rechaza mientras la sesión principal tiene una ejecución activa, hereda la selección de modelo de esta salvo que se proporcione una explícitamente y marca el hijo como `forkedFromParent` con contadores de tokens nuevos.

## Esquema del almacén de sesiones

El almacén de ejecución conserva valores `SessionEntry` en la base de datos SQLite de cada agente. El tipo del valor es `SessionEntry` en `src/config/sessions.ts`. Campos principales (lista no exhaustiva):

- `sessionId`: identificador de la transcripción actual utilizado para direccionar las filas de transcripción de SQLite
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la vigencia del restablecimiento diario usa este valor. Las filas heredadas pueden derivarlo del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real del usuario o canal; la vigencia del restablecimiento por inactividad usa este valor para que los eventos de Heartbeat, Cron y ejecución no mantengan vivas las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio de la sesión recuperada.
- `updatedAt`: marca de tiempo de la última modificación de la fila del almacén, utilizada para listados, depuración y contabilidad; no es la autoridad sobre la vigencia diaria o por inactividad.
- `archivedAt`: marca de tiempo de archivado opcional. Las sesiones archivadas permanecen en el almacén con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijación opcional. Las sesiones activas fijadas se ordenan antes que las no fijadas; al archivar una sesión se elimina su fijación.
- Interoperabilidad con hilos de Codex: ambos campos siguen la estructura de administración de hilos de Codex; los valores booleanos `archived`/`pinned` transmitidos siempre se derivan de la marca de tiempo y se asignan en el servidor, de acuerdo con la semántica `threads.archived_at` de Codex y la serialización camelCase. Las marcas de tiempo de OpenClaw usan milisegundos desde la época, mientras que Codex usa segundos desde la época, por lo que los puentes realizan la conversión en el límite del Plugin `codex`. Codex aún no tiene una API de fijación (solo `thread/archive`/`thread/unarchive`); el estado fijado permanece en OpenClaw hasta que exista una, momento en el que la estructura coincidente permitirá que las sesiones vinculadas conserven mecánicamente el estado de fijación en ambos sentidos.
- La supervisión de Codex solo enumera los hilos nativos no archivados. Un hilo local del Gateway con actividad desconocida `idle` o `notLoaded` solo puede archivarse mediante `thread/archive` nativo después de que el operador confirme explícitamente que ningún otro proceso de Codex es su propietario; el Plugin realiza primero una nueva lectura del estado local del proceso y, a continuación, el hilo desaparece del catálogo. Esa lectura no puede demostrar que otro proceso del App Server no esté usando el hilo. OpenClaw se niega a archivar filas activas y con errores, y el archivado de nodos emparejados no estará disponible hasta que el puente de Node pueda controlar el ciclo de vida completo del hilo transmitido. Desarchivar el hilo en un cliente nativo de Codex permite que vuelva a ser apto para aparecer.
- `lastReadAt` / `markedUnreadAt`: marcas de tiempo del estado de lectura asignadas en el servidor por `sessions.patch { unread }`; `unread: false` registra una lectura (establece `lastReadAt` y borra `markedUnreadAt`); `unread: true` marca la sesión como no leída hasta la siguiente lectura. Las filas de sesión exponen un valor booleano derivado `unread`: marcado explícitamente como no leído o leído antes de la actividad más reciente. Las sesiones que nunca se han marcado como leídas permanecen `unread: false`, por lo que las instalaciones existentes no se resaltan tras la actualización.
- `lastActivityAt`: marca de tiempo de la última ejecución completada del agente que cuenta como actividad que merece marcarse como no leída (ejecuciones de usuario, canal y Cron). Los turnos de Heartbeat y eventos internos, además de las actualizaciones parciales de metadatos, no la actualizan; `updatedAt` no es una señal de actividad.
- `sessionFile`: marcador heredado conservado para la compatibilidad de migración y archivado; la ejecución activa usa la identidad de SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos de etiquetado de grupo o canal
- Opciones: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (anulación por sesión)
- Selección de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (aproximados y dependientes del proveedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: número de veces que se completó la compactación automática para esta clave de sesión
- `memoryFlushAt` / `memoryFlushCompactionCount`: marca de tiempo y número de compactaciones del último vaciado de memoria previo a la compactación

El Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se
ejecutan las sesiones. Para las instalaciones heredadas respaldadas por archivos, realice la migración con
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` en lugar de
editar `sessions.json` y esperar que la ejecución siga leyendo ese archivo.

## Estructura de eventos de la transcripción

El descriptor de acceso a sesiones de OpenClaw administra las transcripciones y las expone al código de ejecución mediante funciones auxiliares basadas en la identidad. El flujo de eventos es de solo anexado:

- Primera entrada: encabezado de sesión; `type: "session"`, `id`, `cwd`, `timestamp` y `parentSession` opcional.
- Después: entradas con `id` + `parentId` (estructura de árbol).

Tipos de entrada destacados:

- `message`: mensajes de usuario, asistente o toolResult
- `custom_message`: mensaje insertado por una extensión que _sí_ entra en el contexto del modelo (se representa en la TUI cuando es `display: true` y se oculta por completo cuando es `display: false`)
- `custom`: estado de la extensión que _no_ entra en el contexto del modelo (para conservar el estado de la extensión entre recargas)
- `compaction`: resumen persistente de la compactación con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistente al navegar por una rama del árbol

OpenClaw no «corrige» intencionadamente las transcripciones; el Gateway usa `SessionManager` para leerlas y escribirlas.

## Ventanas de contexto frente a tokens registrados

Dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo). Proviene del catálogo de modelos y se puede anular mediante la configuración.
2. **Contadores del almacén de sesiones**: estadísticas acumulativas escritas en la fila de la sesión (utilizadas para `/status` y los paneles). `contextTokens` es un valor de estimación e informes de la ejecución; no debe tratarse como una garantía estricta.

Más información sobre los límites: [/reference/token-use](/es/reference/token-use).

## Compaction: qué es

Compaction resume la conversación anterior en una entrada persistente `compaction` de la transcripción y conserva intactos los mensajes recientes. Tras la compactación, los turnos futuros ven el resumen de compactación más los mensajes posteriores a `firstKeptEntryId`. Compaction es **persistente**, a diferencia de la depuración de sesiones; consulte [/concepts/session-pruning](/es/concepts/session-pruning).

La reinserción de la sección AGENTS.md tras la compactación se habilita explícitamente mediante `agents.defaults.compaction.postCompactionSections`; cuando no está definido o es `[]`, OpenClaw no añade fragmentos de AGENTS.md sobre el resumen de compactación.

### Límites de fragmentos y emparejamiento de herramientas

Al dividir una transcripción larga en fragmentos de compactación, OpenClaw mantiene emparejadas las llamadas a herramientas del asistente con sus entradas `toolResult` correspondientes:

- Si la división por proporción de tokens quedara entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite hasta el mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultados de herramientas hiciera que el fragmento superara el objetivo, OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la parte final sin resumir.
- Los bloques de llamadas a herramientas canceladas o con errores no mantienen abierta una división pendiente.

## Cuándo se produce la compactación automática

Dos activadores en el agente OpenClaw integrado:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` y otras variantes con el formato del proveedor); se compacta y luego se reintenta. Cuando el proveedor informa del número de tokens del intento, OpenClaw reenvía ese número observado a la compactación de recuperación por desbordamiento; si el proveedor confirma el desbordamiento, pero no expone un número analizable, OpenClaw pasa un número sintético mínimamente superior al presupuesto a los motores de compactación y los diagnósticos. Si la recuperación por desbordamiento sigue fallando, OpenClaw muestra instrucciones explícitas y conserva la asignación de sesión actual en lugar de rotar silenciosamente a un nuevo identificador de sesión; vuelva a intentar el mensaje, ejecute `/compact` o ejecute `/new`.
2. **Mantenimiento por umbral**: después de un turno satisfactorio, cuando `contextTokens > contextWindow - reserveTokens`, donde `contextWindow` es la ventana de contexto del modelo y `reserveTokens` es el margen reservado para los prompts y la siguiente salida del modelo.

Se ejecutan dos protecciones adicionales fuera de estos dos activadores:

- **Compactación local previa**: establezca `agents.defaults.compaction.maxActiveTranscriptBytes` (bytes o una cadena como `"20mb"`) para activar la compactación local antes de abrir la siguiente ejecución cuando la transcripción activa alcance ese tamaño. Es una protección de tamaño para el coste de reapertura local, no un archivado sin procesar; la compactación semántica normal sigue ejecutándose y requiere `truncateAfterCompaction` para que el resumen compactado se convierta en una nueva transcripción sucesora.
- **Comprobación previa a mitad del turno**: establezca `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valor predeterminado: `false`) para añadir una protección al bucle de herramientas. Después de añadir el resultado de una herramienta y antes de la siguiente llamada al modelo, OpenClaw estima la presión sobre el prompt mediante la misma lógica de presupuesto previo utilizada al inicio del turno. Si el contexto ya no cabe, la protección no realiza la compactación en línea: genera una señal estructurada de comprobación previa a mitad del turno, detiene el envío del prompt actual y permite que el bucle exterior de ejecución use la ruta de recuperación existente (truncar los resultados de herramientas demasiado grandes cuando sea suficiente o activar el modo de compactación configurado y reintentar). Funciona con los modos de compactación `default` y `safeguard`, incluida la compactación de protección respaldada por el proveedor. Es independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta antes de abrir un turno; la comprobación previa a mitad del turno se ejecuta más tarde, después de añadir nuevos resultados de herramientas.

## Configuración de Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw también impone un límite mínimo de seguridad para las ejecuciones integradas: si `compaction.reserveTokens` es inferior a `reserveTokensFloor` (valor predeterminado: `20000`), OpenClaw lo eleva. Configure `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el límite mínimo. Cuando se conoce la ventana de contexto del modelo activo, tanto el límite mínimo como la reserva efectiva final se limitan para que la reserva no pueda consumir todo el presupuesto del prompt. Esto evita que los modelos con contextos pequeños (por ejemplo, un modelo local de 16K tokens) entren en Compaction desde el primer token; si no se conoce la ventana de contexto, los presupuestos de reserva configurado y actual permanecen sin límite. Motivo del límite mínimo: dejar margen suficiente para las tareas de «mantenimiento» de varios turnos (como el volcado de memoria que se describe más adelante) antes de que la Compaction sea inevitable. Implementación: `applyAgentCompactionSettingsFromConfig()` en `src/agents/agent-settings.ts`, invocado desde las rutas de configuración de turnos y Compaction del ejecutor integrado.

La operación manual `/compact` respeta un `agents.defaults.compaction.keepRecentTokens` explícito y conserva el punto de corte de la cola reciente del entorno de ejecución. Sin un presupuesto de conservación explícito, la Compaction manual es un punto de control estricto y el contexto reconstruido comienza a partir del nuevo resumen.

Cuando `truncateAfterCompaction` está habilitado, OpenClaw rota la transcripción activa a una sucesora compactada después de la Compaction. Las acciones de punto de control para bifurcar/restaurar usan esa sucesora compactada; los archivos de punto de control heredados anteriores a la Compaction siguen siendo legibles mientras estén referenciados.

## Proveedores de Compaction conectables

Los Plugins registran un proveedor de Compaction mediante `registerCompactionProvider()` en la API de Plugins. Cuando `agents.defaults.compaction.provider` se establece en el identificador de un proveedor registrado, la extensión de protección delega el resumen en ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: identificador de un Plugin proveedor de Compaction registrado. Déjelo sin configurar para usar el resumen predeterminado mediante LLM. Configurar un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de conservación de identificadores que la ruta integrada, y la protección sigue conservando el contexto del sufijo de los turnos recientes y de los turnos divididos después de la salida del proveedor.
- El resumen de protección integrado vuelve a destilar los resúmenes anteriores junto con los mensajes nuevos, en lugar de conservar literalmente todo el resumen anterior.
- El modo de protección habilita de forma predeterminada las auditorías de calidad del resumen; configure `qualityGuard.enabled: false` para omitir el comportamiento de reintento cuando la salida tenga un formato incorrecto.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen integrado mediante LLM. Las señales de cancelación o tiempo de espera activadas explícitamente por el invocador se vuelven a lanzar, en lugar de descartarse, para respetar siempre la cancelación.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superficies visibles para el usuario

- `/status` en cualquier sesión de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Registros del Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` más el número de operaciones de Compaction

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos «silenciosos» para tareas en segundo plano en las que el usuario no debe ver la salida intermedia.

- El asistente comienza su salida con el token silencioso exacto `NO_REPLY` / `no_reply` para indicar «no entregar una respuesta al usuario». OpenClaw lo elimina o suprime en la capa de entrega.
- La supresión por coincidencia exacta del token silencioso no distingue entre mayúsculas y minúsculas: tanto `NO_REPLY` como `no_reply` cuentan cuando toda la carga útil contiene únicamente el token silencioso.
- A partir de `2026.1.10`, OpenClaw también suprime la transmisión de borradores e indicadores de escritura cuando un fragmento parcial comienza con `NO_REPLY`, para que las operaciones silenciosas no filtren una salida parcial durante el turno.
- Esto se utiliza únicamente para verdaderos turnos en segundo plano o sin entrega; no es un atajo para solicitudes ordinarias del usuario que requieren una acción.

## Volcado de memoria previo a la Compaction

Antes de que se produzca una Compaction automática, OpenClaw puede ejecutar un turno agéntico silencioso que escribe un estado persistente en el disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente), para que la Compaction no pueda borrar contexto crítico. Supervisa el uso del contexto de la sesión y, cuando supera un umbral flexible inferior al umbral de Compaction, envía una directiva silenciosa de «escribir la memoria ahora» mediante el token silencioso exacto `NO_REPLY` / `no_reply`, de modo que el usuario no vea nada.

Configuración (`agents.defaults.compaction.memoryFlush`), referencia completa en [/gateway/config-agents](/es/gateway/config-agents#agentsdefaultscompaction):

| Clave                       | Valor predeterminado | Notas                                                                                                                                  |
| --------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | sin configurar      | anulación exacta de proveedor/modelo solo para el turno de volcado, por ejemplo `ollama/qwen3:8b`                                      |
| `softThresholdTokens`       | `4000`           | margen por debajo del umbral de Compaction que activa un volcado                                                                        |
| `forceFlushTranscriptBytes` | sin configurar (deshabilitado) | fuerza un volcado cuando el archivo de transcripción alcanza este tamaño en bytes (o una cadena como `"2mb"`), incluso si los contadores de tokens están obsoletos; `0` lo deshabilita |
| `prompt`                    | integrado          | mensaje del usuario para el turno de volcado                                                                                            |
| `systemPrompt`              | integrado          | prompt del sistema adicional que se añade al turno de volcado                                                                           |

Notas:

- El prompt y el prompt del sistema predeterminados incluyen una indicación `NO_REPLY` para suprimir la entrega.
- Cuando se configura `model`, el turno de volcado usa ese modelo sin heredar la cadena de reserva de la sesión activa, para que las tareas de mantenimiento exclusivamente locales no recurran silenciosamente a un modelo de conversación de pago si se produce un fallo.
- El volcado se ejecuta una vez por ciclo de Compaction (se registra en la fila de la sesión).
- El volcado solo se ejecuta en sesiones integradas de OpenClaw; los backends de la CLI y los turnos de Heartbeat lo omiten.
- El volcado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulte [Memoria](/es/concepts/memory) para conocer la disposición de los archivos del espacio de trabajo y los patrones de escritura.

OpenClaw expone un hook `session_before_compact` en la API de extensiones, pero la lógica de volcado descrita anteriormente reside en el lado del Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), no en ese hook.

## Lista de comprobación para solucionar problemas

- **¿Clave de sesión incorrecta?** Comience por [/concepts/session](/es/concepts/session) y confirme el `sessionKey` en `/status`.
- **¿Incoherencia entre el almacén y la transcripción?** Confirme el host del Gateway y la ruta del almacén en `openclaw status`.
- **¿Compaction excesiva?** Compruebe la ventana de contexto del modelo (si es demasiado pequeña, fuerza operaciones de Compaction frecuentes), `reserveTokens` (si es demasiado alto para la ventana del modelo, provoca una Compaction más temprana) y el exceso de resultados de herramientas (ajuste la poda de sesiones).
- **¿Parece que cada prompt desborda un modelo local pequeño?** Confirme que el proveedor informa de la ventana de contexto correcta del modelo. OpenClaw solo puede limitar la reserva efectiva cuando se conoce esa ventana.
- **¿Se filtran los turnos silenciosos?** Confirme que la respuesta comienza con el token silencioso exacto `NO_REPLY` (sin distinguir entre mayúsculas y minúsculas) y que utiliza una compilación que incluye la corrección de supresión de transmisión (`2026.1.10`+).

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
- [Referencia de configuración del agente](/es/gateway/config-agents)
