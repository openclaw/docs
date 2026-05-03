---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor vinculados a la estructura de la transcripción
    - Estás cambiando la sanitización de transcripciones o la lógica de reparación de llamadas a herramientas
    - Estás investigando discrepancias en los identificadores de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de la transcripción
x-i18n:
    generated_at: "2026-05-03T05:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución (al construir el contexto del modelo). La mayoría son ajustes **en memoria** usados para satisfacer requisitos estrictos del proveedor. Una pasada de reparación separada del archivo de sesión también puede reescribir el JSONL almacenado antes de cargar la sesión, pero solo para líneas malformadas o turnos persistidos que no son registros duraderos válidos. Las respuestas entregadas del asistente se conservan en disco; la eliminación del prellenado del asistente específica del proveedor ocurre solo al construir cargas útiles salientes. Cuando ocurre una reparación, se crea una copia de seguridad del archivo original junto al archivo de sesión.

El alcance incluye:

- Contexto de prompt solo en tiempo de ejecución que no aparece en los turnos de transcripción visibles para el usuario
- Saneamiento de id de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación de emparejamiento de resultados de herramientas
- Validación / ordenamiento de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de razonamiento
- Saneamiento de cargas útiles de imagen
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Etiquetado de procedencia de entrada del usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para reproducción de Bedrock Converse

Si necesitas detalles de almacenamiento de transcripciones, consulta:

- [Análisis profundo de la gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto de tiempo de ejecución no es la transcripción del usuario

El contexto de tiempo de ejecución/sistema puede añadirse al prompt del modelo para un turno, pero no es contenido escrito por el usuario final. OpenClaw mantiene un cuerpo de prompt separado orientado a la transcripción para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones Pi incrustadas. Los turnos visibles del usuario almacenados usan ese cuerpo de transcripción en lugar del prompt enriquecido con contexto de tiempo de ejecución.

Para sesiones heredadas que ya persistieron envoltorios de tiempo de ejecución, las superficies de historial de Gateway aplican una proyección de visualización antes de devolver mensajes a clientes WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta esto

Toda la higiene de transcripciones está centralizada en el runner incrustado:

- Selección de políticas: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Separado de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (runner incrustado)

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imagen siempre se sanean para evitar rechazos del lado del proveedor por límites de tamaño (reducción de escala/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens impulsada por imágenes para modelos con capacidades de visión. Dimensiones máximas más bajas generalmente reducen el uso de tokens; dimensiones más altas conservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de imagen es configurable mediante `agents.defaults.imageMaxDimensionPx` (valor predeterminado: `1200`).
- Los bloques de texto en blanco se eliminan mientras esta pasada recorre el contenido de reproducción. Los turnos del asistente que quedan vacíos se descartan de la copia de reproducción; los turnos de usuario y de resultado de herramienta que quedan vacíos reciben un marcador de posición no vacío de contenido omitido.

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamadas a herramientas del asistente a los que les faltan tanto `input` como `arguments` se descartan antes de construir el contexto del modelo. Esto evita rechazos del proveedor por llamadas a herramientas parcialmente persistidas (por ejemplo, después de un fallo por límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos pasos de respuesta/anuncio entre agentes), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

OpenClaw también antepone un marcador `[Inter-session message ... isUser=false]` en el mismo turno antes del texto del prompt enrutado, para que la llamada activa al modelo pueda distinguir salida de una sesión externa de instrucciones externas del usuario final. Este marcador incluye la sesión de origen, el canal y la herramienta cuando están disponibles. La transcripción sigue usando `role: "user"` por compatibilidad con proveedores, pero tanto el texto visible como los metadatos de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción del contexto, OpenClaw aplica el mismo marcador a turnos de usuario entre sesiones persistidos más antiguos que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex, y descarta razonamiento reproducible de OpenAI después de un cambio de ruta de modelo.
- Conserva cargas útiles de elementos de razonamiento reproducibles de OpenAI Responses, incluidos elementos cifrados de resumen vacío, para que la reproducción manual/WebSocket mantenga el estado `rs_*` requerido emparejado con los elementos de salida del asistente.
- Sin saneamiento de id de llamadas a herramientas.
- La reparación de emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar salidas `aborted` al estilo Codex para llamadas a herramientas faltantes.
- Sin validación ni reordenamiento de turnos.
- Las salidas de herramientas faltantes de la familia OpenAI Responses se sintetizan como `aborted` para coincidir con la normalización de reproducción de Codex.
- Sin eliminación de firmas de pensamiento.

**Gemma 4 compatible con OpenAI**

- Los bloques históricos de pensamiento/razonamiento del asistente se eliminan antes de la reproducción para que los servidores Gemma 4 locales compatibles con OpenAI no reciban contenido de razonamiento de turnos previos.
- Las continuaciones de llamadas a herramientas del mismo turno actual mantienen el bloque de razonamiento del asistente adjunto a la llamada a herramienta hasta que el resultado de la herramienta haya sido reproducido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamadas a herramientas: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (alternancia de turnos al estilo Gemini).
- Corrección de ordenamiento de turnos de Google (anteponer un pequeño arranque de usuario si el historial empieza con el asistente).
- Antigravity Claude: normaliza firmas de razonamiento; descarta bloques de razonamiento sin firmar.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (fusiona turnos de usuario consecutivos para satisfacer la alternancia estricta).
- Los turnos finales de prellenado del asistente se eliminan de las cargas útiles salientes de Anthropic Messages cuando el razonamiento está habilitado, incluidas las rutas de Cloudflare AI Gateway.
- Los bloques de razonamiento con firmas de reproducción faltantes, vacías o en blanco se eliminan antes de la conversión del proveedor. Si eso deja vacío un turno del asistente, OpenClaw conserva la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente que solo contienen razonamiento y deben eliminarse se reemplazan por texto no vacío de razonamiento omitido para que los adaptadores de proveedor no descarten el turno de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos de error de flujo vacíos del asistente se reparan con un bloque de texto de reserva no vacío antes de la reproducción. Bedrock Converse rechaza mensajes del asistente con `content: []`, por lo que los turnos persistidos del asistente con `stopReason: "error"` y contenido vacío también se reparan en disco antes de cargarse.
- Los turnos de error de flujo del asistente que contienen solo bloques de texto en blanco se descartan de la copia de reproducción en memoria en lugar de reproducir un bloque en blanco inválido.
- Los bloques de razonamiento de Claude con firmas de reproducción faltantes, vacías o en blanco se eliminan antes de la reproducción de Converse. Si eso deja vacío un turno del asistente, OpenClaw conserva la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente que solo contienen razonamiento y deben eliminarse se reemplazan por texto no vacío de razonamiento omitido para que la reproducción de Converse mantenga la forma estricta de los turnos.
- La reproducción filtra turnos del asistente de espejo de entrega de OpenClaw e inyectados por Gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida detección basada en model-id)**

- Saneamiento de id de llamadas a herramientas: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina valores `thought_signature` que no sean base64 (conserva base64).

**OpenRouter Anthropic**

- Los turnos finales de prellenado del asistente se eliminan de las cargas útiles verificadas de modelos Anthropic compatibles con OpenAI de OpenRouter cuando el razonamiento está habilitado, coincidiendo con el comportamiento de reproducción de Anthropic directo y Cloudflare Anthropic.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear id de llamadas a herramientas (incluido un modo no estricto que preservaba `_`/`-`).
- El runner también realizaba saneamiento específico del proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminación de etiquetas `<final>` del texto del asistente antes de la persistencia.
  - Descarte de turnos de error vacíos del asistente.
  - Recorte del contenido del asistente después de llamadas a herramientas.

Esta complejidad causó regresiones entre proveedores (en particular el emparejamiento `call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó la lógica en el runner e hizo que OpenAI no recibiera cambios más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
