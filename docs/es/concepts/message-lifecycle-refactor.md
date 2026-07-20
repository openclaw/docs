---
read_when:
    - Refactorización del comportamiento de envío o recepción del canal
    - Cambios en la recepción de canales, el despacho de respuestas, la cola de salida, la transmisión en streaming de vistas previas o las API de mensajes del SDK de plugins
    - Diseño de un nuevo plugin de canal que requiere envíos duraderos, confirmaciones de recepción, vistas previas, ediciones o reintentos
summary: 'Estado del ciclo de vida duradero de recepción y envío de mensajes: qué se publicó, qué cambió respecto al diseño original y qué sigue pendiente'
title: Refactorización del ciclo de vida de los mensajes
x-i18n:
    generated_at: "2026-07-20T00:49:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d21eda70b8be0de78677f4ff6d7547317112731d9e86a5bef58eac0268899818
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Esta página se originó como una propuesta de diseño con vistas al futuro. Desde entonces, el núcleo de ese
diseño se publicó en `src/channels/message/*` y en las subrutas públicas
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Para la
API actual, consulte [API de salida de canales](/es/plugins/sdk-channel-outbound) y
[API de entrada de canales](/es/plugins/sdk-channel-inbound). Esta página registra qué
se publicó, dónde se desvió la implementación del boceto original y qué
sigue pendiente.
</Note>

## Por qué se realizó esta refactorización

La pila de canales creció a partir de varias correcciones locales: ayudantes de entrada separados para cada
nivel de madurez (`runtime.channel.inbound.run` para adaptadores sencillos,
`runtime.channel.inbound.runPreparedReply` para los avanzados), ayudantes heredados de despacho de respuestas
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
transmisión de vistas previas específica de cada canal y durabilidad de la entrega final añadida a
las rutas existentes de cargas útiles de respuesta. Esta estructura generó demasiados conceptos públicos y
demasiados lugares donde la semántica de entrega podía divergir.

La deficiencia de fiabilidad que obligó a rediseñar el sistema:

```text
Actualización de sondeo de Telegram confirmada
  -> existe el texto final del asistente
  -> el proceso se reinicia antes de que sendMessage se complete correctamente
  -> se pierde la respuesta final
```

Invariante objetivo: una vez que el núcleo decide que debe existir un mensaje saliente visible,
la intención de envío debe ser duradera antes de intentar la llamada a la plataforma, y el
recibo de la plataforma debe confirmarse después de completarla correctamente. Esto proporciona una recuperación
de al menos una vez de forma predeterminada. El comportamiento de exactamente una vez solo existe cuando un adaptador demuestra
idempotencia nativa o concilia un intento con resultado desconocido tras el envío con el
estado de la plataforma antes de repetirlo.

## Qué se publicó

El dominio interno se encuentra en `src/channels/message/*`:

| Archivo                        | Responsabilidad                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Contratos de tipos de adaptador, contexto de envío, recibo e intención duradera                                                  |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch`: el contexto de envío duradero                             |
| `receive.ts`                | `createMessageReceiveContext`: máquina de estados de la política de confirmación de entrada                                                   |
| `live.ts`                   | Estado de vista previa en vivo y lógica para finalizar in situ o recurrir a una alternativa                                                        |
| `state.ts`                  | `classifyDurableSendRecoveryState`: clasificación de recuperación después de una interrupción                                    |
| `receipt.ts`                | Normaliza los resultados de envío de la plataforma en `MessageReceipt`                                                             |
| `capabilities.ts`           | Deriva de una carga útil las capacidades necesarias para una entrega final duradera                                                         |
| `contracts.ts`              | Verificación contractual de las capacidades declaradas por el adaptador                                                      |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound`: encapsula las funciones heredadas `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue`: cola duradera de eventos de entrada                                                          |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal`: registro de aceptación/pendiente/finalización/liberación para la deduplicación de entradas                  |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` y encapsuladores con nombres heredados                                                            |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, prefijo de respuesta y ayudantes de devolución de llamada de escritura                                             |

