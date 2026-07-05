---
read_when:
    - Necesitas depurar identificadores de sesión, JSONL de transcripciones o campos de sessions.json
    - Estás cambiando el comportamiento de auto-Compaction o agregando mantenimiento de "pre-Compaction"
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis profundo: almacén de sesiones + transcripciones, ciclo de vida e internos de (auto)compaction'
title: Análisis profundo de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-05T11:45:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ec602a2d21f32a058500fe6d25f91c06e53582c4e028042d331a6c96355fcb
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Un único **proceso Gateway** posee el estado de la sesión de extremo a extremo. Las IU (app de macOS, Control UI web, TUI) consultan al Gateway las listas de sesiones y los recuentos de tokens. En modo remoto, los archivos de sesión viven en el host remoto, por lo que revisar los archivos de tu Mac local no reflejará lo que está usando el Gateway.

Primero los documentos de resumen: [Gestión de sesiones](/es/concepts/session), [Compaction](/es/concepts/compaction), [Resumen de memoria](/es/concepts/memory), [Búsqueda en memoria](/es/concepts/memory-search), [Poda de sesiones](/es/concepts/session-pruning), [Higiene de transcripciones](/es/reference/transcript-hygiene), referencia completa de configuración en [Configuración del agente](/es/gateway/config-agents).

## Dos capas de persistencia

1. **Almacén de sesiones (`sessions.json`)** - mapa clave/valor `sessionKey -> SessionEntry`. Pequeño, mutable, seguro para editar o eliminar entradas. Rastrea metadatos: id de sesión actual, última actividad, conmutadores, contadores de tokens.
2. **Transcripción (`<sessionId>.jsonl`)** - solo anexado, estructurada como árbol (las entradas tienen `id` + `parentId`). Almacena la conversación, llamadas a herramientas y resúmenes de Compaction; reconstruye el contexto del modelo para turnos futuros. Los puntos de control de Compaction son metadatos sobre la transcripción sucesora compactada; una nueva Compaction no escribe una segunda copia `.checkpoint.*.jsonl`.

Los lectores de historial del Gateway evitan materializar toda la transcripción salvo que la superficie necesite acceso histórico arbitrario. El historial de primera página, el historial de chat integrado, la recuperación tras reinicio y las comprobaciones de tokens/uso usan lecturas acotadas desde el final. Los escaneos completos de transcripción pasan por el índice asíncrono de transcripciones, almacenado en caché por ruta de archivo más `mtimeMs`/`size` y compartido entre lectores concurrentes.

## Ubicaciones en disco

Por agente, en el host del Gateway (resuelto mediante `src/config/sessions.ts`):

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

## Mantenimiento del almacén y controles de disco

`session.maintenance` controla el mantenimiento automático de `sessions.json`, artefactos de transcripción y archivos auxiliares de trayectoria:

| Clave                   | Predeterminado        | Notas                                                                             |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | o `"warn"` (solo informa, sin mutación)                                           |
| `pruneAfter`            | `"30d"`               | umbral de edad para entradas obsoletas                                            |
| `maxEntries`            | `500`                 | límite de entradas en `sessions.json`                                             |
| `resetArchiveRetention` | igual que `pruneAfter` | retención para archivos de transcripción `*.reset.<timestamp>`; `false` desactiva la limpieza |
| `maxDiskBytes`          | sin definir           | presupuesto opcional del directorio de sesiones                                   |
| `highWaterBytes`        | 80% de `maxDiskBytes` | objetivo después de la limpieza por presupuesto                                   |

Las sesiones de sondeo de ejecuciones de modelo del Gateway (claves que coinciden con `agent:*:explicit:model-run-<uuid>`) reciben una retención separada y fija de `24h`. Esta poda está condicionada por presión: solo se ejecuta cuando se alcanza la presión de mantenimiento/límite de entradas de sesión, y solo antes del paso global de limpieza/límite de entradas obsoletas. Otras sesiones explícitas no usan esta retención.

Orden de aplicación para la limpieza por presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos archivados, transcripciones huérfanas o trayectorias huérfanas más antiguos.
2. Si aún se supera el objetivo, expulsar las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Repetir hasta que el uso esté en `highWaterBytes` o por debajo.

`mode: "warn"` informa posibles expulsiones sin mutar el almacén ni los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

El mantenimiento conserva punteros duraderos a conversaciones externas, como sesiones de grupo y sesiones de chat con ámbito de hilo, pero las entradas sintéticas de tiempo de ejecución (Cron, hooks, Heartbeat, ACP, subagentes) aún pueden eliminarse una vez que superan la edad, el recuento o el presupuesto de disco configurados. Las ejecuciones aisladas de Cron usan un control `cron.sessionRetention` separado, independiente de la retención de sondeos de ejecuciones de modelo.

