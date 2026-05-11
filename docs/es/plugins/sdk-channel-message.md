---
read_when:
    - Estás creando o refactorizando un Plugin de canal de mensajería
    - Necesitas entrega duradera de la respuesta final, acuses de recibo, finalización de la vista previa en vivo o una política de confirmación de recepción
    - Está migrando desde la canalización heredada de respuestas o desde las funciones auxiliares de despacho de respuestas entrantes
summary: API del ciclo de vida de los mensajes para plugins de canal, incluidos los envíos duraderos, las confirmaciones, la vista previa en vivo, la política de confirmación de recepción y la migración heredada
title: API de mensajes de canal
x-i18n:
    generated_at: "2026-05-11T20:46:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd3f6ad071f4ff6fed0503d66dce04990d90e84f390bfa63b8507080c5ef20d3
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Los plugins de canal deben exponer un adaptador `message` desde
`openclaw/plugin-sdk/channel-message`. El adaptador describe el ciclo de vida de
mensajes nativo que admite la plataforma:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core posee las colas, la durabilidad, la política de reintentos genérica, los hooks, los recibos y la
herramienta `message` compartida. El plugin posee las llamadas nativas de envío/edición/eliminación, la
normalización de destinos, los hilos de plataforma, las citas seleccionadas, las marcas de notificación, el estado de la cuenta y los efectos secundarios específicos de la plataforma.

Use esta página junto con [Crear plugins de canal](/es/plugins/sdk-channel-plugins).

El subpath `channel-message` es intencionalmente lo bastante ligero para archivos
de arranque de plugins en rutas activas como `channel.ts`: expone contratos de adaptador, pruebas de
capacidades, recibos y fachadas de compatibilidad sin cargar la entrega saliente.
Los helpers de entrega en tiempo de ejecución están disponibles desde
`openclaw/plugin-sdk/channel-message-runtime` para rutas de código de monitor/envío que
ya hacen E/S de mensajes asíncrona.

El código nuevo de envío de canales y plugins debe usar los helpers de ciclo de vida de mensajes de
`openclaw/plugin-sdk/channel-message-runtime`: `sendDurableMessageBatch`,
`withDurableMessageSendContext` o `deliverInboundReplyWithMessageSendContext`.
El helper anterior
`deliverOutboundPayloads(...)` en `openclaw/plugin-sdk/outbound-runtime`
está obsoleto como sustrato de compatibilidad/tiempo de ejecución para elementos internos salientes, recuperación
y adaptadores heredados. No lo use para nuevas rutas de envío de canales o plugins.

`sendDurableMessageBatch(...)` devuelve un resultado explícito del ciclo de vida:

- `sent` - se entregó al menos un mensaje visible de la plataforma.
- `suppressed` - ningún mensaje de plataforma debe tratarse como faltante. Los motivos estables
  incluyen `cancelled_by_message_sending_hook`,
  `empty_after_message_sending_hook`, `no_visible_payload`,
  `adapter_returned_no_identity` y el heredado `no_visible_result`.
- `partial_failed` - se entregó al menos un mensaje de plataforma antes de que fallara un
  payload o efecto secundario posterior. El resultado incluye el prefijo de recibo entregado
  más el fallo.
- `failed` - no se produjo ningún recibo de plataforma.

Use `payloadOutcomes` cuando un lote mezcle payloads enviados, suprimidos y fallidos.
No infiera la cancelación por hook comprobando si el antiguo array de entrega directa
está vacío.

Los despachadores de compatibilidad que aún necesiten el despachador de respuestas en búfer deben
crear opciones de prefijo de respuesta con `createChannelMessageReplyPipeline(...)` desde
`openclaw/plugin-sdk/channel-message`, y luego llamar a
`channel.turn.runPrepared(...)` del runtime. Eso mantiene la grabación de sesión y el orden de despacho
en el ciclo de vida de turnos compartido sin añadir otro wrapper de turno público.

## Adaptador mínimo

