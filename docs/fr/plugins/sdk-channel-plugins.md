---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Création de plugins de canal
x-i18n:
    generated_at: "2026-04-22T04:24:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Création de plugins de canal

Ce guide explique étape par étape comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous aurez un canal fonctionnel avec sécurité des DM,
appairage, fil de réponses et messagerie sortante.

<Info>
  Si vous n’avez encore jamais créé de Plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour la structure de package
  de base et la configuration du manifeste.
</Info>

## Fonctionnement des plugins de canal

Les plugins de canal n’ont pas besoin de leurs propres outils send/edit/react. OpenClaw conserve un
outil `message` partagé dans le cœur. Votre plugin possède :

- **Config** — résolution de compte et assistant de configuration
- **Sécurité** — politique DM et listes d’autorisation
- **Appairage** — flux d’approbation DM
- **Grammaire de session** — comment les identifiants de conversation spécifiques au provider sont mappés aux discussions de base, aux identifiants de fil et aux replis parents
- **Sortant** — envoi de texte, médias et sondages vers la plateforme
- **Fil de discussion** — manière dont les réponses sont organisées en fils

Le cœur possède l’outil de message partagé, le câblage des prompts, la forme externe de la clé de session,
la gestion générique de `:thread:` et la distribution.

Si votre canal ajoute des paramètres à l’outil de message qui transportent des sources média, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le cœur utilise
cette liste explicite pour la normalisation des chemins en sandbox et la politique d’accès aux médias sortants,
de sorte que les plugins n’ont pas besoin de cas particuliers dans le cœur partagé pour les paramètres
spécifiques au provider comme avatar, pièce jointe ou image de couverture.
Préférez renvoyer une map indexée par action telle que
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que des actions non liées n’héritent pas
des arguments média d’une autre action. Un tableau plat fonctionne encore pour les paramètres qui
sont volontairement partagés par chaque action exposée.

