---
read_when:
    - Refactorización del comportamiento de envío o recepción del canal
    - Cambiar la recepción de canales, el envío de respuestas, la cola de salida, la transmisión de vistas previas o las API de mensajes del SDK de plugins
    - Diseño de un nuevo plugin de canal que requiere envíos duraderos, confirmaciones de recepción, vistas previas, ediciones o reintentos
summary: 'Estado del ciclo de vida duradero de recepción y envío de mensajes: qué se publicó, qué cambió respecto al diseño original y qué queda pendiente'
title: Refactorización del ciclo de vida de los mensajes
x-i18n:
    generated_at: "2026-07-11T23:04:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Esta página se originó como una propuesta de diseño con vistas al futuro. Desde entonces, el núcleo de ese
diseño se implementó en `src/channels/message/*` y en las rutas secundarias públicas
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Para consultar la
API actual, use [API de salida de canales](/es/plugins/sdk-channel-outbound) y
[API de entrada de canales](/es/plugins/sdk-channel-inbound). Esta página registra qué
se implementó, dónde se apartó la implementación del boceto original y qué
sigue pendiente.
</Note>

## Por qué se realizó esta refactorización

La pila de canales surgió a partir de varias correcciones locales: ayudantes de entrada independientes para cada
nivel de madurez (`runtime.channel.inbound.run` para adaptadores sencillos,
`runtime.channel.inbound.runPreparedReply` para los más completos), ayudantes heredados de despacho de respuestas
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
transmisión en continuo de vistas previas específica de cada canal y durabilidad de la entrega final añadida
a las rutas existentes de cargas útiles de respuesta. Esa estructura generó demasiados conceptos públicos y
demasiados lugares donde la semántica de entrega podía divergir.

La carencia de fiabilidad que obligó al rediseño:

```text
Actualización del sondeo de Telegram confirmada
  -> existe el texto final del asistente
  -> el proceso se reinicia antes de que sendMessage se complete correctamente
  -> se pierde la respuesta final
```

Invariante objetivo: una vez que el núcleo decide que debe existir un mensaje saliente visible,
la intención de envío debe persistir antes de intentar la llamada a la plataforma, y el
acuse de recibo de la plataforma debe registrarse después de que esta se complete correctamente. Esto proporciona una recuperación
de al menos una vez de forma predeterminada. El comportamiento de exactamente una vez solo existe cuando un adaptador demuestra
idempotencia nativa o concilia un intento cuyo resultado se desconoce después del envío con el
estado de la plataforma antes de repetirlo.

## Qué se implementó

El dominio interno reside en `src/channels/message/*`:

| Archivo                     | Responsabilidad                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | Contratos de tipos del adaptador, el contexto de envío, el acuse de recibo y la intención persistente                       |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch`: el contexto de envío persistente                               |
| `receive.ts`                | `createMessageReceiveContext`: máquina de estados de la política de confirmación de entrada                                 |
| `live.ts`                   | Estado de la vista previa en directo y lógica para finalizar en el mismo lugar o usar una alternativa                       |
| `state.ts`                  | `classifyDurableSendRecoveryState`: clasificación de la recuperación tras una interrupción                                  |
| `receipt.ts`                | Normaliza los resultados de envío de la plataforma en `MessageReceipt`                                                      |
| `capabilities.ts`           | Deriva de una carga útil las capacidades requeridas para la entrega final persistente                                       |
| `contracts.ts`              | Verificación de las pruebas contractuales de las capacidades declaradas por el adaptador                                    |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                               |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound`: encapsula las funciones heredadas `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue`: cola persistente de eventos de entrada                                                         |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal`: registro de aceptación/pendiente/finalización/liberación para deduplicar entradas      |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` y contenedores con nombres heredados                                                          |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, prefijo de respuesta y ayudantes de devolución de llamada de escritura                        |

