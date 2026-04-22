---
read_when:
    - Está creando un nuevo plugin de canal de mensajería
    - Quiere conectar OpenClaw a una plataforma de mensajería
    - Necesita comprender la superficie del adaptador `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-04-22T05:11:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creación de plugins de canal

Esta guía le acompaña en la creación de un plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrá un canal funcional con seguridad para MD,
emparejamiento, encadenamiento de respuestas y mensajería saliente.

<Info>
  Si todavía no ha creado ningún plugin de OpenClaw, lea primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica
  del paquete y la configuración del manifiesto.
</Info>

## Cómo funcionan los plugins de canal

Los plugins de canal no necesitan sus propias herramientas de enviar/editar/reaccionar. OpenClaw mantiene una única
herramienta `message` compartida en el núcleo. Su plugin se encarga de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de MD y listas de permitidos
- **Emparejamiento** — flujo de aprobación de MD
- **Gramática de sesión** — cómo los identificadores de conversación específicos del proveedor se asignan a chats base, identificadores de hilo y alternativas del padre
- **Salida** — envío de texto, multimedia y encuestas a la plataforma
- **Encadenamiento** — cómo se encadenan las respuestas
- **Escritura de Heartbeat** — señales opcionales de escribiendo/ocupado para objetivos de entrega de Heartbeat

El núcleo se encarga de la herramienta de mensaje compartida, la conexión de prompts, la forma externa de la clave de sesión,
la gestión genérica de `:thread:` y el despacho.

Si su canal admite indicadores de escritura fuera de las respuestas entrantes, exponga
`heartbeat.sendTyping(...)` en el plugin de canal. El núcleo lo llama con el
objetivo de entrega de Heartbeat resuelto antes de que comience la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de mantenimiento/limpieza de escritura. Añada `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de detención.

Si su canal añade parámetros a la herramienta de mensaje que transportan fuentes multimedia, exponga esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas del sandbox y la política de acceso a multimedia saliente,
por lo que los plugins no necesitan casos especiales en el núcleo compartido para parámetros específicos del proveedor como
avatar, adjunto o imagen de portada.
Prefiera devolver un mapa indexado por acción como
`{ "set-profile": ["avatarUrl", "avatarPath"] }` para que las acciones no relacionadas no
hereden los argumentos multimedia de otra acción. Un arreglo plano sigue funcionando para parámetros que
se comparten intencionalmente entre todas las acciones expuestas.

