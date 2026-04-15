---
read_when:
    - Está creando un nuevo Plugin de canal de mensajería.
    - Quiere conectar OpenClaw a una plataforma de mensajería.
    - Necesita comprender la superficie del adaptador `ChannelPlugin`.
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Crear Plugins de canal
x-i18n:
    generated_at: "2026-04-15T05:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f4c746fe3163a8880e14c433f4db4a1475535d91716a53fb879551d8d62f65
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Crear Plugins de canal

Esta guía explica cómo crear un plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrá un canal funcional con seguridad en DM,
emparejamiento, enhebrado de respuestas y mensajería saliente.

<Info>
  Si todavía no ha creado ningún Plugin de OpenClaw, lea primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los Plugins de canal

Los Plugins de canal no necesitan sus propias herramientas de enviar/editar/reaccionar. OpenClaw mantiene una
herramienta `message` compartida en el núcleo. Su Plugin se encarga de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de DM y listas de permitidos
- **Emparejamiento** — flujo de aprobación de DM
- **Gramática de sesión** — cómo los id. de conversación específicos del proveedor se asignan a chats base, id. de hilo y alternativas de principal
- **Saliente** — envío de texto, medios y encuestas a la plataforma
- **Enhebrado** — cómo se enhebran las respuestas

El núcleo se encarga de la herramienta de mensajes compartida, la integración del prompt, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Si su canal agrega parámetros de la herramienta de mensajes que transportan fuentes de medios, exponga esos
nombres de parámetro mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas del sandbox y la política de
acceso a medios salientes, para que los plugins no necesiten casos especiales del núcleo compartido para parámetros
específicos del proveedor como avatar, adjunto o imagen de portada.
Prefiera devolver un mapa indexado por acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que acciones no relacionadas no
hereden los argumentos de medios de otra acción. Un arreglo plano sigue funcionando para parámetros que
se comparten intencionalmente entre todas las acciones expuestas.

Si su plataforma almacena alcance adicional dentro de los id. de conversación, mantenga ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el hook canónico
para asignar `rawId` al id. de conversación base, al id. de hilo opcional,
a `baseConversationId` explícito y a cualquier `parentConversationCandidates`.
Cuando devuelva `parentConversationCandidates`, manténgalos ordenados desde el
principal más específico hasta la conversación principal/base más amplia.

Los Plugins empaquetados que necesiten el mismo análisis antes de que se inicie el registro de canales
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` equivalente. El núcleo usa esa superficie segura para bootstrap
solo cuando el registro de plugins en tiempo de ejecución todavía no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como alternativa
de compatibilidad heredada cuando un plugin solo necesita conversaciones principales alternativas además
del id. genérico/raw. Si ambos hooks existen, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo recurre a
`resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los Plugins de canal no necesitan código específico de aprobaciones.

