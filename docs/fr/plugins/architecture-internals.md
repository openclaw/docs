---
read_when:
    - Implémentation des hooks d’exécution des fournisseurs, du cycle de vie des canaux ou des ensembles de paquets
    - Débogage de l’ordre de chargement des Plugins ou de l’état du registre
    - Ajout d’une nouvelle fonctionnalité de Plugin ou d’un Plugin de moteur de contexte
summary: 'Fonctionnement interne de l’architecture des Plugins : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: Fonctionnement interne de l’architecture des Plugins
x-i18n:
    generated_at: "2026-07-12T02:48:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Pour le modèle public de capacités, les structures de Plugin et les contrats de propriété et d’exécution, consultez [Architecture des Plugins](/fr/plugins/architecture). Cette page couvre les mécanismes internes : pipeline de chargement, registre, hooks d’exécution, routes HTTP du Gateway, chemins d’importation et tables de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw effectue approximativement les opérations suivantes :

1. découvrir les racines de Plugins candidates
2. lire les manifestes de paquets natifs ou compatibles et les métadonnées des paquets
3. rejeter les candidats non sécurisés
4. normaliser la configuration des Plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. déterminer l’activation de chaque candidat
6. charger les modules natifs activés : les modules intégrés compilés utilisent un chargeur natif ;
   le code source TypeScript local tiers utilise le mécanisme de secours Jiti d’urgence
7. appeler les hooks natifs `register(api)` et collecter les enregistrements dans le registre des Plugins
8. exposer le registre aux commandes et aux surfaces d’exécution

<Note>
`activate` est un alias historique de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même stade. Tous les Plugins intégrés utilisent `register` ; privilégiez `register` pour les nouveaux Plugins.
</Note>

Les contrôles de sécurité s’exécutent **avant** l’exécution du code. La découverte bloque un candidat lorsque :

- son point d’entrée résolu sort de la racine du Plugin
- son chemin (ou son répertoire racine) est accessible en écriture par tous
- pour les Plugins non intégrés, le propriétaire du chemin ne correspond pas à l’uid actuel (ou à root)

Pour les répertoires intégrés accessibles en écriture par tous, une tentative de réparation `chmod` sur place est d’abord effectuée (les installations npm/globales peuvent fournir des répertoires de paquets avec les permissions `0777`) avant une nouvelle vérification ; les contrôles de propriété sont entièrement ignorés pour les origines intégrées.

Les candidats bloqués conservent néanmoins leur identifiant de Plugin dans le diagnostic émis lorsqu’il est connu (y compris les identifiants résolus depuis un manifeste situé dans un répertoire par ailleurs rejeté). Ainsi, une configuration faisant référence à cet identifiant voit un Plugin bloqué associé à un avertissement de sécurité du chemin plutôt qu’une erreur sans rapport indiquant un « Plugin inconnu ».

### Comportement privilégiant le manifeste

Le manifeste constitue la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le Plugin
- découvrir les canaux, Skills, schémas de configuration ou capacités du paquet déclarés
- valider `plugins.entries.<id>.config`
- enrichir les libellés et textes indicatifs de la Control UI
- afficher les métadonnées d’installation et de catalogue
- conserver des descripteurs légers d’activation et de configuration sans charger le code d’exécution du Plugin

Pour les Plugins natifs, le module d’exécution constitue la partie plan de données. Il enregistre les comportements réels, tels que les hooks, les outils, les commandes ou les flux de fournisseurs.

Les blocs facultatifs `activation` et `setup` du manifeste restent dans le plan de contrôle. Il s’agit uniquement de descripteurs de métadonnées destinés à la planification de l’activation et à la découverte de la configuration ; ils ne remplacent ni l’enregistrement à l’exécution, ni `register(...)`, ni `setupEntry`. Les consommateurs d’activation en direct utilisent les indications du manifeste concernant les commandes, les canaux et les fournisseurs afin de restreindre le chargement des Plugins avant une matérialisation plus large du registre :

- le chargement par la CLI se limite aux Plugins qui possèdent la commande principale demandée
- la configuration des canaux et la résolution des Plugins se limitent aux Plugins qui possèdent l’identifiant de canal demandé
- la configuration explicite d’un fournisseur et sa résolution à l’exécution se limitent aux Plugins qui possèdent l’identifiant de fournisseur demandé
- la planification du démarrage du Gateway utilise `activation.onStartup` pour les importations explicites au démarrage ; les Plugins dépourvus de métadonnées de démarrage ne sont chargés que par des déclencheurs d’activation plus ciblés

Le planificateur d’activation expose à la fois une API limitée aux identifiants pour les appelants existants et une API de planification pour les diagnostics. Les entrées du plan indiquent pourquoi un Plugin a été sélectionné, en distinguant les indications explicites `activation.*` du mécanisme de secours fondé sur la propriété déclarée dans le manifeste :

| Motif (issu des indications `activation.*`) | Motif (issu de la propriété déclarée dans le manifeste)                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`             | —                                                                                            |
| `activation-capability-hint`                | —                                                                                            |
| `activation-channel-hint`                   | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`                   | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`                  | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`                     | —                                                                                            |
| — (le déclencheur de hook n’a pas de variante d’indication) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

Cette distinction des motifs constitue la limite de compatibilité : les métadonnées de Plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter les indications générales ou les comportements de secours sans modifier la sémantique de chargement à l’exécution.

Les préchargements à l’exécution effectués au moment d’une requête et demandant la portée générale `all` continuent de dériver un ensemble explicite d’identifiants de Plugins effectifs à partir de la configuration, de la planification du démarrage, des canaux configurés, des emplacements et des règles d’activation automatique (`resolveEffectivePluginIds` dans `src/plugins/effective-plugin-ids.ts`). Si cet ensemble dérivé est vide, OpenClaw conserve une portée vide au lieu de l’élargir à tous les Plugins découvrables.

La découverte de la configuration privilégie les identifiants possédés par les descripteurs, tels que `setup.providers` et `setup.cliBackends`, afin de restreindre les Plugins candidats avant de revenir à `setup-api` pour les Plugins qui nécessitent encore des hooks d’exécution pendant la configuration. Les listes de configuration des fournisseurs utilisent les éléments `providerAuthChoices` du manifeste, les choix de configuration dérivés des descripteurs et les métadonnées du catalogue d’installation sans charger le code d’exécution du fournisseur. La valeur explicite `setup.requiresRuntime: false` impose un fonctionnement limité aux descripteurs ; l’omission de `requiresRuntime` conserve le mécanisme de secours historique `setup-api` à des fins de compatibilité. Si plusieurs Plugins découverts revendiquent le même identifiant normalisé de fournisseur de configuration ou de backend de CLI, la recherche de configuration refuse ce propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte. Lorsque le code de configuration s’exécute, les diagnostics du registre signalent les divergences entre `setup.providers` / `setup.cliBackends` et les fournisseurs ou backends de CLI effectivement enregistrés par `setup-api`, sans bloquer les Plugins historiques.

