---
read_when:
    - Explicación de cómo funcionan la transmisión por secuencias o la fragmentación en los canales
    - Cambiar el comportamiento de streaming de bloques o de fragmentación de canales
    - Depuración de respuestas de bloque duplicadas/prematuras o de la transmisión de vista previa del canal
summary: Comportamiento de streaming y fragmentación (respuestas en bloque, streaming de vista previa del canal, asignación de modos)
title: Transmisión y fragmentación
x-i18n:
    generated_at: "2026-05-03T21:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming de bloques (canales):** emite **bloques** completados mientras el asistente escribe. Son mensajes de canal normales (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal durante la generación.

Actualmente **no hay verdadero streaming de deltas de tokens** hacia los mensajes de canal. El streaming de vista previa se basa en mensajes (envío + ediciones/adiciones).

## Streaming de bloques (mensajes de canal)

El streaming de bloques envía la salida del asistente en fragmentos grandes a medida que está disponible.

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
- `chunker`: `EmbeddedBlockChunker` que aplica límites mín./máx. + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desactivado de forma predeterminada).
- Sobrescrituras de canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes de enviarlos).
- Límite estricto del canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` predeterminado, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (predeterminado 17) divide respuestas altas para evitar recortes en la UI.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el fragmentador los emite; vacía en cada `text_end`.
- `message_end`: espera hasta que termine el mensaje del asistente y luego vacía la salida almacenada.

`message_end` sigue usando el fragmentador si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de medios con streaming de bloques

Las directivas `MEDIA:` son metadatos de entrega normales. Cuando el streaming de bloques envía un bloque multimedia temprano, OpenClaw recuerda esa entrega durante el turno. Si la carga final del asistente repite la misma URL multimedia, la entrega final elimina el medio duplicado en lugar de enviar el adjunto otra vez.

Las cargas finales exactamente duplicadas se suprimen. Si la carga final agrega texto distinto alrededor de medios que ya se transmitieron, OpenClaw sigue enviando el texto nuevo y mantiene el medio con una sola entrega. Esto evita notas de voz o archivos duplicados en canales como Telegram cuando un agente emite `MEDIA:` durante el streaming y el proveedor también lo incluye en la respuesta completada.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación de bloques se implementa mediante `EmbeddedBlockChunker`:

- **Límite bajo:** no emitir hasta que el búfer >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere dividir antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte forzado.
- **Bloques de código:** nunca divide dentro de bloques; cuando se fuerza en `maxChars`, cierra y reabre el bloque para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, así que no puedes superar los topes por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming de bloques está activado, OpenClaw puede **fusionar fragmentos de bloques consecutivos** antes de enviarlos. Esto reduce el “spam de una sola línea” sin dejar de ofrecer salida progresiva.

- La coalescencia espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita que se envíen fragmentos diminutos hasta que se acumule suficiente texto (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Hay sobrescrituras de canal disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` predeterminado de coalescencia se sube a 1500 para Signal/Slack/Discord salvo que se sobrescriba.

## Ritmo similar al humano entre bloques

Cuando el streaming de bloques está activado, puedes agregar una **pausa aleatoria** entre respuestas por bloques (después del primer bloque). Esto hace que las respuestas de varias burbujas se sientan más naturales.

