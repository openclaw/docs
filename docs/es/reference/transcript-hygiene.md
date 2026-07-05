---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor vinculados a la forma de la transcripción
    - Estás cambiando la sanitización de transcripciones o la lógica de reparación de llamadas a herramientas
    - Estás investigando discrepancias de id de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de transcripciones
x-i18n:
    generated_at: "2026-07-05T11:43:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución
(construcción del contexto del modelo). La mayoría son ajustes **en memoria** usados para
satisfacer requisitos estrictos del proveedor. Un pase separado de reparación del archivo de sesión también puede
reescribir el JSONL almacenado antes de cargar la sesión, pero solo para
líneas malformadas o turnos persistidos que no son registros duraderos válidos.
Las respuestas entregadas del asistente se preservan en disco; la eliminación del
prellenado de asistente específico del proveedor ocurre solo al construir
payloads salientes.

Cuando ocurre una reparación, el archivo original se escribe en un hermano transitorio
`*.bak-<pid>-<ts>` antes del reemplazo atómico y luego se elimina una vez que el
reemplazo se completa correctamente. La copia de seguridad se conserva solo si la limpieza falla,
en cuyo caso se informa la ruta.

El alcance incluye:

- Contexto de prompt solo en tiempo de ejecución que se mantiene fuera de los turnos de transcripción visibles para el usuario
- Saneamiento de id de llamada de herramienta
- Validación de entrada de llamada de herramienta
- Reparación de emparejamiento de resultado de herramienta
- Validación / ordenamiento de turnos
- Limpieza de firma de pensamiento
- Limpieza de firma de pensamiento
- Saneamiento de payload de imagen
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Limpieza de turnos incompletos por límite de longitud solo con razonamiento antes de la reproducción del proveedor
- Etiquetado de procedencia de entrada de usuario (para prompts enrutados entre sesiones)
- Reparación de turno de error vacío del asistente para reproducción de Bedrock Converse

Si necesitas detalles de almacenamiento de transcripciones, consulta
[Análisis profundo de la gestión de sesiones](/es/reference/session-management-compaction).

---

## Regla global: el contexto de tiempo de ejecución no es transcripción de usuario

El contexto de runtime/sistema se puede añadir al prompt del modelo para un turno, pero no es
contenido escrito por el usuario final. OpenClaw mantiene un cuerpo de prompt separado orientado a la transcripción
para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones de
OpenClaw integradas. Los turnos visibles de usuario almacenados usan ese cuerpo de transcripción en lugar del
prompt enriquecido en tiempo de ejecución.

Para sesiones heredadas que ya persistieron envoltorios de runtime, las superficies de historial de Gateway
aplican una proyección de visualización antes de devolver mensajes a clientes WebChat,
TUI, REST o SSE.

---

## Dónde se ejecuta

Toda la higiene de transcripciones está centralizada en el ejecutor integrado:

- Selección de política: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, indexado por `provider`, `modelApi` y `modelId`)
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en
  `src/agents/embedded-agent-runner/replay-history.ts`

Separados de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario)
antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `src/agents/embedded-agent-runner/run/attempt.ts` y
  `src/agents/embedded-agent-runner/compact.ts`

---

## Regla global: saneamiento de imágenes

Los payloads de imagen siempre se sanean para evitar rechazos del lado del proveedor por
límites de tamaño (reducir escala/recomprimir imágenes base64 sobredimensionadas). Esto también ayuda a
controlar la presión de tokens impulsada por imágenes para modelos con capacidad de visión: dimensiones máximas
menores reducen el uso de tokens, dimensiones mayores preservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de imagen se puede configurar mediante `agents.defaults.imageMaxDimensionPx`
  (predeterminado: `1200`)
- Los bloques de texto en blanco se eliminan mientras este pase recorre el contenido de reproducción.
  Los turnos del asistente que quedan vacíos se descartan de la copia de reproducción; los turnos de usuario
  y de resultado de herramienta que quedan vacíos reciben un marcador no vacío
  de contenido omitido.

