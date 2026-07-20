---
read_when:
    - Necesita depurar los identificadores de sesión, los eventos de transcripción o los campos de las filas de sesión
    - Está cambiando el comportamiento de la compactación automática o añadiendo tareas de mantenimiento «previas a la compactación»
    - Se desean implementar volcados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacenamiento de sesiones y transcripciones, ciclo de vida y funcionamiento interno de la Compaction (automática)'
title: Análisis exhaustivo de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-20T00:57:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ce3f4d5bc40f454f98950ec88230ad5caadb224e25c779f26a7b87f3349de47b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un único **proceso del Gateway** controla el estado de las sesiones de extremo a extremo. Las interfaces de usuario (aplicación para macOS, interfaz de control web, TUI) consultan al Gateway las listas de sesiones y los recuentos de tokens. En modo remoto, los archivos de sesión residen en el host remoto, por lo que revisar los archivos del Mac local no reflejará lo que utiliza el Gateway.

Documentación general primero: [Gestión de sesiones](/es/concepts/session), [Compaction](/es/concepts/compaction), [Descripción general de la memoria](/es/concepts/memory), [Búsqueda en la memoria](/es/concepts/memory-search), [Depuración de sesiones](/es/concepts/session-pruning), [Higiene de las transcripciones](/es/reference/transcript-hygiene); la referencia de configuración completa está en [Configuración del agente](/es/gateway/config-agents).

## Dos capas de persistencia

1. **Filas de sesión (SQLite por agente)** - mapa de clave/valor `sessionKey -> SessionEntry`. Estado mutable en tiempo de ejecución controlado por el Gateway. Registra metadatos: id. de la sesión actual, última actividad, opciones, contadores de tokens.
2. **Eventos de transcripción (SQLite por agente)** - de solo anexión y estructurados como árbol (las entradas tienen `id` + `parentId`). Almacena la conversación, las llamadas a herramientas y los resúmenes de Compaction; reconstruye el contexto del modelo para turnos futuros. Los puntos de control de Compaction son metadatos de la transcripción sucesora compactada; una nueva Compaction no escribe una segunda copia de `.checkpoint.*.jsonl`.