- El núcleo se encarga de `/approve` en el mismo chat, las cargas de botones de aprobación compartidas y la entrega alternativa genérica.
- Prefiera un único objeto `approvalCapability` en el plugin cuando el canal necesite comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloque los datos de entrega/nativo/renderizado/autenticación de aprobación en `approvalCapability`.
- `plugin.auth` es solo para inicio/cierre de sesión; el núcleo ya no lee hooks de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la unión canónica para la autenticación de aprobaciones.
- Use `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobaciones en el mismo chat.
- Si su canal expone aprobaciones nativas de ejecución, use `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobaciones del mismo chat. El núcleo usa ese hook específico de ejecución para distinguir entre `enabled` y `disabled`, decidir si el canal iniciador admite aprobaciones nativas de ejecución e incluir el canal en la guía alternativa para cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso habitual.
- Use `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamiento del ciclo de vida de la carga útil específico del canal, como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura antes de la entrega.
- Use `approvalCapability.delivery` solo para el enrutamiento nativo de aprobaciones o la supresión de alternativas.
- Use `approvalCapability.nativeRuntime` para datos nativos de aprobación que pertenezcan al canal. Manténgalo lazy en puntos de entrada de canal de alta frecuencia con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar su módulo de runtime bajo demanda y aun así permitir que el núcleo ensamble el ciclo de vida de la aprobación.
- Use `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles de aprobación personalizadas en lugar del renderizador compartido.
- Use `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique las opciones exactas de configuración necesarias para habilitar aprobaciones nativas de ejecución. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuenta nombrada deben renderizar rutas con alcance de cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades estables tipo propietario en DM a partir de la configuración existente, use `createResolvedApproverActionAuthAdapter` desde `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica específica de aprobación en el núcleo.
- Si un canal necesita entrega nativa de aprobaciones, mantenga el código del canal centrado en la normalización de objetivos más los datos de transporte/presentación. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` desde `openclaw/plugin-sdk/approval-runtime`. Coloque los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda ensamblar el controlador y encargarse del filtrado de solicitudes, enrutamiento, deduplicación, vencimiento, suscripción al Gateway y avisos de redirección. `nativeRuntime` se divide en algunas uniones más pequeñas:
- `availability` — si la cuenta está configurada y si una solicitud debe gestionarse
- `presentation` — asigna el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/vencidas o a acciones finales
- `transport` — prepara objetivos y envía/actualiza/elimina mensajes nativos de aprobación
- `interactions` — hooks opcionales para vincular/desvincular/limpiar acciones de botones o reacciones nativas
- `observe` — hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos que pertenezcan al runtime, como un cliente, token, app de Bolt o receptor de Webhook, regístrelos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de runtime permite que el núcleo inicialice controladores guiados por capacidades a partir del estado de inicio del canal sin agregar código envoltorio específico de aprobación.
- Recurra a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando la unión guiada por capacidades todavía no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` mediante esos helpers. `accountId` mantiene la política de aprobaciones multicuenta acotada a la cuenta de bot correcta, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación de ejecución frente al de plugin sin ramas codificadas en el núcleo.
- El núcleo ahora también se encarga de los avisos de redirección de aprobación. Los Plugins de canal no deben enviar sus propios mensajes de seguimiento de "la aprobación fue a los DM / a otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expongan un enrutamiento preciso de origen + DM del aprobador a través de los helpers compartidos de capacidad de aprobación y dejen que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Preserve de extremo a extremo el tipo de id. de aprobación entregado. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobaciones de ejecución frente a plugin a partir del estado local del canal.
- Diferentes tipos de aprobación pueden exponer intencionalmente distintas superficies nativas.
  Ejemplos actuales empaquetados:
  - Slack mantiene disponible el enrutamiento nativo de aprobaciones tanto para id. de ejecución como de plugin.
  - Matrix mantiene el mismo enrutamiento nativo DM/canal y la misma UX de reacciones para aprobaciones de ejecución
    y de plugin, aunque sigue permitiendo que la autenticación difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como envoltorio de compatibilidad, pero el código nuevo debe preferir el constructor de capacidades y exponer `approvalCapability` en el plugin.

Para puntos de entrada de canal de alta frecuencia, prefiera las subrutas de runtime más específicas cuando solo
necesite una parte de esa familia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Del mismo modo, prefiera `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` y
`openclaw/plugin-sdk/reply-chunking` cuando no necesite la superficie paraguas más amplia.

