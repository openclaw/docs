---
read_when:
    - Está creando o refactorizando la ruta de envío de un plugin de canal de mensajería
    - Se necesita una política de entrega duradera de respuestas finales, confirmaciones de recepción, finalización de la vista previa en directo o acuse de recibo.
    - Está migrando desde los asistentes de envío de mensajes de canal o de respuestas heredadas
summary: 'API del ciclo de vida de mensajes salientes para plugins de canal: adaptadores, confirmaciones, envíos duraderos, vista previa en tiempo real y auxiliares de la pipeline de respuestas'
title: API de salida del canal
x-i18n:
    generated_at: "2026-07-20T00:54:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8edeca81d2e9261f33be1d538153caaea87caedb90dfccac33dd227c924501f1
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Los plugins de canal exponen el comportamiento de los mensajes salientes desde
`openclaw/plugin-sdk/channel-outbound`. Use
`openclaw/plugin-sdk/channel-inbound` para la orquestación de
recepción/contexto/despacho.

El núcleo se encarga de la gestión de colas, la durabilidad, el **monitor de entrada y drenaje duraderos**
(`createChannelIngressMonitor`, `createChannelIngressDrain` y
`openChannelIngressDrain`), la política genérica de reintentos, el ciclo de vida
de adopción de turnos (`turnAdoptionLifecycle` / `bindIngressLifecycleToReplyOptions`), los hooks,
los recibos y la herramienta compartida `message`. El plugin se encarga de las
llamadas nativas para enviar/editar/eliminar, la normalización de destinos, los hilos de la plataforma, las citas
seleccionadas, los indicadores de notificación, el estado de la cuenta, la inspección de entrada y la codificación
de la carga útil, las claves de carril, los predicados que impiden reintentos, la autorización
opcional de sustitución y los efectos secundarios específicos de la plataforma.

## Monitores de entrada duraderos

Use `createChannelIngressMonitor(...)` cuando un canal deba conservar los eventos de
transporte aceptados antes del despacho. Combina una cola y un drenaje de entrada del canal
con el ciclo de vida compartido de admisión, sondeo, depuración, entrega y apagado.
Use el componente de nivel inferior `createChannelIngressDrain(...)` únicamente cuando el transporte
tenga un contrato de admisión o bombeo sustancialmente distinto.

Las opciones obligatorias son:

| Opción                           | Contrato                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `queue`                          | Un `ChannelIngressQueue`, o una fábrica diferida que abre la cola con ámbito de cuenta.                                                                                                                                                                                                                                  |
| `inspect(raw, context)`          | Devuelve el `eventId` estable y el `laneKey` serializado, o `null` para un evento ignorado. Los datos en el momento de la reclamación deben coincidir con el id y el carril conservados.                                                                                                                                                                    |
| `payload`                        | Proporciona la versión de la carga útil y la serialización/deserialización del cuerpo. Use `storage: "raw-event"` para el sobre de cadena `{ version, rawEvent }` estándar, o proporcione callbacks personalizados de codificación/decodificación para una forma existente específica del canal. `createClaimError` clasifica las versiones no válidas o los cambios de identidad. |
| `deliver(raw, lifecycle, claim)` | Despacha un evento decodificado y recibe el ciclo de vida de adopción completo. Puede devolver `completed`, `deferred`, `failed-retryable` o nada.                                                                                                                                                                |
| `pollIntervalMs`                 | Programa sondeos de recuperación/drenaje mientras el monitor está en ejecución.                                                                                                                                                                                                                                                     |
| `retention`                      | Proporciona la cadencia de depuración, los TTL de elementos completados/fallidos y los límites de entradas.                                                                                                                                                                                                                                              |

El monitor serializa las admisiones para que el retroceso de anexado no pueda invertir un carril. Los
retrasos de anexado acotados predeterminados son de `0`, `100` y `300` ms; al agotarse,
se rechaza el callback de transporte en lugar de despachar un evento que no se hizo
duradero. En el momento de la reclamación, decodifica la carga útil versionada, vuelve a ejecutar `inspect` y
rechaza cualquier discrepancia de id o carril antes de la entrega.

`deliver` recibe `onAdopted`, `onDeferred`, `onAdoptionFinalizing`,
`onAbandoned` y `abortSignal`. Devolver sin una transferencia explícita marca como adoptado un
evento terminal sin despacho. `admission` siempre es `exclusive`. Una
transferencia diferida mantiene retenida la reclamación, mientras que el apagado o la cancelación dejan el trabajo no adoptado
disponible para reintentos. El monitor rastrea la entrega independientemente de la resolución de la reclamación
porque la adopción puede convertir una fila en lápida antes de que se resuelva la promesa de entrega
del canal.

La configuración opcional incluye retrasos de anexado personalizados, un bloque de opciones `drain` para
políticas avanzadas de ordenación/concurrencia/reintentos del drenaje, un `abortSignal` externo, un
reloj, informes de errores del bombeo, una fábrica de errores de detención y una política de admisión.
El monitor devuelto expone `admit`, `start`, `pause`, `stop`, `waitForIdle`,
`isRunning` y `isStopped`. `stop` primero resuelve las admisiones aceptadas, después
cancela y libera el drenaje, espera al bombeo y a las entregas activas, y
vuelve a liberarlo para cerrar la condición de carrera de creación diferida.

Mantenga en el plugin la ocultación específica del transporte, la validación del sobre sin procesar, la
clasificación de elementos que no admiten reintentos y la forma de la carga útil conservada. Los transportes Webhook
solo deben confirmar después de que se resuelva `admit`; los transportes sin repetición deben
notificar el agotamiento del anexado duradero en lugar de despachar silenciosamente.

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

