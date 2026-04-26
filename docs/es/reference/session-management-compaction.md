---
read_when:
    - Necesitas depurar los ID de sesión, el JSONL de transcripciones o los campos de sessions.json
    - Estás cambiando el comportamiento de la compactación automática o agregando tareas de mantenimiento de “pre-compactación”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis detallado: almacén de sesiones + transcripciones, ciclo de vida e internals de la Compaction (automática)'
title: Análisis detallado de la gestión de sesiones
x-i18n:
    generated_at: "2026-04-26T11:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Esta página explica cómo OpenClaw gestiona las sesiones de extremo a extremo:

- **Enrutamiento de sesiones** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (Compaction manual + automática) y dónde conectar trabajo previo a la compactación
- **Mantenimiento silencioso** (por ejemplo, escrituras de memoria que no deberían producir salida visible para el usuario)

Si primero quieres una visión general de más alto nivel, empieza con:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda en memoria](/es/concepts/memory-search)
- [Depuración de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado en torno a un único **proceso Gateway** que posee el estado de la sesión.

- Las interfaces de usuario (aplicación de macOS, web Control UI, TUI) deben consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; “revisar los archivos de tu Mac local” no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o eliminar entradas)
   - Rastrea metadatos de la sesión (id de sesión actual, última actividad, alternadores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de compactación
   - Se usa para reconstruir el contexto del modelo para turnos futuros

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de tema de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resuelve estas rutas mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles automáticos de mantenimiento (`session.maintenance`) para `sessions.json` y los artefactos de transcripción:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: umbral de antigüedad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `rotateBytes`: rota `sessions.json` cuando es demasiado grande (predeterminado `10mb`)
- `resetArchiveRetention`: retención para archivos de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional para el directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimina primero los artefactos de transcripción archivados u huérfanos más antiguos.
2. Si sigue por encima del objetivo, expulsa las entradas de sesión más antiguas y sus archivos de transcripción.
3. Continúa hasta que el uso esté en o por debajo de `highWaterBytes`.

En `mode: "warn"`, OpenClaw informa sobre posibles expulsiones, pero no modifica el almacén ni los archivos.

Ejecuta el mantenimiento a demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones de Cron y registros de ejecución

Las ejecuciones aisladas de Cron también crean entradas de sesión/transcripciones, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) depura las sesiones antiguas de ejecuciones aisladas de Cron del almacén de sesiones (`false` lo desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` depuran archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (predeterminados: `2_000_000` bytes y `2000` líneas).

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión previa de `cron:<jobId>` antes de escribir la nueva fila. Conserva preferencias seguras como la configuración de thinking/fast/verbose, etiquetas y anulaciones explícitas de modelo/autenticación seleccionadas por el usuario. Elimina el contexto ambiental de conversación como el enrutamiento de canal/grupo, la política de envío o cola, la elevación, el origen y el enlace de tiempo de ejecución de ACP para que una ejecución aislada nueva no pueda heredar autoridad de entrega o de tiempo de ejecución obsoleta de una ejecución anterior.

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

## ID de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas generales:

- **Reset** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Reset diario** (predeterminado 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de reinicio.
- **Vencimiento por inactividad** (`session.reset.idleMinutes` o el heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando se configuran el reinicio diario y la inactividad, gana el que venza primero.
- **Eventos del sistema** (heartbeat, activaciones de cron, notificaciones de exec, tareas administrativas del gateway) pueden modificar la fila de la sesión, pero no extienden la vigencia del reinicio diario o por inactividad. La transición de reinicio descarta los avisos de eventos del sistema en cola de la sesión anterior antes de construir el prompt nuevo.
- **Protección contra bifurcación desde el padre del hilo** (`session.parentForkMaxTokens`, predeterminado `100000`) omite la bifurcación de la transcripción padre cuando la sesión padre ya es demasiado grande; el nuevo hilo empieza desde cero. Establece `0` para desactivarlo.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivos):

- `sessionId`: id actual de la transcripción (el nombre del archivo se deriva de esto salvo que se defina `sessionFile`)
- `sessionStartedAt`: marca de tiempo de inicio del `sessionId` actual; la vigencia del reinicio diario usa este valor. Las filas heredadas pueden derivarlo del encabezado de sesión del JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la vigencia del reinicio por inactividad usa este valor para que los eventos de heartbeat, cron y exec no mantengan vivas las sesiones. Las filas heredadas sin este campo recurren a la hora de inicio recuperada de la sesión para la vigencia por inactividad.
- `updatedAt`: marca de tiempo de la última modificación de la fila del almacén, usada para listados, depuración y tareas administrativas. No es la autoridad para la vigencia del reinicio diario o por inactividad.
- `sessionFile`: anulación opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las interfaces de usuario y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetas de grupo/canal
- Alternadores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (anulación por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (estimados / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: con qué frecuencia se completó la compactación automática para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último vaciado de memoria previo a la compactación
- `memoryFlushCompactionCount`: recuento de compactaciones cuando se ejecutó el último vaciado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las sesiones.

---

## Estructura de la transcripción (`*.jsonl`)

Las transcripciones son gestionadas por el `SessionManager` de `@mariozechner/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: encabezado de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/resultado de herramienta
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse de la interfaz)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de compactación persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente **no** “corrige” transcripciones; el Gateway usa `SessionManager` para leerlas y escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas acumuladas escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto proviene del catálogo de modelos (y puede anularse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume la conversación anterior en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes.

Después de compactar, los turnos futuros ven:

- El resumen de compaction
- Los mensajes posteriores a `firstKeptEntryId`

Compaction es **persistente** (a diferencia de la depuración de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de compactación, mantiene emparejadas las llamadas a herramientas del asistente con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada a herramienta y su resultado, OpenClaw desplaza el límite al mensaje del asistente que llama a la herramienta en lugar de separar el par.
- Si un bloque final de resultados de herramientas hiciera que el fragmento superara el objetivo, OpenClaw conserva ese bloque de herramientas pendiente y mantiene intacta la cola no resumida.
- Los bloques de llamadas a herramientas abortadas o con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre la compactación automática (tiempo de ejecución de Pi)

En el agente Pi integrado, la compactación automática se activa en dos casos:

1. **Recuperación por desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, y variantes similares según el proveedor) → compactar → reintentar.
2. **Mantenimiento por umbral**: después de un turno exitoso, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para los prompts + la siguiente salida del modelo

Estas son semánticas del tiempo de ejecución de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

---

## Configuración de Compaction (`reserveTokens`, `keepRecentTokens`)

La configuración de compactación de Pi vive en la configuración de Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw también aplica un umbral mínimo de seguridad para las ejecuciones integradas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- El umbral mínimo predeterminado es `20000` tokens.
- Establece `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el umbral mínimo.
- Si ya es mayor, OpenClaw lo deja como está.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito
  y conserva el punto de corte de cola reciente de Pi. Sin un presupuesto de conservación explícito,
  la compactación manual sigue siendo un punto de control estricto y el contexto reconstruido empieza desde
  el nuevo resumen.

Por qué: dejar suficiente margen para “mantenimiento” de varios turnos (como escrituras de memoria) antes de que la compactación se vuelva inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de compactación conectables

Los Plugins pueden registrar un proveedor de compactación mediante `registerCompactionProvider()` en la API del plugin. Cuando `agents.defaults.compaction.provider` se establece en el id de un proveedor registrado, la extensión safeguard delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un plugin proveedor de compactación registrado. Déjalo sin configurar para usar el resumen LLM predeterminado.
- Configurar un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de compactación y la misma política de preservación de identificadores que la ruta integrada.
- El safeguard sigue preservando el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen safeguard integrado vuelve a destilar resúmenes anteriores con mensajes nuevos en lugar de preservar literalmente el resumen anterior completo.
- El modo safeguard habilita auditorías de calidad del resumen de forma predeterminada; establece
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salidas malformadas.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw vuelve automáticamente al resumen LLM integrado.
- Las señales de abort/timeout se relanzan (no se silencian) para respetar la cancelación del llamador.

Fuente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la compactación y el estado de la sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de compactaciones

---

## Mantenimiento silencioso (`NO_REPLY`)

OpenClaw admite turnos “silenciosos” para tareas en segundo plano en las que el usuario no debería ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar “no entregar una respuesta al usuario”.
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión del token silencioso exacto no distingue mayúsculas de minúsculas, de modo que `NO_REPLY` y
  `no_reply` cuentan cuando toda la carga útil es solo el token silencioso.
- Esto es solo para turnos reales en segundo plano/sin entrega; no es un atajo para
  solicitudes ordinarias del usuario que requieran acción.

Desde `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida
parcial a mitad del turno.

---

## “Vaciado de memoria” previo a la compactación (implementado)

Objetivo: antes de que ocurra la compactación automática, ejecutar un turno agentico silencioso que escriba estado duradero
en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la compactación no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Supervisar el uso del contexto de la sesión.
2. Cuando cruce un “umbral suave” (por debajo del umbral de compactación de Pi), ejecutar una directiva silenciosa
   de “escribe memoria ahora” al agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt de sistema adicional anexado para el turno de vaciado)

Notas:

- El prompt/prompt del sistema predeterminado incluye una indicación `NO_REPLY` para suprimir
  la entrega.
- El vaciado se ejecuta una vez por ciclo de compactación (rastreado en `sessions.json`).
- El vaciado solo se ejecuta para sesiones Pi integradas (los backends CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memory](/es/concepts/memory) para ver el diseño de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de extensiones, pero la lógica de
vaciado de OpenClaw vive hoy del lado del Gateway.

---

## Lista de comprobación para resolución de problemas

- ¿Clave de sesión incorrecta? Empieza por [/concepts/session](/es/concepts/session) y confirma la `sessionKey` en `/status`.
- ¿Desajuste entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Exceso de compactación? Comprueba:
  - la ventana de contexto del modelo (demasiado pequeña)
  - la configuración de compactación (`reserveTokens` demasiado alto para la ventana del modelo puede causar compactación antes de tiempo)
  - hinchamiento de resultados de herramientas: habilita/ajusta la depuración de sesiones
- ¿Se están filtrando turnos silenciosos? Confirma que la respuesta empiece con `NO_REPLY` (token exacto sin distinguir mayúsculas de minúsculas) y que estés en una compilación que incluya la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Depuración de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
