---
read_when:
    - Estás creando o refactorizando un Plugin de canal de mensajería
    - Necesitas una entrega duradera de la respuesta final, confirmaciones de recepción, finalización de la vista previa en vivo o una política de acuse de recibo
    - Está migrando desde la canalización de respuestas heredada o desde los auxiliares de despacho de respuestas entrantes
summary: API del ciclo de vida de mensajes para plugins de canal, incluidos envíos persistentes, acuses de recibo, vista previa en vivo, política de confirmación de recepción y migración heredada
title: API de mensajes de canal
x-i18n:
    generated_at: "2026-05-06T05:43:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c96cdc6fe13f4063958d4b999fae97329f5906638caad52e61cabae40985dc
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Los plugins de canal deben exponer un adaptador `message` desde
`openclaw/plugin-sdk/channel-message`. El adaptador describe el ciclo de vida
nativo del mensaje que admite la plataforma:

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

El núcleo es propietario de las colas, la durabilidad, la política genérica de reintentos, los hooks, los recibos y la
herramienta `message` compartida. El plugin es propietario de las llamadas nativas
send/edit/delete, la normalización de destinos, los hilos de la plataforma, las
citas seleccionadas, los indicadores de notificación, el estado de cuenta y los
efectos secundarios específicos de la plataforma.

Usa esta página junto con [Crear plugins de canal](/es/plugins/sdk-channel-plugins).

La subruta `channel-message` es intencionadamente lo bastante ligera para archivos
de arranque de plugins activos como `channel.ts`: expone contratos de adaptador,
pruebas de capacidades, recibos y fachadas de compatibilidad sin cargar la
entrega saliente. Los helpers de entrega en tiempo de ejecución están disponibles
en `openclaw/plugin-sdk/channel-message-runtime` para rutas de código de
monitor/send que ya realizan E/S de mensajes asíncrona.

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

Después, adjúntalo al plugin de canal:

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

Declara solo las capacidades que el adaptador realmente conserva. Toda capacidad
declarada debe tener una prueba de contrato.

## Puente saliente

Si el canal ya tiene un adaptador `outbound` compatible, prefiere derivar el
adaptador de mensajes en lugar de duplicar el código de envío:

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

El puente convierte los resultados de envío salientes antiguos en valores
`MessageReceipt`. El código nuevo debe pasar recibos de extremo a extremo y
derivar identificadores heredados solo en los bordes de compatibilidad con
`listMessageReceiptPlatformIds(...)` o
`resolveMessageReceiptPrimaryId(...)`.
Si no se suministra ninguna política de recepción, `createChannelMessageAdapterFromOutbound(...)`
usa la política de acuse de recepción `manual`. Esto hace explícito el acuse de
la plataforma propiedad del plugin sin cambiar canales que acusan webhooks,
sockets o desplazamientos de sondeo fuera del contexto genérico de recepción.

## Envíos de la herramienta de mensajes

La ruta compartida `message(action="send")` debe usar el mismo ciclo de vida de
entrega del núcleo que las respuestas finales. Si un canal necesita dar forma
específica del proveedor al envío de la herramienta, implementa
`actions.prepareSendPayload(...)` en lugar de enviar desde
`actions.handleAction(...)`.

`prepareSendPayload(...)` recibe el `ReplyPayload` normalizado del núcleo más el
contexto completo de la acción. Devuelve una carga útil con datos específicos del
canal en `payload.channelData.<channel>` y deja que el núcleo llame a
`sendMessage(...)`, `deliverOutboundPayloads(...)`, la cola write-ahead, los
hooks de envío de mensajes, los reintentos, la recuperación y la limpieza de ack.

Devuelve `null` solo cuando el envío no puede representarse como una carga útil
duradera, por ejemplo porque contiene una factory de componentes no serializable.
El núcleo mantendrá el fallback de acción de plugin heredado por compatibilidad,
pero las nuevas funciones de envío de canal deben poder expresarse como datos de
carga útil duraderos.

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

Después, el adaptador saliente lee `payload.channelData.demo` dentro de
`sendPayload`. Esto mantiene el renderizado específico de la plataforma en el
plugin mientras el núcleo sigue siendo propietario de persistencia, reintentos,
recuperación, hooks y ack.

Las cargas útiles preparadas de `message(action="send")` y la entrega genérica de
respuesta final usan la entrega del núcleo con colas best-effort por defecto. Las
colas duraderas obligatorias solo son válidas después de que el núcleo verifica
que el canal puede conciliar un envío cuyo resultado se desconoce tras una caída.
Si el adaptador no puede implementar `reconcileUnknownSend`, mantén la ruta de
envío preparada como best-effort; el núcleo seguirá intentando la cola
write-ahead, pero la persistencia de la cola o la recuperación incierta ante
caídas no forma parte del contrato de entrega obligatorio.

