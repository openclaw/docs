---
read_when:
    - Implémentation des hooks d’exécution des fournisseurs, du cycle de vie des canaux ou des packs de packages
    - Débogage de l’ordre de chargement des plugins ou de l’état du registre
    - Ajout d'une nouvelle capacité de Plugin ou d'un Plugin de moteur de contexte
summary: 'Internes de l’architecture Plugin : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: Détails internes de l’architecture Plugin
x-i18n:
    generated_at: "2026-05-02T20:48:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle public de capacités, les formes de plugins et les contrats de
propriété/exécution, consultez [Architecture des Plugin](/fr/plugins/architecture).
Cette page est la référence pour la mécanique interne : pipeline de chargement,
registre, hooks d’exécution, routes HTTP du Gateway, chemins d’importation et
tables de schémas.

## Pipeline de chargement

Au démarrage, OpenClaw effectue globalement ceci :

1. découvrir les racines de plugins candidates
2. lire les manifestes de bundles natifs ou compatibles et les métadonnées de paquet
3. rejeter les candidats non sûrs
4. normaliser la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décider de l’activation pour chaque candidat
6. charger les modules natifs activés : les modules groupés construits utilisent un chargeur natif ;
   le code source TypeScript local tiers utilise le repli d’urgence Jiti
7. appeler les hooks natifs `register(api)` et collecter les enregistrements dans le registre des plugins
8. exposer le registre aux commandes/surfaces d’exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même point. Tous les plugins groupés utilisent `register` ; privilégiez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité s’appliquent **avant** l’exécution. Les candidats sont bloqués
lorsque l’entrée sort de la racine du plugin, que le chemin est modifiable par tous, ou que
la propriété du chemin paraît suspecte pour les plugins non groupés.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/skills/schéma de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/espaces réservés de l’interface de contrôle
- afficher les métadonnées d’installation/catalogue
- conserver des descripteurs d’activation et de configuration peu coûteux sans charger l’exécution du plugin

Pour les plugins natifs, le module d’exécution est la partie du plan de données. Il enregistre
le comportement réel, comme les hooks, outils, commandes ou flux de fournisseurs.

Les blocs facultatifs `activation` et `setup` du manifeste restent sur le plan de contrôle.
Ce sont des descripteurs uniquement métadonnées pour la planification de l’activation et la découverte de configuration ;
ils ne remplacent pas l’enregistrement à l’exécution, `register(...)`, ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indices de commandes, de canaux et de fournisseurs du manifeste
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux plugins qui possèdent la commande principale demandée
- la résolution de configuration/plugin de canal se limite aux plugins qui possèdent l’id
  de canal demandé
- la résolution explicite de configuration/exécution du fournisseur se limite aux plugins qui possèdent l’id
  de fournisseur demandé
- la planification de démarrage du Gateway utilise `activation.onStartup` pour les importations
  explicites au démarrage et les désactivations au démarrage ; les plugins sans métadonnées de démarrage ne se chargent que
  via des déclencheurs d’activation plus restreints

Les préchargements d’exécution au moment de la requête qui demandent la portée large `all` dérivent tout de même un
ensemble explicite d’ids de plugins effectifs à partir de la configuration, de la planification de démarrage, des
canaux configurés, des slots et des règles d’activation automatique. Si cet ensemble dérivé est vide, OpenClaw
charge un registre d’exécution vide au lieu de l’élargir à tous les plugins découvrables.

Le planificateur d’activation expose à la fois une API ids-only pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un plugin a été sélectionné,
en séparant les indices explicites du planificateur `activation.*` de la solution de repli de propriété du manifeste,
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons est la frontière de compatibilité :
les métadonnées de plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter les indices larges
ou le comportement de repli sans changer la sémantique de chargement à l’exécution.

La découverte de configuration privilégie désormais les ids possédés par des descripteurs, comme `setup.providers` et
`setup.cliBackends`, pour restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks d’exécution au moment de la configuration. Les listes de configuration de fournisseurs utilisent
`providerAuthChoices` du manifeste, les choix de configuration dérivés des descripteurs
et les métadonnées du catalogue d’installation sans charger l’exécution du fournisseur. Le paramètre explicite
`setup.requiresRuntime: false` est un arrêt uniquement descripteur ; l’omission de
`requiresRuntime` conserve le repli hérité vers setup-api pour compatibilité. Si plusieurs
plugins découverts revendiquent le même fournisseur de configuration normalisé ou le même id de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de dépendre de
l’ordre de découverte. Lorsque l’exécution de configuration s’exécute, les diagnostics du registre signalent
l’écart entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou backends CLI
enregistrés par setup-api sans bloquer les plugins hérités.