Las instalaciones más antiguas aún pueden tener archivos `sessions.json` en el directorio `sessions/`
del agente. Estos archivos deben tratarse como entradas heredadas para la migración de filas de sesión o como destinos explícitos
de mantenimiento sin conexión. El inicio del Gateway y `openclaw doctor --fix` importan
automáticamente las filas heredadas activas y el historial de transcripciones al almacén SQLite por agente.
Ejecute `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y siga la [secuencia de migración de
Doctor](/es/cli/doctor#session-sqlite-migration) cuando necesite pruebas explícitas
de inspección o validación. Si una migración falla después de archivar los artefactos
de transcripción heredados, utilice el modo de recuperación de Doctor de esa secuencia.
La recuperación utiliza manifiestos de migración, restaura únicamente los artefactos
de soporte archivados afectados, prepara un informe saneado de incidencia de GitHub cuando se solicita y no
hace que el entorno de ejecución activo vuelva a leer archivos JSONL.

Los lectores del historial del Gateway evitan materializar toda la transcripción, salvo que la superficie necesite acceso arbitrario al historial. El historial de la primera página, el historial de chat integrado, la recuperación tras reinicios y las comprobaciones de tokens/uso utilizan lecturas acotadas desde el final de SQLite. Los análisis completos de transcripciones pasan por el índice asíncrono de transcripciones y se comparten entre lectores simultáneos.

## Ubicaciones en disco

Por agente, en el host del Gateway (resueltas mediante `src/config/sessions.ts`):

- Almacén de filas de sesión en tiempo de ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Filas de transcripción en tiempo de ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefactos de transcripción heredados/archivados: `~/.openclaw/agents/<agentId>/sessions/`
- Entrada heredada para la migración de filas: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Mantenimiento del almacén y controles de disco

`session.maintenance` controla el mantenimiento automático de las filas de sesión de SQLite, las filas de transcripción de SQLite, los artefactos de archivo y los archivos auxiliares de trayectoria:

| Clave                   | Valor predeterminado   | Notas                                                                                       |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | o `"warn"` (solo informe, sin modificaciones)                                              |
| `pruneAfter`            | `"30d"`               | umbral de antigüedad para entradas obsoletas                                                |
| `maxEntries`            | `500`                 | límite de entradas de sesión                                                                |
| `resetArchiveRetention` | conservar (sin umbral de antigüedad) | umbral de antigüedad de los archivos de transcripción `*.reset.*`/`*.deleted.*`; una duración habilita la eliminación |
| `maxDiskBytes`          | `10gb`                | presupuesto de disco para sesiones por agente; `false` lo deshabilita                      |
| `highWaterBytes`        | 80% de `maxDiskBytes` | objetivo tras la limpieza del presupuesto                                                   |

El restablecimiento avanza la asignación activa de `sessionKey -> sessionId`, pero conserva las filas anteriores de sesión, transcripción, trayectoria y búsqueda de SQLite. Ese historial sigue disponible para búsquedas con la misma clave de sesión; las listas habituales de entradas y sesiones solo muestran la nueva asignación activa. El historial de restablecimientos conservado está limitado por el presupuesto de disco, no por `resetArchiveRetention`, que solo aplica antigüedad a los artefactos de archivo. La eliminación explícita es diferente: escribe y verifica un archivo comprimido de la transcripción (`*.jsonl.deleted.<timestamp>.zst` cuando zstd está disponible) antes de eliminar las filas de la sesión eliminada.

La aplicación de `maxDiskBytes` utiliza bytes físicos: el archivo principal de SQLite por agente, su archivo `-wal` y los archivos contabilizados en el directorio de sesiones del agente. Nunca estima los tamaños JSON de las filas ni resta tamaños lógicos de filas de ese total.

Las sesiones de sondeo de ejecuciones de modelos del Gateway (claves que coinciden con `agent:*:explicit:model-run-<uuid>`) tienen una retención fija e independiente de `24h`. Esta depuración está condicionada por la presión: solo se ejecuta cuando se alcanza la presión de mantenimiento o del límite de entradas de sesión, y únicamente antes del paso global de limpieza o limitación de entradas obsoletas. Las demás sesiones explícitas no utilizan esta retención.

Cuando el uso físico combinado supera `maxDiskBytes`, `mode: "enforce"` primero recupera espacio de base de datos que admite puntos de control y, a continuación, elimina los archivos de restablecimiento/eliminación conservados más antiguos. Si el uso aún supera `highWaterBytes`, recorre las sesiones históricas de SQLite según `sessions.updated_at`, empezando por las más antiguas. Una sesión es histórica si su id. no está referenciado por una entrada de sesión activa, un destino de ruta ni una ejecución admitida o en curso. Para cada víctima, la limpieza escribe, sincroniza mediante fsync y vuelve a leer el archivo comprimido antes de que una transacción de escritura elimine la fila de sesión y sus proyecciones de transcripción, trayectoria, actividad, índice y FTS. Esto incluye las sesiones que contienen eventos de trayectoria, pero no eventos de transcripción. La limpieza vuelve a comprobar las referencias de rutas, entradas y admisión en el momento de la eliminación, vuelve a medir el uso físico después de cada archivo o sesión víctima y se detiene en `highWaterBytes`.

Las escrituras confirmadas y las eliminaciones llegan primero al WAL. La limpieza crea un punto de control para que el WAL pueda reducirse inmediatamente y, después, utiliza la compactación incremental para devolver las páginas finales libres que cumplan los requisitos desde el archivo principal; las páginas que aún no puedan recuperarse permanecen en el archivo principal y, por tanto, siguen contabilizándose en la siguiente medición física. `mode: "warn"` informa del exceso físico actual sin crear puntos de control, escribir un archivo ni eliminar filas.

Ejecute el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

El mantenimiento conserva punteros duraderos a conversaciones externas, como sesiones de grupo y sesiones de chat limitadas a un hilo, pero las entradas sintéticas del entorno de ejecución (cron, hooks, heartbeat, ACP, subagentes) pueden eliminarse una vez que superan la antigüedad, el recuento o el presupuesto de disco configurados. Las ejecuciones aisladas de cron utilizan un control `cron.sessionRetention` independiente, separado de la retención de sondas de ejecución del modelo.

Las escrituras normales del Gateway pasan por el descriptor de acceso a sesiones, que serializa las mutaciones de SQLite por agente mediante la ruta de escritura del entorno de ejecución. El código del entorno de ejecución debe preferir las funciones auxiliares del descriptor de acceso en `src/config/sessions/session-accessor.ts`; las funciones auxiliares heredadas `sessions.json` son herramientas de migración y mantenimiento sin conexión. Cuando se puede acceder a un Gateway, `openclaw sessions cleanup` y `openclaw agents delete` sin ejecución de prueba delegan las mutaciones del almacén al Gateway para que la limpieza se incorpore a la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para un almacén heredado seleccionado y siempre permanece local (al igual que `--dry-run`). La limpieza de `maxEntries` se realiza por lotes para almacenes de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza al alcanzar el umbral superior lo reduzca mediante una reescritura. Las lecturas nunca depuran ni limitan las entradas durante el inicio del Gateway; solo lo hacen las escrituras o `openclaw sessions cleanup --enforce`, y este último también aplica el límite inmediatamente y depura los artefactos heredados antiguos y sin referencias de transcripciones, puntos de control y trayectorias, incluso cuando no hay ningún presupuesto de disco configurado.

OpenClaw ya no crea automáticamente copias de seguridad de rotación `sessions.json.bak.*` durante las escrituras del Gateway. El esquema actual rechaza la clave heredada `session.maintenance.rotateBytes`, y `openclaw doctor --fix` la elimina de las configuraciones antiguas.

Las mutaciones de transcripciones utilizan la cola de escritura de sesiones para el destino de transcripciones de SQLite:

Los bloqueos de escritura de sesiones utilizan valores predeterminados fijos de producción. Las variables de entorno
`OPENCLAW_SESSION_WRITE_LOCK_*` correspondientes siguen disponibles para
diagnósticos a nivel de proceso y anulaciones de emergencia.

### Reversión de versión tras la migración a SQLite

Restaure los artefactos de transcripciones heredados archivados antes de ejecutar una versión anterior
de OpenClaw basada en archivos:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

La migración mantiene los archivos heredados `sessions.json` para tareas de soporte y
reversión, pero los archivos JSONL de transcripciones activos que se importaron a SQLite se
cambian de nombre a `session-sqlite-import-archive/`. Los entornos de ejecución anteriores basados en archivos siguen
las rutas `sessionFile` de `sessions.json`, por lo que necesitan que esos artefactos se restauren
antes del inicio. La restauración utiliza manifiestos de migración, mueve únicamente los artefactos
archivados registrados cuyas rutas originales no existen y mantiene la base de datos SQLite
para una recuperación posterior.

Las sesiones creadas después de la migración a SQLite existen únicamente en SQLite y no aparecerán en un
entorno de ejecución anterior basado en archivos. Si vuelve a actualizar después de una reversión de versión, ejecute de nuevo la secuencia de
inspección y validación de Doctor para que OpenClaw pueda verificar los artefactos heredados
restaurados antes de importarlos.

## Sesiones de Cron y registros de ejecución

Las ejecuciones aisladas de cron crean sus propias entradas de sesión y transcripciones con una retención específica:

- `cron.sessionRetention` (valor predeterminado: `"24h"`) depura del almacén las sesiones antiguas de ejecuciones aisladas de cron; `false` desactiva esta función.
- El historial de ejecución conserva las 2000 filas terminales más recientes por tarea cron. Las filas perdidas mantienen su periodo de limpieza de 24 horas.

Cuando cron fuerza la creación de una nueva sesión de ejecución aislada, depura la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila: conserva las preferencias seguras (ajustes de pensamiento, rapidez, detalle y razonamiento, etiquetas y nombre para mostrar), así como las anulaciones de modelo y autenticación seleccionadas explícitamente por el usuario, pero descarta el contexto ambiental de la conversación (enrutamiento de canales y grupos, política de envío y cola, elevación, origen y vinculación del entorno de ejecución de ACP), de modo que una nueva ejecución aislada no pueda heredar una autoridad de entrega o de ejecución obsoleta de una ejecución anterior.

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica el contenedor de conversación en el que se encuentra (enrutamiento + aislamiento). Reglas canónicas: [/concepts/session](/es/concepts/session).

| Patrón                              | Ejemplo                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Chat principal/directo (por agente) | `agent:<agentId>:<mainKey>` (valor predeterminado: `main`) |
| Grupo                               | `agent:<agentId>:<channel>:group:<id>`                                          |
| Sala/canal (Discord/Slack)          | `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`                     |
| Cron                                | `cron:<job.id>`                                          |
| Webhook                             | `hook:<uuid>` (salvo que se anule)                     |

## Identificadores de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (la identidad de la transcripción de SQLite que continúa la conversación). La lógica de decisión se encuentra en `initSessionState()`, en `src/auto-reply/reply/session.ts`.

- **Restablecer** (`/new`, `/reset`) crea un nuevo `sessionId` para ese `sessionKey`.
- **Sin restablecimiento automático** es el valor predeterminado. El `sessionId` actual continúa mientras Compaction mantiene acotado el contexto activo del modelo.
- **Restablecimiento diario** (`session.reset.mode: "daily"`) crea un nuevo `sessionId` en el siguiente mensaje después del límite de hora local configurado (`session.reset.atHour`, valor predeterminado `4`).
- **Caducidad por inactividad** (`session.reset.mode: "idle"` con `session.reset.idleMinutes`, o el `session.idleMinutes` heredado) crea un nuevo `sessionId` cuando llega un mensaje después del intervalo de inactividad. Si se configuran tanto el restablecimiento diario como la inactividad, prevalece el que caduque primero.
- **Reanudación tras la reconexión de la interfaz de control** conserva la sesión actualmente visible durante un envío posterior a la reconexión cuando el Gateway recibe el `sessionId` correspondiente de un cliente de interfaz de operador. Esta señal se usa una sola vez; los envíos obsoletos ordinarios siguen creando un nuevo `sessionId`.
- **Eventos del sistema** (Heartbeat, activaciones de Cron, notificaciones de ejecución, contabilidad del Gateway) pueden modificar la fila de la sesión, pero nunca prolongan la vigencia del restablecimiento diario o por inactividad. La transición de restablecimiento descarta los avisos de eventos del sistema en cola de la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación del padre** usa la rama activa de OpenClaw al crear una bifurcación de hilo o subagente. Si esa rama es demasiado grande (supera un límite interno fijo, actualmente 100K tokens), OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar un historial inutilizable. El dimensionamiento es automático y no se puede configurar; la configuración heredada `session.parentForkMaxTokens` se elimina mediante `openclaw doctor --fix`.
- **Bifurcaciones del operador**: `sessions.create { parentSessionKey, fork: true }` crea una sesión nueva cuya transcripción se bifurca desde el estado actual del padre (el mismo mecanismo de bifurcación que en la creación de subagentes, incluido el límite de tamaño anterior). La bifurcación se rechaza mientras el padre tenga una ejecución activa, hereda la selección de modelo del padre salvo que se proporcione una explícitamente y marca el `forkedFromParent` hijo con contadores de tokens nuevos.

## Esquema del almacén de sesiones

El almacén de ejecución conserva valores `SessionEntry` en SQLite por agente. El tipo de valor es `SessionEntry` en `src/config/sessions.ts`. Campos principales (lista no exhaustiva):

- `sessionId`: identificador de la transcripción actual utilizado para direccionar filas de transcripción de SQLite
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la vigencia del restablecimiento diario usa este valor. Las filas heredadas pueden derivarlo de la cabecera de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real del usuario o canal; la vigencia del restablecimiento por inactividad usa este valor para que los eventos de Heartbeat, Cron y ejecución no mantengan vivas las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio recuperada de la sesión.
- `updatedAt`: marca de tiempo de la última modificación de la fila del almacén, utilizada para listados, depuración y contabilidad, no como fuente autorizada de la vigencia diaria o por inactividad.
- `archivedAt`: marca de tiempo de archivado opcional. Las sesiones archivadas permanecen en el almacén con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijación opcional. Las sesiones activas fijadas se ordenan antes que las no fijadas; archivar una sesión elimina su fijación.
- Interoperabilidad de hilos de Codex: ambos campos siguen la estructura de gestión de hilos de Codex; los booleanos `archived`/`pinned` transmitidos siempre se derivan de la marca de tiempo y se asignan en el servidor, de acuerdo con la semántica `threads.archived_at` de Codex y la serialización camelCase. Las marcas de tiempo de OpenClaw se expresan en milisegundos desde la época, mientras que Codex usa segundos desde la época, por lo que los puentes realizan la conversión en el punto de integración del Plugin `codex`. Codex aún no tiene una API de fijación (solo `thread/archive`/`thread/unarchive`); el estado fijado permanece en OpenClaw hasta que exista una, momento en el que la estructura coincidente permitirá que las sesiones vinculadas realicen mecánicamente el recorrido de ida y vuelta del estado de fijación.
- La supervisión de Codex solo enumera hilos nativos no archivados. Un hilo `idle` o `notLoaded` local del Gateway cuya actividad se desconoce puede archivarse mediante el `thread/archive` nativo solo después de que el operador confirme explícitamente que ningún otro proceso de Codex es su propietario; el Plugin realiza primero una lectura nueva del estado local del proceso y, a continuación, el hilo desaparece del catálogo. Esa lectura no puede demostrar que otro proceso de App Server no esté usando el hilo. OpenClaw se niega a archivar filas activas y con errores, y el archivado de nodos emparejados no está disponible hasta que el puente de nodos pueda controlar todo el ciclo de vida del hilo transmitido. Desarchivarlo en un cliente nativo de Codex permite que el hilo pueda volver a aparecer.
- `lastReadAt` / `markedUnreadAt`: marcas de tiempo del estado de lectura asignadas en el servidor por `sessions.patch { unread }`; `unread: false` registra una lectura (establece `lastReadAt` y borra `markedUnreadAt`); `unread: true` marca la sesión como no leída hasta la próxima lectura. Las filas de sesión exponen un booleano `unread` derivado: marcado explícitamente como no leído, o leído antes de la actividad más reciente. Las sesiones que nunca se han marcado como leídas permanecen `unread: false`, por lo que las instalaciones existentes no se iluminan tras una actualización.
- `lastActivityAt`: marca de tiempo de la última ejecución completada del agente que cuenta como actividad digna de marcarse como no leída (ejecuciones de usuario, canal y Cron). Los turnos de Heartbeat y eventos internos, además de los parches de metadatos, no la actualizan; `updatedAt` no es una señal de actividad.
- `sessionFile`: marcador heredado conservado para la compatibilidad de migración y archivado; la ejecución activa usa la identidad de SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos de etiquetado de grupos y canales
- Conmutadores: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (anulación por sesión)
- Selección de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (estimación aproximada y dependiente del proveedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: número de veces que se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt` / `memoryFlushCompactionCount`: marca de tiempo y número de compactaciones del último vaciado de memoria previo a la Compaction

