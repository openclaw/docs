---
read_when:
    - Explicación de cómo funcionan la transmisión en streaming o la fragmentación en los canales
    - Cambiar el comportamiento de la transmisión de bloques o de la fragmentación de canales
    - Depuración de respuestas de bloque duplicadas/anticipadas o streaming de vista previa del canal
summary: Comportamiento de transmisión y fragmentación (respuestas en bloque, transmisión de vista previa del canal, asignación de modos)
title: Streaming y fragmentación
x-i18n:
    generated_at: "2026-05-06T17:55:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming por bloques (canales):** emite **bloques** completados a medida que el asistente escribe. Estos son mensajes normales del canal (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal durante la generación.

Hoy **no existe streaming real de deltas de tokens** hacia los mensajes de canal. El streaming de vista previa se basa en mensajes (envío + ediciones/anexos).

## Streaming por bloques (mensajes de canal)

El streaming por bloques envía la salida del asistente en fragmentos grandes a medida que está disponible.

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

- `text_delta/events`: eventos de streaming del modelo (pueden ser escasos en modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimo/máximo + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desactivado de forma predeterminada).
- Sobrescrituras de canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes del envío).
- Límite estricto del canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` predeterminado, `newline` divide por líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (predeterminado 17) divide respuestas altas para evitar recortes en la UI.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el fragmentador los emite; vacía en cada `text_end`.
- `message_end`: espera hasta que finalice el mensaje del asistente y luego vacía la salida almacenada.

`message_end` sigue usando el fragmentador si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de medios con streaming por bloques

Las directivas `MEDIA:` son metadatos de entrega normales. Cuando el streaming por bloques envía un
bloque de medios de forma anticipada, OpenClaw recuerda esa entrega para el turno. Si la carga final
del asistente repite la misma URL de medios, la entrega final elimina el medio
duplicado en lugar de enviar el adjunto de nuevo.

Las cargas finales duplicadas exactas se suprimen. Si la carga final agrega
texto distinto alrededor de medios que ya se transmitieron, OpenClaw sigue enviando el
texto nuevo mientras mantiene los medios en una sola entrega. Esto evita notas de voz
o archivos duplicados en canales como Telegram cuando un agente emite `MEDIA:` durante
el streaming y el proveedor también lo incluye en la respuesta completada.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación por bloques la implementa `EmbeddedBlockChunker`:

- **Límite bajo:** no emitir hasta que el búfer >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere divisiones antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte duro.
- **Bloques de código:** nunca divide dentro de bloques; cuando se fuerza en `maxChars`, cierra + reabre el bloque para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, por lo que no puedes superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming por bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloque consecutivos**
antes de enviarlos. Esto reduce el "spam de una sola línea" sin dejar de proporcionar
salida progresiva.

- La coalescencia espera **pausas de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` impide enviar fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Hay sobrescrituras de canal disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` de coalescencia predeterminado se aumenta a 1500 para Signal/Slack/Discord salvo que se sobrescriba.

## Ritmo similar al humano entre bloques

Cuando el streaming por bloques está habilitado, puedes añadir una **pausa aleatoria** entre
respuestas por bloques (después del primer bloque). Esto hace que las respuestas con varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescribir por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas por bloques**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto se asigna a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no son Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciar una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming por bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota de canal:** El streaming por bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo
(`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de configuración: los valores predeterminados `blockStreaming*` están bajo
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: deshabilita el streaming de vista previa.
- `partial`: vista previa única que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

`streaming.mode: "block"` es un modo de streaming de vista previa para canales con capacidad de edición
como Discord y Telegram. No habilita allí la entrega por bloques del canal.
Usa `streaming.block.enabled` o la clave de canal heredada `blockStreaming` cuando
quieras respuestas por bloques normales. Microsoft Teams es la excepción: no tiene
transporte de bloques de borrador-vista previa, por lo que `streaming.mode: "block"` se asigna a la entrega por bloques de Teams
en lugar de al streaming parcial/progreso nativo.

### Asignación de canales

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | borrador de progreso editable |
| Discord    | ✅    | ✅        | ✅      | borrador de progreso editable |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | streaming de progreso nativo  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativa de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado del hilo del asistente de Slack requieren un destino de hilo de respuesta. Los DM de nivel superior no muestran esa vista previa con estilo de hilo, pero aún pueden usar publicaciones y ediciones de vista previa de borrador de Slack.

Migración de claves heredadas:

- Telegram: los valores heredados `streamMode` y los valores escalares/booleanos de `streaming` se detectan y migran mediante rutas de compatibilidad de doctor/config a `streaming.mode`.
- Discord: `streamMode` + booleano `streaming` siguen siendo alias de tiempo de ejecución para el enum `streaming`; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.
- Slack: `streamMode` sigue siendo un alias de tiempo de ejecución para `streaming.mode`; el booleano `streaming` sigue siendo un alias de tiempo de ejecución para `streaming.mode` más `streaming.nativeTransport`; el `nativeStreaming` heredado sigue siendo un alias de tiempo de ejecución para `streaming.nativeTransport`. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.

