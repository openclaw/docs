---
read_when:
    - Estás creando un Plugin de canal y quieres el ciclo de vida compartido del turno entrante
    - Está migrando un monitor de canal para dejar de depender de código de integración personalizado de registro/despacho
    - Debe comprender las etapas de admisión, ingesta, clasificación, comprobación previa, resolución, registro, despacho y finalización
sidebarTitle: Channel turn
summary: runtime.channel.turn -- el núcleo compartido de turnos entrantes que los plugins de canal incluidos y de terceros usan para registrar, despachar y finalizar turnos de agente
title: Núcleo de turnos de canal
x-i18n:
    generated_at: "2026-04-30T05:54:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc918da4c43f955f509aed18a93129db26efe21686c30f9328a5639f3e700984
    source_path: plugins/sdk-channel-turn.md
    workflow: 16
---

El núcleo de turno de canal es la máquina de estados entrante compartida que convierte un evento de plataforma normalizado en un turno de agente. Los plugins de canal proporcionan los datos de plataforma y la devolución de llamada de entrega. El core posee la orquestación: ingesta, clasificación, comprobación previa, resolución, autorización, ensamblaje, registro, despacho y finalización.

Usa esto cuando tu plugin esté en la ruta crítica de mensajes entrantes. Para eventos que no son mensajes (comandos slash, modales, interacciones de botones, eventos de ciclo de vida, reacciones, estado de voz), mantenlos locales al plugin. El núcleo solo posee eventos que pueden convertirse en un turno de texto de agente.

<Info>
  Se accede al núcleo mediante el runtime de plugin inyectado como `runtime.channel.turn.*`. El tipo de runtime de plugin se exporta desde `openclaw/plugin-sdk/core`, por lo que los plugins nativos de terceros pueden usar estos puntos de entrada igual que los plugins de canal incluidos.
</Info>

## Por qué un núcleo compartido

Los plugins de canal repiten el mismo flujo entrante: normalizar, enrutar, aplicar puertas, crear un contexto, registrar metadatos de sesión, despachar el turno del agente, finalizar el estado de entrega. Sin un núcleo compartido, un cambio en la puerta de menciones, las respuestas visibles solo de herramientas, los metadatos de sesión, el historial pendiente o la finalización del despacho tendría que aplicarse canal por canal.

El núcleo mantiene cuatro conceptos deliberadamente separados:

- `ConversationFacts`: de dónde vino el mensaje
- `RouteFacts`: qué agente y sesión deben procesarlo
- `ReplyPlanFacts`: a dónde deben ir las respuestas visibles
- `MessageFacts`: qué cuerpo y contexto suplementario debe ver el agente

Los MD de Slack, los temas de Telegram, los hilos de Matrix y las sesiones de tema de Feishu distinguen todos estos en la práctica. Tratarlos como un único identificador causa deriva con el tiempo.

## Ciclo de vida de etapas

El núcleo ejecuta el mismo pipeline fijo sin importar el canal:

1. `ingest` -- el adaptador convierte un evento de plataforma sin procesar en `NormalizedTurnInput`
2. `classify` -- el adaptador declara si este evento puede iniciar un turno de agente
3. `preflight` -- el adaptador realiza deduplicación, eco propio, hidratación, debounce, descifrado y prerrelleno parcial de datos
4. `resolve` -- el adaptador devuelve un turno completamente ensamblado (ruta, plan de respuesta, mensaje, entrega)
5. `authorize` -- se aplica la política de MD, grupo, mención y comando a los datos ensamblados
6. `assemble` -- se crea `FinalizedMsgContext` a partir de los datos mediante `buildContext`
7. `record` -- se persisten los metadatos de sesión entrante y la última ruta
8. `dispatch` -- el turno del agente se ejecuta mediante el despachador de bloques con búfer
9. `finalize` -- el `onFinalize` del adaptador se ejecuta incluso si hay un error de despacho

