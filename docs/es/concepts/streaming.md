---
read_when:
    - Explicación de cómo funciona la transmisión en tiempo real o la fragmentación en los canales
    - Cambiar el comportamiento de transmisión de bloques o de fragmentación en canales
    - Depuración de respuestas de bloque duplicadas/prematuras o de la transmisión de vista previa del canal
summary: Comportamiento de transmisión y fragmentación (respuestas en bloque, transmisión de vista previa del canal, asignación de modos)
title: Transmisión continua y fragmentación
x-i18n:
    generated_at: "2026-05-04T07:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming de bloques (canales):** emite **bloques** completados mientras el asistente escribe. Son mensajes de canal normales (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal durante la generación.

Actualmente **no hay streaming real de deltas de tokens** hacia los mensajes de canal. El streaming de vista previa se basa en mensajes (envío + ediciones/anexos).

## Streaming de bloques (mensajes de canal)

El streaming de bloques envía la salida del asistente en fragmentos gruesos a medida que está disponible.

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

- `text_delta/events`: eventos de stream del modelo (pueden ser escasos en modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimos/máximos + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desactivado de forma predeterminada).
- Sobrescrituras de canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes del envío).
- Límite estricto de canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación de canal: `*.chunkMode` (`length` predeterminado, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (predeterminado 17) divide respuestas altas para evitar recortes en la interfaz.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el fragmentador emite; vacía en cada `text_end`.
- `message_end`: espera hasta que termine el mensaje del asistente y luego vacía la salida almacenada.

`message_end` sigue usando el fragmentador si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de medios con streaming de bloques

Las directivas `MEDIA:` son metadatos de entrega normales. Cuando el streaming de bloques envía un bloque multimedia anticipadamente, OpenClaw recuerda esa entrega para el turno. Si la carga final del asistente repite la misma URL multimedia, la entrega final elimina el medio duplicado en lugar de volver a enviar el adjunto.

Las cargas finales duplicadas exactas se suprimen. Si la carga final añade texto distinto alrededor de un medio que ya se transmitió, OpenClaw sigue enviando el texto nuevo y mantiene el medio con entrega única. Esto evita notas de voz o archivos duplicados en canales como Telegram cuando un agente emite `MEDIA:` durante el streaming y el proveedor también lo incluye en la respuesta completada.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación de bloques la implementa `EmbeddedBlockChunker`:

- **Límite bajo:** no emitir hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite alto:** preferir divisiones antes de `maxChars`; si se fuerza, dividir en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte duro.
- **Cercas de código:** nunca dividir dentro de cercas; cuando se fuerza en `maxChars`, cerrar + reabrir la cerca para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, por lo que no puedes superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming de bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloque consecutivos** antes de enviarlos. Esto reduce el “spam de líneas sueltas” y aun así proporciona salida progresiva.

- La coalescencia espera **pausas de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita que se envíen fragmentos diminutos hasta que se acumule suficiente texto (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Las sobrescrituras de canal están disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` predeterminado de coalescencia sube a 1500 para Signal/Slack/Discord salvo que se sobrescriba.

## Ritmo humano entre bloques

Cuando el streaming de bloques está habilitado, puedes añadir una **pausa aleatoria** entre respuestas por bloques (después del primer bloque). Esto hace que las respuestas de varias burbujas se sientan más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescribir por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas por bloques**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto corresponde a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no sean Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciar una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming de bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota de canal:** El streaming de bloques está **desactivado salvo que** `*.blockStreaming` esté establecido explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo (`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de configuración: los valores predeterminados de `blockStreaming*` están bajo `agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: deshabilita el streaming de vista previa.
- `partial`: una única vista previa que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completar.

`streaming.mode: "block"` es un modo de streaming de vista previa para canales con capacidad de edición como Discord y Telegram. No habilita allí la entrega de bloques de canal. Usa `streaming.block.enabled` o la clave de canal heredada `blockStreaming` cuando quieras respuestas por bloques normales. Microsoft Teams es la excepción: no tiene transporte de bloques de vista previa de borrador, por lo que `streaming.mode: "block"` se asigna a la entrega de bloques de Teams en lugar de streaming parcial/progreso nativo.

### Asignación por canal

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | borrador de progreso editable |
| Discord    | ✅    | ✅        | ✅      | borrador de progreso editable |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream de progreso nativo  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativa de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo de asistente de Slack requieren un destino de hilo de respuesta. Los mensajes directos de nivel superior no muestran esa vista previa con estilo de hilo, pero aun así pueden usar publicaciones y ediciones de vista previa de borrador de Slack.

Migración de claves heredadas:

- Telegram: los valores heredados `streamMode` y los valores escalares/booleanos `streaming` se detectan y migran mediante rutas de compatibilidad de doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migran automáticamente al enum `streaming`.
- Slack: `streamMode` migra automáticamente a `streaming.mode`; `streaming` booleano migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; `nativeStreaming` heredado migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en tiempo de ejecución

Telegram:

- Usa `sendMessage` + actualizaciones de vista previa con `editMessageText` en mensajes directos y grupos/temas.
- Envía un mensaje final nuevo en lugar de editar en el mismo lugar cuando una vista previa ha estado visible durante alrededor de un minuto, y luego limpia la vista previa para que la marca de tiempo de Telegram refleje la finalización de la respuesta.
- El streaming de vista previa se omite cuando el streaming de bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir razonamiento en una vista previa transitoria que se elimina después de la entrega final.

Discord:

- Usa mensajes de vista previa de envío + edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming de bloques de Discord está habilitado explícitamente.
- Las cargas finales de medios, errores y respuestas explícitas cancelan las vistas previas pendientes sin vaciar un borrador nuevo, y luego usan la entrega normal.

Slack:

- `partial` puede usar streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador de estilo anexo.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- Los mensajes directos de nivel superior sin un hilo de respuesta usan publicaciones y ediciones de vista previa de borrador en lugar de streaming nativo de Slack.
- El streaming de vista previa nativo y de borrador suprime las respuestas por bloques para ese turno, por lo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas finales de medios/error y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

Mattermost:

- Transmite pensamiento, actividad de herramientas y texto parcial de respuesta en una sola publicación de vista previa de borrador que se finaliza en el mismo lugar cuando la respuesta final es segura para enviar.
- Recurre a enviar una publicación final nueva si la publicación de vista previa se eliminó o no está disponible al momento de finalizar.
- Las cargas finales de medios/error cancelan las actualizaciones de vista previa pendientes antes de la entrega normal en lugar de vaciar una publicación de vista previa temporal.

Matrix:

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo multimedia, de error y con discrepancia de destino de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas de estado breves como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras las herramientas se ejecutan, antes de la respuesta final. Esto mantiene visualmente vivos los turnos de herramientas de varios pasos en lugar de silenciosos entre la primera vista previa de pensamiento y la respuesta final.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de herramientas a la edición de vista previa en vivo de forma predeterminada cuando el streaming de vista previa está activo. Microsoft Teams usa su stream de progreso nativo en chats personales.
- Telegram se ha publicado con actualizaciones de vista previa de progreso de herramientas habilitadas desde `v2026.4.22`; mantenerlas habilitadas preserva ese comportamiento publicado.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de vista previa de borrador (ver arriba).
- Las ediciones de progreso de herramientas siguen el modo de streaming de vista previa activo; se omiten cuando el streaming de vista previa está `off` o cuando el streaming de bloques se ha hecho cargo del mensaje. En Telegram, `streaming.mode: "off"` es solo final: la charla genérica de progreso también se suprime en lugar de entregarse como mensajes de estado independientes, mientras que las solicitudes de aprobación, las cargas multimedia y los errores siguen enrutándose normalmente.
- Para mantener el streaming de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para mantener visibles las líneas de progreso de herramientas mientras ocultas el texto de comando/ejecución, establece `streaming.preview.commandText` en `"status"` o `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para preservar el comportamiento publicado. Esta política la comparten los canales de borrador/progreso que usan el renderizador compacto de progreso de OpenClaw, incluidos Discord, Matrix, Microsoft Teams, Mattermost, vistas previas de borrador de Slack y Telegram. Para deshabilitar completamente las ediciones de vista previa, establece `streaming.mode` en `off`.
- Las respuestas con cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es `"off"` y hay texto de cita seleccionada presente, OpenClaw omite el stream de vista previa de respuesta para ese turno, por lo que las líneas de vista previa de progreso de herramientas no pueden renderizarse. Las respuestas al mensaje actual sin texto de cita seleccionada siguen manteniendo el streaming de vista previa. Consulta la [documentación del canal de Telegram](/es/channels/telegram) para obtener detalles.

Mantén visibles las líneas de progreso, pero oculta el texto sin procesar de comandos/ejecución:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Usa la misma estructura bajo otra clave de canal de progreso compacto, por ejemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` o las vistas previas de borradores de Slack. Para el modo de borrador de progreso, coloca la misma política bajo `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Relacionado

- [Borradores de progreso](/es/concepts/progress-drafts) — mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages) — ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) — comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) — compatibilidad de streaming por canal
