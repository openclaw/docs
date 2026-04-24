---
read_when:
    - Implémentation des hooks d’exécution du fournisseur, du cycle de vie du canal ou des packs de packages
    - Débogage de l’ordre de chargement des plugin ou de l’état du registre
    - Ajout d’une nouvelle capacité de plugin ou d’un plugin de moteur de contexte
summary: 'Internes de l’architecture des Plugin : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tableaux de référence'
title: Internes de l’architecture des Plugin
x-i18n:
    generated_at: "2026-04-24T08:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9370788c5f986e9205b1108ae633e829edec8890e442a49f80d84bb0098bb393
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Pour le modèle de capacités public, les formes de plugin et les contrats de propriété/exécution, voir [Architecture des Plugin](/fr/plugins/architecture). Cette page est la
référence pour les mécanismes internes : pipeline de chargement, registre, hooks d’exécution,
routes HTTP du Gateway, chemins d’importation et tableaux de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines de plugin candidates
2. lit les manifestes de bundle natifs ou compatibles et les métadonnées de package
3. rejette les candidats non sûrs
4. normalise la configuration des plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation de chaque candidat
6. charge les modules natifs activés : les modules intégrés compilés utilisent un chargeur natif ;
   les plugins natifs non compilés utilisent jiti
7. appelle les hooks natifs `register(api)` et collecte les enregistrements dans le registre des plugin
8. expose le registre aux commandes/surfaces d’exécution

<Note>
`activate` est un alias historique de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même endroit. Tous les plugins intégrés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les contrôles de sécurité ont lieu **avant** l’exécution au moment du runtime. Les candidats sont bloqués
lorsque l’entrée sort de la racine du plugin, que le chemin est accessible en écriture à tous, ou que
la propriété du chemin semble suspecte pour les plugins non intégrés.

### Comportement basé d’abord sur le manifeste

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de l’interface Control
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs d’activation et de configuration légers sans charger l’exécution du plugin

Pour les plugins natifs, le module d’exécution est la partie plan de données. Il enregistre
le comportement réel, comme les hooks, outils, commandes ou flux de fournisseur.

Les blocs facultatifs `activation` et `setup` du manifeste restent sur le plan de contrôle.
Ce sont des descripteurs de métadonnées uniquement pour la planification de l’activation et la découverte de la configuration ;
ils ne remplacent pas l’enregistrement au runtime, `register(...)`, ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indices du manifeste sur les commandes, canaux et fournisseurs
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux plugins qui possèdent la commande principale demandée
- la résolution de configuration/de plugin de canal se limite aux plugins qui possèdent l’`id`
  de canal demandé
- la résolution explicite de configuration/d’exécution de fournisseur se limite aux plugins qui possèdent l’`id`
  de fournisseur demandé

Le planificateur d’activation expose à la fois une API ne renvoyant que des ids pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées du plan indiquent pourquoi un plugin a été sélectionné,
en séparant les indices explicites du planificateur `activation.*` du repli sur la propriété du manifeste,
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons constitue la frontière de compatibilité :
les métadonnées de plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter les indices larges
ou le comportement de repli sans changer la sémantique de chargement au runtime.

La découverte de configuration préfère désormais les ids appartenant au descripteur, comme `setup.providers` et
`setup.cliBackends`, afin de restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks d’exécution au moment de la configuration. Si plus d’un
plugin découvert revendique le même id normalisé de fournisseur de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en cours de processus pour :

- les résultats de découverte
- les données du registre de manifestes
- les registres de plugin chargés

Ces caches réduisent les démarrages en rafale et le coût des commandes répétées. Il est sûr
de les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Remarque sur les performances :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globals du cœur de manière arbitraire. Ils s’enregistrent dans un
registre central des plugin.

Le registre suit :

- les enregistrements de plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks historiques et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC du gateway
- les routes HTTP
- les enregistreurs CLI
- les services en arrière-plan
- les commandes possédées par les plugin

