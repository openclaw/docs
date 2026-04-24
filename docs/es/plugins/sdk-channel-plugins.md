---
read_when:
    - Estás creando un nuevo Plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesitas entender la superficie del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Crear Plugins de canal
x-i18n:
    generated_at: "2026-04-24T05:41:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Esta guía te acompaña paso a paso para crear un Plugin de canal que conecte OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad DM,
emparejamiento, threading de respuestas y mensajería saliente.

<Info>
  Si aún no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los Plugins de canal

Los Plugins de canal no necesitan sus propias herramientas de enviar/editar/reaccionar. OpenClaw mantiene una
única herramienta compartida `message` en el núcleo. Tu Plugin controla:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de DM y listas de permitidos
- **Emparejamiento** — flujo de aprobación de DM
- **Gramática de sesión** — cómo los ids de conversación específicos del proveedor se asignan a chats base, ids de hilo y fallback de padres
- **Salida** — envío de texto, medios y encuestas a la plataforma
- **Threading** — cómo se encadenan las respuestas
- **Escritura Heartbeat** — señales opcionales de escritura/ocupado para destinos de entrega Heartbeat

El núcleo controla la herramienta compartida de mensajes, el cableado del prompt, la forma externa de la clave de sesión,
la gestión genérica `:thread:` y el despacho.

Si tu canal admite indicadores de escritura fuera de respuestas entrantes, expón
`heartbeat.sendTyping(...)` en el Plugin de canal. El núcleo lo llama con el destino de entrega Heartbeat resuelto antes de que empiece la ejecución del modelo Heartbeat y usa el ciclo de vida compartido de keepalive/limpieza de escritura. Agrega `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de detención.

Si tu canal añade parámetros a la herramienta de mensajes que transportan fuentes de medios, expón esos nombres
de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas de sandbox y la política de acceso a medios salientes,
de modo que los Plugins no necesiten casos especiales en el núcleo compartido para parámetros específicos del proveedor como avatar, adjunto o imagen de portada.
Prefiere devolver un mapa con clave por acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que las acciones no relacionadas no hereden los argumentos de medios de otra acción. Un arreglo plano sigue funcionando para parámetros que
intencionadamente se comparten entre todas las acciones expuestas.

Si tu plataforma almacena alcance adicional dentro de los ids de conversación, mantén ese análisis en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el Hook canónico para asignar `rawId` al id de conversación base, id de hilo opcional, `baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlas ordenadas desde el padre más específico al más amplio/conversación base.

Los Plugins incluidos que necesiten el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una
exportación `resolveSessionConversation(...)` equivalente. El núcleo usa esa superficie segura para bootstrap
solo cuando el registro de Plugins de runtime aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como fallback heredado de compatibilidad cuando un Plugin solo necesita fallback de padres sobre el id genérico/sin procesar. Si ambos Hooks existen, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el Hook canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los Plugins de canal no necesitan código específico de aprobaciones.

