---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface de l’adaptateur ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Création de Plugins de canal
x-i18n:
    generated_at: "2026-04-25T13:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Ce guide explique comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous aurez un canal fonctionnel avec sécurité DM,
appairage, réponses en fil et messagerie sortante.

<Info>
  Si vous n’avez encore créé aucun Plugin OpenClaw, lisez d’abord
  [Premiers pas](/fr/plugins/building-plugins) pour la structure de package de base
  et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils send/edit/react. OpenClaw conserve un
outil `message` partagé dans le noyau. Votre Plugin possède :

- **Config** — résolution de compte et assistant de configuration
- **Security** — politique DM et listes d’autorisation
- **Pairing** — flux d’approbation DM
- **Session grammar** — comment les IDs de conversation spécifiques au fournisseur se mappent aux chats de base, IDs de fil et replis parent
- **Outbound** — envoi de texte, médias et sondages vers la plateforme
- **Threading** — comment les réponses sont mises en fil
- **Heartbeat typing** — signaux facultatifs de saisie/occupation pour les cibles de livraison Heartbeat

Le noyau possède l’outil message partagé, le câblage des prompts, la forme externe de la clé de session,
la tenue générique de `:thread:` et l’envoi.

Si votre canal prend en charge des indicateurs de saisie en dehors des réponses entrantes,
exposez `heartbeat.sendTyping(...)` sur le Plugin de canal. Le noyau l’appelle avec la
cible de livraison Heartbeat résolue avant le démarrage de l’exécution du modèle Heartbeat et
utilise le cycle de vie partagé de keepalive/nettoyage de la saisie. Ajoutez `heartbeat.clearTyping(...)`
lorsque la plateforme nécessite un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil message qui transportent des sources média,
exposez ces noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le noyau utilise
cette liste explicite pour la normalisation des chemins sandbox et la politique d’accès aux médias sortants,
afin que les Plugins n’aient pas besoin de cas spéciaux dans le noyau partagé pour des paramètres
spécifiques au fournisseur comme avatar, pièce jointe ou image de couverture.
Préférez renvoyer une map indexée par action telle que
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que des actions non liées n’héritent pas
des arguments média d’une autre action. Un tableau plat fonctionne toujours pour des paramètres
intentionnellement partagés entre toutes les actions exposées.

Si votre plateforme stocke une portée supplémentaire à l’intérieur des IDs de conversation, gardez cette analyse
dans le Plugin avec `messaging.resolveSessionConversation(...)`. C’est le hook canonique
pour mapper `rawId` vers l’ID de conversation de base, l’ID de fil facultatif, `baseConversationId`
explicite et d’éventuels `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, gardez-les ordonnés du parent
le plus étroit au parent/le plus large ou à la conversation de base.

Les Plugins inclus qui ont besoin de cette même analyse avant le démarrage du registre de canaux
peuvent aussi exposer un fichier de niveau supérieur `session-key-api.ts` avec un export
`resolveSessionConversation(...)` correspondant. Le noyau n’utilise cette surface sûre au bootstrap
que lorsque le registre de Plugins de runtime n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme repli historique
de compatibilité lorsqu’un Plugin n’a besoin que de replis parent au-dessus de l’ID générique/brut.
Si les deux hooks existent, le noyau utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne revient à
`resolveParentConversationCandidates(...)` que lorsque le hook canonique
les omet.

## Approbations et capacités de canal

La plupart des Plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le noyau possède `/approve` dans le même chat, les charges utiles de bouton d’approbation partagées et la livraison de repli générique.
- Préférez un seul objet `approvalCapability` sur le Plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` a été supprimé. Placez les faits de livraison/native/rendu/authentification des approbations dans `approvalCapability`.
- `plugin.auth` ne sert qu’à login/logout ; le noyau ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont la couture canonique d’authentification des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification d’approbation dans le même chat.
- Si votre canal expose des approbations exec natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface initiatrice/du client natif lorsqu’il diffère de l’authentification d’approbation dans le même chat. Le noyau utilise ce hook spécifique à exec pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations exec natives et inclure le canal dans les indications de repli de client natif. `createApproverRestrictedNativeApprovalCapability(...)` remplit cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement spécifique au canal dans le cycle de vie des charges utiles, comme masquer des invites locales d’approbation en double ou envoyer des indicateurs de saisie avant livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation native ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native détenus par le canal. Gardez-le lazy sur les points d’entrée à chaud du canal avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module de runtime à la demande tout en laissant le noyau assembler le cycle de vie d’approbation.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique exactement quels réglages de configuration sont nécessaires pour activer les approbations exec natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à compte nommé doivent afficher des chemins portés par compte tels que `channels.<channel>.accounts.<id>.execApprovals.*` au lieu des valeurs par défaut de niveau supérieur.
- Si un canal peut déduire des identités DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans le même chat sans ajouter de logique de noyau spécifique aux approbations.
- Si un canal a besoin d’une livraison d’approbation native, gardez le code du canal concentré sur la normalisation de la cible ainsi que sur les faits de transport/présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le noyau puisse assembler le gestionnaire et posséder le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les notifications « routé ailleurs ». `nativeRuntime` est divisé en quelques coutures plus petites :
- `availability` — si le compte est configuré et si une requête doit être traitée
- `presentation` — mapper le modèle de vue d’approbation partagé vers des charges utiles natives pending/resolved/expired ou des actions finales
- `transport` — préparer les cibles puis envoyer/mettre à jour/supprimer les messages d’approbation natifs
- `interactions` — hooks facultatifs bind/unbind/clear-action pour des boutons ou réactions natives
- `observe` — hooks facultatifs de diagnostics de livraison
- Si le canal a besoin d’objets détenus par le runtime comme un client, un jeton, une application Bolt ou un récepteur de Webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique runtime-context permet au noyau de démarrer des gestionnaires pilotés par capacités à partir de l’état de démarrage du canal sans ajouter de colle d’enrobage spécifique aux approbations.
- Ne recourez à `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de plus bas niveau que lorsque la couture pilotée par capacités n’est pas encore suffisamment expressive.
- Les canaux d’approbation native doivent faire transiter à la fois `accountId` et `approvalKind` via ces helpers. `accountId` garde la portée de la politique d’approbation multi-compte sur le bon compte de bot, et `approvalKind` garde disponible au canal le comportement d’approbation exec vs Plugin sans branches codées en dur dans le noyau.
- Le noyau possède désormais aussi les notifications de reroutage d’approbation. Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi « l’approbation a été envoyée en DM / vers un autre canal » depuis `createChannelNativeApprovalRuntime` ; à la place, exposez un routage précis origin + DM d’approbateur via les helpers partagés de capacité d’approbation et laissez le noyau agréger les livraisons réelles avant de publier toute notification dans le chat initiateur.
- Préservez de bout en bout le type d’ID d’approbation livré. Les clients natifs ne doivent pas
  deviner ou réécrire le routage des approbations exec vs Plugin à partir de l’état local du canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples actuels inclus :
  - Slack garde disponible le routage d’approbation native pour les IDs exec et Plugin.
  - Matrix garde le même routage natif DM/canal et la même UX de réaction pour les approbations exec
    et Plugin, tout en laissant l’authentification différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le builder de capacités et exposer `approvalCapability` sur le Plugin.

Pour les points d’entrée à chaud du canal, préférez les sous-chemins de runtime plus étroits lorsque vous n’avez
besoin que d’une partie de cette famille :

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
surface parapluie plus large.

Spécifiquement pour setup :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de setup sûrs au runtime :
  adaptateurs de patch de setup sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les builders
  délégués de setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` est la couture d’adaptateur étroite aware de l’environnement
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les builders de setup à installation facultative
  ainsi que quelques primitives sûres pour le setup :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une authentification pilotée par env et que les flux génériques de démarrage/configuration