Superficie pública: `openclaw/plugin-sdk/channel-outbound` (ayudantes de envío/acuse de recibo/persistencia/en directo/canalización de respuestas)
y `openclaw/plugin-sdk/channel-inbound` (contexto de entrada, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Consulte esas páginas para ver ejemplos de adaptadores, los nombres
de tipos actuales y las notas de migración: son la fuente de referencia de la estructura de la API,
no los bocetos siguientes.

### Contexto de envío

`withDurableMessageSendContext` proporciona al código del canal los pasos `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` y `fail` en torno a un mensaje
saliente. `sendDurableMessageBatch` es el contenedor para el caso habitual: renderizar, enviar
y después confirmar con `sent`/`suppressed`, o marcar como fallido si se produce un error.

`sendDurableMessageBatch` devuelve uno de los siguientes resultados discriminados:

| Estado           | Significado                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `sent`           | Se entregó al menos un mensaje visible en la plataforma                                                          |
| `suppressed`     | Ningún mensaje de la plataforma debe considerarse ausente (cancelado por un enlace, simulación, etc.)             |
| `partial_failed` | Se entregó al menos un mensaje antes de que fallara una carga útil o un efecto secundario posterior               |
| `failed`         | No se generó ningún acuse de recibo de la plataforma                                                              |

La durabilidad puede ser `required`, `best_effort` o `disabled`
(`MessageDurabilityPolicy` en `src/channels/message/types.ts`). `required`
produce un fallo seguro cuando no se puede escribir la intención persistente; `best_effort` pasa
a un envío directo cuando la persistencia no está disponible; `disabled` conserva el
comportamiento de envío directo anterior a la refactorización. Los ayudantes de compatibilidad heredados usan
`disabled` de forma predeterminada y no deducen `required` solo porque un canal tenga un adaptador
de salida genérico.

El límite que sigue siendo peligroso se encuentra después de que la llamada a la plataforma se complete correctamente y antes
de confirmar el acuse de recibo. Si el proceso termina en ese punto, el núcleo no puede saber si el
mensaje existe en la plataforma, a menos que el adaptador declare `reconcileUnknownSend`.
Ese enlace clasifica un envío interrumpido como `sent`, `not_sent` o
`unresolved`; solo `not_sent` permite repetir el envío. Los canales sin conciliación
recurren al estado `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) y pueden optar por repetir el envío al menos una vez
solo si los mensajes visibles duplicados constituyen una contrapartida aceptable y documentada
para ese canal.

### Contexto de recepción

`createMessageReceiveContext` registra el estado de confirmación o rechazo de cada evento de entrada con una
función `ack()` idempotente y una función `nack(error)` explícita. La política de confirmación
(`ChannelMessageReceiveAckPolicy`) puede ser una de las siguientes:

| Política               | Confirma cuando                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `after_receive_record` | El núcleo ha conservado suficientes metadatos de entrada para deduplicar o enrutar una nueva entrega        |
| `after_agent_dispatch` | Se ha despachado la ejecución del agente                                                                    |
| `after_durable_send`   | Se ha confirmado el envío saliente persistente de este turno                                                |
| `manual`               | El invocador controla explícitamente el momento de la confirmación (valor predeterminado para adaptadores que no declaran una política) |

El sondeo de Telegram usa esto para conservar una marca de agua segura de actualizaciones completadas
(`safeCompletedUpdateId` en `extensions/telegram/src/bot-update-tracker.ts`):
grammY sigue observando cada actualización al entrar en la cadena de middleware, pero
OpenClaw solo hace avanzar la marca de agua de reinicio persistente más allá de las actualizaciones que
completaron el despacho, de modo que las actualizaciones fallidas o todavía pendientes se repiten después de un reinicio.
El desplazamiento `getUpdates` de nivel superior de Telegram sigue estando controlado por grammY; aún no se
ha creado una fuente de sondeo totalmente persistente que controle la repetición de entregas a nivel de plataforma más allá de esta
marca de agua (consulte Preguntas abiertas).

### Vista previa en directo

`src/channels/message/live.ts` modela la vista previa, la edición y la finalización como un único ciclo de vida:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` y
`deliverFinalizableLivePreviewAdapter` (crear una edición final a partir de un borrador, aplicarla
y recurrir a un envío normal cuando la edición no sea posible o falle).
`LiveMessageState.phase` es `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` determina si una vista previa puede convertirse en el mensaje
final mediante una edición en lugar de un nuevo envío.

### Acuses de recibo persistentes

`MessageReceipt` (`src/channels/message/types.ts`) normaliza uno o varios
identificadores de mensajes de la plataforma de un único envío lógico en `platformMessageIds`, además de
`parts` por cada parte (tipo, índice, identificador del hilo e identificador del mensaje al que se responde). Se conserva un identificador principal
para los hilos y las ediciones posteriores. Esto permite que las entregas de varias partes (texto
más contenido multimedia, texto fragmentado o una alternativa a una tarjeta) se puedan repetir y deduplicar después
de un reinicio.

### Reducción del SDK público

La refactorización absorbió o dejó obsoletos: `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, los ayudantes `reply-payload` expuestos como API
pública, `inbound-reply-dispatch`, `channel-reply-pipeline` y la mayoría de los usos públicos
de `outbound-runtime`. `src/plugin-sdk/channel-message.ts` es ahora un contenedor de reexportación
`@deprecated` que apunta a `channel-outbound` /
`channel-inbound`; se eliminaron los alias del entorno de ejecución `channel.turn` y la antigua
página de documentación `/plugins/sdk-channel-turn` redirige a
[API de entrada de canales](/es/plugins/sdk-channel-inbound). El código nuevo de plugins debe
usar directamente `channel-outbound` y `channel-inbound`.

## Dónde se apartó la implementación del diseño original

El boceto de diseño que aparece a continuación nunca se implementó literalmente como se describía. Se conserva como registro para
mantener la precisión histórica; no considere estos nombres de tipos como parte de la API actual.

- **No existen `MessageOrigin` ni `shouldDropOpenClawEcho`.** El plan original contemplaba
  una etiqueta de origen `source: "openclaw"` en los mensajes de fallo del Gateway, además de un
  predicado compartido que descartara los ecos etiquetados y generados por bots en salas compartidas
  antes de la autorización de `allowBots`. Ese tipo y ese predicado no existen en
  el código base. `allowBots` sí es una clave de configuración real por canal (Slack,
  Discord, Google Chat y otros), pero nunca se creó el mecanismo de etiquetado de origen que
  debía protegerla. La supresión de ecos de fallos del Gateway en
  salas que permiten bots sigue siendo una carencia pendiente, no una garantía implementada.
- **No existe un espacio de nombres unificado `core.messages.receive/send/live/state`.** Las
  funciones implementadas se encuentran directamente en `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) en lugar de
  estar detrás de una fachada `core.messages.*`.
