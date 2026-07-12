---
read_when:
    - Necesita depurar los identificadores de sesión, los eventos de transcripción o los campos de las filas de sesión
    - Está cambiando el comportamiento de la compactación automática o añadiendo tareas de mantenimiento «previas a la compactación»
    - Quiere implementar volcados de memoria o turnos silenciosos del sistema
summary: 'Análisis detallado: almacenamiento de sesiones y transcripciones, ciclo de vida y funcionamiento interno de la compactación (automática)'
title: Análisis detallado de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-12T14:49:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un único **proceso Gateway** gestiona el estado de las sesiones de extremo a extremo. Las interfaces de usuario (aplicación para macOS, interfaz web de Control, TUI) consultan al Gateway las listas de sesiones y los recuentos de tokens. En modo remoto, los archivos de sesión se encuentran en el host remoto, por lo que revisar los archivos del Mac local no reflejará lo que utiliza el Gateway.

Documentación general primero: [Gestión de sesiones](/es/concepts/session), [Compaction](/es/concepts/compaction), [Descripción general de la memoria](/es/concepts/memory), [Búsqueda en la memoria](/es/concepts/memory-search), [Depuración de sesiones](/es/concepts/session-pruning), [Higiene de transcripciones](/es/reference/transcript-hygiene), referencia completa de configuración en [Configuración del agente](/es/gateway/config-agents).

## Dos capas de persistencia

1. **Filas de sesión (SQLite por agente)** - mapa de clave/valor `sessionKey -> SessionEntry`. Estado de ejecución mutable gestionado por el Gateway. Registra metadatos: identificador de la sesión actual, última actividad, opciones, contadores de tokens.
2. **Eventos de transcripción (SQLite por agente)** - de solo anexado y estructurados en árbol (las entradas tienen `id` + `parentId`). Almacenan la conversación, las llamadas a herramientas y los resúmenes de Compaction; reconstruyen el contexto del modelo para turnos futuros. Los puntos de control de Compaction son metadatos de la transcripción sucesora compactada; una nueva Compaction no escribe una segunda copia `.checkpoint.*.jsonl`.

