---
read_when:
    - Vous développez un nouveau plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre l’interface de l’adaptateur ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide pas à pas pour créer un Plugin de canal de messagerie pour OpenClaw
title: Création de plugins de canal
x-i18n:
    generated_at: "2026-07-12T15:41:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fa573f956bc710b72433d3e19421ab4af4cab8fc854b93dec371e029ce268273
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ce guide permet de créer un plugin de canal qui connecte OpenClaw à une plateforme
de messagerie : sécurité des messages privés, appairage, réponses dans les fils de discussion et messagerie sortante.

<Info>
  Vous découvrez les plugins OpenClaw ? Lisez d’abord [Bien démarrer](/fr/plugins/building-plugins)
  pour comprendre la structure des paquets et la configuration du manifeste.
</Info>

## Responsabilités de votre plugin

Les plugins de canal n’implémentent pas d’outils d’envoi, de modification ou de réaction ; le cœur fournit un
outil `message` partagé. Votre plugin gère :

- **Configuration** - résolution des comptes et assistant de configuration
- **Sécurité** - politique des messages privés et listes d’autorisation
- **Appairage** - processus d’approbation des messages privés
- **Grammaire de session** - correspondance entre les identifiants de conversation propres au fournisseur et les conversations
  de base, les identifiants de fil de discussion et les replis vers les conversations parentes
- **Sortie** - envoi de texte, de médias et de sondages à la plateforme
- **Fils de discussion** - organisation des réponses dans les fils de discussion
- **Indication de saisie du Heartbeat** - signaux facultatifs de saisie ou d’activité pour les cibles de livraison
  du Heartbeat

Le cœur gère l’outil de messagerie partagé, le raccordement aux prompts, la structure externe de la clé de session,
la comptabilité générique de `:thread:` et la distribution.

## Adaptateur de messagerie

Exposez un adaptateur `message` avec `defineChannelMessageAdapter` depuis
`openclaw/plugin-sdk/channel-outbound`. Déclarez uniquement les fonctionnalités durables d’envoi final
que votre transport natif prend réellement en charge, en les étayant par un test de contrat
qui prouve l’effet secondaire natif et l’accusé de réception renvoyé. Faites pointer les envois de texte et de médias
vers les mêmes fonctions de transport que celles utilisées par l’adaptateur `outbound` historique. Pour
le contrat d’API complet, la matrice des fonctionnalités, les règles d’accusé de réception, la finalisation
des aperçus en direct, la politique d’acquittement des réceptions, les tests et la table de migration, consultez
[API de sortie des canaux](/fr/plugins/sdk-channel-outbound).

Si votre adaptateur `outbound` existant dispose déjà des bonnes méthodes d’envoi et
des métadonnées de fonctionnalités appropriées, dérivez l’adaptateur `message` avec
`createChannelMessageAdapterFromOutbound(...)` plutôt que d’écrire manuellement un autre
pont. Les envois de l’adaptateur renvoient des valeurs `MessageReceipt`. Pour les identifiants historiques, dérivez-les
avec `listMessageReceiptPlatformIds(...)` ou
`resolveMessageReceiptPrimaryId(...)` au lieu de conserver des champs `messageIds`
parallèles.

Déclarez précisément les fonctionnalités en direct et de finalisation : le cœur les utilise pour déterminer
ce qu’un canal peut faire, et toute divergence entre le comportement déclaré et le comportement réel constitue
un échec du test de contrat :

| Surface                               | Valeurs                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`     |

Les canaux qui finalisent sur place un brouillon d’aperçu doivent faire passer la logique d’exécution
par `defineFinalizableLivePreviewAdapter(...)` et
`deliverWithFinalizableLivePreviewAdapter(...)`, et étayer les fonctionnalités
déclarées avec des tests `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
et `verifyChannelMessageLiveFinalizerProofs(...)`, afin que les comportements natifs d’aperçu,
de progression, de modification, de repli ou de conservation, de nettoyage et d’accusé de réception ne puissent pas diverger
silencieusement.

Les récepteurs entrants qui différèrent les acquittements de la plateforme doivent déclarer
`message.receive.defaultAckPolicy` et `supportedAckPolicies` au lieu de dissimuler
le moment de l’acquittement dans l’état local du moniteur. Couvrez chaque politique déclarée avec
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Les anciens assistants de réponse tels que `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase` et `recordInboundSessionAndDispatchReply`
restent disponibles pour les distributeurs compatibles. Ne les utilisez pas pour le nouveau
code de canal ; commencez plutôt par l’adaptateur `message`, les accusés de réception et les assistants de cycle de vie
de réception et d’envoi disponibles dans `openclaw/plugin-sdk/channel-outbound`.

