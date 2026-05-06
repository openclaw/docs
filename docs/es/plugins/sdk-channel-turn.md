---
read_when:
    - Estás creando un Plugin de canal y quieres el ciclo de vida compartido de los turnos entrantes
    - Está migrando un monitor de canal para dejar de usar código de enlace manual de registro/despacho
    - Debes comprender las etapas de admisión, ingesta, clasificación, comprobación previa, resolución, registro, despacho y finalización
sidebarTitle: Channel turn
summary: runtime.channel.turn -- el núcleo compartido de turnos entrantes que los plugins de canal incluidos y de terceros usan para registrar, despachar y finalizar turnos de agente
title: Núcleo del turno del canal
x-i18n:
    generated_at: "2026-05-06T05:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2af51bcbf179d68221e800b4c7ec6fa7db5d02a0812dc303eb1438d111c2ea4
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

El kernel de turnos de canal es la máquina de estados de entrada compartida que convierte un evento de plataforma normalizado en un turno del agente. Los Plugins de canal proporcionan los datos de la plataforma y el callback de entrega. Core se encarga de la orquestación: ingesta, clasificación, preflight, resolución, autorización, ensamblado, registro, despacho y finalización.

Usa esto cuando tu Plugin esté en la ruta crítica de mensajes entrantes. Para eventos que no sean mensajes (comandos slash, modales, interacciones de botones, eventos de ciclo de vida, reacciones, estado de voz), mantenlos locales al Plugin. El kernel solo se encarga de eventos que pueden convertirse en un turno de texto del agente.

<Info>
  Se accede al kernel a través del runtime de Plugin inyectado como `runtime.channel.turn.*`. El tipo de runtime de Plugin se exporta desde `openclaw/plugin-sdk/core`, por lo que los Plugins nativos de terceros pueden usar estos puntos de entrada del mismo modo que los Plugins de canal incluidos.
</Info>

## Por qué un kernel compartido

Los Plugins de canal repiten el mismo flujo de entrada: normalizar, enrutar, aplicar controles, construir un contexto, registrar metadatos de sesión, despachar el turno del agente y finalizar el estado de entrega. Sin un kernel compartido, un cambio en el control de menciones, las respuestas visibles solo de herramientas, los metadatos de sesión, el historial pendiente o la finalización del despacho tendría que aplicarse por canal.

El kernel mantiene cuatro conceptos deliberadamente separados:

- `ConversationFacts`: de dónde vino el mensaje
- `RouteFacts`: qué agente y sesión deben procesarlo
- `ReplyPlanFacts`: a dónde deben ir las respuestas visibles
- `MessageFacts`: qué cuerpo y contexto complementario debe ver el agente

Los MD de Slack, los temas de Telegram, los hilos de Matrix y las sesiones de tema de Feishu distinguen todo esto en la práctica. Tratarlos como un único identificador provoca divergencias con el tiempo.

## Ciclo de vida de etapas

El kernel ejecuta la misma canalización fija independientemente del canal:

1. `ingest` -- el adaptador convierte un evento de plataforma sin procesar en `NormalizedTurnInput`
2. `classify` -- el adaptador declara si este evento puede iniciar un turno del agente
3. `preflight` -- el adaptador hace deduplicación, eco propio, hidratación, debounce, descifrado y precarga parcial de datos
4. `resolve` -- el adaptador devuelve un turno completamente ensamblado (ruta, plan de respuesta, mensaje, entrega)
5. `authorize` -- se aplican las políticas de MD, grupo, mención y comando a los datos ensamblados
6. `assemble` -- `FinalizedMsgContext` se construye a partir de los datos mediante `buildContext`
7. `record` -- se persisten los metadatos de sesión entrante y la última ruta
8. `dispatch` -- el turno del agente se ejecuta a través del despachador de bloques con búfer
9. `finalize` -- el `onFinalize` del adaptador se ejecuta incluso si hay un error de despacho

