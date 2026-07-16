---
read_when:
    - Vous développez un nouveau plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre l’interface de l’adaptateur ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide pas à pas pour créer un Plugin de canal de messagerie pour OpenClaw
title: Création de plugins de canal
x-i18n:
    generated_at: "2026-07-16T13:41:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Ce guide crée un plugin de canal qui connecte OpenClaw à une plateforme de
messagerie : sécurité des messages privés, appairage, réponses en fil et messagerie sortante.

<Info>
  Vous découvrez les plugins OpenClaw ? Consultez d’abord le guide [Bien démarrer](/fr/plugins/building-plugins)
  pour connaître la structure des paquets et la configuration du manifeste.
</Info>

## Ce que votre plugin prend en charge

Les plugins de canal n’implémentent pas les outils d’envoi, de modification ou de réaction ; le cœur fournit un
outil `message` partagé. Votre plugin prend en charge :

- **Configuration** - résolution des comptes et assistant de configuration
- **Sécurité** - politique des messages privés et listes d’autorisation
- **Appairage** - processus d’approbation des messages privés
- **Grammaire des sessions** - manière dont les identifiants de conversation propres au fournisseur correspondent aux discussions
  de base, aux identifiants de fil et aux replis vers les parents
- **Sortant** - envoi de texte, de médias et de sondages à la plateforme
- **Fils de discussion** - manière dont les réponses sont organisées en fils
- **Indication de saisie du Heartbeat** - signaux facultatifs de saisie ou d’occupation pour les cibles de livraison
  du Heartbeat

Le cœur prend en charge l’outil de messagerie partagé, le câblage des invites, la forme externe de la clé de session,
la tenue de registres générique `:thread:` et la distribution.

## Adaptateur de messages

Exposez un adaptateur `message` avec `defineChannelMessageAdapter` depuis
`openclaw/plugin-sdk/channel-outbound`. Déclarez uniquement les capacités durables
d’envoi final réellement prises en charge par votre transport natif, avec un test de contrat
qui prouve l’effet de bord natif et l’accusé de réception renvoyé. Faites pointer les envois de texte et de médias
vers les mêmes fonctions de transport que celles utilisées par l’ancien adaptateur `outbound`. Pour
le contrat complet de l’API, la matrice des capacités, les règles d’accusé de réception, la finalisation
de l’aperçu en direct, la politique d’accusé de réception, les tests et le tableau de migration, consultez
[API sortante des canaux](/fr/plugins/sdk-channel-outbound).

Si votre adaptateur `outbound` existant dispose déjà des méthodes d’envoi et
des métadonnées de capacité appropriées, dérivez l’adaptateur `message` avec
`createChannelMessageAdapterFromOutbound(...)` au lieu d’écrire manuellement un autre
pont. Les envois de l’adaptateur renvoient des valeurs `MessageReceipt`. Pour les anciens identifiants, dérivez-les
avec `listMessageReceiptPlatformIds(...)` ou
`resolveMessageReceiptPrimaryId(...)` au lieu de conserver des champs `messageIds`
parallèles.

Déclarez précisément les capacités en direct et de finalisation : le cœur les utilise pour déterminer
ce qu’un canal peut faire, et toute divergence entre le comportement déclaré et le comportement réel entraîne
l’échec d’un test de contrat :

