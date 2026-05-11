---
read_when:
    - Estás creando un nuevo Plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Debe comprender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-05-11T20:46:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía explica cómo crear un Plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad para MD,
emparejamiento, encadenamiento de respuestas y mensajería saliente.

<Info>
  Si aún no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los Plugins de canal

Los Plugins de canal no necesitan sus propias herramientas para enviar, editar ni reaccionar. OpenClaw mantiene una
herramienta `message` compartida en el núcleo. Tu Plugin es responsable de:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de MD y listas de permitidos
- **Emparejamiento** - flujo de aprobación por MD
- **Gramática de sesión** - cómo los identificadores de conversación específicos del proveedor se asignan a chats base, identificadores de hilo y alternativas de padre
- **Saliente** - envío de texto, medios y encuestas a la plataforma
- **Encadenamiento** - cómo se encadenan las respuestas
- **Escritura de Heartbeat** - señales opcionales de escritura/ocupado para destinos de entrega de Heartbeat

El núcleo es responsable de la herramienta de mensaje compartida, el cableado de prompts, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Los nuevos Plugins de canal también deben exponer un adaptador `message` con
`defineChannelMessageAdapter` de `openclaw/plugin-sdk/channel-message`. El
adaptador declara qué capacidades duraderas de envío final admite realmente el transporte nativo
y apunta los envíos de texto/medios a las mismas funciones de transporte que el
adaptador `outbound` heredado. Declara una capacidad solo cuando una prueba de contrato
demuestre el efecto secundario nativo y el recibo devuelto.
Para ver el contrato completo de la API, ejemplos, matriz de capacidades, reglas de recibos, finalización de vista previa en vivo, política de confirmación de recepción, pruebas y tabla de migración, consulta
[API de mensajes de canal](/es/plugins/sdk-channel-message).
Si el adaptador `outbound` existente ya tiene los métodos de envío y los metadatos
de capacidades correctos, usa `createChannelMessageAdapterFromOutbound(...)` para
derivar el adaptador `message` en lugar de escribir otro puente a mano.
Los envíos del adaptador deben devolver valores `MessageReceipt`. Cuando el código de compatibilidad
aún necesite identificadores heredados, derívalos con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos
`messageIds` paralelos en el nuevo código de ciclo de vida.
Los canales con capacidad de vista previa también deben declarar `message.live.capabilities` con
el ciclo de vida en vivo exacto que controlan, como `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. Los canales que finalizan una vista previa de borrador en el mismo lugar también deben
declarar `message.live.finalizer.capabilities`, como `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` y
`retainOnAmbiguousFailure`, y enrutar la lógica de runtime mediante
`defineFinalizableLivePreviewAdapter(...)` junto con
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantén esas capacidades respaldadas
por pruebas `verifyChannelMessageLiveCapabilityAdapterProofs(...)` y
`verifyChannelMessageLiveFinalizerProofs(...)` para que la vista previa nativa,
el progreso, la edición, la alternativa/retención, la limpieza y el comportamiento de recibos no puedan desviarse
silenciosamente.
Los receptores entrantes que difieren las confirmaciones de la plataforma deben declarar
`message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de ocultar
el momento de confirmación en estado local del monitor. Cubre cada política declarada con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los helpers heredados de respuesta/turno, como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` y `recordInboundSessionAndDispatchReply`,
siguen disponibles para despachadores de compatibilidad. No uses esos nombres para código nuevo
de canal; los Plugins nuevos deben empezar con el adaptador `message`, recibos y
helpers de ciclo de vida de recepción/envío en `openclaw/plugin-sdk/channel-message`.

Los canales que migran la autorización entrante pueden usar la subruta experimental
`openclaw/plugin-sdk/channel-ingress-runtime` desde rutas de recepción de runtime.
La subruta mantiene la búsqueda de plataforma y los efectos secundarios en el Plugin, mientras
comparte la resolución del estado de lista de permitidos, decisiones de ruta/remitente/comando/evento/activación,
diagnósticos redactados y asignación de admisión de turnos. Mantén la normalización
de identidad del Plugin en el descriptor que pasas al resolutor; no
serialices valores de coincidencia sin procesar del estado o la decisión resueltos. Consulta
[API de ingreso de canal](/es/plugins/sdk-channel-ingress) para ver el diseño de la API,
el límite de responsabilidad y las expectativas de pruebas.

Si tu canal admite indicadores de escritura fuera de las respuestas entrantes, expón
`heartbeat.sendTyping(...)` en el Plugin de canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que comience la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de mantenimiento/limpieza de escritura. Agrega `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de parada.

