---
read_when:
    - Necesitas depurar identificadores de sesión, JSONL de transcripciones o campos de sessions.json
    - Estás cambiando el comportamiento de auto-Compaction o agregando mantenimiento "pre-Compaction"
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacén de sesiones + transcripciones, ciclo de vida y detalles internos de la (auto)Compaction'
title: Análisis profundo de la gestión de sesiones
x-i18n:
    generated_at: "2026-05-06T05:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw administra sesiones de extremo a extremo en estas áreas:

- **Enrutamiento de sesiones** (cómo se asignan los mensajes entrantes a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y lo que registra
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens registrados)
- **Compaction** (manual y automática) y dónde enganchar trabajo previo a la Compaction
- **Mantenimiento silencioso** (escrituras de memoria que no deben producir salida visible para el usuario)

Si quieres primero una vista general de más alto nivel, empieza por:

- [Administración de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado en torno a un único **proceso Gateway** que posee el estado de sesión.

- Las interfaces de usuario (app de macOS, Control UI web, TUI) deben consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; "revisar los archivos locales de tu Mac" no reflejará lo que usa el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o de eliminar entradas)
   - Registra metadatos de sesión (id de sesión actual, última actividad, conmutadores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de Compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros
   - Los puntos de control de depuración grandes previos a la Compaction se omiten una vez que la transcripción
     activa supera el límite de tamaño de puntos de control, lo que evita una segunda copia gigante
     `.checkpoint.*.jsonl`.

Los lectores de historial del Gateway deben evitar materializar toda la transcripción salvo que
la superficie necesite explícitamente acceso histórico arbitrario. El historial de primera página,
el historial de chat incrustado, la recuperación de reinicio y las comprobaciones de tokens/uso usan lecturas
de cola acotadas. Los escaneos completos de transcripción pasan por el índice asíncrono de transcripciones, que se
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

La persistencia de sesiones tiene controles de mantenimiento automáticos (`session.maintenance`) para `sessions.json`, artefactos de transcripción y archivos auxiliares de trayectoria:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: umbral de antigüedad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional del directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Las escrituras normales del Gateway pasan por un escritor de sesiones por almacén que serializa las mutaciones en proceso sin tomar un bloqueo de archivo en tiempo de ejecución. Los ayudantes de parches de ruta caliente toman prestada la caché mutable validada mientras conservan ese turno de escritor, de modo que los archivos `sessions.json` grandes no se clonan ni se releen para cada actualización de metadatos. El código en tiempo de ejecución debe preferir `updateSessionStore(...)` o `updateSessionStoreEntry(...)`; los guardados directos de todo el almacén son herramientas de compatibilidad y mantenimiento sin conexión. Cuando se puede alcanzar un Gateway, `openclaw sessions cleanup` y `openclaw agents delete` sin simulación delegan las mutaciones del almacén al Gateway para que la limpieza se una a la misma cola de escritura; `--store <path>` es la ruta explícita de reparación sin conexión para el mantenimiento directo de archivos. La limpieza de `maxEntries` sigue agrupándose por lotes para límites de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de marca alta lo vuelva a reducir. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el inicio del Gateway; usa escrituras u `openclaw sessions cleanup --enforce` para limpiar. `openclaw sessions cleanup --enforce` sigue aplicando el límite configurado inmediatamente y poda artefactos antiguos no referenciados de transcripción, puntos de control y trayectorias incluso cuando no hay presupuesto de disco configurado.

El mantenimiento conserva punteros duraderos a conversaciones externas, como sesiones de grupo
y sesiones de chat con alcance de hilo, pero las entradas sintéticas en tiempo de ejecución para cron, hooks,
heartbeat, ACP y subagentes aún pueden eliminarse cuando superan la
antigüedad, el recuento o el presupuesto de disco configurados.

OpenClaw ya no crea copias de seguridad automáticas rotativas `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Las mutaciones de transcripción usan un bloqueo de escritura de sesión en el archivo de transcripción. La adquisición del bloqueo espera hasta
`session.writeLock.acquireTimeoutMs` antes de mostrar un error de sesión ocupada; el valor predeterminado es `60000`
ms. Aumenta esto solo cuando trabajo legítimo de preparación, limpieza, Compaction o réplica de transcripciones compite
durante más tiempo en máquinas lentas. La detección de bloqueos obsoletos y las advertencias de retención máxima siguen siendo políticas separadas.

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimina primero los artefactos archivados más antiguos, transcripciones huérfanas o trayectorias huérfanas.
2. Si aún está por encima del objetivo, expulsa las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Continúa hasta que el uso esté en `highWaterBytes` o por debajo.

En `mode: "warn"`, OpenClaw informa posibles expulsiones, pero no muta el almacén/los archivos.

Ejecuta mantenimiento a demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones Cron y registros de ejecución

Las ejecuciones Cron aisladas también crean entradas/transcripciones de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) poda sesiones antiguas de ejecución Cron aislada del almacén de sesiones (`false` lo desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (valores predeterminados: `2_000_000` bytes y `2000` líneas).

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión
`cron:<jobId>` anterior antes de escribir la nueva fila. Conserva preferencias
seguras como ajustes de pensamiento/rápido/detallado, etiquetas y anulaciones explícitas
de modelo/autenticación seleccionadas por el usuario. Descarta contexto ambiental de conversación como
enrutamiento de canal/grupo, política de envío o cola, elevación, origen y enlace
en tiempo de ejecución de ACP para que una nueva ejecución aislada no pueda heredar entrega obsoleta ni
autoridad de tiempo de ejecución de una ejecución anterior.

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué contenedor de conversación_ estás (enrutamiento + aislamiento).

Patrones comunes:

- Chat principal/directo (por agente): `agent:<agentId>:<mainKey>` (predeterminado `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo que se anule)

