---
read_when:
    - Implémentation des hooks d’exécution de fournisseur, du cycle de vie des canaux ou des packs de packages
    - Débogage de l’ordre de chargement des Plugins ou de l’état du registre
    - Ajout d’une nouvelle capacité de Plugin ou d’un Plugin de moteur de contexte
summary: 'Internes de l’architecture Plugin : pipeline de chargement, registre, points d’ancrage d’exécution, routes HTTP et tableaux de référence'
title: Fonctionnement interne de l’architecture Plugin
x-i18n:
    generated_at: "2026-05-02T07:12:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle public de capacités, les formes de Plugin et les contrats de
propriété/exécution, consultez [Architecture des Plugin](/fr/plugins/architecture). Cette page est la
référence pour les mécanismes internes : pipeline de chargement, registre, hooks d'exécution,
routes HTTP du Gateway, chemins d'importation et tableaux de schémas.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines de Plugin candidates
2. lit les manifestes de bundles natifs ou compatibles et les métadonnées des paquets
3. rejette les candidats non sûrs
4. normalise la configuration des Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l'activation pour chaque candidat
6. charge les modules natifs activés : les modules intégrés construits utilisent un chargeur natif ;
   le TypeScript source local tiers utilise le recours d'urgence Jiti
7. appelle les hooks natifs `register(api)` et collecte les enregistrements dans le registre de Plugin
8. expose le registre aux commandes et aux surfaces d'exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l'appelle au même moment. Tous les Plugin intégrés utilisent `register` ; préférez `register` pour les nouveaux Plugin.
</Note>

Les barrières de sécurité s'appliquent **avant** l'exécution. Les candidats sont bloqués
lorsque l'entrée sort de la racine du Plugin, que le chemin est accessible en écriture par tous, ou que la propriété du chemin
semble suspecte pour les Plugin non intégrés.

### Comportement fondé sur le manifeste

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l'utilise pour :

- identifier le Plugin
- découvrir les canaux/Skills/schéma de configuration déclarés ou les capacités de bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/espaces réservés de l'interface de contrôle
- afficher les métadonnées d'installation/catalogue
- conserver des descripteurs d'activation et de configuration peu coûteux sans charger l'exécution du Plugin

Pour les Plugin natifs, le module d'exécution est la partie du plan de données. Il enregistre
le comportement réel comme les hooks, outils, commandes ou flux de fournisseur.

Les blocs facultatifs de manifeste `activation` et `setup` restent sur le plan de contrôle.
Ce sont des descripteurs uniquement métadonnées pour la planification d'activation et la découverte de configuration ;
ils ne remplacent pas l'enregistrement à l'exécution, `register(...)`, ni `setupEntry`.
Les premiers consommateurs d'activation en direct utilisent désormais les indications de commande, de canal et de fournisseur du manifeste
pour restreindre le chargement des Plugin avant une matérialisation plus large du registre :

- le chargement de la CLI se limite aux Plugin qui possèdent la commande principale demandée
- la résolution de configuration/Plugin de canal se limite aux Plugin qui possèdent l'identifiant de canal demandé
- la résolution explicite de configuration/exécution de fournisseur se limite aux Plugin qui possèdent l'identifiant de fournisseur demandé
- la planification du démarrage du Gateway utilise `activation.onStartup` pour les imports explicites au démarrage
  et les exclusions de démarrage ; les Plugin sans métadonnées de démarrage ne se chargent que
  via des déclencheurs d'activation plus restreints

Le planificateur d'activation expose à la fois une API avec identifiants seuls pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un Plugin a été sélectionné,
en séparant les indications explicites de planificateur `activation.*` de la propriété de manifeste
de secours comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons est la frontière de compatibilité :
les métadonnées de Plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter les indications larges
ou le comportement de secours sans changer la sémantique du chargement à l'exécution.

La découverte de configuration préfère désormais les identifiants détenus par des descripteurs comme `setup.providers` et
`setup.cliBackends` pour restreindre les Plugin candidats avant de revenir à
`setup-api` pour les Plugin qui ont encore besoin de hooks d'exécution au moment de la configuration. Les listes de
configuration de fournisseurs utilisent le manifeste `providerAuthChoices`, les choix de configuration dérivés des descripteurs
et les métadonnées du catalogue d'installation sans charger l'exécution du fournisseur. Un
`setup.requiresRuntime: false` explicite est une limite uniquement descripteur ; un
`requiresRuntime` omis conserve le recours hérité à setup-api pour la compatibilité. Si plus
d'un Plugin découvert revendique le même fournisseur de configuration normalisé ou le même identifiant de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s'appuyer sur
l'ordre de découverte. Lorsque l'exécution de configuration s'exécute, les diagnostics du registre signalent
l'écart entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou backends CLI
enregistrés par setup-api sans bloquer les Plugin hérités.