### Limite du cache des Plugins

OpenClaw ne met pas en cache les résultats de découverte des Plugins ni les données directes du registre des manifestes derrière des fenêtres temporelles. Les installations, les modifications des manifestes et les changements de chemins de chargement doivent devenir visibles lors de la prochaine lecture explicite des métadonnées ou reconstruction d’un instantané. L’analyseur de fichiers manifestes conserve un cache limité de signatures de fichiers, indexé par le chemin du manifeste ouvert ainsi que par le périphérique/inode, la taille et les valeurs mtime/ctime ; ce cache évite uniquement d’analyser de nouveau des octets inchangés et ne doit pas mettre en cache les réponses relatives à la découverte, au registre, au propriétaire ou aux règles.

Le chemin rapide et sûr pour les métadonnées repose sur la propriété explicite des objets, et non sur un cache caché. Les chemins critiques au démarrage du Gateway doivent transmettre le `PluginMetadataSnapshot` actuel, la `PluginLookUpTable` dérivée ou un registre de manifestes explicite tout au long de la chaîne d’appels. La validation de la configuration, l’activation automatique au démarrage, l’amorçage des Plugins et la sélection des fournisseurs peuvent réutiliser ces objets tant qu’ils représentent la configuration et l’inventaire de Plugins actuels. La recherche de configuration reconstruit toujours les métadonnées des manifestes à la demande, sauf si le chemin de configuration concerné reçoit un registre de manifestes explicite ; conservez ce mécanisme comme solution de secours pour les chemins non critiques plutôt que d’ajouter des caches de recherche cachés. Lorsque les données d’entrée changent, reconstruisez et remplacez l’instantané au lieu de le modifier ou de conserver des copies historiques. Les vues du registre actif des Plugins et les assistants d’amorçage des canaux intégrés doivent être recalculés à partir du registre ou de la racine actuels. Des tables de correspondance de courte durée sont acceptables au sein d’un même appel pour dédupliquer le travail ou empêcher une réentrée ; elles ne doivent pas devenir des caches de métadonnées à l’échelle du processus.

Pour le chargement des Plugins, la couche de cache persistante concerne le chargement à l’exécution. Elle peut réutiliser l’état du chargeur lorsque le code ou les artefacts installés sont effectivement chargés, notamment :

- `PluginLoaderCacheState` et les registres actifs compatibles à l’exécution
- les caches jiti/de modules et les caches de chargeur des surfaces publiques utilisés pour éviter d’importer plusieurs fois la même surface d’exécution
- les caches du système de fichiers pour les artefacts de Plugins installés
- les tables de correspondance de courte durée propres à un appel pour la normalisation des chemins ou la résolution des doublons

Ces caches sont des détails d’implémentation du plan de données. Ils ne doivent pas répondre à des questions du plan de contrôle telles que « quel Plugin possède ce fournisseur ? », sauf si l’appelant a délibérément demandé un chargement à l’exécution.

N’ajoutez pas de caches persistants ou temporels pour :

- les résultats de découverte
- les registres directs des manifestes
- les registres de manifestes reconstruits à partir de l’index des Plugins installés
- la recherche du propriétaire d’un fournisseur, la suppression de modèles, les règles des fournisseurs ou les métadonnées des artefacts publics
- toute autre réponse dérivée d’un manifeste pour laquelle un manifeste, un index installé ou un chemin de chargement modifié doit être visible lors de la prochaine lecture des métadonnées

Les appelants qui reconstruisent les métadonnées des manifestes à partir de l’index persistant des Plugins installés reconstruisent ce registre à la demande. L’index installé constitue un état durable du plan source ; il ne s’agit pas d’un cache caché de métadonnées en mémoire du processus.

## Modèle de registre

Les Plugins chargés ne modifient pas directement des variables globales arbitraires du cœur. Ils s’enregistrent dans un registre central de Plugins (`PluginRegistry` dans `src/plugins/registry-types.ts`), qui suit les enregistrements des Plugins (identité, source, origine, état, diagnostics), ainsi que des tableaux pour chaque capacité : outils, hooks historiques et hooks typés, canaux, fournisseurs, gestionnaires RPC du Gateway, routes HTTP, registraires de CLI, services en arrière-plan, commandes possédées par les Plugins et des dizaines d’autres familles typées de fournisseurs (parole, embeddings, génération d’images, de vidéos et de musique, récupération et recherche web, environnements d’agents, actions de session, etc.).

Les fonctionnalités du cœur lisent ensuite ce registre au lieu de communiquer directement avec les modules de Plugins. Le chargement reste ainsi unidirectionnel :

- module de Plugin -> enregistrement dans le registre
- exécution du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur ne nécessitent qu’un seul point d’intégration : « lire le registre », plutôt que « traiter chaque module de Plugin comme un cas particulier ».

## Rappels de liaison de conversation

Les Plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un rappel après l’approbation ou le refus d’une demande de liaison :

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

Champs de la charge utile du rappel :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indication de dissociation, l’identifiant de l’expéditeur et les métadonnées de la conversation

Ce rappel sert uniquement de notification. Il ne modifie pas les personnes autorisées à lier une conversation et s’exécute une fois le traitement de l’approbation par le cœur terminé.

## Hooks d’exécution des fournisseurs

Les Plugins de fournisseurs comportent trois couches :

- **Métadonnées du manifeste** pour une recherche légère avant l’exécution :
  `setup.providers[].envVars`, l’élément de compatibilité obsolète `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks lors de la configuration** : `catalog` (anciennement `discovery`) ainsi que
  `applyConfigDefaults`.
- **Hooks d’exécution** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution des modèles,
  l’encapsulation des flux, les niveaux de raisonnement, les règles de relecture et les points de terminaison d’utilisation. Consultez
  [Ordre et utilisation des hooks](#hook-order-and-usage).

OpenClaw reste responsable de la boucle d’agent générique, du basculement, du traitement des transcriptions et des règles relatives aux outils. Ces hooks constituent la surface d’extension destinée aux comportements propres aux fournisseurs, sans nécessiter un transport d’inférence entièrement personnalisé.

Utilisez `setup.providers[].envVars` dans le manifeste lorsque le fournisseur dispose d’identifiants basés sur des variables d’environnement que les parcours génériques d’authentification, d’état et de sélection de modèle doivent pouvoir consulter sans charger l’exécution du Plugin. Le champ obsolète `providerAuthEnvVars` reste lu par l’adaptateur de compatibilité pendant la période d’abandon progressif, et les plugins non intégrés qui l’utilisent reçoivent un diagnostic de manifeste. Utilisez `providerAuthAliases` dans le manifeste lorsqu’un identifiant de fournisseur doit réutiliser les variables d’environnement, les profils d’authentification, l’authentification issue de la configuration et le choix d’intégration par clé d’API d’un autre identifiant de fournisseur. Utilisez `providerAuthChoices` dans le manifeste lorsque les interfaces CLI d’intégration et de choix d’authentification doivent connaître l’identifiant du choix du fournisseur, les libellés de groupe et la configuration simple de l’authentification par un seul indicateur, sans charger l’exécution du fournisseur. Conservez les `envVars` de l’exécution du fournisseur pour les indications destinées aux opérateurs, telles que les libellés d’intégration ou les variables de configuration de l’identifiant et du secret client OAuth.

Utilisez `channelEnvVars` dans le manifeste lorsqu’un canal dispose d’une authentification ou d’une configuration pilotée par des variables d’environnement que la solution de repli générique vers l’environnement de l’interpréteur de commandes, les vérifications de configuration ou d’état, ou les invites de configuration doivent pouvoir consulter sans charger l’exécution du canal.

### Ordre et utilisation des hooks

Pour les plugins de modèle ou de fournisseur, OpenClaw appelle les hooks approximativement dans cet ordre.
La colonne « Quand l’utiliser » constitue le guide de décision rapide.
Les champs de fournisseur réservés à la compatibilité qu’OpenClaw n’appelle plus, tels que `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont volontairement pas répertoriés ici.

