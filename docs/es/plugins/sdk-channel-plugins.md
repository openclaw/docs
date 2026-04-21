---
read_when:
    - Estás creando un nuevo Plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Necesitas entender la superficie del adaptador de ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Crear Plugins de canal
x-i18n:
    generated_at: "2026-04-21T05:17:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Crear Plugins de canal

Esta guía te acompaña en la creación de un Plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad para MD,
vinculación, hilos de respuesta y mensajería saliente.

<Info>
  Si todavía no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifest.
</Info>

## Cómo funcionan los Plugins de canal

Los Plugins de canal no necesitan sus propias tools de enviar/editar/reaccionar. OpenClaw mantiene una
tool `message` compartida en el core. Tu Plugin es responsable de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de MD y listas de permitidos
- **Vinculación** — flujo de aprobación de MD
- **Gramática de sesión** — cómo los IDs de conversación específicos del proveedor se asignan a chats base, IDs de hilo y respaldos de padre
- **Salida** — envío de texto, multimedia y sondeos a la plataforma
- **Hilos** — cómo se encadenan las respuestas

El core es responsable de la tool `message` compartida, el cableado del prompt, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Si tu canal agrega parámetros de tool de mensaje que incluyen fuentes de multimedia, expón esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El core usa
esa lista explícita para la normalización de rutas del sandbox y la política de acceso a multimedia saliente,
así que los Plugins no necesitan casos especiales en el core compartido para parámetros específicos del proveedor
como avatar, adjunto o imagen de portada.
Prefiere devolver un mapa con clave por acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que acciones no relacionadas no
hereden los argumentos multimedia de otra acción. Un arreglo plano sigue funcionando para parámetros que
intencionalmente se comparten entre todas las acciones expuestas.

Si tu plataforma almacena alcance adicional dentro de los IDs de conversación, mantén ese análisis
en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el gancho canónico
para mapear `rawId` al ID de conversación base, ID de hilo opcional,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el
padre más específico hasta la conversación más amplia/base.

Los Plugins integrados que necesitan el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` equivalente. El core usa esa superficie segura para bootstrap
solo cuando el registro de Plugins en tiempo de ejecución todavía no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como respaldo heredado de compatibilidad cuando un Plugin solo necesita respaldos de padre además del ID genérico/raw. Si existen ambos ganchos, el core usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el gancho canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los Plugins de canal no necesitan código específico de aprobaciones.

- El core es responsable de `/approve` en el mismo chat, las cargas compartidas de botones de aprobación y la entrega genérica de respaldo.
- Prefiere un único objeto `approvalCapability` en el Plugin de canal cuando el canal necesita comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloca en `approvalCapability` los datos sobre entrega/aprobación nativa/renderizado/autenticación.
- `plugin.auth` es solo para login/logout; el core ya no lee ganchos de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la unión canónica para autenticación de aprobaciones.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobaciones en el mismo chat.
- Si tu canal expone aprobaciones de ejecución nativas, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de cliente nativo/superficie iniciadora cuando difiera de la autenticación de aprobación en el mismo chat. El core usa ese gancho específico de ejecución para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas de ejecución e incluir el canal en la guía de respaldo de cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo completa para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamiento específico del canal en el ciclo de vida de la carga, como ocultar solicitudes locales duplicadas de aprobación o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento de aprobación nativa o supresión de respaldo.
- Usa `approvalCapability.nativeRuntime` para datos de aprobación nativa propiedad del canal. Mantenlo lazy en puntos de entrada calientes del canal con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo runtime bajo demanda y aun así permitir que el core ensamble el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas personalizadas de aprobación en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de ruta deshabilitada explique las claves exactas de configuración necesarias para habilitar aprobaciones nativas de ejecución. El gancho recibe `{ channel, channelLabel, accountId }`; los canales con cuentas nombradas deben renderizar rutas con alcance por cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades tipo propietario estables en MD a partir de la configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin agregar lógica específica de aprobación en el core.
- Si un canal necesita entrega de aprobación nativa, mantén el código del canal centrado en la normalización del destino más los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el core pueda ensamblar el controlador y encargarse del filtrado de solicitudes, enrutamiento, deduplicación, caducidad, suscripción al Gateway y avisos de redirección. `nativeRuntime` está dividido en varias uniones más pequeñas:
- `availability` — si la cuenta está configurada y si una solicitud debe manejarse
- `presentation` — asignar el modelo de vista de aprobación compartido a cargas nativas pendientes/resueltas/caducadas o acciones finales
- `transport` — preparar destinos más enviar/actualizar/eliminar mensajes nativos de aprobación
- `interactions` — ganchos opcionales para bind/unbind/clear-action de botones o reacciones nativas
- `observe` — ganchos opcionales de diagnóstico de entrega
- Si el canal necesita objetos propiedad del runtime como un cliente, token, app Bolt o receptor Webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto runtime permite que el core inicialice controladores orientados por capacidades a partir del estado de inicio del canal sin agregar glue específico de aprobación.
- Recurre a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel más bajo solo cuando la unión orientada por capacidades todavía no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` mediante esos helpers. `accountId` mantiene la política de aprobación multicuenta dentro de la cuenta correcta del bot, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación de ejecución frente a aprobación de Plugin sin ramas codificadas en el core.
- El core ahora también es responsable de los avisos de redirección de aprobación. Los Plugins de canal no deben enviar sus propios mensajes de seguimiento del tipo “la aprobación fue a MD / otro canal” desde `createChannelNativeApprovalRuntime`; en su lugar, expón con precisión el enrutamiento de origen + MD del aprobador mediante los helpers compartidos de capacidad de aprobación y deja que el core agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Conserva de extremo a extremo el tipo de ID de aprobación entregado. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobación de ejecución frente a Plugin desde el estado local del canal.
- Diferentes tipos de aprobación pueden exponer intencionalmente distintas superficies nativas.
  Ejemplos integrados actuales:
  - Slack mantiene disponible el enrutamiento nativo de aprobación tanto para IDs de ejecución como de Plugin.
  - Matrix mantiene el mismo enrutamiento nativo por MD/canal y UX de reacciones para aprobaciones de ejecución
    y de Plugin, al tiempo que permite que la autenticación difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como wrapper de compatibilidad, pero el código nuevo debe preferir el constructor de capacidades y exponer `approvalCapability` en el Plugin.

