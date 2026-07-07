---
read_when:
    - Necesitas depurar IDs de sesión, JSONL de transcripciones o campos de sessions.json
    - Está cambiando el comportamiento de auto-compactación o agregando tareas de mantenimiento de "pre-compaction"
    - Quiere implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis profundo: almacén de sesiones + transcripciones, ciclo de vida e internals de (auto)Compaction'
title: Análisis profundo de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-06T21:51:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84b374402af261ed6d479dac85d44656cb83e52bba04d66153f3d66a608232ec
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un único **proceso Gateway** posee el estado de sesión de extremo a extremo. Las interfaces de usuario (aplicación de macOS, Control UI web, TUI) consultan al Gateway para obtener listas de sesiones y recuentos de tokens. En modo remoto, los archivos de sesión residen en el host remoto, por lo que comprobar los archivos de tu Mac local no reflejará lo que está usando el Gateway.

Primero los documentos generales: [Gestión de sesiones](/es/concepts/session), [Compaction](/es/concepts/compaction), [Resumen de memoria](/es/concepts/memory), [Búsqueda de memoria](/es/concepts/memory-search), [Depuración de sesiones](/es/concepts/session-pruning), [Higiene de transcripciones](/es/reference/transcript-hygiene), referencia completa de configuración en [Configuración de agentes](/es/gateway/config-agents).

## Dos capas de persistencia

1. **Almacén de sesiones (`sessions.json`)** - mapa clave/valor `sessionKey -> SessionEntry`. Pequeño, mutable, seguro para editar o eliminar entradas. Rastrea metadatos: id de sesión actual, última actividad, conmutadores, contadores de tokens.
2. **Transcripción (`<sessionId>.jsonl`)** - solo anexado, estructurada en árbol (las entradas tienen `id` + `parentId`). Almacena la conversación, las llamadas a herramientas y los resúmenes de compaction; reconstruye el contexto del modelo para turnos futuros. Los puntos de control de compaction son metadatos sobre la transcripción sucesora compactada: una nueva compaction no escribe una segunda copia `.checkpoint.*.jsonl`.

Los lectores de historial del Gateway evitan materializar toda la transcripción salvo que la superficie necesite acceso histórico arbitrario. El historial de primera página, el historial de chat incrustado, la recuperación tras reinicio y las comprobaciones de tokens/uso usan lecturas acotadas de cola. Los escaneos completos de transcripción pasan por el índice asíncrono de transcripciones, cacheado por ruta de archivo más `mtimeMs`/`size` y compartido entre lectores concurrentes.

## Ubicaciones en disco

Por agente, en el host del Gateway (resuelto mediante `src/config/sessions.ts`):

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

## Mantenimiento del almacén y controles de disco

`session.maintenance` controla el mantenimiento automático de `sessions.json`, artefactos de transcripción y sidecars de trayectoria:

| Clave                   | Predeterminado        | Notas                                                                                              |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | o `"warn"` (solo informa, sin mutación)                                                            |
| `pruneAfter`            | `"30d"`               | umbral de antigüedad de entradas obsoletas                                                         |
| `maxEntries`            | `500`                 | límite de entradas en `sessions.json`                                                             |
| `resetArchiveRetention` | igual que `pruneAfter` | retención para archivos de transcripción `*.reset.<timestamp>`; `false` desactiva la limpieza     |
| `maxDiskBytes`          | sin establecer        | presupuesto opcional del directorio de sesiones                                                    |
| `highWaterBytes`        | 80 % de `maxDiskBytes` | objetivo después de la limpieza por presupuesto                                                    |

Las sesiones de sondeo de ejecución de modelo del Gateway (claves que coinciden con `agent:*:explicit:model-run-<uuid>`) tienen una retención fija separada de `24h`. Esta depuración está condicionada por presión: solo se ejecuta cuando se alcanza la presión de mantenimiento/límite de entradas de sesión, y solo antes del paso global de limpieza/límite de entradas obsoletas. Otras sesiones explícitas no usan esta retención.