| Hook                              | Fonction                                                                                                                        | Quand l’utiliser                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publie la configuration du fournisseur dans `models.providers` lors de la génération de `models.json`                          | Le fournisseur possède un catalogue ou définit les valeurs par défaut de l’URL de base                                                                                            |
| `applyConfigDefaults`             | Applique les valeurs par défaut de la configuration globale propres au fournisseur lors de la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de la famille de modèles du fournisseur                                       |
| _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal du registre/catalogue                                                                  | _(ce n’est pas un hook de Plugin)_                                                                                                                                                |
| `normalizeModelId`                | Normalise les alias d’identifiants de modèle hérités ou en préversion avant la recherche                                        | Le fournisseur gère le nettoyage des alias avant la résolution canonique du modèle                                                                                                |
| `normalizeTransport`              | Normalise les valeurs `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle                    | Le fournisseur gère le nettoyage du transport pour les identifiants de fournisseur personnalisés appartenant à la même famille de transport                                      |
| `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution de l’exécution/du fournisseur                                             | Le fournisseur nécessite un nettoyage de la configuration qui doit résider dans le Plugin ; les utilitaires intégrés de la famille Google prennent également en charge les entrées de configuration Google compatibles |
| `applyNativeStreamingUsageCompat` | Applique aux fournisseurs configurés les réécritures de compatibilité de l’utilisation en streaming natif                       | Le fournisseur nécessite des corrections, pilotées par le point de terminaison, des métadonnées d’utilisation en streaming natif                                                 |
| `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement des fournisseurs configurés avant le chargement de l’authentification à l’exécution | Les fournisseurs exposent leurs propres hooks de résolution de clé API par marqueur d’environnement                                                                               |
| `resolveSyntheticAuth`            | Expose une authentification locale/auto-hébergée ou issue de la configuration sans conserver de texte en clair                  | Le fournisseur peut fonctionner avec un marqueur d’identifiant d’authentification synthétique/local                                                                               |
| `resolveExternalAuthProfiles`     | Superpose les profils d’authentification externes propres au fournisseur ; la valeur par défaut de `persistence` est `runtime-only` pour les identifiants gérés par la CLI/l’application | Le fournisseur réutilise des identifiants d’authentification externes sans conserver de copies des jetons d’actualisation ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| `shouldDeferSyntheticProfileAuth` | Abaisse la priorité des espaces réservés de profils synthétiques enregistrés au profit de l’authentification issue de l’environnement/de la configuration | Le fournisseur stocke des profils synthétiques servant d’espaces réservés qui ne doivent pas être prioritaires                                                                    |
| `resolveDynamicModel`             | Solution de repli synchrone pour les identifiants de modèles propres au fournisseur qui ne figurent pas encore dans le registre local | Le fournisseur accepte des identifiants de modèles amont arbitraires                                                                                                               |
| `prepareDynamicModel`             | Effectue une préparation asynchrone, puis exécute de nouveau `resolveDynamicModel`                                               | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                                                          |
| `normalizeResolvedModel`          | Effectue la réécriture finale avant que l’exécuteur intégré utilise le modèle résolu                                            | Le fournisseur nécessite des réécritures du transport, mais utilise toujours un transport du cœur                                                                                 |
| `normalizeToolSchemas`            | Normalise les schémas d’outils avant qu’ils soient transmis à l’exécuteur intégré                                               | Le fournisseur nécessite un nettoyage des schémas propre à la famille de transport                                                                                                |
| `inspectToolSchemas`              | Expose les diagnostics de schéma propres au fournisseur après la normalisation                                                  | Le fournisseur souhaite des avertissements sur les mots-clés sans intégrer de règles propres au fournisseur dans le cœur                                                          |
| `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie du raisonnement natif ou balisé                                                                | Le fournisseur nécessite une sortie de raisonnement/finale balisée plutôt que des champs natifs                                                                                   |
| `prepareExtraParams`              | Normalise les paramètres de requête avant les enveloppes génériques d’options de flux                                           | Le fournisseur nécessite des paramètres de requête par défaut ou un nettoyage des paramètres propre au fournisseur                                                               |
| `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                                    | Le fournisseur nécessite un protocole filaire personnalisé, et non une simple enveloppe                                                                                           |
| `wrapStreamFn`                    | Enveloppe le flux après l’application des enveloppes génériques                                                                 | Le fournisseur nécessite des enveloppes de compatibilité pour les en-têtes, le corps ou le modèle de la requête, sans transport personnalisé                                     |
| `resolveTransportTurnState`       | Ajoute des en-têtes ou des métadonnées de transport natifs propres à chaque tour                                                | Le fournisseur souhaite que les transports génériques envoient l’identité de tour native du fournisseur                                                                          |
| `resolveWebSocketSessionPolicy`   | Ajoute des en-têtes WebSocket natifs ou une stratégie de délai de récupération de session                                       | Le fournisseur souhaite que les transports WebSocket génériques ajustent les en-têtes de session ou la stratégie de repli                                                        |
| `formatApiKey`                    | Formateur de profil d’authentification : le profil enregistré devient la chaîne `apiKey` à l’exécution                          | Le fournisseur stocke des métadonnées d’authentification supplémentaires et nécessite une forme personnalisée de jeton à l’exécution                                              |
| `refreshOAuth`                    | Remplace l’actualisation OAuth pour les points de terminaison personnalisés ou la stratégie d’échec d’actualisation             | Le fournisseur n’est pas compatible avec les mécanismes d’actualisation partagés d’OpenClaw                                                                                       |
| `buildAuthDoctorHint`             | Ajoute une indication de réparation en cas d’échec de l’actualisation OAuth                                                     | Le fournisseur nécessite des instructions de réparation de l’authentification qui lui sont propres après un échec d’actualisation                                                |
| `matchesContextOverflowError`     | Détecteur propre au fournisseur des dépassements de fenêtre de contexte                                                         | Le fournisseur renvoie des erreurs brutes de dépassement que les heuristiques génériques ne détecteraient pas                                                                     |
| `classifyFailoverReason`          | Classification propre au fournisseur des motifs de basculement                                                                 | Le fournisseur peut associer les erreurs brutes d’API/de transport à une limitation de débit, une surcharge, etc.                                                                |
| `isCacheTtlEligible`              | Stratégie de cache des prompts pour les fournisseurs proxy/de liaison                                                           | Le fournisseur nécessite une condition d’application du TTL du cache propre au proxy                                                                                              |
| `buildMissingAuthMessage`         | Remplace le message générique de récupération en cas d’authentification manquante                                               | Le fournisseur nécessite une indication de récupération propre au fournisseur en cas d’authentification manquante                                                               |
| `augmentModelCatalog`             | Ajoute des lignes synthétiques/finales au catalogue après la découverte (obsolète, voir ci-dessous)                             | Le fournisseur nécessite des lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                                                     |
| `resolveThinkingProfile`          | Définit l’ensemble des niveaux `/think`, les libellés d’affichage et la valeur par défaut propres au modèle                     | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour les modèles sélectionnés                                                                  |
| `isBinaryThinking`                | Hook de compatibilité pour l’activation/la désactivation du raisonnement                                                       | Le fournisseur expose uniquement une activation/désactivation binaire de la réflexion                                                                                            |
| `supportsXHighThinking`           | Hook de compatibilité pour la prise en charge du raisonnement `xhigh`                                                           | Le fournisseur souhaite activer `xhigh` uniquement pour un sous-ensemble de modèles                                                                                               |
| `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                                        | Le fournisseur gère la stratégie `/think` par défaut d’une famille de modèles                                                                                                     |
| `isModernModelRef`                | Détecteur de modèles modernes pour les filtres de profils actifs et la sélection des tests de fumée                            | Le fournisseur gère la correspondance avec les modèles privilégiés pour les tests actifs/de fumée                                                                                 |
| `prepareRuntimeAuth`              | Échange un identifiant d’authentification configuré contre le jeton/la clé réellement utilisé à l’exécution juste avant l’inférence | Le fournisseur nécessite un échange de jeton ou un identifiant de requête à courte durée de vie                                                                                    |
| `resolveUsageAuth`                | Résout les identifiants d’utilisation/de facturation pour `/usage` et les surfaces d’état associées                            | Le fournisseur nécessite une analyse personnalisée des jetons d’utilisation/quota ou un identifiant d’utilisation différent                                                      |
| `fetchUsageSnapshot`              | Récupère et normalise les instantanés d’utilisation/quota propres au fournisseur après la résolution de l’authentification      | Le fournisseur nécessite un point de terminaison d’utilisation propre au fournisseur ou un analyseur de charge utile                                                             |
| `createEmbeddingProvider`         | Créer un adaptateur d’embeddings appartenant au fournisseur pour la mémoire/la recherche                                      | Le comportement des embeddings de mémoire relève du Plugin fournisseur                                                                                  |
| `buildReplayPolicy`               | Renvoyer une politique de relecture contrôlant la gestion de la transcription pour le fournisseur                            | Le fournisseur nécessite une politique de transcription personnalisée (par exemple, la suppression des blocs de raisonnement)                         |
| `sanitizeReplayHistory`           | Réécrire l’historique de relecture après le nettoyage générique de la transcription                                           | Le fournisseur nécessite des réécritures de relecture qui lui sont propres, au-delà des utilitaires de Compaction partagés                            |
| `validateReplayTurns`             | Effectuer la validation ou la restructuration finale des tours de relecture avant l’exécuteur intégré                         | Le transport du fournisseur nécessite une validation plus stricte des tours après l’assainissement générique                                          |
| `onModelSelected`                 | Exécuter les effets secondaires postérieurs à la sélection qui relèvent du fournisseur                                       | Le fournisseur nécessite de la télémétrie ou un état qui lui est propre lorsqu’un modèle devient actif                                                |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin de fournisseur correspondant, puis parcourent les autres Plugins de fournisseur
prenant en charge les hooks jusqu’à ce que l’un d’eux modifie réellement l’identifiant
du modèle, le transport ou la configuration. Cela permet aux adaptateurs de
fournisseur d’alias ou de compatibilité de continuer à fonctionner sans que l’appelant
ait besoin de savoir quel Plugin intégré est responsable de la réécriture. Si aucun
hook de fournisseur ne réécrit une entrée de configuration prise en charge de la
famille Google, le normalisateur de configuration Google intégré applique tout de
même ce nettoyage de compatibilité.

