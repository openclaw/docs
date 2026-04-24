---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor vinculados a la forma de la transcripción
    - Estás cambiando el saneamiento de transcripciones o la lógica de reparación de llamadas a herramientas
    - Estás investigando desajustes de id de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas específicas de proveedor para saneamiento y reparación de transcripciones'
title: Higiene de transcripciones
x-i18n:
    generated_at: "2026-04-24T05:50:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiene de transcripciones (correcciones por proveedor)

Este documento describe las **correcciones específicas por proveedor** aplicadas a las transcripciones antes de una ejecución
(construcción del contexto del modelo). Estos son ajustes **en memoria** usados para satisfacer requisitos estrictos
del proveedor. Estos pasos de higiene **no** reescriben la transcripción JSONL almacenada
en disco; sin embargo, una pasada separada de reparación del archivo de sesión puede reescribir
archivos JSONL malformados eliminando líneas no válidas antes de que se cargue la sesión. Cuando se produce una reparación, el
archivo original se respalda junto al archivo de sesión.

El alcance incluye:

- Saneamiento de id de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación del emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de thought signatures
- Saneamiento de cargas útiles de imágenes
- Etiquetado de procedencia de entrada de usuario (para prompts enrutados entre sesiones)

Si necesitas detalles del almacenamiento de transcripciones, consulta:

- [/reference/session-management-compaction](/es/reference/session-management-compaction)

---

## Dónde se ejecuta

Toda la higiene de transcripciones está centralizada en el ejecutor embebido:

- Selección de política: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Separadamente de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor embebido)

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imágenes siempre se sanean para evitar rechazos del proveedor por
límites de tamaño (reducción de escala/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens impulsada por imágenes para modelos con capacidad de visión.
Dimensiones máximas más bajas generalmente reducen el uso de tokens; dimensiones más altas conservan más detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de la imagen es configurable mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamadas a herramientas del asistente a los que les faltan tanto `input` como `arguments` se eliminan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor debidos a llamadas a herramientas
conservadas parcialmente (por ejemplo, después de un fallo por límite de velocidad).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos
pasos de reply/announce entre agentes), OpenClaw conserva el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

Estos metadatos se escriben al anexar la transcripción y no cambian el rol
(`role: "user"` se mantiene por compatibilidad con el proveedor). Los lectores de transcripciones pueden usar
esto para evitar tratar prompts internos enrutados como instrucciones escritas por el usuario final.

Durante la reconstrucción del contexto, OpenClaw también antepone un pequeño marcador `[Inter-session message]`
a esos turnos de usuario en memoria para que el modelo pueda distinguirlos de
instrucciones externas del usuario final.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Elimina firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex.
- Sin saneamiento de id de llamadas a herramientas.
- Sin reparación del emparejamiento de resultados de herramientas.
- Sin validación ni reordenación de turnos.
- Sin resultados sintéticos de herramientas.
- Sin eliminación de thought signatures.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamadas a herramientas: alfanumérico estricto.
- Reparación del emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (alternancia de turnos estilo Gemini).
- Corrección del orden de turnos de Google (antepone un pequeño bootstrap de usuario si el historial empieza con el asistente).
- Claude de Antigravity: normaliza thinking signatures; elimina bloques de pensamiento sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación del emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (fusiona turnos consecutivos de usuario para satisfacer la alternancia estricta).

**Mistral (incluida la detección basada en id de modelo)**

- Saneamiento de id de llamadas a herramientas: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de thought signatures: elimina valores de `thought_signature` que no sean base64 (conserva los base64).

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (antes de 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear ids de llamadas a herramientas (incluido un modo no estricto que conservaba `_`/`-`).
- El ejecutor también realizaba saneamiento específico por proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, entre ellas:
  - Eliminar etiquetas `<final>` del texto del asistente antes de conservarlo.
  - Eliminar turnos vacíos de error del asistente.
  - Recortar el contenido del asistente después de llamadas a herramientas.

Esta complejidad causó regresiones entre proveedores (en especial en el emparejamiento
`call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó
la lógica en el ejecutor y convirtió OpenAI en **sin modificaciones** más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
