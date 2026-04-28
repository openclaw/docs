---
read_when:
    - Estás creando un nuevo Plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesitas entender la superficie del adaptador `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Creación de Plugins de canal
x-i18n:
    generated_at: "2026-04-25T13:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Esta guía recorre paso a paso la creación de un Plugin de canal que conecta OpenClaw a una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad para mensajes directos,
emparejamiento, threading de respuestas y mensajería saliente.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los Plugins de canal

Los Plugins de canal no necesitan sus propias herramientas de enviar/editar/reaccionar. OpenClaw mantiene una
única herramienta compartida `message` en el núcleo. Tu Plugin es responsable de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de mensajes directos y listas de permitidos
- **Emparejamiento** — flujo de aprobación para mensajes directos
- **Gramática de sesión** — cómo los ids de conversación específicos del proveedor se asignan a chats base, ids de hilo y respaldos de padre
- **Saliente** — envío de texto, contenido multimedia y encuestas a la plataforma
- **Threading** — cómo se encadenan las respuestas
- **Heartbeat typing** — señales opcionales de escribiendo/ocupado para destinos de entrega de Heartbeat

El núcleo es responsable de la herramienta compartida de mensajes, la conexión del prompt, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el dispatch.

Si tu canal admite indicadores de escritura fuera de respuestas entrantes,
expón `heartbeat.sendTyping(...)` en el Plugin de canal. El núcleo lo llama con el
destino de entrega resuelto de Heartbeat antes de que comience la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de keepalive/cleanup de escritura. Agrega `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de detención.

Si tu canal agrega parámetros a la herramienta de mensajes que transportan fuentes multimedia, expón esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas del sandbox y la política de acceso a contenido multimedia saliente, de modo
que los Plugins no necesiten casos especiales en el núcleo compartido para parámetros específicos del proveedor como
avatar, archivo adjunto o imagen de portada.
Prefiere devolver un mapa indexado por acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que acciones no relacionadas no hereden
los argumentos multimedia de otra acción. Un arreglo plano sigue funcionando para parámetros que
intencionalmente se comparten entre todas las acciones expuestas.

Si tu plataforma almacena alcance adicional dentro de los ids de conversación, mantén ese análisis
en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el hook canónico
para asignar `rawId` al id base de conversación, id opcional de hilo,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el padre
más específico hasta la conversación más amplia/base.

Los Plugins incluidos que necesiten el mismo análisis antes de que arranque el registro del canal
también pueden exponer un archivo de nivel superior `session-key-api.ts` con una exportación
coincidente `resolveSessionConversation(...)`. El núcleo usa esa superficie segura para bootstrap
solo cuando el registro de Plugins en runtime aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como respaldo heredado de compatibilidad cuando un Plugin solo necesita respaldos de padre sobre el id genérico/raw. Si ambos hooks existen, el núcleo usa
primero `resolveSessionConversation(...).parentConversationCandidates` y solo
usa como respaldo `resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los Plugins de canal no necesitan código específico de aprobaciones.

- El núcleo es responsable de `/approve` en el mismo chat, de los payloads compartidos de botones de aprobación y de la entrega genérica de respaldo.
- Prefiere un único objeto `approvalCapability` en el Plugin de canal cuando el canal necesita comportamiento específico de aprobaciones.
- `ChannelPlugin.approvals` fue eliminado. Coloca los datos de entrega/renderizado/autenticación de aprobaciones en `approvalCapability`.
- `plugin.auth` es solo para login/logout; el núcleo ya no lee hooks de autenticación de aprobaciones desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la interfaz canónica para autenticación de aprobaciones.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobaciones en el mismo chat.
- Si tu canal expone aprobaciones nativas de exec, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiere de la autenticación de aprobaciones en el mismo chat. El núcleo usa ese hook específico de exec para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas de exec e incluir el canal en la guía de respaldo para cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamiento específico del canal en el ciclo de vida del payload, como ocultar prompts locales duplicados de aprobación o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento nativo de aprobaciones o supresión de respaldo.
- Usa `approvalCapability.nativeRuntime` para datos nativos de aprobaciones propiedad del canal. Mantenlo lazy en puntos de entrada calientes del canal con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo de runtime a demanda y aun así permitir que el núcleo construya el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite payloads de aprobación personalizados en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de ruta deshabilitada explique exactamente qué claves de configuración se necesitan para habilitar aprobaciones nativas de exec. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas nombradas deben renderizar rutas con alcance de cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades estables similares al propietario en mensajes directos a partir de configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica específica de aprobaciones al núcleo.
- Si un canal necesita entrega nativa de aprobaciones, mantén el código del canal enfocado en la normalización del destino más los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda construir el controlador y hacerse cargo del filtrado de solicitudes, enrutamiento, deduplicación, expiración, suscripción al gateway y avisos de redirección. `nativeRuntime` se divide en varias interfaces más pequeñas:
- `availability` — si la cuenta está configurada y si una solicitud debe manejarse
- `presentation` — asignar el modelo de vista compartido de aprobación a payloads nativos pendientes/resueltos/expirados o acciones finales
- `transport` — preparar destinos más enviar/actualizar/eliminar mensajes nativos de aprobación
- `interactions` — hooks opcionales de bind/unbind/clear-action para botones o reacciones nativas
- `observe` — hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos propiedad del runtime, como un cliente, token, app Bolt o receptor de Webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de runtime permite que el núcleo haga bootstrap de controladores guiados por capacidades a partir del estado de inicio del canal sin agregar glue específico de aprobaciones.
- Recurre a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando la interfaz guiada por capacidades todavía no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` a través de esos helpers. `accountId` mantiene la política de aprobación multicuenta limitada a la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación de exec frente al de Plugin sin ramas codificadas en el núcleo.
- El núcleo ahora también es responsable de los avisos de redirección de aprobaciones. Los Plugins de canal no deben enviar sus propios mensajes de seguimiento de “la aprobación se envió a mensajes directos / otro canal” desde `createChannelNativeApprovalRuntime`; en su lugar, expón un enrutamiento preciso del origen + mensajes directos del aprobador mediante los helpers compartidos de capacidades de aprobación y deja que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Conserva de extremo a extremo el tipo de id de aprobación entregado. Los clientes nativos no deben adivinar ni reescribir el enrutamiento de aprobaciones de exec frente a Plugin a partir del estado local del canal.
- Diferentes tipos de aprobación pueden exponer intencionalmente distintas superficies nativas.
  Ejemplos actuales incluidos:
  - Slack mantiene disponible el enrutamiento nativo de aprobaciones tanto para ids de exec como de Plugin.
  - Matrix mantiene el mismo enrutamiento nativo de mensajes directos/canales y la misma UX basada en reacciones para aprobaciones de exec y de Plugin, al tiempo que permite que la autenticación difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como wrapper de compatibilidad, pero el código nuevo debe preferir el constructor de capacidades y exponer `approvalCapability` en el Plugin.