Superficie pública: `openclaw/plugin-sdk/channel-outbound` (ayudantes de envío/recibo/durabilidad/vista en vivo/pipeline de respuestas)
y `openclaw/plugin-sdk/channel-inbound` (contexto de entrada, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Consulte esas páginas para ver ejemplos de adaptadores, los nombres
de tipos actuales y las notas de migración; son la fuente de referencia para la estructura de la API,
no los bocetos siguientes.

### Contexto de envío

`withDurableMessageSendContext` proporciona al código del canal los pasos `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` y `fail` en torno a un mensaje
saliente. `sendDurableMessageBatch` es el encapsulador para el caso habitual: renderizar, enviar
y luego confirmar con `sent`/`suppressed`, o marcar como fallido si se produce un error.

`sendDurableMessageBatch` devuelve un resultado discriminado:

| Estado           | Significado                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | Se entregó al menos un mensaje visible de la plataforma                              |
| `suppressed`     | Ningún mensaje de la plataforma debe considerarse ausente (cancelado por un hook, ejecución de prueba, etc.) |
| `partial_failed` | Se entregó al menos un mensaje antes de que fallara una carga útil o un efecto secundario posterior      |
| `failed`         | No se generó ningún recibo de la plataforma                                                 |

La durabilidad es una de `required`, `best_effort` o `disabled`
(`MessageDurabilityPolicy` en `src/channels/message/types.ts`). `required`
falla de forma cerrada cuando no se puede escribir la intención duradera; `best_effort` continúa
con un envío directo cuando la persistencia no está disponible; `disabled` conserva el
comportamiento de envío directo anterior a la refactorización. Los ayudantes de compatibilidad heredados usan de forma predeterminada
`disabled` y no deducen `required` solo porque un canal tenga un adaptador
de salida genérico.

El límite que sigue siendo peligroso se encuentra después de que la llamada a la plataforma se complete correctamente y antes de que
se confirme el recibo. Si el proceso finaliza en ese punto, el núcleo no puede saber si el
mensaje de la plataforma existe, a menos que el adaptador declare `reconcileUnknownSend`.
Ese hook clasifica un envío interrumpido como `sent`, `not_sent` o
`unresolved`; solo `not_sent` permite repetirlo. Los canales sin conciliación
recurren al estado `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) y pueden optar por la repetición
de al menos una vez solo si los mensajes visibles duplicados son una contrapartida aceptable y documentada
para ese canal.

### Contexto de recepción

`createMessageReceiveContext` mantiene el estado de confirmación/rechazo de cada evento de entrada con una operación
idempotente `ack()` y una operación explícita `nack(error)`. La política de confirmación
(`ChannelMessageReceiveAckPolicy`) es una de las siguientes:

| Política                 | Momento de confirmación                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | El núcleo ha conservado suficientes metadatos de entrada para deduplicar o enrutar una nueva entrega                           |
| `after_agent_dispatch` | Se ha despachado la ejecución del agente                                                             |
| `after_durable_send`   | Se ha confirmado el envío saliente duradero de este turno                                             |
| `manual`               | El autor de la llamada controla explícitamente el momento de la confirmación (valor predeterminado para los adaptadores que no declaran una política) |

El sondeo de Telegram usa esto para conservar una marca de agua segura de actualizaciones completadas
(`safeCompletedUpdateId` en `extensions/telegram/src/bot-update-tracker.ts`):
grammY sigue observando cada actualización cuando entra en la cadena de middleware, pero
OpenClaw solo hace avanzar la marca de agua persistente de reinicio más allá de las actualizaciones que
completaron el despacho, por lo que las actualizaciones fallidas o aún pendientes se repiten después de un reinicio.
El desplazamiento `getUpdates` ascendente de Telegram sigue siendo responsabilidad de grammY; no se ha creado una
fuente de sondeo completamente duradera que controle la nueva entrega a nivel de plataforma más allá de esta
marca de agua (consulte Preguntas abiertas).

### Vista previa en vivo

`src/channels/message/live.ts` modela la vista previa, la edición y la finalización como un único ciclo de vida:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` y
`deliverFinalizableLivePreviewAdapter` (crear una edición final a partir de un borrador, aplicarla
y recurrir a un envío normal cuando la edición no sea posible o falle).
`LiveMessageState.phase` es `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` controla si una vista previa puede convertirse en el mensaje
final mediante una edición en lugar de un nuevo envío.

### Recibos duraderos

`MessageReceipt` (`src/channels/message/types.ts`) normaliza uno o varios
identificadores de mensajes de la plataforma de un único envío lógico en `platformMessageIds`, junto con
`parts` por cada parte (tipo, índice, id. del hilo, id. de la respuesta). Se conserva un identificador principal
para los hilos y las ediciones posteriores. Esto permite que las entregas de varias partes (texto
más contenido multimedia, texto fragmentado, alternativa de tarjeta) se puedan repetir y deduplicar después
de un reinicio.

### Reducción del SDK público

La refactorización incorporó o dejó obsoletos: `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, los ayudantes `reply-payload` expuestos como API
pública, `inbound-reply-dispatch`, `channel-reply-pipeline` y la mayoría de los usos públicos
de la antigua fachada de salida. `src/plugin-sdk/channel-message.ts` ahora es un
barrel de reexportación `@deprecated` que apunta a `channel-outbound` /
`channel-inbound`; se eliminaron los alias de tiempo de ejecución `channel.turn` y la antigua
página de documentación `/plugins/sdk-channel-turn` redirige a
[API de entrada de canales](/es/plugins/sdk-channel-inbound). El nuevo código de plugins debe
usar directamente `channel-outbound` y `channel-inbound`.

## Dónde se desvió la implementación del diseño original

El boceto de diseño siguiente nunca se publicó literalmente como se describe. Se conserva como registro
histórico; estos nombres de tipos no deben considerarse parte de la API actual.

- **No existen `MessageOrigin` / `shouldDropOpenClawEcho`.** El plan original proponía
  una etiqueta de origen `source: "openclaw"` en los mensajes de fallo del Gateway, además de un
  predicado compartido que descartara los ecos etiquetados escritos por bots en salas compartidas
  antes de la autorización `allowBots`. Ese tipo y ese predicado no existen en
  el código base. `allowBots` sí es una clave de configuración real de cada canal (Slack,
  Discord, Google Chat y otros), pero nunca se creó el mecanismo de etiquetado de origen que
  debía protegerla. La supresión de ecos de fallos del Gateway en
  salas con bots habilitados sigue siendo una deficiencia pendiente, no una garantía publicada.
- **No existe un espacio de nombres `core.messages.receive/send/live/state` unificado.** Las
  funciones publicadas se encuentran directamente en `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) en lugar de estar
  tras una fachada `core.messages.*`.
