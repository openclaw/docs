---
read_when:
    - Necesita depurar los identificadores de sesión, los eventos de transcripción o los campos de las filas de sesión
    - Está cambiando el comportamiento de la compactación automática o añadiendo tareas de mantenimiento previas a la compactación
    - Quiere implementar volcados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacén de sesiones y transcripciones, ciclo de vida y funcionamiento interno de la Compaction (automática)'
title: Análisis exhaustivo de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-22T10:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ae02d49245768831abd17e1c2e5adacfa1a36673cef2a8a7a06a5300392b104
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un único **proceso de Gateway** controla el estado de las sesiones de principio a fin. Las interfaces de usuario (aplicación para macOS, interfaz web Control UI, TUI) consultan al Gateway para obtener las listas de sesiones y los recuentos de tokens. En modo remoto, los archivos de sesión se encuentran en el host remoto, por lo que consultar los archivos del Mac local no reflejará lo que utiliza el Gateway.

Primero, la documentación general: [Gestión de sesiones](/es/concepts/session), [Compaction](/es/concepts/compaction), [Descripción general de la memoria](/es/concepts/memory), [Búsqueda en memoria](/es/concepts/memory-search), [Depuración de sesiones](/es/concepts/session-pruning), [Higiene de transcripciones](/es/reference/transcript-hygiene); la referencia completa de configuración está en [Configuración del agente](/es/gateway/config-agents).

## Dos capas de persistencia

1. **Filas de sesión (SQLite por agente)** - mapa de clave/valor `sessionKey -> SessionEntry`. Estado mutable de ejecución controlado por el Gateway. Registra metadatos: id. de sesión actual, última actividad, opciones, contadores de tokens.
2. **Eventos de transcripción (SQLite por agente)** - estructura de árbol de solo anexado (las entradas tienen `id` + `parentId`). Almacena la conversación, las llamadas a herramientas y los resúmenes de Compaction; reconstruye el contexto del modelo para turnos futuros. Los puntos de control de Compaction son metadatos de la transcripción sucesora compactada; una nueva Compaction no escribe una segunda copia de `.checkpoint.*.jsonl`.