Las escrituras normales del Gateway fluyen por un escritor de sesiones por almacén que serializa mutaciones en proceso sin tomar un bloqueo de archivo en tiempo de ejecución. Los helpers de parcheo en rutas calientes toman prestada la caché mutable validada mientras mantienen ese turno de escritor, por lo que los archivos `sessions.json` grandes no se clonan ni releen para cada actualización de metadatos. Prefiere `updateSessionStore(...)` / `updateSessionStoreEntry(...)` en el código de tiempo de ejecución; los guardados directos del almacén completo son para compatibilidad y herramientas de mantenimiento sin conexión. Cuando un Gateway es alcanzable, `openclaw sessions cleanup` sin `--dry-run` y `openclaw agents delete` delegan las mutaciones del almacén al Gateway para que la limpieza se una a la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para mantenimiento directo de archivos y siempre permanece local (al igual que `--dry-run`). La limpieza de `maxEntries` se procesa por lotes para almacenes de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de marca alta lo reduzca. Las lecturas nunca podan ni limitan entradas durante el arranque del Gateway; solo lo hacen las escrituras o `openclaw sessions cleanup --enforce`, y este último también aplica el límite de inmediato y poda artefactos antiguos no referenciados de transcripción, punto de control y trayectoria incluso sin presupuesto de disco configurado.

OpenClaw ya no crea copias de seguridad automáticas rotativas `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Las mutaciones de transcripción usan un bloqueo de escritura de sesión en el archivo de transcripción:

| Configuración                        | Predeterminado | Anulación por env                                 |
| ------------------------------------ | -------------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`        | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`      | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`       | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` es cuánto tiempo espera un bloqueo antes de exponer un error de sesión ocupada y rendirse; auméntalo solo cuando tareas legítimas de preparación, limpieza, Compaction o espejo de transcripción compitan durante más tiempo en máquinas lentas. `staleMs` es cuándo un bloqueo existente puede reclamarse como obsoleto. `maxHoldMs` es el umbral de liberación del vigilante en proceso.

## Sesiones de Cron y registros de ejecución

Las ejecuciones aisladas de Cron crean sus propias entradas/transcripciones de sesión con retención dedicada:

- `cron.sessionRetention` (predeterminado `"24h"`) poda del almacén las sesiones antiguas de ejecuciones aisladas de Cron; `false` lo desactiva.
- `cron.runLog.keepLines` poda las filas retenidas de historial de ejecución en SQLite por trabajo Cron (predeterminado `2000`). `cron.runLog.maxBytes` se acepta solo por compatibilidad con registros de ejecución antiguos respaldados por archivos.

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila: conserva preferencias seguras (ajustes de pensamiento/rápido/detallado/razonamiento, etiquetas, nombre para mostrar) y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario, pero descarta el contexto ambiental de conversación (enrutamiento de canal/grupo, política de envío/cola, elevación, origen, enlace de tiempo de ejecución ACP) para que una ejecución aislada nueva no pueda heredar entrega obsoleta ni autoridad de tiempo de ejecución de una ejecución anterior.

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica en qué contenedor de conversación estás (enrutamiento + aislamiento). Reglas canónicas: [/concepts/session](/es/concepts/session).

| Patrón                       | Ejemplo                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| Chat principal/directo (por agente) | `agent:<agentId>:<mainKey>` (predeterminado `main`)         |
| Grupo                        | `agent:<agentId>:<channel>:group:<id>`                      |
| Sala/canal (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (salvo anulación)                             |

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación). La lógica de decisión vive en `initSessionState()` en `src/auto-reply/reply/session.ts`.

- **Restablecimiento** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado 4:00 AM hora local en el host del Gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Caducidad por inactividad** (`session.reset.idleMinutes`, o heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Si tanto diario como inactividad están configurados, gana el que expire primero.
- **Reanudación por reconexión de Control UI** conserva la sesión visible actualmente para un envío de reconexión cuando el Gateway recibe el `sessionId` correspondiente de un cliente de IU de operador. Esta es una señal de un solo uso; los envíos obsoletos ordinarios aún crean un nuevo `sessionId`.
- **Eventos del sistema** (Heartbeat, despertares de Cron, notificaciones exec, contabilidad del Gateway) pueden mutar la fila de sesión, pero nunca extienden la frescura de restablecimiento diario/por inactividad. La rotación por restablecimiento descarta los avisos de eventos del sistema en cola para la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación padre** usa la rama activa de OpenClaw al crear un hilo o bifurcación de subagente. Si esa rama es demasiado grande (por encima de un límite interno fijo, actualmente 100K tokens), OpenClaw inicia el hijo con contexto aislado en vez de fallar o heredar historial inutilizable. El dimensionamiento es automático y no configurable; la configuración heredada `session.parentForkMaxTokens` se elimina con `openclaw doctor --fix`.

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor es `SessionEntry` en `src/config/sessions.ts`. Campos clave (no exhaustivos):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de esto a menos que `sessionFile` esté definido)
- `sessionStartedAt`: marca de tiempo de inicio para el `sessionId` actual; la actualización diaria usa esto. Las filas heredadas pueden derivarla del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la actualización por inactividad usa esto para que los eventos de Heartbeat, Cron y exec no mantengan vivas las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada.
- `updatedAt`: marca de tiempo de la última mutación de fila del almacén, usada para listar/purgar/contabilidad; no es la autoridad de actualización diaria/por inactividad.
- `archivedAt`: marca de tiempo de archivo opcional. Las sesiones archivadas permanecen en el almacén con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijación opcional. Las sesiones activas fijadas se ordenan antes que las sesiones no fijadas; archivar una sesión borra su fijación.
- Interoperabilidad de hilos de Codex: ambos campos siguen la forma de gestión de hilos de Codex; los booleanos `archived`/`pinned` en el cable siempre se derivan de la marca de tiempo y se sellan del lado del servidor, coincidiendo con la semántica de Codex `threads.archived_at` y la serialización camelCase. Las marcas de tiempo de OpenClaw están en milisegundos epoch, mientras que Codex usa segundos epoch, por lo que los puentes convierten en el límite del Plugin de codex. Codex aún no tiene API de fijación (`thread/archive`/`thread/unarchive` solamente); el estado fijado permanece del lado de OpenClaw hasta que exista una, momento en el que la forma coincidente permite que las sesiones vinculadas hagan ida y vuelta del estado de fijación mecánicamente.
- `sessionFile`: anulación opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos de etiquetado de grupo/canal
- Alternadores: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (anulación por sesión)
- Selección de modelo: `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (de mejor esfuerzo/dependientes del proveedor): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la auto-Compaction para esta clave de sesión
- `memoryFlushAt` / `memoryFlushCompactionCount`: marca de tiempo y recuento de Compaction del último volcado de memoria previo a la Compaction