### Réception entrante (expérimentale)

Les canaux qui migrent l’autorisation des messages entrants peuvent utiliser le sous-chemin expérimental
`openclaw/plugin-sdk/channel-ingress-runtime` depuis les chemins d’exécution de réception.
Il accepte les informations de la plateforme, les listes d’autorisation brutes, les descripteurs de route, les informations de commande
et la configuration des groupes d’accès, puis renvoie les projections de l’expéditeur, de la route, de la commande et de l’activation,
ainsi que le graphe de réception ordonné, tandis que la recherche sur la plateforme et les effets
secondaires restent dans le plugin. Conservez la normalisation de l’identité du plugin dans le
descripteur transmis au résolveur ; ne sérialisez pas les valeurs de correspondance brutes issues
de l’état résolu ou de la décision. Consultez
[API de réception des canaux](/fr/plugins/sdk-channel-ingress) pour la conception de l’API,
la frontière de responsabilité et les attentes relatives aux tests. L’ancien sous-chemin
`openclaw/plugin-sdk/channel-ingress` reste exporté en tant que façade de compatibilité
obsolète pour les plugins tiers.

### Indicateurs de saisie

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses entrantes, exposez
`heartbeat.sendTyping(...)` sur le plugin de canal. Le cœur l’appelle avec la
cible de livraison résolue du Heartbeat avant le démarrage de l’exécution du modèle Heartbeat et
utilise le cycle de vie partagé de maintien et de nettoyage de l’indicateur de saisie. Ajoutez
`heartbeat.clearTyping(...)` lorsque la plateforme nécessite un signal d’arrêt explicite.

### Paramètres de source des médias

Si votre canal ajoute à l’outil de messagerie des paramètres contenant des sources de médias, exposez
les noms de ces paramètres via `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Le cœur utilise cette liste explicite pour normaliser les chemins du bac à sable et appliquer la politique
d’accès aux médias sortants, de sorte que les plugins n’aient pas besoin de cas particuliers dans le cœur partagé
pour les paramètres propres au fournisseur concernant les avatars, les pièces jointes ou les images de couverture.

Préférez une table indexée par action, telle que `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
afin que les actions sans rapport n’héritent pas des arguments de médias d’une autre action. Un tableau plat
convient toujours aux paramètres volontairement partagés entre toutes les actions exposées.

Les canaux qui doivent exposer une URL publique temporaire pour permettre à la plateforme de récupérer
un média peuvent utiliser `createHostedOutboundMediaStore(...)` depuis
`openclaw/plugin-sdk/outbound-media` avec les magasins d’état du plugin. Conservez l’analyse
des routes de la plateforme et l’application des jetons dans le plugin de canal ; l’assistant partagé
gère uniquement le chargement des médias, les métadonnées d’expiration, les lignes de fragments et le nettoyage.

### Mise en forme des charges utiles natives

Si votre canal nécessite une mise en forme propre au fournisseur pour `message(action="send")`,
préférez `actions.prepareSendPayload(...)`. Placez les cartes, blocs, intégrations ou
autres données durables natives sous `payload.channelData.<channel>` et laissez le cœur effectuer l’envoi
par l’adaptateur de sortie ou de messagerie. Utilisez `actions.handleAction(...)` pour l’envoi
uniquement comme repli de compatibilité pour les charges utiles qui ne peuvent pas être sérialisées et
réessayées.

### Grammaire des conversations de session

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, conservez cette analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. Il s’agit du
point d’extension canonique permettant d’associer `rawId` à l’identifiant de conversation de base, à un
identifiant de fil de discussion facultatif, à un `baseConversationId` explicite et à d’éventuels
`parentConversationCandidates`. Lorsque vous renvoyez `parentConversationCandidates`,
classez-les du parent le plus précis à la conversation la plus générale ou de base.

`messaging.resolveParentConversationCandidates(...)` est un repli de compatibilité
obsolète destiné aux plugins qui ont uniquement besoin de replis vers les parents en complément de
l’identifiant générique ou brut. Si les deux points d’extension existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se replie
sur `resolveParentConversationCandidates(...)` que lorsque le point d’extension canonique
les omet.

Les plugins intégrés qui ont besoin de la même analyse avant le démarrage du registre des canaux
peuvent exposer un fichier `session-key-api.ts` de premier niveau avec une exportation
`resolveSessionConversation(...)` correspondante (voir les plugins Feishu et Telegram).
Le cœur utilise cette surface compatible avec l’amorçage uniquement lorsque le registre des plugins d’exécution
n’est pas encore disponible.

