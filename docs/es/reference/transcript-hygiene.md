---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor relacionados con la estructura de la transcripción
    - Estás cambiando la lógica de saneamiento de transcripciones o de reparación de llamadas a herramientas
    - Estás investigando discrepancias en los ID de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas de cada proveedor'
title: Higiene de la transcripción
x-i18n:
    generated_at: "2026-05-11T20:53:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución (al construir el contexto del modelo). La mayoría de estos son ajustes **en memoria** usados para satisfacer requisitos estrictos del proveedor. Un pase de reparación separado del archivo de sesión también puede reescribir el JSONL almacenado antes de cargar la sesión, pero solo para líneas malformadas o turnos persistidos que no son registros duraderos válidos. Las respuestas del asistente entregadas se conservan en disco; la eliminación del prellenado de asistente específica del proveedor ocurre solo al construir las cargas salientes. Cuando ocurre una reparación, se crea una copia de seguridad del archivo original junto al archivo de sesión.

El alcance incluye:

- Contexto de prompt solo en runtime que queda fuera de los turnos de transcripción visibles para el usuario
- Saneamiento de id de llamadas de herramienta
- Validación de entrada de llamadas de herramienta
- Reparación de emparejamiento de resultados de herramienta
- Validación / ordenación de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de razonamiento
- Saneamiento de cargas de imagen
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Etiquetado de procedencia de entrada de usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error de asistente vacíos para reproducción de Bedrock Converse

Si necesitas detalles de almacenamiento de transcripciones, consulta:

- [Análisis profundo de gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto de runtime no es transcripción de usuario

El contexto de runtime/sistema se puede agregar al prompt del modelo para un turno, pero no es contenido redactado por el usuario final. OpenClaw mantiene un cuerpo de prompt separado orientado a la transcripción para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones Pi embebidas. Los turnos de usuario visibles almacenados usan ese cuerpo de transcripción en lugar del prompt enriquecido en runtime.

Para sesiones heredadas que ya persistieron envoltorios de runtime, las superficies de historial de Gateway aplican una proyección de visualización antes de devolver mensajes a clientes WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta

Toda la higiene de transcripciones está centralizada en el ejecutor embebido:

- Selección de políticas: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Separado de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor embebido)

---

## Regla global: saneamiento de imágenes

Las cargas de imagen siempre se sanean para evitar rechazos del lado del proveedor debido a límites de tamaño (reducción de escala/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens impulsada por imágenes para modelos con capacidad de visión. Las dimensiones máximas menores generalmente reducen el uso de tokens; las dimensiones mayores preservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de imagen es configurable mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).
- Los bloques de texto en blanco se eliminan mientras este pase recorre el contenido de reproducción. Los turnos de asistente que quedan vacíos se descartan de la copia de reproducción; los turnos de usuario y de resultado de herramienta que quedan vacíos reciben un marcador de posición de contenido omitido no vacío.

---

## Regla global: llamadas de herramienta malformadas

Los bloques de llamadas de herramienta del asistente a los que les faltan tanto `input` como `arguments` se descartan antes de construir el contexto del modelo. Esto evita rechazos del proveedor por llamadas de herramienta persistidas parcialmente (por ejemplo, después de un fallo por límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos pasos de respuesta/anuncio de agente a agente), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

OpenClaw también antepone un marcador en el mismo turno `[Inter-session message ... isUser=false]` antes del texto del prompt enrutado para que la llamada activa al modelo pueda distinguir la salida de una sesión externa de instrucciones externas del usuario final. Este marcador incluye la sesión de origen, el canal y la herramienta cuando están disponibles. La transcripción sigue usando `role: "user"` por compatibilidad con el proveedor, pero tanto el texto visible como los metadatos de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción de contexto, OpenClaw aplica el mismo marcador a turnos de usuario entre sesiones persistidos más antiguos que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones OpenAI Responses/Codex, y descarta razonamiento reproducible de OpenAI después de un cambio de ruta de modelo.
- Conserva las cargas de elementos de razonamiento reproducibles de OpenAI Responses, incluidos elementos cifrados con resumen vacío, para que la reproducción manual/WebSocket mantenga el estado `rs_*` requerido emparejado con elementos de salida del asistente.
- Native ChatGPT Codex Responses sigue la paridad de cable de Codex reproduciendo cargas previas de razonamiento/mensaje/función de Responses sin ids de elementos previos, a la vez que conserva `prompt_cache_key` de sesión.
- Sin saneamiento de id de llamadas de herramienta.
- La reparación de emparejamiento de resultados de herramienta puede mover salidas reales coincidentes y sintetizar salidas `aborted` al estilo Codex para llamadas de herramienta faltantes.
- Sin validación ni reordenación de turnos.
- Las salidas de herramienta faltantes de la familia OpenAI Responses se sintetizan como `aborted` para coincidir con la normalización de reproducción de Codex.
- Sin eliminación de firmas de pensamiento.

