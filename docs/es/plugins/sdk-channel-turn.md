---
read_when:
    - Estás creando un plugin de canal y quieres el ciclo de vida compartido de los turnos entrantes
    - Estás migrando un monitor de canal para dejar atrás el código de unión artesanal de registro/despacho.
    - Debes comprender las etapas de admisión, ingesta, clasificación, verificación previa, resolución, registro, despacho y finalización.
sidebarTitle: Channel turn
summary: runtime.channel.turn -- el núcleo compartido de turnos entrantes que los plugins de canal incluidos y de terceros usan para registrar, despachar y finalizar turnos de agente
title: Núcleo del turno del canal
x-i18n:
    generated_at: "2026-05-11T20:46:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb474bf2bf6f30270deb8a8ac0237ce4fc9b923521c5ac0cf7cb0714db13966
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

El kernel de turnos de canal es la máquina de estados entrante compartida que convierte un evento de plataforma normalizado en un turno de agente. Los plugins de canal proporcionan los datos de la plataforma y la devolución de llamada de entrega. Core es responsable de la orquestación: ingesta, clasificación, preflight, resolución, autorización, ensamblaje, registro, despacho y finalización.

Usa esto cuando tu plugin esté en la ruta activa de mensajes entrantes. Para eventos que no son mensajes (comandos slash, modales, interacciones de botones, eventos de ciclo de vida, reacciones, estado de voz), mantenlos locales al plugin. El kernel solo posee eventos que pueden convertirse en un turno de texto del agente.

<Info>
  Se accede al kernel mediante el runtime de plugin inyectado como `runtime.channel.turn.*`. El tipo del runtime de plugin se exporta desde `openclaw/plugin-sdk/core`, por lo que los plugins nativos de terceros pueden usar estos puntos de entrada del mismo modo que lo hacen los plugins de canal incluidos.
</Info>

## Por qué un kernel compartido

Los plugins de canal repiten el mismo flujo entrante: normalizar, enrutar, aplicar compuertas, construir un contexto, registrar metadatos de sesión, despachar el turno del agente y finalizar el estado de entrega. Sin un kernel compartido, un cambio en las compuertas de mención, las respuestas visibles solo para herramientas, los metadatos de sesión, el historial pendiente o la finalización del despacho tendría que aplicarse por canal.

El kernel mantiene cuatro conceptos deliberadamente separados:

- `ConversationFacts`: de dónde provino el mensaje
- `RouteFacts`: qué agente y sesión deben procesarlo
- `ReplyPlanFacts`: adónde deben ir las respuestas visibles
- `MessageFacts`: qué cuerpo y contexto suplementario debe ver el agente

Los MD de Slack, los temas de Telegram, los hilos de Matrix y las sesiones de tema de Feishu distinguen todos estos en la práctica. Tratarlos como un solo identificador causa deriva con el tiempo.

## Ciclo de vida de las etapas

El kernel ejecuta el mismo pipeline fijo independientemente del canal:

1. `ingest` -- el adaptador convierte un evento de plataforma sin procesar en `NormalizedTurnInput`
2. `classify` -- el adaptador declara si este evento puede iniciar un turno de agente
3. `preflight` -- el adaptador hace deduplicación, eco propio, hidratación, debounce, descifrado y prellenado parcial de datos
4. `resolve` -- el adaptador devuelve un turno completamente ensamblado (ruta, plan de respuesta, mensaje, entrega)
5. `authorize` -- se aplica la política de MD, grupo, mención y comando a los datos ensamblados
6. `assemble` -- se construye `FinalizedMsgContext` a partir de los datos mediante `buildContext`
7. `record` -- se persisten los metadatos de sesión entrante y la última ruta
8. `dispatch` -- se ejecuta el turno del agente mediante el despachador de bloques con búfer
9. `finalize` -- se ejecuta `onFinalize` del adaptador incluso si hay un error de despacho

