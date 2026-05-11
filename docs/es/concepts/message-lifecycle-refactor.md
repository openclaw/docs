---
read_when:
    - Refactorización del comportamiento de envío o recepción del canal
    - Cambiar el turno de canal, el envío de respuestas, la cola saliente, la transmisión de vista previa o las API de mensajes del SDK de Plugin
    - Diseñar un nuevo Plugin de canal que necesite envíos persistentes, recibos, vistas previas, ediciones o reintentos
summary: Plan de diseño para el ciclo de vida unificado de recepción, envío, vista previa, edición y transmisión continua de mensajes persistentes
title: Refactorización del ciclo de vida de los mensajes
x-i18n:
    generated_at: "2026-05-11T20:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2e136f1be0f7c1952731b464c3732c68c14a31e672ce628af8182a3f666c914
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

Esta página es el diseño objetivo para reemplazar los ayudantes dispersos de turno de canal, despacho de respuestas, streaming de vista previa y entrega saliente por un ciclo de vida de mensaje duradero.

La versión breve:

- Las primitivas centrales deben ser **recibir** y **enviar**, no **responder**.
- Una respuesta es solo una relación en un mensaje saliente.
- Un turno es una comodidad de procesamiento entrante, no el propietario de la entrega.
- El envío debe basarse en contexto: `begin`, renderizar, previsualizar o transmitir, envío final, confirmar, fallar.
- La recepción también debe basarse en contexto: normalizar, desduplicar, enrutar, registrar, despachar, confirmación de plataforma, fallar.
- El SDK público de Plugin debe reducirse a una sola superficie pequeña de mensajes de canal.

## Problemas

La pila actual de canales surgió de varias necesidades locales válidas:

- Los adaptadores entrantes simples usan `runtime.channel.turn.run`.
- Los adaptadores enriquecidos usan `runtime.channel.turn.runPrepared`.
- Los ayudantes heredados usan `dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`, ayudantes de payload de respuesta, fragmentación de respuestas, referencias de respuesta y ayudantes de runtime saliente.
- El streaming de vista previa vive en despachadores específicos de canal.
- La durabilidad de la entrega final se está agregando alrededor de las rutas de payload de respuesta existentes.

Esa forma corrige errores locales, pero deja a OpenClaw con demasiados conceptos públicos y demasiados lugares donde la semántica de entrega puede desviarse.

El problema de confiabilidad que expuso esto es:

```text
Telegram polling update acked
  -> assistant final text exists
  -> process restarts before sendMessage succeeds
  -> final response is lost
```

La invariante objetivo es más amplia que Telegram: una vez que el núcleo decide que debe existir un mensaje saliente visible, la intención debe ser duradera antes de intentar el envío a la plataforma, y el recibo de la plataforma debe confirmarse después del éxito. Eso da a OpenClaw recuperación al menos una vez. El comportamiento exactamente una vez existe solo para adaptadores que pueden demostrar idempotencia nativa o conciliar un intento con estado desconocido después del envío contra el estado de la plataforma antes de reproducirlo.

Ese es el estado final de esta refactorización, no una descripción de todas las rutas actuales. Durante la migración, los ayudantes salientes existentes todavía pueden recurrir a un envío directo cuando las escrituras de cola de mejor esfuerzo fallan. La refactorización solo está completa cuando los envíos finales duraderos fallan de forma cerrada o excluyen explícitamente esa durabilidad con una política no duradera documentada.

## Objetivos

- Un ciclo de vida central para todas las rutas de recepción y envío de mensajes de canal.
- Envíos finales duraderos de forma predeterminada en el nuevo ciclo de vida de mensajes después de que un adaptador declare un comportamiento seguro para reproducción.
- Semántica compartida de vista previa, edición, streaming, finalización, reintento, recuperación y recibo.
- Una superficie pequeña de SDK de Plugin que los plugins de terceros puedan aprender y mantener.
- Compatibilidad para los llamadores existentes de `channel.turn` durante la migración.
- Puntos de extensión claros para nuevas capacidades de canal.
- Sin ramas específicas de plataforma en el núcleo.
- Sin mensajes de canal de delta de tokens. El streaming de canal sigue siendo vista previa de mensaje, edición, adición o entrega de bloque completado.
- Metadatos estructurados de origen OpenClaw para salida operativa/de sistema, de modo que las fallas visibles del Gateway no vuelvan a entrar en salas compartidas habilitadas para bots como prompts nuevos.

## No objetivos

- No eliminar `runtime.channel.turn.*` en la primera fase.
- No forzar a todos los canales al mismo comportamiento de transporte nativo.
- No enseñar al núcleo temas de Telegram, streams nativos de Slack, redacciones de Matrix, tarjetas de Feishu, voz de QQ ni actividades de Teams.
- No publicar todos los ayudantes internos de migración como API estable del SDK.
- No hacer que los reintentos reproduzcan operaciones de plataforma no idempotentes ya completadas.

## Modelo de referencia

Vercel Chat tiene un buen modelo mental público:

- `Chat`
- `Thread`
- `Channel`
- `Message`
- métodos de adaptador como `postMessage`, `editMessage`, `deleteMessage`, `stream`, `startTyping` y obtenciones de historial
- un adaptador de estado para desduplicación, bloqueos, colas y persistencia