Orden de aplicación para la limpieza por presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos archivados más antiguos, de transcripción huérfana o de trayectoria huérfana.
2. Si aún se supera el objetivo, expulsar las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Repetir hasta que el uso esté en `highWaterBytes` o por debajo.

`mode: "warn"` informa posibles expulsiones sin mutar el almacén ni los archivos.

Ejecutar mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

El mantenimiento conserva punteros duraderos de conversaciones externas, como sesiones de grupo y sesiones de chat con ámbito de hilo, pero las entradas sintéticas de runtime (cron, hooks, heartbeat, ACP, subagentes) aún pueden eliminarse cuando superan la antigüedad, el recuento o el presupuesto de disco configurados. Las ejecuciones cron aisladas usan un control `cron.sessionRetention` separado, independiente de la retención de sondeos de ejecución de modelo.

Las escrituras normales del Gateway fluyen por un escritor de sesiones por almacén que serializa las mutaciones en proceso sin tomar un bloqueo de archivo en runtime. Los helpers de parcheo de ruta caliente toman prestada la caché mutable validada mientras mantienen ese turno de escritor, por lo que los archivos `sessions.json` grandes no se clonan ni releen para cada actualización de metadatos. Prefiere `updateSessionStore(...)` / `updateSessionStoreEntry(...)` en código de runtime; los guardados directos de todo el almacén son para compatibilidad y herramientas de mantenimiento sin conexión. Cuando un Gateway es accesible, `openclaw sessions cleanup` sin `--dry-run` y `openclaw agents delete` delegan las mutaciones del almacén al Gateway para que la limpieza entre en la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para mantenimiento directo de archivos y siempre permanece local (igual que `--dry-run`). La limpieza de `maxEntries` se procesa por lotes para almacenes de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de marca alta lo reduzca. Las lecturas nunca depuran ni limitan entradas durante el inicio del Gateway: solo lo hacen las escrituras o `openclaw sessions cleanup --enforce`, y este último también aplica el límite inmediatamente y depura artefactos antiguos no referenciados de transcripción, punto de control y trayectoria incluso sin un presupuesto de disco configurado.

