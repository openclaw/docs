---
read_when:
    - Vous créez un nouveau plugin de canal de messagerie
    - Vous voulez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface de l’adaptateur ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Création de plugins de canal
x-i18n:
    generated_at: "2026-06-27T17:58:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ce guide explique comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous disposerez d’un canal fonctionnel avec la sécurité des DM,
l’appairage, le fil de réponses et la messagerie sortante.

<Info>
  Si vous n’avez encore créé aucun Plugin OpenClaw, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour la structure de paquet de base
  et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils d’envoi, de modification ou de réaction. OpenClaw conserve un
outil `message` partagé dans le cœur. Votre Plugin possède :

- **Configuration** - résolution de compte et assistant de configuration
- **Sécurité** - politique de DM et listes d’autorisation
- **Appairage** - flux d’approbation par DM
- **Grammaire de session** - correspondance entre les identifiants de conversation propres au fournisseur et les discussions de base, les identifiants de fil et les replis parents
- **Sortant** - envoi de texte, de médias et de sondages à la plateforme
- **Fils** - manière dont les réponses sont organisées en fils
- **Indication Heartbeat** - signaux facultatifs de saisie/occupation pour les cibles de livraison Heartbeat

Le cœur possède l’outil de message partagé, le câblage des prompts, la forme externe de la clé de session,
la comptabilité générique `:thread:` et la répartition.

Les nouveaux Plugins de canal doivent aussi exposer un adaptateur `message` avec
`defineChannelMessageAdapter` depuis `openclaw/plugin-sdk/channel-outbound`. L’adaptateur
déclare les capacités durables d’envoi final que le transport natif prend
réellement en charge et pointe les envois de texte/média vers les mêmes fonctions de transport que
l’ancien adaptateur `outbound`. Ne déclarez une capacité que lorsqu’un test de contrat
prouve l’effet de bord natif et le reçu renvoyé.
Pour le contrat d’API complet, les exemples, la matrice des capacités, les règles de reçu, la finalisation de l’aperçu en direct, la politique d’accusé de réception, les tests et le tableau de migration, consultez
[API sortante de canal](/fr/plugins/sdk-channel-outbound).
Si l’adaptateur `outbound` existant dispose déjà des bonnes méthodes d’envoi et des
métadonnées de capacités appropriées, utilisez `createChannelMessageAdapterFromOutbound(...)` pour
dériver l’adaptateur `message` au lieu d’écrire manuellement un autre pont.
Les envois d’adaptateur doivent renvoyer des valeurs `MessageReceipt`. Lorsque du code de compatibilité
a encore besoin d’anciens identifiants, dérivez-les avec `listMessageReceiptPlatformIds(...)`
ou `resolveMessageReceiptPrimaryId(...)` au lieu de conserver des champs
`messageIds` parallèles dans le nouveau code de cycle de vie.
Les canaux compatibles avec les aperçus doivent aussi déclarer `message.live.capabilities` avec
le cycle de vie exact qu’ils possèdent, comme `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming` ou
`quietFinalization`. Les canaux qui finalisent un brouillon d’aperçu sur place doivent
aussi déclarer `message.live.finalizer.capabilities`, comme `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt` et
`retainOnAmbiguousFailure`, et faire passer la logique d’exécution par
`defineFinalizableLivePreviewAdapter(...)` ainsi que
`deliverWithFinalizableLivePreviewAdapter(...)`. Gardez ces capacités couvertes
par des tests `verifyChannelMessageLiveCapabilityAdapterProofs(...)` et
`verifyChannelMessageLiveFinalizerProofs(...)` afin que les comportements natifs d’aperçu,
de progression, de modification, de repli/rétention, de nettoyage et de reçu ne puissent pas dériver
silencieusement.
Les récepteurs entrants qui diffèrent les accusés de réception de la plateforme doivent déclarer
`message.receive.defaultAckPolicy` et `supportedAckPolicies` au lieu de cacher
le moment de l’accusé de réception dans un état local au moniteur. Couvrez chaque politique déclarée avec
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Les anciens assistants de réponse comme `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` et `recordInboundSessionAndDispatchReply`
restent disponibles pour les répartiteurs de compatibilité. N’utilisez pas ces noms pour du nouveau
code de canal ; les nouveaux Plugins doivent commencer avec l’adaptateur `message`, les reçus et
les assistants de cycle de vie de réception/envoi sur `openclaw/plugin-sdk/channel-outbound`.