Las instalaciones anteriores aún pueden tener archivos `sessions.json` en el directorio
`sessions/` del agente. Trate esos archivos como entradas de migración de filas
de sesión heredadas o como objetivos explícitos de mantenimiento sin conexión.
El inicio del Gateway y `openclaw doctor --fix` importan automáticamente las filas
heredadas activas y el historial de transcripciones al almacén SQLite por agente.
Ejecute `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` y, a continuación, siga la [secuencia de migración
de Doctor](/es/cli/doctor#session-sqlite-migration) cuando necesite pruebas
explícitas de inspección o validación. Si una migración falla después de archivar
los artefactos de transcripción heredados, utilice el modo de recuperación de
Doctor de esa secuencia. La recuperación utiliza manifiestos de migración,
restaura únicamente los artefactos de soporte archivados afectados, prepara un
informe depurado de incidencia de GitHub cuando se solicita y no hace que la
ejecución activa vuelva a leer archivos JSONL.

Los lectores del historial del Gateway evitan materializar toda la transcripción, salvo que la superficie necesite acceso arbitrario al historial. El historial de la primera página, el historial de chat integrado, la recuperación tras reinicios y las comprobaciones de tokens/uso emplean lecturas acotadas del final de SQLite. Los recorridos completos de transcripciones pasan por el índice asíncrono de transcripciones y se comparten entre lectores simultáneos.

## Ubicaciones en disco

Por agente, en el host del Gateway (resueltas mediante `src/config/sessions.ts`):

- Almacén de filas de sesión en ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Filas de transcripción en ejecución: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Artefactos de transcripción heredados/archivados: `~/.openclaw/agents/<agentId>/sessions/`
- Entrada de migración de filas heredadas: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Mantenimiento del almacén y controles de disco

`session.maintenance` controla el mantenimiento automático de las filas de sesión de SQLite, las filas de transcripción de SQLite, los artefactos archivados y los archivos auxiliares de trayectorias:

| Clave                   | Valor predeterminado            | Notas                                                                                                                         |
| ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`                     | o `"warn"` (solo informa, sin modificaciones)                                                                                 |
| `pruneAfter`            | `"30d"`                         | umbral de antigüedad de las entradas inactivas                                                                                |
| `maxEntries`            | `500`                           | límite de entradas de sesión                                                                                                  |
| `resetArchiveRetention` | conservar (sin límite de edad)  | límite de edad para los archivos de transcripción `*.reset.*`/`*.deleted.*`; una duración habilita su eliminación             |
| `maxDiskBytes`          | `2gb`                           | presupuesto de disco para sesiones por agente; `false` lo deshabilita                                                         |
| `highWaterBytes`        | 80 % de `maxDiskBytes`          | objetivo después de la limpieza por presupuesto                                                                               |

Las transcripciones archivadas se conservan de forma predeterminada y se comprimen con zstd (`*.jsonl.<reason>.<timestamp>.zst`) cuando el entorno de ejecución lo admite, por lo que eliminar o restablecer una sesión nunca descarta silenciosamente el historial de conversaciones. El presupuesto de disco expulsa primero los archivos más antiguos antes de afectar a las sesiones activas.

La aplicación activa de `maxDiskBytes` en SQLite mide los bytes del JSON de las filas de sesión más los bytes del JSON de los eventos de transcripción por sesión; la aplicación del mantenimiento heredado sin conexión mide los archivos del directorio de sesiones seleccionado.

Las sesiones de sondeo de ejecución del modelo del Gateway (claves que coinciden con `agent:*:explicit:model-run-<uuid>`) tienen una retención fija e independiente de `24h`. Esta depuración está condicionada por la presión: solo se ejecuta cuando se alcanza la presión del mantenimiento o del límite de entradas de sesión, y únicamente antes del paso global de limpieza o limitación de entradas inactivas. Las demás sesiones explícitas no utilizan esta retención.

Orden de aplicación de la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimine primero los artefactos de transcripción archivados más antiguos, los artefactos heredados huérfanos o los artefactos de trayectoria huérfanos.
2. Si el uso aún supera el objetivo, expulse las entradas de sesión más antiguas y sus filas de transcripción o artefactos de trayectoria.
3. Repita el proceso hasta que el uso sea igual o inferior a `highWaterBytes`.

`mode: "warn"` informa de las posibles expulsiones sin modificar el almacén ni los archivos.

Ejecute el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

El mantenimiento conserva punteros duraderos a conversaciones externas, como las sesiones de grupo y las sesiones de chat limitadas a un hilo, pero las entradas de ejecución sintéticas (Cron, hooks, Heartbeat, ACP, subagentes) pueden eliminarse cuando superen la antigüedad, la cantidad o el presupuesto de disco configurados. Las ejecuciones aisladas de Cron utilizan un control `cron.sessionRetention` independiente, separado de la retención de sondeos de ejecución del modelo.

Las escrituras normales del Gateway pasan por el descriptor de acceso a sesiones, que serializa las mutaciones de SQLite de cada agente mediante la ruta de escritura del entorno de ejecución. El código del entorno de ejecución debe priorizar las funciones auxiliares del descriptor de acceso en `src/config/sessions/session-accessor.ts`; las funciones auxiliares heredadas de `sessions.json` son herramientas de migración y mantenimiento sin conexión. Cuando hay un Gateway disponible, las operaciones de `openclaw sessions cleanup` y `openclaw agents delete` que no son de ejecución de prueba delegan las mutaciones del almacén en el Gateway para que la limpieza se incorpore a la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para un almacén heredado seleccionado y siempre permanece local (al igual que `--dry-run`). La limpieza de `maxEntries` se realiza por lotes para almacenes del tamaño habitual en producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza al alcanzar el nivel máximo lo reduzca mediante una reescritura. Las lecturas nunca depuran ni limitan las entradas durante el inicio del Gateway; solo lo hacen las escrituras o `openclaw sessions cleanup --enforce`, y este último también aplica el límite de inmediato y elimina los artefactos antiguos heredados y sin referencias de transcripciones, puntos de control y trayectorias, incluso si no se ha configurado ningún presupuesto de disco.

OpenClaw ya no crea copias de seguridad de rotación automáticas `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de las configuraciones antiguas.

Las modificaciones de las transcripciones usan la cola de escritura de sesiones para el destino de transcripciones de SQLite:

| Ajuste                               | Valor predeterminado | Sustitución mediante variable de entorno         |
| ------------------------------------ | -------------------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`              | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`            | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`             | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` es el tiempo que debe transcurrir mientras se espera un bloqueo antes de mostrar un error de sesión ocupada y desistir; auméntelo únicamente cuando tareas legítimas de preparación, limpieza, Compaction o réplica de transcripciones compitan durante más tiempo en máquinas lentas. `staleMs` determina cuándo se puede recuperar un bloqueo existente por considerarlo obsoleto. `maxHoldMs` es el umbral de liberación del mecanismo de supervisión dentro del proceso.

### Regresión tras el cambio a SQLite

Restaure los artefactos heredados de transcripciones archivados antes de ejecutar una versión anterior de OpenClaw
basada en archivos:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

La migración conserva los archivos heredados `sessions.json` para facilitar el soporte y
la reversión, pero los archivos JSONL activos de transcripciones que se importaron en SQLite se
renombran y se trasladan a `session-sqlite-import-archive/`. Los entornos de ejecución anteriores basados en archivos siguen
las rutas `sessionFile` de `sessions.json`, por lo que necesitan que esos artefactos se restauren
antes del inicio. La restauración utiliza los manifiestos de migración, mueve únicamente los artefactos archivados
registrados cuyas rutas originales no existen y conserva la base de datos SQLite
para permitir la recuperación posterior.

Las sesiones creadas después de la transición a SQLite son exclusivamente de SQLite y no aparecerán en un
entorno de ejecución anterior basado en archivos. Si se vuelve a actualizar después de una reversión de versión, ejecute de nuevo la secuencia de
inspección y validación de Doctor para que OpenClaw pueda verificar los artefactos heredados
restaurados antes de importarlos.

## Sesiones de Cron y registros de ejecución

Las ejecuciones aisladas de Cron crean sus propias entradas de sesión y transcripciones con una retención específica:

- `cron.sessionRetention` (valor predeterminado: `"24h"`) elimina del almacén las sesiones antiguas de ejecuciones aisladas de Cron; `false` desactiva esta función.
- `cron.runLog.keepLines` elimina las filas conservadas del historial de ejecuciones de SQLite por tarea de Cron (valor predeterminado: `2000`). `cron.runLog.maxBytes` solo se acepta por compatibilidad con registros de ejecución anteriores basados en archivos.

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, depura la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila: conserva las preferencias seguras (ajustes de pensamiento, rapidez, nivel de detalle y razonamiento, etiquetas y nombre para mostrar) y las anulaciones de modelo y autenticación seleccionadas explícitamente por el usuario, pero descarta el contexto de conversación del entorno (enrutamiento de canales y grupos, política de envío y colas, elevación, origen y vinculación con el entorno de ejecución de ACP) para que una ejecución aislada nueva no pueda heredar autorizaciones obsoletas de entrega o del entorno de ejecución de una ejecución anterior.

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica el contenedor de conversación en el que se encuentra (enrutamiento + aislamiento). Reglas canónicas: [/concepts/session](/es/concepts/session).

| Patrón                              | Ejemplo                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Chat principal/directo (por agente) | `agent:<agentId>:<mainKey>` (valor predeterminado: `main`)  |
| Grupo                               | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack)           | `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`  |
| Cron                                | `cron:<job.id>`                                             |
| Webhook                             | `hook:<uuid>` (salvo que se anule)                          |

