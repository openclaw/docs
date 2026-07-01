---
read_when:
    - Explicación de cómo funciona el streaming o la fragmentación en los canales
    - Cambiar el streaming de bloques o el comportamiento de fragmentación del canal
    - Depuración de respuestas de bloqueo duplicadas o tempranas, o de la transmisión de vistas previas del canal
summary: Comportamiento de transmisión y fragmentación (respuestas en bloque, transmisión de vista previa del canal, asignación de modos)
title: Transmisión por secuencias y fragmentación
x-i18n:
    generated_at: "2026-07-01T02:58:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming de bloques (canales):** emite **bloques** completados a medida que el asistente escribe. Estos son mensajes normales de canal (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal durante la generación.

Actualmente **no existe verdadero streaming de deltas de tokens** hacia mensajes de canal. El streaming de vista previa se basa en mensajes (envío + ediciones/anexos).

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

- `text_delta/events`: eventos del flujo del modelo (pueden ser escasos para modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimos/máximos + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas de bloque).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desactivado de forma predeterminada).
- Sobrescrituras de canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques emitidos antes de enviarlos).
- Límite estricto de canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` predeterminado, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (predeterminado 17) divide respuestas altas para evitar recortes en la interfaz.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el fragmentador emite; vacía en cada `text_end`.
- `message_end`: espera hasta que termine el mensaje del asistente y luego vacía la salida en búfer.

`message_end` sigue usando el fragmentador si el texto en búfer supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de medios con streaming de bloques

Los medios en streaming deben usar campos de carga estructurados como `mediaUrl` o
`mediaUrls`; el texto transmitido no se analiza como un comando de adjunto. Cuando el streaming de
bloques envía medios de forma anticipada, OpenClaw recuerda esa entrega para el turno. Si
la carga final del asistente repite la misma URL de medio, la entrega final
elimina el medio duplicado en lugar de volver a enviar el adjunto.

Las cargas finales duplicadas exactas se suprimen. Si la carga final agrega
texto distinto alrededor de medios que ya se transmitieron, OpenClaw sigue enviando el
texto nuevo mientras mantiene los medios con una sola entrega. Esto evita notas de voz
o archivos duplicados en canales como Telegram.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación de bloques está implementada por `EmbeddedBlockChunker`:

- **Límite bajo:** no emite hasta que el búfer >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere divisiones antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte duro.
- **Bloques de código:** nunca divide dentro de bloques; cuando se fuerza en `maxChars`, cierra + reabre el bloque para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, por lo que no puedes superar los topes por canal.

## Coalescencia (fusionar bloques emitidos)

Cuando el streaming de bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloque consecutivos**
antes de enviarlos. Esto reduce el "spam de una sola línea" sin dejar de proporcionar
salida progresiva.

- La coalescencia espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vaciarán si lo superan.
- `minChars` evita enviar fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Las sobrescrituras de canal están disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` de coalescencia predeterminado se eleva a 1500 para Signal/Slack/Discord salvo que se sobrescriba.

## Ritmo similar al humano entre bloques

Cuando el streaming de bloques está habilitado, puedes agregar una **pausa aleatoria** entre
respuestas de bloque (después del primer bloque). Esto hace que las respuestas de varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescribir por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas de bloque**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto se asigna a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite a medida que avanzas). Los canales que no sean Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vacía una vez, posiblemente varios fragmentos si es muy largo).
- **Sin streaming de bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota de canal:** El streaming de bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo
(`channels.<channel>.streaming`) sin respuestas de bloque.

Recordatorio de ubicación de configuración: los valores predeterminados `blockStreaming*` viven bajo
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactiva el streaming de vista previa.
- `partial`: vista previa única que se reemplaza con el texto más reciente.
- `block`: vista previa que se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

