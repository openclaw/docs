---
read_when:
    - Implémentation des hooks d’exécution des fournisseurs, du cycle de vie des canaux ou des packs de packages
    - Débogage de l’ordre de chargement des Plugins ou de l’état du registre
    - Ajout d’une nouvelle capacité de Plugin ou d’un Plugin de moteur de contexte
summary: 'Éléments internes de l’architecture des Plugin : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: Détails internes de l’architecture Plugin
x-i18n:
    generated_at: "2026-04-30T07:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle public des capacités, les formes de Plugin et les contrats de propriété/exécution, consultez [Architecture des Plugins](/fr/plugins/architecture). Cette page est la référence pour les mécanismes internes : pipeline de chargement, registre, hooks de runtime, routes HTTP du Gateway, chemins d’importation et tableaux de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw effectue globalement les opérations suivantes :

1. découvrir les racines de Plugins candidates
2. lire les manifests de bundles natifs ou compatibles et les métadonnées de package
3. rejeter les candidats non sûrs
4. normaliser la configuration des Plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décider de l’activation de chaque candidat
6. charger les modules natifs activés : les modules intégrés compilés utilisent un chargeur natif ;
   les Plugins natifs non compilés utilisent jiti
7. appeler les hooks natifs `register(api)` et collecter les enregistrements dans le registre des Plugins
8. exposer le registre aux commandes/surfaces de runtime

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les Plugins intégrés utilisent `register` ; préférez `register` pour les nouveaux Plugins.
</Note>

Les barrières de sécurité interviennent **avant** l’exécution du runtime. Les candidats sont bloqués
lorsque l’entrée sort de la racine du Plugin, que le chemin est accessible en écriture à tous, ou que la propriété du chemin semble suspecte pour les Plugins non intégrés.

### Comportement orienté manifest

Le manifest est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le Plugin
- découvrir les canaux/skills/schéma de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/espaces réservés de l’interface de contrôle
- afficher les métadonnées d’installation/catalogue
- conserver des descripteurs d’activation et de configuration peu coûteux sans charger le runtime du Plugin

Pour les Plugins natifs, le module de runtime est la partie du plan de données. Il enregistre
le comportement réel, comme les hooks, outils, commandes ou flux de fournisseur.

Les blocs optionnels de manifest `activation` et `setup` restent sur le plan de contrôle.
Ce sont des descripteurs uniquement métadonnées pour la planification de l’activation et la découverte de la configuration ;
ils ne remplacent pas l’enregistrement du runtime, `register(...)`, ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indices de commandes, canaux et fournisseurs du manifest
pour réduire le chargement des Plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux Plugins qui possèdent la commande principale demandée
- la résolution de configuration/Plugin de canal se limite aux Plugins qui possèdent l’identifiant de canal demandé
- la résolution explicite de configuration/runtime de fournisseur se limite aux Plugins qui possèdent l’identifiant de fournisseur demandé
- la planification du démarrage du Gateway utilise `activation.onStartup` pour les imports explicites au démarrage et les exclusions du démarrage ; chaque Plugin doit le déclarer à mesure qu’OpenClaw s’éloigne des imports implicites au démarrage, tandis que les Plugins sans métadonnées de capacité statiques et sans `activation.onStartup` utilisent encore, par compatibilité, le repli déprécié du side-car implicite au démarrage

Le planificateur d’activation expose à la fois une API uniquement fondée sur les ids pour les appelants existants et une API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un Plugin a été sélectionné, en séparant les indices explicites du planificateur `activation.*` du repli de propriété du manifest, comme `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` et les hooks. Cette séparation des raisons est la frontière de compatibilité :
les métadonnées existantes des Plugins continuent de fonctionner, tandis que le nouveau code peut détecter des indices larges ou un comportement de repli sans modifier la sémantique de chargement du runtime.

La découverte de configuration préfère désormais les ids détenus par les descripteurs, comme `setup.providers` et `setup.cliBackends`, afin de réduire les Plugins candidats avant de revenir à `setup-api` pour les Plugins qui nécessitent encore des hooks de runtime au moment de la configuration. Les listes de configuration de fournisseurs utilisent le manifest `providerAuthChoices`, les choix de configuration dérivés des descripteurs et les métadonnées du catalogue d’installation sans charger le runtime du fournisseur. `setup.requiresRuntime: false` explicite est une coupure limitée au descripteur ; `requiresRuntime` omis conserve le repli hérité `setup-api` par compatibilité. Si plusieurs Plugins découverts revendiquent le même identifiant normalisé de fournisseur de configuration ou de backend CLI, la recherche de configuration refuse le propriétaire ambigu au lieu de dépendre de l’ordre de découverte. Lorsque le runtime de configuration s’exécute, les diagnostics du registre signalent les dérives entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou backends CLI enregistrés par setup-api, sans bloquer les Plugins hérités.

