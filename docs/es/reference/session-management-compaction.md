---
read_when:
    - Necesitas depurar identificadores de sesión, JSONL de transcripción o campos de sessions.json
    - Estás cambiando el comportamiento de auto-Compaction o agregando mantenimiento de “pre-Compaction”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis profundo: almacén de sesiones y transcripciones, ciclo de vida e internals de (auto)Compaction'
title: Análisis profundo de la gestión de sesiones
x-i18n:
    generated_at: "2026-06-27T12:54:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw administra sesiones de extremo a extremo en estas áreas:

- **Enrutamiento de sesiones** (cómo se asignan los mensajes entrantes a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (manual y automática) y dónde enganchar el trabajo previo a la Compaction
- **Mantenimiento silencioso** (escrituras de memoria que no deben producir salida visible para el usuario)

Si quieres primero una descripción general de más alto nivel, empieza con:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado alrededor de un único **proceso Gateway** que posee el estado de las sesiones.

- Las UI (app de macOS, Control UI web, TUI) deben consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; "revisar tus archivos locales del Mac" no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o eliminar entradas)
   - Rastrea metadatos de sesión (id de sesión actual, última actividad, conmutadores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de Compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros
   - Los puntos de control de Compaction son metadatos sobre la transcripción
     sucesora compactada. Las nuevas compactaciones no escriben una segunda copia
     `.checkpoint.*.jsonl`.

Los lectores del historial del Gateway deben evitar materializar toda la transcripción salvo que
la superficie necesite explícitamente acceso histórico arbitrario. El historial de primera página,
el historial de chat incrustado, la recuperación tras reinicio y las comprobaciones de tokens/uso usan lecturas
de cola acotadas. Los escaneos completos de transcripciones pasan por el índice asíncrono de transcripciones, que se
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

La persistencia de sesiones tiene controles automáticos de mantenimiento (`session.maintenance`) para `sessions.json`, artefactos de transcripciones y sidecars de trayectorias:

- `mode`: `enforce` (predeterminado) o `warn`
- `pruneAfter`: corte de antigüedad de entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- La retención de sondeos de ejecución de modelo del Gateway de corta duración está fijada en `24h`, pero está controlada por presión: solo elimina filas de sondeo estricto obsoletas cuando se alcanza la presión de mantenimiento/límite de entradas de sesión. Esto se aplica solo a claves de sondeo explícitas estrictas que coinciden con `agent:*:explicit:model-run-<uuid>` y se ejecuta antes de la limpieza/limitación global de entradas obsoletas cuando se ejecuta.
- `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` deshabilita la limpieza)
- `maxDiskBytes`: presupuesto opcional del directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Las escrituras normales del Gateway fluyen por un escritor de sesión por almacén que serializa mutaciones en proceso sin tomar un bloqueo de archivo en tiempo de ejecución. Los helpers de parches en rutas críticas toman prestada la caché mutable validada mientras mantienen ese turno del escritor, por lo que los archivos `sessions.json` grandes no se clonan ni se vuelven a leer para cada actualización de metadatos. El código de tiempo de ejecución debe preferir `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; los guardados directos del almacén completo son herramientas de compatibilidad y mantenimiento sin conexión. Cuando se puede alcanzar un Gateway, `openclaw sessions cleanup` y `openclaw agents delete` sin `--dry-run` delegan las mutaciones del almacén al Gateway para que la limpieza se una a la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para el mantenimiento directo de archivos. La limpieza de `maxEntries` sigue agrupada por lotes para límites de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de marca alta lo reescriba por debajo. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el inicio del Gateway; usa escrituras u `openclaw sessions cleanup --enforce` para la limpieza. `openclaw sessions cleanup --enforce` aún aplica el límite configurado inmediatamente y poda artefactos antiguos de transcripciones, puntos de control y trayectorias no referenciados incluso cuando no hay un presupuesto de disco configurado.

El mantenimiento conserva punteros duraderos a conversaciones externas, como sesiones de grupo
y sesiones de chat con ámbito de hilo, pero las entradas sintéticas de tiempo de ejecución para cron, hooks,
Heartbeat, ACP y subagentes aún pueden eliminarse cuando superan la
antigüedad, el recuento o el presupuesto de disco configurados. Las sesiones de sondeo de ejecución de modelo del Gateway usan la
retención de ejecución de modelo separada de `24h` solo cuando su clave coincide exactamente con
`agent:*:explicit:model-run-<uuid>`; otras sesiones explícitas no forman parte de
esa retención. La limpieza de ejecución de modelo se aplica solo bajo presión del límite de entradas
de sesión. Las ejecuciones cron aisladas mantienen su propio control `cron.sessionRetention`,
independiente de la retención de sondeos de ejecución de modelo.

OpenClaw ya no crea copias de seguridad automáticas con rotación `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Las mutaciones de transcripciones usan un bloqueo de escritura de sesión en el archivo de transcripción. La adquisición del bloqueo espera hasta
`session.writeLock.acquireTimeoutMs` antes de exponer un error de sesión ocupada; el valor predeterminado es `60000`
ms. Auméntalo solo cuando trabajos legítimos de preparación, limpieza, Compaction o espejo de transcripciones compitan
durante más tiempo en máquinas lentas. `session.writeLock.staleMs` controla cuándo un bloqueo existente puede
recuperarse como obsoleto; el valor predeterminado es `1800000` ms. `session.writeLock.maxHoldMs` controla el
umbral de liberación del watchdog en proceso; el valor predeterminado es `300000` ms. Las sobrescrituras de emergencia por env son
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` y
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos archivados más antiguos, transcripciones huérfanas o trayectorias huérfanas.
2. Si sigue por encima del objetivo, expulsar las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Continuar hasta que el uso esté en `highWaterBytes` o por debajo.

En `mode: "warn"`, OpenClaw informa de posibles expulsiones pero no muta el almacén/los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones cron y registros de ejecución

Las ejecuciones cron aisladas también crean entradas/transcripciones de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) poda sesiones antiguas de ejecuciones cron aisladas del almacén de sesiones (`false` lo deshabilita).
- `cron.runLog.keepLines` poda filas de historial de ejecución de SQLite retenidas por trabajo cron (predeterminado: `2000`). `cron.runLog.maxBytes` sigue aceptándose para registros de ejecución antiguos respaldados por archivos.

Cuando cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión
`cron:<jobId>` anterior antes de escribir la nueva fila. Conserva preferencias seguras
como configuración de pensamiento/rápido/detallado, etiquetas y sobrescrituras explícitas
de modelo/autenticación seleccionadas por el usuario. Descarta contexto de conversación ambiental como
enrutamiento de canal/grupo, política de envío o cola, elevación, origen y vinculación de tiempo de ejecución
ACP para que una ejecución aislada nueva no pueda heredar entrega obsoleta ni autoridad de
tiempo de ejecución de una ejecución anterior.

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué contenedor de conversación_ estás (enrutamiento + aislamiento).

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

- **Restablecer** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado a las 4:00 AM hora local en el host del Gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Caducidad por inactividad** (`session.reset.idleMinutes` o heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando diario + inactividad están configurados, gana lo que caduque primero.
- **Reanudación por reconexión de Control UI** puede preservar la sesión actualmente visible para un envío de reconexión cuando el Gateway recibe el `sessionId` correspondiente de un cliente de UI de operador. Los envíos obsoletos ordinarios aún crean un nuevo `sessionId`.
- **Eventos del sistema** (Heartbeat, reactivaciones cron, notificaciones exec, contabilidad del Gateway) pueden mutar la fila de sesión pero no extienden la frescura de restablecimiento diario/inactivo. La rotación de restablecimiento descarta los avisos de eventos del sistema en cola para la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación de padre** usa la rama activa de OpenClaw al crear una bifurcación de hilo o subagente. Si esa rama es demasiado grande, OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar historial inutilizable. La política de dimensionamiento es automática; la configuración heredada `session.parentForkMaxTokens` es eliminada por `openclaw doctor --fix`.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivo):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de este salvo que se configure `sessionFile`)
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la frescura del restablecimiento diario
  usa esto. Las filas heredadas pueden derivarlo de la cabecera de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura del restablecimiento por inactividad
  usa esto para que Heartbeat, cron y eventos exec no mantengan vivas las sesiones.
  Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada
  para la frescura por inactividad.
- `updatedAt`: marca de tiempo de la última mutación de la fila del almacén, usada para listados, poda y
  contabilidad. No es la autoridad para la frescura de restablecimiento diario/inactivo.
- `sessionFile`: sobrescritura opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las UI y la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupo/canal
- Conmutadores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sobrescritura por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último volcado de memoria previo a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó el último volcado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas mientras se ejecutan las sesiones.

---

## Estructura de transcripciones (`*.jsonl`)

Las transcripciones son administradas por el `SessionManager` de `openclaw/plugin-sdk/agent-sessions`.

El archivo es JSONL:

- Primera línea: cabecera de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacables:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por la extensión que _sí_ entran en el contexto del modelo (pueden estar ocultos en la UI)
- `custom`: estado de la extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente **no** "corrige" las transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas móviles escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto viene del catálogo de modelos (y se puede sobrescribir mediante configuración).
- `contextTokens` en el almacén es una estimación/valor de reporte en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes.

Después de Compaction, los turnos futuros ven:

- El resumen de Compaction
- Los mensajes después de `firstKeptEntryId`

La reinyección de secciones de AGENTS.md después de Compaction es opcional mediante
`agents.defaults.compaction.postCompactionSections`; cuando no está definido o es `[]`,
OpenClaw no añade extractos de AGENTS.md encima del resumen de Compaction.

Compaction es **persistente** (a diferencia de la poda de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de Compaction, mantiene
las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw
  desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar
  el par.
- Si un bloque final de resultados de herramienta empujaría el fragmento por encima del objetivo,
  OpenClaw preserva ese bloque de herramientas pendiente y mantiene intacta la cola
  sin resumir.
- Los bloques de llamadas a herramientas abortados/con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la auto-Compaction (runtime de OpenClaw)

En el agente OpenClaw integrado, la auto-Compaction se activa en dos casos:

1. **Recuperación de desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
   Cuando el proveedor informa el recuento de tokens intentado, OpenClaw reenvía ese
   recuento observado a la Compaction de recuperación de desbordamiento. Si el proveedor confirma
   el desbordamiento pero no expone un recuento analizable, OpenClaw pasa un recuento sintético
   mínimamente por encima del presupuesto a los motores de Compaction y diagnósticos.
   Si la recuperación de desbordamiento sigue fallando, OpenClaw muestra orientación explícita al
   usuario y preserva la asignación de sesión actual en lugar de rotar silenciosamente
   la clave de sesión a un id de sesión nuevo. El siguiente paso queda controlado por el operador:
   reintentar el mensaje, ejecutar `/compact` o ejecutar `/new` cuando se prefiera
   una sesión nueva.
2. **Mantenimiento por umbral**: después de un turno exitoso, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Estas son semánticas del runtime de OpenClaw.

OpenClaw también puede activar una Compaction local previa antes de abrir la siguiente
ejecución cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido y el
archivo de transcripción activo alcanza ese tamaño. Es una protección de tamaño de archivo para el costo
de reapertura local, no archivado sin procesar: OpenClaw sigue ejecutando la Compaction semántica normal,
y requiere `truncateAfterCompaction` para que el resumen compactado pueda convertirse en una
nueva transcripción sucesora.

Para ejecuciones integradas de OpenClaw, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
añade una protección opcional del bucle de herramientas. Después de añadir un resultado de herramienta y antes de la
siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de presupuesto
previo usada al inicio del turno. Si el contexto ya no cabe, la protección no
compacta dentro del hook `transformContext` del runtime de OpenClaw. Genera una señal estructurada
de comprobación previa a mitad de turno, detiene el envío del prompt actual y deja que el
bucle de ejecución externo use la ruta de recuperación existente: truncar resultados de herramienta sobredimensionados
cuando eso baste, o activar el modo de Compaction configurado y reintentar. La
opción está deshabilitada de forma predeterminada y funciona con los modos de Compaction `default` y `safeguard`,
incluida la Compaction safeguard respaldada por proveedor.
Esto es independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta
antes de que se abra un turno, mientras que la comprobación previa a mitad de turno se ejecuta más tarde en el bucle de herramientas integrado de OpenClaw
después de que se hayan añadido nuevos resultados de herramienta.

---

## Ajustes de Compaction (`reserveTokens`, `keepRecentTokens`)

Los ajustes de Compaction del runtime de OpenClaw viven en la configuración del agente:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw también aplica un suelo de seguridad para ejecuciones integradas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- El suelo predeterminado es de `20000` tokens.
- Define `agents.defaults.compaction.reserveTokensFloor: 0` para deshabilitar el suelo.
- Si ya es más alto, OpenClaw lo deja igual.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens`
  explícito y conserva el punto de corte de cola reciente del runtime de OpenClaw. Sin un presupuesto de conservación explícito,
  la Compaction manual sigue siendo un punto de control estricto y el contexto reconstruido comienza desde
  el nuevo resumen.