OpenClaw debe tomar prestado el vocabulario, no copiar la superficie.

Lo que OpenClaw necesita además de ese modelo:

- Intenciones de envío saliente duraderas antes de llamadas directas de transporte.
- Contextos de envío explícitos con inicio, confirmación y fallo.
- Contextos de recepción que conocen la política de confirmación de plataforma.
- Recibos que sobreviven a reinicios y pueden impulsar ediciones, eliminaciones, recuperación y supresión de duplicados.
- Un SDK público más pequeño. Los plugins incluidos pueden usar ayudantes internos de runtime, pero los plugins de terceros deben ver una API coherente de mensajes.
- Comportamiento específico de agente: sesiones, transcripciones, streaming de bloques, progreso de herramientas, aprobaciones, directivas de medios, respuestas silenciosas e historial de menciones de grupo.

Las promesas estilo `thread.post()` no son suficientes para OpenClaw. Ocultan el límite transaccional que decide si un envío es recuperable.

## Modelo central

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

`live` posee la vista previa, edición, progreso y estado de streaming.

`state` posee el almacenamiento duradero de intenciones, recibos, idempotencia, recuperación, bloqueos y desduplicación.

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

Esto permite que la misma ruta de envío gestione respuestas normales, notificaciones de cron, prompts de aprobación, finalizaciones de tareas, envíos de herramientas de mensaje, envíos de CLI o Control UI, resultados de subagentes y envíos de automatización.

### Origen

El origen describe quién produjo un mensaje y cómo OpenClaw debe tratar los ecos de ese mensaje. Está separado de la relación: un mensaje puede ser una respuesta a un usuario y aun así ser salida operativa originada por OpenClaw.

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

El núcleo posee el significado de la salida originada por OpenClaw. Los canales poseen cómo se codifica ese origen en su transporte.

El primer uso requerido es la salida de fallas del Gateway. Los humanos aún deben ver mensajes como "Agent failed before reply" o "Missing API key", pero la salida operativa de OpenClaw etiquetada no debe aceptarse como entrada escrita por bot en salas compartidas cuando `allowBots` está habilitado.

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

Los recibos son el puente desde la intención duradera hacia futuras ediciones, eliminaciones, finalización de vista previa, supresión de duplicados y recuperación.

Un recibo puede describir un mensaje de plataforma o una entrega en varias partes. Texto fragmentado, medios más texto, voz más texto y alternativas de tarjetas deben preservar todos los ids de plataforma y aun así exponer un id primario para hilos y ediciones posteriores.

## Contexto de recepción

La recepción no debe ser una llamada simple a un ayudante. El núcleo necesita un contexto que conozca la desduplicación, el enrutamiento, el registro de sesión y la política de confirmación de plataforma.

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

La confirmación no es una sola cosa. El contrato de recepción debe mantener estas señales separadas:

- **Confirmación de transporte:** le indica al webhook o socket de la plataforma que OpenClaw aceptó el sobre del evento. Algunas plataformas requieren esto antes del despacho.
- **Confirmación de offset de sondeo:** avanza un cursor para que no se vuelva a obtener el mismo evento. Esto no debe avanzar más allá de trabajo que no puede recuperarse.
- **Confirmación de registro entrante:** confirma que OpenClaw persistió suficientes metadatos entrantes para desduplicar y enrutar una reentrega.
- **Recibo visible para el usuario:** comportamiento opcional de lectura/estado/escritura; nunca es un límite de durabilidad.

`ReceiveAckPolicy` controla solo la confirmación de transporte o sondeo. No debe reutilizarse para recibos de lectura ni reacciones de estado.

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

Esta eliminación se basa en etiquetas, no en texto. Un mensaje de sala escrito por bot con el mismo texto visible de falla del Gateway pero sin metadatos de origen OpenClaw todavía pasa por la autorización normal de `allowBots`.

La política de confirmación es explícita:

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

El sondeo de Telegram ahora usa la política de confirmación del contexto de recepción para su marca de agua persistida de reinicio. El rastreador aún observa las actualizaciones de grammY cuando entran en la cadena de middleware, pero OpenClaw persiste solo el id de actualización completada segura después de un despacho exitoso, dejando las actualizaciones fallidas o pendientes inferiores reproducibles después de un reinicio. El offset de obtención `getUpdates` upstream de Telegram sigue controlado por la biblioteca de sondeo, así que el recorte más profundo pendiente es una fuente de sondeo completamente duradera si necesitamos reentrega a nivel de plataforma más allá de la marca de agua de reinicio de OpenClaw. Las plataformas con webhook pueden necesitar confirmación HTTP inmediata, pero aun así necesitan desduplicación entrante e intenciones duraderas de envío saliente porque los webhooks pueden reentregar.

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

La intención debe existir antes de la E/S de transporte. Un reinicio después del inicio pero antes de
confirmar se puede recuperar.