El almacén se puede editar con seguridad, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas mientras se ejecutan las sesiones.

## Estructura de la transcripción (`*.jsonl`)

Las transcripciones son gestionadas por `SessionManager` (`openclaw/plugin-sdk/agent-sessions`). El archivo es JSONL:

- Primera línea: encabezado de sesión: `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` opcional.
- Luego: entradas con `id` + `parentId` (estructura de árbol).

Tipos de entrada destacables:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensaje inyectado por la extensión que _sí_ entra en el contexto del modelo (se representa en la TUI cuando `display: true`, se oculta por completo cuando `display: false`)
- `custom`: estado de la extensión que _no_ entra en el contexto del modelo (para conservar el estado de la extensión entre recargas)
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente no "arregla" las transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

## Ventanas de contexto frente a tokens rastreados

Dos conceptos distintos:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo). Proviene del catálogo de modelos y se puede anular mediante configuración.
2. **Contadores del almacén de sesiones**: estadísticas móviles escritas en `sessions.json` (usadas para `/status` y paneles). `contextTokens` es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Más sobre los límites: [/reference/token-use](/es/reference/token-use).

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes. Después de Compaction, los turnos futuros ven el resumen de Compaction más los mensajes posteriores a `firstKeptEntryId`. Compaction es **persistente**, a diferencia de la poda de sesiones; consulta [/concepts/session-pruning](/es/concepts/session-pruning).

La reinyección de secciones de AGENTS.md después de Compaction es opcional mediante `agents.defaults.compaction.postCompactionSections`; cuando no está definido o es `[]`, OpenClaw no añade extractos de AGENTS.md encima del resumen de Compaction.

### Límites de fragmentos y emparejamiento de herramientas

Al dividir una transcripción larga en fragmentos de Compaction, OpenClaw mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes:

- Si la división por cuota de tokens cayera entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultados de herramienta de otro modo empujara el fragmento por encima del objetivo, OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la cola sin resumir.
- Los bloques de llamadas a herramientas abortadas/con error no mantienen abierta una división pendiente.

## Cuándo ocurre la auto-Compaction

