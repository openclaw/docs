---
read_when:
    - Necesitas depurar identificadores de sesión, JSONL de transcripciones o campos de sessions.json
    - Estás cambiando el comportamiento de compactación automática o agregando mantenimiento de "precompactación"
    - Quiere implementar vaciados de memoria o turnos de sistema silenciosos
summary: 'Análisis profundo: almacén de sesiones + transcripciones, ciclo de vida y detalles internos de (auto)Compaction'
title: Análisis detallado de la gestión de sesiones
x-i18n:
    generated_at: "2026-05-11T20:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestiona sesiones de extremo a extremo en estas áreas:

- **Enrutamiento de sesiones** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (correcciones específicas del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (manual y automática) y dónde conectar el trabajo previo a la Compaction
- **Mantenimiento silencioso** (escrituras de memoria que no deben producir salida visible para el usuario)

Si primero quieres una descripción general de más alto nivel, empieza por:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Descripción general de la memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado alrededor de un único **proceso Gateway** que posee el estado de sesión.

- Las IU (aplicación macOS, IU web de Control, TUI) deben consultar al Gateway las listas de sesiones y los recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; "revisar tus archivos locales del Mac" no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o de eliminar entradas)
   - Rastrea metadatos de sesión (id de sesión actual, última actividad, conmutadores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de Compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros
   - Los puntos de control de depuración grandes previos a la Compaction se omiten una vez que la transcripción
     activa supera el límite de tamaño de puntos de control, lo que evita una segunda copia gigante
     `.checkpoint.*.jsonl`.

Los lectores de historial del Gateway deben evitar materializar toda la transcripción a menos que
la superficie necesite explícitamente acceso arbitrario al historial. El historial de primera página,
el historial de chat incrustado, la recuperación tras reinicio y las comprobaciones de tokens/uso usan lecturas
acotadas de la cola. Los escaneos completos de transcripciones pasan por el índice asíncrono de transcripciones, que se
almacena en caché por ruta de archivo más `mtimeMs`/`size` y se comparte entre lectores concurrentes.

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de tema de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw las resuelve mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles de mantenimiento automáticos (`session.maintenance`) para `sessions.json`, artefactos de transcripción y anexos de trayectoria:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: umbral de antigüedad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional para el directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Las escrituras normales del Gateway fluyen por un escritor de sesiones por almacén que serializa las mutaciones en proceso sin tomar un bloqueo de archivo en tiempo de ejecución. Los helpers de parcheo en rutas críticas toman prestada la caché mutable validada mientras mantienen ese turno del escritor, de modo que los archivos `sessions.json` grandes no se clonan ni se releen para cada actualización de metadatos. El código de tiempo de ejecución debe preferir `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; los guardados directos de todo el almacén son herramientas de compatibilidad y mantenimiento sin conexión. Cuando se puede alcanzar un Gateway, `openclaw sessions cleanup` sin simulación y `openclaw agents delete` delegan las mutaciones del almacén al Gateway para que la limpieza se una a la misma cola de escritores; `--store <path>` es la ruta explícita de reparación sin conexión para el mantenimiento directo de archivos. La limpieza de `maxEntries` sigue estando agrupada para límites de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de marca alta lo vuelva a reducir. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el inicio del Gateway; usa escrituras u `openclaw sessions cleanup --enforce` para limpiar. `openclaw sessions cleanup --enforce` sigue aplicando el límite configurado de inmediato y poda artefactos antiguos no referenciados de transcripción, puntos de control y trayectoria incluso cuando no hay presupuesto de disco configurado.

El mantenimiento conserva punteros duraderos a conversaciones externas, como sesiones de grupo
y sesiones de chat con alcance de hilo, pero las entradas sintéticas de tiempo de ejecución para cron, hooks,
Heartbeat, ACP y subagentes aún pueden eliminarse cuando superan la
antigüedad, el recuento o el presupuesto de disco configurados.

OpenClaw ya no crea automáticamente copias de seguridad rotativas `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Las mutaciones de transcripción usan un bloqueo de escritura de sesión en el archivo de transcripción. La adquisición del bloqueo espera hasta
`session.writeLock.acquireTimeoutMs` antes de mostrar un error de sesión ocupada; el valor predeterminado es `60000`
ms. Auméntalo solo cuando trabajo legítimo de preparación, limpieza, Compaction o espejo de transcripción compita
durante más tiempo en máquinas lentas. La detección de bloqueos obsoletos y las advertencias de retención máxima siguen siendo políticas separadas.

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimina primero los artefactos archivados más antiguos, transcripciones huérfanas o trayectorias huérfanas.
2. Si sigue por encima del objetivo, expulsa las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Continúa hasta que el uso esté en `highWaterBytes` o por debajo.

En `mode: "warn"`, OpenClaw informa de posibles expulsiones, pero no muta el almacén ni los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones Cron y registros de ejecución

Las ejecuciones Cron aisladas también crean entradas/transcripciones de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) poda las sesiones antiguas de ejecuciones Cron aisladas del almacén de sesiones (`false` lo desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (valores predeterminados: `2_000_000` bytes y `2000` líneas).

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión
`cron:<jobId>` anterior antes de escribir la nueva fila. Conserva preferencias seguras
como ajustes de pensamiento/rápido/verbose, etiquetas y anulaciones explícitas
de modelo/autenticación seleccionadas por el usuario. Descarta contexto ambiental de conversación, como
enrutamiento de canal/grupo, política de envío o cola, elevación, origen y vinculación de tiempo de ejecución de ACP,
para que una nueva ejecución aislada no pueda heredar entrega obsoleta ni
autoridad de tiempo de ejecución de una ejecución anterior.

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué contenedor de conversación_ estás (enrutamiento + aislamiento).

Patrones comunes:

- Chat principal/directo (por agente): `agent:<agentId>:<mainKey>` (predeterminado `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que se anule)

Las reglas canónicas están documentadas en [/concepts/session](/es/concepts/session).

---

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas prácticas:

- **Restablecimiento** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Caducidad por inactividad** (`session.reset.idleMinutes` o heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando diario + inactividad están configurados, gana lo que caduque primero.
- **Eventos del sistema** (Heartbeat, despertares Cron, notificaciones de exec, tareas internas del gateway) pueden mutar la fila de sesión, pero no extienden la frescura del restablecimiento diario/por inactividad. El paso al siguiente restablecimiento descarta los avisos de eventos del sistema en cola para la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación del padre** usa la rama activa de Pi al crear un hilo o una bifurcación de subagente. Si esa rama es demasiado grande, OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar historial inutilizable. La política de dimensionamiento es automática; la configuración heredada `session.parentForkMaxTokens` es eliminada por `openclaw doctor --fix`.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivo):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de esto a menos que `sessionFile` esté definido)
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la frescura del restablecimiento diario
  usa esto. Las filas heredadas pueden derivarlo de la cabecera de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura del restablecimiento
  por inactividad usa esto para que Heartbeat, Cron y eventos exec no mantengan vivas
  las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada
  para la frescura por inactividad.
- `updatedAt`: marca de tiempo de la última mutación de fila del almacén, usada para listar, podar y
  tareas internas. No es la autoridad para la frescura de restablecimiento diario/por inactividad.
- `sessionFile`: anulación opcional explícita de ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las IU y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupo/canal
- Conmutadores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (anulación por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último vaciado de memoria previo a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó el último vaciado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas mientras se ejecutan las sesiones.

---

## Estructura de transcripción (`*.jsonl`)

Las transcripciones son gestionadas por `SessionManager` de `@earendil-works/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: cabecera de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacables:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse de la IU)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionadamente **no** "corrige" transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas móviles escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto viene del catálogo de modelos (y puede anularse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes.

Después de la Compaction, los turnos futuros ven:

- El resumen de Compaction
- Mensajes posteriores a `firstKeptEntryId`

Compaction es **persistente** (a diferencia de la poda de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de Compaction, mantiene
las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult`
correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw
  desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar
  el par.
- Si un bloque final de resultado de herramienta empujara el fragmento por encima del objetivo,
  OpenClaw conserva ese bloque de herramienta pendiente y mantiene intacta la cola
  sin resumir.
- Los bloques de llamadas a herramientas abortadas o con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la auto-Compaction (runtime de Pi)

En el agente Pi embebido, la auto-Compaction se activa en dos casos:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
2. **Mantenimiento por umbral**: después de un turno correcto, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Esta es semántica del runtime de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

OpenClaw también puede activar una Compaction local previa antes de abrir la siguiente
ejecución cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido y el
archivo de transcripción activa alcanza ese tamaño. Esta es una protección de tamaño de archivo para el coste de
reapertura local, no archivado sin procesar: OpenClaw sigue ejecutando la Compaction semántica normal,
y requiere `truncateAfterCompaction` para que el resumen compactado pueda convertirse en una
nueva transcripción sucesora.

Para ejecuciones embebidas de Pi, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
añade una protección opcional del bucle de herramientas. Después de que se agrega un resultado de herramienta y antes de la
siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de presupuesto
previa que se usa al inicio del turno. Si el contexto ya no cabe, la protección
no compacta dentro del hook `transformContext` de Pi. Emite una señal estructurada
de comprobación previa a mitad de turno, detiene el envío del prompt actual y permite que el
bucle de ejecución externo use la ruta de recuperación existente: truncar resultados de herramientas sobredimensionados
cuando eso sea suficiente, o activar el modo de Compaction configurado y reintentar. La
opción está desactivada de forma predeterminada y funciona con los modos de Compaction `default` y `safeguard`,
incluida la Compaction `safeguard` respaldada por proveedor.
Esto es independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta
antes de que se abra un turno, mientras que la comprobación previa a mitad de turno se ejecuta más tarde en el bucle de herramientas
embebido de Pi después de que se hayan agregado nuevos resultados de herramientas.

---

## Configuración de Compaction (`reserveTokens`, `keepRecentTokens`)

La configuración de Compaction de Pi vive en la configuración de Pi:

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

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo incrementa.
- El piso predeterminado es de `20000` tokens.
- Define `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el piso.
- Si ya es más alto, OpenClaw lo deja como está.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito
  y mantiene el punto de corte de cola reciente de Pi. Sin un presupuesto explícito de conservación,
  la Compaction manual sigue siendo un punto de control estricto y el contexto reconstruido empieza desde
  el nuevo resumen.
- Define `agents.defaults.compaction.midTurnPrecheck.enabled: true` para ejecutar la
  comprobación previa opcional del bucle de herramientas después de nuevos resultados de herramientas y antes de la siguiente llamada al modelo.
  Esto solo es un activador; la generación del resumen sigue usando la ruta de Compaction
  configurada. Es independiente de `maxActiveTranscriptBytes`, que es una
  protección de tamaño en bytes de la transcripción activa al inicio del turno.
- Define `agents.defaults.compaction.maxActiveTranscriptBytes` con un valor en bytes o una
  cadena como `"20mb"` para ejecutar Compaction local antes de un turno cuando la transcripción
  activa se vuelva grande. Esta protección solo está activa cuando
  `truncateAfterCompaction` también está habilitado. Déjalo sin definir o configúralo en `0` para
  desactivarlo.
- Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  OpenClaw rota la transcripción activa a un JSONL sucesor compactado después de la
  Compaction. La transcripción completa antigua permanece archivada y enlazada desde el
  punto de control de Compaction en lugar de reescribirse en el lugar.

Por qué: dejar suficiente margen para "tareas de mantenimiento" de varios turnos (como escrituras de memoria) antes de que la Compaction sea inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de Compaction conectables

Los Plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API del Plugin. Cuando `agents.defaults.compaction.provider` se define con un id de proveedor registrado, la extensión de protección delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un Plugin proveedor de Compaction registrado. Déjalo sin definir para el resumen LLM predeterminado.
- Definir un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de conservación de identificadores que la ruta integrada.
- La protección sigue conservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen integrado de protección vuelve a destilar resúmenes previos con mensajes nuevos
  en lugar de conservar literalmente el resumen anterior completo.
- El modo de protección habilita las auditorías de calidad del resumen de forma predeterminada; define
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida mal formada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw vuelve automáticamente al resumen LLM integrado.
- Las señales de aborto/tiempo de espera se vuelven a lanzar (no se silencian) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la Compaction y el estado de sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Registros del Gateway (`pnpm gateway:watch` u `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de Compaction

---

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos "silenciosos" para tareas en segundo plano en las que el usuario no debería ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar "no entregar una respuesta al usuario".
- OpenClaw elimina/suprime esto en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas y minúsculas, por lo que `NO_REPLY` y
  `no_reply` cuentan cuando toda la carga útil es solo el token silencioso.
- Esto es solo para turnos reales en segundo plano/sin entrega; no es un atajo para
  solicitudes de usuario ordinarias que requieren acción.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial empieza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida parcial
a mitad de turno.

---

## "Vaciado de memoria" previo a la Compaction (implementado)

Objetivo: antes de que ocurra la auto-Compaction, ejecutar un turno agéntico silencioso que escriba estado
duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Monitorear el uso de contexto de la sesión.
2. Cuando cruza un "umbral blando" (por debajo del umbral de Compaction de Pi), ejecutar una directiva silenciosa
   de "escribir memoria ahora" para el agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `model` (sobrescritura opcional exacta de proveedor/modelo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt del sistema adicional anexado para el turno de vaciado)

Notas:

- El prompt/prompt del sistema predeterminado incluye una sugerencia `NO_REPLY` para suprimir
  la entrega.
- Cuando `model` está definido, el turno de vaciado usa ese modelo sin heredar la
  cadena de respaldo de la sesión activa, por lo que el mantenimiento solo local no recae silenciosamente
  en un modelo de conversación de pago.
- El vaciado se ejecuta una vez por ciclo de Compaction (registrado en `sessions.json`).
- El vaciado se ejecuta solo para sesiones embebidas de Pi (los backends de CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para el diseño de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de extensión, pero la lógica de
vaciado de OpenClaw vive hoy del lado del Gateway.

---

## Lista de comprobación para solucionar problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- ¿Desajuste entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Exceso de Compaction? Comprueba:
  - ventana de contexto del modelo (demasiado pequeña)
  - configuración de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar Compaction más temprana)
  - crecimiento excesivo de resultados de herramientas: habilita/ajusta la poda de sesiones
- ¿Turnos silenciosos con filtraciones? Confirma que la respuesta empieza con `NO_REPLY` (token exacto sin distinguir mayúsculas y minúsculas) y que estás en una compilación que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
