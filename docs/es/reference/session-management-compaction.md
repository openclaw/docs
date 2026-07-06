---
read_when:
    - Necesitas depurar identificadores de sesión, JSONL de transcripciones o campos de sessions.json
    - Estás cambiando el comportamiento de auto-Compaction o agregando mantenimiento de "pre-Compaction"
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis profundo: almacén de sesiones + transcripciones, ciclo de vida e información interna de (auto)Compaction'
title: Análisis profundo de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-06T10:52:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb7ac88649e24472bdb00e0f6739dc7885cd713c1497b8be966d2b9dfe1cf1e
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un único **proceso Gateway** posee el estado de sesión de extremo a extremo. Las IU (app de macOS, Control UI web, TUI) consultan al Gateway las listas de sesiones y los conteos de tokens. En modo remoto, los archivos de sesión viven en el host remoto, por lo que revisar los archivos de tu Mac local no reflejará lo que el Gateway está usando.

Primero la documentación general: [Gestión de sesiones](/es/concepts/session), [Compaction](/es/concepts/compaction), [Resumen de memoria](/es/concepts/memory), [Búsqueda de memoria](/es/concepts/memory-search), [Depuración de sesiones](/es/concepts/session-pruning), [Higiene de transcripciones](/es/reference/transcript-hygiene), referencia completa de configuración en [Configuración de agentes](/es/gateway/config-agents).

## Dos capas de persistencia

1. **Almacén de sesiones (`sessions.json`)** - mapa clave/valor `sessionKey -> SessionEntry`. Pequeño, mutable, seguro para editar o eliminar entradas. Registra metadatos: id de sesión actual, última actividad, alternadores, contadores de tokens.
2. **Transcripción (`<sessionId>.jsonl`)** - de solo anexado, estructurada como árbol (las entradas tienen `id` + `parentId`). Almacena la conversación, llamadas a herramientas y resúmenes de compactación; reconstruye el contexto del modelo para turnos futuros. Los puntos de control de Compaction son metadatos sobre la transcripción sucesora compactada; una nueva compactación no escribe una segunda copia `.checkpoint.*.jsonl`.

Los lectores de historial del Gateway evitan materializar toda la transcripción salvo que la superficie necesite acceso histórico arbitrario. El historial de primera página, el historial de chat embebido, la recuperación de reinicio y las comprobaciones de tokens/uso usan lecturas de cola acotadas. Los escaneos completos de transcripción pasan por el índice asíncrono de transcripciones, cacheado por ruta de archivo más `mtimeMs`/`size` y compartido entre lectores concurrentes.

## Ubicaciones en disco

Por agente, en el host del Gateway (resuelto mediante `src/config/sessions.ts`):

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de tema de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

## Mantenimiento del almacén y controles de disco

`session.maintenance` controla el mantenimiento automático de `sessions.json`, los artefactos de transcripción y los archivos auxiliares de trayectoria:

| Clave                   | Predeterminado        | Notas                                                                             |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | o `"warn"` (solo informa, sin mutación)                                           |
| `pruneAfter`            | `"30d"`               | límite de edad para entradas obsoletas                                            |
| `maxEntries`            | `500`                 | límite de entradas en `sessions.json`                                             |
| `resetArchiveRetention` | igual que `pruneAfter` | retención de archivos de transcripción `*.reset.<timestamp>`; `false` desactiva la limpieza |
| `maxDiskBytes`          | sin definir           | presupuesto opcional del directorio de sesiones                                   |
| `highWaterBytes`        | 80% de `maxDiskBytes` | objetivo tras la limpieza de presupuesto                                          |

Las sesiones de sondeo de ejecución de modelo del Gateway (claves que coinciden con `agent:*:explicit:model-run-<uuid>`) tienen una retención independiente y fija de `24h`. Esta depuración está condicionada por presión: solo se ejecuta cuando se alcanza la presión de mantenimiento/límite de entradas de sesión, y solo antes del paso global de limpieza/límite de entradas obsoletas. Otras sesiones explícitas no usan esta retención.

Orden de aplicación para la limpieza de presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos archivados más antiguos, transcripciones huérfanas o trayectorias huérfanas.
2. Si sigue por encima del objetivo, expulsar las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Repetir hasta que el uso esté en `highWaterBytes` o por debajo.

`mode: "warn"` informa posibles expulsiones sin mutar el almacén ni los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