`streaming.mode: "block"` es un modo de streaming de vista previa para canales con capacidad de edición
como Discord y Telegram. No habilita allí la entrega de bloques de canal.
Usa `streaming.block.enabled` o la clave de canal heredada `blockStreaming` cuando
quieras respuestas de bloque normales. Microsoft Teams es la excepción: no tiene
transporte de bloque de vista previa de borrador, por lo que `streaming.mode: "block"` se asigna a la entrega de bloques de Teams
en lugar del streaming parcial/de progreso nativo.

### Asignación de canales

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | borrador de progreso editable |
| Discord    | ✅    | ✅        | ✅      | borrador de progreso editable |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | flujo de progreso nativo |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativa de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo del asistente de Slack requieren un objetivo de hilo de respuesta. Los DM de nivel superior no muestran esa vista previa con estilo de hilo, pero aún pueden usar publicaciones y ediciones de vista previa de borrador de Slack.

Migración de clave heredada:

- Telegram: los valores heredados `streamMode` y escalares/booleanos `streaming` se detectan y migran mediante rutas de compatibilidad de doctor/config a `streaming.mode`.
- Discord: `streamMode` + booleano `streaming` siguen siendo alias en tiempo de ejecución para el enum `streaming`; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.
- Slack: `streamMode` sigue siendo un alias en tiempo de ejecución para `streaming.mode`; el booleano `streaming` sigue siendo un alias en tiempo de ejecución para `streaming.mode` más `streaming.nativeTransport`; el `nativeStreaming` heredado sigue siendo un alias en tiempo de ejecución para `streaming.nativeTransport`. Ejecuta `openclaw doctor --fix` para reescribir la configuración persistida.

### Comportamiento en tiempo de ejecución

Telegram:

- Usa actualizaciones de vista previa `sendMessage` + `editMessageText` en DM y grupos/temas.
- Las vistas previas iniciales cortas aún se difieren para mejorar la UX de notificaciones push, pero Telegram ahora las materializa después de un retraso acotado para que las ejecuciones activas no permanezcan visualmente silenciosas.
- El texto final edita la vista previa activa en el mismo lugar; los finales largos reutilizan ese mensaje para el primer fragmento y envían solo los fragmentos restantes.
- El modo `block` rota la vista previa a un mensaje nuevo en `streaming.preview.chunk.maxChars` (predeterminado 800, limitado al límite de edición de 4096 de Telegram); otros modos hacen crecer una vista previa hasta 4096 caracteres.
- El modo `progress` mantiene el progreso de herramientas en un borrador de estado editable, materializa la etiqueta de estado cuando el streaming de respuesta está activo pero aún no hay línea de herramienta disponible, borra ese borrador al completarse y envía la respuesta final mediante la entrega normal.
- Si la edición final falla antes de confirmar el texto completado, OpenClaw usa la entrega final normal y limpia la vista previa obsoleta.
- El streaming de vista previa se omite cuando el streaming de bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir el razonamiento en una vista previa transitoria que se elimina después de la entrega final.

Discord:

- Usa mensajes de vista previa de envío + edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming de bloques de Discord está habilitado explícitamente.
- Las cargas de medios finales, errores y respuestas explícitas cancelan las vistas previas pendientes sin vaciar un borrador nuevo y luego usan la entrega normal.

Slack:

- `partial` puede usar streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando esté disponible.
- `block` usa vistas previas de borrador de estilo anexado.
- `progress` usa texto de vista previa de estado y luego respuesta final.
- Los DM de nivel superior sin un hilo de respuesta usan publicaciones y ediciones de vista previa de borrador en lugar del streaming nativo de Slack.
- El streaming de vista previa nativo y de borrador suprime respuestas de bloque para ese turno, por lo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas finales de medios/errores y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

Mattermost:

- Transmite pensamiento, actividad de herramientas y texto de respuesta parcial en una sola publicación de vista previa de borrador que se finaliza en el mismo lugar cuando la respuesta final es segura de enviar.
- Recurre al envío de una publicación final nueva si la publicación de vista previa se eliminó o no está disponible en el momento de finalizar.
- Las cargas finales de medios/errores cancelan las actualizaciones de vista previa pendientes antes de la entrega normal en lugar de vaciar una publicación de vista previa temporal.