Para puntos de entrada calientes del canal, prefiere las subrutas runtime más específicas cuando solo
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

Para la configuración inicial en particular:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  adaptadores seguros para importación de parche de configuración (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  delegados de proxy de configuración
- `openclaw/plugin-sdk/setup-adapter-runtime` es la unión estrecha de adaptador
  sensible al entorno para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración con instalación opcional
  más algunas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite configuración o autenticación impulsada por variables de entorno y los flujos genéricos de inicio/configuración
deben conocer esos nombres de entorno antes de que cargue el runtime, decláralos en el
manifest del Plugin con `channelEnvVars`. Mantén `envVars` del runtime del canal o constantes
locales solo para el texto visible para operadores.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la unión más amplia `openclaw/plugin-sdk/setup` solo cuando también necesites los
  helpers compartidos más pesados de configuración/configuración como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar “instala primero este Plugin” en las superficies de configuración, prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente generado falla en modo cerrado en escrituras de configuración y finalización, y reutiliza el mismo mensaje de instalación obligatoria en la validación, la finalización y el texto de enlaces de documentación.

Para otras rutas calientes del canal, prefiere los helpers específicos en lugar de superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  respaldo de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para enrutamiento/sobre de entrada y
  cableado de registro y despacho
- `openclaw/plugin-sdk/messaging-targets` para análisis y coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de multimedia más
  delegados de identidad/envío saliente y planificación de carga
- `openclaw/plugin-sdk/thread-bindings-runtime` para ciclo de vida de vinculación de hilos
  y registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando todavía se requiera
  un diseño heredado de campos de carga de agente/multimedia
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos personalizados de Telegram,
  validación de duplicados/conflictos y un contrato de configuración de comandos
  estable como respaldo

Los canales solo de autenticación normalmente pueden quedarse en la ruta predeterminada: el core gestiona las aprobaciones y el Plugin solo expone capacidades de salida/autenticación. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los helpers nativos compartidos en lugar de crear su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencia propiedad del Plugin
- evaluación compartida de políticas

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de mención.
Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el barrel más amplio de
helpers de entrada.

Buena opción para lógica local del Plugin:

- detección de respuesta al bot
- detección de cita al bot
- comprobaciones de participación en hilo
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar participación del bot

Buena opción para el helper compartido:

- `requireMention`
- resultado explícito de mención
- lista de permitidos de mención implícita
- bypass de comandos
- decisión final de omitir

Flujo preferido:

1. Calcula los datos locales de mención.
2. Pasa esos datos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu restricción de entrada.

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

`api.runtime.channel.mentions` expone los mismos helpers compartidos de menciones para
Plugins de canal integrados que ya dependen de inyección runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers runtime
de entrada no relacionados.

Los helpers más antiguos `resolveMentionGating*` siguen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifest">
    Crea los archivos estándar del Plugin. El campo `channel` en `package.json` es
    lo que hace que este sea un Plugin de canal. Para la superficie completa de metadatos del paquete,
    consulta [Configuración y config del Plugin](/es/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Conecta OpenClaw con Acme Chat."
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
      "description": "Plugin de canal Acme Chat",
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

  <Step title="Construye el objeto Plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Empieza con
    el mínimo — `id` y `setup` — y agrega adaptadores según los necesites.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // tu cliente API de plataforma

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

      // Seguridad de MD: quién puede enviar mensajes al bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Vinculación: flujo de aprobación para nuevos contactos de MD
      pairing: {
        text: {
          idLabel: "nombre de usuario de Acme Chat",
          message: "Envía este código para verificar tu identidad:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Código de vinculación: ${code}`);
          },
        },
      },

      // Hilos: cómo se entregan las respuestas
      threading: { topLevelReplyToMode: "reply" },

      // Salida: enviar mensajes a la plataforma
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

    <Accordion title="Qué hace `createChatChannelPlugin` por ti">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, pasas
      opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolver con alcance para seguridad de MD desde campos de config |
      | `pairing.text` | Flujo de vinculación de MD basado en texto con intercambio de código |
      | `threading` | Resolver del modo de respuesta (fijo, con alcance por cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos del resultado (IDs de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de opciones declarativas
      si necesitas control total.
    </Accordion>

  </Step>

  <Step title="Conecta el punto de entrada">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin de canal Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Administración de Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Administración de Acme Chat",
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

    Coloca descriptores CLI propiedad del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el runtime completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro real de comandos.
    Mantén `registerFull(...)` para trabajo solo de runtime.
    Si `registerFull(...)` registra métodos RPC del Gateway, usa un
    prefijo específico del Plugin. Los espacios de nombres administrativos del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` maneja automáticamente la división por modo de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para todas las
    opciones.

  </Step>

  <Step title="Agrega una entrada de configuración">
    Crea `setup-entry.ts` para carga ligera durante el onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o sin configurar. Evita cargar código runtime pesado durante los flujos de configuración.
    Consulta [Configuración y config](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales integrados del workspace que separan exportaciones seguras para configuración en módulos laterales
    pueden usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    setter runtime explícito en tiempo de configuración.

  </Step>

  <Step title="Maneja mensajes entrantes">
    Tu Plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del controlador de entrada de tu canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticación gestionada por Plugin (verifica tú mismo las firmas)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Tu controlador de entrada despacha el mensaje a OpenClaw.
          // El cableado exacto depende del SDK de tu plataforma:
          // consulta un ejemplo real en el paquete integrado de Plugin de Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      El manejo de mensajes entrantes es específico de cada canal. Cada Plugin de canal posee
      su propia canalización de entrada. Mira Plugins de canal integrados
      (por ejemplo el paquete Plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Prueba">
Escribe pruebas colocadas conjuntamente en `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("resuelve la cuenta desde la configuración", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspecciona la cuenta sin materializar secretos", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("informa configuración faltante", () => {
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
├── package.json              # metadatos openclaw.channel
├── openclaw.plugin.json      # Manifest con esquema de configuración
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportaciones públicas (opcional)
├── runtime-api.ts            # Exportaciones runtime internas (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin mediante createChatChannelPlugin
    ├── channel.test.ts       # Pruebas
    ├── client.ts             # Cliente API de plataforma
    └── runtime.ts            # Almacén runtime (si hace falta)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de hilos" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance por cuenta o personalizados
  </Card>
  <Card title="Integración de la tool de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, multimedia, subagente mediante api.runtime
  </Card>
</CardGroup>

<Note>
Algunas uniones helper integradas todavía existen para mantenimiento de Plugins integrados y
compatibilidad. No son el patrón recomendado para nuevos Plugins de canal;
prefiere las subrutas genéricas channel/setup/reply/runtime de la superficie
común del SDK a menos que estés manteniendo directamente esa familia de Plugins integrados.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si tu Plugin también ofrece modelos
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones de subrutas
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifest de Plugin](/es/plugins/manifest) — esquema completo del manifest
