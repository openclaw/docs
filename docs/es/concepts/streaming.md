---
read_when:
    - Explicación de cómo funcionan la transmisión o la fragmentación en los canales
    - Cambiar el comportamiento de la transmisión por bloques o la fragmentación del canal
    - Depuración de respuestas de bloque duplicadas/anticipadas o de la transmisión de vistas previas del canal
summary: Comportamiento de streaming + fragmentación (respuestas en bloques, streaming de vista previa del canal, asignación de modos)
title: Transmisión y fragmentación
x-i18n:
    generated_at: "2026-07-16T11:37:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de transmisión independientes, y actualmente **no existe una verdadera
transmisión de deltas de tokens** a los mensajes de los canales:

- **Transmisión por bloques (canales):** emite **bloques** completados a medida que el asistente
  escribe. Son mensajes normales del canal, no deltas de tokens.
- **Transmisión de vista previa (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  actualiza un **mensaje de vista previa** temporal durante la generación (envío + ediciones/adiciones).

## Transmisión por bloques (mensajes de canal)

La transmisión por bloques envía la salida del asistente en fragmentos grandes a medida que está disponible.

```text
Salida del modelo
  └─ text_delta/eventos
       ├─ (blockStreamingBreak=text_end)
       │    └─ el fragmentador emite bloques a medida que crece el búfer
       └─ (blockStreamingBreak=message_end)
            └─ el fragmentador vacía el búfer en message_end
                   └─ envío al canal (respuestas por bloques)
```

- `text_delta/events`: eventos de transmisión del modelo (pueden ser escasos para modelos sin transmisión).
- `chunker`: `EmbeddedBlockChunker` aplica los límites mínimo/máximo y la preferencia de separación.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles** (todos bajo `agents.defaults`, salvo que se indique lo contrario):

| Clave                                                        | Valores / forma                                                           | Valor predeterminado |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (fusiona los bloques transmitidos antes del envío) | -          |
| `*.streaming.block.enabled` (anulación del canal)               | `true` / `false`, fuerza la transmisión por bloques por canal (y por cuenta)  | -          |
| `*.textChunkLimit` (p. ej., `channels.whatsapp.textChunkLimit`) | número, límite estricto                                                       | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | número, límite flexible de líneas que divide las respuestas altas para evitar que la interfaz las recorte | 17         |

`streaming.chunkMode: "newline"` divide por líneas en blanco (límites de párrafo),
no por cada salto de línea, antes de recurrir a la fragmentación por longitud cuando el texto
supera el límite.

Los canales incluidos expresan estas anulaciones como
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Las formas planas
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` son
heredadas en todos los canales incluidos: `openclaw doctor --fix` las migra a
la forma anidada y los esquemas de canal las rechazan. Las configuraciones de plugins
del SDK externos que aún usan las formas planas siguen funcionando mediante un mecanismo
alternativo obsoleto (con una advertencia en tiempo de ejecución) hasta el siguiente ciclo de versiones.

**Semántica de los límites** para `blockStreamingBreak`:

- `text_end`: transmite los bloques en cuanto los emite el fragmentador; vacía el búfer en cada `text_end`.
- `message_end`: espera hasta que termine el mensaje del asistente y luego vacía la salida
  almacenada en el búfer. Sigue usando el fragmentador si el texto almacenado supera `maxChars`, por lo que
  puede emitir varios fragmentos al final.

### Entrega de contenido multimedia con transmisión por bloques

El contenido multimedia transmitido debe usar campos de carga estructurados, como `mediaUrl` o
`mediaUrls`; el texto transmitido no se analiza como un comando de archivo adjunto. Cuando la transmisión por
bloques envía contenido multimedia anticipadamente, OpenClaw recuerda esa entrega durante el turno. Si
la carga final del asistente repite la misma URL del contenido multimedia, la entrega final elimina
el contenido duplicado en lugar de volver a enviar el archivo adjunto.

Las cargas finales exactamente duplicadas se suprimen. Si la carga final añade
texto diferente alrededor de contenido multimedia que ya se transmitió, OpenClaw sigue enviando el
texto nuevo y mantiene una única entrega del contenido multimedia. Esto evita la duplicación de notas
de voz o archivos en canales como Telegram.

## Algoritmo de fragmentación (límites inferior/superior)

La fragmentación en bloques se implementa mediante `EmbeddedBlockChunker`:

- **Límite inferior:** no emite hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite superior:** prefiere dividir antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Cadena de preferencias de separación:** `paragraph` -> `newline` -> `sentence` ->
  espacio en blanco -> separación forzada.
- **Bloques de código:** nunca divide dentro de los bloques; cuando se fuerza en `maxChars`, cierra
  y vuelve a abrir el bloque para mantener un Markdown válido.

`maxChars` se restringe al `textChunkLimit` del canal, por lo que no se pueden superar
los límites de cada canal.

## Agrupación (fusión de bloques transmitidos)

Cuando la transmisión por bloques está habilitada, OpenClaw puede **fusionar fragmentos de bloques
consecutivos** antes de enviarlos, lo que reduce la acumulación de mensajes de una sola línea sin dejar de proporcionar
una salida progresiva.

- La agrupación espera a que haya **intervalos de inactividad** (`idleMs`) antes de vaciar el búfer.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita el envío de fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espacio.
- Las anulaciones de canal están disponibles mediante `*.streaming.block.coalesce` (incluidas
  las configuraciones por cuenta).
- Discord, Signal y Slack usan de forma predeterminada una agrupación de `{ minChars: 1500, idleMs: 1000 }`,
  salvo que se anule.

## Ritmo similar al humano entre bloques

Cuando la transmisión por bloques está habilitada, se añade una **pausa aleatoria** entre las respuestas
por bloques, después del primer bloque, para que las respuestas con varias burbujas resulten más naturales.

| `agents.defaults.humanDelay.mode` | Comportamiento          |
| --------------------------------- | ----------------------- |
| `off` (predeterminado)                   | Sin pausa                |
| `natural`                         | Pausa aleatoria de 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Se puede anular por agente mediante `agents.list[].humanDelay`. Solo se aplica a las **respuestas por
bloques**, no a las respuestas finales ni a los resúmenes de herramientas.

## «Transmitir fragmentos o todo»

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emite sobre la marcha). Los canales distintos de Telegram también necesitan
  `*.streaming.block.enabled: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vacía el búfer
  una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin transmisión por bloques:** `blockStreamingDefault: "off"` (solo la respuesta final).

La transmisión por bloques está **desactivada salvo que** `*.streaming.block.enabled` se establezca explícitamente
en `true` (excepción: QQ Bot no tiene claves `streaming.block` y transmite
respuestas por bloques salvo que `channels.qqbot.streaming.mode` sea `"off"`). Los canales pueden
transmitir una vista previa en directo (`channels.<channel>.streaming.mode`) sin respuestas por
bloques. Los valores predeterminados de `blockStreaming*` se encuentran bajo `agents.defaults`, no en la
raíz de la configuración.

## Modos de transmisión de vista previa

Clave canónica: `channels.<channel>.streaming` (`{ mode, ... }` anidada; las formas
booleanas/de cadena heredadas del nivel superior son reescritas por `openclaw doctor --fix`).

| Modo       | Comportamiento                                                        |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Deshabilita la transmisión de vista previa                            |
| `partial`  | Una única vista previa sustituida por el texto más reciente            |
| `block`    | La vista previa se actualiza en pasos fragmentados/añadidos             |
| `progress` | Vista previa del progreso/estado durante la generación y respuesta final al completarse |

`streaming.mode: "block"` es un modo de transmisión de vista previa para canales con capacidad
de edición como Discord y Telegram; por sí solo, no habilita la entrega por bloques
del canal. Se debe usar `streaming.block.enabled` para las respuestas normales por bloques.
Microsoft Teams es la
excepción: no dispone de transporte por bloques para vistas previas en borrador, por lo que `streaming.mode:
"block"` deshabilita por completo la transmisión nativa y la respuesta se entrega mediante
bloques normales en lugar de mediante transmisión nativa parcial/de progreso. Mattermost también
es diferente: en el modo `block`, alterna la vista previa entre el texto completado y
los bloques de actividad de herramientas, de modo que los bloques anteriores permanecen visibles como publicaciones
separadas en lugar de sobrescribirse en un único borrador editable.

### Correspondencia de canales

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Sí    | Sí        | Sí      | borrador de progreso editable |
| Discord    | Sí    | Sí        | Sí      | borrador de progreso editable |
| Slack      | Sí    | Sí        | Sí      | Sí                      |
| Mattermost | Sí    | Sí        | Sí      | Sí                      |
| MS Teams   | Sí    | Sí        | Sí      | transmisión de progreso nativa |

La configuración de fragmentos de vista previa (`streaming.preview.chunk.*`, p. ej., bajo
`channels.discord.streaming` o `channels.telegram.streaming`) tiene como valores predeterminados
`minChars: 200`, `maxChars: 800` (restringido al `textChunkLimit` del canal) y
`breakPreference: "paragraph"`.

Solo para Slack:

- `channels.slack.streaming.nativeTransport` activa o desactiva las llamadas a la API de transmisión nativa de Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) cuando
  `channels.slack.streaming.mode="partial"` (valor predeterminado: `true`).