Les fonctionnalités du cœur lisent ensuite dans ce registre au lieu de dialoguer directement avec les modules de plugin.
Cela maintient un chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- exécution du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n’ont
besoin que d’un seul point d’intégration : « lire le registre », et non « gérer chaque module de plugin comme un cas particulier ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une demande de liaison est approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Une liaison existe maintenant pour ce plugin + cette conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // La demande a été refusée ; effacez tout état local en attente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: la liaison résolue pour les demandes approuvées
- `request`: le résumé de la demande d’origine, l’indice de détachement, l’id de l’expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s’exécute une fois la gestion de l’approbation par le cœur terminée.

## Hooks d’exécution du fournisseur

Les plugins de fournisseur ont trois couches :

- **Métadonnées du manifeste** pour une recherche légère avant le runtime : `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (anciennement `discovery`) plus
  `applyConfigDefaults`.
- **Hooks d’exécution** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution des modèles,
  l’encapsulation des flux, les niveaux de réflexion, la politique de relecture et les points d’accès d’usage. Voir
  la liste complète sous [Ordre et usage des hooks](#hook-order-and-usage).

OpenClaw reste responsable de la boucle générique d’agent, du basculement, de la gestion des transcriptions et de
la politique des outils. Ces hooks constituent la surface d’extension pour le comportement spécifique au fournisseur
sans nécessiter tout un transport d’inférence personnalisé.

Utilisez `providerAuthEnvVars` du manifeste lorsque le fournisseur a des identifiants basés sur l’environnement
que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans charger l’exécution du plugin.
Utilisez `providerAuthAliases` du manifeste lorsqu’un id de fournisseur doit réutiliser les variables d’environnement,
les profils d’authentification, l’authentification basée sur la configuration et le choix d’initialisation par clé API d’un autre id fournisseur.
Utilisez `providerAuthChoices` du manifeste lorsque les surfaces CLI d’initialisation/de choix d’authentification
doivent connaître l’id de choix du fournisseur, les libellés de groupe et le câblage simple d’authentification à un seul indicateur sans charger l’exécution du fournisseur.
Conservez `envVars` dans l’exécution du fournisseur pour les indications destinées aux opérateurs, comme les libellés d’initialisation ou les variables de
configuration OAuth `client-id`/`client-secret`.

Utilisez `channelEnvVars` du manifeste lorsqu’un canal dispose d’une authentification ou d’une configuration pilotée par l’environnement
que le repli générique sur les variables d’environnement du shell, les vérifications de configuration/statut ou les invites de configuration
doivent voir sans charger l’exécution du canal.

### Ordre et usage des hooks

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.

| #   | Hook                              | Ce qu’il fait                                                                                                   | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration du fournisseur dans `models.providers` pendant la génération de `models.json`           | Le fournisseur possède un catalogue ou des valeurs par défaut de base URL                                                                     |
| 2   | `applyConfigDefaults`             | Applique des valeurs par défaut globales propres au fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du fournisseur     |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal du registre/catalogue                                                  | _(pas un hook de plugin)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normalise les alias historiques ou de préversion de model-id avant la recherche                                | Le fournisseur possède la logique de nettoyage des alias avant la résolution du modèle canonique                                              |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille du fournisseur avant l’assemblage générique du modèle                | Le fournisseur possède la logique de nettoyage du transport pour des ids fournisseur personnalisés dans la même famille de transport          |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution au runtime/du fournisseur                                 | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les helpers Google-family intégrés servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique des réécritures de compatibilité d’usage du streaming natif aux fournisseurs de configuration         | Le fournisseur a besoin de corrections de métadonnées d’usage du streaming natif pilotées par le point d’accès                               |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement pour les fournisseurs de configuration avant le chargement de l’authentification au runtime | Le fournisseur possède sa propre résolution de clé API par marqueur d’environnement ; `amazon-bedrock` dispose aussi ici d’un résolveur intégré de marqueur d’environnement AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/autohébergée ou adossée à la configuration sans persister de texte en clair | Le fournisseur peut fonctionner avec un marqueur d’identifiants synthétique/local                                                             |
| 9   | `resolveExternalAuthProfiles`     | Superpose des profils d’authentification externes propres au fournisseur ; la `persistence` par défaut est `runtime-only` pour les identifiants possédés par la CLI/l’app | Le fournisseur réutilise des identifiants d’authentification externes sans persister les refresh tokens copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse la priorité des placeholders de profils synthétiques stockés derrière l’authentification adossée à l’environnement/à la configuration | Le fournisseur stocke des profils placeholders synthétiques qui ne doivent pas être prioritaires                                              |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les ids de modèle propres au fournisseur qui ne sont pas encore dans le registre local    | Le fournisseur accepte des ids de modèle amont arbitraires                                                                                    |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                          | Le fournisseur a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                              |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que l’exécuteur embarqué utilise le modèle résolu                                      | Le fournisseur a besoin de réécritures de transport tout en utilisant un transport du cœur                                                    |
| 14  | `contributeResolvedModelCompat`   | Contribue des indicateurs de compatibilité pour les modèles du fournisseur derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre en charge le fournisseur                                   |
| 15  | `capabilities`                    | Métadonnées de transcription/d’outillage propres au fournisseur utilisées par la logique partagée du cœur      | Le fournisseur a besoin de particularités liées à la transcription/à la famille de fournisseurs                                               |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant que l’exécuteur embarqué ne les voie                                      | Le fournisseur a besoin d’un nettoyage de schéma propre à la famille de transport                                                             |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma propres au fournisseur après la normalisation                                  | Le fournisseur veut des avertissements sur les mots-clés sans enseigner au cœur des règles spécifiques au fournisseur                         |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                                | Le fournisseur a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                     |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                        | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres propre au fournisseur                             |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin de flux normal par un transport personnalisé                                     | Le fournisseur a besoin d’un protocole filaire personnalisé, et pas seulement d’un wrapper                                                    |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                       | Le fournisseur a besoin de wrappers de compatibilité des en-têtes/corps de requête/modèle sans transport personnalisé                        |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natives par tour de transport                                               | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                            | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                               |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` au runtime                | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’un format de token au runtime personnalisé             |
| 25  | `refreshOAuth`                    | Surcharge du rafraîchissement OAuth pour des points d’accès de rafraîchissement personnalisés ou une politique d’échec de rafraîchissement | Le fournisseur n’entre pas dans les rafraîchisseurs partagés `pi-ai`                                                                          |
| 26  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsqu’un rafraîchissement OAuth échoue                                             | Le fournisseur a besoin d’un conseil de réparation d’authentification propre au fournisseur après un échec de rafraîchissement               |
| 27  | `matchesContextOverflowError`     | Correspondance des dépassements de fenêtre de contexte propre au fournisseur                                    | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                               |
| 28  | `classifyFailoverReason`          | Classification des raisons de basculement propre au fournisseur                                                 | Le fournisseur peut mapper des erreurs brutes d’API/de transport vers limitation de débit/surcharge/etc.                                      |
| 29  | `isCacheTtlEligible`              | Politique de TTL du cache de prompt pour les fournisseurs proxy/backhaul                                        | Le fournisseur a besoin d’un filtrage TTL du cache spécifique au proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                  | Le fournisseur a besoin d’un conseil de récupération d’authentification manquante spécifique au fournisseur                                   |
| 31  | `suppressBuiltInModel`            | Suppression des modèles amont obsolètes avec indice d’erreur optionnel orienté utilisateur                     | Le fournisseur a besoin de masquer des lignes amont obsolètes ou de les remplacer par un indice fournisseur                                  |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                           | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                  |
| 33  | `resolveThinkingProfile`          | Ensemble des niveaux `/think`, libellés d’affichage et valeur par défaut spécifiques au modèle                 | Le fournisseur expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                     |
| 34  | `isBinaryThinking`                | Hook de compatibilité pour le basculement raisonnement activé/désactivé                                         | Le fournisseur n’expose qu’un mode binaire activé/désactivé pour la réflexion                                                                 |
| 35  | `supportsXHighThinking`           | Hook de compatibilité de prise en charge du raisonnement `xhigh`                                                | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                         |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                        | Le fournisseur possède la politique `/think` par défaut pour une famille de modèles                                                           |
| 37  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profils en direct et la sélection smoke                  | Le fournisseur possède la logique de correspondance des modèles préférés en direct/smoke                                                     |
| 38  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le token/la clé réel(le) au runtime juste avant l’inférence          | Le fournisseur a besoin d’un échange de token ou d’un identifiant de requête de courte durée                                                 |
| 39  | `resolveUsageAuth`                | Résout les identifiants d’usage/facturation pour `/usage` et les surfaces de statut associées                | Le fournisseur a besoin d’une analyse personnalisée des tokens d’usage/de quota ou d’un identifiant d’usage différent                       |
| 40  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/de quota propres au fournisseur une fois l’authentification résolue | Le fournisseur a besoin d’un point d’accès d’usage spécifique au fournisseur ou d’un analyseur de charge utile                              |
| 41  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding propre au fournisseur pour la mémoire/la recherche                        | Le comportement d’embedding de la mémoire appartient au plugin du fournisseur                                                                 |
| 42  | `buildReplayPolicy`               | Retourne une politique de relecture contrôlant la gestion des transcriptions pour le fournisseur              | Le fournisseur a besoin d’une politique de transcription personnalisée (par exemple, suppression des blocs de réflexion)                     |
| 43  | `sanitizeReplayHistory`           | Réécrit l’historique de relecture après le nettoyage générique de la transcription                            | Le fournisseur a besoin de réécritures de relecture spécifiques au fournisseur au-delà des helpers partagés de Compaction                   |
| 44  | `validateReplayTurns`             | Validation finale ou remise en forme des tours de relecture avant l’exécuteur embarqué                        | Le transport du fournisseur a besoin d’une validation des tours plus stricte après l’assainissement générique                                |
| 45  | `onModelSelected`                 | Exécute des effets de bord propres au fournisseur après la sélection                                          | Le fournisseur a besoin de télémétrie ou d’un état propre au fournisseur lorsqu’un modèle devient actif                                      |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin fournisseur correspondant, puis passent aux autres plugins fournisseurs capables de hooks
jusqu’à ce que l’un d’eux modifie réellement l’id du modèle ou le transport/la configuration. Cela permet de garder
les shim de fournisseur d’alias/de compatibilité fonctionnels sans obliger l’appelant à savoir quel
plugin intégré possède la réécriture. Si aucun hook de fournisseur ne réécrit une entrée de
configuration Google-family prise en charge, le normaliseur de configuration Google intégré applique quand même
ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
il s’agit d’une autre classe d’extension. Ces hooks sont destinés au comportement fournisseur
qui s’exécute toujours sur la boucle d’inférence normale d’OpenClaw.

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