Les canaux qui migrent l’autorisation entrante peuvent utiliser le sous-chemin expérimental
`openclaw/plugin-sdk/channel-ingress-runtime` depuis les chemins de réception d’exécution.
Le sous-chemin conserve la recherche de plateforme et les effets de bord dans le Plugin, tout en
partageant la résolution de l’état des listes d’autorisation, les décisions de route/expéditeur/commande/événement/activation,
les diagnostics expurgés et la correspondance d’admission de tour. Gardez la normalisation
d’identité du Plugin dans le descripteur que vous transmettez au résolveur ; ne
sérialisez pas les valeurs de correspondance brutes depuis l’état ou la décision résolus. Consultez
[API d’entrée de canal](/fr/plugins/sdk-channel-ingress) pour la conception de l’API,
la limite de propriété et les attentes de test.

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses entrantes, exposez
`heartbeat.sendTyping(...)` sur le Plugin de canal. Le cœur l’appelle avec la
cible de livraison Heartbeat résolue avant le démarrage de l’exécution du modèle Heartbeat et
utilise le cycle de vie partagé de maintien/nettoyage de l’indicateur de saisie. Ajoutez `heartbeat.clearTyping(...)`
lorsque la plateforme a besoin d’un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil de message qui portent des sources média, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le cœur utilise
cette liste explicite pour la normalisation des chemins de bac à sable et la politique d’accès aux médias sortants,
afin que les Plugins n’aient pas besoin de cas spéciaux dans le cœur partagé pour les paramètres propres au fournisseur
d’avatar, de pièce jointe ou d’image de couverture.
Préférez renvoyer une carte indexée par action comme
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que les actions sans lien n’héritent pas
des arguments média d’une autre action. Un tableau plat fonctionne toujours pour les paramètres qui
sont intentionnellement partagés entre toutes les actions exposées.
Les canaux qui doivent exposer une URL publique temporaire pour une récupération média côté plateforme
peuvent utiliser `createHostedOutboundMediaStore(...)` depuis
`openclaw/plugin-sdk/outbound-media` avec les magasins d’état du Plugin. Gardez l’analyse des routes
de plateforme et l’application des jetons dans le Plugin de canal ; l’assistant partagé
ne possède que le chargement des médias, les métadonnées d’expiration, les lignes de fragments et le nettoyage.