### Frontière du cache des Plugins

OpenClaw ne met pas en cache les résultats de découverte des Plugins ni les données directes du registre de manifests derrière des fenêtres fondées sur l’horloge murale. Les installations, modifications de manifest et changements de chemins de chargement doivent devenir visibles à la prochaine lecture explicite des métadonnées ou reconstruction de snapshot.
L’analyseur du fichier manifest peut conserver un cache borné de signature de fichier, indexé par le chemin du manifest ouvert, l’inode, la taille et les horodatages ; ce cache évite seulement de réanalyser des octets inchangés et ne doit pas mettre en cache les réponses de découverte, de registre, de propriétaire ou de politique.

Le chemin rapide sûr des métadonnées repose sur une propriété explicite d’objet, pas sur un cache caché.
Les chemins critiques de démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` courant, le `PluginLookUpTable` dérivé ou un registre de manifest explicite dans la chaîne d’appels. La validation de configuration, l’activation automatique au démarrage, l’amorçage des Plugins et la sélection de fournisseur peuvent réutiliser ces objets tant qu’ils représentent la configuration et l’inventaire de Plugins courants. La recherche de configuration reconstruit encore les métadonnées de manifest à la demande, sauf si le chemin de configuration spécifique reçoit un registre de manifest explicite ; conservez cela comme repli de chemin froid plutôt que d’ajouter des caches de recherche cachés. Lorsque l’entrée change, reconstruisez et remplacez le snapshot au lieu de le muter ou de conserver des copies historiques.
Les vues sur le registre actif des Plugins et les assistants d’amorçage des canaux intégrés doivent être recalculées à partir du registre/de la racine courants. Les maps à courte durée de vie conviennent à l’intérieur d’un seul appel pour dédupliquer le travail ou protéger contre la réentrée ; elles ne doivent pas devenir des caches de métadonnées de processus.

Pour le chargement des Plugins, la couche de cache persistante est le chargement du runtime. Elle peut réutiliser l’état du chargeur lorsque du code ou des artefacts installés sont réellement chargés, par exemple :

- `PluginLoaderCacheState` et les registres de runtime actifs compatibles
- les caches jiti/module et les caches de chargeur de surface publique utilisés pour éviter d’importer plusieurs fois la même surface de runtime
- les miroirs de dépendances de runtime et caches de système de fichiers pour les artefacts de Plugins installés
- les maps à courte durée de vie par appel pour la normalisation des chemins ou la résolution des doublons

Ces caches sont des détails d’implémentation du plan de données. Ils ne doivent pas répondre à des questions du plan de contrôle telles que « quel Plugin possède ce fournisseur ? », sauf si l’appelant a délibérément demandé le chargement du runtime.

N’ajoutez pas de caches persistants ou fondés sur l’horloge murale pour :

- les résultats de découverte
- les registres directs de manifests
- les registres de manifests reconstruits à partir de l’index des Plugins installés
- la recherche de propriétaire de fournisseur, la suppression de modèles, la politique de fournisseur ou les métadonnées d’artefact public
- toute autre réponse dérivée d’un manifest où un manifest modifié, un index installé ou un chemin de chargement doit être visible à la prochaine lecture des métadonnées

Les appelants qui reconstruisent les métadonnées de manifest à partir de l’index persistant des Plugins installés reconstruisent ce registre à la demande. L’index installé est un état durable du plan source ; ce n’est pas un cache de métadonnées en processus caché.

## Modèle de registre

Les Plugins chargés ne mutent pas directement des variables globales aléatoires du cœur. Ils s’enregistrent dans un registre central de Plugins.

Le registre suit :

- les enregistrements de Plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC du Gateway
- les routes HTTP
- les registraires CLI
- les services d’arrière-plan
- les commandes détenues par des Plugins

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de communiquer directement avec les modules de Plugins. Cela maintient le chargement à sens unique :

- module de Plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n’ont besoin que d’un seul point d’intégration : « lire le registre », et non « traiter chaque module de Plugin comme un cas particulier ».

## Callbacks de liaison de conversation

Les Plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après l’approbation ou le refus d’une demande de liaison :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indice de détachement, l’identifiant de l’expéditeur et les métadonnées de conversation

Ce callback sert uniquement de notification. Il ne change pas qui est autorisé à lier une conversation, et il s’exécute après la fin du traitement d’approbation par le cœur.

## Hooks de runtime de fournisseur

Les Plugins de fournisseur ont trois couches :

- **Métadonnées de manifest** pour une recherche peu coûteuse avant runtime :
  `setup.providers[].envVars`, la compatibilité dépréciée `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (`discovery` hérité) plus
  `applyConfigDefaults`.