La mayoría de los plugins de canal nuevos pueden empezar con un adaptador pequeño:

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

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

Luego adjúntelo al plugin de canal:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Declare solo las capacidades que el adaptador preserva realmente. Cada capacidad declarada
debe tener una prueba de contrato.

## Puente de salida

Si el canal ya tiene un adaptador `outbound` compatible, prefiera derivar el
adaptador de mensajes en lugar de duplicar código de envío:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

El puente convierte resultados de envío saliente antiguos en valores `MessageReceipt`. El código nuevo
debe pasar recibos de extremo a extremo y solo derivar ids heredados en bordes de compatibilidad
con `listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)`.
Si no se proporciona ninguna política de recepción, `createChannelMessageAdapterFromOutbound(...)`
usa la política de acuse de recepción `manual`. Eso hace explícito el acuse de plataforma propiedad del plugin
sin cambiar los canales que acusan webhooks,
sockets u offsets de sondeo fuera del contexto de recepción genérico.

## Envíos de la herramienta de mensajes

La ruta compartida `message(action="send")` debe usar el mismo ciclo de vida de entrega de core
que las respuestas finales. Si un canal necesita conformación específica del proveedor para el
envío de la herramienta, implemente `actions.prepareSendPayload(...)` en lugar de enviar desde
`actions.handleAction(...)`.

`prepareSendPayload(...)` recibe el `ReplyPayload` normalizado de core más el
contexto completo de la acción. Devuelva un payload con datos específicos del canal en
`payload.channelData.<channel>` y deje que core llame a `sendMessage(...)`,
al runtime de ciclo de vida de mensajes, a la cola write-ahead, a los hooks de envío de mensajes,
a los reintentos, la recuperación y la limpieza de ack. El runtime de ciclo de vida puede llamar a
`deliverOutboundPayloads(...)` internamente como sustrato de compatibilidad, pero los plugins de canal
no deben llamarlo directamente para nuevo comportamiento de envío.

Devuelva `null` solo cuando el envío no pueda representarse como un payload duradero, por
ejemplo porque contiene una fábrica de componentes no serializable. Core mantendrá
el fallback heredado de acción del plugin por compatibilidad, pero las nuevas funciones de envío de canal
deben poder expresarse como datos de payload duraderos.

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

Luego el adaptador saliente lee `payload.channelData.demo` dentro de `sendPayload`.
Esto mantiene el renderizado específico de la plataforma en el plugin mientras core sigue poseyendo
persistencia, reintentos, recuperación, hooks y ack.

Los payloads preparados de `message(action="send")` y la entrega genérica de respuestas finales usan
entrega de core con colas best-effort de forma predeterminada. Las colas duraderas obligatorias
solo son válidas después de que core verifique que el canal puede reconciliar un envío cuyo resultado es
desconocido tras un bloqueo. Si el adaptador no puede implementar `reconcileUnknownSend`,
mantenga la ruta de envío preparada como best-effort; core seguirá intentando la cola write-ahead,
pero la persistencia de cola o la recuperación incierta tras bloqueos no forma parte del
contrato de entrega obligatorio.

## Capacidades finales duraderas

La entrega final duradera es opt-in por efecto secundario. Core solo usará entrega duradera
genérica cuando el adaptador declare cada capacidad necesaria para el
payload y las opciones de entrega.

| Capacidad              | Declare cuando                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | El adaptador puede enviar texto y devolver un recibo.                                |
| `media`                | Los envíos de medios devuelven recibos para cada mensaje visible de la plataforma.   |
| `payload`              | El adaptador preserva la semántica de payloads de respuesta ricos, no solo texto y una URL de medios. |
| `replyTo`              | Los destinos de respuesta nativos llegan a la plataforma.                            |
| `thread`               | Los destinos nativos de hilo, tema o hilo de canal llegan a la plataforma.           |
| `silent`               | La supresión de notificaciones llega a la plataforma.                                |
| `nativeQuote`          | Los metadatos de cita seleccionada llegan a la plataforma.                           |
| `messageSendingHooks`  | Los hooks de envío de mensajes de core pueden cancelar o reescribir contenido antes de la E/S de plataforma. |
| `batch`                | Los lotes renderizados de varias partes son reproducibles como un plan duradero.     |
| `reconcileUnknownSend` | El adaptador puede resolver la recuperación `unknown_after_send` sin reproducción ciega. |
| `afterSendSuccess`     | Los efectos secundarios locales del canal posteriores al envío se ejecutan una vez.  |
| `afterCommit`          | Los efectos secundarios locales del canal posteriores al commit se ejecutan una vez. |

