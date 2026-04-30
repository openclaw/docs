---
read_when:
    - Vous créez un nouveau plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface de l’adaptateur ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un plugin de canal de messagerie pour OpenClaw
title: Créer des plugins de canal
x-i18n:
    generated_at: "2026-04-30T07:40:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ce guide explique comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous disposerez d’un canal fonctionnel avec sécurité des DM,
appairage, fils de réponses et messagerie sortante.

<Info>
  Si vous n’avez encore créé aucun Plugin OpenClaw, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour la structure de package
  de base et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils d’envoi/modification/réaction. OpenClaw conserve un
outil `message` partagé dans le noyau. Votre Plugin possède :

- **Configuration** — résolution de compte et assistant de configuration
- **Sécurité** — politique de DM et listes d’autorisation
- **Appairage** — flux d’approbation par DM
- **Grammaire de session** — correspondance entre les identifiants de conversation propres au fournisseur et les discussions de base, les identifiants de fil et les replis parents
- **Sortant** — envoi de texte, de médias et de sondages à la plateforme
- **Fils** — manière dont les réponses sont organisées en fils
- **Saisie Heartbeat** — signaux facultatifs de saisie/occupation pour les cibles de livraison Heartbeat

Le noyau possède l’outil de message partagé, le câblage des prompts, la forme externe de la clé de session,
la comptabilité générique `:thread:` et la distribution.

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses entrantes, exposez
`heartbeat.sendTyping(...)` sur le Plugin de canal. Le noyau l’appelle avec la
cible de livraison Heartbeat résolue avant le début de l’exécution du modèle Heartbeat et
utilise le cycle de vie partagé de maintien/cleanup de saisie. Ajoutez `heartbeat.clearTyping(...)`
lorsque la plateforme nécessite un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil de message qui transportent des sources multimédias, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le noyau utilise
cette liste explicite pour la normalisation des chemins de sandbox et la politique d’accès aux médias
sortants, afin que les Plugins n’aient pas besoin de cas particuliers dans le noyau partagé pour les paramètres
propres au fournisseur comme avatar, pièce jointe ou image de couverture.
Préférez renvoyer une map indexée par action, par exemple
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, afin que les actions sans rapport
n’héritent pas des arguments multimédias d’une autre action. Un tableau plat fonctionne toujours pour les paramètres qui
sont intentionnellement partagés entre toutes les actions exposées.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, conservez cette analyse
dans le Plugin avec `messaging.resolveSessionConversation(...)`. C’est le
hook canonique pour faire correspondre `rawId` à l’identifiant de conversation de base, à l’identifiant de fil
facultatif, à `baseConversationId` explicite et à d’éventuels `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, gardez-les ordonnés du parent le plus
étroit à la conversation la plus large/de base.

Utilisez `openclaw/plugin-sdk/channel-route` lorsque le code du Plugin doit normaliser
des champs de type route, comparer un fil enfant avec sa route parente ou construire une
clé de déduplication stable à partir de `{ channel, to, accountId, threadId }`. L’assistant
normalise les identifiants de fil numériques de la même façon que le noyau, les Plugins doivent donc le préférer
aux comparaisons ad hoc `String(threadId)`.
Les Plugins avec une grammaire de cible propre au fournisseur peuvent injecter leur analyseur dans
`resolveChannelRouteTargetWithParser(...)` tout en obtenant la même forme de cible de route
et la même sémantique de repli de fil que celles utilisées par le noyau.

Les Plugins intégrés qui ont besoin de la même analyse avant le démarrage du registre de canaux
peuvent aussi exposer un fichier `session-key-api.ts` de niveau supérieur avec un export
`resolveSessionConversation(...)` correspondant. Le noyau utilise cette surface sûre pour l’amorçage
uniquement lorsque le registre de Plugins d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme
repli de compatibilité hérité lorsqu’un Plugin n’a besoin que de replis parents en plus
de l’identifiant générique/brut. Si les deux hooks existent, le noyau utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se rabat sur
`resolveParentConversationCandidates(...)` que lorsque le hook canonique les omet.

## Approbations et capacités de canal

La plupart des Plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le noyau possède `/approve` dans la même discussion, les charges utiles de bouton d’approbation partagées et la livraison de repli générique.
- Préférez un seul objet `approvalCapability` sur le Plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de livraison/native/rendu/auth d’approbation sur `approvalCapability`.
- `plugin.auth` sert uniquement à la connexion/déconnexion ; le noyau ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont le seam canonique d’authentification d’approbation.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification d’approbation dans la même discussion.
- Si votre canal expose des approbations d’exécution natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface d’initiation/du client natif lorsqu’il diffère de l’authentification d’approbation dans la même discussion. Le noyau utilise ce hook spécifique à l’exécution pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations d’exécution natives et inclure le canal dans les indications de repli du client natif. `createApproverRestrictedNativeApprovalCapability(...)` le renseigne pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour les comportements de cycle de vie de charge utile propres au canal, comme masquer les prompts d’approbation locaux en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation natif ou la suppression de repli.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native détenus par le canal. Gardez-le paresseux sur les points d’entrée de canal chauds avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en permettant au noyau d’assembler le cycle de vie d’approbation.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du renderer partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les boutons de configuration exacts nécessaires pour activer les approbations d’exécution natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent afficher des chemins à portée de compte comme `channels.<channel>.accounts.<id>.execApprovals.*` au lieu de valeurs par défaut de niveau supérieur.
- Si un canal peut déduire des identités DM stables de type propriétaire depuis la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même discussion sans ajouter de logique noyau spécifique aux approbations.
- Si un canal a besoin d’une livraison d’approbation native, gardez le code du canal centré sur la normalisation des cibles ainsi que les faits de transport/présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits propres au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le noyau puisse assembler le gestionnaire et posséder le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les avis de routage ailleurs. `nativeRuntime` est divisé en quelques seams plus petits :
- `createChannelNativeOriginTargetResolver` utilise par défaut le matcher channel-route partagé pour les cibles `{ to, accountId, threadId }`. Passez `targetsMatch` uniquement lorsqu’un canal a des règles d’équivalence propres au fournisseur, comme la correspondance de préfixe d’horodatage Slack.
- Passez `normalizeTargetForMatch` à `createChannelNativeOriginTargetResolver` lorsque le canal doit canoniser les identifiants fournisseur avant l’exécution du matcher de route par défaut ou d’un callback `targetsMatch` personnalisé, tout en préservant la cible d’origine pour la livraison. Utilisez `normalizeTarget` uniquement lorsque la cible de livraison résolue elle-même doit être canonisée.
- `availability` — indique si le compte est configuré et si une requête doit être traitée
- `presentation` — mappe le modèle de vue d’approbation partagé vers des charges utiles natives en attente/résolues/expirées ou des actions finales
- `transport` — prépare les cibles et envoie/met à jour/supprime les messages d’approbation natifs
- `interactions` — hooks facultatifs de liaison/déliaison/effacement d’action pour boutons ou réactions natifs
- `observe` — hooks facultatifs de diagnostics de livraison
- Si le canal a besoin d’objets détenus par l’exécution, comme un client, un token, une application Bolt ou un récepteur webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au noyau d’amorcer des gestionnaires pilotés par capacité depuis l’état de démarrage du canal sans ajouter de glue wrapper spécifique aux approbations.
- Utilisez `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de plus bas niveau uniquement lorsque le seam piloté par capacité n’est pas encore assez expressif.
- Les canaux d’approbation native doivent router à la fois `accountId` et `approvalKind` via ces assistants. `accountId` garde la politique d’approbation multi-compte limitée au bon compte bot, et `approvalKind` garde le comportement d’approbation exec vs Plugin disponible pour le canal sans branches codées en dur dans le noyau.
- Le noyau possède désormais aussi les avis de reroutage d’approbation. Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi « approbation envoyée aux DM / à un autre canal » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage origine + DM d’approbateur exact via les assistants de capacité d’approbation partagés et laissez le noyau agréger les livraisons réelles avant de publier un avis dans la discussion initiatrice.
- Préservez de bout en bout le type d’identifiant d’approbation livré. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation exec vs Plugin depuis l’état local du canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples intégrés actuels :
  - Slack garde le routage d’approbation native disponible pour les identifiants exec comme Plugin.
  - Matrix conserve le même routage natif DM/canal et la même UX de réaction pour les approbations exec
    et Plugin, tout en permettant encore à l’authentification de différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le Plugin.