## Identificadores de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (la identidad de la transcripción de SQLite que continúa la conversación). La lógica de decisión se encuentra en `initSessionState()` en `src/auto-reply/reply/session.ts`.

- **Restablecer** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (de forma predeterminada, a las 4:00 a. m., hora local del host del Gateway) crea un nuevo `sessionId` con el primer mensaje posterior al límite de restablecimiento.
- **Expiración por inactividad** (`session.reset.idleMinutes`, o la opción heredada `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después del intervalo de inactividad. Si se configuran tanto el restablecimiento diario como la expiración por inactividad, prevalece el que venza primero.
- **Reanudación tras la reconexión de la interfaz de control** conserva la sesión visible actualmente durante un envío posterior a una reconexión cuando el Gateway recibe el `sessionId` correspondiente de un cliente de interfaz de operador. Esta señal solo se aplica una vez; los envíos obsoletos normales siguen creando un nuevo `sessionId`.
- **Eventos del sistema** (Heartbeat, activaciones de Cron, notificaciones de ejecución, mantenimiento de registros del Gateway) pueden modificar la fila de la sesión, pero nunca prolongan la vigencia del restablecimiento diario o por inactividad. Antes de crear el contexto nuevo, el cambio de sesión por restablecimiento descarta los avisos de eventos del sistema en cola correspondientes a la sesión anterior.
- **Política de bifurcación desde la sesión principal** usa la rama activa de OpenClaw al crear una bifurcación para un hilo o subagente. Si esa rama es demasiado grande (supera un límite interno fijo, actualmente 100K tokens), OpenClaw inicia la sesión secundaria con contexto aislado en lugar de fallar o heredar un historial inutilizable. El cálculo del tamaño es automático y no se puede configurar; `openclaw doctor --fix` elimina la configuración heredada `session.parentForkMaxTokens`.
- **Bifurcaciones del operador**: `sessions.create { parentSessionKey, fork: true }` crea una sesión nueva cuya transcripción se bifurca desde el estado actual de la sesión principal (con el mismo mecanismo de bifurcación que la creación de subagentes, incluido el límite de tamaño anterior). La bifurcación se rechaza mientras la sesión principal tenga una ejecución activa, hereda la selección de modelo de la sesión principal salvo que se proporcione otra explícitamente y marca la sesión secundaria como `forkedFromParent`, con contadores de tokens nuevos.

## Esquema del almacén de sesiones

El almacén de ejecución conserva valores `SessionEntry` en una base de datos SQLite por agente. El tipo de valor es `SessionEntry` en `src/config/sessions.ts`. Campos principales (lista no exhaustiva):

- `sessionId`: identificador de la transcripción actual usado para direccionar las filas de transcripción de SQLite
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la vigencia del restablecimiento diario usa este valor. Las filas heredadas pueden derivarlo del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real del usuario o canal; la vigencia del restablecimiento por inactividad usa este valor para que los eventos de Heartbeat, Cron y ejecución no mantengan activas las sesiones. Las filas heredadas que no tengan este campo recurren a la hora de inicio recuperada de la sesión.
- `updatedAt`: marca de tiempo de la última modificación de la fila del almacén, usada para listados, depuración y mantenimiento de registros; no determina la vigencia del restablecimiento diario o por inactividad.
- `archivedAt`: marca de tiempo de archivado opcional. Las sesiones archivadas permanecen en el almacén con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijación opcional. Las sesiones activas fijadas se ordenan antes que las no fijadas; archivar una sesión elimina su fijación.
- Interoperabilidad con hilos de Codex: ambos campos siguen la estructura de administración de hilos de Codex; los valores booleanos `archived`/`pinned` transmitidos siempre se derivan de la marca de tiempo y se asignan en el servidor, de acuerdo con la semántica de `threads.archived_at` de Codex y la serialización camelCase. Las marcas de tiempo de OpenClaw se expresan en milisegundos desde la época, mientras que Codex usa segundos desde la época, por lo que los puentes realizan la conversión en la interfaz del Plugin `codex`. Codex aún no dispone de una API de fijación (solo `thread/archive`/`thread/unarchive`); el estado de fijación permanece en OpenClaw hasta que exista una, momento en el que la estructura coincidente permitirá que las sesiones vinculadas transfieran mecánicamente el estado de fijación en ambos sentidos.
- La supervisión de Codex solo muestra los hilos nativos no archivados. Un hilo local del Gateway con estado `idle` o `notLoaded` y actividad desconocida solo puede archivarse mediante `thread/archive` nativo después de que el operador confirme explícitamente que ningún otro proceso de Codex es su propietario; primero, el Plugin realiza una nueva lectura del estado local del proceso y, después, el hilo desaparece del catálogo. Esa lectura no puede demostrar que otro proceso de App Server no esté usando el hilo. OpenClaw se niega a archivar filas activas o con errores, y el archivado en nodos emparejados no está disponible hasta que el puente del Node pueda controlar todo el ciclo de vida transmitido del hilo. Desarchivarlo en un cliente nativo de Codex permite que el hilo vuelva a aparecer.
- `lastReadAt` / `markedUnreadAt`: marcas de tiempo del estado de lectura asignadas en el servidor mediante `sessions.patch { unread }`; `unread: false` registra una lectura (establece `lastReadAt` y borra `markedUnreadAt`); `unread: true` marca la sesión como no leída hasta la siguiente lectura. Las filas de sesión exponen un valor booleano derivado `unread`: se ha marcado explícitamente como no leída o se leyó antes de la actividad más reciente. Las sesiones que nunca se hayan marcado como leídas mantienen `unread: false`, por lo que las instalaciones existentes no muestran indicadores nuevos al actualizarse.
- `lastActivityAt`: marca de tiempo de la última ejecución completada del agente que cuenta como actividad que genera estado no leído (ejecuciones de usuario, canal y Cron). Las interacciones de Heartbeat y eventos internos, así como las modificaciones de metadatos, no la actualizan; `updatedAt` no es una señal de actividad.
- `sessionFile`: marcador heredado conservado por compatibilidad con la migración y el archivado; la ejecución activa usa la identidad de SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos de etiquetado de grupos y canales
- Controles: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (sobrescritura por sesión)
- Selección de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (según disponibilidad y dependientes del proveedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: número de veces que se completó la compactación automática para esta clave de sesión
- `memoryFlushAt` / `memoryFlushCompactionCount`: marca de tiempo y número de compactaciones del último volcado de memoria previo a la compactación

El Gateway es la autoridad: puede reescribir o rehidratar las entradas a medida que las sesiones
se ejecutan. Para instalaciones heredadas basadas en archivos, realice la migración con
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` en lugar de
editar `sessions.json` y esperar que la ejecución siga leyendo ese archivo.

## Estructura de los eventos de transcripción

El descriptor de acceso a sesiones de OpenClaw administra las transcripciones y las expone al código de ejecución mediante asistentes basados en identidad. El flujo de eventos solo permite anexar contenido:

- Primera entrada: encabezado de sesión: `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opcional.
- Después: entradas con `id` + `parentId` (estructura de árbol).

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensaje insertado por una extensión que _sí_ entra en el contexto del modelo (se muestra en la TUI cuando `display: true` y se oculta por completo cuando `display: false`)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo (para conservar el estado de la extensión entre recargas)
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw no «corrige» deliberadamente las transcripciones; el Gateway utiliza `SessionManager` para leerlas y escribirlas.

## Ventanas de contexto frente a tokens registrados

Dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo). Proviene del catálogo de modelos y puede sobrescribirse mediante la configuración.
2. **Contadores del almacén de sesiones**: estadísticas acumulativas escritas en la fila de la sesión (se utilizan para `/status` y los paneles). `contextTokens` es un valor estimado o informado en tiempo de ejecución; no debe considerarse una garantía estricta.

Más información sobre los límites: [/reference/token-use](/es/reference/token-use).

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistente de la transcripción y mantiene intactos los mensajes recientes. Después de Compaction, los turnos futuros ven el resumen de Compaction junto con los mensajes posteriores a `firstKeptEntryId`. Compaction es **persistente**, a diferencia de la poda de sesiones; consulte [/concepts/session-pruning](/es/concepts/session-pruning).

La reinyección de la sección AGENTS.md después de Compaction se habilita explícitamente mediante `agents.defaults.compaction.postCompactionSections`; cuando no se establece o es `[]`, OpenClaw no añade extractos de AGENTS.md sobre el resumen de Compaction.

### Límites de fragmentos y emparejamiento de herramientas

Al dividir una transcripción larga en fragmentos de Compaction, OpenClaw mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes:

- Si la división por proporción de tokens quedara entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultados de herramientas hiciera que el fragmento superara el objetivo, OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la parte final sin resumir.
- Los bloques de llamadas a herramientas canceladas o con errores no mantienen abierta una división pendiente.

## Cuándo se produce la compactación automática

Dos desencadenantes en el agente integrado de OpenClaw:

1. **Recuperación ante desbordamiento**: el modelo devuelve un error de desbordamiento de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` y otras variantes con el formato del proveedor): se realiza Compaction y luego se reintenta. Cuando el proveedor informa del recuento de tokens del intento, OpenClaw transmite ese recuento observado a la Compaction de recuperación ante desbordamiento; si el proveedor confirma el desbordamiento, pero no proporciona un recuento analizable, OpenClaw pasa a los motores de Compaction y a los diagnósticos un recuento sintético que supera mínimamente el presupuesto. Si la recuperación ante desbordamiento sigue fallando, OpenClaw muestra instrucciones explícitas y conserva la asignación de sesión actual en lugar de cambiar silenciosamente a un id. de sesión nuevo: vuelva a intentar el mensaje, ejecute `/compact` o ejecute `/new`.
2. **Mantenimiento por umbral**: después de un turno completado correctamente, cuando `contextTokens > contextWindow - reserveTokens`, donde `contextWindow` es la ventana de contexto del modelo y `reserveTokens` es el margen reservado para las instrucciones y la siguiente salida del modelo.