Si votre canal a besoin d’une mise en forme propre au fournisseur pour `message(action="send")`,
préférez `actions.prepareSendPayload(...)`. Placez les cartes natives, blocs, intégrations ou
autres données durables sous `payload.channelData.<channel>` et laissez le cœur effectuer
l’envoi réel via l’adaptateur sortant/message. Utilisez
`actions.handleAction(...)` pour l’envoi uniquement comme repli de compatibilité pour
les charges utiles qui ne peuvent pas être sérialisées et retentées.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, gardez cette analyse
dans le Plugin avec `messaging.resolveSessionConversation(...)`. C’est le
point d’extension canonique pour faire correspondre `rawId` à l’identifiant de conversation de base, à l’identifiant de fil
facultatif, à `baseConversationId` explicite et à d’éventuels `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, conservez-les dans l’ordre du parent
le plus étroit vers la conversation la plus large/de base.

Utilisez `openclaw/plugin-sdk/channel-route` lorsque le code du Plugin doit normaliser
des champs de type route, comparer un fil enfant à sa route parente ou construire une
clé de déduplication stable à partir de `{ channel, to, accountId, threadId }`. L’assistant
normalise les identifiants de fil numériques de la même manière que le cœur, donc les Plugins doivent le préférer
aux comparaisons ad hoc `String(threadId)`.
Les Plugins avec une grammaire de cible propre au fournisseur doivent exposer
`messaging.resolveOutboundSessionRoute(...)` afin que le cœur obtienne l’identité de session
et de fil native du fournisseur sans utiliser de shims d’analyse.

Les Plugins groupés qui ont besoin de la même analyse avant le démarrage du registre de canaux
peuvent aussi exposer un fichier de niveau supérieur `session-key-api.ts` avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre pour l’amorçage
uniquement lorsque le registre de Plugins d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme
repli de compatibilité hérité lorsqu’un Plugin n’a besoin que de replis parents en plus
de l’identifiant générique/brut. Si les deux points d’extension existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se rabat sur
`resolveParentConversationCandidates(...)` que lorsque le point d’extension canonique
les omet.

## Approbations et capacités de canal

La plupart des Plugins de canal n’ont pas besoin de code propre aux approbations.

- Le cœur possède `/approve` dans la même discussion, les charges utiles des boutons d’approbation partagés et la livraison générique de repli.
- Préférez un objet `approvalCapability` unique sur le Plugin de canal lorsque le canal nécessite un comportement propre aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de livraison/native/render/auth des approbations sur `approvalCapability`.
- `plugin.auth` sert uniquement à la connexion/déconnexion ; le cœur ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont le point d’extension canonique pour l’authentification des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification d’approbation dans la même discussion.
- Si votre canal expose des approbations exec natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface d’initiation/du client natif lorsqu’il diffère de l’authentification d’approbation dans la même discussion. Le cœur utilise ce hook propre à exec pour distinguer `enabled` de `disabled`, décider si le canal d’initiation prend en charge les approbations exec natives et inclure le canal dans les consignes de repli du client natif. `createApproverRestrictedNativeApprovalCapability(...)` le renseigne pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour les comportements de cycle de vie des charges utiles propres au canal, comme masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage des approbations natives ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native appartenant au canal. Gardez-le paresseux sur les points d’entrée de canal très sollicités avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en permettant encore au cœur d’assembler le cycle de vie des approbations.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées plutôt que du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les paramètres de configuration exacts nécessaires pour activer les approbations exec natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent rendre des chemins limités au compte, comme `channels.<channel>.accounts.<id>.execApprovals.*`, au lieu des valeurs par défaut de premier niveau.
- Si un canal peut déduire des identités de DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même discussion sans ajouter de logique cœur propre aux approbations.
- Si une authentification d’approbation personnalisée autorise intentionnellement uniquement le repli dans la même discussion, retournez `markImplicitSameChatApprovalAuthorization({ authorized: true })` depuis `openclaw/plugin-sdk/approval-auth-runtime` ; sinon, le cœur traite le résultat comme une autorisation explicite de l’approbateur.
- Si un callback natif appartenant au canal résout directement des approbations, utilisez `isImplicitSameChatApprovalAuthorization(...)` avant la résolution afin que le repli implicite passe toujours par l’autorisation normale de l’acteur du canal.
- Si un canal a besoin d’une livraison d’approbation native, gardez le code du canal centré sur la normalisation de la cible et les faits de transport/présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits propres au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le gestionnaire et posséder le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement au Gateway et les avis de routage ailleurs. `nativeRuntime` est divisé en quelques points d’extension plus petits :
- Utilisez `createNativeApprovalChannelRouteGates` depuis `openclaw/plugin-sdk/approval-native-runtime` lorsqu’un canal prend en charge à la fois la livraison native depuis l’origine de session et les cibles explicites de transfert d’approbation. L’assistant centralise la sélection de configuration d’approbation, la gestion de `mode`, les filtres d’agent/session, la liaison de compte, la correspondance de cible de session et la correspondance de liste de cibles, tandis que les appelants restent propriétaires de l’identifiant de canal, du mode de transfert par défaut, de la recherche de compte, du contrôle d’activation du transport, de la normalisation de cible et de la résolution de cible de source de tour. Ne l’utilisez pas pour créer des valeurs par défaut de politique de canal appartenant au cœur ; transmettez explicitement le mode par défaut documenté du canal.
- `createChannelNativeOriginTargetResolver` utilise par défaut le comparateur partagé de route de canal pour les cibles `{ to, accountId, threadId }`. Transmettez `targetsMatch` uniquement lorsqu’un canal possède des règles d’équivalence propres au fournisseur, comme la correspondance par préfixe d’horodatage Slack.
- Transmettez `normalizeTargetForMatch` à `createChannelNativeOriginTargetResolver` lorsque le canal doit canoniser les identifiants fournisseur avant l’exécution du comparateur de route par défaut ou d’un callback `targetsMatch` personnalisé, tout en préservant la cible originale pour la livraison. Utilisez `normalizeTarget` uniquement lorsque la cible de livraison résolue elle-même doit être canonisée.
- `availability` - si le compte est configuré et si une requête doit être traitée
- `presentation` - mapper le modèle de vue d’approbation partagé vers des charges utiles natives en attente/résolues/expirées ou des actions finales
- `transport` - préparer les cibles et envoyer/mettre à jour/supprimer les messages d’approbation native
- `interactions` - hooks facultatifs de liaison/déliaison/effacement d’action pour boutons ou réactions natifs, plus un hook facultatif `cancelDelivered`. Implémentez `cancelDelivered` lorsque `deliverPending` enregistre un état en processus ou persistant (comme un magasin de cibles de réaction) afin que cet état puisse être libéré si l’arrêt d’un gestionnaire annule la livraison avant l’exécution de `bindPending` ou lorsque `bindPending` ne retourne aucun handle
- `observe` - hooks facultatifs de diagnostic de livraison
- Si le canal a besoin d’objets détenus par l’exécution, comme un client, un jeton, une application Bolt ou un récepteur de webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au cœur d’amorcer les gestionnaires pilotés par capacités à partir de l’état de démarrage du canal sans ajouter de colle de wrapper propre aux approbations.
- Utilisez les API de plus bas niveau `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` uniquement lorsque le point d’extension piloté par capacité n’est pas encore assez expressif.
- Les canaux d’approbation native doivent router à la fois `accountId` et `approvalKind` via ces assistants. `accountId` garde la politique d’approbation multicomptes limitée au bon compte de bot, et `approvalKind` garde le comportement des approbations exec vs Plugin disponible pour le canal sans branches codées en dur dans le cœur.
- Le cœur possède maintenant aussi les avis de reroutage d’approbation. Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi « l’approbation est partie en DM / dans un autre canal » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage précis de l’origine + DM d’approbateur via les assistants de capacité d’approbation partagée et laissez le cœur agréger les livraisons réelles avant de publier tout avis dans la discussion d’initiation.
- Préservez de bout en bout le type d’identifiant d’approbation livré. Les clients natifs ne doivent pas
  deviner ou réécrire le routage d’approbation exec vs Plugin à partir de l’état local du canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples groupés actuels :
  - Slack garde le routage d’approbation native disponible pour les identifiants exec et Plugin.
  - Matrix garde le même routage natif DM/canal et l’UX de réaction pour les approbations exec
    et Plugin, tout en laissant l’authentification différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le générateur de capacité et exposer `approvalCapability` sur le Plugin.

Pour les points d’entrée de canal très sollicités, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez besoin
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
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
parapluie plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration sûrs pour l’exécution :
  `createSetupTranslator`, les adaptateurs de patch de configuration sûrs à importer (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), la sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les générateurs délégués
  setup-proxy
- `openclaw/plugin-sdk/setup-runtime` inclut le point d’extension d’adaptateur sensible à l’environnement pour
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les générateurs de configuration d’installation facultative
  ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une authentification pilotée par l’environnement et que les flux génériques de démarrage/configuration
doivent connaître ces noms d’environnement avant le chargement de l’exécution, déclarez-les dans le
manifeste du Plugin avec `channelEnvVars`. Gardez les `envVars` d’exécution de canal ou les constantes locales
uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou
les analyses SecretRef avant le démarrage de l’exécution du Plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans les chemins de commandes
en lecture seule et doit retourner les métadonnées de canal, l’adaptateur de configuration sûr pour la configuration, l’adaptateur d’état
et les métadonnées de cible secrète de canal nécessaires à ces résumés. Ne démarrez pas
de clients, d’écouteurs ou d’exécutions de transport depuis l’entrée de configuration.

Gardez aussi le chemin d’import de l’entrée principale du canal étroit. La découverte peut évaluer l’entrée
et le module Plugin de canal pour enregistrer les capacités sans activer
le canal. Les fichiers comme `channel-plugin-api.ts` doivent exporter l’objet Plugin de canal
sans importer d’assistants de configuration, de clients de transport, d’écouteurs de socket,
de lanceurs de sous-processus ou de modules de démarrage de service. Placez ces éléments d’exécution
dans des modules chargés depuis `registerFull(...)`, des setters d’exécution ou des adaptateurs
de capacité paresseux.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez le point d’extension plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  assistants de configuration/config partagés plus lourds, comme
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce Plugin » dans les surfaces
de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/l’assistant généré
échoue fermé sur les écritures de configuration et la finalisation, et il réutilise
le même message d’installation requise dans la validation, la finalisation et le texte de lien
vers la documentation.

Pour les autres chemins de canal très sollicités, préférez les assistants étroits aux surfaces héritées
plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-comptes et
  le repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/channel-inbound` pour le routage/l’enveloppe entrants et
  le câblage d’enregistrement et de distribution