- Define `agents.defaults.compaction.midTurnPrecheck.enabled: true` para ejecutar la
  comprobación previa opcional del bucle de herramientas después de nuevos resultados de herramienta y antes de la siguiente llamada al modelo.
  Esto es solo un disparador; la generación del resumen sigue usando la ruta de
  Compaction configurada. Es independiente de `maxActiveTranscriptBytes`, que es una
  protección por tamaño en bytes de la transcripción activa al inicio del turno.
- Define `agents.defaults.compaction.maxActiveTranscriptBytes` con un valor en bytes o
  una cadena como `"20mb"` para ejecutar Compaction local antes de un turno cuando la transcripción
  activa se vuelve grande. Esta protección solo está activa cuando
  `truncateAfterCompaction` también está habilitado. Déjalo sin definir o define `0` para
  deshabilitarla.
- Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  OpenClaw rota la transcripción activa a una JSONL sucesora compactada después de
  Compaction. Las acciones de punto de control de rama/restauración usan esa sucesora compactada;
  los archivos de punto de control heredados previos a Compaction siguen siendo legibles mientras estén referenciados.

Por qué: dejar suficiente margen para la "limpieza" multiturno (como escrituras de memoria) antes de que la Compaction se vuelva inevitable.

Implementación: `applyAgentCompactionSettingsFromConfig()` en `src/agents/agent-settings.ts`
(llamado desde las rutas de turno del ejecutor integrado y de configuración de Compaction).

