---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor relacionados con la estructura de la transcripción
    - Estás cambiando la lógica de saneamiento de transcripciones o de reparación de llamadas a herramientas
    - Estás investigando discrepancias en los identificadores de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de las transcripciones
x-i18n:
    generated_at: "2026-07-11T23:30:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución
(al construir el contexto del modelo). La mayoría son ajustes **en memoria** utilizados para
satisfacer los requisitos estrictos del proveedor. Un proceso independiente de reparación del archivo
de sesión también puede reescribir el JSONL almacenado antes de cargar la sesión, pero solo para
líneas con formato incorrecto o turnos persistidos que no constituyan registros duraderos válidos.
Las respuestas entregadas del asistente se conservan en disco; la eliminación de la precarga
del asistente específica del proveedor ocurre únicamente al construir las cargas útiles
salientes.

Cuando se realiza una reparación, el archivo original se escribe en un archivo hermano transitorio
`*.bak-<pid>-<ts>` antes del reemplazo atómico y se elimina una vez que el
reemplazo se completa correctamente. La copia de seguridad solo se conserva si falla la propia limpieza,
en cuyo caso se informa de la ruta.

El alcance incluye:

- Mantener el contexto del prompt exclusivo del entorno de ejecución fuera de los turnos visibles para el usuario
- Saneamiento de identificadores de llamadas a herramientas
- Validación de entradas de llamadas a herramientas
- Reparación del emparejamiento de resultados de herramientas
- Validación y ordenación de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de razonamiento
- Saneamiento de cargas útiles de imágenes
- Limpieza de bloques de texto vacíos antes de la reproducción para el proveedor
- Limpieza de turnos incompletos por límite de longitud que solo contienen razonamiento antes de la reproducción para el proveedor
- Etiquetado de procedencia de entradas del usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para la reproducción de Bedrock Converse

Si necesita información detallada sobre el almacenamiento de transcripciones, consulte
[Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction).

---

## Regla global: el contexto del entorno de ejecución no es la transcripción del usuario

El contexto del entorno de ejecución o del sistema puede añadirse al prompt del modelo para un turno, pero no es
contenido creado por el usuario final. OpenClaw mantiene un cuerpo de prompt independiente,
destinado a la transcripción, para las respuestas del Gateway, los seguimientos en cola, ACP, CLI y las
ejecuciones integradas de OpenClaw. Los turnos visibles del usuario almacenados utilizan ese cuerpo de transcripción en lugar del
prompt enriquecido por el entorno de ejecución.

En las sesiones antiguas que ya hayan persistido envoltorios del entorno de ejecución, las superficies del historial del Gateway
aplican una proyección de visualización antes de devolver los mensajes a clientes
WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta

Toda la normalización de transcripciones está centralizada en el ejecutor integrado:

- Selección de políticas: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, indexada por `provider`, `modelApi` y `modelId`)
- Aplicación del saneamiento y la reparación: `sanitizeSessionHistory` en
  `src/agents/embedded-agent-runner/replay-history.ts`

Independientemente de la normalización de transcripciones, los archivos de sesión se reparan (si es necesario)
antes de cargarlos:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Se invoca desde `src/agents/embedded-agent-runner/run/attempt.ts` y
  `src/agents/embedded-agent-runner/compact.ts`

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imágenes siempre se sanean para evitar que el proveedor las rechace debido a
límites de tamaño (reducción de escala o recompresión de imágenes base64 demasiado grandes). Esto también ayuda a
controlar la presión sobre los tokens causada por imágenes en modelos con capacidades de visión: unas dimensiones
máximas menores reducen el uso de tokens, mientras que unas dimensiones mayores conservan los detalles.

Implementación:

- `sanitizeSessionMessagesImages` en
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de la imagen se puede configurar mediante `agents.defaults.imageMaxDimensionPx`
  (valor predeterminado: `1200`)
- Los bloques de texto vacíos se eliminan mientras este proceso recorre el contenido de reproducción.
  Los turnos del asistente que quedan vacíos se descartan de la copia de reproducción; los turnos del usuario
  y de resultados de herramientas que quedan vacíos reciben un marcador no vacío
  de contenido omitido.

---

## Regla global: llamadas a herramientas con formato incorrecto