| Surface                               | Valeurs                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Les canaux qui finalisent sur place un brouillon d’aperçu doivent acheminer la logique d’exécution
par `defineFinalizableLivePreviewAdapter(...)` avec
`deliverWithFinalizableLivePreviewAdapter(...)`, et veiller à ce que les capacités déclarées
soient couvertes par les tests `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
et `verifyChannelMessageLiveFinalizerProofs(...)`, afin que le comportement natif de l’aperçu,
de la progression, de la modification, du repli ou de la conservation, du nettoyage et des accusés de réception ne puisse pas diverger
silencieusement.

Les récepteurs entrants qui diffèrent les accusés de réception de la plateforme doivent déclarer
`message.receive.defaultAckPolicy` et `supportedAckPolicies` au lieu de masquer
le moment de l’accusé de réception dans un état local au moniteur. Couvrez chaque politique déclarée avec
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Les anciens assistants de réponse tels que `dispatchInboundReplyWithBase` et
`recordInboundSessionAndDispatchReply` restent disponibles pour les distributeurs
de compatibilité. Ne les utilisez pas pour le nouveau code de canal ; commencez plutôt par l’adaptateur `message`,
les accusés de réception et les assistants de cycle de vie de réception et d’envoi sur
`openclaw/plugin-sdk/channel-outbound`.

### Réception des messages entrants (expérimental)

Les canaux qui migrent l’autorisation des messages entrants peuvent utiliser le sous-chemin expérimental
`openclaw/plugin-sdk/channel-ingress-runtime` depuis les chemins de réception
d’exécution. Il accepte les données de la plateforme, les listes d’autorisation brutes, les descripteurs de route, les données
de commande et la configuration des groupes d’accès, puis renvoie les projections d’expéditeur, de route, de commande et d’activation,
ainsi que le graphe de réception ordonné, tandis que la recherche sur la plateforme et les
effets de bord restent dans le plugin. Conservez la normalisation de l’identité du plugin dans le
descripteur transmis au résolveur ; ne sérialisez pas les valeurs de correspondance brutes
depuis l’état ou la décision résolus. Consultez
[API de réception des canaux](/fr/plugins/sdk-channel-ingress) pour la conception de l’API,
la limite de responsabilité et les exigences de test.

### Indicateurs de saisie

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses entrantes, exposez
`heartbeat.sendTyping(...)` sur le plugin de canal. Le cœur l’appelle avec la
cible de livraison du Heartbeat résolue avant le début de l’exécution du modèle de Heartbeat et
utilise le cycle de vie partagé de maintien et de nettoyage de l’indicateur de saisie. Ajoutez
`heartbeat.clearTyping(...)` lorsque la plateforme nécessite un signal d’arrêt explicite.

### Paramètres de source multimédia

Si votre canal ajoute à l’outil de messagerie des paramètres contenant des sources multimédias, exposez
les noms de ces paramètres via `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Le cœur utilise cette liste explicite pour normaliser les chemins du bac à sable et appliquer
la politique d’accès aux médias sortants, afin que les plugins n’aient pas besoin de cas particuliers dans le cœur partagé pour
les paramètres propres au fournisseur concernant les avatars, les pièces jointes ou les images de couverture.

Préférez une table indexée par action telle que `{ "set-profile": ["avatarUrl", "avatarPath"] }`,
afin que les actions sans rapport n’héritent pas des arguments multimédias d’une autre action. Un tableau simple
convient toujours aux paramètres intentionnellement partagés entre toutes les actions exposées.

Les canaux qui doivent exposer une URL publique temporaire pour permettre à la plateforme de récupérer un média
peuvent utiliser `createHostedOutboundMediaStore(...)` depuis
`openclaw/plugin-sdk/outbound-media` avec les magasins d’état du plugin. Conservez l’analyse
des routes de la plateforme et l’application des jetons dans le plugin de canal ; l’assistant partagé
prend uniquement en charge le chargement des médias, les métadonnées d’expiration, les lignes de fragments et le nettoyage.

### Mise en forme des charges utiles natives

Si votre canal nécessite une mise en forme propre au fournisseur pour `message(action="send")`,
préférez `actions.prepareSendPayload(...)`. Placez les cartes, blocs, intégrations ou
autres données durables natives sous `payload.channelData.<channel>` et laissez le cœur effectuer l’envoi
via l’adaptateur sortant ou de messages. Utilisez `actions.handleAction(...)` pour l’envoi
uniquement comme repli de compatibilité pour les charges utiles qui ne peuvent pas être sérialisées puis retentées.

### Grammaire des conversations de session

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, conservez cette analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. Il s’agit du
point d’extension canonique pour associer `rawId` à l’identifiant de conversation de base, à un
identifiant de fil facultatif, à un `baseConversationId` explicite
et à tout `parentConversationCandidates`. Lorsque vous renvoyez `parentConversationCandidates`,
classez-les du parent le plus spécifique à la conversation la plus générale ou de base.

`messaging.resolveParentConversationCandidates(...)` est un repli de compatibilité
obsolète destiné aux plugins qui nécessitent uniquement des replis vers les parents en plus de
l’identifiant générique ou brut. Si les deux points d’extension existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se replie sur
`resolveParentConversationCandidates(...)` que lorsque le point d’extension canonique
les omet.