Les plugins fournisseurs intégrés combinent les hooks ci-dessus pour répondre aux besoins propres à chaque fournisseur en matière de catalogue,
d’authentification, de réflexion, de relecture et d’usage. L’ensemble de hooks faisant autorité se trouve avec
chaque plugin sous `extensions/` ; cette page illustre les formes plutôt que de
dupliquer la liste.

<AccordionGroup>
  <Accordion title="Fournisseurs de catalogue pass-through">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer des ids de modèles amont
    avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="Fournisseurs OAuth et de point d’accès d’usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour prendre en charge l’échange de jetons et l’intégration `/usage`.
  </Accordion>
  <Accordion title="Familles de relecture et de nettoyage de transcription">
    Des familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux fournisseurs d’opter
    pour une politique de transcription via `buildReplayPolicy` au lieu que chaque plugin
    réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Fournisseurs catalogue uniquement">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent uniquement `catalog` et utilisent la boucle d’inférence partagée.
  </Accordion>
  <Accordion title="Helpers de flux spécifiques à Anthropic">
    Les en-têtes bêta, `/fast` / `serviceTier` et `context1m` se trouvent dans la
    surface publique `api.ts` / `contract-api.ts` du plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Helpers d’exécution

Les plugins peuvent accéder à certains helpers du cœur via `api.runtime`. Pour le TTS :

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