La entrega final best-effort no requiere `reconcileUnknownSend`; usa el
ciclo de vida compartido cuando el adaptador preserva la semántica visible del payload, y
recurre a E/S directa de plataforma si la persistencia de cola no está disponible. La entrega final
duradera obligatoria debe requerir explícitamente `reconcileUnknownSend`. Si el
adaptador no puede determinar si un envío iniciado/desconocido llegó a la plataforma,
no declare esa capacidad; core rechazará la entrega duradera obligatoria
antes de encolar.

Cuando un llamador necesita entrega duradera, derive los requisitos en lugar de crear
maps a mano:

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` es obligatorio de forma predeterminada. Establezca `messageSendingHooks: false`
solo para una ruta que intencionalmente no pueda ejecutar hooks globales de envío de mensajes.

## Contrato de envío duradero

Un envío final duradero tiene una semántica más estricta que la entrega heredada propiedad del canal:

- Cree el intento duradero antes de la E/S de plataforma.
- Si la entrega duradera devuelve un resultado gestionado, no recurra al envío heredado.
- Trate la cancelación por hook y los resultados sin envío como terminales.
- Trate `unsupported` como un resultado previo al intento únicamente.
- Para durabilidad obligatoria, falle antes de la E/S de plataforma si la cola no puede registrar
  que el envío de plataforma ha empezado.
- Para entrega final obligatoria y envíos preparados obligatorios de la herramienta de mensajes,
  haga preflight de `reconcileUnknownSend`; la recuperación debe poder hacer ack de un
  mensaje ya enviado o reproducir solo después de que el adaptador pruebe que el envío original
  no ocurrió.
- Para `best_effort`, los fallos de escritura en cola pueden recurrir a E/S directa de plataforma.
- Reenvíe señales de abort a la carga de medios y a los envíos de plataforma.
- Ejecute hooks posteriores al commit después del ack de cola; el fallback directo best-effort los ejecuta
  después de E/S de plataforma correcta porque no hay commit de cola duradero.
- Devuelva recibos para cada id de mensaje visible de la plataforma.
- Use `reconcileUnknownSend` cuando una plataforma pueda comprobar si un envío incierto
  ya llegó al usuario.

Este contrato evita envíos duplicados tras bloqueos y evita omitir
hooks de cancelación de envío de mensajes.

## Recibos

`MessageReceipt` es el nuevo registro interno de lo que aceptó la plataforma:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

Usa `createMessageReceiptFromOutboundResults(...)` al adaptar un resultado de
envío existente. Usa `createPreviewMessageReceipt(...)` cuando un mensaje de
vista previa en vivo se convierte en el recibo final. Evita agregar nuevos campos
`messageIds` locales del propietario. El campo heredado
`ChannelDeliveryResult.messageIds` todavía se produce en los límites de
compatibilidad.

## Vista previa en vivo

Los canales que transmiten vistas previas de borradores o actualizaciones de
progreso deben declarar capacidades en vivo:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

Usa `defineFinalizableLivePreviewAdapter(...)` y
`deliverWithFinalizableLivePreviewAdapter(...)` para la finalización en tiempo de
ejecución. El finalizador decide si la respuesta final edita la vista previa en
su lugar, envía una reserva normal, descarta el estado de vista previa pendiente,
mantiene una edición fallida ambigua sin duplicar el mensaje y devuelve el recibo
final.

## Política de acuse de recibo de recepción

Los receptores entrantes que controlan el momento del acuse de recibo de la
plataforma deben declarar la política de recepción:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Los adaptadores que no declaran una política de recepción usan de forma
predeterminada:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Usa el valor predeterminado cuando la plataforma no tiene ningún acuse de recibo
que diferir, ya acusa recibo antes del procesamiento asincrónico o necesita
semántica de respuesta específica del protocolo. Declara una de las políticas por
etapas solo cuando el receptor realmente usa el contexto de recepción para mover
el acuse de recibo de la plataforma a un momento posterior.

Políticas:

| Política               | Usar cuando                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | La plataforma puede recibir acuse después de que el evento entrante se analice y registre. |
| `after_agent_dispatch` | La plataforma debe esperar hasta que se haya aceptado el despacho del agente.             |
| `after_durable_send`   | La plataforma debe esperar hasta que la entrega final tenga una decisión duradera.        |
| `manual`               | El Plugin posee el acuse de recibo porque la semántica de la plataforma no coincide con una etapa genérica. |

Usa `createMessageReceiveContext(...)` en receptores que difieren el estado de
acuse, y `shouldAckMessageAfterStage(...)` cuando el receptor necesita comprobar
si una etapa ha satisfecho la política configurada.

## Pruebas de contrato

Las declaraciones de capacidades forman parte del contrato del Plugin. Respalda
esas declaraciones con pruebas:

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

Agrega conjuntos de pruebas de vivo y recepción cuando el adaptador declare esas
funciones. Una prueba faltante debe hacer fallar la prueba en lugar de ampliar
silenciosamente la superficie duradera.

## API de compatibilidad obsoletas

Estas API siguen siendo importables para compatibilidad con terceros. No las
uses para nuevo código de canal.

| API obsoleta                                 | Reemplazo                                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` para despachadores de compatibilidad, o un adaptador `message` para nuevo código de canal |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` más `channel.turn.runPrepared(...)`, o un adaptador `message` para nuevo código de canal |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` más `channel.turn.runPrepared(...)`, o un adaptador `message` para nuevo código de canal |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` más `channel.turn.runPrepared(...)`, o un adaptador `message` para nuevo código de canal |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` o `deliverInboundReplyWithMessageSendContext(...)` de `channel-message-runtime`             |
| `deliverDurableInboundReplyPayload(...)`     | `deliverInboundReplyWithMessageSendContext(...)` de `openclaw/plugin-sdk/channel-message-runtime`                          |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` más `channel.turn.runPrepared(...)`, o un adaptador `message` para nuevo código de canal |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` más `channel.turn.runPrepared(...)`, o un adaptador `message` para nuevo código de canal |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` más `deliverWithFinalizableLivePreviewAdapter(...)`                             |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

Los despachadores de compatibilidad todavía pueden usar
`createReplyPrefixContext(...)`, `createReplyPrefixOptions(...)` y
`createTypingCallbacks(...)` a través de la fachada de mensajes. El nuevo código
de ciclo de vida debe evitar la antigua subruta `channel-reply-pipeline`.

## Lista de comprobación de migración

1. Agrega `message: defineChannelMessageAdapter(...)` o
   `message: createChannelMessageAdapterFromOutbound(...)` al Plugin de canal.
2. Devuelve `MessageReceipt` desde envíos de texto, medios y cargas útiles.
3. Declara solo capacidades respaldadas por comportamiento nativo y pruebas.
4. Reemplaza los mapas de requisitos duraderos escritos a mano con
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Mueve la finalización de vista previa por los ayudantes de vista previa en
   vivo cuando el canal edita mensajes de borrador en su lugar.
6. Declara la política de acuse de recibo de recepción solo cuando el receptor
   realmente pueda diferir el acuse de recibo de la plataforma.
7. Mantén los ayudantes de despacho de respuestas heredados solo en los límites
   de compatibilidad.
