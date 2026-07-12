---
read_when:
    - Está creando o refactorizando la ruta de envío de un plugin de canal de mensajería
    - Necesita una entrega duradera de la respuesta final, confirmaciones de recepción, finalización de la vista previa en directo o una política de acuse de recibo.
    - Está migrando desde los auxiliares de envío de respuestas heredados, channel-message o channel-message-runtime
summary: 'API del ciclo de vida de los mensajes salientes para plugins de canal: adaptadores, confirmaciones de recepción, envíos duraderos, vista previa en tiempo real y auxiliares de la canalización de respuestas'
title: API de salida del canal
x-i18n:
    generated_at: "2026-07-12T14:45:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Los plugins de canal exponen el comportamiento de los mensajes salientes desde
`openclaw/plugin-sdk/channel-outbound`. Use
`openclaw/plugin-sdk/channel-inbound` para la orquestación de
recepción/contexto/despacho.

El núcleo se encarga de las colas, la durabilidad, la política genérica de reintentos, los hooks, los acuses y
la herramienta compartida `message`. El plugin se encarga de las llamadas nativas para enviar/editar/eliminar,
la normalización del destino, los hilos de la plataforma, las citas seleccionadas, las marcas de notificación,
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

Declare únicamente las capacidades que el transporte nativo conserva realmente. Cubra
cada capacidad declarada de envío, acuse, vista previa en vivo y acuse de recepción con
los auxiliares de contrato exportados desde esta subruta.

## Saneamiento de texto sin formato

Use `sanitizeForPlainText(...)` cuando un adaptador saliente necesite convertir las
etiquetas de formato HTML compatibles en marcado de texto ligero. De forma predeterminada, se conservan
los marcadores existentes de negrita y tachado con estilo de chat. Pase
`{ style: "markdown" }` únicamente cuando el canal vuelva a analizar el resultado como Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

El estilo Markdown usa `**bold**` y `~~strikethrough~~`; la cursiva y el código en línea
conservan los marcadores `_italic_` y de acento grave en ambos estilos. Seleccione el estilo en
el límite del canal en lugar de reescribir el texto de los marcadores después del saneamiento.

## Evidencia de entrega

Un `MessageReceipt` registra el resultado devuelto por un adaptador de canal. Los identificadores
concretos de mensajes de la plataforma muestran que la ruta de envío de la plataforma aceptó el
mensaje; no demuestran que el dispositivo de un destinatario lo haya mostrado o leído.
Los acuses sin identificadores de mensajes de la plataforma son únicamente metadatos de acuse locales.
Los canales con confirmaciones de lectura o estado de entrega al dispositivo deben registrar esos datos
mediante una ruta independiente y específica del canal.

Si un adaptador de canal puede demostrar que reintentar un fallo no puede duplicar un
envío visible para el destinatario y que no se inició ninguna llamada capaz de finalizarlo, lance
`new PlatformMessageNotDispatchedError("...", { cause: error })` desde
`openclaw/plugin-sdk/error-runtime`. El núcleo puede entonces borrar la evidencia obsoleta del intento
de envío y reintentar de forma segura la intención en cola. Solo el adaptador que controla el
límite final de despacho puede realizar esta afirmación. Nunca use el marcador después de que una
llamada de finalización/envío se inicie o devuelva un resultado ambiguo; un marcado falso puede
duplicar mensajes.

## Adaptadores salientes existentes

Si el canal ya tiene un adaptador `outbound` compatible, derive el
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

Los auxiliares de envío en tiempo de ejecución también se encuentran en `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- auxiliares de transmisión de borradores/progreso, como `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` devuelve un resultado explícito:

| Resultado        | Significado                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `sent`           | la ruta de envío de la plataforma aceptó al menos un mensaje visible de la plataforma                   |
| `suppressed`     | ningún mensaje de la plataforma debe considerarse ausente                                               |
| `partial_failed` | se aceptó al menos un mensaje de la plataforma antes de que fallara una carga útil o efecto posterior   |
| `failed`         | no se generó ningún acuse de la plataforma                                                              |

Use `payloadOutcomes` cuando un lote combine cargas útiles enviadas, suprimidas y
fallidas. No deduzca la cancelación de hooks a partir de un resultado vacío de
entrega directa heredada.

## Admisión de entrega diferida

Use `message.durableFinal.admitDeferredDelivery(...)` cuando una cuenta resuelta
no pueda aceptar de forma segura la entrega saliente o diferida administrada por el núcleo. El núcleo llama a
este hook de forma síncrona antes del trabajo saliente en vivo, incluidas las rutas que omiten
la persistencia en cola, y de nuevo antes de reproducir una intención recuperada. El contexto
incluye `cfg`, `channel`, `to`, `accountId` y una `phase` de `live` o
`recovery`.

Devuelva `{ status: "allowed" }` para continuar. Devuelva
`{ status: "permanent_rejection", reason }` cuando la entrega no deba
persistirse, enviarse directamente ni reproducirse. Un rechazo en vivo falla antes de crear
la cola, ejecutar los hooks de mensajes o realizar trabajo en la plataforma. Un rechazo durante la recuperación marca el
registro en cola como fallido y omite la reconciliación y la reproducción. Omitir el hook
implica que se permite.

El hook es una decisión de admisión síncrona, no una ruta de envío. Lea únicamente
la configuración o el estado de ejecución ya cargados; no realice operaciones de E/S asíncronas
de red, sistema de archivos ni de otro tipo. Las pruebas de contrato deben ejercitar ambas fases y ambas
variantes de resultado mediante `ChannelMessageDurableFinalAdapter` desde
`openclaw/plugin-sdk/channel-outbound`.

## Despacho de compatibilidad

Ensamble el despacho de respuestas entrantes mediante `dispatchChannelInboundReply(...)`
desde `channel-inbound`. Mantenga la entrega de la plataforma en el adaptador de entrega; use
`channel-outbound` para adaptadores de mensajes, envíos duraderos, acuses, vista previa en
vivo y opciones de la canalización de respuestas.
