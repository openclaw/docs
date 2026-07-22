---
read_when:
    - Explicación de cómo funciona el streaming o la fragmentación en los canales
    - Cambiar el comportamiento de la transmisión por bloques o la fragmentación del canal
    - Depuración de respuestas de bloque duplicadas/anticipadas o del streaming de vista previa del canal
summary: Comportamiento de streaming + fragmentación (respuestas en bloques, streaming de vista previa del canal, asignación de modos)
title: Transmisión y fragmentación
x-i18n:
    generated_at: "2026-07-22T10:31:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a498f2e490ae6f2ecdebba92f0b992f2e16d212eae6a437eb3a0ef8a59354e13
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming independientes y, actualmente, **no existe
un verdadero streaming de deltas de tokens** hacia los mensajes de canal:

- **Streaming por bloques (canales):** emite **bloques** completados a medida que el asistente
  escribe. Son mensajes normales del canal, no deltas de tokens.
- **Streaming de vista previa (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  actualiza un **mensaje de vista previa** temporal durante la generación (envío + ediciones/adiciones).

## Estado de inicio de la interfaz de control

Después de que `chat.send` confirma una ejecución activa, el Gateway puede enviar un estado de inicio
tipado y general antes de que el texto del asistente o la actividad de las herramientas sean visibles. La
interfaz de control muestra este estado junto al indicador de trabajo, con etapas para
la preparación del espacio de trabajo, el aprovisionamiento del entorno, la preparación del contexto y
el inicio del modelo.

El primer delta del asistente o el inicio de una herramienta sustituye permanentemente el estado de inicio de
esa ejecución. El estado de aprobación tiene prioridad mientras una herramienta espera una acción del
operador. La creación del worktree y el envío inicial a la nube ocurren antes de que exista una ejecución
de chat, por lo que el progreso de su RPC previo a la ejecución no se presenta como estado de inicio de la ejecución;
el aprovisionamiento del entorno solo aparece aquí cuando una ejecución activa vuelve a aprovisionar un
worker recuperado.

## Streaming por bloques (mensajes de canal)

El streaming por bloques envía la salida del asistente en fragmentos grandes a medida que está disponible.

```text
Salida del modelo
  └─ text_delta/eventos
       ├─ (blockStreamingBreak=text_end)
       │    └─ el segmentador emite bloques a medida que crece el búfer
       └─ (blockStreamingBreak=message_end)
            └─ el segmentador vacía el búfer en message_end
                   └─ envío al canal (respuestas por bloques)
```

- `text_delta/events`: eventos del flujo del modelo (pueden ser esporádicos en modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` aplica los límites mínimo/máximo y la preferencia de separación.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles** (todos bajo `agents.defaults` salvo que se indique lo contrario):

| Clave                                                        | Valores / estructura                                                    | Valor predeterminado |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (combina los bloques transmitidos antes del envío) | -          |
| `*.streaming.block.enabled` (sobrescritura del canal)               | `true` / `false`, fuerza el streaming por bloques en cada canal (y en cada cuenta)  | -          |
| `*.textChunkLimit` (p. ej., `channels.whatsapp.textChunkLimit`) | número, límite estricto                                                 | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | número, límite flexible de líneas que divide las respuestas altas para evitar que la interfaz las recorte | 17         |

`streaming.chunkMode: "newline"` divide en las líneas en blanco (límites de párrafo),
no en cada salto de línea, antes de recurrir a la segmentación por longitud una vez que el texto
supera el límite.

Los canales incluidos expresan estas sobrescrituras como
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Las formas planas
`*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` son
heredadas en todos los canales incluidos: `openclaw doctor --fix` las migra a
la estructura anidada y los esquemas de canal las rechazan. Las configuraciones de plugins
del SDK externos que todavía usan las formas planas siguen funcionando mediante una alternativa
obsoleta (con una advertencia en tiempo de ejecución) hasta el próximo ciclo de versiones.

**Semántica de los límites** de `blockStreamingBreak`:

- `text_end`: transmite los bloques en cuanto los emite el segmentador; vacía el búfer en cada `text_end`.
- `message_end`: espera hasta que finalice el mensaje del asistente y luego vacía la salida
  almacenada en el búfer. Sigue utilizando el segmentador si el texto almacenado supera `maxChars`, por lo que
  puede emitir varios fragmentos al final.

### Entrega de contenido multimedia con streaming por bloques

El contenido multimedia transmitido debe usar campos de carga útil estructurados como `mediaUrl` o
`mediaUrls`; el texto transmitido no se analiza como un comando de archivo adjunto. Cuando el streaming por
bloques envía contenido multimedia con antelación, OpenClaw recuerda esa entrega durante el turno. Si
la carga útil final del asistente repite la misma URL del contenido multimedia, la entrega final elimina
el contenido duplicado en lugar de volver a enviar el archivo adjunto.

Las cargas útiles finales que sean duplicados exactos se suprimen. Si la carga útil final añade
texto diferente alrededor de contenido multimedia que ya se transmitió, OpenClaw sigue enviando el
texto nuevo y mantiene una única entrega del contenido multimedia. Esto evita notas de voz
o archivos duplicados en canales como Telegram.

## Algoritmo de segmentación (límites inferior/superior)

La segmentación por bloques está implementada por `EmbeddedBlockChunker`:

- **Límite inferior:** no emite hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite superior:** prefiere las divisiones antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Cadena de preferencia de separación:** `paragraph` -> `newline` -> `sentence` ->
  espacio en blanco -> separación forzada.
- **Bloques de código:** nunca divide dentro de los bloques; cuando se fuerza en `maxChars`, cierra
  y vuelve a abrir el bloque para mantener un Markdown válido.

`maxChars` se restringe al `textChunkLimit` del canal, por lo que no se pueden superar
los límites de cada canal.

## Fusión (combinación de bloques transmitidos)

Cuando el streaming por bloques está habilitado, OpenClaw puede **combinar fragmentos de bloques
consecutivos** antes de enviarlos, lo que reduce la acumulación de mensajes de una sola línea sin dejar de proporcionar
una salida progresiva.

- La fusión espera a que haya **intervalos de inactividad** (`idleMs`) antes de vaciar el búfer.
- Los búferes están limitados por `maxChars` y se vacían si lo superan.
- `minChars` evita el envío de fragmentos diminutos hasta que se acumula suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> espacio.
- Las sobrescrituras de canal están disponibles mediante `*.streaming.block.coalesce` (incluidas
  las configuraciones por cuenta).
- Discord, Signal y Slack usan de forma predeterminada la fusión en `{ minChars: 1500, idleMs: 1000 }`,
  salvo que se sobrescriba.

## Ritmo similar al humano entre bloques

Cuando el streaming por bloques está habilitado, añade una **pausa aleatoria** entre las respuestas
por bloques, después del primer bloque, para que las respuestas de varias burbujas resulten más naturales.

| `agents.defaults.humanDelay.mode` | Comportamiento          |
| --------------------------------- | ----------------------- |
| `off` (predeterminado)                   | Sin pausa               |
| `natural`                         | Pausa aleatoria de 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Se puede sobrescribir por agente mediante `agents.entries.*.humanDelay`. Solo se aplica a las **respuestas por
bloques**, no a las respuestas finales ni a los resúmenes de herramientas.

## «Transmitir fragmentos o todo»

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emite sobre la marcha). Los canales distintos de Telegram también necesitan
  `*.streaming.block.enabled: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vacía el búfer
  una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming por bloques:** `blockStreamingDefault: "off"` (solo la respuesta final).

El streaming por bloques está **desactivado a menos que** `*.streaming.block.enabled` se establezca explícitamente
en `true` (excepción: QQ Bot no tiene claves `streaming.block` y transmite
respuestas por bloques salvo que `channels.qqbot.streaming.mode` sea `"off"`). Los canales pueden
transmitir una vista previa en directo (`channels.<channel>.streaming.mode`) sin respuestas
por bloques. Los valores predeterminados de `blockStreaming*` se encuentran bajo `agents.defaults`, no en la
raíz de la configuración.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming` (`{ mode, ... }` anidado; las formas
booleanas/de cadena heredadas de nivel superior se reescriben mediante `openclaw doctor --fix`).

| Modo       | Comportamiento                                                        |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Desactiva el streaming de vista previa                                |
| `partial`  | Sustituye una única vista previa por el texto más reciente             |
| `block`    | Actualiza la vista previa mediante pasos segmentados/anexados          |
| `progress` | Vista previa del progreso/estado durante la generación y respuesta final al terminar |

`streaming.mode: "block"` es un modo de streaming de vista previa para canales con capacidad de edición
como Discord y Telegram; por sí solo, no habilita la entrega por bloques del canal
en ellos. Utilice `streaming.block.enabled` para las respuestas por bloques normales.
Microsoft Teams es la
excepción: no dispone de transporte de bloques para vistas previas en borrador, por lo que `streaming.mode:
"block"` desactiva por completo el streaming nativo y la respuesta se entrega mediante
bloques normales en lugar de streaming nativo parcial/de progreso. Mattermost también
es diferente: en el modo `block`, alterna la vista previa entre el texto completado y
los bloques de actividad de las herramientas, por lo que los bloques anteriores permanecen visibles como publicaciones separadas
en lugar de sobrescribirse en un único borrador editable.

### Correspondencia de canales

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Sí    | Sí        | Sí      | borrador de progreso editable |
| Discord    | Sí    | Sí        | Sí      | borrador de progreso editable |
| Slack      | Sí    | Sí        | Sí      | Sí                      |
| Mattermost | Sí    | Sí        | Sí      | Sí                      |
| MS Teams   | Sí    | Sí        | Sí      | flujo de progreso nativo |

La configuración de fragmentos de vista previa (`streaming.preview.chunk.*`, p. ej., bajo
`channels.discord.streaming` o `channels.telegram.streaming`) usa de forma predeterminada
`minChars: 200`, `maxChars: 800` (restringido al `textChunkLimit` del canal) y
`breakPreference: "paragraph"`.

Solo para Slack:

- `channels.slack.streaming.nativeTransport` activa o desactiva las llamadas a la API de streaming nativa de Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`) cuando
  `channels.slack.streaming.mode="partial"` (valor predeterminado: `true`).
- El streaming nativo de Slack y el estado del hilo del asistente de Slack requieren un destino de
  hilo de respuesta. Los mensajes directos de nivel superior no muestran esa vista previa con formato de hilo, pero
  aún pueden utilizar publicaciones de vista previa en borrador de Slack y editarlas.

### Migración de claves heredadas

| Canal    | Claves heredadas                                             | Estado                                                                                                                                               |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, `streaming` escalar/booleano                    | Reescritas como `streaming.mode` por `openclaw doctor --fix`; no se leen en tiempo de ejecución                                                                        |
| Discord  | `streamMode`, `streaming` booleano                           | Reescritas como `streaming.mode` por `openclaw doctor --fix`; no se leen en tiempo de ejecución                                                                        |
| Slack    | `streamMode`; `streaming` booleano; `nativeStreaming` heredada | Reescritas como `streaming.mode` (y `streaming.nativeTransport` para las formas booleana/heredada) por `openclaw doctor --fix`; no se leen en tiempo de ejecución         |
| Matrix   | `streaming` escalar/booleano                                  | Reescrita como `streaming.mode` (incluido el modo `"quiet"` de Matrix) por `openclaw doctor --fix`; no se lee en tiempo de ejecución                                    |
| Feishu   | `streaming` booleano                                         | Reescrita como `streaming.mode` por `openclaw doctor --fix`; no se lee en tiempo de ejecución                                                                        |
| QQ Bot   | `streaming` booleano; `streaming.c2cStreamApi`               | Reescritas como `streaming.mode` (y `streaming.nativeTransport` para las formas booleana/`c2cStreamApi`) por `openclaw doctor --fix`; no se leen en tiempo de ejecución |

## Comportamiento en tiempo de ejecución

### Telegram

- Usa actualizaciones de vista previa mediante `sendMessage` + `editMessageText` en mensajes directos y
  grupos/temas; el texto final edita en el mismo lugar la vista previa activa. Los
  borradores efímeros de «escribiendo» de 30 segundos de Telegram (`sendMessageDraft`) no se usan para
  transmitir respuestas.
- Las vistas previas iniciales cortas siguen teniendo una espera antirrebote para mejorar la experiencia de las notificaciones push, pero
  se materializan tras una demora limitada para que las ejecuciones activas no permanezcan visualmente silenciosas.
- Las respuestas finales largas reutilizan el mensaje de vista previa para el primer fragmento y envían solo los
  fragmentos restantes.
- El modo `block` convierte la vista previa en un mensaje nuevo al alcanzar
  `streaming.preview.chunk.maxChars` (valor predeterminado: 800; limitado por el máximo de edición
  de 4096 de Telegram); los demás modos amplían una sola vista previa hasta 4096 caracteres.
- El modo `progress` mantiene el progreso de las herramientas en un borrador de estado editable, materializa
  la etiqueta de estado cuando la transmisión de la respuesta está activa pero todavía no hay
  ninguna línea de herramienta disponible, borra el borrador al finalizar y envía la respuesta final
  mediante la entrega normal.
- Si la edición final falla antes de confirmar el texto completo, OpenClaw usa
  la entrega final normal y elimina la vista previa obsoleta.
- La transmisión de la vista previa se omite cuando la transmisión por bloques de Telegram está habilitada
  explícitamente, para evitar una transmisión duplicada.
- `/reasoning stream` puede escribir el razonamiento en una vista previa transitoria que se
  elimina después de la entrega final.
- Las respuestas con cita seleccionada de Telegram son una excepción: cuando `replyToMode` no es
  `"off"` y hay texto de cita seleccionado, OpenClaw omite la transmisión de la vista previa
  de la respuesta para ese turno (la respuesta final debe usar la ruta nativa de respuesta
  con cita), por lo que no se pueden mostrar las líneas de vista previa del progreso de las herramientas. Las respuestas
  al mensaje actual sin texto de cita seleccionado siguen manteniendo la transmisión de la vista previa. Consulte
  la [documentación del canal Telegram](/es/channels/telegram) para obtener más información.

### Discord

- Usa mensajes de vista previa que se envían y editan.
- El modo `block` usa fragmentación de borradores (`draftChunk`).
- La transmisión de la vista previa se omite cuando la transmisión por bloques de Discord está habilitada
  explícitamente.
- El modo `progress` añade un pequeño recibo de actividad `-#` (recuentos de pensamientos/llamadas
  a herramientas y tiempo transcurrido) a la respuesta final y elimina el borrador de estado
  una vez entregada la respuesta, para que los canales activos no conserven ningún registro de herramientas huérfano
  sobre la respuesta. Las respuestas finales con errores conservan el borrador como registro del turno
  fallido.
- Los contenidos finales con archivos multimedia, errores y respuestas explícitas cancelan las vistas previas pendientes
  sin publicar un borrador nuevo y, a continuación, usan la entrega normal.

### Slack

- `partial` puede usar la transmisión nativa de Slack (`chat.startStream`/`append`/`stop`)
  cuando está disponible.
- `block` usa vistas previas de borrador que añaden contenido.
- `progress` usa texto de vista previa de estado y, después, la respuesta final.
- Los mensajes directos de nivel superior sin un hilo de respuesta usan publicaciones de vista previa de borrador y ediciones
  en lugar de la transmisión nativa de Slack.
- La transmisión nativa y la de vistas previas de borrador suprimen las respuestas por bloques para ese turno, de modo que una
  respuesta de Slack se transmita por una sola ruta de entrega.
- Los contenidos finales con archivos multimedia/errores y las respuestas finales de progreso no crean mensajes de borrador
  desechables; solo el texto o los bloques finales que pueden editar la vista previa publican el texto
  de borrador pendiente.

### Mattermost

- En el modo `partial`, transmite el razonamiento y el texto parcial de la respuesta en una única publicación de vista previa
  de borrador que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final.
- En el modo `progress`, transmite el razonamiento y la actividad de las herramientas en una única vista previa
  de estado que se finaliza en el mismo lugar cuando es seguro enviar la respuesta final.
- En el modo `block`, alterna entre publicaciones de texto completado y de actividad de herramientas;
  las actualizaciones paralelas y consecutivas de herramientas comparten la publicación actual de actividad de herramientas.
- Recurrirá al envío de una publicación final nueva si la publicación de vista previa se eliminó o
  no está disponible por cualquier otro motivo al finalizar.
- Los contenidos finales con archivos multimedia/errores cancelan las actualizaciones de vista previa pendientes antes de la
  entrega normal, en lugar de publicar una vista previa temporal.

### Matrix

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento
  de vista previa.
- Las respuestas finales que solo contienen archivos multimedia, contienen errores o no coinciden con el destino de respuesta cancelan las actualizaciones de vista previa
  pendientes antes de la entrega normal; se censura cualquier vista previa obsoleta que ya sea visible.

## Actualizaciones de vista previa del progreso de las herramientas

La transmisión de la vista previa también puede incluir actualizaciones del **progreso de las herramientas**: líneas breves
de estado como «buscando en la web», «leyendo el archivo» o «llamando a la herramienta» que aparecen
en el mismo mensaje de vista previa mientras se ejecutan las herramientas, antes de la respuesta final.
En el modo de servidor de aplicaciones de Codex, los mensajes de preámbulo/comentario de Codex usan esta misma
ruta de vista previa, por lo que las notas breves de progreso como «Estoy comprobando...» pueden transmitirse al
borrador editable sin formar parte de la respuesta final. Esto mantiene
visualmente activos los turnos de herramientas de varios pasos, en lugar de dejarlos en silencio entre la primera
vista previa del razonamiento y la respuesta final.

Las herramientas de larga duración pueden emitir progreso tipado antes de devolver el resultado. Por ejemplo,
`web_fetch` activa un temporizador de cinco segundos al iniciarse: si la obtención sigue
pendiente, la vista previa muestra `Fetching page content...`; si la obtención finaliza o
se cancela antes, no se emite ninguna línea de progreso. El resultado final posterior de la herramienta
se sigue entregando normalmente al modelo.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de las herramientas y
  las actualizaciones del preámbulo de Codex en la edición de la vista previa activa de forma predeterminada cuando la transmisión
  de la vista previa está activa. Microsoft Teams usa su transmisión nativa de progreso en
  chats personales.
- Telegram se distribuye con las actualizaciones de vista previa del progreso de las herramientas habilitadas desde
  `v2026.4.22`; mantenerlas habilitadas conserva ese comportamiento publicado.
- **Mattermost** integra la actividad de las herramientas en una publicación de vista previa en los modos `partial` y
  `progress`, o en una publicación de actividad de herramientas entre bloques de texto en el modo `block`
  (véase más arriba).
- Las ediciones del progreso de las herramientas siguen el modo activo de transmisión de la vista previa; se
  omiten cuando la transmisión de la vista previa es `off` o cuando la transmisión por bloques ha tomado el control
  del mensaje. En Telegram, `streaming.mode: "off"` es solo para el resultado final: el
  flujo genérico de mensajes de progreso también se suprime en lugar de entregarse como mensajes de estado
  independientes, mientras que las solicitudes de aprobación, los contenidos multimedia y los errores se siguen
  enrutando normalmente.
- Para mantener la transmisión de la vista previa pero ocultar las líneas de progreso de las herramientas, establezca
  `streaming.preview.toolProgress` en `false` para ese canal (valor predeterminado:
  `true`). Para mantener visibles las líneas de progreso de las herramientas mientras se oculta el texto de comandos/ejecución,
  establezca `streaming.preview.commandText` en `"status"` o
  `streaming.progress.commandText` en `"status"`; el valor predeterminado es `"raw"` para
  conservar el comportamiento publicado. Esta política se comparte entre los canales de borrador/progreso
  que usan el renderizador compacto de progreso de OpenClaw, incluidos Discord, Matrix,
  Microsoft Teams, Mattermost, las vistas previas de borrador de Slack y Telegram. Para deshabilitar
  por completo las ediciones de vista previa, establezca `streaming.mode` en `off`.

## Renderizado de borradores de progreso

Los borradores en modo de progreso (`streaming.progress.*`) tienen límites y se pueden configurar por
canal:

| Clave                             | Valor predeterminado | Comportamiento                                                        |
| --------------------------------- | -------------------- | --------------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Máximo de líneas compactas de progreso conservadas bajo la etiqueta del borrador |
| `streaming.progress.maxLineChars` | `120`         | Máximo de caracteres por línea compacta antes de truncarla (respetando palabras) |
| `streaming.progress.label`        | `"auto"`      | Título del borrador; una cadena personalizada o `false` para ocultarlo |
| `streaming.progress.labels`       | conjunto integrado | Etiquetas candidatas usadas cuando `label: "auto"`                     |

### Canal de progreso de comentarios

Además del progreso de las herramientas, el renderizador compacto de progreso puede mostrar un canal
adicional en el borrador:

- **`streaming.progress.commentary`**: renderiza el **comentario** previo a las herramientas
  del modelo (una narración breve como «Comprobaré... y después...») intercalado con
  las líneas de herramientas en el borrador de progreso. En Discord y Telegram, en modo de progreso,
  el mismo preámbulo proporciona el encabezado de estado incluso cuando este canal opcional
  está desactivado; los demás canales conservan su comportamiento de progreso existente. Consulte
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

## Temas relacionados

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor): diseño compartido de destino para vistas previas, edición, transmisión y finalización
- [Borradores de progreso](/es/concepts/progress-drafts): mensajes visibles de trabajo en curso que se actualizan durante turnos largos
- [Mensajes](/es/concepts/messages): ciclo de vida y entrega de los mensajes
- [Reintentos](/es/concepts/retry): comportamiento de los reintentos ante fallos de entrega
- [Canales](/es/channels): compatibilidad de transmisión por canal
