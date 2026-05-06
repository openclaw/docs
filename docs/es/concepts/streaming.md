---
read_when:
    - Explicación de cómo funcionan la transmisión o la fragmentación en los canales
    - Cambiar el comportamiento de transmisión por bloques o de fragmentación de canales
    - Depuración de respuestas de bloque duplicadas/anticipadas o transmisión de vista previa de canales
summary: Comportamiento de streaming + fragmentación (respuestas en bloque, streaming de vista previa del canal, asignación de modos)
title: Transmisión continua y fragmentación
x-i18n:
    generated_at: "2026-05-06T05:32:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming de bloques (canales):** emite **bloques** completados mientras el asistente escribe. Estos son mensajes de canal normales (no deltas de tokens).
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

- `text_delta/events`: eventos del stream del modelo (pueden ser escasos para modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimos/máximos + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desactivado de forma predeterminada).
- Sobrescrituras de canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes de enviar).
- Límite estricto del canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` predeterminado, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (predeterminado 17) divide respuestas altas para evitar recortes en la interfaz.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el fragmentador los emite; vacía en cada `text_end`.
- `message_end`: espera hasta que el mensaje del asistente termina y luego vacía la salida almacenada.

`message_end` sigue usando el fragmentador si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de medios con streaming de bloques

Las directivas `MEDIA:` son metadatos de entrega normales. Cuando el streaming de bloques envía un
bloque de medios de forma anticipada, OpenClaw recuerda esa entrega para el turno. Si la carga útil
final del asistente repite la misma URL de medios, la entrega final elimina los medios
duplicados en lugar de volver a enviar el adjunto.

Las cargas útiles finales exactamente duplicadas se suprimen. Si la carga útil final añade
texto distinto alrededor de medios que ya se transmitieron, OpenClaw sigue enviando el
texto nuevo mientras mantiene los medios con una sola entrega. Esto evita notas de voz
o archivos duplicados en canales como Telegram cuando un agente emite `MEDIA:` durante
el streaming y el proveedor también lo incluye en la respuesta completada.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación de bloques está implementada por `EmbeddedBlockChunker`:

- **Límite bajo:** no emitir hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere divisiones antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte duro.
- **Cercas de código:** nunca divide dentro de cercas; cuando se fuerza en `maxChars`, cierra + reabre la cerca para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, por lo que no puedes superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming de bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloque consecutivos**
antes de enviarlos. Esto reduce el "spam de una sola línea" sin dejar de proporcionar
salida progresiva.

- La coalescencia espera **pausas de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vaciarán si lo superan.
- `minChars` evita enviar fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Las sobrescrituras de canal están disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` de coalescencia predeterminado aumenta a 1500 para Signal/Slack/Discord salvo que se sobrescriba.

## Ritmo humano entre bloques

