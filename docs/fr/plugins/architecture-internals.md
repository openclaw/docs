---
read_when:
    - Implémentation des hooks d’exécution des fournisseurs, du cycle de vie des canaux ou des packs de paquets
    - Débogage de l’ordre de chargement des plugins ou de l’état du registre
    - Ajout d’une nouvelle capacité de Plugin ou d’un Plugin de moteur de contexte
summary: 'Fonctionnement interne de l’architecture des Plugins : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: Fonctionnement interne de l’architecture des Plugins
x-i18n:
    generated_at: "2026-07-12T15:38:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle public de fonctionnalités, les formes de plugins et les contrats
de propriété/d’exécution, consultez [Architecture des plugins](/fr/plugins/architecture). Cette page couvre
les mécanismes internes : pipeline de chargement, registre, hooks d’exécution, routes HTTP du
Gateway, chemins d’importation et tables de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw effectue approximativement les opérations suivantes :

1. découvrir les racines de plugins candidates
2. lire les manifestes de bundles natifs ou compatibles ainsi que les métadonnées des paquets
3. rejeter les candidats non sûrs
4. normaliser la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. déterminer l’activation de chaque candidat
6. charger les modules natifs activés : les modules intégrés compilés utilisent un chargeur natif ;
   le code source TypeScript local tiers utilise le mécanisme de secours d’urgence Jiti
7. appeler les hooks natifs `register(api)` et recueillir les enregistrements dans le registre des plugins
8. exposer le registre aux commandes et aux surfaces d’exécution

<Note>
`activate` est un alias historique de `register` — le chargeur utilise celui qui est présent (`def.register ?? def.activate`) et l’appelle au même stade. Tous les plugins intégrés utilisent `register` ; privilégiez `register` pour les nouveaux plugins.
</Note>

Les contrôles de sécurité s’exécutent **avant** l’exécution. La découverte bloque un candidat
lorsque :

- son point d’entrée résolu sort de la racine du plugin
- son chemin (ou son répertoire racine) est accessible en écriture à tous
- pour les plugins non intégrés, le propriétaire du chemin ne correspond pas à l’uid actuel (ou à root)

Pour les répertoires intégrés accessibles en écriture à tous, une tentative de correction
`chmod` sur place est d’abord effectuée (les installations npm/globales peuvent fournir des répertoires de paquets avec les droits `0777`) avant que le contrôle
ne soit réexécuté ; les vérifications de propriété sont entièrement ignorées pour l’origine intégrée.

Les candidats bloqués conservent l’identifiant de leur plugin dans le diagnostic émis lorsqu’il
est connu (y compris les identifiants déterminés à partir d’un manifeste situé dans un répertoire
par ailleurs rejeté). Ainsi, une configuration faisant référence à cet identifiant voit un plugin
bloqué associé à un avertissement de sécurité du chemin, plutôt qu’une erreur sans rapport
« plugin inconnu ».

### Comportement privilégiant le manifeste

Le manifeste constitue la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills déclarés, le schéma de configuration ou les capacités de l’ensemble
- valider `plugins.entries.<id>.config`
- enrichir les libellés/espaces réservés de l’interface de contrôle
- afficher les métadonnées d’installation/de catalogue
- conserver des descripteurs légers d’activation et de configuration sans charger l’environnement d’exécution du plugin

Pour les plugins natifs, le module d’exécution constitue la partie du plan de données. Il enregistre
le comportement réel, notamment les hooks, les outils, les commandes ou les flux de fournisseurs.

Les blocs facultatifs `activation` et `setup` du manifeste restent sur le plan de contrôle.
Ce sont uniquement des descripteurs de métadonnées destinés à la planification de l’activation et à la découverte de la configuration ;
ils ne remplacent pas l’enregistrement à l’exécution, `register(...)` ni `setupEntry`.
Les consommateurs d’activation en direct utilisent les indications de commande, de canal et de fournisseur du manifeste pour
restreindre le chargement des plugins avant une matérialisation plus large du registre :

- le chargement par la CLI se limite aux plugins qui possèdent la commande principale demandée
- la résolution de la configuration du canal/du plugin se limite aux plugins qui possèdent l’identifiant
  de canal demandé
- la résolution explicite de la configuration/de l’exécution du fournisseur se limite aux plugins qui possèdent l’identifiant
  de fournisseur demandé
- la planification du démarrage du Gateway utilise `activation.onStartup` pour les importations explicites au démarrage ;
  les plugins dépourvus de métadonnées de démarrage ne se chargent que par l’intermédiaire de déclencheurs
  d’activation plus précis

Le planificateur d’activation expose à la fois une API ne renvoyant que les identifiants pour les appelants existants et une
API de planification pour les diagnostics. Les entrées du plan indiquent pourquoi un plugin a été sélectionné,
en distinguant les indications explicites `activation.*` du mécanisme de secours fondé sur la propriété déclarée dans le manifeste :

| Motif (issu des indications `activation.*`) | Motif (issu de la propriété déclarée dans le manifeste)                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`             | —                                                                                            |
| `activation-capability-hint`                | —                                                                                            |
| `activation-channel-hint`                   | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`                   | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`                  | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`                     | —                                                                                            |
| — (le déclencheur de hook n’a pas de variante d’indication) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Cette distinction entre les motifs constitue la limite de compatibilité : les métadonnées de plugin existantes
continuent de fonctionner, tandis que le nouveau code peut détecter les indications générales ou le comportement
de secours sans modifier la sémantique du chargement à l’exécution.

Les préchargements à l’exécution effectués lors d’une requête qui demandent la portée générale `all` continuent de dériver
un ensemble explicite d’identifiants de plugins effectifs à partir de la configuration, de la planification du démarrage, des canaux
configurés, des emplacements et des règles d’activation automatique
(`resolveEffectivePluginIds` dans `src/plugins/effective-plugin-ids.ts`). Si cet
ensemble dérivé est vide, OpenClaw conserve une portée vide au lieu de l’élargir à
tous les plugins détectables.

La découverte de la configuration privilégie les identifiants appartenant aux descripteurs, tels que `setup.providers` et
`setup.cliBackends`, afin de restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui nécessitent encore des hooks d’exécution lors de la configuration. Les listes de configuration
des fournisseurs utilisent les `providerAuthChoices` du manifeste, les choix de configuration dérivés des descripteurs
et les métadonnées du catalogue d’installation sans charger l’environnement d’exécution du fournisseur. La valeur explicite
`setup.requiresRuntime: false` impose une limite réservée aux descripteurs ; l’omission de
`requiresRuntime` conserve le mécanisme de secours historique de setup-api pour assurer la compatibilité. Si
plusieurs plugins découverts revendiquent le même identifiant normalisé de fournisseur de configuration ou
de moteur CLI, la recherche de configuration refuse ce propriétaire ambigu au lieu de s’appuyer sur
l’ordre de découverte. Lorsque l’exécution de la configuration a bien lieu, les diagnostics du registre signalent
les divergences entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou moteurs CLI
effectivement enregistrés par setup-api, sans bloquer les plugins historiques.