Si tu canal agrega parámetros de herramienta de mensaje que transportan fuentes de medios, expón esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas de sandbox y la política de acceso a medios
salientes, de modo que los Plugins no necesitan casos especiales en el núcleo compartido para parámetros
específicos del proveedor como avatar, adjunto o imagen de portada.
Prefiere devolver un mapa indexado por acción, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que acciones no relacionadas no
hereden los argumentos de medios de otra acción. Un arreglo plano sigue funcionando para parámetros que
se comparten intencionalmente entre todas las acciones expuestas.

Si tu canal necesita conformación específica del proveedor para `message(action="send")`,
prefiere `actions.prepareSendPayload(...)`. Coloca tarjetas nativas, bloques, inserciones u
otros datos duraderos bajo `payload.channelData.<channel>` y deja que el núcleo realice
el envío real mediante el adaptador outbound/message. Usa
`actions.handleAction(...)` para enviar solo como alternativa de compatibilidad para
cargas que no se pueden serializar y reintentar.

Si tu plataforma almacena alcance adicional dentro de los identificadores de conversación, mantén ese análisis
en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el
hook canónico para asignar `rawId` al identificador de conversación base, identificador de hilo
opcional, `baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el padre
más estrecho hasta la conversación más amplia/base.

Usa `openclaw/plugin-sdk/channel-route` cuando el código del Plugin necesite normalizar
campos similares a rutas, comparar un hilo hijo con su ruta padre o construir una
clave de deduplicación estable a partir de `{ channel, to, accountId, threadId }`. El helper
normaliza identificadores de hilo numéricos del mismo modo que lo hace el núcleo, por lo que los Plugins deben preferirlo
en lugar de comparaciones ad hoc con `String(threadId)`.
Los Plugins con gramática de destino específica del proveedor pueden inyectar su analizador en
`resolveChannelRouteTargetWithParser(...)` y seguir obteniendo la misma forma de destino
de ruta y las semánticas de alternativa de hilo que usa el núcleo.

Los Plugins incluidos que necesiten el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` coincidente. El núcleo usa esa superficie segura para arranque
solo cuando el registro de Plugins de runtime aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como una
alternativa de compatibilidad heredada cuando un Plugin solo necesita alternativas de padre sobre
el identificador genérico/sin procesar. Si existen ambos hooks, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades de canal

La mayoría de los Plugins de canal no necesitan código específico de aprobaciones.

- Core es responsable de `/approve` en el mismo chat, de las cargas útiles compartidas de botones de aprobación y de la entrega genérica de respaldo.
- Prefiere un único objeto `approvalCapability` en el plugin de canal cuando el canal necesite comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloca los datos de entrega/nativos/renderizado/autenticación de aprobación en `approvalCapability`.
- `plugin.auth` es solo inicio/cierre de sesión; Core ya no lee hooks de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la interfaz canónica de autenticación de aprobación.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobación en el mismo chat.
- Si tu canal expone aprobaciones exec nativas, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat. Core usa ese hook específico de exec para distinguir `enabled` de `disabled`, decidir si el canal iniciador admite aprobaciones exec nativas e incluir el canal en la guía de respaldo para clientes nativos. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` u `outbound.beforeDeliverPayload` para comportamiento del ciclo de vida de la carga útil específico del canal, como ocultar solicitudes locales de aprobación duplicadas o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento de aprobaciones nativas o supresión de respaldo.
- Usa `approvalCapability.nativeRuntime` para datos de aprobación nativa propiedad del canal. Mantenlo lazy en puntos de entrada de canal calientes con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo runtime bajo demanda y aun así permitir que Core ensamble el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles de aprobación personalizadas en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique los controles de configuración exactos necesarios para habilitar aprobaciones exec nativas. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deben renderizar rutas con alcance de cuenta, como `channels.<channel>.accounts.<id>.execApprovals.*`, en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades de DM estables similares a propietario a partir de la configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica de Core específica de aprobación.
- Si un canal necesita entrega de aprobación nativa, mantén el código del canal enfocado en la normalización de destinos y los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que Core pueda ensamblar el manejador y encargarse del filtrado de solicitudes, enrutamiento, deduplicación, expiración, suscripción al Gateway y avisos de enrutamiento a otro lugar. `nativeRuntime` se divide en unas cuantas interfaces más pequeñas:
- `createChannelNativeOriginTargetResolver` usa el comparador compartido de rutas de canal de forma predeterminada para destinos `{ to, accountId, threadId }`. Pasa `targetsMatch` solo cuando un canal tenga reglas de equivalencia específicas del proveedor, como coincidencia por prefijo de marca de tiempo de Slack.
- Pasa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` cuando el canal necesite canonicalizar ids del proveedor antes de que se ejecute el comparador de rutas predeterminado o un callback `targetsMatch` personalizado, preservando a la vez el destino original para la entrega. Usa `normalizeTarget` solo cuando el propio destino de entrega resuelto deba canonicalizarse.
- `availability`: si la cuenta está configurada y si una solicitud debe manejarse
- `presentation`: asigna el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/expiradas o acciones finales
- `transport`: prepara destinos y envía/actualiza/elimina mensajes de aprobación nativa
- `interactions`: hooks opcionales de vinculación/desvinculación/limpieza de acciones para botones o reacciones nativos
- `observe`: hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos propiedad del runtime, como un cliente, token, app Bolt o receptor de webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto runtime permite que Core arranque manejadores impulsados por capacidades desde el estado de inicio del canal sin agregar pegamento wrapper específico de aprobación.
- Recurre a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando la interfaz impulsada por capacidades aún no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` mediante esos helpers. `accountId` mantiene la política de aprobación de múltiples cuentas dentro del alcance de la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación exec frente a plugin sin ramas codificadas en Core.
- Core ahora también es responsable de los avisos de redireccionamiento de aprobación. Los plugins de canal no deben enviar sus propios mensajes de seguimiento de "la aprobación fue a DMs / otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expón un enrutamiento preciso de origen + DM de aprobador mediante los helpers compartidos de capacidad de aprobación y deja que Core agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Preserva el tipo de id de aprobación entregada de extremo a extremo. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobación exec frente a plugin a partir del estado local del canal.
- Distintos tipos de aprobación pueden exponer intencionalmente distintas superficies nativas.
  Ejemplos actuales incluidos:
  - Slack mantiene el enrutamiento de aprobación nativa disponible tanto para ids exec como de plugin.
  - Matrix mantiene el mismo enrutamiento nativo de DM/canal y UX de reacciones para aprobaciones exec
    y de plugin, mientras sigue permitiendo que la autenticación difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como wrapper de compatibilidad, pero el código nuevo debe preferir el builder de capacidades y exponer `approvalCapability` en el plugin.

Para puntos de entrada de canal calientes, prefiere las subrutas runtime más estrechas cuando solo
necesites una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Del mismo modo, prefiere `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la superficie paraguas
más amplia.

