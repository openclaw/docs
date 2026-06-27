---
read_when:
    - Estás depurando rechazos de solicitudes de proveedor vinculados a la forma de la transcripción
    - Estás cambiando la sanitización de transcripciones o la lógica de reparación de llamadas a herramientas
    - Estás investigando discrepancias de ID de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de reparación y saneamiento de transcripciones específicas del proveedor'
title: Higiene de la transcripción
x-i18n:
    generated_at: "2026-06-27T12:56:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución (al construir el contexto del modelo). La mayoría son ajustes **en memoria** usados para satisfacer requisitos estrictos del proveedor. Un paso separado de reparación de archivos de sesión también puede reescribir el JSONL almacenado antes de cargar la sesión, pero solo para líneas mal formadas o turnos persistidos que sean registros duraderos no válidos. Las respuestas entregadas del asistente se conservan en disco; la eliminación del prellenado del asistente específica del proveedor ocurre solo al construir cargas salientes. Cuando ocurre una reparación, el archivo original se escribe en un hermano transitorio `*.bak-<pid>-<ts>` antes del reemplazo atómico y se elimina cuando el reemplazo se completa correctamente; la copia de seguridad solo se conserva si falla la limpieza (en cuyo caso la ruta se informa).

El alcance incluye:

- Contexto de prompt solo de runtime que queda fuera de los turnos de transcripción visibles para el usuario
- Saneamiento de id de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación de emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de firma de pensamiento
- Limpieza de firma de razonamiento
- Saneamiento de cargas de imagen
- Limpieza de bloques de texto vacíos antes de la reproducción del proveedor
- Limpieza de turnos de longitud incompletos solo de razonamiento antes de la reproducción del proveedor
- Etiquetado de procedencia de entrada de usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para reproducción de Bedrock Converse

Si necesitas detalles del almacenamiento de transcripciones, consulta:

- [Análisis profundo de la gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto de runtime no es transcripción del usuario

El contexto de runtime/sistema se puede agregar al prompt del modelo para un turno, pero no es
contenido escrito por el usuario final. OpenClaw mantiene un cuerpo de prompt separado orientado a la
transcripción para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones incrustadas de OpenClaw.
Los turnos visibles de usuario almacenados usan ese cuerpo de transcripción en lugar del
prompt enriquecido por runtime.

Para sesiones heredadas que ya persistieron envoltorios de runtime, las superficies de historial de Gateway
aplican una proyección de visualización antes de devolver mensajes a clientes WebChat,
TUI, REST o SSE.

---

## Dónde se ejecuta

Toda la higiene de transcripciones está centralizada en el ejecutor incrustado:

- Selección de política: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/embedded-agent-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Separados de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de la carga:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor incrustado)

---

## Regla global: saneamiento de imágenes

Las cargas de imagen siempre se sanean para evitar rechazos del lado del proveedor por límites
de tamaño (reducción de escala/recompresión de imágenes base64 demasiado grandes).

Esto también ayuda a controlar la presión de tokens impulsada por imágenes para modelos con capacidad de visión.
Dimensiones máximas más bajas suelen reducir el uso de tokens; dimensiones más altas preservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de imagen se puede configurar mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).
- Los bloques de texto vacíos se eliminan mientras este paso recorre el contenido de reproducción. Los turnos del asistente
  que quedan vacíos se descartan de la copia de reproducción; los turnos de usuario y de resultado de herramienta
  que quedan vacíos reciben un marcador de posición no vacío de contenido omitido.

---

## Regla global: llamadas a herramientas mal formadas

Los bloques de llamadas a herramientas del asistente a los que les faltan tanto `input` como `arguments` se descartan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor por llamadas a herramientas
persistidas parcialmente (por ejemplo, después de una falla de límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/embedded-agent-runner/replay-history.ts`

---

## Regla global: turnos incompletos solo de razonamiento

Los turnos del asistente que alcanzan el límite de salida del proveedor con solo contenido de pensamiento o
pensamiento censurado se omiten de la copia de reproducción en memoria. Esos turnos
contienen estado incompleto del proveedor y pueden llevar una firma parcial de pensamiento.

Los turnos de longitud vacíos permanecen sin cambios, igual que los turnos de longitud con texto visible, llamadas a herramientas
o bloques de contenido desconocidos. Las transcripciones almacenadas no se reescriben.

Implementación:

- `normalizeAssistantReplayContent` en `src/agents/embedded-agent-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos
pasos de respuesta/anuncio de agente a agente), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

OpenClaw también antepone un marcador en el mismo turno `[Inter-session message ... isUser=false]`
antes del texto del prompt enrutado para que la llamada activa al modelo pueda distinguir
la salida de una sesión externa de instrucciones externas del usuario final. Este marcador incluye
la sesión de origen, el canal y la herramienta cuando están disponibles. La transcripción sigue usando
`role: "user"` por compatibilidad con el proveedor, pero tanto el texto visible como los metadatos
de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción de contexto, OpenClaw aplica el mismo marcador a turnos de usuario
entre sesiones persistidos más antiguos que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex, y descarta razonamiento reproducible de OpenAI después de un cambio de ruta de modelo.
- Conserva las cargas de elementos de razonamiento reproducibles de OpenAI Responses, incluidos elementos de resumen vacío cifrados, para que la reproducción manual/WebSocket mantenga el estado `rs_*` requerido emparejado con elementos de salida del asistente.
- Native ChatGPT Codex Responses sigue la paridad de cable de Codex reproduciendo cargas previas de razonamiento/mensaje/función de Responses sin IDs de elementos previos mientras conserva el `prompt_cache_key` de sesión.
- La reproducción de la familia OpenAI Responses conserva pares canónicos de razonamiento de mismo modelo `call_*|fc_*`, pero normaliza de forma determinista los `call_id` / ids de elementos de llamada de función mal formados o demasiado largos antes de la conversión de carga pi-ai.
- La reparación de emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar salidas estilo Codex `aborted` para llamadas a herramientas faltantes.
- Sin validación ni reordenación de turnos.
- Las salidas de herramientas faltantes de la familia OpenAI Responses se sintetizan como `aborted` para coincidir con la normalización de reproducción de Codex.
- Sin eliminación de firma de pensamiento.

