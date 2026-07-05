---
read_when:
    - Refactorizar el comportamiento de envío o recepción del canal
    - Cambiar la entrada del canal, el despacho de respuestas, la cola de salida, el streaming de vistas previas o las API de mensajes del SDK de Plugin
    - Diseñar un nuevo plugin de canal que necesite envíos duraderos, confirmaciones de recepción, vistas previas, ediciones o reintentos
summary: 'Estado del ciclo de vida durable de recepción/envío de mensajes: qué se lanzó, qué cambió respecto del diseño original y qué queda pendiente'
title: Refactorización del ciclo de vida de los mensajes
x-i18n:
    generated_at: "2026-07-05T11:14:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Esta página se originó como una propuesta de diseño con visión de futuro. El núcleo de ese
diseño ya se lanzó en `src/channels/message/*` y en las subrutas públicas
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Para la
API actual, usa [API de salida de canal](/es/plugins/sdk-channel-outbound) y
[API de entrada de canal](/es/plugins/sdk-channel-inbound). Esta página registra lo que
se lanzó, dónde la implementación se desvió del boceto original y qué
sigue abierto.
</Note>

## Por qué ocurrió esta refactorización

La pila de canales creció a partir de varias correcciones locales: helpers de entrada separados por
nivel de madurez (`runtime.channel.inbound.run` para adaptadores simples,
`runtime.channel.inbound.runPreparedReply` para los enriquecidos), helpers heredados de despacho de respuestas
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
streaming de vista previa específico de canal y durabilidad de entrega final añadida
sobre rutas existentes de carga útil de respuesta. Esa forma produjo demasiados conceptos públicos y
demasiados lugares donde la semántica de entrega podía divergir.

La brecha de fiabilidad que obligó al rediseño:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

Invariante objetivo: una vez que el núcleo decide que debe existir un mensaje saliente visible,
la intención de envío debe ser duradera antes de intentar la llamada a la plataforma, y el
recibo de la plataforma debe confirmarse después del éxito. Eso da recuperación al menos una vez
por defecto. El comportamiento exactamente una vez solo existe cuando un adaptador demuestra
idempotencia nativa o reconcilia un intento desconocido después del envío contra el
estado de la plataforma antes de reproducirlo.

## Qué se lanzó

El dominio interno vive en `src/channels/message/*`:

| Archivo                     | Responsabilidad                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Contratos de tipos de adaptador, contexto de envío, recibo e intención duradera                                    |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — el contexto de envío duradero                       |
| `receive.ts`                | `createMessageReceiveContext` — máquina de estados de política de ack de entrada                                  |
| `live.ts`                   | Estado de vista previa en vivo y lógica de finalizar en el lugar o recurrir a alternativa                         |
| `state.ts`                  | `classifyDurableSendRecoveryState` — clasificación de recuperación tras una interrupción                          |
| `receipt.ts`                | Normaliza resultados de envío de la plataforma en `MessageReceipt`                                                |
| `capabilities.ts`           | Deriva las capacidades finales duraderas requeridas a partir de una carga útil                                    |
| `contracts.ts`              | Verificación de prueba contractual para capacidades declaradas del adaptador                                      |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — envuelve funciones heredadas `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — cola duradera de eventos de entrada                                                 |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — diario de aceptar/pendiente/completar/liberar para deduplicación de entrada |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` y envoltorios con nombres heredados                                                 |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, helpers de prefijo de respuesta y callback de escritura                             |

