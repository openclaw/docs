---
read_when:
    - Estás creando un nuevo Plugin de canal de mensajería
    - Quieres conectar OpenClaw a una plataforma de mensajería
    - Debe comprender la interfaz del adaptador ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guía paso a paso para crear un Plugin de canal de mensajería para OpenClaw
title: Creación de plugins de canal
x-i18n:
    generated_at: "2026-04-30T05:53:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Esta guía explica cómo crear un Plugin de canal que conecta OpenClaw con una
plataforma de mensajería. Al final tendrás un canal funcional con seguridad de DM,
emparejamiento, hilos de respuestas y mensajería saliente.

<Info>
  Si aún no has creado ningún Plugin de OpenClaw, lee primero
  [Primeros pasos](/es/plugins/building-plugins) para conocer la estructura básica del paquete
  y la configuración del manifiesto.
</Info>

## Cómo funcionan los plugins de canal

Los plugins de canal no necesitan sus propias herramientas para enviar, editar o reaccionar. OpenClaw mantiene una
herramienta `message` compartida en el núcleo. Tu Plugin se encarga de:

- **Configuración** — resolución de cuentas y asistente de configuración
- **Seguridad** — política de DM y listas de permitidos
- **Emparejamiento** — flujo de aprobación por DM
- **Gramática de sesión** — cómo los identificadores de conversación específicos del proveedor se asignan a chats base, identificadores de hilo y alternativas de conversación principal
- **Salida** — envío de texto, medios y encuestas a la plataforma
- **Hilos** — cómo se organizan las respuestas en hilos
- **Escritura de Heartbeat** — señales opcionales de escritura/ocupado para destinos de entrega de Heartbeat

El núcleo se encarga de la herramienta de mensajes compartida, el cableado de prompts, la forma externa de la clave de sesión,
la contabilidad genérica de `:thread:` y el despacho.

Si tu canal admite indicadores de escritura fuera de las respuestas entrantes, expón
`heartbeat.sendTyping(...)` en el Plugin de canal. El núcleo lo llama con el
destino de entrega de Heartbeat resuelto antes de que empiece la ejecución del modelo de Heartbeat y
usa el ciclo de vida compartido de mantenimiento/limpieza de escritura. Añade `heartbeat.clearTyping(...)`
cuando la plataforma necesite una señal explícita de parada.

Si tu canal añade parámetros de la herramienta de mensajes que transportan fuentes de medios, expón esos
nombres de parámetros mediante `describeMessageTool(...).mediaSourceParams`. El núcleo usa
esa lista explícita para la normalización de rutas de sandbox y la política de acceso a medios salientes,
por lo que los plugins no necesitan casos especiales en el núcleo compartido para parámetros específicos del proveedor
de avatar, adjunto o imagen de portada.
Prefiere devolver un mapa indexado por clave de acción, como
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, para que las acciones no relacionadas no
hereden los argumentos de medios de otra acción. Un arreglo plano sigue funcionando para parámetros que
se comparten intencionalmente en todas las acciones expuestas.

Si tu plataforma almacena alcance adicional dentro de los identificadores de conversación, mantén ese análisis
en el Plugin con `messaging.resolveSessionConversation(...)`. Ese es el
hook canónico para asignar `rawId` al identificador de conversación base, el identificador de hilo
opcional, `baseConversationId` explícito y cualquier `parentConversationCandidates`.
Cuando devuelvas `parentConversationCandidates`, mantenlos ordenados desde el principal
más específico hasta la conversación más amplia/base.

Usa `openclaw/plugin-sdk/channel-route` cuando el código del Plugin necesite normalizar
campos similares a rutas, comparar un hilo hijo con su ruta principal o crear una
clave de deduplicación estable a partir de `{ channel, to, accountId, threadId }`. El helper
normaliza los identificadores de hilo numéricos del mismo modo que lo hace el núcleo, por lo que los plugins deberían preferirlo
frente a comparaciones ad hoc con `String(threadId)`.
Los plugins con gramática de destino específica del proveedor pueden inyectar su analizador en
`resolveChannelRouteTargetWithParser(...)` y seguir obteniendo la misma forma de destino de ruta
y semántica de alternativa de hilo que usa el núcleo.

