---
read_when:
    - Explicar cómo funciona el streaming o la fragmentación en los canales
    - Cambiar el comportamiento del streaming por bloques o la fragmentación del canal
    - Depurar respuestas por bloques duplicadas o tempranas, o el streaming de vista previa del canal
summary: Comportamiento de streaming + fragmentación (respuestas por bloques, streaming de vista previa del canal, mapeo de modos)
title: Streaming y fragmentación
x-i18n:
    generated_at: "2026-04-08T05:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8e847bb7da890818cd79dec7777f6ae488e6d6c0468e948e56b6b6c598e0000
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + fragmentación

OpenClaw tiene dos capas de streaming separadas:

- **Streaming por bloques (canales):** emite **bloques** completados a medida que el asistente escribe. Estos son mensajes normales del canal (no deltas de tokens).
- **Streaming de vista previa (Telegram/Discord/Slack):** actualiza un **mensaje de vista previa** temporal mientras se genera.

Hoy no existe **streaming real de deltas de tokens** hacia los mensajes del canal. El streaming de vista previa se basa en mensajes (envío + ediciones/anexos).

## Streaming por bloques (mensajes del canal)

El streaming por bloques envía la salida del asistente en fragmentos amplios a medida que está disponible.

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

- `text_delta/events`: eventos del stream del modelo (pueden ser escasos en modelos sin streaming).
- `chunker`: `EmbeddedBlockChunker` que aplica límites mínimos/máximos + preferencia de corte.
- `channel send`: mensajes salientes reales (respuestas por bloques).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (`on`/`off`) (desactivado por defecto).
- Anulaciones por canal: `*.blockStreaming` (y variantes por cuenta) para forzar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` o `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (fusiona bloques transmitidos antes del envío).
- Límite estricto del canal: `*.textChunkLimit` (por ejemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentación del canal: `*.chunkMode` (`length` por defecto, `newline` divide en líneas en blanco (límites de párrafo) antes de fragmentar por longitud).
- Límite flexible de Discord: `channels.discord.maxLinesPerMessage` (17 por defecto) divide respuestas altas para evitar recortes en la UI.

**Semántica de los límites:**

- `text_end`: transmite bloques en cuanto el chunker los emite; vacía en cada `text_end`.
- `message_end`: espera a que termine el mensaje del asistente y luego vacía la salida almacenada.

`message_end` sigue usando el chunker si el texto almacenado supera `maxChars`, por lo que puede emitir varios fragmentos al final.

## Algoritmo de fragmentación (límites inferior/superior)

La fragmentación por bloques se implementa con `EmbeddedBlockChunker`:

- **Límite inferior:** no emite hasta que el búfer sea >= `minChars` (salvo que se fuerce).
- **Límite superior:** prefiere cortes antes de `maxChars`; si se fuerza, corta en `maxChars`.
- **Preferencia de corte:** `paragraph` → `newline` → `sentence` → `whitespace` → corte forzado.
- **Bloques de código:** nunca divide dentro de bloques delimitados; cuando se fuerza en `maxChars`, cierra y vuelve a abrir el bloque para mantener Markdown válido.

`maxChars` se limita al `textChunkLimit` del canal, así que no puedes superar los límites por canal.

## Coalescencia (fusionar bloques transmitidos)

Cuando el streaming por bloques está habilitado, OpenClaw puede **fusionar fragmentos de bloques consecutivos**
antes de enviarlos. Esto reduce el “spam de una sola línea” y aun así proporciona
salida progresiva.

- La coalescencia espera **intervalos de inactividad** (`idleMs`) antes de vaciar.
- Los búferes están limitados por `maxChars` y se vaciarán si lo superan.
- `minChars` evita que se envíen fragmentos diminutos hasta que se acumule suficiente texto
  (el vaciado final siempre envía el texto restante).
- El separador se deriva de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espacio).
- Las anulaciones por canal están disponibles mediante `*.blockStreamingCoalesce` (incluidas las configuraciones por cuenta).
- El valor predeterminado de coalescencia para `minChars` se eleva a 1500 para Signal/Slack/Discord, salvo que se anule.