doivent connaître ces noms d’env avant le chargement du runtime, déclarez-les dans le
manifeste du Plugin avec `channelEnvVars`. Gardez `envVars` du runtime du canal ou des
constantes locales uniquement pour le texte orienté opérateur.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou dans les scans SecretRef avant le démarrage du runtime du Plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans danger dans les chemins de commande en lecture seule
et doit renvoyer les métadonnées du canal, l’adaptateur de configuration sûr pour setup, l’adaptateur de statut et les métadonnées de cible secrète du canal nécessaires à ces résumés. Ne démarrez pas de clients, listeners ou runtimes de transport depuis le point d’entrée setup.

Gardez également étroit le chemin d’import du point d’entrée principal du canal. La découverte peut évaluer
le point d’entrée et le module du Plugin de canal pour enregistrer les capacités sans activer
le canal. Des fichiers comme `channel-plugin-api.ts` doivent exporter l’objet Plugin de canal
sans importer les assistants de setup, clients de transport, listeners socket, lanceurs de sous-processus ou modules de démarrage de service. Placez ces éléments de runtime dans des modules chargés depuis `registerFull(...)`, des setters de runtime ou des adaptateurs de capacité lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez la couture plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  helpers de setup/configuration partagés plus lourds tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement afficher « installez d’abord ce plugin » dans les surfaces de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/l’assistant généré échoue de manière sécurisée sur les écritures de configuration et la finalisation, et réutilise le même message d’installation requise dans la validation, la finalisation et le texte avec lien vers la documentation.