---

## Regla global: llamadas de herramienta malformadas

Los bloques de llamada de herramienta del asistente a los que les faltan tanto `input` como `arguments` se descartan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor por
llamadas de herramienta persistidas parcialmente (por ejemplo, después de una falla de límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Regla global: turnos incompletos solo con razonamiento

Los turnos del asistente que alcanzan el límite de salida del proveedor con solo contenido de pensamiento o
pensamiento redactado se omiten de la copia de reproducción en memoria. Estos
turnos contienen estado incompleto del proveedor y pueden portar una firma de pensamiento parcial.

Los turnos de longitud vacíos permanecen sin cambios, al igual que los turnos de longitud con texto visible,
llamadas de herramienta o bloques de contenido desconocidos. Las transcripciones almacenadas no se reescriben.

Implementación: `normalizeAssistantReplayContent` en
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send`
(incluidos pasos de respuesta/anuncio de agente a agente), OpenClaw persiste el
turno de usuario creado con `message.provenance.kind = "inter_session"`.

OpenClaw también antepone un marcador en el mismo turno `[Inter-session message] ... isUser=false`
antes del texto del prompt enrutado para que la llamada activa al modelo pueda
distinguir la salida de una sesión externa de instrucciones externas del usuario final. Este
marcador incluye la sesión de origen, el canal y la herramienta cuando están disponibles. La
transcripción aún usa `role: "user"` por compatibilidad con el proveedor, pero el
texto visible y los metadatos de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción del contexto, OpenClaw aplica el mismo marcador a turnos de usuario
entre sesiones persistidos más antiguos que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un
  bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex, y descarta
  razonamiento reproducible de OpenAI después de un cambio de ruta de modelo.
- Preserva payloads de elementos de razonamiento reproducibles de OpenAI Responses, incluidos
  elementos cifrados de resumen vacío, para que la reproducción manual/WebSocket mantenga el estado
  `rs_*` requerido emparejado con elementos de salida del asistente.
- Native ChatGPT Codex Responses sigue la paridad de cable de Codex reproduciendo
  payloads previos de razonamiento/mensaje/función de Responses sin IDs de elementos previos
  mientras preserva `prompt_cache_key` de sesión.
- La reproducción de la familia OpenAI Responses preserva pares canónicos `call_*|fc_*`
  de razonamiento del mismo modelo, pero normaliza determinísticamente ids malformados o
  demasiado largos de `call_id`/elementos de llamada de función antes de la conversión de payload pi-ai.
- La reparación de emparejamiento de resultado de herramienta puede mover salidas reales coincidentes y sintetizar
  salidas estilo Codex `aborted` para llamadas de herramienta faltantes.
- Sin validación ni reordenamiento de turnos; sin eliminación de firmas de pensamiento.

**OpenAI-compatible Chat Completions**

- Los bloques históricos de pensamiento/razonamiento del asistente se eliminan antes de la reproducción
  para que servidores locales y de estilo proxy compatibles con OpenAI no reciban
  campos de razonamiento de turnos previos como `reasoning` o `reasoning_content`.
- Las continuaciones de llamada de herramienta del mismo turno actual mantienen el bloque de razonamiento del asistente
  adjunto a la llamada de herramienta hasta que se haya reproducido el resultado de la herramienta.
- Las entradas de modelos personalizados/autohospedados con `reasoning: true` preservan los metadatos
  de razonamiento reproducidos.
- Las excepciones propiedad del proveedor pueden optar por no participar cuando su protocolo de cable requiere
  metadatos de razonamiento reproducidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamada de herramienta: alfanumérico estricto.
- Reparación de emparejamiento de resultado de herramienta y resultados de herramienta sintéticos.
- Validación de turnos (alternancia de turnos estilo Gemini).
- Corrección de orden de turnos de Google (anteponer un pequeño arranque de usuario si el historial
  empieza con asistente).
- Antigravity Claude: normaliza firmas de pensamiento; descarta bloques de pensamiento sin firmar.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultado de herramienta y resultados de herramienta sintéticos.
- Validación de turnos (combina turnos de usuario consecutivos para satisfacer una alternancia
  estricta).
- Los turnos finales de prellenado del asistente se eliminan de los payloads salientes de Anthropic
  Messages cuando el pensamiento está activado, incluidas rutas de Cloudflare AI
  Gateway.
- Las firmas de pensamiento del asistente previas a Compaction se eliminan antes de la reproducción del proveedor
  cuando una sesión ha sido compactada. Las firmas de pensamiento están
  criptográficamente vinculadas al prefijo de conversación en el momento de generación;
  después de Compaction, el prefijo cambia (el contenido resumido reemplaza al
  original), por lo que reproducir las firmas originales hace que Anthropic
  rechace la solicitud con "Invalid signature in thinking block". El
  texto de pensamiento se preserva como un bloque sin firmar y luego se gestiona con la
  regla siguiente.
- Los bloques de pensamiento con firmas de reproducción faltantes, vacías o en blanco se
  eliminan antes de la conversión del proveedor. Si eso vacía un turno del asistente,
  OpenClaw conserva la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos de asistente solo con pensamiento que deben eliminarse se reemplazan
  con texto no vacío de razonamiento omitido para que los adaptadores del proveedor no descarten
  el turno de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos de error de stream vacíos del asistente se reparan a un bloque de texto de respaldo
  no vacío antes de la reproducción. Bedrock Converse rechaza mensajes del asistente
  con `content: []`, por lo que los turnos persistidos del asistente con `stopReason:
"error"` y contenido vacío también se reparan en disco antes de cargarse.
- Los turnos de error de stream del asistente con solo bloques de texto en blanco se descartan de
  la copia de reproducción en memoria en lugar de reproducir un bloque en blanco no válido.
- Las firmas de pensamiento del asistente previas a Compaction se eliminan antes de la reproducción de Converse
  cuando una sesión ha sido compactada, por la misma razón que en Anthropic
  arriba.
- Los bloques de pensamiento de Claude con firmas de reproducción faltantes, vacías o en blanco
  se eliminan antes de la reproducción de Converse. Si eso vacía un turno del asistente,
  OpenClaw conserva la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos de asistente solo con pensamiento que deben eliminarse se reemplazan
  con texto no vacío de razonamiento omitido para que la reproducción de Converse mantenga
  una forma de turno estricta.
- La reproducción filtra turnos del asistente de espejo de entrega de OpenClaw e inyectados por gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida la detección basada en id de modelo)**

- Saneamiento de id de llamada de herramienta: strict9 (alfanumérico, longitud 9).

**OpenRouter Gemini**

- Limpieza de firma de pensamiento: elimina valores `thought_signature` no base64
  (mantiene base64).

**OpenRouter Anthropic**

- Los turnos finales de prellenado del asistente se eliminan de payloads verificados de modelos
  Anthropic compatibles con OpenAI de OpenRouter cuando el razonamiento está activado,
  coincidiendo con el comportamiento de reproducción directa de Anthropic y Cloudflare Anthropic.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba múltiples capas de higiene de
transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramienta.
  - Sanear ids de llamada de herramienta (incluido un modo no estricto que preservaba
    `_`/`-`).
- El ejecutor también realizaba saneamiento específico del proveedor, lo que
  duplicaba trabajo.
- Ocurrían mutaciones adicionales fuera de la política del proveedor, incluidas
  la eliminación de etiquetas `<final>` del texto del asistente antes de la persistencia, el descarte de
  turnos de error vacíos del asistente y el recorte de contenido del asistente después de llamadas de
  herramienta.

Esta complejidad causó regresiones entre proveedores (en particular el emparejamiento
`call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó
la extensión, centralizó la lógica en el ejecutor e hizo que OpenAI no tuviera **intervenciones**
más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