El Gateway es la fuente autorizada: puede reescribir o rehidratar las entradas a medida que se
ejecutan las sesiones. En instalaciones heredadas respaldadas por archivos, migre con
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` en lugar de
editar `sessions.json` y esperar que la ejecución siga leyendo ese archivo.

## Estructura de los eventos de transcripción

El descriptor de acceso de sesiones de OpenClaw gestiona las transcripciones y las expone al código de ejecución mediante ayudantes basados en identidades. El flujo de eventos solo permite anexar:

- Primera entrada: cabecera de sesión; `type: "session"`, `id`, `cwd`, `timestamp` y `parentSession` opcional.
- Después: entradas con `id` + `parentId` (estructura de árbol).

Tipos de entrada destacados:

- `message`: mensajes de usuario, asistente y toolResult
- `custom_message`: mensaje insertado por una extensión que _sí_ entra en el contexto del modelo (se representa en la TUI cuando `display: true` y se oculta por completo cuando `display: false`)
- `custom`: estado de la extensión que _no_ entra en el contexto del modelo (para conservar el estado de la extensión entre recargas)
- `compaction`: resumen de Compaction conservado con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen conservado al navegar por una rama del árbol

OpenClaw no «corrige» las transcripciones deliberadamente; el Gateway usa `SessionManager` para leerlas y escribirlas.

## Ventanas de contexto frente a tokens registrados

Dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo). Procede del catálogo de modelos y se puede anular mediante la configuración.
2. **Contadores del almacén de sesiones**: estadísticas acumulativas escritas en la fila de la sesión (utilizadas para `/status` y paneles). `contextTokens` es un valor de estimación o informe de la ejecución; no debe tratarse como una garantía estricta.

Más información sobre los límites: [/reference/token-use](/es/reference/token-use).

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` conservada en la transcripción y mantiene intactos los mensajes recientes. Después de Compaction, los turnos futuros ven el resumen de Compaction más los mensajes posteriores a `firstKeptEntryId`. Compaction es **persistente**, a diferencia de la depuración de sesiones; consulte [/concepts/session-pruning](/es/concepts/session-pruning).