Utilisez `openclaw/plugin-sdk/channel-route` lorsque le code du plugin doit normaliser
des champs de type route, comparer un fil enfant à sa route parente ou construire une
clé de déduplication stable à partir de `{ channel, to, accountId, threadId }`. L’assistant
normalise les identifiants numériques de fils de discussion de la même manière que le cœur ; préférez-le donc aux comparaisons
ponctuelles avec `String(threadId)`. Les plugins dotés d’une grammaire de cible propre au fournisseur
doivent exposer `messaging.resolveOutboundSessionRoute(...)` afin que le cœur obtienne
l’identité de session et de fil de discussion native du fournisseur sans adaptateurs d’analyse.

### Prise en charge des liaisons de conversation propres au compte

Définissez `conversationBindings.supportsCurrentConversationBinding` lorsque le canal
prend en charge les liaisons génériques à la conversation actuelle. `createChatChannelPlugin(...)`
définit par défaut cette fonctionnalité statique sur `true`.

Si la prise en charge varie selon le compte configuré, implémentez également
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Le cœur n’évalue ce point d’extension synchrone qu’après l’activation de la fonctionnalité statique.
Le renvoi de `false` rend indisponibles pour ce compte la fonctionnalité générique de conversation actuelle,
ainsi que les opérations de liaison, de recherche, de liste, d’actualisation et de déliaison.
Si le point d’extension est omis, la fonctionnalité statique s’applique à chaque compte.

Déterminez la réponse à partir de la configuration du compte ou de l’état d’exécution déjà chargés. Ce
point d’extension contrôle uniquement les liaisons génériques à la conversation actuelle ; il ne remplace pas
les règles de liaison configurées ni le routage des sessions géré par le plugin. Les tests de contrat
doivent couvrir au moins un compte pris en charge et un compte non pris en charge au moyen du
contrat `ChannelPlugin["conversationBindings"]` exporté par
`openclaw/plugin-sdk/channel-core`.

## Approbations et fonctionnalités des canaux

La plupart des plugins de canal n’ont pas besoin de code propre aux approbations. Le cœur gère la commande
`/approve` dans la même conversation, les charges utiles partagées des boutons d’approbation et la livraison de repli générique.
`ChannelPlugin.approvals` a été supprimé ; placez plutôt les informations de livraison, de rendu natif et d’autorisation
des approbations dans un seul objet `approvalCapability`. `plugin.auth` concerne uniquement la connexion et la déconnexion :
le cœur ne lit plus les points d’extension d’autorisation des approbations depuis cet objet.

Utilisez `approvalCapability.delivery` uniquement pour le routage natif des approbations ou la suppression
du repli, et `approvalCapability.render` uniquement lorsqu’un canal nécessite réellement
des charges utiles d’approbation personnalisées à la place du moteur de rendu partagé.

### Autorisation des approbations

- `approvalCapability.authorizeActorAction` et
  `approvalCapability.getActionAvailabilityState` constituent le point d’extension canonique
  pour l’autorisation des approbations.
- Utilisez `getActionAvailabilityState` pour connaître la disponibilité de l’autorisation des approbations dans la même conversation.
  Maintenez les approbateurs configurés disponibles pour `/approve`, même lorsque la livraison native
  est désactivée ; utilisez plutôt l’état de la surface native à l’origine de la demande pour les indications de livraison et de configuration.
- Si votre canal expose des approbations natives d’exécution, utilisez
  `approvalCapability.getExecInitiatingSurfaceState` pour l’état
  de la surface à l’origine de la demande ou du client natif lorsqu’il diffère de l’autorisation des approbations
  dans la même conversation. Le cœur utilise ce point d’extension propre à l’exécution pour distinguer `enabled` de
  `disabled`, déterminer si le canal à l’origine de la demande prend en charge les approbations natives
  d’exécution et inclure le canal dans les indications de repli du client natif.
  `createApproverRestrictedNativeApprovalCapability(...)` le renseigne pour
  le cas courant.
- Si un canal peut déduire des identités stables de type propriétaire dans les messages privés à partir de la configuration existante,
  utilisez `createResolvedApproverActionAuthAdapter` depuis
  `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même conversation
  sans ajouter de logique propre aux approbations dans le cœur.
- Si une autorisation d’approbation personnalisée permet intentionnellement uniquement le repli dans la même conversation, renvoyez
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` depuis
  `openclaw/plugin-sdk/approval-auth-runtime` ; sinon, le cœur considère le
  résultat comme une autorisation explicite de l’approbateur.