Las instalaciones anteriores aún pueden tener archivos `sessions.json` en el directorio `sessions/`
del agente. Estos archivos deben tratarse como entradas de migración de filas de sesión heredadas u objetivos explícitos
de mantenimiento sin conexión. El inicio del Gateway y `openclaw doctor --fix` importan
automáticamente las filas heredadas activas y el historial de transcripciones al almacén SQLite por agente.
Ejecute `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y, después, siga la [secuencia de migración de
Doctor](/es/cli/doctor#session-sqlite-migration) cuando necesite una inspección explícita
o pruebas de validación. Si una migración falla después de archivar los artefactos
de transcripción heredados, utilice el modo de recuperación de Doctor de esa secuencia.
La recuperación utiliza manifiestos de migración, restaura únicamente los artefactos
de soporte archivados afectados, prepara un informe saneado de incidencia de GitHub cuando se solicita y no
hace que la ejecución activa vuelva a leer archivos JSONL.

Los lectores del historial del Gateway evitan materializar toda la transcripción a menos que la superficie necesite acceso arbitrario al historial. El historial de la primera página, el historial de chat incrustado, la recuperación tras reinicios y las comprobaciones de tokens/uso emplean lecturas limitadas del final de SQLite. Los análisis completos de las transcripciones pasan por el índice asíncrono de transcripciones y se comparten entre lectores simultáneos.

## Ubicaciones en disco

Por agente, en el host del Gateway (resueltas mediante `src/config/sessions.ts`):

- Almacén de filas de sesión de ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Filas de transcripción de ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefactos de transcripción heredados/archivados: `~/.openclaw/agents/<agentId>/sessions/`
- Entrada de migración de filas heredadas: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Mantenimiento del almacén y controles de disco

`session.maintenance` controla el mantenimiento automático de las filas de sesión SQLite, las filas de transcripción SQLite, los artefactos archivados y los archivos auxiliares de trayectorias:

| Clave                   | Valor predeterminado   | Notas                                                                                       |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | o `"warn"` (solo informa, sin modificaciones)                                                      |
| `pruneAfter`            | `"30d"`               | límite de antigüedad de las entradas obsoletas                                                                      |
| `maxEntries`            | `500`                 | límite de entradas de sesión                                                                      |
| `resetArchiveRetention` | conservar (sin límite de antigüedad)  | límite de antigüedad de los archivos de transcripción `*.reset.*`/`*.deleted.*`; una duración habilita su eliminación |
| `maxDiskBytes`          | `10gb`                | presupuesto de disco para sesiones por agente; `false` lo deshabilita                                            |
| `highWaterBytes`        | 80 % de `maxDiskBytes` | objetivo tras la limpieza por presupuesto                                                                 |

El restablecimiento adelanta la asignación activa de `sessionKey -> sessionId`, pero conserva las filas de sesión, transcripción, trayectoria y búsqueda anteriores de SQLite. Ese historial sigue siendo localizable con la misma clave de sesión; las listas habituales de entradas y sesiones solo muestran la nueva asignación activa. El historial conservado tras el restablecimiento está limitado por el presupuesto de disco, no por `resetArchiveRetention`, que solo determina la antigüedad de los artefactos archivados. La eliminación explícita es diferente: escribe y verifica un archivo comprimido de la transcripción (`*.jsonl.deleted.<timestamp>.zst` cuando zstd está disponible) antes de eliminar las filas de la sesión eliminada.

La aplicación de `maxDiskBytes` utiliza bytes físicos: el archivo principal SQLite por agente, su archivo `-wal` y los archivos contabilizados en el directorio de sesiones del agente. Nunca estima los tamaños JSON de las filas ni resta tamaños lógicos de filas de ese total.

Las sesiones de sondeo de ejecución del modelo del Gateway (claves que coinciden con `agent:*:explicit:model-run-<uuid>`) tienen una retención fija independiente de `24h`. Esta depuración está condicionada por la presión: solo se ejecuta cuando se alcanza el límite o la presión de mantenimiento de entradas de sesión, y únicamente antes del paso global de limpieza o limitación de entradas obsoletas. Las demás sesiones explícitas no utilizan esta retención.

Cuando el uso físico combinado supera `maxDiskBytes`, `mode: "enforce"` primero recupera el espacio de base de datos que puede liberarse mediante puntos de control y después elimina los archivos conservados más antiguos de restablecimientos y eliminaciones. Si el uso aún supera `highWaterBytes`, recorre las sesiones históricas de SQLite según `sessions.updated_at`, comenzando por las más antiguas. Una sesión es histórica cuando su id. no está referenciado por una entrada de sesión activa, un destino de ruta ni una ejecución admitida o en curso. Para cada víctima, la limpieza escribe, sincroniza con fsync y vuelve a leer el archivo comprimido antes de que una transacción de escritura elimine la fila de sesión y sus proyecciones de transcripción, trayectoria, actividad, índice y FTS. Esto incluye sesiones que contienen eventos de trayectoria, pero no eventos de transcripción. La limpieza vuelve a comprobar las referencias de rutas, entradas y admisiones en el momento de la eliminación, vuelve a medir el uso físico después de cada archivo o sesión víctima y se detiene en `highWaterBytes`.

Las escrituras confirmadas y las eliminaciones llegan primero al WAL. La limpieza crea un punto de control para que el WAL pueda reducirse inmediatamente y después utiliza un vaciado incremental para devolver las páginas finales libres aptas del archivo principal; las páginas que aún no pueden recuperarse permanecen en el archivo principal y, por tanto, siguen contabilizándose en la siguiente medición física. `mode: "warn"` informa del exceso físico actual sin crear un punto de control, escribir un archivo ni eliminar filas.

Ejecute el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

El mantenimiento conserva los punteros duraderos a conversaciones externas, como sesiones de grupo y sesiones de chat limitadas a hilos, pero las entradas sintéticas de ejecución (Cron, enlaces, Heartbeat, ACP y subagentes) pueden eliminarse cuando superan la antigüedad, el recuento o el presupuesto de disco configurados. Las ejecuciones aisladas de Cron utilizan un control `cron.sessionRetention` independiente, separado de la retención de sondeos de ejecución del modelo.

Las escrituras normales del Gateway pasan por el descriptor de acceso a sesiones, que serializa las modificaciones de SQLite por agente mediante la ruta de escritura de ejecución. El código de ejecución debe priorizar los auxiliares del descriptor de acceso de `src/config/sessions/session-accessor.ts`; los auxiliares heredados de `sessions.json` son herramientas de migración y mantenimiento sin conexión. Cuando se puede acceder a un Gateway, las ejecuciones sin `openclaw sessions cleanup` de `openclaw agents delete` delegan las modificaciones del almacén al Gateway para que la limpieza se incorpore a la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para un almacén heredado seleccionado y siempre permanece local (al igual que `--dry-run`). La limpieza de `maxEntries` se realiza por lotes para almacenes del tamaño habitual en producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza por límite superior vuelva a reducirlo. Las lecturas nunca depuran ni limitan entradas durante el inicio del Gateway: solo lo hacen las escrituras o `openclaw sessions cleanup --enforce`; este último también aplica el límite inmediatamente y depura los artefactos antiguos no referenciados de transcripciones, puntos de control y trayectorias heredadas, incluso si no hay ningún presupuesto de disco configurado.

OpenClaw ya no crea automáticamente copias de seguridad de rotación `sessions.json.bak.*` durante las escrituras del Gateway. El esquema actual rechaza la clave heredada `session.maintenance.rotateBytes` y `openclaw doctor --fix` la elimina de las configuraciones anteriores.

Las modificaciones de transcripciones utilizan la cola de escritura de sesiones para el destino de transcripciones de SQLite:

Los bloqueos de escritura de sesiones utilizan valores predeterminados fijos de producción. Las variables de entorno
`OPENCLAW_SESSION_WRITE_LOCK_*` correspondientes siguen disponibles para
diagnósticos en el nivel del proceso y anulaciones de emergencia.

### Reversión a una versión anterior después de la transición a SQLite

Restaure los artefactos archivados de transcripciones heredadas antes de ejecutar una versión anterior de OpenClaw
basada en archivos:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

La migración conserva los archivos heredados `sessions.json` para soporte y
reversión, pero los archivos JSONL de transcripciones activas importados a SQLite se
renombran a `session-sqlite-import-archive/`. Las ejecuciones anteriores basadas en archivos siguen
las rutas `sessionFile` de `sessions.json`, por lo que necesitan restaurar esos artefactos
antes del inicio. La restauración utiliza manifiestos de migración, mueve únicamente los artefactos
archivados registrados cuyas rutas originales no existen y conserva la base de datos SQLite
para la recuperación posterior.

Las sesiones creadas después de la transición a SQLite solo existen en SQLite y no aparecerán en una
ejecución anterior basada en archivos. Si vuelve a actualizar después de revertir a una versión anterior, ejecute otra vez la
secuencia de inspección y validación de Doctor para que OpenClaw pueda verificar los artefactos heredados
restaurados antes de importarlos.

## Sesiones de Cron y registros de ejecución

Las ejecuciones aisladas de Cron crean sus propias entradas/transcripciones de sesión con una retención específica:

- `cron.sessionRetention` (valor predeterminado: `"24h"`) depura del almacén las sesiones antiguas de ejecuciones aisladas de Cron; `false` lo deshabilita.
- El historial de ejecuciones conserva las 2000 filas terminales más recientes por trabajo de Cron. Las filas perdidas conservan su intervalo de limpieza de 24 horas.

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila: transfiere las preferencias seguras (ajustes de pensamiento/rapidez/detalle/razonamiento, etiquetas y nombre para mostrar) y las anulaciones de modelo/autenticación seleccionadas explícitamente por el usuario, pero descarta el contexto ambiental de la conversación (enrutamiento de canal/grupo, política de envío/cola, elevación, origen y vinculación de ejecución de ACP) para que una nueva ejecución aislada no pueda heredar una entrega obsoleta ni autoridad de ejecución de una ejecución anterior.

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica el contenedor de conversación en el que se encuentra (enrutamiento + aislamiento). Reglas canónicas: [/concepts/session](/es/concepts/session).

| Patrón                       | Ejemplo                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Chat principal/directo (por agente) | `agent:<agentId>:<mainKey>` (valor predeterminado: `main`)                |
| Grupo                        | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (salvo que se anule)                           |

## Id. de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (la identidad de transcripción de SQLite que continúa la conversación). La lógica de decisión se encuentra en `initSessionState()` dentro de `src/auto-reply/reply/session.ts`.

- **Restablecer** (`/new`, `/reset`) crea un nuevo `sessionId` para ese `sessionKey`.
- **Sin restablecimiento automático** es el valor predeterminado. El `sessionId` actual continúa mientras Compaction mantiene acotado el contexto activo del modelo.
- **Restablecimiento diario** (`session.reset.mode: "daily"`) crea un nuevo `sessionId` con el siguiente mensaje después del límite de hora local configurado (`session.reset.atHour`, valor predeterminado `4`).
- **Caducidad por inactividad** (`session.reset.mode: "idle"` con `session.reset.idleMinutes`, o el `session.idleMinutes` heredado) crea un nuevo `sessionId` cuando llega un mensaje después del periodo de inactividad. Si se configuran tanto el restablecimiento diario como el de inactividad, prevalece el que caduque primero.
- **Reanudación al reconectar la interfaz de control** conserva la sesión visible actualmente para un envío tras la reconexión cuando el Gateway recibe el `sessionId` correspondiente de un cliente de interfaz de operador. Esta es una señal de un solo uso; los envíos obsoletos normales siguen creando un nuevo `sessionId`.
- **Eventos del sistema** (Heartbeat, activaciones de Cron, notificaciones de ejecución, contabilidad del Gateway) pueden modificar la fila de la sesión, pero nunca prolongan la vigencia del restablecimiento diario o por inactividad. El cambio de sesión por restablecimiento descarta los avisos de eventos del sistema en cola de la sesión anterior antes de crear el prompt nuevo.
- **Política de bifurcación desde el padre** usa la rama activa de OpenClaw al crear una bifurcación de hilo o subagente. Si esa rama es demasiado grande (supera un límite interno fijo, actualmente de 100K tokens), OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar un historial inutilizable. El cálculo del tamaño es automático y no es configurable; `openclaw doctor --fix` elimina la configuración heredada `session.parentForkMaxTokens`.
- **Bifurcaciones del operador**: `sessions.create { parentSessionKey, fork: true }` crea una sesión nueva cuya transcripción se bifurca desde el estado actual del padre (el mismo mecanismo de bifurcación que usan las creaciones de subagentes, incluido el límite de tamaño anterior). La bifurcación se rechaza mientras el padre tiene una ejecución activa, hereda la selección de modelo del padre salvo que se proporcione una explícitamente y marca el `forkedFromParent` hijo con contadores de tokens nuevos.

## Esquema del almacén de sesiones

El almacén de ejecución conserva valores `SessionEntry` en una base de datos SQLite por agente. El tipo de valor es `SessionEntry` en `src/config/sessions.ts`. Campos clave (lista no exhaustiva):

- `sessionId`: identificador de la transcripción actual usado para direccionar las filas de transcripciones de SQLite
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la vigencia del restablecimiento diario usa este valor. Las filas heredadas pueden derivarlo del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real del usuario o canal; la vigencia del restablecimiento por inactividad usa este valor para que los eventos de Heartbeat, Cron y ejecución no mantengan activas las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio recuperada de la sesión.
- `updatedAt`: marca de tiempo de la última modificación de la fila del almacén, usada para listados, depuración y contabilidad; no es la autoridad sobre la vigencia diaria o por inactividad.
- `archivedAt`: marca de tiempo de archivado opcional. Las sesiones archivadas permanecen en el almacén con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijación opcional. Las sesiones activas fijadas se ordenan antes que las no fijadas; archivar una sesión elimina su fijación.
- Interoperabilidad con hilos de Codex: ambos campos siguen la estructura de gestión de hilos de Codex; los valores booleanos `archived`/`pinned` transmitidos siempre se derivan de la marca de tiempo y se asignan en el servidor, de acuerdo con la semántica de `threads.archived_at` de Codex y la serialización camelCase. Las marcas de tiempo de OpenClaw están en milisegundos desde la época, mientras que Codex usa segundos desde la época, por lo que los puentes realizan la conversión en el límite del Plugin `codex`. Codex aún no tiene una API de fijación (solo `thread/archive`/`thread/unarchive`); el estado fijado permanece en OpenClaw hasta que exista una, momento en el que la estructura coincidente permitirá que las sesiones vinculadas conserven mecánicamente su estado de fijación en ambos sentidos.
- La supervisión de Codex solo enumera hilos nativos no archivados. Un hilo local del Gateway `idle` o `notLoaded` cuya actividad se desconozca solo puede archivarse mediante `thread/archive` nativo después de que el operador confirme explícitamente que ningún otro proceso de Codex lo controla; primero, el Plugin realiza una lectura nueva del estado local del proceso y, después, el hilo desaparece del catálogo. Esa lectura no puede demostrar que otro proceso del servidor de aplicaciones no esté usando el hilo. OpenClaw rechaza el archivado de filas activas y con errores, y el archivado de nodos emparejados no estará disponible hasta que el puente de nodos pueda controlar todo el ciclo de vida del hilo transmitido. Desarchivar el hilo en un cliente nativo de Codex permite que vuelva a aparecer.
- `lastReadAt` / `markedUnreadAt`: marcas de tiempo del estado de lectura asignadas en el servidor por `sessions.patch { unread }`; `unread: false` registra una lectura (establece `lastReadAt` y borra `markedUnreadAt`); `unread: true` marca la sesión como no leída hasta la siguiente lectura. Las filas de sesión exponen un valor booleano derivado `unread`: marcado explícitamente como no leído o leído antes de la actividad más reciente. Las sesiones que nunca se han marcado como leídas permanecen `unread: false`, por lo que las instalaciones existentes no muestran indicadores al actualizarse.
- `lastActivityAt`: marca de tiempo de la última ejecución completada del agente que cuenta como actividad que merece marcarse como no leída (ejecuciones de usuario, canal y Cron). Los turnos de Heartbeat y eventos internos, así como las modificaciones de metadatos, no la actualizan; `updatedAt` no es una señal de actividad.
- `sessionFile`: marcador heredado conservado para mantener la compatibilidad de migración y archivado; la ejecución activa usa la identidad de SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos de etiquetado de grupos y canales
- Opciones: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (anulación por sesión)
- Selección de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (estimados y dependientes del proveedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: número de veces que se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt` / `memoryFlushCompactionCount`: marca de tiempo y número de Compaction del último vaciado de memoria previo a la Compaction

El Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las
sesiones. Para instalaciones heredadas basadas en archivos, realice la migración con
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` en lugar de
editar `sessions.json` y esperar que la ejecución siga leyendo ese archivo.

## Estructura de eventos de la transcripción

Las transcripciones las gestiona el descriptor de acceso a sesiones de OpenClaw y se exponen al código de ejecución mediante ayudantes basados en identidades. El flujo de eventos solo permite anexar:

- Primera entrada: encabezado de sesión: `type: "session"`, `id`, `cwd`, `timestamp` y `parentSession` opcional.
- Después: entradas con `id` + `parentId` (estructura de árbol).

Tipos de entrada destacados:

- `message`: mensajes de usuario, asistente o toolResult
- `custom_message`: mensaje insertado por una extensión que _sí_ entra en el contexto del modelo (se representa en la TUI cuando `display: true` y se oculta por completo cuando `display: false`)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo (para conservar el estado de la extensión entre recargas)
- `compaction`: resumen de Compaction persistente con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistente al recorrer una rama del árbol

OpenClaw no «corrige» las transcripciones deliberadamente; el Gateway usa `SessionManager` para leerlas y escribirlas.

## Ventanas de contexto frente a tokens registrados

Dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo). Procede del catálogo de modelos y se puede anular mediante la configuración.
2. **Contadores del almacén de sesiones**: estadísticas acumuladas escritas en la fila de la sesión (se usan para `/status` y los paneles). `contextTokens` es un valor de estimación o informe de la ejecución; no debe considerarse una garantía estricta.

Más información sobre los límites: [/reference/token-use](/es/reference/token-use).

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistente de la transcripción y mantiene intactos los mensajes recientes. Después de Compaction, los turnos futuros ven el resumen de Compaction junto con los mensajes posteriores a `firstKeptEntryId`. Compaction es **persistente**, a diferencia de la depuración de sesiones; consulte [/concepts/session-pruning](/es/concepts/session-pruning).

La Compaction integrada de OpenClaw hereda de forma predeterminada el nivel de razonamiento de la sesión. Establezca `agents.defaults.compaction.thinkingLevel` para usar un nivel diferente en las llamadas de resumen; la ejecución lo limita según cada modelo concreto de Compaction o alternativa. La Compaction nativa del servidor de aplicaciones de Codex controla su solicitud de compactación y no puede aceptar una anulación del nivel de razonamiento por Compaction, por lo que OpenClaw muestra una advertencia y deja esa configuración a Codex.

La reinserción de la sección AGENTS.md después de Compaction sigue siendo opcional mediante `agents.defaults.compaction.postCompactionSections`. Los Plugins pueden añadir otro contexto del prompt mediante `before_prompt_build`.

### Límites de fragmentos y emparejamiento de herramientas

Al dividir una transcripción larga en fragmentos para Compaction, OpenClaw mantiene emparejadas las llamadas a herramientas del asistente con sus entradas `toolResult` correspondientes:

- Si la división según la proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultados de herramientas hiciera que el fragmento superase el objetivo, OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la cola sin resumir.
- Los bloques de llamadas a herramientas canceladas o con errores no mantienen abierta una división pendiente.

## Cuándo se produce la Compaction automática

Dos desencadenantes en el agente integrado de OpenClaw:

1. **Recuperación tras desbordamiento**: el modelo devuelve un error de desbordamiento del contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` y otras variantes con formato específico del proveedor): se realiza la Compaction y después se reintenta. Cuando el proveedor informa del número de tokens intentado, OpenClaw transmite ese valor observado a la Compaction de recuperación tras desbordamiento; si el proveedor confirma el desbordamiento, pero no expone ningún valor analizable, OpenClaw proporciona a los motores de Compaction y al diagnóstico un valor sintético mínimamente superior al presupuesto. Si la recuperación tras desbordamiento sigue fallando, OpenClaw muestra instrucciones explícitas y conserva la asignación de sesión actual en lugar de cambiar silenciosamente a un identificador de sesión nuevo: vuelva a intentar el mensaje, ejecute `/compact` o ejecute `/new`.
2. **Mantenimiento por umbral**: después de un turno correcto, cuando el contexto actual supera la ventana del modelo menos el margen integrado de OpenClaw para los prompts y la siguiente salida del modelo.