## Ritmo más humano entre bloques

Cuando el streaming por bloques está habilitado, puedes añadir una **pausa aleatoria** entre
respuestas por bloques (después del primer bloque). Esto hace que las respuestas en varias burbujas se sientan
más naturales.

- Configuración: `agents.defaults.humanDelay` (anulable por agente mediante `agents.list[].humanDelay`).
- Modos: `off` (predeterminado), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Se aplica solo a las **respuestas por bloques**, no a las respuestas finales ni a los resúmenes de herramientas.

## "Transmitir fragmentos o todo"

Esto corresponde a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir sobre la marcha). Los canales que no son Telegram también necesitan `*.blockStreaming: true`.
- **Transmitir todo al final:** `blockStreamingBreak: "message_end"` (vaciar una vez, posiblemente en varios fragmentos si es muy largo).
- **Sin streaming por bloques:** `blockStreamingDefault: "off"` (solo respuesta final).

**Nota del canal:** El streaming por bloques está **desactivado a menos que**
`*.blockStreaming` se establezca explícitamente en `true`. Los canales pueden transmitir una vista previa en vivo
(`channels.<channel>.streaming`) sin respuestas por bloques.

Recordatorio de ubicación de la configuración: los valores predeterminados `blockStreaming*` están en
`agents.defaults`, no en la configuración raíz.

## Modos de streaming de vista previa

Clave canónica: `channels.<channel>.streaming`

Modos:

- `off`: desactiva el streaming de vista previa.
- `partial`: una sola vista previa que se reemplaza con el texto más reciente.
- `block`: la vista previa se actualiza en pasos fragmentados/anexados.
- `progress`: vista previa de progreso/estado durante la generación, respuesta final al completarse.

### Mapeo por canal

| Canal    | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | se asigna a `partial` |
| Discord  | ✅    | ✅        | ✅      | se asigna a `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Solo en Slack:

- `channels.slack.streaming.nativeTransport` alterna las llamadas a la API de streaming nativa de Slack cuando `channels.slack.streaming.mode="partial"` (predeterminado: `true`).
- El streaming nativo de Slack y el estado del hilo del asistente de Slack requieren un destino de hilo de respuesta; los mensajes directos de nivel superior no muestran esa vista previa estilo hilo.

Migración de claves heredadas:

- Telegram: `streamMode` + booleano `streaming` migran automáticamente al enum `streaming`.
- Discord: `streamMode` + booleano `streaming` migran automáticamente al enum `streaming`.
- Slack: `streamMode` migra automáticamente a `streaming.mode`; el booleano `streaming` migra automáticamente a `streaming.mode` más `streaming.nativeTransport`; el valor heredado `nativeStreaming` migra automáticamente a `streaming.nativeTransport`.

### Comportamiento en tiempo de ejecución

Telegram:

- Usa actualizaciones de vista previa con `sendMessage` + `editMessageText` en mensajes directos y grupos/temas.
- El streaming de vista previa se omite cuando el streaming por bloques de Telegram está habilitado explícitamente (para evitar streaming doble).
- `/reasoning stream` puede escribir el razonamiento en la vista previa.

Discord:

- Usa mensajes de vista previa de envío + edición.
- El modo `block` usa fragmentación de borrador (`draftChunk`).
- El streaming de vista previa se omite cuando el streaming por bloques de Discord está habilitado explícitamente.

Slack:

- `partial` puede usar el streaming nativo de Slack (`chat.startStream`/`append`/`stop`) cuando está disponible.
- `block` usa vistas previas de borrador con estilo de anexado.
- `progress` usa texto de vista previa de estado y luego la respuesta final.

## Relacionado

- [Mensajes](/es/concepts/messages) — ciclo de vida y entrega de mensajes
- [Reintento](/es/concepts/retry) — comportamiento de reintento en caso de fallo de entrega
- [Canales](/es/channels) — soporte de streaming por canal
