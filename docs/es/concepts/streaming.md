---
read_when:
    - Explicación de cómo funcionan el streaming o la fragmentación en los canales
    - Cambiar el comportamiento de streaming de bloques o fragmentación de canales
    - Depurar respuestas de bloqueo duplicadas/tempranas o streaming de vista previa de canal
summary: Comportamiento de streaming y fragmentación (respuestas en bloque, streaming de vista previa del canal, asignación de modos)
title: Transmisión y fragmentación
x-i18n:
    generated_at: "2026-07-05T11:15:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18298e3b24137e48cfa7b46e49c467785b49f2d1f0784ac7cb5696452843c948
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming independientes, y actualmente **no hay verdadero
streaming de deltas de tokens** hacia mensajes de canal:

- **Streaming de bloques (canales):** emite **bloques** completados a medida que el asistente
  escribe. Son mensajes de canal normales, no deltas de tokens.
- **Streaming de vista previa (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  actualiza un **mensaje de vista previa** temporal mientras genera (envío + ediciones/anexos).

## Streaming de bloques (mensajes de canal)

El streaming de bloques envía la salida del asistente en fragmentos gruesos a medida que está disponible.

```text
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

- `text_delta/events`: eventos de streaming del modelo (pueden ser escasos para modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mín./máx. + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles** (todos bajo `agents.defaults` salvo que se indique lo contrario):

| Clave                                                        | Valores / forma                                                        | Predeterminado |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`        |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -              |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -              |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes del envío) | -              |
| `*.blockStreaming` (anulación de canal)                      | `true` / `false`, fuerza el streaming de bloques por canal (y por cuenta) | -              |
| `*.textChunkLimit` (p. ej. `channels.whatsapp.textChunkLimit`) | número, límite estricto                                                | 4000           |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                | `"length"`     |
| `channels.discord.maxLinesPerMessage`                        | número, límite flexible de líneas que divide respuestas altas para evitar recortes de UI | 17             |

`chunkMode: "newline"` divide en líneas en blanco (límites de párrafo), no en cada
salto de línea, antes de recurrir a la fragmentación por longitud cuando el texto supera el
límite.

**Semántica de límites** para `blockStreamingBreak`:

- `text_end`: transmite bloques en cuanto el fragmentador los emite; vacía en cada `text_end`.
- `message_end`: espera a que termine el mensaje del asistente y luego vacía la salida
  almacenada. Sigue usando el fragmentador si el texto almacenado supera `maxChars`, por lo que
  puede emitir varios fragmentos al final.

### Entrega de medios con streaming de bloques

Los medios en streaming deben usar campos de carga estructurados como `mediaUrl` o
`mediaUrls`; el texto transmitido no se analiza como un comando de adjunto. Cuando el streaming de
bloques envía medios de forma anticipada, OpenClaw recuerda esa entrega para el turno. Si
la carga final del asistente repite la misma URL de medios, la entrega final elimina
el medio duplicado en lugar de volver a enviar el adjunto.

Las cargas finales exactamente duplicadas se suprimen. Si la carga final añade
texto distinto alrededor de medios que ya se transmitieron, OpenClaw aún envía el
texto nuevo manteniendo la entrega única de medios. Esto evita notas de voz
o archivos duplicados en canales como Telegram.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación de bloques está implementada por `EmbeddedBlockChunker`:

- **Límite bajo:** no emite hasta que el búfer >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere dividir antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Cadena de preferencia de corte:** `paragraph` -> `newline` -> `sentence` ->
  espacio en blanco -> corte estricto.
- **Bloques de código:** nunca divide dentro de bloques; cuando se fuerza en `maxChars`, cierra
  y reabre el bloque para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, por lo que no puedes superar
los topes por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming de bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloques
consecutivos** antes de enviarlos, lo que reduce el ruido de líneas sueltas sin dejar de ofrecer
salida progresiva.

- La coalescencia espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita enviar fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espacio.
- Las anulaciones de canal están disponibles mediante `*.blockStreamingCoalesce` (incluidas
  las configuraciones por cuenta).
- Discord, Signal y Slack tienen coalescencia predeterminada a `{ minChars: 1500, idleMs: 1000 }`
  salvo que se anule.

## Ritmo similar al humano entre bloques

Cuando el streaming de bloques está habilitado, añade una **pausa aleatoria** entre respuestas
por bloques, después del primer bloque, para que las respuestas de varias burbujas se sientan más naturales.

| `agents.defaults.humanDelay.mode` | Comportamiento        |
| --------------------------------- | --------------------- |
| `off` (predeterminado)            | Sin pausa             |
| `natural`                         | Pausa aleatoria de 800-2500 ms |
| `custom`                          | `minMs`/`maxMs`       |

Anula por agente mediante `agents.list[].humanDelay`. Se aplica solo a **respuestas
por bloques**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emitir sobre la marcha). Los canales que no sean Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vacía
  una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming de bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