- `textToSpeech` renvoie la charge utile de sortie TTS normale du cœur pour les surfaces de fichier/note vocale.
- Utilise la configuration centrale `messages.tts` et la sélection du fournisseur.
- Renvoie un tampon audio PCM + une fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration propres au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches comme la locale, le genre et des tags de personnalité pour des sélecteurs tenant compte du fournisseur.
- OpenAI et ElevenLabs prennent en charge la téléphonie aujourd’hui. Microsoft non.

Les plugins peuvent également enregistrer des fournisseurs de parole via `api.registerSpeechProvider(...)`.

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

- Conservez la politique TTS, le repli et la livraison des réponses dans le cœur.
- Utilisez les fournisseurs de parole pour le comportement de synthèse propre au fournisseur.
- L’entrée historique Microsoft `edge` est normalisée vers l’id fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un plugin fournisseur peut prendre en charge
  les fournisseurs de texte, parole, image et futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un fournisseur typé unique de
compréhension des médias au lieu d’un sac générique clé/valeur :

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

- Conservez l’orchestration, le repli, la configuration et le raccordement des canaux dans le cœur.
- Conservez le comportement fournisseur dans le plugin fournisseur.
- L’extension additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper d’exécution
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/de canal consomment `api.runtime.videoGeneration.*`

