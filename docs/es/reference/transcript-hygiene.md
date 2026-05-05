---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor relacionados con la estructura de la transcripción
    - Estás cambiando el saneamiento de transcripciones o la lógica de reparación de llamadas a herramientas
    - Estás investigando discrepancias de ID de llamadas de herramientas entre proveedores
summary: 'Referencia: reglas específicas del proveedor para el saneamiento y la reparación de transcripciones'
title: Higiene de la transcripción
x-i18n:
    generated_at: "2026-05-05T01:49:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas por proveedor** a las transcripciones antes de una ejecución (al construir el contexto del modelo). La mayoría de estas son ajustes **en memoria** usados para satisfacer requisitos estrictos del proveedor. Una pasada independiente de reparación de archivos de sesión también puede reescribir JSONL almacenado antes de cargar la sesión, pero solo para líneas mal formadas o turnos persistidos que no son registros duraderos válidos. Las respuestas entregadas del asistente se conservan en disco; la eliminación del prellenado del asistente específica por proveedor ocurre solo al construir las cargas útiles salientes. Cuando ocurre una reparación, se crea una copia de seguridad del archivo original junto al archivo de sesión.

El alcance incluye:

- Contexto de prompt solo en tiempo de ejecución que queda fuera de los turnos de transcripción visibles para el usuario
- Saneamiento de id de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación del emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de razonamiento
- Saneamiento de cargas útiles de imágenes
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Etiquetado de procedencia de entrada de usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para la reproducción de Bedrock Converse

Si necesitas detalles del almacenamiento de transcripciones, consulta:

- [Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto en tiempo de ejecución no es la transcripción del usuario

El contexto de tiempo de ejecución/sistema puede agregarse al prompt del modelo para un turno, pero no es contenido redactado por el usuario final. OpenClaw mantiene un cuerpo de prompt separado orientado a la transcripción para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones de Pi incrustadas. Los turnos de usuario visibles almacenados usan ese cuerpo de transcripción en lugar del prompt enriquecido en tiempo de ejecución.

Para sesiones heredadas que ya persistieron envoltorios de tiempo de ejecución, las superficies de historial de Gateway aplican una proyección de visualización antes de devolver mensajes a clientes de WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta esto

Toda la higiene de transcripciones está centralizada en el ejecutor incrustado:

- Selección de políticas: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Por separado de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor incrustado)

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imágenes siempre se sanean para evitar rechazos del lado del proveedor por límites de tamaño (reducir escala/recomprimir imágenes base64 demasiado grandes).

Esto también ayuda a controlar la presión de tokens impulsada por imágenes en modelos con capacidad de visión. Dimensiones máximas más bajas suelen reducir el uso de tokens; dimensiones más altas conservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de imagen se puede configurar mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).
- Los bloques de texto en blanco se eliminan mientras esta pasada recorre el contenido de reproducción. Los turnos del asistente que quedan vacíos se descartan de la copia de reproducción; los turnos de usuario y de resultado de herramienta que quedan vacíos reciben un marcador no vacío de contenido omitido.

---

## Regla global: llamadas a herramientas mal formadas

Los bloques de llamadas a herramientas del asistente a los que les faltan tanto `input` como `arguments` se descartan antes de construir el contexto del modelo. Esto evita rechazos del proveedor por llamadas a herramientas persistidas parcialmente (por ejemplo, después de un fallo por límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos pasos de respuesta/anuncio entre agentes), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

OpenClaw también antepone al mismo turno un marcador `[Inter-session message ... isUser=false]` antes del texto del prompt enrutado para que la llamada activa al modelo pueda distinguir salida de una sesión externa de instrucciones externas del usuario final. Este marcador incluye la sesión, el canal y la herramienta de origen cuando están disponibles. La transcripción aún usa `role: "user"` por compatibilidad con proveedores, pero tanto el texto visible como los metadatos de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción del contexto, OpenClaw aplica el mismo marcador a turnos de usuario entre sesiones persistidos más antiguos que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex, y descarta razonamiento de OpenAI reproducible después de un cambio de ruta de modelo.
- Conserva cargas útiles de elementos de razonamiento de OpenAI Responses reproducibles, incluidos elementos cifrados con resumen vacío, para que la reproducción manual/WebSocket mantenga el estado `rs_*` requerido emparejado con elementos de salida del asistente.
- Native ChatGPT Codex Responses sigue la paridad de cable de Codex reproduciendo cargas útiles previas de razonamiento/mensaje/función de Responses sin IDs de elementos previos y conservando `prompt_cache_key` de sesión.
- Sin saneamiento de id de llamadas a herramientas.
- La reparación de emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar salidas `aborted` al estilo Codex para llamadas a herramientas faltantes.
- Sin validación ni reordenación de turnos.
- Las salidas de herramientas faltantes de la familia OpenAI Responses se sintetizan como `aborted` para coincidir con la normalización de reproducción de Codex.
- Sin eliminación de firmas de pensamiento.