El mantenimiento conserva punteros duraderos a conversaciones externas, como sesiones de grupo y sesiones de chat con alcance de hilo, pero las entradas sintéticas de runtime (cron, hooks, heartbeat, ACP, subagentes) pueden eliminarse una vez que superan la edad, el conteo o el presupuesto de disco configurados. Las ejecuciones cron aisladas usan un control `cron.sessionRetention` independiente, separado de la retención de sondeos de ejecución de modelo.

Las escrituras normales del Gateway pasan por un escritor de sesiones por almacén que serializa las mutaciones en proceso sin tomar un bloqueo de archivo de runtime. Los helpers de parcheo de ruta caliente toman prestada la caché mutable validada mientras mantienen esa ranura de escritor, por lo que los archivos `sessions.json` grandes no se clonan ni se releen para cada actualización de metadatos. Prefiere `updateSessionStore(...)` / `updateSessionStoreEntry(...)` en código de runtime; los guardados directos de todo el almacén son para compatibilidad y herramientas de mantenimiento sin conexión. Cuando un Gateway está accesible, `openclaw sessions cleanup` sin `--dry-run` y `openclaw agents delete` delegan las mutaciones del almacén al Gateway para que la limpieza se una a la misma cola de escritores; `--store <path>` es la ruta explícita de reparación sin conexión para mantenimiento directo de archivos y siempre permanece local (igual que `--dry-run`). La limpieza de `maxEntries` se procesa por lotes para almacenes de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de marca alta lo reescriba hacia abajo. Las lecturas nunca depuran ni limitan entradas durante el arranque del Gateway; solo lo hacen las escrituras u `openclaw sessions cleanup --enforce`, y este último también aplica el límite de inmediato y depura artefactos antiguos de transcripción, punto de control y trayectoria sin referencia, incluso sin presupuesto de disco configurado.

OpenClaw ya no crea copias de seguridad automáticas con rotación `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Las mutaciones de transcripción usan un bloqueo de escritura de sesión sobre el archivo de transcripción:

| Ajuste                               | Predeterminado | Sobrescritura de env                            |
| ------------------------------------ | -------------- | ----------------------------------------------- |
| `session.writeLock.acquireTimeoutMs` | `60000`        | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`      | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`          |
| `session.writeLock.maxHoldMs`        | `300000`       | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`       |

`acquireTimeoutMs` es cuánto tiempo una espera de bloqueo expone un error de sesión ocupada antes de rendirse; súbelo solo cuando una preparación, limpieza, Compaction o trabajo de espejo de transcripción legítimos compitan durante más tiempo en máquinas lentas. `staleMs` es cuándo un bloqueo existente puede recuperarse como obsoleto. `maxHoldMs` es el umbral de liberación del vigilante en proceso.

## Sesiones Cron y registros de ejecución

Las ejecuciones cron aisladas crean sus propias entradas/transcripciones de sesión con retención dedicada:

- `cron.sessionRetention` (predeterminado `"24h"`) depura del almacén las sesiones antiguas de ejecuciones cron aisladas; `false` lo desactiva.
- `cron.runLog.keepLines` depura las filas retenidas del historial de ejecuciones SQLite por trabajo cron (predeterminado `2000`). `cron.runLog.maxBytes` se acepta solo por compatibilidad con registros de ejecución antiguos respaldados por archivos.

Cuando cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila: conserva preferencias seguras (ajustes de thinking/fast/verbose/reasoning, etiquetas, nombre para mostrar) y sobrescrituras explícitas de modelo/autenticación seleccionadas por el usuario, pero descarta el contexto ambiental de conversación (enrutamiento de canal/grupo, política de envío/cola, elevación, origen, enlace de runtime ACP) para que una ejecución aislada nueva no pueda heredar entrega obsoleta ni autoridad de runtime de una ejecución anterior.

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica en qué cubo de conversación estás (enrutamiento + aislamiento). Reglas canónicas: [/concepts/session](/es/concepts/session).

| Patrón                       | Ejemplo                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Chat principal/directo (por agente) | `agent:<agentId>:<mainKey>` (predeterminado `main`)        |
| Grupo                        | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (salvo que se sobrescriba)                    |

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación). La lógica de decisión vive en `initSessionState()` en `src/auto-reply/reply/session.ts`.

