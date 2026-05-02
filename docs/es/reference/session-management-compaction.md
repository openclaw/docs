---
read_when:
    - Necesitas depurar identificadores de sesión, JSONL de transcripciones o campos de sessions.json
    - Estás cambiando el comportamiento de auto-Compaction o agregando mantenimiento “pre-Compaction”
    - Desea implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacén de sesiones y transcripciones, ciclo de vida y componentes internos de (auto)Compaction'
title: Análisis detallado de la gestión de sesiones
x-i18n:
    generated_at: "2026-05-02T05:36:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: efd2fb5157a98cb406c5210d813fa600259dfc559350010a9c070075ac6b28ed
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw administra sesiones de extremo a extremo en estas áreas:

- **Enrutamiento de sesiones** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (manual y automática) y dónde conectar trabajo previo a la Compaction
- **Mantenimiento silencioso** (escrituras de memoria que no deberían producir salida visible para el usuario)

Si primero quieres una descripción general de más alto nivel, empieza con:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Descripción general de la memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado alrededor de un único **proceso Gateway** que posee el estado de las sesiones.

- Las interfaces de usuario (aplicación de macOS, interfaz web de control, TUI) deberían consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; “revisar tus archivos locales de Mac” no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o de eliminar entradas)
   - Rastrea metadatos de sesión (id de sesión actual, última actividad, conmutadores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de Compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros
   - Los puntos de control de depuración grandes previos a la Compaction se omiten una vez que la transcripción activa supera el límite de tamaño del punto de control, lo que evita una segunda copia gigante `.checkpoint.*.jsonl`.

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resuelve estas rutas mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles de mantenimiento automático (`session.maintenance`) para `sessions.json`, artefactos de transcripción y archivos auxiliares de trayectoria:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: umbral de antigüedad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional del directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Las escrituras normales del Gateway agrupan la limpieza de `maxEntries` para límites de tamaño de producción, así que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de marca alta lo reescriba hacia abajo. Las lecturas del almacén de sesiones no podan ni limitan entradas durante el inicio del Gateway; usa escrituras u `openclaw sessions cleanup --enforce` para limpiar. `openclaw sessions cleanup --enforce` sigue aplicando el límite configurado de inmediato.

OpenClaw ya no crea copias de seguridad automáticas con rotación `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimina primero los artefactos archivados, transcripciones huérfanas o trayectorias huérfanas más antiguos.
2. Si todavía está por encima del objetivo, expulsa las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Continúa hasta que el uso esté en o por debajo de `highWaterBytes`.

En `mode: "warn"`, OpenClaw informa posibles expulsiones pero no muta el almacén ni los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones Cron y registros de ejecución

Las ejecuciones Cron aisladas también crean entradas/transcripciones de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) poda sesiones antiguas de ejecuciones Cron aisladas del almacén de sesiones (`false` lo desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (valores predeterminados: `2_000_000` bytes y `2000` líneas).

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión `cron:<jobId>` anterior antes de escribir la nueva fila. Conserva preferencias seguras como ajustes de razonamiento/rápido/detallado, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario. Descarta el contexto ambiental de conversación, como enrutamiento de canal/grupo, política de envío o cola, elevación, origen y enlace de runtime ACP, para que una ejecución aislada nueva no pueda heredar entrega obsoleta ni autoridad de runtime de una ejecución anterior.

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

- **Restablecer** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Caducidad por inactividad** (`session.reset.idleMinutes` o heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando tanto el restablecimiento diario como la inactividad están configurados, gana el que caduque primero.
- **Eventos del sistema** (heartbeat, despertares de Cron, notificaciones de ejecución, contabilidad del gateway) pueden mutar la fila de sesión pero no extienden la frescura del restablecimiento diario/por inactividad. El cambio de restablecimiento descarta los avisos de eventos del sistema en cola para la sesión anterior antes de crear el prompt nuevo.
- **Protección contra bifurcación desde el padre del hilo** (`session.parentForkMaxTokens`, predeterminado `100000`) omite la bifurcación de la transcripción padre cuando la sesión padre ya es demasiado grande; el hilo nuevo empieza desde cero. Define `0` para desactivarlo.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivos):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de esto a menos que `sessionFile` esté definido)
- `sessionStartedAt`: marca de tiempo de inicio para el `sessionId` actual; la frescura del restablecimiento diario usa esto. Las filas heredadas pueden derivarlo del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura del restablecimiento por inactividad usa esto para que los eventos heartbeat, Cron y exec no mantengan las sesiones activas. Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada para la frescura por inactividad.
- `updatedAt`: marca de tiempo de la última mutación de la fila del almacén, usada para listados, poda y contabilidad. No es la autoridad para la frescura del restablecimiento diario/por inactividad.
- `sessionFile`: anulación opcional explícita de ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las interfaces de usuario y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupo/canal
- Conmutadores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (anulación por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (de mejor esfuerzo / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo de la última descarga de memoria previa a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó la última descarga

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las sesiones.

---

## Estructura de transcripción (`*.jsonl`)

Las transcripciones son administradas por el `SessionManager` de `@mariozechner/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: encabezado de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensión que _sí_ entran en el contexto del modelo (pueden ocultarse de la interfaz de usuario)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente **no** “corrige” transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos distintos:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas móviles escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto viene del catálogo de modelos (y puede anularse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe de runtime; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación antigua en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes.

Después de la Compaction, los turnos futuros ven:

- El resumen de Compaction
- Mensajes posteriores a `firstKeptEntryId`

Compaction es **persistente** (a diferencia de la poda de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de Compaction, mantiene las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar el par.
- Si un bloque final de resultados de herramienta empujara de otro modo el fragmento por encima del objetivo, OpenClaw conserva ese bloque de herramienta pendiente y mantiene intacta la cola sin resumir.
- Los bloques de llamadas a herramientas abortadas/con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la Compaction automática (runtime de Pi)

En el agente Pi integrado, la Compaction automática se activa en dos casos:

1. **Recuperación de desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
2. **Mantenimiento por umbral**: después de un turno exitoso, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Estas son semánticas del runtime de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

OpenClaw también puede activar una Compaction local previa antes de abrir la siguiente ejecución cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido y el archivo de transcripción activo alcanza ese tamaño. Esta es una protección por tamaño de archivo para el costo de reapertura local, no archivado sin procesar: OpenClaw sigue ejecutando la Compaction semántica normal, y requiere `truncateAfterCompaction` para que el resumen compactado pueda convertirse en una nueva transcripción sucesora.

Para ejecuciones Pi integradas, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
agrega una protección opcional del bucle de herramientas. Después de anexar el resultado de una herramienta y antes de la
siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de
presupuesto de comprobación previa que se usa al inicio del turno. Si el contexto ya no cabe, la protección no
realiza Compaction dentro del hook `transformContext` de Pi. Emite una señal estructurada de
comprobación previa a mitad de turno, detiene el envío del prompt actual y permite que el
bucle de ejecución externo use la ruta de recuperación existente: truncar resultados de herramientas demasiado grandes
cuando eso basta, o activar el modo de Compaction configurado y reintentar. La
opción está deshabilitada de forma predeterminada y funciona con los modos de Compaction `default` y `safeguard`,
incluida la Compaction de salvaguarda respaldada por proveedor.
Esto es independiente de `maxActiveTranscriptBytes`: la protección de tamaño en bytes se ejecuta
antes de que se abra un turno, mientras que la comprobación previa a mitad de turno se ejecuta más tarde en el bucle de herramientas Pi integrado
después de que se hayan anexado nuevos resultados de herramientas.

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

OpenClaw también aplica un límite mínimo de seguridad para ejecuciones integradas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- El límite mínimo predeterminado es de `20000` tokens.
- Establece `agents.defaults.compaction.reserveTokensFloor: 0` para deshabilitar el límite mínimo.
- Si ya es más alto, OpenClaw lo deja como está.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito
  y mantiene el punto de corte de la cola reciente de Pi. Sin un presupuesto de conservación explícito,
  la Compaction manual sigue siendo un punto de control estricto y el contexto reconstruido empieza desde
  el nuevo resumen.
- Establece `agents.defaults.compaction.midTurnPrecheck.enabled: true` para ejecutar la
  comprobación previa opcional del bucle de herramientas después de nuevos resultados de herramientas y antes de la siguiente llamada al modelo.
  Esto solo es un disparador; la generación del resumen sigue usando la ruta de
  Compaction configurada. Es independiente de `maxActiveTranscriptBytes`, que es una
  protección de tamaño en bytes de la transcripción activa al inicio del turno.
- Establece `agents.defaults.compaction.maxActiveTranscriptBytes` en un valor de bytes o
  una cadena como `"20mb"` para ejecutar Compaction local antes de un turno cuando la transcripción activa
  se vuelva grande. Esta protección solo está activa cuando
  `truncateAfterCompaction` también está habilitado. Déjalo sin establecer o establécelo en `0` para
  deshabilitarlo.
- Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  OpenClaw rota la transcripción activa a un JSONL sucesor compactado después de la
  Compaction. La transcripción completa antigua permanece archivada y enlazada desde el
  punto de control de Compaction en lugar de reescribirse in situ.

Por qué: dejar suficiente margen para la “limpieza” de varios turnos (como escrituras de memoria) antes de que la Compaction se vuelva inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de Compaction conectables

Los Plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API del plugin. Cuando `agents.defaults.compaction.provider` se establece en el id de un proveedor registrado, la extensión de salvaguarda delega la resumición a ese proveedor en lugar de usar el flujo integrado `summarizeInStages`.

- `provider`: id de un Plugin proveedor de Compaction registrado. Déjalo sin establecer para la resumición LLM predeterminada.
- Establecer un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada.
- La salvaguarda aún conserva el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- La resumición de salvaguarda integrada vuelve a destilar resúmenes anteriores con mensajes nuevos
  en lugar de preservar literalmente todo el resumen anterior.
- El modo de salvaguarda habilita auditorías de calidad del resumen de forma predeterminada; establece
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida mal formada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente a la resumición LLM integrada.
- Las señales de cancelación/tiempo de espera se vuelven a lanzar (no se absorben) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la Compaction y el estado de la sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de Compaction

---

## Limpieza silenciosa (`NO_REPLY`)

OpenClaw admite turnos “silenciosos” para tareas en segundo plano donde el usuario no debe ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar “no entregar una respuesta al usuario”.
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas y minúsculas, así que `NO_REPLY` y
  `no_reply` cuentan ambos cuando toda la carga útil es solo el token silencioso.
- Esto es solo para turnos reales de fondo/sin entrega; no es un atajo para
  solicitudes de usuario ordinarias y accionables.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial empieza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida parcial
a mitad de turno.

---

## "Vaciado de memoria" previo a la Compaction (implementado)

Objetivo: antes de que ocurra la Compaction automática, ejecutar un turno agéntico silencioso que escriba estado
duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Monitorear el uso de contexto de la sesión.
2. Cuando cruza un “umbral suave” (por debajo del umbral de Compaction de Pi), ejecutar una directiva silenciosa
   “escribe memoria ahora” para el agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `model` (anulación opcional exacta de proveedor/modelo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt de sistema adicional anexado para el turno de vaciado)

Notas:

- El prompt/prompt de sistema predeterminados incluyen una indicación `NO_REPLY` para suprimir
  la entrega.
- Cuando `model` está establecido, el turno de vaciado usa ese modelo sin heredar la
  cadena de respaldo de la sesión activa, por lo que la limpieza solo local no recurre silenciosamente
  a un modelo de conversación de pago.
- El vaciado se ejecuta una vez por ciclo de Compaction (registrado en `sessions.json`).
- El vaciado se ejecuta solo para sesiones Pi integradas (los backends CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver el diseño de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de la extensión, pero la lógica de
vaciado de OpenClaw vive hoy del lado del Gateway.

---

## Lista de comprobación de solución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- ¿Diferencia entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Spam de Compaction? Revisa:
  - ventana de contexto del modelo (demasiado pequeña)
  - configuración de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar una Compaction más temprana)
  - hinchazón de resultados de herramientas: habilita/ajusta la poda de sesión
- ¿Se filtran turnos silenciosos? Confirma que la respuesta empieza con `NO_REPLY` (token exacto sin distinción de mayúsculas/minúsculas) y que estás en una compilación que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
