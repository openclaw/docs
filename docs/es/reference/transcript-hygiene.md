---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor relacionados con la forma de la transcripción
    - Estás cambiando la lógica de saneamiento de transcripciones o de reparación de llamadas a herramientas
    - Estás investigando discrepancias de id de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de transcripciones
x-i18n:
    generated_at: "2026-04-25T18:21:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 880a72d4f73e195ff93f26537d3c80c88dc454691765d3d44032ff43076a07c3
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Este documento describe las **correcciones específicas del proveedor** aplicadas a las transcripciones antes de una ejecución
(construcción del contexto del modelo). La mayoría de estos ajustes se realizan **en memoria**
para satisfacer requisitos estrictos del proveedor. Un paso independiente de reparación del archivo de sesión también puede reescribir
el JSONL almacenado antes de que se cargue la sesión, ya sea eliminando líneas JSONL malformadas o
reparando turnos persistidos que son sintácticamente válidos pero que se sabe que un
proveedor rechaza durante la reproducción. Cuando ocurre una reparación, se crea una copia de seguridad del archivo original junto al archivo de sesión.

El alcance incluye:

- Contexto de prompt solo en tiempo de ejecución que se mantiene fuera de los turnos de transcripción visibles para el usuario
- Saneamiento de id de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación del emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de firmas de pensamiento
- Saneamiento de cargas útiles de imágenes
- Etiquetado de procedencia de entrada del usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para la reproducción de Bedrock Converse

Si necesitas detalles sobre el almacenamiento de transcripciones, consulta:

- [Análisis detallado de gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto de tiempo de ejecución no es la transcripción del usuario

El contexto de tiempo de ejecución/del sistema puede añadirse al prompt del modelo para un turno, pero no es
contenido creado por el usuario final. OpenClaw mantiene un cuerpo de prompt separado orientado a la transcripción
para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones integradas de Pi. Los
turnos visibles de usuario almacenados usan ese cuerpo de transcripción en lugar del
prompt enriquecido en tiempo de ejecución.

Para sesiones heredadas que ya persistieron envoltorios de tiempo de ejecución, las
superficies del historial de Gateway aplican una proyección de visualización antes de devolver mensajes a
clientes de WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta esto

Toda la higiene de transcripciones está centralizada en el ejecutor integrado:

- Selección de política: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Por separado de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor integrado)

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imágenes siempre se sanean para evitar rechazos del proveedor debidos a límites
de tamaño (reescalado/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens provocada por imágenes para modelos con capacidad de visión.
Las dimensiones máximas menores generalmente reducen el uso de tokens; las dimensiones mayores preservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de la imagen es configurable mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamadas a herramientas del asistente a los que les faltan tanto `input` como `arguments` se eliminan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor causados por llamadas a herramientas
parcialmente persistidas (por ejemplo, después de un fallo por límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entradas entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos
pasos de reply/announce entre agentes), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

Estos metadatos se escriben en el momento de añadir a la transcripción y no cambian el rol
(`role: "user"` se mantiene por compatibilidad con el proveedor). Los lectores de transcripciones pueden usar
esto para evitar tratar prompts internos enrutados como instrucciones creadas por el usuario final.

Durante la reconstrucción del contexto, OpenClaw también antepone en memoria un breve marcador
`[Inter-session message]` a esos turnos de usuario para que el modelo pueda distinguirlos de
instrucciones externas del usuario final.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Elimina firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex, y elimina razonamiento reproducible de OpenAI después de un cambio de ruta del modelo.
- Sin saneamiento de id de llamadas a herramientas.
- La reparación del emparejamiento de resultados de herramientas puede mover salidas reales emparejadas y sintetizar salidas `aborted` de estilo Codex para llamadas a herramientas faltantes.
- Sin validación ni reordenación de turnos.
- Se sintetizan salidas faltantes de herramientas de la familia OpenAI Responses como `aborted` para coincidir con la normalización de reproducción de Codex.
- Sin eliminación de firmas de pensamiento.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamadas a herramientas: alfanumérico estricto.
- Reparación del emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (alternancia de turnos al estilo Gemini).
- Corrección del orden de turnos de Google (antepone un pequeño bootstrap de usuario si el historial comienza con assistant).
- Antigravity Claude: normaliza firmas de pensamiento; elimina bloques de pensamiento sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación del emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (fusiona turnos consecutivos de usuario para satisfacer la alternancia estricta).

**Amazon Bedrock (API Converse)**

- Los turnos vacíos del asistente por error de flujo se reparan con un bloque de texto de respaldo no vacío
  antes de la reproducción. Bedrock Converse rechaza mensajes del asistente con `content: []`, por lo que
  los turnos persistidos del asistente con `stopReason: "error"` y contenido vacío también se reparan en disco antes de la carga.
- La reproducción filtra los turnos del asistente reflejados por entrega de OpenClaw e inyectados por gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida la detección basada en model-id)**

- Saneamiento de id de llamadas a herramientas: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina valores `thought_signature` que no sean base64 (conserva base64).

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (antes de 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear id de llamadas a herramientas (incluido un modo no estricto que preservaba `_`/`-`).
- El ejecutor también realizaba saneamiento específico del proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminación de etiquetas `<final>` del texto del asistente antes de persistirlo.
  - Eliminación de turnos vacíos de error del asistente.
  - Recorte del contenido del asistente después de llamadas a herramientas.

Esta complejidad causó regresiones entre proveedores (especialmente en el emparejamiento
`call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó
la lógica en el ejecutor e hizo que OpenAI fuera de **no intervención** más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