Para puntos de entrada calientes del canal, prefiere las subrutas de runtime más reducidas cuando solo
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
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la
superficie paraguas más amplia.

Específicamente para configuración:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  adaptadores de parche de configuración seguros para importación (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores delegados
  de setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` es la interfaz reducida y consciente del entorno
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional más algunas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite configuración o autenticación guiada por variables de entorno y los flujos genéricos de inicio/configuración
deben conocer esos nombres de entorno antes de que cargue el runtime, decláralos en el
manifiesto del Plugin con `channelEnvVars`. Mantén `envVars` del runtime del canal o
constantes locales solo para el texto visible al operador.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o escaneos de SecretRef antes de que se inicie el runtime del Plugin, agrega `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe ser seguro de importar en rutas de comandos de solo lectura y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup, el adaptador de estado y los metadatos de destino de secretos del canal necesarios para esos resúmenes. No inicies clientes, listeners ni runtimes de transporte desde la entrada de setup.

Mantén reducida también la ruta de importación de la entrada principal del canal. El descubrimiento puede evaluar la entrada y el módulo del Plugin de canal para registrar capacidades sin activar el canal. Archivos como `channel-plugin-api.ts` deben exportar el objeto del Plugin de canal sin importar asistentes de configuración, clientes de transporte, listeners de socket, lanzadores de subprocesos ni módulos de inicio de servicios. Coloca esas piezas de runtime en módulos cargados desde `registerFull(...)`, setters de runtime o adaptadores lazy de capacidades.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la interfaz más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los helpers compartidos más pesados de configuración/setup como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar “instala primero este Plugin” en superficies de configuración,
prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado falla de forma cerrada en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en validación, finalización y el texto con enlace a documentación.

Para otras rutas calientes del canal, prefiere los helpers reducidos sobre superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  fallback de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para enrutamiento/sobre entrante y
  la conexión de registrar-y-despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de contenido multimedia más
  delegados de identidad/envío saliente y planificación de payloads
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente debe preservar un
  `replyToId`/`threadId` explícito o recuperar la sesión actual `:thread:`
  después de que la clave base de sesión siga coincidiendo. Los Plugins de proveedor pueden sobrescribir la precedencia, el comportamiento del sufijo y la normalización de id de hilo cuando su plataforma
  tiene semántica nativa de entrega por hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de enlaces de hilos
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando todavía se requiera un diseño heredado de campos de payload de agente/multimedia
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados de Telegram, validación de duplicados/conflictos y un contrato de configuración de comandos estable para fallback

Los canales solo de autenticación normalmente pueden detenerse en la ruta predeterminada: el núcleo se encarga de las aprobaciones y el Plugin solo expone capacidades salientes/de autenticación. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los helpers nativos compartidos en lugar de crear su propio ciclo de vida de aprobaciones.

## Política de mención entrante

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propiedad del Plugin
- evaluación de política compartida

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de mención.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel más amplio
de helpers entrantes.

Buen encaje para lógica local del Plugin:

- detección de respuesta al bot
- detección de cita del bot
- comprobaciones de participación en el hilo
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar la participación del bot

Buen encaje para el helper compartido:

- `requireMention`
- resultado explícito de mención
- lista de permitidos de mención implícita
- bypass de comandos
- decisión final de omisión

Flujo preferido:

1. Calcula los hechos locales de mención.
2. Pasa esos hechos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu compuerta entrante.

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

`api.runtime.channel.mentions` expone los mismos helpers compartidos de mención para
Plugins de canal incluidos que ya dependen de la inyección en runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers de runtime
entrantes no relacionados.

Los antiguos helpers `resolveMentionGating*` permanecen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del Plugin. El campo `channel` en `package.json` es
    lo que hace que este sea un Plugin de canal. Para ver la superficie completa de metadatos del paquete,
    consulta [Configuración y Setup de Plugins](/es/plugins/sdk-setup#openclaw-channel):

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
    configuraciones propiedad del Plugin que no sean la configuración de la cuenta del canal. `channelConfigs`
    valida `channels.acme-chat` y es la fuente de ruta fría utilizada por el esquema de configuración,
    setup y superficies de interfaz de usuario antes de que cargue el runtime del Plugin.

  </Step>

  <Step title="Construir el objeto del Plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies opcionales de adaptador. Empieza con
    lo mínimo — `id` y `setup` — y agrega adaptadores según los necesites.

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

    <Accordion title="Qué hace por ti createChatChannelPlugin">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolver de seguridad de mensajes directos con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento de mensajes directos basado en texto con intercambio de códigos |
      | `threading` | Resolver del modo reply-to (fijo, con alcance de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (ids de mensajes) |

      También puedes pasar objetos crudos de adaptador en lugar de opciones declarativas
      si necesitas control total.

      Los adaptadores salientes en bruto pueden definir una función `chunker(text, limit, ctx)`.
      El `ctx.formatting` opcional transporta decisiones de formato en tiempo de entrega
      como `maxLinesPerMessage`; aplícalo antes de enviar para que el threading de respuestas
      y los límites de fragmentación se resuelvan una sola vez mediante la entrega saliente compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se resolvió un destino nativo de respuesta, para que los helpers de payload
      puedan preservar etiquetas de respuesta explícitas sin consumir una ranura implícita de respuesta de un solo uso.
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

    Coloca los descriptores CLI propiedad del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el runtime completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real de comandos. Mantén `registerFull(...)` para trabajo solo de runtime.
    Si `registerFull(...)` registra métodos RPC del gateway, usa un
    prefijo específico del Plugin. Los espacios de nombres de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` maneja automáticamente la división de modos de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Agregar una entrada de setup">
    Crea `setup-entry.ts` para carga liviana durante el onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no configurado. Evita cargar código pesado de runtime durante los flujos de configuración.
    Consulta [Setup y Configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales incluidos del espacio de trabajo que dividen exportaciones seguras para setup en módulos sidecar
    pueden usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    setter explícito de runtime en tiempo de setup.

  </Step>

  <Step title="Manejar mensajes entrantes">
    Tu Plugin necesita recibir mensajes desde la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del controlador entrante de tu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      El manejo de mensajes entrantes es específico de cada canal. Cada Plugin de canal es responsable
      de su propia canalización entrante. Revisa Plugins de canal incluidos
      (por ejemplo el paquete Plugin de Microsoft Teams o Google Chat) para ver patrones reales.
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

    Para helpers de prueba compartidos, consulta [Testing](/es/plugins/sdk-testing).

</Step>
</Steps>

## Estructura de archivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadatos openclaw.channel
├── openclaw.plugin.json      # manifiesto con esquema de configuración
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # exportaciones públicas (opcional)
├── runtime-api.ts            # exportaciones internas de runtime (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin vía createChatChannelPlugin
    ├── channel.test.ts       # pruebas
    ├── client.ts             # cliente API de la plataforma
    └── runtime.ts            # almacén de runtime (si hace falta)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de threading" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance de cuenta o personalizados
  </Card>
  <Card title="Integración con la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    `describeMessageTool` y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    `inferTargetChatType`, `looksLikeId`, `resolveTarget`
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, contenido multimedia, subagente mediante `api.runtime`
  </Card>
</CardGroup>

<Note>
Algunas interfaces de helpers incluidos todavía existen para mantenimiento y
compatibilidad de Plugins incluidos. No son el patrón recomendado para Plugins de canal nuevos;
prefiere las subrutas genéricas de channel/setup/reply/runtime de la superficie común
del SDK a menos que estés manteniendo directamente esa familia de Plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si tu Plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importación por subruta
- [Testing del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema completo del manifiesto

## Relacionado

- [Setup del SDK de Plugin](/es/plugins/sdk-setup)
- [Creación de Plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