Los plugins incluidos que necesiten el mismo análisis antes de que arranque el registro de canales
también pueden exponer un archivo de nivel superior `session-key-api.ts` con una exportación
`resolveSessionConversation(...)` equivalente. El núcleo usa esa superficie segura para arranque
solo cuando el registro de plugins en tiempo de ejecución aún no está disponible.

`messaging.resolveParentConversationCandidates(...)` sigue disponible como
alternativa de compatibilidad heredada cuando un Plugin solo necesita alternativas de conversación principal sobre
el identificador genérico/bruto. Si existen ambos hooks, el núcleo usa primero
`resolveSessionConversation(...).parentConversationCandidates` y solo
recurre a `resolveParentConversationCandidates(...)` cuando el hook canónico
los omite.

## Aprobaciones y capacidades de canal

La mayoría de los plugins de canal no necesitan código específico de aprobaciones.

- El núcleo se encarga de `/approve` en el mismo chat, las cargas compartidas de botones de aprobación y la entrega alternativa genérica.
- Prefiere un único objeto `approvalCapability` en el Plugin de canal cuando el canal necesite comportamiento específico de aprobación.
- `ChannelPlugin.approvals` se eliminó. Coloca los datos de entrega, nativos, renderizado y autenticación de aprobaciones en `approvalCapability`.
- `plugin.auth` es solo inicio/cierre de sesión; el núcleo ya no lee hooks de autenticación de aprobación desde ese objeto.
- `approvalCapability.authorizeActorAction` y `approvalCapability.getActionAvailabilityState` son la costura canónica de autenticación de aprobación.
- Usa `approvalCapability.getActionAvailabilityState` para la disponibilidad de autenticación de aprobación en el mismo chat.
- Si tu canal expone aprobaciones de ejecución nativas, usa `approvalCapability.getExecInitiatingSurfaceState` para el estado de la superficie iniciadora/cliente nativo cuando difiera de la autenticación de aprobación en el mismo chat. El núcleo usa ese hook específico de ejecución para distinguir `enabled` frente a `disabled`, decidir si el canal iniciador admite aprobaciones de ejecución nativas e incluir el canal en la guía alternativa del cliente nativo. `createApproverRestrictedNativeApprovalCapability(...)` completa esto para el caso común.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` u `outbound.beforeDeliverPayload` para comportamiento del ciclo de vida de cargas específico del canal, como ocultar prompts duplicados de aprobación local o enviar indicadores de escritura antes de la entrega.
- Usa `approvalCapability.delivery` solo para enrutamiento de aprobaciones nativas o supresión de alternativas.
- Usa `approvalCapability.nativeRuntime` para datos de aprobación nativa propiedad del canal. Manténlo diferido en puntos de entrada de canal críticos con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, que puede importar tu módulo de runtime bajo demanda y aun así permitir que el núcleo ensamble el ciclo de vida de aprobación.
- Usa `approvalCapability.render` solo cuando un canal realmente necesite cargas de aprobación personalizadas en lugar del renderizador compartido.
- Usa `approvalCapability.describeExecApprovalSetup` cuando el canal quiera que la respuesta de la ruta deshabilitada explique las opciones de configuración exactas necesarias para habilitar aprobaciones de ejecución nativas. El hook recibe `{ channel, channelLabel, accountId }`; los canales con cuentas con nombre deberían renderizar rutas con alcance de cuenta como `channels.<channel>.accounts.<id>.execApprovals.*` en lugar de valores predeterminados de nivel superior.
- Si un canal puede inferir identidades de DM estables parecidas a propietario desde la configuración existente, usa `createResolvedApproverActionAuthAdapter` de `openclaw/plugin-sdk/approval-runtime` para restringir `/approve` en el mismo chat sin añadir lógica de núcleo específica de aprobaciones.
- Si un canal necesita entrega de aprobación nativa, mantén el código del canal centrado en la normalización de destinos más los datos de transporte/presentación. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` y `createApproverRestrictedNativeApprovalCapability` de `openclaw/plugin-sdk/approval-runtime`. Coloca los datos específicos del canal detrás de `approvalCapability.nativeRuntime`, idealmente mediante `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, para que el núcleo pueda ensamblar el manejador y encargarse del filtrado de solicitudes, enrutamiento, deduplicación, caducidad, suscripción al Gateway y avisos de enrutamiento a otro lugar. `nativeRuntime` se divide en varias costuras más pequeñas:
- `createChannelNativeOriginTargetResolver` usa por defecto el comparador compartido de rutas de canal para destinos `{ to, accountId, threadId }`. Pasa `targetsMatch` solo cuando un canal tenga reglas de equivalencia específicas del proveedor, como coincidencia de prefijo de marca de tiempo en Slack.
- Pasa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` cuando el canal necesite canonicalizar identificadores del proveedor antes de que se ejecute el comparador de rutas predeterminado o una devolución `targetsMatch` personalizada, preservando a la vez el destino original para la entrega. Usa `normalizeTarget` solo cuando el propio destino de entrega resuelto deba canonicalizarse.
- `availability` — si la cuenta está configurada y si una solicitud debe gestionarse
- `presentation` — asigna el modelo de vista de aprobación compartido a cargas nativas pendientes/resueltas/caducadas o acciones finales
- `transport` — prepara destinos y envía/actualiza/elimina mensajes de aprobación nativa
- `interactions` — hooks opcionales de vincular/desvincular/limpiar acción para botones o reacciones nativas
- `observe` — hooks opcionales de diagnóstico de entrega
- Si el canal necesita objetos propiedad del runtime, como un cliente, token, aplicación Bolt o receptor de Webhook, regístralos mediante `openclaw/plugin-sdk/channel-runtime-context`. El registro genérico de contexto de runtime permite que el núcleo arranque manejadores impulsados por capacidades desde el estado de inicio del canal sin añadir pegamento envoltorio específico de aprobaciones.
- Recurre al `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` de nivel inferior solo cuando la costura impulsada por capacidades aún no sea lo suficientemente expresiva.
- Los canales de aprobación nativa deben enrutar tanto `accountId` como `approvalKind` mediante esos helpers. `accountId` mantiene la política de aprobación multicuenta limitada a la cuenta de bot correcta, y `approvalKind` mantiene el comportamiento de aprobaciones de ejecución frente a Plugin disponible para el canal sin ramas codificadas en el núcleo.
- Ahora el núcleo también se encarga de los avisos de redirección de aprobación. Los plugins de canal no deberían enviar sus propios mensajes de seguimiento "la aprobación fue a DM / otro canal" desde `createChannelNativeApprovalRuntime`; en su lugar, expón un origen preciso y enrutamiento a DM del aprobador mediante los helpers compartidos de capacidad de aprobación y deja que el núcleo agregue las entregas reales antes de publicar cualquier aviso de vuelta al chat iniciador.
- Conserva el tipo de identificador de aprobación entregado de extremo a extremo. Los clientes nativos no deberían
  adivinar ni reescribir el enrutamiento de aprobaciones de ejecución frente a Plugin desde estado local del canal.
