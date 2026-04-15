---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation de ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Créer des Plugins de canal
x-i18n:
    generated_at: "2026-04-15T19:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e47e61d1e47738361692522b79aff276544446c58a7b41afe5296635dfad4b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Créer des Plugins de canal

Ce guide explique comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous disposerez d’un canal fonctionnel avec
la sécurité des messages privés, l’appairage, le fil de réponse et la
messagerie sortante.

<Info>
  Si vous n’avez encore jamais créé de Plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour comprendre la structure de
  package de base et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils send/edit/react.
OpenClaw conserve un seul outil `message` partagé dans le cœur. Votre Plugin
gère :

- **Configuration** — résolution du compte et assistant de configuration
- **Sécurité** — politique des messages privés et listes d’autorisation
- **Appairage** — flux d’approbation des messages privés
- **Grammaire de session** — comment les identifiants de conversation spécifiques au fournisseur sont mappés vers les discussions de base, les identifiants de fil et les solutions de repli parent
- **Sortant** — envoi de texte, de médias et de sondages vers la plateforme
- **Fil de discussion** — comment les réponses sont organisées en fil

Le cœur gère l’outil de message partagé, le câblage des prompts, la forme
externe de la clé de session, le suivi générique `:thread:` et la répartition.

Si votre canal ajoute des paramètres d’outil de message qui transportent des
sources de médias, exposez ces noms de paramètres via
`describeMessageTool(...).mediaSourceParams`. Le cœur utilise
cette liste explicite pour la normalisation des chemins du bac à sable et la
politique d’accès aux médias sortants. Les Plugins n’ont donc pas besoin de cas
particuliers dans le cœur partagé pour les paramètres spécifiques au
fournisseur, comme l’avatar, les pièces jointes ou l’image de couverture.
Préférez renvoyer une map indexée par action, comme
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, afin que des actions sans
rapport n’héritent pas des arguments média d’une autre action. Un tableau plat
fonctionne également pour des paramètres volontairement partagés par toutes les
actions exposées.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de
conversation, conservez cette logique d’analyse dans le Plugin avec
`messaging.resolveSessionConversation(...)`. Il s’agit du hook canonique pour
mapper `rawId` vers l’identifiant de conversation de base, l’identifiant de fil
facultatif, l’éventuel `baseConversationId` et tous les
`parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, gardez-les ordonnés du
parent le plus spécifique au parent le plus large ou à la conversation de base.

Les Plugins intégrés qui ont besoin de la même analyse avant le démarrage du
registre de canaux peuvent aussi exposer un fichier `session-key-api.ts` de
niveau supérieur avec un export `resolveSessionConversation(...)`
correspondant. Le cœur utilise cette surface sûre pour l’amorçage uniquement
lorsque le registre de Plugin d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme
solution de repli de compatibilité héritée lorsqu’un Plugin n’a besoin que de
solutions de repli parent au-dessus de l’identifiant générique ou brut. Si les
deux hooks existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se rabat
sur `resolveParentConversationCandidates(...)` que lorsque le hook canonique ne
les fournit pas.

## Approbations et capacités des canaux

La plupart des Plugins de canal n’ont pas besoin de code spécifique aux
approbations.

- Le cœur gère `/approve` dans la même discussion, les charges utiles de bouton d’approbation partagées et la livraison de repli générique.
- Préférez un seul objet `approvalCapability` sur le Plugin de canal lorsque le canal nécessite un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` a été supprimé. Placez les informations de livraison, native, rendu et authentification des approbations dans `approvalCapability`.
- `plugin.auth` est réservé à login/logout ; le cœur ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` constituent la jonction canonique pour l’authentification des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification d’approbation dans la même discussion.
- Si votre canal expose des approbations d’exécution natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface initiatrice ou du client natif lorsqu’il diffère de l’authentification d’approbation dans la même discussion. Le cœur utilise ce hook spécifique à l’exécution pour distinguer `enabled` et `disabled`, décider si le canal initiateur prend en charge les approbations d’exécution natives et inclure le canal dans les indications de repli du client natif. `createApproverRestrictedNativeApprovalCapability(...)` remplit ce rôle pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement spécifique au canal dans le cycle de vie des charges utiles, comme masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation natif ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les informations d’approbation native gérées par le canal. Gardez-le paresseux sur les points d’entrée critiques du canal avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en permettant au cœur d’assembler le cycle de vie des approbations.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique exactement quels paramètres de configuration sont nécessaires pour activer les approbations d’exécution natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent afficher des chemins à portée de compte comme `channels.<channel>.accounts.<id>.execApprovals.*` au lieu de valeurs par défaut de niveau supérieur.
- Si un canal peut déduire des identités de messages privés stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même discussion sans ajouter de logique spécifique aux approbations dans le cœur.
- Si un canal a besoin de la livraison d’approbations natives, gardez le code du canal centré sur la normalisation de la cible ainsi que sur les informations de transport et de présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les informations spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le gestionnaire et prendre en charge le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les notifications de routage ailleurs. `nativeRuntime` est divisé en quelques jonctions plus petites :
- `availability` — si le compte est configuré et si une requête doit être prise en charge
- `presentation` — mapper le modèle de vue d’approbation partagé vers des charges utiles natives en attente, résolues, expirées ou vers des actions finales
- `transport` — préparer les cibles puis envoyer, mettre à jour ou supprimer les messages d’approbation natifs
- `interactions` — hooks facultatifs pour lier, délier ou effacer des actions pour les boutons ou réactions natifs
- `observe` — hooks facultatifs de diagnostic de livraison
- Si le canal a besoin d’objets gérés par l’exécution, comme un client, un jeton, une application Bolt ou un récepteur Webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au cœur d’amorcer des gestionnaires pilotés par les capacités à partir de l’état de démarrage du canal sans ajouter de colle d’enveloppe spécifique aux approbations.
- N’utilisez le niveau plus bas `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` que lorsque la jonction pilotée par les capacités n’est pas encore suffisamment expressive.
- Les canaux d’approbation native doivent faire transiter à la fois `accountId` et `approvalKind` via ces helpers. `accountId` conserve la portée de la politique d’approbation multi-compte sur le bon compte de bot, et `approvalKind` conserve le comportement d’approbation d’exécution par rapport au Plugin disponible pour le canal sans branches codées en dur dans le cœur.
- Le cœur gère désormais aussi les notifications de reroutage des approbations. Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi du type « l’approbation est allée dans les messages privés / un autre canal » depuis `createChannelNativeApprovalRuntime` ; à la place, exposez un routage précis de l’origine et des messages privés de l’approbateur via les helpers partagés de capacité d’approbation et laissez le cœur agréger les livraisons réelles avant de publier toute notification dans la discussion initiatrice.
- Préservez le type d’identifiant d’approbation livré de bout en bout. Les clients natifs ne doivent pas deviner ni réécrire le routage des approbations d’exécution par rapport aux approbations de Plugin à partir d’un état local au canal.
- Différents types d’approbation peuvent volontairement exposer différentes surfaces natives.
  Exemples intégrés actuels :
  - Slack conserve le routage d’approbation native disponible à la fois pour les identifiants d’exécution et de Plugin.
  - Matrix conserve le même routage natif en messages privés ou canal et la même UX basée sur les réactions pour les approbations d’exécution et de Plugin, tout en permettant à l’authentification de différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme enveloppe de compatibilité, mais le nouveau code doit préférer le constructeur de capacités et exposer `approvalCapability` sur le Plugin.

Pour les points d’entrée critiques du canal, préférez les sous-chemins
d’exécution plus étroits lorsque vous n’avez besoin que d’une seule partie de
cette famille :

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

De même, préférez `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la
surface englobante plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de configuration sûrs à l’exécution : adaptateurs de patch de configuration sûrs à l’importation (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`), sortie des notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries` et les constructeurs de proxy de configuration déléguée
- `openclaw/plugin-sdk/setup-adapter-runtime` est la jonction d’adaptateur étroite, consciente de l’environnement, pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration d’installation facultative ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une authentification pilotée
par des variables d’environnement et que les flux génériques de démarrage ou de
configuration doivent connaître ces noms de variables avant le chargement de
l’exécution, déclarez-les dans le manifeste du Plugin avec `channelEnvVars`.
Conservez `envVars` de l’exécution du canal ou des constantes locales
uniquement pour le texte destiné aux opérateurs.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez la jonction plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des helpers partagés de configuration plus lourds, comme `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce Plugin » dans les
surfaces de configuration, préférez
`createOptionalChannelSetupSurface(...)`. L’adaptateur et l’assistant générés
échouent en mode fermé sur les écritures de configuration et la finalisation, et
ils réutilisent le même message « installation requise » dans la validation, la
finalisation et le texte du lien vers la documentation.

Pour les autres chemins critiques du canal, préférez les helpers étroits aux
surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-compte et
  la solution de repli du compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le câblage de la route ou
  de l’enveloppe entrante ainsi que de l’enregistrement et de la répartition
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse et la correspondance
  des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que
  les délégués d’identité et d’envoi sortants
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des
  liaisons de fil et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition
  héritée des champs de charge utile agent/média est encore nécessaire
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des
  commandes personnalisées Telegram, la validation des doublons ou conflits, et
  un contrat de configuration de commande stable en solution de repli

Les canaux basés uniquement sur l’authentification peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le Plugin expose simplement les capacités sortantes et d’authentification. Les canaux d’approbation native comme Matrix, Slack, Telegram et les transports de discussion personnalisés doivent utiliser les helpers natifs partagés au lieu de créer leur propre cycle de vie d’approbation.

## Politique des mentions entrantes

Conservez la gestion des mentions entrantes répartie en deux couches :

- collecte de preuves gérée par le Plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-inbound` pour la couche partagée.

Bon cas d’usage pour la logique locale au Plugin :

- détection de réponse au bot
- détection de citation du bot
- vérifications de participation au fil
- exclusions de messages de service ou système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Bon cas d’usage pour le helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement de commande
- décision finale d’ignorer

Flux recommandé :

1. Calculez les faits de mention locaux.
2. Transmettez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
3. Utilisez `decision.effectiveWasMentioned`, `decision.shouldBypassMention` et `decision.shouldSkip` dans votre garde d’entrée.

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

`api.runtime.channel.mentions` expose les mêmes helpers de mention partagés pour
les Plugins de canal intégrés qui dépendent déjà de l’injection d’exécution :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Les anciens helpers `resolveMentionGating*` restent dans
`openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité.
Le nouveau code doit utiliser
`resolveInboundMentionDecision({ facts, policy })`.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers de Plugin standard. Le champ `channel` dans `package.json`
    est ce qui en fait un Plugin de canal. Pour la surface complète des
    métadonnées de package, consultez
    [Plugin Setup and Config](/fr/plugins/sdk-setup#openclaw-channel) :

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

  <Step title="Créer l’objet Plugin de canal">
    L’interface `ChannelPlugin` possède de nombreuses surfaces d’adaptation
    facultatives. Commencez par le minimum — `id` et `setup` — puis ajoutez des
    adaptateurs selon vos besoins.

    Créez `src/channel.ts` :

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

    <Accordion title="Ce que createChatChannelPlugin fait pour vous">
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas
      niveau, vous fournissez des options déclaratives et le constructeur les
      compose :

      | Option | Ce qu’elle connecte |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité des messages privés à portée limitée depuis les champs de configuration |
      | `pairing.text` | Flux d’appairage de messages privés basé sur du texte avec échange de code |
      | `threading` | Résolveur de mode de réponse (fixe, à portée de compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez aussi transmettre des objets d’adaptateur bruts au lieu des
      options déclaratives si vous avez besoin d’un contrôle total.
    </Accordion>

  </Step>

  <Step title="Connecter le point d’entrée">
    Créez `index.ts` :

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

    Placez les descripteurs CLI gérés par le canal dans
    `registerCliMetadata(...)` afin qu’OpenClaw puisse les afficher dans l’aide
    racine sans activer l’exécution complète du canal, tandis que les
    chargements complets normaux récupèrent toujours les mêmes descripteurs pour
    l’enregistrement réel des commandes. Conservez `registerFull(...)` pour le
    travail réservé à l’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC Gateway, utilisez un
    préfixe spécifique au Plugin. Les espaces de noms d’administration du cœur
    (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés
    et se résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement cette séparation des modes
    d’enregistrement. Consultez
    [Entry Points](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour
    toutes les options.

  </Step>

  <Step title="Ajouter une entrée de configuration">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci à la place du point d’entrée complet lorsque le canal
    est désactivé ou non configuré. Cela évite de charger du code d’exécution
    lourd pendant les flux de configuration.
    Consultez [Setup and Config](/fr/plugins/sdk-setup#setup-entry) pour plus de
    détails.

    Les canaux d’espace de travail intégrés qui répartissent les exports sûrs
    pour la configuration dans des modules annexes peuvent utiliser
    `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin
    d’un setter d’exécution explicite au moment de la configuration.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre Plugin doit recevoir les messages depuis la plateforme et les
    transférer vers OpenClaw. Le modèle habituel est un Webhook qui vérifie la
    requête et la distribue via le gestionnaire entrant de votre canal :

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
      La gestion des messages entrants est spécifique au canal. Chaque Plugin de
      canal gère son propre pipeline entrant. Examinez les Plugins de canal
      intégrés (par exemple le package Plugin Microsoft Teams ou Google Chat)
      pour voir des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("résout le compte à partir de la configuration", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspecte le compte sans matérialiser les secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("signale une configuration manquante", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Pour les helpers de test partagés, consultez [Testing](/fr/plugins/sdk-testing).

  </Step>
</Steps>

## Structure des fichiers

```
<bundled-plugin-root>/acme-chat/
├── package.json              # métadonnées openclaw.channel
├── openclaw.plugin.json      # Manifeste avec schéma de configuration
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exports publics (facultatif)
├── runtime-api.ts            # Exports d’exécution internes (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Client API de la plateforme
    └── runtime.ts            # Stockage d’exécution (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fil de discussion" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, à portée de compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte d’action
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/fr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
</CardGroup>

<Note>
Certaines jonctions de helpers intégrés existent encore pour la maintenance et
la compatibilité des Plugins intégrés. Ce n’est pas le modèle recommandé pour
les nouveaux Plugins de canal ; préférez les sous-chemins génériques
channel/setup/reply/runtime de la surface SDK commune, sauf si vous maintenez
directement cette famille de Plugins intégrés.
</Note>

## Étapes suivantes

- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — si votre Plugin fournit aussi des modèles
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports de sous-chemins
- [SDK Testing](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Plugin Manifest](/fr/plugins/manifest) — schéma complet du manifeste