### Frontière du cache de plugins

OpenClaw ne met pas en cache les résultats de découverte de plugins ni les données directes du registre de manifestes
derrière des fenêtres temporelles. Les installations, modifications de manifeste et changements de chemins de chargement
doivent devenir visibles à la prochaine lecture explicite de métadonnées ou reconstruction d’instantané.
L’analyseur de fichier manifeste peut conserver un cache borné de signature de fichier, indexé par le
chemin de manifeste ouvert, l’inode, la taille et les horodatages ; ce cache évite seulement de
réanalyser des octets inchangés et ne doit pas mettre en cache les réponses de découverte, de registre, de propriétaire ou
de politique.

Le chemin rapide sûr des métadonnées repose sur la propriété explicite des objets, pas sur un cache caché.
Les chemins critiques du démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` actuel, la
`PluginLookUpTable` dérivée ou un registre de manifestes explicite dans la chaîne d’appels.
La validation de configuration, l’activation automatique au démarrage, le bootstrap des plugins et la sélection de fournisseurs
peuvent réutiliser ces objets tant qu’ils représentent la configuration actuelle et
l’inventaire des plugins. La recherche de configuration reconstruit toujours les métadonnées de manifeste à la demande,
sauf si le chemin de configuration spécifique reçoit un registre de manifestes explicite ; gardez cela
comme repli de chemin froid plutôt que d’ajouter des caches de recherche cachés. Lorsque l’entrée
change, reconstruisez et remplacez l’instantané au lieu de le modifier ou de conserver
des copies historiques.
Les vues sur le registre de plugins actif et les helpers de bootstrap des canaux groupés
doivent être recalculés à partir du registre/de la racine actuels. Les maps de courte durée conviennent
dans un appel unique pour dédupliquer le travail ou protéger la réentrée ; elles ne doivent pas devenir des caches
de métadonnées de processus.

Pour le chargement des plugins, la couche de cache persistante est le chargement d’exécution. Elle peut réutiliser
l’état du chargeur lorsque du code ou des artefacts installés sont réellement chargés, comme :

- `PluginLoaderCacheState` et les registres d’exécution actifs compatibles
- les caches jiti/module et les caches de chargeur de surface publique utilisés pour éviter d’importer
  plusieurs fois la même surface d’exécution
- les caches de système de fichiers pour les artefacts de plugins installés
- les maps de courte durée par appel pour la normalisation des chemins ou la résolution des doublons

Ces caches sont des détails d’implémentation du plan de données. Ils ne doivent pas répondre aux
questions du plan de contrôle comme « quel plugin possède ce fournisseur ? », sauf si
l’appelant a délibérément demandé le chargement d’exécution.

N’ajoutez pas de caches persistants ou temporels pour :

- les résultats de découverte
- les registres directs de manifestes
- les registres de manifestes reconstruits à partir de l’index des plugins installés
- la recherche de propriétaire de fournisseur, la suppression de modèle, la politique de fournisseur ou les métadonnées
  d’artefacts publics
- toute autre réponse dérivée du manifeste lorsqu’un manifeste modifié, un index installé
  ou un chemin de chargement doit être visible à la lecture de métadonnées suivante

Les appelants qui reconstruisent les métadonnées de manifeste à partir de l’index persistant des plugins installés
reconstruisent ce registre à la demande. L’index installé est un état durable
du plan source ; ce n’est pas un cache de métadonnées caché en processus.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globals aléatoires du cœur. Ils s’enregistrent dans un
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
- les services d’arrière-plan
- les commandes possédées par des plugins

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de communiquer directement avec les modules de plugins.
Cela garde le chargement unidirectionnel :

- module de plugin -> enregistrement dans le registre
- exécution du cœur -> consommation du registre

Cette séparation compte pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n’ont besoin que
d’un seul point d’intégration : « lire le registre », et non « gérer chaque module de plugin comme un cas particulier ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après l’approbation
ou le refus d’une demande de liaison :

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
- `request` : le résumé de la demande d’origine, l’indice de détachement, l’id de l’expéditeur et les
  métadonnées de conversation

Ce callback est uniquement une notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation par le cœur.

## Hooks d’exécution des fournisseurs

Les plugins de fournisseurs comportent trois couches :

- **Métadonnées de manifeste** pour une recherche peu coûteuse avant l’exécution :
  `setup.providers[].envVars`, compatibilité dépréciée `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (`discovery` hérité) plus
  `applyConfigDefaults`.