- Distintos tipos de aprobación pueden exponer intencionalmente distintas superficies nativas.
  Ejemplos incluidos actuales:
  - Slack mantiene el enrutamiento de aprobaciones nativas disponible tanto para identificadores de ejecución como de Plugin.
  - Matrix mantiene el mismo enrutamiento nativo por DM/canal y la UX de reacciones para aprobaciones de ejecución
    y de Plugin, al tiempo que permite que la autenticación difiera por tipo de aprobación.
- `createApproverRestrictedNativeApprovalAdapter` sigue existiendo como envoltorio de compatibilidad, pero el código nuevo debería preferir el constructor de capacidades y exponer `approvalCapability` en el Plugin.

Para puntos de entrada de canal críticos, prefiere las subrutas de runtime más acotadas cuando solo
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

Para la configuración específicamente:

- `openclaw/plugin-sdk/setup-runtime` cubre los helpers de configuración seguros para runtime:
  adaptadores de parche de configuración seguros de importar (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), salida de nota de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y los constructores delegados
  de proxy de configuración
- `openclaw/plugin-sdk/setup-adapter-runtime` es la costura de adaptador estrecha y consciente del entorno
  para `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` cubre los constructores de configuración de instalación opcional
  más algunas primitivas seguras para configuración:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si tu canal admite configuración o autenticación impulsada por variables de entorno y los flujos genéricos de inicio/configuración