## Capacidades finales duraderas

La entrega final duradera es opt-in por efecto secundario. El núcleo solo usará
entrega duradera genérica cuando el adaptador declare todas las capacidades que
necesitan la carga útil y las opciones de entrega.

| Capacidad              | Declarar cuando                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `text`                 | El adaptador puede enviar texto y devolver un recibo.                               |
| `media`                | Los envíos multimedia devuelven recibos por cada mensaje visible de la plataforma.  |
| `payload`              | El adaptador conserva la semántica de carga útil de respuesta enriquecida, no solo texto y una URL multimedia. |
| `replyTo`              | Los destinos de respuesta nativos llegan a la plataforma.                           |
| `thread`               | Los destinos nativos de hilo, tema o hilo de canal llegan a la plataforma.          |
| `silent`               | La supresión de notificaciones llega a la plataforma.                               |
| `nativeQuote`          | Los metadatos de cita seleccionada llegan a la plataforma.                          |
| `messageSendingHooks`  | Los hooks de envío de mensajes del núcleo pueden cancelar o reescribir contenido antes de la E/S de la plataforma. |
| `batch`                | Los lotes renderizados de varias partes se pueden reproducir como un plan duradero. |
| `reconcileUnknownSend` | El adaptador puede resolver la recuperación `unknown_after_send` sin reproducción ciega. |
| `afterSendSuccess`     | Los efectos secundarios locales del canal posteriores al envío se ejecutan una vez. |
| `afterCommit`          | Los efectos secundarios locales del canal posteriores al commit se ejecutan una vez. |

La entrega final best-effort no requiere `reconcileUnknownSend`; usa el ciclo de
vida compartido cuando el adaptador conserva la semántica visible de la carga útil
y recurre a la E/S directa de la plataforma si la persistencia de la cola no está
disponible. La entrega final duradera obligatoria debe requerir explícitamente
`reconcileUnknownSend`. Si el adaptador no puede determinar si un envío
iniciado/desconocido llegó a la plataforma, no declares esa capacidad; el núcleo
rechazará la entrega duradera obligatoria antes de ponerla en cola.

Cuando un llamador necesite entrega duradera, deriva los requisitos en lugar de
crear mapas a mano:

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

`messageSendingHooks` es obligatorio por defecto. Configura
`messageSendingHooks: false` solo para una ruta que intencionadamente no puede
ejecutar hooks globales de envío de mensajes.

## Contrato de envío duradero

Un envío final duradero tiene semánticas más estrictas que la entrega heredada
propiedad del canal:

- Crea la intención duradera antes de la E/S de la plataforma.
- Si la entrega duradera devuelve un resultado manejado, no recurras al envío heredado.
- Trata la cancelación por hooks y los resultados sin envío como terminales.
- Trata `unsupported` solo como un resultado previo a la intención.
- Para durabilidad obligatoria, falla antes de la E/S de la plataforma si la cola no puede registrar que el envío de plataforma ha empezado.
- Para entrega final obligatoria y envíos preparados obligatorios de la herramienta de mensajes, haz una comprobación previa de `reconcileUnknownSend`; la recuperación debe poder acusar un mensaje ya enviado o reproducirlo solo después de que el adaptador pruebe que el envío original no ocurrió.
- Para `best_effort`, los fallos de escritura en cola pueden recurrir a E/S directa de la plataforma.
- Reenvía señales de aborto a la carga de medios y a los envíos de la plataforma.
- Ejecuta los hooks after-commit después del ack de cola; el fallback directo best-effort los ejecuta después de una E/S de plataforma correcta porque no hay commit de cola duradero.
- Devuelve recibos por cada id de mensaje visible de la plataforma.
- Usa `reconcileUnknownSend` cuando una plataforma pueda comprobar si un envío incierto ya llegó al usuario.

Este contrato evita envíos duplicados después de caídas y evita omitir hooks de
cancelación de envío de mensajes.

## Recibos

`MessageReceipt` es el nuevo registro interno de lo que la plataforma aceptó:

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
envío existente. Usa `createPreviewMessageReceipt(...)` cuando un mensaje de vista
previa en vivo se convierte en el recibo final. Evita añadir nuevos campos
`messageIds` locales al propietario. El `ChannelDeliveryResult.messageIds`
heredado aún se produce en los bordes de compatibilidad.

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
ejecución. El finalizador decide si la respuesta final edita la vista previa en el
mismo lugar, envía un fallback normal, descarta el estado de vista previa
pendiente, conserva una edición fallida ambigua sin duplicar el mensaje y devuelve
el recibo final.

