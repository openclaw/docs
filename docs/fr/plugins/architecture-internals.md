---
read_when:
    - Implémentation des hooks d’exécution des fournisseurs, du cycle de vie des canaux ou des packs de packages
    - Débogage de l’ordre de chargement des Plugins ou de l’état du registre
    - Ajout d’une nouvelle capacité de plugin ou d’un plugin de moteur de contexte
summary: 'Détails internes de l’architecture de Plugin : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: Fonctionnement interne de l’architecture Plugin
x-i18n:
    generated_at: "2026-05-11T20:43:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle de capacité public, les formes de Plugin et les contrats de
propriété/exécution, consultez [Architecture des Plugins](/fr/plugins/architecture). Cette page est la
référence pour les mécanismes internes : pipeline de chargement, registre, hooks d’exécution,
routes HTTP du Gateway, chemins d’importation et tableaux de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw effectue approximativement ceci :

1. découvrir les racines candidates de Plugins
2. lire les manifests de bundles natifs ou compatibles et les métadonnées de package
3. rejeter les candidats non sûrs
4. normaliser la configuration des Plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décider de l’activation de chaque candidat
6. charger les modules natifs activés : les modules groupés construits utilisent un chargeur natif ;
   le code source TypeScript local tiers utilise le repli d’urgence Jiti
7. appeler les hooks natifs `register(api)` et collecter les enregistrements dans le registre de Plugins
8. exposer le registre aux commandes/surfaces d’exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les Plugins groupés utilisent `register` ; préférez `register` pour les nouveaux Plugins.
</Note>

Les garde-fous de sécurité s’appliquent **avant** l’exécution runtime. Les candidats sont bloqués
lorsque l’entrée sort de la racine du Plugin, que le chemin est modifiable par tous, ou que la
propriété du chemin semble suspecte pour les Plugins non groupés.

Les candidats bloqués restent liés à leur identifiant de Plugin pour les diagnostics. Si la configuration
référence encore cet identifiant, la validation signale le Plugin comme présent mais bloqué
et renvoie à l’avertissement de sécurité du chemin au lieu de traiter l’entrée de configuration
comme obsolète.

### Comportement centré sur le manifest

Le manifest est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le Plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/espaces réservés de l’interface de contrôle
- afficher les métadonnées d’installation/catalogue
- préserver descripteurs d’activation et de configuration peu coûteux sans charger le runtime du Plugin

Pour les Plugins natifs, le module runtime est la partie du plan de données. Il enregistre
le comportement réel, comme les hooks, outils, commandes ou flux de fournisseur.

Les blocs facultatifs `activation` et `setup` du manifest restent sur le plan de contrôle.
Ce sont des descripteurs uniquement métadonnées pour la planification de l’activation et la découverte de la configuration ;
ils ne remplacent pas l’enregistrement runtime, `register(...)`, ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent maintenant les indications de commande, de canal et de fournisseur du manifest
pour réduire le chargement des Plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux Plugins qui possèdent la commande principale demandée
- la résolution de configuration/plugin de canal se limite aux Plugins qui possèdent l’identifiant de
  canal demandé
- la résolution explicite de configuration/runtime de fournisseur se limite aux Plugins qui possèdent l’identifiant de
  fournisseur demandé
- la planification du démarrage du Gateway utilise `activation.onStartup` pour les importations explicites au démarrage
  et les exclusions de démarrage ; les Plugins sans métadonnées de démarrage ne se chargent que
  par des déclencheurs d’activation plus ciblés

Les préchargements runtime au moment de la requête qui demandent encore le périmètre large `all` dérivent tout de même un
ensemble explicite d’identifiants de Plugins effectifs à partir de la configuration, de la planification du démarrage, des
canaux configurés, des slots et des règles d’activation automatique. Si cet ensemble dérivé est vide, OpenClaw
charge un registre runtime vide au lieu d’élargir à tous les
Plugins découvrables.

Le planificateur d’activation expose à la fois une API limitée aux identifiants pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un Plugin a été sélectionné,
en séparant les indications explicites du planificateur `activation.*` des solutions de repli de propriété du manifest
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons est la limite de compatibilité :
les métadonnées de Plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter des indications larges
ou un comportement de repli sans modifier la sémantique de chargement runtime.