deben conocer esos nombres de entorno antes de que se cargue el runtime, decláralos en el
manifiesto del Plugin con `channelEnvVars`. Mantén `envVars` del runtime del canal o constantes locales
solo para texto orientado a operadores.

Si tu canal puede aparecer en `status`, `channels list`, `channels status` o
escaneos de SecretRef antes de que se inicie el runtime del plugin, añade
`openclaw.setupEntry` en `package.json`. Ese punto de entrada debe ser seguro
de importar en rutas de comandos de solo lectura y debe devolver los metadatos
del canal, el adaptador de configuración seguro para setup, el adaptador de
estado y los metadatos de destino de secretos del canal necesarios para esos
resúmenes. No inicies clientes, escuchas ni runtimes de transporte desde la
entrada de setup.

Mantén también acotada la ruta de importación de la entrada principal del canal.
Discovery puede evaluar la entrada y el módulo del Plugin de canal para registrar
capacidades sin activar el canal. Archivos como `channel-plugin-api.ts` deben
exportar el objeto del Plugin de canal sin importar asistentes de setup, clientes
de transporte, escuchas de sockets, lanzadores de subprocesos ni módulos de
inicio de servicios. Coloca esas piezas de runtime en módulos cargados desde
`registerFull(...)`, setters de runtime o adaptadores de capacidades diferidas.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` y
`splitSetupEntries`

- usa la costura más amplia `openclaw/plugin-sdk/setup` solo cuando también
  necesites los helpers compartidos más pesados de setup/configuración, como
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si tu canal solo quiere anunciar "instala primero este Plugin" en superficies de
setup, prefiere `createOptionalChannelSetupSurface(...)`. El adaptador/asistente
generado falla cerrado en escrituras de configuración y finalización, y reutiliza
el mismo mensaje de instalación requerida en la validación, la finalización y la
copia del enlace a la documentación.

Para otras rutas calientes de canal, prefiere los helpers estrechos frente a las
superficies legacy más amplias:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` y
  `openclaw/plugin-sdk/account-helpers` para configuración multicuenta y
  fallback de cuenta predeterminada
- `openclaw/plugin-sdk/inbound-envelope` y
  `openclaw/plugin-sdk/inbound-reply-dispatch` para ruta/sobre entrante y
  cableado de registrar y despachar
- `openclaw/plugin-sdk/messaging-targets` para análisis/coincidencia de destinos
- `openclaw/plugin-sdk/outbound-media` y
  `openclaw/plugin-sdk/outbound-runtime` para carga de medios más delegados de
  identidad/envío salientes y planificación de payloads
- `buildThreadAwareOutboundSessionRoute(...)` desde
  `openclaw/plugin-sdk/channel-core` cuando una ruta saliente deba preservar un
  `replyToId`/`threadId` explícito o recuperar la sesión `:thread:` actual
  después de que la clave de sesión base aún coincida. Los plugins de proveedor
  pueden sobrescribir precedencia, comportamiento de sufijo y normalización de id
  de hilo cuando su plataforma tiene semántica nativa de entrega en hilos.
- `openclaw/plugin-sdk/thread-bindings-runtime` para el ciclo de vida de enlaces
  de hilo y el registro de adaptadores
- `openclaw/plugin-sdk/agent-media-payload` solo cuando todavía se requiera un
  diseño de campos legacy de payload de agente/medios
- `openclaw/plugin-sdk/telegram-command-config` para normalización de comandos
  personalizados de Telegram, validación de duplicados/conflictos y un contrato
  de configuración de comandos estable en fallback