Se ejecutan dos protecciones adicionales fuera de estos dos desencadenantes:

- **Compaction local previa**: configure `agents.defaults.compaction.maxActiveTranscriptBytes` (bytes o una cadena como `"20mb"`) para activar la compaction local antes de abrir la siguiente ejecución cuando la transcripción activa alcance ese tamaño. Esta es una protección de tamaño para el coste de reapertura local, no para el archivado sin procesar: la compaction semántica normal sigue ejecutándose y requiere `truncateAfterCompaction` para que el resumen compactado se convierta en una nueva transcripción sucesora.
- **Comprobación previa a mitad del turno**: configura `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valor predeterminado: `false`) para añadir una protección al bucle de herramientas. Después de adjuntar el resultado de una herramienta y antes de la siguiente llamada al modelo, OpenClaw estima la presión sobre el prompt mediante la misma lógica de presupuesto previo utilizada al inicio del turno. Si el contexto ya no cabe, la protección no realiza la compaction en línea: genera una señal estructurada de comprobación previa a mitad del turno, detiene el envío del prompt actual y permite que el bucle de ejecución externo utilice la ruta de recuperación existente (truncar los resultados de herramientas demasiado grandes cuando sea suficiente, o activar el modo de compaction configurado y volver a intentarlo). Funciona con los modos de compaction `default` y `safeguard`, incluida la compaction de protección respaldada por el proveedor. Es independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta antes de abrir un turno; la comprobación previa a mitad del turno se ejecuta después, una vez añadidos los nuevos resultados de herramientas.

## Configuración de compaction

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

OpenClaw aplica una reserva integrada para las ejecuciones incrustadas y la limita según la ventana de contexto del modelo activo para que no pueda consumir todo el presupuesto del prompt. Esto evita que los modelos locales con poco contexto entren en compaction desde el primer token, a la vez que deja suficiente margen para tareas de mantenimiento de varios turnos, como el volcado de memoria.

La operación manual `/compact` respeta un valor explícito de `agents.defaults.compaction.keepRecentTokens` y conserva el punto de corte de la cola reciente del entorno de ejecución. Sin un presupuesto explícito de conservación, la compaction manual es un punto de control estricto y el contexto reconstruido comienza desde el nuevo resumen.

Cuando `truncateAfterCompaction` está habilitado, OpenClaw rota la transcripción activa a una sucesora compactada después de la compaction. Las acciones de punto de control de bifurcación/restauración utilizan esa sucesora compactada; los archivos de punto de control anteriores a la compaction siguen siendo legibles mientras estén referenciados.

## Proveedores de compaction conectables

Los plugins registran un proveedor de compaction mediante `registerCompactionProvider()` en la API de plugins. Cuando `agents.defaults.compaction.provider` se establece en el identificador de un proveedor registrado, la extensión de protección delega el resumen a ese proveedor en lugar de usar el pipeline integrado `summarizeInStages`.

- `provider`: identificador de un plugin proveedor de compaction registrado. Déjalo sin configurar para usar el resumen predeterminado mediante LLM. Configurar un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de compaction y la misma política de conservación de identificadores que la ruta integrada, y la protección sigue conservando el contexto del sufijo de los turnos recientes y los turnos divididos después de la salida del proveedor.
- El resumen de protección integrado vuelve a destilar los resúmenes anteriores junto con los mensajes nuevos, en lugar de conservar literalmente todo el resumen anterior.
- El modo de protección habilita de forma predeterminada las auditorías de calidad del resumen; configura `qualityGuard.enabled: false` para omitir el comportamiento de reintento cuando la salida tiene un formato incorrecto.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen integrado mediante LLM. Las señales de cancelación o tiempo de espera activadas explícitamente por el llamador se vuelven a lanzar, en lugar de ignorarse, para que la cancelación siempre se respete.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superficies visibles para el usuario

- `/status` en cualquier sesión de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Registros del Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` más el recuento de compactions

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos «silenciosos» para tareas en segundo plano en las que el usuario no debe ver resultados intermedios.