Matrix:

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo de medios, errores y con desajuste de objetivo de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas de estado breves como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras se ejecutan las herramientas, antes de la respuesta final. En modo de servidor de aplicación de Codex, los mensajes de preámbulo/comentario de Codex usan esta misma ruta de vista previa, por lo que notas breves de progreso como "Estoy comprobando..." pueden transmitirse al borrador editable sin convertirse en parte de la respuesta final. Esto mantiene visualmente activos los turnos de herramientas de varios pasos en lugar de silenciosos entre la primera vista previa de pensamiento y la respuesta final.

Las herramientas de larga duración pueden emitir progreso tipado antes de devolver. Por ejemplo,
`web_fetch` arma un temporizador de cinco segundos cuando comienza: si la obtención sigue
pendiente, la vista previa puede mostrar `Fetching page content...`; si la obtención termina
o se cancela antes de eso, no se emite ninguna línea de progreso. El resultado final posterior de la herramienta
sigue entregándose normalmente al modelo.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten por streaming el progreso de herramientas y las actualizaciones de preámbulo de Codex en la edición de vista previa en vivo de forma predeterminada cuando el streaming de vista previa está activo. Microsoft Teams usa su streaming de progreso nativo en chats personales.
- Telegram se ha lanzado con las actualizaciones de vista previa de progreso de herramientas habilitadas desde `v2026.4.22`; mantenerlas habilitadas conserva ese comportamiento publicado.
- **Mattermost** ya incorpora la actividad de herramientas en su única publicación de vista previa de borrador (ver arriba).
- Las ediciones de progreso de herramientas siguen el modo de streaming de vista previa activo; se omiten cuando el streaming de vista previa está `off` o cuando el streaming por bloques ha tomado el control del mensaje. En Telegram, `streaming.mode: "off"` es solo final: la charla de progreso genérica también se suprime en lugar de entregarse como mensajes de estado independientes, mientras que las solicitudes de aprobación, las cargas multimedia y los errores siguen enrutándose normalmente.
- Para mantener el streaming de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para mantener visibles las líneas de progreso de herramientas mientras ocultas el texto de comandos/exec, establece `streaming.preview.commandText` en `"status"` o `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para conservar el comportamiento publicado. Esta política la comparten los canales de borrador/progreso que usan el renderizador compacto de progreso de OpenClaw, incluidos Discord, Matrix, Microsoft Teams, Mattermost, las vistas previas de borrador de Slack y Telegram. Para deshabilitar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.
- Las respuestas a citas seleccionadas de Telegram son una excepción: cuando `replyToMode` no es `"off"` y hay texto de cita seleccionada, OpenClaw omite el streaming de vista previa de la respuesta para ese turno, de modo que las líneas de vista previa de progreso de herramientas no puedan renderizarse. Las respuestas al mensaje actual sin texto de cita seleccionada siguen manteniendo el streaming de vista previa. Consulta la [documentación del canal de Telegram](/es/channels/telegram) para más detalles.

### Carril de progreso de comentarios

Además del progreso de herramientas, el renderizador compacto de progreso puede mostrar un carril más en el borrador:

- **`streaming.progress.commentary`** — renderiza los **comentarios** previos a herramientas del modelo (💬) — narración breve de tipo "Revisaré… luego…" — intercalados con las líneas de herramientas en el borrador de progreso.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Mantén visibles las líneas de progreso pero oculta el texto sin procesar de comandos/exec:

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

Usa la misma forma bajo otra clave de canal de progreso compacto, por ejemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, o las vistas previas de borrador de Slack. Para el modo de borrador de progreso, coloca la misma política bajo `streaming.progress`:

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

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo compartido de vista previa, edición, streaming y finalización
- [Borradores de progreso](/es/concepts/progress-drafts) - mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages) - ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) - comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) - compatibilidad de streaming por canal
