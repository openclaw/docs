---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface de l’adaptateur ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Créer des plugins de canal
x-i18n:
    generated_at: "2026-05-11T20:48:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ce guide explique comment créer un plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous aurez un canal fonctionnel avec sécurité
des DM, appairage, réponses en fil de discussion et messagerie sortante.

<Info>
  Si vous n’avez encore créé aucun plugin OpenClaw, commencez par lire
  [Bien démarrer](/fr/plugins/building-plugins) pour comprendre la structure de
  paquet de base et la configuration du manifeste.
</Info>

## Fonctionnement des plugins de canal

Les plugins de canal n’ont pas besoin de leurs propres outils d’envoi, de
modification ou de réaction. OpenClaw conserve un seul outil `message` partagé
dans le cœur. Votre plugin gère :

- **Configuration** - résolution du compte et assistant de configuration
- **Sécurité** - politique de DM et listes d’autorisation
- **Appairage** - flux d’approbation par DM
- **Grammaire de session** - façon dont les identifiants de conversation propres au fournisseur correspondent aux discussions de base, aux identifiants de fil et aux solutions de repli parentes
- **Sortant** - envoi de texte, de médias et de sondages à la plateforme
- **Fils de discussion** - façon dont les réponses sont organisées en fils
- **Saisie Heartbeat** - signaux facultatifs de saisie/occupation pour les cibles de livraison Heartbeat

Le cœur gère l’outil de message partagé, le câblage des prompts, la forme
externe de la clé de session, la comptabilité générique `:thread:` et la
répartition.

Les nouveaux plugins de canal doivent également exposer un adaptateur `message`
avec `defineChannelMessageAdapter` depuis `openclaw/plugin-sdk/channel-message`.
L’adaptateur déclare les capacités durables d’envoi final réellement prises en
charge par le transport natif et dirige les envois de texte/médias vers les mêmes
fonctions de transport que l’adaptateur `outbound` hérité. Ne déclarez une
capacité que lorsqu’un test de contrat prouve l’effet de bord natif et l’accusé
de réception retourné.
Pour le contrat d’API complet, les exemples, la matrice de capacités, les règles
d’accusé de réception, la finalisation d’aperçu en direct, la politique d’accusé
de réception entrant, les tests et la table de migration, consultez
[API des messages de canal](/fr/plugins/sdk-channel-message).
Si l’adaptateur `outbound` existant possède déjà les bonnes méthodes d’envoi et
les métadonnées de capacités appropriées, utilisez
`createChannelMessageAdapterFromOutbound(...)` pour dériver l’adaptateur
`message` au lieu d’écrire manuellement un autre pont.
Les envois d’adaptateur doivent retourner des valeurs `MessageReceipt`. Lorsque
le code de compatibilité a encore besoin d’identifiants hérités, dérivez-les
avec `listMessageReceiptPlatformIds(...)` ou
`resolveMessageReceiptPrimaryId(...)` au lieu de conserver des champs
`messageIds` parallèles dans le nouveau code de cycle de vie.
Les canaux compatibles avec les aperçus doivent également déclarer
`message.live.capabilities` avec le cycle de vie en direct exact qu’ils gèrent,
comme `draftPreview`, `previewFinalization`, `progressUpdates`,
`nativeStreaming` ou `quietFinalization`. Les canaux qui finalisent un aperçu de
brouillon sur place doivent également déclarer
`message.live.finalizer.capabilities`, comme `finalEdit`, `normalFallback`,
`discardPending`, `previewReceipt` et `retainOnAmbiguousFailure`, et router la
logique d’exécution via `defineFinalizableLivePreviewAdapter(...)` ainsi que
`deliverWithFinalizableLivePreviewAdapter(...)`. Gardez ces capacités adossées à
des tests `verifyChannelMessageLiveCapabilityAdapterProofs(...)` et
`verifyChannelMessageLiveFinalizerProofs(...)` afin que le comportement natif
d’aperçu, de progression, de modification, de repli/rétention, de nettoyage et
d’accusé de réception ne puisse pas dériver silencieusement.
Les récepteurs entrants qui différent les accusés de réception de la plateforme
doivent déclarer `message.receive.defaultAckPolicy` et `supportedAckPolicies` au
lieu de masquer le moment de l’accusé de réception dans un état local au
moniteur. Couvrez chaque politique déclarée avec
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Les helpers hérités de réponse/tour tels que `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` et `recordInboundSessionAndDispatchReply` restent
disponibles pour les répartiteurs de compatibilité. N’utilisez pas ces noms pour
le nouveau code de canal ; les nouveaux plugins doivent commencer avec
l’adaptateur `message`, les accusés de réception et les helpers de cycle de vie
de réception/envoi dans `openclaw/plugin-sdk/channel-message`.