- **Hooks de runtime** : plus de 40 hooks optionnels couvrant l’authentification, la résolution des modèles,
  l’enveloppement de flux, les niveaux de réflexion, la politique de relecture et les points de terminaison d’usage. Consultez
  la liste complète sous [Ordre et utilisation des hooks](#hook-order-and-usage).

OpenClaw possède encore la boucle générique de l’agent, le basculement, la gestion du transcript et la politique d’outils. Ces hooks constituent la surface d’extension pour le comportement propre aux fournisseurs sans nécessiter un transport d’inférence entièrement personnalisé.

Utilisez le manifest `setup.providers[].envVars` lorsque le fournisseur dispose d’identifiants fondés sur l’environnement que les chemins génériques d’authentification/statut/sélecteur de modèles doivent voir sans charger le runtime du Plugin. `providerAuthEnvVars` déprécié est encore lu par l’adaptateur de compatibilité pendant la fenêtre de dépréciation, et les Plugins non intégrés qui l’utilisent reçoivent un diagnostic de manifest. Utilisez le manifest `providerAuthAliases` lorsqu’un identifiant de fournisseur doit réutiliser les variables d’environnement, profils d’authentification, authentification adossée à la configuration et choix d’intégration de clé d’API d’un autre identifiant de fournisseur. Utilisez le manifest `providerAuthChoices` lorsque les surfaces CLI d’intégration/choix d’authentification doivent connaître l’identifiant de choix du fournisseur, les libellés de groupe et le câblage d’authentification simple par un seul drapeau, sans charger le runtime du fournisseur. Conservez les `envVars` du runtime de fournisseur pour les indices destinés aux opérateurs, comme les libellés d’intégration ou les variables de configuration d’ID client/secret client OAuth.

Utilisez le manifest `channelEnvVars` lorsqu’un canal possède une authentification ou une configuration pilotée par l’environnement que le repli générique de shell-env, les vérifications de configuration/statut ou les invites de configuration doivent voir sans charger le runtime du canal.

### Ordre et utilisation des hooks

Pour les Plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.
Les champs de fournisseur uniquement compatibles qu’OpenClaw n’appelle plus, comme
`ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont volontairement pas
listés ici.

| #   | Hook                              | Ce qu’il fait                                                                                                    | Quand l’utiliser                                                                                                                                             |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publier la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`          | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                                   |
| 2   | `applyConfigDefaults`             | Appliquer les valeurs par défaut globales de configuration propres au fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur                      |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal de registre/catalogue                                                  | _(pas un hook de plugin)_                                                                                                                                     |
| 3   | `normalizeModelId`                | Normaliser les anciens alias ou les alias d’ID de modèle en préversion avant la recherche                       | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                                         |
| 4   | `normalizeTransport`              | Normaliser `api` / `baseUrl` de famille de fournisseurs avant l’assemblage générique du modèle                  | Le fournisseur possède le nettoyage du transport pour des ID de fournisseurs personnalisés dans la même famille de transport                                  |
| 5   | `normalizeConfig`                 | Normaliser `models.providers.<id>` avant la résolution runtime/fournisseur                                      | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les helpers groupés de la famille Google prennent aussi en charge les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Appliquer aux fournisseurs de configuration les réécritures de compatibilité de l’utilisation du streaming natif | Le fournisseur a besoin de correctifs de métadonnées d’utilisation du streaming natif pilotés par le point de terminaison                                    |
| 7   | `resolveConfigApiKey`             | Résoudre l’authentification par marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification runtime | Le fournisseur possède la résolution de clé API par marqueur d’environnement ; `amazon-bedrock` dispose aussi ici d’un résolveur intégré de marqueur d’environnement AWS |
| 8   | `resolveSyntheticAuth`            | Exposer une authentification locale/auto-hébergée ou basée sur la configuration sans conserver le texte en clair | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                                               |
| 9   | `resolveExternalAuthProfiles`     | Superposer les profils d’authentification externes propres au fournisseur ; la valeur par défaut de `persistence` est `runtime-only` pour les identifiants détenus par la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externes sans conserver les jetons d’actualisation copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisser la priorité des espaces réservés de profils synthétiques stockés derrière l’authentification basée sur l’environnement/la configuration | Le fournisseur stocke des profils d’espaces réservés synthétiques qui ne doivent pas avoir la priorité                                                        |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les ID de modèles propres au fournisseur qui ne sont pas encore dans le registre local     | Le fournisseur accepte des ID de modèles amont arbitraires                                                                                                    |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                         | Le fournisseur a besoin de métadonnées réseau avant de résoudre des ID inconnus                                                                               |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner intégré utilise le modèle résolu                                         | Le fournisseur a besoin de réécritures de transport tout en utilisant encore un transport du noyau                                                            |
| 14  | `contributeResolvedModelCompat`   | Contribuer des indicateurs de compatibilité pour les modèles de fournisseurs derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                                 |
| 15  | `normalizeToolSchemas`            | Normaliser les schémas d’outils avant que le runner intégré les voie                                           | Le fournisseur a besoin d’un nettoyage de schéma de famille de transport                                                                                      |
| 16  | `inspectToolSchemas`              | Exposer les diagnostics de schéma propres au fournisseur après normalisation                                    | Le fournisseur veut des avertissements de mots-clés sans enseigner au noyau des règles propres au fournisseur                                                 |
| 17  | `resolveReasoningOutputMode`      | Sélectionner le contrat de sortie de raisonnement natif ou balisé                                              | Le fournisseur a besoin d’un raisonnement/d’une sortie finale balisés au lieu de champs natifs                                                                |
| 18  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                        | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres par fournisseur                                                  |
| 19  | `createStreamFn`                  | Remplacer entièrement le chemin de flux normal par un transport personnalisé                                   | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                                       |
| 20  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                      | Le fournisseur a besoin de wrappers de compatibilité pour les en-têtes/le corps/le modèle de requête sans transport personnalisé                              |
| 21  | `resolveTransportTurnState`       | Joindre des en-têtes ou métadonnées de transport natifs par tour                                               | Le fournisseur veut que les transports génériques envoient l’identité de tour native du fournisseur                                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Joindre des en-têtes WebSocket natifs ou une politique de temporisation de session                             | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                                |
| 23  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` runtime                   | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme personnalisée de jeton runtime                               |
| 24  | `refreshOAuth`                    | Remplacement de l’actualisation OAuth pour des points de terminaison d’actualisation personnalisés ou une politique d’échec d’actualisation | Le fournisseur ne correspond pas aux mécanismes d’actualisation `pi-ai` partagés                                                                              |
| 25  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque l’actualisation OAuth échoue                                               | Le fournisseur a besoin d’une aide de réparation d’authentification propre au fournisseur après un échec d’actualisation                                      |
| 26  | `matchesContextOverflowError`     | Correspondance de dépassement de fenêtre de contexte propre au fournisseur                                     | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                               |
| 27  | `classifyFailoverReason`          | Classification de motif de basculement propre au fournisseur                                                   | Le fournisseur peut mapper les erreurs brutes d’API/de transport vers limite de débit/surcharge/etc.                                                          |
| 28  | `isCacheTtlEligible`              | Politique de cache de prompt pour les fournisseurs proxy/backhaul                                              | Le fournisseur a besoin d’un contrôle TTL de cache propre au proxy                                                                                            |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                 | Le fournisseur a besoin d’un indice de récupération d’authentification manquante propre au fournisseur                                                        |
| 30  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                          | Le fournisseur a besoin de lignes synthétiques de compatibilité ascendante dans `models list` et les sélecteurs                                              |
| 31  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` propres au modèle, libellés d’affichage et valeur par défaut                      | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                                      |
| 32  | `isBinaryThinking`                | Hook de compatibilité pour le bouton de raisonnement activé/désactivé                                          | Le fournisseur expose uniquement une réflexion binaire activée/désactivée                                                                                     |
| 33  | `supportsXHighThinking`           | Hook de compatibilité de prise en charge du raisonnement `xhigh`                                               | Le fournisseur veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilité du niveau `/think` par défaut                                                            | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                                           |
| 35  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profils live et la sélection smoke                        | Le fournisseur possède la correspondance des modèles préférés pour le live/smoke                                                                              |
| 36  | `prepareRuntimeAuth`              | Échanger un identifiant configuré contre le jeton/la clé runtime réel juste avant l’inférence                   | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête à courte durée de vie                                                            |
| 37  | `resolveUsageAuth`                | Résoudre les identifiants d’utilisation/facturation pour `/usage` et les surfaces d’état associées                                     | Le fournisseur nécessite une analyse personnalisée du jeton d’utilisation/quota ou un identifiant d’utilisation différent                                                               |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser les instantanés d’utilisation/quota propres au fournisseur une fois l’authentification résolue                             | Le fournisseur nécessite un point de terminaison d’utilisation ou un analyseur de charge utile propre au fournisseur                                                                           |
| 39  | `createEmbeddingProvider`         | Construire un adaptateur d’embedding détenu par le fournisseur pour la mémoire/recherche                                                     | Le comportement d’embedding mémoire appartient au Plugin fournisseur                                                                                    |
| 40  | `buildReplayPolicy`               | Retourner une politique de rejeu contrôlant la gestion de la transcription pour le fournisseur                                        | Le fournisseur nécessite une politique de transcription personnalisée (par exemple, la suppression des blocs de réflexion)                                                               |
| 41  | `sanitizeReplayHistory`           | Réécrire l’historique de rejeu après le nettoyage générique de la transcription                                                        | Le fournisseur nécessite des réécritures de rejeu propres au fournisseur au-delà des assistants de Compaction partagés                                                             |
| 42  | `validateReplayTurns`             | Effectuer la validation finale des tours de rejeu ou leur remodelage avant l’exécuteur intégré                                           | Le transport du fournisseur nécessite une validation des tours plus stricte après le nettoyage générique                                                                    |
| 43  | `onModelSelected`                 | Exécuter les effets secondaires post-sélection détenus par le fournisseur                                                                 | Le fournisseur nécessite de la télémétrie ou un état détenu par le fournisseur lorsqu’un modèle devient actif                                                                  |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin de fournisseur correspondant, puis passent aux autres Plugins de fournisseur
compatibles avec les hooks jusqu’à ce que l’un d’eux modifie réellement l’identifiant
du modèle ou le transport/la configuration. Cela permet aux adaptateurs
d’alias/de compatibilité des fournisseurs de continuer à fonctionner sans exiger que
l’appelant sache quel Plugin groupé possède la réécriture. Si aucun hook de fournisseur
ne réécrit une entrée de configuration Google-family prise en charge, le normaliseur de
configuration Google groupé applique quand même ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou d’un
exécuteur de requêtes personnalisé, il s’agit d’une autre catégorie d’extension. Ces
hooks concernent le comportement de fournisseur qui s’exécute encore dans la boucle
d’inférence normale d’OpenClaw.

### Exemple de fournisseur

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemples intégrés

Les Plugins de fournisseur groupés combinent les hooks ci-dessus pour s’adapter aux
besoins de catalogue, d’authentification, de raisonnement, de rejeu et d’utilisation
de chaque fournisseur. L’ensemble de hooks faisant autorité se trouve avec chaque
Plugin sous `extensions/`; cette page illustre les formes plutôt que de reproduire la
liste.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les
    identifiants de modèles amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour posséder l’échange de jetons et l’intégration de
    `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs
    d’opter pour une politique de transcription via `buildReplayPolicy` au lieu
    que chaque Plugin réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent uniquement `catalog` et utilisent la boucle
    d’inférence partagée.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` résident dans la
    seam publique `api.ts` / `contract-api.ts` du Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Assistants d’exécution

Les Plugins peuvent accéder à certains assistants du noyau via `api.runtime`. Pour le TTS :

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Notes :

- `textToSpeech` renvoie la charge utile de sortie TTS normale du noyau pour les surfaces fichier/note vocale.
- Utilise la configuration `messages.tts` du noyau et la sélection du fournisseur.
- Renvoie un tampon audio PCM + la fréquence d’échantillonnage. Les Plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches, comme la langue, le genre et des balises de personnalité pour les sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent actuellement en charge la téléphonie. Microsoft ne le fait pas.

Les Plugins peuvent aussi enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Notes :

- Conservez la politique TTS, le repli et la livraison des réponses dans le noyau.
- Utilisez les fournisseurs de parole pour le comportement de synthèse appartenant au fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de propriété privilégié est orienté entreprise : un Plugin de fournisseur peut posséder
  les fournisseurs de texte, de parole, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension d’images/audio/vidéo, les Plugins enregistrent un fournisseur
typé de compréhension des médias plutôt qu’un sac clé/valeur générique :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notes :

- Conservez l’orchestration, le repli, la configuration et le câblage des canaux dans le noyau.
- Conservez le comportement du fournisseur dans le Plugin de fournisseur.
- L’extension additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs
  de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le noyau possède le contrat de capacité et l’assistant d’exécution
  - les Plugins de fournisseur enregistrent `api.registerVideoGenerationProvider(...)`
  - les Plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants d’exécution de compréhension des médias, les Plugins peuvent appeler :

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Pour la transcription audio, les Plugins peuvent utiliser soit l’exécution de
compréhension des médias, soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notes :

- `api.runtime.mediaUnderstanding.*` est la surface partagée privilégiée pour
  la compréhension d’image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du noyau (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple une entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les Plugins peuvent aussi lancer des exécutions de sous-agents en arrière-plan via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notes :

- `provider` et `model` sont des substitutions facultatives propres à l’exécution, pas des changements persistants de session.
- OpenClaw n’honore ces champs de substitution que pour les appelants approuvés.
- Pour les exécutions de repli appartenant à un Plugin, les opérateurs doivent l’autoriser avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les Plugins approuvés à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de Plugins non approuvés fonctionnent toujours, mais les demandes de substitution sont rejetées au lieu de retomber silencieusement.
- Les sessions de sous-agent créées par un Plugin sont étiquetées avec l’identifiant du Plugin créateur. Le repli `api.runtime.subagent.deleteSession(...)` ne peut supprimer que ces sessions possédées ; la suppression arbitraire de session nécessite toujours une requête Gateway avec portée administrateur.

Pour la recherche web, les Plugins peuvent consommer l’assistant d’exécution partagé au lieu
d’accéder directement au câblage des outils de l’agent :

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Les Plugins peuvent aussi enregistrer des fournisseurs de recherche web via
`api.registerWebSearchProvider(...)`.

Notes :

- Conservez la sélection du fournisseur, la résolution des identifiants et la sémantique de requête partagée dans le noyau.
- Utilisez les fournisseurs de recherche web pour les transports de recherche propres au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée privilégiée pour les Plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre de l’enveloppe d’outil de l’agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)` : génère une image à l’aide de la chaîne de fournisseurs de génération d’images configurée.
- `listProviders(...)` : liste les fournisseurs de génération d’images disponibles et leurs capacités.

## Routes HTTP du Gateway

Les Plugins peuvent exposer des points de terminaison HTTP avec `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Champs de route :

- `path` : chemin de route sous le serveur HTTP du Gateway.
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification normale du Gateway, ou `"plugin"` pour la vérification d’authentification/Webhook gérée par le Plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Notes :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec différents niveaux `auth` sont rejetées. Gardez les chaînes de repli `exact`/`prefix` uniquement sur le même niveau d’authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d’exécution opérateur. Elles sont destinées aux webhooks gérés par le plugin et à la vérification de signature, pas aux appels privilégiés aux helpers Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée d’exécution de requête Gateway, mais cette portée est volontairement prudente :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées d’exécution des routes de plugin limitées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP approuvés portant une identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) honorent `x-openclaw-scopes` uniquement lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de routes de plugin portant une identité, la portée d’exécution revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin avec authentification Gateway est une surface administrateur implicite. Si votre route nécessite un comportement réservé aux administrateurs, exigez un mode d’authentification portant une identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK Plugin

