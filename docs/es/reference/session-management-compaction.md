---
read_when:
    - Necesitas depurar los ID de sesión, el JSONL de transcripción o los campos de sessions.json
    - Estás cambiando el comportamiento de auto-compaction o agregando mantenimiento de “pre-compaction”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacén de sesiones y transcripciones, ciclo de vida e internals de (auto)Compaction'
title: Análisis detallado de la gestión de sesiones
x-i18n:
    generated_at: "2026-07-04T20:25:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestiona las sesiones de extremo a extremo en estas áreas:

- **Enrutamiento de sesiones** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (Compaction manual y automática) y dónde enganchar el trabajo previo a la Compaction
- **Mantenimiento silencioso** (escrituras de memoria que no deben producir salida visible para el usuario)

Si quieres primero una descripción general de más alto nivel, empieza con:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Descripción general de memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado en torno a un único **proceso Gateway** que es dueño del estado de sesión.

- Las interfaces de usuario (app de macOS, Interfaz de control web, TUI) deben consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; "revisar tus archivos locales de Mac" no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o de eliminar entradas)
   - Rastrea metadatos de sesión (id de sesión actual, última actividad, conmutadores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de compactación
   - Se usa para reconstruir el contexto del modelo en turnos futuros
   - Los puntos de control de Compaction son metadatos sobre la transcripción sucesora
     compactada. Las nuevas compactaciones no escriben una segunda copia
     `.checkpoint.*.jsonl`.

Los lectores de historial del Gateway deben evitar materializar toda la transcripción salvo que
la superficie necesite explícitamente acceso histórico arbitrario. El historial de primera página,
el historial de chat incrustado, la recuperación tras reinicio y las comprobaciones de tokens/uso usan lecturas
de cola acotadas. Los escaneos completos de transcripciones pasan por el índice de transcripciones asíncrono, que se
almacena en caché por ruta de archivo más `mtimeMs`/`size` y se comparte entre lectores concurrentes.

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw las resuelve mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles de mantenimiento automáticos (`session.maintenance`) para `sessions.json`, artefactos de transcripción y archivos auxiliares de trayectoria:

- `mode`: `enforce` (predeterminado) o `warn`
- `pruneAfter`: umbral de edad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- La retención de sondeos de ejecución de modelo de Gateway de corta vida está fijada en `24h`, pero está condicionada por presión: solo elimina filas obsoletas de sondeos estrictos cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Esto se aplica solo a claves estrictas de sondeo explícito que coinciden con `agent:*:explicit:model-run-<uuid>` y se ejecuta antes de la limpieza/límite global de entradas obsoletas cuando se ejecuta.
- `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional para el directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Las escrituras normales del Gateway pasan por un escritor de sesiones por almacén que serializa las mutaciones en proceso sin tomar un bloqueo de archivo en tiempo de ejecución. Los ayudantes de parcheo en rutas críticas toman prestada la caché mutable validada mientras conservan ese turno del escritor, por lo que los archivos `sessions.json` grandes no se clonan ni se releen en cada actualización de metadatos. El código en tiempo de ejecución debe preferir `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; los guardados directos del almacén completo son herramientas de compatibilidad y mantenimiento sin conexión. Cuando se puede alcanzar un Gateway, `openclaw sessions cleanup` y `openclaw agents delete` sin `--dry-run` delegan las mutaciones del almacén al Gateway para que la limpieza se una a la misma cola de escritor; `--store <path>` es la ruta explícita de reparación sin conexión para mantenimiento directo de archivos. La limpieza de `maxEntries` sigue estando agrupada para límites de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de nivel alto lo vuelva a reducir. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el inicio del Gateway; usa escrituras u `openclaw sessions cleanup --enforce` para la limpieza. `openclaw sessions cleanup --enforce` sigue aplicando el límite configurado de inmediato y poda artefactos antiguos no referenciados de transcripción, punto de control y trayectoria incluso cuando no hay ningún presupuesto de disco configurado.

El mantenimiento conserva punteros duraderos de conversaciones externas, como sesiones de grupo
y sesiones de chat con alcance de hilo, pero las entradas sintéticas en tiempo de ejecución para cron, hooks,
Heartbeat, ACP y subagentes todavía pueden eliminarse cuando exceden la
edad, el recuento o el presupuesto de disco configurados. Las sesiones de sondeo de ejecución de modelo de Gateway usan la
retención de ejecución de modelo separada de `24h` solo cuando su clave coincide exactamente con
`agent:*:explicit:model-run-<uuid>`; otras sesiones explícitas no forman parte de
esa retención. La limpieza de ejecución de modelo se aplica solo bajo presión del límite de entradas de sesión.
Las ejecuciones de Cron aisladas conservan su propio control `cron.sessionRetention`,
independiente de la retención de sondeos de ejecución de modelo.

OpenClaw ya no crea copias de seguridad automáticas de rotación `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Las mutaciones de transcripción usan un bloqueo de escritura de sesión en el archivo de transcripción. La adquisición del bloqueo espera hasta
`session.writeLock.acquireTimeoutMs` antes de mostrar un error de sesión ocupada; el valor predeterminado es `60000`
ms. Súbelo solo cuando trabajos legítimos de preparación, limpieza, Compaction o réplica de transcripción compitan
durante más tiempo en máquinas lentas. `session.writeLock.staleMs` controla cuándo un bloqueo existente puede
recuperarse como obsoleto; el valor predeterminado es `1800000` ms. `session.writeLock.maxHoldMs` controla el
umbral de liberación del vigilante en proceso; el valor predeterminado es `300000` ms. Las variables de entorno de emergencia son
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` y
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimina primero los artefactos archivados más antiguos, de transcripciones huérfanas o de trayectorias huérfanas.
2. Si aún está por encima del objetivo, expulsa las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Continúa hasta que el uso esté en o por debajo de `highWaterBytes`.

En `mode: "warn"`, OpenClaw informa posibles expulsiones, pero no muta el almacén/los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones de Cron y registros de ejecución

Las ejecuciones de Cron aisladas también crean entradas/transcripciones de sesión y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) poda sesiones antiguas de ejecuciones de Cron aisladas del almacén de sesiones (`false` desactiva).
- `cron.runLog.keepLines` poda filas de historial de ejecuciones SQLite retenidas por trabajo de cron (predeterminado: `2000`). `cron.runLog.maxBytes` sigue aceptándose para registros de ejecución antiguos respaldados por archivos.

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión
`cron:<jobId>` anterior antes de escribir la nueva fila. Conserva preferencias seguras
como ajustes de pensamiento/rápido/verboso, etiquetas y sobrescrituras explícitas de
modelo/autenticación seleccionadas por el usuario. Descarta contexto ambiental de conversación como
enrutamiento de canal/grupo, política de envío o cola, elevación, origen y vinculación de tiempo de ejecución
ACP para que una ejecución aislada nueva no pueda heredar entrega obsoleta o
autoridad de tiempo de ejecución de una ejecución anterior.

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué depósito de conversación_ estás (enrutamiento + aislamiento).