Les canaux qui migrent l’autorisation entrante peuvent utiliser le sous-chemin
expérimental `openclaw/plugin-sdk/channel-ingress-runtime` depuis les chemins de
réception d’exécution. Le sous-chemin garde la recherche de plateforme et les
effets de bord dans le plugin, tout en partageant la résolution de l’état de la
liste d’autorisation, les décisions de route/expéditeur/commande/événement/activation,
les diagnostics expurgés et le mappage d’admission de tour. Conservez la
normalisation de l’identité du plugin dans le descripteur que vous transmettez au
résolveur ; ne sérialisez pas les valeurs de correspondance brutes issues de
l’état ou de la décision résolus. Consultez
[API d’ingress de canal](/fr/plugins/sdk-channel-ingress) pour la conception de
l’API, la frontière de propriété et les attentes de test.

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses
entrantes, exposez `heartbeat.sendTyping(...)` sur le plugin de canal. Le cœur
l’appelle avec la cible de livraison Heartbeat résolue avant le début de
l’exécution du modèle Heartbeat et utilise le cycle de vie partagé de maintien en
vie/nettoyage de la saisie. Ajoutez `heartbeat.clearTyping(...)` lorsque la
plateforme nécessite un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil de message qui transportent des
sources média, exposez ces noms de paramètres via
`describeMessageTool(...).mediaSourceParams`. Le cœur utilise cette liste
explicite pour la normalisation des chemins du bac à sable et la politique
d’accès aux médias sortants, afin que les plugins n’aient pas besoin de cas
spéciaux dans le cœur partagé pour les paramètres propres au fournisseur, comme
l’avatar, la pièce jointe ou l’image de couverture.
Préférez retourner une carte indexée par action, comme
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, afin que les actions sans
rapport n’héritent pas des arguments média d’une autre action. Un tableau plat
fonctionne toujours pour les paramètres intentionnellement partagés par toutes
les actions exposées.

Si votre canal nécessite une mise en forme propre au fournisseur pour
`message(action="send")`, préférez `actions.prepareSendPayload(...)`. Placez les
cartes natives, blocs, intégrations ou autres données durables sous
`payload.channelData.<channel>` et laissez le cœur effectuer l’envoi réel via
l’adaptateur outbound/message. Utilisez `actions.handleAction(...)` pour l’envoi
uniquement comme solution de compatibilité de repli pour les charges utiles qui
ne peuvent pas être sérialisées et réessayées.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de
conversation, conservez cette analyse dans le plugin avec
`messaging.resolveSessionConversation(...)`. C’est le hook canonique pour mapper
`rawId` vers l’identifiant de conversation de base, l’identifiant de fil
facultatif, le `baseConversationId` explicite et tous les
`parentConversationCandidates`. Lorsque vous retournez
`parentConversationCandidates`, gardez-les ordonnés du parent le plus précis
vers la conversation la plus large/de base.

Utilisez `openclaw/plugin-sdk/channel-route` lorsque le code du plugin doit
normaliser des champs de type route, comparer un fil enfant avec sa route
parente ou construire une clé de déduplication stable à partir de
`{ channel, to, accountId, threadId }`. Le helper normalise les identifiants de
fil numériques de la même façon que le cœur ; les plugins doivent donc le
préférer aux comparaisons ad hoc `String(threadId)`.
Les plugins avec une grammaire de cible propre au fournisseur peuvent injecter
leur analyseur dans `resolveChannelRouteTargetWithParser(...)` et obtenir
malgré tout la même forme de cible de route et les mêmes sémantiques de repli de
fil que celles utilisées par le cœur.

Les plugins groupés qui ont besoin de la même analyse avant le démarrage du
registre de canaux peuvent également exposer un fichier `session-key-api.ts` de
niveau supérieur avec un export `resolveSessionConversation(...)` correspondant.
Le cœur utilise cette surface sûre pour l’amorçage uniquement lorsque le registre
des plugins d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme
solution de compatibilité héritée lorsqu’un plugin a seulement besoin de replis
parents au-dessus de l’identifiant générique/brut. Si les deux hooks existent, le
cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se rabat sur
`resolveParentConversationCandidates(...)` que lorsque le hook canonique les
omet.