- **Restablecimiento** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado a las 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Expiración por inactividad** (`session.reset.idleMinutes`, o el heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Si tanto el restablecimiento diario como la inactividad están configurados, gana el que expire primero.
- **Reanudación al reconectar Control UI** conserva la sesión visible actualmente para un envío de reconexión cuando el Gateway recibe el `sessionId` coincidente de un cliente de IU de operador. Esta es una señal de un solo uso; los envíos obsoletos ordinarios siguen creando un nuevo `sessionId`.
- **Eventos de sistema** (heartbeat, despertares cron, notificaciones exec, contabilidad del gateway) pueden mutar la fila de sesión, pero nunca extienden la frescura de restablecimiento diario/por inactividad. El cambio por restablecimiento descarta los avisos de eventos de sistema en cola para la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación de padre** usa la rama activa de OpenClaw al crear una bifurcación de hilo o subagente. Si esa rama es demasiado grande (por encima de un límite interno fijo, actualmente 100K tokens), OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar historial inutilizable. El dimensionamiento es automático y no configurable; la configuración heredada `session.parentForkMaxTokens` es eliminada por `openclaw doctor --fix`.

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor es `SessionEntry` en `src/config/sessions.ts`. Campos clave (no exhaustivo):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de esto salvo que `sessionFile` esté definido)
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la actualización del reinicio diario usa esto. Las filas heredadas pueden derivarla del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la actualización del reinicio por inactividad usa esto para que los eventos de Heartbeat, Cron y exec no mantengan vivas las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada.
- `updatedAt`: marca de tiempo de la última mutación de fila del almacén, usada para listado/poda/contabilidad; no es la autoridad de actualización diaria/por inactividad.
- `archivedAt`: marca de tiempo de archivo opcional. Las sesiones archivadas permanecen en el almacén con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijación opcional. Las sesiones activas fijadas se ordenan por delante de las sesiones no fijadas; archivar una sesión borra su fijación.
- Interoperabilidad con hilos de Codex: ambos campos siguen la forma de gestión de hilos de Codex; los booleanos `archived`/`pinned` en el cable siempre se derivan de la marca de tiempo y se sellan del lado del servidor, coincidiendo con la semántica de Codex `threads.archived_at` y la serialización camelCase. Las marcas de tiempo de OpenClaw son milisegundos desde epoch, mientras que Codex usa segundos desde epoch, por lo que los puentes convierten en el límite del plugin de Codex. Codex aún no tiene API de fijación (`thread/archive`/`thread/unarchive` únicamente); el estado fijado permanece del lado de OpenClaw hasta que exista una, momento en el cual la forma coincidente permite que las sesiones vinculadas hagan ida y vuelta del estado fijado mecánicamente.
- `sessionFile`: anulación opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos de etiquetado de grupo/canal
- Conmutadores: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (anulación por sesión)
- Selección de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo/dependientes del proveedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la autocompactación para esta clave de sesión
- `memoryFlushAt` / `memoryFlushCompactionCount`: marca de tiempo y recuento de compactaciones del último volcado de memoria previo a la compactación

El almacén se puede editar con seguridad, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas mientras se ejecutan las sesiones.

## Estructura de transcripción (`*.jsonl`)

Las transcripciones las administra `SessionManager` (`openclaw/plugin-sdk/agent-sessions`). El archivo es JSONL:

- Primera línea: encabezado de sesión - `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opcional.
- Luego: entradas con `id` + `parentId` (estructura de árbol).

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensaje inyectado por extensión que _sí_ entra en el contexto del modelo (se representa en la TUI cuando `display: true`, se oculta por completo cuando `display: false`)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo (para persistir el estado de la extensión entre recargas)
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente no "corrige" las transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

## Ventanas de contexto frente a tokens rastreados

Dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo). Proviene del catálogo de modelos y puede anularse mediante configuración.
2. **Contadores del almacén de sesión**: estadísticas móviles escritas en `sessions.json` (usadas para `/status` y paneles). `contextTokens` es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Más sobre límites: [/reference/token-use](/es/reference/token-use).

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes. Después de la compactación, los turnos futuros ven el resumen de compactación más los mensajes posteriores a `firstKeptEntryId`. Compaction es **persistente**, a diferencia de la poda de sesiones; consulta [/concepts/session-pruning](/es/concepts/session-pruning).

La reinyección de secciones de AGENTS.md después de la compactación es opcional mediante `agents.defaults.compaction.postCompactionSections`; cuando no está definido o es `[]`, OpenClaw no añade extractos de AGENTS.md encima del resumen de compactación.

### Límites de fragmentos y emparejamiento de herramientas

Al dividir una transcripción larga en fragmentos de compactación, OpenClaw mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes:

- Si la división por proporción de tokens caería entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultados de herramienta empujaría el fragmento por encima del objetivo, OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la cola sin resumir.
- Los bloques de llamadas a herramientas abortadas/con error no mantienen abierta una división pendiente.

## Cuándo ocurre la autocompactación

Dos disparadores en el agente de OpenClaw integrado:

1. **Recuperación de desbordamiento**: el modelo devuelve un error de desbordamiento de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` y otras variantes con la forma del proveedor) - compacta y luego reintenta. Cuando el proveedor informa el recuento de tokens intentado, OpenClaw reenvía ese recuento observado a la Compaction de recuperación de desbordamiento; si el proveedor confirma el desbordamiento pero no expone ningún recuento analizable, OpenClaw pasa un recuento sintético mínimamente por encima del presupuesto a los motores de Compaction y a los diagnósticos. Si la recuperación de desbordamiento sigue fallando, OpenClaw muestra orientación explícita y conserva la asignación de sesión actual en lugar de rotar silenciosamente a un id de sesión nuevo - reintenta el mensaje, ejecuta `/compact` o ejecuta `/new`.
2. **Mantenimiento de umbral**: después de un turno correcto, cuando `contextTokens > contextWindow - reserveTokens`, donde `contextWindow` es la ventana de contexto del modelo y `reserveTokens` es el margen reservado para prompts más la siguiente salida del modelo.