Utilisez des sous-chemins SDK étroits au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                         | Objectif                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helpers d’entrée/de construction de canal          |
| `openclaw/plugin-sdk/core`          | Helpers partagés génériques et contrat parapluie   |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent dans une famille de coutures étroites — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
sur un seul contrat `approvalCapability` plutôt que d’être mélangé entre des champs
de plugin sans rapport. Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les helpers d’exécution et de configuration résident sous les sous-chemins ciblés `*-runtime`
correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au large barrel de compatibilité `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
et `openclaw/plugin-sdk/infra-runtime` sont des shims de compatibilité obsolètes pour
les anciens plugins. Le nouveau code doit importer des primitives génériques plus étroites à la place.
</Info>

Points d’entrée internes au dépôt (par racine de package de plugin groupé) :

- `index.js` — entrée de plugin groupé
- `api.js` — barrel de helpers/types
- `runtime-api.js` — barrel réservé à l’exécution
- `setup-entry.js` — entrée de plugin de configuration

Les plugins externes doivent uniquement importer des sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` d’un autre package de plugin depuis le noyau ou depuis un autre plugin.
Les points d’entrée chargés par façade préfèrent l’instantané actif de configuration d’exécution lorsqu’il
existe, puis reviennent au fichier de configuration résolu sur disque.