- **Hooks d’exécution** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution de modèles,
  l’enveloppement de flux, les niveaux de réflexion, la politique de relecture et les endpoints d’utilisation. Voir
  la liste complète sous [Ordre et utilisation des hooks](#hook-order-and-usage).

OpenClaw possède toujours la boucle générique de l’agent, le basculement, la gestion des transcriptions et
la politique d’outils. Ces hooks sont la surface d’extension pour le comportement propre aux fournisseurs
sans nécessiter un transport d’inférence entièrement personnalisé.

Utilisez `setup.providers[].envVars` du manifeste lorsque le fournisseur dispose d’identifiants basés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans
charger l’exécution du plugin. Le champ déprécié `providerAuthEnvVars` est toujours lu par
l’adaptateur de compatibilité pendant la fenêtre de dépréciation, et les plugins non groupés
qui l’utilisent reçoivent un diagnostic de manifeste. Utilisez `providerAuthAliases` du manifeste
lorsqu’un id de fournisseur doit réutiliser les variables d’environnement, profils d’authentification,
authentification adossée à la configuration et choix d’onboarding par clé API d’un autre id de fournisseur. Utilisez le manifeste
`providerAuthChoices` lorsque les surfaces CLI d’onboarding/de choix d’authentification doivent connaître
l’id de choix du fournisseur, les libellés de groupe et le câblage d’authentification simple à un seul flag sans
charger l’exécution du fournisseur. Conservez les
`envVars` d’exécution du fournisseur pour les indices destinés aux opérateurs, comme les libellés d’onboarding ou les variables de configuration
client-id/client-secret OAuth.

Utilisez `channelEnvVars` du manifeste lorsqu’un canal a une authentification ou une configuration pilotée par l’environnement que
le repli générique d’environnement shell, les vérifications de configuration/statut ou les invites de configuration doivent voir
sans charger l’exécution du canal.

### Ordre et utilisation des hooks

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.
Les champs de fournisseur uniquement compatibles qu’OpenClaw n’appelle plus, comme
`ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont volontairement pas
listés ici.

| #   | Crochet                           | Ce qu'il fait                                                                                                             | Quand l'utiliser                                                                                                                                     |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`                     | Le fournisseur possède un catalogue ou des valeurs par défaut d'URL de base                                                                          |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut de configuration globale détenues par le fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d'authentification, de l'environnement ou de la sémantique de famille de modèles du fournisseur             |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d'abord le chemin normal registre/catalogue                                                               | _(pas un crochet de Plugin)_                                                                                                                        |
| 3   | `normalizeModelId`                | Normalise les alias d'identifiants de modèle hérités ou en aperçu avant la recherche                                     | Le fournisseur gère le nettoyage des alias avant la résolution du modèle canonique                                                                   |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille de fournisseurs avant l'assemblage générique du modèle                         | Le fournisseur gère le nettoyage du transport pour les identifiants de fournisseur personnalisés dans la même famille de transport                    |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution d'exécution/du fournisseur                                         | Le fournisseur a besoin d'un nettoyage de configuration qui doit vivre avec le Plugin; les assistants groupés de la famille Google prennent aussi en charge les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique aux fournisseurs de configuration les réécritures de compatibilité d'utilisation du streaming natif             | Le fournisseur a besoin de correctifs de métadonnées d'utilisation du streaming natif pilotés par l'endpoint                                         |
| 7   | `resolveConfigApiKey`             | Résout l'authentification par marqueur d'environnement pour les fournisseurs de configuration avant le chargement de l'authentification d'exécution | Le fournisseur dispose d'une résolution de clé d'API par marqueur d'environnement détenue par le fournisseur; `amazon-bedrock` possède aussi ici un résolveur intégré de marqueur d'environnement AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/auto-hébergée ou adossée à la configuration sans persister le texte en clair          | Le fournisseur peut fonctionner avec un marqueur d'identifiant synthétique/local                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Superpose les profils d'authentification externes détenus par le fournisseur; la valeur par défaut de `persistence` est `runtime-only` pour les identifiants détenus par la CLI/l'application | Le fournisseur réutilise des identifiants d'authentification externes sans persister les jetons d'actualisation copiés; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse les espaces réservés de profils synthétiques stockés derrière l'authentification adossée à l'environnement/la configuration | Le fournisseur stocke des profils d'espaces réservés synthétiques qui ne doivent pas l'emporter en priorité                                          |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les identifiants de modèle détenus par le fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des identifiants de modèle amont arbitraires                                                                                  |
| 12  | `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s'exécute à nouveau                                                  | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                            |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le lanceur intégré utilise le modèle résolu                                                 | Le fournisseur a besoin de réécritures de transport tout en utilisant encore un transport cœur                                                       |
| 14  | `contributeResolvedModelCompat`   | Contribue des indicateurs de compatibilité pour les modèles de fournisseurs derrière un autre transport compatible       | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                                        |
| 15  | `normalizeToolSchemas`            | Normalise les schémas d'outils avant que le lanceur intégré les voie                                                    | Le fournisseur a besoin d'un nettoyage de schéma propre à la famille de transport                                                                    |
| 16  | `inspectToolSchemas`              | Expose les diagnostics de schéma détenus par le fournisseur après normalisation                                          | Le fournisseur veut des avertissements de mots-clés sans enseigner au cœur des règles propres au fournisseur                                         |
| 17  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                        | Le fournisseur a besoin d'une sortie de raisonnement/finale balisée plutôt que de champs natifs                                                     |
| 18  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les enveloppes génériques d'options de flux                                | Le fournisseur a besoin de paramètres de requête par défaut ou d'un nettoyage de paramètres par fournisseur                                          |
| 19  | `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                             | Le fournisseur a besoin d'un protocole filaire personnalisé, pas seulement d'une enveloppe                                                           |
| 20  | `wrapStreamFn`                    | Enveloppe de flux après l'application des enveloppes génériques                                                         | Le fournisseur a besoin d'enveloppes de compatibilité pour les en-têtes/le corps/le modèle de requête sans transport personnalisé                    |
| 21  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées de transport natifs par tour                                                        | Le fournisseur veut que les transports génériques envoient l'identité de tour native du fournisseur                                                  |
| 22  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                                     | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                       |
| 23  | `formatApiKey`                    | Formateur de profil d'authentification : le profil stocké devient la chaîne `apiKey` d'exécution                        | Le fournisseur stocke des métadonnées d'authentification supplémentaires et a besoin d'une forme de jeton d'exécution personnalisée                  |
| 24  | `refreshOAuth`                    | Remplacement de l'actualisation OAuth pour les endpoints d'actualisation personnalisés ou la politique d'échec d'actualisation | Le fournisseur ne correspond pas aux actualiseurs `pi-ai` partagés                                                                                   |
| 25  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque l'actualisation OAuth échoue                                                        | Le fournisseur a besoin de conseils de réparation d'authentification détenus par le fournisseur après un échec d'actualisation                      |
| 26  | `matchesContextOverflowError`     | Correspondance d'un dépassement de fenêtre de contexte détenue par le fournisseur                                       | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                      |
| 27  | `classifyFailoverReason`          | Classification des raisons de basculement détenue par le fournisseur                                                    | Le fournisseur peut mapper les erreurs brutes d'API/de transport vers limitation de débit/surcharge/etc.                                            |
| 28  | `isCacheTtlEligible`              | Politique de cache de prompt pour les fournisseurs proxy/backhaul                                                       | Le fournisseur a besoin d'un filtrage TTL de cache propre au proxy                                                                                   |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d'authentification manquante                                          | Le fournisseur a besoin d'un indice de récupération d'authentification manquante propre au fournisseur                                              |
| 30  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                                   | Le fournisseur a besoin de lignes synthétiques de compatibilité ascendante dans `models list` et les sélecteurs                                     |
| 31  | `resolveThinkingProfile`          | Ensemble de niveaux `/think` propre au modèle, libellés d'affichage et valeur par défaut                                | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                            |
| 32  | `isBinaryThinking`                | Crochet de compatibilité de bascule marche/arrêt du raisonnement                                                       | Le fournisseur expose uniquement la réflexion binaire activée/désactivée                                                                            |
| 33  | `supportsXHighThinking`           | Crochet de compatibilité de prise en charge du raisonnement `xhigh`                                                    | Le fournisseur veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                               |
| 34  | `resolveDefaultThinkingLevel`     | Crochet de compatibilité du niveau `/think` par défaut                                                                  | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                                 |
| 35  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profil live et la sélection de smoke                               | Le fournisseur possède la correspondance de modèle préféré live/smoke                                                                               |
| 36  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le jeton/la clé d'exécution réel juste avant l'inférence                        | Le fournisseur a besoin d'un échange de jeton ou d'un identifiant de requête à courte durée de vie                                                  |
| 37  | `resolveUsageAuth`                | Résoudre les identifiants d’utilisation/de facturation pour `/usage` et les surfaces de statut associées                                     | Le fournisseur a besoin d’une analyse personnalisée des jetons d’utilisation/de quota ou d’un identifiant d’utilisation différent                                                               |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser les instantanés d’utilisation/de quota propres au fournisseur après la résolution de l’authentification                             | Le fournisseur a besoin d’un point de terminaison d’utilisation propre au fournisseur ou d’un analyseur de charge utile                                                                           |
| 39  | `createEmbeddingProvider`         | Construire un adaptateur d’embedding détenu par le fournisseur pour la mémoire/recherche                                                     | Le comportement d’embedding de la mémoire appartient au Plugin fournisseur                                                                                    |
| 40  | `buildReplayPolicy`               | Retourner une politique de rejeu contrôlant la gestion des transcriptions pour le fournisseur                                        | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, la suppression des blocs de réflexion)                                                               |
| 41  | `sanitizeReplayHistory`           | Réécrire l’historique de rejeu après le nettoyage générique des transcriptions                                                        | Le fournisseur a besoin de réécritures de rejeu propres au fournisseur au-delà des fonctions d’aide à la Compaction partagées                                                             |
| 42  | `validateReplayTurns`             | Effectuer la validation finale des tours de rejeu ou leur remodelage avant le runner intégré                                           | Le transport du fournisseur nécessite une validation des tours plus stricte après l’assainissement générique                                                                    |
| 43  | `onModelSelected`                 | Exécuter les effets secondaires après sélection détenus par le fournisseur                                                                 | Le fournisseur a besoin de télémétrie ou d’un état détenu par le fournisseur lorsqu’un modèle devient actif                                                                  |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin fournisseur correspondant, puis parcourent les autres plugins fournisseurs
compatibles avec les hooks jusqu’à ce que l’un modifie réellement l’identifiant
du modèle ou le transport/la configuration. Cela permet de garder les shims de
fournisseur alias/compat fonctionnels sans obliger l’appelant à savoir quel
plugin groupé possède la réécriture. Si aucun hook fournisseur ne réécrit une
entrée de configuration de la famille Google prise en charge, le normaliseur de
configuration Google groupé applique tout de même ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou
d’un exécuteur de requêtes personnalisé, il s’agit d’une autre classe
d’extension. Ces hooks sont destinés au comportement de fournisseur qui s’exécute
toujours dans la boucle d’inférence normale d’OpenClaw.

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