- Si un rappel natif géré par le canal résout directement les approbations, utilisez
  `isImplicitSameChatApprovalAuthorization(...)` avant la résolution, afin que le repli
  implicite passe toujours par l’autorisation normale de l’acteur par le canal.

### Cycle de vie des charges utiles et indications de configuration

- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou
  `outbound.beforeDeliverPayload` pour les comportements de cycle de vie de la
  charge utile propres au canal, comme masquer les invites d’approbation locales
  en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal
  souhaite que la réponse du chemin désactivé explique précisément les paramètres
  de configuration nécessaires pour activer les approbations d’exécution natives.
  Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux avec comptes
  nommés doivent afficher des chemins limités au compte, tels que
  `channels.<channel>.accounts.<id>.execApprovals.*`, au lieu des valeurs par défaut
  de premier niveau.
- Utilisez `approvalCapability.describePluginApprovalSetup` lorsque les
  instructions relatives aux échecs d’approbation de Plugin peuvent être affichées
  sans risque pour les échecs d’approbation de Plugin dus à l’absence de route ou
  à l’expiration du délai. `createApproverRestrictedNativeApprovalCapability(...)`
  ne déduit pas cela de `describeExecApprovalSetup` ; transmettez explicitement le
  même assistant uniquement lorsque les approbations de Plugin et d’exécution
  utilisent réellement la même configuration native.

### Livraison native des approbations

Si un canal nécessite une livraison native des approbations, limitez le code du
canal à la normalisation de la cible ainsi qu’aux informations de transport et de
présentation. Utilisez `createChannelExecApprovalProfile`,
`createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` et
`createApproverRestrictedNativeApprovalCapability` depuis
`openclaw/plugin-sdk/approval-runtime`. Placez les informations propres au canal
derrière `approvalCapability.nativeRuntime`, idéalement via
`createChannelApprovalNativeRuntimeAdapter(...)` ou
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse
assembler le gestionnaire et prendre en charge le filtrage des requêtes, le
routage, la déduplication, l’expiration, l’abonnement au Gateway et les avis de
routage vers une autre destination.

`nativeRuntime` est divisé en plusieurs interfaces plus petites :

- `availability` - indique si le compte est configuré et si une requête doit être
  traitée
- `presentation` - convertit le modèle de vue d’approbation partagé en charges
  utiles natives en attente/résolues/expirées ou en actions finales
- `transport` - prépare les cibles, puis envoie/met à jour/supprime les messages
  d’approbation natifs
- `interactions` - hooks facultatifs d’association/dissociation/suppression
  d’action pour les boutons ou réactions natifs, ainsi qu’un hook facultatif
  `cancelDelivered`. Implémentez `cancelDelivered` lorsque `deliverPending`
  enregistre un état en cours de processus ou persistant, par exemple un stockage
  de cibles de réaction, afin que cet état puisse être libéré si l’arrêt d’un
  gestionnaire annule la livraison avant l’exécution de `bindPending`, ou lorsque
  `bindPending` ne renvoie aucun handle
- `observe` - hooks facultatifs de diagnostic de livraison

Autres assistants d’approbation :

- Utilisez `createNativeApprovalChannelRouteGates` depuis
  `openclaw/plugin-sdk/approval-native-runtime` lorsqu’un canal prend en charge à
  la fois la livraison native vers l’origine de la session et des cibles explicites
  de transfert d’approbation. L’assistant centralise la sélection de la
  configuration d’approbation, la gestion de `mode`, les filtres d’agent/de
  session, l’association du compte, la correspondance avec la cible de session et
  la correspondance avec la liste de cibles, tandis que les appelants restent
  responsables de l’identifiant du canal, du mode de transfert par défaut, de la
  recherche du compte, de la vérification de l’activation du transport, de la
  normalisation de la cible et de la résolution de la cible depuis la source du
  tour. Ne l’utilisez pas pour créer des politiques de canal par défaut appartenant
  au cœur ; transmettez explicitement le mode par défaut documenté du canal.
- `createChannelNativeOriginTargetResolver` utilise par défaut le mécanisme
  partagé de correspondance des routes de canal pour les cibles
  `{ to, accountId, threadId }`. Transmettez `targetsMatch` uniquement lorsqu’un
  canal possède des règles d’équivalence propres au fournisseur, comme la
  correspondance de préfixe d’horodatage de Slack. Transmettez
  `normalizeTargetForMatch` lorsque le canal doit canonicaliser les identifiants
  du fournisseur avant l’exécution du mécanisme de correspondance de route par
  défaut ou d’un rappel `targetsMatch` personnalisé, tout en conservant la cible
  d’origine pour la livraison. Utilisez `normalizeTarget` uniquement lorsque la
  cible de livraison résolue elle-même doit être canonicalisée.
