---
read_when:
    - Implémentation des points d’ancrage d’exécution des fournisseurs, du cycle de vie des canaux ou des packs de packages
    - Débogage de l’ordre de chargement des plugins ou de l’état du registre
    - Ajout d’une nouvelle capacité de Plugin ou d’un Plugin de moteur de contexte
summary: 'Fonctionnement interne de l’architecture Plugin : pipeline de chargement, registre, points d’accroche d’exécution, routes HTTP et tableaux de référence'
title: Architecture interne du Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle de capacités public, les formes de Plugins et les contrats
de propriété/exécution, consultez [architecture des Plugins](/fr/plugins/architecture). Cette page est la
référence pour les mécanismes internes : pipeline de chargement, registre, hooks
d’exécution, routes HTTP du Gateway, chemins d’importation et tableaux de schémas.

## Pipeline de chargement

Au démarrage, OpenClaw effectue approximativement ceci :

1. découvrir les racines de Plugins candidates
2. lire les manifestes de bundles natifs ou compatibles et les métadonnées de package
3. rejeter les candidats non sûrs
4. normaliser la configuration des Plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décider de l’activation pour chaque candidat
6. charger les modules natifs activés : les modules groupés construits utilisent un chargeur natif ;
   le code source TypeScript local tiers utilise le repli d’urgence Jiti
7. appeler les hooks natifs `register(api)` et collecter les enregistrements dans le registre de Plugins
8. exposer le registre aux commandes et aux surfaces d’exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les Plugins groupés utilisent `register` ; préférez `register` pour les nouveaux Plugins.
</Note>

Les garde-fous de sécurité s’appliquent **avant** l’exécution runtime. Les candidats sont bloqués
lorsque l’entrée sort de la racine du Plugin, que le chemin est accessible en écriture par tous, ou que la
propriété du chemin paraît suspecte pour les Plugins non groupés.

Les candidats bloqués restent liés à leur id de Plugin pour les diagnostics. Si la configuration
référence encore cet id, la validation signale le Plugin comme présent mais bloqué
et renvoie à l’avertissement de sécurité du chemin au lieu de traiter l’entrée de configuration
comme obsolète.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le Plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités de bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/espaces réservés de l’interface de contrôle
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs d’activation et de configuration peu coûteux sans charger le runtime du Plugin

Pour les Plugins natifs, le module runtime constitue la partie plan de données. Il enregistre
le comportement réel, comme les hooks, outils, commandes ou flux de fournisseurs.

Les blocs optionnels `activation` et `setup` du manifeste restent sur le plan de contrôle.
Ce sont des descripteurs de métadonnées uniquement pour la planification de l’activation et la découverte de la configuration ;
ils ne remplacent pas l’enregistrement runtime, `register(...)` ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indications de commandes, de canaux et de fournisseurs du manifeste
pour restreindre le chargement des Plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux Plugins qui possèdent la commande principale demandée
- la configuration/résolution de Plugin de canal se limite aux Plugins qui possèdent l’id de
  canal demandé
- la configuration/résolution runtime explicite de fournisseur se limite aux Plugins qui possèdent l’id de
  fournisseur demandé
- la planification de démarrage du Gateway utilise `activation.onStartup` pour les imports de démarrage
  explicites et les exclusions de démarrage ; les Plugins sans métadonnées de démarrage se chargent uniquement
  via des déclencheurs d’activation plus restreints

Les préchargements runtime à la requête qui demandent encore la portée large `all` dérivent néanmoins un
ensemble d’ids de Plugins effectifs explicite à partir de la configuration, de la planification de démarrage, des
canaux configurés, des slots et des règles d’activation automatique. Si cet ensemble dérivé est vide, OpenClaw
charge un registre runtime vide au lieu de l’élargir à chaque
Plugin découvrable.

Le planificateur d’activation expose à la fois une API avec ids uniquement pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un Plugin a été sélectionné,
en séparant les indications explicites du planificateur `activation.*` de la propriété de manifeste
de repli, comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons est la frontière de compatibilité :
les métadonnées de Plugins existantes continuent de fonctionner, tandis que le nouveau code peut détecter des indications larges
ou un comportement de repli sans modifier la sémantique de chargement runtime.