**Chat Completions compatibles con OpenAI**

- Los bloques históricos de pensamiento/razonamiento del asistente se eliminan antes de la reproducción para que los servidores locales y de estilo proxy compatibles con OpenAI no reciban campos de razonamiento de turnos previos como `reasoning` o `reasoning_content`.
- Las continuaciones de llamadas de herramienta del mismo turno actual mantienen el bloque de razonamiento del asistente adjunto a la llamada de herramienta hasta que el resultado de la herramienta se haya reproducido.
- Las excepciones propiedad del proveedor pueden optar por no participar cuando su protocolo de cable requiere metadatos de razonamiento reproducidos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamadas de herramienta: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramienta y resultados de herramienta sintéticos.
- Validación de turnos (alternancia de turnos al estilo Gemini).
- Corrección de orden de turnos de Google (anteponer un pequeño arranque de usuario si el historial empieza con asistente).
- Antigravity Claude: normaliza firmas de pensamiento; descarta bloques de pensamiento sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultados de herramienta y resultados de herramienta sintéticos.
- Validación de turnos (combina turnos de usuario consecutivos para satisfacer la alternancia estricta).
- Los turnos finales de prellenado de asistente se eliminan de las cargas salientes de Anthropic Messages cuando el razonamiento está activado, incluidas las rutas de Cloudflare AI Gateway.
- Los bloques de razonamiento con firmas de reproducción faltantes, vacías o en blanco se eliminan antes de la conversión del proveedor. Si eso vacía un turno de asistente, OpenClaw mantiene la forma del turno con texto de razonamiento omitido no vacío.
- Los turnos de asistente antiguos solo de razonamiento que deben eliminarse se reemplazan por texto de razonamiento omitido no vacío para que los adaptadores del proveedor no descarten el turno de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos de error de flujo del asistente vacíos se reparan a un bloque de texto de respaldo no vacío antes de la reproducción. Bedrock Converse rechaza mensajes de asistente con `content: []`, por lo que los turnos de asistente persistidos con `stopReason: "error"` y contenido vacío también se reparan en disco antes de cargarse.
- Los turnos de error de flujo del asistente que contienen solo bloques de texto en blanco se descartan de la copia de reproducción en memoria en lugar de reproducir un bloque en blanco inválido.
- Los bloques de razonamiento de Claude con firmas de reproducción faltantes, vacías o en blanco se eliminan antes de la reproducción de Converse. Si eso vacía un turno de asistente, OpenClaw mantiene la forma del turno con texto de razonamiento omitido no vacío.
- Los turnos de asistente antiguos solo de razonamiento que deben eliminarse se reemplazan por texto de razonamiento omitido no vacío para que la reproducción de Converse mantenga una forma de turnos estricta.
- La reproducción filtra turnos de asistente de espejo de entrega de OpenClaw e inyectados por Gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida detección basada en id de modelo)**

- Saneamiento de id de llamadas de herramienta: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina valores `thought_signature` que no son base64 (conserva base64).

**OpenRouter Anthropic**

- Los turnos finales de prellenado de asistente se eliminan de cargas de modelos Anthropic compatibles con OpenAI verificadas de OpenRouter cuando el razonamiento está activado, coincidiendo con el comportamiento de reproducción directa de Anthropic y Cloudflare Anthropic.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramienta.
  - Sanear ids de llamadas de herramienta (incluido un modo no estricto que conservaba `_`/`-`).
- El ejecutor también realizaba saneamiento específico del proveedor, lo que duplicaba trabajo.
- Ocurrían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminar etiquetas `<final>` del texto del asistente antes de la persistencia.
  - Descartar turnos de error de asistente vacíos.
  - Recortar contenido del asistente después de llamadas de herramienta.

Esta complejidad causó regresiones entre proveedores (en particular el emparejamiento `call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó la lógica en el ejecutor e hizo que OpenAI quedara **sin intervención** más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