Las reglas canónicas están documentadas en [/concepts/session](/es/concepts/session).

---

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a una `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas prácticas:

- **Restablecimiento** (`/new`, `/reset`) crea una nueva `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado 4:00 a. m. hora local en el host del gateway) crea una nueva `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Caducidad por inactividad** (`session.reset.idleMinutes` o heredado `session.idleMinutes`) crea una nueva `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando están configurados diario + inactividad, gana el que caduque primero.
- **Eventos del sistema** (heartbeat, despertares Cron, notificaciones de exec, contabilidad del gateway) pueden mutar la fila de sesión, pero no extienden la frescura de restablecimiento diario/por inactividad. La rotación de restablecimiento descarta los avisos de eventos del sistema en cola para la sesión anterior antes de construir el prompt nuevo.
- **Política de bifurcación de padre** usa la rama activa de Pi al crear un hilo o una bifurcación de subagente. Si esa rama es demasiado grande, OpenClaw inicia el hijo con contexto aislado en lugar de fallar o heredar historial inutilizable. La política de dimensionamiento es automática; la configuración heredada `session.parentForkMaxTokens` se elimina mediante `openclaw doctor --fix`.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivo):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de esto salvo que `sessionFile` esté definido)
- `sessionStartedAt`: marca de tiempo de inicio para la `sessionId` actual; la frescura del restablecimiento diario
  usa esto. Las filas heredadas pueden derivarla del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura del restablecimiento
  por inactividad usa esto para que heartbeat, Cron y eventos exec no mantengan las sesiones
  activas. Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada
  para la frescura por inactividad.
- `updatedAt`: marca de tiempo de la última mutación de la fila del almacén, usada para listar, podar y
  contabilidad. No es la autoridad para la frescura de restablecimiento diario/por inactividad.