La découverte de configuration préfère maintenant les identifiants possédés par les descripteurs, comme `setup.providers` et
`setup.cliBackends`, pour réduire les Plugins candidats avant de retomber sur
`setup-api` pour les Plugins qui ont encore besoin de hooks runtime au moment de la configuration. Les listes de
configuration de fournisseur utilisent le manifest `providerAuthChoices`, les choix de configuration dérivés de descripteurs
et les métadonnées du catalogue d’installation sans charger le runtime du fournisseur. Le
`setup.requiresRuntime: false` explicite est une coupure limitée aux descripteurs ; l’absence de
`requiresRuntime` conserve le repli hérité `setup-api` pour compatibilité. Si plusieurs
Plugins découverts revendiquent le même identifiant normalisé de fournisseur de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur
l’ordre de découverte. Lorsque le runtime de configuration s’exécute, les diagnostics de registre signalent
les écarts entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou backends CLI
enregistrés par setup-api sans bloquer les Plugins hérités.

### Limite du cache des Plugins

OpenClaw ne met pas en cache les résultats de découverte de Plugins ni les données directes du registre de manifests
derrière des fenêtres d’horloge murale. Les installations, modifications de manifests et changements de chemins de chargement
doivent devenir visibles à la prochaine lecture explicite de métadonnées ou reconstruction d’instantané.
L’analyseur de fichier manifest peut conserver un cache borné de signature de fichier, indexé par le
chemin de manifest ouvert, l’inode, la taille et les horodatages ; ce cache ne fait qu’éviter
de réanalyser des octets inchangés et ne doit pas mettre en cache des réponses de découverte, de registre, de propriétaire ou
de politique.

Le chemin rapide sûr pour les métadonnées est la propriété explicite d’objet, pas un cache caché.
Les chemins critiques de démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` actuel, la
`PluginLookUpTable` dérivée, ou un registre de manifests explicite dans la chaîne d’appels. La validation de configuration, l’activation automatique au démarrage, l’amorçage de Plugins et la sélection de fournisseur
peuvent réutiliser ces objets tant qu’ils représentent la configuration actuelle et
l’inventaire des Plugins. La recherche de configuration reconstruit encore les métadonnées de manifest à la demande
sauf si le chemin de configuration spécifique reçoit un registre de manifests explicite ; conservez cela
comme repli de chemin froid plutôt que d’ajouter des caches de recherche cachés. Lorsque l’entrée
change, reconstruisez et remplacez l’instantané au lieu de le muter ou de conserver
des copies historiques.
Les vues sur le registre de Plugins actif et les assistants d’amorçage des canaux groupés
doivent être recalculées à partir du registre/de la racine actuelle. Les maps de courte durée conviennent
dans un appel pour dédupliquer le travail ou protéger contre la réentrée ; elles ne doivent pas devenir des caches
de métadonnées de processus.

Pour le chargement de Plugins, la couche de cache persistante est le chargement runtime. Elle peut réutiliser
l’état du chargeur lorsque du code ou des artefacts installés sont réellement chargés, comme :

- `PluginLoaderCacheState` et les registres runtime actifs compatibles
- caches jiti/module et caches de chargeur de surface publique utilisés pour éviter d’importer
  la même surface runtime à répétition
- caches de système de fichiers pour les artefacts de Plugins installés
- maps éphémères par appel pour la normalisation de chemins ou la résolution de doublons

Ces caches sont des détails d’implémentation du plan de données. Ils ne doivent pas répondre aux
questions du plan de contrôle comme « quel Plugin possède ce fournisseur ? » sauf si
l’appelant a délibérément demandé un chargement runtime.

N’ajoutez pas de caches persistants ou à fenêtre d’horloge murale pour :

- les résultats de découverte
- les registres de manifests directs
- les registres de manifests reconstruits à partir de l’index des Plugins installés
- la recherche de propriétaire de fournisseur, la suppression de modèles, la politique de fournisseur ou les métadonnées
  d’artefact public
- toute autre réponse dérivée d’un manifest lorsqu’un manifest modifié, un index installé
  ou un chemin de chargement devrait être visible à la prochaine lecture de métadonnées

Les appelants qui reconstruisent les métadonnées de manifest à partir de l’index persistant des Plugins installés
reconstruisent ce registre à la demande. L’index installé est un état durable du plan source ;
ce n’est pas un cache de métadonnées en processus caché.

## Modèle de registre

Les Plugins chargés ne modifient pas directement des variables globales arbitraires du cœur. Ils s’enregistrent dans un
registre central de Plugins.

Le registre suit :

- les enregistrements de Plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC du Gateway
- les routes HTTP
- les bureaux d’enregistrement CLI
- les services d’arrière-plan
- les commandes possédées par des Plugins

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de parler directement aux modules de Plugins.
Cela garde le chargement unidirectionnel :

- module de Plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation compte pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n’ont besoin que
d’un point d’intégration : « lire le registre », pas « traiter spécialement chaque module de Plugin ».

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
- `request` : le résumé de la demande d’origine, l’indication de détachement, l’identifiant de l’expéditeur et les
  métadonnées de conversation

Ce callback est uniquement une notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation par le cœur.

## Hooks runtime de fournisseur

Les Plugins fournisseurs comportent trois couches :

- **Métadonnées de manifest** pour une recherche peu coûteuse avant runtime :
  `setup.providers[].envVars`, compatibilité obsolète `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (hérité `discovery`) plus
  `applyConfigDefaults`.