Declare únicamente las capacidades que el transporte nativo conserve realmente. Cubra
cada capacidad declarada de envío, recibo, vista previa en vivo y confirmación de recepción
con los asistentes de contrato exportados desde esta subruta.

## Supresión del eco saliente

Cuando una plataforma pueda volver a entregar como entrante el propio mensaje saliente del plugin, llame a `recordOutboundMessageIdentity(...)` con el canal, la cuenta, la conversación y una identidad estable de mensaje o de origen de la plataforma. La ruta compartida de turnos entrantes descarta las identidades coincidentes durante una ventana acotada de 30 segundos antes de registrar la sesión o despachar al agente; puede reservarse una identidad de origen antes del envío o actualizarse cuando se elimina una ruta de canal para evitar condiciones de carrera en la entrega. `isRecentOutboundMessageIdentity(...)` expone la misma consulta para diagnósticos y pruebas del canal. No mantenga una caché TTL paralela y local del canal para la misma identidad estable.

## Saneamiento de texto sin formato

Use `sanitizeForPlainText(...)` cuando un adaptador saliente necesite convertir las
etiquetas de formato HTML compatibles en marcado de texto ligero. De forma predeterminada, conserva
los marcadores existentes de negrita y tachado del estilo de chat. Pase
`{ style: "markdown" }` únicamente cuando el canal vuelva a analizar el resultado como Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

El estilo Markdown usa `**bold**` y `~~strikethrough~~`; la cursiva y el código
en línea conservan `_italic_` y los marcadores de acento grave en ambos estilos. Seleccione el estilo en
el límite del canal en lugar de reescribir el texto de los marcadores después del saneamiento.

## Evidencia de entrega

Un `MessageReceipt` registra el resultado devuelto por un adaptador de canal. Los
identificadores concretos de mensajes de la plataforma demuestran que la ruta de envío de la plataforma aceptó el
mensaje; no demuestran que el dispositivo de un destinatario lo mostrara o leyera.
Los recibos sin identificadores de mensajes de la plataforma son únicamente metadatos de recibo locales.
Los canales con confirmaciones de lectura o estado de entrega al dispositivo deben rastrear esos datos
mediante una ruta separada específica del canal.

Si un adaptador de canal puede demostrar que reintentar un fallo no puede duplicar un
envío visible para el destinatario y que no se inició ninguna llamada capaz de finalizar, lance
`new PlatformMessageNotDispatchedError("...", { cause: error })` desde
`openclaw/plugin-sdk/error-runtime`. Así, el núcleo puede borrar la evidencia obsoleta del intento de envío
y reintentar de forma segura la intención en cola. Solo el adaptador que controla el
límite final de despacho puede realizar esta afirmación. Nunca use el marcador después de que
comience una llamada de finalización/envío ni cuando esta devuelva un resultado ambiguo; un marcado incorrecto puede
duplicar mensajes.

## Adaptadores salientes existentes

Si el canal ya dispone de un adaptador `outbound` compatible, derive el
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

Los asistentes de envío en tiempo de ejecución también residen en `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- asistentes de transmisión/borrador/progreso como `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` devuelve un resultado explícito:

| Resultado          | Significado                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | la ruta de envío de la plataforma aceptó al menos un mensaje visible de la plataforma            |
| `suppressed`     | ningún mensaje de la plataforma debe considerarse ausente                                        |
| `partial_failed` | se aceptó al menos un mensaje de la plataforma antes de que fallara una carga útil o un efecto secundario posterior |
| `failed`         | no se generó ningún recibo de la plataforma                                                        |

Use `payloadOutcomes` cuando un lote combine cargas útiles enviadas, suprimidas y
fallidas. No deduzca la cancelación de un hook a partir de un resultado vacío heredado de
entrega directa.

## Admisión de entrega diferida

Use `message.durableFinal.admitDeferredDelivery(...)` cuando una cuenta resuelta
no pueda aceptar de forma segura entregas salientes o diferidas gestionadas por el núcleo. El núcleo llama
a este hook de forma sincrónica antes del trabajo saliente en vivo, incluidas las rutas que omiten
la persistencia en cola, y de nuevo antes de reproducir una intención recuperada. El contexto
incluye `cfg`, `channel`, `to`, `accountId` y un `phase` de `live` o
`recovery`.

Devuelva `{ status: "allowed" }` para continuar. Devuelva
`{ status: "permanent_rejection", reason }` cuando la entrega no deba
conservarse, enviarse directamente ni reproducirse. Un rechazo en vivo falla antes de crear la cola,
ejecutar los hooks de mensajes o realizar trabajo en la plataforma. Un rechazo durante la recuperación marca como fallido el
registro en cola y omite la conciliación y la reproducción. Omitir el hook
equivale a permitirla.

El hook es una decisión de admisión síncrona, no una ruta de envío. Lea únicamente
la configuración o el estado de ejecución ya cargados; no realice operaciones de E/S
de red, del sistema de archivos ni de otro tipo que sean asíncronas. Las pruebas de contrato deben
ejercitar ambas fases y ambas variantes de resultado mediante `ChannelMessageDurableFinalAdapter` desde
`openclaw/plugin-sdk/channel-outbound`.

## Despacho de compatibilidad

Ensamble el despacho de respuestas entrantes mediante `dispatchChannelInboundReply(...)`
desde `channel-inbound`. Mantenga la entrega de la plataforma en el adaptador de entrega; use
`channel-outbound` para los adaptadores de mensajes, los envíos duraderos, las confirmaciones, la
vista previa en directo y las opciones de la pipeline de respuestas.