Si su plataforma almacena alcance adicional dentro de los identificadores de conversación, mantenga ese análisis
en el plugin con `messaging.resolveSessionConversation(...)`. Ese es el hook canónico
para mapear `rawId` al identificador de conversación base, un identificador de hilo opcional,
`baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelva `parentConversationCandidates`, manténgalos ordenados desde el
padre más específico hasta la conversación base/más amplia.

Los plugins incluidos que necesiten el mismo análisis antes de que se inicie el registro del canal
también pueden exponer un archivo `session-key-api.ts` de nivel superior con una exportación
`resolveSessionConversation(...)` correspondiente. El núcleo usa esa superficie segura para el arranque
solo cuando el registro de plugins en tiempo de ejecución todavía no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como alternativa heredada
de compatibilidad cuando un plugin solo necesita alternativas del padre sobre el identificador genérico/sin procesar.
Si existen ambos hooks, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades del canal

La mayoría de los plugins de canal no necesitan código específico para aprobaciones.

- El núcleo se encarga de `/approve` en el mismo chat, las cargas útiles compartidas de botones de aprobación y la entrega genérica de alternativa.
- Prefiera un único objeto `approvalCapability` en el plugin de canal cuando el canal necesite comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloque los datos de entrega/nativo/renderizado/autorización de aprobación en `approvalCapability`.
- `plugin.auth` es solo para inicio/cierre de sesión; el núcleo ya no lee hooks de autorización de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la interfaz canónica para la autorización de aprobaciones.
- Use `approvalCapability.getActionAvailabilityState` para la disponibilidad de autorización de aprobaciones en el mismo chat.
- Si su canal expone aprobaciones nativas de ejecución, use `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autorización de aprobación en el mismo chat. El núcleo usa ese hook específico de ejecución para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones nativas de ejecución e incluir el canal en la guía alternativa del cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto en el caso común.
- Use `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` para comportamientos específicos del canal en el ciclo de vida de la carga útil, como ocultar prompts locales de aprobación duplicados o enviar indicadores de escritura antes de la entrega.
- Use `approvalCapability.delivery` solo para el enrutamiento de aprobaciones nativas o la supresión de alternativas.
- Use `approvalCapability.nativeRuntime` para datos nativos de aprobación que pertenezcan al canal. Manténgalo diferido en puntos de entrada calientes del canal con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar su módulo de tiempo de ejecución bajo demanda y aun así permitir que el núcleo ensamble el ciclo de vida de aprobación.
- Use `approvalCapability.render` solo cuando un canal realmente necesite cargas útiles de aprobación personalizadas en lugar del renderizador compartido.
- Use `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique los ajustes exactos necesarios para habilitar las aprobaciones nativas de ejecución. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deben renderizar rutas con alcance por cuenta, como `channels.<channel>.accounts.<id>.execApprovals.*`, en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades de MD estables similares a las del propietario a partir de la configuración existente, use `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin añadir lógica específica de aprobación en el núcleo.
- Si un canal necesita entrega de aprobación nativa, mantenga el código del canal centrado en la normalización del objetivo más los datos de transporte/presentación. Use `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloque los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda ensamblar el controlador y encargarse del filtrado de solicitudes, enrutamiento, deduplicación, vencimiento, suscripción del Gateway y avisos de redirección. `nativeRuntime` se divide en varias interfaces más pequeñas:
- `availability` — si la cuenta está configurada y si se debe gestionar una solicitud
- `presentation` — asigna el modelo de vista de aprobación compartido a cargas útiles nativas pendientes/resueltas/vencidas o acciones finales
- `transport` — prepara objetivos y envía/actualiza/elimina mensajes nativos de aprobación
- `interactions` — hooks opcionales para vincular/desvincular/borrar acciones de botones nativos o reacciones
- `observe` — hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos propios del tiempo de ejecución, como un cliente, token, aplicación Bolt o receptor de Webhook, regístrelos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de tiempo de ejecución permite que el núcleo inicie controladores basados en capacidades a partir del estado de inicio del canal sin añadir código de envoltura específico de aprobación.
- Recurra a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando la interfaz basada en capacidades todavía no sea lo bastante expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` a través de esos ayudantes. `accountId` mantiene el alcance correcto de la política de aprobación en configuraciones con múltiples cuentas, y `approvalKind` mantiene disponible para el canal el comportamiento de aprobación de ejecución frente al de plugin sin ramas codificadas en el núcleo.
- El núcleo ahora también se encarga de los avisos de redirección de aprobación. Los plugins de canal no deben enviar sus propios mensajes de seguimiento del tipo "la aprobación fue a MD / a otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expongan un enrutamiento preciso de origen + MD del aprobador mediante los ayudantes compartidos de capacidad de aprobación y dejen que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Preserve el tipo de identificador de aprobación entregado de extremo a extremo. Los clientes nativos no deben
  adivinar ni reescribir el enrutamiento de aprobación de ejecución frente a plugin a partir del estado local del canal.
- Los distintos tipos de aprobación pueden exponer intencionalmente diferentes superficies nativas.
  Ejemplos incluidos actuales:
  - Slack mantiene disponible el enrutamiento de aprobación nativa tanto para identificadores de ejecución como de plugin.
  - Matrix mantiene el mismo enrutamiento nativo por MD/canal y la misma UX de reacciones para aprobaciones de ejecución
    y de plugin, al tiempo que sigue permitiendo que la autorización difiera según el tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como envoltorio de compatibilidad, pero el código nuevo debe preferir el constructor de capacidades y exponer `approvalCapability` en el plugin.

Para puntos de entrada calientes del canal, prefiera las subrutas de tiempo de ejecución más acotadas cuando solo
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
`openclaw/plugin-sdk/reply-chunking` cuando no necesite la superficie
paraguas más amplia.

Específicamente para la configuración:

- `openclaw/plugin-sdk/setup-runtime` cubre los ayudantes de configuración seguros para el tiempo de ejecución:
  adaptadores de parches de configuración seguros para importación (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores
  delegados de proxy de configuración
- `openclaw/plugin-sdk/setup-adapter-runtime` es la interfaz acotada para adaptadores con reconocimiento de entorno
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional
  más algunas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si su canal admite configuración o autorización controladas por variables de entorno y los flujos genéricos de inicio/configuración
deben conocer esos nombres de variables antes de que se cargue el tiempo de ejecución, declárelos en el
manifiesto del plugin con `channelEnvVars`. Mantenga `envVars` del tiempo de ejecución del canal o las constantes locales
solo para el texto dirigido al operador.

Si su canal puede aparecer en `status`, `channels list`, `channels status` o
en análisis de SecretRef antes de que se inicie el tiempo de ejecución del plugin, añada `openclaw.setupEntry` en
`package.json`. Ese punto de entrada debe ser seguro de importar en rutas de comandos de solo lectura y
debe devolver los metadatos del canal, el adaptador de configuración seguro, el adaptador de estado y los metadatos del objetivo secreto del canal necesarios para esos resúmenes. No
inicie clientes, listeners ni tiempos de ejecución de transporte desde la entrada de configuración.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- use la interfaz más amplia `openclaw/plugin-sdk/setup` solo cuando también necesite los
  ayudantes compartidos más pesados de configuración/configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si su canal solo quiere anunciar "instale primero este plugin" en las
superficies de configuración, prefiera `createOptionalChannelSetupSurface(...)`. El
adaptador/asistente generado falla de forma cerrada en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación obligatoria en la validación, finalización y el texto
del enlace a la documentación.

Para otras rutas calientes del canal, prefiera los ayudantes acotados frente a superficies heredadas más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración de múltiples cuentas y
  alternativa de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para la ruta/sobre de entrada y
  la conexión de registrar y despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de objetivos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de multimedia más salida
  de identidad/delegados de envío y planificación de cargas útiles
- `buildThreadAwareOutboundSessionRoute(...)` de
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente debe preservar un
  `replyToId`/`threadId` explícito o recuperar la sesión actual `:thread:`
  después de que la clave de sesión base siga coincidiendo. Los plugins de proveedor pueden anular
  la precedencia, el comportamiento del sufijo y la normalización del identificador de hilo cuando su plataforma
  tiene semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de vinculación de hilos
  y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando todavía se requiera
  una disposición heredada de campos de carga útil de agente/multimedia
- `openclaw/plugin-sdk/telegram-command-config` para la normalización de comandos personalizados de Telegram,
  validación de duplicados/conflictos y un contrato de configuración de comandos
  estable en la alternativa

Los canales solo de autorización normalmente pueden quedarse en la ruta predeterminada: el núcleo gestiona las aprobaciones y el plugin solo expone capacidades de salida/autorización. Los canales de aprobación nativa como Matrix, Slack, Telegram y transportes de chat personalizados deben usar los ayudantes nativos compartidos en lugar de crear su propio ciclo de vida de aprobación.

## Política de menciones entrantes

Mantenga el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencias propiedad del plugin
- evaluación de políticas compartida

Use `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de menciones.
Use `openclaw/plugin-sdk/channel-inbound` solo cuando necesite el barrel de ayudantes
de entrada más amplio.

Buen encaje para lógica local del plugin:

- detección de respuesta al bot
- detección de cita del bot
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de la plataforma necesarias para demostrar la participación del bot

Buen encaje para el ayudante compartido:

- `requireMention`
- resultado explícito de mención
- lista de permitidos de mención implícita
- omisión por comando
- decisión final de omitir

Flujo preferido:

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

`api.runtime.channel.mentions` expone los mismos ayudantes compartidos de menciones para
plugins de canal incluidos que ya dependen de la inyección en tiempo de ejecución:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesita `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importe desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar ayudantes de tiempo de ejecución
de entrada no relacionados.

Los ayudantes anteriores `resolveMentionGating*` permanecen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad. El código nuevo
debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Recorrido

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Cree los archivos estándar del plugin. El campo `channel` en `package.json` es
    lo que hace que este sea un plugin de canal. Para la superficie completa de metadatos del paquete,
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

  <Step title="Cree el objeto plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies de adaptador opcionales. Comience con
    lo mínimo — `id` y `setup` — y añada adaptadores según los necesite.

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

    <Accordion title="Qué hace por usted createChatChannelPlugin">
      En lugar de implementar manualmente interfaces de adaptador de bajo nivel, usted pasa
      opciones declarativas y el constructor las compone:

      | Opción | Lo que conecta |
      | --- | --- |
      | `security.dm` | Resolver de seguridad de MD con alcance desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento por MD basado en texto con intercambio de código |
      | `threading` | Resolver de modo de respuesta (fijo, con alcance por cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (identificadores de mensaje) |

      También puede pasar objetos de adaptador sin procesar en lugar de las opciones declarativas
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

    Coloque descriptores de CLI propiedad del canal en `registerCliMetadata(...)` para que OpenClaw
    pueda mostrarlos en la ayuda raíz sin activar el tiempo de ejecución completo del canal,
    mientras que las cargas completas normales siguen recogiendo los mismos descriptores para el registro
    real de comandos. Mantenga `registerFull(...)` para trabajo exclusivo de tiempo de ejecución.
    Si `registerFull(...)` registra métodos RPC del Gateway, use un
    prefijo específico del plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven en `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la separación del modo de registro. Consulte
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas las
    opciones.

  </Step>

  <Step title="Añada una entrada de configuración">
    Cree `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no configurado. Evita traer código pesado de tiempo de ejecución durante los flujos de configuración.
    Consulte [Setup y Configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales incluidos del espacio de trabajo que dividen exportaciones seguras para configuración en módulos
    complementarios pueden usar `defineBundledChannelSetupEntry(...)` de
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesiten un
    setter explícito de tiempo de ejecución en tiempo de configuración.

  </Step>

  <Step title="Gestione mensajes entrantes">
    Su plugin necesita recibir mensajes de la plataforma y reenviarlos a
    OpenClaw. El patrón típico es un Webhook que verifica la solicitud y
    la despacha a través del controlador de entrada de su canal:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autorización gestionada por el plugin (verifique las firmas usted mismo)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Su controlador de entrada despacha el mensaje a OpenClaw.
          // La conexión exacta depende del SDK de su plataforma —
          // consulte un ejemplo real en el paquete de plugins incluidos de Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      El manejo de mensajes entrantes es específico de cada canal. Cada plugin de canal se encarga de
      su propia canalización de entrada. Revise los plugins de canal incluidos
      (por ejemplo, el paquete de plugins de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Prueba">
Escriba pruebas colocadas conjuntamente en `src/channel.test.ts`:

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

    Para ayudantes de prueba compartidos, consulte [Pruebas](/es/plugins/sdk-testing).

  </Step>
</Steps>

## Estructura de archivos

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadatos de openclaw.channel
├── openclaw.plugin.json      # Manifiesto con esquema de configuración
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportaciones públicas (opcional)
├── runtime-api.ts            # Exportaciones internas de tiempo de ejecución (opcional)
└── src/
    ├── channel.ts            # ChannelPlugin mediante createChatChannelPlugin
    ├── channel.test.ts       # Pruebas
    ├── client.ts             # Cliente de API de la plataforma
    └── runtime.ts            # Almacén de tiempo de ejecución (si es necesario)
```

## Temas avanzados

<CardGroup cols={2}>
  <Card title="Opciones de encadenamiento" icon="git-branch" href="/es/plugins/sdk-entrypoints#registration-mode">
    Modos de respuesta fijos, con alcance por cuenta o personalizados
  </Card>
  <Card title="Integración de la herramienta de mensaje" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de objetivos" icon="crosshair" href="/es/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Ayudantes de tiempo de ejecución" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, multimedia, subagente mediante api.runtime
  </Card>
</CardGroup>

<Note>
Algunas interfaces de ayudantes incluidos todavía existen para mantenimiento y
compatibilidad de plugins incluidos. No son el patrón recomendado para nuevos plugins de canal;
prefiera las subrutas genéricas de channel/setup/reply/runtime de la superficie
común del SDK, a menos que esté manteniendo directamente esa familia de plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si su plugin también proporciona modelos
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifiesto del plugin](/es/plugins/manifest) — esquema completo del manifiesto