- Configuración: `agents.defaults.humanDelay` (se sobrescribe por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas por bloques**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto corresponde a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite sobre la marcha). Los canales que no sean Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciado una vez, posiblemente varios fragmentos si es muy largo).
- **Sin streaming de bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota sobre canales:** El streaming de bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo (`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de configuración: los valores predeterminados de `blockStreaming*` viven bajo `agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactiva el streaming de vista previa.
- `partial`: vista previa única que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/agregados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

`streaming.mode: "block"` es un modo de streaming de vista previa para canales con capacidad de edición como Discord y Telegram. No habilita allí la entrega de bloques del canal. Usa `streaming.block.enabled` o la clave de canal heredada `blockStreaming` cuando quieras respuestas normales por bloques. Microsoft Teams es la excepción: no tiene transporte de bloques de borrador/vista previa, por lo que `streaming.mode: "block"` se asigna a la entrega de bloques de Teams en lugar de streaming parcial/de progreso nativo.

### Mapeo de canales

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | borrador de progreso editable |
| Discord    | ✅    | ✅        | ✅      | borrador de progreso editable |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream de progreso nativo  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativo de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo de asistente de Slack requieren un destino de hilo de respuesta. Los DM de nivel superior no muestran esa vista previa con estilo de hilo, pero aún pueden usar publicaciones de vista previa de borrador de Slack y ediciones.

Migración de claves heredadas:

- Telegram: los valores heredados `streamMode` y escalares/booleanos de `streaming` se detectan y migran mediante rutas de compatibilidad de doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano se migran automáticamente al enum `streaming`.
- Slack: `streamMode` se migra automáticamente a `streaming.mode`; `streaming` booleano se migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; `nativeStreaming` heredado se migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en tiempo de ejecución

Telegram:

- Usa `sendMessage` + actualizaciones de vista previa con `editMessageText` en DM y grupos/temas.
- Envía un mensaje final nuevo en lugar de editar en el mismo lugar cuando una vista previa ha estado visible durante aproximadamente un minuto, y luego limpia la vista previa para que la marca de tiempo de Telegram refleje la finalización de la respuesta.
- El streaming de vista previa se omite cuando el streaming de bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir razonamiento en la vista previa.

Discord:

- Usa mensajes de vista previa con envío + edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming de bloques de Discord está habilitado explícitamente.
- Los medios finales, errores y cargas de respuesta explícita cancelan vistas previas pendientes sin vaciar un borrador nuevo, y luego usan la entrega normal.

Slack:

- `partial` puede usar streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador con estilo de adición.
- `progress` usa texto de vista previa de estado, luego la respuesta final.
- Los DM de nivel superior sin hilo de respuesta usan publicaciones de vista previa de borrador y ediciones en lugar de streaming nativo de Slack.
- El streaming nativo y de vista previa de borrador suprimen las respuestas por bloques para ese turno, por lo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas finales de medios/error y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

Mattermost:

- Transmite pensamiento, actividad de herramientas y texto parcial de respuesta en una sola publicación de vista previa de borrador que se finaliza en el mismo lugar cuando la respuesta final es segura para enviar.
- Recurre al envío de una publicación final nueva si la publicación de vista previa se eliminó o no está disponible al momento de finalizar.
- Las cargas finales de medios/error cancelan las actualizaciones de vista previa pendientes antes de la entrega normal, en lugar de vaciar una publicación de vista previa temporal.

Matrix:

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo de medios, errores y con discrepancia de destino de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta que ya está visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas de estado breves como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras las herramientas se ejecutan, antes de la respuesta final. Esto mantiene visualmente vivos los turnos de herramientas de varios pasos, en lugar de dejarlos en silencio entre la primera vista previa de pensamiento y la respuesta final.

Superficies admitidas:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten progreso de herramientas en la edición de vista previa en vivo de forma predeterminada cuando el streaming de vista previa está activo. Microsoft Teams usa su stream de progreso nativo en chats personales.
- Telegram se lanzó con actualizaciones de vista previa de progreso de herramientas habilitadas desde `v2026.4.22`; mantenerlas habilitadas conserva ese comportamiento publicado.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de vista previa de borrador (ver arriba).
- Las ediciones de progreso de herramientas siguen el modo de streaming de vista previa activo; se omiten cuando el streaming de vista previa está `off` o cuando el streaming de bloques ha tomado el control del mensaje. En Telegram, `streaming.mode: "off"` es solo final: la charla de progreso genérica también se suprime en lugar de entregarse como mensajes de estado independientes, mientras que las solicitudes de aprobación, las cargas multimedia y los errores siguen enrutándose normalmente.
- Para mantener el streaming de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para desactivar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.
- Las respuestas de cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es `"off"` y hay texto de cita seleccionada, OpenClaw omite el stream de vista previa de la respuesta para ese turno, por lo que las líneas de vista previa de progreso de herramientas no pueden renderizarse. Las respuestas al mensaje actual sin texto de cita seleccionada siguen manteniendo el streaming de vista previa. Consulta la [documentación del canal Telegram](/es/channels/telegram) para obtener detalles.

Ejemplo:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
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
- [Canales](/es/channels) — soporte de streaming por canal