Si le fournisseur nécessite un protocole filaire entièrement personnalisé ou un
exécuteur de requêtes personnalisé, il s’agit d’une autre catégorie d’extension. Ces
hooks sont destinés au comportement des fournisseurs qui s’exécute toujours dans la
boucle d’inférence normale d’OpenClaw.

`resolveUsageAuth` détermine si OpenClaw doit appeler `fetchUsageSnapshot` ou
revenir à la résolution générique des identifiants pour les interfaces d’utilisation
et d’état. Renvoyez `{ token, accountId?, subscriptionType?, rateLimitTier? }`
lorsque le fournisseur dispose d’un identifiant d’utilisation (les métadonnées
facultatives du forfait sont transmises à `fetchUsageSnapshot`), renvoyez
`{ handled: true }` lorsque l’authentification d’utilisation gérée par le fournisseur
a traité la requête et doit empêcher le repli générique vers une clé d’API ou OAuth,
et renvoyez `null` ou `undefined` lorsque le fournisseur n’a pas traité
l’authentification d’utilisation.

Déclarez les identifiants d’organisation ou de facturation dans
`providerUsageAuthEnvVars` du manifeste. Cela permet aux mécanismes génériques de
détection et de nettoyage des secrets de les reconnaître sans en faire des candidats
à l’authentification d’inférence.

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

