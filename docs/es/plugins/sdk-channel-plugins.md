---
read_when:
    - Estás creando un nuevo plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Debe comprender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-05-06T05:43:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía explica cómo crear un plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad para DM,
emparejamiento, hilos de respuesta y mensajería saliente.

<Info>
  Si no has creado antes ningún plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica del paquete
  y la configuración del manifiesto.
</Info>

## Cómo funcionan los plugins de canal

Los plugins de canal no necesitan sus propias herramientas de envío/edición/reacción. OpenClaw mantiene una
herramienta `message` compartida en el núcleo. Tu plugin es responsable de:

- **Configuración** - resolución de cuentas y asistente de configuración
- **Seguridad** - política de DM y listas de permitidos
- **Emparejamiento** - flujo de aprobación por DM
- **Gramática de sesión** - cómo los identificadores de conversación específicos del proveedor se asignan a chats base, identificadores de hilo y alternativas de padre
- **Saliente** - envío de texto, contenido multimedia y encuestas a la plataforma
- **Hilos** - cómo se organizan las respuestas en hilos
- **Indicador de escritura de Heartbeat** - señales opcionales de escritura/ocupado para destinos de entrega de Heartbeat

El núcleo es responsable de la herramienta de mensaje compartida, el cableado de prompts, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Los nuevos plugins de canal también deberían exponer un adaptador `message` con
`defineChannelMessageAdapter` desde `openclaw/plugin-sdk/channel-message`. El
adaptador declara qué capacidades duraderas de envío final admite realmente el transporte nativo
y apunta los envíos de texto/contenido multimedia a las mismas funciones de transporte que
el adaptador `outbound` heredado. Declara una capacidad solo cuando una prueba de contrato
demuestre el efecto secundario nativo y el recibo devuelto.
Para ver el contrato completo de la API, ejemplos, matriz de capacidades, reglas de recibos, finalización de vista previa en vivo, política de confirmación de recepción, pruebas y tabla de migración, consulta
[API de mensajes de canal](/es/plugins/sdk-channel-message).
Si el adaptador `outbound` existente ya tiene los métodos de envío y
metadatos de capacidad correctos, usa `createChannelMessageAdapterFromOutbound(...)` para
derivar el adaptador `message` en lugar de escribir otro puente manualmente.
Los envíos del adaptador deberían devolver valores `MessageReceipt`. Cuando el código de compatibilidad
todavía necesite identificadores heredados, derívalos con `listMessageReceiptPlatformIds(...)`
o `resolveMessageReceiptPrimaryId(...)` en lugar de mantener campos
`messageIds` paralelos en código de ciclo de vida nuevo.
Los canales con capacidad de vista previa también deberían declarar `message.live.capabilities` con
el ciclo de vida en vivo exacto que poseen, como `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` o
`quietFinalization`. Los canales que finalizan una vista previa de borrador en el mismo lugar también deberían
declarar `message.live.finalizer.capabilities`, como `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` y
`retainOnAmbiguousFailure`, y enrutar la lógica de ejecución mediante
`defineFinalizableLivePreviewAdapter(...)` junto con
`deliverWithFinalizableLivePreviewAdapter(...)`. Mantén esas capacidades respaldadas
por pruebas `verifyChannelMessageLiveCapabilityAdapterProofs(...)` y
`verifyChannelMessageLiveFinalizerProofs(...)` para que el comportamiento nativo de vista previa,
progreso, edición, alternativa/retención, limpieza y recibos no pueda desviarse
silenciosamente.
Los receptores entrantes que difieren las confirmaciones de la plataforma deberían declarar
`message.receive.defaultAckPolicy` y `supportedAckPolicies` en lugar de ocultar
la temporización de confirmación en estado local del monitor. Cubre cada política declarada con
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Los ayudantes heredados de respuesta/turno como `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` y `recordInboundSessionAndDispatchReply`
siguen disponibles para despachadores de compatibilidad. No uses esos nombres para código de canal nuevo; los plugins nuevos deberían empezar con el adaptador `message`, recibos y
ayudantes de ciclo de vida de recepción/envío en `openclaw/plugin-sdk/channel-message`.