La découverte de configuration préfère désormais les ids appartenant aux descripteurs, comme `setup.providers` et
`setup.cliBackends`, afin de restreindre les Plugins candidats avant de revenir à
`setup-api` pour les Plugins qui ont encore besoin de hooks runtime au moment de la configuration. Les listes de
configuration de fournisseurs utilisent le manifeste `providerAuthChoices`, les choix de configuration dérivés des descripteurs
et les métadonnées du catalogue d’installation sans charger le runtime du fournisseur. Un
`setup.requiresRuntime: false` explicite est un arrêt réservé aux descripteurs ; l’omission de
`requiresRuntime` conserve le repli hérité vers setup-api pour la compatibilité. Si plusieurs
Plugins découverts revendiquent le même id normalisé de fournisseur de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de dépendre de
l’ordre de découverte. Lorsque le runtime de configuration s’exécute, les diagnostics du registre signalent
les écarts entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou backends CLI
enregistrés par setup-api sans bloquer les Plugins hérités.

### Limite du cache de Plugins

OpenClaw ne met pas en cache les résultats de découverte de Plugins ni les données directes de registre de manifestes
derrière des fenêtres d’horloge murale. Les installations, les modifications de manifeste et les changements de chemins de chargement
doivent devenir visibles à la prochaine lecture explicite des métadonnées ou reconstruction d’instantané.
L’analyseur de fichiers de manifeste peut conserver un cache borné de signature de fichier indexé par le
chemin de manifeste ouvert, l’inode, la taille et les horodatages ; ce cache évite seulement de
réanalyser des octets inchangés et ne doit pas mettre en cache les réponses de découverte, de registre, de propriétaire ou
de politique.

Le chemin rapide sûr des métadonnées est la propriété explicite d’objets, pas un cache caché.
Les chemins chauds de démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` courant, la
`PluginLookUpTable` dérivée ou un registre de manifestes explicite dans la chaîne d’appels.
La validation de configuration, l’activation automatique au démarrage, l’amorçage des Plugins et la sélection
de fournisseurs peuvent réutiliser ces objets tant qu’ils représentent la configuration et l’inventaire de Plugins
courants. La recherche de configuration reconstruit encore les métadonnées de manifeste à la demande,
sauf si le chemin de configuration précis reçoit un registre de manifestes explicite ; conservez cela
comme repli de chemin froid plutôt que d’ajouter des caches de recherche cachés. Lorsque l’entrée
change, reconstruisez et remplacez l’instantané au lieu de le muter ou de conserver
des copies historiques.
Les vues sur le registre de Plugins actif et les assistants d’amorçage de canaux groupés
doivent être recalculés à partir du registre/de la racine courants. Des maps à courte durée de vie conviennent
dans un appel pour dédupliquer le travail ou protéger contre la réentrée ; elles ne doivent pas devenir des caches
de métadonnées de processus.

Pour le chargement des Plugins, la couche de cache persistante est le chargement runtime. Elle peut réutiliser
l’état du chargeur lorsque du code ou des artefacts installés sont réellement chargés, par exemple :

- `PluginLoaderCacheState` et les registres runtime actifs compatibles
- les caches jiti/module et les caches de chargeur de surface publique utilisés pour éviter d’importer
  plusieurs fois la même surface runtime
- les caches de système de fichiers pour les artefacts de Plugins installés
- les maps à courte durée de vie par appel pour la normalisation de chemins ou la résolution de doublons

Ces caches sont des détails d’implémentation du plan de données. Ils ne doivent pas répondre
à des questions du plan de contrôle comme « quel Plugin possède ce fournisseur ? », sauf si
l’appelant a délibérément demandé un chargement runtime.

N’ajoutez pas de caches persistants ou à horloge murale pour :

- les résultats de découverte
- les registres de manifestes directs
- les registres de manifestes reconstruits à partir de l’index des Plugins installés
- la recherche de propriétaire de fournisseur, la suppression de modèles, la politique de fournisseur ou les métadonnées
  d’artefacts publics
- toute autre réponse dérivée du manifeste où un manifeste modifié, un index installé
  ou un chemin de chargement devrait être visible à la prochaine lecture des métadonnées

Les appelants qui reconstruisent les métadonnées de manifeste depuis l’index persistant des Plugins installés
reconstruisent ce registre à la demande. L’index installé est un état durable du plan source ;
ce n’est pas un cache de métadonnées en processus caché.

## Modèle de registre

Les Plugins chargés ne mutent pas directement des variables globales aléatoires du cœur. Ils s’enregistrent dans un
registre central de Plugins.

Le registre suit :

- les enregistrements de Plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC du Gateway
- les routes HTTP
- les registraires CLI
- les services en arrière-plan
- les commandes appartenant à des Plugins

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de parler directement aux modules de Plugins.
Cela conserve un chargement à sens unique :

- module de Plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation compte pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n’ont besoin que
d’un seul point d’intégration : « lire le registre », et non « traiter spécialement chaque module de Plugin ».

## Callbacks de liaison de conversation

Les Plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après l’approbation ou le refus
d’une demande de liaison :

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

Champs de charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indication de détachement, l’id de l’expéditeur et les
  métadonnées de conversation

Ce callback sert uniquement de notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation par le cœur.

## Hooks runtime de fournisseurs

Les Plugins de fournisseurs ont trois couches :

- **Métadonnées de manifeste** pour une recherche peu coûteuse avant runtime :
  `setup.providers[].envVars`, compatibilité obsolète `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (`discovery` hérité) plus
  `applyConfigDefaults`.
