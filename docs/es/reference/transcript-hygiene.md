---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor relacionados con la estructura de la transcripción
    - Está modificando la lógica de saneamiento de transcripciones o de reparación de llamadas a herramientas
    - Estás investigando discrepancias en los identificadores de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de las transcripciones
x-i18n:
    generated_at: "2026-07-21T09:03:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d978772062cb2a81eb358bb5c62bd1261b433ffdc8acdbaa6679b121fbbf62
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución
(al construir el contexto del modelo). La mayoría son ajustes **en memoria** utilizados para
cumplir los estrictos requisitos del proveedor. Un proceso independiente de reparación del archivo de sesión también puede
reescribir el JSONL almacenado antes de cargar la sesión, pero solo para
líneas malformadas o turnos persistidos que no sean registros duraderos válidos.
Las respuestas del asistente entregadas se conservan en el disco; la eliminación específica del proveedor
del prefill del asistente solo se produce al construir los
payloads salientes.

Cuando se realiza una reparación, el archivo original se escribe en un archivo hermano transitorio
`*.bak-<pid>-<ts>` antes del reemplazo atómico y, después, se elimina cuando el
reemplazo se completa correctamente. La copia de seguridad se conserva solo si falla la propia limpieza, en
cuyo caso se devuelve la ruta.

El alcance incluye:

- El contexto del prompt solo de tiempo de ejecución se mantiene fuera de los turnos de transcripción visibles para el usuario
- Saneamiento del id de llamada a herramienta
- Validación de la entrada de llamada a herramienta
- Reparación del emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de razonamiento
- Saneamiento del payload de imágenes
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Limpieza de turnos incompletos limitados únicamente al razonamiento antes de la reproducción del proveedor
- Etiquetado de procedencia de la entrada del usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para la reproducción de Bedrock Converse

Para obtener detalles sobre el almacenamiento de transcripciones, consulte
[Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction).

---

## Regla global: el contexto de tiempo de ejecución no es una transcripción del usuario

El contexto de tiempo de ejecución/sistema puede añadirse al prompt del modelo para un turno, pero no es
contenido creado por el usuario final. OpenClaw mantiene un cuerpo del prompt independiente orientado a la
transcripción para las respuestas del Gateway, los seguimientos en cola, ACP, CLI y las ejecuciones
integradas de OpenClaw. Los turnos visibles del usuario almacenados utilizan ese cuerpo de transcripción en lugar
del prompt enriquecido en tiempo de ejecución.

Para las sesiones heredadas que ya hayan persistido envoltorios de tiempo de ejecución, las superficies del historial
del Gateway aplican una proyección de visualización antes de devolver los mensajes a los clientes
WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta

Toda la higiene de las transcripciones está centralizada en el ejecutor integrado:

- Selección de políticas: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, con claves basadas en `provider`, `modelApi` y `modelId`)
- Aplicación del saneamiento/reparación: `sanitizeSessionHistory` en
  `src/agents/embedded-agent-runner/replay-history.ts`

Independientemente de la higiene de las transcripciones, los archivos de sesión se reparan (si es necesario)
antes de cargarlos:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Se invoca desde `src/agents/embedded-agent-runner/run/attempt.ts` y
  `src/agents/embedded-agent-runner/compact.ts`

---

## Regla global: saneamiento de imágenes

Los payloads de imágenes siempre se sanean para evitar que el proveedor los rechace debido a
los límites de tamaño (se reducen las dimensiones o se recomprimen las imágenes base64 demasiado grandes). Esto también ayuda a
controlar la presión sobre los tokens causada por las imágenes en modelos con capacidad de visión: unas dimensiones
máximas menores reducen el uso de tokens, mientras que unas dimensiones mayores conservan los detalles.

Implementación:

- `sanitizeSessionMessagesImages` en
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de la imagen se puede configurar mediante `agents.defaults.imageMaxDimensionPx`
  (valor predeterminado: `1200`)