Les plugins fournisseurs groupés combinent les hooks ci-dessus pour s’adapter au
catalogue, à l’authentification, au raisonnement, à la relecture et aux besoins
d’utilisation de chaque fournisseur. L’ensemble de hooks faisant autorité réside
avec chaque plugin sous `extensions/`; cette page illustre les formes plutôt que
de répliquer la liste.

<AccordionGroup>
  <Accordion title="Fournisseurs de catalogue en transmission directe">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les
    identifiants de modèles amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="Fournisseurs OAuth et de point de terminaison d’utilisation">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour gérer l’échange de jetons et l’intégration
    `/usage`.
  </Accordion>
  <Accordion title="Familles de relecture et de nettoyage de transcription">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs
    d’opter pour une politique de transcription via `buildReplayPolicy` au lieu
    de demander à chaque plugin de réimplémenter le nettoyage.
  </Accordion>
  <Accordion title="Fournisseurs de catalogue uniquement">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent seulement `catalog` et s’appuient sur la boucle
    d’inférence partagée.
  </Accordion>
  <Accordion title="Assistants de flux propres à Anthropic">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` résident dans la
    jonction publique `api.ts` / `contract-api.ts` du plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Assistants d’exécution

Les plugins peuvent accéder à certains assistants cœur via `api.runtime`. Pour le TTS :

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

Notes :

- `textToSpeech` renvoie la charge utile de sortie TTS cœur normale pour les surfaces de fichier/note vocale.
- Utilise la configuration cœur `messages.tts` et la sélection du fournisseur.
- Renvoie un tampon audio PCM + la fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif par fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches, comme la locale, le genre et les étiquettes de personnalité pour les sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent actuellement en charge la téléphonie. Microsoft non.

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

Notes :

- Gardez la politique TTS, le fallback et la livraison des réponses dans le cœur.
- Utilisez les fournisseurs de parole pour le comportement de synthèse propre au fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un plugin fournisseur peut posséder les fournisseurs de texte, de parole, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces contrats de capacité.

Pour la compréhension d’image/audio/vidéo, les plugins enregistrent un fournisseur
typé de compréhension des médias plutôt qu’un sac clé/valeur générique :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notes :

- Gardez l’orchestration, le fallback, la configuration et le câblage des canaux dans le cœur.
- Gardez le comportement fournisseur dans le plugin fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant d’exécution
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants d’exécution de compréhension des médias, les plugins peuvent appeler :

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

Pour la transcription audio, les plugins peuvent utiliser soit l’exécution de
compréhension des médias, soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notes :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias cœur (`tools.media.audio`) et l’ordre de fallback des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple une entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notes :

- `provider` et `model` sont des substitutions facultatives par exécution, pas des changements persistants de session.
- OpenClaw n’honore ces champs de substitution que pour les appelants de confiance.
- Pour les exécutions de fallback appartenant au plugin, les opérateurs doivent s’inscrire avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques `provider/model` précises, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de substitution sont rejetées au lieu de revenir silencieusement au fallback.
- Les sessions de sous-agent créées par un plugin sont étiquetées avec l’identifiant du plugin créateur. Le fallback `api.runtime.subagent.deleteSession(...)` peut uniquement supprimer ces sessions possédées ; la suppression arbitraire de session nécessite toujours une requête Gateway à portée administrateur.

Pour la recherche web, les plugins peuvent consommer l’assistant d’exécution partagé
au lieu d’accéder au câblage de l’outil agent :

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

Notes :

- Gardez la sélection des fournisseurs, la résolution des identifiants et la sémantique de requête partagée dans le cœur.
- Utilisez les fournisseurs de recherche web pour les transports de recherche propres au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil agent.

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

- `generate(...)` : générer une image à l’aide de la chaîne de fournisseurs de génération d’images configurée.
- `listProviders(...)` : lister les fournisseurs de génération d’images disponibles et leurs capacités.

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

Champs de route :

- `path` : chemin de route sous le serveur HTTP gateway.
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification gateway normale, ou `"plugin"` pour l’authentification/vérification de webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoyer `true` lorsque la route a traité la requête.

Notes :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes de Plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf avec `replaceExisting: true`, et un Plugin ne peut pas remplacer la route d’un autre Plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Conservez les chaînes de bascule `exact`/`prefix` uniquement au même niveau d’authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d’exécution opérateur. Elles sont destinées aux webhooks gérés par le Plugin et à la vérification de signature, pas aux appels d’assistance privilégiés du Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée d’exécution de requête Gateway, mais cette portée est volontairement prudente :
  - l’authentification bearer à secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées d’exécution des routes de Plugin limitées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP porteurs d’identité de confiance (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) honorent `x-openclaw-scopes` uniquement lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de routes de Plugin porteuses d’identité, la portée d’exécution revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de Plugin avec authentification Gateway est une surface d’administration implicite. Si votre route nécessite un comportement réservé à l’administration, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK Plugin

Utilisez des sous-chemins SDK précis au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                         | Objectif                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Assistants d’entrée/de construction de canal       |
| `openclaw/plugin-sdk/core`          | Assistants partagés génériques et contrat global   |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent parmi une famille de coutures étroites : `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
sur un seul contrat `approvalCapability` plutôt que de mélanger des champs
de Plugin sans rapport. Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les assistants d’exécution et de configuration se trouvent sous des sous-chemins ciblés
`*-runtime` correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au barrel de compatibilité large `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
et `openclaw/plugin-sdk/infra-runtime` sont des shims de compatibilité obsolètes pour
les anciens plugins. Le nouveau code doit importer des primitives génériques plus précises à la place.
</Info>

Points d’entrée internes au dépôt (par racine de paquet de Plugin groupé) :

- `index.js` — entrée de Plugin groupé
- `api.js` — barrel d’assistants/de types
- `runtime-api.js` — barrel réservé à l’exécution
- `setup-entry.js` — entrée de Plugin de configuration

Les plugins externes doivent uniquement importer les sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` d’un autre paquet de Plugin depuis le cœur ou depuis un autre Plugin.
Les points d’entrée chargés par façade préfèrent l’instantané de configuration d’exécution actif lorsqu’il
existe, puis reviennent au fichier de configuration résolu sur le disque.