Dos desencadenantes en el agente OpenClaw integrado:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` y otras variantes con forma de proveedor): compacta y luego reintenta. Cuando el proveedor informa el recuento de tokens intentado, OpenClaw reenvía ese recuento observado a la Compaction de recuperación por desbordamiento; si el proveedor confirma el desbordamiento pero no expone ningún recuento analizable, OpenClaw pasa un recuento sintético mínimamente por encima del presupuesto a los motores de Compaction y diagnósticos. Si la recuperación por desbordamiento aún falla, OpenClaw muestra orientación explícita y preserva la asignación de sesión actual en lugar de rotar silenciosamente a un id de sesión nuevo: reintenta el mensaje, ejecuta `/compact` o ejecuta `/new`.
2. **Mantenimiento por umbral**: después de un turno correcto, cuando `contextTokens > contextWindow - reserveTokens`, donde `contextWindow` es la ventana de contexto del modelo y `reserveTokens` es el margen reservado para prompts más la siguiente salida del modelo.

Dos protecciones adicionales se ejecutan fuera de estos dos desencadenantes:

- **Compaction local previa**: define `agents.defaults.compaction.maxActiveTranscriptBytes` (bytes o una cadena como `"20mb"`) para activar Compaction local antes de abrir la siguiente ejecución una vez que el archivo de transcripción activo alcance ese tamaño. Esta es una protección de tamaño de archivo para el costo de reapertura local, no archivado bruto; la Compaction semántica normal sigue ejecutándose, y requiere `truncateAfterCompaction` para que el resumen compactado se convierta en una nueva transcripción sucesora.
- **Comprobación previa a mitad de turno**: define `agents.defaults.compaction.midTurnPrecheck.enabled: true` (predeterminado `false`) para añadir una protección de bucle de herramientas. Después de anexar un resultado de herramienta y antes de la siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de presupuesto previo usada al inicio del turno. Si el contexto ya no cabe, la protección no compacta en línea: emite una señal estructurada de comprobación previa a mitad de turno, detiene el envío del prompt actual y deja que el bucle externo de ejecución use la ruta de recuperación existente (truncar resultados de herramienta demasiado grandes cuando eso baste, o activar el modo de Compaction configurado y reintentar). Funciona con los modos de Compaction `default` y `safeguard`, incluida la Compaction safeguard respaldada por proveedor. Independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta antes de que se abra un turno; la comprobación previa a mitad de turno se ejecuta después, tras anexar nuevos resultados de herramienta.

## Ajustes de Compaction

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

OpenClaw también aplica un piso de seguridad para ejecuciones integradas: si `compaction.reserveTokens` está por debajo de `reserveTokensFloor` (predeterminado `20000`), OpenClaw lo aumenta; si ya es más alto, lo deja igual. Define `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el piso. El piso en sí se limita automáticamente a una fracción segura de la ventana de contexto del modelo, de modo que los modelos con contexto pequeño (por ejemplo, un modelo local de 16K tokens) no se queden sin presupuesto de prompt; sin ese límite, el piso predeterminado de 20000 tokens podría exceder toda la ventana y poner cada prompt en un bucle de desbordamiento-Compaction. Por qué existe un piso: dejar suficiente margen para el "mantenimiento" de varios turnos (como el volcado de memoria, abajo) antes de que la Compaction se vuelva inevitable. Implementación: `applyAgentCompactionSettingsFromConfig()` en `src/agents/agent-settings.ts`, llamado desde las rutas de configuración de turno del ejecutor integrado y de Compaction.

`/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito y conserva el punto de corte de la cola reciente del tiempo de ejecución. Sin un presupuesto explícito para conservar, la Compaction manual es un punto de control estricto y el contexto reconstruido empieza desde el nuevo resumen.

Cuando `truncateAfterCompaction` está habilitado, OpenClaw rota la transcripción activa a un sucesor JSONL compactado después de Compaction. Las acciones de punto de control de rama/restauración usan ese sucesor compactado; los archivos de punto de control heredados previos a la Compaction siguen siendo legibles mientras estén referenciados.

## Proveedores de Compaction conectables

Los Plugins registran un proveedor de Compaction mediante `registerCompactionProvider()` en la API del Plugin. Cuando `agents.defaults.compaction.provider` está definido como un id de proveedor registrado, la extensión safeguard delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un Plugin proveedor de Compaction registrado. Déjalo sin definir para el resumen LLM predeterminado. Definir un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y política de preservación de identificadores que la ruta integrada, y safeguard aún conserva el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado vuelve a destilar resúmenes anteriores con mensajes nuevos en lugar de preservar textualmente todo el resumen anterior.
- El modo safeguard habilita auditorías de calidad del resumen de forma predeterminada; define `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida malformada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen LLM integrado. Las señales de aborto/tiempo de espera que el llamador activó explícitamente se vuelven a lanzar, no se silencian, por lo que la cancelación siempre se respeta.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Superficies visibles para el usuario

