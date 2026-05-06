---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface de l’adaptateur ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Création de plugins de canal
x-i18n:
    generated_at: "2026-05-06T07:33:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ce guide explique comment créer un plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous disposerez d’un canal fonctionnel avec sécurité des DM,
appairage, fils de réponses et messagerie sortante.

<Info>
  Si vous n’avez encore jamais créé de plugin OpenClaw, lisez d’abord
  [Premiers pas](/fr/plugins/building-plugins) pour connaître la structure de paquet
  de base et la configuration du manifeste.
</Info>

## Fonctionnement des plugins de canal

Les plugins de canal n’ont pas besoin de leurs propres outils d’envoi, de modification ou de réaction. OpenClaw conserve un
outil `message` partagé dans le noyau. Votre plugin prend en charge :

- **Configuration** - résolution de compte et assistant de configuration
- **Sécurité** - politique de DM et listes d’autorisation
- **Appairage** - flux d’approbation par DM
- **Grammaire de session** - correspondance entre les identifiants de conversation propres au fournisseur et les discussions de base, les identifiants de fil, et les solutions de repli parentes
- **Sortant** - envoi de texte, de médias et de sondages vers la plateforme
- **Fils** - organisation des réponses en fils
- **Saisie Heartbeat** - signaux facultatifs de saisie/occupation pour les cibles de livraison Heartbeat

Le noyau prend en charge l’outil de message partagé, le câblage du prompt, la forme externe de la clé de session,
la comptabilité générique `:thread:`, et la distribution.

Les nouveaux plugins de canal doivent aussi exposer un adaptateur `message` avec
`defineChannelMessageAdapter` depuis `openclaw/plugin-sdk/channel-message`. L’adaptateur
déclare les capacités d’envoi final durable réellement prises en charge par le transport natif
et fait pointer les envois de texte/médias vers les mêmes fonctions de transport que
l’ancien adaptateur `outbound`. Ne déclarez une capacité que lorsqu’un test de contrat
prouve l’effet de bord natif et le reçu renvoyé.
Pour le contrat d’API complet, les exemples, la matrice des capacités, les règles de reçu, la finalisation de l’aperçu en direct, la politique d’accusé de réception, les tests et la table de migration, consultez
[API de message de canal](/fr/plugins/sdk-channel-message).
Si l’adaptateur `outbound` existant possède déjà les bonnes méthodes d’envoi et
métadonnées de capacité, utilisez `createChannelMessageAdapterFromOutbound(...)` pour
dériver l’adaptateur `message` au lieu d’écrire manuellement un autre pont.
Les envois de l’adaptateur doivent renvoyer des valeurs `MessageReceipt`. Quand du code de compatibilité
a encore besoin d’identifiants anciens, dérivez-les avec `listMessageReceiptPlatformIds(...)`
ou `resolveMessageReceiptPrimaryId(...)` au lieu de conserver des champs
`messageIds` parallèles dans le nouveau code de cycle de vie.
Les canaux compatibles avec l’aperçu doivent aussi déclarer `message.live.capabilities` avec
le cycle de vie en direct exact qu’ils prennent en charge, comme `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` ou
`quietFinalization`. Les canaux qui finalisent un brouillon d’aperçu sur place doivent
aussi déclarer `message.live.finalizer.capabilities`, comme `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` et
`retainOnAmbiguousFailure`, et router la logique d’exécution via
`defineFinalizableLivePreviewAdapter(...)` ainsi que
`deliverWithFinalizableLivePreviewAdapter(...)`. Gardez ces capacités validées
par des tests `verifyChannelMessageLiveCapabilityAdapterProofs(...)` et
`verifyChannelMessageLiveFinalizerProofs(...)` afin que les comportements d’aperçu natif,
de progression, de modification, de repli/rétention, de nettoyage et de reçu ne puissent pas dériver
silencieusement.
Les récepteurs entrants qui diffèrent les accusés de réception de la plateforme doivent déclarer
`message.receive.defaultAckPolicy` et `supportedAckPolicies` au lieu de masquer
le moment de l’accusé de réception dans un état local au moniteur. Couvrez chaque politique déclarée avec
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Les anciens assistants de réponse/tour comme `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` et `recordInboundSessionAndDispatchReply`
restent disponibles pour les distributeurs de compatibilité. N’utilisez pas ces noms pour du nouveau
code de canal ; les nouveaux plugins doivent commencer avec l’adaptateur `message`, les reçus, et
les assistants de cycle de vie de réception/envoi dans `openclaw/plugin-sdk/channel-message`.

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses entrantes, exposez
`heartbeat.sendTyping(...)` sur le plugin de canal. Le noyau l’appelle avec la
cible de livraison Heartbeat résolue avant le démarrage de l’exécution du modèle Heartbeat et
utilise le cycle de vie partagé de maintien/nettoyage de l’indicateur de saisie. Ajoutez `heartbeat.clearTyping(...)`
lorsque la plateforme a besoin d’un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil de message qui portent des sources de médias, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le noyau utilise
cette liste explicite pour la normalisation des chemins de bac à sable et la politique d’accès aux médias sortants,
afin que les plugins n’aient pas besoin de cas particuliers dans le noyau partagé pour les paramètres propres au fournisseur
comme les avatars, pièces jointes ou images de couverture.
Préférez renvoyer une carte indexée par action comme
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que des actions sans lien n’héritent pas
des arguments de médias d’une autre action. Un tableau plat fonctionne encore pour les paramètres
intentionnellement partagés par toutes les actions exposées.