Cada etapa emite un evento de log estructurado cuando se proporciona una devolución de llamada `log`. Consulta [Observabilidad](#observability).

## Tipos de admisión

El kernel no lanza una excepción cuando un turno queda bloqueado por una compuerta. Devuelve un `ChannelTurnAdmission`:

| Tipo          | Cuándo                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | El turno se admite. El turno del agente se ejecuta y se ejercita la ruta de respuesta visible.                                                |
| `observeOnly` | El turno se ejecuta de extremo a extremo, pero el adaptador de entrega no envía nada visible. Se usa para agentes observadores de difusión y otros flujos multiagente pasivos. |
| `handled`     | Un evento de plataforma se consumió localmente (ciclo de vida, reacción, botón, modal). El kernel omite el despacho.                         |
| `drop`        | Ruta de omisión. Opcionalmente, `recordHistory: true` conserva el mensaje en el historial de grupo pendiente para que una mención futura tenga contexto. |

La admisión puede venir de `classify` (la clase de evento indicó que no puede iniciar un turno), de `preflight` (deduplicación, eco propio, mención faltante con registro de historial) o de `resolveTurn` en sí.

## Puntos de entrada

El runtime expone tres puntos de entrada preferidos para que los adaptadores puedan optar por el nivel que coincide con el canal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dos helpers de runtime más antiguos siguen disponibles por compatibilidad con el Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

Úsalo cuando tu canal pueda expresar su flujo entrante como un `ChannelTurnAdapter<TRaw>`. El adaptador tiene devoluciones de llamada para `ingest`, `classify` opcional, `preflight` opcional, `resolveTurn` obligatorio y `onFinalize` opcional.

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

`run` es la forma adecuada cuando el canal tiene lógica de adaptador pequeña y se beneficia de poseer el ciclo de vida mediante hooks.

### runAssembled

Úsalo cuando el canal ya haya resuelto el enrutamiento, construido un `FinalizedMsgContext`
y solo necesite el orden compartido de registro, pipeline de respuesta, despacho y finalización.
Esta es la forma preferida para rutas entrantes simples incluidas que, de otro modo,
repetirían el boilerplate de `createChannelMessageReplyPipeline(...)` y
`runPrepared(...)`.

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

Elige `runAssembled` en lugar de `runPrepared` cuando el único comportamiento de despacho
propiedad del canal sea la entrega final del payload más escritura opcional, opciones de
respuesta, entrega durable o registro de errores.

### runPrepared

Úsalo cuando el canal tenga un despachador local complejo con vistas previas, reintentos, ediciones o arranque de hilos que deba permanecer como responsabilidad del canal. El kernel sigue registrando la sesión entrante antes del despacho y expone un `DispatchedChannelTurnResult` uniforme.

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

Los canales enriquecidos (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) usan `runPrepared` porque su despachador orquesta comportamiento específico de la plataforma que el kernel no debe conocer.

### buildContext

Una función pura que asigna paquetes de datos a `FinalizedMsgContext`. Úsala cuando tu canal implemente manualmente parte del pipeline, pero quiera una forma de contexto coherente.

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` también es útil dentro de devoluciones de llamada `resolveTurn` al ensamblar un turno para `run`.

<Note>
  Los helpers del SDK obsoletos, como `dispatchInboundReplyWithBase`, todavía hacen de puente mediante un helper de turno ensamblado. El código nuevo de plugins debe usar `run` o `runPrepared`.
</Note>

## Tipos de datos

Los datos que el kernel consume de tu adaptador son independientes de la plataforma. Traduce los objetos de plataforma a estas formas antes de entregarlos al kernel.

### NormalizedTurnInput

| Campo             | Propósito                                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Id de mensaje estable usado para deduplicación y logs                        |
| `timestamp`       | Época en ms opcional                                                         |
| `rawText`         | Cuerpo tal como se recibió de la plataforma                                  |
| `textForAgent`    | Cuerpo limpio opcional para el agente (eliminación de mención, recorte de escritura) |
| `textForCommands` | Cuerpo opcional usado para analizar `/command`                               |
| `raw`             | Referencia pass-through opcional para devoluciones de llamada del adaptador que necesitan el original |

### ChannelEventClass

| Campo                  | Propósito                                                               |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Si es false, el kernel devuelve `{ kind: "handled" }`                   |
| `requiresImmediateAck` | Pista para adaptadores que necesitan confirmar con ACK antes del despacho |

### SenderFacts

| Campo          | Propósito                                                      |
| -------------- | -------------------------------------------------------------- |
| `id`           | Id de remitente de plataforma estable                          |
| `name`         | Nombre para mostrar                                            |
| `username`     | Handle si es distinto de `name`                                |
| `tag`          | Discriminador de estilo Discord o etiqueta de plataforma       |
| `roles`        | Ids de rol, usados para coincidencia con allowlist de roles de miembro |
| `isBot`        | Verdadero cuando el remitente es un bot conocido (el kernel lo usa para descartar) |
| `isSelf`       | Verdadero cuando el remitente es el agente configurado en sí   |
| `displayLabel` | Etiqueta prerenderizada para el texto del sobre                |

### ConversationFacts

| Campo             | Propósito                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` o `channel`                                        |
| `id`              | Id de conversación usado para enrutamiento                           |
| `label`           | Etiqueta humana para el sobre                                        |
| `spaceId`         | Identificador opcional del espacio externo (workspace de Slack, homeserver de Matrix) |
| `parentId`        | Id de conversación externa cuando esto es un hilo                    |
| `threadId`        | Id de hilo cuando este mensaje está dentro de un hilo                |
| `nativeChannelId` | Id de canal nativo de la plataforma cuando difiere del id de enrutamiento |
| `routePeer`       | Par usado para la búsqueda de `resolveAgentRoute`                    |

### RouteFacts

| Campo                   | Propósito                                                    |
| ----------------------- | ------------------------------------------------------------ |
| `agentId`               | Agente que debe gestionar este turno                         |
| `accountId`             | Anulación opcional (canales multicuenta)                     |
| `routeSessionKey`       | Clave de sesión usada para el enrutamiento                   |
| `dispatchSessionKey`    | Clave de sesión usada en el despacho cuando difiere de la clave de ruta |
| `persistedSessionKey`   | Clave de sesión escrita en los metadatos de sesión persistidos |
| `parentSessionKey`      | Padre para sesiones ramificadas/con hilos                    |
| `modelParentSessionKey` | Padre del lado del modelo para sesiones ramificadas          |
| `mainSessionKey`        | Pin del propietario principal de DM para conversaciones directas |
| `createIfMissing`       | Permite que el paso de registro cree una fila de sesión faltante |

### ReplyPlanFacts

| Campo                     | Propósito                                                 |
| ------------------------- | --------------------------------------------------------- |
| `to`                      | Destino lógico de respuesta escrito en el contexto `To`   |
| `originatingTo`           | Destino de contexto originario (`OriginatingTo`)          |
| `nativeChannelId`         | Id de canal nativo de la plataforma para la entrega       |
| `replyTarget`             | Destino final de respuesta visible si difiere de `to`     |
| `deliveryTarget`          | Anulación de entrega de nivel inferior                    |
| `replyToId`               | Id de mensaje citado/anclado                              |
| `replyToIdFull`           | Id citado en forma completa cuando la plataforma tiene ambos |
| `messageThreadId`         | Id del hilo en el momento de la entrega                   |
| `threadParentId`          | Id del mensaje padre del hilo                             |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` o `none`           |

### AccessFacts

`AccessFacts` contiene los booleanos que necesita la etapa de autorización. La coincidencia de identidad permanece en el canal: el núcleo solo consume el resultado.

| Campo      | Propósito                                                                   |
| ---------- | --------------------------------------------------------------------------- |
| `dm`       | Decisión de permitir/emparejar/denegar DM y lista `allowFrom`               |
| `group`    | Política de grupo, permiso de ruta, permiso del remitente, lista de permitidos, requisito de mención |
| `commands` | Autorización de comandos en los autorizadores configurados                  |
| `mentions` | Si la detección de menciones es posible y si el agente fue mencionado       |

### MessageFacts

| Campo            | Propósito                                                        |
| ---------------- | ---------------------------------------------------------------- |
| `body`           | Cuerpo final del sobre (formateado)                              |
| `rawBody`        | Cuerpo entrante sin procesar                                     |
| `bodyForAgent`   | Cuerpo que ve el agente                                          |
| `commandBody`    | Cuerpo usado para el análisis de comandos                        |
| `envelopeFrom`   | Etiqueta de remitente pre-renderizada para el sobre              |
| `senderLabel`    | Anulación opcional para el remitente renderizado                 |
| `preview`        | Vista previa breve redactada para registros                      |
| `inboundHistory` | Entradas recientes del historial entrante cuando el canal mantiene un búfer |

### SupplementalContextFacts

El contexto suplementario cubre el contexto de cita, reenvío e inicialización de hilo. El núcleo aplica la política `contextVisibility` configurada. El adaptador de canal solo proporciona hechos y marcas `senderAllowed` para que la política entre canales se mantenga coherente.

### InboundMediaFacts

Los medios tienen forma de hechos. La descarga de plataforma, la autenticación, la política SSRF, las reglas de CDN y el descifrado permanecen locales al canal. El núcleo asigna los hechos a `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` y `MediaTranscribedIndexes`.

## Contrato del adaptador

Para `run` completo, la forma del adaptador es:

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` devuelve un `ChannelTurnResolved`, que es un `AssembledChannelTurn` con un tipo de admisión opcional. Devolver `{ admission: { kind: "observeOnly" } }` ejecuta el turno sin producir salida visible. El adaptador sigue siendo propietario de la devolución de llamada de entrega; simplemente se convierte en una operación sin efecto para ese turno.

`onFinalize` se ejecuta en cada resultado, incluidos los errores de despacho. Úsalo para borrar el historial de grupo pendiente, eliminar reacciones de confirmación, detener indicadores de estado y vaciar el estado local.

## Adaptador de entrega

El núcleo no llama directamente a la plataforma. El canal entrega al núcleo un `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` se llama una vez por cada fragmento de respuesta en búfer. Durante la migración del ciclo de vida de mensajes, la entrega de turnos de canal ensamblados es propiedad del canal de forma predeterminada: omitir el campo `durable` significa que el núcleo debe llamar a `deliver` directamente y no debe enrutar mediante la entrega saliente genérica. Establece `durable` solo después de auditar el canal para demostrar que la ruta de envío genérica conserva el comportamiento de entrega anterior, incluidos los destinos de respuesta/hilo, el manejo de medios, las cachés de mensajes enviados/autoeco, la limpieza de estado y los ids de mensaje devueltos. `durable: false` sigue siendo una grafía de compatibilidad para "usar la devolución de llamada propiedad del canal", pero los canales no migrados no deberían necesitar agregarla. Devuelve los ids de mensaje de la plataforma cuando el canal los tenga para que el despachador pueda conservar anclajes de hilo y editar fragmentos posteriores; las rutas de entrega más nuevas también deberían devolver `receipt` para que la recuperación, la finalización de vistas previas y la supresión de duplicados puedan dejar de depender de `messageIds`. Para turnos de solo observación, devuelve `{ visibleReplySent: false }` o usa `createNoopChannelTurnDeliveryAdapter()`.

Los canales que usan `runPrepared` con un despachador completamente propiedad del canal no tienen un `ChannelTurnDeliveryAdapter`. Esos despachadores no son duraderos de forma predeterminada. Deben mantener su ruta de entrega directa hasta que opten explícitamente por el nuevo contexto de envío con un destino completo, un adaptador seguro para reproducción, un contrato de recibo y hooks de efectos secundarios del canal.

Los helpers de compatibilidad pública como `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` y los helpers de DM directo deben conservar el comportamiento durante la migración. No deben llamar a la entrega duradera genérica antes de las devoluciones de llamada `deliver` o `reply` propiedad del llamador.

## Opciones de registro

La etapa de registro envuelve `recordInboundSession`. La mayoría de los canales pueden usar los valores predeterminados. Anula mediante `record`:

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

El despachador espera a la etapa de registro. Si el registro lanza una excepción, el núcleo ejecuta `onPreDispatchFailure` (cuando se proporciona a `runPrepared`) y vuelve a lanzar la excepción.

## Observabilidad

Cada etapa emite un evento estructurado cuando se proporciona una devolución de llamada `log`:

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

Etapas registradas: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evita registrar cuerpos sin procesar; usa `MessageFacts.preview` para vistas previas breves redactadas.

## Qué permanece local al canal

El núcleo es propietario de la orquestación. El canal sigue siendo propietario de:

- Transportes de plataforma (gateway, REST, websocket, polling, webhooks)
- Resolución de identidad y coincidencia de nombres visibles
- Comandos nativos, comandos slash, autocompletado, modales, botones, estado de voz
- Renderizado de tarjetas, modales y tarjetas adaptativas
- Autenticación de medios, reglas de CDN, medios cifrados, transcripción
- APIs de edición, reacción, redacción y presencia
- Relleno retrospectivo y obtención de historial del lado de la plataforma
- Flujos de emparejamiento que requieren verificación específica de la plataforma

Si dos canales empiezan a necesitar el mismo helper para uno de estos casos, extrae un helper de SDK compartido en lugar de introducirlo en el núcleo.

## Estabilidad

`runtime.channel.turn.*` forma parte de la superficie pública de runtime de Plugin. Los tipos de hechos (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) y las formas de admisión (`ChannelTurnAdmission`, `ChannelEventClass`) son accesibles mediante `PluginRuntime` desde `openclaw/plugin-sdk/core`.

Se aplican las reglas de compatibilidad hacia atrás: los nuevos campos de hechos son aditivos, los tipos de admisión no se renombran y los nombres de puntos de entrada permanecen estables. Las nuevas necesidades de canal que requieran un cambio no aditivo deben pasar por el proceso de migración del SDK de Plugin.

## Relacionado

- [Refactorización del ciclo de vida de mensajes](/es/concepts/message-lifecycle-refactor) para el ciclo de vida planificado de envío/recepción/en vivo que envolverá este núcleo
- [Creación de plugins de canal](/es/plugins/sdk-channel-plugins) para el contrato más amplio de Plugin de canal
- [Helpers de runtime de Plugin](/es/plugins/sdk-runtime) para otras superficies `runtime.*`
- [Elementos internos de Plugin](/es/plugins/architecture-internals) para la canalización de carga y la mecánica del registro