Pour les helpers d’exécution de compréhension des médias, les plugins peuvent appeler :

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

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de compréhension des médias
soit l’alias STT plus ancien :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facultatif lorsque le type MIME ne peut pas être déduit de manière fiable :
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour
  la compréhension image/audio/vidéo.
- Utilise la configuration audio centrale de compréhension des médias (`tools.media.audio`) et l’ordre de repli du fournisseur.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple en cas d’entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

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

- `provider` et `model` sont des surcharges facultatives par exécution, pas des changements de session persistants.
- OpenClaw ne respecte ces champs de surcharge que pour les appelants de confiance.
- Pour les exécutions de repli possédées par un plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour limiter les plugins de confiance à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de surcharge sont rejetées au lieu de faire silencieusement un repli.

Pour la recherche Web, les plugins peuvent consommer le helper d’exécution partagé au lieu
de passer par le câblage de l’outil agent :

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

Les plugins peuvent aussi enregistrer des fournisseurs de recherche Web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes dans le cœur.
- Utilisez les fournisseurs de recherche Web pour les transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/de canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper de l’outil agent.

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

Les plugins peuvent exposer des points d’accès HTTP avec `api.registerHttpRoute(...)`.

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
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification normale du Gateway, ou `"plugin"` pour une authentification/une vérification de Webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf avec `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de retombée `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d’exécution opérateur. Elles sont destinées aux Webhook/vérifications de signature gérés par le plugin, pas aux appels privilégiés aux helpers du Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée d’exécution de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées d’exécution des routes de plugin fixées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance portant une identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) ne respectent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin porteuses d’identité, la portée d’exécution retombe sur `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par gateway soit implicitement une surface d’administration. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification portant une identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK Plugin

Utilisez des sous-chemins SDK étroits au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lors de l’écriture de nouveaux plugins. Sous-chemins du cœur :

| Sous-chemin                         | But                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitifs d’enregistrement de plugin               |
| `openclaw/plugin-sdk/channel-core`  | Helpers d’entrée/de construction de canal          |
| `openclaw/plugin-sdk/core`          | Helpers partagés génériques et contrat englobant   |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent dans une famille de seams étroits — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
autour d’un seul contrat `approvalCapability` plutôt que d’être mélangé à des champs de
plugin non liés. Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les helpers d’exécution et de configuration se trouvent sous des sous-chemins `*-runtime`
correspondants (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` est obsolète — il s’agit d’un shim de compatibilité pour
les anciens plugins. Le nouveau code doit plutôt importer des primitifs génériques plus étroits.
</Info>

Points d’entrée internes au dépôt (par racine de package de plugin intégré) :

- `index.js` — entrée du plugin intégré
- `api.js` — barrel de helpers/types
- `runtime-api.js` — barrel réservé au runtime
- `setup-entry.js` — entrée du plugin de configuration

