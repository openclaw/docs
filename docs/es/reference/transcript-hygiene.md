---
read_when:
    - Está depurando rechazos de solicitudes del proveedor relacionados con la estructura de la transcripción
    - Estás cambiando la sanitización de transcripciones o la lógica de reparación de llamadas a herramientas
    - Estás investigando discrepancias en los ID de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de transcripciones
x-i18n:
    generated_at: "2026-05-02T21:05:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw aplica **correcciones específicas del proveedor** a las transcripciones antes de una ejecución (al construir el contexto del modelo). La mayoría son ajustes **en memoria** utilizados para satisfacer requisitos estrictos del proveedor. Una pasada separada de reparación del archivo de sesión también puede reescribir el JSONL almacenado antes de cargar la sesión, ya sea descartando líneas JSONL malformadas o reparando turnos persistidos que son sintácticamente válidos pero que se sabe que serán rechazados por un
proveedor durante la reproducción. Cuando ocurre una reparación, se crea una copia de seguridad del archivo original junto al
archivo de sesión.

El alcance incluye:

- Contexto de prompt solo en tiempo de ejecución que queda fuera de los turnos de transcripción visibles para el usuario
- Saneamiento de id de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación de emparejamiento de resultados de herramientas
- Validación / ordenamiento de turnos
- Limpieza de firmas de pensamiento
- Limpieza de firmas de thinking
- Saneamiento de cargas útiles de imagen
- Limpieza de bloques de texto en blanco antes de la reproducción del proveedor
- Etiquetado de procedencia de la entrada del usuario (para prompts enrutados entre sesiones)
- Reparación de turnos de error de asistente vacíos para reproducción de Bedrock Converse

Si necesitas detalles sobre el almacenamiento de transcripciones, consulta:

- [Análisis detallado de la gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto en tiempo de ejecución no es transcripción del usuario

El contexto de tiempo de ejecución/sistema puede agregarse al prompt del modelo para un turno, pero no es
contenido escrito por el usuario final. OpenClaw mantiene un cuerpo de prompt separado orientado a la transcripción
para respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones de Pi
incrustadas. Los turnos de usuario visibles almacenados usan ese cuerpo de transcripción en lugar del
prompt enriquecido en tiempo de ejecución.

Para sesiones heredadas que ya persistieron envoltorios de tiempo de ejecución, las superficies de historial de Gateway
aplican una proyección de visualización antes de devolver mensajes a clientes WebChat,
TUI, REST o SSE.

---

## Dónde se ejecuta

Toda la higiene de transcripciones está centralizada en el ejecutor incrustado:

- Selección de política: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Separado de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor incrustado)

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imagen siempre se sanean para evitar rechazos del lado del proveedor por límites
de tamaño (reducción de escala/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens impulsada por imágenes en modelos con capacidad de visión.
Dimensiones máximas más bajas generalmente reducen el uso de tokens; dimensiones más altas preservan el detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de imagen se puede configurar mediante `agents.defaults.imageMaxDimensionPx` (valor predeterminado: `1200`).
- Los bloques de texto en blanco se eliminan mientras esta pasada recorre el contenido de reproducción. Los turnos de asistente
  que quedan vacíos se descartan de la copia de reproducción; los turnos de usuario y de resultado de herramienta
  que quedan vacíos reciben un marcador no vacío de contenido omitido.

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamada a herramienta del asistente a los que les faltan tanto `input` como `arguments` se descartan
antes de construir el contexto del modelo. Esto evita rechazos del proveedor por llamadas a herramientas parcialmente
persistidas (por ejemplo, después de una falla de límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entrada entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos
pasos de respuesta/anuncio de agente a agente), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

OpenClaw también antepone un marcador del mismo turno `[Inter-session message ... isUser=false]`
antes del texto del prompt enrutado para que la llamada activa al modelo pueda distinguir
salida de una sesión externa de instrucciones externas del usuario final. Este marcador incluye
la sesión de origen, el canal y la herramienta cuando están disponibles. La transcripción sigue usando
`role: "user"` por compatibilidad con el proveedor, pero tanto el texto visible como los metadatos
de procedencia marcan el turno como datos entre sesiones.

Durante la reconstrucción del contexto, OpenClaw aplica el mismo marcador a turnos de usuario
entre sesiones persistidos más antiguos que solo tienen metadatos de procedencia.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Descarta firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido posterior) para transcripciones de OpenAI Responses/Codex, y descarta razonamiento reproducible de OpenAI después de un cambio de ruta de modelo.
- Preserva las cargas útiles de elementos de razonamiento reproducibles de OpenAI Responses, incluidos elementos cifrados con resumen vacío, para que la reproducción manual/WebSocket mantenga el estado `rs_*` requerido emparejado con los elementos de salida del asistente.
- Sin saneamiento de id de llamadas a herramientas.
- La reparación de emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar salidas `aborted` de estilo Codex para llamadas a herramientas faltantes.
- Sin validación ni reordenamiento de turnos.
- Las salidas de herramientas faltantes de la familia OpenAI Responses se sintetizan como `aborted` para coincidir con la normalización de reproducción de Codex.
- Sin eliminación de firmas de pensamiento.