Fuera de estos dos desencadenantes se ejecutan dos protecciones adicionales:

- **Compaction local previa**: establezca `agents.defaults.compaction.maxActiveTranscriptBytes` (en bytes o como una cadena como `"20mb"`) para activar la Compaction local antes de abrir la siguiente ejecución cuando la transcripción activa alcance ese tamaño. Esta es una protección de tamaño para reducir el coste de reapertura local, no para el archivado sin procesar: la Compaction semántica normal continúa ejecutándose y requiere `truncateAfterCompaction` para que el resumen compactado se convierta en una nueva transcripción sucesora.
- **Comprobación previa durante el turno**: establezca `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valor predeterminado: `false`) para añadir una protección al bucle de herramientas. Después de añadir un resultado de herramienta y antes de la siguiente llamada al modelo, OpenClaw estima la presión sobre las instrucciones mediante la misma lógica de presupuesto previo utilizada al inicio del turno. Si el contexto ya no cabe, la protección no realiza Compaction en línea: genera una señal estructurada de comprobación previa durante el turno, detiene el envío de las instrucciones actuales y permite que el bucle de ejecución externo use la ruta de recuperación existente (truncar los resultados de herramientas demasiado grandes cuando sea suficiente, o activar el modo de Compaction configurado y volver a intentarlo). Funciona con los modos de Compaction `default` y `safeguard`, incluida la Compaction de protección respaldada por el proveedor. Es independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta antes de abrir un turno; la comprobación previa durante el turno se ejecuta más tarde, después de añadir nuevos resultados de herramientas.

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

OpenClaw también aplica un límite mínimo de seguridad para las ejecuciones integradas: si `compaction.reserveTokens` es inferior a `reserveTokensFloor` (valor predeterminado: `20000`), OpenClaw lo eleva. Establezca `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el límite mínimo. Cuando se conoce la ventana de contexto del modelo activo, tanto el límite mínimo como la reserva efectiva final se limitan para que la reserva no pueda consumir todo el presupuesto del prompt. Esto evita que los modelos con poco contexto (por ejemplo, un modelo local de 16K tokens) entren en Compaction desde el primer token; si no se conoce la ventana de contexto, los presupuestos de reserva configurado y actual permanecen sin límite. Motivo del límite mínimo: dejar margen suficiente para el «mantenimiento» de varios turnos (como el volcado de memoria descrito más adelante) antes de que la Compaction sea inevitable. Implementación: `applyAgentCompactionSettingsFromConfig()` en `src/agents/agent-settings.ts`, llamada desde las rutas de configuración de turnos y Compaction del ejecutor integrado.

