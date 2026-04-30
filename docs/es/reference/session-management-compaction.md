---
read_when:
    - Necesita depurar identificadores de sesión, JSONL de transcripción o campos de sessions.json
    - Estás cambiando el comportamiento de auto-Compaction o añadiendo tareas de mantenimiento de “pre-Compaction”
    - Quieres implementar vaciados de memoria o turnos silenciosos del sistema
summary: 'Análisis en profundidad: almacén de sesiones + transcripciones, ciclo de vida y detalles internos de (auto)Compaction'
title: Análisis profundo de la gestión de sesiones
x-i18n:
    generated_at: "2026-04-30T16:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw gestiona sesiones de extremo a extremo en estas áreas:

- **Enrutamiento de sesión** (cómo los mensajes entrantes se asignan a una `sessionKey`)
- **Almacén de sesiones** (`sessions.json`) y qué rastrea
- **Persistencia de transcripciones** (`*.jsonl`) y su estructura
- **Higiene de transcripciones** (ajustes específicos del proveedor antes de las ejecuciones)
- **Límites de contexto** (ventana de contexto frente a tokens rastreados)
- **Compaction** (manual y auto-compaction) y dónde enganchar trabajo previo a compaction
- **Mantenimiento silencioso** (escrituras de memoria que no deben producir salida visible para el usuario)

Si primero quieres una vista general de más alto nivel, empieza por:

- [Gestión de sesiones](/es/concepts/session)
- [Compaction](/es/concepts/compaction)
- [Resumen de memoria](/es/concepts/memory)
- [Búsqueda de memoria](/es/concepts/memory-search)
- [Poda de sesiones](/es/concepts/session-pruning)
- [Higiene de transcripciones](/es/reference/transcript-hygiene)

---

## Fuente de verdad: el Gateway

OpenClaw está diseñado alrededor de un único **proceso Gateway** que posee el estado de sesión.

- Las UI (app de macOS, Control UI web, TUI) deben consultar al Gateway las listas de sesiones y los recuentos de tokens.
- En modo remoto, los archivos de sesión están en el host remoto; “revisar tus archivos locales de Mac” no reflejará lo que está usando el Gateway.

---

## Dos capas de persistencia

OpenClaw persiste las sesiones en dos capas:

1. **Almacén de sesiones (`sessions.json`)**
   - Mapa clave/valor: `sessionKey -> SessionEntry`
   - Pequeño, mutable, seguro de editar (o de eliminar entradas)
   - Rastrea metadatos de sesión (id de sesión actual, última actividad, conmutadores, contadores de tokens, etc.)

2. **Transcripción (`<sessionId>.jsonl`)**
   - Transcripción de solo anexado con estructura de árbol (las entradas tienen `id` + `parentId`)
   - Almacena la conversación real + llamadas a herramientas + resúmenes de compaction
   - Se usa para reconstruir el contexto del modelo en turnos futuros
   - Los grandes puntos de control de depuración previos a compaction se omiten una vez que la transcripción
     activa supera el límite de tamaño del punto de control, lo que evita una segunda copia gigante
     `.checkpoint.*.jsonl`.

---

## Ubicaciones en disco

Por agente, en el host del Gateway:

- Almacén: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripciones: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesiones de temas de Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resuelve esto mediante `src/config/sessions.ts`.

---

## Mantenimiento del almacén y controles de disco

La persistencia de sesiones tiene controles de mantenimiento automático (`session.maintenance`) para `sessions.json`, artefactos de transcripción y sidecars de trayectoria:

- `mode`: `warn` (predeterminado) o `enforce`
- `pruneAfter`: límite de antigüedad para entradas obsoletas (predeterminado `30d`)
- `maxEntries`: límite de entradas en `sessions.json` (predeterminado `500`)
- `resetArchiveRetention`: retención de archivos de transcripción `*.reset.<timestamp>` (predeterminado: igual que `pruneAfter`; `false` desactiva la limpieza)
- `maxDiskBytes`: presupuesto opcional del directorio de sesiones
- `highWaterBytes`: objetivo opcional después de la limpieza (predeterminado `80%` de `maxDiskBytes`)