- La transmisión nativa de Slack y el estado de los hilos del asistente de Slack requieren un destino
  de hilo de respuesta. Los mensajes directos de nivel superior no muestran esa vista previa con formato de hilo, pero pueden
  seguir usando publicaciones de vista previa en borrador de Slack y sus ediciones.

### Migración de claves heredadas

| Canal    | Claves heredadas                                            | Estado                                                                                                                                               |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` escalar/booleana                    | `openclaw doctor --fix` la reescribe como `streaming.mode`; no se lee en tiempo de ejecución                                                                        |
| Discord  | `streamMode`, `streaming` booleana                           | `openclaw doctor --fix` la reescribe como `streaming.mode`; no se lee en tiempo de ejecución                                                                        |
| Slack    | `streamMode`; `streaming` booleana; `nativeStreaming` heredada | `openclaw doctor --fix` la reescribe como `streaming.mode` (y como `streaming.nativeTransport` para las formas booleanas/heredadas); no se lee en tiempo de ejecución         |
| Matrix   | `streaming` escalar/booleana                                  | `openclaw doctor --fix` la reescribe como `streaming.mode` (incluido el modo `"quiet"` de Matrix); no se lee en tiempo de ejecución                                    |
| Feishu   | `streaming` booleana                                         | `openclaw doctor --fix` la reescribe como `streaming.mode`; no se lee en tiempo de ejecución                                                                        |
| QQ Bot   | `streaming` booleana; `streaming.c2cStreamApi`               | `openclaw doctor --fix` la reescribe como `streaming.mode` (y como `streaming.nativeTransport` para las formas booleanas/`c2cStreamApi`); no se lee en tiempo de ejecución |

## Comportamiento en tiempo de ejecución

### Telegram

- Usa actualizaciones de vista previa `sendMessage` + `editMessageText` en mensajes directos y
  grupos/temas; el texto final edita la vista previa activa en el mismo lugar. Los borradores
  efímeros de «escritura» de Telegram de 30 segundos (`sendMessageDraft`) no se usan para
  la transmisión de respuestas.
- Las vistas previas iniciales breves aún se procesan con antirrebote para mejorar la experiencia de las notificaciones push, pero
  se materializan tras un retraso limitado para que las ejecuciones activas no permanezcan visualmente silenciosas.
- Las respuestas finales largas reutilizan el mensaje de vista previa para el primer fragmento y envían solo los
  fragmentos restantes.
- El modo `block` convierte la vista previa en un nuevo mensaje al alcanzar
  `streaming.preview.chunk.maxChars` (valor predeterminado: 800; limitado por el máximo de edición de
  4096 de Telegram); los demás modos amplían una sola vista previa hasta 4096 caracteres.
- El modo `progress` mantiene el progreso de las herramientas en un borrador de estado editable, materializa
  la etiqueta de estado cuando la transmisión de la respuesta está activa pero todavía no hay
  ninguna línea de herramienta disponible, borra el borrador al finalizar y envía la respuesta final
  mediante la entrega normal.
- Si la edición final falla antes de confirmar el texto completado, OpenClaw usa
  la entrega final normal y elimina la vista previa obsoleta.
- La transmisión de la vista previa se omite cuando la transmisión por bloques de Telegram está habilitada
  explícitamente, para evitar una transmisión duplicada.
- `/reasoning stream` puede escribir el razonamiento en una vista previa transitoria que se
  elimina tras la entrega final.
- Las respuestas con cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es
  `"off"` y hay texto de cita seleccionado, OpenClaw omite la transmisión de la vista previa de la respuesta
  para ese turno (la respuesta final debe pasar por la ruta nativa de respuesta
  con cita), por lo que las líneas de vista previa del progreso de las herramientas no pueden mostrarse. Las respuestas
  al mensaje actual sin texto de cita seleccionado siguen manteniendo la transmisión de la vista previa. Consulte
  la [documentación del canal Telegram](/es/channels/telegram) para obtener más información.

### Discord

- Usa el envío y la edición de mensajes de vista previa.
- El modo `block` usa la división de borradores en fragmentos (`draftChunk`).
- La transmisión de la vista previa se omite cuando la transmisión por bloques de Discord está habilitada
  explícitamente.
- El modo `progress` añade un pequeño acuse de actividad `-#` (recuentos de pensamientos/llamadas a herramientas
  y tiempo transcurrido) a la respuesta final y elimina el borrador de estado
  una vez entregada esa respuesta, para que los canales con mucha actividad no conserven ningún registro de herramientas huérfano
  sobre la respuesta. Las respuestas finales con errores conservan el borrador como registro del turno
  fallido.