Les Plugins de fournisseur intégrés combinent les hooks ci-dessus pour répondre aux
besoins de chaque fournisseur en matière de catalogue, d’authentification, de
raisonnement, de relecture et d’utilisation. L’ensemble de hooks faisant autorité
réside avec chaque Plugin sous `extensions/` ; cette page illustre leurs structures
plutôt que de reproduire la liste.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI et xAI enregistrent `catalog` ainsi que
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les
    identifiants de modèles en amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi et z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` afin de gérer l’échange de jetons et l’intégration de
    `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs
    d’adopter une politique de transcription via `buildReplayPolicy`, au lieu que
    chaque Plugin réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent uniquement `catalog` et utilisent la boucle
    d’inférence partagée.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` résident dans
    l’interface publique `api.ts` / `contract-api.ts` du Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Assistants d’exécution

Les Plugins peuvent accéder à certains assistants du cœur via `api.runtime`. Pour
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

- `textToSpeech` renvoie la charge utile de sortie TTS normale du cœur pour les interfaces de fichiers et de notes vocales.
- Utilise la configuration centrale `messages.tts` et la sélection du fournisseur.
- Renvoie un tampon audio PCM et une fréquence d’échantillonnage. Les Plugins doivent rééchantillonner et encoder les données pour les fournisseurs.
- `listVoices` est facultatif pour chaque fournisseur. Utilisez-le pour les sélecteurs de voix ou les parcours de configuration propres au fournisseur.
- Le cœur transmet une échéance de requête résolue aux hooks `listVoices` des fournisseurs ; les paramètres de délai d’expiration propres au fournisseur peuvent la remplacer.
- Les listes de voix peuvent inclure des métadonnées plus riches, telles que la langue, le genre et des étiquettes de personnalité, pour les sélecteurs tenant compte du fournisseur.
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
- Utilisez les fournisseurs vocaux pour le comportement de synthèse propre au fournisseur.
- L’entrée Microsoft héritée `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de responsabilité privilégié est organisé par entreprise : un seul Plugin de fournisseur peut gérer les fournisseurs de texte, de parole, d’image et de futurs médias à mesure qu’OpenClaw ajoute ces contrats de capacités.

Pour la compréhension des images, de l’audio et de la vidéo, les Plugins enregistrent
un fournisseur typé de compréhension multimédia plutôt qu’un ensemble générique de
paires clé-valeur :

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

- Conservez l’orchestration, le repli, la configuration et le raccordement aux canaux dans le cœur.
- Conservez le comportement propre au fournisseur dans le Plugin de fournisseur.
- Les extensions additives doivent rester typées : nouvelles méthodes facultatives, nouveaux champs de résultat facultatifs et nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur gère le contrat de capacité et l’assistant d’exécution
  - les Plugins de fournisseur enregistrent `api.registerVideoGenerationProvider(...)`
  - les Plugins de fonctionnalité ou de canal utilisent `api.runtime.videoGeneration.*`

Pour les assistants d’exécution de compréhension multimédia, les Plugins peuvent
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

Pour la transcription audio, les Plugins peuvent utiliser soit l’environnement
d’exécution de compréhension multimédia, soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est l’interface partagée privilégiée pour la compréhension des images, de l’audio et de la vidéo.
- `extractStructuredWithModel(...)` est l’interface destinée aux Plugins pour une extraction bornée, axée sur les images et gérée par le fournisseur. Incluez au moins une entrée d’image ; les entrées textuelles fournissent un contexte complémentaire. Les Plugins produit gèrent leurs routes et leurs schémas, tandis qu’OpenClaw gère la frontière entre le fournisseur et l’environnement d’exécution.
- Utilise la configuration audio centrale de compréhension multimédia (`tools.media.audio`) et l’ordre de repli des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu’aucune transcription n’est produite, par exemple pour une entrée ignorée ou non prise en charge.
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

Les Plugins peuvent également lancer des exécutions de sous-agents en arrière-plan
via `api.runtime.subagent` :

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

- `provider` et `model` sont des substitutions facultatives propres à chaque exécution, et non des modifications persistantes de la session.
- OpenClaw n’honore ces champs de substitution que pour les appelants de confiance.
- Pour les exécutions de repli gérées par un Plugin, les opérateurs doivent les autoriser avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour limiter les Plugins de confiance à des cibles canoniques `provider/model` précises, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agents provenant de Plugins non fiables continuent de fonctionner, mais les demandes de substitution sont rejetées au lieu d’utiliser silencieusement un repli.
- Les sessions de sous-agents créées par un Plugin sont étiquetées avec l’identifiant du Plugin créateur. La méthode de repli `api.runtime.subagent.deleteSession(...)` ne peut supprimer que ces sessions détenues ; la suppression de sessions arbitraires nécessite toujours une requête Gateway avec une portée d’administration.

Pour la recherche sur le Web, les Plugins peuvent utiliser l’assistant d’exécution
partagé au lieu d’accéder directement au raccordement des outils de l’agent :

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

Les Plugins peuvent également enregistrer des fournisseurs de recherche sur le Web
via `api.registerWebSearchProvider(...)`.

Remarques :

- Conservez la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes dans le cœur.
- Utilisez les fournisseurs de recherche sur le Web pour les transports de recherche propres au fournisseur.
- `api.runtime.webSearch.*` est l’interface partagée privilégiée pour les Plugins de fonctionnalité ou de canal qui nécessitent une fonction de recherche sans dépendre de l’adaptateur d’outil de l’agent.

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

- `path` : chemin de la route sur le serveur HTTP du Gateway.
- `auth` : obligatoire, `"gateway"` ou `"plugin"`. Utilisez `"gateway"` pour exiger l’authentification normale du Gateway, ou `"plugin"` pour une authentification ou une vérification de Webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `handleUpgrade` : gestionnaire facultatif pour les requêtes de mise à niveau WebSocket sur la même route.
- `replaceExisting` : facultatif. Autorise le même plugin à remplacer son propre enregistrement de route existant.
- `handler` : renvoyez `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez plutôt `api.registerHttpRoute(...)`.
- Les routes des plugins doivent déclarer explicitement `auth`.
- Les conflits portant sur une même combinaison `path + match` sont rejetés sauf avec `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Les chaînes de repli `exact`/`prefix` doivent uniquement utiliser le même niveau d’authentification.
- Les routes avec `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d’exécution de l’opérateur. Elles sont destinées aux Webhooks et à la vérification des signatures gérés par les plugins, et non aux appels privilégiés aux fonctions auxiliaires du Gateway.
- Les routes avec `auth: "gateway"` s’exécutent dans une portée d’exécution de requête du Gateway. La surface par défaut (`gatewayRuntimeScopeSurface: "write-default"`) est volontairement restrictive :
  - l’authentification par secret partagé de type bearer (`gateway.auth.mode = "token"` / `"password"`) et toute méthode d’authentification autre que par proxy de confiance obtiennent une unique portée `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les appelants `trusted-proxy` sans en-tête `x-openclaw-scopes` explicite conservent également l’ancienne surface limitée à `operator.write`
  - les appelants `trusted-proxy` qui envoient `x-openclaw-scopes` obtiennent à la place les portées déclarées
  - une route peut choisir `gatewayRuntimeScopeSurface: "trusted-operator"` afin de toujours respecter `x-openclaw-scopes` pour les modes d’authentification associés à une identité (avec repli sur l’ensemble complet des portées par défaut de la CLI lorsque l’en-tête est absent)
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par le Gateway constitue implicitement une surface d’administration. Si votre route nécessite un comportement réservé aux administrateurs, choisissez la surface de portée `trusted-operator`, exigez un mode d’authentification associé à une identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.
- Après la correspondance de la route et l’authentification, les gestionnaires ordinaires participent au contrôle d’admission du travail racine du Gateway. Un Gateway préparé ou en cours de redémarrage renvoie `503` avant d’appeler le gestionnaire. La seule exception restreinte est une route avec `auth: "gateway"`, autorisée par le manifeste, qui choisit également la surface `trusted-operator` propre à la route ; elle reste accessible afin que la distribution des commandes de suspension ne soit pas bloquée, tandis que les routes sœurs ordinaires du même plugin restent derrière la limite d’admission. La propriété WebSocket de `handleUpgrade` utilise la même limite d’admission atomique ; dès que le gestionnaire accepte un socket, la durée de vie ultérieure de celui-ci relève du plugin et n’est pas suivie par cette limite.

