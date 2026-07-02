---
read_when:
    - Vous créez un nouveau plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un plugin de canal de messagerie pour OpenClaw
title: Créer des plugins de canal
x-i18n:
    generated_at: "2026-07-02T22:30:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ce guide explique comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous disposerez d’un canal fonctionnel avec
sécurité des DM, appairage, fils de réponse et messagerie sortante.

<Info>
  Si vous n’avez jamais créé de Plugin OpenClaw auparavant, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour connaître la structure de
  package de base et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils d’envoi, de
modification ou de réaction. OpenClaw conserve un outil `message` partagé dans
le noyau. Votre Plugin possède :

- **Configuration** - résolution du compte et assistant de configuration
- **Sécurité** - politique de DM et listes d’autorisation
- **Appairage** - flux d’approbation par DM
- **Grammaire de session** - manière dont les ids de conversation propres au fournisseur correspondent aux discussions de base, aux ids de fils et aux replis parents
- **Sortant** - envoi de texte, de médias et de sondages à la plateforme
- **Fils de discussion** - manière dont les réponses sont organisées en fils
- **Heartbeat typing** - signaux de saisie/occupation facultatifs pour les cibles de livraison Heartbeat

Le noyau possède l’outil de message partagé, le câblage des prompts, la forme
externe de la clé de session, la tenue de registre générique `:thread:` et la
distribution.

Les nouveaux Plugins de canal doivent aussi exposer un adaptateur `message` avec
`defineChannelMessageAdapter` depuis `openclaw/plugin-sdk/channel-outbound`.
L’adaptateur déclare les capacités durables d’envoi final que le transport natif
prend réellement en charge et dirige les envois de texte/médias vers les mêmes
fonctions de transport que l’ancien adaptateur `outbound`. Ne déclarez une
capacité que lorsqu’un test de contrat prouve l’effet de bord natif et le reçu
retourné.
Pour le contrat d’API complet, les exemples, la matrice de capacités, les règles
de reçu, la finalisation de l’aperçu en direct, la politique d’accusé de
réception, les tests et la table de migration, consultez
[API sortante de canal](/fr/plugins/sdk-channel-outbound).
Si l’adaptateur `outbound` existant possède déjà les bonnes méthodes d’envoi et
les métadonnées de capacité appropriées, utilisez
`createChannelMessageAdapterFromOutbound(...)` pour dériver l’adaptateur
`message` au lieu d’écrire manuellement un autre pont.
Les envois d’adaptateur doivent retourner des valeurs `MessageReceipt`. Lorsque
du code de compatibilité a encore besoin d’ids hérités, dérivez-les avec
`listMessageReceiptPlatformIds(...)` ou `resolveMessageReceiptPrimaryId(...)`
au lieu de conserver des champs `messageIds` parallèles dans le nouveau code de
cycle de vie.
Les canaux compatibles avec les aperçus doivent aussi déclarer
`message.live.capabilities` avec le cycle de vie en direct exact qu’ils possèdent,
comme `draftPreview`, `previewFinalization`, `progressUpdates`,
`nativeStreaming` ou `quietFinalization`. Les canaux qui finalisent un brouillon
d’aperçu sur place doivent aussi déclarer `message.live.finalizer.capabilities`,
comme `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt` et
`retainOnAmbiguousFailure`, et acheminer la logique d’exécution via
`defineFinalizableLivePreviewAdapter(...)` ainsi que
`deliverWithFinalizableLivePreviewAdapter(...)`. Gardez ces capacités couvertes
par des tests `verifyChannelMessageLiveCapabilityAdapterProofs(...)` et
`verifyChannelMessageLiveFinalizerProofs(...)` afin que les comportements natifs
d’aperçu, de progression, de modification, de repli/rétention, de nettoyage et
de reçu ne puissent pas dériver silencieusement.
Les récepteurs entrants qui différent les accusés de réception de la plateforme
doivent déclarer `message.receive.defaultAckPolicy` et `supportedAckPolicies`
au lieu de masquer le calendrier des accusés de réception dans un état local au
moniteur. Couvrez chaque politique déclarée avec
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Les anciens assistants de réponse comme `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` et `recordInboundSessionAndDispatchReply`
restent disponibles pour les répartiteurs de compatibilité. N’utilisez pas ces
noms pour le nouveau code de canal ; les nouveaux Plugins doivent commencer par
l’adaptateur `message`, les reçus et les assistants de cycle de vie de réception
et d’envoi sur `openclaw/plugin-sdk/channel-outbound`.