Les sous-chemins propres à une capacité comme `image-generation`, `media-understanding`
et `speech` existent parce que les plugins groupés les utilisent aujourd’hui. Ils ne sont pas
automatiquement des contrats externes figés à long terme — vérifiez la page de référence SDK
pertinente lorsque vous vous appuyez dessus.

## Schémas des outils de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)`
propres au canal pour les primitives hors message comme les réactions, les lectures et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu des champs natifs du fournisseur pour boutons, composants, blocs ou cartes.
Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, la correspondance fournisseur et la liste de contrôle pour les auteurs de plugin.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent rendre via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le noyau décide s’il rend la présentation nativement ou la dégrade en texte.
N’exposez pas d’échappatoires d’interface utilisateur natives du fournisseur depuis l’outil de message générique.
Les helpers SDK obsolètes pour les anciens schémas natifs restent exportés pour les plugins tiers existants,
mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles propre au canal. Gardez l’hôte sortant
partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au noyau si une
  entrée doit passer directement à une résolution de type identifiant au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque
  le noyau a besoin d’une résolution finale possédée par le fournisseur après normalisation ou après un
  échec dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session
  propre au fournisseur une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` comme repli de normalisation propre au fournisseur, pas pour une
  recherche large dans l’annuaire.
- Gardez les identifiants natifs du fournisseur comme les identifiants de discussion, les identifiants de fil, les JID, les handles et les identifiants de salon
  dans les valeurs `target` ou les paramètres propres au fournisseur, pas dans les champs SDK génériques.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire depuis la configuration doivent garder cette logique dans le
plugin et réutiliser les helpers partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez ceci lorsqu’un canal a besoin de pairs/groupes adossés à la configuration, comme :

- pairs DM pilotés par liste d’autorisation
- cartes de canaux/groupes configurées
- replis d’annuaire statique à portée de compte

Les helpers partagés dans `directory-runtime` gèrent uniquement les opérations génériques :

- filtrage de requête
- application de limite
- helpers de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte propre au canal et la normalisation des identifiants doivent rester dans
l’implémentation du plugin.

## Catalogues de fournisseurs

Les plugins de fournisseur peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède les identifiants de modèle propres au fournisseur, les valeurs par défaut
d’URL de base ou les métadonnées de modèle protégées par authentification.

`catalog.order` contrôle quand le catalogue d’un plugin fusionne par rapport aux fournisseurs implicites
intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou variable d’environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernière passe, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l’emportent en cas de collision de clé, afin que les plugins puissent remplacer intentionnellement
une entrée de fournisseur intégrée avec le même identifiant de fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme ancien alias
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` avec `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il est autorisé à supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque des secrets requis sont manquants.
- Les chemins de commande en lecture seule comme `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/config
  de réparation ne doivent pas avoir besoin de matérialiser les identifiants d’exécution simplement pour
  décrire la configuration.