### Frontière du cache de Plugin

OpenClaw ne met pas en cache les résultats de découverte de Plugin ni les données directes du registre de manifeste
derrière des fenêtres d'horloge murale. Les installations, modifications de manifeste et changements de chemin de chargement
doivent devenir visibles à la prochaine lecture explicite de métadonnées ou reconstruction d'instantané.
L'analyseur de fichier manifeste peut conserver un cache borné de signature de fichier indexé par le
chemin de manifeste ouvert, l'inode, la taille et les horodatages ; ce cache évite seulement
de réanalyser des octets inchangés et ne doit pas mettre en cache les réponses de découverte, de registre, de propriétaire ou
de stratégie.

Le chemin rapide sûr pour les métadonnées est la propriété explicite des objets, pas un cache caché.
Les chemins sensibles au démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` courant, la
`PluginLookUpTable` dérivée ou un registre de manifeste explicite dans la chaîne d'appel.
La validation de configuration, l'activation automatique au démarrage, l'amorçage des Plugin et la sélection des fournisseurs
peuvent réutiliser ces objets tant qu'ils représentent la configuration et l'inventaire de Plugin courants.
La recherche de configuration reconstruit toujours les métadonnées de manifeste à la demande
sauf si le chemin de configuration spécifique reçoit un registre de manifeste explicite ; gardez cela
comme solution de secours de chemin froid plutôt que d'ajouter des caches de recherche cachés. Lorsque l'entrée
change, reconstruisez et remplacez l'instantané au lieu de le muter ou de conserver
des copies historiques.
Les vues sur le registre de Plugin actif et les helpers d'amorçage des canaux intégrés
doivent être recalculés à partir du registre/de la racine courants. Les maps de courte durée conviennent
dans un appel pour dédupliquer le travail ou prévenir la réentrée ; elles ne doivent pas devenir des caches de métadonnées
de processus.

Pour le chargement de Plugin, la couche de cache persistante est le chargement à l'exécution. Elle peut réutiliser
l'état du chargeur lorsque du code ou des artefacts installés sont réellement chargés, par exemple :

- `PluginLoaderCacheState` et les registres d'exécution actifs compatibles
- les caches jiti/module et les caches de chargeur de surface publique utilisés pour éviter d'importer
  plusieurs fois la même surface d'exécution
- les caches de système de fichiers pour les artefacts de Plugin installés
- les maps de courte durée par appel pour la normalisation des chemins ou la résolution des doublons

Ces caches sont des détails d'implémentation du plan de données. Ils ne doivent pas répondre à des
questions du plan de contrôle comme « quel Plugin possède ce fournisseur ? » sauf si
l'appelant a délibérément demandé le chargement à l'exécution.

N'ajoutez pas de caches persistants ou basés sur l'horloge murale pour :

- les résultats de découverte
- les registres directs de manifeste
- les registres de manifeste reconstruits à partir de l'index des Plugin installés
- la recherche de propriétaire de fournisseur, la suppression de modèle, la stratégie de fournisseur ou les métadonnées d'artefact public
- toute autre réponse dérivée du manifeste pour laquelle un manifeste modifié, un index installé
  ou un chemin de chargement doit être visible à la prochaine lecture de métadonnées

Les appelants qui reconstruisent les métadonnées de manifeste à partir de l'index persistant des Plugin installés
reconstruisent ce registre à la demande. L'index installé est un état durable du plan source ;
ce n'est pas un cache caché de métadonnées en processus.

## Modèle de registre

Les Plugin chargés ne mutent pas directement des variables globales aléatoires du noyau. Ils s'enregistrent dans un
registre central de Plugin.

Le registre suit :

- les enregistrements de Plugin (identité, source, origine, état, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC du Gateway
- les routes HTTP
- les registraires CLI
- les services en arrière-plan
- les commandes détenues par un Plugin

Les fonctionnalités du noyau lisent ensuite ce registre au lieu de communiquer directement avec les modules de Plugin.
Cela maintient un chargement à sens unique :

- module de Plugin -> enregistrement dans le registre
- exécution du noyau -> consommation du registre

Cette séparation importe pour la maintenabilité. Elle signifie que la plupart des surfaces du noyau n'ont besoin
que d'un point d'intégration : « lire le registre », et non « traiter chaque module de Plugin comme un cas spécial ».

## Callbacks de liaison de conversation

Les Plugin qui lient une conversation peuvent réagir lorsqu'une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu'une demande de liaison
est approuvée ou refusée :

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
- `request` : le résumé de la demande d'origine, l'indication de détachement, l'identifiant de l'expéditeur et
  les métadonnées de conversation

Ce callback sert uniquement de notification. Il ne change pas qui est autorisé à lier une
conversation, et il s'exécute après la fin du traitement d'approbation du noyau.

## Hooks d'exécution des fournisseurs

Les Plugin de fournisseur ont trois couches :

- **Métadonnées de manifeste** pour une recherche peu coûteuse avant l'exécution :
  `setup.providers[].envVars`, compatibilité obsolète `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (`discovery` hérité) plus
  `applyConfigDefaults`.