Les plugins intégrés qui nécessitent la même analyse avant le démarrage du registre des canaux
peuvent exposer un fichier `session-key-api.ts` de premier niveau avec une exportation
`resolveSessionConversation(...)` correspondante (consultez les plugins Feishu et Telegram).
Le cœur utilise cette surface compatible avec l’amorçage uniquement lorsque le registre des plugins
d’exécution n’est pas encore disponible.

Utilisez `openclaw/plugin-sdk/channel-route` lorsque le code du plugin doit normaliser
des champs de type route, comparer un fil enfant à sa route parente ou créer une
clé de déduplication stable depuis `{ channel, to, accountId, threadId }`. L’assistant
normalise les identifiants de fil numériques de la même manière que le cœur ; préférez-le donc aux comparaisons
`String(threadId)` ponctuelles. Les plugins dotés d’une grammaire de cible propre au fournisseur
doivent exposer `messaging.resolveOutboundSessionRoute(...)` afin que le cœur obtienne
l’identité de session et de fil native du fournisseur sans adaptateurs d’analyse.

### Prise en charge des liaisons de conversation propres au compte

Définissez `conversationBindings.supportsCurrentConversationBinding` lorsque le canal
prend en charge les liaisons génériques de la conversation actuelle. `createChatChannelPlugin(...)`
définit par défaut cette capacité statique sur `true`.

Si la prise en charge varie selon le compte configuré, implémentez également
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Le cœur n’évalue ce point d’extension synchrone qu’une fois la capacité statique
activée. Renvoyer `false` rend les opérations génériques de capacité,
de liaison, de recherche, de liste, de mise à jour et de déliaison de la conversation actuelle indisponibles pour ce compte.
L’omission du point d’extension applique la capacité statique à tous les comptes.

Déterminez la réponse à partir de la configuration du compte ou de l’état d’exécution déjà chargés. Ce
point d’extension régit uniquement les liaisons génériques de la conversation actuelle ; il ne remplace pas
les règles de liaison configurées ni le routage des sessions pris en charge par le plugin. Les tests de contrat
doivent couvrir au moins un compte pris en charge et un compte non pris en charge au moyen du
contrat `ChannelPlugin["conversationBindings"]` exporté par
`openclaw/plugin-sdk/channel-core`.

## Approbations et capacités des canaux

La plupart des plugins de canal n’ont pas besoin de code propre aux approbations. Le cœur prend en charge
`/approve` dans la même discussion, les charges utiles partagées des boutons d’approbation et la livraison de repli générique.
`ChannelPlugin.approvals` a été supprimé ; placez plutôt les données de livraison, de rendu, d’autorisation
et natives liées aux approbations dans un seul objet `approvalCapability`. `plugin.auth` concerne uniquement
la connexion et la déconnexion : le cœur ne lit plus les points d’extension d’autorisation des approbations depuis cet objet.

Utilisez `approvalCapability.delivery` uniquement pour le routage natif des approbations ou la suppression
du repli, et `approvalCapability.render` uniquement lorsqu’un canal nécessite réellement
des charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.

### Autorisation des approbations

- `approvalCapability.authorizeActorAction` et
  `approvalCapability.getActionAvailabilityState` constituent le point d’extension canonique
  d’autorisation des approbations.
- Utilisez `getActionAvailabilityState` pour connaître la disponibilité de l’autorisation des approbations dans la même discussion.
  Maintenez les approbateurs configurés disponibles pour `/approve`, même lorsque la livraison native
  est désactivée ; utilisez plutôt l’état natif de la surface d’origine pour les indications de livraison et de configuration.
- Si votre canal expose des approbations natives d’exécution, utilisez
  `approvalCapability.getExecInitiatingSurfaceState` pour représenter
  l’état de la surface d’origine ou du client natif lorsqu’il diffère de l’autorisation des approbations
  dans la même discussion. Le cœur utilise ce point d’extension propre à l’exécution pour distinguer `enabled` de
  `disabled`, déterminer si le canal d’origine prend en charge les approbations natives d’exécution
  et inclure le canal dans les indications de repli du client natif.
  `createApproverRestrictedNativeApprovalCapability(...)` renseigne cette valeur dans
  le cas courant.