Cuando el streaming de bloques está habilitado, puedes añadir una **pausa aleatoria** entre
respuestas por bloques (después del primer bloque). Esto hace que las respuestas de varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescribir por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas por bloques**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto corresponde a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no son Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciar una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming de bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota del canal:** El streaming de bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo
(`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de la configuración: los valores predeterminados de `blockStreaming*` viven bajo
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactiva el streaming de vista previa.
- `partial`: una sola vista previa que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

`streaming.mode: "block"` es un modo de streaming de vista previa para canales con capacidad de edición
como Discord y Telegram. No habilita allí la entrega de bloques de canal.
Usa `streaming.block.enabled` o la clave de canal heredada `blockStreaming` cuando
quieras respuestas por bloques normales. Microsoft Teams es la excepción: no tiene
transporte de bloques para borradores de vista previa, así que `streaming.mode: "block"` corresponde a la entrega de bloques de Teams
en lugar del streaming parcial/progreso nativo.

### Mapeo de canales

| Canal      | `off` | `partial` | `block` | `progress`             |
| ---------- | ----- | --------- | ------- | ---------------------- |
| Telegram   | ✅    | ✅        | ✅      | borrador de progreso editable |
| Discord    | ✅    | ✅        | ✅      | borrador de progreso editable |
| Slack      | ✅    | ✅        | ✅      | ✅                     |
| Mattermost | ✅    | ✅        | ✅      | ✅                     |
| MS Teams   | ✅    | ✅        | ✅      | stream de progreso nativo |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativo de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo del asistente de Slack requieren un objetivo de hilo de respuesta. Los DM de nivel superior no muestran esa vista previa con estilo de hilo, pero aún pueden usar publicaciones y ediciones de vista previa de borrador de Slack.

Migración de claves heredadas:

- Telegram: los valores heredados de `streamMode` y los valores escalares/booleanos de `streaming` se detectan y migran mediante rutas de compatibilidad de doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano se migran automáticamente al enum `streaming`.
- Slack: `streamMode` se migra automáticamente a `streaming.mode`; `streaming` booleano se migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; `nativeStreaming` heredado se migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en tiempo de ejecución

Telegram:

- Usa `sendMessage` + actualizaciones de vista previa con `editMessageText` en DM y grupos/temas.
- El texto final edita la vista previa activa en el lugar; las respuestas finales largas reutilizan ese mensaje para el primer fragmento y envían solo los fragmentos restantes.
- El modo `progress` mantiene el progreso de herramientas en un borrador de estado editable, borra ese borrador al completarse y envía la respuesta final mediante la entrega normal.
- Si la edición final falla antes de confirmar el texto completado, OpenClaw usa la entrega final normal y limpia la vista previa obsoleta.
- El streaming de vista previa se omite cuando el streaming de bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir el razonamiento en una vista previa transitoria que se elimina después de la entrega final.

Discord:

- Usa mensajes de vista previa de envío + edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming de bloques de Discord está habilitado explícitamente.
- Los medios finales, errores y cargas útiles de respuesta explícita cancelan vistas previas pendientes sin vaciar un nuevo borrador y luego usan la entrega normal.

Slack:

- `partial` puede usar streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador con estilo de anexado.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- Los DM de nivel superior sin un hilo de respuesta usan publicaciones y ediciones de vista previa de borrador en lugar del streaming nativo de Slack.
- El streaming de vista previa nativo y de borrador suprime las respuestas por bloques para ese turno, por lo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas útiles finales de medios/error y las respuestas finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

Mattermost:

- Transmite el pensamiento, la actividad de herramientas y el texto de respuesta parcial a una sola publicación de vista previa de borrador que se finaliza en el lugar cuando la respuesta final es segura para enviar.
- Recurre a enviar una nueva publicación final si la publicación de vista previa se eliminó o no está disponible al momento de finalizar.
- Las cargas útiles finales de medios/error cancelan las actualizaciones de vista previa pendientes antes de la entrega normal en lugar de vaciar una publicación de vista previa temporal.

Matrix:

- Las vistas previas de borrador se finalizan en el lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo con medios, con error y con discrepancia de objetivo de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas de estado cortas como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras las herramientas se ejecutan, antes de la respuesta final. Esto mantiene visualmente activos los turnos de herramientas de varios pasos, en lugar de dejarlos en silencio entre la primera vista previa de pensamiento y la respuesta final.

Superficies admitidas:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de herramientas en la edición de vista previa en vivo de forma predeterminada cuando el streaming de vista previa está activo. Microsoft Teams usa su flujo de progreso nativo en chats personales.
- Telegram se publicó con actualizaciones de vista previa de progreso de herramientas habilitadas desde `v2026.4.22`; mantenerlas habilitadas preserva ese comportamiento publicado.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de vista previa de borrador (consulta arriba).
- Las ediciones de progreso de herramientas siguen el modo activo de streaming de vista previa; se omiten cuando el streaming de vista previa está `off` o cuando el streaming de bloques ha tomado el control del mensaje. En Telegram, `streaming.mode: "off"` es solo final: el parloteo genérico de progreso también se suprime en lugar de entregarse como mensajes de estado independientes, mientras que las solicitudes de aprobación, las cargas multimedia y los errores se enrutan normalmente.
- Para mantener el streaming de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para mantener visibles las líneas de progreso de herramientas mientras ocultas el texto de comando/ejecución, establece `streaming.preview.commandText` en `"status"` o `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para preservar el comportamiento publicado. Esta política la comparten los canales de borrador/progreso que usan el renderizador compacto de progreso de OpenClaw, incluidos Discord, Matrix, Microsoft Teams, Mattermost, vistas previas de borrador de Slack y Telegram. Para deshabilitar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.
- Las respuestas a citas seleccionadas de Telegram son una excepción: cuando `replyToMode` no es `"off"` y hay texto de cita seleccionado, OpenClaw omite el stream de vista previa de la respuesta para ese turno, por lo que las líneas de vista previa de progreso de herramientas no pueden renderizarse. Las respuestas al mensaje actual sin texto de cita seleccionado siguen manteniendo el streaming de vista previa. Consulta la [documentación del canal de Telegram](/es/channels/telegram) para obtener detalles.

Mantén visibles las líneas de progreso, pero oculta el texto sin procesar de comando/ejecución:

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

Usa la misma forma bajo otra clave de canal de progreso compacto, por ejemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` o vistas previas de borrador de Slack. Para el modo de borrador de progreso, coloca la misma política bajo `streaming.progress`:

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

- [Refactorización del ciclo de vida de mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo compartido de vista previa, edición, stream y finalización
- [Borradores de progreso](/es/concepts/progress-drafts) - mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages) - ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) - comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) - soporte de streaming por canal