La Compaction integrada de OpenClaw hereda de forma predeterminada el nivel de razonamiento de la sesión. Establezca `agents.defaults.compaction.thinkingLevel` para usar un nivel independiente en las llamadas de resumen; la ejecución lo limita a cada modelo concreto de Compaction o alternativa. La Compaction nativa de App Server de Codex controla su propia solicitud de compactación y no puede aceptar una anulación del razonamiento por Compaction, por lo que OpenClaw muestra una advertencia y deja esa configuración en manos de Codex.

La reinserción de secciones de AGENTS.md después de Compaction es opcional mediante `agents.defaults.compaction.postCompactionSections`; cuando no se establece o es `[]`, OpenClaw no añade fragmentos de AGENTS.md después del resumen de Compaction.

### Límites de fragmentos y emparejamiento de herramientas

Al dividir una transcripción larga en fragmentos de Compaction, OpenClaw mantiene emparejadas las llamadas a herramientas del asistente con sus entradas `toolResult` correspondientes:

- Si la división por proporción de tokens se produjera entre una llamada a una herramienta y su resultado, OpenClaw desplaza el límite hasta el mensaje de llamada a la herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultados de herramientas hiciera que el fragmento superara el objetivo, OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la parte final sin resumir.
- Los bloques de llamadas a herramientas canceladas o con errores no mantienen abierta una división pendiente.