- Si un canal peut déduire des identités de messages privés stables, semblables à celles d’un propriétaire, à partir de la configuration existante,
  utilisez `createResolvedApproverActionAuthAdapter` depuis
  `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même discussion
  sans ajouter de logique propre aux approbations dans le cœur.
- Si l’autorisation personnalisée des approbations n’autorise intentionnellement que le repli dans la même discussion, renvoyez
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` depuis
  `openclaw/plugin-sdk/approval-auth-runtime` ; sinon, le cœur considère le
  résultat comme une autorisation explicite de l’approbateur.
- Si un rappel natif pris en charge par le canal résout directement les approbations, utilisez
  `isImplicitSameChatApprovalAuthorization(...)` avant la résolution afin que le repli
  implicite passe toujours par l’autorisation normale de l’acteur du canal.

### Cycle de vie des charges utiles et indications de configuration

- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou
  `outbound.beforeDeliverPayload` pour les comportements de cycle de vie des charges utiles propres au canal,
  tels que le masquage des invites locales d’approbation en double ou l’envoi d’indicateurs de saisie
  avant la livraison.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal souhaite
  que la réponse du chemin désactivé explique les paramètres de configuration exacts nécessaires pour activer
  les approbations natives d’exécution. Le point d’extension reçoit `{ channel, channelLabel, accountId }` ;
  les canaux à comptes nommés doivent afficher des chemins propres au compte, tels que
  `channels.<channel>.accounts.<id>.execApprovals.*`, au lieu des valeurs par défaut
  de premier niveau.
- Utilisez `approvalCapability.describePluginApprovalSetup` lorsque les indications relatives aux échecs d’approbation
  du plugin peuvent être affichées sans risque pour les échecs d’approbation du plugin dus à l’absence de route ou à un dépassement
  de délai. `createApproverRestrictedNativeApprovalCapability(...)` ne
  le déduit pas de `describeExecApprovalSetup` ; transmettez explicitement le même assistant
  uniquement lorsque les approbations du plugin et d’exécution utilisent réellement la même configuration native.

### Livraison native des approbations

Si un canal nécessite une livraison native des approbations, limitez le code du canal
à la normalisation des cibles ainsi qu’aux données de transport et de présentation. Utilisez
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver` et
`createApproverRestrictedNativeApprovalCapability` depuis
`openclaw/plugin-sdk/approval-runtime`. Placez les données propres au canal derrière
`approvalCapability.nativeRuntime`, idéalement au moyen de
`createChannelApprovalNativeRuntimeAdapter(...)` ou
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le
gestionnaire et prendre en charge le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement
au Gateway et les notifications de routage vers une autre destination.

`nativeRuntime` est divisé en plusieurs points d’extension plus petits :

- `availability` - indique si le compte est configuré et si une requête
  doit être traitée
- `presentation` - convertit le modèle de vue partagé des approbations en
  charges utiles natives en attente/résolues/expirées ou en actions finales
- `transport` - prépare les cibles et envoie/met à jour/supprime les messages
  d’approbation natifs
- `interactions` - hooks facultatifs de liaison/dissociation/effacement d’action pour les boutons
  ou réactions natifs, ainsi qu’un hook `cancelDelivered` facultatif. Implémentez
  `cancelDelivered` lorsque `deliverPending` enregistre un état en cours de processus
  ou persistant (tel qu’un magasin de cibles de réaction), afin que cet état puisse être libéré si
  l’arrêt d’un gestionnaire annule la livraison avant l’exécution de `bindPending`, ou lorsque
  `bindPending` ne renvoie aucun handle
- `observe` - hooks facultatifs de diagnostic de livraison

Autres assistants d’approbation :

- Utilisez `createNativeApprovalChannelRouteGates` depuis
  `openclaw/plugin-sdk/approval-native-runtime` lorsqu’un canal prend en charge à la fois
  la livraison native provenant de la session et des cibles explicites de transfert des approbations. Cet
  assistant centralise la sélection de la configuration des approbations, la gestion de `mode`, les filtres
  d’agent/de session, la liaison de compte, la correspondance des cibles de session et celle des listes de cibles,
  tandis que les appelants restent responsables de l’identifiant du canal, du mode de transfert par défaut, de la
  recherche de compte, de la vérification de l’activation du transport, de la normalisation des cibles et de la
  résolution de la cible de la source du tour. Ne l’utilisez pas pour créer des valeurs par défaut de politique de canal
  détenues par le cœur ; transmettez explicitement le mode par défaut documenté du canal.
- `createChannelNativeOriginTargetResolver` utilise par défaut le moteur partagé de
  correspondance des routes de canal pour les cibles `{ to, accountId, threadId }`. Transmettez
  `targetsMatch` uniquement lorsqu’un canal possède des règles d’équivalence propres au fournisseur,
  telles que la correspondance des préfixes d’horodatage Slack. Transmettez `normalizeTargetForMatch` lorsque
  le canal doit canoniser les identifiants du fournisseur avant l’exécution du moteur de correspondance de routes
  par défaut ou d’un callback `targetsMatch` personnalisé, tout en préservant la
  cible d’origine pour la livraison. Utilisez `normalizeTarget` uniquement lorsque la cible de
  livraison résolue elle-même doit être canonisée.
- Si le canal nécessite des objets détenus par le runtime, tels qu’un client, un jeton, une application
  Bolt ou un récepteur de Webhook, enregistrez-les via
  `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique du contexte de runtime
  permet au cœur d’amorcer des gestionnaires fondés sur les capacités à partir de l’état de
  démarrage du canal, sans ajouter de code de liaison propre aux approbations.