Les canaux qui migrent l’autorisation entrante peuvent utiliser le sous-chemin
expérimental `openclaw/plugin-sdk/channel-ingress-runtime` depuis les chemins de
réception d’exécution. Le sous-chemin conserve la recherche de plateforme et les
effets de bord dans le Plugin, tout en partageant la résolution de l’état de
liste d’autorisation, les décisions de route/expéditeur/commande/événement/
activation, les diagnostics expurgés et la correspondance d’admission des tours.
Gardez la normalisation de l’identité du Plugin dans le descripteur que vous
transmettez au résolveur ; ne sérialisez pas les valeurs de correspondance brutes
provenant de l’état ou de la décision résolus. Consultez
[API d’entrée de canal](/fr/plugins/sdk-channel-ingress) pour la conception de
l’API, la frontière de propriété et les attentes de test.

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses
entrantes, exposez `heartbeat.sendTyping(...)` sur le Plugin de canal. Le noyau
l’appelle avec la cible de livraison Heartbeat résolue avant le démarrage de
l’exécution du modèle Heartbeat et utilise le cycle de vie partagé de maintien en
vie/nettoyage de la saisie. Ajoutez `heartbeat.clearTyping(...)` lorsque la
plateforme a besoin d’un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil de message qui transportent des
sources média, exposez ces noms de paramètres via
`describeMessageTool(...).mediaSourceParams`. Le noyau utilise cette liste
explicite pour la normalisation des chemins de sandbox et la politique d’accès
aux médias sortants, afin que les Plugins n’aient pas besoin de cas spéciaux du
noyau partagé pour les paramètres d’avatar, de pièce jointe ou d’image de
couverture propres au fournisseur.
Préférez retourner une map indexée par action comme
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que les actions sans
rapport n’héritent pas des arguments média d’une autre action. Un tableau plat
fonctionne toujours pour les paramètres intentionnellement partagés entre toutes
les actions exposées.
Les canaux qui doivent exposer une URL publique temporaire pour une récupération
de média côté plateforme peuvent utiliser `createHostedOutboundMediaStore(...)`
depuis `openclaw/plugin-sdk/outbound-media` avec les magasins d’état du Plugin.
Gardez l’analyse des routes de plateforme et l’application des jetons dans le
Plugin de canal ; l’assistant partagé ne possède que le chargement des médias,
les métadonnées d’expiration, les lignes de chunks et le nettoyage.

Si votre canal a besoin d’une mise en forme propre au fournisseur pour
`message(action="send")`, préférez `actions.prepareSendPayload(...)`. Placez les
cartes natives, blocs, embeds ou autres données durables sous
`payload.channelData.<channel>` et laissez le noyau effectuer l’envoi réel via
l’adaptateur outbound/message. Utilisez `actions.handleAction(...)` pour l’envoi
uniquement comme repli de compatibilité pour les payloads qui ne peuvent pas
être sérialisés et réessayés.

Si votre plateforme stocke une portée supplémentaire dans les ids de
conversation, gardez cette analyse dans le Plugin avec
`messaging.resolveSessionConversation(...)`. C’est le hook canonique pour faire
correspondre `rawId` à l’id de conversation de base, à l’id de fil facultatif,
au `baseConversationId` explicite et à tous les `parentConversationCandidates`.
Lorsque vous retournez `parentConversationCandidates`, gardez-les ordonnés du
parent le plus étroit à la conversation la plus large/de base.

Utilisez `openclaw/plugin-sdk/channel-route` lorsque le code du Plugin doit
normaliser des champs de type route, comparer un fil enfant à sa route parente
ou construire une clé de déduplication stable à partir de
`{ channel, to, accountId, threadId }`. L’assistant normalise les ids de fil
numériques de la même manière que le noyau, donc les Plugins doivent le préférer
aux comparaisons ad hoc `String(threadId)`.
Les Plugins ayant une grammaire de cible propre au fournisseur doivent exposer
`messaging.resolveOutboundSessionRoute(...)` afin que le noyau obtienne
l’identité de session et de fil native du fournisseur sans utiliser de shims
d’analyse.