OpenClaw ya no crea copias de seguridad automáticas de rotación `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Las mutaciones de transcripción usan un bloqueo de escritura de sesión en el archivo de transcripción:

| Ajuste                               | Predeterminado | Anulación por env                                |
| ------------------------------------ | -------------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`        | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`      | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`       | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` es cuánto tiempo una espera de bloqueo expone un error de sesión ocupada antes de abandonar; auméntalo solo cuando preparación, limpieza, compaction o trabajo de espejo de transcripción legítimos compitan durante más tiempo en máquinas lentas. `staleMs` es cuándo un bloqueo existente puede reclamarse como obsoleto. `maxHoldMs` es el umbral de liberación del watchdog en proceso.

## Sesiones Cron y registros de ejecución

Las ejecuciones cron aisladas crean sus propias entradas/transcripciones de sesión con retención dedicada:

- `cron.sessionRetention` (predeterminado `"24h"`) depura las sesiones antiguas de ejecuciones cron aisladas del almacén; `false` lo desactiva.
- `cron.runLog.keepLines` depura las filas de historial de ejecución SQLite retenidas por trabajo cron (predeterminado `2000`). `cron.runLog.maxBytes` se acepta solo por compatibilidad con registros de ejecución antiguos respaldados por archivos.

Cuando cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila: conserva preferencias seguras (ajustes de thinking/fast/verbose/reasoning, etiquetas, nombre de visualización) y anulaciones explícitas de modelo/auth seleccionadas por el usuario, pero descarta el contexto ambiental de conversación (enrutamiento de canal/grupo, política de envío/cola, elevación, origen, vinculación de runtime ACP) para que una ejecución aislada nueva no pueda heredar entrega obsoleta ni autoridad de runtime de una ejecución anterior.

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica en qué contenedor de conversación estás (enrutamiento + aislamiento). Reglas canónicas: [/concepts/session](/es/concepts/session).

| Patrón                         | Ejemplo                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| Chat principal/directo (por agente) | `agent:<agentId>:<mainKey>` (predeterminado `main`)    |
| Grupo                          | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack)     | `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>` |
| Cron                           | `cron:<job.id>`                                             |
| Webhook                        | `hook:<uuid>` (salvo que se anule)                          |

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación). La lógica de decisión vive en `initSessionState()` en `src/auto-reply/reply/session.ts`.

- **Restablecimiento** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Expiración por inactividad** (`session.reset.idleMinutes`, o heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Si tanto diario como inactividad están configurados, gana el que expire primero.
- **Reanudación por reconexión de Control UI** preserva la sesión actualmente visible para un envío de reconexión cuando el Gateway recibe el `sessionId` coincidente de un cliente de interfaz de operador. Esta es una señal de un solo uso; los envíos obsoletos ordinarios aún crean un nuevo `sessionId`.
- **Eventos del sistema** (heartbeat, despertares cron, notificaciones exec, contabilidad del gateway) pueden mutar la fila de sesión, pero nunca extienden la frescura del restablecimiento diario/por inactividad. El rollover de restablecimiento descarta los avisos de eventos del sistema en cola para la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación del padre** usa la rama activa de OpenClaw al crear un hilo o una bifurcación de subagente. Si esa rama es demasiado grande (por encima de un límite interno fijo, actualmente 100K tokens), OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar un historial inutilizable. El cálculo de tamaño es automático y no configurable; la configuración heredada `session.parentForkMaxTokens` se elimina mediante `openclaw doctor --fix`.
- **Bifurcaciones de operador**: `sessions.create { parentSessionKey, fork: true }` crea una nueva sesión cuya transcripción se ramifica desde el estado actual del padre (la misma maquinaria de bifurcación que los lanzamientos de subagentes, incluido el límite de tamaño anterior). La bifurcación se rechaza mientras el padre tiene una ejecución activa, hereda la selección de modelo del padre salvo que se pase una explícitamente, y marca el hijo como `forkedFromParent` con contadores de tokens nuevos.

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor es `SessionEntry` en `src/config/sessions.ts`. Campos clave (no exhaustivo):

- `sessionId`: id de la transcripción actual (el nombre de archivo deriva de esto salvo que `sessionFile` esté configurado)
- `sessionStartedAt`: marca de tiempo de inicio para el `sessionId` actual; la frescura del restablecimiento diario usa esto. Las filas heredadas pueden derivarlo del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura del restablecimiento por inactividad usa esto para que los eventos de Heartbeat, Cron y exec no mantengan vivas las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada.
- `updatedAt`: marca de tiempo de la última mutación de fila del almacén, usada para listar/podar/contabilidad; no es la autoridad de frescura diaria/por inactividad.
- `archivedAt`: marca de tiempo de archivado opcional. Las sesiones archivadas permanecen en el almacén con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijado opcional. Las sesiones activas fijadas se ordenan antes que las sesiones sin fijar; archivar una sesión borra su fijado.
- Interoperabilidad de hilos de Codex: ambos campos siguen la forma de administración de hilos de Codex; los booleanos `archived`/`pinned` en el cable siempre se derivan de la marca de tiempo y se sellan del lado del servidor, coincidiendo con la semántica `threads.archived_at` de Codex y la serialización camelCase. Las marcas de tiempo de OpenClaw están en milisegundos desde epoch mientras que Codex usa segundos desde epoch, así que los puentes convierten en el límite del plugin de codex. Codex aún no tiene API de fijado (`thread/archive`/`thread/unarchive` solamente); el estado fijado permanece del lado de OpenClaw hasta que exista una, momento en el que la forma coincidente permite que las sesiones vinculadas hagan ida y vuelta del estado fijado de forma mecánica.
- `lastReadAt` / `markedUnreadAt`: marcas de tiempo de estado de lectura selladas del lado del servidor por `sessions.patch { unread }`; `unread: false` registra una lectura (establece `lastReadAt`, borra `markedUnreadAt`); `unread: true` marca la sesión como no leída hasta la siguiente lectura. Las filas de sesión exponen un booleano `unread` derivado: marcada explícitamente como no leída, o leída antes de la actividad más reciente. Las sesiones nunca marcadas como leídas permanecen con `unread: false`, así que las instalaciones existentes no se iluminan al actualizar.
- `lastActivityAt`: marca de tiempo de la última ejecución de agente completada que cuenta como actividad digna de no leído (ejecuciones de usuario, canal y Cron). Los turnos de Heartbeat y eventos internos, además de los parches de metadatos, no la actualizan; `updatedAt` no es una señal de actividad.
- `sessionFile`: anulación explícita opcional de ruta de transcripción
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos de etiquetado de grupo/canal
- Alternadores: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (anulación por sesión)
- Selección de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo/dependiente del proveedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la autocompactación para esta clave de sesión
- `memoryFlushAt` / `memoryFlushCompactionCount`: marca de tiempo y conteo de compactaciones del último volcado de memoria previo a la compactación

El almacén se puede editar de forma segura, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las sesiones.

## Estructura de transcripción (`*.jsonl`)

Las transcripciones las administra `SessionManager` (`openclaw/plugin-sdk/agent-sessions`). El archivo es JSONL:

- Primera línea: encabezado de sesión: `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opcional.
- Luego: entradas con `id` + `parentId` (estructura de árbol).

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensaje inyectado por extensión que _sí_ entra en el contexto del modelo (se renderiza en la TUI cuando `display: true`, se oculta por completo cuando `display: false`)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo (para persistir estado de extensión entre recargas)
- `compaction`: resumen de compactación persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente no "corrige" transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