Si votre plateforme stocke une portée supplémentaire à l’intérieur des identifiants de conversation, gardez cette analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. C’est le hook canonique
pour mapper `rawId` vers l’identifiant de conversation de base, l’identifiant de fil facultatif,
`baseConversationId` explicite et tout `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, gardez-les ordonnés du
parent le plus étroit au parent le plus large / à la conversation de base.

Les plugins inclus qui ont besoin de la même analyse avant le démarrage du registre des canaux
peuvent aussi exposer un fichier `session-key-api.ts` de niveau supérieur avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre au démarrage
uniquement lorsque le registre de plugins d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme repli de compatibilité hérité lorsqu’un plugin n’a besoin que de replis parents en plus de l’identifiant générique/brut. Si les deux hooks existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se replie sur `resolveParentConversationCandidates(...)` que lorsque le hook canonique
les omet.

## Approbations et capacités de canal

La plupart des plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le cœur possède `/approve` dans la même discussion, les charges utiles partagées des boutons d’approbation et la distribution générique de repli.
- Préférez un seul objet `approvalCapability` sur le plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de distribution/native/rendu/auth des approbations dans `approvalCapability`.
- `plugin.auth` est limité à login/logout ; le cœur ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont la jonction canonique pour l’authentification des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité d’authentification des approbations dans la même discussion.
- Si votre canal expose des approbations exec natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface initiatrice / du client natif lorsqu’il diffère de l’authentification d’approbation dans la même discussion. Le cœur utilise ce hook spécifique à exec pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations exec natives, et inclure le canal dans les indications de repli du client natif. `createApproverRestrictedNativeApprovalCapability(...)` remplit cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement spécifique au canal dans le cycle de vie des charges utiles, comme masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la distribution.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation natif ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native détenus par le canal. Gardez-le paresseux sur les points d’entrée chauds du canal avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module runtime à la demande tout en permettant au cœur d’assembler le cycle de vie des approbations.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les clés de config exactes nécessaires pour activer les approbations exec natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à compte nommé doivent afficher des chemins avec portée de compte comme `channels.<channel>.accounts.<id>.execApprovals.*` au lieu des valeurs par défaut de niveau supérieur.
- Si un canal peut déduire des identités DM stables de type propriétaire à partir de la config existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même discussion sans ajouter de logique de cœur spécifique aux approbations.
- Si un canal a besoin d’une distribution d’approbation native, gardez le code du canal centré sur la normalisation des cibles ainsi que les faits de transport / présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le gestionnaire et posséder le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les avis de routage ailleurs. `nativeRuntime` est scindé en quelques jonctions plus petites :
- `availability` — si le compte est configuré et si une requête doit être traitée
- `presentation` — mapper le modèle de vue d’approbation partagé en charges utiles natives en attente / résolues / expirées ou en actions finales
- `transport` — préparer les cibles puis envoyer / mettre à jour / supprimer les messages d’approbation natifs
- `interactions` — hooks facultatifs bind/unbind/clear-action pour les boutons ou réactions natifs
- `observe` — hooks facultatifs de diagnostic de distribution
- Si le canal a besoin d’objets détenus par le runtime comme un client, un jeton, une application Bolt ou un récepteur de Webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte runtime permet au cœur d’initialiser des gestionnaires pilotés par capacités à partir de l’état de démarrage du canal sans ajouter de code d’enrobage spécifique aux approbations.
- N’utilisez les niveaux plus bas `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` que lorsque la jonction pilotée par capacités n’est pas encore assez expressive.
- Les canaux d’approbation native doivent acheminer à la fois `accountId` et `approvalKind` via ces helpers. `accountId` garde la portée de la politique d’approbation multi-comptes sur le bon compte bot, et `approvalKind` garde le comportement d’approbation exec vs plugin disponible pour le canal sans branches codées en dur dans le cœur.
- Le cœur possède désormais aussi les avis de reroutage des approbations. Les plugins de canal ne doivent pas envoyer leurs propres messages de suivi « l’approbation est partie en DM / vers un autre canal » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage exact de l’origine + du DM de l’approbateur via les helpers partagés de capacité d’approbation et laissez le cœur agréger les distributions réelles avant de publier un avis dans la discussion initiatrice.
- Préservez de bout en bout le type d’identifiant d’approbation distribué. Les clients natifs ne doivent pas
  deviner ou réécrire le routage d’approbation exec vs plugin à partir d’un état local au canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples inclus actuels :
  - Slack garde le routage d’approbation native disponible pour les identifiants exec et plugin.
  - Matrix garde le même routage natif DM/canal et la même UX par réactions pour les approbations exec
    et plugin, tout en permettant à l’authentification de différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme enveloppe de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le plugin.

Pour les points d’entrée chauds des canaux, préférez les sous-chemins runtime plus étroits lorsque vous n’avez besoin
que d’une seule partie de cette famille :

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
`openclaw/plugin-sdk/reply-reference`, et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
parapluie plus large.

Pour la configuration initiale en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de configuration initiale sûrs côté runtime :
  adaptateurs de patch de configuration import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les constructeurs délégués
  de proxy de configuration initiale
- `openclaw/plugin-sdk/setup-adapter-runtime` est la jonction d’adaptateur
  étroite sensible à l’environnement pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration initiale pour installation facultative ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration initiale ou une authentification pilotée par environnement, et que les flux génériques de démarrage / de config
doivent connaître ces noms de variables d’environnement avant le chargement du runtime, déclarez-les dans le
manifeste du plugin avec `channelEnvVars`. Gardez `envVars` du runtime du canal ou des constantes locales uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status`, ou dans les analyses SecretRef avant le démarrage du runtime du plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans les chemins de commande en lecture seule
et doit renvoyer les métadonnées du canal, l’adaptateur de config sûr pour la configuration initiale, l’adaptateur d’état, et les métadonnées de cible secrète du canal nécessaires à ces résumés. Ne démarrez pas de clients, d’écouteurs ou de runtimes de transport depuis le point d’entrée de configuration initiale.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, et
`splitSetupEntries`

- utilisez la jonction plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  helpers plus lourds et partagés de configuration / config tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce plugin » dans les surfaces de configuration,
préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur / l’assistant généré échoue en mode fermé sur les écritures de config et la finalisation, et réutilise le même message exigeant l’installation à travers la validation, la finalisation et le texte de lien vers la documentation.

Pour les autres chemins chauds des canaux, préférez les helpers étroits aux surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, et
  `openclaw/plugin-sdk/account-helpers` pour la config multi-comptes et
  le repli sur le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le routage / l’enveloppe en entrée et
  le câblage enregistrement-et-dispatch
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse / la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias plus les
  délégués d’identité / d’envoi sortants et la planification des charges utiles
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId` / `threadId` explicite ou récupérer la session `:thread:` courante
  après que la clé de session de base correspond encore. Les plugins de provider peuvent remplacer la
  priorité, le comportement de suffixe et la normalisation de l’identifiant de fil lorsque leur plateforme
  possède une sémantique native de distribution en fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée
  des champs de charge utile agent / média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des
  commandes personnalisées Telegram, la validation des doublons / conflits, et un contrat de config des commandes
  stable en repli

Les canaux uniquement auth peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le plugin expose seulement les capacités sortantes / auth. Les canaux d’approbation native comme Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les helpers natifs partagés au lieu de construire eux-mêmes leur cycle de vie d’approbation.

## Politique de mention entrante

Gardez la gestion des mentions entrantes séparée en deux couches :

- collecte des preuves détenue par le plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin de la
barre de helpers entrants plus large.

Bon choix pour la logique locale au plugin :

- détection de réponse au bot
- détection de citation du bot
- vérifications de participation à un fil
- exclusions des messages de service / système
- caches natifs de la plateforme nécessaires pour prouver la participation du bot

Bon choix pour le helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement des commandes
- décision finale d’ignorer

Flux recommandé :

1. Calculer les faits de mention locaux.
2. Transmettre ces faits à `resolveInboundMentionDecision({ facts, policy })`.
3. Utiliser `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, et `decision.shouldSkip` dans votre barrière d’entrée.

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
les plugins de canal inclus qui dépendent déjà de l’injection runtime :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous n’avez besoin que de `implicitMentionKindWhen` et
`resolveInboundMentionDecision`, importez-les depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des helpers
runtime entrants sans rapport.

