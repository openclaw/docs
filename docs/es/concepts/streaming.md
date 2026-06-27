---
read_when:
    - Explicar cómo funciona el streaming o la fragmentación en los canales
    - Cambiar el streaming de bloques o el comportamiento de fragmentación del canal
    - Depuración de respuestas de bloqueo duplicadas/tempranas o streaming de vista previa del canal
summary: Comportamiento de streaming y fragmentación (respuestas en bloque, streaming de vista previa del canal, asignación de modos)
title: Streaming y fragmentación
x-i18n:
    generated_at: "2026-06-27T11:20:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming por bloques (canales):** emite **bloques** completados mientras el asistente escribe. Son mensajes normales de canal (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal durante la generación.

Actualmente **no hay streaming real de deltas de tokens** hacia mensajes de canal. El streaming de vista previa está basado en mensajes (envío + ediciones/anexos).

## Streaming por bloques (mensajes de canal)

El streaming por bloques envía la salida del asistente en fragmentos gruesos a medida que está disponible.

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

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desactivado por defecto).
- Sobrescrituras de canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes de enviarlos).
- Límite estricto del canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` por defecto, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite blando de Discord: `channels.discord.maxLinesPerMessage` (17 por defecto) divide respuestas altas para evitar recortes en la interfaz.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el fragmentador los emite; vacía en cada `text_end`.
- `message_end`: espera hasta que termine el mensaje del asistente y luego vacía la salida en búfer.

`message_end` aún usa el fragmentador si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de medios con streaming por bloques

Los medios transmitidos deben usar campos de carga estructurados como `mediaUrl` o
`mediaUrls`; el texto transmitido no se analiza como un comando de adjunto. Cuando el
streaming por bloques envía medios de forma anticipada, OpenClaw recuerda esa entrega para el turno. Si
la carga final del asistente repite la misma URL de medio, la entrega final
elimina el medio duplicado en lugar de enviar el adjunto de nuevo.

Las cargas finales duplicadas exactas se suprimen. Si la carga final añade
texto distinto alrededor de medios que ya se transmitieron, OpenClaw aún envía el
texto nuevo mientras mantiene el medio con entrega única. Esto evita notas de voz
o archivos duplicados en canales como Telegram.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación por bloques la implementa `EmbeddedBlockChunker`:

- **Límite bajo:** no emitir hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere dividir antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte duro.
- **Cercas de código:** nunca divide dentro de cercas; cuando se fuerza en `maxChars`, cierra y vuelve a abrir la cerca para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, por lo que no puedes superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming por bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloque consecutivos**
antes de enviarlos. Esto reduce el "spam de una sola línea" mientras sigue proporcionando
salida progresiva.

- La coalescencia espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vaciarán si lo superan.
- `minChars` evita enviar fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Hay sobrescrituras de canal disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` predeterminado de coalescencia se eleva a 1500 para Signal/Slack/Discord salvo que se sobrescriba.

## Ritmo humano entre bloques