## Approbations et capacités de canal

La plupart des plugins de canal n’ont pas besoin de code propre aux approbations.

- Le noyau prend en charge `/approve` dans la même conversation, les payloads partagés des boutons d’approbation et la livraison de secours générique.
- Préférez un seul objet `approvalCapability` sur le plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les informations de livraison/native/render/auth d’approbation sur `approvalCapability`.
- `plugin.auth` sert uniquement à la connexion/déconnexion ; le noyau ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont le seam canonique d’authentification d’approbation.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification d’approbation dans la même conversation.
- Si votre canal expose des approbations d’exécution natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface initiatrice/du client natif lorsqu’il diffère de l’authentification d’approbation dans la même conversation. Le noyau utilise ce hook spécifique à l’exécution pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations d’exécution natives, et inclure le canal dans les indications de secours du client natif. `createApproverRestrictedNativeApprovalCapability(...)` renseigne cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour les comportements de cycle de vie des payloads spécifiques au canal, par exemple masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage des approbations natives ou la suppression du secours.
- Utilisez `approvalCapability.nativeRuntime` pour les informations d’approbation native détenues par le canal. Gardez-le paresseux sur les points d’entrée de canal chauds avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en laissant le noyau assembler le cycle de vie d’approbation.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de payloads d’approbation personnalisés au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les réglages de configuration exacts nécessaires pour activer les approbations d’exécution natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent rendre des chemins limités au compte, tels que `channels.<channel>.accounts.<id>.execApprovals.*`, plutôt que des valeurs par défaut de premier niveau.
- Si un canal peut inférer des identités de DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même conversation sans ajouter de logique noyau spécifique aux approbations.
- Si un canal a besoin de livrer des approbations natives, gardez le code du canal centré sur la normalisation de la cible et les informations de transport/présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les informations spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le noyau puisse assembler le gestionnaire et prendre en charge le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les avis de routage ailleurs. `nativeRuntime` est divisé en quelques seams plus petits :
- `createChannelNativeOriginTargetResolver` utilise par défaut le comparateur de routes de canal partagé pour les cibles `{ to, accountId, threadId }`. Passez `targetsMatch` uniquement lorsqu’un canal a des règles d’équivalence propres au fournisseur, comme la correspondance de préfixe d’horodatage Slack.
- Passez `normalizeTargetForMatch` à `createChannelNativeOriginTargetResolver` lorsque le canal doit canoniser les identifiants fournisseur avant l’exécution du comparateur de routes par défaut ou d’un callback `targetsMatch` personnalisé, tout en préservant la cible d’origine pour la livraison. Utilisez `normalizeTarget` uniquement lorsque la cible de livraison résolue elle-même doit être canonisée.
- `availability` - indique si le compte est configuré et si une requête doit être traitée
- `presentation` - mappe le modèle de vue d’approbation partagé vers des payloads natifs en attente/résolus/expirés ou vers des actions finales
- `transport` - prépare les cibles et envoie/met à jour/supprime les messages d’approbation natifs
- `interactions` - hooks facultatifs de liaison/déliaison/effacement d’action pour les boutons ou réactions natifs
- `observe` - hooks facultatifs de diagnostic de livraison
- Si le canal a besoin d’objets détenus par l’exécution, comme un client, un jeton, une application Bolt ou un récepteur webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au noyau d’amorcer des gestionnaires pilotés par les capacités depuis l’état de démarrage du canal sans ajouter de colle d’encapsulation spécifique aux approbations.
- Utilisez les éléments de plus bas niveau `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` uniquement lorsque le seam piloté par les capacités n’est pas encore assez expressif.
- Les canaux d’approbation native doivent router à la fois `accountId` et `approvalKind` via ces helpers. `accountId` garde la politique d’approbation multi-compte limitée au bon compte bot, et `approvalKind` garde le comportement des approbations exec et Plugin disponible pour le canal sans branches codées en dur dans le noyau.
- Le noyau prend désormais aussi en charge les avis de reroutage d’approbation. Les plugins de canal ne doivent pas envoyer leurs propres messages de suivi « l’approbation a été envoyée en DM / dans un autre canal » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage précis origine + DM d’approbateur via les helpers de capacité d’approbation partagés et laissez le noyau agréger les livraisons réelles avant de publier un éventuel avis dans la conversation initiatrice.
- Préservez de bout en bout le type d’identifiant d’approbation livré. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation exec contre Plugin à partir d’un état local au canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples groupés actuels :
  - Slack garde le routage d’approbation native disponible pour les identifiants exec et Plugin.
  - Matrix garde le même routage natif DM/canal et la même UX de réaction pour les approbations exec
    et Plugin, tout en permettant que l’authentification diffère selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le plugin.

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
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
parapluie plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de configuration sûrs pour l’exécution :
  adaptateurs de patch de configuration sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les constructeurs de proxy
  de configuration délégués