### Limite du cache des plugins

OpenClaw ne met pas en cache les résultats de découverte des plugins ni les données directes du registre des manifestes
derrière des fenêtres temporelles. Les installations, les modifications de manifestes et les changements de chemins de chargement
doivent devenir visibles lors de la lecture explicite suivante des métadonnées ou de la reconstruction suivante de l’instantané.
L’analyseur de fichiers manifeste conserve un cache borné des signatures de fichiers, indexé par le
chemin du manifeste ouvert ainsi que par le périphérique/inode, la taille et les dates mtime/ctime ; ce cache sert uniquement
à éviter une nouvelle analyse des octets inchangés et ne doit pas mettre en cache les réponses relatives à la découverte, au registre,
au propriétaire ou aux politiques.

Le chemin rapide sûr pour les métadonnées repose sur une propriété explicite des objets, et non sur un cache masqué.
Les chemins critiques au démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` actuel, la
`PluginLookUpTable` dérivée ou un registre de manifestes explicite tout au long de la chaîne
d’appels. La validation de la configuration, l’activation automatique au démarrage, l’amorçage des plugins et la sélection des fournisseurs
peuvent réutiliser ces objets tant qu’ils représentent la configuration et
l’inventaire des plugins actuels. La recherche lors de la configuration continue de reconstruire les métadonnées des manifestes à la demande,
sauf si le chemin de configuration concerné reçoit un registre de manifestes explicite ; conservez
ce comportement comme solution de repli pour les chemins peu sollicités plutôt que d’ajouter des caches de recherche masqués. Lorsque
l’entrée change, reconstruisez et remplacez l’instantané au lieu de le modifier ou
de conserver des copies historiques. Les vues sur le registre actif des plugins et les
assistants d’amorçage des canaux intégrés doivent être recalculés à partir du
registre ou de la racine actuels. Les tables de correspondance à courte durée de vie sont acceptables au sein d’un même appel pour dédupliquer le travail ou
empêcher la réentrée ; elles ne doivent pas devenir des caches de métadonnées du processus.

Pour le chargement des plugins, la couche de cache persistante correspond au chargement à l’exécution. Elle peut réutiliser
l’état du chargeur lorsque du code ou des artefacts installés sont effectivement chargés, par exemple :

- `PluginLoaderCacheState` et les registres d’exécution actifs compatibles
- les caches jiti/de modules et les caches du chargeur de surface publique utilisés pour éviter d’importer
  plusieurs fois la même surface d’exécution
- les caches du système de fichiers pour les artefacts de plugins installés
- les tables de correspondance éphémères propres à un appel pour la normalisation des chemins ou la résolution des doublons

Ces caches sont des détails d’implémentation du plan de données. Ils ne doivent pas répondre
à des questions du plan de contrôle telles que « quel plugin possède ce fournisseur ? », sauf si
l’appelant a délibérément demandé un chargement à l’exécution.

N’ajoutez pas de caches persistants ou fondés sur l’horloge murale pour :

- les résultats de la découverte
- les registres de manifestes directs
- les registres de manifestes reconstruits à partir de l’index des plugins installés
- la recherche du propriétaire d’un fournisseur, la suppression de modèles, la politique des fournisseurs ou les métadonnées
  des artefacts publics
- toute autre réponse dérivée d’un manifeste pour laquelle une modification du manifeste, de l’index installé
  ou du chemin de chargement doit être visible lors de la lecture suivante des métadonnées

Les appelants qui reconstruisent les métadonnées des manifestes à partir de l’index persistant des plugins
installés reconstruisent ce registre à la demande. L’index installé constitue un état durable
du plan source ; il ne s’agit pas d’un cache de métadonnées en mémoire masqué.

## Modèle de registre

Les plugins chargés ne modifient pas directement des variables globales arbitraires du cœur. Ils s’enregistrent dans un
registre central de plugins (`PluginRegistry` dans `src/plugins/registry-types.ts`),
qui suit les enregistrements des plugins (identité, source, origine, état, diagnostics)
ainsi que des tableaux pour chaque fonctionnalité : outils, hooks hérités et hooks typés,
canaux, fournisseurs, gestionnaires RPC du Gateway, routes HTTP, mécanismes d’enregistrement de la CLI,
services en arrière-plan, commandes appartenant aux plugins et des dizaines d’autres familles de fournisseurs
typées (parole, embeddings, génération d’images/de vidéos/de musique, récupération/recherche
sur le Web, bancs d’essai d’agents, actions de session, etc.).

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de communiquer directement avec les modules
des plugins. Le chargement reste ainsi unidirectionnel :

- module de plugin -> enregistrement dans le registre
- environnement d’exécution du cœur -> utilisation du registre

Cette séparation est importante pour la maintenabilité. Ainsi, la plupart des surfaces du cœur n’ont besoin que
d’un seul point d’intégration : « lire le registre », et non « traiter chaque
module de plugin comme un cas particulier ».

## Rappels de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un rappel après l’approbation
ou le refus d’une demande de liaison :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Une liaison existe désormais pour ce plugin et cette conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // La demande a été refusée ; effacez tout état local en attente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du rappel :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indication de dissociation, l’identifiant de l’expéditeur et
  les métadonnées de la conversation

Ce rappel sert uniquement de notification. Il ne modifie pas les personnes autorisées à lier une
conversation et s’exécute une fois le traitement de l’approbation par le cœur terminé.

## Hooks d’exécution des fournisseurs

Les plugins de fournisseurs comportent trois couches :

- **Métadonnées du manifeste** pour une recherche peu coûteuse avant l’exécution :
  `setup.providers[].envVars`, la compatibilité obsolète `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (`discovery` hérité) ainsi que
  `applyConfigDefaults`.