## Política de ack de recepción

Los receptores de entrada que controlan el tiempo del acuse de la plataforma
deben declarar la política de recepción:

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

Los adaptadores que no declaran política de recepción usan por defecto:

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

Usa el valor predeterminado cuando la plataforma no tenga ningún acuse de recibo que diferir, ya
acuse recibo antes del procesamiento asincrónico o necesite semánticas de respuesta
específicas del protocolo. Declara una de las políticas por etapas solo cuando el receptor realmente
use el contexto de recepción para mover el acuse de recibo de la plataforma a un momento posterior.

Políticas:

| Política               | Usar cuando                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `after_receive_record` | La plataforma puede acusar recibo después de analizar y registrar el evento entrante.    |
| `after_agent_dispatch` | La plataforma debe esperar hasta que se haya aceptado el despacho del agente.            |
| `after_durable_send`   | La plataforma debe esperar hasta que la entrega final tenga una decisión duradera.       |
| `manual`               | El Plugin es dueño del acuse de recibo porque las semánticas de la plataforma no coinciden con una etapa genérica. |

Usa `createMessageReceiveContext(...)` en receptores que difieren el estado de acuse de recibo, y
`shouldAckMessageAfterStage(...)` cuando el receptor necesite comprobar si una
etapa ha satisfecho la política configurada.

## Pruebas de contrato

Las declaraciones de capacidades forman parte del contrato del Plugin. Respáldalas con pruebas:

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

Añade suites de pruebas en vivo y de recepción cuando el adaptador declare esas características. Una
prueba faltante debe hacer fallar la prueba en lugar de ampliar silenciosamente la
superficie duradera.

## API de compatibilidad obsoletas

Estas API siguen siendo importables para compatibilidad con terceros. No las uses para
código de canal nuevo.

| API obsoleta                                  | Reemplazo                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline`  | `openclaw/plugin-sdk/channel-message`                                                                               |
| `createChannelTurnReplyPipeline(...)`         | `createChannelMessageReplyPipeline(...)` para despachadores de compatibilidad, o un adaptador `message` para código de canal nuevo |
| `deliverDurableInboundReplyPayload(...)`      | `deliverInboundReplyWithMessageSendContext(...)` desde `openclaw/plugin-sdk/channel-message-runtime`                |
| `dispatchInboundReplyWithBase(...)`           | `dispatchChannelMessageReplyWithBase(...)` solo para despachadores de compatibilidad                                |
| `recordInboundSessionAndDispatchReply(...)`   | `recordChannelMessageReplyDispatch(...)` solo para despachadores de compatibilidad                                  |
| `resolveChannelSourceReplyDeliveryMode(...)`  | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                 |
| `deliverFinalizableDraftPreview(...)`         | `defineFinalizableLivePreviewAdapter(...)` más `deliverWithFinalizableLivePreviewAdapter(...)`                      |
| `DraftPreviewFinalizerDraft`                  | `LivePreviewFinalizerDraft`                                                                                         |
| `DraftPreviewFinalizerResult`                 | `LivePreviewFinalizerResult`                                                                                        |

Los despachadores de compatibilidad todavía pueden usar `createReplyPrefixContext(...)`,
`createReplyPrefixOptions(...)` y `createTypingCallbacks(...)` a través de la
fachada de mensajes. El código de ciclo de vida nuevo debe evitar la antigua
subruta `channel-reply-pipeline`.

## Lista de verificación de migración

1. Añade `message: defineChannelMessageAdapter(...)` o
   `message: createChannelMessageAdapterFromOutbound(...)` al Plugin de canal.
2. Devuelve `MessageReceipt` desde envíos de texto, multimedia y carga útil.
3. Declara solo capacidades respaldadas por comportamiento nativo y pruebas.
4. Reemplaza mapas de requisitos duraderos escritos a mano por
   `deriveDurableFinalDeliveryRequirements(...)`.
5. Mueve la finalización de vistas previas mediante los helpers de vista previa en vivo cuando el canal
   edite mensajes de borrador en su lugar.
6. Declara la política de acuse de recibo solo cuando el receptor realmente pueda diferir el
   acuse de recibo de la plataforma.
7. Mantén los helpers de despacho de respuestas heredados solo en los límites de compatibilidad.