- El asistente comienza su salida con el token silencioso exacto `NO_REPLY` / `no_reply` para indicar «no entregar una respuesta al usuario». OpenClaw lo elimina o suprime en la capa de entrega.
- La supresión del token silencioso exacto no distingue entre mayúsculas y minúsculas: `NO_REPLY` y `no_reply` cuentan por igual cuando toda la carga útil contiene únicamente el token silencioso.
- A partir de `2026.1.10`, OpenClaw también suprime el streaming de borradores/indicadores de escritura cuando un fragmento parcial comienza con `NO_REPLY`, para que las operaciones silenciosas no filtren resultados parciales a mitad del turno.
- Esto se utiliza únicamente para turnos verdaderamente en segundo plano o sin entrega; no es un atajo para solicitudes prácticas ordinarias del usuario.

## Volcado de memoria previo a la compaction

Antes de que se produzca la compaction automática, OpenClaw puede ejecutar un turno agéntico silencioso que escribe estado duradero en el disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la compaction no pueda borrar contexto crítico. Supervisa el uso del contexto de la sesión y, cuando supera un umbral flexible inferior al umbral de compaction, envía una directiva silenciosa de «escribir la memoria ahora» mediante el token silencioso exacto `NO_REPLY` / `no_reply`, de modo que el usuario no vea nada.