- **Hooks runtime** : plus de 40 hooks optionnels couvrant l’authentification, la résolution de modèles,
  l’encapsulation de flux, les niveaux de réflexion, la politique de relecture et les points de terminaison d’utilisation. Consultez
  la liste complète sous [Ordre et utilisation des hooks](#hook-order-and-usage).

OpenClaw possède toujours la boucle d’agent générique, le basculement, la gestion de transcript et
la politique d’outils. Ces hooks constituent la surface d’extension pour le comportement propre aux fournisseurs
sans nécessiter un transport d’inférence entièrement personnalisé.

Utilisez le manifeste `setup.providers[].envVars` lorsque le fournisseur possède des identifiants fondés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèles doivent voir sans
charger le runtime du Plugin. Le `providerAuthEnvVars` obsolète est encore lu par
l’adaptateur de compatibilité pendant la fenêtre de dépréciation, et les Plugins non groupés
qui l’utilisent reçoivent un diagnostic de manifeste. Utilisez le manifeste `providerAuthAliases`
lorsqu’un id de fournisseur doit réutiliser les variables d’environnement, profils d’authentification,
authentification adossée à la configuration et choix d’intégration de clé API d’un autre id de fournisseur. Utilisez le manifeste
`providerAuthChoices` lorsque les surfaces CLI d’intégration/de choix d’authentification doivent connaître
l’id de choix du fournisseur, les libellés de groupes et le câblage simple d’authentification à un seul indicateur sans
charger le runtime du fournisseur. Conservez les `envVars` runtime de fournisseur
pour les indications destinées aux opérateurs, comme les libellés d’intégration ou les variables de configuration
client-id/client-secret OAuth.

Utilisez le manifeste `channelEnvVars` lorsqu’un canal possède une authentification ou une configuration pilotée par l’environnement que
le repli générique d’environnement shell, les contrôles de configuration/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre et utilisation des hooks

Pour les Plugins de modèles/fournisseurs, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.
Les champs de fournisseur uniquement destinés à la compatibilité qu’OpenClaw n’appelle plus, comme
`ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont volontairement pas
listés ici.

| #   | Point d’accroche                  | Ce qu’il fait                                                                                                  | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publier la configuration du fournisseur dans `models.providers` lors de la génération de `models.json`         | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                   |
| 2   | `applyConfigDefaults`             | Appliquer les valeurs par défaut globales de configuration propres au fournisseur lors de la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur      |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal du registre/catalogue                                                 | _(pas un point d’accroche de plugin)_                                                                                                         |
| 3   | `normalizeModelId`                | Normaliser les alias hérités ou de préversion d’identifiants de modèle avant la recherche                      | Le fournisseur prend en charge le nettoyage des alias avant la résolution canonique du modèle                                                 |
| 4   | `normalizeTransport`              | Normaliser `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle              | Le fournisseur prend en charge le nettoyage du transport pour les identifiants de fournisseur personnalisés dans la même famille de transport |
| 5   | `normalizeConfig`                 | Normaliser `models.providers.<id>` avant la résolution de l’exécution/du fournisseur                           | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les helpers groupés de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Appliquer aux fournisseurs de configuration les réécritures de compatibilité de l’utilisation du streaming natif | Le fournisseur a besoin de corrections de métadonnées d’utilisation du streaming natif pilotées par le point de terminaison                   |
| 7   | `resolveConfigApiKey`             | Résoudre l’authentification par marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification d’exécution | Le fournisseur dispose d’une résolution de clé API par marqueur d’environnement qui lui appartient ; `amazon-bedrock` dispose aussi ici d’un résolveur intégré de marqueur d’environnement AWS |
| 8   | `resolveSyntheticAuth`            | Exposer une authentification locale/auto-hébergée ou basée sur la configuration sans persister de texte en clair | Le fournisseur peut fonctionner avec un marqueur d’identifiants synthétique/local                                                              |
| 9   | `resolveExternalAuthProfiles`     | Superposer les profils d’authentification externes propres au fournisseur ; la valeur par défaut de `persistence` est `runtime-only` pour les identifiants appartenant à la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externes sans persister de jetons de rafraîchissement copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisser la priorité des espaces réservés de profils synthétiques stockés derrière l’authentification basée sur l’environnement/la configuration | Le fournisseur stocke des profils d’espaces réservés synthétiques qui ne doivent pas l’emporter en priorité                                  |
| 11  | `resolveDynamicModel`             | Solution de repli synchrone pour les identifiants de modèle propres au fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des identifiants de modèle amont arbitraires                                                                           |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                        | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                     |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que l’exécuteur intégré utilise le modèle résolu                                      | Le fournisseur a besoin de réécritures de transport tout en utilisant toujours un transport du cœur                                           |
| 14  | `contributeResolvedModelCompat`   | Fournir des indicateurs de compatibilité pour les modèles de fournisseur derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                 |
| 15  | `normalizeToolSchemas`            | Normaliser les schémas d’outils avant que l’exécuteur intégré les voie                                        | Le fournisseur a besoin d’un nettoyage de schéma propre à la famille de transport                                                             |
| 16  | `inspectToolSchemas`              | Exposer les diagnostics de schéma propres au fournisseur après normalisation                                   | Le fournisseur veut des avertissements sur les mots-clés sans enseigner au cœur des règles propres au fournisseur                             |
| 17  | `resolveReasoningOutputMode`      | Sélectionner le contrat de sortie de raisonnement natif ou balisé                                             | Le fournisseur a besoin d’un raisonnement/d’une sortie finale balisés au lieu de champs natifs                                                |
| 18  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                        | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage des paramètres par fournisseur                                  |
| 19  | `createStreamFn`                  | Remplacer entièrement le chemin de flux normal par un transport personnalisé                                  | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                       |
| 20  | `wrapStreamFn`                    | Wrapper de flux après l’application des wrappers génériques                                                   | Le fournisseur a besoin de wrappers de compatibilité pour les en-têtes/le corps/le modèle de requête sans transport personnalisé              |
| 21  | `resolveTransportTurnState`       | Attacher des en-têtes ou métadonnées de transport natifs par tour                                             | Le fournisseur veut que les transports génériques envoient l’identité de tour native du fournisseur                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Attacher des en-têtes WebSocket natifs ou une politique de délai de récupération de session                    | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                |
| 23  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` d’exécution              | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton d’exécution personnalisée           |
| 24  | `refreshOAuth`                    | Remplacement du rafraîchissement OAuth pour les points de terminaison de rafraîchissement personnalisés ou la politique d’échec de rafraîchissement | Le fournisseur ne correspond pas aux mécanismes de rafraîchissement partagés `pi-ai`                                                          |
| 25  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque le rafraîchissement OAuth échoue                                          | Le fournisseur a besoin d’indications de réparation d’authentification propres au fournisseur après un échec de rafraîchissement              |
| 26  | `matchesContextOverflowError`     | Correspondance propre au fournisseur pour le dépassement de fenêtre de contexte                               | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                               |
| 27  | `classifyFailoverReason`          | Classification des raisons de basculement propre au fournisseur                                               | Le fournisseur peut mapper les erreurs API/transport brutes vers limite de débit/surcharge/etc.                                               |
| 28  | `isCacheTtlEligible`              | Politique de cache des prompts pour les fournisseurs proxy/backhaul                                           | Le fournisseur a besoin d’un filtrage TTL de cache propre au proxy                                                                            |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération en cas d’authentification manquante                         | Le fournisseur a besoin d’un indice de récupération propre au fournisseur en cas d’authentification manquante                                 |
| 30  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                         | Le fournisseur a besoin de lignes synthétiques de compatibilité ascendante dans `models list` et les sélecteurs                               |
| 31  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` propres au modèle, libellés d’affichage et valeur par défaut                     | Le fournisseur expose une échelle de pensée personnalisée ou un libellé binaire pour certains modèles                                         |
| 32  | `isBinaryThinking`                | Point d’accroche de compatibilité pour le basculement de raisonnement activé/désactivé                        | Le fournisseur expose uniquement une pensée binaire activée/désactivée                                                                        |
| 33  | `supportsXHighThinking`           | Point d’accroche de compatibilité pour la prise en charge du raisonnement `xhigh`                             | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Point d’accroche de compatibilité pour le niveau `/think` par défaut                                          | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                           |
| 35  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profil live et la sélection de smoke tests                | Le fournisseur possède la correspondance des modèles préférés live/smoke                                                                      |
| 36  | `prepareRuntimeAuth`              | Échanger un identifiant configuré contre le jeton/la clé d’exécution réel juste avant l’inférence              | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête à durée de vie courte                                            |
| 37  | `resolveUsageAuth`                | Résoudre les identifiants d’utilisation/facturation pour `/usage` et les surfaces d’état associées                                     | Le fournisseur a besoin d’une analyse personnalisée du jeton d’utilisation/quota ou d’un identifiant d’utilisation différent                                                               |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser les instantanés d’utilisation/quota propres au fournisseur une fois l’authentification résolue                             | Le fournisseur a besoin d’un point de terminaison d’utilisation ou d’un analyseur de charge utile propre au fournisseur                                                                           |
| 39  | `createEmbeddingProvider`         | Construire un adaptateur d’embeddings détenu par le fournisseur pour la mémoire/recherche                                                     | Le comportement des embeddings de mémoire appartient au Plugin fournisseur                                                                                    |
| 40  | `buildReplayPolicy`               | Renvoyer une stratégie de relecture contrôlant la gestion des transcriptions pour le fournisseur                                        | Le fournisseur a besoin d’une stratégie de transcription personnalisée (par exemple, la suppression des blocs de réflexion)                                                               |
| 41  | `sanitizeReplayHistory`           | Réécrire l’historique de relecture après le nettoyage générique des transcriptions                                                        | Le fournisseur a besoin de réécritures de relecture propres au fournisseur au-delà des assistants de Compaction partagés                                                             |
| 42  | `validateReplayTurns`             | Validation finale des tours de relecture ou remodelage avant le runner intégré                                           | Le transport du fournisseur a besoin d’une validation plus stricte des tours après l’assainissement générique                                                                    |
| 43  | `onModelSelected`                 | Exécuter les effets de bord post-sélection détenus par le fournisseur                                                                 | Le fournisseur a besoin de télémétrie ou d’un état détenu par le fournisseur lorsqu’un modèle devient actif                                                                  |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin de fournisseur correspondant, puis passent aux autres Plugins de
fournisseur capables de hooks jusqu’à ce que l’un d’eux modifie effectivement
l’identifiant de modèle ou le transport/la configuration. Cela permet aux shims
de fournisseur d’alias/de compatibilité de continuer à fonctionner sans imposer
à l’appelant de savoir quel Plugin groupé possède la réécriture. Si aucun hook
de fournisseur ne réécrit une entrée de configuration compatible de la famille
Google, le normalisateur de configuration Google groupé applique tout de même
ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou
d’un exécuteur de requête personnalisé, il s’agit d’une autre catégorie
d’extension. Ces hooks sont destinés au comportement de fournisseur qui
s’exécute toujours dans la boucle d’inférence normale d’OpenClaw.

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

Les Plugins de fournisseur groupés combinent les hooks ci-dessus pour s’adapter
aux besoins de catalogue, d’authentification, de réflexion, de rejeu et
d’utilisation de chaque fournisseur. L’ensemble de hooks faisant autorité se
trouve avec chaque Plugin sous `extensions/`; cette page illustre les formes
plutôt que de reproduire la liste.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les
    identifiants de modèles amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour prendre en charge l’échange de jetons et
    l’intégration de `/usage`.
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
    `volcengine` enregistrent seulement `catalog` et utilisent la boucle
    d’inférence partagée.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` se trouvent dans
    la frontière publique `api.ts` / `contract-api.ts` du Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Helpers d’exécution

Les Plugins peuvent accéder à certains helpers du cœur via `api.runtime`. Pour
la TTS :

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

- `textToSpeech` renvoie la charge utile de sortie TTS normale du cœur pour les surfaces de fichier/note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection de fournisseur.
- Renvoie un tampon audio PCM + la fréquence d’échantillonnage. Les Plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches comme la locale, le genre et des balises de personnalité pour les sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft ne la prend pas en charge.

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

- Conservez la politique TTS, le repli et la remise des réponses dans le cœur.
- Utilisez les fournisseurs de parole pour le comportement de synthèse appartenant au fournisseur.
- L’entrée Microsoft historique `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un Plugin de fournisseur peut posséder
  les fournisseurs de texte, de parole, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension d’image/audio/vidéo, les Plugins enregistrent un
fournisseur typé de compréhension des médias plutôt qu’un sac clé/valeur
générique :

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

- Conservez l’orchestration, le repli, la configuration et le câblage des canaux dans le cœur.
- Conservez le comportement fournisseur dans le Plugin de fournisseur.
- L’extension additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de
  résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper d’exécution
  - les Plugins de fournisseur enregistrent `api.registerVideoGenerationProvider(...)`
  - les Plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les helpers d’exécution de compréhension des médias, les Plugins peuvent appeler :

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

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension d’image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du cœur (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple une entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les Plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

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

- `provider` et `model` sont des substitutions facultatives par exécution, et non des modifications persistantes de session.
- OpenClaw n’honore ces champs de substitution que pour les appelants de confiance.
- Pour les exécutions de repli appartenant à un Plugin, les opérateurs doivent les activer avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les Plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de Plugins non fiables fonctionnent toujours, mais les demandes de substitution sont rejetées au lieu d’être remplacées silencieusement par un repli.
- Les sessions de sous-agent créées par un Plugin sont étiquetées avec l’identifiant du Plugin créateur. Le repli `api.runtime.subagent.deleteSession(...)` peut supprimer uniquement ces sessions possédées ; la suppression arbitraire de session nécessite toujours une requête Gateway à portée admin.

Pour la recherche web, les Plugins peuvent consommer le helper d’exécution
partagé au lieu d’accéder au câblage des outils de l’agent :

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

- Conservez la sélection du fournisseur, la résolution des identifiants et la sémantique de requête partagée dans le cœur.
- Utilisez les fournisseurs de recherche web pour les transports de recherche propres au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les Plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre de l’enveloppe d’outil d’agent.

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

- `generate(...)` : génère une image en utilisant la chaîne de fournisseurs de génération d’images configurée.
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
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification Gateway normale, ou `"plugin"` pour une authentification/vérification de Webhook gérée par le Plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Notes :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement de plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes de Plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf avec `replaceExisting: true`, et un plugin ne peut pas remplacer la route d'un autre plugin.
- Les routes qui se chevauchent avec différents niveaux `auth` sont rejetées. Gardez les chaînes de repli `exact`/`prefix` uniquement au même niveau d'authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d'exécution de l'opérateur. Elles sont destinées aux webhooks gérés par le plugin et à la vérification de signature, pas aux appels privilégiés d'assistance du Gateway.
- Les routes `auth: "gateway"` s'exécutent dans une portée d'exécution de requête Gateway, mais cette portée est volontairement prudente :
  - l'authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) garde les portées d'exécution des routes de plugin fixées à `operator.write`, même si l'appelant envoie `x-openclaw-scopes`
  - les modes HTTP porteurs d'identité de confiance (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) respectent `x-openclaw-scopes` uniquement lorsque l'en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de routes de plugin porteuses d'identité, la portée d'exécution revient à `operator.write`
- Règle pratique : ne supposez pas qu'une route de plugin authentifiée par le gateway est une surface d'administration implicite. Si votre route nécessite un comportement réservé à l'administration, exigez un mode d'authentification porteur d'identité et documentez le contrat explicite de l'en-tête `x-openclaw-scopes`.

## Chemins d'importation du SDK de Plugin

Utilisez des sous-chemins SDK étroits au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                         | Objectif                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d'enregistrement de Plugin             |
| `openclaw/plugin-sdk/channel-core`  | Assistants d'entrée/de génération de canal         |
| `openclaw/plugin-sdk/core`          | Assistants partagés génériques et contrat global   |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent parmi une famille de jonctions étroites — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d'approbation doit se consolider
sur un seul contrat `approvalCapability` plutôt que de mélanger des champs de
plugin sans rapport. Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les assistants d'exécution et de configuration se trouvent sous les sous-chemins ciblés `*-runtime`
correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au large barrel de compatibilité `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
et `openclaw/plugin-sdk/infra-runtime` sont des adaptateurs de compatibilité obsolètes pour
les anciens plugins. Le nouveau code doit plutôt importer des primitives génériques plus étroites.
</Info>

Points d'entrée internes au dépôt (par racine de package de plugin groupé) :

- `index.js` — entrée de plugin groupé
- `api.js` — barrel d'assistants/types
- `runtime-api.js` — barrel réservé à l'exécution
- `setup-entry.js` — entrée de plugin de configuration

Les plugins externes doivent importer uniquement les sous-chemins `openclaw/plugin-sdk/*`. N'importez jamais
le `src/*` d'un autre package de plugin depuis le cœur ou depuis un autre plugin.
Les points d'entrée chargés par façade préfèrent l'instantané actif de configuration d'exécution lorsqu'il
existe, puis se rabattent sur le fichier de configuration résolu sur disque.

Des sous-chemins propres à des capacités comme `image-generation`, `media-understanding`
et `speech` existent parce que les plugins groupés les utilisent aujourd'hui. Ils ne sont pas
automatiquement des contrats externes figés à long terme — consultez la page de référence SDK
pertinente lorsque vous vous appuyez sur eux.

## Schémas des outils de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` propres au canal
pour les primitives hors message comme les réactions, les lectures et les sondages.
La présentation partagée d'envoi doit utiliser le contrat générique `MessagePresentation`
au lieu des champs natifs du fournisseur pour boutons, composants, blocs ou cartes.
Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, la correspondance des fournisseurs et la checklist de l'auteur de plugin.

Les plugins capables d'envoyer déclarent ce qu'ils peuvent afficher via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide d'afficher la présentation nativement ou de la dégrader en texte.
N'exposez pas d'échappatoires d'interface utilisateur natives du fournisseur depuis l'outil de message générique.
Les assistants SDK obsolètes pour les anciens schémas natifs restent exportés pour les plugins
tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles propre au canal. Gardez l'hôte
sortant partagé générique et utilisez la surface de l'adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans le répertoire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant plutôt qu'à une recherche dans le répertoire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque
  le cœur a besoin d'une résolution finale appartenant au fournisseur après normalisation ou après un
  échec dans le répertoire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction des routes de session
  propres au fournisseur une fois la cible résolue.

Découpage recommandé :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent avoir lieu avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications de type « traiter ceci comme un identifiant cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation propre au fournisseur, pas pour une
  recherche large dans le répertoire.
- Gardez les identifiants natifs du fournisseur comme les identifiants de chat, les identifiants de fil, les JID, les handles et les identifiants de salle
  dans les valeurs `target` ou les paramètres propres au fournisseur, pas dans les champs SDK génériques.

## Répertoires adossés à la configuration

Les plugins qui dérivent des entrées de répertoire depuis la configuration doivent garder cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu'un canal a besoin de pairs/groupes adossés à la configuration, tels que :

- pairs DM pilotés par une liste d'autorisation
- correspondances de canaux/groupes configurées
- replis de répertoire statiques à portée de compte

Les assistants partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage des requêtes
- application de limites
- assistants de déduplication/normalisation
- génération de `ChannelDirectoryEntry[]`

L'inspection de compte propre au canal et la normalisation d'identifiant doivent rester dans
l'implémentation du plugin.

## Catalogues de fournisseurs

Les plugins de fournisseur peuvent définir des catalogues de modèles pour l'inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retourne la même forme que celle écrite par OpenClaw dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseurs

Utilisez `catalog` lorsque le plugin possède des identifiants de modèle propres au fournisseur, des valeurs
par défaut d'URL de base ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle quand le catalogue d'un plugin fusionne par rapport aux
fournisseurs implicites intégrés d'OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou variable d'environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d'authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseurs liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l'emportent en cas de collision de clé, donc les plugins peuvent remplacer intentionnellement une
entrée de fournisseur intégrée ayant le même identifiant de fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias historique
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` avec `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d'exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et échouer rapidement lorsque des secrets requis sont absents.
- Les chemins de commandes en lecture seule comme `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` et les flux doctor/réparation de configuration
  ne doivent pas avoir besoin de matérialiser les identifiants d'exécution simplement pour
  décrire la configuration.

Comportement `inspectAccount(...)` recommandé :

- Retournez uniquement un état de compte descriptif.
- Préservez `enabled` et `configured`.
- Incluez les champs de source/statut des identifiants lorsque c'est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n'avez pas besoin de retourner les valeurs brutes de jeton simplement pour signaler la
  disponibilité en lecture seule. Retourner `tokenStatus: "available"` (et le champ source
  correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu'un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou d'indiquer à tort que le compte n'est pas configuré.

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

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l'identifiant de plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester dans le répertoire du plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du package sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances de plugin avec un
`npm install --omit=dev --ignore-scripts` local au projet (aucun script de cycle de vie,
aucune dépendance de développement à l'exécution), en ignorant les paramètres npm globaux hérités.
Gardez les arbres de dépendances de plugin « JS/TS purs » et évitez les packages qui nécessitent des builds
`postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsque OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu'un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu de l'entrée complète du plugin. Cela allège le démarrage et la configuration
lorsque votre entrée principale de plugin câble aussi des outils, des hooks ou un autre code réservé
à l'exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour le même chemin `setupEntry` pendant la phase de démarrage
pré-écoute du gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le gateway commence à écouter. En pratique, cela signifie que l'entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont dépend le démarrage, comme :

- l'enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le gateway commence à écouter
- toutes les méthodes, outils ou services de gateway qui doivent exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n'activez pas
ce drapeau. Gardez le plugin sur le comportement par défaut et laissez OpenClaw charger
l'entrée complète pendant le démarrage.

Les canaux groupés peuvent aussi publier des assistants de surface de contrat réservés à la configuration que le cœur
peut consulter avant le chargement de l'exécution complète du canal. La surface actuelle de
promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration de canal
héritée à compte unique vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple groupé actuel : il déplace uniquement les clés d’authentification/d’amorçage vers un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut conserver une
clé de compte par défaut non canonique configurée au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de correctifs de configuration gardent paresseuse la découverte de la surface de contrat groupée. Le
temps d’importation reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal groupé lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC de Gateway, gardez-les sur un
préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
vers `operator.admin`, même si un plugin demande une portée plus étroite.

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

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela garde le catalogue du cœur sans données.

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
- `preferOver` : identifiants de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles du texte de la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il est défini sur `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsqu’il est défini sur `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de la documentation
- `showConfigured` / `showInSetup` : alias hérités toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : inscrit le canal dans le flux de démarrage rapide standard `allowFrom`
- `forceAccountBinding` : exige une liaison explicite du compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : privilégie la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut également fusionner des **catalogues de canaux externes** (par exemple, une exportation de registre MPM). Déposez un fichier JSON dans l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte également `"packages"` ou `"plugins"` comme alias hérités pour la clé `"entries"`.

Les entrées générées du catalogue de canaux et les entrées du catalogue d’installation de fournisseurs exposent
des faits normalisés de source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés indiquent si la spécification npm est une version exacte ou un sélecteur
flottant, si les métadonnées d’intégrité attendues sont présentes et si un chemin de source
local est également disponible. Lorsque l’identité du catalogue/paquet est connue, les
faits normalisés avertissent si le nom du paquet npm analysé diverge de cette identité.
Ils avertissent aussi lorsque `defaultChoice` est invalide ou pointe vers une source
indisponible, et lorsque des métadonnées d’intégrité npm sont présentes sans source npm
valide. Les consommateurs doivent traiter `installSource` comme un champ facultatif additif afin que
les entrées construites à la main et les adaptateurs de catalogue n’aient pas à le synthétiser.
Cela permet à l’intégration initiale et aux diagnostics d’expliquer l’état du plan de source sans
importer l’exécution du plugin.

Les entrées npm externes officielles doivent privilégier un `npmSpec` exact avec
`expectedIntegrity`. Les noms de paquets nus et les dist-tags fonctionnent encore pour
compatibilité, mais ils affichent des avertissements de plan de source afin que le catalogue puisse évoluer
vers des installations épinglées et vérifiées par intégrité sans casser les plugins existants.
Lorsque l’intégration installe depuis un chemin de catalogue local, elle enregistre une entrée
d’index de plugin géré avec `source: "path"` et un `sourcePath` relatif à l’espace de travail
lorsque c’est possible. Le chemin de chargement opérationnel absolu reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins du poste de travail local
dans la configuration durable. Cela garde les installations de développement local visibles pour
les diagnostics de plan de source sans ajouter une seconde surface de divulgation de chemins de système de fichiers bruts.
L’index de plugin persistant `plugins/installs.json` est la source de vérité des installations
et peut être actualisé sans charger les modules d’exécution des plugins.
Sa carte `installRecords` est durable même lorsqu’un manifeste de plugin est manquant ou
invalide ; son tableau `plugins` est une vue reconstructible des manifestes.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez ceci lorsque votre plugin doit remplacer ou étendre le pipeline de contexte
par défaut plutôt que simplement ajouter une recherche mémoire ou des hooks.

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

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique exposée au canal et forme des helpers d’exécution.
2. ajouter des surfaces typées d’enregistrement/d’exécution de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface de
   capacité typée utile.
3. câbler le cœur et les consommateurs de canal/fonctionnalité
   Les canaux et les plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseur enregistrent ensuite leurs backends auprès de la capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites au fil du temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur pour la vision du monde d’un
fournisseur. Consultez le [livre de recettes des capacités](/fr/plugins/architecture)
pour une liste de contrôle concrète des fichiers et un exemple détaillé.

### Liste de contrôle des capacités

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat du cœur dans `src/<capability>/types.ts`
- helper d’exécution/runner du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API du plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition d’exécution du plugin dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal
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

Motif de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le cœur possède le contrat de capacité et l’orchestration
- les plugins fournisseur possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les helpers d’exécution
- les tests de contrat gardent la propriété explicite

## Connexe

- [Architecture des plugins](/fr/plugins/architecture) — modèle et formes publics des capacités
- [Sous-chemins du SDK Plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
