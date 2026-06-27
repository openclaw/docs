---
read_when:
    - Estás creando o refactorizando la ruta de envío de un Plugin de canal de mensajería
    - Necesitas entrega duradera de la respuesta final, confirmaciones de recepción, finalización de vista previa en vivo o una política de acuse de recibo.
    - Está migrando desde channel-message, channel-message-runtime o ayudantes heredados de despacho de respuestas
summary: 'API del ciclo de vida de mensajes salientes para plugins de canal: adaptadores, recibos, envíos duraderos, vista previa en vivo y auxiliares de canalización de respuestas'
title: API saliente del canal
x-i18n:
    generated_at: "2026-06-27T12:26:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9d2681c06ac808d7fe0218d1a48e6ba06ea5e80270816535d957782193e488f
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Los plugins de canal deben exponer el comportamiento de mensajes salientes desde
`openclaw/plugin-sdk/channel-outbound`. Usa
`openclaw/plugin-sdk/channel-inbound` para la orquestación de recepción/contexto/despacho.

El núcleo es responsable de las colas, la durabilidad, la política genérica de reintentos, los hooks, los recibos y la
herramienta compartida `message`. El plugin es responsable de las llamadas nativas de enviar/editar/eliminar, la
normalización del destino, los hilos de la plataforma, las citas seleccionadas, las marcas de notificación, el estado de la
cuenta y los efectos secundarios específicos de la plataforma.

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

Declara solo las capacidades que el transporte nativo realmente preserva. Cubre cada
capacidad declarada de envío, recibo, vista previa en vivo y confirmación de recepción con los
helpers de contrato exportados desde esta subruta.

## Adaptadores Salientes Existentes

Si el canal ya tiene un adaptador `outbound` compatible, deriva el adaptador de mensajes
en lugar de duplicar el código de envío:

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

## Envíos Duraderos

Los helpers de envío en runtime también viven en `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helpers de streaming/progreso de borradores como `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` devuelve un resultado explícito:

- `sent`: se entregó al menos un mensaje visible de la plataforma.
- `suppressed`: ningún mensaje de la plataforma debe tratarse como faltante.
- `partial_failed`: se entregó al menos un mensaje de la plataforma antes de que fallara un payload o efecto secundario posterior.
- `failed`: no se produjo ningún recibo de plataforma.

Usa `payloadOutcomes` cuando un lote mezcla payloads enviados, suprimidos y fallidos.
No infieras la cancelación de un hook a partir de un resultado vacío heredado de entrega directa.

## Despacho de Compatibilidad

El despacho de respuestas entrantes debe ensamblarse mediante
`dispatchChannelInboundReply(...)` desde `channel-inbound`. Mantén la entrega de la plataforma
en el adaptador de entrega; usa `channel-outbound` para adaptadores de mensajes,
envíos duraderos, recibos, vista previa en vivo y opciones de la canalización de respuestas.