**Gemma 4 compatible con OpenAI**

- Los bloques históricos de razonamiento/pensamiento del asistente se eliminan antes de la reproducción para que los servidores locales de Gemma 4 compatibles con OpenAI no reciban contenido de razonamiento de turnos previos.
- Las continuaciones de llamadas a herramientas del mismo turno actual conservan el bloque de razonamiento del asistente adjunto a la llamada a herramienta hasta que el resultado de la herramienta se haya reproducido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamadas a herramientas: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (alternancia de turnos al estilo Gemini).
- Corrección de ordenación de turnos de Google (anteponer un pequeño arranque de usuario si el historial comienza con el asistente).
- Antigravity Claude: normaliza firmas de razonamiento; descarta bloques de razonamiento sin firmar.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (fusiona turnos de usuario consecutivos para satisfacer la alternancia estricta).
- Los turnos finales de prellenado del asistente se eliminan de las cargas útiles salientes de Anthropic Messages cuando el razonamiento está habilitado, incluidas rutas de Cloudflare AI Gateway.
- Los bloques de razonamiento con firmas de reproducción faltantes, vacías o en blanco se eliminan antes de la conversión del proveedor. Si eso vacía un turno del asistente, OpenClaw conserva la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente solo de razonamiento que deben eliminarse se reemplazan con texto no vacío de razonamiento omitido para que los adaptadores del proveedor no descarten el turno de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos vacíos de error de flujo del asistente se reparan a un bloque de texto alternativo no vacío antes de la reproducción. Bedrock Converse rechaza mensajes del asistente con `content: []`, por lo que los turnos persistidos del asistente con `stopReason: "error"` y contenido vacío también se reparan en disco antes de cargarse.
- Los turnos de error de flujo del asistente que contienen solo bloques de texto en blanco se descartan de la copia de reproducción en memoria en lugar de reproducir un bloque en blanco no válido.
- Los bloques de razonamiento de Claude con firmas de reproducción faltantes, vacías o en blanco se eliminan antes de la reproducción de Converse. Si eso vacía un turno del asistente, OpenClaw conserva la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente solo de razonamiento que deben eliminarse se reemplazan con texto no vacío de razonamiento omitido para que la reproducción de Converse conserve una forma de turno estricta.
- La reproducción filtra turnos del asistente de espejo de entrega de OpenClaw e inyectados por Gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida detección basada en model-id)**

- Saneamiento de id de llamadas a herramientas: strict9 (longitud alfanumérica 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina valores `thought_signature` no base64 (conserva base64).

**OpenRouter Anthropic**

- Los turnos finales de prellenado del asistente se eliminan de cargas útiles de modelos Anthropic compatibles con OpenAI de OpenRouter verificados cuando el razonamiento está habilitado, lo que coincide con el comportamiento de reproducción de Anthropic directo y Cloudflare Anthropic.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **Plugin de saneamiento de transcripciones** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear ids de llamadas a herramientas (incluido un modo no estricto que conservaba `_`/`-`).
- El ejecutor también realizaba saneamiento específico por proveedor, lo que duplicaba trabajo.
- Ocurrían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminar etiquetas `<final>` del texto del asistente antes de la persistencia.
  - Descartar turnos de error vacíos del asistente.
  - Recortar contenido del asistente después de llamadas a herramientas.

Esta complejidad causó regresiones entre proveedores (en particular el emparejamiento `call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó la lógica en el ejecutor e hizo que OpenAI quedara **sin intervención** más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