## Cuándo se produce la Compaction automática

Dos desencadenantes en el agente integrado de OpenClaw:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` y otras variantes con la estructura del proveedor); se ejecuta Compaction y luego se vuelve a intentar. Cuando el proveedor informa del número de tokens del intento, OpenClaw reenvía ese número observado a la Compaction de recuperación por desbordamiento; si el proveedor confirma el desbordamiento pero no expone un número analizable, OpenClaw transmite a los motores de Compaction y los diagnósticos un número sintético mínimamente superior al presupuesto. Si la recuperación por desbordamiento sigue fallando, OpenClaw muestra instrucciones explícitas y conserva la asignación de sesión actual en lugar de cambiar silenciosamente a un identificador de sesión nuevo; vuelva a intentar el mensaje, ejecute `/compact` o ejecute `/new`.
2. **Mantenimiento del umbral**: después de un turno satisfactorio, cuando el contexto actual supera la ventana del modelo menos el margen incorporado de OpenClaw para los prompts y la siguiente salida del modelo.

Se ejecutan dos protecciones adicionales fuera de estos dos desencadenantes:

- **Compaction local previa**: establezca `agents.defaults.compaction.maxActiveTranscriptBytes` (bytes o una cadena como `"20mb"`) para activar la Compaction local antes de abrir la siguiente ejecución una vez que la transcripción activa alcance ese tamaño. Esta es una protección de tamaño para el coste de reapertura local, no para el archivado sin procesar: la Compaction semántica normal continúa ejecutándose y requiere `truncateAfterCompaction` para que el resumen compactado se convierta en una nueva transcripción sucesora.
- **Comprobación previa a mitad del turno**: establezca `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valor predeterminado: `false`) para añadir una protección al bucle de herramientas. Después de añadir el resultado de una herramienta y antes de la siguiente llamada al modelo, OpenClaw estima la presión sobre el prompt mediante la misma lógica de presupuesto previo utilizada al inicio del turno. Si el contexto ya no cabe, la protección no realiza la Compaction en línea: genera una señal estructurada de comprobación previa a mitad del turno, detiene el envío del prompt actual y permite que el bucle de ejecución externo utilice la ruta de recuperación existente (truncar los resultados de herramientas demasiado grandes cuando sea suficiente, o activar el modo de Compaction configurado y volver a intentarlo). Funciona con los modos de Compaction `default` y `safeguard`, incluida la Compaction de protección respaldada por el proveedor. Es independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta antes de abrir un turno; la comprobación previa a mitad del turno se ejecuta después, una vez añadidos los nuevos resultados de herramientas.