Si tu canal admite indicadores de escritura fuera de respuestas entrantes, expón
`heartbeat.sendTyping(...)` en el plugin de canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que comience la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de keepalive/limpieza de escritura. Añade `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de detención.

Si tu canal añade parámetros de herramienta de mensajes que contienen fuentes multimedia, expón esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas de sandbox y la política de acceso a multimedia saliente,
así que los plugins no necesitan casos especiales en el núcleo compartido para parámetros específicos del proveedor
como avatar, adjunto o imagen de portada.
Prefiere devolver un mapa indexado por acción, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que acciones no relacionadas no
hereden los argumentos multimedia de otra acción. Un array plano sigue funcionando para parámetros que
se comparten intencionalmente entre todas las acciones expuestas.

Si tu canal necesita modelado específico del proveedor para `message(action="send")`,
prefiere `actions.prepareSendPayload(...)`. Coloca tarjetas nativas, bloques, incrustaciones u
otros datos duraderos bajo `payload.channelData.<channel>` y deja que el núcleo realice
el envío real mediante el adaptador outbound/message. Usa
`actions.handleAction(...)` para enviar solo como alternativa de compatibilidad para
cargas útiles que no se puedan serializar y reintentar.

Si tu plataforma almacena alcance adicional dentro de los identificadores de conversación, mantén ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el
hook canónico para asignar `rawId` al identificador de conversación base, el identificador de hilo opcional,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el
padre más específico hasta la conversación más amplia/base.

Usa `openclaw/plugin-sdk/channel-route` cuando el código del plugin necesite normalizar
campos similares a rutas, comparar un hilo hijo con su ruta padre o crear una
clave de deduplicación estable a partir de `{ channel, to, accountId, threadId }`. El ayudante
normaliza los identificadores de hilo numéricos del mismo modo que lo hace el núcleo, así que los plugins deberían preferirlo
frente a comparaciones ad hoc de `String(threadId)`.
Los plugins con gramática de destino específica del proveedor pueden inyectar su analizador en
`resolveChannelRouteTargetWithParser(...)` y aun así obtener la misma forma de destino de ruta
y semántica de alternativa de hilo que usa el núcleo.

Los plugins incluidos que necesiten el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo de nivel superior `session-key-api.ts` con una exportación
`resolveSessionConversation(...)` coincidente. El núcleo usa esa superficie segura para arranque
solo cuando el registro de plugins en tiempo de ejecución aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como una
alternativa heredada de compatibilidad cuando un plugin solo necesita alternativas de padre además
del identificador genérico/sin procesar. Si existen ambos hooks, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo recurre a
`resolveParentConversationCandidates(...)` cuando el hook canónico los omite.

## Aprobaciones y capacidades de canal

La mayoría de los plugins de canal no necesitan código específico de aprobación.

- Core es propietario de `/approve` en el mismo chat, las cargas útiles de botones de aprobación compartidos y la entrega alternativa genérica.
- Prefiere un único objeto `approvalCapability` en el plugin de canal cuando el canal necesita comportamiento específico de aprobaciones.
- `ChannelPlugin.approvals` se eliminó. Coloca los datos de entrega, nativos, renderización y autorización de aprobaciones en `approvalCapability`.
- `plugin.auth` es solo inicio/cierre de sesión; Core ya no lee hooks de autorización de aprobaciones desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la integración canónica de autorización de aprobaciones.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autorización de aprobaciones en el mismo chat.
- Si tu canal expone aprobaciones de ejecución nativas, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autorización de aprobaciones en el mismo chat. Core usa ese hook específico de ejecución para distinguir `enabled` de `disabled`, decidir si el canal iniciador admite aprobaciones de ejecución nativas e incluir el canal en la guía de alternativa del cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` u `outbound.beforeDeliverPayload` para comportamiento del ciclo de vida de cargas útiles específico del canal, como ocultar avisos de aprobación locales duplicados o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento de aprobaciones nativas o supresión de alternativas.
- Usa `approvalCapability.nativeRuntime` para datos de aprobación nativa propiedad del canal. Manténlo diferido en puntos de entrada de canal frecuentes con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo de runtime bajo demanda sin impedir que Core ensamble el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles de aprobación personalizadas en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique los controles de configuración exactos necesarios para habilitar aprobaciones de ejecución nativas. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas nombradas deben renderizar rutas con alcance de cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades DM estables parecidas a propietario desde la configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica de Core específica de aprobaciones.
- Si un canal necesita entrega de aprobaciones nativas, mantén el código del canal centrado en la normalización de destinos y los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que Core pueda ensamblar el manejador y encargarse del filtrado de solicitudes, enrutamiento, desduplicación, expiración, suscripción de Gateway y avisos de enrutamiento a otro lugar. `nativeRuntime` se divide en algunas integraciones más pequeñas:
- `createChannelNativeOriginTargetResolver` usa por defecto el comparador de rutas de canal compartido para destinos `{ to, accountId, threadId }`. Pasa `targetsMatch` solo cuando un canal tiene reglas de equivalencia específicas del proveedor, como coincidencia de prefijo de marca de tiempo en Slack.
- Pasa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` cuando el canal necesite canonicalizar ids del proveedor antes de que se ejecute el comparador de rutas predeterminado o un callback `targetsMatch` personalizado, preservando el destino original para la entrega. Usa `normalizeTarget` solo cuando el propio destino de entrega resuelto deba canonicalizarse.
- `availability` - si la cuenta está configurada y si una solicitud debe manejarse
- `presentation` - asigna el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/expiradas o acciones finales
- `transport` - prepara destinos y envía/actualiza/elimina mensajes de aprobación nativa
- `interactions` - hooks opcionales de vinculación/desvinculación/limpieza de acciones para botones o reacciones nativas
- `observe` - hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos propiedad del runtime, como un cliente, token, app Bolt o receptor de webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de runtime permite que Core inicialice manejadores impulsados por capacidades desde el estado de arranque del canal sin agregar código envoltorio específico de aprobaciones.
- Recurre al nivel inferior `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` solo cuando la integración impulsada por capacidades aún no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` mediante esos helpers. `accountId` mantiene la política de aprobaciones multicuenta acotada a la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobaciones de ejecución frente a Plugin sin ramas hardcodeadas en Core.
- Core ahora también es propietario de los avisos de reenvío de aprobaciones. Los plugins de canal no deben enviar sus propios mensajes de seguimiento de "la aprobación fue a DMs / otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expón enrutamiento preciso de origen + DM de aprobador mediante los helpers de capacidad de aprobación compartida y deja que Core agregue las entregas reales antes de publicar cualquier aviso de vuelta en el chat iniciador.
- Preserva de extremo a extremo el tipo del id de aprobación entregado. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobaciones de ejecución frente a Plugin desde estado local del canal.
- Distintos tipos de aprobación pueden exponer intencionalmente superficies nativas diferentes.
  Ejemplos empaquetados actuales:
  - Slack mantiene disponible el enrutamiento de aprobaciones nativas tanto para ids de ejecución como de Plugin.
  - Matrix mantiene el mismo enrutamiento nativo por DM/canal y la UX de reacciones para aprobaciones de ejecución
    y de Plugin, aunque aún permite que la autorización difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` aún existe como envoltorio de compatibilidad, pero el código nuevo debe preferir el constructor de capacidad y exponer `approvalCapability` en el Plugin.

Para puntos de entrada de canal frecuentes, prefiere las subrutas de runtime más estrechas cuando solo
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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la superficie paraguas
más amplia.

Para setup específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de setup seguros para runtime:
  adaptadores de parche de setup seguros para importar (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores delegados de
  proxy de setup
- `openclaw/plugin-sdk/setup-adapter-runtime` es la integración estrecha de adaptador
  consciente de entorno para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de setup de instalación
  opcional más algunas primitivas seguras para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite setup o autorización impulsados por entorno y los flujos genéricos de arranque/configuración
deben conocer esos nombres de entorno antes de que cargue el runtime, decláralos en el
manifiesto del Plugin con `channelEnvVars`. Mantén `envVars` del runtime de canal o constantes
locales solo para textos dirigidos a operadores.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o
escaneos SecretRef antes de que arranque el runtime del Plugin, agrega `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe poder importarse de forma segura en rutas de comando
de solo lectura y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup,
el adaptador de estado y los metadatos de destino secreto del canal necesarios para esos resúmenes. No
inicies clientes, listeners ni runtimes de transporte desde la entrada de setup.