- Los bloques de texto en blanco se eliminan mientras este proceso recorre el contenido de reproducción.
  Los turnos del asistente que quedan vacíos se descartan de la copia de reproducción; los turnos del usuario
  y de resultados de herramientas que quedan vacíos reciben un marcador no vacío
  de contenido omitido.

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamadas a herramientas del asistente a los que les falten tanto `input` como `arguments` se descartan
antes de construir el contexto del modelo. Esto evita que el proveedor rechace
llamadas a herramientas persistidas parcialmente (por ejemplo, después de un fallo por límite de frecuencia).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Se aplica en `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Regla global: emparejamiento de resultados de herramientas

Los resultados de herramientas se emparejan con las apariciones de llamadas a herramientas dentro de cada turno del asistente antes de
reescribir los identificadores de llamadas específicos del proveedor. Los identificadores generados por el proveedor pueden repetirse en turnos
posteriores, por lo que un resultado adyacente a una llamada repetida permanece con esa aparición. Un resultado
desplazado solo se mueve cuando exactamente una aparición sin resolver puede poseerlo; los elementos adicionales
ambiguos se descartan y las apariciones faltantes reciben resultados de error sintéticos.

Implementación: `sanitizeToolUseResultPairing` en
`src/agents/session-transcript-repair.ts`

---

## Regla global: turnos incompletos o silenciosos únicamente de razonamiento

Los turnos del asistente se omiten de la copia de reproducción en memoria cuando contienen
solo contenido de razonamiento o razonamiento censurado después de cualquiera de estos eventos:

- El límite de salida del proveedor finaliza el turno con un estado de razonamiento incompleto.
- La limpieza de respuestas silenciosas elimina el único texto `NO_REPLY` visible del turno.

La limpieza de respuestas silenciosas evita que el razonamiento oculto se combine con un turno posterior
del asistente que utilice herramientas cuando los proveedores estrictos reconstruyen la conversación.

Los turnos vacíos por límite de longitud permanecen sin cambios, al igual que los turnos por límite de longitud con texto visible,
llamadas a herramientas o bloques de contenido desconocidos. Los turnos de respuesta silenciosa con llamadas a herramientas o
bloques de contenido desconocidos también permanecen sin cambios. Las transcripciones almacenadas no se
reescriben.

Implementación: `normalizeAssistantReplayContent` en
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Regla global: procedencia de entradas entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send`
(incluidos los pasos de respuesta/anuncio entre agentes), OpenClaw persiste el
turno de usuario creado con `message.provenance.kind = "inter_session"`.

OpenClaw también antepone un marcador `[Inter-session message] ... isUser=false` en el mismo turno
antes del texto del prompt enrutado para que la llamada activa al modelo pueda
distinguir la salida de una sesión ajena de las instrucciones externas del usuario final. Este
marcador incluye la sesión, el canal y la herramienta de origen cuando están disponibles. La
transcripción sigue utilizando `role: "user"` para mantener la compatibilidad con el proveedor, pero tanto el
texto visible como los metadatos de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción del contexto, OpenClaw aplica el mismo marcador a los turnos de usuario
entre sesiones persistidos anteriormente que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un
  bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex y descarta
  el razonamiento reproducible de OpenAI después de cambiar la ruta del modelo.
- Conserva los payloads reproducibles de elementos de razonamiento de OpenAI Responses, incluidos
  los elementos cifrados con resumen vacío, para que la reproducción manual/por WebSocket mantenga el estado
  `rs_*` requerido emparejado con los elementos de salida del asistente.
- Responses nativo de ChatGPT Codex mantiene la paridad de protocolo de Codex al reproducir
  payloads anteriores de razonamiento/mensajes/funciones de Responses sin los identificadores de elementos
  anteriores, a la vez que conserva el `prompt_cache_key` de la sesión.
- La reproducción de la familia OpenAI Responses conserva los pares de razonamiento canónicos
  `call_*|fc_*` del mismo modelo, pero normaliza de forma determinista los identificadores de elementos
  `call_id`/llamadas a funciones malformados o demasiado largos antes de la conversión del payload de pi-ai.
- La reparación del emparejamiento de resultados de herramientas puede mover salidas reales emparejadas y sintetizar
  salidas `aborted` al estilo de Codex para las llamadas a herramientas faltantes.
- Sin validación ni reordenación de turnos; sin eliminación de firmas de pensamiento.

**Chat Completions compatibles con OpenAI**

- Los bloques históricos de pensamiento/razonamiento del asistente se eliminan antes de la reproducción
  para que los servidores locales y de tipo proxy compatibles con OpenAI no reciban
  campos de razonamiento de turnos anteriores, como `reasoning` o `reasoning_content`.
- Las continuaciones de llamadas a herramientas del mismo turno actual mantienen el bloque de razonamiento
  del asistente adjunto a la llamada a la herramienta hasta que se haya reproducido el resultado de la herramienta.
- Las entradas de modelos personalizados/alojados por el propio usuario con `reasoning: true` conservan los
  metadatos de razonamiento reproducidos.