Les Plugins groupés qui ont besoin de la même analyse avant le démarrage du
registre de canaux peuvent aussi exposer un fichier de premier niveau
`session-key-api.ts` avec un export `resolveSessionConversation(...)`
correspondant. Le noyau utilise cette surface compatible avec l’amorçage
uniquement lorsque le registre de Plugins d’exécution n’est pas encore
disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme
repli de compatibilité hérité lorsqu’un Plugin n’a besoin que de replis parents
au-dessus de l’id générique/brut. Si les deux hooks existent, le noyau utilise
d’abord `resolveSessionConversation(...).parentConversationCandidates` et ne se
rabats sur `resolveParentConversationCandidates(...)` que lorsque le hook
canonique les omet.

## Approbations et capacités de canal

La plupart des Plugins de canal n’ont pas besoin de code spécifique aux
approbations.

- Le noyau possède `/approve` dans la même discussion, les charges utiles des boutons d’approbation partagés et la livraison de secours générique.
- Préférez un seul objet `approvalCapability` sur le plugin de canal lorsque le canal a besoin d’un comportement propre aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de livraison/native/rendu/auth d’approbation sur `approvalCapability`.
- `plugin.auth` sert uniquement à la connexion/déconnexion ; le noyau ne lit plus les hooks d’auth d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont la couture canonique d’auth d’approbation.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’auth d’approbation dans la même discussion. Gardez les approbateurs configurés disponibles pour `/approve` même lorsque la livraison native est désactivée ; utilisez plutôt l’état de surface d’initiation native pour les indications de livraison/configuration.
- Si votre canal expose des approbations exec natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface d’initiation/du client natif lorsqu’il diffère de l’auth d’approbation dans la même discussion. Le noyau utilise ce hook propre à exec pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations exec natives et inclure le canal dans les indications de secours du client natif. `createApproverRestrictedNativeApprovalCapability(...)` renseigne cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement de cycle de vie des charges utiles propre au canal, comme masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation natif ou la suppression du secours.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native possédés par le canal. Gardez-le paresseux sur les points d’entrée de canal chauds avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en permettant quand même au noyau d’assembler le cycle de vie d’approbation.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les options de configuration exactes nécessaires pour activer les approbations exec natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux avec comptes nommés doivent rendre des chemins limités au compte, comme `channels.<channel>.accounts.<id>.execApprovals.*`, au lieu des valeurs par défaut de premier niveau.
- Utilisez `approvalCapability.describePluginApprovalSetup` lorsque les indications d’échec d’approbation de plugin peuvent être affichées sans risque pour les échecs d’approbation de plugin sans route et par expiration. `createApproverRestrictedNativeApprovalCapability(...)` ne l’infère pas depuis `describeExecApprovalSetup` ; passez explicitement le même assistant uniquement lorsque les approbations de plugin et exec utilisent réellement la même configuration native.
- Si un canal peut inférer des identités de DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même discussion sans ajouter de logique noyau propre aux approbations.
- Si une auth d’approbation personnalisée autorise intentionnellement uniquement le secours dans la même discussion, retournez `markImplicitSameChatApprovalAuthorization({ authorized: true })` depuis `openclaw/plugin-sdk/approval-auth-runtime` ; sinon, le noyau traite le résultat comme une autorisation explicite d’approbateur.
- Si un callback natif possédé par un canal résout directement les approbations, utilisez `isImplicitSameChatApprovalAuthorization(...)` avant de résoudre afin que le secours implicite passe toujours par l’autorisation d’acteur normale du canal.
- Si un canal a besoin d’une livraison d’approbation native, gardez le code du canal concentré sur la normalisation de cible et les faits de transport/présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits propres au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le noyau puisse assembler le gestionnaire et posséder le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les notifications de routage ailleurs. `nativeRuntime` est divisé en quelques coutures plus petites :
- Utilisez `createNativeApprovalChannelRouteGates` depuis `openclaw/plugin-sdk/approval-native-runtime` lorsqu’un canal prend en charge à la fois la livraison native d’origine session et des cibles explicites de transfert d’approbation. L’assistant centralise la sélection de configuration d’approbation, la gestion de `mode`, les filtres agent/session, la liaison de compte, la correspondance de cible de session et la correspondance de liste de cibles, tandis que les appelants possèdent toujours l’id du canal, le mode de transfert par défaut, la recherche de compte, la vérification de transport activé, la normalisation de cible et la résolution de cible de source de tour. Ne l’utilisez pas pour créer des valeurs par défaut de politique de canal possédées par le noyau ; passez explicitement le mode par défaut documenté du canal.
- `createChannelNativeOriginTargetResolver` utilise par défaut le comparateur de routes de canal partagé pour les cibles `{ to, accountId, threadId }`. Passez `targetsMatch` uniquement lorsqu’un canal a des règles d’équivalence propres au fournisseur, comme la correspondance de préfixe d’horodatage Slack.
- Passez `normalizeTargetForMatch` à `createChannelNativeOriginTargetResolver` lorsque le canal doit canoniser les ids fournisseur avant l’exécution du comparateur de routes par défaut ou d’un callback `targetsMatch` personnalisé, tout en préservant la cible d’origine pour la livraison. Utilisez `normalizeTarget` uniquement lorsque la cible de livraison résolue elle-même doit être canonisée.
- `availability` - indique si le compte est configuré et si une requête doit être traitée
- `presentation` - mappe le modèle de vue d’approbation partagé vers des charges utiles natives en attente/résolues/expirées ou des actions finales
- `transport` - prépare les cibles et envoie/met à jour/supprime les messages d’approbation natifs
- `interactions` - hooks optionnels de liaison/déliaison/effacement d’action pour les boutons ou réactions natifs, plus un hook optionnel `cancelDelivered`. Implémentez `cancelDelivered` lorsque `deliverPending` enregistre un état en processus ou persistant (comme un magasin de cibles de réaction), afin que cet état puisse être libéré si un arrêt de gestionnaire annule la livraison avant l’exécution de `bindPending` ou lorsque `bindPending` ne retourne aucun handle
- `observe` - hooks optionnels de diagnostic de livraison
- Si le canal a besoin d’objets possédés par l’exécution, comme un client, un jeton, une app Bolt ou un récepteur de webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au noyau d’amorcer des gestionnaires pilotés par les capacités à partir de l’état de démarrage du canal sans ajouter de glue d’enveloppe propre aux approbations.
- Recourez au plus bas niveau `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` uniquement lorsque la couture pilotée par les capacités n’est pas encore assez expressive.
- Les canaux d’approbation natifs doivent acheminer à la fois `accountId` et `approvalKind` via ces assistants. `accountId` garde la politique d’approbation multi-compte limitée au bon compte de bot, et `approvalKind` garde le comportement d’approbation exec vs plugin disponible pour le canal sans branches codées en dur dans le noyau.
- Le noyau possède désormais aussi les notifications de réacheminement d’approbation. Les plugins de canal ne doivent pas envoyer leurs propres messages de suivi « l’approbation est partie en DM / dans un autre canal » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage précis origine + DM d’approbateur via les assistants de capacité d’approbation partagée et laissez le noyau agréger les livraisons réelles avant de publier une notification dans la discussion initiatrice.
- Préservez le type d’id d’approbation livré de bout en bout. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation exec vs plugin depuis l’état local du canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples groupés actuels :
  - Slack garde le routage d’approbation natif disponible pour les ids exec et plugin.
  - Matrix garde le même routage natif DM/canal et la même UX de réaction pour les approbations exec
    et plugin, tout en permettant toujours à l’auth de différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme enveloppe de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le plugin.