Dos protecciones adicionales se ejecutan fuera de estos dos disparadores:

- **Compaction local de prevalidación**: configura `agents.defaults.compaction.maxActiveTranscriptBytes` (bytes o una cadena como `"20mb"`) para disparar la Compaction local antes de abrir la siguiente ejecución una vez que el archivo de transcripción activa alcance ese tamaño. Esta es una protección de tamaño de archivo para el coste de reapertura local, no archivado sin procesar: la Compaction semántica normal sigue ejecutándose y requiere `truncateAfterCompaction` para que el resumen compactado se convierta en una nueva transcripción sucesora.
- **Comprobación previa a mitad de turno**: configura `agents.defaults.compaction.midTurnPrecheck.enabled: true` (valor predeterminado `false`) para añadir una protección de bucle de herramientas. Después de anexar un resultado de herramienta y antes de la siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de presupuesto de prevalidación usada al inicio del turno. Si el contexto ya no cabe, la protección no compacta en línea: emite una señal estructurada de comprobación previa a mitad de turno, detiene el envío del prompt actual y permite que el bucle de ejecución externo use la ruta de recuperación existente (truncar resultados de herramienta sobredimensionados cuando eso basta, o disparar el modo de Compaction configurado y reintentar). Funciona con los modos de Compaction `default` y `safeguard`, incluida la Compaction de safeguard respaldada por proveedor. Es independiente de `maxActiveTranscriptBytes`: la protección de tamaño en bytes se ejecuta antes de que se abra un turno; la comprobación previa a mitad de turno se ejecuta después, tras anexar nuevos resultados de herramienta.

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

OpenClaw también aplica un mínimo de seguridad para ejecuciones integradas: si `compaction.reserveTokens` está por debajo de `reserveTokensFloor` (valor predeterminado `20000`), OpenClaw lo eleva. Configura `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el mínimo. Cuando se conoce la ventana de contexto del modelo activo, tanto el mínimo como la reserva efectiva final se limitan para que la reserva no pueda consumir todo el presupuesto del prompt. Esto evita que los modelos con contexto pequeño (por ejemplo, un modelo local de 16K tokens) entren en Compaction desde el primer token; sin una ventana de contexto conocida, los presupuestos de reserva configurados y actuales permanecen sin límite. Por qué existe un mínimo: dejar suficiente margen para tareas de "mantenimiento" de varios turnos (como el vaciado de memoria, más abajo) antes de que la Compaction sea inevitable. Implementación: `applyAgentCompactionSettingsFromConfig()` en `src/agents/agent-settings.ts`, llamado desde las rutas de turno del ejecutor integrado y de configuración de Compaction.

`/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito y conserva el punto de corte de cola reciente del runtime. Sin un presupuesto de conservación explícito, la Compaction manual es un punto de control estricto y el contexto reconstruido empieza desde el nuevo resumen.

Cuando `truncateAfterCompaction` está activado, OpenClaw rota la transcripción activa a un JSONL sucesor compactado después de la Compaction. Las acciones de checkpoint de rama/restauración usan ese sucesor compactado; los archivos de checkpoint heredados previos a la Compaction siguen siendo legibles mientras estén referenciados.

## Proveedores de Compaction enchufables