Si votre canal a besoin d’une mise en forme propre au fournisseur pour `message(action="send")`,
préférez `actions.prepareSendPayload(...)`. Placez les cartes, blocs, intégrations ou
autres données durables natives sous `payload.channelData.<channel>` et laissez le noyau effectuer
l’envoi réel via l’adaptateur sortant/message. Utilisez
`actions.handleAction(...)` pour l’envoi uniquement comme repli de compatibilité pour les
charges utiles qui ne peuvent pas être sérialisées et réessayées.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, gardez cette analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. C’est le
crochet canonique pour mapper `rawId` vers l’identifiant de conversation de base, l’identifiant de fil
facultatif, le `baseConversationId` explicite et tout `parentConversationCandidates`.
Quand vous renvoyez `parentConversationCandidates`, conservez-les ordonnés du parent
le plus étroit à la conversation la plus large/de base.

Utilisez `openclaw/plugin-sdk/channel-route` lorsque le code de plugin doit normaliser
des champs de type route, comparer un fil enfant à sa route parente, ou construire une
clé de déduplication stable depuis `{ channel, to, accountId, threadId }`. L’assistant
normalise les identifiants de fil numériques de la même façon que le noyau, donc les plugins doivent le préférer
aux comparaisons ponctuelles `String(threadId)`.
Les plugins avec une grammaire de cible propre au fournisseur peuvent injecter leur analyseur dans
`resolveChannelRouteTargetWithParser(...)` et obtenir tout de même la même forme de cible de route
et les mêmes sémantiques de repli de fil que celles utilisées par le noyau.

Les plugins groupés qui ont besoin de la même analyse avant le démarrage du registre de canaux
peuvent aussi exposer un fichier de premier niveau `session-key-api.ts` avec un export
`resolveSessionConversation(...)` correspondant. Le noyau utilise cette surface compatible avec l’amorçage
uniquement lorsque le registre de plugins d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme
repli de compatibilité ancien lorsqu’un plugin n’a besoin que de replis parents au-dessus
de l’identifiant générique/brut. Si les deux crochets existent, le noyau utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se replie sur
`resolveParentConversationCandidates(...)` que lorsque le crochet canonique
les omet.

## Approbations et capacités des canaux

La plupart des plugins de canal n’ont pas besoin de code propre aux approbations.