Los bloques de llamadas a herramientas del asistente que carezcan tanto de `input` como de `arguments` se descartan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor provocados por
llamadas a herramientas persistidas parcialmente (por ejemplo, tras un fallo por límite de solicitudes).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Se aplica en `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Regla global: turnos incompletos que solo contienen razonamiento

Los turnos del asistente que alcanzan el límite de salida del proveedor y solo contienen
contenido de razonamiento o razonamiento censurado se omiten de la copia de reproducción en memoria. Estos
turnos contienen un estado incompleto del proveedor y pueden incluir una firma de razonamiento
parcial.

Los turnos vacíos por límite de longitud permanecen sin cambios, al igual que los turnos por límite de longitud con texto visible,
llamadas a herramientas o bloques de contenido desconocidos. Las transcripciones almacenadas no se reescriben.

Implementación: `normalizeAssistantReplayContent` en
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Regla global: procedencia de entradas entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send`
(incluidos los pasos de respuesta o anuncio entre agentes), OpenClaw persiste el
turno de usuario creado con `message.provenance.kind = "inter_session"`.

OpenClaw también antepone un marcador `[Inter-session message] ... isUser=false`
en el mismo turno antes del texto del prompt enrutado, para que la llamada activa al modelo pueda
distinguir la salida de una sesión ajena de las instrucciones externas del usuario final. Este
marcador incluye la sesión, el canal y la herramienta de origen cuando están disponibles. La
transcripción sigue utilizando `role: "user"` por compatibilidad con el proveedor, pero tanto el
texto visible como los metadatos de procedencia marcan el turno como datos
entre sesiones.

Durante la reconstrucción del contexto, OpenClaw aplica el mismo marcador a turnos de usuario
antiguos persistidos entre sesiones que solo contienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Se descartan las firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un
  bloque de contenido posterior) en las transcripciones de OpenAI Responses/Codex y se descarta
  el razonamiento reproducible de OpenAI después de cambiar la ruta del modelo.
- Se conservan las cargas útiles reproducibles de elementos de razonamiento de OpenAI Responses, incluidos
  los elementos cifrados con resumen vacío, para que la reproducción manual o mediante WebSocket mantenga el estado
  `rs_*` requerido emparejado con los elementos de salida del asistente.
- ChatGPT Codex Responses nativo mantiene la equivalencia con el protocolo de Codex al reproducir
  las cargas útiles anteriores de razonamiento, mensajes y funciones de Responses sin identificadores
  de elementos anteriores, al tiempo que conserva el `prompt_cache_key` de la sesión.
- La reproducción de la familia OpenAI Responses conserva los pares canónicos de razonamiento
  `call_*|fc_*` del mismo modelo, pero normaliza de forma determinista los identificadores `call_id`
  o de elementos de llamadas a funciones con formato incorrecto o demasiado largos antes de convertirlos
  en cargas útiles de pi-ai.
- La reparación del emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar
  salidas `aborted` al estilo de Codex para llamadas a herramientas ausentes.
- No se validan ni reordenan los turnos; no se eliminan firmas de pensamiento.

**Chat Completions compatibles con OpenAI**

- Los bloques históricos de pensamiento o razonamiento del asistente se eliminan antes de la reproducción
  para que los servidores locales y de tipo proxy compatibles con OpenAI no reciban
  campos de razonamiento de turnos anteriores, como `reasoning` o `reasoning_content`.
- Las continuaciones de llamadas a herramientas del mismo turno actual mantienen el bloque de razonamiento del asistente
  adjunto a la llamada a la herramienta hasta que se haya reproducido el resultado de la herramienta.
- Las entradas de modelos personalizados o autoalojados con `reasoning: true` conservan los metadatos
  de razonamiento reproducidos.
- Las excepciones propiedad del proveedor pueden excluirse cuando su protocolo de comunicación requiere
  metadatos de razonamiento reproducidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de identificadores de llamadas a herramientas: estrictamente alfanuméricos.
- Reparación del emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (alternancia de turnos al estilo de Gemini).
- Corrección del orden de los turnos de Google (antepone una breve inicialización del usuario si el historial
  comienza con el asistente).