- N’utilisez les éléments de plus bas niveau `createChannelApprovalHandler` ou
  `createChannelNativeApprovalRuntime` que lorsque le point d’intégration fondé sur les capacités
  n’est pas encore suffisamment expressif.
- Les canaux d’approbation natifs doivent acheminer à la fois `accountId` et `approvalKind`
  via ces assistants. `accountId` limite la politique d’approbation multicomptes
  au bon compte de bot, et `approvalKind` permet au canal de conserver
  les comportements d’approbation d’exécution et de Plugin sans branches codées en dur dans
  le cœur.
- Le cœur détient également les notifications de réacheminement des approbations. Les plugins de canal ne doivent pas envoyer
  leurs propres messages de suivi « l’approbation a été envoyée dans les messages privés / un autre canal » depuis
  `createChannelNativeApprovalRuntime` ; ils doivent plutôt exposer un acheminement précis de l’origine et
  des messages privés de l’approbateur au moyen des assistants partagés de capacité d’approbation, puis laisser
  le cœur agréger les livraisons réelles avant de publier une éventuelle notification dans la
  discussion d’origine.
- Préservez de bout en bout le type de l’identifiant d’approbation livré. Les clients natifs ne doivent
  ni deviner ni réécrire l’acheminement des approbations d’exécution et de Plugin à partir de l’état
  local au canal.
- Transmettez ce `approvalKind` explicite à `resolveApprovalOverGateway`. Cela utilise
  le service canonique `approval.resolve` et renvoie le gagnant enregistré lorsqu’une
  autre surface répond en premier. L’ancienne entrée explicite `resolveMethod`
  reste disponible pour les contrôles fondés sur des commandes ; les nouvelles actions natives ne doivent pas l’utiliser ni
  déduire le type à partir d’un identifiant.
- Différents types d’approbation peuvent intentionnellement exposer des surfaces natives
  différentes. Exemples groupés actuels : Matrix conserve le même acheminement natif vers les messages privés/canaux
  et la même expérience de réactions pour les approbations d’exécution et de Plugin, tout en permettant
  à l’authentification de varier selon le type d’approbation ; Slack maintient l’acheminement natif des approbations
  pour les identifiants d’exécution et de Plugin.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours en tant que
  wrapper de compatibilité, mais le nouveau code doit privilégier le générateur de capacités
  et exposer `approvalCapability` sur le Plugin.

### Sous-chemins plus ciblés du runtime d’approbation

Pour les points d’entrée de canal critiques, privilégiez ces sous-chemins plus ciblés plutôt que le barrel plus large
`approval-runtime` lorsque vous n’avez besoin que d’une partie de cette famille :

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
`openclaw/plugin-sdk/reply-chunking` plutôt que des surfaces englobantes plus larges lorsque vous
n’avez pas besoin de toutes.