- Le noyau possède `/approve` dans le même chat, les charges utiles partagées des boutons d’approbation et la remise de repli générique.
- Préférez un seul objet `approvalCapability` sur le plugin de canal lorsque le canal nécessite un comportement propre aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de remise/native/render/auth d’approbation sur `approvalCapability`.
- `plugin.auth` sert uniquement à la connexion/déconnexion ; le noyau ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont l’interface canonique d’authentification des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification des approbations dans le même chat.
- Si votre canal expose des approbations d’exécution natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface d’initiation/du client natif lorsqu’il diffère de l’authentification d’approbation dans le même chat. Le noyau utilise ce hook propre à l’exécution pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations d’exécution natives et inclure le canal dans les conseils de repli vers le client natif. `createApproverRestrictedNativeApprovalCapability(...)` renseigne cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement de cycle de vie des charges utiles propre au canal, comme masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la remise.
- Utilisez `approvalCapability.delivery` uniquement pour le routage des approbations natives ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native détenus par le canal. Gardez-le paresseux sur les points d’entrée chauds du canal avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en laissant le noyau assembler le cycle de vie de l’approbation.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les réglages de configuration exacts nécessaires pour activer les approbations d’exécution natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent afficher des chemins limités au compte, comme `channels.<channel>.accounts.<id>.execApprovals.*`, plutôt que des valeurs par défaut de premier niveau.
- Si un canal peut déduire des identités de MP stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans le même chat sans ajouter de logique noyau propre aux approbations.
- Si un canal a besoin d’une remise d’approbation native, gardez le code du canal centré sur la normalisation des cibles et les faits de transport/présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits propres au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le noyau puisse assembler le gestionnaire et posséder le filtrage des demandes, le routage, la déduplication, l’expiration, l’abonnement au Gateway et les avis de routage ailleurs. `nativeRuntime` est divisé en quelques interfaces plus petites :
- `createChannelNativeOriginTargetResolver` utilise par défaut le moteur partagé de correspondance des routes de canal pour les cibles `{ to, accountId, threadId }`. Passez `targetsMatch` uniquement lorsqu’un canal possède des règles d’équivalence propres au fournisseur, comme la correspondance par préfixe d’horodatage Slack.
- Passez `normalizeTargetForMatch` à `createChannelNativeOriginTargetResolver` lorsque le canal doit canoniser les identifiants fournisseur avant l’exécution du moteur de correspondance de routes par défaut ou d’un rappel `targetsMatch` personnalisé, tout en préservant la cible d’origine pour la remise. Utilisez `normalizeTarget` uniquement lorsque la cible de remise résolue elle-même doit être canonisée.
- `availability` - indique si le compte est configuré et si une demande doit être traitée
- `presentation` - mappe le modèle de vue d’approbation partagé vers des charges utiles natives en attente/résolues/expirées ou des actions finales
- `transport` - prépare les cibles et envoie/met à jour/supprime les messages d’approbation natifs
- `interactions` - hooks facultatifs de liaison/déliaison/effacement d’action pour les boutons ou réactions natifs
- `observe` - hooks facultatifs de diagnostic de remise
- Si le canal a besoin d’objets détenus par l’exécution, comme un client, un jeton, une application Bolt ou un récepteur webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au noyau d’amorcer des gestionnaires pilotés par les capacités depuis l’état de démarrage du canal sans ajouter de code d’enveloppe propre aux approbations.
- Utilisez les primitives de plus bas niveau `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` uniquement lorsque l’interface pilotée par les capacités n’est pas encore assez expressive.
- Les canaux d’approbation native doivent router à la fois `accountId` et `approvalKind` via ces helpers. `accountId` maintient la politique d’approbation multi-compte limitée au bon compte de bot, et `approvalKind` garde le comportement des approbations d’exécution et de plugin disponible pour le canal sans branches codées en dur dans le noyau.
- Le noyau possède désormais aussi les avis de reroutage d’approbation. Les plugins de canal ne doivent pas envoyer leurs propres messages de suivi « approbation envoyée en MP / dans un autre canal » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage d’origine et de MP d’approbateur exact via les helpers de capacité d’approbation partagés, puis laissez le noyau agréger les remises réelles avant de publier un avis dans le chat initiateur.
- Préservez le type de l’identifiant d’approbation remis de bout en bout. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation d’exécution ou de plugin depuis l’état local du canal.
- Différents types d’approbation peuvent volontairement exposer différentes surfaces natives.
  Exemples groupés actuels :
  - Slack garde le routage d’approbation native disponible pour les identifiants d’exécution comme de plugin.
  - Matrix conserve le même routage natif MP/canal et la même UX de réaction pour les approbations d’exécution
    et de plugin, tout en permettant encore à l’authentification de différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme enveloppe de compatibilité, mais le nouveau code doit privilégier le constructeur de capacité et exposer `approvalCapability` sur le plugin.

Pour les points d’entrée chauds de canal, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez
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
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de configuration sûrs à l’exécution :
  adaptateurs de correctifs de configuration sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les constructeurs délégués de
  proxy de configuration