- Las cargas útiles finales de contenido multimedia, errores y respuestas explícitas cancelan las vistas previas pendientes
  sin volcar un nuevo borrador y, a continuación, usan la entrega normal.

### Slack

- `partial` puede usar la transmisión nativa de Slack (`chat.startStream`/`append`/`stop`)
  cuando esté disponible.
- `block` usa vistas previas de borrador basadas en adiciones sucesivas.
- `progress` usa texto de vista previa del estado y, después, la respuesta final.
- Los mensajes directos de nivel superior sin un hilo de respuesta usan publicaciones y ediciones de vista previa
  de borradores en lugar de la transmisión nativa de Slack.
- La transmisión de vistas previas nativas y de borrador suprime las respuestas por bloques durante ese turno, por lo que una
  respuesta de Slack se transmite mediante una sola ruta de entrega.
- Las cargas útiles finales de contenido multimedia/errores y los resultados finales de progreso no crean mensajes de borrador
  desechables; solo el texto o los bloques finales que pueden editar la vista previa vuelcan el texto
  de borrador pendiente.

### Mattermost

- En el modo `partial`, transmite el razonamiento y el texto parcial de la respuesta en una sola publicación
  de vista previa de borrador que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final.
- En el modo `progress`, transmite el razonamiento y la actividad de las herramientas en una sola vista previa
  de estado que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final.