- **No existe un tipo de mensaje normalizado y genérico `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  El núcleo sigue pasando cargas útiles de respuesta concretas
  (`ReplyPayload`) y contextos específicos del canal a través de los adaptadores de envío,
  en lugar de una única estructura de mensaje independiente de la plataforma con una relación `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Los nombres de las políticas de confirmación difieren del boceto.** Implementados:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  El boceto original usaba `immediate | after-record | after-durable-send |
manual` con un campo para el motivo del tiempo de espera del Webhook; esa estructura no se creó.
- **Las claves de capacidad de `DurableFinalDeliveryRequirementMap` sustituyeron al objeto
  `MessageCapabilities` del boceto.** Las capacidades son indicadores booleanos planos (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) que se verifican mediante `verifyDurableFinalCapabilityProofs`, en lugar
  de una estructura anidada al estilo `text.chunking` / `attachments.voice`.

## Riesgos concretos de la migración (aún relevantes)

Estos efectos secundarios específicos de cada canal son anteriores a la refactorización y deben seguir
funcionando mediante las nuevas rutas de envío. No son hipotéticos: cada uno está
implementado y es esencial actualmente.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): el monitor registra los mensajes enviados en una caché
  de eco después de un envío correcto. Los envíos finales duraderos deben seguir alimentando esa
  caché; de lo contrario, OpenClaw puede volver a ingerir sus propias respuestas como mensajes entrantes del usuario.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): añade una firma opcional del modelo
  y registra los hilos en los que se participó después de las respuestas grupales. La entrega
  duradera no debe omitir esos efectos.