## Chemins d’importation du SDK des plugins

Utilisez les sous-chemins ciblés du SDK plutôt que le barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux plugins. Sous-chemins principaux :

| Sous-chemin                          | Objectif                                            |
| ------------------------------------ | --------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Primitives d’enregistrement des plugins             |
| `openclaw/plugin-sdk/channel-core`   | Fonctions auxiliaires d’entrée et de création de canaux |
| `openclaw/plugin-sdk/core`           | Fonctions auxiliaires génériques partagées et contrat global |
| `openclaw/plugin-sdk/config-schema`  | Schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |

Les plugins de canaux choisissent parmi une famille d’interfaces ciblées — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit être regroupé
dans un seul contrat `approvalCapability`, au lieu d’être réparti entre des
champs de plugin sans rapport. Consultez [Plugins de canaux](/fr/plugins/sdk-channel-plugins).

Les fonctions auxiliaires d’exécution et de configuration se trouvent sous les sous-chemins ciblés
`*-runtime` correspondants (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Préférez `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` et `config-mutation`
au barrel de compatibilité général `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
les petites façades auxiliaires de canaux, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
et `openclaw/plugin-sdk/infra-runtime` sont des adaptateurs de compatibilité obsolètes destinés aux
anciens plugins. Le nouveau code doit plutôt importer des primitives génériques plus ciblées.
</Info>

Points d’entrée internes au dépôt (à la racine du paquet de chaque plugin intégré) :

- `index.js` — point d’entrée du plugin intégré
- `api.js` — barrel des fonctions auxiliaires et des types
- `runtime-api.js` — barrel réservé à l’exécution
- `setup-entry.js` — point d’entrée de configuration du plugin

Les plugins externes doivent uniquement importer les sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le chemin `src/*` du paquet d’un autre plugin depuis le cœur ou un autre plugin.
Les points d’entrée chargés par une façade privilégient l’instantané actif de la configuration d’exécution lorsqu’il
existe, puis se rabattent sur le fichier de configuration résolu sur le disque.

Les sous-chemins propres à une capacité, tels que `image-generation`, `media-understanding`
et `speech`, existent parce que les plugins intégrés les utilisent actuellement. Ils ne constituent pas
automatiquement des contrats externes figés à long terme — consultez la page de référence du SDK
concernée avant de vous appuyer sur eux.

## Schémas de l’outil de messagerie

Les plugins doivent prendre en charge les contributions de schéma `describeMessageTool(...)`
propres aux canaux pour les primitives autres que les messages, telles que les réactions, les lectures et les sondages.
La présentation partagée des envois doit utiliser le contrat générique `MessagePresentation`
au lieu de champs de boutons, composants, blocs ou cartes propres aux fournisseurs.
Consultez [Présentation des messages](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, la correspondance avec les fournisseurs et la liste de contrôle destinée aux auteurs de plugins.

Les plugins capables d’envoyer des messages déclarent ce qu’ils peuvent afficher au moyen des capacités de messagerie :

- `presentation` pour les blocs de présentation sémantiques (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il doit afficher la présentation de manière native ou la dégrader en texte.
N’exposez pas de mécanismes d’échappement d’interface utilisateur propres aux fournisseurs depuis l’outil de messagerie générique.
Les fonctions auxiliaires obsolètes du SDK pour les anciens schémas natifs restent exportées pour les plugins
tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canaux doivent prendre en charge la sémantique des cibles propre à chaque canal. Gardez l’hôte
sortant partagé générique et utilisez la surface de l’adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` détermine si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant plutôt qu’à une recherche dans l’annuaire.
- `messaging.targetResolver.reservedLiterals` répertorie les mots nus qui constituent des
  références à un canal ou à une session pour ce fournisseur. La résolution conserve les entrées d’annuaire
  configurées avant de rejeter les littéraux réservés, puis échoue de manière fermée si la recherche dans
  l’annuaire n’aboutit pas.
- `messaging.targetResolver.resolveTarget(...)` constitue le mécanisme de repli du plugin lorsque
  le cœur a besoin d’une résolution finale appartenant au fournisseur après la normalisation ou après
  l’échec d’une recherche dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` prend en charge la construction de la route de session
  propre au fournisseur une fois la cible résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent intervenir avant
  la recherche de correspondants ou de groupes.
- Utilisez `looksLikeId` pour les vérifications du type « traiter ceci comme un identifiant de cible explicite ou natif ».
- Utilisez `resolveTarget` comme mécanisme de repli de normalisation propre au fournisseur, et non pour
  une recherche générale dans l’annuaire.
- Conservez les identifiants natifs du fournisseur, tels que les identifiants de discussion, de fil de discussion, les JID, les pseudonymes et les identifiants
  de salon, dans les valeurs `target` ou les paramètres propres au fournisseur, et non dans les champs génériques
  du SDK.

## Annuaires fondés sur la configuration

Les plugins qui dérivent des entrées d’annuaire de la configuration doivent conserver cette logique dans le
plugin et réutiliser les fonctions auxiliaires partagées de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cette approche lorsqu’un canal nécessite des correspondants ou groupes issus de la configuration, tels que :

- les correspondants de messages privés déterminés par une liste d’autorisation
- les mappages configurés de canaux ou de groupes
- les mécanismes de repli d’annuaire statiques limités à un compte

Les fonctions auxiliaires partagées de `directory-runtime` prennent uniquement en charge les opérations génériques :

- filtrage des requêtes
- application des limites
- fonctions auxiliaires de déduplication et de normalisation
- création de `ChannelDirectoryEntry[]`

L’inspection des comptes et la normalisation des identifiants propres à chaque canal doivent rester dans
l’implémentation du plugin.

## Catalogues des fournisseurs

Les plugins de fournisseurs peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même structure que celle écrite par OpenClaw dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseurs

Utilisez `catalog` lorsque le plugin prend en charge les identifiants de modèles propres au fournisseur, les valeurs par défaut
de l’URL de base ou les métadonnées de modèles soumises à une authentification.

`catalog.order` détermine le moment où le catalogue d’un plugin est fusionné par rapport aux
fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs utilisant une simple clé d’API ou pilotés par l’environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseurs liées
- `late` : dernière passe, après les autres fournisseurs implicites

Les fournisseurs les plus tardifs l’emportent en cas de collision de clés ; les plugins peuvent donc remplacer volontairement une
entrée de fournisseur intégrée possédant le même identifiant de fournisseur.

Les plugins peuvent également publier des lignes de modèles en lecture seule au moyen de
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Il s’agit de la voie à privilégier pour les surfaces de liste, d’aide et de sélection ; elle prend en charge
les lignes `text`, `voice`, `image_generation`, `video_generation` et `music_generation`.
Les plugins de fournisseurs restent responsables des appels aux points de terminaison en direct, de l’échange des jetons et de la
correspondance des réponses du fournisseur ; le cœur prend en charge la structure commune des lignes, les libellés de source et la
mise en forme de l’aide des outils multimédias. Les enregistrements de fournisseurs de génération multimédia synthétisent
automatiquement des lignes de catalogue statiques à partir de `defaultModel`, `models` et
`capabilities`.

Compatibilité :

- `discovery` fonctionne encore comme ancien alias, mais émet un avertissement d’obsolescence
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`
  et émet un avertissement
- `augmentModelCatalog` est obsolète ; les fournisseurs intégrés doivent publier
  les lignes supplémentaires au moyen de `registerModelCatalogProvider`

## Inspection des canaux en lecture seule

Si votre plugin enregistre un canal, implémentez de préférence
`plugin.config.inspectAccount(cfg, accountId)` parallèlement à `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` correspond au chemin d’exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et échouer immédiatement lorsque les secrets requis sont absents.
- Les chemins de commandes en lecture seule, tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, ainsi que les flux de réparation de doctor ou de la configuration,
  ne doivent pas avoir à matérialiser les identifiants d’exécution uniquement pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyez uniquement un état descriptif du compte.
- Préservez `enabled` et `configured`.
- Incluez les champs de source/d’état des identifiants lorsque cela est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons uniquement pour signaler leur disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (ainsi que le champ de source correspondant) suffit pour les commandes de type état.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef, mais indisponible dans le chemin d’exécution de la commande actuelle.

Cela permet aux commandes en lecture seule d’indiquer « configuré, mais indisponible dans ce chemin d’exécution de commande » au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

## Paquets groupés

Un répertoire de Plugin peut inclure un fichier `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un Plugin. Si le paquet répertorie plusieurs extensions, l’identifiant du Plugin devient `<manifestOrPackageName>/<fileBase>` (l’identifiant du manifeste prévaut lorsqu’il est présent ; sinon, le nom non délimité par une portée du fichier `package.json` est utilisé).

Si votre Plugin importe des dépendances npm, installez-les dans ce répertoire afin que `node_modules` soit disponible (`npm install` / `pnpm install`).

Mesure de sécurité : chaque entrée `openclaw.extensions` doit rester dans le répertoire du Plugin après la résolution des liens symboliques. Les entrées qui sortent du répertoire du paquet sont rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances du Plugin avec une commande `npm install --omit=dev --ignore-scripts` locale au projet (aucun script de cycle de vie et aucune dépendance de développement à l’exécution), en ignorant les paramètres d’installation npm globaux hérités. Veillez à ce que les arborescences de dépendances des Plugins soient « exclusivement en JS/TS » et évitez les paquets qui nécessitent des compilations `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration. Lorsqu’OpenClaw a besoin des surfaces de configuration d’un Plugin de canal désactivé, ou lorsqu’un Plugin de canal est activé mais pas encore configuré, il charge `setupEntry` au lieu de l’entrée complète du Plugin. Cela allège le démarrage et la configuration lorsque l’entrée principale de votre Plugin raccorde également des outils, des hooks ou d’autres éléments de code réservés à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` peut permettre à un Plugin de canal d’utiliser le même chemin `setupEntry` pendant la phase de démarrage du Gateway précédant la mise en écoute, même lorsque le canal est déjà configuré.

Utilisez cette option uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister avant que le Gateway commence à écouter. En pratique, cela signifie que l’entrée de configuration doit enregistrer chaque capacité appartenant au canal dont dépend le démarrage, telle que :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le Gateway commence à écouter
- toutes les méthodes, tous les outils ou tous les services du Gateway qui doivent exister pendant cette même période

Si votre entrée complète possède encore une capacité requise au démarrage, n’activez pas cette option. Conservez le comportement par défaut du Plugin et laissez OpenClaw charger l’entrée complète pendant le démarrage.

Les canaux intégrés peuvent également publier des fonctions d’assistance de surface contractuelle réservées à la configuration, que le cœur peut consulter avant le chargement de l’environnement d’exécution complet du canal. La surface de promotion de configuration actuelle est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration de canal historique à compte unique vers `channels.<id>.accounts.*` sans charger l’entrée complète du Plugin. Matrix constitue l’exemple intégré actuel : il déplace uniquement les clés d’authentification et d’amorçage vers un compte nommé promu lorsque des comptes nommés existent déjà, et peut préserver une clé configurée de compte par défaut non canonique au lieu de toujours créer `accounts.default`.

Ces adaptateurs de correctifs de configuration maintiennent différée la découverte des surfaces contractuelles intégrées. Le temps d’importation reste faible ; la surface de promotion n’est chargée qu’à sa première utilisation, au lieu de réexécuter le démarrage du canal intégré lors de l’importation du module.

Lorsque ces surfaces de démarrage comprennent des méthodes RPC du Gateway, conservez-les sous un préfixe propre au Plugin. Les espaces de noms d’administration du cœur (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et correspondent toujours à `operator.admin`, même si un Plugin demande une portée plus restreinte.

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

Les Plugins de canal peuvent publier des métadonnées de configuration et de découverte via `openclaw.channel`, ainsi que des indications d’installation via `openclaw.install`. Cela évite de stocker les données du catalogue dans le cœur.

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

- `detailLabel` : libellé secondaire pour les surfaces enrichies de catalogue et d’état
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : identifiants de Plugins ou de canaux de moindre priorité que cette entrée de catalogue doit devancer
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : réglages du texte de la surface de sélection
- `markdownCapable` : indique que le canal prend en charge Markdown pour les décisions de mise en forme des messages sortants
- `exposure.configured` : masque le canal dans les surfaces répertoriant les canaux configurés lorsque la valeur est `false`
- `exposure.setup` : masque le canal dans les sélecteurs interactifs de configuration lorsqu’elle est définie sur `false`
- `exposure.docs` : marque le canal comme interne ou privé pour les surfaces de navigation de la documentation
- `showConfigured` / `showInSetup` : anciens alias encore acceptés à des fins de compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : permet au canal d’utiliser le flux `allowFrom` standard de démarrage rapide
- `forceAccountBinding` : exige une association explicite du compte même lorsqu’il n’existe qu’un seul compte
- `preferSessionLookupForAnnounceTarget` : privilégie la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut également fusionner des **catalogues de canaux externes** (par exemple, une exportation de registre MPM). Déposez un fichier JSON à l’un des emplacements suivants :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers un ou plusieurs fichiers JSON (séparés par des virgules, des points-virgules ou selon `PATH`). Chaque fichier doit contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte également `"packages"` ou `"plugins"` comme anciens alias de la clé `"entries"`.

Les entrées générées du catalogue de canaux et les entrées du catalogue d’installation des fournisseurs exposent des informations normalisées sur la source d’installation à côté du bloc brut `openclaw.install`. Ces informations normalisées indiquent si la spécification npm est une version exacte ou un sélecteur flottant, si les métadonnées d’intégrité attendues sont présentes et si un chemin de source local est également disponible. Lorsque l’identité du catalogue ou du paquet est connue, les informations normalisées émettent un avertissement si le nom du paquet npm analysé diverge de cette identité. Elles émettent également un avertissement lorsque `defaultChoice` est invalide ou pointe vers une source indisponible, ainsi que lorsque des métadonnées d’intégrité npm sont présentes sans source npm valide. Les consommateurs doivent considérer `installSource` comme un champ facultatif additif afin que les entrées créées manuellement et les adaptateurs de catalogue n’aient pas à le synthétiser.
Cela permet aux procédures d’intégration et aux diagnostics d’expliquer l’état du plan des sources sans importer l’environnement d’exécution du Plugin.

Les entrées npm externes officielles doivent privilégier une valeur `npmSpec` exacte accompagnée de `expectedIntegrity`. Les noms de paquets seuls et les balises de distribution continuent de fonctionner à des fins de compatibilité, mais ils génèrent des avertissements sur le plan des sources afin que le catalogue puisse évoluer vers des installations verrouillées et vérifiées par contrôle d’intégrité sans casser les Plugins existants.
Lorsque la procédure d’intégration installe depuis un chemin de catalogue local, elle enregistre une entrée gérée dans l’index des Plugins avec `source: "path"` et, lorsque cela est possible, un `sourcePath` relatif à l’espace de travail. Le chemin de chargement opérationnel absolu reste dans `plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins du poste de travail local dans la configuration à long terme. Cela permet aux installations de développement locales de rester visibles dans les diagnostics du plan des sources sans ajouter une seconde surface de divulgation de chemins bruts du système de fichiers. La table SQLite persistante `installed_plugin_index` constitue la source de vérité des installations et peut être actualisée sans charger les modules d’exécution des Plugins.
Sa map `installRecords` est persistante même lorsqu’un manifeste de Plugin est manquant ou invalide ; sa charge utile `plugins` est une vue reconstruisible des manifestes.

## Plugins de moteur de contexte

Les Plugins de moteur de contexte prennent en charge l’orchestration du contexte de session pour l’ingestion, l’assemblage et la Compaction. Enregistrez-les depuis votre Plugin avec `api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec `plugins.slots.contextEngine`.

Utilisez cette fonctionnalité lorsque votre Plugin doit remplacer ou étendre le pipeline de contexte par défaut, plutôt que simplement ajouter une recherche en mémoire ou des hooks.

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

La fabrique `ctx` expose des valeurs facultatives `config`, `agentDir` et `workspaceDir` pour l’initialisation au moment de la construction.

`assemble()` peut renvoyer `contextProjection` lorsque le harnais actif dispose d’un fil d’exécution persistant côté backend. Omettez-le pour la projection historique à chaque tour. Renvoyez `{ mode: "thread_bootstrap", epoch }` lorsque le contexte assemblé doit être injecté une seule fois dans un fil d’exécution du backend et réutilisé jusqu’à ce que l’époque change. Modifiez l’époque après un changement sémantique du contexte du moteur, par exemple après une passe de Compaction gérée par le moteur. Les hôtes peuvent préserver les métadonnées des appels d’outils, la forme des entrées et les résultats d’outils expurgés dans une projection d’amorçage de fil afin que les nouveaux fils d’exécution du backend conservent la continuité des outils sans copier de charges utiles brutes contenant des secrets.

Si votre moteur ne prend **pas** en charge l’algorithme de Compaction, conservez l’implémentation de `compact()` et déléguez-la explicitement :

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

## Ajout d'une nouvelle capacité

Lorsqu'un plugin nécessite un comportement qui ne correspond pas à l'API actuelle, ne contournez pas
le système de plugins en accédant directement à des éléments internes privés. Ajoutez la capacité manquante.

Séquence recommandée :

1. **Définissez le contrat du cœur.** Déterminez quels comportements partagés doivent relever du cœur :
   stratégie, solution de repli, fusion de la configuration, cycle de vie, sémantique destinée aux canaux et
   forme des fonctions d'assistance à l'exécution.
2. **Ajoutez des surfaces typées d'enregistrement et d'exécution des plugins.** Étendez
   `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface typée
   utile pour cette capacité.
3. **Reliez le cœur aux consommateurs de canaux et de fonctionnalités.** Les canaux et les plugins de fonctionnalités
   doivent utiliser la nouvelle capacité par l'intermédiaire du cœur, sans importer directement
   l'implémentation d'un fournisseur.
4. **Enregistrez les implémentations des fournisseurs.** Les plugins des fournisseurs enregistrent ensuite leurs
   moteurs auprès de la capacité.
5. **Ajoutez une couverture du contrat.** Ajoutez des tests afin que la propriété et la forme de l'enregistrement
   restent explicites au fil du temps.

C'est ainsi qu'OpenClaw conserve des choix affirmés sans figer la vision du monde
d'un fournisseur particulier. Consultez le [guide pratique des capacités](/fr/plugins/adding-capabilities)
pour obtenir une liste de contrôle concrète des fichiers et un exemple détaillé.

### Liste de contrôle d'une capacité

Lorsque vous ajoutez une nouvelle capacité, l'implémentation doit généralement modifier ensemble les
surfaces suivantes :

- les types de contrat du cœur dans `src/<capability>/types.ts`
- la fonction d'assistance du cœur pour l'exécution dans `src/<capability>/runtime.ts`
- la surface d'enregistrement de l'API des plugins dans `src/plugins/types.ts`
- le raccordement au registre des plugins dans `src/plugins/registry.ts`
- l'exposition à l'exécution des plugins dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalités ou de canaux
  doivent l'utiliser
- les fonctions d'assistance de capture et de test dans `src/test-utils/plugin-registration.ts`
- les assertions de propriété et de contrat dans `src/plugins/contracts/registry.ts`
- la documentation destinée aux opérateurs et aux plugins dans `docs/`

Si l'une de ces surfaces est absente, cela indique généralement que la capacité
n'est pas encore entièrement intégrée.

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
`contracts.videoGenerationProviders` d'un plugin correspond à ce qu'il enregistre réellement) :

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

La règle reste ainsi simple :

- le cœur possède le contrat de la capacité et l'orchestration
- les plugins des fournisseurs possèdent leurs implémentations respectives
- les plugins de fonctionnalités et de canaux utilisent les fonctions d'assistance à l'exécution
- les tests de contrat maintiennent la propriété explicite

## Ressources connexes

- [Architecture des plugins](/fr/plugins/architecture) — modèle public des capacités et structures
- [Sous-chemins du SDK des plugins](/fr/plugins/sdk-subpaths)
- [Configuration du SDK des plugins](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