La ejecución manual de `/compact` respeta un valor explícito de `agents.defaults.compaction.keepRecentTokens` y conserva el punto de corte de la cola reciente del entorno de ejecución. Sin un presupuesto de conservación explícito, la Compaction manual constituye un punto de control estricto y el contexto reconstruido comienza a partir del nuevo resumen.

Cuando `truncateAfterCompaction` está activado, OpenClaw rota la transcripción activa a una sucesora compactada después de la Compaction. Las acciones de bifurcación y restauración de puntos de control utilizan esa sucesora compactada; los archivos heredados de puntos de control anteriores a la Compaction siguen siendo legibles mientras estén referenciados.

## Proveedores de Compaction conectables

Los Plugins registran un proveedor de Compaction mediante `registerCompactionProvider()` en la API del Plugin. Cuando `agents.defaults.compaction.provider` se establece en el id de un proveedor registrado, la extensión de protección delega el resumen en ese proveedor en lugar de usar el proceso integrado `summarizeInStages`.

- `provider`: id de un Plugin de proveedor de Compaction registrado. Déjelo sin establecer para usar el resumen predeterminado mediante LLM. Establecer un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de conservación de identificadores que la ruta integrada, y la protección sigue conservando el contexto de sufijo de los turnos recientes y los turnos divididos después de la salida del proveedor.
- El resumen de protección integrado vuelve a destilar los resúmenes anteriores junto con los mensajes nuevos, en lugar de conservar literalmente el resumen anterior completo.
- El modo de protección activa de forma predeterminada las auditorías de calidad del resumen; establezca `qualityGuard.enabled: false` para omitir el comportamiento de reintento cuando la salida tenga un formato incorrecto.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen integrado mediante LLM. Las señales de interrupción o tiempo de espera que el llamador haya activado explícitamente se vuelven a emitir, en lugar de ignorarse, para respetar siempre la cancelación.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superficies visibles para el usuario