El streaming de bloques está **desactivado salvo que** `*.blockStreaming` se establezca explícitamente en
`true`. Los canales pueden transmitir una vista previa en vivo (`channels.<channel>.streaming`)
sin respuestas por bloques. Los valores predeterminados `blockStreaming*` viven bajo
`agents.defaults`, no en la raíz de la configuración.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming` (anidada `{ mode, ... }`; un
booleano de nivel superior es un alias heredado).

| Modo       | Comportamiento                                                        |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Deshabilita el streaming de vista previa                              |
| `partial`  | Una única vista previa reemplazada por el texto más reciente          |
| `block`    | Actualizaciones de vista previa en pasos fragmentados/anexados        |
| `progress` | Vista previa de progreso/estado durante la generación, respuesta final al completar |

`streaming.mode: "block"` es un modo de streaming de vista previa para canales
con capacidad de edición como Discord y Telegram; por sí solo no habilita allí la entrega de
bloques de canal. Usa `streaming.block.enabled` (o la clave de canal heredada
`blockStreaming`) para respuestas por bloques normales. Microsoft Teams es la
excepción: no tiene transporte de bloques de vista previa de borrador, por lo que `streaming.mode:
"block"` deshabilita por completo el streaming nativo y la respuesta llega como entrega
por bloques regular en lugar de streaming nativo parcial/de progreso.

### Mapeo de canales

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Sí    | Sí        | Sí      | borrador de progreso editable |
| Discord    | Sí    | Sí        | Sí      | borrador de progreso editable |
| Slack      | Sí    | Sí        | Sí      | Sí                      |
| Mattermost | Sí    | Sí        | Sí      | Sí                      |
| MS Teams   | Sí    | Sí        | Sí      | streaming de progreso nativo |

La configuración de fragmentos de vista previa (`streaming.preview.chunk.*`, p. ej. bajo
`channels.discord.streaming` o `channels.telegram.streaming`) usa por defecto
`minChars: 200`, `maxChars: 800` (limitado al `textChunkLimit` del canal) y
`breakPreference: "paragraph"`.

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativa de Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) cuando
  `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo de asistente de Slack requieren un destino de hilo
  de respuesta. Los DM de nivel superior no muestran esa vista previa de estilo hilo, pero pueden
  seguir usando publicaciones y ediciones de vista previa de borrador de Slack.

### Migración de claves heredadas

| Canal    | Claves heredadas                                           | Estado                                                                                                                                                       |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Telegram | `streamMode`, `streaming` escalar/booleano                  | Detectadas y migradas a `streaming.mode` por rutas de doctor/compatibilidad de configuración                                                                 |
| Discord  | `streamMode`, `streaming` booleano                         | Alias de runtime para la enumeración `streaming`; ejecuta `openclaw doctor --fix` para reescribir la configuración persistida                                  |
| Slack    | `streamMode`; `streaming` booleano; `nativeStreaming` heredado | Alias de runtime para `streaming.mode` (y `streaming.nativeTransport` para las formas booleanas/heredadas); ejecuta `openclaw doctor --fix` para reescribir la configuración persistida |

## Comportamiento de runtime

### Telegram

- Usa actualizaciones de vista previa con `sendMessage` + `editMessageText` en DM y
  grupos/temas; el texto final edita la vista previa activa en el mismo lugar. Los
  borradores efímeros de "escribiendo" de 30 segundos de Telegram (`sendMessageDraft`) no se usan para
  streaming de respuestas.
- Las vistas previas iniciales cortas aún se amortiguan para la UX de notificaciones push, pero
  se materializan tras un retraso limitado para que las ejecuciones activas no permanezcan visualmente silenciosas.
- Los finales largos reutilizan el mensaje de vista previa para el primer fragmento y envían solo los
  fragmentos restantes.
- El modo `block` rota la vista previa a un mensaje nuevo en
  `streaming.preview.chunk.maxChars` (predeterminado 800, limitado al límite de edición de 4096
  de Telegram); otros modos hacen crecer una vista previa hasta 4096 caracteres.
- El modo `progress` mantiene el progreso de herramientas en un borrador de estado editable, materializa
  la etiqueta de estado cuando el streaming de respuestas está activo pero aún no hay una línea de herramienta
  disponible, limpia el borrador al completar y envía la respuesta final
  mediante la entrega normal.
- Si la edición final falla antes de confirmar el texto completado, OpenClaw usa
  la entrega final normal y limpia la vista previa obsoleta.
- El streaming de vista previa se omite cuando el streaming de bloques de Telegram está habilitado explícitamente,
  para evitar doble streaming.
- `/reasoning stream` puede escribir el razonamiento en una vista previa transitoria que se
  elimina después de la entrega final.
- Las respuestas con cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es
  `"off"` y hay texto de cita seleccionada, OpenClaw omite el stream de vista previa de respuesta
  para ese turno (la respuesta final debe pasar por la ruta nativa de respuesta con cita)
  para que no puedan renderizarse líneas de vista previa de progreso de herramientas. Las respuestas al mensaje actual
  sin texto de cita seleccionada conservan el streaming de vista previa. Consulta
  [la documentación del canal Telegram](/es/channels/telegram) para más detalles.

### Discord