- `openclaw/plugin-sdk/setup-runtime` inclut le seam d’adaptateur sensible à l’environnement pour
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration
  d’installation facultative ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une authentification pilotée par l’environnement et que les flux génériques de démarrage/configuration
doivent connaître ces noms d’environnement avant le chargement de l’exécution, déclarez-les dans le
manifeste du plugin avec `channelEnvVars`. Gardez les `envVars` de l’exécution du canal ou les constantes locales
uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou les
analyses SecretRef avant le démarrage de l’exécution du plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans les chemins de commande
en lecture seule et doit retourner les métadonnées du canal, l’adaptateur de configuration sûr pour la configuration, l’adaptateur de statut
et les métadonnées de cible secrète de canal nécessaires à ces résumés. Ne démarrez pas
de clients, d’écouteurs ni d’exécutions de transport depuis l’entrée de configuration.

Gardez aussi étroit le chemin d’importation de l’entrée principale du canal. La découverte peut évaluer l’
entrée et le module du plugin de canal pour enregistrer les capacités sans activer
le canal. Les fichiers tels que `channel-plugin-api.ts` doivent exporter l’objet
plugin de canal sans importer d’assistants de configuration, de clients de transport, d’écouteurs de socket,
de lanceurs de sous-processus ni de modules de démarrage de service. Placez ces éléments d’exécution
dans des modules chargés depuis `registerFull(...)`, des setters d’exécution ou des adaptateurs de capacité
paresseux.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez le seam plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  helpers partagés de configuration/config plus lourds, tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce plugin » dans les surfaces
de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/assistant généré
échoue de façon fermée lors des écritures de configuration et de la finalisation, et réutilise
le même message d’installation requise pour la validation, la finalisation et le texte du lien
de documentation.