- El núcleo controla `/approve` en el mismo chat, las cargas compartidas de botones de aprobación y la entrega genérica de fallback.
- Prefiere un único objeto `approvalCapability` en el Plugin de canal cuando el canal necesita comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se ha eliminado. Coloca los hechos de entrega/nativos/renderizado/autenticación de aprobación en `approvalCapability`.
- `plugin.auth` es solo para login/logout; el núcleo ya no lee Hooks de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la costura canónica de autenticación de aprobación.
- Usa `approvalCapability.getActionAvailabilityState` para disponibilidad de autenticación de aprobación en el mismo chat.
- Si tu canal expone aprobaciones nativas de ejecución, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat. El núcleo usa ese Hook específico de ejecución para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas de ejecución e incluir el canal en la guía de fallback de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo completa para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamiento de ciclo de vida de carga específico del canal, como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento de aprobación nativa o supresión de fallback.
- Usa `approvalCapability.nativeRuntime` para hechos de aprobación nativa controlados por el canal. Manténlo lazy en puntos de entrada calientes del canal con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo de runtime bajo demanda y aun así permitir que el núcleo monte el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas de aprobación personalizadas en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de ruta deshabilitada explique exactamente qué claves de configuración son necesarias para habilitar aprobaciones nativas de ejecución. El Hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deberían renderizar rutas con alcance por cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades DM estables similares a propietario a partir de la configuración existente, usa `createResolvedApproverActionAuthAdapter` desde `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin añadir lógica específica de aprobación al núcleo.
- Si un canal necesita entrega nativa de aprobación, mantén el código del canal centrado en la normalización del destino más hechos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` desde `openclaw/plugin-sdk/approval-runtime`. Coloca los hechos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda montar el controlador y controlar el filtrado de solicitudes, enrutamiento, deduplicación, caducidad, suscripción al Gateway y avisos de “enrutado a otra parte”. `nativeRuntime` se divide en unas pocas costuras más pequeñas:
- `availability` — si la cuenta está configurada y si debe gestionarse una solicitud
- `presentation` — asigna el modelo compartido de vista de aprobación a cargas nativas pendientes/resueltas/caducadas o acciones finales
- `transport` — prepara destinos más enviar/actualizar/eliminar mensajes nativos de aprobación
- `interactions` — Hooks opcionales de bind/unbind/clear-action para botones o reacciones nativas
- `observe` — Hooks opcionales de diagnósticos de entrega
- Si el canal necesita objetos controlados por runtime como un cliente, token, app Bolt o receptor de webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de runtime-context permite al núcleo inicializar controladores guiados por capacidades a partir del estado de arranque del canal sin añadir pegamento específico de aprobación.
- Recurre a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de más bajo nivel solo cuando la costura guiada por capacidades aún no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` a través de esos helpers. `accountId` mantiene la política de aprobación de varias cuentas acotada a la cuenta correcta del bot, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobaciones exec frente a Plugin sin ramas codificadas rígidamente en el núcleo.
- El núcleo ahora también controla los avisos de redirección de aprobación. Los Plugins de canal no deberían enviar sus propios mensajes de seguimiento tipo “la aprobación fue a DMs / a otro canal” desde `createChannelNativeApprovalRuntime`; en su lugar, expón enrutamiento preciso de origen + DM del aprobador mediante los helpers compartidos de capacidad de aprobación y deja que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Conserva de extremo a extremo el tipo de id de aprobación entregado. Los clientes nativos no deberían adivinar ni reescribir el enrutamiento de aprobaciones exec frente a Plugin a partir del estado local del canal.
- Distintos tipos de aprobación pueden exponer intencionadamente diferentes superficies nativas.
  Ejemplos actuales incluidos:
  - Slack mantiene disponible el enrutamiento nativo de aprobación tanto para ids exec como Plugin.
  - Matrix mantiene el mismo enrutamiento nativo DM/canal y la misma UX de reacciones para aprobaciones exec y Plugin, al tiempo que permite que la autenticación difiera por tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como wrapper de compatibilidad, pero el código nuevo debería preferir el constructor de capacidades y exponer `approvalCapability` en el Plugin.

Para puntos de entrada calientes del canal, prefiere las subrutas de runtime más estrechas cuando solo necesites una parte de esa familia:

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
`openclaw/plugin-sdk/reply-chunking` cuando no necesites la superficie
más amplia.

Para setup específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  adaptadores de parches de setup seguros para importación (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  de proxy de setup delegados
- `openclaw/plugin-sdk/setup-adapter-runtime` es la costura estrecha de adaptador con reconocimiento de env
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de setup de instalación opcional además de unas pocas primitivas seguras para setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite setup o autenticación impulsados por env y los flujos genéricos de inicio/configuración
deberían conocer esos nombres env antes de que cargue el runtime, decláralos en el
manifiesto del Plugin con `channelEnvVars`. Mantén `envVars` del runtime del canal o constantes locales solo para copia orientada al operador.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o análisis de SecretRef antes de que se inicie el runtime del Plugin, agrega `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe ser seguro de importar en rutas de comandos de solo lectura y debe devolver los metadatos del canal, el adaptador de configuración seguro para setup, el adaptador de estado y los metadatos de destino de secretos del canal necesarios para esos resúmenes. No inicies clientes, listeners ni runtimes de transporte desde la entrada de setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la costura más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los
  helpers compartidos más pesados de setup/configuración como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar “instala primero este Plugin” en superficies de setup, prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado falla en modo cerrado en las escrituras de configuración y en la finalización, y reutiliza el mismo mensaje de instalación requerida en validación, finalización y copia de enlaces a documentación.

Para otras rutas calientes del canal, prefiere los helpers estrechos frente a superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  fallback de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para el cableado de ruta/sobre
  entrante y registro y despacho
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios más delegados de
  identidad/envío salientes y planificación de carga
