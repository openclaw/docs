---
read_when:
    - Explicar cómo funcionan el streaming o la fragmentación en los canales
    - Cambiar el comportamiento de streaming por bloques o de fragmentación de canales
    - Depurar respuestas en bloques duplicadas o tempranas, o el streaming de vista previa de canal
summary: Comportamiento de streaming + fragmentación (respuestas en bloques, streaming de vista previa de canal, asignación de modos)
title: Streaming y fragmentación
x-i18n:
    generated_at: "2026-04-24T05:26:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + fragmentación

OpenClaw tiene dos capas de streaming separadas:

- **Streaming por bloques (canales):** emite **bloques** completados a medida que el asistente escribe. Son mensajes normales del canal (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal mientras se genera.

Hoy no existe streaming real de deltas de tokens hacia mensajes de canal. El streaming de vista previa se basa en mensajes (enviar + editar/anexar).

## Streaming por bloques (mensajes de canal)

El streaming por bloques envía la salida del asistente en fragmentos amplios a medida que está disponible.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Leyenda:

- `text_delta/events`: eventos de streaming del modelo (pueden ser escasos para modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimos/máximos + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (predeterminado: off).
- Sobrescrituras por canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes de enviarlos).
- Límite estricto del canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` predeterminado, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite suave de Discord: `channels.discord.maxLinesPerMessage` (predeterminado 17) divide respuestas altas para evitar recortes en la interfaz.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el chunker los emite; vacía en cada `text_end`.
- `message_end`: espera a que termine el mensaje del asistente y luego vacía la salida almacenada.

`message_end` sigue usando el chunker si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación por bloques está implementada por `EmbeddedBlockChunker`:

- **Límite bajo:** no emite hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere cortes antes de `maxChars`; si se fuerza, corta en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte forzado.
- **Bloques de código:** nunca divide dentro de bloques delimitados; cuando se fuerza en `maxChars`, cierra y vuelve a abrir el bloque para mantener Markdown válido.

`maxChars` se ajusta al `textChunkLimit` del canal, por lo que no puedes superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming por bloques está habilitado, OpenClaw puede **fusionar fragmentos consecutivos de bloques**
antes de enviarlos. Esto reduce el “spam de una sola línea” y al mismo tiempo proporciona
salida progresiva.

- La coalescencia espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita que se envíen fragmentos muy pequeños hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Hay sobrescrituras por canal disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` predeterminado de coalescencia se incrementa a 1500 para Signal/Slack/Discord salvo sobrescritura.

## Ritmo similar al humano entre bloques

Cuando el streaming por bloques está habilitado, puedes añadir una **pausa aleatoria** entre
respuestas por bloques (después del primer bloque). Esto hace que las respuestas en varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescritura por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas por bloques**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto se asigna a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no son Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciar una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming por bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota sobre canales:** El streaming por bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa activa
(`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de configuración: los valores predeterminados `blockStreaming*` viven bajo
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactiva el streaming de vista previa.
- `partial`: una sola vista previa que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

### Asignación por canal

| Canal      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | se asigna a `partial` |
| Discord    | ✅    | ✅        | ✅      | se asigna a `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Solo Slack:

- `channels.slack.streaming.nativeTransport` activa o desactiva llamadas a la API nativa de streaming de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo del asistente de Slack requieren un destino de hilo de respuesta; los DM de nivel superior no muestran esa vista previa estilo hilo.

Migración de claves heredadas:

- Telegram: `streamMode` + booleano `streaming` migran automáticamente al enum `streaming`.
- Discord: `streamMode` + booleano `streaming` migran automáticamente al enum `streaming`.
- Slack: `streamMode` migra automáticamente a `streaming.mode`; el booleano `streaming` migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; el heredado `nativeStreaming` migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en runtime

Telegram:

- Usa actualizaciones de vista previa con `sendMessage` + `editMessageText` en DM y grupos/temas.
- El streaming de vista previa se omite cuando el streaming por bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir razonamiento en la vista previa.

Discord:

- Usa mensajes de vista previa con enviar + editar.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming por bloques de Discord está habilitado explícitamente.
- Las cargas útiles finales de media, error y respuesta explícita cancelan vistas previas pendientes sin vaciar un nuevo borrador, y luego usan la entrega normal.

Slack:

- `partial` puede usar streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador con estilo append.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- Las cargas útiles finales de media/error y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto pendiente del borrador.

Mattermost:

- Transmite pensamiento, actividad de herramientas y texto parcial de respuesta en una sola publicación de borrador de vista previa que se finaliza en el mismo lugar cuando la respuesta final es segura para enviar.
- Recurre a enviar una nueva publicación final si la publicación de vista previa se eliminó o ya no está disponible en el momento de finalizar.
- Las cargas útiles finales de media/error cancelan actualizaciones pendientes de vista previa antes de la entrega normal en lugar de vaciar una publicación temporal de vista previa.

Matrix:

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo de media, de error y con discrepancia de destino de respuesta cancelan las actualizaciones pendientes de vista previa antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas cortas de estado como “searching the web”, “reading file” o “calling tool” que aparecen en el mismo mensaje de vista previa mientras las herramientas están en ejecución, antes de la respuesta final. Esto mantiene visualmente activos los turnos de herramientas de varios pasos en lugar de quedar en silencio entre la primera vista previa de pensamiento y la respuesta final.

Superficies compatibles:

- **Discord**, **Slack** y **Telegram** transmiten el progreso de herramientas en la edición activa de vista previa.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de borrador de vista previa (consulta arriba).
- Las ediciones de progreso de herramientas siguen el modo activo de streaming de vista previa; se omiten cuando el streaming de vista previa está en `off` o cuando el streaming por bloques ya ha tomado el control del mensaje.

## Relacionado

- [Mensajes](/es/concepts/messages): ciclo de vida y entrega de mensajes
- [Retry](/es/concepts/retry): comportamiento de reintento en fallos de entrega
- [Canales](/es/channels): compatibilidad de streaming por canal