Patrones comunes:

- Chat principal/directo (por agente): `agent:<agentId>:<mainKey>` (predeterminado `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo que se sobrescriba)

Las reglas canónicas están documentadas en [/concepts/session](/es/concepts/session).

---

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas generales:

- **Restablecimiento** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado 4:00 AM hora local en el host del Gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Vencimiento por inactividad** (`session.reset.idleMinutes` o el heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando diario + inactividad están configurados, gana el que venza primero.
- **Reanudación por reconexión de la Interfaz de control** puede conservar la sesión visible actual durante un envío de reconexión cuando el Gateway recibe el `sessionId` coincidente de un cliente de UI de operador. Los envíos obsoletos ordinarios siguen creando un nuevo `sessionId`.
- **Eventos del sistema** (Heartbeat, despertares de Cron, notificaciones de exec, contabilidad del Gateway) pueden mutar la fila de sesión, pero no extienden la frescura del restablecimiento diario/por inactividad. El cambio de restablecimiento descarta los avisos de eventos del sistema encolados para la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación padre** usa la rama activa de OpenClaw al crear una bifurcación de hilo o subagente. Si esa rama es demasiado grande, OpenClaw inicia el hijo con contexto aislado en vez de fallar o heredar historial inutilizable. La política de dimensionamiento es automática; la configuración heredada `session.parentForkMaxTokens` se elimina mediante `openclaw doctor --fix`.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivo):

- `sessionId`: id de la transcripción actual (el nombre de archivo se deriva de esto salvo que se establezca `sessionFile`)
- `sessionStartedAt`: marca de tiempo de inicio para el `sessionId` actual; la frescura del
  reinicio diario usa esto. Las filas heredadas pueden derivarlo del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura del
  reinicio por inactividad usa esto para que los eventos de Heartbeat, Cron y exec no mantengan las sesiones
  activas. Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada
  para la frescura por inactividad.
- `updatedAt`: marca de tiempo de la última mutación de fila del almacén, usada para listar, depurar y
  tareas de mantenimiento. No es la autoridad para la frescura del reinicio diario/por inactividad.
- `archivedAt`: marca de tiempo de archivo opcional. Las sesiones archivadas permanecen en el almacén
  con su transcripción intacta y se excluyen de los listados activos normales.
- `pinnedAt`: marca de tiempo de fijado opcional. Las sesiones fijadas activas se ordenan antes que las
  sesiones no fijadas; archivar una sesión borra su fijado.
- Interoperabilidad con hilos de Codex: ambos campos siguen la forma de gestión de hilos de Codex —
  los booleanos `archived`/`pinned` en la transmisión siempre se derivan de la
  marca de tiempo y se sellan del lado del servidor, coincidiendo con la semántica de
  Codex `threads.archived_at` y la serialización camelCase. Las marcas de tiempo de OpenClaw son milisegundos
  epoch, mientras que Codex usa segundos epoch, por lo que los puentes convierten en el límite del plugin
  de codex. Codex aún no tiene API de fijado (`thread/archive`/`thread/unarchive`
  solamente); el estado fijado permanece del lado de OpenClaw hasta que exista una, momento en el cual la
  forma coincidente permite que las sesiones vinculadas hagan ida y vuelta del estado fijado mecánicamente.
- `sessionFile`: anulación opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las IU y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para el etiquetado de grupos/canales
- Alternadores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (anulación por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: con qué frecuencia se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último volcado de memoria previo a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó el último volcado

El almacén se puede editar con seguridad, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas mientras se ejecutan las sesiones.

---

## Estructura de transcripción (`*.jsonl`)

Las transcripciones son gestionadas por el `SessionManager` de `openclaw/plugin-sdk/agent-sessions`.

El archivo es JSONL:

- Primera línea: encabezado de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacables:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse de la IU)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama de árbol

OpenClaw intencionalmente **no** "arregla" transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesión**: estadísticas continuas escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto proviene del catálogo de modelos (y se puede anular mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes.

Después de la Compaction, los turnos futuros ven:

- El resumen de Compaction
- Mensajes posteriores a `firstKeptEntryId`

La reinyección de la sección AGENTS.md después de la Compaction es opcional mediante
`agents.defaults.compaction.postCompactionSections`; cuando no está establecido o es `[]`,
OpenClaw no añade extractos de AGENTS.md encima del resumen de Compaction.

Compaction es **persistente** (a diferencia de la depuración de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de Compaction, mantiene
las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw
  desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar
  el par.
- Si un bloque final de resultados de herramienta de otro modo empujaría el fragmento por encima del objetivo,
  OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la cola sin resumir.
- Los bloques de llamadas a herramientas abortadas/con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la Compaction automática (tiempo de ejecución de OpenClaw)

En el agente OpenClaw embebido, la auto-Compaction se activa en dos casos:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
   Cuando el proveedor informa el recuento de tokens intentado, OpenClaw reenvía ese
   recuento observado a la Compaction de recuperación por desbordamiento. Si el proveedor confirma
   el desbordamiento pero no expone un recuento analizable, OpenClaw pasa un recuento sintético
   mínimamente por encima del presupuesto a los motores de Compaction y a los diagnósticos.
   Si la recuperación por desbordamiento sigue fallando, OpenClaw muestra una guía explícita al
   usuario y conserva la asignación de sesión actual en lugar de rotar silenciosamente
   la clave de sesión a un id de sesión nuevo. El siguiente paso lo controla el operador:
   reintentar el mensaje, ejecutar `/compact` o ejecutar `/new` cuando se prefiera una sesión
   nueva.
2. **Mantenimiento de umbral**: después de un turno correcto, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Estas son semánticas del runtime de OpenClaw.

OpenClaw también puede activar una Compaction local de preflight antes de abrir la siguiente
ejecución cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está configurado y el
archivo de transcripción activa alcanza ese tamaño. Esto es una protección de tamaño de archivo para el
costo de reapertura local, no archivado en bruto: OpenClaw sigue ejecutando la Compaction semántica
normal, y requiere `truncateAfterCompaction` para que el resumen compactado pueda convertirse en una
nueva transcripción sucesora.

Para ejecuciones embebidas de OpenClaw, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
agrega una protección opt-in del bucle de herramientas. Después de anexar el resultado de una herramienta y antes de la
siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de presupuesto
de preflight utilizada al inicio del turno. Si el contexto ya no cabe, la protección no
compacta dentro del hook `transformContext` del runtime de OpenClaw. Emite una señal estructurada
de precheck a mitad de turno, detiene el envío del prompt actual y deja que el
bucle de ejecución externo use la ruta de recuperación existente: truncar resultados de herramientas sobredimensionados
cuando eso sea suficiente, o activar el modo de Compaction configurado y reintentar. La
opción está deshabilitada de forma predeterminada y funciona con los modos de Compaction `default` y `safeguard`,
incluida la Compaction safeguard respaldada por proveedor.
Esto es independiente de `maxActiveTranscriptBytes`: la protección de tamaño en bytes se ejecuta
antes de que se abra un turno, mientras que el precheck a mitad de turno se ejecuta más tarde en el bucle de herramientas
embebido de OpenClaw, después de que se hayan anexado nuevos resultados de herramientas.

---

## Configuración de Compaction (`reserveTokens`, `keepRecentTokens`)

La configuración de Compaction del runtime de OpenClaw vive en la configuración del agente:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw también aplica un piso de seguridad para ejecuciones embebidas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- El piso predeterminado es de `20000` tokens.
- Establece `agents.defaults.compaction.reserveTokensFloor: 0` para deshabilitar el piso.
- Si ya es más alto, OpenClaw lo deja sin cambios.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens`
  explícito y conserva el punto de corte de cola reciente del runtime de OpenClaw. Sin un presupuesto de conservación explícito,
  la Compaction manual sigue siendo un checkpoint estricto y el contexto reconstruido comienza desde
  el nuevo resumen.
- Establece `agents.defaults.compaction.midTurnPrecheck.enabled: true` para ejecutar el
  precheck opcional del bucle de herramientas después de nuevos resultados de herramientas y antes de la siguiente llamada al modelo.
  Esto es solo un activador; la generación del resumen sigue usando la ruta de
  Compaction configurada. Es independiente de `maxActiveTranscriptBytes`, que es una
  protección de tamaño en bytes de la transcripción activa al inicio del turno.
- Establece `agents.defaults.compaction.maxActiveTranscriptBytes` en un valor en bytes o
  una cadena como `"20mb"` para ejecutar Compaction local antes de un turno cuando la transcripción
  activa se vuelve grande. Esta protección solo está activa cuando
  `truncateAfterCompaction` también está habilitado. Déjalo sin configurar o establécelo en `0` para
  deshabilitarlo.
- Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  OpenClaw rota la transcripción activa a un JSONL sucesor compactado después de la
  Compaction. Las acciones de checkpoint de rama/restauración usan ese sucesor compactado;
  los archivos de checkpoint heredados previos a la Compaction siguen siendo legibles mientras estén referenciados.

Por qué: dejar suficiente margen para el "mantenimiento" multiturno (como escrituras de memoria) antes de que la Compaction se vuelva inevitable.

Implementación: `applyAgentCompactionSettingsFromConfig()` en `src/agents/agent-settings.ts`
(llamado desde las rutas de configuración de turno de ejecutor embebido y de Compaction).

---

## Proveedores de Compaction conectables

Los Plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API del Plugin. Cuando `agents.defaults.compaction.provider` se establece en un id de proveedor registrado, la extensión safeguard delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un Plugin proveedor de Compaction registrado. Déjalo sin configurar para el resumen LLM predeterminado.
- Establecer un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada.
- Safeguard sigue conservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado vuelve a destilar resúmenes anteriores con mensajes nuevos
  en lugar de preservar textualmente el resumen anterior completo.
- El modo safeguard habilita auditorías de calidad del resumen de forma predeterminada; establece
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida mal formada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw vuelve automáticamente al resumen LLM integrado.
- Las señales de cancelación/tiempo de espera se vuelven a lanzar (no se absorben) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la Compaction y el estado de sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Registros de Gateway (`pnpm gateway:watch` u `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de Compaction

---

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos "silenciosos" para tareas en segundo plano donde el usuario no debería ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar "no entregar una respuesta al usuario".
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas y minúsculas, por lo que `NO_REPLY` y
  `no_reply` cuentan ambos cuando toda la carga útil es solo el token silencioso.
- Esto es solo para turnos verdaderamente en segundo plano/sin entrega; no es un atajo para
  solicitudes de usuario accionables ordinarias.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, de modo que las operaciones silenciosas no filtren salida
parcial a mitad del turno.

---

## "Vaciado de memoria" previo a Compaction (implementado)

Objetivo: antes de que ocurra la Compaction automática, ejecutar un turno agéntico silencioso que escriba estado
duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Supervisar el uso del contexto de la sesión.
2. Cuando cruza un "umbral suave" (por debajo del umbral de Compaction del runtime de OpenClaw), ejecutar una directiva silenciosa
   "escribe memoria ahora" para el agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `model` (anulación opcional exacta de proveedor/modelo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt de sistema adicional añadido para el turno de vaciado)

Notas:

- El prompt/prompt de sistema predeterminado incluye una indicación `NO_REPLY` para suprimir
  la entrega.
- Cuando `model` está configurado, el turno de vaciado usa ese modelo sin heredar la cadena de fallback
  de la sesión activa, de modo que el mantenimiento solo local no haga fallback silenciosamente
  a un modelo de conversación de pago.
- El vaciado se ejecuta una vez por ciclo de Compaction (seguido en `sessions.json`).
- El vaciado se ejecuta solo para sesiones incrustadas de OpenClaw (los backends de CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver el diseño de archivos del espacio de trabajo y los patrones de escritura.

OpenClaw también expone un hook `session_before_compact` en la API de extensión, pero la lógica de
vaciado de OpenClaw vive hoy del lado del Gateway.

---

## Lista de verificación de solución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- ¿Discordancia entre almacén y transcripción? Confirma el host de Gateway y la ruta del almacén desde `openclaw status`.
- ¿Spam de Compaction? Revisa:
  - ventana de contexto del modelo (demasiado pequeña)
  - ajustes de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar una Compaction más temprana)
  - exceso de resultados de herramientas: habilita/ajusta la poda de sesión
- ¿Turnos silenciosos con filtraciones? Confirma que la respuesta empieza con `NO_REPLY` (token exacto sin distinción de mayúsculas/minúsculas) y que estás en una compilación que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesión](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