- Las excepciones propiedad del proveedor pueden excluirse cuando su protocolo de comunicación requiera
  metadatos de razonamiento reproducidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento del id de llamada a herramienta: estrictamente alfanumérico.
- Reparación del emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (alternancia de turnos al estilo de Gemini).
- Corrección de la ordenación de turnos de Google (antepone un pequeño mensaje de inicialización del usuario si el historial
  comienza con el asistente).
- Claude de Antigravity: normaliza las firmas de razonamiento; descarta los bloques de razonamiento
  sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación del emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (combina turnos consecutivos del usuario para cumplir una
  alternancia estricta).
- Los turnos finales de prefill del asistente se eliminan de los payloads salientes de Anthropic
  Messages cuando el razonamiento está activado, incluidas las rutas de Cloudflare AI
  Gateway.
- Las firmas de razonamiento del asistente anteriores a Compaction se eliminan antes de la reproducción del proveedor
  cuando se ha compactado una sesión. Las firmas de razonamiento están
  vinculadas criptográficamente al prefijo de la conversación en el momento de su generación;
  después de Compaction, el prefijo cambia (el contenido resumido sustituye al
  original), por lo que reproducir las firmas originales hace que Anthropic
  rechace la solicitud con "Firma no válida en el bloque de razonamiento". El
  texto de razonamiento se conserva como un bloque sin firma y, después, se procesa mediante la
  regla siguiente.
- Los bloques de razonamiento cuyas firmas de reproducción falten, estén vacías o en blanco se
  eliminan antes de la conversión del proveedor. Si esto vacía un turno del asistente,
  OpenClaw conserva la estructura del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente únicamente de razonamiento que deban eliminarse se sustituyen
  por texto no vacío de razonamiento omitido para que los adaptadores del proveedor no descarten
  el turno reproducido.

**Amazon Bedrock (API Converse)**

- Los turnos vacíos del asistente con errores de transmisión se reparan con un bloque de texto alternativo
  no vacío antes de la reproducción. Bedrock Converse rechaza los mensajes del asistente
  con `content: []`, por lo que los turnos persistidos del asistente con `stopReason:
"error"` y contenido vacío también se reparan en el disco antes de cargarlos.
- Los turnos del asistente con errores de transmisión que solo contienen bloques de texto en blanco se descartan de
  la copia de reproducción en memoria en lugar de reproducir un bloque en blanco no válido.
- Las firmas de razonamiento del asistente anteriores a Compaction se eliminan antes de la reproducción de Converse
  cuando se ha compactado una sesión, por el mismo motivo que se indicó anteriormente para
  Anthropic.
- Los bloques de razonamiento de Claude cuyas firmas de reproducción falten, estén vacías o en blanco
  se eliminan antes de la reproducción de Converse. Si esto vacía un turno del asistente,
  OpenClaw conserva la estructura del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente únicamente de razonamiento que deban eliminarse se sustituyen
  por texto no vacío de razonamiento omitido para que la reproducción de Converse mantenga
  la estructura estricta de los turnos.
- La reproducción filtra los turnos del asistente de reflejo de entrega y los inyectados por el Gateway
  de OpenClaw.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida la detección basada en el id del modelo)**

- Saneamiento del id de llamada a herramienta: strict9 (alfanumérico, longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina los valores `thought_signature` que no sean base64
  (conserva los base64).

**OpenRouter Anthropic**

- Los turnos finales de prefill del asistente se eliminan de los payloads verificados de modelos Anthropic
  compatibles con OpenAI de OpenRouter cuando el razonamiento está activado,
  de acuerdo con el comportamiento de reproducción directa de Anthropic y Cloudflare Anthropic.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de las
transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada creación de contexto y podía:
  - Reparar el emparejamiento entre el uso de herramientas y sus resultados.
  - Sanear los identificadores de llamadas a herramientas (incluido un modo no estricto que conservaba
    `_`/`-`).
- El ejecutor también realizaba un saneamiento específico del proveedor, lo que
  duplicaba el trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, como
  eliminar las etiquetas `<final>` del texto del asistente antes de la persistencia, descartar
  los turnos de error vacíos del asistente y recortar el contenido del asistente después de las llamadas
  a herramientas.

Esta complejidad provocó regresiones entre proveedores (en particular, en el
emparejamiento de `openai-responses` y `call_id|fc_id`). La limpieza de 2026.1.22 eliminó
la extensión, centralizó la lógica en el ejecutor y dejó OpenAI **sin modificaciones**
aparte del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
