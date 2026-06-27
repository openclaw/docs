---
read_when:
    - Refactorización del comportamiento de envío o recepción del canal
    - Cambiar la entrada de canales, el despacho de respuestas, la cola de salida, la transmisión de vistas previas o las APIs de mensajes del SDK de Plugin
    - Diseñar un nuevo plugin de canal que necesita envíos duraderos, confirmaciones de recepción, vistas previas, ediciones o reintentos
summary: Plan de diseño para el ciclo de vida unificado y duradero de recepción, envío, vista previa, edición y transmisión de mensajes
title: Refactorización del ciclo de vida de los mensajes
x-i18n:
    generated_at: "2026-06-27T11:13:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09afead1194a62453342af6feac20fbed24a7761db07a80234333b65947798bb
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Esta página es el diseño objetivo para reemplazar los auxiliares dispersos de entrada de canal, despacho de respuestas, streaming de vistas previas y entrega saliente con un ciclo de vida de mensajes duradero.

La versión breve:

- Las primitivas principales deben ser **recibir** y **enviar**, no **responder**.
- Una respuesta es solo una relación en un mensaje saliente.
- Un turno es una comodidad para procesar entradas, no el propietario de la entrega.
- El envío debe basarse en contexto: `begin`, renderizar, vista previa o streaming, envío final, confirmar, fallar.
- La recepción también debe basarse en contexto: normalizar, deduplicar, enrutar, registrar, despachar, acuse de plataforma, fallar.
- El SDK público de plugins debe reducirse a una única superficie pequeña de salida de canal.

## Problemas

La pila de canales actual creció a partir de varias necesidades locales válidas:

- Los adaptadores de entrada simples usan `runtime.channel.inbound.run`.
- Los adaptadores enriquecidos usan `runtime.channel.inbound.runPreparedReply`.
- Los auxiliares heredados usan `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, auxiliares de payload de respuesta, fragmentación de respuestas, referencias de respuesta y auxiliares de runtime saliente.
- El streaming de vistas previas vive en despachadores específicos del canal.
- La durabilidad de la entrega final se está agregando alrededor de las rutas de payload de respuesta existentes.

Esa forma corrige errores locales, pero deja a OpenClaw con demasiados conceptos públicos y demasiados lugares donde la semántica de entrega puede divergir.

El problema de fiabilidad que expuso esto es:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

La invariante objetivo es más amplia que Telegram: una vez que el núcleo decide que debe existir un mensaje saliente visible, la intención debe ser duradera antes de intentar el envío de plataforma, y el recibo de la plataforma debe confirmarse después del éxito. Eso le da a OpenClaw recuperación al menos una vez. El comportamiento exactamente una vez existe solo para adaptadores que pueden demostrar idempotencia nativa o reconciliar un intento con resultado desconocido después del envío contra el estado de la plataforma antes de reproducirlo.

Ese es el estado final de esta refactorización, no una descripción de todas las rutas actuales. Durante la migración, los auxiliares salientes existentes todavía pueden caer en un envío directo cuando las escrituras de cola de mejor esfuerzo fallen. La refactorización estará completa solo cuando los envíos finales duraderos fallen de forma cerrada o se excluyan explícitamente con una política no duradera documentada.

## Objetivos

- Un único ciclo de vida central para todas las rutas de recepción y envío de mensajes de canal.
- Envíos finales duraderos de forma predeterminada en el nuevo ciclo de vida de mensajes después de que un adaptador declare un comportamiento seguro para reproducción.
- Semánticas compartidas de vista previa, edición, streaming, finalización, reintento, recuperación y recibo.
- Una superficie pequeña de SDK de plugins que los plugins de terceros puedan aprender y mantener.
- Compatibilidad para llamadores existentes de compatibilidad de respuestas de entrada durante la migración.
- Puntos de extensión claros para nuevas capacidades de canal.
- Sin ramas específicas de plataforma en el núcleo.
- Sin mensajes de canal de delta de tokens. El streaming de canal sigue siendo vista previa de mensaje, edición, anexado o entrega de bloque completado.
- Metadatos estructurados originados en OpenClaw para salida operativa/del sistema, de modo que los fallos visibles del Gateway no vuelvan a entrar en salas compartidas con bots habilitados como prompts nuevos.

## No objetivos

- No forzar a todos los canales existentes a la entrega duradera de mensajes en la primera fase.
- No forzar a todos los canales al mismo comportamiento de transporte nativo.
- No enseñar al núcleo temas de Telegram, streams nativos de Slack, redacciones de Matrix, tarjetas de Feishu, voz de QQ ni actividades de Teams.
- No publicar todos los auxiliares internos de migración como API estable del SDK.
- No hacer que los reintentos reproduzcan operaciones de plataforma no idempotentes ya completadas.

## Modelo de referencia

Vercel Chat tiene un buen modelo mental público:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- métodos de adaptador como `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` y obtenciones de historial
- un adaptador de estado para deduplicación, bloqueos, colas y persistencia

OpenClaw debe tomar prestado el vocabulario, no copiar la superficie.

Lo que OpenClaw necesita más allá de ese modelo:

- Intenciones duraderas de envío saliente antes de llamadas directas de transporte.
- Contextos de envío explícitos con inicio, confirmación y fallo.
- Contextos de recepción que conozcan la política de acuse de plataforma.
- Recibos que sobrevivan a reinicios y puedan impulsar ediciones, eliminaciones, recuperación y supresión de duplicados.
- Un SDK público más pequeño. Los plugins incluidos pueden usar auxiliares internos de runtime, pero los plugins de terceros deben ver una única API de mensajes coherente.
- Comportamiento específico de agente: sesiones, transcripciones, streaming de bloques, progreso de herramientas, aprobaciones, directivas de medios, respuestas silenciosas e historial de menciones de grupo.

Las promesas de estilo `thread.post()` no son suficientes para OpenClaw. Ocultan el límite transaccional que decide si un envío es recuperable.

## Modelo central

El nuevo dominio debe vivir bajo un espacio de nombres central interno como `src/channels/message/*`.

Tiene cuatro conceptos:

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` posee el ciclo de vida de entrada.

`send` posee el ciclo de vida saliente.

`live` posee el estado de vista previa, edición, progreso y streaming.

`state` posee el almacenamiento duradero de intenciones, recibos, idempotencia, recuperación, bloqueos y deduplicación.

## Términos de mensaje

### Mensaje

Un mensaje normalizado es neutral respecto de la plataforma:

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

El origen describe quién produjo un mensaje y cómo OpenClaw debe tratar los ecos de ese mensaje. Es independiente de la relación: un mensaje puede ser una respuesta a un usuario y aun así ser salida operativa originada en OpenClaw.

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

El primer uso requerido es la salida de fallos del Gateway. Los humanos todavía deben ver mensajes como "Agent failed before reply" o "Missing API key", pero la salida operativa etiquetada de OpenClaw no debe aceptarse como entrada escrita por bot en salas compartidas cuando `allowBots` está habilitado.

### Recibo

Los recibos son entidades de primera clase:

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

Los recibos son el puente desde la intención duradera hacia la edición futura, eliminación, finalización de vistas previas, supresión de duplicados y recuperación.

Un recibo puede describir un mensaje de plataforma o una entrega de varias partes. El texto fragmentado, medios más texto, voz más texto y alternativas de tarjetas deben preservar todos los ids de plataforma sin dejar de exponer un id principal para hilos y ediciones posteriores.

## Contexto de recepción

La recepción no debe ser una llamada auxiliar sin contexto. El núcleo necesita un contexto que conozca la deduplicación, el enrutamiento, el registro de sesiones y la política de acuse de plataforma.

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

El acuse no es una sola cosa. El contrato de recepción debe mantener estas señales separadas:

- **Acuse de transporte:** indica al webhook o socket de la plataforma que OpenClaw aceptó el sobre del evento. Algunas plataformas lo requieren antes del despacho.
- **Acuse de offset de polling:** avanza un cursor para que el mismo evento no se obtenga de nuevo. Esto no debe avanzar más allá del trabajo que no pueda recuperarse.
- **Acuse de registro de entrada:** confirma que OpenClaw persistió suficientes metadatos de entrada para deduplicar y enrutar una reentrega.
- **Recibo visible para el usuario:** comportamiento opcional de lectura/estado/escritura; nunca un límite de durabilidad.

`ReceiveAckPolicy` controla solo el reconocimiento de transporte o polling. No debe reutilizarse para recibos de lectura o reacciones de estado.

Antes de la autorización de bots, la recepción debe aplicar la política compartida de eco de OpenClaw cuando el canal pueda decodificar metadatos de origen del mensaje:

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

Este descarte se basa en etiquetas, no en texto. Un mensaje de sala escrito por bot con el mismo texto visible de fallo del Gateway pero sin metadatos de origen de OpenClaw todavía pasa por la autorización normal de `allowBots`.

La política de acuse es explícita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

El polling de Telegram ahora usa la política de acuse del contexto de recepción para su marca de agua persistida tras reinicio. El rastreador sigue observando actualizaciones de grammY cuando entran en la cadena de middleware, pero OpenClaw persiste solo el id de actualización completado seguro después de un despacho exitoso, lo que deja las actualizaciones fallidas o pendientes inferiores reproducibles tras un reinicio. El offset de obtención `getUpdates` upstream de Telegram sigue controlado por la biblioteca de polling, por lo que el recorte más profundo restante es una fuente de polling completamente duradera si necesitamos reentrega a nivel de plataforma más allá de la marca de agua de reinicio de OpenClaw. Las plataformas de webhook pueden necesitar acuse HTTP inmediato, pero aun así necesitan deduplicación de entrada e intenciones duraderas de envío saliente porque los webhooks pueden reentregar.

## Contexto de envío

El envío también se basa en el contexto:

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

El ayudante se expande a:

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

La intención debe existir antes de la E/S de transporte. Un reinicio después del inicio pero antes de
la confirmación es recuperable.

El límite peligroso está después del éxito de la plataforma y antes de confirmar el recibo. Si un
proceso muere allí, OpenClaw no puede saber si el mensaje de la plataforma existe
a menos que el adaptador proporcione idempotencia nativa o una ruta de conciliación de recibos.
Esos intentos deben reanudarse en `unknown_after_send`, no repetirse a ciegas. Los canales
sin conciliación pueden elegir repetición al menos una vez solo si los mensajes visibles
duplicados son una compensación aceptable y documentada para ese canal y esa relación.
El puente de conciliación actual del SDK requiere que el adaptador declare
`reconcileUnknownSend`, y luego pide a `durableFinal.reconcileUnknownSend` que
clasifique una entrada desconocida como `sent`, `not_sent` o `unresolved`; solo `not_sent`
permite repetir, y las entradas no resueltas permanecen terminales o reintentan solo la
comprobación de conciliación.

La política de durabilidad debe ser explícita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa que el núcleo debe fallar de forma cerrada cuando no pueda escribir la intención durable.
`best_effort` puede continuar cuando la persistencia no está disponible. `disabled` mantiene
el antiguo comportamiento de envío directo. Durante la migración, los envoltorios heredados y los ayudantes de
compatibilidad públicos usan `disabled` de forma predeterminada; no deben inferir `required` del
hecho de que un canal tenga un adaptador de salida genérico.

Los contextos de envío también son dueños de los efectos posteriores al envío locales del canal. Una migración no es segura
si la entrega durable omite comportamiento local que antes estaba adjunto a la
ruta de envío directo del canal. Algunos ejemplos incluyen cachés de supresión de autoeco,
marcadores de participación en hilos, anclajes de edición nativos, renderizado de firma del modelo
y protectores contra duplicados específicos de la plataforma. Esos efectos deben moverse al
adaptador de envío, al adaptador de renderizado o a un hook de contexto de envío con nombre antes de que ese
canal pueda habilitar la entrega final genérica durable.

Los ayudantes de envío deben devolver recibos hasta su llamador. Los
envoltorios durables no pueden tragarse ids de mensaje ni reemplazar el resultado de entrega de un canal por
`undefined`; los despachadores en búfer usan esos ids para anclajes de hilo, ediciones posteriores,
finalización de vista previa y supresión de duplicados.

Los envíos de reserva operan sobre lotes, no sobre cargas individuales. Las reescrituras de respuesta silenciosa,
la reserva de medios, la reserva de tarjetas y la proyección de fragmentos pueden producir más de
un mensaje entregable, por lo que un contexto de envío debe entregar todo el
lote proyectado o documentar explícitamente por qué solo una carga es válida.

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

Cuando una reserva de ese tipo es durable, todo el lote proyectado debe estar representado por
una intención de envío durable o por otro plan de lote atómico. Registrar cada carga
una por una no basta: una caída entre cargas puede dejar una reserva visible
parcial sin registro durable para las cargas restantes. La recuperación debe saber
qué unidades ya tienen recibos y repetir solo las unidades faltantes o marcar
el lote como `unknown_after_send` hasta que el adaptador lo concilie.

## Contexto en vivo

El comportamiento de vista previa, edición, progreso y stream debe ser un único ciclo de vida opcional.

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

- Envío de Telegram más edición de vista previa, con final nuevo después de que la vista previa quede obsoleta por antigüedad.
- Envío de Discord más edición de vista previa, cancelación en medios/error/respuesta explícita.
- Stream nativo de Slack o vista previa de borrador según la forma del hilo.
- Finalización de publicación de borrador de Mattermost.
- Finalización de evento de borrador de Matrix o eliminación si no coincide.
- Stream de progreso nativo de Teams.
- Stream de QQ Bot o reserva acumulada.

## Superficie del adaptador

El objetivo del SDK público debería ser una única subruta:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-outbound";
```

Forma objetivo:

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

Antes de la autorización de preflight, el núcleo debe ejecutar el predicado compartido de eco de OpenClaw
siempre que `origin.decode` devuelva metadatos de origen OpenClaw. El adaptador de recepción
proporciona hechos de la plataforma, como el autor bot y la forma de la sala; el núcleo es dueño de la decisión
de descartar y del orden, para que los canales no reimplementen filtros de texto.

Adaptador de origen:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

El núcleo establece `MessageOrigin`. Los canales solo lo traducen hacia y desde los metadatos
nativos de transporte. Slack lo asigna a `chat.postMessage({ metadata })` y
a `message.metadata` entrante; Matrix puede asignarlo a contenido adicional del evento; los canales
sin metadatos nativos pueden usar un registro de recibos/salida cuando esa sea la
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

La nueva superficie pública debería absorber o deprecar estas áreas conceptuales:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- la mayoría de los usos públicos de `outbound-runtime`
- ayudantes ad hoc de ciclo de vida de stream de borrador

Las subrutas de compatibilidad pueden permanecer como envoltorios, pero los nuevos plugins de terceros
no deberían necesitarlas.

Los plugins incluidos pueden mantener importaciones de ayudantes internos mediante subrutas de runtime
reservadas durante la migración. La documentación pública debería orientar a los autores de plugins hacia
`plugin-sdk/channel-outbound` una vez que exista.

## Relación con la entrada del canal

`runtime.channel.inbound.*` es el puente de runtime durante la migración.

Debería convertirse en un adaptador de compatibilidad:

```text
channel.inbound.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.inbound.runPreparedReply` también debería permanecer inicialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

La antigua superficie de runtime `channel.turn` fue eliminada. Los llamadores de runtime usan
`channel.inbound.*`; la documentación de canales y las subrutas del SDK usan sustantivos de entrada/mensaje.

## Límites de compatibilidad

Durante la migración, la entrega durable genérica es opcional para cualquier canal cuya
devolución de llamada de entrega existente tenga efectos secundarios más allá de “enviar esta carga”.

Los puntos de entrada heredados no son durables de forma predeterminada:

- `channel.inbound.run` y `dispatchChannelInboundReply` usan la devolución de llamada de
  entrega del canal a menos que ese canal proporcione explícitamente un objeto de política/opciones durable
  auditado.
- `channel.inbound.runPreparedReply` permanece bajo propiedad del canal hasta que el despachador preparado
  llame explícitamente al contexto de envío.
- Los ayudantes de compatibilidad públicos como `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` y los ayudantes de DM directos nunca inyectan entrega durable
  genérica antes de la devolución de llamada `deliver` o `reply` proporcionada por el llamador.

Para los tipos de puente de migración, `durable: undefined` significa “no durable”. La
ruta durable se habilita solo mediante un valor explícito de política/opciones. `durable:
false` puede permanecer como grafía de compatibilidad, pero la implementación no debería
requerir que cada canal no migrado la agregue.

El código de puente actual debe mantener explícita la decisión de durabilidad:

- La entrega final durable devuelve un estado discriminado. `handled_visible` y
  `handled_no_send` son terminales; `unsupported` y `not_applicable` pueden
  recurrir a la entrega propiedad del canal; `failed` propaga el fallo de envío.
- La entrega final durable genérica está controlada por capacidades del adaptador como
  entrega silenciosa, preservación del destino de respuesta, preservación de cita nativa y
  hooks de envío de mensajes. Si falta paridad, debe elegirse la entrega propiedad del canal,
  no un envío genérico que cambie el comportamiento visible para el usuario.
- Los envíos durables respaldados por cola exponen una referencia de intención de entrega. Los campos de sesión
  `pendingFinalDelivery*` existentes pueden llevar el id de intención durante la
  transición; el estado final es un almacén `MessageSendIntent` en lugar de texto de
  respuesta congelado más campos de contexto ad hoc.

No habilites la ruta durable genérica para un canal hasta que todo esto sea
verdadero:

- El adaptador de envío genérico ejecuta el mismo comportamiento de renderizado y transporte que
  la ruta directa anterior.
- Los efectos secundarios locales posteriores al envío se preservan mediante el contexto de envío.
- El adaptador devuelve recibos o resultados de entrega con todos los ids de mensaje de la plataforma.
- Las rutas de despachador preparadas llaman al nuevo contexto de envío o permanecen documentadas
  como fuera de la garantía durable.
- La entrega de reserva maneja cada payload proyectado, no solo el primero.
- La entrega durable de reserva registra todo el arreglo de payloads proyectados como una
  intención o plan de lote reproducible.

Peligros concretos de migración que se deben preservar:

- La entrega del monitor de iMessage registra los mensajes enviados en una caché de eco después de un
  envío exitoso. Los envíos finales durables aún deben poblar esa caché; de lo contrario,
  OpenClaw puede volver a ingerir sus propias respuestas finales como mensajes entrantes de usuario.
- Tlon agrega una firma de modelo opcional y registra los hilos participados
  después de respuestas de grupo. La entrega durable genérica no debe omitir esos efectos;
  muévelos a los adaptadores de renderizado/envío/finalización de Tlon o mantén Tlon en la
  ruta propiedad del canal.
- Discord y otros despachadores preparados ya son dueños de la entrega directa y del comportamiento de vista previa.
  No están cubiertos por una garantía durable de turno ensamblado hasta que
  sus despachadores preparados enruten explícitamente los finales mediante el contexto de envío.
- La entrega silenciosa de reserva de Telegram debe entregar todo el arreglo de payloads proyectados.
  Un atajo de payload único puede descartar payloads de reserva adicionales después
  de la proyección.
- LINE, Zalo, Nostr y otras rutas ensambladas/de ayuda existentes pueden
  tener manejo de tokens de respuesta, proxy de medios, cachés de mensajes enviados, limpieza de carga/estado
  o destinos solo de callback. Permanecen en la entrega propiedad del canal hasta
  que esas semánticas estén representadas por el adaptador de envío y verificadas por pruebas.
- Los helpers de Direct-DM pueden tener un callback de respuesta que es el único destino de transporte
  correcto. La salida genérica no debe adivinar a partir de `OriginatingTo` o `To` y omitir
  ese callback.
- La salida de fallo de OpenClaw Gateway debe permanecer visible para humanos, pero los ecos de sala
  etiquetados y escritos por bots deben descartarse antes de la autorización `allowBots`.
  Los canales no deben implementar esto con filtros de prefijo de texto visible salvo como un
  recurso de emergencia breve; el contrato durable es metadatos de origen estructurados.

## Almacenamiento interno

La cola durable debe almacenar intenciones de envío de mensajes, no payloads de respuesta.

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

La cola debe conservar suficiente identidad para reproducir mediante la misma cuenta,
hilo, destino, política de formato y reglas de medios después de reiniciar.

## Clases de fallo

Los adaptadores de canal clasifican los fallos de transporte en categorías cerradas:

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
- No reintentar `invalid_payload` salvo que exista una reserva de renderizado.
- No reintentar `auth` ni `permission` hasta que cambie la configuración.
- Para `not_found`, permitir que la finalización en vivo recurra de edición a envío nuevo cuando
  el canal declare que es seguro.
- Para `conflict`, usar las reglas de recibo/idempotencia para decidir si el mensaje
  ya existe.
- Cualquier error después de que el adaptador pueda haber completado E/S de plataforma pero antes de confirmar
  el recibo se convierte en `unknown_after_send`, salvo que el adaptador pueda demostrar que la operación de
  plataforma no ocurrió.

## Mapeo de canales

| Canal           | Migración objetivo                                                                                                                                                                                                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Recibir política de acuse más envíos finales duraderos. El adaptador en vivo posee el envío más la edición de vista previa, el envío final de vista previa obsoleta, temas, omisión de vista previa de respuesta con cita, fallback de medios y manejo de retry-after.                                                                                          |
| Discord         | El adaptador de envío envuelve la entrega de carga útil duradera existente. El adaptador en vivo posee la edición de borrador, el borrador de progreso, la cancelación de vista previa de medios/error, la preservación del destino de respuesta y los recibos de id de mensaje. Auditar los ecos de fallo de gateway escritos por bots en salas compartidas; usar un registro saliente u otro equivalente nativo si Discord no puede transportar metadatos de origen en mensajes normales. |
| Slack           | El adaptador de envío maneja publicaciones normales de chat. El adaptador en vivo elige el flujo nativo cuando la forma del hilo lo admite; de lo contrario, usa vista previa de borrador. Los recibos preservan marcas de tiempo de hilo. El adaptador de origen asigna fallos de gateway de OpenClaw a `chat.postMessage.metadata` de Slack y descarta ecos etiquetados de salas de bots antes de la autorización `allowBots`. |
| WhatsApp        | El adaptador de envío posee el envío de texto/medios con intenciones finales duraderas. El adaptador de recepción maneja la mención de grupo y la identidad del remitente. En vivo puede permanecer ausente hasta que WhatsApp tenga un transporte editable.                                                                                                      |
| Matrix          | El adaptador en vivo posee ediciones de eventos de borrador, finalización, redacción, restricciones de medios cifrados y fallback por incompatibilidad de destino de respuesta. El adaptador de recepción posee hidratación y deduplicación de eventos cifrados. El adaptador de origen debe codificar el origen de fallo de gateway de OpenClaw en el contenido de eventos de Matrix y descartar ecos de sala de bot configurados antes del manejo de `allowBots`. |
| Mattermost      | El adaptador en vivo posee una publicación de borrador, plegado de progreso/herramientas, finalización in situ y fallback de envío nuevo.                                                                                                                                                                                                                       |
| Microsoft Teams | El adaptador en vivo posee el progreso nativo y el comportamiento de flujo de bloques. El adaptador de envío posee actividades y recibos de adjuntos/tarjetas.                                                                                                                                                                                                  |
| Feishu          | El adaptador de renderizado posee el renderizado de texto/tarjeta/sin procesar. El adaptador en vivo posee tarjetas de streaming y supresión de finales duplicados. El adaptador de envío posee comentarios, sesiones de tema, medios y supresión de voz.                                                                                                       |
| QQ Bot          | El adaptador en vivo posee streaming C2C, timeout de acumulador y envío final de fallback. El adaptador de renderizado posee etiquetas de medios y texto como voz.                                                                                                                                                                                              |
| Signal          | Adaptador simple de recepción más envío. Sin adaptador en vivo salvo que signal-cli agregue soporte fiable de edición.                                                                                                                                                                                                                                          |
| iMessage        | Adaptador simple de recepción más envío. El envío de iMessage debe preservar la población de caché de ecos del monitor antes de que los finales duraderos puedan omitir la entrega por monitor.                                                                                                                                                                |
| Google Chat     | Adaptador simple de recepción más envío con relación de hilo asignada a espacios e ids de hilo. Auditar el comportamiento de sala con `allowBots=true` para ecos etiquetados de fallo de gateway de OpenClaw.                                                                                                                                                    |
| LINE            | Adaptador simple de recepción más envío con restricciones de reply-token modeladas como capacidad de destino/relación.                                                                                                                                                                                                                                          |
| Nextcloud Talk  | Puente de recepción SDK más adaptador de envío.                                                                                                                                                                                                                                                                                                                |
| IRC             | Adaptador simple de recepción más envío, sin recibos de edición duraderos.                                                                                                                                                                                                                                                                                      |
| Nostr           | Adaptador de recepción más envío para MD cifrados; los recibos son ids de evento.                                                                                                                                                                                                                                                                               |
| QA Channel      | Adaptador de prueba de contrato para comportamiento de recepción, envío, en vivo, reintento y recuperación.                                                                                                                                                                                                                                                     |
| Synology Chat   | Adaptador simple de recepción más envío.                                                                                                                                                                                                                                                                                                                       |
| Tlon            | El adaptador de envío debe preservar el renderizado de firma de modelo y el seguimiento de hilos participados antes de habilitar la entrega final duradera genérica.                                                                                                                                                                                            |
| Twitch          | Adaptador simple de recepción más envío con clasificación de límite de tasa.                                                                                                                                                                                                                                                                                    |
| Zalo            | Adaptador simple de recepción más envío.                                                                                                                                                                                                                                                                                                                       |
| Zalo Personal   | Adaptador simple de recepción más envío.                                                                                                                                                                                                                                                                                                                       |

## Plan de migración

### Fase 1: Dominio interno de mensajes

- Agregar tipos `src/channels/message/*` para mensajes, destinos, relaciones,
  orígenes, recibos, capacidades, intenciones duraderas, contexto de recepción, contexto de envío,
  contexto en vivo y clases de fallo.
- Agregar `origin?: MessageOrigin` al tipo de carga útil del puente de migración usado por
  la entrega de respuestas actual, luego mover ese campo a los tipos `ChannelMessage` y de mensaje
  renderizado a medida que el refactor reemplaza las cargas útiles de respuesta.
- Mantener esto interno hasta que los adaptadores y las pruebas demuestren la forma.
- Agregar pruebas unitarias puras para transiciones de estado y serialización.

### Fase 2: Núcleo de envío duradero

- Mover la cola saliente existente desde la durabilidad de carga útil de respuesta a intenciones
  duraderas de envío de mensajes.
- Permitir que una intención de envío duradera lleve un arreglo de cargas útiles proyectadas o un plan por lotes, no
  solo una carga útil de respuesta.
- Preservar el comportamiento actual de recuperación de cola mediante conversión de compatibilidad.
- Hacer que `deliverOutboundPayloads` llame a `messages.send`.
- Hacer que la durabilidad del envío final sea la opción predeterminada y falle cerrado cuando la intención duradera
  no pueda escribirse en el nuevo ciclo de vida de mensajes, después de que el adaptador declare
  seguridad de reproducción. Las rutas existentes de runner entrante y compatibilidad SDK permanecen
  con envío directo de forma predeterminada durante esta fase.
- Registrar recibos de forma coherente.
- Devolver recibos y resultados de entrega al llamador original del despachador en lugar
  de tratar el envío duradero como un efecto secundario terminal.
- Persistir el origen del mensaje mediante intenciones de envío duraderas para que recuperación, reproducción y
  envíos fragmentados preserven la procedencia operativa de OpenClaw.

### Fase 3: Puente de entrada de canal

- Reimplementar `channel.inbound.run` y `dispatchChannelInboundReply` sobre
  `messages.receive` y `messages.send`.
- Mantener estables los tipos de hechos actuales.
- Mantener el comportamiento heredado de forma predeterminada. Un canal de turno ensamblado se vuelve duradero
  solo cuando su adaptador opta explícitamente por una política de durabilidad segura para reproducción.
- Mantener `durable: false` como vía de escape de compatibilidad para rutas que finalizan
  ediciones nativas y aún no pueden reproducirse con seguridad, pero no depender de marcadores `false`
  para proteger canales no migrados.
- Usar durabilidad predeterminada de turno ensamblado solo en el nuevo ciclo de vida de mensajes, después
  de que el mapeo de canal demuestre que la ruta de envío genérica preserva la semántica antigua
  de entrega del canal.

### Fase 4: Puente del despachador preparado

- Reemplazar `deliverDurableInboundReplyPayload` por un puente de contexto de envío.
- Mantener el helper antiguo como wrapper.
- Migrar primero Telegram, WhatsApp, Slack, Signal, iMessage y Discord porque
  ya tienen trabajo de final duradero o rutas de envío más simples.
- Tratar cada despachador preparado como no cubierto hasta que acepte
  explícitamente el contexto de envío. La documentación y las entradas del changelog deben decir "turnos de canal ensamblados"
  o nombrar las rutas de canal migradas en lugar de afirmar todas las respuestas finales automáticas.
- Mantener `recordInboundSessionAndDispatchReply`, los helpers de DM directo y helpers públicos
  similares de compatibilidad preservando el comportamiento. Pueden exponer una aceptación explícita
  del contexto de envío más adelante, pero no deben intentar automáticamente la entrega duradera genérica
  antes del callback de entrega propiedad del llamador.

### Fase 5: ciclo de vida en vivo unificado

- Crear `messages.live` con dos adaptadores de prueba:
  - Telegram para enviar, editar y enviar final obsoleto.
  - Matrix para finalización de borradores y fallback de redacción.
- Luego migrar Discord, Slack, Mattermost, Teams, QQ Bot y Feishu.
- Eliminar el código duplicado de finalización de vista previa solo después de que cada canal tenga
  pruebas de paridad.

### Fase 6: SDK público

- Agregar `openclaw/plugin-sdk/channel-outbound`.
- Documentarlo como la API preferida para Plugins de canal.
- Actualizar las exportaciones de paquete, el inventario de entrypoints, las bases de referencia de API generadas y
  la documentación del SDK de Plugins.
- Incluir `MessageOrigin`, hooks de codificación/decodificación de origen y el predicado compartido
  `shouldDropOpenClawEcho` en la superficie del SDK de channel-outbound.
- Mantener wrappers de compatibilidad para subrutas antiguas.
- Marcar los helpers del SDK con nombres de respuesta como obsoletos en la documentación después de migrar
  los Plugins incluidos.

### Fase 7: todos los remitentes

Mover todos los productores salientes que no son respuestas a `messages.send`:

- notificaciones de Cron y Heartbeat
- finalizaciones de tareas
- resultados de hooks
- solicitudes de aprobación y resultados de aprobación
- envíos de herramientas de mensajes
- anuncios de finalización de subagentes
- envíos explícitos desde CLI o Control UI
- rutas de automatización/difusión

Aquí es donde el modelo deja de ser "respuestas del agente" y pasa a ser "OpenClaw envía
mensajes".

### Fase 8: eliminar compatibilidad con nombres de turnos

- Mantener los wrappers con nombres de entrada/mensaje como ventana de compatibilidad.
- Publicar notas de migración.
- Ejecutar pruebas de compatibilidad del SDK de Plugins contra importaciones antiguas.
- Eliminar u ocultar los helpers internos antiguos solo después de que ningún Plugin incluido los necesite
  y los contratos de terceros tengan un reemplazo estable.

## Plan de pruebas

Pruebas unitarias:

- Serialización y recuperación de intentos de envío duradero.
- Reutilización de claves de idempotencia y supresión de duplicados.
- Confirmación de recibo y omisión de reproducción.
- Recuperación de `unknown_after_send` que reconcilia antes de reproducir cuando un adaptador
  admite reconciliación.
- Política de clasificación de fallos.
- Secuenciación de la política de acuse de recibo.
- Mapeo de relaciones para envíos de respuesta, seguimiento, sistema y difusión.
- Fábrica de origen de fallo de Gateway y predicado `shouldDropOpenClawEcho`.
- Preservación del origen mediante normalización de payload, fragmentación, serialización de cola duradera
  y recuperación.

Pruebas de integración:

- El adaptador simple `channel.inbound.run` sigue registrando y enviando.
- La entrega de eventos ensamblados heredada no se vuelve duradera a menos que el canal
  acepte explícitamente.
- El puente `channel.inbound.runPreparedReply` sigue registrando y finalizando.
- Los helpers públicos de compatibilidad llaman por defecto a callbacks de entrega propiedad del llamador
  y no realizan envío genérico antes de esos callbacks.
- La entrega de fallback duradero reproduce todo el arreglo de payloads proyectados después del
  reinicio y no puede dejar los payloads posteriores sin registrar tras un bloqueo temprano.
- La entrega duradera de eventos ensamblados devuelve ids de mensajes de plataforma al despachador
  almacenado en búfer.
- Los hooks de entrega personalizados siguen devolviendo ids de mensajes de plataforma cuando la entrega duradera
  está deshabilitada o no disponible.
- La respuesta final sobrevive al reinicio entre la finalización del asistente y el envío a la plataforma.
- El borrador de vista previa se finaliza en su lugar cuando está permitido.
- El borrador de vista previa se cancela o redacta cuando una incompatibilidad de medios/error/destino de respuesta
  requiere entrega normal.
- El streaming de bloques y el streaming de vista previa no entregan ambos el mismo texto.
- Los medios transmitidos temprano no se duplican en la entrega final.

Pruebas de canales:

- Respuesta de tema de Telegram con acuse de recibo de polling retrasado hasta la marca de agua segura
  completada del contexto de recepción.
- Recuperación de polling de Telegram para actualizaciones aceptadas pero no entregadas cubierta por
  el modelo persistido de offset seguro completado.
- La vista previa obsoleta de Telegram envía un final nuevo y limpia la vista previa.
- El fallback silencioso de Telegram envía cada payload de fallback proyectado.
- La durabilidad del fallback silencioso de Telegram registra el arreglo completo de fallback proyectado
  de forma atómica, no un único intento duradero de un solo payload por iteración del bucle.
- Cancelación de vista previa de Discord en medios/error/respuesta explícita.
- Los finales del despachador preparado de Discord pasan por el contexto de envío antes de que la documentación
  o el changelog afirmen durabilidad de respuesta final en Discord.
- Los envíos finales duraderos de iMessage rellenan la caché de eco de mensajes enviados del monitor.
- Las rutas de entrega heredadas de LINE, Zalo y Nostr no se omiten mediante
  envío duradero genérico hasta que existan sus pruebas de paridad de adaptador.
- La entrega por callback de DM directo/Nostr sigue siendo autoritativa a menos que se migre explícitamente
  a un destino de mensaje completo y un adaptador de envío seguro para reproducción.
- Los mensajes de fallo de Gateway de OpenClaw etiquetados en Slack permanecen visibles como salientes, los ecos
  etiquetados de sala de bot se descartan antes de `allowBots`, y los mensajes de bot sin etiqueta con el
  mismo texto visible siguen siguiendo la autorización normal de bots.
- Fallback de stream nativo de Slack a vista previa de borrador en DMs de nivel superior.
- Finalización de vista previa de Matrix y fallback de redacción.
- Los ecos de sala de fallo de Gateway de OpenClaw etiquetados en Matrix desde cuentas de bot
  configuradas se descartan antes del manejo de `allowBots`.
- Las auditorías en cascada de fallo de Gateway en salas compartidas de Discord y Google Chat cubren
  los modos de `allowBots` antes de afirmar protección genérica allí.
- Finalización de borrador de Mattermost y fallback de envío nuevo.
- Finalización de progreso nativo de Teams.
- Supresión de final duplicado de Feishu.
- Fallback por timeout del acumulador de QQ Bot.
- Los envíos finales duraderos de Tlon preservan el renderizado de firma del modelo y el seguimiento de
  hilos participados.
- Envíos finales duraderos simples de WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo y Zalo Personal.

Validación:

- Archivos de Vitest dirigidos durante el desarrollo.
- `pnpm check:changed` en Testbox para toda la superficie modificada.
- `pnpm check` más amplio en Testbox antes de integrar el refactor completo o después de
  cambios públicos de SDK/exportación.
- Smoke en vivo o qa-channel para al menos un canal con capacidad de edición y un
  canal simple solo de envío antes de eliminar wrappers de compatibilidad.

## Preguntas abiertas

- Si Telegram debería reemplazar finalmente el origen del runner de grammY por un
  origen de polling completamente duradero que pueda controlar la reentrega a nivel de plataforma, no
  solo la marca de agua de reinicio persistida de OpenClaw.
- Si el estado de vista previa en vivo duradera debe almacenarse en el mismo registro de cola
  que el intento de envío final o en un almacén hermano de estado en vivo.
- Cuánto tiempo permanecen documentados los wrappers de compatibilidad después de que
  se lance `plugin-sdk/channel-outbound`.
- Si los Plugins de terceros deberían implementar adaptadores de recepción directamente o solo
  proporcionar hooks de normalización/envío/en vivo mediante `defineChannelMessageAdapter`.
- Qué campos de recibo son seguros para exponer en el SDK público frente al estado interno
  de runtime.
- Si los efectos secundarios, como cachés de eco propio y marcadores de hilos participados,
  deben modelarse como hooks de contexto de envío, pasos de finalización propiedad del adaptador o
  suscriptores de recibos.
- Qué canales tienen metadatos de origen nativos, cuáles necesitan registros salientes persistidos
  y cuáles no pueden ofrecer supresión confiable de ecos entre bots.

## Criterios de aceptación

- Cada canal de mensajes incluido envía la salida visible final mediante
  `messages.send`.
- Cada canal de mensajes entrantes entra mediante `messages.receive` o un
  wrapper de compatibilidad documentado.
- Cada canal de vista previa/edición/stream usa `messages.live` para estado de borrador y
  finalización.
- `channel.inbound` es solo un wrapper.
- Los helpers del SDK con nombres de respuesta son exportaciones de compatibilidad, no la ruta recomendada.
- La recuperación duradera puede reproducir envíos finales pendientes después del reinicio sin perder
  la respuesta final ni duplicar envíos ya confirmados; los envíos cuyo
  resultado de plataforma es desconocido se reconcilian antes de reproducir o se documentan como
  al menos una vez para ese adaptador.
- Los envíos finales duraderos fallan de forma cerrada cuando no se puede escribir el intento duradero,
  a menos que un llamador haya seleccionado explícitamente un modo no duradero documentado.
- Los helpers de compatibilidad del SDK heredado usan por defecto entrega directa
  propiedad del canal; el envío duradero genérico solo se acepta explícitamente.
- Los recibos preservan todos los ids de mensajes de plataforma para entregas de varias partes y un
  id primario para comodidad de hilos/edición.
- Los wrappers duraderos preservan los efectos secundarios locales del canal antes de reemplazar
  callbacks de entrega directa.
- Los despachadores preparados no se cuentan como duraderos hasta que su ruta de entrega final
  use explícitamente el contexto de envío.
- La entrega de fallback maneja cada payload proyectado.
- La entrega de fallback duradera registra cada payload proyectado en un intento o plan por lotes
  reproducible.
- La salida de fallo de Gateway originada por OpenClaw es visible para humanos, pero los ecos
  de sala escritos por bots etiquetados se descartan antes de la autorización de bots en canales que
  declaran soporte para el contrato de origen.
- La documentación explica envío, recepción, en vivo, estado, recibos, relaciones, política de fallos,
  migración y cobertura de pruebas.

## Relacionado

- [Mensajes](/es/concepts/messages)
- [Streaming y fragmentación](/es/concepts/streaming)
- [Borradores de progreso](/es/concepts/progress-drafts)
- [Política de reintentos](/es/concepts/retry)
- [API de entrada de canales](/es/plugins/sdk-channel-inbound)