- Si le canal nécessite des objets appartenant à l’environnement d’exécution,
  comme un client, un jeton, une application Bolt ou un récepteur de Webhook,
  enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre
  générique de contexte d’exécution permet au cœur d’initialiser les gestionnaires
  fondés sur les capacités à partir de l’état de démarrage du canal, sans ajouter
  de code de liaison spécifique aux approbations.
- N’utilisez les fonctions de plus bas niveau `createChannelApprovalHandler` ou
  `createChannelNativeApprovalRuntime` que lorsque l’interface fondée sur les
  capacités n’est pas encore suffisamment expressive.
- Les canaux d’approbation natifs doivent acheminer à la fois `accountId` et
  `approvalKind` via ces assistants. `accountId` limite la politique d’approbation
  multicomptes au bon compte de bot, tandis que `approvalKind` permet au canal de
  distinguer le comportement des approbations d’exécution de celui des
  approbations de Plugin, sans branches codées en dur dans le cœur.
- Le cœur est également responsable des avis de réacheminement des approbations.
  Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi du
  type « l’approbation a été envoyée dans les messages privés / un autre canal »
  depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage précis
  vers l’origine et vers les messages privés de l’approbateur au moyen des
  assistants partagés de capacité d’approbation, puis laissez le cœur agréger les
  livraisons réelles avant de publier un éventuel avis dans la discussion
  d’origine.
- Préservez de bout en bout le type d’identifiant de l’approbation livrée. Les
  clients natifs ne doivent pas deviner ni réécrire le routage des approbations
  d’exécution ou de Plugin à partir d’un état local au canal.
- Transmettez cet `approvalKind` explicite à `resolveApprovalOverGateway`. Cette
  fonction utilise le service canonique `approval.resolve` et renvoie le gagnant
  enregistré lorsqu’une autre surface répond en premier. L’ancienne entrée
  explicite `resolveMethod` reste disponible pour les contrôles reposant sur des
  commandes ; les nouvelles actions natives ne doivent pas l’utiliser ni déduire
  le type à partir d’un identifiant.
- Différents types d’approbation peuvent intentionnellement exposer des surfaces
  natives différentes. Exemples intégrés actuels : Matrix conserve le même routage
  natif vers les messages privés/le canal et la même expérience de réactions pour
  les approbations d’exécution et de Plugin, tout en permettant à
  l’authentification de différer selon le type d’approbation ; Slack conserve le
  routage natif des approbations pour les identifiants d’exécution et de Plugin.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper
  de compatibilité, mais le nouveau code doit privilégier le générateur de
  capacités et exposer `approvalCapability` sur le Plugin.

### Sous-chemins plus ciblés de l’environnement d’exécution des approbations

Pour les points d’entrée de canal critiques, privilégiez ces sous-chemins plus
ciblés plutôt que le barrel plus large `approval-runtime` lorsque vous n’avez
besoin que d’une partie de cette famille :

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

De même, privilégiez `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` et
`openclaw/plugin-sdk/reply-chunking` plutôt que des surfaces génériques plus
larges lorsque vous n’en avez pas besoin dans leur ensemble.

### Sous-chemins de configuration

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration
  sûrs pour l’environnement d’exécution : `createSetupTranslator`, les adaptateurs
  de correctifs de configuration sûrs à importer
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), la sortie des notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les générateurs de proxy de
  configuration délégués.
- `openclaw/plugin-sdk/channel-setup` couvre les générateurs de configuration
  avec installation facultative, ainsi que quelques primitives sûres pour la
  configuration : `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` et `splitSetupEntries`.
- Utilisez l’interface plus large `openclaw/plugin-sdk/setup` uniquement si vous
  avez également besoin d’assistants partagés de configuration plus lourds, comme
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Si votre canal souhaite uniquement afficher « installez d’abord ce Plugin » dans
les surfaces de configuration, privilégiez
`createOptionalChannelSetupSurface(...)`. L’adaptateur et l’assistant générés
échouent de manière fermée lors des écritures de configuration et de la
finalisation, et réutilisent le même message indiquant que l’installation est
requise pour la validation, la finalisation et le texte du lien vers la
documentation.