Les sous-chemins propres à une capacité, tels que `image-generation`, `media-understanding`,
et `speech`, existent parce que les plugins groupés les utilisent aujourd’hui. Ce ne sont pas
automatiquement des contrats externes figés à long terme : consultez la page de référence SDK
pertinente lorsque vous vous appuyez sur eux.

## Schémas des outils de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` propres au canal
pour les primitives hors message telles que les réactions, les lectures et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs du fournisseur pour les boutons, composants, blocs ou cartes.
Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, le mapping fournisseur et la checklist d’auteur de Plugin.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent rendre via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide de rendre la présentation nativement ou de la dégrader en texte.
N’exposez pas d’échappatoires d’interface utilisateur natives du fournisseur depuis l’outil de message générique.
Les assistants SDK obsolètes pour les schémas natifs hérités restent exportés pour les
plugins tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles propre au canal. Gardez l’hôte sortant
partagé générique et utilisez la surface de l’adaptateur de messagerie pour les règles fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du Plugin lorsque
  le cœur a besoin d’une résolution finale appartenant au fournisseur après normalisation ou après un
  échec de recherche dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session
  propre au fournisseur une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` comme repli de normalisation propre au fournisseur, pas pour
  une recherche large dans l’annuaire.
- Gardez les identifiants natifs du fournisseur comme les identifiants de chat, identifiants de fil, JID, handles et identifiants de salle
  dans les valeurs `target` ou dans des paramètres propres au fournisseur, pas dans les champs SDK
  génériques.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire depuis la configuration doivent conserver cette logique dans le
Plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration, tels que :

- pairs DM pilotés par liste d’autorisation
- mappings de canaux/groupes configurés
- replis d’annuaire statiques limités au compte

Les assistants partagés dans `directory-runtime` ne gèrent que les opérations génériques :

- filtrage de requête
- application de limite
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte propre au canal et la normalisation des identifiants doivent rester dans
l’implémentation du Plugin.

## Catalogues de fournisseurs

Les plugins de fournisseur peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le Plugin possède des identifiants de modèle propres au fournisseur, des valeurs par défaut
d’URL de base ou des métadonnées de modèle soumises à authentification.

`catalog.order` contrôle quand le catalogue d’un Plugin fusionne par rapport aux fournisseurs implicites
intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs gagnent lors d’une collision de clé, les plugins peuvent donc remplacer volontairement
une entrée de fournisseur intégrée avec le même identifiant de fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre Plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il est autorisé à supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, ainsi que les flux de réparation doctor/config,
  ne doivent pas avoir besoin de matérialiser les identifiants d’exécution simplement pour
  décrire la configuration.

Comportement `inspectAccount(...)` recommandé :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/statut des identifiants lorsque c’est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes de jeton simplement pour signaler une
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source
  correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule d’indiquer « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou de déclarer à tort que le compte n’est pas configuré.

## Packs de paquets

Un répertoire de Plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un Plugin. Si le pack liste plusieurs extensions, l’identifiant du Plugin
devient `name/<fileBase>`.

Si votre Plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du Plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du paquet sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances du Plugin avec un
`npm install --omit=dev --ignore-scripts` local au projet (aucun script de cycle de vie,
aucune dépendance de développement à l’exécution), en ignorant les paramètres npm globaux hérités.
Gardez les arbres de dépendances de Plugin « JS/TS purs » et évitez les paquets qui nécessitent
des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsque OpenClaw a besoin de surfaces de configuration pour un Plugin de canal désactivé, ou
lorsqu’un Plugin de canal est activé mais pas encore configuré, il charge `setupEntry`
au lieu de l’entrée complète du Plugin. Cela allège le démarrage et la configuration
lorsque l’entrée principale de votre Plugin câble aussi des outils, hooks ou autre code
réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un Plugin de canal pour le même chemin `setupEntry` pendant la phase
de démarrage pré-écoute du Gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le Gateway commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, telles que :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que le Gateway commence à écouter
- toute méthode, tout outil ou tout service Gateway qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le Plugin sur le comportement par défaut et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux groupés peuvent également publier des assistants de surface de contrat réservés à la configuration que le cœur
peut consulter avant que l’exécution complète du canal soit chargée. La surface de promotion de configuration actuelle est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration de canal
héritée à compte unique vers `channels.<id>.accounts.*` sans charger l’entrée
complète du plugin. Matrix est l’exemple groupé actuel : il ne déplace que les
clés d’authentification/d’amorçage vers un compte promu nommé lorsque des comptes
nommés existent déjà, et il peut préserver une clé de compte par défaut configurée
non canonique au lieu de toujours créer `accounts.default`.

Ces adaptateurs de correctifs de configuration gardent paresseuse la découverte
de surface de contrat groupée. Le temps d’importation reste léger ; la surface de
promotion n’est chargée qu’à la première utilisation au lieu de relancer le
démarrage du canal groupé lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, gardez-les
sur un préfixe propre au plugin. Les espaces de noms d’administration du cœur
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se
résolvent toujours vers `operator.admin`, même si un plugin demande une portée
plus étroite.

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

### Métadonnées du catalogue des canaux

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte
via `openclaw.channel` et des indications d’installation via `openclaw.install`.
Cela garde le catalogue du cœur sans données.

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
- `preferOver` : identifiants de plugins/canaux de priorité inférieure que cette entrée de catalogue doit devancer
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie de la surface de sélection
- `markdownCapable` : marque le canal comme compatible avec Markdown pour les décisions de formatage sortant
- `exposure.configured` : masquer le canal dans les surfaces de liste des canaux configurés lorsque défini sur `false`
- `exposure.setup` : masquer le canal dans les sélecteurs interactifs de configuration lorsque défini sur `false`
- `exposure.docs` : marquer le canal comme interne/privé pour les surfaces de navigation de la documentation
- `showConfigured` / `showInSetup` : alias hérités encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : inscrire le canal dans le flux standard de démarrage rapide `allowFrom`
- `forceAccountBinding` : exiger une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préférer la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut également fusionner des **catalogues de canaux externes** (par
exemple, une exportation de registre MPM). Déposez un fichier JSON à l’un de ces
emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou
`OPENCLAW_MPM_CATALOG_PATHS`) vers un ou plusieurs fichiers JSON (délimités par
virgules/points-virgules/`PATH`). Chaque fichier doit contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités pour la clé `"entries"`.

Les entrées générées du catalogue de canaux et les entrées du catalogue
d’installation des fournisseurs exposent des faits de source d’installation
normalisés à côté du bloc brut `openclaw.install`. Les faits normalisés indiquent
si la spécification npm est une version exacte ou un sélecteur flottant, si les
métadonnées d’intégrité attendues sont présentes, et si un chemin de source local
est également disponible. Lorsque l’identité du catalogue/paquet est connue, les
faits normalisés avertissent si le nom du paquet npm analysé diverge de cette
identité. Ils avertissent également lorsque `defaultChoice` est invalide ou pointe
vers une source indisponible, et lorsque des métadonnées d’intégrité npm sont
présentes sans source npm valide. Les consommateurs doivent traiter
`installSource` comme un champ facultatif additif afin que les entrées créées à la
main et les adaptateurs de catalogue n’aient pas à le synthétiser.
Cela permet à l’intégration et aux diagnostics d’expliquer l’état du plan des
sources sans importer l’exécution du plugin.

Les entrées npm externes officielles doivent privilégier un `npmSpec` exact avec
`expectedIntegrity`. Les noms de paquet nus et les dist-tags fonctionnent encore
pour la compatibilité, mais ils affichent des avertissements du plan des sources
afin que le catalogue puisse évoluer vers des installations épinglées et vérifiées
par intégrité sans casser les plugins existants. Lorsque l’intégration installe
depuis un chemin de catalogue local, elle enregistre une entrée d’index de plugin
géré avec `source: "path"` et un `sourcePath` relatif à l’espace de travail
lorsque c’est possible. Le chemin de chargement opérationnel absolu reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les
chemins de postes de travail locaux dans la configuration durable. Cela garde les
installations de développement local visibles pour les diagnostics du plan des
sources sans ajouter une deuxième surface brute de divulgation de chemin de
système de fichiers. L’index de plugins persistant `plugins/installs.json` est la
source de vérité d’installation et peut être actualisé sans charger les modules
d’exécution des plugins. Sa carte `installRecords` est durable même lorsqu’un
manifeste de plugin est manquant ou invalide ; son tableau `plugins` est une vue
de manifeste reconstructible.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de
session pour l’ingestion, l’assemblage et la Compaction. Enregistrez-les depuis
votre plugin avec `api.registerContextEngine(id, factory)`, puis sélectionnez le
moteur actif avec `plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin doit remplacer ou étendre le pipeline de
contexte par défaut plutôt que simplement ajouter une recherche de mémoire ou des
hooks.

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