### Sous-chemins de configuration

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration sûrs pour le runtime :
  `createSetupTranslator`, les adaptateurs de correctifs de configuration sûrs à importer
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), la sortie des notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les générateurs
  délégués de proxy de configuration.
- `openclaw/plugin-sdk/channel-setup` couvre les générateurs de configuration
  d’installation facultative ainsi que quelques primitives sûres pour la configuration : `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled` et `splitSetupEntries`.
- N’utilisez le point d’intégration plus large `openclaw/plugin-sdk/setup` que lorsque vous avez également besoin
  des assistants partagés plus lourds de configuration, tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Si votre canal souhaite uniquement afficher « installez d’abord ce Plugin » dans les
surfaces de configuration, privilégiez `createOptionalChannelSetupSurface(...)`. L’adaptateur et
l’assistant générés échouent de manière fermée lors des écritures de configuration et de la finalisation, et réutilisent
le même message d’installation requise pour la validation, la finalisation et le texte
du lien vers la documentation.

Si votre canal prend en charge une configuration ou une authentification pilotée par l’environnement et que les flux génériques
de démarrage/configuration doivent connaître ces noms de variables d’environnement avant le chargement du runtime, déclarez-les dans le
manifeste du Plugin avec `channelEnvVars`. Conservez le runtime du canal `envVars` ou les
constantes locales uniquement pour les textes destinés aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou
les analyses SecretRef avant le démarrage du runtime du Plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans les chemins de commandes
en lecture seule et doit renvoyer les métadonnées du canal, l’adaptateur de configuration sûr pour la
configuration, l’adaptateur d’état et les métadonnées des cibles secrètes du canal nécessaires à ces
résumés. Ne démarrez pas de clients, d’écouteurs ni de runtimes de transport depuis
l’entrée de configuration.

Gardez également étroit le chemin d’importation de l’entrée principale du canal. La découverte peut évaluer
l’entrée et le module du Plugin de canal afin d’enregistrer les capacités sans
activer le canal. Les fichiers tels que `channel-plugin-api.ts` doivent exporter
l’objet du Plugin de canal sans importer d’assistants de configuration, de clients
de transport, d’écouteurs de sockets, de lanceurs de sous-processus ni de modules de démarrage de service.
Placez ces éléments du runtime dans des modules chargés depuis `registerFull(...)`, des mutateurs
du runtime ou des adaptateurs de capacités chargés à la demande.

### Autres sous-chemins de canal ciblés