- **Hooks d’exécution** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution des modèles,
  l’encapsulation des flux, les niveaux de raisonnement, la politique de relecture et les points de terminaison d’utilisation. Consultez
  [Ordre et utilisation des hooks](#hook-order-and-usage).

OpenClaw conserve la responsabilité de la boucle d’agent générique, du basculement, de la gestion des transcriptions et
de la politique des outils. Ces hooks constituent la surface d’extension du comportement propre aux fournisseurs
sans nécessiter un transport d’inférence personnalisé complet.

Utilisez `setup.providers[].envVars` dans le manifeste lorsque le fournisseur dispose
d’identifiants basés sur des variables d’environnement que les parcours génériques
d’authentification, d’état et de sélection de modèle doivent pouvoir consulter sans
charger l’environnement d’exécution du Plugin. L’élément obsolète `providerAuthEnvVars`
est encore lu par l’adaptateur de compatibilité pendant la période d’abandon progressif,
et les plugins non intégrés qui l’utilisent reçoivent un diagnostic de manifeste.
Utilisez `providerAuthAliases` dans le manifeste lorsqu’un identifiant de fournisseur
doit réutiliser les variables d’environnement, les profils d’authentification,
l’authentification issue de la configuration et le choix d’intégration par clé API d’un
autre identifiant de fournisseur. Utilisez `providerAuthChoices` dans le manifeste
lorsque les interfaces CLI de choix d’intégration ou d’authentification doivent connaître
l’identifiant du choix du fournisseur, les libellés de groupe et la configuration simple
de l’authentification par une seule option, sans charger l’environnement d’exécution du
fournisseur. Conservez `envVars` dans l’environnement d’exécution du fournisseur pour les
indications destinées aux opérateurs, telles que les libellés d’intégration ou les
variables de configuration de l’identifiant client et du secret client OAuth.

Utilisez `channelEnvVars` dans le manifeste lorsqu’un canal dispose d’une
authentification ou d’une configuration pilotée par des variables d’environnement que
le mécanisme générique de repli vers les variables d’environnement du shell, les
vérifications de configuration ou d’état, ou les invites de configuration doivent
pouvoir consulter sans charger l’environnement d’exécution du canal.

### Ordre et utilisation des hooks

Pour les plugins de modèle ou de fournisseur, OpenClaw appelle les hooks
approximativement dans l’ordre suivant.
La colonne « Quand l’utiliser » constitue un guide de décision rapide.
Les champs de fournisseur réservés à la compatibilité qu’OpenClaw n’appelle plus, tels
que `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont volontairement pas
répertoriés ici.

| Hook                              | Fonction                                                                                                                                        | Quand l’utiliser                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publie la configuration du fournisseur dans `models.providers` lors de la génération de `models.json`                                           | Le fournisseur gère un catalogue ou les valeurs par défaut de l’URL de base                                                                                       |
| `applyConfigDefaults`             | Applique les valeurs par défaut de configuration globale gérées par le fournisseur lors de la matérialisation de la configuration                | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de la famille de modèles du fournisseur                       |
| _(recherche de modèle intégrée)_  | OpenClaw tente d’abord le chemin normal du registre/catalogue                                                                                    | _(ce n’est pas un hook de plugin)_                                                                                                                                |
| `normalizeModelId`                | Normalise les alias d’identifiants de modèle hérités ou en préversion avant la recherche                                                         | Le fournisseur gère le nettoyage des alias avant la résolution canonique du modèle                                                                                |
| `normalizeTransport`              | Normalise les valeurs `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle                                     | Le fournisseur gère le nettoyage du transport pour les identifiants de fournisseur personnalisés appartenant à la même famille de transport                      |
| `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution à l’exécution/du fournisseur                                                               | Le fournisseur nécessite un nettoyage de configuration qui doit résider dans le plugin ; les assistants intégrés de la famille Google sécurisent aussi les entrées de configuration Google prises en charge |
| `applyNativeStreamingUsageCompat` | Applique aux fournisseurs configurés les réécritures de compatibilité natives pour l’utilisation en streaming                                   | Le fournisseur nécessite des corrections des métadonnées natives d’utilisation en streaming pilotées par le point de terminaison                                 |
| `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement pour les fournisseurs configurés avant le chargement de l’authentification à l’exécution   | Les fournisseurs exposent leurs propres hooks de résolution de clé API par marqueur d’environnement                                                               |
| `resolveSyntheticAuth`            | Expose une authentification locale/auto-hébergée ou fondée sur la configuration sans conserver de texte en clair                                 | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique/local                                                                                  |
| `resolveExternalAuthProfiles`     | Superpose les profils d’authentification externes gérés par le fournisseur ; la valeur `persistence` par défaut est `runtime-only` pour les identifiants gérés par la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externes sans conserver les jetons d’actualisation copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| `shouldDeferSyntheticProfileAuth` | Place les espaces réservés des profils synthétiques enregistrés après l’authentification fondée sur l’environnement/la configuration             | Le fournisseur stocke des profils synthétiques servant d’espaces réservés qui ne doivent pas avoir priorité                                                        |
| `resolveDynamicModel`             | Solution de repli synchrone pour les identifiants de modèles gérés par le fournisseur qui ne figurent pas encore dans le registre local           | Le fournisseur accepte des identifiants de modèles amont arbitraires                                                                                              |
| `prepareDynamicModel`             | Préchauffage asynchrone, puis `resolveDynamicModel` s’exécute de nouveau                                                                          | Le fournisseur a besoin de métadonnées réseau avant de résoudre les identifiants inconnus                                                                          |
| `normalizeResolvedModel`          | Réécriture finale avant que l’exécuteur intégré utilise le modèle résolu                                                                          | Le fournisseur nécessite des réécritures de transport, tout en continuant d’utiliser un transport du cœur                                                         |
| `normalizeToolSchemas`            | Normalise les schémas des outils avant qu’ils soient transmis à l’exécuteur intégré                                                               | Le fournisseur nécessite un nettoyage des schémas propre à la famille de transport                                                                                |
| `inspectToolSchemas`              | Expose les diagnostics de schéma gérés par le fournisseur après la normalisation                                                                  | Le fournisseur souhaite des avertissements sur les mots-clés sans intégrer de règles propres au fournisseur dans le cœur                                           |
| `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                                                   | Le fournisseur nécessite une sortie de raisonnement/finale balisée plutôt que des champs natifs                                                                    |
| `prepareExtraParams`              | Normalise les paramètres de requête avant les enveloppes génériques d’options de flux                                                              | Le fournisseur nécessite des paramètres de requête par défaut ou un nettoyage des paramètres propre au fournisseur                                                |
| `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                                                       | Le fournisseur nécessite un protocole filaire personnalisé, et non une simple enveloppe                                                                            |
| `wrapStreamFn`                    | Enveloppe de flux appliquée après les enveloppes génériques                                                                                        | Le fournisseur nécessite des enveloppes de compatibilité pour les en-têtes/le corps/le modèle de la requête sans transport personnalisé                           |
| `resolveTransportTurnState`       | Ajoute des en-têtes ou métadonnées de transport natifs propres à chaque tour                                                                       | Le fournisseur souhaite que les transports génériques envoient l’identité de tour native du fournisseur                                                           |
| `resolveWebSocketSessionPolicy`   | Ajoute des en-têtes WebSocket natifs ou une politique de délai de récupération de session                                                         | Le fournisseur souhaite que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                                |
| `formatApiKey`                    | Formateur de profil d’authentification : le profil enregistré devient la chaîne `apiKey` utilisée à l’exécution                                  | Le fournisseur stocke des métadonnées d’authentification supplémentaires et nécessite une forme de jeton personnalisée à l’exécution                              |
| `refreshOAuth`                    | Remplace l’actualisation OAuth pour les points de terminaison personnalisés ou la politique d’échec d’actualisation                               | Le fournisseur n’est pas compatible avec les mécanismes d’actualisation partagés d’OpenClaw                                                                        |
| `buildAuthDoctorHint`             | Indication de réparation ajoutée en cas d’échec de l’actualisation OAuth                                                                           | Le fournisseur nécessite des instructions de réparation de l’authentification qu’il gère après l’échec de l’actualisation                                         |
| `matchesContextOverflowError`     | Détecteur de dépassement de la fenêtre de contexte géré par le fournisseur                                                                         | Le fournisseur renvoie des erreurs brutes de dépassement que les heuristiques génériques ne détecteraient pas                                                      |
| `classifyFailoverReason`          | Classification du motif de basculement gérée par le fournisseur                                                                                    | Le fournisseur peut associer les erreurs brutes d’API/de transport à une limitation de débit, une surcharge, etc.                                                  |
| `isCacheTtlEligible`              | Politique de cache des prompts pour les fournisseurs proxy/de liaison                                                                              | Le fournisseur nécessite un contrôle de l’éligibilité au TTL du cache propre au proxy                                                                              |
| `buildMissingAuthMessage`         | Remplace le message générique de récupération en cas d’authentification manquante                                                                  | Le fournisseur nécessite une indication de récupération propre au fournisseur en cas d’authentification manquante                                                 |
| `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte (obsolète, voir ci-dessous)                                                  | Le fournisseur nécessite des lignes synthétiques de compatibilité ascendante dans `models list` et les sélecteurs                                                  |
| `resolveThinkingProfile`          | Ensemble de niveaux `/think`, libellés d’affichage et valeur par défaut propres au modèle                                                          | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour les modèles sélectionnés                                                   |
| `isBinaryThinking`                | Hook de compatibilité pour activer/désactiver le raisonnement                                                                                      | Le fournisseur expose uniquement un mode de réflexion binaire activé/désactivé                                                                                     |
| `supportsXHighThinking`           | Hook de compatibilité avec le raisonnement `xhigh`                                                                                                 | Le fournisseur souhaite activer `xhigh` uniquement pour un sous-ensemble de modèles                                                                                |
| `resolveDefaultThinkingLevel`     | Hook de compatibilité du niveau `/think` par défaut                                                                                                 | Le fournisseur gère la politique `/think` par défaut pour une famille de modèles                                                                                   |
| `isModernModelRef`                | Détecteur de modèles modernes pour les filtres de profils actifs et la sélection des tests de fumée                                                | Le fournisseur gère la correspondance des modèles préférés pour les profils actifs/tests de fumée                                                                  |
| `prepareRuntimeAuth`              | Échange un identifiant configuré contre le véritable jeton/la véritable clé d’exécution juste avant l’inférence                                   | Le fournisseur nécessite un échange de jeton ou un identifiant de requête à courte durée de vie                                                                     |
| `resolveUsageAuth`                | Résout les identifiants d’utilisation/facturation pour `/usage` et les surfaces d’état associées                                                   | Le fournisseur nécessite une analyse personnalisée du jeton d’utilisation/quota ou un identifiant d’utilisation différent                                         |
| `fetchUsageSnapshot`              | Récupère et normalise les instantanés d’utilisation/quota propres au fournisseur après la résolution de l’authentification                        | Le fournisseur nécessite un point de terminaison d’utilisation ou un analyseur de charge utile propre au fournisseur                                               |
| `createEmbeddingProvider`         | Créer un adaptateur d’embeddings appartenant au fournisseur pour la mémoire/recherche                         | Le comportement des embeddings de mémoire relève du plugin du fournisseur                                                                    |
| `buildReplayPolicy`               | Renvoyer une politique de relecture contrôlant la gestion de la transcription pour le fournisseur             | Le fournisseur nécessite une politique de transcription personnalisée (par exemple, la suppression des blocs de réflexion)                   |
| `sanitizeReplayHistory`           | Réécrire l’historique de relecture après le nettoyage générique de la transcription                           | Le fournisseur nécessite des réécritures de relecture propres au fournisseur au-delà des assistants de Compaction partagés                   |
| `validateReplayTurns`             | Effectuer la validation ou la restructuration finale des tours de relecture avant l’exécuteur intégré          | Le transport du fournisseur nécessite une validation plus stricte des tours après l’assainissement générique                                 |
| `onModelSelected`                 | Exécuter les effets secondaires post-sélection appartenant au fournisseur                                      | Le fournisseur nécessite de la télémétrie ou un état lui appartenant lorsqu’un modèle devient actif                                           |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin de fournisseur correspondant, puis parcourent les autres Plugins de fournisseur
prenant en charge les hooks jusqu’à ce que l’un d’eux modifie effectivement l’identifiant
du modèle ou le transport/la configuration. Cela permet aux adaptateurs
d’alias/de compatibilité des fournisseurs de continuer à fonctionner sans imposer à
l’appelant de connaître le Plugin intégré propriétaire de la réécriture. Si aucun hook
de fournisseur ne réécrit une entrée de configuration prise en charge de la famille
Google, le normaliseur de configuration Google intégré applique tout de même ce
nettoyage de compatibilité.

Si le fournisseur nécessite un protocole réseau entièrement personnalisé ou un
exécuteur de requêtes personnalisé, il s’agit d’une autre catégorie d’extension. Ces
hooks concernent les comportements de fournisseur qui s’exécutent toujours dans la
boucle d’inférence normale d’OpenClaw.

`resolveUsageAuth` détermine si OpenClaw doit appeler `fetchUsageSnapshot` ou
revenir à la résolution générique des identifiants pour les surfaces
d’utilisation/d’état. Renvoyez
`{ token, accountId?, subscriptionType?, rateLimitTier? }` lorsque le fournisseur
dispose d’un identifiant d’utilisation (les métadonnées facultatives du forfait sont
transmises à `fetchUsageSnapshot`), renvoyez
`{ handled: true }` lorsque l’authentification d’utilisation appartenant au fournisseur
a traité la requête et doit empêcher le repli générique vers une clé API/OAuth, et
renvoyez `null` ou `undefined` lorsque le fournisseur n’a pas traité
l’authentification d’utilisation.

Déclarez les identifiants d’organisation ou de facturation dans
`providerUsageAuthEnvVars` du manifeste. Cela permet aux surfaces génériques de
découverte et de suppression des secrets de les reconnaître sans en faire des
candidats à l’authentification d’inférence.

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

Les Plugins de fournisseur intégrés combinent les hooks ci-dessus pour répondre
aux besoins de chaque fournisseur en matière de catalogue, d’authentification, de
raisonnement, de relecture et d’utilisation. L’ensemble de hooks faisant autorité
réside dans chaque Plugin sous `extensions/` ; cette page illustre les structures
plutôt que de reproduire la liste.

<AccordionGroup>
  <Accordion title="Fournisseurs de catalogues en transmission directe">
    OpenRouter, Kilocode, Z.AI et xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les
    identifiants de modèles en amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="Fournisseurs de points de terminaison OAuth et d’utilisation">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi et z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour prendre en charge l’échange de jetons et
    l’intégration de `/usage`.
  </Accordion>
  <Accordion title="Familles de nettoyage des relectures et des transcriptions">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs
    d’adopter la politique de transcription via `buildReplayPolicy` plutôt que
    de réimplémenter le nettoyage dans chaque Plugin.
  </Accordion>
  <Accordion title="Fournisseurs de catalogue uniquement">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent uniquement `catalog` et utilisent la boucle
    d’inférence partagée.
  </Accordion>
  <Accordion title="Assistants de flux propres à Anthropic">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` résident dans
    l’interface publique `api.ts` / `contract-api.ts` du Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Assistants d’exécution

Les Plugins peuvent accéder à certains assistants du cœur via `api.runtime`. Pour la synthèse vocale :

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

- `textToSpeech` renvoie la charge utile de sortie TTS normale du cœur pour les surfaces de fichiers/notes vocales.
- Utilise la configuration `messages.tts` du cœur et la sélection du fournisseur.
- Renvoie un tampon audio PCM et une fréquence d’échantillonnage. Les Plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif pour chaque fournisseur. Utilisez-le pour les sélecteurs de voix ou les parcours de configuration propres au fournisseur.
- Le cœur transmet une échéance de requête résolue aux hooks `listVoices` du fournisseur ; les paramètres de délai d’expiration propres au fournisseur peuvent la remplacer.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que les paramètres régionaux, le genre et les étiquettes de personnalité pour les sélecteurs tenant compte du fournisseur.
- OpenAI et ElevenLabs prennent actuellement en charge la téléphonie. Microsoft ne la prend pas en charge.

Les Plugins peuvent également enregistrer des fournisseurs vocaux via `api.registerSpeechProvider(...)`.

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

- Conservez la politique TTS, le repli et la remise des réponses dans le cœur.
- Utilisez les fournisseurs vocaux pour les comportements de synthèse propres au fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de propriété privilégié est axé sur l’entreprise : un seul Plugin de fournisseur peut prendre en charge
  les fournisseurs de texte, de voix, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension des images, de l’audio et des vidéos, les Plugins enregistrent un
fournisseur typé de compréhension multimédia plutôt qu’un ensemble générique de paires clé/valeur :

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

- Conservez l’orchestration, le repli, la configuration et le câblage des canaux dans le cœur.
- Conservez le comportement du fournisseur dans le Plugin de fournisseur.
- L’extension additive doit rester typée : nouvelles méthodes facultatives, nouveaux
  champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération de vidéos suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant d’exécution
  - les Plugins de fournisseur enregistrent `api.registerVideoGenerationProvider(...)`
  - les Plugins de fonctionnalité/canal utilisent `api.runtime.videoGeneration.*`

Pour les assistants d’exécution de compréhension multimédia, les Plugins peuvent appeler :

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
  model: "gpt-5.6-sol",
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

Pour la transcription audio, les Plugins peuvent utiliser soit l’environnement d’exécution
de compréhension multimédia, soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée privilégiée pour
  la compréhension des images, de l’audio et des vidéos.
- `extractStructuredWithModel(...)` est l’interface destinée aux Plugins pour une
  extraction limitée, appartenant au fournisseur et centrée sur l’image. Incluez au
  moins une entrée d’image ; les entrées textuelles fournissent un contexte
  complémentaire. Les Plugins de produit possèdent leurs routes et leurs schémas,
  tandis qu’OpenClaw possède la frontière fournisseur/environnement d’exécution.
- Utilise la configuration audio de compréhension multimédia du cœur (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple, entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

Les Plugins peuvent également lancer des exécutions de sous-agents en arrière-plan via `api.runtime.subagent` :

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

- `provider` et `model` sont des remplacements facultatifs propres à chaque exécution, et non des modifications persistantes de la session.
- OpenClaw n’honore ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de repli appartenant aux Plugins, les opérateurs doivent les autoriser avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour limiter les Plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agents de Plugins non fiables continuent de fonctionner, mais les demandes de remplacement sont rejetées au lieu d’effectuer silencieusement un repli.
- Les sessions de sous-agent créées par un Plugin sont étiquetées avec l’identifiant du Plugin créateur. Le repli `api.runtime.subagent.deleteSession(...)` ne peut supprimer que ces sessions lui appartenant ; la suppression arbitraire de sessions nécessite toujours une requête Gateway avec une portée d’administrateur.

Pour la recherche sur le Web, les Plugins peuvent utiliser l’assistant d’exécution partagé au lieu
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

Les Plugins peuvent également enregistrer des fournisseurs de recherche sur le Web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes dans le cœur.
- Utilisez les fournisseurs de recherche sur le Web pour les transports de recherche propres aux fournisseurs.
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
- `listProviders(...)` : répertorie les fournisseurs de génération d’images disponibles et leurs capacités.

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

Champs de la route :

- `path` : chemin de la route sous le serveur HTTP du Gateway.
- `auth` : obligatoire, `"gateway"` ou `"plugin"`. Utilisez `"gateway"` pour exiger l'authentification normale du Gateway, ou `"plugin"` pour l'authentification ou la vérification de Webhook gérée par le Plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `handleUpgrade` : gestionnaire facultatif pour les requêtes de mise à niveau WebSocket sur la même route.
- `replaceExisting` : facultatif. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoyez `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du Plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes de Plugin doivent déclarer explicitement `auth`.
- Les conflits exacts de `path + match` sont rejetés sauf si `replaceExisting: true`, et un Plugin ne peut pas remplacer la route d'un autre Plugin.
- Les routes qui se chevauchent avec des niveaux d'`auth` différents sont rejetées. Conservez les chaînes de repli `exact`/`prefix` au même niveau d'authentification uniquement.
- Les routes avec `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d'exécution de l'opérateur. Elles sont destinées aux Webhooks et à la vérification de signature gérés par le Plugin, et non aux appels privilégiés des assistants du Gateway.
- Les routes avec `auth: "gateway"` s'exécutent dans une portée d'exécution de requête du Gateway. La surface par défaut (`gatewayRuntimeScopeSurface: "write-default"`) est volontairement restrictive :
  - l'authentification par jeton porteur à secret partagé (`gateway.auth.mode = "token"` / `"password"`) et toute méthode d'authentification autre que par proxy de confiance reçoivent une seule portée `operator.write`, même si l'appelant envoie `x-openclaw-scopes`
  - les appelants `trusted-proxy` sans en-tête explicite `x-openclaw-scopes` conservent également l'ancienne surface limitée à `operator.write`
  - les appelants `trusted-proxy` qui envoient `x-openclaw-scopes` reçoivent à la place les portées déclarées
  - une route peut choisir `gatewayRuntimeScopeSurface: "trusted-operator"` afin de toujours respecter `x-openclaw-scopes` pour les modes d'authentification porteurs d'identité (avec repli sur l'ensemble complet de portées par défaut de la CLI lorsque l'en-tête est absent)
- Règle pratique : ne supposez pas qu'une route de Plugin authentifiée par le Gateway constitue implicitement une surface d'administration. Si votre route nécessite un comportement réservé aux administrateurs, choisissez la surface de portée `trusted-operator`, exigez un mode d'authentification porteur d'identité et documentez le contrat explicite de l'en-tête `x-openclaw-scopes`.
- Après la correspondance de la route et l'authentification, les gestionnaires ordinaires participent au contrôle d'admission du travail racine du Gateway. Un Gateway préparé ou en cours de redémarrage renvoie `503` avant d'appeler le gestionnaire. L'exception restreinte est une route autorisée par le manifeste avec `auth: "gateway"` qui choisit également la surface `trusted-operator` propre à la route ; elle reste accessible afin que la distribution du contrôle de suspension ne soit pas bloquée, tandis que les routes sœurs ordinaires du même Plugin restent derrière la limite d'admission. L'attribution de propriété WebSocket via `handleUpgrade` utilise la même limite d'admission atomique ; une fois que le gestionnaire accepte un socket, la durée de vie ultérieure du socket appartient au Plugin et n'est pas suivie par cette limite.

## Chemins d'importation du SDK de Plugin

Utilisez des sous-chemins SDK ciblés plutôt que le barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux Plugins. Sous-chemins principaux :

| Sous-chemin                          | Objectif                                            |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d'enregistrement de Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Assistants d'entrée et de création de canal         |
| `openclaw/plugin-sdk/core`          | Assistants génériques partagés et contrat global    |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |

Les Plugins de canal choisissent parmi une famille d'interfaces ciblées — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d'approbation doit être regroupé
dans un seul contrat `approvalCapability` plutôt que réparti entre des
champs de Plugin sans rapport. Consultez [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les assistants d'exécution et de configuration se trouvent sous les sous-chemins ciblés `*-runtime`
correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au barrel de compatibilité général `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
les petites façades d'assistance de canal, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
et `openclaw/plugin-sdk/infra-runtime` sont des adaptateurs de compatibilité obsolètes pour
les anciens Plugins. Le nouveau code doit plutôt importer des primitives génériques plus ciblées.
</Info>

Points d'entrée internes au dépôt (par racine de paquet de Plugin intégré) :

- `index.js` — point d'entrée du Plugin intégré
- `api.js` — barrel d'assistants et de types
- `runtime-api.js` — barrel réservé à l'exécution
- `setup-entry.js` — point d'entrée du Plugin de configuration

Les Plugins externes doivent uniquement importer les sous-chemins `openclaw/plugin-sdk/*`. N'importez jamais
le `src/*` du paquet d'un autre Plugin depuis le cœur ou un autre Plugin.
Les points d'entrée chargés par façade préfèrent l'instantané actif de la configuration d'exécution lorsqu'il
existe, puis se replient sur le fichier de configuration résolu sur le disque.

Les sous-chemins propres aux capacités tels que `image-generation`, `media-understanding`
et `speech` existent parce que les Plugins intégrés les utilisent actuellement. Ils ne constituent pas
automatiquement des contrats externes figés à long terme — consultez la page de référence du SDK
correspondante lorsque vous vous appuyez sur eux.

## Schémas de l'outil de messagerie

Les Plugins doivent gérer les contributions de schéma `describeMessageTool(...)`
propres aux canaux pour les primitives autres que les messages, telles que les réactions, les lectures et les sondages.
La présentation partagée des envois doit utiliser le contrat générique `MessagePresentation`
plutôt que des champs de bouton, de composant, de bloc ou de carte propres au fournisseur.
Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, la correspondance avec les fournisseurs et la liste de contrôle destinée aux auteurs de Plugins.

Les Plugins capables d'envoyer des messages déclarent ce qu'ils peuvent restituer au moyen des capacités de messagerie :

- `presentation` pour les blocs de présentation sémantiques (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s'il faut restituer la présentation nativement ou la dégrader en texte.
N'exposez pas de mécanismes de contournement de l'interface utilisateur propres au fournisseur depuis l'outil de messagerie générique.
Les assistants SDK obsolètes pour les anciens schémas natifs restent exportés pour les Plugins
tiers existants, mais les nouveaux Plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les Plugins de canal doivent gérer la sémantique des cibles propres au canal. Gardez l'hôte
sortant partagé générique et utilisez la surface de l'adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` détermine si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l'annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d'une recherche dans l'annuaire.
- `messaging.targetResolver.reservedLiterals` répertorie les mots seuls qui constituent des
  références de canal ou de session pour ce fournisseur. La résolution préserve les entrées
  configurées de l'annuaire avant de rejeter les littéraux réservés, puis échoue de manière fermée si
  aucune correspondance n'est trouvée dans l'annuaire.
- `messaging.targetResolver.resolveTarget(...)` constitue le repli du Plugin lorsque
  le cœur a besoin d'une résolution finale appartenant au fournisseur après la normalisation ou
  après l'échec d'une recherche dans l'annuaire.
- `messaging.resolveOutboundSessionRoute(...)` gère la construction de la route de session
  propre au fournisseur une fois qu'une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent intervenir avant
  la recherche de pairs ou de groupes.
- Utilisez `looksLikeId` pour les vérifications de type « traiter ceci comme un identifiant de cible explicite ou natif ».
- Utilisez `resolveTarget` pour le repli de normalisation propre au fournisseur, et non pour
  une recherche générale dans l'annuaire.
- Conservez les identifiants natifs du fournisseur, tels que les identifiants de discussion, de fil de discussion, les JID, les pseudonymes et les identifiants de salon,
  dans les valeurs `target` ou les paramètres propres au fournisseur, et non dans les champs génériques du SDK.

## Annuaires basés sur la configuration

Les Plugins qui dérivent les entrées d'annuaire de la configuration doivent conserver cette logique dans le
Plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez-les lorsqu'un canal a besoin de pairs ou de groupes basés sur la configuration, tels que :

- des pairs de messages privés déterminés par une liste d'autorisation
- des correspondances de canaux ou de groupes configurées
- des replis d'annuaire statiques propres au compte

Les assistants partagés de `directory-runtime` gèrent uniquement les opérations génériques :

- filtrage des requêtes
- application des limites
- assistants de déduplication et de normalisation
- création de `ChannelDirectoryEntry[]`

L'inspection des comptes et la normalisation des identifiants propres au canal doivent rester dans
l'implémentation du Plugin.

## Catalogues de fournisseurs

Les Plugins de fournisseur peuvent définir des catalogues de modèles pour l'inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même structure que celle écrite par OpenClaw dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le Plugin gère les identifiants de modèles propres au fournisseur, les valeurs
par défaut de l'URL de base ou les métadonnées de modèles conditionnées par l'authentification.

`catalog.order` détermine quand le catalogue d'un Plugin est fusionné par rapport aux
fournisseurs implicites intégrés d'OpenClaw :

- `simple` : fournisseurs pilotés par une simple clé d'API ou par l'environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d'authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernière passe, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l'emportent en cas de collision de clés ; les Plugins peuvent donc remplacer intentionnellement une
entrée de fournisseur intégrée ayant le même identifiant de fournisseur.

Les Plugins peuvent également publier des lignes de modèles en lecture seule au moyen de
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Il s'agit de la voie à privilégier pour les surfaces de liste, d'aide et de sélection ; elle prend en charge les lignes
`text`, `voice`, `image_generation`, `video_generation` et `music_generation`.
Les Plugins de fournisseur restent responsables des appels aux points de terminaison actifs, de l'échange de jetons et de
la correspondance des réponses du fournisseur ; le cœur gère la structure de ligne commune, les libellés de source et
la mise en forme de l'aide des outils multimédias. Les enregistrements de fournisseurs de génération multimédia synthétisent
automatiquement des lignes de catalogue statiques à partir de `defaultModel`, `models` et
`capabilities`.

Compatibilité :

- `discovery` fonctionne encore comme alias hérité, mais émet un avertissement d'obsolescence
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`
  et émet un avertissement
- `augmentModelCatalog` est obsolète ; les fournisseurs intégrés doivent publier
  les lignes supplémentaires au moyen de `registerModelCatalogProvider`

## Inspection des canaux en lecture seule

Si votre Plugin enregistre un canal, implémentez de préférence
`plugin.config.inspectAccount(cfg, accountId)` en complément de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d'exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et échouer immédiatement lorsque les secrets requis sont absents.
- Les chemins de commandes en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, ainsi que les flux de réparation
  du diagnostic et de la configuration ne doivent pas avoir à matérialiser les identifiants d'exécution uniquement pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyez uniquement un état descriptif du compte.
- Préservez `enabled` et `configured`.
- Incluez les champs de source/d’état des identifiants lorsque cela est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons uniquement pour indiquer leur
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (ainsi que le champ de source
  correspondant) suffit pour les commandes d’état.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule d’indiquer « configuré mais indisponible dans ce chemin de
commande » au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

## Packs de paquets

Un répertoire de plugin peut inclure un fichier `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un plugin. Si le pack répertorie plusieurs extensions, l’identifiant du plugin
devient `<manifestOrPackageName>/<fileBase>` (l’identifiant du manifeste prévaut lorsqu’il est
présent ; sinon, le nom non délimité par une portée de `package.json` est utilisé).

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Mesure de sécurité : chaque entrée de `openclaw.extensions` doit rester dans le répertoire du plugin
après la résolution des liens symboliques. Les entrées qui sortent du répertoire du paquet sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances du plugin avec une commande
`npm install --omit=dev --ignore-scripts` locale au projet (aucun script de cycle de vie,
aucune dépendance de développement à l’exécution), en ignorant les paramètres globaux hérités
d’installation npm. Conservez des arbres de dépendances de plugin « purement JS/TS » et évitez les paquets qui nécessitent
des compilations `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsque OpenClaw a besoin des surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais pas encore configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela allège le démarrage et la configuration
lorsque l’entrée principale de votre plugin raccorde également des outils, des hooks ou d’autres
éléments de code réservés à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire utiliser à un plugin de canal le même chemin `setupEntry` pendant la phase
de démarrage du Gateway précédant l’écoute, même lorsque le canal est déjà configuré.

Utilisez cette option uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le Gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont dépend le démarrage, notamment :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le Gateway ne commence à écouter
- toutes les méthodes, tous les outils ou tous les services du Gateway qui doivent exister pendant cette même période

Si votre entrée complète détient encore une capacité de démarrage requise, n’activez pas
cette option. Conservez le comportement par défaut du plugin et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux intégrés peuvent également publier des utilitaires de surface contractuelle réservés à la configuration que le cœur
peut consulter avant le chargement de l’environnement d’exécution complet du canal. La surface actuelle
de promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration de canal historique à compte unique
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple intégré actuel : il déplace uniquement les clés d’authentification/d’amorçage vers un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé configurée non canonique de compte par défaut au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de correctifs de configuration maintiennent différée la découverte des surfaces contractuelles intégrées. Le temps
d’importation reste faible ; la surface de promotion est chargée uniquement lors de sa première utilisation au lieu de
relancer le démarrage du canal intégré lors de l’importation du module.

Lorsque ces surfaces de démarrage comprennent des méthodes RPC du Gateway, conservez-les sous un
préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et sont toujours résolus
en `operator.admin`, même si un plugin demande une portée plus restreinte.

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

Les plugins de canal peuvent publier des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela évite d’intégrer des données de catalogue au cœur.

Exemple :

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (auto-hébergé)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Messagerie auto-hébergée via les bots webhook de Nextcloud Talk.",
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

Champs `openclaw.channel` utiles en plus de l’exemple minimal :

- `detailLabel` : libellé secondaire pour des surfaces de catalogue/d’état plus riches
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : identifiants de plugins/canaux de priorité inférieure que cette entrée de catalogue doit devancer
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles du texte de la surface de sélection
- `markdownCapable` : indique que le canal prend en charge Markdown pour les décisions de mise en forme sortante
- `exposure.configured` : masque le canal dans les surfaces répertoriant les canaux configurés lorsque cette valeur est définie sur `false`
- `exposure.setup` : masque le canal dans les sélecteurs interactifs de configuration lorsqu’elle est définie sur `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de la documentation
- `showConfigured` / `showInSetup` : alias historiques encore acceptés pour assurer la compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait participer le canal au flux `allowFrom` standard de démarrage rapide
- `forceAccountBinding` : exige une association explicite du compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : privilégie la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut également fusionner des **catalogues de canaux externes** (par exemple, un export de
registre MPM). Déposez un fichier JSON à l’un des emplacements suivants :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par une virgule, un point-virgule ou `PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte également `"packages"` ou `"plugins"` comme alias historiques de la clé `"entries"`.

Les entrées générées du catalogue des canaux et celles du catalogue d’installation des fournisseurs exposent
des informations normalisées sur la source d’installation à côté du bloc brut `openclaw.install`. Ces
informations normalisées indiquent si la spécification npm correspond à une version exacte ou à un
sélecteur flottant, si les métadonnées d’intégrité attendues sont présentes et si un chemin
de source locale est également disponible. Lorsque l’identité du catalogue/paquet est connue, les
informations normalisées émettent un avertissement si le nom du paquet npm analysé diverge de cette identité.
Elles émettent également un avertissement lorsque `defaultChoice` est invalide ou pointe vers une source qui
n’est pas disponible, ainsi que lorsque des métadonnées d’intégrité npm sont présentes sans source npm
valide. Les consommateurs doivent traiter `installSource` comme un champ facultatif additif afin que
les entrées créées manuellement et les adaptateurs de catalogue n’aient pas à le synthétiser.
Cela permet à l’intégration initiale et aux diagnostics d’expliquer l’état du plan des sources sans
importer l’environnement d’exécution du plugin.

Les entrées npm externes officielles doivent privilégier une valeur `npmSpec` exacte accompagnée de
`expectedIntegrity`. Les noms de paquets seuls et les balises de distribution continuent de fonctionner pour
assurer la compatibilité, mais ils font apparaître des avertissements liés au plan des sources afin que le catalogue puisse évoluer
vers des installations épinglées et vérifiées par contrôle d’intégrité sans rompre les plugins existants.
Lorsque l’intégration initiale effectue une installation depuis un chemin de catalogue local, elle enregistre une entrée d’index de plugin
géré avec `source: "path"` et un `sourcePath` relatif à l’espace de travail
lorsque cela est possible. Le chemin de chargement opérationnel absolu reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins locaux du poste de travail
dans une configuration persistante. Cela maintient les installations de développement local visibles pour
les diagnostics du plan des sources sans ajouter une seconde surface de divulgation brute des chemins du système de fichiers.
La table SQLite persistante `installed_plugin_index` constitue la source de vérité de la source
d’installation et peut être actualisée sans charger les modules d’exécution des plugins.
Sa map `installRecords` est persistante même lorsque le manifeste d’un plugin est absent ou
invalide ; sa charge utile `plugins` est une vue de manifeste reconstructible.

## Plugins de moteur de contexte

Les plugins de moteur de contexte prennent en charge l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cette fonctionnalité lorsque votre plugin doit remplacer ou étendre le pipeline de contexte
par défaut plutôt que simplement ajouter une recherche en mémoire ou des hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

La fabrique `ctx` expose des valeurs facultatives `config`, `agentDir` et `workspaceDir`
pour l’initialisation au moment de la construction.

`assemble()` peut renvoyer `contextProjection` lorsque le harnais actif dispose d’un
fil de discussion de backend persistant. Omettez-le pour la projection historique à chaque tour. Renvoyez
`{ mode: "thread_bootstrap", epoch }` lorsque le contexte assemblé doit être
injecté une seule fois dans un fil de discussion de backend et réutilisé jusqu’à ce que l’époque change. Modifiez
l’époque après un changement sémantique du contexte du moteur, par exemple après une
passe de Compaction gérée par le moteur. Les hôtes peuvent préserver les métadonnées d’appel d’outil, la forme
des entrées et les résultats d’outils expurgés dans une projection d’amorçage du fil afin que les nouveaux
fils de discussion de backend conservent la continuité des outils sans copier les charges utiles brutes
contenant des secrets.

Si votre moteur ne prend **pas** en charge l’algorithme de Compaction, conservez l’implémentation de `compact()`
et déléguez-la explicitement :

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Ajout d’une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de plugins par un accès privé à ses éléments internes. Ajoutez la capacité manquante.

Séquence recommandée :

1. **Définissez le contrat du cœur.** Déterminez les comportements partagés que le cœur doit prendre en charge :
   stratégie, solution de repli, fusion de la configuration, cycle de vie, sémantique destinée aux canaux et
   forme de l’utilitaire d’exécution.
2. **Ajoutez des surfaces typées d’enregistrement et d’exécution des plugins.** Étendez
   `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface typée
   utile pour cette capacité.
3. **Connectez le cœur et les consommateurs de canal ou de fonctionnalité.** Les canaux et les plugins de fonctionnalité
   doivent utiliser la nouvelle capacité par l’intermédiaire du cœur, et non en important directement
   l’implémentation d’un fournisseur.
4. **Enregistrez les implémentations des fournisseurs.** Les plugins de fournisseurs enregistrent ensuite leurs
   backends pour cette capacité.
5. **Ajoutez une couverture du contrat.** Ajoutez des tests afin que la propriété et la forme de l’enregistrement
   restent explicites au fil du temps.

C’est ainsi qu’OpenClaw conserve des choix de conception affirmés sans intégrer en dur la vision du monde d’un
fournisseur. Consultez le [guide pratique des capacités](/fr/plugins/adding-capabilities)
pour obtenir une liste de contrôle concrète des fichiers et un exemple détaillé.

### Liste de contrôle d’une capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement modifier ensemble les
surfaces suivantes :

- types de contrat du cœur dans `src/<capability>/types.ts`
- exécuteur ou utilitaire d’exécution du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API des plugins dans `src/plugins/types.ts`
- câblage du registre des plugins dans `src/plugins/registry.ts`
- exposition de l’exécution des plugins dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité ou de canal
  doivent l’utiliser
- utilitaires de capture et de test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété et de contrat dans `src/plugins/contracts/registry.ts`
- documentation destinée aux opérateurs et aux plugins dans `docs/`

Si l’une de ces surfaces est absente, cela indique généralement que la capacité n’est
pas encore entièrement intégrée.

### Modèle de capacité

Structure minimale :

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

Structure du test de contrat (`src/plugins/contracts/registry.ts` expose des recherches de propriété
telles que `providerContractPluginIds` ; les tests vérifient que la liste
`contracts.videoGenerationProviders` d’un plugin correspond à ce qu’il enregistre réellement) :

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

La règle reste ainsi simple :

- le cœur possède le contrat et l’orchestration de la capacité
- les plugins de fournisseurs possèdent les implémentations propres aux fournisseurs
- les plugins de fonctionnalité ou de canal utilisent les utilitaires d’exécution
- les tests de contrat maintiennent la propriété explicite

## Voir aussi

- [Architecture des plugins](/fr/plugins/architecture) — modèle public des capacités et structures
- [Sous-chemins du SDK des plugins](/fr/plugins/sdk-subpaths)
- [Configuration du SDK des plugins](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