- `openclaw/plugin-sdk/channel-targets` pour les helpers d’analyse des cibles
- `openclaw/plugin-sdk/outbound-media` pour le chargement des médias et
  `openclaw/plugin-sdk/channel-outbound` pour les délégués d’identité/envoi sortants
  et la planification des charges utiles
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId`/`threadId` explicite ou récupérer la session `:thread:` actuelle
  après que la clé de session de base correspond encore. Les plugins de fournisseur peuvent remplacer
  la précédence, le comportement de suffixe et la normalisation de l’identifiant de fil lorsque leur plateforme
  dispose d’une sémantique native de livraison par fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée des champs de charge utile agent/média
  reste requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons/conflits et un contrat de configuration des commandes stable en cas de repli

Les canaux uniquement dédiés à l’authentification peuvent généralement s’en tenir au chemin par défaut : le cœur gère les approbations et le plugin expose simplement les capacités sortantes/d’authentification. Les canaux d’approbation natifs tels que Matrix, Slack, Telegram et les transports de discussion personnalisés doivent utiliser les helpers natifs partagés au lieu de créer leur propre cycle de vie d’approbation.

## Politique de mention entrante

Conservez la gestion des mentions entrantes séparée en deux couches :

- collecte de preuves détenue par le plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel de helpers entrants
plus large.

Adapté à la logique locale au plugin :

- détection de réponse au bot
- détection de bot cité
- vérifications de participation au fil
- exclusions de messages de service/système
- caches natifs de la plateforme nécessaires pour prouver la participation du bot

Adapté au helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation des mentions implicites
- contournement de commande
- décision finale d’ignorer

Flux recommandé :

1. Calculez les faits locaux de mention.
2. Transmettez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
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

`api.runtime.channel.mentions` expose les mêmes helpers de mention partagés pour
les plugins de canal intégrés qui dépendent déjà de l’injection d’exécution :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous avez seulement besoin de `implicitMentionKindWhen` et de
`resolveInboundMentionDecision`, importez depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des helpers d’exécution entrants
sans rapport.

Utilisez `resolveInboundMentionDecision({ facts, policy })` pour le filtrage des mentions.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Créez les fichiers de plugin standard. Le champ `channel` dans `package.json` est
    ce qui en fait un plugin de canal. Pour la surface complète des métadonnées de paquet,
    consultez [Configuration et paramétrage du Plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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
    les paramètres détenus par le plugin qui ne sont pas la configuration de compte du canal. `channelConfigs`
    valide `channels.acme-chat` et constitue la source du chemin froid utilisée par le schéma de configuration,
    la configuration initiale et les surfaces d’interface utilisateur avant le chargement de l’exécution du plugin.

  </Step>

  <Step title="Build the channel plugin object">
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

    Pour les canaux qui acceptent à la fois les clés de DM de premier niveau canoniques et les clés imbriquées héritées, utilisez les helpers de `plugin-sdk/channel-config-helpers` : `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` et `normalizeChannelDmPolicy` maintiennent les valeurs locales au compte avant les valeurs racine héritées. Associez le même résolveur à la réparation par doctor via `normalizeLegacyDmAliases` afin que l’exécution et la migration lisent le même contrat.

    <Accordion title="What createChatChannelPlugin does for you">
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous transmettez
      des options déclaratives et le builder les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM limité à la portée depuis les champs de configuration |
      | `pairing.text` | Flux d’appairage DM textuel avec échange de code |
      | `threading` | Résolveur de mode de réponse (fixe, limité au compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez également transmettre des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle complet.

      Les adaptateurs sortants bruts peuvent définir une fonction `chunker(text, limit, ctx)`.
      Le `ctx.formatting` facultatif transporte les décisions de formatage au moment de la livraison,
      telles que `maxLinesPerMessage` ; appliquez-les avant l’envoi afin que le chaînage des réponses
      et les limites de segments soient résolus une seule fois par la livraison sortante partagée.
      Les contextes d’envoi incluent également `replyToIdSource` (`implicit` ou `explicit`)
      lorsqu’une cible de réponse native a été résolue, afin que les helpers de charge utile puissent préserver
      les balises de réponse explicites sans consommer un emplacement de réponse implicite à usage unique.
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

    Placez les descripteurs CLI appartenant au canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer tout le runtime du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes. Gardez `registerFull(...)` pour le travail propre au runtime.
    Si `registerFull(...)` enregistre des méthodes RPC Gateway, utilisez un
    préfixe propre au Plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se
    résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes
    les options.

  </Step>

  <Step title="Add a setup entry">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge cette entrée au lieu de l’entrée complète lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code runtime lourd pendant les flux de configuration.
    Consultez [Configuration et setup](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux d’espace de travail groupés qui séparent les exports compatibles avec le setup dans des
    modules sidecar peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter runtime explicite au moment du setup.

  </Step>

  <Step title="Handle inbound messages">
    Votre Plugin doit recevoir les messages de la plateforme et les transmettre à
    OpenClaw. Le modèle typique est un Webhook qui vérifie la requête et
    la distribue via le gestionnaire entrant de votre canal :

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
      Le traitement des messages entrants est propre à chaque canal. Chaque Plugin de canal possède
      son propre pipeline entrant. Consultez les Plugins de canal groupés
      (par exemple le package de Plugin Microsoft Teams ou Google Chat) pour des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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

    Pour les helpers de test partagés, consultez [Tests](/fr/plugins/sdk-testing).

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
    Modes de réponse fixes, limités au compte ou personnalisés
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte des actions
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/fr/plugins/sdk-channel-inbound">
    Cycle de vie partagé des événements entrants : ingestion, résolution, enregistrement, distribution, finalisation
  </Card>
</CardGroup>

<Note>
Certaines surfaces de helper groupées existent encore pour la maintenance et
la compatibilité des Plugins groupés. Elles ne sont pas le modèle recommandé pour les nouveaux Plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface commune du SDK,
sauf si vous maintenez directement cette famille de Plugins groupés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - si votre Plugin fournit aussi des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des imports par sous-chemin
- [Tests du SDK](/fr/plugins/sdk-testing) - utilitaires de test et tests de contrat
- [Manifeste de Plugin](/fr/plugins/manifest) - schéma complet du manifeste

## Connexe

- [Setup du SDK de Plugin](/fr/plugins/sdk-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