Superficie pública: `openclaw/plugin-sdk/channel-outbound` (helpers de envío/recibo/duradero/en vivo/pipeline de respuestas)
y `openclaw/plugin-sdk/channel-inbound` (contexto de entrada, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Consulta esas páginas para ejemplos de adaptadores, nombres de tipos actuales
y notas de migración: son la fuente de verdad para la forma de la API,
no los bocetos siguientes.

### Contexto de envío

`withDurableMessageSendContext` da al código de canal pasos `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` y `fail` alrededor de un mensaje
saliente. `sendDurableMessageBatch` es el envoltorio para el caso común: renderizar, enviar
y luego confirmar en `sent`/`suppressed` o fallar en caso de error.

`sendDurableMessageBatch` devuelve un resultado discriminado:

| Estado           | Significado                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | Se entregó al menos un mensaje visible de plataforma                             |
| `suppressed`     | Ningún mensaje de plataforma debe tratarse como faltante (cancelado por hook, ejecución de prueba, etc.) |
| `partial_failed` | Al menos un mensaje se entregó antes de que fallara una carga útil posterior o un efecto secundario |
| `failed`         | No se produjo ningún recibo de plataforma                                        |

La durabilidad es una de `required`, `best_effort` o `disabled`
(`MessageDurabilityPolicy` en `src/channels/message/types.ts`). `required`
falla cerrado cuando la intención duradera no puede escribirse; `best_effort` continúa
con un envío directo cuando la persistencia no está disponible; `disabled` mantiene el
comportamiento de envío directo previo a la refactorización. Los helpers de compatibilidad heredados usan
`disabled` por defecto y no infieren `required` solo porque un canal tenga un adaptador
saliente genérico.

El límite que sigue siendo peligroso: después de que la llamada a la plataforma tenga éxito y antes
de que se confirme el recibo. Si el proceso muere ahí, el núcleo no puede saber si el
mensaje de plataforma existe a menos que el adaptador declare `reconcileUnknownSend`.
Ese hook clasifica un envío interrumpido como `sent`, `not_sent` o
`unresolved`; solo `not_sent` permite la reproducción. Los canales sin reconciliación
vuelven al estado `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) y pueden elegir reproducción al menos una vez
solo si los mensajes visibles duplicados son una compensación aceptable y documentada
para ese canal.

### Contexto de recepción

`createMessageReceiveContext` rastrea el estado de ack/nack por evento de entrada con un
`ack()` idempotente y un `nack(error)` explícito. La política de ack
(`ChannelMessageReceiveAckPolicy`) es una de:

| Política              | Hace ack cuando                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | El núcleo persistió suficientes metadatos de entrada para deduplicar/enrutar una reentrega   |
| `after_agent_dispatch` | La ejecución del agente se ha despachado                                                     |
| `after_durable_send`   | El envío saliente duradero de este turno se confirmó                                         |
| `manual`               | El llamador controla explícitamente el momento del ack (el valor por defecto para adaptadores que no declaran una política) |

El sondeo de Telegram usa esto para persistir una marca de agua de actualización completada segura
(`safeCompletedUpdateId` en `extensions/telegram/src/bot-update-tracker.ts`):
grammY sigue observando cada actualización cuando entra en la cadena de middleware, pero
OpenClaw solo avanza la marca de agua persistida de reinicio más allá de las actualizaciones que
terminaron el despacho, de modo que las actualizaciones fallidas o aún pendientes se reproducen tras un reinicio.
El desplazamiento `getUpdates` ascendente de Telegram sigue siendo propiedad de grammY; una fuente de sondeo
completamente duradera que controle la reentrega a nivel de plataforma más allá de esta
marca de agua no está construida (consulta Preguntas abiertas).

### Vista previa en vivo

`src/channels/message/live.ts` modela vista previa/edición/finalización como un único ciclo de vida:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` y
`deliverFinalizableLivePreviewAdapter` (construye una edición final desde un borrador, la aplica
y recurre a un envío normal cuando la edición no es posible o falla).
`LiveMessageState.phase` es `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` controla si una vista previa puede convertirse en el mensaje final
mediante edición en lugar de un envío nuevo.

### Recibos duraderos

`MessageReceipt` (`src/channels/message/types.ts`) normaliza uno o más
ids de mensaje de plataforma de un único envío lógico en `platformMessageIds` más
`parts` por parte (tipo, índice, id de hilo, id de respuesta a). Se conserva un id primario
para el enhebrado y ediciones posteriores. Esto es lo que hace que las entregas de varias partes (texto
más multimedia, texto fragmentado, alternativa de tarjeta) sean reproducibles y deduplicables después
de un reinicio.

### Reducción del SDK público

La refactorización absorbió o dejó obsoletos: `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, helpers `reply-payload` expuestos como API pública,
`inbound-reply-dispatch`, `channel-reply-pipeline` y la mayoría de usos públicos
de `outbound-runtime`. `src/plugin-sdk/channel-message.ts` ahora es un barril de reexportación
`@deprecated` que apunta a `channel-outbound` /
`channel-inbound`; se eliminaron los alias de runtime `channel.turn` y la antigua
página de documentación `/plugins/sdk-channel-turn` redirige a
[API de entrada de canal](/es/plugins/sdk-channel-inbound). El nuevo código de Plugin debe
apuntar directamente a `channel-outbound` y `channel-inbound`.

## Dónde la implementación se desvió del diseño original

El boceto de diseño siguiente nunca se lanzó literalmente como se describió. Registro conservado por
precisión histórica; no trates estos nombres de tipos como la API actual.

- **Sin `MessageOrigin` / `shouldDropOpenClawEcho`.** El plan original pedía
  una etiqueta de origen `source: "openclaw"` en los mensajes de fallo de Gateway más un
  predicado compartido que descartara ecos etiquetados escritos por el bot en salas compartidas
  antes de la autorización `allowBots`. Ese tipo y predicado no existen en
  el código base. `allowBots` sí es una clave de configuración real por canal (Slack,
  Discord, Google Chat y otros), pero el mecanismo de etiquetado de origen que debía
  protegerla nunca se construyó. La supresión de ecos de fallo de Gateway en
  salas con bots habilitados sigue siendo una brecha abierta, no una garantía lanzada.
- **Sin espacio de nombres unificado `core.messages.receive/send/live/state`.** Las
  funciones lanzadas viven directamente en `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) en lugar de
  detrás de una fachada `core.messages.*`.