## Configuración de Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw aplica una reserva integrada para las ejecuciones insertadas y la limita en función de la ventana de contexto del modelo activo para que no consuma todo el presupuesto del prompt. Esto evita que los modelos locales con poco contexto entren en Compaction desde el primer token, a la vez que deja margen suficiente para tareas de mantenimiento de varios turnos, como el volcado de memoria.

La operación manual `/compact` respeta un valor explícito de `agents.defaults.compaction.keepRecentTokens` y conserva el punto de corte de la cola reciente del entorno de ejecución. Sin un presupuesto de conservación explícito, la Compaction manual constituye un punto de control estricto y el contexto reconstruido comienza desde el nuevo resumen.

Cuando `truncateAfterCompaction` está habilitado, OpenClaw rota la transcripción activa a una sucesora compactada después de la Compaction. Las acciones de punto de control para ramificar o restaurar utilizan esa sucesora compactada; los archivos de punto de control heredados anteriores a la Compaction siguen siendo legibles mientras estén referenciados.

## Proveedores de Compaction conectables

Los Plugins registran un proveedor de Compaction mediante `registerCompactionProvider()` en la API del Plugin. Cuando `agents.defaults.compaction.provider` se establece en el id. de un proveedor registrado, la extensión de protección delega la generación del resumen en ese proveedor en lugar de utilizar el Pipeline integrado `summarizeInStages`.