- **No existe un tipo de mensaje normalizado genérico `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  El núcleo sigue pasando cargas útiles de respuesta concretas
  (`ReplyPayload`) y contextos específicos del canal a través de los adaptadores de envío,
  en lugar de una única estructura de mensaje independiente de la plataforma con una relación `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Los nombres de las políticas de confirmación difieren del boceto.** Publicado:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  El boceto original usaba `immediate | after-record | after-durable-send |
manual` con un campo de motivo del tiempo de espera del Webhook; esa estructura no se creó.
- **Las claves de capacidad `DurableFinalDeliveryRequirementMap` reemplazaron el objeto
  `MessageCapabilities` del boceto.** Las capacidades son indicadores booleanos planos (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) verificados mediante `verifyDurableFinalCapabilityProofs`, en lugar de
  una estructura anidada del estilo `text.chunking` / `attachments.voice`.

## Riesgos concretos de la migración (aún relevantes)

Estos efectos secundarios específicos de cada canal son anteriores a la refactorización y deben seguir
funcionando mediante las nuevas rutas de envío. No son hipotéticos: todos están
implementados y son esenciales actualmente.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): el monitor registra los mensajes enviados en una caché
  de eco después de un envío correcto. Los envíos finales duraderos aún deben
  llenar esa caché, o OpenClaw puede volver a ingerir sus propias respuestas
  como mensajes entrantes del usuario.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): añade una firma opcional del
  modelo y registra los hilos en los que se ha participado después de las
  respuestas grupales. La entrega duradera no debe omitir esos efectos.
