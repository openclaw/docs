---
read_when:
    - Implémentation des hooks d’exécution des fournisseurs, du cycle de vie des canaux ou des packs de packages
    - Débogage de l’ordre de chargement des plugins ou de l’état du registre
    - Ajout d’une nouvelle capacité de Plugin ou d’un Plugin de moteur de contexte
summary: 'Internes de l’architecture Plugin : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: Architecture interne des Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle de capacités public, les formes de plugins et les contrats
de propriété/exécution, consultez [Architecture des plugins](/fr/plugins/architecture). Cette page est la
référence pour les mécanismes internes : pipeline de chargement, registre, hooks d’exécution,
routes HTTP du Gateway, chemins d’importation et tables de schémas.

## Pipeline de chargement

Au démarrage, OpenClaw procède globalement ainsi :

1. découvrir les racines de plugins candidates
2. lire les manifestes de bundle natifs ou compatibles et les métadonnées de package
3. rejeter les candidats non sûrs
4. normaliser la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décider de l’activation de chaque candidat
6. charger les modules natifs activés : les modules groupés compilés utilisent un chargeur natif ;
   le TypeScript source local tiers utilise le repli d’urgence Jiti
7. appeler les hooks natifs `register(api)` et collecter les enregistrements dans le registre des plugins
8. exposer le registre aux commandes/surfaces d’exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les plugins groupés utilisent `register` ; privilégiez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité s’appliquent **avant** l’exécution runtime. Les candidats sont bloqués
lorsque l’entrée sort de la racine du plugin, que le chemin est inscriptible par tout le monde ou que la
propriété du chemin semble suspecte pour des plugins non groupés.

Les candidats bloqués restent liés à leur identifiant de plugin pour les diagnostics. Si la configuration
référence encore cet identifiant, la validation signale le plugin comme présent mais bloqué
et renvoie à l’avertissement de sécurité du chemin au lieu de traiter l’entrée de configuration
comme obsolète.

### Comportement axé sur le manifeste

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schéma de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/espaces réservés de la Control UI
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs d’activation et de configuration peu coûteux sans charger le runtime du plugin

Pour les plugins natifs, le module runtime est la partie plan de données. Il enregistre
le comportement réel, par exemple des hooks, outils, commandes ou flux de fournisseur.

Les blocs facultatifs `activation` et `setup` du manifeste restent sur le plan de contrôle.
Ce sont uniquement des descripteurs de métadonnées pour la planification d’activation et la découverte de configuration ;
ils ne remplacent pas l’enregistrement runtime, `register(...)` ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent maintenant les indices de commande, canal et fournisseur du manifeste
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux plugins qui possèdent la commande principale demandée
- la configuration/résolution de plugin de canal se limite aux plugins qui possèdent l’identifiant
  de canal demandé
- la configuration/résolution runtime explicite de fournisseur se limite aux plugins qui possèdent l’identifiant
  de fournisseur demandé
- la planification du démarrage du Gateway utilise `activation.onStartup` pour les importations de démarrage explicites
  et les exclusions de démarrage ; les plugins sans métadonnées de démarrage ne se chargent que
  via des déclencheurs d’activation plus restreints

Les préchargements runtime au moment de la requête qui demandent encore la portée large `all` dérivent
un ensemble explicite d’identifiants de plugins effectifs depuis la configuration, la planification de démarrage, les canaux
configurés, les slots et les règles d’activation automatique. Si cet ensemble dérivé est vide, OpenClaw
charge un registre runtime vide au lieu de l’élargir à chaque plugin découvrable.

Le planificateur d’activation expose à la fois une API limitée aux identifiants pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un plugin a été sélectionné,
en séparant les indices explicites du planificateur `activation.*` des replis de propriété du manifeste
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons est la frontière de compatibilité :
les métadonnées de plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter les indices larges
ou le comportement de repli sans modifier la sémantique du chargement runtime.

La découverte de configuration privilégie maintenant les identifiants possédés par des descripteurs comme `setup.providers` et
`setup.cliBackends` pour restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks runtime au moment de la configuration. Les listes de
configuration de fournisseur utilisent les métadonnées de manifeste `providerAuthChoices`, les choix de configuration dérivés de descripteurs
et les métadonnées de catalogue d’installation sans charger le runtime du fournisseur. `setup.requiresRuntime: false`
explicite est une coupure uniquement par descripteur ; `requiresRuntime` omis conserve le repli hérité
`setup-api` pour la compatibilité. Si plus d’un plugin découvert revendique le même fournisseur de configuration normalisé ou
identifiant de backend CLI, la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur
l’ordre de découverte. Lorsque le runtime de configuration s’exécute, les diagnostics du registre signalent
les écarts entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou backends CLI
enregistrés par setup-api sans bloquer les plugins hérités.