## Ventanas de contexto frente a tokens rastreados

Dos conceptos distintos:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo). Proviene del catálogo de modelos y puede anularse mediante configuración.
2. **Contadores del almacén de sesiones**: estadísticas continuas escritas en `sessions.json` (usadas para `/status` y paneles). `contextTokens` es un valor de estimación/reporte en tiempo de ejecución; no lo trates como una garantía estricta.

Más sobre límites: [/reference/token-use](/es/reference/token-use).

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes. Después de la compactación, los turnos futuros ven el resumen de compactación más los mensajes posteriores a `firstKeptEntryId`. Compaction es **persistente**, a diferencia de la poda de sesiones; consulta [/concepts/session-pruning](/es/concepts/session-pruning).

La reinyección de secciones de AGENTS.md después de Compaction es opcional mediante `agents.defaults.compaction.postCompactionSections`; cuando no está configurado o es `[]`, OpenClaw no añade extractos de AGENTS.md encima del resumen de Compaction.

### Límites de fragmentos y emparejamiento de herramientas

Al dividir una transcripción larga en fragmentos de compactación, OpenClaw mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes:

- Si la división por proporción de tokens caería entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultado de herramienta empujaría el fragmento por encima del objetivo, OpenClaw conserva ese bloque de herramienta pendiente y mantiene intacta la cola sin resumir.
- Los bloques de llamadas a herramientas abortadas/con error no mantienen abierta una división pendiente.

## Cuándo ocurre la autocompactación

Dos disparadores en el agente OpenClaw integrado:

1. **Recuperación de desbordamiento**: el modelo devuelve un error de desbordamiento de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` y otras variantes con forma de proveedor): compactar y luego reintentar. Cuando el proveedor reporta el conteo de tokens intentado, OpenClaw reenvía ese conteo observado a la compactación de recuperación de desbordamiento; si el proveedor confirma el desbordamiento pero no expone un conteo analizable, OpenClaw pasa un conteo sintético mínimamente por encima del presupuesto a los motores de compactación y diagnósticos. Si la recuperación de desbordamiento aún falla, OpenClaw muestra orientación explícita y conserva el mapeo de sesión actual en lugar de rotar silenciosamente a un id de sesión nuevo: reintenta el mensaje, ejecuta `/compact` o ejecuta `/new`.
2. **Mantenimiento por umbral**: después de un turno exitoso, cuando `contextTokens > contextWindow - reserveTokens`, donde `contextWindow` es la ventana de contexto del modelo y `reserveTokens` es el margen reservado para prompts más la siguiente salida del modelo.

Dos guardas adicionales se ejecutan fuera de estos dos disparadores:

- **Compactación local de preflight**: configura `agents.defaults.compaction.maxActiveTranscriptBytes` (bytes o una cadena como `"20mb"`) para disparar compactación local antes de abrir la siguiente ejecución una vez que el archivo de transcripción activo alcance ese tamaño. Esta es una guarda de tamaño de archivo para el costo de reapertura local, no archivado sin procesar: la compactación semántica normal aún se ejecuta, y requiere `truncateAfterCompaction` para que el resumen compactado se convierta en una nueva transcripción sucesora.
- **Precomprobación a mitad de turno**: configura `agents.defaults.compaction.midTurnPrecheck.enabled: true` (predeterminado `false`) para añadir una guarda de bucle de herramientas. Después de anexar un resultado de herramienta y antes de la siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de presupuesto de preflight que se usa al inicio del turno. Si el contexto ya no cabe, la guarda no compacta en línea: emite una señal estructurada de precomprobación a mitad de turno, detiene el envío del prompt actual y deja que el bucle externo de ejecución use la ruta de recuperación existente (truncar resultados de herramienta sobredimensionados cuando eso basta, o disparar el modo de compactación configurado y reintentar). Funciona con los modos de compactación `default` y `safeguard`, incluida la compactación safeguard respaldada por proveedor. Es independiente de `maxActiveTranscriptBytes`: la guarda de tamaño en bytes se ejecuta antes de que se abra un turno; la precomprobación a mitad de turno se ejecuta después, tras anexar nuevos resultados de herramienta.

## Configuración de compactación

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

OpenClaw también aplica un piso de seguridad para ejecuciones integradas: si `compaction.reserveTokens` está por debajo de `reserveTokensFloor` (predeterminado `20000`), OpenClaw lo eleva. Configura `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el piso. Cuando se conoce la ventana de contexto del modelo activo, tanto el piso como la reserva efectiva final se limitan para que la reserva no pueda consumir todo el presupuesto del prompt. Esto evita que los modelos de contexto pequeño (por ejemplo, un modelo local de 16K tokens) entren en compactación desde el primer token; sin una ventana de contexto conocida, los presupuestos de reserva configurados y actuales permanecen sin límite. Por qué existe un piso: dejar suficiente margen para tareas de "mantenimiento" de varios turnos (como el volcado de memoria, abajo) antes de que la compactación sea inevitable. Implementación: `applyAgentCompactionSettingsFromConfig()` en `src/agents/agent-settings.ts`, llamado desde las rutas de turno del ejecutor integrado y configuración de compactación.

`/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito y mantiene el punto de corte de cola reciente del runtime. Sin un presupuesto explícito de conservación, la compactación manual es un punto de control estricto y el contexto reconstruido comienza desde el nuevo resumen.

Cuando `truncateAfterCompaction` está habilitado, OpenClaw rota la transcripción activa a un sucesor JSONL compactado después de la compactación. Las acciones de punto de control de rama/restauración usan ese sucesor compactado; los archivos de punto de control heredados previos a la compactación siguen siendo legibles mientras estén referenciados.

## Proveedores de compactación conectables

Los plugins registran un proveedor de compactación mediante `registerCompactionProvider()` en la API del plugin. Cuando `agents.defaults.compaction.provider` se configura con un id de proveedor registrado, la extensión safeguard delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un plugin de proveedor de compactación registrado. Déjalo sin configurar para el resumen LLM predeterminado. Configurar un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de compactación y política de preservación de identificadores que la ruta integrada, y safeguard aún conserva el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado redestila resúmenes previos con mensajes nuevos en lugar de preservar textualmente el resumen anterior completo.
- El modo safeguard habilita auditorías de calidad del resumen de forma predeterminada; configura `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida mal formada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw vuelve automáticamente al resumen LLM integrado. Las señales de abortar/tiempo de espera que el llamador activó explícitamente se relanzan, no se absorben, así que la cancelación siempre se respeta.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superficies visibles para el usuario