Pour les points d’entrée de canal chauds, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez besoin
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
générique plus large.

Pour la configuration spécifiquement :

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration sûrs pour l’exécution :
  `createSetupTranslator`, les adaptateurs de patch de configuration sûrs à importer (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), la sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les constructeurs
  de proxy de configuration déléguée
- `openclaw/plugin-sdk/setup-runtime` inclut la couture d’adaptateur consciente de l’environnement pour
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration
  d’installation optionnelle plus quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une auth pilotée par l’environnement et que les flux
génériques de démarrage/configuration doivent connaître ces noms d’environnement avant le chargement de l’exécution, déclarez-les dans le
manifeste du plugin avec `channelEnvVars`. Gardez les `envVars` d’exécution du canal ou les constantes locales
uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou
les analyses SecretRef avant le démarrage de l’exécution du plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans les chemins de commande en lecture seule
et doit retourner les métadonnées du canal, l’adaptateur de configuration sûr pour la configuration, l’adaptateur de statut
et les métadonnées de cible de secret de canal nécessaires à ces résumés. Ne démarrez pas
de clients, d’écouteurs ni d’exécutions de transport depuis l’entrée de configuration.

Gardez aussi le chemin d’importation de l’entrée principale du canal étroit. La découverte peut évaluer l’
entrée et le module du plugin de canal pour enregistrer des capacités sans activer
le canal. Les fichiers comme `channel-plugin-api.ts` doivent exporter l’objet de plugin de canal
sans importer d’assistants de configuration, clients de transport, écouteurs de socket,
lanceurs de sous-processus ou modules de démarrage de service. Placez ces pièces d’exécution
dans des modules chargés depuis `registerFull(...)`, des setters d’exécution ou des
adaptateurs de capacité paresseux.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez la couture plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  assistants partagés de configuration/config plus lourds comme
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce plugin » dans les surfaces de configuration,
préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/assistant généré
échoue fermé sur les écritures de config et la finalisation, et réutilise
le même message d’installation requise dans la validation, la finalisation et le texte de lien
vers la documentation.