- `openclaw/plugin-sdk/setup-adapter-runtime` est l’interface étroite d’adaptateur sensible à l’environnement
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration d’installation facultative
  ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une authentification pilotée par l’environnement et que les flux
génériques de démarrage/configuration doivent connaître ces noms d’environnement avant le chargement de l’exécution,
déclarez-les dans le manifeste du plugin avec `channelEnvVars`. Gardez les `envVars` d’exécution du canal ou les
constantes locales uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou des analyses SecretRef avant le démarrage
de l’exécution du plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans les chemins de commandes en lecture seule
et doit retourner les métadonnées du canal, l’adaptateur de configuration sûr pour la configuration, l’adaptateur de statut
et les métadonnées de cible secrète du canal nécessaires à ces résumés. Ne démarrez pas de clients, d’écouteurs ni
d’exécutions de transport depuis l’entrée de configuration.

Gardez également étroit le chemin d’importation de l’entrée principale du canal. La découverte peut évaluer l’entrée
et le module du plugin de canal pour enregistrer les capacités sans activer
le canal. Des fichiers comme `channel-plugin-api.ts` doivent exporter l’objet plugin de canal sans importer
d’assistants de configuration, de clients de transport, d’écouteurs de socket,
de lanceurs de sous-processus ou de modules de démarrage de service. Placez ces éléments d’exécution
dans des modules chargés depuis `registerFull(...)`, des setters d’exécution ou des adaptateurs de capacité
paresseux.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez l’interface plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  helpers partagés de configuration plus lourds, comme
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce plugin » dans les surfaces de configuration,
préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/assistant généré échoue fermé sur les écritures
de configuration et la finalisation, et réutilise le même message d’installation requise dans la validation,
la finalisation et le texte de lien vers la documentation.

