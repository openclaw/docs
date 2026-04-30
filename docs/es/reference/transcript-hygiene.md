---
read_when:
    - Estás depurando rechazos de solicitudes de proveedor vinculados a la estructura de la transcripción.
    - Estás cambiando la sanitización de transcripciones o la lógica de reparación de llamadas a herramientas
    - Estás investigando discrepancias de ID de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de la transcripción
x-i18n:
    generated_at: "2026-04-30T06:01:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas de proveedor** a las transcripciones antes de una ejecución (al construir el contexto del modelo). La mayoría de estos son ajustes **en memoria** utilizados para satisfacer requisitos estrictos del proveedor. Un pase independiente de reparación de archivos de sesión también puede reescribir el JSONL almacenado antes de cargar la sesión, ya sea descartando líneas JSONL malformadas o reparando turnos persistidos que son sintácticamente válidos pero que se sabe que un
proveedor rechazará durante la reproducción. Cuando ocurre una reparación, se crea una copia de seguridad del archivo original junto al
archivo de sesión.

El alcance incluye:

- Contexto de prompt solo en tiempo de ejecución que se mantiene fuera de los turnos de transcripción visibles para el usuario
- Sanitización de ids de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación de emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de razonamiento
- Sanitización de cargas de imágenes
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Etiquetado de procedencia de entrada de usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error vacíos del asistente para reproducción de Bedrock Converse

Si necesitas detalles de almacenamiento de transcripciones, consulta:

- [Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto de tiempo de ejecución no es transcripción de usuario

El contexto de tiempo de ejecución/sistema puede añadirse al prompt del modelo para un turno, pero
no es contenido creado por el usuario final. OpenClaw mantiene un cuerpo de prompt
orientado a transcripción separado para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones
Pi incrustadas. Los turnos de usuario visibles almacenados usan ese cuerpo de transcripción en lugar del
prompt enriquecido en tiempo de ejecución.

Para sesiones heredadas que ya persistieron envoltorios de tiempo de ejecución, las superficies de historial de Gateway
aplican una proyección de visualización antes de devolver mensajes a clientes WebChat,
TUI, REST o SSE.

---

## Dónde se ejecuta esto

Toda la higiene de transcripciones está centralizada en el ejecutor incrustado:

- Selección de política: `src/agents/transcript-policy.ts`
- Aplicación de sanitización/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Separados de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de la carga:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor incrustado)

---

## Regla global: sanitización de imágenes

Las cargas de imágenes siempre se sanitizan para evitar rechazos del lado del proveedor debido a límites de
tamaño (reducción de escala/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens impulsada por imágenes en modelos con capacidad de visión.
Dimensiones máximas más bajas generalmente reducen el uso de tokens; dimensiones más altas preservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de imagen es configurable mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).
- Los bloques de texto en blanco se eliminan mientras este pase recorre el contenido de reproducción. Los turnos del asistente
  que quedan vacíos se descartan de la copia de reproducción; los turnos de usuario y de resultado de herramienta
  que quedan vacíos reciben un marcador de posición no vacío de contenido omitido.

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamadas a herramientas del asistente a los que les faltan tanto `input` como `arguments` se descartan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor por llamadas a herramientas
persistidas parcialmente (por ejemplo, después de un fallo de límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos
pasos de respuesta/anuncio entre agentes), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

OpenClaw también antepone un marcador `[Inter-session message ... isUser=false]`
en el mismo turno antes del texto del prompt enrutado para que la llamada activa al modelo pueda distinguir
la salida de una sesión externa de instrucciones externas del usuario final. Este marcador incluye
la sesión de origen, el canal y la herramienta cuando están disponibles. La transcripción sigue usando
`role: "user"` por compatibilidad con el proveedor, pero tanto el texto visible como los metadatos de procedencia
marcan el turno como datos entre sesiones.