El límite peligroso está después del éxito de la plataforma y antes de confirmar el recibo. Si un
proceso muere ahí, OpenClaw no puede saber si el mensaje de la plataforma existe,
a menos que el adaptador proporcione idempotencia nativa o una ruta de conciliación de recibos.
Esos intentos deben reanudarse en `unknown_after_send`, no repetirse a ciegas. Los canales
sin conciliación pueden elegir repetición al menos una vez solo si los mensajes visibles
duplicados son una compensación aceptable y documentada para ese canal y relación.
El puente de conciliación actual del SDK requiere que el adaptador declare
`reconcileUnknownSend`, y luego pide a `durableFinal.reconcileUnknownSend` que
clasifique una entrada desconocida como `sent`, `not_sent` o `unresolved`; solo `not_sent`
permite repetir el envío, y las entradas no resueltas permanecen terminales o solo reintentan la
comprobación de conciliación.

La política de durabilidad debe ser explícita:

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` significa que el núcleo debe fallar de forma cerrada cuando no puede escribir la intención duradera.
`best_effort` puede continuar cuando la persistencia no está disponible. `disabled` mantiene
el comportamiento anterior de envío directo. Durante la migración, los wrappers heredados y los helpers
públicos de compatibilidad tienen `disabled` de forma predeterminada; no deben inferir `required` por
el hecho de que un canal tenga un adaptador saliente genérico.

Los contextos de envío también poseen los efectos posteriores al envío locales del canal. Una migración no es segura
si la entrega duradera omite comportamiento local que antes estaba adjunto a la
ruta de envío directo del canal. Algunos ejemplos incluyen cachés de supresión de eco propio,
marcadores de participación en hilos, anclas de edición nativas, renderizado de firma del modelo
y guardas contra duplicados específicas de la plataforma. Esos efectos deben moverse al
adaptador de envío, al adaptador de renderizado o a un hook de contexto de envío con nombre antes de que
ese canal pueda habilitar la entrega final genérica duradera.

Los helpers de envío deben devolver recibos hasta su llamador. Los wrappers duraderos
no pueden tragarse ids de mensaje ni reemplazar un resultado de entrega del canal con
`undefined`; los despachadores con búfer usan esos ids para anclas de hilos, ediciones posteriores,
finalización de vistas previas y supresión de duplicados.

Los envíos de reserva operan sobre lotes, no sobre payloads únicos. Las reescrituras de respuesta silenciosa,
la reserva de medios, la reserva de tarjetas y la proyección de fragmentos pueden producir todas más de
un mensaje entregable, así que un contexto de envío debe entregar todo el
lote proyectado o documentar explícitamente por qué solo un payload es válido.

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

Cuando una reserva de este tipo es duradera, todo el lote proyectado debe estar representado por
una intención de envío duradera o por otro plan de lote atómico. Registrar cada payload
uno por uno no basta: un bloqueo entre payloads puede dejar una reserva visible
parcial sin registro duradero para los payloads restantes. La recuperación debe saber
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

El estado en vivo es lo suficientemente duradero para recuperar o suprimir duplicados:

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

Esto debe cubrir el comportamiento actual:

- Envío de Telegram más edición de vista previa, con final nuevo tras una antigüedad obsoleta de la vista previa.
- Envío de Discord más edición de vista previa, cancelación en medios/error/respuesta explícita.
- Stream nativo de Slack o vista previa de borrador según la forma del hilo.
- Finalización de publicación en borrador de Mattermost.
- Finalización de evento en borrador de Matrix o redacción en caso de discrepancia.
- Stream de progreso nativo de Teams.
- Stream de QQ Bot o reserva acumulada.

## Superficie del adaptador

El objetivo público del SDK debe ser una subruta:

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
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

Antes de la autorización preliminar, el núcleo debe ejecutar el predicado compartido de eco de OpenClaw
siempre que `origin.decode` devuelva metadatos de origen OpenClaw. El adaptador de recepción
proporciona datos de la plataforma como el autor bot y la forma de la sala; el núcleo posee la decisión
de descarte y el orden para que los canales no vuelvan a implementar filtros de texto.

Adaptador de origen:

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

El núcleo establece `MessageOrigin`. Los canales solo lo traducen hacia y desde metadatos de
transporte nativos. Slack lo asigna a `chat.postMessage({ metadata })` y
`message.metadata` entrante; Matrix puede asignarlo a contenido de evento adicional; los canales
sin metadatos nativos pueden usar un registro de recibos/salientes cuando esa sea la
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

La nueva superficie pública debe absorber o deprecar estas áreas conceptuales:

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- la mayoría de los usos públicos de `outbound-runtime`
- helpers ad hoc del ciclo de vida de stream de borrador

Las subrutas de compatibilidad pueden permanecer como wrappers, pero los nuevos plugins
de terceros no deberían necesitarlas.

Los plugins incluidos pueden mantener importaciones de helpers internos mediante subrutas de runtime
reservadas durante la migración. La documentación pública debe dirigir a los autores de plugins a
`plugin-sdk/channel-message` cuando exista.

## Relación con el turno de canal

`runtime.channel.turn.*` debe permanecer durante la migración.

Debe convertirse en un adaptador de compatibilidad:

```text
channel.turn.run
  -> messages.receive context
  -> session dispatch
  -> messages.send context for visible output