- `provider`: id. de un Plugin proveedor de Compaction registrado. Déjelo sin establecer para utilizar el resumen predeterminado mediante LLM. Establecer un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de conservación de identificadores que la ruta integrada, y la protección sigue conservando el contexto del sufijo de turnos recientes y de turnos divididos después de la salida del proveedor.
- La generación de resúmenes de protección integrada vuelve a destilar los resúmenes anteriores junto con los mensajes nuevos, en lugar de conservar literalmente todo el resumen anterior.
- El modo de protección habilita de forma predeterminada las auditorías de calidad del resumen; establezca `qualityGuard.enabled: false` para omitir el comportamiento de reintento cuando la salida tenga un formato incorrecto.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente a la generación de resúmenes integrada mediante LLM. Las señales de cancelación o tiempo de espera que el llamador haya activado explícitamente se vuelven a generar, en lugar de descartarse, para que la cancelación siempre se respete.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superficies visibles para el usuario

- `/status` en cualquier sesión de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Registros del Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` más el recuento de operaciones de Compaction

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos «silenciosos» para tareas en segundo plano en las que el usuario no debe ver resultados intermedios.

- El asistente comienza su salida con el token silencioso exacto `NO_REPLY` / `no_reply` para indicar «no entregar una respuesta al usuario». OpenClaw lo elimina o suprime en la capa de entrega.
- La supresión del token silencioso exacto no distingue entre mayúsculas y minúsculas: `NO_REPLY` y `no_reply` cuentan cuando toda la carga útil consta únicamente del token silencioso.
- A partir de `2026.1.10`, OpenClaw también suprime la transmisión de borradores o indicadores de escritura cuando un fragmento parcial comienza por `NO_REPLY`, de modo que las operaciones silenciosas no filtren resultados parciales a mitad del turno.
- Esto se utiliza únicamente para turnos reales en segundo plano o sin entrega; no es un atajo para solicitudes ordinarias del usuario que requieran una acción.

## Volcado de memoria previo a la Compaction

Antes de que se produzca la Compaction automática, OpenClaw puede ejecutar un turno agéntico silencioso que escriba el estado duradero en el disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda borrar contexto crítico. Supervisa el uso del contexto de la sesión y, cuando este supera un umbral flexible inferior al umbral de Compaction, envía una directiva silenciosa para «escribir la memoria ahora» mediante el token silencioso exacto `NO_REPLY` / `no_reply`, de modo que el usuario no vea nada.

Configuración (`agents.defaults.compaction.memoryFlush`); referencia completa en [/gateway/config-agents](/es/gateway/config-agents#agentsdefaultscompaction):

| Clave                         | Valor predeterminado          | Notas                                                                                                                                  |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | sin establecer            | sustitución exacta del proveedor/modelo únicamente para el turno de volcado, por ejemplo `ollama/qwen3:8b`                                                   |
| `softThresholdTokens`       | `4000`           | margen por debajo del umbral de Compaction que activa un volcado                                                                               |
| `forceFlushTranscriptBytes` | sin establecer (deshabilitado) | fuerza un volcado cuando el archivo de transcripción alcanza este tamaño en bytes (o una cadena como `"2mb"`), aunque los contadores de tokens estén obsoletos; `0` lo deshabilita |
| `prompt`                    | integrado         | mensaje del usuario para el turno de volcado                                                                                                        |
| `systemPrompt`              | integrado         | prompt adicional del sistema añadido para el turno de volcado                                                                                        |

Notas:

- El prompt y el prompt del sistema predeterminados incluyen una indicación `NO_REPLY` para suprimir la entrega.
- Cuando se establece `model`, el turno de volcado utiliza ese modelo sin heredar la cadena de reserva de la sesión activa, de modo que el mantenimiento exclusivamente local no recurra silenciosamente a un modelo de conversación de pago en caso de error.
- El volcado se ejecuta una vez por ciclo de Compaction (se registra en la fila de la sesión).
- El volcado solo se ejecuta en sesiones insertadas de OpenClaw; los backends de la CLI y los turnos de Heartbeat lo omiten.
- El volcado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulte [Memoria](/es/concepts/memory) para conocer la disposición de archivos del espacio de trabajo y los patrones de escritura.

OpenClaw expone un hook `session_before_compact` en la API de extensiones, pero la lógica de volcado descrita anteriormente reside en el lado del Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), no en ese hook.

## Lista de comprobación para solucionar problemas

- **¿Clave de sesión incorrecta?** Comience por [/concepts/session](/es/concepts/session) y confirme el valor de `sessionKey` en `/status`.
- **¿Discrepancia entre el almacén y la transcripción?** Confirme el host del Gateway y la ruta del almacén mediante `openclaw status`.
- **¿Compaction excesiva?** Compruebe la ventana de contexto del modelo (si es demasiado pequeña, fuerza operaciones de Compaction frecuentes) y el crecimiento excesivo de los resultados de herramientas (ajuste la poda de sesiones).
- **¿Todos los prompts parecen desbordarse en un modelo local pequeño?** Confirme que el proveedor indique la ventana de contexto correcta del modelo. OpenClaw solo puede limitar la reserva efectiva cuando se conoce esa ventana.
- **¿Se filtran los turnos silenciosos?** Confirme que la respuesta comience con el token silencioso exacto `NO_REPLY` (sin distinguir entre mayúsculas y minúsculas) y que se esté utilizando una compilación que incluya la corrección de supresión de transmisión (`2026.1.10`+).

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
- [Referencia de configuración del agente](/es/gateway/config-agents)
