---
read_when:
    - Necesitas depurar id de sesión, JSONL de transcripción o campos de `sessions.json`
    - Estás cambiando el comportamiento de auto-Compaction o añadiendo tareas de limpieza “pre-Compaction”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis profundo: almacén de sesiones + transcripciones, ciclo de vida e internals de la (auto)Compaction'
title: Análisis profundo de gestión de sesiones
x-i18n:
    generated_at: "2026-04-24T05:48:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestión de sesiones y Compaction (análisis profundo)

Este documento explica cómo OpenClaw gestiona las sesiones de extremo a extremo:

- **Enrutamiento de sesiones** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (Compaction manual + automática) y dónde conectar trabajo previo a la Compaction
- **Tareas silenciosas de mantenimiento** (por ejemplo escrituras de memoria que no deberían producir salida visible para el usuario)

Si primero quieres una descripción general de más alto nivel, empieza con:

- [/concepts/session](/es/concepts/session)
- [/concepts/compaction](/es/concepts/compaction)
- [/concepts/memory](/es/concepts/memory)
- [/concepts/memory-search](/es/concepts/memory-search)
- [/concepts/session-pruning](/es/concepts/session-pruning)
- [/reference/transcript-hygiene](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado alrededor de un único **proceso Gateway** que es propietario del estado de las sesiones.

- Las interfaces (app de macOS, interfaz web Control UI, TUI) deberían consultar al Gateway para obtener listas de sesiones y recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; “comprobar los archivos de tu Mac local” no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o eliminar entradas)
   - Rastrea metadatos de sesión (id de sesión actual, última actividad, alternancias, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción append-only con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de Compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resuelve estas rutas mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles automáticos de mantenimiento (`session.maintenance`) para `sessions.json` y artefactos de transcripción:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: corte por antigüedad de entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `rotateBytes`: rota `sessions.json` cuando supera el tamaño permitido (predeterminado `10mb`)
- `resetArchiveRetention`: retención para archivos de transcripción archivados `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional para el directorio de sesiones
- `highWaterBytes`: objetivo opcional tras la limpieza (predeterminado `80%` de `maxDiskBytes`)

Orden de aplicación para limpieza por presupuesto de disco (`mode: "enforce"`):

1. Eliminar primero los artefactos archivados o huérfanos más antiguos.
2. Si sigue por encima del objetivo, expulsar las entradas de sesión más antiguas y sus archivos de transcripción.
3. Seguir hasta que el uso esté en o por debajo de `highWaterBytes`.

En `mode: "warn"`, OpenClaw informa de expulsiones potenciales pero no modifica el almacén/archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones cron y registros de ejecución

Las ejecuciones cron aisladas también crean entradas/transcripciones de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) poda sesiones antiguas de ejecuciones cron aisladas del almacén de sesiones (`false` desactiva esto).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (predeterminado: `2_000_000` bytes y `2000` líneas).

---

## Claves de sesión (`sessionKey`)

Una `sessionKey` identifica _en qué contenedor de conversación_ estás (enrutamiento + aislamiento).

Patrones habituales:

- Chat principal/directo (por agente): `agent:<agentId>:<mainKey>` (predeterminado `main`)
- Grupo: `agent:<agentId>:<channel>:group:<id>`
- Sala/canal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` o `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (salvo sobrescritura)

Las reglas canónicas están documentadas en [/concepts/session](/es/concepts/session).

---

## Id de sesión (`sessionId`)

Cada `sessionKey` apunta a un `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas prácticas:

- **Reset** (`/new`, `/reset`) crea un nuevo `sessionId` para esa `sessionKey`.
- **Reset diario** (predeterminado 4:00 AM hora local en el host del gateway) crea un nuevo `sessionId` en el siguiente mensaje después del límite de reinicio.
- **Caducidad por inactividad** (`session.reset.idleMinutes` o heredado `session.idleMinutes`) crea un nuevo `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando diario + inactividad están ambos configurados, gana el que caduque primero.
- **Protección de bifurcación del padre de hilo** (`session.parentForkMaxTokens`, predeterminado `100000`) omite la bifurcación de la transcripción padre cuando la sesión padre ya es demasiado grande; el nuevo hilo empieza limpio. Establece `0` para desactivarlo.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivos):

- `sessionId`: id actual de transcripción (el nombre del archivo se deriva de esto salvo que se establezca `sessionFile`)
- `updatedAt`: marca temporal de la última actividad
- `sessionFile`: sobrescritura opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las interfaces y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupo/canal
- Alternancias:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sobrescritura por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó la auto-Compaction para esta clave de sesión
- `memoryFlushAt`: marca temporal del último vaciado de memoria previo a la Compaction
- `memoryFlushCompactionCount`: recuento de Compaction cuando se ejecutó el último vaciado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas a medida que se ejecutan las sesiones.

---

## Estructura de la transcripción (`*.jsonl`)

Las transcripciones las gestiona `SessionManager` de `@mariozechner/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: cabecera de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacables:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse de la interfaz)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen persistido de Compaction con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar una rama de árbol

OpenClaw intencionadamente **no** “corrige” transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos diferentes:

1. **Ventana de contexto del modelo**: límite rígido por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas acumuladas escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto viene del catálogo de modelos (y puede sobrescribirse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en tiempo de ejecución; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

La Compaction resume la conversación antigua en una entrada persistida `compaction` dentro de la transcripción y mantiene intactos los mensajes recientes.

Después de la Compaction, los turnos futuros ven:

- El resumen de Compaction
- Los mensajes posteriores a `firstKeptEntryId`

La Compaction es **persistente** (a diferencia de la poda de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de Compaction, mantiene
emparejadas las llamadas a herramientas del asistente con sus entradas correspondientes `toolResult`.

- Si la división por cuota de tokens cae entre una llamada a herramienta y su resultado, OpenClaw
  desplaza el límite hasta el mensaje de llamada a herramienta del asistente en lugar de separar
  la pareja.
- Si un bloque final de resultados de herramientas hiciera que el fragmento superase el objetivo,
  OpenClaw conserva ese bloque pendiente de herramientas y mantiene intacta la cola sin resumir.
- Los bloques abortados/con error de llamada a herramienta no mantienen abierto un límite pendiente.

---

## Cuándo ocurre la auto-Compaction (tiempo de ejecución Pi)

En el agente Pi incrustado, la auto-Compaction se activa en dos casos:

1. **Recuperación de desbordamiento**: el modelo devuelve un error de desbordamiento de contexto
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` y variantes similares según el proveedor) → compactar → reintentar.
2. **Mantenimiento por umbral**: después de un turno correcto, cuando:

`contextTokens > contextWindow - reserveTokens`

Donde:

- `contextWindow` es la ventana de contexto del modelo
- `reserveTokens` es el margen reservado para prompts + la siguiente salida del modelo

Esta es semántica del tiempo de ejecución de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

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

OpenClaw también aplica un suelo de seguridad para ejecuciones incrustadas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo incrementa.
- El suelo predeterminado es `20000` tokens.
- Establece `agents.defaults.compaction.reserveTokensFloor: 0` para desactivar el suelo.
- Si ya es mayor, OpenClaw lo deja como está.

Por qué: dejar margen suficiente para “tareas de mantenimiento” de varios turnos (como escrituras de memoria) antes de que la Compaction sea inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de Compaction conectables

Los Plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API del Plugin. Cuando `agents.defaults.compaction.provider` se establece con un id de proveedor registrado, la extensión de salvaguarda delega la resumización a ese proveedor en lugar de al pipeline integrado `summarizeInStages`.

- `provider`: id de un Plugin registrado de proveedor de Compaction. Déjalo sin establecer para usar la resumización LLM predeterminada.
- Establecer un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada.
- La salvaguarda sigue preservando el contexto sufijo de turno reciente y turno dividido después de la salida del proveedor.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente a la resumización LLM integrada.
- Las señales de interrupción/tiempo de espera se vuelven a lanzar (no se silencian) para respetar la cancelación de quien llama.

Código fuente: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Superficies visibles para el usuario

Puedes observar la Compaction y el estado de la sesión mediante:

- `/status` (en cualquier sesión de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Modo detallado: `🧹 Auto-compaction complete` + recuento de Compaction

---

## Tareas silenciosas de mantenimiento (`NO_REPLY`)

OpenClaw admite turnos “silenciosos” para tareas en segundo plano en las que el usuario no debe ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar “no entregar una respuesta al usuario”.
- OpenClaw lo elimina/suprime en la capa de entrega.
- La supresión exacta del token silencioso no distingue mayúsculas de minúsculas, así que `NO_REPLY` y
  `no_reply` cuentan ambos cuando toda la carga es solo el token silencioso.
- Esto es solo para turnos realmente en segundo plano/sin entrega; no es un atajo para
  solicitudes ordinarias y accionables del usuario.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial comienza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida
parcial a mitad del turno.

---

## “Vaciado de memoria” previo a la Compaction (implementado)

Objetivo: antes de que ocurra la auto-Compaction, ejecutar un turno agéntico silencioso que escriba estado duradero
en disco (por ejemplo `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Supervisar el uso de contexto de la sesión.
2. Cuando cruce un “umbral blando” (por debajo del umbral de Compaction de Pi), ejecutar una directiva silenciosa
   “write memory now” al agente.
3. Usar el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
   nada.

Configuración (`agents.defaults.compaction.memoryFlush`):

- `enabled` (predeterminado: `true`)
- `softThresholdTokens` (predeterminado: `4000`)
- `prompt` (mensaje de usuario para el turno de vaciado)
- `systemPrompt` (prompt extra del sistema agregado para el turno de vaciado)

Notas:

- El prompt/system prompt predeterminados incluyen una pista `NO_REPLY` para suprimir
  la entrega.
- El vaciado se ejecuta una vez por ciclo de Compaction (rastreado en `sessions.json`).
- El vaciado se ejecuta solo para sesiones Pi incrustadas (los backends CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para ver el diseño de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de extensiones, pero la
lógica de vaciado de OpenClaw vive hoy en el lado del Gateway.

---

## Lista de comprobación de solución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma la `sessionKey` en `/status`.
- ¿Desajuste entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Compaction excesiva? Comprueba:
  - la ventana de contexto del modelo (demasiado pequeña)
  - la configuración de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar Compaction antes de tiempo)
  - el crecimiento de resultados de herramientas: habilita/ajusta la poda de sesiones
- ¿Se filtran turnos silenciosos? Confirma que la respuesta empiece con `NO_REPLY` (token exacto sin distinguir mayúsculas/minúsculas) y que estés en una compilación que incluya la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
