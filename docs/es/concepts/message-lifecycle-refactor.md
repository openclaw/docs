---
read_when:
    - Refactorización del comportamiento de envío o recepción del canal
    - Cambiar el turno del canal, el envío de respuestas, la cola de salida, la transmisión de vista previa o las APIs de mensajes del SDK de Plugin
    - Diseño de un nuevo Plugin de canal que necesita envíos persistentes, confirmaciones de recepción, vistas previas, ediciones o reintentos
summary: Plan de diseño para el ciclo de vida unificado y persistente de recepción, envío, vista previa, edición y transmisión de mensajes
title: Refactorización del ciclo de vida de los mensajes
x-i18n:
    generated_at: "2026-05-06T05:30:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 488846c370e2b9c07a3dc87f74e7ac3cf58de9935980c0ffe889a56b9b719d79
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Esta página es el diseño objetivo para reemplazar los helpers dispersos de turnos de canal, despacho de respuestas, streaming de vista previa y entrega saliente por un único ciclo de vida de mensaje duradero.

La versión corta:

- Las primitivas del núcleo deben ser **recibir** y **enviar**, no **responder**.
- Una respuesta es solo una relación en un mensaje saliente.
- Un turno es una conveniencia de procesamiento entrante, no el propietario de la entrega.
- El envío debe basarse en contexto: `begin`, renderizar, vista previa o stream, envío final, confirmar, fallar.
- La recepción también debe basarse en contexto: normalizar, deduplicar, enrutar, registrar, despachar, ack de plataforma, fallar.
- La SDK pública de plugins debe condensarse en una pequeña superficie de mensajes de canal.

## Problemas

La pila actual de canales creció a partir de varias necesidades locales válidas:

- Los adaptadores entrantes simples usan `runtime.channel.turn.run`.
- Los adaptadores enriquecidos usan `runtime.channel.turn.runPrepared`.
- Los helpers heredados usan `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, helpers de payload de respuesta, fragmentación de respuestas, referencias de respuesta y helpers de runtime saliente.
- El streaming de vista previa vive en despachadores específicos de canal.
- La durabilidad de la entrega final se está agregando alrededor de las rutas existentes de payload de respuesta.

Esa forma corrige bugs locales, pero deja a OpenClaw con demasiados conceptos públicos y demasiados lugares donde la semántica de entrega puede desviarse.

El problema de fiabilidad que expuso esto es:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

La invariante objetivo es más amplia que Telegram: una vez que el núcleo decide que debe existir un mensaje saliente visible, la intención debe ser duradera antes de intentar el envío de plataforma, y el recibo de plataforma debe confirmarse después del éxito. Eso da a OpenClaw recuperación al menos una vez. El comportamiento exactamente una vez existe solo para adaptadores que pueden demostrar idempotencia nativa o reconciliar un intento con estado desconocido tras el envío contra el estado de la plataforma antes de reproducirlo.

Ese es el estado final de esta refactorización, no una descripción de cada ruta actual. Durante la migración, los helpers salientes existentes aún pueden caer a un envío directo cuando las escrituras de cola de mejor esfuerzo fallan. La refactorización está completa solo cuando los envíos finales duraderos fallan de forma cerrada o excluyen explícitamente su participación con una política no duradera documentada.

## Objetivos

- Un ciclo de vida de núcleo para todas las rutas de recepción y envío de mensajes de canal.
- Envíos finales duraderos de forma predeterminada en el nuevo ciclo de vida de mensajes después de que un adaptador declare comportamiento seguro para reproducción.
- Semánticas compartidas de vista previa, edición, stream, finalización, reintento, recuperación y recibo.
- Una pequeña superficie de SDK de plugins que los plugins de terceros puedan aprender y mantener.
- Compatibilidad para llamadores existentes de `channel.turn` durante la migración.
- Puntos de extensión claros para nuevas capacidades de canal.
- Sin ramas específicas de plataforma en el núcleo.
- Sin mensajes de canal de delta de tokens. El streaming de canal sigue siendo vista previa de mensaje, edición, anexado o entrega de bloque completado.
- Metadatos estructurados originados en OpenClaw para salida operativa o del sistema, de modo que los fallos visibles del Gateway no vuelvan a entrar en salas compartidas con bots habilitados como prompts nuevos.

## No objetivos

- No eliminar `runtime.channel.turn.*` en la primera fase.
- No forzar a todos los canales al mismo comportamiento de transporte nativo.
- No enseñar al núcleo temas de Telegram, streams nativos de Slack, redacciones de Matrix, tarjetas de Feishu, voz de QQ ni actividades de Teams.
- No publicar todos los helpers internos de migración como API estable de la SDK.
- No hacer que los reintentos reproduzcan operaciones de plataforma no idempotentes ya completadas.

## Modelo de referencia

Vercel Chat tiene un buen modelo mental público:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- métodos de adaptador como `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` y obtenciones de historial
- un adaptador de estado para deduplicación, locks, colas y persistencia

OpenClaw debe tomar prestado el vocabulario, no copiar la superficie.

Lo que OpenClaw necesita más allá de ese modelo:

- Intenciones de envío saliente duraderas antes de llamadas directas de transporte.
- Contextos de envío explícitos con inicio, confirmación y fallo.
- Contextos de recepción que conozcan la política de ack de plataforma.
- Recibos que sobrevivan a reinicios y puedan impulsar ediciones, eliminaciones, recuperación y supresión de duplicados.
- Una SDK pública más pequeña. Los plugins incluidos pueden usar helpers internos de runtime, pero los plugins de terceros deben ver una API de mensajes coherente.
- Comportamiento específico de agentes: sesiones, transcripciones, streaming de bloques, progreso de herramientas, aprobaciones, directivas de medios, respuestas silenciosas e historial de menciones en grupos.

Las promesas estilo `thread.post()` no son suficientes para OpenClaw. Ocultan el límite de transacción que decide si un envío es recuperable.

## Modelo del núcleo

El nuevo dominio debe vivir bajo un namespace interno del núcleo como `src/channels/message/*`.

Tiene cuatro conceptos:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` posee el ciclo de vida entrante.

`send` posee el ciclo de vida saliente.

`live` posee la vista previa, edición, progreso y estado de stream.

`state` posee el almacenamiento duradero de intención, recibos, idempotencia, recuperación, locks y deduplicación.

## Términos de mensaje

### Mensaje

Un mensaje normalizado es neutral respecto a la plataforma:

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### Destino

El destino describe dónde vive el mensaje:

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relación

La respuesta es una relación, no una raíz de API:

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

Esto permite que la misma ruta de envío gestione respuestas normales, notificaciones de Cron, prompts de aprobación, finalizaciones de tareas, envíos de herramientas de mensajes, envíos de CLI o Control UI, resultados de subagentes y envíos de automatización.

### Origen

El origen describe quién produjo un mensaje y cómo OpenClaw debe tratar los ecos de ese mensaje. Está separado de la relación: un mensaje puede ser una respuesta a un usuario y aun así ser salida operativa originada en OpenClaw.

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

El núcleo posee el significado de la salida originada en OpenClaw. Los canales poseen cómo se codifica ese origen en su transporte.

El primer uso requerido es la salida de fallo del Gateway. Los humanos aún deben ver mensajes como "Agent failed before reply" o "Missing API key", pero la salida operativa etiquetada de OpenClaw no debe aceptarse como entrada escrita por bot en salas compartidas cuando `allowBots` está habilitado.

### Recibo

Los recibos son de primera clase:

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

Los recibos son el puente desde la intención duradera hacia edición futura, eliminación, finalización de vista previa, supresión de duplicados y recuperación.

Un recibo puede describir un mensaje de plataforma o una entrega de múltiples partes. Texto fragmentado, medios más texto, voz más texto y alternativas de tarjeta deben preservar todos los ids de plataforma sin dejar de exponer un id primario para hilos y ediciones posteriores.

## Contexto de recepción

La recepción no debe ser una llamada desnuda a un helper. El núcleo necesita un contexto que conozca deduplicación, enrutamiento, registro de sesión y política de ack de plataforma.

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Flujo de recepción:

```text
platform event
  -> begin receive context
  -> normalize
  -> classify
  -> dedupe and self-echo gate
  -> route and authorize
  -> record inbound session metadata
  -> dispatch agent run
  -> durable outbound sends happen through send context
  -> commit receive
  -> ack platform when policy allows
```

Ack no es una sola cosa. El contrato de recepción debe mantener separadas estas señales:

- **Ack de transporte:** indica al webhook o socket de la plataforma que OpenClaw aceptó el sobre del evento. Algunas plataformas lo requieren antes del despacho.
- **Ack de offset de polling:** avanza un cursor para que el mismo evento no se obtenga de nuevo. Esto no debe avanzar más allá de trabajo que no pueda recuperarse.
- **Ack de registro entrante:** confirma que OpenClaw persistió suficientes metadatos entrantes para deduplicar y enrutar una reentrega.
- **Recibo visible para el usuario:** comportamiento opcional de lectura, estado o escritura; nunca un límite de durabilidad.

`ReceiveAckPolicy` controla solo el acuse de recibo de transporte o polling. No debe reutilizarse para recibos de lectura ni reacciones de estado.

Antes de la autorización de bots, la recepción debe aplicar la política compartida de eco de OpenClaw cuando el canal pueda decodificar metadatos de origen de mensaje:

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

Este descarte se basa en etiquetas, no en texto. Un mensaje de sala escrito por bot con el mismo texto visible de fallo del Gateway pero sin metadatos de origen de OpenClaw aún pasa por la autorización normal de `allowBots`.

La política de ack es explícita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

El polling de Telegram ahora usa la política de ack del contexto de recepción para su marca de agua de reinicio persistida. El rastreador aún observa actualizaciones de grammY cuando entran en la cadena de middleware, pero OpenClaw persiste solo el id de actualización completado seguro después de un despacho exitoso, dejando las actualizaciones fallidas o pendientes inferiores reproducibles tras un reinicio. El offset de obtención `getUpdates` de Telegram sigue estando controlado por la biblioteca de polling, así que el corte más profundo restante es una fuente de polling completamente duradera si necesitamos reentrega a nivel de plataforma más allá de la marca de agua de reinicio de OpenClaw. Las plataformas de Webhook pueden necesitar ack HTTP inmediato, pero siguen necesitando deduplicación entrante e intenciones duraderas de envío saliente porque los webhooks pueden reentregar.

## Contexto de envío

El envío también se basa en contexto:

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

Orquestación preferida:

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

El helper se expande a:

```text
begin durable intent
  -> render
  -> optional preview/edit/stream work
  -> mark sending
  -> final platform send or final edit
  -> mark committing with raw receipt
  -> commit receipt
  -> ack durable intent
  -> fail durable intent on classified failure
```

La intención debe existir antes de la E/S de transporte. Un reinicio después de comenzar, pero antes de
confirmar, es recuperable.

El límite peligroso está después del éxito de la plataforma y antes de confirmar el recibo. Si un
proceso muere ahí, OpenClaw no puede saber si el mensaje de la plataforma existe
a menos que el adaptador proporcione idempotencia nativa o una ruta de reconciliación de recibos.
Esos intentos deben reanudarse en `unknown_after_send`, no reproducirse a ciegas. Los canales
sin reconciliación pueden elegir una reproducción de al menos una vez solo si los mensajes visibles
duplicados son una compensación aceptable y documentada para ese canal y esa relación.
El puente de reconciliación actual del SDK requiere que el adaptador declare
`reconcileUnknownSend`, y luego pide a `durableFinal.reconcileUnknownSend` que
clasifique una entrada desconocida como `sent`, `not_sent` o `unresolved`; solo `not_sent`
permite la reproducción, y las entradas sin resolver permanecen terminales o reintentan solo la
comprobación de reconciliación.

La política de durabilidad debe ser explícita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa que el núcleo debe fallar de forma cerrada cuando no puede escribir la intención durable.
`best_effort` puede continuar cuando la persistencia no está disponible. `disabled` conserva
el comportamiento antiguo de envío directo. Durante la migración, los envoltorios heredados y los helpers de
compatibilidad públicos usan `disabled` de forma predeterminada; no deben inferir `required` por
el hecho de que un canal tenga un adaptador saliente genérico.

Los contextos de envío también poseen los efectos posteriores al envío locales del canal. Una migración no es segura
si la entrega durable omite comportamiento local que antes estaba adjunto a la ruta de envío directo
del canal. Los ejemplos incluyen cachés de supresión de autoeco,
marcadores de participación en hilos, anclas de edición nativas, representación de firmas de modelo
y protecciones contra duplicados específicas de la plataforma. Esos efectos deben moverse al
adaptador de envío, al adaptador de representación o a un hook de contexto de envío con nombre antes de que
ese canal pueda activar la entrega final genérica durable.

Los helpers de envío deben devolver recibos hasta su llamador. Los
envoltorios durables no pueden tragarse ids de mensaje ni sustituir un resultado de entrega de canal por
`undefined`; los despachadores con búfer usan esos ids para anclas de hilo, ediciones posteriores,
finalización de vista previa y supresión de duplicados.

Los envíos de respaldo operan sobre lotes, no sobre cargas útiles individuales. Las reescrituras de respuesta silenciosa,
el respaldo de medios, el respaldo de tarjetas y la proyección de fragmentos pueden producir todos más de
un mensaje entregable, por lo que un contexto de envío debe entregar todo el
lote proyectado o documentar explícitamente por qué solo una carga útil es válida.

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

Cuando un respaldo de este tipo es durable, todo el lote proyectado debe estar representado por
una intención de envío durable o por otro plan de lote atómico. Registrar cada carga útil
una por una no es suficiente: un bloqueo entre cargas útiles puede dejar un respaldo visible
parcial sin registro durable para las cargas útiles restantes. La recuperación debe saber
qué unidades ya tienen recibos y reproducir solo las unidades faltantes o marcar
el lote como `unknown_after_send` hasta que el adaptador lo reconcilie.

## Contexto en vivo

El comportamiento de vista previa, edición, progreso y transmisión debería ser un ciclo de vida opcional único.

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

El estado en vivo es lo bastante durable para recuperar o suprimir duplicados:

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

Esto debería cubrir el comportamiento actual:

- Envío de Telegram más vista previa editada, con final nuevo después de una antigüedad obsoleta de la vista previa.
- Envío de Discord más vista previa editada, cancelación en medios/error/respuesta explícita.
- Transmisión nativa de Slack o vista previa de borrador según la forma del hilo.
- Finalización de publicación de borrador de Mattermost.
- Finalización de evento de borrador de Matrix o redacción en caso de discrepancia.
- Transmisión de progreso nativa de Teams.
- Transmisión de QQ Bot o respaldo acumulado.

## Superficie del adaptador

El destino del SDK público debería ser una sola subruta:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

Forma de destino:

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

Adaptador de envío:

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

Adaptador de recepción:

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

Antes de la autorización previa, el núcleo debe ejecutar el predicado de eco compartido de OpenClaw
siempre que `origin.decode` devuelva metadatos de origen OpenClaw. El adaptador de recepción
proporciona datos de la plataforma, como el autor bot y la forma de la sala; el núcleo posee la decisión
de descarte y el orden para que los canales no vuelvan a implementar filtros de texto.

Adaptador de origen:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

El núcleo establece `MessageOrigin`. Los canales solo lo traducen hacia y desde los metadatos
de transporte nativos. Slack lo asigna a `chat.postMessage({ metadata })` y
a `message.metadata` entrante; Matrix puede asignarlo a contenido de evento adicional; los canales
sin metadatos nativos pueden usar un registro de recibos/saliente cuando esa sea la
mejor aproximación disponible.

Capacidades:

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## Reducción del SDK público

La nueva superficie pública debería absorber o dejar obsoletas estas áreas conceptuales:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- la mayoría de los usos públicos de `outbound-runtime`
- helpers ad hoc de ciclo de vida de transmisión de borradores

Las subrutas de compatibilidad pueden permanecer como envoltorios, pero los nuevos plugins de terceros
no deberían necesitarlas.

Los plugins incluidos pueden conservar importaciones de helpers internos a través de subrutas de runtime
reservadas durante la migración. La documentación pública debería dirigir a los autores de plugins a
`plugin-sdk/channel-message` cuando exista.

## Relación con el turno de canal

`runtime.channel.turn.*` debería permanecer durante la migración.

Debería convertirse en un adaptador de compatibilidad:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` también debería permanecer inicialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Después de que todos los plugins incluidos y las rutas de compatibilidad de terceros conocidas estén puenteados,
`channel.turn` puede quedar obsoleto. No debería eliminarse hasta que haya una
ruta de migración del SDK publicada y pruebas de contrato que demuestren que los plugins antiguos aún funcionan
o fallan con un error de versión claro.

## Medidas de protección de compatibilidad

Durante la migración, la entrega durable genérica es opcional para cualquier canal cuyo
callback de entrega existente tenga efectos secundarios más allá de "envía esta carga útil".

Los puntos de entrada heredados no son durables de forma predeterminada:

- `channel.turn.run` y `dispatchAssembledChannelTurn` usan el callback de
  entrega del canal a menos que ese canal proporcione explícitamente un objeto de
  política/opciones durables auditado.
- `channel.turn.runPrepared` sigue siendo propiedad del canal hasta que el despachador preparado
  llame explícitamente al contexto de envío.
- Los helpers de compatibilidad públicos como `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` y los helpers de DM directos nunca inyectan entrega
  durable genérica antes del callback `deliver` o `reply` proporcionado por el llamador.

Para los tipos de puente de migración, `durable: undefined` significa "no durable". La
ruta durable se activa solo mediante un valor explícito de política/opciones. `durable:
false` puede permanecer como una grafía de compatibilidad, pero la implementación no debería
requerir que todos los canales no migrados la agreguen.

El código de puente actual debe mantener explícita la decisión de durabilidad:

- La entrega final duradera devuelve un estado discriminado. `handled_visible` y
  `handled_no_send` son terminales; `unsupported` y `not_applicable` pueden
  recurrir a la entrega propiedad del canal; `failed` propaga el fallo de envío.
- La entrega final duradera genérica está controlada por capacidades del adaptador
  como la entrega silenciosa, la preservación del destino de respuesta, la
  preservación de citas nativas y los hooks de envío de mensajes. Si falta
  paridad, debe elegirse la entrega propiedad del canal, no un envío genérico
  que cambie el comportamiento visible para el usuario.
- Los envíos duraderos respaldados por cola exponen una referencia de intención
  de entrega. Los campos de sesión `pendingFinalDelivery*` existentes pueden
  transportar el id de la intención durante la transición; el estado final es un
  almacén `MessageSendIntent` en lugar de texto de respuesta congelado más campos
  de contexto ad hoc.

No habilites la ruta duradera genérica para un canal hasta que todo esto sea
verdadero:

- El adaptador de envío genérico ejecuta el mismo comportamiento de renderizado
  y transporte que la ruta directa anterior.
- Los efectos secundarios locales posteriores al envío se preservan mediante el
  contexto de envío.
- El adaptador devuelve recibos o resultados de entrega con todos los ids de
  mensajes de la plataforma.
- Las rutas de despachador preparadas llaman al nuevo contexto de envío o
  permanecen documentadas como fuera de la garantía duradera.
- La entrega alternativa maneja cada carga útil proyectada, no solo la primera.
- La entrega alternativa duradera registra todo el arreglo de cargas útiles
  proyectadas como una sola intención reproducible o plan por lotes.

Riesgos concretos de migración que se deben preservar:

- La entrega del monitor de iMessage registra los mensajes enviados en una caché
  de eco después de un envío exitoso. Los envíos finales duraderos todavía deben
  poblar esa caché; de lo contrario, OpenClaw puede reingerir sus propias
  respuestas finales como mensajes entrantes de usuario.
- Tlon agrega una firma opcional del modelo y registra los hilos participados
  después de respuestas de grupo. La entrega duradera genérica no debe omitir
  esos efectos; muévelos a los adaptadores de renderizado/envío/finalización de
  Tlon o mantén Tlon en la ruta propiedad del canal.
- Discord y otros despachadores preparados ya son propietarios de la entrega
  directa y del comportamiento de vista previa. No están cubiertos por una
  garantía duradera de turno ensamblado hasta que sus despachadores preparados
  enruten explícitamente los finales mediante el contexto de envío.
- La entrega alternativa silenciosa de Telegram debe entregar todo el arreglo de
  cargas útiles proyectadas. Un atajo de una sola carga útil puede descartar
  cargas útiles alternativas adicionales después de la proyección.
- LINE, BlueBubbles, Zalo, Nostr y otras rutas ensambladas/de ayuda existentes
  pueden tener manejo de tokens de respuesta, proxy de medios, cachés de mensajes
  enviados, limpieza de carga/estado o destinos solo de callback. Permanecen en
  la entrega propiedad del canal hasta que esas semánticas estén representadas
  por el adaptador de envío y verificadas mediante pruebas.
- Los ayudantes de DM directo pueden tener un callback de respuesta que es el
  único destino de transporte correcto. La salida genérica no debe adivinar a
  partir de `OriginatingTo` o `To` y omitir ese callback.
- La salida de fallos del Gateway de OpenClaw debe seguir visible para humanos,
  pero los ecos de sala etiquetados como escritos por bots deben descartarse
  antes de la autorización `allowBots`. Los canales no deben implementar esto con
  filtros de prefijo de texto visible salvo como una medida provisional breve de
  emergencia; el contrato duradero es metadatos de origen estructurados.

## Almacenamiento interno

La cola duradera debe almacenar intenciones de envío de mensajes, no cargas
útiles de respuesta.

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

Bucle de recuperación:

```text
load pending or sending intents
  -> acquire idempotency lock
  -> skip if receipt already committed
  -> reconstruct send context
  -> render if needed
  -> reconcile unknown_after_send if needed
  -> call adapter send/edit/finalize
  -> commit receipt, mark unknown_after_send, or schedule retry
```

La cola debe conservar suficiente identidad para reproducir mediante la misma
cuenta, hilo, destino, política de formato y reglas de medios después de un
reinicio.

## Clases de fallo

Los adaptadores de canal clasifican los fallos de transporte en categorías
cerradas:

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

Política del núcleo:

- Reintentar `transient` y `rate_limit`.
- No reintentar `invalid_payload` salvo que exista una alternativa de
  renderizado.
- No reintentar `auth` ni `permission` hasta que cambie la configuración.
- Para `not_found`, permitir que la finalización en vivo pase de edición a envío
  nuevo cuando el canal declare que es seguro.
- Para `conflict`, usar reglas de recibo/idempotencia para decidir si el mensaje
  ya existe.
- Cualquier error posterior a que el adaptador pueda haber completado E/S de la
  plataforma, pero anterior a confirmar el recibo, pasa a ser
  `unknown_after_send`, salvo que el adaptador pueda demostrar que la operación
  de la plataforma no ocurrió.

## Mapeo de canales

| Canal                    | Migración objetivo                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram                 | Recibir política de acuse de recibo más envíos finales duraderos. El adaptador en vivo es responsable del envío más la edición de vista previa, el envío final de vista previa obsoleta, temas, omisión de vista previa de respuesta con cita, alternativa para medios y manejo de retry-after.                                                                 |
| Discord                  | El adaptador de envío envuelve la entrega de cargas útiles duraderas existente. El adaptador en vivo es responsable de la edición de borradores, el borrador de progreso, la cancelación de vista previa de medios/error, la preservación del destino de respuesta y los recibos de id de mensaje. Auditar ecos de fallos del Gateway escritos por bot en salas compartidas; usar un registro saliente u otro equivalente nativo si Discord no puede transportar metadatos de origen en mensajes normales. |
| Slack                    | El adaptador de envío maneja publicaciones de chat normales. El adaptador en vivo elige el stream nativo cuando la forma del hilo lo permite; de lo contrario, usa vista previa de borrador. Los recibos preservan las marcas de tiempo del hilo. El adaptador de origen asigna fallos del Gateway de OpenClaw a `chat.postMessage.metadata` de Slack y descarta ecos etiquetados de sala de bot antes de la autorización `allowBots`. |
| WhatsApp                 | El adaptador de envío es responsable del envío de texto/medios con intenciones finales duraderas. El adaptador de recepción maneja la mención de grupo y la identidad del remitente. El adaptador en vivo puede seguir ausente hasta que WhatsApp tenga un transporte editable.                                                                                 |
| Matrix                   | El adaptador en vivo es responsable de ediciones de eventos de borrador, finalización, redacción, restricciones de medios cifrados y alternativa ante discrepancia del destino de respuesta. El adaptador de recepción es responsable de hidratar y deduplicar eventos cifrados. El adaptador de origen debe codificar el origen de fallo del Gateway de OpenClaw en el contenido del evento de Matrix y descartar ecos de sala de bot configurados antes del manejo de `allowBots`. |
| Mattermost               | El adaptador en vivo es responsable de una publicación de borrador, plegado de progreso/herramientas, finalización en el lugar y alternativa de envío nuevo.                                                                                                                                                                                                   |
| Microsoft Teams          | El adaptador en vivo es responsable del progreso nativo y el comportamiento de stream de bloques. El adaptador de envío es responsable de actividades y recibos de adjuntos/tarjetas.                                                                                                                                                                          |
| Feishu                   | El adaptador de renderizado es responsable del renderizado de texto/tarjeta/raw. El adaptador en vivo es responsable de tarjetas en streaming y supresión de finales duplicados. El adaptador de envío es responsable de comentarios, sesiones de tema, medios y supresión de voz.                                                                               |
| QQ Bot                   | El adaptador en vivo es responsable del streaming C2C, el tiempo de espera del acumulador y el envío final alternativo. El adaptador de renderizado es responsable de etiquetas de medios y texto como voz.                                                                                                                                                    |
| Signal                   | Adaptador simple de recepción más envío. Sin adaptador en vivo salvo que signal-cli agregue soporte de edición confiable.                                                                                                                                                                                                                                      |
| iMessage and BlueBubbles | Adaptador simple de recepción más envío. El envío de iMessage debe preservar la población de la caché de eco del monitor antes de que los finales duraderos puedan omitir la entrega del monitor. La escritura, reacciones y adjuntos específicos de BlueBubbles siguen siendo capacidades del adaptador.                                                        |
| Google Chat              | Adaptador simple de recepción más envío con relación de hilo asignada a espacios e ids de hilo. Auditar el comportamiento de sala `allowBots=true` para ecos etiquetados de fallo del Gateway de OpenClaw.                                                                                                                                                    |
| LINE                     | Adaptador simple de recepción más envío con restricciones de token de respuesta modeladas como capacidad de destino/relación.                                                                                                                                                                                                                                  |
| Nextcloud Talk           | Puente de recepción SDK más adaptador de envío.                                                                                                                                                                                                                                                                                                                |
| IRC                      | Adaptador simple de recepción más envío, sin recibos de edición duraderos.                                                                                                                                                                                                                                                                                     |
| Nostr                    | Adaptador de recepción más envío para DM cifrados; los recibos son ids de evento.                                                                                                                                                                                                                                                                              |
| QA Channel               | Adaptador de pruebas de contrato para comportamiento de recepción, envío, en vivo, reintento y recuperación.                                                                                                                                                                                                                                                   |
| Synology Chat            | Adaptador simple de recepción más envío.                                                                                                                                                                                                                                                                                                                       |
| Tlon                     | El adaptador de envío debe preservar el renderizado de firma del modelo y el seguimiento de hilos participados antes de habilitar la entrega final duradera genérica.                                                                                                                                                                                          |
| Twitch                   | Adaptador simple de recepción más envío con clasificación de límites de tasa.                                                                                                                                                                                                                                                                                  |
| Zalo                     | Adaptador simple de recepción más envío.                                                                                                                                                                                                                                                                                                                       |
| Zalo Personal            | Adaptador simple de recepción más envío.                                                                                                                                                                                                                                                                                                                       |

## Plan de migración

### Fase 1: Dominio interno de mensajes

- Agregar tipos `src/channels/message/*` para mensajes, destinos, relaciones,
  orígenes, recibos, capacidades, intenciones duraderas, contexto de recepción, contexto de envío,
  contexto en vivo y clases de fallo.
- Agregar `origin?: MessageOrigin` al tipo de carga útil del puente de migración usado por
  la entrega de respuestas actual; luego mover ese campo a `ChannelMessage` y a los tipos de
  mensaje renderizado a medida que la refactorización reemplace las cargas útiles de respuesta.
- Mantener esto interno hasta que los adaptadores y las pruebas demuestren la forma.
- Agregar pruebas unitarias puras para transiciones de estado y serialización.

### Fase 2: Núcleo de envío duradero

- Mover la cola saliente existente desde la durabilidad de cargas útiles de respuesta a intenciones de envío de mensajes
  duraderas.
- Permitir que una intención de envío duradera transporte un arreglo de cargas útiles proyectadas o un plan de lote, no
  solo una carga útil de respuesta.
- Preservar el comportamiento actual de recuperación de cola mediante conversión de compatibilidad.
- Hacer que `deliverOutboundPayloads` llame a `messages.send`.
- Hacer que la durabilidad del envío final sea el valor predeterminado y falle de forma cerrada cuando la intención duradera
  no pueda escribirse en el nuevo ciclo de vida de mensajes, después de que el adaptador declare
  seguridad de reproducción. Las rutas existentes de turno de canal y compatibilidad SDK siguen siendo
  de envío directo de forma predeterminada durante esta fase.
- Registrar recibos de forma coherente.
- Devolver recibos y resultados de entrega al llamador del despachador original en lugar
  de tratar el envío duradero como un efecto secundario terminal.
- Persistir el origen del mensaje mediante intenciones de envío duraderas para que la recuperación, la reproducción y
  los envíos fragmentados preserven la procedencia operativa de OpenClaw.

### Fase 3: Puente de turno de canal

- Reimplementar `channel.turn.run` y `dispatchAssembledChannelTurn` sobre
  `messages.receive` y `messages.send`.
- Mantener estables los tipos de hechos actuales.
- Mantener el comportamiento heredado de forma predeterminada. Un canal de turno ensamblado se vuelve duradero
  solo cuando su adaptador opta explícitamente por una política de durabilidad segura para reproducción.
- Mantener `durable: false` como una vía de escape de compatibilidad para rutas que finalizan
  ediciones nativas y aún no pueden reproducirse de forma segura, pero no depender de marcadores `false`
  para proteger canales no migrados.
- Aplicar la durabilidad predeterminada de turnos ensamblados solo en el nuevo ciclo de vida de mensajes, después
  de que la asignación del canal demuestre que la ruta de envío genérica preserva la semántica antigua
  de entrega del canal.

### Fase 4: Puente del despachador preparado

- Reemplaza `deliverDurableInboundReplyPayload` por un puente de contexto de envío.
- Mantén el helper antiguo como wrapper.
- Migra primero Telegram, WhatsApp, Slack, Signal, iMessage y Discord porque
  ya tienen trabajo de final durable o rutas de envío más simples.
- Trata cada dispatcher preparado como no cubierto hasta que opte explícitamente
  por el contexto de envío. La documentación y las entradas del registro de cambios deben decir "turnos de canal ensamblados" o nombrar las rutas de canal migradas en lugar de afirmar todas
  las respuestas finales automáticas.
- Mantén el comportamiento de `recordInboundSessionAndDispatchReply`, los helpers de DM directa y helpers públicos de compatibilidad similares. Pueden exponer una opción explícita de contexto de envío más adelante, pero no deben intentar automáticamente una entrega durable genérica antes del callback de entrega propiedad del llamador.

### Fase 5: Ciclo de vida en vivo unificado

- Crea `messages.live` con dos adaptadores de prueba:
  - Telegram para envío, edición y envío final obsoleto.
  - Matrix para finalización de borrador y fallback de redacción.
- Luego migra Discord, Slack, Mattermost, Teams, QQ Bot y Feishu.
- Elimina el código duplicado de finalización de vista previa solo después de que cada canal tenga
  pruebas de paridad.

### Fase 6: SDK público

- Agrega `openclaw/plugin-sdk/channel-message`.
- Documéntalo como la API preferida para plugins de canal.
- Actualiza las exportaciones del paquete, el inventario de puntos de entrada, las líneas base de API generadas y
  la documentación del SDK de plugins.
- Incluye `MessageOrigin`, hooks de codificación/decodificación de origen y el predicado compartido
  `shouldDropOpenClawEcho` en la superficie del SDK channel-message.
- Mantén wrappers de compatibilidad para las subrutas antiguas.
- Marca los helpers del SDK con nombre de respuesta como obsoletos en la documentación después de migrar los plugins incluidos.

### Fase 7: Todos los remitentes

Mueve todos los productores salientes que no son respuestas a `messages.send`:

- notificaciones de cron y heartbeat
- finalizaciones de tareas
- resultados de hooks
- solicitudes y resultados de aprobación
- envíos de la herramienta de mensajes
- anuncios de finalización de subagentes
- envíos explícitos desde CLI o Control UI
- rutas de automatización/difusión

Aquí es donde el modelo deja de ser "respuestas del agente" y pasa a ser "OpenClaw envía
mensajes".

### Fase 8: Obsolecer Turn

- Mantén `channel.turn` como wrapper durante al menos una ventana de compatibilidad.
- Publica notas de migración.
- Ejecuta pruebas de compatibilidad del SDK de plugins contra importaciones antiguas.
- Elimina u oculta los helpers internos antiguos solo después de que ningún plugin incluido los necesite
  y los contratos de terceros tengan un reemplazo estable.

## Plan de pruebas

Pruebas unitarias:

- Serialización y recuperación de intenciones de envío durables.
- Reutilización de claves de idempotencia y supresión de duplicados.
- Confirmación de recibos y omisión de reproducción.
- Recuperación de `unknown_after_send` que reconcilia antes de reproducir cuando un adaptador
  admite reconciliación.
- Política de clasificación de fallos.
- Secuenciación de la política de acuse de recepción.
- Asignación de relaciones para envíos de respuesta, seguimiento, sistema y difusión.
- Fábrica de origen de fallo de Gateway y predicado `shouldDropOpenClawEcho`.
- Preservación del origen mediante normalización de payload, fragmentación, serialización de cola durable y recuperación.

Pruebas de integración:

- El adaptador simple de `channel.turn.run` aún registra y envía.
- La entrega heredada de turnos ensamblados no se vuelve durable a menos que el canal
  opte explícitamente por ello.
- El puente `channel.turn.runPrepared` aún registra y finaliza.
- Los helpers públicos de compatibilidad llaman por defecto a los callbacks de entrega propiedad del llamador
  y no hacen un envío genérico antes de esos callbacks.
- La entrega de fallback durable reproduce todo el arreglo de payload proyectado después de
  reiniciar y no puede dejar los payloads posteriores sin registrar tras un fallo temprano.
- La entrega durable de turnos ensamblados devuelve ids de mensajes de la plataforma al dispatcher
  con búfer.
- Los hooks de entrega personalizados aún devuelven ids de mensajes de la plataforma cuando la entrega durable
  está deshabilitada o no está disponible.
- La respuesta final sobrevive a un reinicio entre la finalización del asistente y el envío a la plataforma.
- El borrador de vista previa se finaliza en el mismo lugar cuando está permitido.
- El borrador de vista previa se cancela o redacta cuando un desajuste de medio/error/destino de respuesta
  requiere entrega normal.
- La transmisión por bloques y la transmisión de vista previa no entregan ambas el mismo texto.
- Los medios transmitidos temprano no se duplican en la entrega final.

Pruebas de canal:

- Respuesta de tema de Telegram con acuse de sondeo retrasado hasta la marca de agua completada segura
  del contexto de recepción.
- Recuperación de sondeo de Telegram para actualizaciones aceptadas pero no entregadas cubierta por
  el modelo persistido de offset completado seguro.
- La vista previa obsoleta de Telegram envía un final nuevo y limpia la vista previa.
- El fallback silencioso de Telegram envía cada payload de fallback proyectado.
- La durabilidad del fallback silencioso de Telegram registra atómicamente todo el arreglo de fallback proyectado,
  no una intención durable de un solo payload por cada iteración del bucle.
- Cancelación de vista previa de Discord en medio/error/respuesta explícita.
- Los finales del dispatcher preparado de Discord se enrutan a través del contexto de envío antes de que la documentación
  o el registro de cambios afirmen durabilidad de respuesta final de Discord.
- Los envíos finales durables de iMessage rellenan la caché de ecos de mensajes enviados del monitor.
- Las rutas de entrega heredadas de LINE, BlueBubbles, Zalo y Nostr no se omiten por
  envío durable genérico hasta que existan sus pruebas de paridad de adaptador.
- La entrega por callback de Direct-DM/Nostr sigue siendo autoritativa a menos que se migre explícitamente
  a un destino de mensaje completo y un adaptador de envío seguro para reproducción.
- Los mensajes etiquetados de fallo de Gateway de OpenClaw en Slack permanecen visibles como salientes, los ecos etiquetados
  de sala de bot se descartan antes de `allowBots`, y los mensajes de bot sin etiqueta con el
  mismo texto visible siguen la autorización normal de bot.
- Fallback de transmisión nativa de Slack a borrador de vista previa en DM de nivel superior.
- Finalización de vista previa y fallback de redacción de Matrix.
- Los ecos de sala etiquetados como fallo de Gateway de OpenClaw desde cuentas de bot configuradas de Matrix
  se descartan antes del manejo de `allowBots`.
- Las auditorías en cascada de fallo de Gateway en salas compartidas de Discord y Google Chat cubren
  los modos de `allowBots` antes de afirmar protección genérica allí.
- Finalización de borrador y fallback de envío nuevo de Mattermost.
- Finalización de progreso nativo de Teams.
- Supresión de final duplicado de Feishu.
- Fallback por timeout del acumulador de QQ Bot.
- Los envíos finales durables de Tlon preservan el renderizado de firma del modelo y el seguimiento
  de hilos participados.
- Envíos finales durables simples de WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo y Zalo Personal.

Validación:

- Archivos Vitest dirigidos durante el desarrollo.
- `pnpm check:changed` en Testbox para toda la superficie modificada.
- `pnpm check` más amplio en Testbox antes de integrar el refactor completo o después de
  cambios públicos de SDK/exportación.
- Smoke en vivo o qa-channel para al menos un canal con capacidad de edición y un
  canal simple de solo envío antes de eliminar wrappers de compatibilidad.

## Preguntas abiertas

- Si Telegram debería reemplazar eventualmente la fuente del runner de grammY por una
  fuente de sondeo completamente durable que pueda controlar la reentrega a nivel de plataforma, no
  solo la marca de agua persistida de reinicio de OpenClaw.
- Si el estado durable de vista previa en vivo debería almacenarse en el mismo registro de cola
  que la intención de envío final o en un almacén hermano de estado en vivo.
- Cuánto tiempo permanecen documentados los wrappers de compatibilidad después de que
  `plugin-sdk/channel-message` se publique.
- Si los plugins de terceros deberían implementar adaptadores de recepción directamente o solo
  proporcionar hooks normalize/send/live mediante `defineChannelMessageAdapter`.
- Qué campos de recibo es seguro exponer en el SDK público frente al estado interno
  de runtime.
- Si los efectos secundarios como cachés de eco propio y marcadores de hilos participados
  deberían modelarse como hooks de contexto de envío, pasos de finalización propiedad del adaptador o
  suscriptores de recibos.
- Qué canales tienen metadatos de origen nativos, cuáles necesitan registros salientes persistidos
  y cuáles no pueden ofrecer supresión confiable de eco entre bots.

## Criterios de aceptación

- Cada canal de mensajes incluido envía la salida visible final mediante
  `messages.send`.
- Cada canal de mensajes entrantes entra mediante `messages.receive` o un
  wrapper de compatibilidad documentado.
- Cada canal de vista previa/edición/transmisión usa `messages.live` para el estado de borrador y
  la finalización.
- `channel.turn` es solo un wrapper.
- Los helpers del SDK con nombre de respuesta son exportaciones de compatibilidad, no la ruta recomendada.
- La recuperación durable puede reproducir envíos finales pendientes después de reiniciar sin perder
  la respuesta final ni duplicar envíos ya confirmados; los envíos cuyo
  resultado de plataforma es desconocido se reconcilian antes de reproducir o se documentan como
  al-menos-una-vez para ese adaptador.
- Los envíos finales durables fallan de forma cerrada cuando no se puede escribir la intención durable,
  a menos que un llamador haya seleccionado explícitamente un modo no durable documentado.
- Los helpers heredados de channel-turn y de compatibilidad del SDK usan por defecto entrega directa
  propiedad del canal; el envío durable genérico requiere opción explícita.
- Los recibos preservan todos los ids de mensajes de la plataforma para entregas multipartes y un
  id primario para comodidad de hilos/edición.
- Los wrappers durables preservan los efectos secundarios locales del canal antes de reemplazar callbacks
  de entrega directa.
- Los dispatchers preparados no se cuentan como durables hasta que su ruta de entrega final
  use explícitamente el contexto de envío.
- La entrega de fallback maneja cada payload proyectado.
- La entrega de fallback durable registra cada payload proyectado en una intención reproducible
  o plan de lote.
- La salida de fallo de Gateway originada por OpenClaw es visible para humanos, pero los
  ecos de sala etiquetados y escritos por bots se descartan antes de la autorización de bots en canales que
  declaran soporte para el contrato de origen.
- La documentación explica envío, recepción, en vivo, estado, recibos, relaciones, política de fallos,
  migración y cobertura de pruebas.

## Relacionado

- [Mensajes](/es/concepts/messages)
- [Transmisión y fragmentación](/es/concepts/streaming)
- [Borradores de progreso](/es/concepts/progress-drafts)
- [Política de reintentos](/es/concepts/retry)
- [Kernel de turno de canal](/es/plugins/sdk-channel-turn)