- **Discord y otros distribuidores preparados** ya gestionan la entrega directa y
  el comportamiento de la vista previa. Un canal no es duradero de extremo a
  extremo hasta que su distribuidor preparado enruta explícitamente los
  mensajes finales mediante el contexto de envío; no se debe suponer que el
  adaptador genérico por sí solo proporciona cobertura.
- La **entrega alternativa silenciosa de Telegram** debe entregar todo el
  arreglo de cargas útiles proyectadas, no solo la primera carga útil, después
  de la proyección de fragmentación/alternativa.
- **LINE, Zalo, Nostr** y rutas auxiliares similares pueden incluir la gestión
  de tokens de respuesta, el proxy de contenido multimedia, cachés de mensajes
  enviados u objetivos exclusivos de devolución de llamada. Permanecen bajo
  la entrega gestionada por el canal hasta que esas semánticas estén
  representadas por el adaptador de envío y cubiertas por pruebas.
- Los **auxiliares de mensajes directos** pueden tener una devolución de llamada
  de respuesta que sea el único objetivo de transporte correcto. El sistema
  saliente genérico no debe deducir un objetivo a partir de campos sin procesar
  de la plataforma y omitir esa devolución de llamada.

## Clasificación de fallos

Los adaptadores clasifican los fallos de transporte en categorías cerradas
del tipo `DeliveryFailureKind` (transitorio, límite de frecuencia, autenticación,
permiso, no encontrado, carga útil no válida, conflicto, cancelado,
desconocido). Política del núcleo:

- Reintentar los fallos transitorios y de límite de frecuencia.
- No reintentar los fallos de carga útil no válida, a menos que exista una alternativa de renderizado.
- No reintentar los fallos de autenticación o permisos hasta que cambie la configuración.
- En caso de no encontrado, permitir que la finalización en vivo pase de la edición a un envío nuevo cuando
  el canal declare que es seguro.
- En caso de conflicto, usar el estado de recepción/idempotencia para determinar si el mensaje
  ya existe.
- Cualquier error posterior a una llamada a la plataforma que puede haber tenido éxito, pero anterior a la
  confirmación de la recepción, se convierte en `unknown_after_send`, a menos que el adaptador demuestre que la
  operación de la plataforma no se produjo.

## Preguntas abiertas

- Si Telegram debería sustituir finalmente el ejecutor de sondeo de grammY (`1.43.0`)
  por una fuente de sondeo completamente duradera que controle la
  reentrega en la plataforma, no solo la marca de reinicio persistente de
  OpenClaw (`safeCompletedUpdateId`).
- Si el estado de la vista previa en vivo debería residir en el mismo registro que la intención
  de envío final o en un almacén de estado en vivo relacionado.
- Si la supresión de eco por fallos del Gateway en salas compartidas con bots habilitados necesita
  el mecanismo de etiquetado de origen previsto originalmente, un contrato
  por canal más sencillo o si queda fuera del alcance.
- Qué canales cuentan con compatibilidad nativa con el origen o los metadatos para la supresión
  de eco entre bots y cuáles necesitan un registro saliente persistente.

## Temas relacionados

- [Mensajes](/es/concepts/messages)
- [Transmisión y fragmentación](/es/concepts/streaming)
- [Borradores de progreso](/es/concepts/progress-drafts)
- [Política de reintentos](/es/concepts/retry)
- [API saliente de canales](/es/plugins/sdk-channel-outbound)
- [API entrante de canales](/es/plugins/sdk-channel-inbound)
