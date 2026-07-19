---
read_when:
    - Está depurando rechazos de solicitudes del proveedor relacionados con la estructura de la transcripción
    - Está cambiando la lógica de saneamiento de transcripciones o de reparación de llamadas a herramientas
    - Está investigando discrepancias en los identificadores de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de transcripciones
x-i18n:
    generated_at: "2026-07-19T02:05:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b64deba757d0eb3fd2cd177b6b16f4e071abbf8965a05ac087dddf086fdc920
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución
(al construir el contexto del modelo). La mayoría son ajustes **en memoria** utilizados para
satisfacer requisitos estrictos del proveedor. Un proceso independiente de reparación del archivo de sesión también puede
reescribir el JSONL almacenado antes de cargar la sesión, pero únicamente para
líneas malformadas o turnos persistidos que no sean registros duraderos válidos.
Las respuestas entregadas del asistente se conservan en disco; la eliminación del
prefill del asistente específica del proveedor solo ocurre al construir las cargas
útiles salientes.

Cuando se realiza una reparación, el archivo original se escribe en un archivo hermano transitorio
`*.bak-<pid>-<ts>` antes del reemplazo atómico y, después, se elimina cuando el
reemplazo se completa correctamente. La copia de seguridad solo se conserva si falla la propia limpieza, en
cuyo caso se informa de la ruta.

El alcance incluye:

- El contexto de prompt exclusivo del entorno de ejecución no aparece en los turnos de transcripción visibles para el usuario
- Saneamiento de identificadores de llamadas a herramientas
- Validación de entradas de llamadas a herramientas
- Reparación del emparejamiento de resultados de herramientas
- Validación y ordenación de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de razonamiento
- Saneamiento de cargas útiles de imágenes
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Limpieza de turnos incompletos limitados por longitud que solo contienen razonamiento antes de la reproducción del proveedor
- Etiquetado de procedencia de entradas del usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para la reproducción de Bedrock Converse

Para obtener información sobre el almacenamiento de transcripciones, consulte
[Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction).

---

## Regla global: el contexto del entorno de ejecución no forma parte de la transcripción del usuario

El contexto del entorno de ejecución o del sistema puede añadirse al prompt del modelo para un turno, pero
no es contenido creado por el usuario final. OpenClaw mantiene un cuerpo de prompt independiente
destinado a la transcripción para las respuestas del Gateway, los seguimientos en cola, ACP, la CLI y las
ejecuciones integradas de OpenClaw. Los turnos visibles del usuario almacenados utilizan ese cuerpo de transcripción en lugar
del prompt enriquecido por el entorno de ejecución.

Para las sesiones heredadas que ya hayan persistido envoltorios del entorno de ejecución, las superficies de historial
del Gateway aplican una proyección de visualización antes de devolver los mensajes a clientes
WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta

Toda la higiene de transcripciones está centralizada en el ejecutor integrado:

- Selección de políticas: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, indexada por `provider`, `modelApi` y `modelId`)
- Aplicación del saneamiento y la reparación: `sanitizeSessionHistory` en
  `src/agents/embedded-agent-runner/replay-history.ts`

De forma independiente de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario)
antes de cargarlos:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Se invoca desde `src/agents/embedded-agent-runner/run/attempt.ts` y
  `src/agents/embedded-agent-runner/compact.ts`

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imágenes siempre se sanean para evitar el rechazo por parte del proveedor debido a
los límites de tamaño (se reduce la escala o se vuelven a comprimir las imágenes base64 sobredimensionadas). Esto también ayuda a
controlar la presión de tokens provocada por imágenes en los modelos con capacidad de visión: unas dimensiones
máximas menores reducen el uso de tokens, mientras que unas dimensiones mayores conservan los detalles.

Implementación:

- `sanitizeSessionMessagesImages` en
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de la imagen se puede configurar mediante `agents.defaults.imageMaxDimensionPx`
  (valor predeterminado: `1200`)