- **Hooks d'exécution** : plus de 40 hooks facultatifs couvrant l'authentification, la résolution de modèle,
  l'encapsulation de flux, les niveaux de réflexion, la stratégie de relecture et les points de terminaison d'utilisation. Consultez
  la liste complète dans [Ordre des hooks et utilisation](#hook-order-and-usage).

OpenClaw reste responsable de la boucle d'agent générique, du basculement, de la gestion des transcriptions et de
la stratégie d'outils. Ces hooks sont la surface d'extension pour le comportement propre aux fournisseurs
sans nécessiter tout un transport d'inférence personnalisé.

Utilisez le manifeste `setup.providers[].envVars` lorsque le fournisseur a des identifiants basés sur l'environnement
que les chemins génériques d'authentification/état/sélecteur de modèle doivent voir sans
charger l'exécution du Plugin. `providerAuthEnvVars`, obsolète, est toujours lu par
l'adaptateur de compatibilité pendant la fenêtre de dépréciation, et les Plugin non intégrés
qui l'utilisent reçoivent un diagnostic de manifeste. Utilisez le manifeste `providerAuthAliases`
lorsqu'un identifiant de fournisseur doit réutiliser les variables d'environnement, les profils d'authentification,
l'authentification adossée à la configuration et le choix d'intégration de clé API d'un autre identifiant de fournisseur. Utilisez le manifeste
`providerAuthChoices` lorsque les surfaces CLI d'intégration/choix d'authentification doivent connaître
l'identifiant de choix du fournisseur, les libellés de groupe et le câblage simple d'authentification à un seul indicateur sans
charger l'exécution du fournisseur. Gardez les `envVars` d'exécution du fournisseur
pour les indications destinées aux opérateurs, comme les libellés d'intégration ou les variables de configuration
client-id/client-secret OAuth.

Utilisez le manifeste `channelEnvVars` lorsqu'un canal a une authentification ou une configuration pilotée par l'environnement que
le repli générique d'environnement shell, les vérifications de configuration/état ou les invites de configuration doivent voir
sans charger l'exécution du canal.

### Ordre des hooks et utilisation

Pour les Plugin de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l'utiliser » est le guide de décision rapide.
Les champs de fournisseur uniquement compatibles qu'OpenClaw n'appelle plus, comme
`ProviderPlugin.capabilities` et `suppressBuiltInModel`, sont volontairement absents
de cette liste.

| #   | Hook                              | Ce qu’il fait                                                                                                | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publier la config du fournisseur dans `models.providers` pendant la génération de `models.json`              | Le fournisseur possède un catalogue ou des valeurs par défaut d’URL de base                                                                  |
| 2   | `applyConfigDefaults`             | Appliquer les valeurs par défaut de config globale propres au fournisseur pendant la matérialisation de config | Les valeurs par défaut dépendent du mode d’authentification, de l’env ou de la sémantique de famille de modèles du fournisseur                |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin registre/catalogue normal                                                  | _(pas un hook de Plugin)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normaliser les alias d’identifiants de modèle hérités ou en préversion avant la recherche                    | Le fournisseur possède le nettoyage des alias avant la résolution canonique du modèle                                                         |
| 4   | `normalizeTransport`              | Normaliser `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle            | Le fournisseur possède le nettoyage du transport pour des ids de fournisseurs personnalisés dans la même famille de transport                 |
| 5   | `normalizeConfig`                 | Normaliser `models.providers.<id>` avant la résolution runtime/fournisseur                                   | Le fournisseur a besoin d’un nettoyage de config qui doit vivre avec le Plugin ; les helpers groupés de la famille Google servent aussi de filet de sécurité pour les entrées de config Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Appliquer aux fournisseurs de config les réécritures de compatibilité d’utilisation du streaming natif        | Le fournisseur a besoin de corrections de métadonnées d’utilisation du streaming natif pilotées par endpoint                                  |
| 7   | `resolveConfigApiKey`             | Résoudre l’auth par marqueur d’env pour les fournisseurs de config avant le chargement de l’auth runtime      | Le fournisseur dispose d’une résolution de clé API par marqueur d’env qui lui appartient ; `amazon-bedrock` dispose aussi ici d’un résolveur AWS intégré par marqueur d’env |
| 8   | `resolveSyntheticAuth`            | Exposer une auth locale/auto-hébergée ou adossée à la config sans persister de texte en clair                 | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                              |
| 9   | `resolveExternalAuthProfiles`     | Superposer les profils d’auth externes propres au fournisseur ; le `persistence` par défaut est `runtime-only` pour les identifiants détenus par la CLI/l’app | Le fournisseur réutilise des identifiants d’auth externes sans persister les jetons d’actualisation copiés ; déclarer `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisser la priorité des espaces réservés de profils synthétiques stockés derrière une auth adossée à l’env/config | Le fournisseur stocke des profils d’espaces réservés synthétiques qui ne doivent pas l’emporter dans la précédence                            |
| 11  | `resolveDynamicModel`             | Solution de repli synchrone pour les ids de modèles propres au fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des ids de modèles upstream arbitraires                                                                                |
| 12  | `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                      | Le fournisseur a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                              |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner embarqué utilise le modèle résolu                                      | Le fournisseur a besoin de réécritures de transport mais utilise encore un transport core                                                     |
| 14  | `contributeResolvedModelCompat`   | Fournir des indicateurs de compatibilité pour les modèles de vendeurs derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                 |
| 15  | `normalizeToolSchemas`            | Normaliser les schémas d’outils avant que le runner embarqué les voie                                        | Le fournisseur a besoin d’un nettoyage de schéma par famille de transport                                                                     |
| 16  | `inspectToolSchemas`              | Exposer les diagnostics de schéma propres au fournisseur après normalisation                                  | Le fournisseur veut des avertissements de mots-clés sans enseigner au core des règles spécifiques au fournisseur                              |
| 17  | `resolveReasoningOutputMode`      | Sélectionner le contrat de sortie de raisonnement natif ou balisé                                            | Le fournisseur a besoin d’une sortie de raisonnement/finale balisée au lieu de champs natifs                                                  |
| 18  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                      | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres par fournisseur                                   |
| 19  | `createStreamFn`                  | Remplacer entièrement le chemin de flux normal par un transport personnalisé                                  | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                       |
| 20  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                     | Le fournisseur a besoin de wrappers de compatibilité pour les en-têtes/le corps/le modèle de requête sans transport personnalisé              |
| 21  | `resolveTransportTurnState`       | Attacher des en-têtes ou métadonnées de transport natifs par tour                                             | Le fournisseur veut que les transports génériques envoient l’identité de tour native du fournisseur                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Attacher des en-têtes WebSocket natifs ou une stratégie de temporisation de session                           | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la stratégie de repli                                |
| 23  | `formatApiKey`                    | Formateur de profil d’auth : le profil stocké devient la chaîne `apiKey` runtime                             | Le fournisseur stocke des métadonnées d’auth supplémentaires et a besoin d’une forme de jeton runtime personnalisée                           |
| 24  | `refreshOAuth`                    | Remplacement de l’actualisation OAuth pour des endpoints d’actualisation personnalisés ou une stratégie d’échec d’actualisation | Le fournisseur ne correspond pas aux actualiseurs `pi-ai` partagés                                                                            |
| 25  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque l’actualisation OAuth échoue                                              | Le fournisseur a besoin de conseils de réparation d’auth propres au fournisseur après un échec d’actualisation                                |
| 26  | `matchesContextOverflowError`     | Correspondance d’un dépassement de fenêtre de contexte propre au fournisseur                                  | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                               |
| 27  | `classifyFailoverReason`          | Classification de la raison de basculement propre au fournisseur                                              | Le fournisseur peut mapper des erreurs API/transport brutes vers limite de débit/surcharge/etc.                                               |
| 28  | `isCacheTtlEligible`              | Stratégie de cache de prompt pour les fournisseurs proxy/backhaul                                             | Le fournisseur a besoin d’un filtrage TTL de cache spécifique au proxy                                                                        |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’auth manquante                                            | Le fournisseur a besoin d’un indice de récupération d’auth manquante spécifique au fournisseur                                                |
| 30  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                         | Le fournisseur a besoin de lignes synthétiques de compatibilité ascendante dans `models list` et les sélecteurs                               |
| 31  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` spécifiques au modèle, libellés d’affichage et valeur par défaut                 | Le fournisseur expose une échelle de pensée personnalisée ou un libellé binaire pour les modèles sélectionnés                                 |
| 32  | `isBinaryThinking`                | Hook de compatibilité pour le basculement raisonnement activé/désactivé                                       | Le fournisseur expose uniquement une pensée binaire activée/désactivée                                                                        |
| 33  | `supportsXHighThinking`           | Hook de compatibilité de prise en charge du raisonnement `xhigh`                                              | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                         |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilité du niveau `/think` par défaut                                                           | Le fournisseur possède la stratégie `/think` par défaut pour une famille de modèles                                                           |
| 35  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profil live et la sélection smoke                        | Le fournisseur possède la correspondance de modèle préféré live/smoke                                                                         |
| 36  | `prepareRuntimeAuth`              | Échanger un identifiant configuré contre le jeton/la clé runtime réel juste avant l’inférence                 | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                  |
| 37  | `resolveUsageAuth`                | Résoudre les identifiants d’utilisation/facturation pour `/usage` et les surfaces d’état associées                                     | Le fournisseur nécessite une analyse personnalisée du jeton d’utilisation/quota ou un identifiant d’utilisation différent                                                               |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser les instantanés d’utilisation/quota propres au fournisseur après la résolution de l’authentification                             | Le fournisseur nécessite un point de terminaison d’utilisation propre au fournisseur ou un analyseur de charge utile                                                                           |
| 39  | `createEmbeddingProvider`         | Construire un adaptateur d’embedding appartenant au fournisseur pour la mémoire/recherche                                                     | Le comportement d’embedding de la mémoire appartient au Plugin du fournisseur                                                                                    |
| 40  | `buildReplayPolicy`               | Renvoyer une politique de relecture contrôlant la gestion de la transcription pour le fournisseur                                        | Le fournisseur nécessite une politique de transcription personnalisée (par exemple, la suppression des blocs de réflexion)                                                               |
| 41  | `sanitizeReplayHistory`           | Réécrire l’historique de relecture après le nettoyage générique de la transcription                                                        | Le fournisseur nécessite des réécritures de relecture propres au fournisseur au-delà des helpers de Compaction partagés                                                             |
| 42  | `validateReplayTurns`             | Validation finale des tours de relecture ou remise en forme avant le runner intégré                                           | Le transport du fournisseur nécessite une validation des tours plus stricte après l’assainissement générique                                                                    |
| 43  | `onModelSelected`                 | Exécuter les effets secondaires post-sélection appartenant au fournisseur                                                                 | Le fournisseur nécessite de la télémétrie ou un état appartenant au fournisseur lorsqu’un modèle devient actif                                                                  |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin fournisseur correspondant, puis continuent avec les autres Plugins
fournisseur capables de hooks jusqu’à ce que l’un modifie réellement l’id de
modèle ou le transport/la configuration. Cela permet aux shims fournisseur
d’alias/de compatibilité de fonctionner sans que l’appelant doive savoir quel
Plugin intégré possède la réécriture. Si aucun hook fournisseur ne réécrit une
entrée de configuration de la famille Google prise en charge, le normaliseur de
configuration Google intégré applique tout de même ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
cela relève d’une autre classe d’extension. Ces hooks concernent les comportements de fournisseur
qui s’exécutent encore dans la boucle d’inférence normale d’OpenClaw.

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

Les Plugins fournisseur intégrés combinent les hooks ci-dessus pour s’adapter aux besoins
de chaque catalogue fournisseur, d’authentification, de raisonnement, de rejeu et d’utilisation. L’ensemble de hooks faisant autorité se trouve avec
chaque Plugin sous `extensions/` ; cette page illustre les formes plutôt que de
reproduire la liste.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les ids de modèle
    en amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour posséder l’échange de jetons et l’intégration `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs d’adopter une
    politique de transcription via `buildReplayPolicy` au lieu que chaque Plugin
    réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent seulement `catalog` et utilisent la boucle d’inférence partagée.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` vivent dans le
    seam public `api.ts` / `contract-api.ts` du Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Helpers d’exécution

Les Plugins peuvent accéder à certains helpers du cœur via `api.runtime`. Pour TTS :

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

- `textToSpeech` renvoie la charge utile de sortie TTS normale du cœur pour les surfaces de fichier/de note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection du fournisseur.
- Renvoie un tampon audio PCM + le taux d’échantillonnage. Les Plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches comme la locale, le genre et les étiquettes de personnalité pour les sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent en charge la téléphonie aujourd’hui. Microsoft ne le fait pas.

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

- Gardez la politique TTS, le repli et la livraison des réponses dans le cœur.
- Utilisez des fournisseurs de parole pour les comportements de synthèse appartenant au fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’id fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un Plugin fournisseur peut posséder
  les fournisseurs de texte, de parole, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension d’image/audio/vidéo, les Plugins enregistrent un fournisseur
de compréhension multimédia typé au lieu d’un sac clé/valeur générique :

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

- Gardez l’orchestration, le repli, la configuration et le câblage des canaux dans le cœur.
- Gardez le comportement fournisseur dans le Plugin fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux
  champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper d’exécution
  - les Plugins fournisseur enregistrent `api.registerVideoGenerationProvider(...)`
  - les Plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les helpers d’exécution de compréhension multimédia, les Plugins peuvent appeler :

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

Pour la transcription audio, les Plugins peuvent utiliser soit l’exécution de compréhension multimédia,
soit l’ancien alias STT :

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
  compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension multimédia du cœur (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` quand aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
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

- `provider` et `model` sont des remplacements facultatifs par exécution, pas des changements de session persistants.
- OpenClaw n’honore ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de repli appartenant à un Plugin, les opérateurs doivent adhérer avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les Plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de Plugin non fiable fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de retomber silencieusement.
- Les sessions de sous-agent créées par un Plugin sont étiquetées avec l’id du Plugin créateur. Le repli `api.runtime.subagent.deleteSession(...)` peut supprimer uniquement ces sessions possédées ; la suppression arbitraire de session exige toujours une requête Gateway avec portée administrateur.

Pour la recherche web, les Plugins peuvent consommer le helper d’exécution partagé au lieu
d’accéder au câblage d’outil de l’agent :

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

- Gardez la sélection de fournisseur, la résolution des identifiants et la sémantique de requête partagée dans le cœur.
- Utilisez des fournisseurs de recherche web pour les transports de recherche propres aux fournisseurs.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les Plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre de l’enveloppe d’outil de l’agent.

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

## Routes HTTP Gateway

Les Plugins peuvent exposer des endpoints HTTP avec `api.registerHttpRoute(...)`.

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

- `path` : chemin de route sous le serveur HTTP Gateway.
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification Gateway normale, ou `"plugin"` pour l’authentification/la vérification de Webhook gérée par le Plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Notes :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes de plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf avec `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de repli `exact`/`prefix` uniquement au même niveau d’authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les périmètres d’exécution de l’opérateur. Elles servent aux webhooks/vérifications de signature gérés par le plugin, pas aux appels privilégiés d’assistance du Gateway.
- Les routes `auth: "gateway"` s’exécutent dans un périmètre d’exécution de requête Gateway, mais ce périmètre est volontairement conservateur :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les périmètres d’exécution des routes de plugin fixés à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP fiables portant une identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) honorent `x-openclaw-scopes` uniquement lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de routes de plugin portant une identité, le périmètre d’exécution revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par le gateway est une surface d’administration implicite. Si votre route nécessite un comportement réservé à l’administration, exigez un mode d’authentification portant une identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’import du SDK Plugin

Utilisez des sous-chemins SDK étroits plutôt que le barrel racine monolithique `openclaw/plugin-sdk` lors de la création de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                         | Objectif                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de Plugin             |
| `openclaw/plugin-sdk/channel-core`  | Assistants d’entrée/construction de canal         |
| `openclaw/plugin-sdk/core`          | Assistants partagés génériques et contrat global  |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent parmi une famille de jonctions étroites — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
sur un seul contrat `approvalCapability` plutôt que de se mélanger entre des
champs de plugin sans rapport. Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les assistants d’exécution et de configuration résident sous les sous-chemins ciblés `*-runtime`
correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au vaste barrel de compatibilité `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
et `openclaw/plugin-sdk/infra-runtime` sont des adaptateurs de compatibilité obsolètes pour
les anciens plugins. Le nouveau code doit importer plutôt des primitives génériques plus étroites.
</Info>

Points d’entrée internes au dépôt (par racine de package de plugin groupé) :

- `index.js` — entrée de plugin groupé
- `api.js` — barrel d’assistants/types
- `runtime-api.js` — barrel réservé à l’exécution
- `setup-entry.js` — entrée de plugin de configuration

Les plugins externes doivent uniquement importer des sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` d’un autre package de plugin depuis le cœur ou depuis un autre plugin.
Les points d’entrée chargés via façade préfèrent l’instantané actif de configuration d’exécution lorsqu’il
existe, puis reviennent au fichier de configuration résolu sur le disque.

Les sous-chemins propres aux capacités, tels que `image-generation`, `media-understanding`
et `speech`, existent parce que les plugins groupés les utilisent aujourd’hui. Ils ne sont pas
automatiquement des contrats externes figés à long terme — consultez la page de référence SDK
pertinente lorsque vous vous appuyez dessus.

## Schémas d’outils de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` propres au canal
pour les primitives hors message telles que les réactions, les lectures et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu des champs natifs fournisseur pour boutons, composants, blocs ou cartes.
Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, la correspondance fournisseur et la liste de vérification pour auteurs de plugins.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent restituer au moyen des capacités de message :

- `presentation` pour les blocs de présentation sémantiques (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il faut restituer la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires d’interface utilisateur natives fournisseur depuis l’outil de message générique.
Les assistants SDK obsolètes pour les anciens schémas natifs restent exportés pour les plugins
tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique de cible propre au canal. Gardez l’hôte
sortant partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque
  le cœur a besoin d’une résolution finale appartenant au fournisseur après normalisation ou après un
  échec de l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session
  propre au fournisseur une fois qu’une cible est résolue.

Découpage recommandé :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation propre au fournisseur, pas pour
  une recherche large dans l’annuaire.
- Gardez les identifiants natifs fournisseur comme les identifiants de discussion, identifiants de fil, JID, handles et identifiants de salon
  dans les valeurs `target` ou les paramètres propres au fournisseur, pas dans des champs SDK génériques.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire depuis la configuration doivent garder cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration, tels que :

- pairs DM pilotés par liste d’autorisation
- correspondances de canaux/groupes configurées
- replis d’annuaire statiques limités à un compte

Les assistants partagés dans `directory-runtime` ne gèrent que les opérations génériques :

- filtrage des requêtes
- application de limite
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte propre au canal et la normalisation d’identifiants doivent rester dans
l’implémentation du plugin.

## Catalogues de fournisseurs

Les plugins de fournisseur peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède les identifiants de modèle propres au fournisseur, les valeurs par défaut
d’URL de base ou les métadonnées de modèle soumises à authentification.

`catalog.order` contrôle quand le catalogue d’un plugin fusionne par rapport aux fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l’emportent en cas de collision de clé, afin que les plugins puissent remplacer intentionnellement
une entrée de fournisseur intégrée ayant le même identifiant de fournisseur.

Compatibilité :

- `discovery` fonctionne encore comme ancien alias
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` avec `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque des secrets requis sont manquants.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` et les flux de doctor/réparation de configuration
  ne doivent pas avoir besoin de matérialiser les identifiants d’exécution uniquement pour
  décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoyer uniquement un état de compte descriptif.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/état des identifiants lorsque pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des tokens uniquement pour signaler la
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source
  correspondant) suffit pour les commandes de type état.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de
commande » au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

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

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire de plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du package sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances de plugin avec une
commande `npm install --omit=dev --ignore-scripts` locale au projet (pas de scripts de cycle de vie,
pas de dépendances de développement à l’exécution), en ignorant les paramètres globaux npm install hérités.
Gardez les arbres de dépendances de plugin « JS/TS purs » et évitez les packages qui nécessitent
des constructions `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsqu’OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais toujours non configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela allège le démarrage et la configuration
lorsque l’entrée principale de votre plugin câble aussi des outils, hooks ou autre code
réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour le même chemin `setupEntry` pendant la phase de démarrage
pré-écoute du gateway, même lorsque le canal est déjà configuré.

Utilisez ceci uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le gateway commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont dépend le démarrage, comme :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le gateway commence à écouter
- toutes les méthodes, outils ou services du gateway qui doivent exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le plugin sur le comportement par défaut et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux groupés peuvent aussi publier des assistants de surface de contrat réservés à la configuration que le cœur
peut consulter avant le chargement de l’exécution complète du canal. La surface actuelle de promotion
de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le noyau utilise cette surface lorsqu’il doit promouvoir une configuration de canal héritée à compte unique vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin. Matrix est l’exemple groupé actuel : il déplace uniquement les clés d’authentification/d’amorçage vers un compte promu nommé lorsque des comptes nommés existent déjà, et il peut conserver une clé de compte par défaut non canonique configurée au lieu de toujours créer `accounts.default`.

Ces adaptateurs de correctifs de configuration gardent paresseuse la découverte de surface contractuelle groupée. Le temps d’importation reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de relancer le démarrage du canal groupé lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC de passerelle, conservez-les sous un préfixe propre au plugin. Les espaces de noms d’administration du noyau (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours en `operator.admin`, même si un plugin demande une portée plus étroite.

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

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et des indications d’installation via `openclaw.install`. Cela évite au catalogue du noyau de contenir des données.

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
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de texte pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de mise en forme sortante
- `exposure.configured` : masque le canal dans les surfaces de liste des canaux configurés lorsque défini sur `false`
- `exposure.setup` : masque le canal dans les sélecteurs interactifs de configuration lorsque défini sur `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de la documentation
- `showConfigured` / `showInSetup` : alias hérités encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : active le flux standard de démarrage rapide `allowFrom` pour le canal
- `forceAccountBinding` : exige une liaison explicite du compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : privilégie la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut également fusionner des **catalogues de canaux externes** (par exemple, un export de registre MPM). Déposez un fichier JSON à l’un des emplacements suivants :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers un ou plusieurs fichiers JSON (délimités par des virgules, des points-virgules ou `PATH`). Chaque fichier doit contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte également `"packages"` ou `"plugins"` comme alias hérités pour la clé `"entries"`.

Les entrées de catalogue de canaux générées et les entrées de catalogue d’installation de fournisseurs exposent des faits normalisés sur la source d’installation à côté du bloc brut `openclaw.install`. Les faits normalisés indiquent si la spécification npm est une version exacte ou un sélecteur flottant, si les métadonnées d’intégrité attendues sont présentes, et si un chemin de source local est également disponible. Lorsque l’identité du catalogue/paquet est connue, les faits normalisés avertissent si le nom de paquet npm analysé s’écarte de cette identité. Ils avertissent également lorsque `defaultChoice` est invalide ou pointe vers une source indisponible, et lorsque des métadonnées d’intégrité npm sont présentes sans source npm valide. Les consommateurs doivent traiter `installSource` comme un champ optionnel additif afin que les entrées construites à la main et les adaptations de catalogue n’aient pas à le synthétiser. Cela permet à l’onboarding et aux diagnostics d’expliquer l’état du plan de source sans importer l’exécution du plugin.

Les entrées npm externes officielles doivent préférer un `npmSpec` exact avec `expectedIntegrity`. Les noms de paquets nus et les dist-tags fonctionnent toujours pour compatibilité, mais ils affichent des avertissements de plan de source afin que le catalogue puisse évoluer vers des installations épinglées et vérifiées par intégrité sans casser les plugins existants. Lorsque l’onboarding installe depuis un chemin de catalogue local, il enregistre une entrée d’index de plugin géré avec `source: "path"` et un `sourcePath` relatif à l’espace de travail lorsque c’est possible. Le chemin opérationnel absolu de chargement reste dans `plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins de poste de travail locaux dans la configuration durable. Cela garde les installations de développement local visibles pour les diagnostics de plan de source sans ajouter une seconde surface brute de divulgation de chemin de système de fichiers. L’index de plugins persistant `plugins/installs.json` est la source de vérité d’installation et peut être actualisé sans charger les modules d’exécution de plugin. Sa carte `installRecords` est durable même lorsqu’un manifeste de plugin est manquant ou invalide ; son tableau `plugins` est une vue de manifeste reconstruisible.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage et la Compaction. Enregistrez-les depuis votre plugin avec `api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec `plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut plutôt que simplement ajouter une recherche de mémoire ou des hooks.

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

La fabrique `ctx` expose des valeurs optionnelles `config`, `agentDir` et `workspaceDir` pour l’initialisation au moment de la construction.

Si votre moteur ne possède **pas** l’algorithme de Compaction, gardez `compact()` implémenté et déléguez-le explicitement :

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

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas le système de plugins avec un accès privé direct. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du noyau
   Décidez quel comportement partagé le noyau doit posséder : politique, repli, fusion de configuration, cycle de vie, sémantique côté canal et forme de l’assistant d’exécution.
2. ajouter des surfaces typées d’enregistrement/d’exécution de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface de capacité typée utile.
3. câbler le noyau et les consommateurs de canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le noyau, et non en important directement une implémentation de fournisseur.
4. enregistrer les implémentations de fournisseurs
   Les plugins de fournisseurs enregistrent ensuite leurs backends auprès de la capacité.
5. ajouter une couverture contractuelle
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la vision du monde d’un seul fournisseur. Consultez le [Guide pratique des capacités](/fr/plugins/architecture) pour une liste de vérification de fichiers concrète et un exemple détaillé.

### Liste de vérification des capacités

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces surfaces ensemble :

- types de contrat du noyau dans `src/<capability>/types.ts`
- assistant d’exécution/runner du noyau dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API de plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition d’exécution de plugin dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est pas encore entièrement intégrée.

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

- le noyau possède le contrat de capacité et l’orchestration
- les plugins de fournisseurs possèdent les implémentations de fournisseurs
- les plugins de fonctionnalité/canal consomment les assistants d’exécution
- les tests de contrat gardent la propriété explicite

## Connexe

- [Architecture des plugins](/fr/plugins/architecture) — modèle public de capacités et formes
- [Sous-chemins du SDK de plugins](/fr/plugins/sdk-subpaths)
- [Configuration du SDK de plugins](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
