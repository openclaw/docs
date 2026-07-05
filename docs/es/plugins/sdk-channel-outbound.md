---
read_when:
    - Estás creando o refactorizando una ruta de envío de Plugin de canal de mensajería
    - Necesitas entrega duradera de respuestas finales, confirmaciones de recepción, finalización de vista previa en vivo o política de acuse de recibo
    - Estás migrando desde channel-message, channel-message-runtime o los ayudantes heredados de despacho de respuestas
summary: 'API de ciclo de vida de mensajes salientes para plugins de canal: adaptadores, confirmaciones, envíos duraderos, vista previa en vivo y helpers de canalización de respuestas'
title: API de salida del canal
x-i18n:
    generated_at: "2026-07-05T11:36:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d85846fcfbc8d2119794dff83c851a746f696ba8273b3d0c872377a429bfe8
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Los plugins de canal exponen el comportamiento de mensajes salientes desde
`openclaw/plugin-sdk/channel-outbound`. Usa
`openclaw/plugin-sdk/channel-inbound` para la orquestación de
recepción/contexto/despacho.

El núcleo es propietario de las colas, la durabilidad, la política genérica de reintentos, los hooks, los recibos y
la herramienta compartida `message`. El plugin es propietario de las llamadas nativas de enviar/editar/eliminar,
la normalización de destinos, los hilos de la plataforma, las citas seleccionadas, las marcas de notificación,
el estado de la cuenta y los efectos secundarios específicos de la plataforma.

## Adaptador

La mayoría de los plugins definen un adaptador `message`:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Declara solo las capacidades que el transporte nativo conserva realmente. Cubre
cada capacidad declarada de envío, recibo, vista previa en vivo y confirmación de recepción
con los helpers de contrato exportados desde esta subruta.

## Adaptadores salientes existentes

Si el canal ya tiene un adaptador `outbound` compatible, deriva el
adaptador de mensajes en lugar de duplicar el código de envío:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Envíos duraderos

Los helpers de envío en tiempo de ejecución también están en `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helpers de streaming/progreso de borradores como `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` devuelve un resultado explícito:

| Resultado        | Significado                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `sent`           | se entregó al menos un mensaje visible de la plataforma                                  |
| `suppressed`     | ningún mensaje de la plataforma debe tratarse como faltante                              |
| `partial_failed` | se entregó al menos un mensaje de la plataforma antes de que fallara una carga útil posterior o un efecto secundario |
| `failed`         | no se produjo ningún recibo de plataforma                                                |

Usa `payloadOutcomes` cuando un lote mezcla cargas útiles enviadas, suprimidas y fallidas.
No infieras la cancelación de hooks a partir de un resultado vacío heredado
de entrega directa.

## Despacho de compatibilidad

Ensambla el despacho de respuestas entrantes mediante `dispatchChannelInboundReply(...)`
desde `channel-inbound`. Mantén la entrega de plataforma en el adaptador de entrega; usa
`channel-outbound` para adaptadores de mensajes, envíos duraderos, recibos, vista previa en vivo
y opciones de la canalización de respuestas.