- Los bloques de texto en blanco se eliminan mientras este proceso recorre el contenido de reproducción.
  Los turnos del asistente que quedan vacíos se descartan de la copia de reproducción; los turnos
  del usuario y de resultados de herramientas que quedan vacíos reciben un marcador de posición
  no vacío de contenido omitido.

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamadas a herramientas del asistente a los que les falten tanto `input` como `arguments` se descartan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor provocados por
llamadas a herramientas persistidas parcialmente (por ejemplo, después de un fallo por límite de frecuencia).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Se aplica en `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Regla global: emparejamiento de resultados de herramientas

Los resultados de herramientas se emparejan con las apariciones de llamadas a herramientas dentro de cada turno del asistente antes de
reescribir los identificadores de llamada específicos del proveedor. Los identificadores generados por el proveedor pueden repetirse en turnos
posteriores, por lo que un resultado adyacente a una llamada repetida permanece asociado a esa aparición. Un resultado
desplazado solo se mueve cuando existe exactamente una aparición sin resolver que pueda ser su propietaria; los elementos
adicionales ambiguos se descartan y las apariciones ausentes reciben resultados de error sintéticos.

Implementación: `sanitizeToolUseResultPairing` en
`src/agents/session-transcript-repair.ts`

---

## Regla global: turnos incompletos que solo contienen razonamiento

Los turnos del asistente que alcanzan el límite de salida del proveedor y solo contienen pensamiento o
contenido de pensamiento censurado se omiten de la copia de reproducción en memoria. Estos
turnos contienen un estado incompleto del proveedor y pueden incluir una firma de pensamiento
parcial.

Los turnos vacíos limitados por longitud permanecen sin cambios, al igual que los turnos limitados por longitud con texto visible,
llamadas a herramientas o bloques de contenido desconocidos. Las transcripciones almacenadas no se reescriben.

Implementación: `normalizeAssistantReplayContent` en
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Regla global: procedencia de entradas entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send`
(incluidos los pasos de respuesta o anuncio entre agentes), OpenClaw persiste el
turno de usuario creado con `message.provenance.kind = "inter_session"`.

OpenClaw también antepone un marcador `[Inter-session message] ... isUser=false` en el mismo turno
antes del texto del prompt enrutado para que la llamada activa al modelo pueda
distinguir la salida de una sesión externa de las instrucciones externas del usuario final. Este
marcador incluye la sesión, el canal y la herramienta de origen cuando están disponibles. La
transcripción sigue utilizando `role: "user"` para mantener la compatibilidad con el proveedor, pero tanto el
texto visible como los metadatos de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción del contexto, OpenClaw aplica el mismo marcador a los turnos
de usuario entre sesiones persistidos anteriormente que solo tengan metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Se descartan las firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un
  bloque de contenido posterior) de las transcripciones de OpenAI Responses/Codex, y se descarta
  el razonamiento reproducible de OpenAI después de cambiar la ruta del modelo.
- Se conservan las cargas útiles reproducibles de los elementos de razonamiento de OpenAI Responses, incluidos
  los elementos cifrados con resumen vacío, para que la reproducción manual o mediante WebSocket mantenga el estado
  `rs_*` requerido emparejado con los elementos de salida del asistente.
- Las Responses nativas de ChatGPT Codex mantienen la paridad con el protocolo de Codex al reproducir
  cargas útiles anteriores de razonamiento, mensajes y funciones de Responses sin identificadores de elementos
  anteriores, al tiempo que conservan el `prompt_cache_key` de la sesión.
- La reproducción de la familia OpenAI Responses conserva los pares canónicos de razonamiento
  `call_*|fc_*` del mismo modelo, pero normaliza de forma determinista los identificadores de elementos
  `call_id`/de llamadas a funciones malformados o demasiado largos antes de convertir la carga útil de pi-ai.
- La reparación del emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar
  salidas `aborted` al estilo de Codex para las llamadas a herramientas ausentes.
- No se validan ni reordenan los turnos; no se eliminan las firmas de pensamiento.

**Chat Completions compatibles con OpenAI**

- Los bloques históricos de pensamiento o razonamiento del asistente se eliminan antes de la reproducción
  para que los servidores locales y de estilo proxy compatibles con OpenAI no reciban
  campos de razonamiento de turnos anteriores como `reasoning` o `reasoning_content`.
- Las continuaciones de llamadas a herramientas del mismo turno actual mantienen el bloque de razonamiento del asistente
  asociado a la llamada a la herramienta hasta que se haya reproducido el resultado de la herramienta.
- Las entradas de modelos personalizados o autoalojados con `reasoning: true` conservan los metadatos
  de razonamiento reproducidos.
- Las excepciones propiedad del proveedor pueden desactivar este comportamiento cuando su protocolo de comunicación requiere
  metadatos de razonamiento reproducidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de identificadores de llamadas a herramientas: estrictamente alfanuméricos.