Mantén también estrecha la ruta de importación principal del canal. Discovery puede evaluar la
entrada y el módulo del Plugin de canal para registrar capacidades sin activar
el canal. Archivos como `channel-plugin-api.ts` deben exportar el objeto Plugin de canal
sin importar asistentes de setup, clientes de transporte, listeners de socket,
lanzadores de subprocesos ni módulos de arranque de servicio. Coloca esas piezas de runtime
en módulos cargados desde `registerFull(...)`, setters de runtime o adaptadores de
capacidad diferidos.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la integración más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los
  helpers compartidos más pesados de setup/configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala este Plugin primero" en superficies de setup,
prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado
falla de forma cerrada en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en la validación, finalización y texto de
enlace de documentación.

Para otras rutas de canal frecuentes, prefiere los helpers estrechos sobre superficies
heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  alternativa de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para ruta/sobre entrante y
  cableado de registrar y despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios más delegados de
  identidad/envío saliente y planificación de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente deba preservar un
  `replyToId`/`threadId` explícito o recuperar la sesión `:thread:` actual
  después de que la clave de sesión base aún coincida. Los plugins de proveedor pueden sobrescribir
  precedencia, comportamiento de sufijo y normalización de id de hilo cuando su plataforma
  tenga semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vinculaciones de hilo
  y registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando aún se requiera un diseño
  de campos heredado de carga útil de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados
  de Telegram, validación de duplicados/conflictos y un contrato de configuración de comandos
  estable para alternativas