Les plugins externes ne doivent importer que des sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` du package d’un autre plugin depuis le cœur ou depuis un autre plugin.
Les points d’entrée chargés par façade préfèrent l’instantané de configuration d’exécution actif lorsqu’il
existe, puis reviennent au fichier de configuration résolu sur disque.

Des sous-chemins spécifiques à une capacité comme `image-generation`, `media-understanding`
et `speech` existent parce que les plugins intégrés les utilisent aujourd’hui. Ils ne sont pas
automatiquement des contrats externes figés à long terme — consultez la page de référence SDK
concernée lorsque vous vous appuyez sur eux.

## Schémas d’outils de message

Les plugins doivent prendre en charge les contributions de schéma
`describeMessageTool(...)` spécifiques au canal pour les primitives autres que le message, comme les réactions, les accusés de lecture et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs au fournisseur pour les boutons, composants, blocs ou cartes.
Voir [Message Presentation](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, le mapping fournisseur et la checklist pour les auteurs de plugins.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent afficher via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il doit rendre la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires UI natives au fournisseur depuis l’outil de message générique.
Les helpers SDK obsolètes pour les anciens schémas natifs restent exportés pour les
plugins tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent prendre en charge la sémantique de cible spécifique au canal. Gardez
l’hôte sortant partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans le répertoire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type id au lieu d’une recherche dans le répertoire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque
  le cœur a besoin d’une résolution finale propre au fournisseur après normalisation ou après un
  échec de recherche dans le répertoire.
- `messaging.resolveOutboundSessionRoute(...)` prend en charge la construction
  spécifique au fournisseur de la route de session sortante une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent avoir lieu avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un id de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au fournisseur, pas pour
  une recherche large dans le répertoire.
- Conservez les ids natifs au fournisseur comme les chat ids, thread ids, JIDs, handles et room
  ids dans les valeurs `target` ou les paramètres spécifiques au fournisseur, pas dans des champs SDK génériques.

## Répertoires adossés à la configuration

Les plugins qui dérivent des entrées de répertoire à partir de la configuration doivent conserver cette logique dans le
plugin et réutiliser les helpers partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration, tels que :

- pairs DM pilotés par liste d’autorisation
- maps de canaux/groupes configurées
- replis statiques de répertoire à portée de compte

Les helpers partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage des requêtes
- application des limites
- helpers de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ids doivent rester dans l’implémentation du
plugin.

## Catalogues de fournisseurs

Les plugins fournisseurs peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée fournisseur
- `{ providers }` pour plusieurs entrées fournisseur

Utilisez `catalog` lorsque le plugin possède des ids de modèle spécifiques au fournisseur, des valeurs par défaut
de base URL, ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne par rapport aux
fournisseurs implicites intégrés d’OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou variables d’environnement
- `profile` : fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs l’emportent en cas de collision de clé, ce qui permet aux plugins
d’écraser intentionnellement une entrée fournisseur intégrée ayant le même id fournisseur.

Compatibilité :

- `discovery` fonctionne toujours comme alias historique
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, privilégiez l’implémentation de
`plugin.config.inspectAccount(cfg, accountId)` en parallèle de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement si les secrets requis sont absents.
- Les chemins de commande en lecture seule comme `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux de réparation
  doctor/config ne doivent pas avoir besoin de matérialiser les identifiants d’exécution simplement pour
  décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Ne renvoyer qu’un état de compte descriptif.
- Préserver `enabled` et `configured`.
- Inclure des champs de source/statut d’identifiants lorsque cela est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Il n’est pas nécessaire de renvoyer les valeurs brutes de jeton simplement pour signaler une disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant) suffit pour les commandes de type statut.
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

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’id du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Garde-fou de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui sortent du répertoire du package sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances du plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement au runtime). Gardez les arbres de dépendances des plugins « pure JS/TS » et évitez les packages qui nécessitent des compilations `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Quand OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais pas encore configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela garde le démarrage et la configuration plus légers
lorsque l’entrée principale de votre plugin branche aussi des outils, hooks ou autre code réservé au runtime.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal pour le même chemin `setupEntry` pendant la
phase de démarrage pré-écoute du gateway, même lorsque le canal est déjà configuré.

N’utilisez cela que si `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité possédée par le canal dont dépend le démarrage, comme :

- l’enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le gateway ne commence à écouter
- toutes les méthodes gateway, tous les outils ou services qui doivent exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger l’entrée
complète au démarrage.

Les canaux intégrés peuvent aussi publier des helpers de surface de contrat réservés à la configuration que le cœur
peut consulter avant que le runtime complet du canal ne soit chargé. La surface actuelle de
promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une ancienne configuration de canal
à compte unique vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple intégré actuel : il ne déplace que les clés d’authentification/bootstrap vers un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut non canonique configurée au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent la découverte de la surface de contrat intégrée paresseuse. Le temps
d’importation reste léger ; la surface de promotion n’est chargée qu’au premier usage au lieu de
relancer le démarrage du canal intégré lors de l’import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC gateway, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
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