- `sessionFile`: anulación opcional de ruta explícita de transcripción
- `chatType`: `direct | group | room` (ayuda a interfaces de usuario y política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupos/canales
- Conmutadores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (anulación por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: con qué frecuencia se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último volcado de memoria previo a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó el último volcado

Es seguro editar el almacén, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las sesiones.

---

## Estructura de transcripción (`*.jsonl`)

Las transcripciones las administra `SessionManager` de `@mariozechner/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: encabezado de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Después: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por la extensión que _sí_ entran en el contexto del modelo (pueden ocultarse de la interfaz de usuario)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama de árbol

OpenClaw intencionalmente **no** "corrige" transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens registrados

Importan dos conceptos distintos:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas móviles escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto proviene del catálogo de modelos (y puede anularse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes.

Después de la Compaction, los turnos futuros ven:

- El resumen de Compaction
- Mensajes después de `firstKeptEntryId`

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
- Los bloques de llamadas a herramientas abortados o con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la Compaction automática (tiempo de ejecución de Pi)

En el agente Pi embebido, la Compaction automática se activa en dos casos:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
2. **Mantenimiento de umbral**: después de un turno correcto, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Estas son semánticas del tiempo de ejecución de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

OpenClaw también puede activar una Compaction local previa antes de abrir la siguiente
ejecución cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está configurado y el
archivo de transcripción activo alcanza ese tamaño. Esto es una protección de tamaño de archivo para el coste de
reapertura local, no archivado sin procesar: OpenClaw sigue ejecutando la Compaction semántica normal,
y requiere `truncateAfterCompaction` para que el resumen compactado pueda convertirse en una
nueva transcripción sucesora.

Para ejecuciones de Pi embebidas, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
añade una protección opcional de bucle de herramientas. Después de que se adjunta un resultado de herramienta y antes de la
siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de presupuesto
previa utilizada al inicio del turno. Si el contexto ya no cabe, la protección no
compacta dentro del hook `transformContext` de Pi. Emite una señal estructurada
de precomprobación a mitad de turno, detiene el envío del prompt actual y permite que el
bucle externo de ejecución use la ruta de recuperación existente: truncar resultados de herramienta demasiado grandes
cuando eso basta, o activar el modo de Compaction configurado y reintentar. La
opción está deshabilitada de forma predeterminada y funciona con los modos de Compaction `default` y `safeguard`,
incluida la Compaction de safeguard respaldada por proveedor.
Esto es independiente de `maxActiveTranscriptBytes`: la protección de tamaño en bytes se ejecuta
antes de abrir un turno, mientras que la precomprobación a mitad de turno se ejecuta más tarde en el bucle de herramientas de Pi embebido
después de que se hayan adjuntado nuevos resultados de herramienta.

---

## Configuración de Compaction (`reserveTokens`, `keepRecentTokens`)

La configuración de Compaction de Pi reside en la configuración de Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw también impone un mínimo de seguridad para ejecuciones embebidas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- El mínimo predeterminado es de `20000` tokens.
- Configura `agents.defaults.compaction.reserveTokensFloor: 0` para deshabilitar el mínimo.
- Si ya es más alto, OpenClaw lo deja como está.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito
  y mantiene el punto de corte de la cola reciente de Pi. Sin un presupuesto de conservación explícito,
  la Compaction manual sigue siendo un punto de control estricto y el contexto reconstruido comienza desde
  el nuevo resumen.
- Configura `agents.defaults.compaction.midTurnPrecheck.enabled: true` para ejecutar la
  precomprobación opcional de bucle de herramientas después de nuevos resultados de herramienta y antes de la siguiente llamada al modelo.
  Esto solo es un disparador; la generación del resumen sigue usando la ruta de
  Compaction configurada. Es independiente de `maxActiveTranscriptBytes`, que es una
  protección de tamaño en bytes de transcripción activa al inicio del turno.
- Configura `agents.defaults.compaction.maxActiveTranscriptBytes` con un valor en bytes o
  una cadena como `"20mb"` para ejecutar Compaction local antes de un turno cuando la transcripción
  activa crezca demasiado. Esta protección solo está activa cuando
  `truncateAfterCompaction` también está habilitado. Déjalo sin configurar o configúralo en `0` para
  deshabilitarlo.
- Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  OpenClaw rota la transcripción activa a una JSONL sucesora compactada después de la
  Compaction. La transcripción completa antigua permanece archivada y enlazada desde el
  punto de control de Compaction en lugar de reescribirse en el lugar.

Por qué: dejar suficiente margen para tareas de "mantenimiento" de varios turnos (como escrituras de memoria) antes de que la Compaction sea inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de Compaction conectables

Los plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API de plugin. Cuando `agents.defaults.compaction.provider` se configura con el id de un proveedor registrado, la extensión safeguard delega el resumen a ese proveedor en lugar de la canalización integrada `summarizeInStages`.

- `provider`: id de un plugin proveedor de Compaction registrado. Déjalo sin configurar para el resumen LLM predeterminado.
- Configurar un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada.
- El safeguard sigue preservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado vuelve a destilar resúmenes previos con mensajes nuevos
  en lugar de preservar textualmente el resumen anterior completo.
- El modo safeguard habilita auditorías de calidad del resumen de forma predeterminada; configura
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida malformada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen LLM integrado.
- Las señales de aborto/timeout se vuelven a lanzar (no se tragan) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la Compaction y el estado de la sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de Compaction

---

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos "silenciosos" para tareas en segundo plano donde el usuario no debería ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar "no entregar una respuesta al usuario".
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas de minúsculas, por lo que `NO_REPLY` y
  `no_reply` cuentan cuando toda la carga útil es solo el token silencioso.
- Esto es solo para verdaderos turnos en segundo plano/sin entrega; no es un atajo para
  solicitudes de usuario accionables ordinarias.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida parcial
a mitad de turno.

---

## "Volcado de memoria" previo a Compaction (implementado)

Objetivo: antes de que ocurra la Compaction automática, ejecutar un turno agéntico silencioso que escriba estado
duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el workspace del agente) para que la Compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **volcado previo al umbral**:

1. Supervisar el uso de contexto de la sesión.
2. Cuando cruza un "umbral suave" (por debajo del umbral de Compaction de Pi), ejecutar una directiva silenciosa
   de "escribir memoria ahora" para el agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `model` (sobrescritura opcional exacta de proveedor/modelo para el turno de volcado, por ejemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de volcado)
- `systemPrompt` (prompt de sistema adicional adjuntado para el turno de volcado)

Notas:

- El prompt/prompt de sistema predeterminado incluye una pista `NO_REPLY` para suprimir
  la entrega.
- Cuando `model` está configurado, el turno de volcado usa ese modelo sin heredar la
  cadena de fallback de la sesión activa, de modo que el mantenimiento solo local no haga fallback silenciosamente
  a un modelo de conversación de pago.
- El volcado se ejecuta una vez por ciclo de Compaction (rastreado en `sessions.json`).
- El volcado se ejecuta solo para sesiones de Pi embebidas (los backends de CLI lo omiten).
- El volcado se omite cuando el workspace de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para el diseño de archivos del workspace y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de extensión, pero la lógica de
volcado de OpenClaw vive hoy en el lado del Gateway.

---

## Lista de verificación de solución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- ¿Discordancia entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Spam de Compaction? Comprueba:
  - ventana de contexto del modelo (demasiado pequeña)
  - configuración de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar Compaction más temprana)
  - crecimiento excesivo de resultados de herramienta: habilita/ajusta la poda de sesiones
- ¿Se filtran turnos silenciosos? Confirma que la respuesta comienza con `NO_REPLY` (token exacto sin distinción de mayúsculas/minúsculas) y que estás en una build que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