Pour les points d’entrée de canal chauds, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez besoin
que d’une partie de cette famille :

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
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration sûrs pour l’exécution :
  adaptateurs de patch de configuration import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les constructeurs de proxy de configuration
  délégués
- `openclaw/plugin-sdk/setup-adapter-runtime` est le seam d’adaptateur étroit sensible à l’environnement
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration d’installation facultative
  ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une authentification pilotée par l’environnement et que les flux
génériques de démarrage/configuration doivent connaître ces noms d’environnement avant le chargement de l’exécution, déclarez-les dans le
manifeste du Plugin avec `channelEnvVars`. Gardez les `envVars` d’exécution du canal ou les constantes locales
uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou
les analyses SecretRef avant le démarrage de l’exécution du plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans les chemins de commandes
en lecture seule et doit renvoyer les métadonnées du canal, l’adaptateur de configuration compatible avec la configuration, l’adaptateur de statut
et les métadonnées de cible de secret du canal nécessaires à ces résumés. Ne démarrez pas
de clients, d’écouteurs ni d’exécutions de transport depuis l’entrée de configuration.

Gardez également étroit le chemin d’importation de l’entrée principale du canal. La découverte peut évaluer
l’entrée et le module du plugin de canal pour enregistrer les capacités sans activer
le canal. Les fichiers comme `channel-plugin-api.ts` doivent exporter l’objet du plugin de canal
sans importer d’assistants de configuration, de clients de transport, d’écouteurs de socket,
de lanceurs de sous-processus ni de modules de démarrage de service. Placez ces éléments d’exécution
dans des modules chargés depuis `registerFull(...)`, des setters d’exécution ou des adaptateurs de capacités
paresseux.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez la jonction plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  assistants partagés de configuration/config plus lourds, tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce plugin » dans les surfaces
de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/assistant
généré échoue de manière fermée lors des écritures de configuration et de la finalisation, et il réutilise
le même message d’installation requise dans la validation, la finalisation et le texte du lien
vers la documentation.