Les anciens helpers `resolveMentionGating*` restent sur
`openclaw/plugin-sdk/channel-inbound` comme exports de compatibilité uniquement. Le nouveau code
doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Guide pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers standard du plugin. Le champ `channel` dans `package.json`
    est ce qui fait de celui-ci un plugin de canal. Pour la surface complète des métadonnées de package,
    consultez [Configuration et config des plugins](/fr/plugins/sdk-setup#openclaw-channel) :

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

  <Step title="Construire l’objet de plugin de canal">
    L’interface `ChannelPlugin` possède de nombreuses surfaces d’adaptation facultatives. Commencez avec
    le minimum — `id` et `setup` — puis ajoutez des adaptateurs selon vos besoins.

    Créez `src/channel.ts` :

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // votre client API de plateforme

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

      // Sécurité DM : qui peut envoyer un message au bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Appairage : flux d’approbation pour les nouveaux contacts DM
      pairing: {
        text: {
          idLabel: "nom d’utilisateur Acme Chat",
          message: "Envoyez ce code pour vérifier votre identité :",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Fil de discussion : comment les réponses sont distribuées
      threading: { topLevelReplyToMode: "reply" },

      // Sortant : envoyer des messages à la plateforme
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
      Au lieu d’implémenter manuellement des interfaces d’adaptateur bas niveau, vous transmettez
      des options déclaratives et le constructeur les compose :

      | Option | Ce qui est câblé |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée définie depuis les champs de config |
      | `pairing.text` | Flux d’appairage DM fondé sur du texte avec échange de code |
      | `threading` | Résolveur du mode reply-to (fixe, à portée de compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez aussi transmettre des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle total.
    </Accordion>

  </Step>

  <Step title="Relier le point d’entrée">
    Créez `index.ts` :

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

    Placez les descripteurs CLI détenus par le canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer le runtime complet du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes. Gardez `registerFull(...)` pour le travail réservé au runtime.
    Si `registerFull(...)` enregistre des méthodes RPC Gateway, utilisez un
    préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et
    se résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les
    options.

  </Step>

  <Step title="Ajouter un point d’entrée de configuration initiale">
    Créez `setup-entry.ts` pour un chargement léger pendant l’intégration initiale :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci à la place du point d’entrée complet lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code runtime lourd pendant les flux de configuration initiale.
    Consultez [Configuration et config](/fr/plugins/sdk-setup#setup-entry) pour les détails.

    Les canaux inclus d’espace de travail qui répartissent les exports sûrs pour la configuration initiale dans des modules
    sidecar peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter runtime explicite au moment de la configuration initiale.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir les messages depuis la plateforme et les transmettre à
    OpenClaw. Le schéma habituel est un Webhook qui vérifie la requête et
    la distribue via le gestionnaire entrant de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // authentification gérée par le plugin (vérifiez vous-même les signatures)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Votre gestionnaire entrant distribue le message à OpenClaw.
          // Le câblage exact dépend du SDK de votre plateforme —
          // consultez un exemple réel dans le package de Plugin inclus Microsoft Teams ou Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestion des messages entrants est spécifique au canal. Chaque plugin de canal possède
      son propre pipeline entrant. Consultez les plugins de canal inclus
      (par exemple le package de Plugin Microsoft Teams ou Google Chat) pour voir des schémas réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("résout le compte à partir de la config", () => {
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

      it("signale une config manquante", () => {
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
├── openclaw.plugin.json      # Manifeste avec schéma de config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exports publics (facultatif)
├── runtime-api.ts            # Exports runtime internes (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Client API de plateforme
    └── runtime.ts            # Stockage runtime (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fil de discussion" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, à portée de compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte d’actions
  </Card>
  <Card title="Résolution des cibles" icon="crosshair" href="/fr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers runtime" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
</CardGroup>

<Note>
Certaines jonctions de helpers inclus existent encore pour la maintenance et la
compatibilité des plugins inclus. Ce n’est pas le schéma recommandé pour les nouveaux plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface SDK
commune, sauf si vous maintenez directement cette famille de plugins inclus.
</Note>

## Étapes suivantes

- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — si votre plugin fournit aussi des modèles
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [SDK Testing](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Plugin Manifest](/fr/plugins/manifest) — schéma complet du manifeste