- Antigravity Claude: normaliza las firmas de razonamiento y descarta los bloques de razonamiento
  sin firmar.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación del emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (combina turnos consecutivos del usuario para satisfacer la
  alternancia estricta).
- Los turnos finales de precarga del asistente se eliminan de las cargas útiles salientes de Anthropic
  Messages cuando el razonamiento está activado, incluidas las rutas de Cloudflare AI
  Gateway.
- Las firmas de razonamiento del asistente anteriores a la Compaction se eliminan antes de la reproducción para el proveedor
  cuando se ha compactado una sesión. Las firmas de razonamiento están
  vinculadas criptográficamente al prefijo de la conversación en el momento de su generación;
  tras la Compaction, el prefijo cambia (el contenido resumido sustituye al
  original), por lo que reproducir las firmas originales provoca que Anthropic
  rechace la solicitud con "Invalid signature in thinking block". El
  texto de razonamiento se conserva como un bloque sin firmar y después se procesa mediante la
  regla siguiente.
- Los bloques de razonamiento cuyas firmas de reproducción estén ausentes, vacías o en blanco se
  eliminan antes de la conversión para el proveedor. Si esto deja vacío un turno del asistente,
  OpenClaw conserva la estructura del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente que solo contienen razonamiento y deben eliminarse se sustituyen
  por texto no vacío de razonamiento omitido para que los adaptadores del proveedor no descarten
  el turno reproducido.

**Amazon Bedrock (Converse API)**

- Los turnos vacíos del asistente con errores de transmisión se reparan con un bloque de texto
  alternativo no vacío antes de la reproducción. Bedrock Converse rechaza los mensajes del asistente
  con `content: []`, por lo que los turnos persistidos del asistente con `stopReason:
"error"` y contenido vacío también se reparan en disco antes de cargarlos.
- Los turnos del asistente con errores de transmisión que solo contienen bloques de texto en blanco se descartan de
  la copia de reproducción en memoria, en lugar de reproducir un bloque en blanco no válido.
- Las firmas de razonamiento del asistente anteriores a la Compaction se eliminan antes de la reproducción de Converse
  cuando se ha compactado una sesión, por el mismo motivo que en Anthropic
  anteriormente.
- Los bloques de razonamiento de Claude cuyas firmas de reproducción estén ausentes, vacías o en blanco
  se eliminan antes de la reproducción de Converse. Si esto deja vacío un turno del asistente,
  OpenClaw conserva la estructura del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente que solo contienen razonamiento y deben eliminarse se sustituyen
  por texto no vacío de razonamiento omitido para que la reproducción de Converse conserve
  la estructura estricta de los turnos.
- La reproducción filtra los turnos del asistente que son duplicados de entrega de OpenClaw o están
  inyectados por el Gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida la detección basada en el identificador del modelo)**

- Saneamiento de identificadores de llamadas a herramientas: strict9 (alfanuméricos, longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina los valores `thought_signature` que no sean base64
  (conserva los que sean base64).

**OpenRouter Anthropic**

- Los turnos finales de precarga del asistente se eliminan de las cargas útiles verificadas de modelos
  Anthropic compatibles con OpenAI de OpenRouter cuando el razonamiento está activado,
  de acuerdo con el comportamiento de reproducción directo de Anthropic y de Cloudflare Anthropic.

**Todos los demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de normalización de
transcripciones:

- Una **extensión de saneamiento de transcripciones** se ejecutaba en cada construcción del contexto y podía:
  - Reparar el emparejamiento entre uso y resultado de herramientas.
  - Sanear los identificadores de llamadas a herramientas (incluido un modo no estricto que conservaba
    `_`/`-`).
- El ejecutor también realizaba un saneamiento específico del proveedor, lo que
  duplicaba el trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, como
  eliminar las etiquetas `<final>` del texto del asistente antes de persistirlo, descartar
  turnos vacíos de error del asistente y recortar el contenido del asistente después de las llamadas a
  herramientas.

Esta complejidad provocó regresiones entre proveedores (especialmente en el
emparejamiento `call_id|fc_id` de `openai-responses`). La limpieza de la versión 2026.1.22 eliminó
la extensión, centralizó la lógica en el ejecutor e hizo que OpenAI permaneciera **sin modificaciones**
más allá del saneamiento de imágenes.

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