```

`channel.turn.runPrepared` también debe permanecer inicialmente:

```text
channel-owned dispatcher
  -> messages.receive record/finalize bridge
  -> messages.live for preview/progress
  -> messages.send for final delivery
```

Después de que todos los plugins incluidos y las rutas de compatibilidad de terceros conocidas estén conectados,
`channel.turn` puede quedar obsoleto. No debe eliminarse hasta que haya una
ruta de migración del SDK publicada y pruebas de contrato que demuestren que los plugins antiguos todavía funcionan
o fallan con un error de versión claro.

## Guardarraíles de compatibilidad

Durante la migración, la entrega genérica duradera es opcional para cualquier canal cuya
callback de entrega existente tenga efectos secundarios más allá de "enviar este payload".

Los puntos de entrada heredados no son duraderos de forma predeterminada:

- `channel.turn.run` y `dispatchAssembledChannelTurn` usan la
  callback de entrega del canal, a menos que ese canal proporcione explícitamente un objeto
  de política/opciones duraderas auditado.
- `channel.turn.runPrepared` permanece bajo propiedad del canal hasta que el despachador preparado
  llama explícitamente al contexto de envío.
- Los helpers públicos de compatibilidad como `recordInboundSessionAndDispatchReply`,
  `dispatchInboundReplyWithBase` y los helpers de MD directo nunca inyectan entrega
  genérica duradera antes de la callback `deliver` o `reply` proporcionada por el llamador.

Para los tipos de puente de migración, `durable: undefined` significa "no duradero". La
ruta duradera se habilita solo con un valor explícito de política/opciones. `durable:
false` puede permanecer como ortografía de compatibilidad, pero la implementación no debe
exigir que cada canal sin migrar lo añada.

El código de puente actual debe mantener explícita la decisión de durabilidad:

- La entrega final duradera devuelve un estado discriminado. `handled_visible` y
  `handled_no_send` son terminales; `unsupported` y `not_applicable` pueden
  recurrir a la entrega propiedad del canal; `failed` propaga el fallo de envío.
- La entrega final duradera genérica está condicionada por capacidades del
  adaptador como la entrega silenciosa, la preservación del destino de respuesta,
  la preservación de citas nativas y los hooks de envío de mensajes. Si falta
  paridad, debe elegirse la entrega propiedad del canal, no un envío genérico
  que cambie el comportamiento visible para el usuario.
- Los envíos duraderos respaldados por cola exponen una referencia de intención
  de entrega. Los campos de sesión `pendingFinalDelivery*` existentes pueden
  transportar el id de la intención durante la transición; el estado final es un
  almacén `MessageSendIntent` en lugar de texto de respuesta congelado más
  campos de contexto ad hoc.

No habilites la ruta duradera genérica para un canal hasta que todo esto sea
verdadero:

- El adaptador de envío genérico ejecuta el mismo comportamiento de renderizado
  y transporte que la antigua ruta directa.
- Los efectos secundarios locales posteriores al envío se preservan mediante el
  contexto de envío.
- El adaptador devuelve recibos o resultados de entrega con todos los ids de
  mensajes de la plataforma.
- Las rutas de despachador preparadas llaman al nuevo contexto de envío o quedan
  documentadas como fuera de la garantía duradera.
- La entrega alternativa maneja cada payload proyectado, no solo el primero.
- La entrega alternativa duradera registra todo el array de payload proyectado
  como una intención o plan de lote reproducible.

Peligros concretos de migración que deben preservarse:

- La entrega del monitor de iMessage registra los mensajes enviados en una caché
  de eco después de un envío correcto. Los envíos finales duraderos aún deben
  rellenar esa caché; de lo contrario, OpenClaw puede volver a ingerir sus
  propias respuestas finales como mensajes entrantes de usuario.
- Tlon añade una firma de modelo opcional y registra los hilos participantes
  después de respuestas de grupo. La entrega duradera genérica no debe omitir
  esos efectos; muévelos a los adaptadores de renderizado/envío/finalización de
  Tlon o mantén Tlon en la ruta propiedad del canal.
- Discord y otros despachadores preparados ya son propietarios de la entrega
  directa y el comportamiento de vista previa. No están cubiertos por una
  garantía duradera de turno ensamblado hasta que sus despachadores preparados
  enruten explícitamente los finales a través del contexto de envío.
- La entrega alternativa silenciosa de Telegram debe entregar el array completo
  de payload proyectado. Un atajo de payload único puede descartar payloads
  alternativos adicionales después de la proyección.
- LINE, Zalo, Nostr y otras rutas ensambladas/de helper existentes pueden
  tener manejo de tokens de respuesta, proxy de medios, cachés de mensajes
  enviados, limpieza de carga/estado u objetivos solo de callback. Permanecen
  en la entrega propiedad del canal hasta que esas semánticas estén
  representadas por el adaptador de envío y verificadas mediante pruebas.
- Los helpers de DM directo pueden tener un callback de respuesta que es el
  único destino de transporte correcto. La salida genérica no debe inferir a
  partir de `OriginatingTo` o `To` y omitir ese callback.
- La salida de fallo del Gateway de OpenClaw debe seguir siendo visible para
  humanos, pero los ecos de sala etiquetados como escritos por bots deben
  descartarse antes de la autorización `allowBots`. Los canales no deben
  implementar esto con filtros de prefijo de texto visible salvo como medida
  temporal breve de emergencia; el contrato duradero es metadatos de origen
  estructurados.

## Almacenamiento interno

La cola duradera debe almacenar intenciones de envío de mensajes, no payloads de
respuesta.

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
- No reintentar `invalid_payload` salvo que exista una alternativa de renderizado.
- No reintentar `auth` ni `permission` hasta que cambie la configuración.
- Para `not_found`, permite que la finalización en vivo recurra de edición a un
  envío nuevo cuando el canal declare que eso es seguro.
- Para `conflict`, usa reglas de recibo/idempotencia para decidir si el mensaje
  ya existe.
- Cualquier error posterior al momento en que el adaptador puede haber completado
  E/S de plataforma pero anterior al commit del recibo se convierte en
  `unknown_after_send`, salvo que el adaptador pueda probar que la operación de
  plataforma no ocurrió.

## Mapeo de canales

| Canal           | Migración objetivo                                                                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | Recibe la política de confirmación más envíos finales duraderos. El adaptador en vivo se encarga del envío y de la vista previa de edición, el envío final de vistas previas obsoletas, temas, omisión de vista previa en respuestas con cita, respaldo de medios y gestión de retry-after.                                                       |
| Discord         | El adaptador de envío envuelve la entrega existente de cargas útiles duraderas. El adaptador en vivo se encarga de la edición de borradores, borradores de progreso, cancelación de vistas previas de medios/errores, preservación del destino de respuesta y recibos de id de mensaje. Audita los ecos de fallos de gateway escritos por bots en salas compartidas; usa un registro saliente u otro equivalente nativo si Discord no puede transportar metadatos de origen en mensajes normales. |
| Slack           | El adaptador de envío gestiona publicaciones normales de chat. El adaptador en vivo elige el stream nativo cuando la forma del hilo lo admite; de lo contrario, usa una vista previa de borrador. Los recibos preservan las marcas de tiempo del hilo. El adaptador de origen asigna fallos de gateway de OpenClaw a `chat.postMessage.metadata` de Slack y descarta ecos etiquetados de salas de bots antes de la autorización `allowBots`. |
| WhatsApp        | El adaptador de envío se encarga del envío de texto/medios con intenciones finales duraderas. El adaptador de recepción gestiona menciones de grupo e identidad del remitente. El modo en vivo puede permanecer ausente hasta que WhatsApp tenga un transporte editable.                                                                           |
| Matrix          | El adaptador en vivo se encarga de ediciones de eventos de borrador, finalización, redacción, restricciones de medios cifrados y respaldo ante discrepancias del destino de respuesta. El adaptador de recepción se encarga de la hidratación y deduplicación de eventos cifrados. El adaptador de origen debería codificar el origen de fallos de gateway de OpenClaw en el contenido de eventos de Matrix y descartar ecos de salas de bots configurados antes de gestionar `allowBots`. |
| Mattermost      | El adaptador en vivo se encarga de una publicación de borrador, plegado de progreso/herramientas, finalización in situ y respaldo con envío nuevo.                                                                                                                                                                                                 |
| Microsoft Teams | El adaptador en vivo se encarga del progreso nativo y el comportamiento de stream de bloques. El adaptador de envío se encarga de actividades y recibos de adjuntos/tarjetas.                                                                                                                                                                      |
| Feishu          | El adaptador de renderizado se encarga del renderizado de texto/tarjetas/sin procesar. El adaptador en vivo se encarga de tarjetas en streaming y supresión de finales duplicados. El adaptador de envío se encarga de comentarios, sesiones de tema, medios y supresión de voz.                                                                  |
| QQ Bot          | El adaptador en vivo se encarga de streaming C2C, tiempo de espera del acumulador y envío final de respaldo. El adaptador de renderizado se encarga de etiquetas de medios y texto como voz.                                                                                                                                                      |
| Signal          | Adaptador simple de recepción y envío. Sin adaptador en vivo salvo que signal-cli añada compatibilidad fiable con edición.                                                                                                                                                                                                                        |
| iMessage        | Adaptador simple de recepción y envío. El envío de iMessage debe preservar la población de la caché de ecos del monitor antes de que los finales duraderos puedan omitir la entrega del monitor.                                                                                                                                                  |
| Google Chat     | Adaptador simple de recepción y envío con la relación de hilo asignada a espacios e ids de hilo. Audita el comportamiento de salas con `allowBots=true` para ecos etiquetados de fallos de gateway de OpenClaw.                                                                                                                                   |
| LINE            | Adaptador simple de recepción y envío con restricciones de token de respuesta modeladas como capacidad de destino/relación.                                                                                                                                                                                                                       |
| Nextcloud Talk  | Puente de recepción del SDK más adaptador de envío.                                                                                                                                                                                                                                                                                               |
| IRC             | Adaptador simple de recepción y envío, sin recibos de edición duraderos.                                                                                                                                                                                                                                                                           |
| Nostr           | Adaptador de recepción y envío para MD cifrados; los recibos son ids de evento.                                                                                                                                                                                                                                                                    |
| QA Channel      | Adaptador de pruebas de contrato para comportamiento de recepción, envío, en vivo, reintento y recuperación.                                                                                                                                                                                                                                      |
| Synology Chat   | Adaptador simple de recepción y envío.                                                                                                                                                                                                                                                                                                             |
| Tlon            | El adaptador de envío debe preservar el renderizado de firma de modelo y el seguimiento de hilos participados antes de habilitar la entrega final duradera genérica.                                                                                                                                                                               |
| Twitch          | Adaptador simple de recepción y envío con clasificación de límites de tasa.                                                                                                                                                                                                                                                                        |
| Zalo            | Adaptador simple de recepción y envío.                                                                                                                                                                                                                                                                                                             |
| Zalo Personal   | Adaptador simple de recepción y envío.                                                                                                                                                                                                                                                                                                             |

## Plan de migración

### Fase 1: Dominio interno de mensajes

- Añade tipos `src/channels/message/*` para mensajes, destinos, relaciones,
  orígenes, recibos, capacidades, intenciones duraderas, contexto de recepción,
  contexto de envío, contexto en vivo y clases de fallo.
- Añade `origin?: MessageOrigin` al tipo de carga útil del puente de migración usado por
  la entrega actual de respuestas; luego mueve ese campo a `ChannelMessage` y a los tipos de
  mensajes renderizados a medida que la refactorización reemplace las cargas útiles de respuesta.
- Mantén esto interno hasta que los adaptadores y las pruebas demuestren la forma.
- Añade pruebas unitarias puras para transiciones de estado y serialización.

### Fase 2: Núcleo de envío duradero

- Mueve la cola saliente existente desde la durabilidad de cargas útiles de respuesta a intenciones duraderas
  de envío de mensajes.
- Permite que una intención de envío duradera lleve un arreglo de cargas útiles proyectadas o un plan de lote, no
  solo una carga útil de respuesta.
- Preserva el comportamiento actual de recuperación de cola mediante conversión de compatibilidad.
- Haz que `deliverOutboundPayloads` llame a `messages.send`.
- Haz que la durabilidad del envío final sea el valor predeterminado y que falle de forma cerrada cuando la intención duradera
  no pueda escribirse en el nuevo ciclo de vida de mensajes, después de que el adaptador declare
  seguridad de reproducción. Las rutas existentes de turno de canal y compatibilidad del SDK permanecen
  como envío directo de forma predeterminada durante esta fase.
- Registra recibos de forma coherente.
- Devuelve recibos y resultados de entrega al llamador original del dispatcher en lugar
  de tratar el envío duradero como un efecto secundario terminal.
- Persiste el origen del mensaje mediante intenciones de envío duraderas para que la recuperación, la reproducción y
  los envíos fragmentados preserven la procedencia operativa de OpenClaw.

### Fase 3: Puente de turno de canal

- Reimplementa `channel.turn.run` y `dispatchAssembledChannelTurn` sobre
  `messages.receive` y `messages.send`.
- Mantén estables los tipos de hechos actuales.
- Mantén el comportamiento heredado de forma predeterminada. Un canal de turno ensamblado se vuelve duradero
  solo cuando su adaptador opta explícitamente por una política de durabilidad segura para reproducción.
- Mantén `durable: false` como vía de escape de compatibilidad para rutas que finalizan
  ediciones nativas y aún no pueden reproducirse con seguridad, pero no dependas de marcadores `false`
  para proteger canales no migrados.
- Predetermina la durabilidad del turno ensamblado solo en el nuevo ciclo de vida de mensajes, después de
  que la asignación del canal demuestre que la ruta de envío genérica preserva la semántica antigua de
  entrega del canal.

### Fase 4: Puente de dispatcher preparado

- Reemplace `deliverDurableInboundReplyPayload` por un puente de contexto de envío.
- Mantenga el helper antiguo como un wrapper.
- Migre primero Telegram, WhatsApp, Slack, Signal, iMessage y Discord porque
  ya tienen trabajo final duradero o rutas de envío más simples.
- Trate cada despachador preparado como no cubierto hasta que opte explícitamente
  por el contexto de envío. Las entradas de documentación y changelog deben decir "turnos de
  canal ensamblados" o nombrar las rutas de canal migradas en lugar de afirmar todas
  las respuestas finales automáticas.
- Mantenga `recordInboundSessionAndDispatchReply`, los helpers de DM directo y helpers de compatibilidad
  públicos similares preservando el comportamiento. Pueden exponer una opción explícita
  de contexto de envío más adelante, pero no deben intentar automáticamente una entrega duradera
  genérica antes del callback de entrega propiedad del llamador.

### Fase 5: Ciclo de vida en vivo unificado

- Construya `messages.live` con dos adaptadores de prueba:
  - Telegram para envío más edición más envío final obsoleto.
  - Matrix para finalización de borrador más alternativa de redacción.
- Luego migre Discord, Slack, Mattermost, Teams, QQ Bot y Feishu.
- Elimine el código duplicado de finalización de vista previa solo después de que cada canal tenga
  pruebas de paridad.

### Fase 6: SDK público

- Agregue `openclaw/plugin-sdk/channel-message`.
- Documéntelo como la API preferida de plugins de canal.
- Actualice las exportaciones de paquetes, el inventario de puntos de entrada, las bases de API generadas y
  la documentación del SDK de plugins.
- Incluya `MessageOrigin`, hooks de codificación/decodificación de origen y el predicado compartido
  `shouldDropOpenClawEcho` en la superficie del SDK de channel-message.
- Mantenga wrappers de compatibilidad para subrutas antiguas.
- Marque los helpers del SDK con nombres de respuesta como obsoletos en la documentación después de que los plugins incluidos se
  hayan migrado.

### Fase 7: Todos los emisores

Mueva todos los productores salientes que no sean respuestas a `messages.send`:

- notificaciones de Cron y Heartbeat
- finalizaciones de tareas
- resultados de hooks
- solicitudes de aprobación y resultados de aprobación
- envíos de la herramienta de mensajes
- anuncios de finalización de subagentes
- envíos explícitos de CLI o interfaz de control
- rutas de automatización/difusión

Aquí es donde el modelo deja de ser "respuestas del agente" y pasa a ser "OpenClaw envía
mensajes".

### Fase 8: Desaprobar Turn

- Mantenga `channel.turn` como wrapper durante al menos una ventana de compatibilidad.
- Publique notas de migración.
- Ejecute pruebas de compatibilidad del SDK de plugins contra importaciones antiguas.
- Elimine u oculte helpers internos antiguos solo después de que ningún plugin incluido los necesite
  y los contratos de terceros tengan un reemplazo estable.

## Plan de pruebas

Pruebas unitarias:

- Serialización y recuperación de intención de envío duradero.
- Reutilización de claves de idempotencia y supresión de duplicados.
- Confirmación de recibo y omisión en reproducción.
- Recuperación de `unknown_after_send` que reconcilia antes de reproducir cuando un adaptador
  admite reconciliación.
- Política de clasificación de fallos.
- Secuenciación de la política de confirmación de recepción.
- Mapeo de relaciones para envíos de respuesta, seguimiento, sistema y difusión.
- Fábrica de origen de fallo de Gateway y predicado `shouldDropOpenClawEcho`.
- Preservación del origen mediante normalización de payload, fragmentación, serialización de cola
  duradera y recuperación.

Pruebas de integración:

- El adaptador simple de `channel.turn.run` todavía registra y envía.
- La entrega heredada de turnos ensamblados no se vuelve duradera a menos que el canal
  opte explícitamente por ello.
- El puente `channel.turn.runPrepared` todavía registra y finaliza.
- Los helpers públicos de compatibilidad llaman por defecto a callbacks de entrega propiedad del llamador
  y no realizan un envío genérico antes de esos callbacks.
- La entrega de alternativa duradera reproduce todo el arreglo de payloads proyectado después de
  reiniciar y no puede dejar los payloads posteriores sin registrar tras un fallo temprano.
- La entrega duradera de turnos ensamblados devuelve ids de mensajes de plataforma al despachador
  almacenado en búfer.
- Los hooks de entrega personalizados todavía devuelven ids de mensajes de plataforma cuando la entrega duradera
  está deshabilitada o no disponible.
- La respuesta final sobrevive a un reinicio entre la finalización del asistente y el envío a la plataforma.
- El borrador de vista previa se finaliza en el mismo lugar cuando está permitido.
- El borrador de vista previa se cancela o redacta cuando una discrepancia de media/error/destino de respuesta
  requiere entrega normal.
- La transmisión de bloques y la transmisión de vista previa no entregan ambas el mismo texto.
- Los medios transmitidos temprano no se duplican en la entrega final.

Pruebas de canal:

- Respuesta a tema de Telegram con confirmación por sondeo retrasada hasta la marca de agua segura
  completada del contexto de recepción.
- Recuperación de sondeo de Telegram para actualizaciones aceptadas pero no entregadas cubierta por
  el modelo persistido de desplazamiento seguro completado.
- La vista previa obsoleta de Telegram envía un final nuevo y limpia la vista previa.
- La alternativa silenciosa de Telegram envía cada payload alternativo proyectado.
- La durabilidad de la alternativa silenciosa de Telegram registra atómicamente todo el arreglo alternativo
  proyectado, no una intención duradera de un solo payload por iteración del bucle.
- Cancelación de vista previa de Discord por media/error/respuesta explícita.
- Las finales de despachadores preparados de Discord se enrutan por el contexto de envío antes de que la documentación
  o el changelog afirmen durabilidad de respuesta final de Discord.
- Los envíos finales duraderos de iMessage rellenan la caché de eco de mensajes enviados del monitor.
- Las rutas de entrega heredadas de LINE, Zalo y Nostr no se omiten mediante
  envío duradero genérico hasta que existan sus pruebas de paridad de adaptador.
- La entrega por callback de DM directo/Nostr sigue siendo autoritativa a menos que se migre explícitamente
  a un destino de mensaje completo y un adaptador de envío seguro para reproducción.
- Los mensajes etiquetados de fallo de Gateway de OpenClaw en Slack permanecen visibles salientes, los ecos de sala de bot
  etiquetados se descartan antes de `allowBots`, y los mensajes de bot sin etiquetar con el
  mismo texto visible siguen la autorización normal de bots.
- Alternativa de stream nativo de Slack a vista previa de borrador en DM de nivel superior.
- Finalización de vista previa y alternativa de redacción de Matrix.
- Los ecos de sala de fallo de Gateway de OpenClaw etiquetados de Matrix desde cuentas de bot
  configuradas se descartan antes del manejo de `allowBots`.
- Las auditorías de cascada de fallo de Gateway en salas compartidas de Discord y Google Chat cubren
  modos de `allowBots` antes de afirmar protección genérica allí.
- Finalización de borrador y alternativa de envío nuevo de Mattermost.
- Finalización de progreso nativo de Teams.
- Supresión de final duplicado de Feishu.
- Alternativa por timeout del acumulador de QQ Bot.
- Los envíos finales duraderos de Tlon preservan el renderizado de firma de modelo y el seguimiento de
  hilos participados.
- Envíos finales duraderos simples de WhatsApp, Signal, iMessage, Google Chat, LINE, IRC, Nostr, Nextcloud Talk,
  Synology Chat, Tlon, Twitch, Zalo y Zalo Personal.

Validación:

- Archivos de Vitest dirigidos durante el desarrollo.
- `pnpm check:changed` en Testbox para toda la superficie modificada.
- `pnpm check` más amplio en Testbox antes de aterrizar la refactorización completa o después
  de cambios en SDK público/exportaciones.
- Smoke en vivo o qa-channel para al menos un canal con capacidad de edición y un
  canal simple de solo envío antes de eliminar wrappers de compatibilidad.

## Preguntas abiertas

- Si Telegram debería eventualmente reemplazar la fuente del runner de grammY por una
  fuente de sondeo completamente duradera que pueda controlar la reentrega a nivel de plataforma, no
  solo la marca de agua de reinicio persistida de OpenClaw.
- Si el estado de vista previa en vivo duradero debería almacenarse en el mismo registro de cola
  que la intención de envío final o en un almacén hermano de estado en vivo.
- Durante cuánto tiempo los wrappers de compatibilidad siguen documentados después de que
  `plugin-sdk/channel-message` se publique.
- Si los plugins de terceros deberían implementar adaptadores de recepción directamente o solo
  proporcionar hooks de normalización/envío/en vivo mediante `defineChannelMessageAdapter`.
- Qué campos de recibo es seguro exponer en el SDK público frente al estado interno de runtime.
- Si los efectos secundarios como cachés de autoeco y marcadores de hilos participados
  deberían modelarse como hooks de contexto de envío, pasos de finalización propiedad del adaptador o
  suscriptores de recibos.
- Qué canales tienen metadatos de origen nativos, cuáles necesitan registros salientes persistidos
  y cuáles no pueden ofrecer supresión fiable de eco entre bots.

## Criterios de aceptación

- Cada canal de mensajes incluido envía la salida visible final mediante
  `messages.send`.
- Cada canal de mensajes entrantes entra mediante `messages.receive` o un
  wrapper de compatibilidad documentado.
- Cada canal de vista previa/edición/stream usa `messages.live` para estado de borrador y
  finalización.
- `channel.turn` es solo un wrapper.
- Los helpers del SDK con nombres de respuesta son exportaciones de compatibilidad, no la ruta recomendada.
- La recuperación duradera puede reproducir envíos finales pendientes después de reiniciar sin perder
  la respuesta final ni duplicar envíos ya confirmados; los envíos cuyo
  resultado de plataforma es desconocido se reconcilian antes de reproducir o se documentan como
  al menos una vez para ese adaptador.
- Los envíos finales duraderos fallan cerrados cuando la intención duradera no puede escribirse,
  a menos que un llamador haya seleccionado explícitamente un modo no duradero documentado.
- Los helpers de compatibilidad heredados de channel-turn y SDK usan por defecto entrega directa
  propiedad del canal; el envío duradero genérico solo es opt-in explícito.
- Los recibos preservan todos los ids de mensajes de plataforma para entregas multiparte y un
  id principal para conveniencia de hilos/edición.
- Los wrappers duraderos preservan los efectos secundarios locales del canal antes de reemplazar callbacks
  de entrega directa.
- Los despachadores preparados no se cuentan como duraderos hasta que su ruta de entrega final
  use explícitamente el contexto de envío.
- La entrega alternativa maneja cada payload proyectado.
- La entrega alternativa duradera registra cada payload proyectado en una intención o plan
  por lotes reproducible.
- La salida de fallo de Gateway originada por OpenClaw es visible para humanos, pero los ecos
  de sala etiquetados y creados por bots se descartan antes de la autorización de bots en canales que
  declaran soporte para el contrato de origen.
- La documentación explica envío, recepción, en vivo, estado, recibos, relaciones, política de fallos,
  migración y cobertura de pruebas.

## Relacionado

- [Mensajes](/es/concepts/messages)
- [Streaming y fragmentación](/es/concepts/streaming)
- [Borradores de progreso](/es/concepts/progress-drafts)
- [Política de reintentos](/es/concepts/retry)
- [Kernel de turnos de canal](/es/plugins/sdk-channel-turn)