- Usa mensajes de vista previa de envío y edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- La transmisión de vista previa se omite cuando la transmisión por bloques de Discord está habilitada explícitamente.
- Las cargas finales de medios, errores y respuestas explícitas cancelan las vistas previas pendientes sin vaciar un nuevo borrador, y luego usan la entrega normal.

### Slack

- `partial` puede usar la transmisión nativa de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador de estilo anexado.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- Los DM de nivel superior sin un hilo de respuesta usan publicaciones y ediciones de vista previa de borrador en lugar de la transmisión nativa de Slack.
- La transmisión nativa y de vista previa de borrador suprime las respuestas por bloques para ese turno, de modo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas finales de medios/errores y los finales de progreso no crean mensajes de borrador descartables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

### Mattermost

- Transmite el razonamiento, la actividad de herramientas y el texto parcial de respuesta en una única publicación de vista previa de borrador que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final.
- Recurre a enviar una nueva publicación final si la publicación de vista previa se eliminó o no está disponible en el momento de finalizar.
- Las cargas finales de medios/errores cancelan las actualizaciones de vista previa pendientes antes de la entrega normal, en lugar de vaciar una publicación temporal de vista previa.

### Matrix

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo de medios, de error y con discrepancia de destino de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta que ya es visible se redacta.

## Actualizaciones de vista previa de progreso de herramientas

La transmisión de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas breves de estado como "buscando en la web", "leyendo archivo" o "llamando herramienta" que aparecen en el mismo mensaje de vista previa mientras las herramientas se ejecutan, antes de la respuesta final. En el modo de servidor de aplicaciones de Codex, los mensajes de preámbulo/comentario de Codex usan esta misma ruta de vista previa, por lo que notas breves de progreso como "Estoy comprobando..." pueden transmitirse al borrador editable sin pasar a formar parte de la respuesta final. Esto mantiene visualmente activos los turnos de herramientas de varios pasos, en lugar de quedar silenciosos entre la primera vista previa de razonamiento y la respuesta final.

Las herramientas de larga duración pueden emitir progreso tipado antes de devolver el resultado. Por ejemplo, `web_fetch` arma un temporizador de cinco segundos cuando comienza: si la obtención sigue pendiente, la vista previa muestra `Fetching page content...`; si la obtención termina o se cancela antes de eso, no se emite ninguna línea de progreso. El resultado final posterior de la herramienta sigue entregándose normalmente al modelo.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten de forma predeterminada el progreso de herramientas y las actualizaciones de preámbulo de Codex en la edición de vista previa en vivo cuando la transmisión de vista previa está activa. Microsoft Teams usa su transmisión nativa de progreso en chats personales.
- Telegram se ha distribuido con actualizaciones de vista previa de progreso de herramientas habilitadas desde `v2026.4.22`; mantenerlas habilitadas conserva ese comportamiento publicado.
- **Mattermost** ya integra la actividad de herramientas en su única publicación de vista previa de borrador (ver arriba).
- Las ediciones de progreso de herramientas siguen el modo de transmisión de vista previa activo; se omiten cuando la transmisión de vista previa está `off` o cuando la transmisión por bloques se ha hecho cargo del mensaje. En Telegram, `streaming.mode: "off"` es solo final: la charla genérica de progreso también se suprime en lugar de entregarse como mensajes de estado independientes, mientras que las solicitudes de aprobación, las cargas de medios y los errores siguen enrutándose normalmente.
- Para mantener la transmisión de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal (predeterminado `true`). Para mantener visibles las líneas de progreso de herramientas mientras se oculta el texto de comando/ejecución, establece `streaming.preview.commandText` en `"status"` o `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para conservar el comportamiento publicado. Esta política la comparten los canales de borrador/progreso que usan el renderizador compacto de progreso de OpenClaw, incluidos Discord, Matrix, Microsoft Teams, Mattermost, las vistas previas de borrador de Slack y Telegram. Para deshabilitar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.

## Renderizado de borradores de progreso

Los borradores en modo de progreso (`streaming.progress.*`) están acotados y son configurables por canal:

| Clave                             | Predeterminado      | Comportamiento                                                        |
| --------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`                 | Máximo de líneas compactas de progreso mantenidas bajo la etiqueta de borrador |
| `streaming.progress.maxLineChars` | `120`               | Máximo de caracteres por línea compacta antes del truncamiento (con conciencia de palabras) |
| `streaming.progress.label`        | `"auto"`            | Título del borrador; una cadena personalizada, o `false` para ocultarlo |
| `streaming.progress.labels`       | grupo incorporado   | Etiquetas candidatas usadas cuando `label: "auto"`                    |

### Carril de progreso de comentario

Además del progreso de herramientas, el renderizador compacto de progreso puede mostrar un carril más en el borrador:

- **`streaming.progress.commentary`** - renderiza el **comentario** del modelo antes de la herramienta (una narración breve tipo "Comprobaré... luego...") intercalado con las líneas de herramientas en el borrador de progreso.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

- [Refactorización del ciclo de vida de mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo compartido de vista previa, edición, transmisión y finalización
- [Borradores de progreso](/es/concepts/progress-drafts) - mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages) - ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) - comportamiento de reintento ante errores de entrega
- [Canales](/es/channels) - compatibilidad de transmisión por canal
