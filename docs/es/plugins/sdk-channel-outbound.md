---
read_when:
    - Estás creando o refactorizando una ruta de envío de plugin de canal de mensajería
    - Necesita una entrega duradera de la respuesta final, recibos, finalización de la vista previa en vivo o una política de confirmación de recepción
    - Estás migrando desde channel-message, channel-message-runtime o asistentes heredados de despacho de respuestas.
summary: 'API de ciclo de vida de mensajes salientes para plugins de canal: adaptadores, recibos, envíos duraderos, vista previa en vivo y helpers de canalización de respuestas'
title: API saliente del canal
x-i18n:
    generated_at: "2026-07-06T10:50:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dea22c6a8de9a90a9ea182b18d922711e332efcd97ff429c7bc95d5807a7d1ad
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Los plugins de canal exponen el comportamiento de mensajes salientes desde
`openclaw/plugin-sdk/channel-outbound`. Usa
`openclaw/plugin-sdk/channel-inbound` para la orquestación de
recepción/contexto/despacho.

El núcleo es propietario de las colas, la durabilidad, la política genérica
de reintentos, los hooks, los recibos y la herramienta `message` compartida.
El plugin es propietario de las llamadas nativas de enviar/editar/eliminar,
la normalización de destinos, los hilos de plataforma, las citas seleccionadas,
las marcas de notificación, el estado de la cuenta y los efectos secundarios
específicos de la plataforma.

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

Declara solo las capacidades que el transporte nativo realmente conserva. Cubre
cada capacidad declarada de envío, recibo, vista previa en vivo y acuse de
recepción con los helpers de contrato exportados desde esta subruta.

## Evidencia de entrega

Un `MessageReceipt` registra el resultado devuelto por un adaptador de canal. Los
identificadores concretos de mensajes de la plataforma muestran que la ruta de
envío de la plataforma aceptó el mensaje; no prueban que el dispositivo de un
destinatario lo haya mostrado o leído. Los recibos sin identificadores de
mensajes de la plataforma son solo metadatos de recibo locales.
Los canales con recibos de lectura o estado de entrega en dispositivo deben
registrar esos datos mediante una ruta separada específica del canal.

## Adaptadores salientes existentes

Si el canal ya tiene un adaptador `outbound` compatible, deriva el adaptador de
mensajes en lugar de duplicar el código de envío:

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

Los helpers de envío en tiempo de ejecución también viven en `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helpers de streaming/progreso de borradores, como `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` devuelve un resultado explícito:

| Resultado        | Significado                                                                            |
| ---------------- | -------------------------------------------------------------------------------------- |
| `sent`           | al menos un mensaje visible de la plataforma fue aceptado por la ruta de envío de la plataforma |
| `suppressed`     | ningún mensaje de la plataforma debe tratarse como faltante                             |
| `partial_failed` | al menos un mensaje de la plataforma fue aceptado antes de que fallara una carga útil o un efecto secundario posterior |
| `failed`         | no se produjo ningún recibo de la plataforma                                            |

Usa `payloadOutcomes` cuando un lote mezcla cargas útiles enviadas, suprimidas
y fallidas. No infieras la cancelación de hooks a partir de un resultado
heredado vacío de entrega directa.

## Despacho de compatibilidad

Ensambla el despacho de respuestas entrantes mediante `dispatchChannelInboundReply(...)`
desde `channel-inbound`. Mantén la entrega de plataforma en el adaptador de entrega; usa
`channel-outbound` para adaptadores de mensajes, envíos duraderos, recibos, vista
previa en vivo y opciones de la canalización de respuestas.