Para setup específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de setup seguros en runtime:
  adaptadores de patch de setup seguros para importación (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los builders delegados de
  proxy de setup
- `openclaw/plugin-sdk/setup-runtime` incluye la interfaz de adaptador sensible al entorno para
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los builders de setup de instalación opcional
  además de unas cuantas primitivas seguras para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite setup o autenticación controlados por variables de entorno y los flujos genéricos
de inicio/configuración deben conocer esos nombres de entorno antes de que se cargue el runtime,
decláralos en el manifiesto del plugin con `channelEnvVars`. Mantén `envVars` del runtime de canal o
constantes locales solo para texto orientado a operadores.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o
escaneos SecretRef antes de que se inicie el runtime del plugin, agrega `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe ser seguro de importar en rutas de comandos de solo lectura
y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup, el adaptador
de estado y los metadatos de destino secreto del canal necesarios para esos resúmenes. No inicies
clientes, listeners ni runtimes de transporte desde la entrada de setup.

Mantén también estrecha la ruta de importación de la entrada principal del canal. Discovery puede evaluar la
entrada y el módulo del plugin de canal para registrar capacidades sin activar
el canal. Los archivos como `channel-plugin-api.ts` deben exportar el objeto de plugin de canal
sin importar wizards de setup, clientes de transporte, listeners de socket,
lanzadores de subprocesos ni módulos de inicio de servicio. Coloca esas piezas runtime
en módulos cargados desde `registerFull(...)`, setters runtime o adaptadores de capacidad
lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la interfaz más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los
  helpers compartidos de setup/configuración más pesados, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala este plugin primero" en superficies de setup,
prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/wizard generado falla cerrado
en escrituras de configuración y finalización, y reutiliza el mismo mensaje de instalación requerida
en validación, finalización y texto de enlace de documentación.

Para otras rutas de canal calientes, prefiere los helpers estrechos en lugar de superficies heredadas
más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración de múltiples cuentas y
  respaldo de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para ruta/sobre de entrada y
  cableado de registrar y despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios además de delegados
  de identidad/envío salientes y planificación de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente deba preservar un
  `replyToId`/`threadId` explícito o recuperar la sesión `:thread:` actual
  después de que la clave de sesión base aún coincida. Los plugins de proveedor pueden sobrescribir
  la precedencia, el comportamiento de sufijos y la normalización de id de hilo cuando su plataforma
  tenga semántica de entrega nativa en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de vinculaciones de hilos
  y registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando aún se requiera un diseño de campo
  heredado de carga útil de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados de Telegram,
  validación de duplicados/conflictos y un contrato de configuración de comandos estable para respaldo

Los canales solo de autenticación normalmente pueden detenerse en la ruta predeterminada: Core maneja las aprobaciones y el plugin solo expone capacidades salientes/de autenticación. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los helpers nativos compartidos en lugar de implementar su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propiedad del plugin
- evaluación de política compartida

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel de helpers de entrada
más amplio.

Buen encaje para lógica local del plugin:

- detección de respuesta al bot
- detección de bot citado
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de plataforma necesarias para probar la participación del bot

Buen encaje para el helper compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos de menciones implícitas
- omisión de comandos
- decisión final de omisión

Flujo preferido:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu compuerta de entrada.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` expone los mismos helpers de menciones compartidos para
plugins de canal incluidos que ya dependen de la inyección del runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers de runtime
de entrada no relacionados.

Los helpers antiguos `resolveMentionGating*` permanecen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Tutorial

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del plugin. El campo `channel` en `package.json` es
    lo que convierte esto en un plugin de canal. Para ver la superficie completa de metadatos del paquete,
    consulta [Configuración de Plugin y configuración](/es/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valida `plugins.entries.acme-chat.config`. Úsalo para
    ajustes propiedad del plugin que no sean la configuración de la cuenta del canal. `channelConfigs`
    valida `channels.acme-chat` y es la fuente de ruta fría que usan el esquema de configuración,
    la configuración inicial y las superficies de IU antes de que se cargue el runtime del plugin.

  </Step>

  <Step title="Construir el objeto del plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empieza con
    lo mínimo, `id` y `setup`, y agrega adaptadores a medida que los necesites.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Para canales que aceptan tanto claves canónicas de DM de nivel superior como claves anidadas heredadas, usa los helpers de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por delante de los valores raíz heredados. Combina el mismo resolver con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el runtime y la migración lean el mismo contrato.

    <Accordion title="Qué hace createChatChannelPlugin por ti">
      En lugar de implementar interfaces de adaptador de bajo nivel manualmente, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolver de seguridad de DM con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento de DM basado en texto con intercambio de código |
      | `threading` | Resolver de modo de respuesta (fijo, con alcance de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (ID de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de las opciones declarativas
      si necesitas control total.

      Los adaptadores de salida sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El `ctx.formatting` opcional transporta decisiones de formato en tiempo de entrega
      como `maxLinesPerMessage`; aplícalas antes de enviar para que el enlazado de respuestas
      y los límites de fragmentos se resuelvan una sola vez mediante la entrega de salida compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se resolvió un destino de respuesta nativo, de modo que los helpers de payload puedan conservar
      etiquetas de respuesta explícitas sin consumir una ranura de respuesta implícita de un solo uso.
    </Accordion>

  </Step>

  <Step title="Conectar el punto de entrada">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Coloca los descriptores de CLI propiedad del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el runtime completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real
    de comandos. Mantén `registerFull(...)` para trabajo exclusivo del runtime.
    Si `registerFull(...)` registra métodos RPC del Gateway, usa un
    prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la división del modo de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas
    las opciones.

  </Step>

  <Step title="Agregar una entrada de configuración inicial">
    Crea `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no está configurado. Evita cargar código de runtime pesado durante los flujos de configuración inicial.
    Consulta [Configuración inicial y configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales de workspace incluidos que separan exportaciones aptas para configuración inicial en módulos
    sidecar pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    setter de runtime explícito en tiempo de configuración inicial.

  </Step>

  <Step title="Gestionar mensajes de entrada">
    Tu plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del manejador de entrada de tu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      El manejo de mensajes entrantes es específico de cada canal. Cada plugin de canal es dueño de
      su propia canalización de entrada. Consulta los plugins de canal incluidos
      (por ejemplo, el paquete de plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Prueba">
Escribe pruebas colocadas junto al código en `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Para helpers de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

</Step>
</Steps>

## Estructura de archivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de hilos" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance de cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
  <Card title="Kernel de turnos de canal" icon="bolt" href="/es/plugins/sdk-channel-turn">
    Ciclo de vida compartido de turnos entrantes: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Todavía existen algunas uniones de helpers incluidos para el mantenimiento y
la compatibilidad de plugins incluidos. No son el patrón recomendado para nuevos plugins de canal;
prefiere las subrutas genéricas de canal/configuración/respuesta/runtime desde la superficie común del SDK,
salvo que estés manteniendo directamente esa familia de plugins incluidos.
</Note>

## Próximos pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - si tu plugin también proporciona modelos
- [Descripción general del SDK](/es/plugins/sdk-overview) - referencia completa de importación de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contrato
- [Manifiesto de Plugin](/es/plugins/manifest) - esquema completo del manifiesto

## Relacionado

- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