### Comportamiento en tiempo de ejecución

Telegram:

- Usa `sendMessage` + actualizaciones de vista previa con `editMessageText` en DM y grupos/temas.
- El texto final edita la vista previa activa en su lugar; los finales largos reutilizan ese mensaje para el primer fragmento y envían solo los fragmentos restantes.
- El modo `progress` mantiene el progreso de herramientas en un borrador de estado editable, limpia ese borrador al completarse y envía la respuesta final mediante entrega normal.
- Si la edición final falla antes de confirmar el texto completado, OpenClaw usa la entrega final normal y limpia la vista previa obsoleta.
- El streaming de vista previa se omite cuando el streaming por bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir razonamiento en una vista previa transitoria que se elimina después de la entrega final.

Discord:

- Usa mensajes de vista previa con envío + edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming por bloques de Discord está habilitado explícitamente.
- Los medios finales, errores y cargas de respuesta explícita cancelan vistas previas pendientes sin vaciar un nuevo borrador, y luego usan entrega normal.

Slack:

- `partial` puede usar el streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador con estilo de anexado.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- Los DM de nivel superior sin un hilo de respuesta usan publicaciones y ediciones de vista previa de borrador en lugar del streaming nativo de Slack.
- El streaming de vista previa nativo y de borrador suprime las respuestas por bloques para ese turno, por lo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas finales de medios/error y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

Mattermost:

- Transmite pensamiento, actividad de herramientas y texto parcial de respuesta en una sola publicación de vista previa de borrador que se finaliza en su lugar cuando es seguro enviar la respuesta final.
- Recurre a enviar una nueva publicación final si la publicación de vista previa se eliminó o no está disponible al momento de finalizar.
- Las cargas finales de medios/error cancelan las actualizaciones de vista previa pendientes antes de la entrega normal en lugar de vaciar una publicación de vista previa temporal.

Matrix:

- Las vistas previas de borrador se finalizan en su lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo de medios, de error y con discrepancia de destino de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas de estado breves como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras se ejecutan las herramientas, antes de la respuesta final. Esto mantiene visualmente vivos los turnos de herramientas de varios pasos en lugar de dejarlos en silencio entre la primera vista previa de pensamiento y la respuesta final.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de herramientas dentro de la edición de vista previa en vivo de forma predeterminada cuando la transmisión de vista previa está activa. Microsoft Teams usa su flujo de progreso nativo en chats personales.
- Telegram se distribuye con las actualizaciones de vista previa de progreso de herramientas activadas desde `v2026.4.22`; mantenerlas activadas conserva ese comportamiento publicado.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de vista previa de borrador (consulta arriba).
- Las ediciones de progreso de herramientas siguen el modo de transmisión de vista previa activo; se omiten cuando la transmisión de vista previa está `off` o cuando la transmisión por bloques ha tomado el control del mensaje. En Telegram, `streaming.mode: "off"` es solo final: la conversación genérica de progreso también se suprime en lugar de entregarse como mensajes de estado independientes, mientras que las solicitudes de aprobación, las cargas multimedia y los errores siguen enrutándose con normalidad.
- Para mantener la transmisión de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para mantener visibles las líneas de progreso de herramientas mientras se oculta el texto de comandos/ejecución, establece `streaming.preview.commandText` en `"status"` o `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para conservar el comportamiento publicado. Esta política la comparten los canales de borrador/progreso que usan el renderizador compacto de progreso de OpenClaw, incluidos Discord, Matrix, Microsoft Teams, Mattermost, las vistas previas de borrador de Slack y Telegram. Para desactivar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.
- Las respuestas con cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es `"off"` y hay texto de cita seleccionada, OpenClaw omite el flujo de vista previa de respuesta para ese turno, por lo que no se pueden renderizar líneas de vista previa de progreso de herramientas. Las respuestas al mensaje actual sin texto de cita seleccionada siguen manteniendo la transmisión de vista previa. Consulta la [documentación del canal Telegram](/es/channels/telegram) para obtener detalles.

Mantén visibles las líneas de progreso pero oculta el texto sin procesar de comandos/ejecución:

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

Usa la misma estructura bajo otra clave de canal de progreso compacto, por ejemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` o las vistas previas de borrador de Slack. Para el modo de borrador de progreso, coloca la misma política bajo `streaming.progress`:

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

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo compartido de vista previa, edición, transmisión y finalización
- [Borradores de progreso](/es/concepts/progress-drafts) - mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages) - ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) - comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) - compatibilidad de transmisión por canal