Los Plugins registran un proveedor de Compaction mediante `registerCompactionProvider()` en la API del plugin. Cuando `agents.defaults.compaction.provider` se configura con un id de proveedor registrado, la extensión safeguard delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un Plugin proveedor de Compaction registrado. Déjalo sin configurar para el resumen LLM predeterminado. Configurar un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada, y safeguard sigue preservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado redestila resúmenes previos con mensajes nuevos en lugar de preservar literalmente el resumen anterior completo.
- El modo safeguard activa por defecto las auditorías de calidad del resumen; configura `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida mal formada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen LLM integrado. Las señales de anulación/tiempo de espera que el llamador disparó explícitamente se vuelven a lanzar, no se absorben, por lo que la cancelación siempre se respeta.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superficies visibles para el usuario

- `/status` en cualquier sesión de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Registros del Gateway (`pnpm gateway:watch` u `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` más el recuento de Compaction

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos "silenciosos" para tareas en segundo plano en las que el usuario no debe ver salida intermedia.

- El asistente empieza su salida con el token silencioso exacto `NO_REPLY` / `no_reply` para indicar "no entregar una respuesta al usuario". OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas de minúsculas: `NO_REPLY` y `no_reply` cuentan cuando toda la carga útil es solo el token silencioso.
- A partir de `2026.1.10`, OpenClaw también suprime el streaming de borrador/escritura cuando un fragmento parcial comienza con `NO_REPLY`, de modo que las operaciones silenciosas no filtren salida parcial a mitad de turno.
- Esto es solo para turnos verdaderamente en segundo plano/sin entrega; no es un atajo para solicitudes de usuario accionables ordinarias.

## Vaciado de memoria previo a Compaction

Antes de que ocurra la Compaction automática, OpenClaw puede ejecutar un turno agéntico silencioso que escribe estado duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda borrar contexto crítico. Supervisa el uso de contexto de la sesión y, una vez que cruza un umbral flexible por debajo del umbral de Compaction, envía una directiva silenciosa de "escribir memoria ahora" usando el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea nada.

Configuración (`agents.defaults.compaction.memoryFlush`), referencia completa en [/gateway/config-agents](/es/gateway/config-agents#agentsdefaultscompaction):

| Clave                       | Predeterminado          | Notas                                                                                                                                  |
| --------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`                  |                                                                                                                                        |
| `model`                     | sin definir             | anulación exacta de proveedor/modelo solo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`                                      |
| `softThresholdTokens`       | `4000`                  | margen por debajo del umbral de Compaction que activa un vaciado                                                                        |
| `forceFlushTranscriptBytes` | sin definir (deshabilitado) | fuerza un vaciado cuando el archivo de transcripción alcanza este tamaño en bytes (o una cadena como `"2mb"`), incluso si los contadores de tokens están obsoletos; `0` lo deshabilita |
| `prompt`                    | integrado               | mensaje de usuario para el turno de vaciado                                                                                            |
| `systemPrompt`              | integrado               | prompt de sistema adicional anexado para el turno de vaciado                                                                           |

Notas:

- El prompt/prompt de sistema predeterminado incluye una pista `NO_REPLY` para suprimir la entrega.
- Cuando `model` está definido, el turno de vaciado usa ese modelo sin heredar la cadena de reserva de la sesión activa, por lo que el mantenimiento solo local no recurre silenciosamente a un modelo de conversación de pago si falla.
- El vaciado se ejecuta una vez por ciclo de Compaction (registrado en `sessions.json`).
- El vaciado se ejecuta solo para sesiones incrustadas de OpenClaw; los backends de CLI y los turnos Heartbeat lo omiten.
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver la disposición de archivos del espacio de trabajo y los patrones de escritura.

OpenClaw expone un hook `session_before_compact` en la API de extensiones, pero la lógica de vaciado anterior reside en el lado del Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), no en ese hook.

## Lista de comprobación de solución de problemas

- **¿Clave de sesión incorrecta?** Empieza por [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- **¿Diferencia entre almacén y transcripción?** Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- **¿Spam de Compaction?** Revisa la ventana de contexto del modelo (si es demasiado pequeña fuerza Compaction frecuente), `reserveTokens` (si es demasiado alto para la ventana del modelo provoca Compaction antes) y el aumento excesivo de resultados de herramientas (ajusta la depuración de sesión).
- **¿Cada prompt parece desbordarse en un modelo local pequeño?** Confirma que el proveedor informa la ventana de contexto correcta del modelo. OpenClaw solo puede limitar la reserva efectiva cuando se conoce esa ventana.
- **¿Se filtran turnos silenciosos?** Confirma que la respuesta empieza con el token silencioso exacto `NO_REPLY` (sin distinguir mayúsculas y minúsculas) y que estás en una compilación que incluye la corrección de supresión de streaming (`2026.1.10`+).

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Depuración de sesión](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
- [Referencia de configuración de agentes](/es/gateway/config-agents)