La fabrique `ctx` expose les valeurs facultatives `config`, `agentDir` et
`workspaceDir` pour l’initialisation au moment de la construction.

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

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API
actuelle, ne contournez pas le système de plugins avec un accès privé interne.
Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, repli,
   fusion de configuration, cycle de vie, sémantique côté canal et forme des
   helpers d’exécution.
2. ajouter des surfaces typées d’enregistrement/d’exécution de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface de
   capacité typée utile.
3. câbler le cœur + les consommateurs de canal/fonctionnalité
   Les canaux et les plugins de fonctionnalité doivent consommer la nouvelle
   capacité via le cœur, pas en important directement une implémentation de
   fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseur enregistrent ensuite leurs backends auprès de la
   capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent
   explicites au fil du temps.

C’est ainsi qu’OpenClaw reste affirmé sans devenir codé en dur selon la vision du
monde d’un seul fournisseur. Voir le [Livre de recettes des capacités](/fr/plugins/architecture)
pour une liste de contrôle de fichiers concrète et un exemple détaillé.

### Liste de contrôle des capacités

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement
toucher ces surfaces ensemble :

- types de contrat du cœur dans `src/<capability>/types.ts`
- helper d’exécution/runner du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API de plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition de l’exécution de plugin dans `src/plugins/runtime/*` lorsque les
  plugins de fonctionnalité/canal doivent la consommer
- helpers de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité
n’est pas encore entièrement intégrée.

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

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseur possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les helpers d’exécution
- les tests de contrat gardent la propriété explicite

## Connexe

- [Architecture des plugins](/fr/plugins/architecture) — modèle et formes publics des capacités
- [Sous-chemins du SDK de plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