- **Hooks runtime** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution de modèles,
  l’enveloppement de flux, les niveaux de réflexion, la politique de relecture et les endpoints d’utilisation. Consultez
  la liste complète sous [Ordre et utilisation des hooks](#hook-order-and-usage).

OpenClaw possède encore la boucle d’agent générique, le basculement, la gestion des transcriptions et
la politique d’outils. Ces hooks sont la surface d’extension pour le comportement propre aux fournisseurs
sans nécessiter un transport d’inférence entièrement personnalisé.

Utilisez le manifest `setup.providers[].envVars` lorsque le fournisseur dispose d’identifiants basés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans
charger le runtime du Plugin. `providerAuthEnvVars`, obsolète, est encore lu par
l’adaptateur de compatibilité pendant la fenêtre de dépréciation, et les Plugins non groupés
qui l’utilisent reçoivent un diagnostic de manifest. Utilisez le manifest `providerAuthAliases`
lorsqu’un identifiant de fournisseur doit réutiliser les variables d’environnement, les profils d’authentification,
l’authentification adossée à la configuration et le choix d’intégration par clé API d’un autre identifiant de fournisseur. Utilisez le manifest
`providerAuthChoices` lorsque les surfaces CLI d’intégration/de choix d’authentification doivent connaître
l’identifiant de choix du fournisseur, les libellés de groupe et le câblage d’authentification simple à indicateur unique sans
charger le runtime du fournisseur. Conservez les
`envVars` runtime du fournisseur pour les indications destinées aux opérateurs, comme les libellés d’intégration ou les variables de configuration
client-id/client-secret OAuth.

Utilisez le manifest `channelEnvVars` lorsqu’un canal a une authentification ou une configuration pilotée par l’environnement que
le repli générique d’environnement shell, les vérifications de configuration/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre et utilisation des hooks

Pour les Plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.
Les champs de fournisseur uniquement compatibles qu’OpenClaw n’appelle plus, comme
`ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont volontairement pas
listés ici.

| #   | Hook                              | Ce qu’il fait                                                                                                      | Quand l’utiliser                                                                                                                                             |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publier la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`             | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                                   |
| 2   | `applyConfigDefaults`             | Appliquer les valeurs par défaut de configuration globale détenues par le fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur                      |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal registre/catalogue                                                        | _(pas un hook de Plugin)_                                                                                                                                     |
| 3   | `normalizeModelId`                | Normaliser les alias d’identifiants de modèle hérités ou en préversion avant la recherche                          | Le fournisseur possède le nettoyage des alias avant la résolution du modèle canonique                                                                         |
| 4   | `normalizeTransport`              | Normaliser `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle                  | Le fournisseur possède le nettoyage du transport pour les identifiants de fournisseur personnalisés dans la même famille de transport                         |
| 5   | `normalizeConfig`                 | Normaliser `models.providers.<id>` avant la résolution runtime/fournisseur                                         | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le Plugin ; les helpers groupés de la famille Google couvrent aussi les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Appliquer aux fournisseurs de configuration les réécritures de compatibilité d’usage du streaming natif            | Le fournisseur a besoin de correctifs de métadonnées d’usage du streaming natif pilotés par le point de terminaison                                           |
| 7   | `resolveConfigApiKey`             | Résoudre l’authentification par marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification runtime | Le fournisseur a une résolution de clé API par marqueur d’environnement détenue par le fournisseur ; `amazon-bedrock` possède aussi ici un résolveur intégré de marqueur d’environnement AWS |
| 8   | `resolveSyntheticAuth`            | Exposer l’authentification locale/auto-hébergée ou basée sur la configuration sans persister de texte en clair     | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                                               |
| 9   | `resolveExternalAuthProfiles`     | Superposer les profils d’authentification externes détenus par le fournisseur ; la valeur par défaut de `persistence` est `runtime-only` pour les identifiants détenus par la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externes sans persister les jetons d’actualisation copiés ; déclarer `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisser la priorité des emplacements réservés de profils synthétiques stockés derrière une authentification basée sur l’environnement/la configuration | Le fournisseur stocke des profils d’emplacement réservé synthétiques qui ne doivent pas l’emporter en priorité                                                |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les identifiants de modèle détenus par le fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des identifiants de modèle amont arbitraires                                                                                           |
| 12  | `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                           | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                                     |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner intégré utilise le modèle résolu                                             | Le fournisseur a besoin de réécritures de transport mais utilise toujours un transport cœur                                                                   |
| 14  | `contributeResolvedModelCompat`   | Contribuer des indicateurs de compatibilité pour les modèles de fournisseurs derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                                 |
| 15  | `normalizeToolSchemas`            | Normaliser les schémas d’outils avant que le runner intégré les voie                                              | Le fournisseur a besoin d’un nettoyage de schéma de famille de transport                                                                                      |
| 16  | `inspectToolSchemas`              | Exposer les diagnostics de schéma détenus par le fournisseur après normalisation                                   | Le fournisseur veut des avertissements de mot-clé sans enseigner au cœur des règles propres au fournisseur                                                    |
| 17  | `resolveReasoningOutputMode`      | Sélectionner le contrat de sortie de raisonnement natif ou balisé                                                  | Le fournisseur a besoin d’un raisonnement/de sorties finales balisés au lieu de champs natifs                                                                 |
| 18  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                            | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres par fournisseur                                                   |
| 19  | `createStreamFn`                  | Remplacer entièrement le chemin de flux normal par un transport personnalisé                                       | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                                       |
| 20  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                          | Le fournisseur a besoin de wrappers de compatibilité pour en-têtes/corps/modèle de requête sans transport personnalisé                                        |
| 21  | `resolveTransportTurnState`       | Attacher des en-têtes ou métadonnées de transport natifs par tour                                                  | Le fournisseur veut que les transports génériques envoient l’identité de tour native du fournisseur                                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Attacher des en-têtes WebSocket natifs ou une politique de délai de refroidissement de session                     | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                                |
| 23  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` du runtime                   | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée                                |
| 24  | `refreshOAuth`                    | Surcharge d’actualisation OAuth pour des points de terminaison d’actualisation personnalisés ou une politique d’échec d’actualisation | Le fournisseur ne correspond pas aux mécanismes d’actualisation partagés `pi-ai`                                                                               |
| 25  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque l’actualisation OAuth échoue                                                   | Le fournisseur a besoin de recommandations de réparation d’authentification détenues par le fournisseur après un échec d’actualisation                        |
| 26  | `matchesContextOverflowError`     | Correspondance d’erreur de dépassement de fenêtre de contexte détenue par le fournisseur                           | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                               |
| 27  | `classifyFailoverReason`          | Classification de la raison de bascule détenue par le fournisseur                                                  | Le fournisseur peut mapper les erreurs brutes d’API/transport vers limite de débit/surcharge/etc.                                                             |
| 28  | `isCacheTtlEligible`              | Politique de cache de prompt pour les fournisseurs proxy/backhaul                                                  | Le fournisseur a besoin d’un filtrage TTL de cache propre au proxy                                                                                            |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                     | Le fournisseur a besoin d’un indice de récupération d’authentification manquante propre au fournisseur                                                        |
| 30  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                              | Le fournisseur a besoin de lignes synthétiques de compatibilité ascendante dans `models list` et les sélecteurs                                              |
| 31  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` propres au modèle, libellés d’affichage et valeur par défaut                         | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                                      |
| 32  | `isBinaryThinking`                | Hook de compatibilité de bascule de raisonnement activé/désactivé                                                  | Le fournisseur expose uniquement une réflexion binaire activée/désactivée                                                                                     |
| 33  | `supportsXHighThinking`           | Hook de compatibilité de prise en charge du raisonnement `xhigh`                                                   | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilité du niveau `/think` par défaut                                                                | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                                           |
| 35  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profil live et la sélection de smoke                          | Le fournisseur possède la correspondance de modèle préféré live/smoke                                                                                         |
| 36  | `prepareRuntimeAuth`              | Échanger un identifiant configuré contre le jeton/la clé runtime réel juste avant l’inférence                      | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête à courte durée de vie                                                            |
| 37  | `resolveUsageAuth`                | Résoudre les identifiants d’utilisation/facturation pour `/usage` et les surfaces d’état associées                                     | Le fournisseur a besoin d’une analyse personnalisée des jetons d’utilisation/quota ou d’un identifiant d’utilisation différent                                                               |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser les instantanés d’utilisation/quota propres au fournisseur une fois l’authentification résolue                             | Le fournisseur a besoin d’un point de terminaison d’utilisation propre au fournisseur ou d’un analyseur de charge utile                                                                           |
| 39  | `createEmbeddingProvider`         | Construire un adaptateur de plongements vectoriels propre au fournisseur pour la mémoire/recherche                                                     | Le comportement des plongements vectoriels de mémoire relève du Plugin du fournisseur                                                                                    |
| 40  | `buildReplayPolicy`               | Renvoyer une politique de relecture contrôlant la gestion de la transcription pour le fournisseur                                        | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, la suppression des blocs de réflexion)                                                               |
| 41  | `sanitizeReplayHistory`           | Réécrire l’historique de relecture après le nettoyage générique de la transcription                                                        | Le fournisseur a besoin de réécritures de relecture propres au fournisseur au-delà des assistants de compaction partagés                                                             |
| 42  | `validateReplayTurns`             | Validation finale des tours de relecture ou remise en forme avant l’exécuteur intégré                                           | Le transport du fournisseur nécessite une validation plus stricte des tours après l’assainissement générique                                                                    |
| 43  | `onModelSelected`                 | Exécuter les effets secondaires post-sélection propres au fournisseur                                                                 | Le fournisseur a besoin de télémétrie ou d’un état propre au fournisseur lorsqu’un modèle devient actif                                                                  |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin fournisseur correspondant, puis passent aux autres Plugins fournisseurs
capables de hooks jusqu’à ce que l’un modifie effectivement l’id de modèle ou le
transport/la configuration. Cela permet aux shims de fournisseur d’alias/de
compatibilité de continuer à fonctionner sans obliger l’appelant à savoir quel
Plugin inclus possède la réécriture. Si aucun hook de fournisseur ne réécrit une
entrée de configuration Google-family prise en charge, le normaliseur de
configuration Google inclus applique tout de même ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou
d’un exécuteur de requêtes personnalisé, il s’agit d’une autre classe
d’extension. Ces hooks concernent les comportements de fournisseur qui
s’exécutent encore dans la boucle d’inférence normale d’OpenClaw.

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

Les Plugins fournisseurs inclus combinent les hooks ci-dessus pour s’adapter au
catalogue, à l’authentification, au raisonnement, à la relecture et aux besoins
d’usage de chaque fournisseur. L’ensemble de hooks faisant autorité se trouve
avec chaque Plugin sous `extensions/`; cette page illustre les formes plutôt que
de reproduire la liste.

<AccordionGroup>
  <Accordion title="Fournisseurs de catalogue pass-through">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les
    ids de modèles en amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="Fournisseurs OAuth et de point de terminaison d’usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour prendre en charge l’échange de jetons et
    l’intégration `/usage`.
  </Accordion>
  <Accordion title="Familles de relecture et de nettoyage de transcript">
    Des familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs
    d’adopter une stratégie de transcript via `buildReplayPolicy` au lieu que
    chaque Plugin réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Fournisseurs uniquement catalogue">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent seulement `catalog` et utilisent la boucle
    d’inférence partagée.
  </Accordion>
  <Accordion title="Assistants de flux propres à Anthropic">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` résident dans le
    seam public `api.ts` / `contract-api.ts` du Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Assistants d’exécution

Les Plugins peuvent accéder à des assistants principaux sélectionnés via `api.runtime`. Pour TTS :

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

Remarques :

- `textToSpeech` renvoie la charge utile TTS principale normale pour les surfaces fichier/note vocale.
- Utilise la configuration principale `messages.tts` et la sélection de fournisseur.
- Renvoie un tampon audio PCM + une fréquence d’échantillonnage. Les Plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est optionnel selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration possédés par le fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que la locale, le genre et les tags de personnalité pour les sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent en charge la téléphonie aujourd’hui. Microsoft ne la prend pas en charge.

Les Plugins peuvent aussi enregistrer des fournisseurs de synthèse vocale via `api.registerSpeechProvider(...)`.

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

Remarques :

- Gardez la stratégie TTS, le repli et la livraison des réponses dans le cœur.
- Utilisez les fournisseurs de synthèse vocale pour le comportement de synthèse possédé par le fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’id de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un Plugin fournisseur peut posséder
  les fournisseurs de texte, de synthèse vocale, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension d’images/audio/vidéo, les Plugins enregistrent un fournisseur
typé de compréhension média au lieu d’un sac clé/valeur générique :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Remarques :

- Gardez l’orchestration, le repli, la configuration et le câblage des canaux dans le cœur.
- Gardez le comportement du fournisseur dans le Plugin fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes optionnelles, nouveaux champs
  de résultat optionnels, nouvelles capacités optionnelles.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant d’exécution
  - les Plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les Plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants d’exécution de compréhension média, les Plugins peuvent appeler :

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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Pour la transcription audio, les Plugins peuvent utiliser soit l’exécution de compréhension média,
soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension d’images/audio/vidéo.
- `extractStructuredWithModel(...)` est le seam exposé aux Plugins pour l’extraction bornée
  image-first possédée par le fournisseur. Incluez au moins une entrée image ;
  les entrées texte fournissent un contexte supplémentaire.
  les Plugins produit possèdent leurs routes et schémas, tandis qu’OpenClaw possède la
  frontière fournisseur/runtime.
- Utilise la configuration audio de compréhension média du cœur (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les Plugins peuvent également lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Remarques :

- `provider` et `model` sont des remplacements optionnels propres à l’exécution, pas des changements de session persistants.
- OpenClaw n’honore ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de repli possédées par un Plugin, les opérateurs doivent explicitement l’autoriser avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les Plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de Plugin non approuvé fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de revenir silencieusement en arrière.
- Les sessions de sous-agent créées par un Plugin sont taguées avec l’id du Plugin créateur. Le repli `api.runtime.subagent.deleteSession(...)` ne peut supprimer que ces sessions possédées ; la suppression arbitraire de session nécessite toujours une requête Gateway avec portée administrateur.

Pour la recherche web, les Plugins peuvent consommer l’assistant d’exécution partagé au lieu
d’accéder directement au câblage de l’outil d’agent :

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

Remarques :

- Gardez la sélection de fournisseur, la résolution des identifiants et la sémantique de requête partagée dans le cœur.
- Utilisez des fournisseurs de recherche web pour les transports de recherche propres au fournisseur.
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

## Routes HTTP Gateway

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
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification gateway normale, ou `"plugin"` pour l’authentification/vérification Webhook gérée par le Plugin.
- `match` : optionnel. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : optionnel. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement de plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de Plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Conservez les chaînes de repli `exact`/`prefix` uniquement au même niveau d’authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d’exécution de l’opérateur. Elles sont destinées aux webhooks gérés par le plugin et à la vérification de signature, pas aux appels privilégiés aux assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée d’exécution de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées d’exécution des routes de plugin limitées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance portant une identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) honorent `x-openclaw-scopes` uniquement lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de routes de plugin portant une identité, la portée d’exécution revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin avec authentification Gateway constitue une surface d’administration implicite. Si votre route nécessite un comportement réservé à l’administration, exigez un mode d’authentification portant une identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK de Plugin

Utilisez des sous-chemins SDK restreints plutôt que le barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                         | Objectif                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Assistants d’entrée/de construction de canal       |
| `openclaw/plugin-sdk/core`          | Assistants partagés génériques et contrat global   |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent parmi une famille de points d’intégration restreints — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit être consolidé
sur un seul contrat `approvalCapability` plutôt que mélangé entre des champs de
plugin sans rapport. Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les assistants d’exécution et de configuration se trouvent sous les sous-chemins ciblés `*-runtime`
correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au lieu du barrel de compatibilité large `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
et `openclaw/plugin-sdk/infra-runtime` sont des shims de compatibilité obsolètes pour
les anciens plugins. Le nouveau code doit importer à la place des primitives génériques plus restreintes.
</Info>

Points d’entrée internes au dépôt (par racine de package de plugin groupé) :

- `index.js` — entrée de plugin groupé
- `api.js` — barrel d’assistants/types
- `runtime-api.js` — barrel réservé à l’exécution
- `setup-entry.js` — entrée de plugin de configuration

Les plugins externes doivent importer uniquement les sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` d’un autre package de plugin depuis le cœur ou depuis un autre plugin.
Les points d’entrée chargés par façade préfèrent l’instantané actif de configuration d’exécution lorsqu’il
existe, puis se replient sur le fichier de configuration résolu sur disque.

Les sous-chemins propres à une capacité, tels que `image-generation`, `media-understanding`
et `speech`, existent parce que les plugins groupés les utilisent aujourd’hui. Ce ne sont pas
automatiquement des contrats externes figés à long terme — vérifiez la page de référence SDK
pertinente lorsque vous vous appuyez dessus.

## Schémas des outils de message

Les plugins doivent posséder les contributions au schéma `describeMessageTool(...)` propres au canal
pour les primitives autres que les messages, comme les réactions, les lectures et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs au fournisseur pour les boutons, composants, blocs ou cartes.
Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, la correspondance des fournisseurs et la checklist des auteurs de plugin.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent afficher via les capacités de message :

- `presentation` pour les blocs de présentation sémantiques (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il faut afficher la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires d’interface utilisateur natives au fournisseur depuis l’outil de message générique.
Les assistants SDK obsolètes pour les anciens schémas natifs restent exportés pour les plugins
tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution de la cible de canal

Les plugins de canal doivent posséder la sémantique des cibles propre au canal. Gardez l’hôte
sortant partagé générique et utilisez la surface de l’adaptateur de messagerie pour les règles fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque
  le cœur a besoin d’une résolution finale détenue par le fournisseur après normalisation ou après un
  échec dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction des routes de session
  propre au fournisseur une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent avoir lieu avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation propre au fournisseur, pas pour
  une recherche large dans l’annuaire.
- Gardez les identifiants natifs au fournisseur comme les identifiants de chat, les identifiants de fil, les JID, les handles et les identifiants de salle
  dans les valeurs `target` ou les paramètres propres au fournisseur, pas dans les champs SDK
  génériques.

## Annuaires appuyés par la configuration

Les plugins qui dérivent des entrées d’annuaire depuis la configuration doivent conserver cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez ceci lorsqu’un canal a besoin de pairs/groupes appuyés par la configuration, comme :

- des pairs DM pilotés par allowlist
- des correspondances de canaux/groupes configurées
- des replis d’annuaire statiques limités au compte

Les assistants partagés dans `directory-runtime` ne gèrent que les opérations génériques :

- filtrage des requêtes
- application des limites
- assistants de déduplication/normalisation
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

Utilisez `catalog` lorsque le plugin possède des identifiants de modèle propres au fournisseur, des valeurs par défaut
d’URL de base ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle quand le catalogue d’un plugin fusionne par rapport aux fournisseurs implicites
intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou env
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l’emportent en cas de collision de clé, afin que les plugins puissent remplacer intentionnellement
une entrée de fournisseur intégrée avec le même identifiant de fournisseur.

Les plugins peuvent aussi publier des lignes de modèles en lecture seule via
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. C’est la voie à suivre pour les surfaces de liste/aide/sélecteur et elle prend en charge les lignes
`text`, `image_generation`, `video_generation` et `music_generation`.
Les plugins de fournisseur restent responsables des appels d’endpoint en direct, de l’échange de jetons et du
mappage des réponses de vendeurs ; le cœur possède la forme de ligne commune, les libellés de source et
le formatage de l’aide des outils média. Les enregistrements de fournisseur de génération média synthétisent automatiquement
des lignes de catalogue statiques depuis `defaultModel`, `models` et `capabilities`.

Compatibilité :

- `discovery` fonctionne encore comme alias hérité, mais émet un avertissement d’obsolescence
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`
- `augmentModelCatalog` est obsolète ; les fournisseurs groupés doivent publier
  les lignes supplémentaires via `registerModelCatalogProvider`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` avec `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il est autorisé à supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis sont manquants.
- Les chemins de commande en lecture seule comme `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/config
  repair ne doivent pas avoir à matérialiser les identifiants d’exécution simplement pour
  décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoie uniquement un état descriptif du compte.
- Préserve `enabled` et `configured`.
- Inclut les champs de source/statut des identifiants lorsque cela est pertinent, comme :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes de jeton simplement pour signaler la disponibilité
  en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ de source
  correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

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

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du package sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances de plugin avec un
`npm install --omit=dev --ignore-scripts` local au projet (pas de scripts de cycle de vie,
pas de dépendances de développement à l’exécution), en ignorant les paramètres globaux hérités d’installation npm.
Gardez les arbres de dépendances de plugin « JS/TS pur » et évitez les packages qui nécessitent
des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsqu’OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela allège le démarrage et la configuration
lorsque l’entrée principale de votre plugin câble aussi des outils, hooks ou autre code réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour le même chemin `setupEntry` pendant la phase de démarrage
avant écoute du Gateway, même lorsque le canal est déjà configuré.

N’utilisez ceci que lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le Gateway commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont dépend le démarrage, comme :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le Gateway commence à écouter
- toutes les méthodes, outils ou services du Gateway qui doivent exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le plugin sur le comportement par défaut et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux groupés peuvent aussi publier des assistants de surface de contrat réservés à la configuration, que le cœur
peut consulter avant le chargement du runtime complet du canal. La surface actuelle de promotion de configuration
est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration héritée de canal à compte unique
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple groupé actuel : il déplace uniquement les clés d’authentification/d’amorçage vers un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé configurée de compte par défaut non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de correctif de configuration gardent paresseuse la découverte des surfaces de contrat groupées. Le temps
d’importation reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal groupé lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC du Gateway, gardez-les sur un
préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
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

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela garde les données de catalogue hors du cœur.

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
- `docsLabel` : remplacer le texte du lien de documentation
- `preferOver` : ids de plugins/canaux de priorité inférieure que cette entrée de catalogue doit devancer
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de texte de la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de mise en forme sortante
- `exposure.configured` : masquer le canal des surfaces de liste des canaux configurés lorsque défini à `false`
- `exposure.setup` : masquer le canal des sélecteurs interactifs de configuration lorsque défini à `false`
- `exposure.docs` : marquer le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias hérités encore acceptés pour la compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : inscrire le canal au flux standard de démarrage rapide `allowFrom`
- `forceAccountBinding` : exiger une liaison explicite de compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préférer la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, une exportation de registre MPM).
Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

Les entrées générées du catalogue de canaux et les entrées du catalogue d’installation de fournisseurs exposent
des faits normalisés de source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés indiquent si la spécification npm est une version exacte ou un sélecteur
flottant, si les métadonnées d’intégrité attendues sont présentes, et si un chemin de source local
est aussi disponible. Lorsque l’identité de catalogue/package est connue, les
faits normalisés avertissent si le nom de package npm analysé diverge de cette identité.
Ils avertissent aussi lorsque `defaultChoice` est invalide ou pointe vers une source qui
n’est pas disponible, et lorsque des métadonnées d’intégrité npm sont présentes sans source npm
valide. Les consommateurs doivent traiter `installSource` comme un champ facultatif additif afin que
les entrées construites manuellement et les adaptateurs de catalogue n’aient pas à le synthétiser.
Cela permet à l’intégration et aux diagnostics d’expliquer l’état du plan de source sans
importer le runtime du plugin.

Les entrées npm externes officielles doivent préférer un `npmSpec` exact plus
`expectedIntegrity`. Les noms de packages nus et les dist-tags fonctionnent encore pour
la compatibilité, mais ils font apparaître des avertissements de plan de source afin que le catalogue puisse évoluer
vers des installations épinglées et vérifiées par intégrité sans casser les plugins existants.
Lorsque l’intégration installe depuis un chemin de catalogue local, elle enregistre une entrée d’index de plugin
géré avec `source: "path"` et un `sourcePath` relatif à l’espace de travail lorsque c’est possible. Le chemin de chargement opérationnel absolu reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins de poste de travail local
dans une configuration de longue durée. Cela garde les installations de développement local visibles pour
les diagnostics de plan de source sans ajouter une seconde surface brute de divulgation de chemins de système de fichiers.
L’index de plugins persistant `plugins/installs.json` est la source de vérité d’installation
et peut être actualisé sans charger les modules de runtime de plugins.
Sa carte `installRecords` est durable même lorsqu’un manifeste de plugin est manquant ou
invalide ; son tableau `plugins` est une vue de manifeste reconstructible.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez ceci lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut
plutôt que simplement ajouter une recherche mémoire ou des hooks.

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

Le `ctx` de la fabrique expose les valeurs facultatives `config`, `agentDir` et `workspaceDir`
pour l’initialisation au moment de la construction.

Si votre moteur ne possède **pas** l’algorithme de Compaction, gardez `compact()`
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
le système de plugins avec un accès privé interne. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique côté canal et forme de l’assistant de runtime.
2. ajouter des surfaces typées d’enregistrement/runtime de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface de capacité
   typée utile.
3. câbler le cœur et les consommateurs de canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseur enregistrent ensuite leurs backends auprès de la capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests pour que la propriété et la forme d’enregistrement restent explicites au fil du temps.

C’est ainsi qu’OpenClaw reste structuré par des choix assumés sans devenir codé en dur selon la vision d’un seul
fournisseur. Consultez le [livre de recettes des capacités](/fr/plugins/adding-capabilities)
pour une liste de vérification concrète des fichiers et un exemple détaillé.

### Liste de vérification des capacités

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat du cœur dans `src/<capability>/types.ts`
- assistant d’exécution/runtime du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition au runtime des plugins dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/canal
  doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore pleinement intégrée.

### Modèle de capacité

Modèle minimal :

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

Modèle de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseur possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les assistants de runtime
- les tests de contrat gardent la propriété explicite

## Associé

- [Architecture des plugins](/fr/plugins/architecture) — modèle et formes publics des capacités
- [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
