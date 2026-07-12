---
read_when:
    - Explicación de cómo funciona el streaming o la fragmentación en los canales
    - Cambio del comportamiento de la transmisión por bloques o la fragmentación del canal
    - Depuración de respuestas de bloque duplicadas o anticipadas, o del streaming de vista previa del canal
summary: Comportamiento de transmisión + fragmentación (respuestas por bloques, transmisión de vista previa del canal, asignación de modos)
title: Transmisión y fragmentación
x-i18n:
    generated_at: "2026-07-12T14:26:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7860a83183459ea3dd05c866118e14bc8469c7adcd074a25b6f4a1174cb1664d
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de transmisión independientes y, actualmente, **no hay una verdadera
transmisión de deltas de tokens** a los mensajes de los canales:

- **Transmisión por bloques (canales):** emite **bloques** completados a medida que el asistente
  escribe. Son mensajes normales del canal, no deltas de tokens.
- **Transmisión de vista previa (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  actualiza un **mensaje de vista previa** temporal durante la generación (envío + ediciones/adiciones).

## Transmisión por bloques (mensajes de canal)

La transmisión por bloques envía la salida del asistente en fragmentos grandes a medida que está disponible.

```text
Salida del modelo
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ el fragmentador emite bloques a medida que crece el búfer
       └─ (blockStreamingBreak=message_end)
            └─ el fragmentador vacía el búfer en message_end
                   └─ envío al canal (respuestas por bloques)
```

- `text_delta/events`: eventos de transmisión del modelo (pueden ser escasos en modelos sin transmisión).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mín./máx. + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles** (todos bajo `agents.defaults`, salvo que se indique lo contrario):

| Clave                                                         | Valores / estructura                                                     | Valor predeterminado |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                          | `"off"`              |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                            | -                    |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                                | -                    |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (combina bloques antes de enviarlos)   | -                    |
| `*.blockStreaming` (anulación por canal)                      | `true` / `false`, fuerza la transmisión por bloques por canal (y cuenta)  | -                    |
| `*.textChunkLimit` (p. ej., `channels.whatsapp.textChunkLimit`) | número, límite estricto                                                  | 4000                 |
| `*.chunkMode`                                                | `"length"` / `"newline"`                                                  | `"length"`           |
| `channels.discord.maxLinesPerMessage`                        | número, límite flexible de líneas que divide respuestas largas para evitar recortes en la interfaz | 17 |

`chunkMode: "newline"` divide por líneas en blanco (límites de párrafo), no por cada
salto de línea, antes de recurrir a la división por longitud cuando el texto supera el
límite.

Los canales con una configuración `streaming` anidada (Telegram, Discord, Slack, iMessage,
Microsoft Teams) expresan estas anulaciones como
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`; las formas planas
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` se aplican
a los canales que no tienen una (por ejemplo, Signal, IRC, Google Chat, WhatsApp,
Mattermost). `openclaw doctor --fix` migra las claves planas obsoletas de los canales con transmisión anidada
y estas no se leen durante la ejecución.

**Semántica de los límites** de `blockStreamingBreak`:

- `text_end`: transmite bloques en cuanto el fragmentador los emite; vacía el búfer en cada `text_end`.
- `message_end`: espera hasta que finalice el mensaje del asistente y luego vacía la salida
  almacenada en el búfer. Aun así, usa el fragmentador si el texto almacenado supera `maxChars`, por lo que
  puede emitir varios fragmentos al final.

### Entrega de contenido multimedia con transmisión por bloques

El contenido multimedia transmitido debe usar campos de carga estructurados, como `mediaUrl` o
`mediaUrls`; el texto transmitido no se analiza como un comando de adjunto. Cuando la transmisión por
bloques envía contenido multimedia anticipadamente, OpenClaw recuerda esa entrega durante el turno. Si
la carga final del asistente repite la misma URL del contenido multimedia, la entrega final elimina
el contenido duplicado en lugar de volver a enviar el adjunto.

Las cargas finales que sean duplicados exactos se suprimen. Si la carga final añade
texto distinto alrededor del contenido multimedia que ya se transmitió, OpenClaw sigue enviando el
texto nuevo y mantiene una única entrega del contenido multimedia. Esto evita notas de voz
o archivos duplicados en canales como Telegram.

## Algoritmo de fragmentación (límites inferior/superior)

La fragmentación por bloques está implementada mediante `EmbeddedBlockChunker`:

- **Límite inferior:** no emite hasta que el búfer >= `minChars` (salvo que se fuerce).
- **Límite superior:** prefiere cortes antes de `maxChars`; si se fuerza, corta en `maxChars`.
- **Cadena de preferencias de corte:** `paragraph` -> `newline` -> `sentence` ->
  espacio en blanco -> corte forzado.
- **Bloques de código:** nunca divide dentro de los bloques; cuando se fuerza en `maxChars`, cierra
  y vuelve a abrir el bloque para mantener válido el Markdown.

`maxChars` se restringe al `textChunkLimit` del canal, por lo que no se pueden superar
los límites de cada canal.

## Agrupación (combinación de bloques transmitidos)

Cuando la transmisión por bloques está activada, OpenClaw puede **combinar fragmentos de bloques
consecutivos** antes de enviarlos, lo que reduce la proliferación de mensajes de una sola línea sin dejar de ofrecer
una salida progresiva.

- La agrupación espera **intervalos de inactividad** (`idleMs`) antes de vaciar el búfer.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` impide el envío de fragmentos minúsculos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espacio.
- Las anulaciones por canal están disponibles mediante `*.blockStreamingCoalesce` (incluidas
  las configuraciones por cuenta).
- Discord, Signal y Slack usan de forma predeterminada `{ minChars: 1500, idleMs: 1000 }`
  para la agrupación, salvo que se anule.

## Ritmo similar al humano entre bloques

Cuando la transmisión por bloques está activada, se añade una **pausa aleatoria** entre las respuestas
por bloques, después del primer bloque, para que las respuestas con varias burbujas parezcan más naturales.

| `agents.defaults.humanDelay.mode` | Comportamiento              |
| --------------------------------- | --------------------------- |
| `off` (predeterminado)            | Sin pausa                   |
| `natural`                         | pausa aleatoria de 800-2500ms |
| `custom`                          | `minMs`/`maxMs`             |

Se puede anular por agente mediante `agents.list[].humanDelay`. Se aplica únicamente a las **respuestas por
bloques**, no a las respuestas finales ni a los resúmenes de herramientas.

## «Transmitir fragmentos o todo»

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emite a medida que se genera). Los canales distintos de Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vacía el búfer
  una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin transmisión por bloques:** `blockStreamingDefault: "off"` (solo la respuesta final).

La transmisión por bloques está **desactivada salvo que** `*.blockStreaming` se establezca explícitamente en
`true`. Los canales pueden transmitir una vista previa en directo (`channels.<channel>.streaming`)
sin respuestas por bloques. Los valores predeterminados `blockStreaming*` se encuentran bajo
`agents.defaults`, no en la raíz de la configuración.

## Modos de transmisión de vista previa

Clave canónica: `channels.<channel>.streaming` (estructura anidada `{ mode, ... }`; las formas
booleanas/de cadena de nivel superior heredadas son reescritas por `openclaw doctor --fix`).

| Modo       | Comportamiento                                                        |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Desactiva la transmisión de vista previa                              |
| `partial`  | Una sola vista previa sustituida por el texto más reciente            |
| `block`    | Actualizaciones de vista previa en pasos fragmentados/acumulativos    |
| `progress` | Vista previa de progreso/estado durante la generación y respuesta final al completarse |

`streaming.mode: "block"` es un modo de transmisión de vista previa para canales que permiten
ediciones, como Discord y Telegram; por sí solo no activa allí la entrega por bloques
del canal. Use `streaming.block.enabled` para las respuestas normales por bloques
(los canales sin una configuración `streaming` anidada conservan en su lugar la clave plana
`blockStreaming`). Microsoft Teams es la
excepción: no tiene un transporte por bloques para borradores de vista previa, por lo que `streaming.mode:
"block"` desactiva por completo la transmisión nativa y la respuesta se entrega mediante
bloques normales en lugar de la transmisión nativa parcial/de progreso. Mattermost también
es diferente: en el modo `block`, alterna la vista previa entre bloques de texto completado y
actividad de herramientas, por lo que los bloques anteriores permanecen visibles como publicaciones separadas
en lugar de sobrescribirse en un único borrador editable.

### Correspondencia de canales

| Canal      | `off` | `partial` | `block` | `progress`                  |
| ---------- | ----- | --------- | ------- | --------------------------- |
| Telegram   | Sí    | Sí        | Sí      | borrador de progreso editable |
| Discord    | Sí    | Sí        | Sí      | borrador de progreso editable |
| Slack      | Sí    | Sí        | Sí      | Sí                          |
| Mattermost | Sí    | Sí        | Sí      | Sí                          |
| MS Teams   | Sí    | Sí        | Sí      | transmisión nativa de progreso |

La configuración de fragmentos de vista previa (`streaming.preview.chunk.*`, p. ej., bajo
`channels.discord.streaming` o `channels.telegram.streaming`) usa de forma predeterminada
`minChars: 200`, `maxChars: 800` (restringido al `textChunkLimit` del canal) y
`breakPreference: "paragraph"`.

Solo para Slack:

- `channels.slack.streaming.nativeTransport` activa o desactiva las llamadas a la API de transmisión nativa de Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) cuando
  `channels.slack.streaming.mode="partial"` (valor predeterminado: `true`).
- La transmisión nativa de Slack y el estado del hilo del asistente de Slack requieren un destino de
  hilo de respuesta. Los mensajes directos de nivel superior no muestran esa vista previa con formato de hilo, pero pueden
  seguir usando publicaciones de vista previa de borrador de Slack y sus ediciones.

### Migración de claves heredadas

| Canal    | Claves heredadas                                             | Estado                                                                                                                                                                |
| -------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` escalar/booleano                   | `openclaw doctor --fix` las reescribe como `streaming.mode`; no se leen durante la ejecución                                                                           |
| Discord  | `streamMode`, `streaming` booleano                           | `openclaw doctor --fix` las reescribe como `streaming.mode`; no se leen durante la ejecución                                                                           |
| Slack    | `streamMode`; `streaming` booleano; `nativeStreaming` heredado | `openclaw doctor --fix` las reescribe como `streaming.mode` (y `streaming.nativeTransport` para las formas booleanas/heredadas); no se leen durante la ejecución |

## Comportamiento durante la ejecución

### Telegram

- Usa actualizaciones de vista previa mediante `sendMessage` + `editMessageText` en mensajes directos y
  grupos/temas; el texto final edita la vista previa activa en el mismo lugar. Los borradores
  efímeros de «escribiendo» de 30 segundos de Telegram (`sendMessageDraft`) no se usan para
  transmitir respuestas.
- Las vistas previas iniciales breves siguen teniendo antirrebote para mejorar la experiencia de las notificaciones push, pero
  se materializan tras un retraso acotado para que las ejecuciones activas no permanezcan visualmente silenciosas.
- Las respuestas finales largas reutilizan el mensaje de vista previa para el primer fragmento y envían solo los
  fragmentos restantes.
- El modo `block` convierte la vista previa en un mensaje nuevo al alcanzar
  `streaming.preview.chunk.maxChars` (valor predeterminado: 800, limitado al máximo de edición
  de Telegram de 4096); los demás modos amplían una única vista previa hasta 4096 caracteres.
- El modo `progress` mantiene el progreso de las herramientas en un borrador de estado editable, materializa
  la etiqueta de estado cuando la transmisión de la respuesta está activa pero todavía no hay ninguna línea de
  herramienta disponible, borra el borrador al finalizar y envía la respuesta final
  mediante la entrega normal.
- Si la edición final falla antes de confirmar el texto completado, OpenClaw usa
  la entrega final normal y elimina la vista previa obsoleta.
- La transmisión de la vista previa se omite cuando la transmisión por bloques de Telegram está habilitada
  explícitamente, para evitar una transmisión duplicada.
- `/reasoning stream` puede escribir el razonamiento en una vista previa transitoria que se
  elimina después de la entrega final.
- Las respuestas con cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es
  `"off"` y hay texto de cita seleccionado, OpenClaw omite la transmisión de la vista previa de
  la respuesta para ese turno (la respuesta final debe pasar por la ruta nativa de respuesta con
  cita), por lo que las líneas de vista previa del progreso de las herramientas no pueden mostrarse. Las respuestas
  al mensaje actual sin texto de cita seleccionado mantienen la transmisión de la vista previa. Consulte
  la [documentación del canal Telegram](/es/channels/telegram) para obtener más información.

### Discord

- Usa mensajes de vista previa que se envían y editan.
- El modo `block` usa fragmentación de borradores (`draftChunk`).
- La transmisión de la vista previa se omite cuando la transmisión por bloques de Discord está habilitada
  explícitamente.
- El modo `progress` añade un pequeño registro de actividad `-#` (recuentos de pensamientos/llamadas
  a herramientas y tiempo transcurrido) a la respuesta final y elimina el borrador de estado
  una vez entregada esa respuesta, para que los canales con mucha actividad no conserven ningún registro de herramientas huérfano
  encima de la respuesta. Las respuestas finales de error conservan el borrador como registro del turno
  fallido.
- Las cargas útiles finales de contenido multimedia, error y respuesta explícita cancelan las vistas previas pendientes
  sin volcar un borrador nuevo y, a continuación, usan la entrega normal.

### Slack

- `partial` puede usar la transmisión nativa de Slack (`chat.startStream`/`append`/`stop`)
  cuando esté disponible.
- `block` usa vistas previas de borrador con estilo de anexado.
- `progress` usa texto de vista previa de estado y, después, la respuesta final.
- Los mensajes directos de nivel superior sin un hilo de respuesta usan publicaciones de vista previa de borrador y ediciones
  en lugar de la transmisión nativa de Slack.
- La transmisión nativa y la transmisión de vistas previas de borrador suprimen las respuestas por bloques para ese turno, de modo que una
  respuesta de Slack se transmita por una sola ruta de entrega.
- Las cargas útiles finales de contenido multimedia/error y las respuestas finales de progreso no crean mensajes de borrador
  desechables; solo las respuestas finales de texto/bloques que pueden editar la vista previa vuelcan el texto de borrador
  pendiente.

### Mattermost

- En el modo `partial`, transmite el razonamiento y el texto parcial de la respuesta a una única publicación de
  vista previa de borrador que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final.
- En el modo `progress`, transmite el razonamiento y la actividad de las herramientas a una única vista previa de
  estado que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final.
- En el modo `block`, alterna entre publicaciones de texto completado y de actividad de las herramientas;
  las actualizaciones de herramientas paralelas y consecutivas comparten la publicación actual de actividad de las herramientas.
- Recurre al envío de una publicación final nueva si la publicación de vista previa se eliminó o
  no está disponible por algún otro motivo en el momento de la finalización.
- Las cargas útiles finales de contenido multimedia/error cancelan las actualizaciones de vista previa pendientes antes de la
  entrega normal, en lugar de volcar una publicación de vista previa temporal.

### Matrix

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de
  vista previa.
- Las respuestas finales que contienen solo contenido multimedia, son errores o tienen un destino de respuesta incompatible cancelan las actualizaciones de vista previa
  pendientes antes de la entrega normal; una vista previa obsoleta que ya esté visible se censura.

## Actualizaciones de la vista previa del progreso de las herramientas

La transmisión de la vista previa también puede incluir actualizaciones del **progreso de las herramientas**: líneas breves de estado
como «buscando en la web», «leyendo el archivo» o «llamando a la herramienta» que aparecen
en el mismo mensaje de vista previa mientras se ejecutan las herramientas, antes de la respuesta final.
En el modo de servidor de aplicaciones de Codex, los mensajes de preámbulo/comentario de Codex usan esta misma
ruta de vista previa, por lo que las notas breves de progreso como «Estoy comprobando...» pueden transmitirse al
borrador editable sin formar parte de la respuesta final. Esto mantiene
visualmente activos los turnos de herramientas de varios pasos, en lugar de dejarlos silenciosos entre la primera
vista previa de razonamiento y la respuesta final.

Las herramientas de larga duración pueden emitir progreso tipado antes de regresar. Por ejemplo,
`web_fetch` activa un temporizador de cinco segundos cuando se inicia: si la obtención sigue
pendiente, la vista previa muestra `Fetching page content...`; si la obtención finaliza o
se cancela antes, no se emite ninguna línea de progreso. El resultado final posterior de la herramienta
se sigue entregando normalmente al modelo.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de las herramientas y
  las actualizaciones de preámbulo de Codex a la edición de la vista previa activa de forma predeterminada cuando la transmisión de la vista previa
  está activa. Microsoft Teams usa su transmisión de progreso nativa en
  chats personales.
- Telegram incluye las actualizaciones de vista previa del progreso de las herramientas habilitadas desde
  `v2026.4.22`; mantenerlas habilitadas conserva ese comportamiento publicado.
- **Mattermost** integra la actividad de las herramientas en una publicación de vista previa en los modos `partial` y
  `progress`, o en una publicación de actividad de las herramientas entre bloques de texto en el modo `block`
  (consulte lo anterior).
- Las ediciones del progreso de las herramientas siguen el modo activo de transmisión de la vista previa; se
  omiten cuando la transmisión de la vista previa está en `off` o cuando la transmisión por bloques ha asumido
  el control del mensaje. En Telegram, `streaming.mode: "off"` solo entrega la respuesta final: la conversación
  genérica de progreso también se suprime en lugar de entregarse como mensajes de estado
  independientes, mientras que las solicitudes de aprobación, las cargas útiles multimedia y los errores se siguen enviando
  normalmente.
- Para mantener la transmisión de la vista previa pero ocultar las líneas de progreso de las herramientas, establezca
  `streaming.preview.toolProgress` en `false` para ese canal (valor predeterminado:
  `true`). Para mantener visibles las líneas de progreso de las herramientas mientras se oculta el texto de comandos/ejecución,
  establezca `streaming.preview.commandText` en `"status"` o
  `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para
  conservar el comportamiento publicado. Esta política se comparte entre los canales de borrador/progreso
  que usan el renderizador de progreso compacto de OpenClaw, incluidos Discord, Matrix,
  Microsoft Teams, Mattermost, las vistas previas de borrador de Slack y Telegram. Para deshabilitar
  por completo las ediciones de vista previa, establezca `streaming.mode` en `off`.

## Renderizado del borrador de progreso

Los borradores del modo de progreso (`streaming.progress.*`) están acotados y se pueden configurar por
canal:

| Clave                             | Valor predeterminado  | Comportamiento                                                          |
| --------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`                   | Máximo de líneas compactas de progreso conservadas debajo de la etiqueta del borrador |
| `streaming.progress.maxLineChars` | `120`                 | Máximo de caracteres por línea compacta antes del truncamiento (respeta las palabras) |
| `streaming.progress.label`        | `"auto"`              | Título del borrador; una cadena personalizada o `false` para ocultarlo              |
| `streaming.progress.labels`       | conjunto incorporado  | Etiquetas candidatas usadas cuando `label: "auto"`                      |

### Canal de progreso de comentarios

Además del progreso de las herramientas, el renderizador de progreso compacto puede mostrar un canal adicional
en el borrador:

- **`streaming.progress.commentary`** - renderiza los **comentarios** del modelo
  anteriores a la herramienta (una breve narración del tipo «Comprobaré... y después...»), intercalados con
  las líneas de herramientas en el borrador de progreso.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Mantenga visibles las líneas de progreso, pero oculte el texto sin procesar de comandos/ejecución:

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

Use la misma estructura bajo la clave de otro canal de progreso compacto, por ejemplo,
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` o las vistas previas de borrador de Slack. Para el modo de borrador de progreso, coloque
la misma política bajo `streaming.progress`:

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

## Contenido relacionado

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño compartido objetivo de vistas previas, edición, transmisión y finalización
- [Borradores de progreso](/es/concepts/progress-drafts) - mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages) - ciclo de vida y entrega de los mensajes
- [Reintentos](/es/concepts/retry) - comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) - compatibilidad de transmisión por canal