Pour les autres chemins critiques de canal, préférez les assistants étroits aux surfaces héritées
plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-compte et
  le repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le routage/l’enveloppe entrants et
  le câblage d’enregistrement et de distribution
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse/la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias, ainsi que les délégués
  d’identité/envoi sortants et la planification des charges utiles
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId`/`threadId` explicite ou récupérer la session `:thread:` actuelle
  après que la clé de session de base correspond encore. Les plugins fournisseurs peuvent remplacer
  la précédence, le comportement de suffixe et la normalisation de l’identifiant de fil lorsque leur plateforme
  dispose d’une sémantique native de livraison par fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée des champs de charge utile
  agent/média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons/conflits et un contrat de configuration de commande stable en repli

Les canaux uniquement d’authentification peuvent généralement s’en tenir au chemin par défaut : le cœur gère les approbations et le plugin expose simplement les capacités sortantes/d’authentification. Les canaux d’approbation natifs comme Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les assistants natifs partagés au lieu d’implémenter leur propre cycle de vie d’approbation.

## Politique de mention entrante

Gardez la gestion des mentions entrantes séparée en deux couches :

- collecte de preuves propre au plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel d’assistants
entrants plus large.

Bon choix pour la logique locale au plugin :

- détection des réponses au bot
- détection des citations du bot
- vérifications de participation au fil
- exclusions des messages de service/système
- caches natifs de la plateforme nécessaires pour prouver la participation du bot

Bon choix pour l’assistant partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement par commande
- décision finale d’ignorer

Flux préféré :

1. Calculez les faits de mention locaux.
2. Passez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
3. Utilisez `decision.effectiveWasMentioned`, `decision.shouldBypassMention` et `decision.shouldSkip` dans votre garde entrante.

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
les plugins de canal groupés qui dépendent déjà de l’injection d’exécution :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous avez seulement besoin de `implicitMentionKindWhen` et de
`resolveInboundMentionDecision`, importez depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des assistants d’exécution
entrants sans rapport.

Les anciens assistants `resolveMentionGating*` restent sur
`openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code
doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers de plugin standard. Le champ `channel` dans `package.json` est
    ce qui en fait un plugin de canal. Pour la surface complète des métadonnées de package,
    consultez [Configuration et config du Plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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

    `configSchema` valide `plugins.entries.acme-chat.config`. Utilisez-le pour
    les paramètres propres au plugin qui ne font pas partie de la configuration de compte du canal. `channelConfigs`
    valide `channels.acme-chat` et constitue la source de chemin froid utilisée par le schéma de configuration,
    la configuration et les surfaces d’interface utilisateur avant le chargement de l’exécution du plugin.

  </Step>

  <Step title="Construire l’objet de plugin de canal">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptateur optionnelles. Commencez avec
    le minimum — `id` et `setup` — puis ajoutez des adaptateurs selon vos besoins.

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

    Pour les canaux qui acceptent à la fois les clés DM canoniques de premier niveau et les clés imbriquées héritées, utilisez les assistants de `plugin-sdk/channel-config-helpers` : `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` et `normalizeChannelDmPolicy` gardent les valeurs locales au compte prioritaires sur les valeurs racine héritées. Associez le même résolveur à la réparation doctor via `normalizeLegacyDmAliases` afin que l’exécution et la migration lisent le même contrat.

    <Accordion title="Ce que createChatChannelPlugin fait pour vous">
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous passez
      des options déclaratives et le constructeur les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée définie depuis les champs de configuration |
      | `pairing.text` | Flux d’appariement DM textuel avec échange de code |
      | `threading` | Résolveur de mode de réponse (fixe, à portée de compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez aussi passer des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle complet.

      Les adaptateurs sortants bruts peuvent définir une fonction `chunker(text, limit, ctx)`.
      Le `ctx.formatting` facultatif transporte les décisions de formatage au moment de la livraison,
      comme `maxLinesPerMessage`; appliquez-le avant l’envoi afin que les fils de réponse
      et les limites des fragments soient résolus une seule fois par la livraison sortante partagée.
      Les contextes d’envoi incluent aussi `replyToIdSource` (`implicit` ou `explicit`)
      lorsqu’une cible de réponse native a été résolue, afin que les assistants de charge utile puissent préserver
      les balises de réponse explicites sans consommer un emplacement de réponse implicite à usage unique.
    </Accordion>

  </Step>

  <Step title="Câbler le point d’entrée">
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

    Placez les descripteurs CLI appartenant au canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer l’environnement d’exécution complet du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes.
    Gardez `registerFull(...)` pour le travail propre à l’environnement d’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC du Gateway, utilisez un
    préfixe propre au Plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
    vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes
    les options.

  </Step>

  <Step title="Ajouter une entrée de configuration">
    Créez `setup-entry.ts` pour un chargement léger pendant l’intégration :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci à la place de l’entrée complète lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code d’exécution lourd pendant les flux de configuration.
    Consultez [Configuration et paramètres](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux d’espace de travail intégrés qui séparent les exports compatibles avec la configuration dans des modules annexes
    peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont également besoin d’un
    setter d’environnement d’exécution explicite au moment de la configuration.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre Plugin doit recevoir les messages de la plateforme et les transmettre à
    OpenClaw. Le modèle habituel est un Webhook qui vérifie la requête et
    la distribue via le gestionnaire entrant de votre canal :

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
      La gestion des messages entrants est propre à chaque canal. Chaque Plugin de canal possède
      son propre pipeline entrant. Consultez les Plugins de canal intégrés
      (par exemple le package de Plugin Microsoft Teams ou Google Chat) pour des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

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

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fils" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, limités au compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de messages" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte des actions
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Assistants d’environnement d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
  <Card title="Noyau de tour de canal" icon="bolt" href="/fr/plugins/sdk-channel-turn">
    Cycle de vie entrant partagé du tour : ingérer, résoudre, enregistrer, distribuer, finaliser
  </Card>
</CardGroup>

<Note>
Certaines interfaces d’assistance intégrées existent encore pour la maintenance et
la compatibilité des Plugins intégrés. Elles ne constituent pas le modèle recommandé pour les nouveaux Plugins de canal ;
privilégiez les sous-chemins génériques canal/configuration/réponse/environnement d’exécution de la surface SDK
commune, sauf si vous maintenez directement cette famille de Plugins intégrés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — si votre Plugin fournit également des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports de sous-chemins
- [Tests du SDK](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma complet du manifeste

## Voir aussi

- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