Para la configuración específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  adaptadores de parche de configuración seguros para importación (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  delegados de proxy de configuración
- `openclaw/plugin-sdk/setup-adapter-runtime` es la unión de adaptador estrecha y consciente del entorno
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional
  más algunos primitivos seguros para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si su canal admite configuración o autenticación impulsadas por variables de entorno y los flujos genéricos de inicio/configuración
deben conocer esos nombres de variables de entorno antes de que se cargue el runtime, declárelos en el
manifiesto del plugin con `channelEnvVars`. Mantenga `envVars` del runtime del canal o constantes locales solo para el texto dirigido al operador.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- use la unión más amplia `openclaw/plugin-sdk/setup` solo cuando también necesite los
  helpers compartidos más pesados de configuración/configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si su canal solo quiere anunciar "instale este plugin primero" en las
superficies de configuración, prefiera `createOptionalChannelSetupSurface(...)`. El
adaptador/asistente generado falla de forma cerrada en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en la validación, la finalización y el
texto del enlace a la documentación.

Para otras rutas de canal de alta frecuencia, prefiera los helpers específicos frente a las superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  alternativa de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para la integración de ruta/sobre entrante y
  registrar-y-despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de objetivos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios más delegados
  de identidad/envío saliente
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de los vínculos de hilo
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando todavía se requiera un diseño heredado
  de campos de carga útil de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados de Telegram,
  validación de duplicados/conflictos y un contrato de configuración de comandos
  estable como alternativa

Los canales solo de autenticación normalmente pueden quedarse en la ruta predeterminada: el núcleo gestiona las aprobaciones y el plugin solo expone capacidades de salida/autenticación. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los helpers nativos compartidos en lugar de implementar su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantenga el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencias que pertenece al plugin
- evaluación de políticas compartidas

Use `openclaw/plugin-sdk/channel-inbound` para la capa compartida.

Buenos casos para lógica local del plugin:

- detección de respuesta al bot
- detección de cita del bot
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar la participación del bot

Buenos casos para el helper compartido:

- `requireMention`
- resultado de mención explícita
- lista de permitidos para menciones implícitas
- omisión para comandos
- decisión final de omisión

Flujo recomendado:

1. Calcule los datos locales de mención.
2. Pase esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Use `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en su compuerta de entrada.

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
Plugins de canal empaquetados que ya dependen de la inyección en runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Los helpers más antiguos `resolveMentionGating*` siguen estando en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Tutorial

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Cree los archivos estándar del plugin. El campo `channel` en `package.json` es
    lo que hace que este sea un plugin de canal. Para conocer toda la superficie de metadatos del paquete,
    consulte [Configuración y Setup del Plugin](/es/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Cree el objeto del plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Comience con
    lo mínimo — `id` y `setup` — y agregue adaptadores según los necesite.

    Cree `src/channel.ts`:

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

    <Accordion title="Qué hace `createChatChannelPlugin` por usted">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, usted pasa
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Solucionador de seguridad de DM acotado desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento de DM basado en texto con intercambio de código |
      | `threading` | Solucionador de modo de respuesta (fijo, acotado por cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (id. de mensajes) |

      También puede pasar objetos de adaptador sin procesar en lugar de opciones declarativas
      si necesita control total.
    </Accordion>

  </Step>

  <Step title="Conecte el punto de entrada">
    Cree `index.ts`:

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

    Coloque los descriptores de CLI que pertenezcan al canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el runtime completo del canal,
    mientras que las cargas completas normales seguirán incorporando los mismos descriptores para el registro real
    de comandos. Mantenga `registerFull(...)` para trabajo exclusivo de runtime.
    Si `registerFull(...)` registra métodos RPC de Gateway, use un
    prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la división de modos de registro. Consulte
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Agregue una entrada de setup">
    Cree `setup-entry.ts` para una carga ligera durante la incorporación inicial:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o sin configurar. Evita incorporar código pesado de runtime durante los flujos de configuración.
    Consulte [Setup y Configuración](/es/plugins/sdk-setup#setup-entry) para obtener más detalles.

  </Step>

  <Step title="Maneje los mensajes entrantes">
    Su plugin necesita recibir mensajes desde la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del controlador de entrada de su canal:

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
      El manejo de mensajes entrantes es específico de cada canal. Cada plugin de canal gestiona
      su propia canalización de entrada. Revise los Plugins de canal empaquetados
      (por ejemplo, el paquete del plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Prueba">
Escriba pruebas colocadas junto al código en `src/channel.test.ts`:

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

    Para los helpers de prueba compartidos, consulte [Pruebas](/es/plugins/sdk-testing).

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
  <Card title="Opciones de enhebrado" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, acotados por cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de objetivos" icon="crosshair" href="/es/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
</CardGroup>

<Note>
Algunas uniones de helpers empaquetados todavía existen para el mantenimiento y la
compatibilidad de Plugins empaquetados. No son el patrón recomendado para nuevos Plugins de canal;
prefiera las subrutas genéricas de canal/setup/respuesta/runtime de la superficie común del SDK
salvo que esté manteniendo directamente esa familia de Plugins empaquetados.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si su plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifiesto del Plugin](/es/plugins/manifest) — esquema completo del manifiesto