Si votre canal prend en charge une configuration ou une authentification pilotée
par des variables d’environnement et que les flux génériques de
démarrage/configuration doivent connaître les noms de ces variables avant le
chargement de l’environnement d’exécution, déclarez-les dans le manifeste du
Plugin avec `channelEnvVars`. Conservez les `envVars` de l’environnement
d’exécution du canal ou les constantes locales uniquement pour le texte destiné
aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status`
ou les analyses SecretRef avant le démarrage de l’environnement d’exécution du
Plugin, ajoutez `openclaw.setupEntry` dans `package.json`. Ce point d’entrée doit
pouvoir être importé sans risque dans les chemins de commande en lecture seule et
doit renvoyer les métadonnées du canal, l’adaptateur de configuration sûr,
l’adaptateur d’état et les métadonnées des cibles de secrets du canal nécessaires
à ces résumés. Ne démarrez aucun client, écouteur ni environnement d’exécution de
transport depuis le point d’entrée de configuration.

Maintenez également un chemin d’importation étroit pour le point d’entrée principal
du canal. La découverte peut évaluer le point d’entrée et le module du Plugin de
canal afin d’enregistrer les capacités sans activer le canal. Les fichiers tels
que `channel-plugin-api.ts` doivent exporter l’objet Plugin du canal sans importer
d’assistants de configuration, de clients de transport, d’écouteurs de socket, de
lanceurs de sous-processus ni de modules de démarrage de service. Placez ces
éléments d’exécution dans des modules chargés depuis `registerFull(...)`, des
setters d’exécution ou des adaptateurs de capacités paresseux.

### Autres sous-chemins ciblés des canaux

Pour les autres chemins de canal critiques, privilégiez les assistants ciblés
plutôt que les surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multicomptes et le
  repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/channel-inbound` pour le routage/l’enveloppe entrants et le
  câblage d’enregistrement et de distribution
- `openclaw/plugin-sdk/channel-targets` pour les assistants d’analyse des cibles
- `openclaw/plugin-sdk/outbound-media` pour le chargement des médias et
  `openclaw/plugin-sdk/channel-outbound` pour les délégués d’identité/d’envoi
  sortants et la planification des charges utiles
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId`/`threadId` explicite ou récupérer la session `:thread:` actuelle
  après que la clé de session de base correspond toujours. Les Plugins de
  fournisseur peuvent remplacer la priorité, le comportement des suffixes et la
  normalisation de l’identifiant de fil de discussion lorsque leur plateforme
  possède une sémantique native de livraison dans les fils de discussion.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des
  associations de fils de discussion et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition
  héritée des champs de charge utile d’agent/média reste nécessaire
- `openclaw/plugin-sdk/telegram-command-config` (obsolète : aucun Plugin intégré
  ne l’utilise en production) pour la normalisation des commandes personnalisées
  de Telegram, la validation des doublons/conflits et un contrat de configuration
  de commandes stable en cas de repli ; privilégiez une gestion de la
  configuration des commandes locale au Plugin pour le nouveau code de Plugin

Les canaux limités à l’authentification peuvent généralement s’en tenir au chemin
par défaut : le cœur gère les approbations et le Plugin expose simplement les
capacités de sortie/d’authentification. Les canaux d’approbation natifs tels que
Matrix, Slack, Telegram et les transports de discussion personnalisés doivent
utiliser les assistants natifs partagés au lieu d’implémenter leur propre cycle de
vie des approbations.

## Politique des mentions entrantes

Conservez la gestion des mentions entrantes en deux couches distinctes :

- collecte des éléments probants appartenant au Plugin
- évaluation de la politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de
politique relatives aux mentions. Utilisez
`openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du
barrel plus large d’assistants entrants.

Éléments adaptés à une logique locale au Plugin :

- détection des réponses au bot
- détection des citations du bot
- vérification de la participation au fil de discussion
- exclusion des messages de service/système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Éléments adaptés à l’assistant partagé :

- `requireMention`
- résultat de la mention explicite
- liste d’autorisation des mentions implicites
- contournement par commande
- décision finale d’ignorer

Flux recommandé :

1. Calculez les informations locales relatives aux mentions.
2. Transmettez ces informations à `resolveInboundMentionDecision({ facts, policy })`.
3. Utilisez `decision.effectiveWasMentioned`, `decision.shouldBypassMention` et
   `decision.shouldSkip` dans votre filtre entrant.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
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

`matchesMentionWithExplicit(...)` renvoie une valeur booléenne. `hasAnyMention`,
`isExplicitlyMentioned` et `canResolveExplicit` proviennent des métadonnées de
mention natives du canal (entités du message, indicateurs de réponse au bot et
éléments similaires) ; fournissez les valeurs `false`/`undefined` lorsque votre
plateforme ne peut pas les détecter.