### Métadonnées de catalogue de canal

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indices d’installation via `openclaw.install`. Cela permet de garder les données du catalogue du cœur sans données.

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
      "blurb": "Chat auto-hébergé via des bots Webhook Nextcloud Talk.",
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

- `detailLabel` : libellé secondaire pour des surfaces de catalogue/de statut plus riches
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : ids de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de texte pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de mise en forme sortante
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il est défini à `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsqu’il est défini à `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias historiques toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait participer le canal au flux `allowFrom` standard de démarrage rapide
- `forceAccountBinding` : exige une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, une exportation de registre MPM
). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou faites pointer `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par des virgules/points-virgules/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias historiques de la clé `"entries"`.

Les entrées générées du catalogue de canaux et les entrées du catalogue d’installation des fournisseurs exposent
des faits normalisés sur la source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés identifient si la spécification npm est une version exacte ou un sélecteur flottant,
si des métadonnées d’intégrité attendues sont présentes, et si un chemin de source local
est également disponible. Les consommateurs doivent traiter `installSource` comme un
champ facultatif additif afin que les anciennes entrées construites à la main et les shim de compatibilité n’aient pas à le synthétiser. Cela permet à l’onboarding et aux diagnostics d’expliquer
l’état du plan de source sans importer l’exécution du plugin.

Les entrées npm externes officielles doivent préférer un `npmSpec` exact plus
`expectedIntegrity`. Les noms de package seuls et les dist-tags fonctionnent encore pour la
compatibilité, mais ils exposent des avertissements du plan de source afin que le catalogue puisse évoluer
vers des installations épinglées avec vérification d’intégrité sans casser les plugins existants.
Lorsqu’un onboarding installe à partir d’un chemin de catalogue local, il enregistre une
entrée `plugins.installs` avec `source: "path"` et un `sourcePath` relatif à l’espace de travail
lorsque c’est possible. Le chemin de chargement opérationnel absolu reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins de poste de travail locaux
dans une configuration durable. Cela permet de garder les installations de développement local visibles pour
les diagnostics du plan de source sans ajouter une seconde surface brute de divulgation de chemin du système de fichiers.

## Plugins de moteur de contexte

Les plugins de moteur de contexte prennent en charge l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin doit remplacer ou étendre le pipeline de contexte
par défaut plutôt que simplement ajouter une recherche en mémoire ou des hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
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

Si votre moteur ne possède **pas** l’algorithme de Compaction, laissez `compact()`
implémenté et déléguez-le explicitement :

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
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

## Ajout d’une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de plugins avec un accès privé. Ajoutez la capacité manquante.

Séquence recommandée :

1. définissez le contrat du cœur
   Décidez quel comportement partagé le cœur doit prendre en charge : politique, repli, fusion de configuration,
   cycle de vie, sémantique côté canal et forme du helper d’exécution.
2. ajoutez des surfaces typées d’enregistrement/de runtime pour les plugins
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. câblez les consommateurs du cœur + des canaux/fonctionnalités
   Les canaux et les plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrez les implémentations fournisseur
   Les plugins fournisseurs enregistrent ensuite leurs backends par rapport à la capacité.
5. ajoutez une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la vision du monde d’un
fournisseur. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une checklist de fichiers concrète et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat du cœur dans `src/<capability>/types.ts`
- exécuteur/helper d’exécution du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition du runtime des plugins dans `src/plugins/runtime/*` lorsque les plugins
  de fonctionnalité/de canal doivent la consommer
- helpers de capture/de test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/de contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore entièrement intégrée.

### Modèle de capacité

Modèle minimal :

```ts
// contrat du cœur
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper d’exécution partagé pour les plugins de fonctionnalité/de canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Modèle de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde une règle simple :

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseurs possèdent les implémentations fournisseur
- les plugins de fonctionnalité/de canal consomment les helpers d’exécution
- les tests de contrat gardent la propriété explicite

## Lié

- [Architecture des Plugin](/fr/plugins/architecture) — modèle de capacité public et formes
- [Sous-chemins du SDK Plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