Comportement `inspectAccount(...)` recommandé :

- Renvoyez uniquement un état de compte descriptif.
- Préservez `enabled` et `configured`.
- Incluez les champs de source/statut des identifiants lorsque pertinent, comme :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler la
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source
  correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou de déclarer à tort le compte comme non configuré.

## Packs de packages

Un répertoire de plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’identifiant du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester dans le répertoire du plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du package sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances de plugin avec un
`npm install --omit=dev --ignore-scripts` local au projet (pas de scripts de cycle de vie,
pas de dépendances de développement à l’exécution), en ignorant les paramètres d’installation npm globaux hérités.
Gardez les arbres de dépendances de plugin « JS/TS pur » et évitez les packages qui nécessitent des builds
`postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsque OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais pas encore configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela allège le démarrage et la configuration
lorsque l’entrée principale de votre plugin câble aussi des outils, des hooks ou d’autre code
réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut inscrire un plugin de canal dans le même chemin `setupEntry` pendant la phase de démarrage
pré-écoute du gateway, même lorsque le canal est déjà configuré.

Utilisez ceci uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le gateway commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer toutes les capacités possédées par le canal dont le démarrage dépend, comme :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le gateway commence à écouter
- toutes les méthodes, outils ou services du gateway qui doivent exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le plugin sur le comportement par défaut et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux groupés peuvent aussi publier des helpers de surface contractuelle réservés à la configuration que le noyau
peut consulter avant le chargement de l’exécution complète du canal. La surface de promotion de configuration actuelle est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le noyau utilise cette surface lorsqu’il doit promouvoir une configuration de canal
héritée à compte unique vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple groupé actuel : il déplace uniquement les clés d’authentification/de démarrage vers un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut conserver une
clé de compte par défaut configurée non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de correctifs de configuration gardent paresseuse la découverte de surface contractuelle groupée. Le temps
d’importation reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal groupé lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC du Gateway, conservez-les sous un
préfixe propre au plugin. Les espaces de noms d’administration du noyau (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
en `operator.admin`, même si un plugin demande une portée plus étroite.

Exemple :

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Métadonnées du catalogue de canaux

Les plugins de canal peuvent publier des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela évite au catalogue du noyau de contenir des données.

Exemple :

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Champs `openclaw.channel` utiles au-delà de l’exemple minimal :

- `detailLabel` : libellé secondaire pour des surfaces de catalogue/statut plus riches
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : identifiants de plugin/canal de priorité inférieure que cette entrée de catalogue doit devancer
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles du texte de la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsque défini sur `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsque défini sur `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias hérités encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : inscrit le canal au flux standard de démarrage rapide `allowFrom`
- `forceAccountBinding` : exige une liaison explicite du compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : privilégie la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export de registre MPM). Déposez un fichier JSON à l’un des emplacements suivants :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

Les entrées générées du catalogue de canaux et les entrées du catalogue d’installation des fournisseurs exposent
des faits normalisés sur la source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés indiquent si la spécification npm est une version exacte ou un sélecteur
flottant, si les métadonnées d’intégrité attendues sont présentes, et si un chemin source local
est également disponible. Lorsque l’identité du catalogue/paquet est connue, les
faits normalisés avertissent si le nom de paquet npm analysé diverge de cette identité.
Ils avertissent aussi lorsque `defaultChoice` est invalide ou pointe vers une source qui n’est
pas disponible, et lorsque des métadonnées d’intégrité npm sont présentes sans source npm
valide. Les consommateurs doivent traiter `installSource` comme un champ facultatif additif afin que
les entrées construites à la main et les adaptations de catalogue n’aient pas à le synthétiser.
Cela permet à l’intégration initiale et aux diagnostics d’expliquer l’état du plan des sources sans
importer l’exécution du plugin.

Les entrées npm externes officielles doivent privilégier un `npmSpec` exact avec
`expectedIntegrity`. Les noms de paquet nus et les dist-tags fonctionnent encore pour
compatibilité, mais ils exposent des avertissements du plan des sources afin que le catalogue puisse évoluer
vers des installations épinglées et vérifiées par intégrité sans casser les plugins existants.
Lorsque l’intégration installe depuis un chemin de catalogue local, elle enregistre une entrée d’index de
plugin géré avec `source: "path"` et un `sourcePath` relatif à l’espace de travail
lorsque c’est possible. Le chemin de chargement opérationnel absolu reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins de poste de travail
locaux dans la configuration durable. Cela garde les installations de développement local visibles pour
les diagnostics du plan des sources sans ajouter une seconde surface brute de divulgation de chemins de système de fichiers.
L’index de plugins persistant `plugins/installs.json` est la source de vérité des installations
et peut être actualisé sans charger les modules d’exécution des plugins.
Sa carte `installRecords` est durable même lorsqu’un manifeste de plugin est manquant ou
invalide ; son tableau `plugins` est une vue reconstructible des manifestes.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin doit remplacer ou étendre le pipeline de contexte
par défaut plutôt que simplement ajouter une recherche de mémoire ou des hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

La factory `ctx` expose des valeurs facultatives `config`, `agentDir` et `workspaceDir`
pour l’initialisation au moment de la construction.

Si votre moteur ne possède **pas** l’algorithme de compaction, gardez `compact()`
implémenté et déléguez-le explicitement :

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Ajouter une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de plugins avec un accès privé. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du noyau
   Décidez quel comportement partagé le noyau doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique côté canal et forme des helpers d’exécution.
2. ajouter des surfaces typées d’enregistrement/d’exécution de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. câbler le noyau et les consommateurs de canal/fonctionnalité
   Les canaux et les plugins de fonctionnalité doivent consommer la nouvelle capacité via le noyau,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseur enregistrent ensuite leurs backends auprès de la capacité.
5. ajouter une couverture contractuelle
   Ajoutez des tests pour que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la vision d’un seul
fournisseur. Consultez le [livre de recettes des capacités](/fr/plugins/architecture)
pour une liste de fichiers concrète et un exemple détaillé.

### Liste de vérification des capacités

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat du noyau dans `src/<capability>/types.ts`
- runner/helper d’exécution du noyau dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API de plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition d’exécution de plugin dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/canal
  doivent la consommer
- helpers de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore pleinement intégrée.

### Modèle de capacité

Motif minimal :

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Motif de test contractuel :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le noyau possède le contrat de capacité et l’orchestration
- les plugins fournisseur possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les helpers d’exécution
- les tests contractuels gardent la propriété explicite

## Connexe

- [Architecture des plugins](/fr/plugins/architecture) — modèle et formes publics des capacités
- [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Construire des plugins](/fr/plugins/building-plugins)