### Frontière du cache de plugins

OpenClaw ne met pas en cache les résultats de découverte de plugins ni les données directes du registre de manifeste
derrière des fenêtres d’horloge murale. Les installations, modifications de manifeste et changements de chemin de chargement
doivent devenir visibles lors de la prochaine lecture explicite de métadonnées ou reconstruction d’instantané.
L’analyseur du fichier de manifeste peut conserver un cache borné de signature de fichier indexé par le
chemin de manifeste ouvert, l’inode, la taille et les horodatages ; ce cache évite seulement
de réanalyser des octets inchangés et ne doit pas mettre en cache des réponses de découverte, registre, propriétaire ou
politique.

Le chemin rapide sûr des métadonnées repose sur la propriété explicite des objets, pas sur un cache caché.
Les chemins critiques de démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` courant, la
`PluginLookUpTable` dérivée ou un registre de manifeste explicite dans la chaîne d’appels.
La validation de configuration, l’activation automatique au démarrage, l’amorçage de plugin et la sélection de fournisseur
peuvent réutiliser ces objets tant qu’ils représentent la configuration courante et
l’inventaire des plugins. La recherche de configuration reconstruit encore les métadonnées de manifeste à la demande
sauf si le chemin de configuration spécifique reçoit un registre de manifeste explicite ; conservez cela
comme repli de chemin froid au lieu d’ajouter des caches de recherche cachés. Lorsque l’entrée
change, reconstruisez et remplacez l’instantané au lieu de le muter ou de conserver
des copies historiques.
Les vues sur le registre de plugins actif et les assistants d’amorçage de canaux groupés
doivent être recalculés depuis le registre/la racine courants. Les maps de courte durée conviennent
dans un seul appel pour dédupliquer le travail ou empêcher la réentrée ; elles ne doivent pas devenir des caches
de métadonnées de processus.

Pour le chargement des plugins, la couche de cache persistante est le chargement runtime. Elle peut réutiliser
l’état du chargeur lorsque le code ou les artefacts installés sont réellement chargés, par exemple :

- `PluginLoaderCacheState` et les registres runtime actifs compatibles
- caches jiti/module et caches de chargeur de surface publique utilisés pour éviter d’importer
  plusieurs fois la même surface runtime
- caches du système de fichiers pour les artefacts de plugins installés
- maps de courte durée par appel pour la normalisation de chemins ou la résolution de doublons

Ces caches sont des détails d’implémentation du plan de données. Ils ne doivent pas répondre à des
questions du plan de contrôle comme « quel plugin possède ce fournisseur ? », sauf si
l’appelant a délibérément demandé un chargement runtime.

N’ajoutez pas de caches persistants ou à horloge murale pour :

- les résultats de découverte
- les registres de manifeste directs
- les registres de manifeste reconstruits depuis l’index des plugins installés
- la recherche de propriétaire de fournisseur, la suppression de modèle, la politique de fournisseur ou les métadonnées
  d’artefacts publics
- toute autre réponse dérivée du manifeste lorsqu’un manifeste modifié, un index installé
  ou un chemin de chargement devrait être visible à la prochaine lecture de métadonnées

Les appelants qui reconstruisent les métadonnées de manifeste depuis l’index persistant des plugins installés
reconstruisent ce registre à la demande. L’index installé est un état durable
du plan source ; ce n’est pas un cache de métadonnées caché dans le processus.

## Modèle de registre

Les plugins chargés ne mutent pas directement des variables globales arbitraires du cœur. Ils s’enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC du Gateway
- les routes HTTP
- les registraires CLI
- les services en arrière-plan
- les commandes possédées par les plugins

Les fonctionnalités du cœur lisent ensuite depuis ce registre au lieu de communiquer directement avec les modules de plugins.
Cela garde le chargement unidirectionnel :

- module de plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation compte pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n’ont besoin que
d’un seul point d’intégration : « lire le registre », pas « traiter chaque module de plugin comme un cas spécial ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une demande de liaison
a été approuvée ou refusée :

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
- `request` : le résumé de la demande d’origine, l’indice de détachement, l’identifiant de l’expéditeur et les
  métadonnées de conversation

Ce callback sert uniquement à la notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation par le cœur.

## Hooks runtime des fournisseurs

Les plugins de fournisseur ont trois couches :

- **Métadonnées de manifeste** pour une recherche peu coûteuse avant le runtime :
  `setup.providers[].envVars`, compatibilité obsolète `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (`discovery` hérité) plus
  `applyConfigDefaults`.