---

## Proveedores de Compaction conectables

Los Plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API del plugin. Cuando `agents.defaults.compaction.provider` se define con un id de proveedor registrado, la extensión safeguard delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un Plugin proveedor de Compaction registrado. Déjalo sin definir para el resumen LLM predeterminado.
- Definir un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada.
- El safeguard sigue preservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado vuelve a destilar resúmenes anteriores con mensajes nuevos
  en lugar de preservar literalmente el resumen anterior completo.
- El modo safeguard habilita auditorías de calidad de resumen de forma predeterminada; define
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida mal formada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen LLM integrado.
- Las señales de aborto/tiempo de espera se vuelven a lanzar (no se silencian) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la Compaction y el estado de sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Registros del Gateway (`pnpm gateway:watch` u `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de Compaction

---

## Limpieza silenciosa (`NO_REPLY`)

OpenClaw admite turnos "silenciosos" para tareas en segundo plano donde el usuario no debería ver salida intermedia.

Convención:

- El asistente comienza su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar "no entregar una respuesta al usuario".
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión del token silencioso exacto no distingue mayúsculas y minúsculas, por lo que `NO_REPLY` y
  `no_reply` cuentan ambos cuando toda la carga es solo el token silencioso.
- Esto es solo para turnos verdaderamente en segundo plano/sin entrega; no es un atajo para
  solicitudes ordinarias accionables de usuarios.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, de modo que las operaciones silenciosas no filtren salida
parcial a mitad del turno.

---

## "Vaciado de memoria" previo a Compaction (implementado)

Objetivo: antes de que ocurra la auto-Compaction, ejecutar un turno agentic silencioso que escriba estado duradero
en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que Compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Supervisar el uso de contexto de la sesión.
2. Cuando cruza un "umbral suave" (por debajo del umbral de Compaction del runtime de OpenClaw), ejecutar una directiva silenciosa
   de "escribir memoria ahora" para el agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `model` (sobrescritura opcional exacta de proveedor/modelo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt de sistema adicional añadido para el turno de vaciado)

Notas:

- El prompt/prompt de sistema predeterminado incluye una pista `NO_REPLY` para suprimir
  la entrega.
- Cuando `model` está definido, el turno de vaciado usa ese modelo sin heredar la
  cadena de fallback de la sesión activa, de modo que la limpieza solo local no recae silenciosamente
  en un modelo de conversación de pago.
- El vaciado se ejecuta una vez por ciclo de Compaction (rastreado en `sessions.json`).
- El vaciado se ejecuta solo para sesiones integradas de OpenClaw (los backends de CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para el diseño de archivos del espacio de trabajo y los patrones de escritura.

OpenClaw también expone un hook `session_before_compact` en la API de extensión, pero la lógica de
vaciado de OpenClaw vive hoy en el lado del Gateway.

---

## Lista de comprobación para solución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- ¿Discordancia entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Compaction repetitiva? Comprueba:
  - ventana de contexto del modelo (demasiado pequeña)
  - ajustes de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede provocar Compaction más temprana)
  - exceso de resultados de herramientas: habilita/ajusta la poda de sesiones
- ¿Se filtran turnos silenciosos? Confirma que la respuesta empieza con `NO_REPLY` (token exacto sin distinguir mayúsculas y minúsculas) y que estás en una compilación que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