Pour les autres chemins de canal chauds, préférez les helpers étroits aux surfaces héritées
plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-compte et
  le secours vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour la route/enveloppe entrante et le câblage
  d’enregistrement puis distribution
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse et la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que les
  délégués d’identité/envoi sortants et la planification des payloads
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId`/`threadId` explicite ou récupérer la session `:thread:` courante
  après que la clé de session de base corresponde encore. Les plugins fournisseur peuvent remplacer
  la précédence, le comportement de suffixe et la normalisation de l’identifiant de fil lorsque leur plateforme
  a des sémantiques natives de livraison dans les fils.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée de champs de payload agent/média
  est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées
  Telegram, la validation des doublons/conflits et un contrat de configuration de commande
  stable en secours

Les canaux d’authentification seule peuvent généralement s’arrêter au chemin par défaut : le noyau gère les approbations et le plugin expose simplement des capacités sortantes/auth. Les canaux d’approbation native tels que Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les helpers natifs partagés au lieu de créer leur propre cycle de vie d’approbation.

## Politique de mention entrante

Gardez la gestion des mentions entrantes divisée en deux couches :

- collecte de preuves détenue par le plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel
d’helpers entrants plus large.

Bon candidat pour la logique locale au plugin :

- détection de réponse au bot
- détection de bot cité
- vérifications de participation au fil
- exclusions de messages de service/système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Bon candidat pour le helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement de commande
- décision finale d’ignorance

Flux recommandé :

1. Calculez les faits locaux de mention.
2. Transmettez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
3. Utilisez `decision.effectiveWasMentioned`, `decision.shouldBypassMention` et `decision.shouldSkip` dans votre porte d’entrée entrante.

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
les plugins de canal groupés qui dépendent déjà de l’injection runtime :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous avez uniquement besoin de `implicitMentionKindWhen` et de
`resolveInboundMentionDecision`, importez depuis
`openclaw/plugin-sdk/channel-mention-gating` afin d’éviter de charger des
assistants runtime entrants sans rapport.

Les anciens assistants `resolveMentionGating*` restent sur
`openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code
doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquet et manifeste">
    Créez les fichiers standard du plugin. Le champ `channel` dans `package.json`
    est ce qui en fait un plugin de canal. Pour toute la surface de métadonnées du paquet,
    consultez [Configuration de Plugin et config](/fr/plugins/sdk-setup#openclaw-channel) :

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
    les paramètres appartenant au plugin qui ne relèvent pas de la configuration du compte de canal. `channelConfigs`
    valide `channels.acme-chat` et constitue la source en chemin froid utilisée par le schéma de configuration,
    la configuration initiale et les surfaces d’interface utilisateur avant le chargement du runtime du plugin.

  </Step>

  <Step title="Créer l’objet du plugin de canal">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptateur facultatives. Commencez par
    le minimum - `id` et `setup` - puis ajoutez des adaptateurs selon vos besoins.

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

    Pour les canaux qui acceptent à la fois les clés DM canoniques de premier niveau et les anciennes clés imbriquées, utilisez les assistants de `plugin-sdk/channel-config-helpers` : `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` et `normalizeChannelDmPolicy` conservent les valeurs locales au compte avant les valeurs racine héritées. Associez le même résolveur à la réparation doctor via `normalizeLegacyDmAliases` afin que le runtime et la migration lisent le même contrat.

    <Accordion title="Ce que createChatChannelPlugin fait pour vous">
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous transmettez
      des options déclaratives et le générateur les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée depuis les champs de configuration |
      | `pairing.text` | Flux d’association DM textuel avec échange de code |
      | `threading` | Résolveur de mode de réponse (fixe, à portée du compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (ID de message) |

      Vous pouvez également transmettre des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle total.

      Les adaptateurs sortants bruts peuvent définir une fonction `chunker(text, limit, ctx)`.
      Le `ctx.formatting` facultatif transporte les décisions de formatage au moment de la livraison,
      comme `maxLinesPerMessage` ; appliquez-les avant l’envoi afin que le threading de réponse
      et les limites de fragments soient résolus une seule fois par la livraison sortante partagée.
      Les contextes d’envoi incluent également `replyToIdSource` (`implicit` ou `explicit`)
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
    puisse les afficher dans l’aide racine sans activer le runtime complet du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes. Conservez `registerFull(...)` pour le travail réservé au runtime.
    Si `registerFull(...)` enregistre des méthodes RPC de Gateway, utilisez un
    préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
    en `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes
    les options.

  </Step>

  <Step title="Ajouter une entrée de configuration initiale">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci à la place de l’entrée complète lorsque le canal est désactivé
    ou non configuré. Cela évite d’importer du code runtime lourd pendant les flux de configuration.
    Consultez [Configuration initiale et config](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux d’espace de travail groupés qui séparent les exports sûrs pour la configuration initiale dans des modules
    sidecar peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter runtime explicite au moment de la configuration initiale.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir des messages depuis la plateforme et les transmettre à
    OpenClaw. Le modèle habituel est un Webhook qui vérifie la requête et
    l’envoie via le gestionnaire entrant de votre canal :

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
      Le traitement des messages entrants est spécifique au canal. Chaque Plugin de canal possède
      son propre pipeline entrant. Consultez les Plugins de canal intégrés
      (par exemple le package Plugin Microsoft Teams ou Google Chat) pour des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
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
  <Card title="Options de fil de discussion" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, limités au compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte des actions
  </Card>
  <Card title="Résolution de la cible" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Assistants d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
  <Card title="Noyau de tour de canal" icon="bolt" href="/fr/plugins/sdk-channel-turn">
    Cycle de vie partagé des tours entrants : ingestion, résolution, enregistrement, distribution, finalisation
  </Card>
</CardGroup>

<Note>
Certaines interfaces d’assistance intégrées existent encore pour la maintenance des Plugins intégrés et
la compatibilité. Elles ne constituent pas le modèle recommandé pour les nouveaux Plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime depuis la surface commune du SDK,
sauf si vous maintenez directement cette famille de Plugins intégrés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - si votre Plugin fournit également des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des importations de sous-chemins
- [Tests du SDK](/fr/plugins/sdk-testing) - utilitaires de test et tests de contrat
- [Manifeste de Plugin](/fr/plugins/manifest) - schéma complet du manifeste

## Associé

- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Création de Plugins](/fr/plugins/building-plugins)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