- `/status` en cualquier sesión de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Registros del Gateway (`pnpm gateway:watch` u `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` más el conteo de compactaciones

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos "silenciosos" para tareas en segundo plano donde el usuario no debería ver la salida intermedia.

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` / `no_reply` para indicar "no entregar una respuesta al usuario". OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue entre mayúsculas y minúsculas: `NO_REPLY` y `no_reply` cuentan ambos cuando toda la carga útil es solo el token silencioso.
- A partir de `2026.1.10`, OpenClaw también suprime la transmisión de borrador/escritura cuando un fragmento parcial comienza con `NO_REPLY`, por lo que las operaciones silenciosas no filtran salida parcial a mitad del turno.
- Esto es solo para turnos verdaderamente en segundo plano/sin entrega; no es un atajo para solicitudes ordinarias accionables del usuario.

## Vaciado de memoria previo a Compaction

Antes de que ocurra la compactación automática, OpenClaw puede ejecutar un turno agéntico silencioso que escribe estado duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la compactación no pueda borrar contexto crítico. Supervisa el uso del contexto de la sesión y, cuando cruza un umbral flexible por debajo del umbral de compactación, envía una directiva silenciosa de "escribir memoria ahora" usando el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea nada.

Configuración (`agents.defaults.compaction.memoryFlush`), referencia completa en [/gateway/config-agents](/es/gateway/config-agents#agentsdefaultscompaction):

| Clave                       | Predeterminado   | Notas                                                                                                                                  |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | sin establecer   | anulación exacta de proveedor/modelo solo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`                                      |
| `softThresholdTokens`       | `4000`           | margen por debajo del umbral de compactación que activa un vaciado                                                                     |
| `forceFlushTranscriptBytes` | sin establecer (deshabilitado) | fuerza un vaciado una vez que el archivo de transcripción alcanza este tamaño en bytes (o una cadena como `"2mb"`), incluso si los contadores de tokens están obsoletos; `0` deshabilita |
| `prompt`                    | integrado        | mensaje de usuario para el turno de vaciado                                                                                            |
| `systemPrompt`              | integrado        | prompt de sistema adicional agregado para el turno de vaciado                                                                          |

Notas:

- El prompt/prompt de sistema predeterminados incluyen una indicación `NO_REPLY` para suprimir la entrega.
- Cuando `model` está establecido, el turno de vaciado usa ese modelo sin heredar la cadena de reserva de la sesión activa, por lo que el mantenimiento solo local no recurre silenciosamente a un modelo de conversación de pago en caso de fallo.
- El vaciado se ejecuta una vez por ciclo de compactación (seguido en `sessions.json`).
- El vaciado se ejecuta solo para sesiones de OpenClaw incrustadas; los backends de CLI y los turnos de Heartbeat lo omiten.
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver el diseño de archivos del espacio de trabajo y los patrones de escritura.

OpenClaw expone un hook `session_before_compact` en la API de extensión, pero la lógica de vaciado anterior vive del lado del Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), no en ese hook.

## Lista de comprobación de solución de problemas

- **¿Clave de sesión incorrecta?** Empieza por [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- **¿Desajuste entre almacén y transcripción?** Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- **¿Spam de Compaction?** Comprueba la ventana de contexto del modelo (si es demasiado pequeña, fuerza compactación frecuente), `reserveTokens` (si es demasiado alto para la ventana del modelo, causa compactación más temprana) y el exceso de resultados de herramientas (ajusta la poda de sesión).
- **¿Cada prompt parece desbordarse en un modelo local pequeño?** Confirma que el proveedor informa la ventana de contexto correcta del modelo. OpenClaw puede limitar la reserva efectiva solo cuando se conoce esa ventana.
- **¿Turnos silenciosos con filtraciones?** Confirma que la respuesta empieza con el token silencioso exacto `NO_REPLY` (sin distinción entre mayúsculas y minúsculas) y que estás en una compilación que incluye la corrección de supresión de transmisión (`2026.1.10`+).

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
- [Referencia de configuración de agentes](/es/gateway/config-agents)