- **Hooks runtime** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution de modèle,
  l’encapsulation de flux, les niveaux de réflexion, la politique de relecture et les points de terminaison d’utilisation. Consultez
  la liste complète sous [Ordre et utilisation des hooks](#hook-order-and-usage).

OpenClaw possède toujours la boucle d’agent générique, le basculement, la gestion des transcriptions et
la politique d’outils. Ces hooks sont la surface d’extension pour le comportement propre aux fournisseurs
sans nécessiter un transport d’inférence entièrement personnalisé.

Utilisez `setup.providers[].envVars` du manifeste lorsque le fournisseur dispose d’identifiants basés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans
charger le runtime du plugin. `providerAuthEnvVars` obsolète est encore lu par
l’adaptateur de compatibilité pendant la fenêtre de dépréciation, et les plugins non groupés
qui l’utilisent reçoivent un diagnostic de manifeste. Utilisez `providerAuthAliases`
du manifeste lorsqu’un identifiant de fournisseur doit réutiliser les variables d’environnement, profils d’authentification,
authentification adossée à la configuration et choix d’intégration par clé API d’un autre identifiant de fournisseur. Utilisez
`providerAuthChoices` du manifeste lorsque les surfaces CLI d’intégration/de choix d’authentification doivent connaître
l’identifiant de choix du fournisseur, les libellés de groupe et le câblage d’authentification simple à un seul indicateur sans
charger le runtime du fournisseur. Conservez `envVars` du runtime de fournisseur pour les indications destinées aux opérateurs,
comme les libellés d’intégration ou les variables de configuration OAuth
client-id/client-secret.

Utilisez `channelEnvVars` du manifeste lorsqu’un canal dispose d’une authentification ou configuration pilotée par l’environnement que
le repli générique d’environnement shell, les vérifications de configuration/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre et utilisation des hooks

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.
Les champs de fournisseur uniquement destinés à la compatibilité qu’OpenClaw n’appelle plus, comme
`ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont volontairement pas
listés ici.

| #   | Point d'accroche                  | Ce qu'il fait                                                                                                           | Quand l'utiliser                                                                                                                                                         |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`                    | Le fournisseur possède un catalogue ou des valeurs par défaut d'URL de base                                                                                               |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut de configuration globale propres au fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d'authentification, de l'environnement ou de la sémantique de famille de modèles du fournisseur                                  |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d'abord le chemin normal du registre/catalogue                                                           | _(pas un point d'accroche de Plugin)_                                                                                                                                    |
| 3   | `normalizeModelId`                | Normalise les alias d'identifiants de modèle hérités ou en aperçu avant la recherche                                     | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                                                     |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille de fournisseurs avant l'assemblage générique du modèle                         | Le fournisseur possède le nettoyage du transport pour les identifiants de fournisseur personnalisés dans la même famille de transport                                     |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution à l'exécution/du fournisseur                                       | Le fournisseur a besoin d'un nettoyage de configuration qui doit vivre avec le Plugin; les assistants groupés de la famille Google couvrent aussi les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique aux fournisseurs configurés les réécritures de compatibilité d'utilisation du streaming natif                   | Le fournisseur a besoin de correctifs de métadonnées d'utilisation du streaming natif pilotés par le point de terminaison                                                |
| 7   | `resolveConfigApiKey`             | Résout l'authentification par marqueur d'environnement pour les fournisseurs configurés avant le chargement de l'authentification à l'exécution | Les fournisseurs exposent leurs propres hooks de résolution de clé API par marqueur d'environnement                                                                       |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/auto-hébergée ou adossée à la configuration sans persister de texte en clair          | Le fournisseur peut fonctionner avec un marqueur d'identifiant synthétique/local                                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Superpose les profils d'authentification externes propres au fournisseur; la valeur par défaut de `persistence` est `runtime-only` pour les identifiants détenus par la CLI/l'application | Le fournisseur réutilise des identifiants d'authentification externes sans persister les jetons d'actualisation copiés; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse la priorité des espaces réservés de profils synthétiques stockés derrière l'authentification adossée à l'environnement/la configuration | Le fournisseur stocke des profils d'espace réservé synthétiques qui ne doivent pas l'emporter en priorité                                                                 |
| 11  | `resolveDynamicModel`             | Solution de repli synchrone pour les identifiants de modèles propres au fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des identifiants de modèles amont arbitraires                                                                                                      |
| 12  | `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s'exécute à nouveau                                                  | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                                                 |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner intégré utilise le modèle résolu                                                   | Le fournisseur a besoin de réécritures de transport tout en utilisant encore un transport central                                                                         |
| 14  | `normalizeToolSchemas`            | Normalise les schémas d'outils avant que le runner intégré les voie                                                      | Le fournisseur a besoin d'un nettoyage de schémas propre à la famille de transport                                                                                        |
| 15  | `inspectToolSchemas`              | Expose les diagnostics de schéma propres au fournisseur après normalisation                                               | Le fournisseur veut des avertissements de mots-clés sans enseigner au cœur des règles propres au fournisseur                                                              |
| 16  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                         | Le fournisseur a besoin d'un raisonnement/d'une sortie finale balisés au lieu de champs natifs                                                                            |
| 17  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d'options de flux                                  | Le fournisseur a besoin de paramètres de requête par défaut ou d'un nettoyage de paramètres par fournisseur                                                               |
| 18  | `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                              | Le fournisseur a besoin d'un protocole filaire personnalisé, pas seulement d'un wrapper                                                                                   |
| 20  | `wrapStreamFn`                    | Wrapper de flux après l'application des wrappers génériques                                                              | Le fournisseur a besoin de wrappers de compatibilité pour les en-têtes/le corps/le modèle de requête sans transport personnalisé                                          |
| 21  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées de transport natifs par tour                                                         | Le fournisseur veut que les transports génériques envoient l'identité de tour native du fournisseur                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de temporisation de session                                       | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                                           |
| 23  | `formatApiKey`                    | Formateur de profil d'authentification : le profil stocké devient la chaîne `apiKey` à l'exécution                       | Le fournisseur stocke des métadonnées d'authentification supplémentaires et a besoin d'une forme de jeton d'exécution personnalisée                                       |
| 24  | `refreshOAuth`                    | Remplacement de l'actualisation OAuth pour des points de terminaison d'actualisation personnalisés ou une politique d'échec d'actualisation | Le fournisseur ne correspond pas aux mécanismes d'actualisation OpenClaw partagés                                                                                         |
| 25  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque l'actualisation OAuth échoue                                                         | Le fournisseur a besoin d'une aide de réparation d'authentification propre au fournisseur après un échec d'actualisation                                                 |
| 26  | `matchesContextOverflowError`     | Détecteur de dépassement de fenêtre de contexte propre au fournisseur                                                    | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                                           |
| 27  | `classifyFailoverReason`          | Classification de la raison de basculement propre au fournisseur                                                         | Le fournisseur peut mapper des erreurs brutes d'API/de transport vers limitation de débit/surcharge/etc.                                                                  |
| 28  | `isCacheTtlEligible`              | Politique de cache de prompt pour les fournisseurs proxy/backhaul                                                        | Le fournisseur a besoin d'un filtrage de TTL de cache propre au proxy                                                                                                      |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d'authentification manquante                                           | Le fournisseur a besoin d'un indice de récupération d'authentification manquante propre au fournisseur                                                                   |
| 30  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après découverte                                                       | Le fournisseur a besoin de lignes synthétiques compatibles avec les versions futures dans `models list` et les sélecteurs                                                |
| 31  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` propre au modèle, libellés d'affichage et valeur par défaut                                 | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                                                 |
| 32  | `isBinaryThinking`                | Hook de compatibilité pour le basculeur de raisonnement activé/désactivé                                                 | Le fournisseur n'expose qu'une réflexion binaire activée/désactivée                                                                                                       |
| 33  | `supportsXHighThinking`           | Hook de compatibilité pour la prise en charge du raisonnement `xhigh`                                                    | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                                 | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                                                       |
| 35  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profil live et la sélection de smoke                                     | Le fournisseur possède la correspondance des modèles préférés pour live/smoke                                                                                             |
| 36  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le jeton/la clé réel à l'exécution juste avant l'inférence                       | Le fournisseur a besoin d'un échange de jeton ou d'un identifiant de requête de courte durée                                                                              |
| 37  | `resolveUsageAuth`                | Résout les identifiants d'utilisation/facturation pour `/usage` et les surfaces d'état associées                        | Le fournisseur a besoin d'une analyse personnalisée du jeton d'utilisation/quota ou d'un identifiant d'utilisation différent                                             |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser les instantanés d’utilisation/quota propres au fournisseur après la résolution de l’authentification                             | Le fournisseur a besoin d’un point de terminaison d’utilisation ou d’un analyseur de charge utile propre au fournisseur                                                                           |
| 39  | `createEmbeddingProvider`         | Créer un adaptateur d’embeddings détenu par le fournisseur pour la mémoire/recherche                                                     | Le comportement d’embedding mémoire appartient au plugin de fournisseur                                                                                    |
| 40  | `buildReplayPolicy`               | Renvoyer une politique de relecture contrôlant la gestion de la transcription pour le fournisseur                                        | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, la suppression des blocs de réflexion)                                                               |
| 41  | `sanitizeReplayHistory`           | Réécrire l’historique de relecture après le nettoyage générique de la transcription                                                        | Le fournisseur a besoin de réécritures de relecture propres au fournisseur au-delà des assistants partagés de Compaction                                                             |
| 42  | `validateReplayTurns`             | Validation finale des tours de relecture ou remodelage avant l’exécuteur intégré                                           | Le transport du fournisseur a besoin d’une validation des tours plus stricte après l’assainissement générique                                                                    |
| 43  | `onModelSelected`                 | Exécuter les effets de bord post-sélection détenus par le fournisseur                                                                 | Le fournisseur a besoin de télémétrie ou d’un état détenu par le fournisseur lorsqu’un modèle devient actif                                                                  |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin de fournisseur correspondant, puis passent aux autres plugins de
fournisseur capables d’exécuter ces points d’extension jusqu’à ce que l’un
modifie réellement l’id du modèle ou le transport/la configuration. Cela permet
aux shims de fournisseur d’alias/compatibilité de continuer à fonctionner sans
exiger que l’appelant sache quel plugin intégré possède la réécriture. Si aucun
point d’extension de fournisseur ne réécrit une entrée de configuration prise en
charge de la famille Google, le normaliseur de configuration Google intégré
applique toujours ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou
d’un exécuteur de requêtes personnalisé, il s’agit d’une autre catégorie
d’extension. Ces points d’extension concernent le comportement fournisseur qui
continue de s’exécuter dans la boucle d’inférence normale d’OpenClaw.

`resolveUsageAuth` décide si OpenClaw doit appeler `fetchUsageSnapshot` ou
revenir à la résolution générique des identifiants pour les surfaces
d’utilisation/état. Retournez `{ token, accountId? }` lorsque le fournisseur a
un identifiant d’utilisation, retournez `{ handled: true }` lorsque
l’authentification d’utilisation possédée par le fournisseur a traité la requête
et doit supprimer le repli générique clé d’API/OAuth, et retournez `null` ou
`undefined` lorsque le fournisseur n’a pas traité l’authentification
d’utilisation.

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

Les plugins de fournisseur intégrés combinent les points d’extension ci-dessus
pour s’adapter aux besoins de catalogue, d’authentification, de réflexion, de
relecture et d’utilisation de chaque fournisseur. L’ensemble de points
d’extension faisant autorité se trouve avec chaque plugin sous `extensions/` ;
cette page illustre les formes plutôt que de répliquer la liste.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les ids
    de modèles amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour posséder l’échange de jetons et l’intégration
    `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs
    d’opter pour une politique de transcription via `buildReplayPolicy` au lieu
    que chaque plugin réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent seulement `catalog` et utilisent la boucle
    d’inférence partagée.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` résident dans la
    frontière publique `api.ts` / `contract-api.ts` du plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Helpers d’exécution

Les plugins peuvent accéder à certains helpers du cœur via `api.runtime`. Pour
la synthèse vocale :

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

- `textToSpeech` retourne la charge utile de sortie TTS normale du cœur pour les surfaces de fichier/note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection de fournisseur.
- Retourne un tampon audio PCM + le taux d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif par fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration possédés par le fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches comme la langue, le genre et des étiquettes de personnalité pour les sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent en charge la téléphonie aujourd’hui. Microsoft ne la prend pas en charge.

Les plugins peuvent aussi enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

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

- Gardez la politique TTS, le repli et la livraison des réponses dans le cœur.
- Utilisez les fournisseurs de parole pour le comportement de synthèse possédé par le fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’id de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un plugin fournisseur
  peut posséder les fournisseurs de texte, parole, image et médias futurs à
  mesure qu’OpenClaw ajoute ces contrats de capacité.

Pour la compréhension d’image/audio/vidéo, les plugins enregistrent un
fournisseur de compréhension multimédia typé au lieu d’un sac clé/valeur
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

Remarques :

- Gardez l’orchestration, le repli, la configuration et le câblage des canaux dans le cœur.
- Gardez le comportement fournisseur dans le plugin de fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives,
  nouveaux champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper d’exécution
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les helpers d’exécution de compréhension multimédia, les plugins peuvent
appeler :

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

Pour la transcription audio, les plugins peuvent utiliser soit l’exécution de
compréhension multimédia, soit l’ancien alias STT :

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
  compréhension d’image/audio/vidéo.
- `extractStructuredWithModel(...)` est la frontière destinée aux plugins pour
  l’extraction bornée, possédée par le fournisseur et centrée d’abord sur
  l’image. Incluez au moins une entrée image ; les entrées texte sont un
  contexte supplémentaire.
  les plugins produit possèdent leurs routes et schémas tandis qu’OpenClaw
  possède la frontière fournisseur/exécution.
- Utilise la configuration audio de compréhension multimédia du cœur (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Retourne `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple une entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

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

- `provider` et `model` sont des remplacements facultatifs par exécution, pas des changements persistants de session.
- OpenClaw n’honore ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de repli possédées par un plugin, les opérateurs doivent accepter explicitement avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement toute cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de se replier silencieusement.
- Les sessions de sous-agent créées par un plugin sont étiquetées avec l’id du plugin créateur. Le repli `api.runtime.subagent.deleteSession(...)` peut supprimer uniquement ces sessions possédées ; la suppression arbitraire de sessions exige toujours une requête Gateway à portée administrateur.

Pour la recherche web, les plugins peuvent consommer le helper d’exécution
partagé au lieu d’accéder au câblage de l’outil agent :

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

Les plugins peuvent aussi enregistrer des fournisseurs de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Gardez la sélection de fournisseur, la résolution des identifiants et la sémantique de requête partagée dans le cœur.
- Utilisez des fournisseurs de recherche web pour les transports de recherche propres aux fournisseurs.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper de l’outil agent.

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

- `generate(...)` : générer une image en utilisant la chaîne de fournisseurs de génération d’images configurée.
- `listProviders(...)` : lister les fournisseurs de génération d’images disponibles et leurs capacités.

## Routes HTTP Gateway

Les plugins peuvent exposer des points de terminaison HTTP avec `api.registerHttpRoute(...)`.

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
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification Gateway normale, ou `"plugin"` pour l’authentification/vérification de Webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Autorise le même plugin à remplacer son propre enregistrement de route existant.
- `handler` : renvoyez `true` lorsque la route a traité la requête.

Notes :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes de plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec différents niveaux `auth` sont rejetées. Gardez les chaînes de repli `exact`/`prefix` uniquement au même niveau d’authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d’exécution opérateur. Elles servent aux Webhooks/vérifications de signature gérés par le plugin, pas aux appels d’aide Gateway privilégiés.
- Les routes `auth: "gateway"` s’exécutent dans une portée d’exécution de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) garde les portées d’exécution des routes de plugin limitées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP avec identité de confiance (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) honorent `x-openclaw-scopes` uniquement lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin avec identité, la portée d’exécution revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par Gateway est une surface d’administration implicite. Si votre route nécessite un comportement réservé aux administrateurs, exigez un mode d’authentification avec identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK Plugin

Utilisez des sous-chemins SDK étroits au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                         | Objectif                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Aides d’entrée/de construction de canal            |
| `openclaw/plugin-sdk/core`          | Aides partagées génériques et contrat englobant    |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent parmi une famille de points d’intégration étroits — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
sur un seul contrat `approvalCapability` plutôt que de mélanger des champs de
plugin sans rapport. Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les aides d’exécution et de configuration se trouvent sous des sous-chemins ciblés `*-runtime`
correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au large barrel de compatibilité `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
les petites façades d’aide de canal, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
et `openclaw/plugin-sdk/infra-runtime` sont des shims de compatibilité obsolètes pour les
anciens plugins. Le nouveau code doit importer des primitives génériques plus étroites à la place.
</Info>

Points d’entrée internes au dépôt (par racine de package de plugin intégré) :

- `index.js` — entrée de plugin intégré
- `api.js` — barrel d’aides/types
- `runtime-api.js` — barrel réservé à l’exécution
- `setup-entry.js` — entrée du plugin de configuration

Les plugins externes doivent importer uniquement les sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` d’un autre package de plugin depuis le cœur ou depuis un autre plugin.
Les points d’entrée chargés par façade privilégient l’instantané actif de configuration d’exécution lorsqu’il
existe, puis reviennent au fichier de configuration résolu sur disque.

Des sous-chemins propres aux capacités tels que `image-generation`, `media-understanding`,
et `speech` existent parce que les plugins intégrés les utilisent aujourd’hui. Ils ne sont pas
automatiquement des contrats externes gelés à long terme — vérifiez la page de référence SDK
pertinente lorsque vous vous appuyez dessus.

## Schémas des outils de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` propres au canal
pour les primitives hors message comme les réactions, lectures et sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs du fournisseur pour boutons, composants, blocs ou cartes.
Voir [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, la correspondance fournisseur et la liste de contrôle pour auteurs de plugins.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent afficher via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il affiche la présentation de manière native ou s’il la dégrade en texte.
N’exposez pas d’échappatoires d’interface utilisateur natives du fournisseur depuis l’outil de message générique.
Les aides SDK obsolètes pour les anciens schémas natifs restent exportées pour les plugins
tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles propres au canal. Gardez l’hôte
sortant partagé générique et utilisez la surface de l’adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.reservedLiterals` liste les mots bruts qui sont des
  références de canal/session pour ce fournisseur. La résolution préserve les entrées d’annuaire
  configurées avant de rejeter les littéraux réservés, puis échoue fermement en cas d’absence dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque
  le cœur a besoin d’une résolution finale possédée par le fournisseur après normalisation ou après une
  absence dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session
  propre au fournisseur une fois une cible résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation propre au fournisseur, pas pour
  une recherche large dans l’annuaire.
- Gardez les identifiants natifs du fournisseur comme les identifiants de discussion, de fil, les JID, handles et identifiants de salon
  dans les valeurs `target` ou les paramètres propres au fournisseur, pas dans les champs SDK génériques.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire depuis la configuration doivent garder cette logique dans le
plugin et réutiliser les aides partagées depuis
`openclaw/plugin-sdk/directory-runtime`.

Utilisez ceci lorsqu’un canal a besoin de pairs/groupes adossés à la configuration, comme :

- pairs DM pilotés par liste d’autorisation
- cartes de canaux/groupes configurées
- replis d’annuaire statiques limités à un compte

Les aides partagées dans `directory-runtime` gèrent uniquement les opérations génériques :

- filtrage des requêtes
- application des limites
- aides de déduplication/normalisation
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
d’URL de base ou des métadonnées de modèle soumises à authentification.

`catalog.order` contrôle quand le catalogue d’un plugin fusionne par rapport aux fournisseurs implicites
intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé d’API ou variable d’environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs gagnent en cas de collision de clé, afin que les plugins puissent remplacer intentionnellement une
entrée de fournisseur intégrée avec le même identifiant de fournisseur.

Les plugins peuvent aussi publier des lignes de modèles en lecture seule via
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. C’est la voie d’avenir pour les surfaces de liste/aide/sélecteur et elle prend en charge les lignes
`text`, `image_generation`, `video_generation` et `music_generation`.
Les plugins de fournisseur possèdent toujours les appels aux endpoints en direct, l’échange de jetons et la
correspondance des réponses fournisseur ; le cœur possède la forme commune des lignes, les libellés de source et
le formatage de l’aide des outils multimédias. Les enregistrements de fournisseurs de génération multimédia synthétisent automatiquement
des lignes de catalogue statiques à partir de `defaultModel`, `models` et `capabilities`.

Compatibilité :

- `discovery` fonctionne encore comme alias hérité, mais émet un avertissement d’obsolescence
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`
- `augmentModelCatalog` est obsolète ; les fournisseurs intégrés doivent publier
  les lignes supplémentaires via `registerModelCatalogProvider`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` avec `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il est autorisé à supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque des secrets requis sont manquants.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux de réparation doctor/config
  ne doivent pas avoir besoin de matérialiser les identifiants d’exécution simplement pour
  décrire la configuration.

Comportement `inspectAccount(...)` recommandé :

- Renvoyer uniquement un état de compte descriptif.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/état des identifiants lorsque pertinent, comme :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler la
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source
  correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de
commande » au lieu de planter ou de rapporter à tort que le compte n’est pas configuré.

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

Note de sécurité : `openclaw plugins install` installe les dépendances du plugin avec un
`npm install --omit=dev --ignore-scripts` local au projet (aucun script de cycle de vie,
aucune dépendance de développement à l’exécution), en ignorant les paramètres npm globaux hérités.
Gardez les arbres de dépendances des plugins en « JS/TS pur » et évitez les paquets qui exigent
des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger dédié à la configuration.
Quand OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
quand un plugin de canal est activé mais pas encore configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela allège le démarrage et la configuration
quand l’entrée principale de votre plugin câble aussi des outils, des hooks ou un autre code
réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire passer un plugin de canal par le même chemin `setupEntry` pendant la phase
de démarrage pré-écoute du Gateway, même lorsque le canal est déjà configuré.

Utilisez ceci uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le Gateway commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité détenue par le canal dont le démarrage dépend, par exemple :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le Gateway commence à écouter
- toutes les méthodes, tous les outils ou services du Gateway qui doivent exister pendant cette même fenêtre

Si votre entrée complète détient encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le plugin sur le comportement par défaut et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux groupés peuvent aussi publier des helpers de surface contractuelle dédiés à la configuration que le cœur
peut consulter avant le chargement de l’exécution complète du canal. La surface actuelle de promotion
de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration de canal héritée à compte unique
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple groupé actuel : il déplace uniquement les clés d’authentification/d’amorçage vers un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut non canonique configurée au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de correctifs de configuration gardent paresseuse la découverte de la surface contractuelle groupée.
Le temps d’import reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal groupé lors de l’import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC du Gateway, gardez-les sous un
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
- `docsLabel` : remplacer le texte du lien vers la documentation
- `preferOver` : ids de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles du texte de la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masquer le canal des surfaces de liste des canaux configurés lorsque défini sur `false`
- `exposure.setup` : masquer le canal des sélecteurs interactifs de configuration lorsque défini sur `false`
- `exposure.docs` : marquer le canal comme interne/privé pour les surfaces de navigation de la documentation
- `showConfigured` / `showInSetup` : alias hérités encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : inscrire le canal au flux `allowFrom` de démarrage rapide standard
- `forceAccountBinding` : exiger une liaison explicite de compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préférer la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export de registre MPM).
Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par des virgules/points-virgules/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

Les entrées de catalogue de canaux générées et les entrées de catalogue d’installation de fournisseurs exposent
des faits normalisés de source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés indiquent si la spécification npm est une version exacte ou un sélecteur flottant,
si les métadonnées d’intégrité attendues sont présentes et si un chemin de source local est aussi disponible.
Lorsque l’identité catalogue/paquet est connue, les faits normalisés avertissent si le nom de paquet npm analysé diverge de cette identité.
Ils avertissent aussi lorsque `defaultChoice` est invalide ou pointe vers une source qui n’est
pas disponible, et lorsque des métadonnées d’intégrité npm sont présentes sans source npm valide.
Les consommateurs doivent traiter `installSource` comme un champ facultatif additif afin que
les entrées construites à la main et les adaptateurs de catalogue n’aient pas à le synthétiser.
Cela permet à l’onboarding et aux diagnostics d’expliquer l’état du plan source sans
importer l’exécution du plugin.

Les entrées npm externes officielles doivent préférer un `npmSpec` exact avec
`expectedIntegrity`. Les noms de paquets nus et les dist-tags fonctionnent encore pour
compatibilité, mais ils affichent des avertissements de plan source afin que le catalogue puisse évoluer
vers des installations épinglées et vérifiées par intégrité sans casser les plugins existants.
Quand l’onboarding installe depuis un chemin de catalogue local, il enregistre une entrée d’index
de plugin géré avec `source: "path"` et un `sourcePath` relatif à l’espace de travail lorsque possible.
Le chemin de chargement opérationnel absolu reste dans `plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins
du poste local dans la configuration durable. Cela garde les installations de développement local visibles pour
les diagnostics de plan source sans ajouter une deuxième surface brute de divulgation de chemins du système de fichiers.
La ligne SQLite persistée `installed_plugin_index` est la source de vérité d’installation
et peut être actualisée sans charger les modules d’exécution du plugin.
Sa carte `installRecords` est durable même lorsqu’un manifeste de plugin est manquant ou
invalide ; sa charge utile `plugins` est une vue de manifeste reconstructible.

## Plugins de moteur de contexte

Les plugins de moteur de contexte détiennent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
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

La fabrique `ctx` expose les valeurs facultatives `config`, `agentDir` et `workspaceDir`
pour l’initialisation au moment de la construction.

`assemble()` peut renvoyer `contextProjection` lorsque le harnais actif dispose d’un
thread backend persistant. Omettez-le pour la projection héritée par tour. Renvoyez
`{ mode: "thread_bootstrap", epoch }` lorsque le contexte assemblé doit être
injecté une fois dans un thread backend et réutilisé jusqu’à ce que l’époque change. Changez
l’époque après que le contexte sémantique du moteur change, par exemple après une
passe de Compaction détenue par le moteur. Les hôtes peuvent préserver les métadonnées d’appel d’outil, la forme
d’entrée et les résultats d’outils expurgés dans une projection d’amorçage de thread afin que les nouveaux
threads backend conservent la continuité des outils sans copier les charges utiles brutes
porteuses de secrets.

Si votre moteur ne détient **pas** l’algorithme de Compaction, gardez `compact()`
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

Lorsqu’un plugin a besoin d’un comportement qui ne rentre pas dans l’API actuelle, ne contournez pas
le système de plugins avec un accès privé. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, fallback, fusion de configuration,
   cycle de vie, sémantique visible par les canaux et forme du helper d’exécution.
2. ajouter des surfaces typées d’enregistrement/exécution de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface typée
   utile de capacité.
3. câbler le cœur et les consommateurs de canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseur enregistrent ensuite leurs backends auprès de la capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites au fil du temps.

C’est ainsi qu’OpenClaw reste opiniâtre sans devenir codé en dur selon la vision du monde
d’un seul fournisseur. Consultez le [Livre de recettes des capacités](/fr/plugins/adding-capabilities)
pour une checklist concrète de fichiers et un exemple détaillé.

### Checklist des capacités

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat du cœur dans `src/<capability>/types.ts`
- helper d’exécution/runner du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API de plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition d’exécution du plugin dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/canal
  doivent la consommer
- helpers de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore entièrement intégrée.

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

- le noyau possède le contrat de capacité + l’orchestration
- les Plugins fournisseurs possèdent les implémentations fournisseur
- les Plugins de fonctionnalité/canal consomment les assistants d’exécution
- les tests de contrat gardent la propriété explicite

## Associé

- [Architecture des Plugins](/fr/plugins/architecture) — modèle et formes de capacité publics
- [Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Création de Plugins](/fr/plugins/building-plugins)