`api.runtime.channel.mentions` expose les mêmes utilitaires partagés de gestion
des mentions pour les plugins de canal intégrés qui dépendent déjà de
l’injection à l’exécution : `buildMentionRegexes`, `matchesMentionPatterns`,
`matchesMentionWithExplicit`, `implicitMentionKindWhen`,
`resolveInboundMentionDecision`.

Si vous avez uniquement besoin de `implicitMentionKindWhen` et de
`resolveInboundMentionDecision`, importez-les depuis
`openclaw/plugin-sdk/channel-mention-gating` afin d’éviter de charger des
utilitaires d’exécution entrants sans rapport.

## Procédure détaillée

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquet et manifeste">
    Créez les fichiers de plugin standard. Le champ `channels` dans
    `openclaw.plugin.json` (et non un champ `kind`) indique qu’un manifeste
    possède un canal. Pour connaître l’ensemble des métadonnées du paquet,
    consultez [Configuration du Plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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
          "label": "Discussion Acme",
          "blurb": "Connectez OpenClaw à Discussion Acme."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Discussion Acme",
      "description": "Plugin de canal Discussion Acme",
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
    les paramètres appartenant au plugin qui ne font pas partie de la
    configuration du compte de canal.
    `channelConfigs.acme-chat.schema` valide `channels.acme-chat` et constitue
    la source du chemin non critique utilisée par le schéma de configuration,
    la configuration initiale et les interfaces utilisateur avant le
    chargement de l’exécution du plugin. Consultez
    [Manifeste du Plugin](/fr/plugins/manifest) pour la référence complète des
    champs de premier niveau.

  </Step>

  <Step title="Créer l’objet du plugin de canal">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptateur
    facultatives. Commencez par le minimum — `id`, `config` et `setup` — puis
    ajoutez des adaptateurs selon vos besoins.

    Créez `src/channel.ts` :

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // votre client d’API de plateforme

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
      if (!token) throw new Error("acme-chat : le jeton est requis");
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
        // La résolution et l’inspection du compte appartiennent à `config`, pas à `setup`.
        // `setup` couvre les écritures d’intégration (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
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
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // Sécurité des messages privés : qui peut envoyer un message au bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Appairage : processus d’approbation des nouveaux contacts par message privé
      pairing: {
        text: {
          idLabel: "Nom d’utilisateur Discussion Acme",
          message: "Envoyez ce code pour vérifier votre identité :",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Code d’appairage : ${code}`);
          },
        },
      },

      // Fils de discussion : mode de distribution des réponses
      threading: { topLevelReplyToMode: "reply" },

      // Sortant : envoyer des messages à la plateforme
      outbound: {
        attachedResults: {
          channel: "acme-chat",
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

    Pour les canaux qui acceptent à la fois les clés de messages privés
    canoniques de premier niveau et les anciennes clés imbriquées, utilisez les
    utilitaires de `plugin-sdk/channel-config-helpers` :
    `resolveChannelDmAccess`, `resolveChannelDmPolicy`,
    `resolveChannelDmAllowFrom` et `normalizeChannelDmPolicy` donnent la
    priorité aux valeurs locales du compte sur les valeurs racines héritées.
    Associez le même résolveur à la réparation effectuée par doctor via
    `normalizeLegacyDmAliases`, afin que l’exécution et la migration utilisent
    le même contrat.

    <Accordion title="Ce que createChatChannelPlugin fait pour vous">
      Au lieu d’implémenter manuellement les interfaces d’adaptateur de bas
      niveau, vous fournissez des options déclaratives et le générateur les
      compose :

      | Option | Ce qu’elle connecte |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité des messages privés, limité à la portée des champs de configuration |
      | `pairing.text` | Processus d’appairage par message privé basé sur du texte, avec échange de code |
      | `threading` | Résolveur du mode de réponse (fixe, limité à la portée du compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient les métadonnées du résultat (identifiants de message) ; nécessite un identifiant `channel` adjacent afin que le cœur puisse marquer le résultat de distribution renvoyé |

      Vous pouvez également fournir des objets d’adaptateur bruts à la place
      des options déclaratives si vous avez besoin d’un contrôle total.

      Les adaptateurs sortants bruts peuvent définir une fonction
      `chunker(text, limit, ctx)`. La propriété facultative `ctx.formatting`
      contient les décisions de mise en forme prises au moment de la
      distribution, telles que `maxLinesPerMessage` ; appliquez-les avant
      l’envoi afin que le fil de réponse et les limites de segments soient
      déterminés une seule fois par le mécanisme partagé de distribution
      sortante. Les contextes d’envoi incluent également `replyToIdSource`
      (`implicit` ou `explicit`) lorsqu’une cible de réponse native a été
      résolue, afin que les utilitaires de charge utile puissent préserver les
      balises de réponse explicites sans consommer un emplacement de réponse
      implicite à usage unique.
    </Accordion>

  </Step>

  <Step title="Connecter le point d’entrée">
    Créez `index.ts` :

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Discussion Acme",
      description: "Plugin de canal Discussion Acme",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gestion de Discussion Acme");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestion de Discussion Acme",
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

    Placez les descripteurs de CLI appartenant au canal dans
    `registerCliMetadata(...)` afin qu’OpenClaw puisse les afficher dans l’aide
    racine sans activer l’exécution complète du canal, tandis que les
    chargements complets normaux récupèrent toujours ces mêmes descripteurs pour
    l’enregistrement réel des commandes. Réservez `registerFull(...)` aux
    opérations d’exécution uniquement. `defineChannelPluginEntry` gère
    automatiquement la séparation entre les modes d’enregistrement.
    Si `registerFull(...)` enregistre des méthodes RPC du Gateway, utilisez un
    préfixe propre au plugin. Les espaces de noms d’administration du cœur
    (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et
    correspondent toujours à `operator.admin`. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour
    connaître toutes les options.

  </Step>

  <Step title="Ajouter un point d’entrée de configuration">
    Créez `setup-entry.ts` pour permettre un chargement léger pendant
    l’intégration :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ce point d’entrée à la place du point d’entrée complet
    lorsque le canal est désactivé ou non configuré. Cela évite de charger du
    code d’exécution lourd pendant les processus de configuration. Consultez
    [Configuration](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux intégrés à l’espace de travail qui répartissent les exportations
    utilisables sans risque pendant la configuration dans des modules annexes
    peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont également besoin
    d’un mécanisme explicite de définition de l’exécution au moment de la
    configuration.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir les messages de la plateforme et les transférer
    à OpenClaw. Le modèle habituel consiste à utiliser un Webhook qui vérifie la
    requête et la distribue via le gestionnaire entrant de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // authentification gérée par le plugin (vérifiez vous-même les signatures)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Votre gestionnaire entrant transmet le message à OpenClaw.
          // Le raccordement exact dépend du SDK de votre plateforme —
          // consultez un exemple réel dans le package du plugin Microsoft Teams ou Google Chat inclus.
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
      son propre pipeline entrant. Consultez les plugins de canal inclus
      (par exemple, le package du plugin Microsoft Teams ou Google Chat) pour voir des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("résout le compte depuis la configuration", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspecte le compte sans matérialiser les secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("signale une configuration manquante", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Pour les utilitaires de test partagés, consultez [Tests](/fr/plugins/sdk-testing).

</Step>
</Steps>

## Structure des fichiers

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # métadonnées openclaw.channel
├── openclaw.plugin.json      # manifeste avec le schéma de configuration
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # exportations publiques (facultatif)
├── runtime-api.ts            # exportations internes de l'environnement d'exécution (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # tests
    ├── client.ts             # client de l'API de la plateforme
    └── runtime.ts            # stockage de l'environnement d'exécution (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fils de discussion" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, propres au compte ou personnalisés
  </Card>
  <Card title="Intégration de l'outil de messagerie" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte des actions
  </Card>
  <Card title="Résolution de la cible" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Utilitaires de l'environnement d'exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias et sous-agent via api.runtime
  </Card>
  <Card title="API entrante du canal" icon="bolt" href="/fr/plugins/sdk-channel-inbound">
    Cycle de vie partagé des événements entrants : réception, résolution, enregistrement, distribution et finalisation
  </Card>
</CardGroup>

<Note>
Certains points d'intégration auxiliaires inclus existent encore pour la maintenance des plugins inclus et
la compatibilité. Ils ne constituent pas le modèle recommandé pour les nouveaux plugins de canal ;
préférez les sous-chemins génériques de canal, de configuration, de réponse et d'environnement d'exécution de la surface
commune du SDK, sauf si vous assurez directement la maintenance de cette famille de plugins inclus.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - si votre plugin fournit également des modèles
- [Présentation du SDK](/fr/plugins/sdk-overview) - référence complète des importations par sous-chemin
- [Tests du SDK](/fr/plugins/sdk-testing) - utilitaires de test et tests de contrat
- [Manifeste de plugin](/fr/plugins/manifest) - schéma complet du manifeste

## Pages connexes

- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
- [Plugins du harnais d'agent](/fr/plugins/sdk-agent-harness)