Cada etapa emite un evento de registro estructurado cuando se proporciona una devolución de llamada `log`. Consulta [Observabilidad](#observability).

## Tipos de admisión

El núcleo no lanza una excepción cuando un turno queda bloqueado. Devuelve un `ChannelTurnAdmission`:

| Tipo          | Cuándo                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | El turno se admite. El turno del agente se ejecuta y se usa la ruta de respuesta visible.                                                      |
| `observeOnly` | El turno se ejecuta de extremo a extremo, pero el adaptador de entrega no envía nada visible. Se usa para agentes observadores de difusión y otros flujos multiagente pasivos. |
| `handled`     | Un evento de plataforma se consumió localmente (ciclo de vida, reacción, botón, modal). El núcleo omite el despacho.                           |
| `drop`        | Ruta de omisión. Opcionalmente, `recordHistory: true` mantiene el mensaje en el historial de grupo pendiente para que una mención futura tenga contexto. |

La admisión puede venir de `classify` (la clase de evento indicó que no puede iniciar un turno), de `preflight` (deduplicación, eco propio, mención faltante con registro de historial) o del propio `resolveTurn`.

## Puntos de entrada

El runtime expone tres puntos de entrada preferidos para que los adaptadores puedan optar por el nivel que coincida con el canal.

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

Dos helpers de runtime más antiguos siguen disponibles por compatibilidad con el Plugin SDK:

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer run or runPrepared
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

`run` tiene la forma adecuada cuando el canal tiene una lógica de adaptador pequeña y se beneficia de poseer el ciclo de vida mediante hooks.

### runPrepared

Úsalo cuando el canal tenga un despachador local complejo con vistas previas, reintentos, ediciones o arranque de hilos que debe seguir siendo propiedad del canal. El núcleo aún registra la sesión entrante antes del despacho y expone un `DispatchedChannelTurnResult` uniforme.

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

Los canales ricos (Matrix, Mattermost, Microsoft Teams, Feishu, QQ Bot) usan `runPrepared` porque su despachador orquesta comportamiento específico de la plataforma que el núcleo no debe conocer.

### buildContext

Una función pura que asigna paquetes de datos a `FinalizedMsgContext`. Úsala cuando tu canal implemente manualmente parte del pipeline pero quiera una forma de contexto coherente.

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
  Los helpers obsoletos del SDK, como `dispatchInboundReplyWithBase`, aún hacen puente mediante un helper de turno ensamblado. El código nuevo de plugin debe usar `run` o `runPrepared`.
</Note>

## Tipos de datos

Los datos que el núcleo consume de tu adaptador son independientes de la plataforma. Traduce los objetos de plataforma a estas formas antes de entregarlos al núcleo.

### NormalizedTurnInput

| Campo             | Propósito                                                                      |
| ----------------- | ------------------------------------------------------------------------------ |
| `id`              | ID de mensaje estable usado para deduplicación y registros                     |
| `timestamp`       | Epoch ms opcional                                                              |
| `rawText`         | Cuerpo tal como se recibió de la plataforma                                    |
| `textForAgent`    | Cuerpo limpio opcional para el agente (eliminación de mención, recorte de escritura) |
| `textForCommands` | Cuerpo opcional usado para analizar `/command`                                 |
| `raw`             | Referencia de paso opcional para devoluciones de llamada del adaptador que necesitan el original |

### ChannelEventClass

| Campo                  | Propósito                                                               |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`, `command`, `interaction`, `reaction`, `lifecycle`, `unknown` |
| `canStartAgentTurn`    | Si es false, el núcleo devuelve `{ kind: "handled" }`                   |
| `requiresImmediateAck` | Pista para adaptadores que necesitan confirmar antes del despacho       |

### SenderFacts

| Campo          | Propósito                                                        |
| -------------- | ---------------------------------------------------------------- |
| `id`           | ID de remitente de plataforma estable                            |
| `name`         | Nombre mostrado                                                  |
| `username`     | Identificador si es distinto de `name`                           |
| `tag`          | Discriminador estilo Discord o etiqueta de plataforma            |
| `roles`        | IDs de rol, usados para coincidencia de lista de permitidos de roles de miembro |
| `isBot`        | True cuando el remitente es un bot conocido (el núcleo lo usa para descartar) |
| `isSelf`       | True cuando el remitente es el propio agente configurado         |
| `displayLabel` | Etiqueta prerenderizada para el texto del sobre                  |

### ConversationFacts

| Campo             | Propósito                                                              |
| ----------------- | ---------------------------------------------------------------------- |
| `kind`            | `direct`, `group` o `channel`                                          |
| `id`              | ID de conversación usado para enrutamiento                             |
| `label`           | Etiqueta humana para el sobre                                          |
| `spaceId`         | Identificador opcional del espacio externo (workspace de Slack, homeserver de Matrix) |
| `parentId`        | ID de conversación externa cuando esto es un hilo                      |
| `threadId`        | ID de hilo cuando este mensaje está dentro de un hilo                  |
| `nativeChannelId` | ID de canal nativo de la plataforma cuando difiere del ID de enrutamiento |
| `routePeer`       | Par usado para la búsqueda de `resolveAgentRoute`                      |

### RouteFacts

| Campo                   | Propósito                                                    |
| ----------------------- | ------------------------------------------------------------ |
| `agentId`               | Agente que debe manejar este turno                           |
| `accountId`             | Anulación opcional (canales multicuenta)                     |
| `routeSessionKey`       | Clave de sesión usada para enrutamiento                      |
| `dispatchSessionKey`    | Clave de sesión usada en el despacho cuando difiere de la clave de ruta |
| `persistedSessionKey`   | Clave de sesión escrita en metadatos de sesión persistidos   |
| `parentSessionKey`      | Padre para sesiones ramificadas/con hilos                    |
| `modelParentSessionKey` | Padre del lado del modelo para sesiones ramificadas          |
| `mainSessionKey`        | Pin de propietario de MD principal para conversaciones directas |
| `createIfMissing`       | Permite que el paso de registro cree una fila de sesión faltante |

### ReplyPlanFacts

| Campo                     | Propósito                                                       |
| ------------------------- | --------------------------------------------------------------- |
| `to`                      | Destino lógico de respuesta escrito en el contexto `To`         |
| `originatingTo`           | Destino de contexto de origen (`OriginatingTo`)                 |
| `nativeChannelId`         | id de canal nativo de la plataforma para la entrega             |
| `replyTarget`             | Destino final de respuesta visible si difiere de `to`           |
| `deliveryTarget`          | Anulación de entrega de nivel inferior                          |
| `replyToId`               | id de mensaje citado/anclado                                    |
| `replyToIdFull`           | id citado en formato completo cuando la plataforma tiene ambos  |
| `messageThreadId`         | id del hilo en el momento de la entrega                         |
| `threadParentId`          | id del mensaje padre del hilo                                   |
| `sourceReplyDeliveryMode` | `thread`, `reply`, `channel`, `direct` o `none`                 |

### AccessFacts

`AccessFacts` transporta los booleanos que necesita la etapa de autorización. La coincidencia de identidad permanece en el canal: el kernel solo consume el resultado.

| Campo      | Propósito                                                                   |
| ---------- | --------------------------------------------------------------------------- |
| `dm`       | Decisión de permitir/emparejar/denegar DM y lista `allowFrom`               |
| `group`    | Política de grupo, permiso de ruta, permiso de remitente, allowlist, requisito de mención |
| `commands` | Autorización de comandos entre autorizadores configurados                   |
| `mentions` | Si la detección de menciones es posible y si se mencionó al agente          |

### MessageFacts

| Campo            | Propósito                                                    |
| ---------------- | ------------------------------------------------------------ |
| `body`           | Cuerpo final del sobre (formateado)                          |
| `rawBody`        | Cuerpo entrante sin procesar                                 |
| `bodyForAgent`   | Cuerpo que ve el agente                                      |
| `commandBody`    | Cuerpo usado para el análisis de comandos                    |
| `envelopeFrom`   | Etiqueta de remitente preprocesada para el sobre             |
| `senderLabel`    | Anulación opcional para el remitente renderizado             |
| `preview`        | Vista previa breve censurada para registros                  |
| `inboundHistory` | Entradas recientes del historial entrante cuando el canal mantiene un búfer |

### SupplementalContextFacts

El contexto suplementario cubre el contexto de cita, reenvío y arranque de hilo. El kernel aplica la política `contextVisibility` configurada. El adaptador de canal solo proporciona hechos y marcas `senderAllowed` para que la política entre canales se mantenga coherente.

### InboundMediaFacts

Los medios tienen forma de hechos. La descarga de plataforma, autenticación, política SSRF, reglas de CDN y descifrado permanecen locales al canal. El kernel asigna hechos a `MediaPath`, `MediaUrl`, `MediaType`, `MediaPaths`, `MediaUrls`, `MediaTypes` y `MediaTranscribedIndexes`.

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

`resolveTurn` devuelve un `ChannelTurnResolved`, que es un `AssembledChannelTurn` con un tipo de admisión opcional. Devolver `{ admission: { kind: "observeOnly" } }` ejecuta el turno sin producir salida visible. El adaptador sigue siendo propietario del callback de entrega; simplemente se convierte en una no-op para ese turno.

`onFinalize` se ejecuta en cada resultado, incluidos los errores de despacho. Úsalo para borrar el historial de grupo pendiente, eliminar reacciones de confirmación, detener indicadores de estado y vaciar el estado local.

## Adaptador de entrega

El kernel no llama directamente a la plataforma. El canal entrega al kernel un `ChannelTurnDeliveryAdapter`:

```typescript
type ChannelTurnDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` se llama una vez por cada fragmento de respuesta almacenado en búfer. Devuelve los ids de mensajes de la plataforma cuando el canal los tenga para que el despachador pueda preservar anclajes de hilo y editar fragmentos posteriores. Para turnos solo de observación, devuelve `{ visibleReplySent: false }` o usa `createNoopChannelTurnDeliveryAdapter()`.

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

El despachador espera a la etapa de registro. Si el registro lanza un error, el kernel ejecuta `onPreDispatchFailure` (cuando se proporciona a `runPrepared`) y vuelve a lanzar el error.

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

Etapas registradas: `ingest`, `classify`, `preflight`, `resolve`, `authorize`, `assemble`, `record`, `dispatch`, `finalize`. Evita registrar cuerpos sin procesar; usa `MessageFacts.preview` para vistas previas breves censuradas.

## Qué permanece local al canal

El kernel es propietario de la orquestación. El canal sigue siendo propietario de:

- Transportes de plataforma (Gateway, REST, websocket, sondeo, webhooks)
- Resolución de identidad y coincidencia de nombres para mostrar
- Comandos nativos, comandos slash, autocompletado, modales, botones, estado de voz
- Renderizado de tarjetas, modales y adaptive cards
- Autenticación de medios, reglas de CDN, medios cifrados, transcripción
- APIs de edición, reacción, censura y presencia
- Backfill y obtención de historial del lado de la plataforma
- Flujos de emparejamiento que requieren verificación específica de la plataforma

Si dos canales empiezan a necesitar el mismo helper para uno de estos, extrae un helper compartido del SDK en lugar de llevarlo al kernel.

## Estabilidad

`runtime.channel.turn.*` forma parte de la superficie pública del entorno de ejecución de plugins. Los tipos de hechos (`SenderFacts`, `ConversationFacts`, `RouteFacts`, `ReplyPlanFacts`, `AccessFacts`, `MessageFacts`, `SupplementalContextFacts`, `InboundMediaFacts`) y las formas de admisión (`ChannelTurnAdmission`, `ChannelEventClass`) son accesibles mediante `PluginRuntime` desde `openclaw/plugin-sdk/core`.

Se aplican las reglas de compatibilidad hacia atrás: los nuevos campos de hechos son aditivos, los tipos de admisión no se renombran y los nombres de los puntos de entrada permanecen estables. Las nuevas necesidades de canal que requieran un cambio no aditivo deben pasar por el proceso de migración del SDK de plugins.

## Relacionado

- [Crear plugins de canal](/es/plugins/sdk-channel-plugins) para el contrato más amplio de Plugin de canal
- [Helpers del entorno de ejecución de plugins](/es/plugins/sdk-runtime) para otras superficies `runtime.*`
- [Elementos internos de plugins](/es/plugins/architecture-internals) para la canalización de carga y la mecánica del registro