Configuración (`agents.defaults.compaction.memoryFlush`); referencia completa en [/gateway/config-agents](/es/gateway/config-agents#agentsdefaultscompaction):

| Clave                       | Valor predeterminado | Notas                                                                                                                                  |
| --------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | sin configurar      | sustitución exacta del proveedor/modelo solo para el turno de volcado, por ejemplo `ollama/qwen3:8b`                                   |
| `softThresholdTokens`       | `4000`           | margen por debajo del umbral de compaction que activa un volcado                                                                        |
| `forceFlushTranscriptBytes` | sin configurar (deshabilitado) | fuerza un volcado cuando el archivo de transcripción alcanza este tamaño en bytes (o una cadena como `"2mb"`), incluso si los contadores de tokens están obsoletos; `0` lo deshabilita |

Notas:

- El prompt integrado y el prompt del sistema incluyen una indicación `NO_REPLY` para suprimir la entrega.
- Cuando se configura `model`, el turno de volcado utiliza ese modelo sin heredar la cadena de respaldo de la sesión activa, para que el mantenimiento exclusivamente local no recurra silenciosamente a un modelo de conversación de pago en caso de fallo.
- El volcado se ejecuta una vez por ciclo de compaction (registrado en la fila de la sesión).
- El volcado se ejecuta únicamente para sesiones incrustadas de OpenClaw; los backends de CLI y los turnos de Heartbeat lo omiten.
- El volcado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver la disposición de los archivos del espacio de trabajo y los patrones de escritura.

OpenClaw expone un hook `session_before_compact` en la API de extensiones, pero la lógica de volcado anterior reside en el lado del Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), no en ese hook.

## Lista de comprobación para solucionar problemas

- **¿Clave de sesión incorrecta?** Empieza por [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- **¿Discordancia entre el almacén y la transcripción?** Confirma el host del Gateway y la ruta del almacén mediante `openclaw status`.
- **¿Compaction excesiva?** Comprueba la ventana de contexto del modelo (si es demasiado pequeña, fuerza compactions frecuentes) y el exceso de datos en los resultados de herramientas (ajusta la poda de sesiones).
- **¿Parece que todos los prompts desbordan un modelo local pequeño?** Confirma que el proveedor informe de la ventana de contexto correcta del modelo. OpenClaw solo puede limitar la reserva efectiva cuando se conoce esa ventana.
- **¿Se filtran los turnos silenciosos?** Confirma que la respuesta comience con el token silencioso exacto `NO_REPLY` (sin distinguir entre mayúsculas y minúsculas) y que se utilice una compilación que incluya la corrección de supresión de streaming (`2026.1.10`+).

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
- [Referencia de configuración del agente](/es/gateway/config-agents)