**Gemma 4 compatible con OpenAI**

- Los bloques históricos de thinking/razonamiento del asistente se eliminan antes de la reproducción para que los servidores
  locales Gemma 4 compatibles con OpenAI no reciban contenido de razonamiento de turnos anteriores.
- Las continuaciones de llamadas a herramientas del mismo turno actual conservan el bloque de razonamiento del asistente
  adjunto a la llamada a herramienta hasta que el resultado de la herramienta se haya reproducido.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de id de llamadas a herramientas: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (alternancia de turnos al estilo Gemini).
- Corrección de ordenamiento de turnos de Google (anteponer un pequeño bootstrap de usuario si el historial empieza con asistente).
- Antigravity Claude: normaliza firmas de thinking; descarta bloques de thinking sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultados de herramientas y resultados de herramientas sintéticos.
- Validación de turnos (fusiona turnos de usuario consecutivos para satisfacer la alternancia estricta).
- Los turnos finales de prellenado del asistente se eliminan de las cargas útiles salientes de Anthropic Messages
  cuando thinking está habilitado, incluidas las rutas de Cloudflare AI Gateway.
- Los bloques de thinking con firmas de reproducción faltantes, vacías o en blanco se eliminan
  antes de la conversión del proveedor. Si eso vacía un turno de asistente, OpenClaw mantiene
  la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos de asistente más antiguos de solo thinking que deben eliminarse se reemplazan por
  texto no vacío de razonamiento omitido para que los adaptadores del proveedor no descarten el turno
  de reproducción.

**Amazon Bedrock (Converse API)**

- Los turnos de error de flujo del asistente vacíos se reparan a un bloque de texto de reserva no vacío
  antes de la reproducción. Bedrock Converse rechaza mensajes de asistente con `content: []`, por lo que
  los turnos de asistente persistidos con `stopReason: "error"` y contenido vacío también se
  reparan en disco antes de cargarse.
- Los turnos de error de flujo del asistente que contienen solo bloques de texto en blanco se descartan
  de la copia de reproducción en memoria en lugar de reproducir un bloque en blanco inválido.
- Los bloques de thinking de Claude con firmas de reproducción faltantes, vacías o en blanco se
  eliminan antes de la reproducción de Converse. Si eso vacía un turno de asistente, OpenClaw
  mantiene la forma del turno con texto no vacío de razonamiento omitido.
- Los turnos de asistente más antiguos de solo thinking que deben eliminarse se reemplazan por
  texto no vacío de razonamiento omitido para que la reproducción de Converse conserve la forma estricta del turno.
- La reproducción filtra turnos de asistente de espejo de entrega de OpenClaw e inyectados por Gateway.
- El saneamiento de imágenes se aplica mediante la regla global.

**Mistral (incluida la detección basada en model-id)**

- Saneamiento de id de llamadas a herramientas: strict9 (longitud alfanumérica 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamiento: elimina valores `thought_signature` que no sean base64 (conserva base64).

**OpenRouter Anthropic**

- Los turnos finales de prellenado del asistente se eliminan de cargas útiles verificadas de modelos Anthropic
  compatibles con OpenAI de OpenRouter cuando el razonamiento está habilitado, coincidiendo con
  el comportamiento de reproducción directo de Anthropic y Cloudflare Anthropic.

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes del lanzamiento 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear id de llamadas a herramientas (incluido un modo no estricto que preservaba `_`/`-`).
- El ejecutor también realizaba saneamiento específico del proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminación de etiquetas `<final>` del texto del asistente antes de la persistencia.
  - Descarte de turnos de error de asistente vacíos.
  - Recorte del contenido del asistente después de llamadas a herramientas.

Esta complejidad provocó regresiones entre proveedores (en particular el emparejamiento `call_id|fc_id` de
`openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó
la lógica en el ejecutor e hizo que OpenAI quedara **sin intervención** más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