Pour les autres chemins de canal critiques, privilégiez les assistants ciblés plutôt que les anciennes
surfaces plus larges :

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multicomptes et
  le repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/channel-inbound` pour la route/l’enveloppe entrante et
  le câblage de l’enregistrement et de la distribution
- `openclaw/plugin-sdk/channel-targets` pour les assistants d’analyse des cibles
- `openclaw/plugin-sdk/outbound-media` pour le chargement des médias et
  `openclaw/plugin-sdk/channel-outbound` pour les délégués d’identité/d’envoi sortants
  et la planification des charges utiles
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver
  un `replyToId`/`threadId` explicite ou récupérer la session `:thread:`
  actuelle après que la clé de session de base correspond toujours. Les plugins de fournisseur peuvent
  remplacer la priorité, le comportement des suffixes et la normalisation de l’identifiant de fil lorsque
  leur plateforme possède une sémantique native de livraison dans les fils.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fils
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une ancienne disposition des champs de charge utile
  d’agent/de média reste requise
- `openclaw/plugin-sdk/telegram-command-config` (obsolète : aucun Plugin
  groupé ne l’utilise en production) pour la normalisation des commandes personnalisées de Telegram,
  la validation des doublons/conflits et un contrat de configuration des commandes
  stable en cas de repli ; privilégiez la gestion locale au Plugin de la configuration des commandes pour le nouveau code de Plugin

Les canaux limités à l’authentification peuvent généralement s’en tenir au chemin par défaut : le cœur gère
les approbations et le Plugin expose simplement les capacités de sortie/d’authentification. Les canaux
d’approbation natifs tels que Matrix, Slack, Telegram et les transports de discussion personnalisés
doivent utiliser les assistants natifs partagés plutôt que d’implémenter leur propre cycle de vie
des approbations.

## Politique de mentions entrantes

Conservez le traitement des mentions entrantes en deux couches :

- collecte des preuves détenue par le Plugin
- évaluation de la politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mentions.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel
plus large des assistants entrants.

Logique locale au Plugin appropriée :

- détection des réponses au bot
- détection des citations du bot
- vérifications de participation au fil
- exclusions des messages de service/système
- caches natifs de la plateforme nécessaires pour prouver la participation du bot

Éléments adaptés à l’assistant partagé :

- `requireMention`
- résultat de la mention explicite
- liste d’autorisation des mentions implicites
- contournement par commande
- décision finale d’ignorer

Flux recommandé :

1. Calculez les faits locaux relatifs aux mentions.
2. Transmettez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
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

`matchesMentionWithExplicit(...)` renvoie un booléen. `hasAnyMention`,
`isExplicitlyMentioned` et `canResolveExplicit` proviennent des métadonnées de mention
natives propres au canal (entités de message, indicateurs de réponse au bot et éléments similaires) ;
fournissez les valeurs `false`/`undefined` lorsque votre plateforme ne peut pas les détecter.

`api.runtime.channel.mentions` expose les mêmes assistants partagés de mentions pour
les plugins de canal groupés qui dépendent déjà de l’injection du runtime :
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Si vous avez uniquement besoin de `implicitMentionKindWhen` et `resolveInboundMentionDecision`,
importez-les depuis `openclaw/plugin-sdk/channel-mention-gating` afin d’éviter de charger
des assistants de runtime entrant sans rapport.

## Guide pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers de plugin standard. Le champ `channels` dans
    `openclaw.plugin.json` (et non un champ `kind`) indique qu’un manifeste
    possède un canal. Pour connaître l’ensemble des métadonnées de package, consultez
    [Configuration du plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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
          "blurb": "Connecter OpenClaw à Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
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
    les paramètres appartenant au plugin qui ne font pas partie de la configuration du compte du canal.
    `channelConfigs.acme-chat.schema` valide `channels.acme-chat` et constitue la
    source du chemin d’exécution non critique utilisée par le schéma de configuration, la configuration initiale et les interfaces utilisateur avant le
    chargement de l’environnement d’exécution du plugin. Consultez [Manifeste du plugin](/fr/plugins/manifest) pour la
    référence complète des champs de premier niveau.

  </Step>

  <Step title="Créer l’objet du plugin de canal">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptateur facultatives. Commencez par
    le minimum — `id`, `config` et `setup` — puis ajoutez des adaptateurs selon vos
    besoins.

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
      if (!token) throw new Error("acme-chat: le jeton est requis");
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
        // La résolution et l’inspection des comptes appartiennent à `config`, et non à `setup`.
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

      // Sécurité des messages privés : qui peut envoyer des messages au bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Association : flux d’approbation des nouveaux contacts par message privé
      pairing: {
        text: {
          idLabel: "Nom d’utilisateur Acme Chat",
          message: "Envoyez ce code pour vérifier votre identité :",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Code d’association : ${code}`);
          },
        },
      },

      // Fils de discussion : mode de distribution des réponses
      threading: { topLevelReplyToMode: "reply" },

      // Sortie : envoyer des messages à la plateforme
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

    Pour les canaux qui acceptent à la fois les clés canoniques de messages privés de premier niveau et les anciennes clés imbriquées, utilisez les assistants de `plugin-sdk/channel-config-helpers` : `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` et `normalizeChannelDmPolicy` donnent priorité aux valeurs locales du compte sur les valeurs héritées de la racine. Associez le même résolveur à la réparation du diagnostic via `normalizeLegacyDmAliases`, afin que l’environnement d’exécution et la migration utilisent le même contrat.

    <Accordion title="Ce que createChatChannelPlugin fait pour vous">
      Au lieu d’implémenter manuellement les interfaces d’adaptateur de bas niveau, vous fournissez
      des options déclaratives que le générateur compose :

      | Option | Éléments connectés |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité des messages privés limité à la portée des champs de configuration |
      | `pairing.text` | Flux d’association par message privé fondé sur du texte, avec échange de code |
      | `threading` | Résolveur du mode de réponse (fixe, limité au compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) ; nécessite un identifiant `channel` adjacent afin que le cœur puisse annoter le résultat de distribution renvoyé |

      Vous pouvez également transmettre directement des objets d’adaptateur bruts à la place des options déclaratives
      si vous avez besoin d’un contrôle total.

      Les adaptateurs de sortie bruts peuvent définir une fonction `chunker(text, limit, ctx)`.
      Le champ facultatif `ctx.formatting` contient les décisions de mise en forme prises au moment de la distribution,
      telles que `maxLinesPerMessage` ; appliquez-le avant l’envoi afin que le fil des réponses
      et les limites des fragments soient déterminés une seule fois par la distribution de sortie partagée.
      Les contextes d’envoi incluent également `replyToIdSource` (`implicit` ou `explicit`)
      lorsqu’une cible de réponse native a été résolue, afin que les assistants de charge utile puissent conserver
      les balises de réponse explicites sans consommer un emplacement implicite de réponse à usage unique.
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
      description: "Plugin de canal Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gestion d’Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestion d’Acme Chat",
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

    Placez les descripteurs de CLI appartenant au canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer l’environnement d’exécution complet du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement
    réel des commandes. Réservez `registerFull(...)` aux opérations propres à l’environnement d’exécution.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement.
    Si `registerFull(...)` enregistre des méthodes RPC du Gateway, utilisez un
    préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et sont toujours
    résolus vers `operator.admin`. Consultez
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour connaître toutes les
    options.

  </Step>

  <Step title="Ajouter un point d’entrée de configuration">
    Créez `setup-entry.ts` pour un chargement léger pendant l’intégration :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ce point d’entrée à la place du point d’entrée complet lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code d’exécution lourd pendant les flux de configuration.
    Consultez [Configuration](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux intégrés à l’espace de travail qui séparent les exports sûrs pour la configuration dans des
    modules annexes peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont également besoin d’un
    mécanisme explicite de définition de l’environnement d’exécution au moment de la configuration.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir les messages de la plateforme et les transmettre à
    OpenClaw. Le modèle habituel consiste à utiliser un Webhook qui vérifie la requête et
    la transmet au gestionnaire des messages entrants de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // authentification gérée par le plugin (vérifiez vous-même les signatures)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Votre gestionnaire de messages entrants transmet le message à OpenClaw.
          // Le câblage exact dépend du SDK de votre plateforme —
          // consultez un exemple réel dans le package du plugin Microsoft Teams ou Google Chat intégré.
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
      son propre pipeline de messages entrants. Consultez les plugins de canal intégrés
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
├── package.json              # Métadonnées openclaw.channel
├── openclaw.plugin.json      # Manifeste avec schéma de configuration
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exportations publiques (facultatif)
├── runtime-api.ts            # Exportations internes d’exécution (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Client API de la plateforme
    └── runtime.ts            # Stockage d’exécution (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fils de discussion" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, propres au compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de messagerie" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte des actions
  </Card>
  <Card title="Résolution de la cible" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Utilitaires d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
  <Card title="API entrante du canal" icon="bolt" href="/fr/plugins/sdk-channel-inbound">
    Cycle de vie partagé des événements entrants : ingestion, résolution, enregistrement, distribution, finalisation
  </Card>
</CardGroup>

<Note>
Certaines interfaces utilitaires groupées existent encore pour la maintenance et
la compatibilité des plugins groupés. Elles ne constituent pas le modèle recommandé pour les nouveaux plugins de canal ;
privilégiez les sous-chemins génériques de canal, de configuration, de réponse et d’exécution de la surface
du SDK commun, sauf si vous assurez directement la maintenance de cette famille de plugins groupés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) - si votre plugin fournit également des modèles
- [Présentation du SDK](/fr/plugins/sdk-overview) - référence complète des importations par sous-chemin
- [Tests du SDK](/fr/plugins/sdk-testing) - utilitaires de test et tests de contrat
- [Manifeste du plugin](/fr/plugins/manifest) - schéma complet du manifeste

## Pages connexes

- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
- [Plugins du banc d’essai d’agent](/fr/plugins/sdk-agent-harness)