Los canales solo de autorización normalmente pueden detenerse en la ruta predeterminada: Core maneja las aprobaciones y el Plugin solo expone capacidades salientes/de autorización. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los helpers nativos compartidos en lugar de implementar su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propiedad del Plugin
- evaluación de política compartida

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel más amplio de
helpers entrantes.

Buen encaje para lógica local del Plugin:

- detección de respuesta al bot
- detección de bot citado
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar la participación del bot

Buen encaje para el helper compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos de mención implícita
- omisión de comando
- decisión final de omisión

Flujo preferido:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu puerta de entrada.

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

`api.runtime.channel.mentions` expone los mismos helpers de mención compartidos para
plugins de canal incluidos que ya dependen de la inyección en tiempo de ejecución:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers de entrada
en tiempo de ejecución no relacionados.

Los helpers `resolveMentionGating*` anteriores permanecen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Crea los archivos estándar del plugin. El campo `channel` en `package.json` es
    lo que convierte esto en un plugin de canal. Para ver toda la superficie de metadatos del paquete,
    consulta [Configuración e instalación de Plugin](/es/plugins/sdk-setup#openclaw-channel):

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
    ajustes propios del plugin que no sean la configuración de cuenta del canal. `channelConfigs`
    valida `channels.acme-chat` y es la fuente de ruta fría que usan el esquema de configuración,
    la configuración inicial y las superficies de interfaz antes de que se cargue el runtime del plugin.

  </Step>

  <Step title="Build the channel plugin object">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empieza con
    lo mínimo, `id` y `setup`, y añade adaptadores según los necesites.

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

    Para canales que aceptan tanto claves DM canónicas de nivel superior como claves anidadas heredadas, usa los helpers de `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` y `normalizeChannelDmPolicy` mantienen los valores locales de la cuenta por delante de los valores heredados de la raíz. Combina el mismo resolver con la reparación de doctor mediante `normalizeLegacyDmAliases` para que el runtime y la migración lean el mismo contrato.

    <Accordion title="What createChatChannelPlugin does for you">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Lo que conecta |
      | --- | --- |
      | `security.dm` | Resolver de seguridad DM con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento DM basado en texto con intercambio de código |
      | `threading` | Resolver de modo de respuesta (fijo, con alcance de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (IDs de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de las opciones declarativas
      si necesitas control total.

      Los adaptadores de salida sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El `ctx.formatting` opcional contiene decisiones de formato en el momento de la entrega
      como `maxLinesPerMessage`; aplícalo antes de enviar para que los hilos de respuesta
      y los límites de fragmentos se resuelvan una sola vez mediante la entrega de salida compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se resolvió un destino de respuesta nativo, de modo que los helpers de carga útil puedan conservar
      etiquetas de respuesta explícitas sin consumir un espacio de respuesta implícita de un solo uso.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    Coloca los descriptores de CLI propios del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar todo el runtime del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real de comandos. Mantén `registerFull(...)` para trabajo solo de runtime.
    Si `registerFull(...)` registra métodos RPC de Gateway, usa un
    prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la división de modos de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas
    las opciones.

  </Step>

  <Step title="Add a setup entry">
    Crea `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está desactivado
    o sin configurar. Evita cargar código de runtime pesado durante los flujos de configuración inicial.
    Consulta [Configuración e instalación](/es/plugins/sdk-setup#setup-entry) para obtener detalles.

    Los canales incluidos del espacio de trabajo que dividen exportaciones seguras para configuración inicial en módulos auxiliares
    pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesitan un
    setter explícito de runtime en tiempo de configuración inicial.

  </Step>

  <Step title="Handle inbound messages">
    Tu plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha mediante el manejador de entrada de tu canal:

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
      El manejo de mensajes entrantes es específico de cada canal. Cada Plugin de canal es dueño
      de su propia canalización de entrada. Consulta los Plugins de canal incluidos
      (por ejemplo, el paquete del Plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Probar">
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
  <Card title="Integración con herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
  <Card title="Kernel de turno de canal" icon="bolt" href="/es/plugins/sdk-channel-turn">
    Ciclo de vida compartido del turno entrante: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Algunos puntos de extensión helper incluidos aún existen para el mantenimiento de Plugins incluidos y la
compatibilidad. No son el patrón recomendado para nuevos Plugins de canal;
prefiere las subrutas genéricas de canal/configuración/respuesta/runtime de la superficie común del SDK,
a menos que estés manteniendo directamente esa familia de Plugins incluidos.
</Note>

## Próximos pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) - si tu Plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) - referencia completa de importaciones de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) - utilidades de prueba y pruebas de contrato
- [Manifest del Plugin](/es/plugins/manifest) - esquema completo del Manifest

## Relacionado

- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Crear Plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