Las escrituras normales del Gateway procesan por lotes la limpieza de `maxEntries` para límites de tamaño de producción, por lo que un almacén puede superar brevemente el límite configurado antes de que la siguiente limpieza de nivel alto lo reescriba por debajo. `openclaw sessions cleanup --enforce` sigue aplicando el límite configurado inmediatamente.

OpenClaw ya no crea copias de seguridad automáticas de rotación `sessions.json.bak.*` durante las escrituras del Gateway. La clave heredada `session.maintenance.rotateBytes` se ignora y `openclaw doctor --fix` la elimina de configuraciones antiguas.

Orden de aplicación para la limpieza del presupuesto de disco (`mode: "enforce"`):

1. Elimina primero los artefactos archivados más antiguos, transcripciones huérfanas o trayectorias huérfanas.
2. Si aún está por encima del objetivo, expulsa las entradas de sesión más antiguas y sus archivos de transcripción/trayectoria.
3. Continúa hasta que el uso esté en `highWaterBytes` o por debajo.

En `mode: "warn"`, OpenClaw informa posibles expulsiones, pero no modifica el almacén ni los archivos.

Ejecuta el mantenimiento bajo demanda:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesiones Cron y registros de ejecución

Las ejecuciones Cron aisladas también crean entradas/transcripciones de sesión, y tienen controles de retención dedicados:

- `cron.sessionRetention` (predeterminado `24h`) poda sesiones antiguas de ejecución Cron aislada del almacén de sesiones (`false` desactiva).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` podan archivos `~/.openclaw/cron/runs/<jobId>.jsonl` (valores predeterminados: `2_000_000` bytes y `2000` líneas).

Cuando Cron fuerza la creación de una nueva sesión de ejecución aislada, sanea la entrada de sesión
`cron:<jobId>` anterior antes de escribir la nueva fila. Conserva preferencias
seguras como ajustes de pensamiento/rápido/detallado, etiquetas y anulaciones explícitas
de modelo/autenticación seleccionadas por el usuario. Descarta contexto de conversación ambiental como
enrutamiento de canal/grupo, política de envío o cola, elevación, origen y vinculación de runtime
ACP para que una nueva ejecución aislada no pueda heredar entrega obsoleta ni
autoridad de runtime de una ejecución anterior.

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

## Ids de sesión (`sessionId`)

Cada `sessionKey` apunta a una `sessionId` actual (el archivo de transcripción que continúa la conversación).

Reglas prácticas:

- **Restablecimiento** (`/new`, `/reset`) crea una nueva `sessionId` para esa `sessionKey`.
- **Restablecimiento diario** (predeterminado a las 4:00 AM, hora local del host del gateway) crea una nueva `sessionId` en el siguiente mensaje después del límite de restablecimiento.
- **Expiración por inactividad** (`session.reset.idleMinutes` o la heredada `session.idleMinutes`) crea una nueva `sessionId` cuando llega un mensaje después de la ventana de inactividad. Cuando tanto diario como inactividad están configurados, gana el que expire primero.
- **Eventos del sistema** (heartbeat, despertares de Cron, notificaciones de exec, contabilidad del gateway) pueden modificar la fila de sesión, pero no extienden la frescura del restablecimiento diario/por inactividad. El cambio por restablecimiento descarta avisos de eventos del sistema en cola para la sesión anterior antes de construir el prompt nuevo.
- **Protección contra fork de padre de hilo** (`session.parentForkMaxTokens`, predeterminado `100000`) omite el fork de la transcripción padre cuando la sesión padre ya es demasiado grande; el nuevo hilo empieza limpio. Define `0` para desactivarlo.

Detalle de implementación: la decisión ocurre en `initSessionState()` en `src/auto-reply/reply/session.ts`.

---

## Esquema del almacén de sesiones (`sessions.json`)

El tipo de valor del almacén es `SessionEntry` en `src/config/sessions.ts`.

Campos clave (no exhaustivo):

- `sessionId`: id de transcripción actual (el nombre de archivo se deriva de esto a menos que `sessionFile` esté definido)
- `sessionStartedAt`: marca de tiempo de inicio para la `sessionId` actual; la frescura del restablecimiento diario
  usa esto. Las filas heredadas pueden derivarla del encabezado de sesión JSONL.
- `lastInteractionAt`: marca de tiempo de la última interacción real de usuario/canal; la frescura del restablecimiento por inactividad
  usa esto para que Heartbeat, Cron y eventos exec no mantengan vivas las sesiones.
  Las filas heredadas sin este campo recurren al tiempo de inicio de sesión recuperado
  para la frescura por inactividad.
- `updatedAt`: marca de tiempo de la última modificación de la fila del almacén, usada para listar, podar y
  contabilidad. No es la autoridad para la frescura del restablecimiento diario/por inactividad.
- `sessionFile`: anulación opcional explícita de la ruta de transcripción
- `chatType`: `direct | group | room` (ayuda a las UI y a la política de envío)
- `provider`, `subject`, `room`, `space`, `displayName`: metadatos para etiquetado de grupo/canal
- Conmutadores:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (anulación por sesión)
- Selección de modelo:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Contadores de tokens (mejor esfuerzo / dependientes del proveedor):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: cuántas veces se completó auto-compaction para esta clave de sesión
- `memoryFlushAt`: marca de tiempo del último volcado de memoria previo a compaction
- `memoryFlushCompactionCount`: recuento de compaction cuando se ejecutó el último volcado

El almacén es seguro de editar, pero el Gateway es la autoridad: puede reescribir o rehidratar entradas mientras se ejecutan las sesiones.

---

## Estructura de transcripción (`*.jsonl`)

Las transcripciones las gestiona el `SessionManager` de `@mariozechner/pi-coding-agent`.

El archivo es JSONL:

- Primera línea: encabezado de sesión (`type: "session"`, incluye `id`, `cwd`, `timestamp`, `parentSession` opcional)
- Luego: entradas de sesión con `id` + `parentId` (árbol)

Tipos de entrada destacados:

- `message`: mensajes de usuario/asistente/toolResult
- `custom_message`: mensajes inyectados por extensiones que _sí_ entran en el contexto del modelo (pueden ocultarse de la UI)
- `custom`: estado de extensión que _no_ entra en el contexto del modelo
- `compaction`: resumen de compaction persistido con `firstKeptEntryId` y `tokensBefore`
- `branch_summary`: resumen persistido al navegar por una rama del árbol

OpenClaw intencionalmente **no** “corrige” transcripciones; el Gateway usa `SessionManager` para leerlas/escribirlas.

---

## Ventanas de contexto frente a tokens rastreados

Importan dos conceptos distintos:

1. **Ventana de contexto del modelo**: límite estricto por modelo (tokens visibles para el modelo)
2. **Contadores del almacén de sesiones**: estadísticas móviles escritas en `sessions.json` (usadas para /status y paneles)

Si estás ajustando límites:

- La ventana de contexto proviene del catálogo de modelos (y puede sobrescribirse mediante configuración).
- `contextTokens` en el almacén es un valor de estimación/informe en runtime; no lo trates como una garantía estricta.

Para más información, consulta [/token-use](/es/reference/token-use).

---

## Compaction: qué es

Compaction resume conversaciones antiguas en una entrada `compaction` persistida en la transcripción y mantiene intactos los mensajes recientes.

Después de Compaction, los turnos futuros ven:

- El resumen de compaction
- Mensajes después de `firstKeptEntryId`

Compaction es **persistente** (a diferencia de la poda de sesiones). Consulta [/concepts/session-pruning](/es/concepts/session-pruning).

## Límites de fragmentos de Compaction y emparejamiento de herramientas

Cuando OpenClaw divide una transcripción larga en fragmentos de compaction, mantiene
las llamadas de herramientas del asistente emparejadas con sus entradas `toolResult` correspondientes.

- Si la división por proporción de tokens cae entre una llamada de herramienta y su resultado, OpenClaw
  desplaza el límite al mensaje de llamada de herramienta del asistente en lugar de separar
  el par.
- Si un bloque final de resultados de herramienta empujaría el fragmento por encima del objetivo,
  OpenClaw conserva ese bloque de herramienta pendiente y mantiene intacta
  la cola no resumida.
- Los bloques de llamadas de herramienta abortadas/con error no mantienen abierta una división pendiente.

---

## Cuándo ocurre auto-compaction (runtime de Pi)

En el agente Pi integrado, auto-compaction se activa en dos casos:

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

Estas son semánticas del runtime de Pi (OpenClaw consume los eventos, pero Pi decide cuándo compactar).

OpenClaw también puede activar una compaction local previa antes de abrir la siguiente
ejecución cuando `agents.defaults.compaction.maxActiveTranscriptBytes` está definido y el
archivo de transcripción activo alcanza ese tamaño. Esta es una protección por tamaño de archivo para el coste
de reapertura local, no archivado sin procesar: OpenClaw sigue ejecutando compaction semántica normal,
y requiere `truncateAfterCompaction` para que el resumen compactado pueda convertirse en una
nueva transcripción sucesora.

Para ejecuciones de Pi integrado, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
agrega una protección opcional para el bucle de herramientas. Después de anexar el resultado de una herramienta y antes de la
siguiente llamada al modelo, OpenClaw estima la presión del prompt usando la misma lógica de
presupuesto preliminar utilizada al inicio del turno. Si el contexto ya no cabe, la protección no
ejecuta Compaction dentro del hook `transformContext` de Pi. Emite una señal estructurada de
preverificación a mitad del turno, detiene el envío del prompt actual y permite que el bucle de ejecución
externo use la ruta de recuperación existente: truncar resultados de herramientas demasiado grandes
cuando eso sea suficiente, o activar el modo de Compaction configurado y reintentar. La
opción está deshabilitada de forma predeterminada y funciona con los modos de Compaction `default` y `safeguard`,
incluida la Compaction de salvaguarda respaldada por proveedor.
Esto es independiente de `maxActiveTranscriptBytes`: la protección por tamaño en bytes se ejecuta
antes de que se abra un turno, mientras que la preverificación a mitad del turno se ejecuta después en el bucle de herramientas de Pi integrado,
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

OpenClaw también aplica un mínimo de seguridad para las ejecuciones integradas:

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw lo aumenta.
- El mínimo predeterminado es de `20000` tokens.
- Establece `agents.defaults.compaction.reserveTokensFloor: 0` para deshabilitar el mínimo.
- Si ya es más alto, OpenClaw lo deja igual.
- `/compact` manual respeta un `agents.defaults.compaction.keepRecentTokens` explícito
  y conserva el punto de corte de cola reciente de Pi. Sin un presupuesto de conservación explícito,
  la Compaction manual sigue siendo un punto de control rígido y el contexto reconstruido comienza desde
  el nuevo resumen.
- Establece `agents.defaults.compaction.midTurnPrecheck.enabled: true` para ejecutar la
  preverificación opcional del bucle de herramientas después de los nuevos resultados de herramientas y antes de la siguiente llamada al modelo.
  Esto es solo un disparador; la generación de resúmenes sigue usando la ruta de
  Compaction configurada. Es independiente de `maxActiveTranscriptBytes`, que es una
  protección de tamaño en bytes de la transcripción activa al inicio del turno.
- Establece `agents.defaults.compaction.maxActiveTranscriptBytes` en un valor en bytes o
  una cadena como `"20mb"` para ejecutar Compaction local antes de un turno cuando la transcripción
  activa crezca mucho. Esta protección está activa solo cuando
  `truncateAfterCompaction` también está habilitado. Déjalo sin establecer o establécelo en `0` para
  deshabilitarlo.
- Cuando `agents.defaults.compaction.truncateAfterCompaction` está habilitado,
  OpenClaw rota la transcripción activa a un JSONL sucesor compactado después de
  la Compaction. La transcripción completa anterior permanece archivada y vinculada desde el
  punto de control de Compaction en lugar de reescribirse en el mismo lugar.

Motivo: dejar suficiente margen para tareas de “mantenimiento” de varios turnos (como escrituras de memoria) antes de que la Compaction se vuelva inevitable.

Implementación: `ensurePiCompactionReserveTokens()` en `src/agents/pi-settings.ts`
(llamado desde `src/agents/pi-embedded-runner.ts`).

---

## Proveedores de Compaction conectables

Los Plugins pueden registrar un proveedor de Compaction mediante `registerCompactionProvider()` en la API de plugin. Cuando `agents.defaults.compaction.provider` se establece en un id de proveedor registrado, la extensión de salvaguarda delega el resumen a ese proveedor en lugar de usar la canalización integrada `summarizeInStages`.

- `provider`: id de un Plugin de proveedor de Compaction registrado. Déjalo sin establecer para el resumen LLM predeterminado.
- Establecer un `provider` fuerza `mode: "safeguard"`.
- Los proveedores reciben las mismas instrucciones de Compaction y la misma política de preservación de identificadores que la ruta integrada.
- La salvaguarda aún preserva el contexto de sufijo de turnos recientes y turnos divididos después de la salida del proveedor.
- El resumen de salvaguarda integrado redestila resúmenes anteriores con mensajes nuevos
  en lugar de preservar literalmente todo el resumen previo.
- El modo de salvaguarda habilita auditorías de calidad del resumen de forma predeterminada; establece
  `qualityGuard.enabled: false` para omitir el comportamiento de reintento ante salida mal formada.
- Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre automáticamente al resumen LLM integrado.
- Las señales de aborto/tiempo de espera se vuelven a lanzar (no se absorben) para respetar la cancelación del llamador.

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

OpenClaw admite turnos “silenciosos” para tareas en segundo plano donde el usuario no debería ver salida intermedia.

Convención:

- El asistente inicia su salida con el token silencioso exacto `NO_REPLY` /
  `no_reply` para indicar “no entregar una respuesta al usuario”.
- OpenClaw elimina/suprime esto en la capa de entrega.
- La supresión del token silencioso exacto no distingue mayúsculas de minúsculas, por lo que `NO_REPLY` y
  `no_reply` cuentan cuando toda la carga útil es solo el token silencioso.
- Esto es solo para turnos realmente en segundo plano/sin entrega; no es un atajo para
  solicitudes ordinarias del usuario que requieren acción.

A partir de `2026.1.10`, OpenClaw también suprime el **streaming de borrador/escritura** cuando un
fragmento parcial empieza con `NO_REPLY`, para que las operaciones silenciosas no filtren salida parcial
a mitad del turno.

---

## “Vaciado de memoria” previo a la Compaction (implementado)

Objetivo: antes de que ocurra la Compaction automática, ejecutar un turno agéntico silencioso que escriba estado
duradero en disco (por ejemplo, `memory/YYYY-MM-DD.md` en el espacio de trabajo del agente) para que la Compaction no pueda
borrar contexto crítico.

OpenClaw usa el enfoque de **vaciado previo al umbral**:

1. Supervisa el uso del contexto de la sesión.
2. Cuando cruza un “umbral suave” (por debajo del umbral de Compaction de Pi), ejecuta una directiva silenciosa
   de “escribir memoria ahora” para el agente.
3. Usa el token silencioso exacto `NO_REPLY` / `no_reply` para que el usuario no vea
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
- Cuando `model` está establecido, el turno de vaciado usa ese modelo sin heredar la
  cadena de alternativas de la sesión activa, de modo que el mantenimiento solo local no recurra silenciosamente
  a un modelo de conversación de pago.
- El vaciado se ejecuta una vez por ciclo de Compaction (rastreado en `sessions.json`).
- El vaciado solo se ejecuta para sesiones de Pi integrado (los backends de CLI lo omiten).
- El vaciado se omite cuando el espacio de trabajo de la sesión es de solo lectura (`workspaceAccess: "ro"` o `"none"`).
- Consulta [Memoria](/es/concepts/memory) para el diseño de archivos del espacio de trabajo y los patrones de escritura.

Pi también expone un hook `session_before_compact` en la API de extensión, pero la lógica de
vaciado de OpenClaw vive hoy del lado del Gateway.

---

## Lista de comprobación de solución de problemas

- ¿Clave de sesión incorrecta? Empieza con [/concepts/session](/es/concepts/session) y confirma el `sessionKey` en `/status`.
- ¿Desajuste entre almacén y transcripción? Confirma el host del Gateway y la ruta del almacén desde `openclaw status`.
- ¿Demasiada Compaction? Revisa:
  - ventana de contexto del modelo (demasiado pequeña)
  - configuración de Compaction (`reserveTokens` demasiado alto para la ventana del modelo puede causar Compaction más temprana)
  - crecimiento excesivo de resultados de herramientas: habilita/ajusta la poda de sesión
- ¿Se filtran turnos silenciosos? Confirma que la respuesta empieza con `NO_REPLY` (token exacto sin distinguir mayúsculas de minúsculas) y que estás en una build que incluye la corrección de supresión de streaming.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesión](/es/concepts/session-pruning)
- [Motor de contexto](/es/concepts/context-engine)
