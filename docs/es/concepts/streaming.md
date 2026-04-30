---
read_when:
    - Explicación de cómo funcionan la transmisión o la fragmentación en los canales
    - Cambiar el comportamiento del streaming de bloques o de la fragmentación de canales
    - Depuración de respuestas de bloque duplicadas o prematuras, o de la transmisión de vista previa del canal
summary: Comportamiento de transmisión y fragmentación (respuestas en bloque, transmisión de vista previa del canal, asignación de modos)
title: Streaming y fragmentación
x-i18n:
    generated_at: "2026-04-30T05:39:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tiene dos capas de streaming separadas:

- **Streaming por bloques (canales):** emite **bloques** completados a medida que el asistente escribe. Son mensajes de canal normales (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal mientras se genera.

Actualmente **no hay streaming real de deltas de tokens** hacia mensajes de canal. El streaming de vista previa se basa en mensajes (envío + ediciones/anexos).

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
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (17 por defecto) divide respuestas altas para evitar recortes en la interfaz.

**Semántica de límites:**

- `text_end`: transmite bloques en cuanto el fragmentador emite; vacía en cada `text_end`.
- `message_end`: espera a que termine el mensaje del asistente y luego vacía la salida almacenada.

`message_end` sigue usando el fragmentador si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

### Entrega de medios con streaming por bloques

Las directivas `MEDIA:` son metadatos de entrega normales. Cuando el streaming por bloques envía un
bloque de medios antes de tiempo, OpenClaw recuerda esa entrega durante el turno. Si la carga final
del asistente repite la misma URL de medios, la entrega final elimina el medio
duplicado en lugar de volver a enviar el adjunto.

Las cargas finales exactamente duplicadas se suprimen. Si la carga final añade
texto distinto alrededor de medios que ya se transmitieron, OpenClaw sigue enviando el
texto nuevo mientras mantiene el medio con una sola entrega. Esto evita notas de voz
o archivos duplicados en canales como Telegram cuando un agente emite `MEDIA:` durante
el streaming y el proveedor también lo incluye en la respuesta completada.

## Algoritmo de fragmentación (límites bajo/alto)

La fragmentación por bloques la implementa `EmbeddedBlockChunker`:

- **Límite bajo:** no emite hasta que el búfer >= `minChars` (salvo que se fuerce).
- **Límite alto:** prefiere dividir antes de `maxChars`; si se fuerza, divide en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte duro.
- **Bloques de código:** nunca divide dentro de bloques; cuando se fuerza en `maxChars`, cierra + reabre el bloque para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, por lo que no se pueden superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming por bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloques consecutivos**
antes de enviarlos. Esto reduce el “spam de líneas sueltas” sin dejar de proporcionar
salida progresiva.

- La coalescencia espera **pausas de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vaciarán si lo superan.
- `minChars` evita enviar fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Hay sobrescrituras de canal disponibles mediante `*.blockStreamingCoalesce` (incluidas configuraciones por cuenta).
- El `minChars` de coalescencia predeterminado aumenta a 1500 para Signal/Slack/Discord salvo que se sobrescriba.

## Ritmo humano entre bloques

Cuando el streaming por bloques está habilitado, puedes añadir una **pausa aleatoria** entre
respuestas por bloques (después del primer bloque). Esto hace que las respuestas de varias burbujas se perciban
más naturales.

- Configuración: `agents.defaults.humanDelay` (sobrescritura por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a **respuestas por bloques**, no a respuestas finales ni resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto se asigna a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite sobre la marcha). Los canales que no son Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vacía una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming por bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota de canal:** El streaming por bloques está **desactivado salvo que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo
(`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de configuración: los valores predeterminados `blockStreaming*` se encuentran bajo
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: deshabilita el streaming de vista previa.
- `partial`: vista previa única que se reemplaza por el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

### Asignación de canales

| Canal      | `off` | `partial` | `block` | `progress`         |
| ---------- | ----- | --------- | ------- | ------------------ |
| Telegram   | ✅    | ✅        | ✅      | se asigna a `partial` |
| Discord    | ✅    | ✅        | ✅      | se asigna a `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                 |
| Mattermost | ✅    | ✅        | ✅      | ✅                 |

Solo Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativa de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado de hilo de asistente de Slack requieren un destino de hilo de respuesta; los MD de nivel superior no muestran esa vista previa con estilo de hilo.

Migración de claves heredadas:

- Telegram: los valores heredados `streamMode` y `streaming` escalares/booleanos se detectan y se migran mediante rutas de compatibilidad de doctor/config a `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano se migran automáticamente al enum `streaming`.
- Slack: `streamMode` se migra automáticamente a `streaming.mode`; `streaming` booleano se migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; `nativeStreaming` heredado se migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en tiempo de ejecución

Telegram:

- Usa `sendMessage` + actualizaciones de vista previa con `editMessageText` en MD y grupos/temas.
- Envía un mensaje final nuevo en lugar de editar en el mismo lugar cuando una vista previa ha estado visible durante aproximadamente un minuto, y luego limpia la vista previa para que la marca de tiempo de Telegram refleje la finalización de la respuesta.
- El streaming de vista previa se omite cuando el streaming por bloques de Telegram está habilitado explícitamente (para evitar doble streaming).
- `/reasoning stream` puede escribir razonamiento en la vista previa.

Discord:

- Usa envío + edición de mensajes de vista previa.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming por bloques de Discord está habilitado explícitamente.
- Las cargas finales de medios, errores y respuestas explícitas cancelan las vistas previas pendientes sin vaciar un borrador nuevo, y luego usan la entrega normal.

Slack:

- `partial` puede usar el streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador con estilo de anexado.
- `progress` usa texto de vista previa de estado y luego la respuesta final.
- El streaming de vista previa nativo y de borrador suprime las respuestas por bloques durante ese turno, por lo que una respuesta de Slack se transmite por una sola ruta de entrega.
- Las cargas finales de medios/errores y los finales de progreso no crean mensajes de borrador desechables; solo los finales de texto/bloque que pueden editar la vista previa vacían el texto de borrador pendiente.

Mattermost:

- Transmite pensamiento, actividad de herramientas y texto parcial de respuesta en una sola publicación de vista previa de borrador que se finaliza en el mismo lugar cuando la respuesta final se puede enviar con seguridad.
- Vuelve a enviar una publicación final nueva si la publicación de vista previa se eliminó o no está disponible de otro modo al finalizar.
- Las cargas finales de medios/errores cancelan las actualizaciones de vista previa pendientes antes de la entrega normal en lugar de vaciar una publicación de vista previa temporal.

Matrix:

- Las vistas previas de borrador se finalizan en el mismo lugar cuando el texto final puede reutilizar el evento de vista previa.
- Los finales solo de medios, de error y con discrepancia de destino de respuesta cancelan las actualizaciones de vista previa pendientes antes de la entrega normal; una vista previa obsoleta ya visible se redacta.

### Actualizaciones de vista previa de progreso de herramientas

El streaming de vista previa también puede incluir actualizaciones de **progreso de herramientas**: líneas de estado breves como "buscando en la web", "leyendo archivo" o "llamando herramienta", que aparecen en el mismo mensaje de vista previa mientras las herramientas se ejecutan, antes de la respuesta final. Esto mantiene los turnos de herramientas de varios pasos visualmente activos en lugar de silenciosos entre la primera vista previa de pensamiento y la respuesta final.

Superficies compatibles:

- **Discord**, **Slack**, **Telegram** y **Matrix** transmiten el progreso de herramientas en la edición de vista previa en vivo de forma predeterminada cuando el streaming de vista previa está activo.
- Telegram se ha publicado con actualizaciones de vista previa de progreso de herramientas habilitadas desde `v2026.4.22`; mantenerlas habilitadas preserva ese comportamiento publicado.
- **Mattermost** ya incorpora la actividad de herramientas en su única publicación de vista previa de borrador (ver arriba).
- Las ediciones de progreso de herramientas siguen el modo de streaming de vista previa activo; se omiten cuando el streaming de vista previa está `off` o cuando el streaming por bloques ha tomado el control del mensaje. En Telegram, `streaming.mode: "off"` es solo final: la charla genérica de progreso también se suprime en lugar de entregarse como mensajes independientes "Trabajando...", mientras que las solicitudes de aprobación, las cargas de medios y los errores siguen enrutándose normalmente.
- Para mantener el streaming de vista previa pero ocultar las líneas de progreso de herramientas, establece `streaming.preview.toolProgress` en `false` para ese canal. Para deshabilitar por completo las ediciones de vista previa, establece `streaming.mode` en `off`.

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

- [Mensajes](/es/concepts/messages) — ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) — comportamiento de reintento ante fallos de entrega
- [Canales](/es/channels) — compatibilidad de streaming por canal