- En el modo `block`, alterna entre publicaciones de texto completado y de actividad de herramientas;
  las actualizaciones de herramientas paralelas y consecutivas comparten la publicación actual de actividad de herramientas.
- Si la publicación de vista previa se eliminó o no está disponible por otro motivo
  al finalizar, recurre al envío de una nueva publicación final.
- Las cargas útiles finales de contenido multimedia/errores cancelan las actualizaciones de vista previa pendientes antes de la entrega
  normal, en lugar de volcar una publicación de vista previa temporal.

### Matrix

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento
  de vista previa.
- Las respuestas finales que solo contienen contenido multimedia, contienen errores o presentan una discrepancia en el destino de la respuesta cancelan las actualizaciones de vista previa
  pendientes antes de la entrega normal; cualquier vista previa obsoleta que ya sea visible se censura.

## Actualizaciones de vista previa del progreso de las herramientas

La transmisión de la vista previa también puede incluir actualizaciones del **progreso de las herramientas**: líneas breves de estado
como «buscando en la web», «leyendo el archivo» o «llamando a la herramienta», que aparecen
en el mismo mensaje de vista previa mientras se ejecutan las herramientas, antes de la respuesta final.
En el modo de servidor de aplicaciones de Codex, los mensajes de preámbulo/comentario de Codex usan esta misma
ruta de vista previa, por lo que las notas breves de progreso como «Estoy comprobando...» pueden transmitirse al
borrador editable sin formar parte de la respuesta final. Esto mantiene
visualmente activos los turnos de herramientas con varios pasos, en lugar de dejarlos silenciosos entre la primera
vista previa del razonamiento y la respuesta final.