- Reparación del emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (alternancia de turnos al estilo de Gemini).
- Corrección de la ordenación de turnos de Google (se antepone un pequeño mensaje de inicio del usuario si el historial
  comienza con el asistente).
- Claude de Antigravity: se normalizan las firmas de pensamiento y se descartan los bloques de pensamiento
  sin firmar.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación del emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (se combinan los turnos consecutivos del usuario para satisfacer una alternancia
  estricta).
- Los turnos finales de prefill del asistente se eliminan de las cargas útiles salientes de Anthropic
  Messages cuando el pensamiento está habilitado, incluidas las rutas de Cloudflare AI
  Gateway.
- Las firmas de pensamiento del asistente anteriores a la Compaction se eliminan antes de la
  reproducción del proveedor cuando una sesión se ha compactado. Las firmas de pensamiento están
  vinculadas criptográficamente al prefijo de la conversación en el momento de su generación;
  después de la Compaction, el prefijo cambia (el contenido resumido sustituye al
  original), por lo que reproducir las firmas originales hace que Anthropic
  rechace la solicitud con "Invalid signature in thinking block". El
  texto de pensamiento se conserva como un bloque sin firmar y, después, se procesa mediante la
  regla siguiente.
- Los bloques de pensamiento cuyas firmas de reproducción estén ausentes, vacías o en blanco se
  eliminan antes de la conversión del proveedor. Si esto vacía un turno del asistente,
  OpenClaw conserva la estructura del turno con texto no vacío de razonamiento omitido.
- Los turnos anteriores del asistente que solo contienen pensamiento y que deben eliminarse se sustituyen
  por texto no vacío de razonamiento omitido para que los adaptadores del proveedor no descarten
  el turno de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos vacíos de error de transmisión del asistente se reparan con un bloque de texto alternativo
  no vacío antes de la reproducción. Bedrock Converse rechaza los mensajes del asistente
  con `content: []`, por lo que los turnos persistidos del asistente con `stopReason:
"error"` y contenido vacío también se reparan en disco antes de cargarlos.
- Los turnos de error de transmisión del asistente que solo contienen bloques de texto en blanco se descartan de
  la copia de reproducción en memoria en lugar de reproducir un bloque en blanco no válido.
- Las firmas de pensamiento del asistente anteriores a la Compaction se eliminan antes de la reproducción de Converse
  cuando una sesión se ha compactado, por el mismo motivo que en el caso de
  Anthropic descrito anteriormente.
- Los bloques de pensamiento de Claude cuyas firmas de reproducción estén ausentes, vacías o en blanco
  se eliminan antes de la reproducción de Converse. Si esto vacía un turno del asistente,
  OpenClaw conserva la estructura del turno con texto no vacío de razonamiento omitido.
- Los turnos anteriores del asistente que solo contienen pensamiento y que deben eliminarse se sustituyen
  por texto no vacío de razonamiento omitido para que la reproducción de Converse mantenga
  una estructura de turnos estricta.
- La reproducción filtra los turnos del asistente de reflejo de entrega de OpenClaw y los inyectados por el Gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida la detección basada en el identificador del modelo)**

- Saneamiento de identificadores de llamadas a herramientas: strict9 (alfanuméricos, longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: se eliminan los valores `thought_signature` que no sean base64
  (se conservan los base64).

**OpenRouter Anthropic**

- Los turnos finales de prefill del asistente se eliminan de las cargas útiles verificadas de modelos Anthropic
  compatibles con OpenAI de OpenRouter cuando el razonamiento está habilitado,
  en consonancia con el comportamiento de reproducción directa de Anthropic y de Anthropic mediante Cloudflare.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de
transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada creación de contexto y podía:
  - Reparar el emparejamiento entre el uso de herramientas y sus resultados.
  - Sanear los identificadores de llamadas a herramientas (incluido un modo no estricto que conservaba
    `_`/`-`).
- El ejecutor también realizaba un saneamiento específico del proveedor, lo que
  duplicaba el trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, como
  eliminar las etiquetas `<final>` del texto del asistente antes de la persistencia, descartar
  turnos de error vacíos del asistente y recortar el contenido del asistente después de las llamadas
  a herramientas.

Esta complejidad provocaba regresiones entre proveedores (en particular, el
emparejamiento de `openai-responses` y `call_id|fc_id`). La limpieza de 2026.1.22 eliminó
la extensión, centralizó la lógica en el ejecutor y estableció que OpenAI quedara **sin modificaciones**
más allá del saneamiento de imágenes.

## Contenido relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