- **Sin tipo de mensaje normalizado genérico `ChannelMessage` / `MessageTarget` / `MessageRelation`.** El núcleo sigue pasando cargas útiles de respuesta concretas
  (`ReplyPayload`) y contextos específicos de canal a través de los adaptadores de envío
  en lugar de una única forma de mensaje neutral respecto a la plataforma con una relación `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Los nombres de política de ack difieren del boceto.** Lanzado:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  El boceto original usaba `immediate | after-record | after-durable-send |
manual` con un campo de razón de tiempo de espera de Webhook; esa forma no se construyó.
- **Las claves de capacidad `DurableFinalDeliveryRequirementMap` reemplazaron el objeto esbozado
  `MessageCapabilities`.** Las capacidades son marcas booleanas planas (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) verificadas mediante `verifyDurableFinalCapabilityProofs` en lugar
  de una estructura anidada estilo `text.chunking` / `attachments.voice`.

## Riesgos concretos de migración (aún relevantes)

Estos efectos secundarios específicos del canal son anteriores a la refactorización y deben seguir
funcionando a través de las nuevas rutas de envío. No son hipotéticos: cada uno está
implementado y es crítico hoy.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): el monitor registra los mensajes enviados en una caché de eco
  después de un envío correcto. Los envíos finales duraderos aún deben rellenar esa
  caché, o OpenClaw puede volver a ingerir sus propias respuestas como mensajes de usuario entrantes.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): agrega una firma de modelo opcional
  y registra los hilos en los que participó después de las respuestas de grupo. La entrega
  duradera no debe omitir esos efectos.
- **Discord y otros despachadores preparados** ya son dueños de la entrega directa y
  del comportamiento de vista previa. Un canal no es duradero de extremo a extremo hasta que su despachador
  preparado enruta explícitamente los finales a través del contexto de envío; no asuma
  cobertura solo por el adaptador genérico.
- **La entrega de respaldo silenciosa de Telegram** debe entregar todo el arreglo de cargas útiles
  proyectadas, no solo la primera carga útil, después de la fragmentación/proyección
  de respaldo.
- **LINE, Zalo, Nostr**, y rutas auxiliares similares pueden tener gestión de tokens
  de respuesta, proxy de medios, cachés de mensajes enviados u objetivos solo de callback.
  Permanecen en la entrega propiedad del canal hasta que esas semánticas estén representadas por
  el adaptador de envío y cubiertas por pruebas.
- **Los auxiliares de DM directo** pueden tener un callback de respuesta que es el único
  objetivo de transporte correcto. La salida genérica no debe adivinar un objetivo a partir de
  campos sin procesar de la plataforma y omitir ese callback.

## Clasificación de fallos

Los adaptadores clasifican los fallos de transporte en categorías cerradas de estilo
`DeliveryFailureKind` (transitorio, límite de tasa, autenticación, permiso, no encontrado,
carga útil no válida, conflicto, cancelado, desconocido). Política del núcleo:

- Reintentar fallos transitorios y de límite de tasa.
- No reintentar fallos de carga útil no válida salvo que exista un respaldo de renderizado.
- No reintentar fallos de autenticación o permiso hasta que cambie la configuración.
- En no encontrado, permita que la finalización en vivo recurra de edición a un envío nuevo cuando
  el canal declare que es seguro.
- En conflicto, use el estado de recibo/idempotencia para decidir si el mensaje
  ya existe.
- Cualquier error después de la llamada a la plataforma puede haber tenido éxito, pero antes de que la
  confirmación del recibo se convierte en `unknown_after_send` salvo que el adaptador demuestre que la operación
  de la plataforma no ocurrió.

## Preguntas abiertas

- Si Telegram debería reemplazar eventualmente el ejecutor de sondeo de grammY (`1.43.0`)
  por una fuente de sondeo completamente duradera que controle la reentrega a nivel de plataforma,
  no solo la marca de agua de reinicio persistida de OpenClaw
  (`safeCompletedUpdateId`).
- Si el estado de vista previa en vivo debería vivir en el mismo registro que la intención de envío
  final o en un almacén de estado en vivo hermano.
- Si la supresión de eco por fallo de Gateway en salas compartidas con bots habilitados necesita
  el mecanismo de etiquetado de origen planificado originalmente, un contrato por canal más simple,
  o está fuera de alcance.
- Qué canales tienen soporte nativo de origen/metadatos para la supresión de eco entre bots
  frente a necesitar un registro saliente persistido.

## Relacionado

- [Mensajes](/es/concepts/messages)
- [Streaming y fragmentación](/es/concepts/streaming)
- [Borradores de progreso](/es/concepts/progress-drafts)
- [Política de reintentos](/es/concepts/retry)
- [API saliente de canal](/es/plugins/sdk-channel-outbound)
- [API entrante de canal](/es/plugins/sdk-channel-inbound)