Cada etapa emite un evento de registro estructurado cuando se proporciona un callback `log`. Consulta [Observabilidad](#observabilidad).

## Tipos de admisión

El kernel no lanza una excepción cuando se bloquea un turno. Devuelve un `ChannelTurnAdmission`:

| Tipo          | Cuándo                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | El turno se admite. El turno del agente se ejecuta y se usa la ruta de respuesta visible.                                                    |
| `observeOnly` | El turno se ejecuta de extremo a extremo, pero el adaptador de entrega no envía nada visible. Se usa para agentes observadores de difusión y otros flujos multiagente pasivos. |
| `handled`     | Un evento de plataforma se consumió localmente (ciclo de vida, reacción, botón, modal). El kernel omite el despacho.                         |
| `drop`        | Ruta de omisión. Opcionalmente, `recordHistory: true` conserva el mensaje en el historial de grupo pendiente para que una futura mención tenga contexto. |

La admisión puede venir de `classify` (la clase de evento indicó que no puede iniciar un turno), de `preflight` (deduplicación, eco propio, mención faltante con registro de historial) o de `resolveTurn` en sí.

## Puntos de entrada

El runtime expone tres puntos de entrada preferidos para que los adaptadores puedan optar por el nivel que corresponda al canal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dos helpers de runtime más antiguos siguen disponibles para compatibilidad con el SDK de Plugin:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
```

### run

Úsalo cuando tu canal pueda expresar su flujo de entrada como un `ChannelTurnAdapter<TRaw>`. El adaptador tiene callbacks para `ingest`, `classify` opcional, `preflight` opcional, `resolveTurn` obligatorio y `onFinalize` opcional.

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

`run` tiene la forma adecuada cuando el canal tiene lógica de adaptador pequeña y se beneficia de controlar el ciclo de vida mediante hooks.

### runPrepared

Úsalo cuando el canal tenga un despachador local complejo con previsualizaciones, reintentos, ediciones o arranque de hilos que deba seguir siendo propiedad del canal. El kernel sigue registrando la sesión entrante antes del despacho y expone un `DispatchedChannelTurnResult` uniforme.

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

Una función pura que asigna paquetes de datos a `FinalizedMsgContext`. Úsala cuando tu canal implemente manualmente parte de la canalización, pero quiera una forma de contexto coherente.

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

`buildContext` también es útil dentro de callbacks `resolveTurn` al ensamblar un turno para `run`.

<Note>
  Los helpers obsoletos del SDK, como `dispatchInboundReplyWithBase`, todavía pasan por un helper de turno ensamblado. El código nuevo de Plugin debe usar `run` o `runPrepared`.
</Note>

## Tipos de datos

Los datos que el kernel consume desde tu adaptador son independientes de la plataforma. Traduce los objetos de plataforma a estas formas antes de entregarlos al kernel.

### NormalizedTurnInput

| Campo             | Propósito                                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| `id`              | Id. de mensaje estable usado para deduplicación y registros                  |
| `timestamp`       | Época opcional en ms                                                         |
| `rawText`         | Cuerpo tal como se recibió de la plataforma                                  |
| `textForAgent`    | Cuerpo limpio opcional para el agente (eliminación de menciones, recorte de escritura) |
| `textForCommands` | Cuerpo opcional usado para analizar `/command`                               |
| `raw`             | Referencia pass-through opcional para callbacks del adaptador que necesitan el original |

### ChannelEventClass

| Campo                  | Propósito                                                               |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Si es false, el kernel devuelve `{ kind: "handled" }`                   |
| `requiresImmediateAck` | Indicación para adaptadores que necesitan hacer ACK antes del despacho  |

### SenderFacts

| Campo          | Propósito                                                        |
| -------------- | -------------------------------------------------------------- |
| `id`           | Id. estable del remitente de la plataforma                      |
| `name`         | Nombre para mostrar                                             |
| `username`     | Identificador si es distinto de `name`                          |
| `tag`          | Discriminador estilo Discord o etiqueta de plataforma           |
| `roles`        | Ids. de rol, usados para coincidencias de lista de permitidos por rol de miembro |
| `isBot`        | Verdadero cuando el remitente es un bot conocido (el kernel lo usa para descartar) |
| `isSelf`       | Verdadero cuando el remitente es el propio agente configurado   |
| `displayLabel` | Etiqueta prerenderizada para el texto del sobre                 |

### ConversationFacts

| Campo             | Propósito                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`, `group` o `channel`                                        |
| `id`              | Id. de conversación usado para enrutamiento                          |
| `label`           | Etiqueta legible para humanos para el sobre                          |
| `spaceId`         | Identificador de espacio exterior opcional (espacio de trabajo de Slack, homeserver de Matrix) |
| `parentId`        | Id. de conversación exterior cuando esto es un hilo                  |
| `threadId`        | Id. de hilo cuando este mensaje está dentro de un hilo               |
| `nativeChannelId` | Id. de canal nativo de la plataforma cuando difiere del id. de enrutamiento |
| `routePeer`       | Par usado para la búsqueda `resolveAgentRoute`                       |

### RouteFacts

| Campo                   | Propósito                                                  |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | Agente que debe gestionar este turno                       |
| `accountId`             | Anulación opcional (canales multicuenta)                   |
| `routeSessionKey`       | Clave de sesión usada para enrutamiento                    |
| `dispatchSessionKey`    | Clave de sesión usada en el despacho cuando difiere de la clave de ruta |
| `persistedSessionKey`   | Clave de sesión escrita en los metadatos de sesión persistidos |
| `parentSessionKey`      | Padre para sesiones ramificadas o con hilos                |
| `modelParentSessionKey` | Padre del lado del modelo para sesiones ramificadas        |
| `mainSessionKey`        | Anclaje del propietario de MD principal para conversaciones directas |
| `createIfMissing`       | Permite que el paso de registro cree una fila de sesión faltante |

### ReplyPlanFacts

| Campo                     | Propósito                                               |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | Destino lógico de respuesta escrito en el contexto `To` |
| `originatingTo`           | Destino de contexto de origen (`OriginatingTo`)         |
| `nativeChannelId`         | Id. de canal nativo de la plataforma para la entrega    |
| `replyTarget`             | Destino final de respuesta visible si difiere de `to`   |
| `deliveryTarget`          | Anulación de entrega de nivel inferior                  |
| `replyToId`               | Id. de mensaje citado/anclado                           |
| `replyToIdFull`           | Id. citado en formato completo cuando la plataforma tiene ambos |
| `messageThreadId`         | Id. del hilo en el momento de la entrega                |
| `threadParentId`          | Id. del mensaje principal del hilo                      |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` o `none`         |

### AccessFacts

`AccessFacts` lleva los booleanos que necesita la etapa de autorización. La coincidencia de identidad permanece en el canal: el kernel solo consume el resultado.

| Campo      | Propósito                                                                |
| ---------- | ------------------------------------------------------------------------ |
| `dm`       | Decisión de permitir/emparejar/denegar DM y lista `allowFrom`            |
| `group`    | Política de grupo, permiso de ruta, permiso del remitente, lista de permitidos, requisito de mención |
| `commands` | Autorización de comandos entre autorizadores configurados                |
| `mentions` | Si la detección de menciones es posible y si se mencionó al agente       |

### MessageFacts

| Campo            | Propósito                                                     |
| ---------------- | ------------------------------------------------------------- |
| `body`           | Cuerpo final del sobre (formateado)                           |
| `rawBody`        | Cuerpo entrante sin procesar                                  |
| `bodyForAgent`   | Cuerpo que ve el agente                                       |
| `commandBody`    | Cuerpo usado para el análisis de comandos                     |
| `envelopeFrom`   | Etiqueta de remitente prerenderizada para el sobre            |
| `senderLabel`    | Anulación opcional para el remitente renderizado              |
| `preview`        | Vista previa breve y redactada para registros                 |
| `inboundHistory` | Entradas recientes del historial entrante cuando el canal mantiene un búfer |

### SupplementalContextFacts

El contexto suplementario cubre el contexto de cita, reenvío e inicialización de hilo. El kernel aplica la política `contextVisibility` configurada. El adaptador de canal solo proporciona datos y marcas `senderAllowed` para que la política entre canales se mantenga coherente.

### InboundMediaFacts

Los medios tienen forma de datos. La descarga de la plataforma, la autenticación, la política SSRF, las reglas de CDN y el descifrado permanecen locales al canal. El kernel asigna los datos a `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` y `MediaTranscribedIndexes`.

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

`resolveTurn` devuelve un `ChannelTurnResolved`, que es un `AssembledChannelTurn` con un tipo de admisión opcional. Devolver `{ admission: { kind: "observeOnly" } }` ejecuta el turno sin producir salida visible. El adaptador sigue siendo propietario del callback de entrega; simplemente se convierte en una operación sin efecto para ese turno.

`onFinalize` se ejecuta en cada resultado, incluidos los errores de despacho. Úsalo para borrar historial de grupo pendiente, quitar reacciones de acuse de recibo, detener indicadores de estado y vaciar el estado local.

## Adaptador de entrega

El kernel no llama directamente a la plataforma. El canal entrega al kernel un `ChannelTurnDeliveryAdapter`:

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

`deliver` se llama una vez por cada fragmento de respuesta almacenado en búfer. Durante la migración del ciclo de vida de mensajes, la entrega del turno de canal ensamblado pertenece al canal de forma predeterminada: un campo `durable` omitido significa que el kernel debe llamar a `deliver` directamente y no debe enrutar mediante entrega saliente genérica. Define `durable` solo después de auditar el canal para demostrar que la ruta de envío genérica preserva el comportamiento de entrega anterior, incluidos destinos de respuesta/hilo, manejo de medios, cachés de mensajes enviados/eco propio, limpieza de estado e ids. de mensajes devueltos. `durable: false` sigue siendo una escritura de compatibilidad para "usar el callback propiedad del canal", pero los canales no migrados no deberían necesitar agregarlo. Devuelve ids. de mensajes de la plataforma cuando el canal los tenga para que el despachador pueda preservar anclajes de hilo y editar fragmentos posteriores; las rutas de entrega más nuevas también deberían devolver `receipt` para que la recuperación, la finalización de vistas previas y la supresión de duplicados puedan dejar de depender de `messageIds`. Para turnos de solo observación, devuelve `{ visibleReplySent: false }` o usa `createNoopChannelTurnDeliveryAdapter()`.

Los canales que usan `runPrepared` con un despachador totalmente propiedad del canal no tienen un `ChannelTurnDeliveryAdapter`. Esos despachadores no son duraderos de forma predeterminada. Deben mantener su ruta de entrega directa hasta que opten explícitamente por el nuevo contexto de envío con un destino completo, un adaptador seguro para reproducción, un contrato de recibo y hooks de efectos secundarios del canal.

Los helpers de compatibilidad pública como `recordInboundSessionAndDispatchReply`, `dispatchInboundReplyWithBase` y los helpers de DM directo deben preservar el comportamiento durante la migración. No deben llamar a la entrega duradera genérica antes de los callbacks `deliver` o `reply` propiedad del llamador.

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

El despachador espera a la etapa de registro. Si el registro lanza una excepción, el kernel ejecuta `onPreDispatchFailure` (cuando se proporciona a `runPrepared`) y vuelve a lanzarla.

## Observabilidad

Cada etapa emite un evento estructurado cuando se proporciona un callback `log`:

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

Etapas registradas: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evita registrar cuerpos sin procesar; usa `MessageFacts.preview` para vistas previas breves y redactadas.

## Qué permanece local al canal

El kernel posee la orquestación. El canal sigue siendo propietario de:

- Transportes de plataforma (gateway, REST, websocket, polling, webhooks)
- Resolución de identidad y coincidencia de nombres para mostrar
- Comandos nativos, comandos slash, autocompletado, modales, botones, estado de voz
- Renderizado de tarjetas, modales y tarjetas adaptativas
- Autenticación de medios, reglas de CDN, medios cifrados, transcripción
- APIs de edición, reacción, redacción y presencia
- Relleno retrospectivo y obtención de historial del lado de la plataforma
- Flujos de emparejamiento que requieren verificación específica de la plataforma

Si dos canales empiezan a necesitar el mismo helper para uno de estos casos, extrae un helper compartido del SDK en lugar de introducirlo en el kernel.

## Estabilidad

`runtime.channel.turn.*` forma parte de la superficie pública del runtime de Plugin. Los tipos de datos (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) y las formas de admisión (`ChannelTurnAdmission`, `ChannelEventClass`) son accesibles mediante `PluginRuntime` desde `openclaw/plugin-sdk/core`.

Se aplican las reglas de compatibilidad hacia atrás: los nuevos campos de datos son aditivos, los tipos de admisión no se renombran y los nombres de puntos de entrada permanecen estables. Las nuevas necesidades de canal que requieran un cambio no aditivo deben pasar por el proceso de migración del SDK de Plugin.

## Relacionado

- [Refactorización del ciclo de vida de mensajes](/es/concepts/message-lifecycle-refactor) para el ciclo de vida planificado de envío/recepción/en vivo que envolverá este kernel
- [Crear plugins de canal](/es/plugins/sdk-channel-plugins) para el contrato más amplio de Plugin de canal
- [Helpers de runtime de Plugin](/es/plugins/sdk-runtime) para otras superficies `runtime.*`
- [Internos de Plugin](/es/plugins/architecture-internals) para el proceso de carga y la mecánica del registro