Durante la reconstrucción de contexto, OpenClaw aplica el mismo marcador a turnos de usuario entre sesiones
persistidos antiguos que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo sanitización de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido siguiente) para transcripciones de OpenAI Responses/Codex, y descarta razonamiento de OpenAI reproducible después de un cambio de ruta de modelo.
- Preserva las cargas de elementos de razonamiento reproducibles de OpenAI Responses, incluidos elementos cifrados con resumen vacío, para que la reproducción manual/WebSocket mantenga el estado `rs_*` requerido emparejado con elementos de salida del asistente.
- No se sanitizan los ids de llamadas a herramientas.
- La reparación de emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar salidas `aborted` de estilo Codex para llamadas a herramientas faltantes.
- No hay validación ni reordenación de turnos.
- Las salidas de herramientas faltantes de la familia OpenAI Responses se sintetizan como `aborted` para coincidir con la normalización de reproducción de Codex.
- No se eliminan firmas de pensamiento.

**Gemma 4 compatible con OpenAI**

- Los bloques históricos de pensamiento/razonamiento del asistente se eliminan antes de la reproducción para que los servidores locales
  Gemma 4 compatibles con OpenAI no reciban contenido de razonamiento de turnos anteriores.
- Las continuaciones de llamadas a herramientas del mismo turno actual conservan el bloque de razonamiento del asistente
  adjunto a la llamada a herramienta hasta que el resultado de herramienta se haya reproducido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitización de ids de llamadas a herramientas: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (alternancia de turnos estilo Gemini).
- Corrección de ordenación de turnos de Google (anteponer un arranque de usuario diminuto si el historial empieza con asistente).
- Antigravity Claude: normaliza firmas de razonamiento; descarta bloques de razonamiento sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (fusiona turnos de usuario consecutivos para satisfacer la alternancia estricta).
- Los turnos finales de prellenado del asistente se eliminan de las cargas salientes de Anthropic Messages
  cuando el razonamiento está habilitado, incluidas rutas de Cloudflare AI Gateway.
- Los bloques de razonamiento con firmas de reproducción faltantes, vacías o en blanco se eliminan
  antes de la conversión del proveedor. Si eso vacía un turno del asistente, OpenClaw conserva
  la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente solo de razonamiento que deben eliminarse se reemplazan con
  texto no vacío de razonamiento omitido para que los adaptadores de proveedor no descarten el turno
  de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos de error de flujo vacíos del asistente se reparan a un bloque de texto de respaldo no vacío
  antes de la reproducción. Bedrock Converse rechaza mensajes de asistente con `content: []`, por lo que
  los turnos de asistente persistidos con `stopReason: "error"` y contenido vacío también se
  reparan en disco antes de la carga.
- Los turnos de error de flujo del asistente que contienen solo bloques de texto en blanco se descartan
  de la copia de reproducción en memoria en lugar de reproducir un bloque en blanco inválido.
- Los bloques de razonamiento de Claude con firmas de reproducción faltantes, vacías o en blanco se
  eliminan antes de la reproducción de Converse. Si eso vacía un turno del asistente, OpenClaw
  conserva la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos antiguos del asistente solo de razonamiento que deben eliminarse se reemplazan con
  texto no vacío de razonamiento omitido para que la reproducción de Converse conserve la forma estricta del turno.
- La reproducción filtra turnos del asistente de espejo de entrega de OpenClaw e inyectados por Gateway.
- La sanitización de imágenes se aplica mediante la regla global.

**Mistral (incluida detección basada en id de modelo)**

- Sanitización de ids de llamadas a herramientas: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina valores `thought_signature` que no sean base64 (conserva base64).

**Todo lo demás**

- Solo sanitización de imágenes.

---

## Comportamiento histórico (antes de 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión de sanitización de transcripciones** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanitizar ids de llamadas a herramientas (incluido un modo no estricto que preservaba `_`/`-`).
- El ejecutor también realizaba sanitización específica de proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política de proveedor, incluidas:
  - Eliminar etiquetas `<final>` del texto del asistente antes de la persistencia.
  - Descartar turnos de error vacíos del asistente.
  - Recortar contenido del asistente después de llamadas a herramientas.

Esta complejidad causó regresiones entre proveedores (en particular el emparejamiento `call_id|fc_id` de
`openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó
la lógica en el ejecutor e hizo que OpenAI fuera **sin intervención** más allá de la sanitización de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