Cuando el streaming por bloques está habilitado, puedes añadir una **pausa aleatoria** entre
respuestas por bloques (después del primer bloque). Esto hace que las respuestas de varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescribe por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas por bloques**, no a respuestas finales ni a resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto se corresponde con:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no sean Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vacía una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming por bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota de canal:** El streaming por bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo
(`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de configuración: los valores predeterminados `blockStreaming*` viven bajo
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactiva el streaming de vista previa.
- `partial`: vista previa única que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

`streaming.mode: "block"` es un modo de streaming de vista previa para canales con capacidad de edición
como Discord y Telegram. No habilita allí la entrega de bloques de canal.
Usa `streaming.block.enabled` o la clave de canal heredada `blockStreaming` cuando
quieras respuestas normales por bloques. Microsoft Teams es la excepción: no tiene
transporte de bloque de vista previa de borrador, por lo que `streaming.mode: "block"` se asigna a la entrega por bloques de Teams
en lugar de streaming parcial/progreso nativo.

### Mapeo de canales

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | borrador de progreso editable |
| Discord    | ✅    | ✅        | ✅      | borrador de progreso editable |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream de progreso nativo  |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativa de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo del asistente de Slack requieren un destino de hilo de respuesta. Los DM de nivel superior no muestran esa vista previa de estilo hilo, pero aún pueden usar publicaciones y ediciones de vista previa de borrador de Slack.

Migración de claves heredadas:

- Telegram: los valores heredados `streamMode` y escalares/booleanos `streaming` son detectados y migrados por rutas de compatibilidad de doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano siguen siendo alias en runtime para el enum `streaming`; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.
- Slack: `streamMode` sigue siendo un alias en runtime para `streaming.mode`; `streaming` booleano sigue siendo un alias en runtime para `streaming.mode` más `streaming.nativeTransport`; `nativeStreaming` heredado sigue siendo un alias en runtime para `streaming.nativeTransport`. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.

### Comportamiento en runtime

Telegram:

- Usa actualizaciones de vista previa `sendMessage` + `editMessageText` en DM y grupos/temas.
- Las vistas previas iniciales cortas aún tienen debounce para la experiencia de notificaciones push, pero Telegram ahora las materializa después de un retraso acotado para que las ejecuciones activas no permanezcan visualmente silenciosas.
- El texto final edita la vista previa activa en su lugar; los finales largos reutilizan ese mensaje para el primer fragmento y envían solo los fragmentos restantes.
- El modo `block` rota la vista previa a un mensaje nuevo en `streaming.preview.chunk.maxChars` (800 por defecto, limitado al límite de edición de Telegram de 4096); otros modos hacen crecer una vista previa hasta 4096 caracteres.
- El modo `progress` mantiene el progreso de herramientas en un borrador de estado editable, materializa la etiqueta de estado cuando el streaming de respuesta está activo pero todavía no hay una línea de herramienta disponible, limpia ese borrador al completarse y envía la respuesta final mediante la entrega normal.
- Si la edición final falla antes de confirmar el texto completado, OpenClaw usa la entrega final normal y limpia la vista previa obsoleta.
- El streaming de vista previa se omite cuando el streaming por bloques de Telegram está explícitamente habilitado (para evitar doble streaming).
- `/reasoning stream` puede escribir razonamiento en una vista previa transitoria que se elimina después de la entrega final.

Discord:

- Usa mensajes de vista previa con envío + edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming por bloques de Discord está explícitamente habilitado.
- Las cargas finales de medios, errores y respuesta explícita cancelan las vistas previas pendientes sin vaciar un nuevo borrador, y luego usan la entrega normal.

Slack:

- `partial` puede usar streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador con estilo de anexado.
- `progress` usa texto de vista previa de estado, luego la respuesta final.
- Los DM de nivel superior sin un hilo de respuesta usan publicaciones y ediciones de vista previa de borrador en lugar de streaming nativo de Slack.
- El streaming nativo y de vista previa de borrador suprime las respuestas por bloques para ese turno, por lo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas finales de medios/errores y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

Mattermost:

- Transmite razonamiento, actividad de herramientas y texto parcial de respuesta en una sola publicación de vista previa de borrador que se finaliza en su lugar cuando es seguro enviar la respuesta final.
- Recurre al envío de una publicación final nueva si la publicación de vista previa se eliminó o no está disponible al finalizar.
- Las cargas finales de medios/errores cancelan las actualizaciones de vista previa pendientes antes de la entrega normal en lugar de vaciar una publicación de vista previa temporal.

Matrix:

- Las vistas previas de borrador se finalizan en su lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo con medios, errores y desajuste de destino de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas de estado breves como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras se ejecutan las herramientas, antes de la respuesta final. En el modo app-server de Codex, los mensajes de preámbulo/comentario de Codex usan esta misma ruta de vista previa, por lo que notas breves de progreso como "Estoy comprobando..." pueden transmitirse al borrador editable sin convertirse en parte de la respuesta final. Esto mantiene visualmente vivos los turnos de herramientas de varios pasos en lugar de silenciosos entre la primera vista previa de razonamiento y la respuesta final.

Las herramientas de larga duración pueden emitir progreso tipado antes de devolver. Por ejemplo,
`web_fetch` arma un temporizador de cinco segundos al iniciar: si la obtención sigue
pendiente, la vista previa puede mostrar `Fetching page content...`; si la obtención termina
o se cancela antes, no se emite ninguna línea de progreso. El resultado final posterior de la herramienta
aún se entrega normalmente al modelo.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de herramientas y las actualizaciones de preámbulo de Codex en la edición de vista previa en vivo de forma predeterminada cuando el streaming de vista previa está activo. Microsoft Teams usa su stream de progreso nativo en chats personales.
- Telegram se publicó con las actualizaciones de vista previa de progreso de herramientas activadas desde `v2026.4.22`; mantenerlas activadas conserva ese comportamiento publicado.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de vista previa de borrador (consulta arriba).
- Las ediciones de progreso de herramientas siguen el modo de streaming de vista previa activo; se omiten cuando el streaming de vista previa está en `off` o cuando el streaming por bloques ha tomado control del mensaje. En Telegram, `streaming.mode: "off"` es solo final: la charla genérica de progreso también se suprime en lugar de entregarse como mensajes de estado independientes, mientras que las solicitudes de aprobación, las cargas multimedia y los errores siguen enrutándose normalmente.
- Para conservar el streaming de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para mantener visibles las líneas de progreso de herramientas mientras ocultas el texto de comando/ejecución, establece `streaming.preview.commandText` en `"status"` o `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para conservar el comportamiento publicado. Esta política la comparten los canales de borrador/progreso que usan el renderizador de progreso compacto de OpenClaw, incluidos Discord, Matrix, Microsoft Teams, Mattermost, las vistas previas de borrador de Slack y Telegram. Para desactivar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.
- Las respuestas con cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es `"off"` y hay texto de cita seleccionada presente, OpenClaw omite el stream de vista previa de respuesta para ese turno, por lo que las líneas de vista previa de progreso de herramientas no pueden renderizarse. Las respuestas al mensaje actual sin texto de cita seleccionada siguen conservando el streaming de vista previa. Consulta la [documentación del canal Telegram](/es/channels/telegram) para más detalles.

Mantén visibles las líneas de progreso pero oculta el texto sin procesar de comando/ejecución:

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

Usa la misma forma bajo otra clave de canal de progreso compacto, por ejemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` o las vistas previas de borrador de Slack. Para el modo de borrador de progreso, coloca la misma política bajo `streaming.progress`:

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

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo compartido de vista previa, edición, stream y finalización
- [Borradores de progreso](/es/concepts/progress-drafts) - mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages) - ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) - comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) - soporte de streaming por canal