- `buildThreadAwareOutboundSessionRoute(...)` desde
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente debe conservar un
  `replyToId`/`threadId` explícito o recuperar la sesión actual `:thread:`
  después de que la clave de sesión base siga coincidiendo. Los Plugins de proveedor pueden sobrescribir precedencia, comportamiento de sufijo y normalización de id de hilo cuando su plataforma tiene semántica nativa de entrega por hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de enlaces de hilo
  y el registro del adaptador
- `openclaw/plugin-sdk/agent-media-payload` solo cuando siga siendo necesario
  un diseño heredado de campo de carga agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos
  personalizados de Telegram, validación de duplicados/conflictos y un contrato de configuración de comandos estable como fallback

Los canales solo de autenticación normalmente pueden quedarse en la ruta predeterminada: el núcleo gestiona aprobaciones y el Plugin solo expone capacidades salientes/de autenticación. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deberían usar los helpers nativos compartidos en lugar de crear su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia controlada por el Plugin
- evaluación compartida de políticas

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de mención.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel
más amplio de helpers entrantes.

Encaja bien como lógica local del Plugin:

- detección de respuesta al bot
- detección de cita del bot
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar participación del bot

Encaja bien en el helper compartido:

- `requireMention`
- resultado explícito de mención
- lista de permitidos de mención implícita
- omisión de comando
- decisión final de omitir

Flujo preferido:

1. Calcula los hechos locales de mención.
2. Pasa esos hechos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu barrera de entrada.

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
Plugins de canal incluidos que ya dependen de inyección de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers
de runtime entrante no relacionados.

Los antiguos helpers `resolveMentionGating*` siguen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debería usar `resolveInboundMentionDecision({ facts, policy })`.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del Plugin. El campo `channel` en `package.json` es
    lo que lo convierte en un Plugin de canal. Para la superficie completa de metadatos del paquete,
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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Construir el objeto del Plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empieza con
    lo mínimo — `id` y `setup` — y añade adaptadores según los necesites.

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
      | `security.dm` | Resolutor de seguridad DM con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento DM basado en texto con intercambio de códigos |
      | `threading` | Resolutor de modo de respuesta (fijo, con alcance por cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (ids de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de opciones declarativas
      si necesitas control total.
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

    Coloca descriptores CLI controlados por el canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el runtime completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real de comandos. Mantén `registerFull(...)` para trabajo solo de runtime.
    Si `registerFull(...)` registra métodos RPC del gateway, usa un
    prefijo específico del Plugin. Los namespaces reservados de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` maneja automáticamente la división de modos de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para todas
    las opciones.

  </Step>

  <Step title="Agregar una entrada de setup">
    Crea `setup-entry.ts` para carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o sin configurar. Evita arrastrar código pesado de runtime durante flujos de setup.
    Consulta [Setup y Configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales incluidos del espacio de trabajo que separen exportaciones seguras para setup en módulos auxiliares pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    setter explícito de runtime en tiempo de setup.

  </Step>

  <Step title="Gestionar mensajes entrantes">
    Tu Plugin necesita recibir mensajes desde la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un webhook que verifica la solicitud y la
    despacha mediante el manejador entrante de tu canal:

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
      El manejo de mensajes entrantes es específico del canal. Cada Plugin de canal controla
      su propia canalización de entrada. Observa Plugins de canal incluidos
      (por ejemplo el paquete de Plugins de Microsoft Teams o Google Chat) para ver patrones reales.
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

    Para helpers compartidos de prueba, consulta [Pruebas](/es/plugins/sdk-testing).

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
    └── runtime.ts            # almacén de runtime (si es necesario)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de threading" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance por cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    `describeMessageTool` y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    `inferTargetChatType`, `looksLikeId`, `resolveTarget`
  </Card>
  <Card title="Ayudantes de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante `api.runtime`
  </Card>
</CardGroup>

<Note>
Algunas costuras auxiliares incluidas siguen existiendo para mantenimiento y
compatibilidad de Plugins incluidos. No son el patrón recomendado para nuevos Plugins de canal;
prefiere las subrutas genéricas de canal/setup/reply/runtime de la superficie común del SDK
a menos que mantengas directamente esa familia de Plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si tu Plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de subrutas de importación
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifiesto de Plugin](/es/plugins/manifest) — esquema completo del manifiesto

## Relacionado

- [Configuración del SDK de Plugins](/es/plugins/sdk-setup)
- [Crear Plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
