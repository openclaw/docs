---
read_when:
    - Necesitas depurar los IDs de sesión, el JSONL de la transcripción o los campos de sessions.json
    - Estás cambiando el comportamiento de compactación automática o añadiendo tareas de mantenimiento de “precompactación”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis detallado: almacén de sesiones + transcripciones, ciclo de vida e internos de (auto)Compaction'
title: Análisis en profundidad de la gestión de sesiones
x-i18n:
    generated_at: "2026-04-30T06:00:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw administra las sesiones de extremo a extremo en estas áreas:

- **Enrutamiento de sesiones** (cómo se asignan los mensajes entrantes a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (Compaction manual y automática) y dónde enganchar trabajo previo a la Compaction
- **Mantenimiento silencioso** (escrituras de memoria que no deben producir salida visible para el usuario)

Si quieres primero una descripción general de mayor nivel, empieza por:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Descripción general de memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Purga de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado alrededor de un único **proceso Gateway** que posee el estado de las sesiones.

- Las IU (app de macOS, Control UI web, TUI) deben consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; “revisar los archivos locales de tu Mac” no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o de eliminar entradas)
   - Rastrea metadatos de sesión (id de sesión actual, última actividad, interruptores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de Compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros
   - Los puntos de control de depuración grandes previos a la Compaction se omiten una vez que la transcripción
     activa supera el límite de tamaño del punto de control, lo que evita una segunda copia gigante
     `.checkpoint.*.jsonl`.

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

Las escrituras normales del Gateway agrupan la limpieza de `maxEntries` para límites de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de nivel alto lo reescriba hacia abajo. `openclaw sessions cleanup --enforce` sigue aplicando el límite configurado de inmediato.

OpenClaw ya no crea copias de seguridad de rotación automáticas `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Orden de aplicación para la limpieza por presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos archivados más antiguos, transcripciones huérfanas o artefactos de trayectoria huérfanos.
2. Si aún está por encima del objetivo, desalojar las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Continuar hasta que el uso esté en `highWaterBytes` o por debajo.

En `mode: "warn"`, OpenClaw informa posibles desalojos, pero no modifica el almacén ni los archivos.

Ejecuta mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones Cron y registros de ejecución

Las ejecuciones Cron aisladas también crean entradas/transcripciones de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) purga sesiones antiguas de ejecuciones Cron aisladas del almacén de sesiones (`false` lo desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` purgan archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (valores predeterminados: `2_000_000` bytes y `2000` líneas).

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión
`cron:<jobId>` anterior antes de escribir la nueva fila. Conserva preferencias
seguras como ajustes de pensamiento/rápido/detallado, etiquetas y anulaciones explícitas
de modelo/autenticación seleccionadas por el usuario. Descarta el contexto de conversación ambiental, como
enrutamiento de canal/grupo, política de envío o cola, elevación, origen y vinculación de entorno de ejecución ACP
para que una nueva ejecución aislada no pueda heredar autoridad de entrega o
de entorno de ejecución obsoleta de una ejecución anterior.

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué contenedor de conversación_ estás (enrutamiento + aislamiento).

Patrones comunes:

- Chat principal/directo (por agente): `agent:<agentId>:<mainKey>` (predeterminado `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (a menos que se sobrescriba)

Las reglas canónicas están documentadas en [/concepts/session](/es/concepts/session).

---

## IDs de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas prácticas:

- **Restablecimiento** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Caducidad por inactividad** (`session.reset.idleMinutes` o heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando diario + inactividad están configurados, gana el que caduque primero.
- **Eventos del sistema** (heartbeat, activaciones de cron, notificaciones exec, contabilidad del gateway) pueden modificar la fila de sesión, pero no extienden la frescura de restablecimiento diario/por inactividad. El cambio de restablecimiento descarta los avisos de eventos del sistema en cola de la sesión anterior antes de construir el prompt nuevo.
- **Protección de bifurcación del padre del hilo** (`session.parentForkMaxTokens`, predeterminado `100000`) omite la bifurcación de la transcripción padre cuando la sesión padre ya es demasiado grande; el nuevo hilo empieza limpio. Define `0` para desactivarlo.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivos):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de esto a menos que `sessionFile` esté definido)
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la frescura de restablecimiento diario
  usa esto. Las filas heredadas pueden derivarlo del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura de restablecimiento por inactividad
  usa esto para que Heartbeat, Cron y eventos exec no mantengan vivas las sesiones.
  Las filas heredadas sin este campo recurren a la hora de inicio de sesión recuperada
  para la frescura por inactividad.
- `updatedAt`: marca de tiempo de la última modificación de la fila del almacén, usada para listado, purga y
  contabilidad. No es la autoridad para la frescura de restablecimiento diario/por inactividad.
- `sessionFile`: sobrescritura opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las IU y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupo/canal
- Interruptores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sobrescritura por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo / dependiente del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la Compaction automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último vaciado de memoria previo a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó el último vaciado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas mientras se ejecutan las sesiones.

---

## Estructura de transcripción (`*.jsonl`)

Las transcripciones son administradas por `SessionManager` de `@mariozechner/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: encabezado de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada notables:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse de la IU)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de Compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama de árbol

OpenClaw intencionadamente **no** “corrige” transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas móviles escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto proviene del catálogo de modelos (y puede sobrescribirse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y conserva intactos los mensajes recientes.

Después de la Compaction, los turnos futuros ven:

- El resumen de Compaction
- Mensajes después de `firstKeptEntryId`

Compaction es **persistente** (a diferencia de la purga de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de Compaction, mantiene
las llamadas a herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw
  desplaza el límite al mensaje de llamada a herramienta del asistente en lugar de separar
  el par.
- Si un bloque final de resultado de herramienta empujara de otro modo el fragmento por encima del objetivo,
  OpenClaw preserva ese bloque de herramienta pendiente y mantiene intacta la cola
  sin resumir.
- Los bloques de llamadas a herramientas abortadas o con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la Compaction automática (entorno de ejecución Pi)

En el agente Pi integrado, la Compaction automática se activa en dos casos:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares con forma de proveedor) → compactar → reintentar.
2. **Mantenimiento por umbral**: después de un turno exitoso, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Estas son semánticas del entorno de ejecución Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

OpenClaw también puede activar una Compaction local previa antes de abrir la siguiente
ejecución cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido y el
archivo de transcripción activo alcanza ese tamaño. Esta es una protección por tamaño de archivo para el costo
de reapertura local, no archivado bruto: OpenClaw sigue ejecutando Compaction semántica normal,
y requiere `truncateAfterCompaction` para que el resumen compactado pueda convertirse en una
nueva transcripción sucesora.

---

## Ajustes de Compaction (`reserveTokens`, `keepRecentTokens`)

Los ajustes de Compaction de Pi viven en los ajustes de Pi:

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
- Define `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el límite mínimo.
- Si ya es más alto, OpenClaw lo deja sin cambios.
- La ejecución manual de `/compact` respeta un `agents.defaults.compaction.keepRecentTokens`
  explícito y mantiene el punto de corte de la cola reciente de Pi. Sin un presupuesto de conservación explícito,
  la compaction manual sigue siendo un punto de control estricto y el contexto reconstruido comienza desde
  el nuevo resumen.
- Define `agents.defaults.compaction.maxActiveTranscriptBytes` con un valor en bytes o
  una cadena como `"20mb"` para ejecutar la compaction local antes de un turno cuando la transcripción
  activa se vuelva grande. Esta protección está activa solo cuando
  `truncateAfterCompaction` también está habilitado. Déjalo sin definir o defínelo en `0` para
  desactivarlo.
- Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  OpenClaw rota la transcripción activa a un JSONL sucesor compactado después de la
  compaction. La transcripción completa anterior permanece archivada y enlazada desde el
  punto de control de compaction en lugar de reescribirse en el mismo lugar.

Motivo: dejar suficiente margen para “tareas de mantenimiento” de varios turnos (como escrituras de memoria) antes de que la compaction sea inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de compaction conectables

Los plugins pueden registrar un proveedor de compaction mediante `registerCompactionProvider()` en la API del plugin. Cuando `agents.defaults.compaction.provider` se define con el id de un proveedor registrado, la extensión de protección delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un plugin proveedor de compaction registrado. Déjalo sin definir para el resumen LLM predeterminado.
- Definir un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de compaction y la misma política de preservación de identificadores que la ruta integrada.
- La protección sigue conservando el contexto de turnos recientes y sufijos de turnos divididos después de la salida del proveedor.
- El resumen de protección integrado vuelve a destilar los resúmenes anteriores con mensajes nuevos
  en lugar de preservar literalmente el resumen anterior completo.
- El modo de protección habilita las auditorías de calidad del resumen de forma predeterminada; define
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salidas mal formadas.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen LLM integrado.
- Las señales de cancelación/tiempo de espera se vuelven a lanzar (no se absorben) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la compaction y el estado de la sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de compaction

---

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos “silenciosos” para tareas en segundo plano en las que el usuario no debe ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar “no entregar una respuesta al usuario”.
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas de minúsculas, por lo que `NO_REPLY` y
  `no_reply` cuentan cuando toda la carga útil es solo el token silencioso.
- Esto es solo para turnos verdaderamente en segundo plano/sin entrega; no es un atajo para
  solicitudes de usuario accionables ordinarias.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, de modo que las operaciones silenciosas no filtren salida parcial
a mitad del turno.

---

## "Vaciado de memoria" previo a la compaction (implementado)

Objetivo: antes de que ocurra la auto-compaction, ejecutar un turno agéntico silencioso que escriba estado
duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Supervisar el uso de contexto de la sesión.
2. Cuando cruza un “umbral suave” (por debajo del umbral de compaction de Pi), ejecutar una directiva silenciosa
   de “escribir memoria ahora” para el agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `model` (sobrescritura opcional exacta de proveedor/modelo para el turno de vaciado, por ejemplo `ollama/qwen3:8b`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt de sistema adicional anexado para el turno de vaciado)

Notas:

- El prompt/prompt de sistema predeterminado incluye una pista `NO_REPLY` para suprimir
  la entrega.
- Cuando `model` está definido, el turno de vaciado usa ese modelo sin heredar la
  cadena de fallback de la sesión activa, de modo que el mantenimiento solo local no recurra silenciosamente
  a un modelo de conversación de pago.
- El vaciado se ejecuta una vez por ciclo de compaction (registrado en `sessions.json`).
- El vaciado se ejecuta solo para sesiones Pi integradas (los backends de CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver el diseño de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de la extensión, pero la
lógica de vaciado de OpenClaw vive hoy del lado del Gateway.

---

## Lista de comprobación de solución de problemas

- ¿Clave de sesión incorrecta? Comienza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- ¿Discordancia entre almacén y transcripción? Confirma el host de Gateway y la ruta del almacén desde `openclaw status`.
- ¿Spam de compaction? Comprueba:
  - ventana de contexto del modelo (demasiado pequeña)
  - configuración de compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar una compaction más temprana)
  - crecimiento excesivo de resultados de herramientas: habilita/ajusta la poda de sesiones
- ¿Se filtran turnos silenciosos? Confirma que la respuesta comienza con `NO_REPLY` (token exacto sin distinguir mayúsculas/minúsculas) y que estás en una compilación que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