Pour les autres chemins de canal chauds, préférez les assistants étroits aux surfaces héritées
plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-comptes et
  le repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/channel-inbound` pour la route/enveloppe entrante et
  le câblage d’enregistrement et de distribution
- `openclaw/plugin-sdk/channel-targets` pour les helpers d’analyse des cibles
- `openclaw/plugin-sdk/outbound-media` pour le chargement des médias et
  `openclaw/plugin-sdk/channel-outbound` pour les délégués d’identité/envoi sortants
  et la planification de payload
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit conserver un
  `replyToId`/`threadId` explicite ou récupérer la session `:thread:` actuelle
  après que la clé de session de base correspond toujours. Les plugins de fournisseur peuvent remplacer
  la priorité, le comportement des suffixes et la normalisation des identifiants de fil lorsque leur plateforme
  possède une sémantique native de livraison par fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée des champs
  de payload agent/média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées
  Telegram, la validation des doublons/conflits et un contrat de configuration de commandes
  stable en cas de repli

Les canaux d’authentification uniquement peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le plugin expose simplement les capacités sortantes/d’authentification. Les canaux d’approbation natifs comme Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les helpers natifs partagés au lieu d’implémenter leur propre cycle de vie d’approbation.

## Politique de mention entrante

Gardez le traitement des mentions entrantes séparé en deux couches :

- collecte des preuves détenue par le plugin
- évaluation de la politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel d’aide entrant
plus large.

Adapté à la logique locale au plugin :

- détection des réponses au bot
- détection des citations du bot
- vérifications de participation au fil
- exclusions de messages de service/système
- caches natifs de la plateforme nécessaires pour prouver la participation du bot

Adapté au helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation des mentions implicites
- contournement des commandes
- décision finale d’ignorance

Flux recommandé :

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

`api.runtime.channel.mentions` expose les mêmes helpers de mention partagés pour
les plugins de canal intégrés qui dépendent déjà de l’injection runtime :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous avez uniquement besoin de `implicitMentionKindWhen` et de
`resolveInboundMentionDecision`, importez depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des helpers runtime
entrants sans rapport.

Utilisez `resolveInboundMentionDecision({ facts, policy })` pour le filtrage des mentions.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Créez les fichiers standard du plugin. Le champ `channel` dans `package.json` est
    ce qui en fait un plugin de canal. Pour la surface complète des métadonnées de package,
    consultez [Configuration du Plugin et de la config](/fr/plugins/sdk-setup#openclaw-channel) :

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
    valide `channels.acme-chat` et constitue la source de chemin froid utilisée par le schéma de configuration,
    la configuration initiale et les surfaces d’interface avant le chargement du runtime du plugin.

  </Step>

  <Step title="Build the channel plugin object">
    L’interface `ChannelPlugin` possède de nombreuses surfaces d’adaptateur facultatives. Commencez avec
    le minimum - `id` et `setup` - puis ajoutez les adaptateurs au fur et à mesure de vos besoins.

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

    Pour les canaux qui acceptent à la fois les clés DM de premier niveau canoniques et les clés imbriquées héritées, utilisez les helpers de `plugin-sdk/channel-config-helpers` : `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` et `normalizeChannelDmPolicy` conservent les valeurs locales au compte avant les valeurs racines héritées. Associez le même résolveur à la réparation doctor via `normalizeLegacyDmAliases` afin que le runtime et la migration lisent le même contrat.

    <Accordion title="What createChatChannelPlugin does for you">
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous passez
      des options déclaratives et le builder les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée limitée depuis les champs de configuration |
      | `pairing.text` | Flux d’appairage DM textuel avec échange de code |
      | `threading` | Résolveur du mode de réponse (fixe, limité au compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui retournent des métadonnées de résultat (identifiants de message) |

      Vous pouvez également passer des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle total.

      Les adaptateurs sortants bruts peuvent définir une fonction `chunker(text, limit, ctx)`.
      Le `ctx.formatting` facultatif porte les décisions de formatage au moment de la livraison,
      comme `maxLinesPerMessage` ; appliquez-les avant l’envoi afin que le fil de réponse
      et les limites de segments soient résolus une seule fois par la livraison sortante partagée.
      Les contextes d’envoi incluent également `replyToIdSource` (`implicit` ou `explicit`)
      lorsqu’une cible de réponse native a été résolue, ce qui permet aux helpers de payload de conserver
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
    puisse les afficher dans l’aide racine sans activer l’intégralité du runtime du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes.
    Conservez `registerFull(...)` pour le travail propre au runtime.
    Si `registerFull(...)` enregistre des méthodes RPC de Gateway, utilisez un
    préfixe propre au plugin. Les espaces de noms d’administration du noyau (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
    vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les
    options.

  </Step>

  <Step title="Add a setup entry">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci au lieu de l’entrée complète lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code runtime lourd pendant les flux de configuration.
    Consultez [Configuration et config](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux d’espace de travail groupés qui séparent les exports sûrs pour la configuration dans des modules
    annexes peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont également besoin d’un
    setter runtime explicite au moment de la configuration.

  </Step>

  <Step title="Handle inbound messages">
    Votre plugin doit recevoir les messages de la plateforme et les transmettre à
    OpenClaw. Le modèle typique est un Webhook qui vérifie la requête et
    la distribue via le gestionnaire entrant de votre canal :

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
      La gestion des messages entrants est propre à chaque canal. Chaque plugin de canal possède
      son propre pipeline entrant. Consultez les plugins de canal groupés
      (par exemple le package de plugin Microsoft Teams ou Google Chat) pour des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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
    Cycle de vie partagé des événements entrants : ingestion, résolution, enregistrement, distribution, finalisation
  </Card>
</CardGroup>

<Note>
Certaines interfaces de helpers groupés existent encore pour la maintenance des plugins groupés et
la compatibilité. Elles ne constituent pas le modèle recommandé pour les nouveaux plugins de canal ;
préférez les sous-chemins génériques de canal/configuration/réponse/runtime depuis la surface SDK
commune, sauf si vous maintenez directement cette famille de plugins groupés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - si votre plugin fournit également des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des imports de sous-chemins
- [Tests du SDK](/fr/plugins/sdk-testing) - utilitaires de test et tests de contrat
- [Manifeste de Plugin](/fr/plugins/manifest) - schéma complet du manifeste

## Associé

- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
