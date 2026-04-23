---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor relacionados con la forma de la transcripción
    - Estás cambiando la lógica de saneamiento de transcripciones o de reparación de llamadas a herramientas
    - Estás investigando desajustes de id de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de transcripciones
x-i18n:
    generated_at: "2026-04-23T14:08:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiene de transcripciones (correcciones por proveedor)

Este documento describe las **correcciones específicas del proveedor** aplicadas a las transcripciones antes de una ejecución
(construcción del contexto del modelo). Estos son ajustes **en memoria** usados para satisfacer
requisitos estrictos del proveedor. Estos pasos de higiene **no** reescriben la transcripción JSONL almacenada
en disco; sin embargo, una pasada independiente de reparación de archivo de sesión puede reescribir archivos JSONL
mal formados eliminando líneas no válidas antes de que se cargue la sesión. Cuando se produce una reparación, el archivo
original se respalda junto al archivo de sesión.

El alcance incluye:

- Saneamiento del id de llamada a herramienta
- Validación de entrada de llamada a herramienta
- Reparación de emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de firmas de pensamiento
- Saneamiento de cargas útiles de imagen
- Etiquetado de procedencia de entrada de usuario (para prompts enrutados entre sesiones)

Si necesitas detalles sobre el almacenamiento de transcripciones, consulta:

- [/reference/session-management-compaction](/es/reference/session-management-compaction)

---

## Dónde se ejecuta esto

Toda la higiene de transcripciones está centralizada en el runner integrado:

- Selección de política: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Aparte de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de la carga:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Se llama desde `run/attempt.ts` y `compact.ts` (runner integrado)

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imagen siempre se sanean para evitar rechazos del proveedor debidos a límites
de tamaño (reducción de escala/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens provocada por imágenes en modelos con capacidad de visión.
Las dimensiones máximas más bajas generalmente reducen el uso de tokens; las más altas conservan más detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de la imagen es configurable mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).

---

## Regla global: llamadas a herramientas mal formadas

Los bloques de llamada a herramientas del asistente a los que les faltan tanto `input` como `arguments` se eliminan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor por llamadas a herramientas
parcialmente conservadas (por ejemplo, después de un fallo por límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos
los pasos de reply/announce de agente a agente), OpenClaw conserva el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

Estos metadatos se escriben en el momento de añadir la transcripción y no cambian el rol
(`role: "user"` se mantiene por compatibilidad con proveedores). Los lectores de transcripciones pueden usar
esto para evitar tratar prompts internos enrutados como instrucciones creadas por el usuario final.

Durante la reconstrucción del contexto, OpenClaw también antepone un marcador corto `[Inter-session message]`
a esos turnos de usuario en memoria para que el modelo pueda distinguirlos de
instrucciones externas del usuario final.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Elimina firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex.
- Sin saneamiento del id de llamada a herramienta.
- Sin reparación de emparejamiento de resultados de herramientas.
- Sin validación ni reordenación de turnos.
- Sin resultados de herramienta sintéticos.
- Sin eliminación de firmas de pensamiento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento del id de llamada a herramienta: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramientas y resultados de herramienta sintéticos.
- Validación de turnos (alternancia de turnos al estilo Gemini).
- Corrección de ordenación de turnos de Google (antepone un pequeño bootstrap de usuario si el historial empieza con asistente).
- Antigravity Claude: normaliza firmas de thinking; elimina bloques de thinking sin firmar.

**Anthropic / Minimax (compatibles con Anthropic)**

- Reparación de emparejamiento de resultados de herramientas y resultados de herramienta sintéticos.
- Validación de turnos (fusiona turnos consecutivos de usuario para satisfacer la alternancia estricta).

**Mistral (incluida la detección basada en model-id)**

- Saneamiento del id de llamada a herramienta: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina valores `thought_signature` que no sean base64 (conserva base64).

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (antes de 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba múltiples capas de higiene de transcripciones:

- Una extensión de **transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear los ids de llamada a herramientas (incluido un modo no estricto que conservaba `_`/`-`).
- El runner también realizaba saneamiento específico del proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminación de etiquetas `<final>` del texto del asistente antes de conservarlo.
  - Eliminación de turnos vacíos de error del asistente.
  - Recorte del contenido del asistente después de llamadas a herramientas.

Esta complejidad causó regresiones entre proveedores (en particular el emparejamiento `call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó
la lógica en el runner e hizo que OpenAI fuera de **no intervención** más allá del saneamiento de imágenes.