- **Discord y otros despachadores preparados** ya gestionan la entrega directa y
  el comportamiento de las vistas previas. Un canal no es duradero de extremo a extremo hasta que su despachador
  preparado enruta explícitamente los envíos finales mediante el contexto de envío; no dé por sentada
  la cobertura proporcionada únicamente por el adaptador genérico.
- **La entrega alternativa silenciosa de Telegram** debe entregar todo el arreglo de cargas
  proyectadas, no solo la primera carga, después de la segmentación/proyección
  alternativa.
- **LINE, Zalo, Nostr** y rutas auxiliares similares pueden gestionar tokens de
  respuesta, retransmisión de contenido multimedia, cachés de mensajes enviados u objetivos exclusivos de callbacks.
  Permanecen bajo la entrega gestionada por el canal hasta que esas semánticas estén representadas por
  el adaptador de envío y cubiertas por pruebas.
- **Los auxiliares de mensajes directos** pueden tener un callback de respuesta que sea el único
  destino de transporte correcto. El envío saliente genérico no debe inferir un destino a partir de
  campos sin procesar de la plataforma ni omitir ese callback.

## Clasificación de fallos

Los adaptadores clasifican los fallos de transporte en categorías cerradas al estilo de
`DeliveryFailureKind` (transitorio, límite de frecuencia, autenticación, permiso, no encontrado, carga
no válida, conflicto, cancelado, desconocido). Política del núcleo:

- Reintentar los fallos transitorios y por límite de frecuencia.
- No reintentar los fallos de carga no válida, salvo que exista una alternativa de renderizado.
- No reintentar los fallos de autenticación o permisos hasta que cambie la configuración.
- Si no se encuentra, permitir que la finalización en vivo recurra de la edición a un envío nuevo cuando
  el canal declare que es seguro.
- En caso de conflicto, usar el estado del recibo y de idempotencia para decidir si el mensaje
  ya existe.
- Cualquier error que se produzca después de que la llamada a la plataforma pueda haber tenido éxito, pero antes de confirmar
  el recibo, se convierte en `unknown_after_send`, salvo que el adaptador demuestre que la operación
  en la plataforma no se realizó.

## Preguntas abiertas

- Si Telegram debería sustituir finalmente el ejecutor de sondeo de grammY (`1.43.0`)
  por una fuente de sondeo totalmente duradera que controle la reentrega a nivel de
  plataforma, no solo la marca de agua persistente de reinicio de OpenClaw
  (`safeCompletedUpdateId`).
- Si el estado de la vista previa en vivo debería residir en el mismo registro que la intención de
  envío final o en un almacén de estado en vivo relacionado.
- Si la supresión de eco por fallos del Gateway en salas compartidas con bots habilitados necesita
  el mecanismo de etiquetado de origen previsto originalmente, un contrato más sencillo por
  canal o queda fuera del alcance.
- Qué canales admiten de forma nativa el origen o los metadatos para suprimir el eco
  entre bots y cuáles necesitan un registro persistente de envíos salientes.

## Temas relacionados

- [Mensajes](/es/concepts/messages)
- [Transmisión y segmentación](/es/concepts/streaming)
- [Borradores de progreso](/es/concepts/progress-drafts)
- [Política de reintentos](/es/concepts/retry)
- [API de salida de canales](/es/plugins/sdk-channel-outbound)
- [API de entrada de canales](/es/plugins/sdk-channel-inbound)