Pour les autres chemins critiques de canal, préférez les assistants ciblés aux surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-comptes et
  le repli sur le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le routage/l’enveloppe entrants et
  le câblage d’enregistrement-et-dispatch
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse/la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que
  les délégués d’identité/d’envoi sortants et la planification de charge utile
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId`/`threadId` explicite ou récupérer la session `:thread:` courante
  après que la clé de session de base corresponde toujours. Les plugins de fournisseur peuvent remplacer
  la priorité, le comportement de suffixe et la normalisation d’identifiant de fil lorsque leur plateforme
  a une sémantique native de distribution par fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des associations de fils
  et l’enregistrement d’adaptateur
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée
  de champ de charge utile agent/média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons/conflits et un contrat de configuration de commande
  stable en repli

Les canaux uniquement d’authentification peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le plugin expose seulement les capacités sortantes/d’authentification. Les canaux d’approbation natifs tels que Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les assistants natifs partagés au lieu de créer leur propre cycle de vie d’approbation.

## Politique de mention entrante

Conservez le traitement des mentions entrantes en deux couches :

- collecte de preuves gérée par le plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel d’assistants entrants
plus large.

Bon cas d’usage pour la logique locale au plugin :

- détection de réponse au bot
- détection de citation du bot
- vérifications de participation au fil
- exclusions des messages de service/système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Bon cas d’usage pour l’assistant partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisations de mention implicite
- contournement par commande
- décision finale de saut

Flux recommandé :

1. Calculez les faits de mention locaux.
2. Passez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
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

`api.runtime.channel.mentions` expose les mêmes assistants de mention partagés pour
les plugins de canal intégrés qui dépendent déjà de l’injection à l’exécution :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

  Si vous avez seulement besoin de `implicitMentionKindWhen` et de
  `resolveInboundMentionDecision`, importez-les depuis
  `openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des assistants d’exécution entrants
  sans rapport.

  Les anciens assistants `resolveMentionGating*` restent disponibles sur
  `openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code
  doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

  ## Procédure pas à pas

  <Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquet et manifeste">
    Créez les fichiers de plugin standard. Le champ `channel` dans `package.json`
    est ce qui fait de ceci un plugin de canal. Pour la surface complète de
    métadonnées du paquet, consultez [Configuration et config du Plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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
      "description": "Plugin de canal Acme Chat",
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
              "label": "Jeton du bot",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valide `plugins.entries.acme-chat.config`. Utilisez-le pour
    les paramètres gérés par le plugin qui ne sont pas la configuration de compte du canal. `channelConfigs`
    valide `channels.acme-chat` et constitue la source du chemin à froid utilisée par le schéma de configuration,
    la configuration guidée et les surfaces d’interface avant le chargement de l’exécution du plugin.

  </Step>

  <Step title="Construire l’objet plugin de canal">
    L’interface `ChannelPlugin` a de nombreuses surfaces d’adaptateur facultatives. Commencez par
    le minimum — `id` et `setup` — puis ajoutez des adaptateurs selon vos besoins.

    Créez `src/channel.ts` :

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
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous passez
      des options déclaratives et le constructeur les assemble :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée limitée depuis les champs de configuration |
      | `pairing.text` | Flux d’association DM basé sur le texte avec échange de code |
      | `threading` | Résolveur de mode de réponse (fixe, limité au compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (IDs de message) |

      Vous pouvez aussi passer des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle total.

      Les adaptateurs sortants bruts peuvent définir une fonction `chunker(text, limit, ctx)`.
      Le `ctx.formatting` facultatif porte les décisions de formatage au moment de la distribution
      comme `maxLinesPerMessage` ; appliquez-le avant l’envoi pour que le fil de réponse
      et les limites de segmentation soient résolus une seule fois par la distribution sortante partagée.
      Les contextes d’envoi incluent aussi `replyToIdSource` (`implicit` ou `explicit`)
      lorsqu’une cible de réponse native a été résolue, afin que les assistants de charge utile puissent préserver
      les balises de réponse explicites sans consommer un emplacement de réponse implicite à usage unique.
    </Accordion>

  </Step>

  <Step title="Connecter le point d’entrée">
    Créez `index.ts` :

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
              .description("Gestion Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestion Acme Chat",
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

    Placez les descripteurs CLI gérés par le canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer l’exécution complète du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement
    réel des commandes. Réservez `registerFull(...)` au travail réservé à l’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC Gateway, utilisez un
    préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se
    résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation du mode d’enregistrement. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour voir toutes les
    options.

  </Step>

  <Step title="Ajouter une entrée de configuration guidée">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge cette entrée au lieu de l’entrée complète lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code d’exécution lourd pendant les flux de configuration guidée.
    Consultez [Configuration guidée et config](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux d’espace de travail intégrés qui séparent les exports sûrs pour la configuration guidée dans des modules
    compagnons peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter d’exécution explicite au moment de la configuration.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir les messages de la plateforme et les transmettre à
    OpenClaw. Le schéma classique est un Webhook qui vérifie la requête et
    la distribue via le gestionnaire entrant de votre canal :

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
      Le traitement des messages entrants est spécifique au canal. Chaque plugin de canal possède
      son propre pipeline entrant. Consultez les plugins de canal intégrés
      (par exemple les paquets de plugin Microsoft Teams ou Google Chat) pour voir des schémas réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

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

    Pour les assistants de test partagés, consultez [Tests](/fr/plugins/sdk-testing).

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
  <Card title="Options de fil" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, limités au compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de messages" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte d’actions
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Assistants d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
</CardGroup>

<Note>
Certaines jonctions d’assistants intégrés existent encore pour la maintenance et la
compatibilité des plugins intégrés. Ce n’est pas le schéma recommandé pour les nouveaux plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime depuis la surface SDK
commune, sauf si vous assurez directement la maintenance de cette famille de plugins intégrés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — si votre plugin fournit aussi des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Tests SDK](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma complet du manifeste

## Lié

- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