**Chat Completions compatibles con OpenAI**

- Los bloques históricos de pensamiento/razonamiento del asistente se eliminan antes de la reproducción para que
  servidores locales y de estilo proxy compatibles con OpenAI no reciban campos de razonamiento
  de turnos previos como `reasoning` o `reasoning_content`.
- Las continuaciones de llamadas a herramientas del mismo turno actual mantienen el bloque de razonamiento del asistente
  adjunto a la llamada a herramienta hasta que se haya reproducido el resultado de herramienta.
- Las entradas de modelos personalizados/autohospedados con `reasoning: true` conservan los metadatos de
  razonamiento reproducidos.
- Las excepciones propiedad del proveedor pueden optar por no participar cuando su protocolo de cable requiere
  metadatos de razonamiento reproducidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamadas a herramientas: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (alternancia de turnos estilo Gemini).
- Corrección de ordenación de turnos de Google (anteponer un pequeño arranque de usuario si el historial empieza con asistente).
- Antigravity Claude: normaliza firmas de pensamiento; descarta bloques de pensamiento sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (fusiona turnos de usuario consecutivos para satisfacer la alternancia estricta).
- Los turnos finales de prellenado del asistente se eliminan de las cargas salientes de Anthropic Messages
  cuando el pensamiento está habilitado, incluidas las rutas de Cloudflare AI Gateway.
- Las firmas de pensamiento del asistente previas a Compaction se eliminan antes de la
  reproducción del proveedor cuando una sesión se ha compactado. Las firmas de pensamiento están
  vinculadas criptográficamente al prefijo de conversación en el momento de generación; después de la
  compactación, el prefijo cambia (el contenido resumido se reemplaza por un resumen de compactación),
  por lo que reproducir las firmas originales hace que Anthropic rechace la
  solicitud con "Invalid signature in thinking block". El texto de pensamiento se
  conserva como un bloque sin firma y luego lo gestiona la regla siguiente.
- Los bloques de pensamiento con firmas de reproducción faltantes, vacías o en blanco se eliminan
  antes de la conversión del proveedor. Si eso vacía un turno del asistente, OpenClaw mantiene
  la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente solo de pensamiento que deben eliminarse se reemplazan con
  texto no vacío de razonamiento omitido para que los adaptadores de proveedor no descarten el turno
  de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos de error de transmisión vacíos del asistente se reparan a un bloque de texto de reserva no vacío
  antes de la reproducción. Bedrock Converse rechaza mensajes del asistente con `content: []`, por lo que
  los turnos persistidos del asistente con `stopReason: "error"` y contenido vacío también se
  reparan en disco antes de la carga.
- Los turnos de error de transmisión del asistente que contienen solo bloques de texto en blanco se descartan
  de la copia de reproducción en memoria en lugar de reproducir un bloque en blanco no válido.
- Las firmas de pensamiento del asistente previas a Compaction se eliminan antes de la
  reproducción de Converse cuando una sesión se ha compactado, por la misma razón que Anthropic
  arriba.
- Los bloques de pensamiento de Claude con firmas de reproducción faltantes, vacías o en blanco se
  eliminan antes de la reproducción de Converse. Si eso vacía un turno del asistente, OpenClaw
  mantiene la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente solo de pensamiento que deben eliminarse se reemplazan con
  texto no vacío de razonamiento omitido para que la reproducción de Converse mantenga una forma de turno estricta.
- La reproducción filtra turnos del asistente de espejo de entrega de OpenClaw e inyectados por Gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida detección basada en model-id)**

- Saneamiento de id de llamadas a herramientas: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de firma de pensamiento: elimina valores `thought_signature` que no sean base64 (mantiene base64).

**OpenRouter Anthropic**

- Los turnos finales de prellenado del asistente se eliminan de cargas de modelos Anthropic compatibles con OpenAI
  verificadas de OpenRouter cuando el razonamiento está habilitado, coincidiendo con
  el comportamiento de reproducción directo de Anthropic y Cloudflare Anthropic.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (antes de 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear ids de llamadas a herramientas (incluido un modo no estricto que conservaba `_`/`-`).
- El ejecutor también realizaba saneamiento específico del proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminar etiquetas `<final>` del texto del asistente antes de la persistencia.
  - Descartar turnos de error vacíos del asistente.
  - Recortar contenido del asistente después de llamadas a herramientas.

Esta complejidad causó regresiones entre proveedores (en particular el emparejamiento `call_id|fc_id` de
`openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó
la lógica en el ejecutor e hizo que OpenAI fuera **sin intervención** más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