- `/status` en cualquier sesión de chat
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Registros del Gateway (`pnpm gateway:watch` o `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` más el recuento de Compaction

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos "silenciosos" para tareas en segundo plano donde el usuario no debería ver salida intermedia.

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` / `no_reply` para significar "no entregar una respuesta al usuario". OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas de minúsculas: `NO_REPLY` y `no_reply` cuentan cuando toda la carga útil es solo el token silencioso.
- A partir de `2026.1.10`, OpenClaw también suprime el streaming de borrador/escritura cuando un fragmento parcial empieza con `NO_REPLY`, de modo que las operaciones silenciosas no filtren salida parcial a mitad de turno.
- Esto es solo para turnos verdaderamente en segundo plano/sin entrega; no es un atajo para solicitudes de usuario ordinarias y accionables.

## Volcado de memoria previo a la Compaction

Antes de que ocurra la auto-Compaction, OpenClaw puede ejecutar un turno agéntico silencioso que escribe estado duradero en disco (por ejemplo `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que Compaction no pueda borrar contexto crítico. Monitorea el uso de contexto de la sesión y, una vez que cruza un umbral suave por debajo del umbral de Compaction, envía una directiva silenciosa "escribe memoria ahora" usando el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea nada.

Config (`agents.defaults.compaction.memoryFlush`), referencia completa en [/gateway/config-agents](/es/gateway/config-agents#agentsdefaultscompaction):

| Clave                       | Valor predeterminado       | Notas                                                                                                                                                                                 |
| --------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`                     |                                                                                                                                                                                       |
| `model`                     | sin definir                | anulación exacta de proveedor/modelo solo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`                                                                                    |
| `softThresholdTokens`       | `4000`                     | margen por debajo del umbral de Compaction que desencadena un vaciado                                                                                                                 |
| `forceFlushTranscriptBytes` | sin definir (deshabilitado) | fuerza un vaciado cuando el archivo de transcripción alcanza este tamaño en bytes (o una cadena como `"2mb"`), aunque los contadores de tokens estén obsoletos; `0` lo deshabilita |
| `prompt`                    | integrado                  | mensaje de usuario para el turno de vaciado                                                                                                                                          |
| `systemPrompt`              | integrado                  | prompt de sistema adicional anexado para el turno de vaciado                                                                                                                         |

Notas:

- El prompt/prompt de sistema predeterminado incluye una indicación `NO_REPLY` para suprimir la entrega.
- Cuando `model` está definido, el turno de vaciado usa ese modelo sin heredar la cadena de respaldo de la sesión activa, de modo que las tareas de mantenimiento solo locales no recurran silenciosamente a un modelo de conversación de pago si fallan.
- El vaciado se ejecuta una vez por ciclo de Compaction (registrado en `sessions.json`).
- El vaciado se ejecuta solo para sesiones integradas de OpenClaw; los backends de CLI y los turnos de Heartbeat lo omiten.
- El vaciado se omite cuando el área de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver la estructura de archivos del área de trabajo y los patrones de escritura.

OpenClaw expone un hook `session_before_compact` en la API de extensión, pero la lógica de vaciado anterior vive del lado del Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), no en ese hook.

## Lista de comprobación para solucionar problemas

- **¿Clave de sesión incorrecta?** Empieza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- **¿Diferencia entre almacén y transcripción?** Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- **¿Exceso de Compaction?** Revisa la ventana de contexto del modelo (si es demasiado pequeña, fuerza Compaction frecuente), `reserveTokens` (si es demasiado alto para la ventana del modelo, provoca Compaction antes) y el aumento excesivo de resultados de herramientas (ajusta la depuración de la sesión).
- **¿Cada prompt parece desbordarse en un modelo local pequeño?** El valor predeterminado de `reserveTokensFloor` (20000) se limita automáticamente a una fracción segura de la ventana de contexto, pero un `reserveTokens` explícito establecido por encima de la propia ventana no se limita: redúcelo o elimínalo.
- **¿Turnos silenciosos con filtraciones?** Confirma que la respuesta empieza con el token silencioso exacto `NO_REPLY` (sin distinguir mayúsculas y minúsculas) y que usas una compilación que incluye la corrección de supresión de streaming (`2026.1.10`+).

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Depuración de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
- [Referencia de configuración de agentes](/es/gateway/config-agents)