Las herramientas de larga duración pueden emitir progreso tipado antes de devolver un resultado. Por ejemplo,
`web_fetch` activa un temporizador de cinco segundos cuando se inicia: si la obtención sigue
pendiente, la vista previa muestra `Fetching page content...`; si la obtención termina o
se cancela antes, no se emite ninguna línea de progreso. El resultado final posterior de la herramienta
se sigue entregando normalmente al modelo.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de las herramientas y
  las actualizaciones del preámbulo de Codex en la edición activa de la vista previa de forma predeterminada cuando la transmisión
  de la vista previa está activa. Microsoft Teams usa su transmisión nativa del progreso en
  los chats personales.
- Telegram incluye las actualizaciones de vista previa del progreso de las herramientas habilitadas desde
  `v2026.4.22`; mantenerlas habilitadas conserva ese comportamiento publicado.
- **Mattermost** integra la actividad de las herramientas en una publicación de vista previa en los modos `partial` y
  `progress`, o en una publicación de actividad de herramientas entre bloques de texto en el modo `block`
  (consulte la información anterior).
- Las ediciones del progreso de las herramientas siguen el modo activo de transmisión de la vista previa; se
  omiten cuando la transmisión de la vista previa es `off` o cuando la transmisión por bloques ha asumido
  el control del mensaje. En Telegram, `streaming.mode: "off"` se aplica solo al resultado final: la conversación
  genérica de progreso también se suprime en lugar de entregarse como mensajes de estado
  independientes, mientras que las solicitudes de aprobación, las cargas útiles multimedia y los errores siguen sus rutas
  normales.
- Para mantener la transmisión de la vista previa pero ocultar las líneas de progreso de las herramientas, establezca
  `streaming.preview.toolProgress` en `false` para ese canal (valor predeterminado:
  `true`). Para mantener visibles las líneas de progreso de las herramientas mientras se oculta el texto de comandos/ejecución,
  establezca `streaming.preview.commandText` en `"status"` o
  `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para
  conservar el comportamiento publicado. Esta política se comparte entre los canales de borrador/progreso
  que usan el renderizador compacto de progreso de OpenClaw, incluidos Discord, Matrix,
  Microsoft Teams, Mattermost, las vistas previas de borradores de Slack y Telegram. Para deshabilitar
  por completo las ediciones de la vista previa, establezca `streaming.mode` en `off`.

## Renderizado de borradores de progreso

Los borradores del modo de progreso (`streaming.progress.*`) tienen límites y pueden configurarse por
canal:

| Clave                             | Valor predeterminado | Comportamiento                                                       |
| --------------------------------- | ------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Número máximo de líneas compactas de progreso que se conservan bajo la etiqueta del borrador |
| `streaming.progress.maxLineChars` | `120`         | Número máximo de caracteres por línea compacta antes del truncamiento (respetando las palabras) |
| `streaming.progress.label`        | `"auto"`      | Título del borrador; una cadena personalizada o `false` para ocultarlo            |
| `streaming.progress.labels`       | grupo integrado | Etiquetas candidatas usadas cuando `label: "auto"`                     |

### Vía de progreso de comentarios

Además del progreso de las herramientas, el renderizador compacto de progreso puede mostrar otra vía
en el borrador:

- **`streaming.progress.commentary`**: representa el **comentario** previo a las herramientas
  del modelo (una narración breve como «Comprobaré... y después...»), intercalado con
  las líneas de herramientas en el borrador de progreso. En Discord y Telegram, en el modo de progreso,
  el mismo preámbulo proporciona el encabezado de estado incluso cuando esta vía opcional
  está desactivada; los demás canales mantienen su comportamiento de progreso actual. Consulte
  [Borradores de progreso](/es/concepts/progress-drafts#status-headline).

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
`channels.mattermost` o las vistas previas de borradores de Slack. Para el modo de borrador de progreso, coloque
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

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor): diseño objetivo compartido para vistas previas, edición, transmisión y finalización
- [Borradores de progreso](/es/concepts/progress-drafts): mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages): ciclo de vida y entrega de los mensajes
- [Reintentos](/es/concepts/retry): comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels): compatibilidad de transmisión por canal