- `/status` en cualquier sesión de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Registros del Gateway (`pnpm gateway:watch` u `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` más el número de operaciones de Compaction

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos «silenciosos» para tareas en segundo plano en las que el usuario no debe ver resultados intermedios.

- El asistente comienza su salida con el token silencioso exacto `NO_REPLY` / `no_reply` para indicar «no enviar una respuesta al usuario». OpenClaw lo elimina o suprime en la capa de entrega.
- La supresión del token silencioso exacto no distingue entre mayúsculas y minúsculas: tanto `NO_REPLY` como `no_reply` cuentan cuando toda la carga útil consta únicamente del token silencioso.
- Desde `2026.1.10`, OpenClaw también suprime la transmisión de borradores e indicadores de escritura cuando un fragmento parcial comienza por `NO_REPLY`, de modo que las operaciones silenciosas no filtren una salida parcial durante el turno.
- Esto solo se utiliza para turnos reales en segundo plano o sin entrega; no es un atajo para solicitudes de usuario ordinarias que requieran una acción.

## Volcado de memoria previo a la Compaction

Antes de que se produzca la Compaction automática, OpenClaw puede ejecutar un turno agéntico silencioso que escriba estado persistente en el disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda borrar contexto crítico. Supervisa el uso del contexto de la sesión y, cuando este supera un umbral flexible situado por debajo del umbral de Compaction, envía una directiva silenciosa de «escribir la memoria ahora» mediante el token silencioso exacto `NO_REPLY` / `no_reply`, para que el usuario no vea nada.

Configuración (`agents.defaults.compaction.memoryFlush`), referencia completa en [/gateway/config-agents](/es/gateway/config-agents#agentsdefaultscompaction):

| Clave                       | Valor predeterminado | Notas                                                                                                                                                                          |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                   | `true`               |                                                                                                                                                                                |
| `model`                     | sin establecer       | sustitución exacta del proveedor/modelo solo para el turno de volcado, por ejemplo, `ollama/qwen3:8b`                                                                          |
| `softThresholdTokens`       | `4000`               | margen por debajo del umbral de Compaction que activa un volcado                                                                                                               |
| `forceFlushTranscriptBytes` | sin establecer (desactivado) | fuerza un volcado cuando el archivo de transcripción alcanza este tamaño en bytes (o una cadena como `"2mb"`), aunque los contadores de tokens estén obsoletos; `0` lo desactiva |
| `prompt`                    | integrado            | mensaje del usuario para el turno de volcado                                                                                                                                   |
| `systemPrompt`              | integrado            | prompt adicional del sistema que se añade al turno de volcado                                                                                                                  |

Notas:

- El prompt y el prompt del sistema predeterminados incluyen una indicación `NO_REPLY` para suprimir la entrega.
- Cuando se establece `model`, el turno de volcado utiliza ese modelo sin heredar la cadena de reserva de la sesión activa, para que el mantenimiento exclusivamente local no recurra silenciosamente a un modelo de conversación de pago en caso de error.
- El volcado se ejecuta una vez por ciclo de Compaction (se registra en la fila de la sesión).
- El volcado solo se ejecuta en sesiones integradas de OpenClaw; los backends de CLI y los turnos de Heartbeat lo omiten.
- El volcado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulte [Memoria](/es/concepts/memory) para conocer la disposición de los archivos del espacio de trabajo y los patrones de escritura.

OpenClaw expone un hook `session_before_compact` en la API de extensiones, pero la lógica de volcado anterior reside en el lado del Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), no en ese hook.

## Lista de comprobación para solucionar problemas

- **¿Clave de sesión incorrecta?** Comience por [/concepts/session](/es/concepts/session) y confirme el valor de `sessionKey` en `/status`.
- **¿Discrepancia entre el almacén y la transcripción?** Confirme el host del Gateway y la ruta del almacén mediante `openclaw status`.
- **¿Compaction excesivamente frecuente?** Compruebe la ventana de contexto del modelo (si es demasiado pequeña, fuerza operaciones de Compaction frecuentes), `reserveTokens` (si es demasiado alto para la ventana del modelo, provoca una Compaction más temprana) y el exceso de resultados de herramientas (ajuste la depuración de la sesión).
- **¿Parece que cada prompt desborda un modelo local pequeño?** Confirme que el proveedor comunique la ventana de contexto correcta del modelo. OpenClaw solo puede limitar la reserva efectiva cuando se conoce esa ventana.
- **¿Se filtran los turnos silenciosos?** Confirme que la respuesta comience con el token silencioso exacto `NO_REPLY` (sin distinguir entre mayúsculas y minúsculas) y que utilice una compilación que incluya la corrección de supresión de la transmisión (`2026.1.10` o posterior).

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Depuración de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
- [Referencia de configuración del agente](/es/gateway/config-agents)