Pour les autres chemins chauds de canal, préférez les helpers étroits aux surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-compte et
  le repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour la route/enveloppe entrante et
  le câblage d’enregistrement et de distribution
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse et la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que les délégués
  d’identité/envoi sortants et la planification des charges utiles
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId`/`threadId` explicite ou récupérer la session `:thread:` courante
  après que la clé de session de base correspond encore. Les plugins fournisseur peuvent remplacer
  la précédence, le comportement de suffixe et la normalisation de l’identifiant de fil lorsque leur plateforme
  possède une sémantique de remise native par fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée de champs de charge utile
  agent/média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons/conflits et un contrat de configuration de commandes stable au repli

Les canaux uniquement d’authentification peuvent généralement s’arrêter au chemin par défaut : le noyau gère les approbations et le plugin expose simplement les capacités sortantes/d’authentification. Les canaux d’approbation native comme Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les helpers natifs partagés plutôt que de créer leur propre cycle de vie d’approbation.

## Politique de mention entrante

Gardez le traitement des mentions entrantes divisé en deux couches :

- collecte de preuves détenue par le plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du module de helpers entrants
plus large.

Bon choix pour la logique locale au plugin :

- détection de réponse au bot
- détection de bot cité
- vérifications de participation au fil
- exclusions de messages de service/système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Bon choix pour le helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation des mentions implicites
- contournement de commande
- décision finale de saut

Flux recommandé :

1. Calculez les faits de mention locaux.
2. Transmettez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
3. Utilisez `decision.effectiveWasMentioned`, `decision.shouldBypassMention` et `decision.shouldSkip` dans votre porte d’entrée.

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

`api.runtime.channel.mentions` expose les mêmes helpers de mention partagés pour les plugins de canal groupés qui dépendent déjà de l’injection d’exécution :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous avez seulement besoin de `implicitMentionKindWhen` et de `resolveInboundMentionDecision`, importez depuis `openclaw/plugin-sdk/channel-mention-gating` afin d’éviter de charger des helpers d’exécution d’entrée sans rapport.

Les anciens helpers `resolveMentionGating*` restent disponibles sur `openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Créez les fichiers de plugin standard. Le champ `channel` dans `package.json` est ce qui en fait un plugin de canal. Pour la surface complète des métadonnées de paquet, consultez [Configuration et paramétrage du Plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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

    `configSchema` valide `plugins.entries.acme-chat.config`. Utilisez-le pour les paramètres détenus par le plugin qui ne font pas partie de la configuration du compte de canal. `channelConfigs` valide `channels.acme-chat` et constitue la source de chemin froid utilisée par le schéma de configuration, la configuration initiale et les surfaces d’interface utilisateur avant le chargement de l’exécution du plugin.

  </Step>

  <Step title="Build the channel plugin object">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptateur facultatives. Commencez par le minimum, `id` et `setup`, puis ajoutez des adaptateurs selon vos besoins.

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

    Pour les canaux qui acceptent à la fois les clés DM de premier niveau canoniques et les anciennes clés imbriquées, utilisez les helpers de `plugin-sdk/channel-config-helpers` : `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` et `normalizeChannelDmPolicy` maintiennent les valeurs locales au compte avant les valeurs racines héritées. Associez le même résolveur à la réparation par le docteur via `normalizeLegacyDmAliases` afin que l’exécution et la migration lisent le même contrat.

    <Accordion title="What createChatChannelPlugin does for you">
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous transmettez des options déclaratives et le générateur les compose :

      | Option | Ce qu’elle connecte |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM délimité à partir des champs de configuration |
      | `pairing.text` | Flux d’appairage DM textuel avec échange de code |
      | `threading` | Résolveur de mode réponse-à (fixe, limité au compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (ID de messages) |

      Vous pouvez aussi transmettre des objets d’adaptateur bruts au lieu des options déclaratives si vous avez besoin d’un contrôle total.

      Les adaptateurs de sortie bruts peuvent définir une fonction `chunker(text, limit, ctx)`. Le champ facultatif `ctx.formatting` transporte les décisions de formatage au moment de la livraison, comme `maxLinesPerMessage`; appliquez-les avant l’envoi afin que le fil de réponse et les limites de fragments soient résolus une seule fois par la livraison sortante partagée. Les contextes d’envoi incluent aussi `replyToIdSource` (`implicit` ou `explicit`) lorsqu’une cible de réponse native a été résolue, ce qui permet aux helpers de charge utile de préserver les balises de réponse explicites sans consommer un emplacement de réponse implicite à usage unique.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    Placez les descripteurs CLI détenus par le canal dans `registerCliMetadata(...)` afin qu’OpenClaw puisse les afficher dans l’aide racine sans activer l’exécution complète du canal, tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes. Conservez `registerFull(...)` pour le travail réservé à l’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC Gateway, utilisez un préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours en `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Consultez [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les options.

  </Step>

  <Step title="Add a setup entry">
    Créez `setup-entry.ts` pour un chargement léger pendant l’intégration :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge cette entrée à la place de l’entrée complète lorsque le canal est désactivé ou non configuré. Cela évite de charger du code d’exécution lourd pendant les flux de configuration initiale.
    Consultez [Configuration et paramétrage](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux d’espace de travail groupés qui séparent les exports sûrs pour la configuration initiale dans des modules compagnons peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un setter d’exécution explicite au moment de la configuration initiale.

  </Step>

  <Step title="Handle inbound messages">
    Votre plugin doit recevoir les messages de la plateforme et les transférer à OpenClaw. Le modèle type est un Webhook qui vérifie la requête et la distribue via le gestionnaire d’entrée de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
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
      son propre pipeline entrant. Consultez les Plugins de canal groupés
      (par exemple le paquet du Plugin Microsoft Teams ou Google Chat) pour des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Écrivez des tests colocalisés dans `src/channel.test.ts`:

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
  <Card title="Threading options" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, limités à un compte ou personnalisés
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte d’actions
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/fr/plugins/sdk-channel-turn">
    Cycle de vie entrant partagé du tour de canal : ingestion, résolution, enregistrement, distribution, finalisation
  </Card>
</CardGroup>

<Note>
Certaines jonctions d’assistance groupées existent encore pour la maintenance et
la compatibilité des Plugins groupés. Elles ne constituent pas le modèle recommandé pour les nouveaux Plugins de canal ;
préférez les sous-chemins génériques de canal/configuration/réponse/runtime de la surface SDK commune,
sauf si vous maintenez directement cette famille de Plugins groupés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - si votre Plugin fournit aussi des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des importations de sous-chemins
- [Tests du SDK](/fr/plugins/sdk-testing) - utilitaires de test et tests de contrat
- [Manifeste du Plugin](/fr/plugins/manifest) - schéma complet du manifeste

## Connexe

- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