Los canales solo de autenticación normalmente pueden quedarse en la ruta
predeterminada: core gestiona las aprobaciones y el Plugin solo expone
capacidades salientes/de autenticación. Los canales de aprobación nativa como
Matrix, Slack, Telegram y transportes de chat personalizados deben usar los
helpers nativos compartidos en lugar de implementar su propio ciclo de vida de
aprobación.

## Política de menciones entrantes

Mantén el manejo de menciones entrantes dividido en dos capas:

- recopilación de evidencias propiedad del Plugin
- evaluación de política compartida

Usa `openclaw/plugin-sdk/channel-mention-gating` para decisiones de política de
menciones. Usa `openclaw/plugin-sdk/channel-inbound` solo cuando necesites el
barrel más amplio de helpers entrantes.

Buen encaje para lógica local del Plugin:

- detección de respuesta al bot
- detección de bot citado
- comprobaciones de participación en hilos
- exclusiones de mensajes de servicio/sistema
- cachés nativas de plataforma necesarias para probar la participación del bot

Buen encaje para el helper compartido:

- `requireMention`
- resultado de mención explícita
- allowlist de mención implícita
- bypass de comandos
- decisión final de omitir

Flujo preferido:

1. Calcula los hechos locales de mención.
2. Pasa esos hechos a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` y `decision.shouldSkip` en tu puerta entrante.

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

`api.runtime.channel.mentions` expone los mismos helpers compartidos de menciones
para plugins de canal incluidos que ya dependen de inyección de runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si solo necesitas `implicitMentionKindWhen` y
`resolveInboundMentionDecision`, importa desde
`openclaw/plugin-sdk/channel-mention-gating` para evitar cargar helpers de
runtime entrante no relacionados.

Los helpers anteriores `resolveMentionGating*` permanecen en
`openclaw/plugin-sdk/channel-inbound` solo como exportaciones de compatibilidad.
El código nuevo debe usar `resolveInboundMentionDecision({ facts, policy })`.

## Tutorial

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquete y manifiesto">
    Crea los archivos estándar del Plugin. El campo `channel` en `package.json`
    es lo que convierte esto en un Plugin de canal. Para la superficie completa
    de metadatos de paquete, consulta [Setup y configuración de Plugin](/es/plugins/sdk-setup#openclaw-channel):

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
    ajustes propiedad del Plugin que no sean la configuración de cuenta del canal.
    `channelConfigs` valida `channels.acme-chat` y es la fuente de ruta fría
    usada por el esquema de configuración, el setup y las superficies de UI antes
    de que se cargue el runtime del Plugin.

  </Step>

  <Step title="Construye el objeto del Plugin de canal">
    La interfaz `ChannelPlugin` tiene muchas superficies opcionales de adaptador.
    Empieza con lo mínimo: `id` y `setup`, y añade adaptadores según los
    necesites.

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

    Para canales que aceptan tanto claves canónicas de DM de nivel superior como
    claves anidadas legacy, usa los helpers de `plugin-sdk/channel-config-helpers`:
    `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`
    y `normalizeChannelDmPolicy` mantienen los valores locales de cuenta por
    delante de los valores de raíz heredados. Empareja el mismo resolver con la
    reparación de doctor mediante `normalizeLegacyDmAliases` para que runtime y
    migración lean el mismo contrato.

    <Accordion title="Qué hace createChatChannelPlugin por ti">
      En lugar de implementar interfaces de adaptador de bajo nivel manualmente,
      pasas opciones declarativas y el constructor las compone:

      | Opción | Qué conecta |
      | --- | --- |
      | `security.dm` | Resolver de seguridad de DM con ámbito desde campos de configuración |
      | `pairing.text` | Flujo de emparejamiento de DM basado en texto con intercambio de código |
      | `threading` | Resolver de modo de respuesta a (fijo, con ámbito de cuenta o personalizado) |
      | `outbound.attachedResults` | Funciones de envío que devuelven metadatos de resultado (IDs de mensaje) |

      También puedes pasar objetos de adaptador sin procesar en lugar de las
      opciones declarativas si necesitas control total.

      Los adaptadores de salida sin procesar pueden definir una función `chunker(text, limit, ctx)`.
      El `ctx.formatting` opcional contiene decisiones de formato en tiempo de entrega
      como `maxLinesPerMessage`; aplícalo antes de enviar para que el encadenamiento de respuestas
      y los límites de fragmentos se resuelvan una sola vez mediante la entrega de salida compartida.
      Los contextos de envío también incluyen `replyToIdSource` (`implicit` o `explicit`)
      cuando se resolvió un destino de respuesta nativo, para que los ayudantes de carga útil puedan conservar
      etiquetas de respuesta explícitas sin consumir un espacio de respuesta implícita de un solo uso.
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
    mientras que las cargas completas normales siguen incorporando los mismos descriptores para el registro real
    de comandos. Mantén `registerFull(...)` para trabajo exclusivo del runtime.
    Si `registerFull(...)` registra métodos RPC de Gateway, usa un
    prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre
    se resuelven a `operator.admin`.
    `defineChannelPluginEntry` gestiona automáticamente la separación del modo de registro. Consulta
    [Puntos de entrada](/es/plugins/sdk-entrypoints#definechannelpluginentry) para ver todas
    las opciones.

  </Step>

  <Step title="Añadir una entrada de configuración">
    Crea `setup-entry.ts` para una carga ligera durante la incorporación:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carga esto en lugar de la entrada completa cuando el canal está deshabilitado
    o no configurado. Evita cargar código pesado de runtime durante los flujos de configuración.
    Consulta [Configuración](/es/plugins/sdk-setup#setup-entry) para más detalles.

    Los canales de espacio de trabajo incluidos que dividen las exportaciones seguras para configuración en módulos
    complementarios pueden usar `defineBundledChannelSetupEntry(...)` desde
    `openclaw/plugin-sdk/channel-entry-contract` cuando también necesitan un
    setter explícito de runtime en tiempo de configuración.

  </Step>

  <Step title="Gestionar mensajes entrantes">
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
      La gestión de mensajes entrantes es específica del canal. Cada plugin de canal posee
      su propia canalización de entrada. Consulta los plugins de canal incluidos
      (por ejemplo, el paquete de plugin de Microsoft Teams o Google Chat) para ver patrones reales.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Probar">
Escribe pruebas colocadas en `src/channel.test.ts`:

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

    Para ayudantes de prueba compartidos, consulta [Pruebas](/es/plugins/sdk-testing).

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
    Modos de respuesta fijos, con ámbito de cuenta o personalizados
  </Card>
  <Card title="Integración de herramienta de mensajes" icon="puzzle" href="/es/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool y descubrimiento de acciones
  </Card>
  <Card title="Resolución de destino" icon="crosshair" href="/es/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Ayudantes de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, STT, medios, subagente mediante api.runtime
  </Card>
  <Card title="Núcleo de turno de canal" icon="bolt" href="/es/plugins/sdk-channel-turn">
    Ciclo de vida compartido del turno entrante: ingerir, resolver, registrar, despachar, finalizar
  </Card>
</CardGroup>

<Note>
Algunas costuras auxiliares incluidas aún existen para el mantenimiento de plugins incluidos y
compatibilidad. No son el patrón recomendado para nuevos plugins de canal;
prefiere las subrutas genéricas de canal/configuración/respuesta/runtime desde la superficie común del SDK
a menos que estés manteniendo directamente esa familia de plugins incluidos.
</Note>

## Siguientes pasos

- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — si tu plugin también proporciona modelos
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia completa de importaciones por subruta
- [Pruebas del SDK](/es/plugins/sdk-testing) — utilidades de prueba y pruebas de contrato
- [Manifest del plugin](/es/plugins/manifest) — esquema completo del manifiesto

## Relacionado

- [Configuración del SDK de plugins](/es/plugins/sdk-setup)
- [Crear plugins](/es/plugins/building-plugins)
- [Plugins de arnés de agente](/es/plugins/sdk-agent-harness)
