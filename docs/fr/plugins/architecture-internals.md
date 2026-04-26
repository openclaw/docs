---
read_when:
    - Implémentation des hooks de runtime provider, du cycle de vie de canal ou des packs de paquets
    - Débogage de l’ordre de chargement des plugins ou de l’état du registre
    - Ajouter une nouvelle capacité de plugin ou un plugin de moteur de contexte
summary: 'Architecture interne des plugins : pipeline de chargement, registre, hooks de runtime, routes HTTP et tableaux de référence'
title: Architecture interne des plugins
x-i18n:
    generated_at: "2026-04-26T11:34:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Pour le modèle public de capacités, les formes de plugins et les contrats
de propriété/exécution, voir [Architecture des plugins](/fr/plugins/architecture). Cette page est la
référence pour les mécanismes internes : pipeline de chargement, registre, hooks de runtime,
routes HTTP Gateway, chemins d’importation et tableaux de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines candidates de plugin
2. lit les manifestes natifs ou compatibles de bundle et les métadonnées de paquet
3. rejette les candidats non sûrs
4. normalise la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés : les modules packagés intégrés compilés utilisent un chargeur natif ;
   les plugins natifs non compilés utilisent jiti
7. appelle les hooks natifs `register(api)` et collecte les enregistrements dans le registre de plugins
8. expose le registre aux surfaces de commandes/runtime

<Note>
`activate` est un alias historique de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même moment. Tous les plugins intégrés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité s’appliquent **avant** l’exécution du runtime. Les candidats sont bloqués
lorsque le point d’entrée s’échappe de la racine du plugin, que le chemin est accessible en écriture par tous, ou que la propriété du chemin paraît suspecte pour les plugins non intégrés.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schéma de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de la Control UI
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs d’activation et de configuration légers sans charger le runtime du plugin

Pour les plugins natifs, le module runtime constitue la partie plan de données. Il enregistre
le comportement réel comme les hooks, outils, commandes ou flux provider.

Les blocs facultatifs `activation` et `setup` du manifeste restent dans le plan de contrôle.
Ce sont uniquement des descripteurs de métadonnées pour la planification d’activation et la découverte de configuration ;
ils ne remplacent ni l’enregistrement runtime, ni `register(...)`, ni `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent maintenant les indices de commande, canal et provider du manifeste
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- Le chargement CLI se limite aux plugins qui possèdent la commande primaire demandée
- La résolution de configuration/canal se limite aux plugins qui possèdent l’ID de canal demandé
- La résolution explicite de configuration/runtime provider se limite aux plugins qui possèdent l’ID provider demandé

Le planificateur d’activation expose à la fois une API uniquement par ID pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées du plan indiquent pourquoi un plugin a été sélectionné,
en séparant les indices explicites du planificateur `activation.*` du repli par propriété du manifeste
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et les hooks. Cette séparation des raisons constitue la frontière de compatibilité :
les métadonnées de plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter les indices larges
ou le comportement de repli sans modifier la sémantique de chargement du runtime.

La découverte de configuration préfère maintenant les ID appartenant au descripteur comme `setup.providers` et
`setup.cliBackends` pour restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks runtime au moment de la configuration. Les listes de configuration provider
utilisent `providerAuthChoices` du manifeste, les choix de configuration dérivés du descripteur, et les métadonnées du catalogue d’installation sans charger le runtime provider. `setup.requiresRuntime: false` explicite est une coupure purement descripteur ; un `requiresRuntime` omis conserve le repli historique `setup-api` pour compatibilité. Si plus d’un plugin découvert revendique le même ID normalisé de provider de configuration ou de backend CLI, la résolution de configuration refuse ce propriétaire ambigu au lieu de s’appuyer sur l’ordre de découverte. Lorsque le runtime de configuration s’exécute, les diagnostics du registre signalent la dérive entre `setup.providers` / `setup.cliBackends` et les providers ou backends CLI enregistrés par setup-api sans bloquer les plugins historiques.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données de registre des manifestes
- les registres de plugins chargés

Ces caches réduisent les démarrages saccadés et la surcharge des commandes répétées. Il est sûr
de les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Remarque sur les performances :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globaux arbitraires du cœur. Ils s’enregistrent dans un
registre central de plugins.

Le registre suit :

- les enregistrements de plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks historiques et les hooks typés
- les canaux
- les providers
- les handlers RPC Gateway
- les routes HTTP
- les enregistreurs CLI
- les services d’arrière-plan
- les commandes appartenant aux plugins

Les fonctionnalités du cœur lisent ensuite dans ce registre au lieu de parler directement aux modules de plugin.
Cela maintient un chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Cela signifie que la plupart des surfaces du cœur
n’ont besoin que d’un seul point d’intégration : « lire le registre », et non « gérer spécialement chaque module de plugin ».

## Callbacks de binding de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après l’approbation
ou le refus d’une demande de binding :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Un binding existe maintenant pour ce plugin + cette conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // La demande a été refusée ; effacer tout état local en attente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : le binding résolu pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indice de détachement, l’ID d’expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation du cœur.

## Hooks de runtime provider

Les plugins provider ont trois couches :

- **Métadonnées du manifeste** pour une recherche légère avant runtime :
  `setup.providers[].envVars`, l’ancienne compatibilité dépréciée `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (anciennement `discovery`) plus
  `applyConfigDefaults`.
- **Hooks de runtime** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution de modèle,
  l’enveloppement de flux, les niveaux de Thinking, la politique de relecture et les points de terminaison d’usage. Voir
  la liste complète sous [Ordre et usage des hooks](#hook-order-and-usage).

OpenClaw conserve la propriété de la boucle d’agent générique, du failover, de la gestion de transcription et
de la politique d’outil. Ces hooks constituent la surface d’extension pour le comportement spécifique au provider
sans nécessiter tout un transport d’inférence personnalisé.

Utilisez `setup.providers[].envVars` du manifeste lorsque le provider a des identifiants basés sur l’environnement
que les chemins génériques d’auth/statut/sélecteur de modèle doivent voir sans charger le runtime du plugin. L’ancien `providerAuthEnvVars` est encore lu par l’adaptateur de compatibilité pendant la fenêtre de dépréciation, et les plugins non intégrés qui l’utilisent reçoivent un diagnostic de manifeste. Utilisez `providerAuthAliases` du manifeste lorsqu’un ID provider doit réutiliser les variables d’environnement, les profils d’authentification, l’authentification adossée à la configuration et le choix d’onboarding par clé API d’un autre ID provider. Utilisez `providerAuthChoices` du manifeste lorsque les surfaces CLI d’onboarding/choix d’authentification doivent connaître l’ID de choix du provider, les libellés de groupe et le branchement simple d’authentification à un indicateur sans charger le runtime du provider. Conservez
`envVars` du runtime provider pour les indices à destination des opérateurs comme les libellés d’onboarding ou les variables de configuration d’ID client/secret client OAuth.

Utilisez `channelEnvVars` du manifeste lorsqu’un canal dispose d’une authentification ou d’une configuration pilotée par l’environnement que le repli générique sur l’environnement shell, les vérifications de configuration/statut ou les invites de configuration doivent voir sans charger le runtime du canal.

### Ordre et usage des hooks

Pour les plugins de modèle/provider, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide rapide de décision.

| #   | Hook                              | Ce qu’il fait                                                                                                  | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration provider dans `models.providers` lors de la génération de `models.json`              | Le provider possède un catalogue ou des valeurs par défaut de `baseUrl`                                                                       |
| 2   | `applyConfigDefaults`             | Applique des valeurs par défaut globales appartenant au provider lors de la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du provider       |
| --  | _(built-in model lookup)_         | OpenClaw essaie d’abord le chemin normal de registre/catalogue                                                 | _(pas un hook de plugin)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normalise les alias historiques ou preview d’ID de modèle avant la recherche                                  | Le provider possède le nettoyage d’alias avant la résolution canonique du modèle                                                              |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de la famille du provider avant l’assemblage générique du modèle                  | Le provider possède le nettoyage du transport pour des ID provider personnalisés dans la même famille de transport                            |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution runtime/provider                                         | Le provider a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les assistants intégrés de la famille Google servent aussi de repli pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique des réécritures de compatibilité d’usage du streaming natif aux providers configurés                 | Le provider a besoin de corrections de métadonnées d’usage du streaming natif pilotées par point de terminaison                              |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur d’environnement pour les providers configurés avant le chargement de l’auth runtime | Le provider possède sa propre résolution de clé API par marqueur d’environnement ; `amazon-bedrock` a aussi ici un résolveur intégré de marqueur d’environnement AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/autohébergée ou adossée à la configuration sans persister de texte brut    | Le provider peut fonctionner avec un marqueur d’identifiant synthétique/local                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Superpose les profils d’authentification externes appartenant au provider ; `persistence` par défaut vaut `runtime-only` pour les identifiants possédés par CLI/app | Le provider réutilise des identifiants d’authentification externes sans persister de jetons de rafraîchissement copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Relègue les placeholders de profil synthétique stockés derrière l’authentification adossée à l’env/config     | Le provider stocke des profils placeholder synthétiques qui ne doivent pas avoir la priorité                                                  |
| 11  | `resolveDynamicModel`             | Repli synchrone pour des ID de modèle appartenant au provider mais pas encore dans le registre local          | Le provider accepte des ID de modèle amont arbitraires                                                                                        |
| 12  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                         | Le provider a besoin de métadonnées réseau avant de résoudre des ID inconnus                                                                  |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que l’exécuteur intégré utilise le modèle résolu                                       | Le provider a besoin de réécritures de transport tout en utilisant un transport du cœur                                                       |
| 14  | `contributeResolvedModelCompat`   | Contribue des drapeaux de compatibilité pour des modèles fournisseur derrière un autre transport compatible    | Le provider reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du provider                                       |
| 15  | `capabilities`                    | Métadonnées de transcription/outillage appartenant au provider, utilisées par la logique partagée du cœur      | Le provider a besoin de particularités liées à la transcription/à la famille de providers                                                     |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outils avant que l’exécuteur intégré ne les voie                                       | Le provider a besoin d’un nettoyage de schéma pour la famille de transport                                                                    |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma appartenant au provider après normalisation                                   | Le provider veut des avertissements sur les mots-clés sans apprendre au cœur des règles spécifiques au provider                              |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                               | Le provider a besoin d’une sortie reasoning/finale balisée au lieu de champs natifs                                                          |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                       | Le provider a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres spécifique au provider                              |
| 20  | `createStreamFn`                  | Remplace entièrement le chemin normal de flux par un transport personnalisé                                    | Le provider a besoin d’un protocole filaire personnalisé, et pas seulement d’un wrapper                                                      |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                      | Le provider a besoin de wrappers de compatibilité en-têtes/corps/modèle sans transport personnalisé                                          |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natives par tour pour le transport                                         | Le provider veut que les transports génériques envoient une identité de tour native au provider                                              |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de refroidissement de session                           | Le provider veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                  |
| 24  | `formatApiKey`                    | Formateur de profil d’auth : le profil stocké devient la chaîne `apiKey` du runtime                           | Le provider stocke des métadonnées d’auth supplémentaires et a besoin d’une forme de jeton runtime personnalisée                            |
| 25  | `refreshOAuth`                    | Surcharge de rafraîchissement OAuth pour des points de terminaison de rafraîchissement personnalisés ou une politique d’échec de rafraîchissement | Le provider ne correspond pas aux rafraîchisseurs partagés `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Indice de réparation ajouté lorsque le rafraîchissement OAuth échoue                                           | Le provider a besoin d’une consigne de réparation d’authentification appartenant au provider après échec du rafraîchissement                |
| 27  | `matchesContextOverflowError`     | Détecteur d’erreur de dépassement de fenêtre de contexte appartenant au provider                               | Le provider a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                 |
| 28  | `classifyFailoverReason`          | Classification du motif de failover appartenant au provider                                                    | Le provider peut mapper des erreurs brutes API/transport vers rate-limit/surcharge/etc                                                       |
| 29  | `isCacheTtlEligible`              | Politique de cache de prompt pour les providers proxy/backhaul                                                 | Le provider a besoin d’un contrôle TTL de cache spécifique au proxy                                                                           |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                 | Le provider a besoin d’un indice de récupération d’authentification manquante spécifique au provider                                         |
| 31  | `suppressBuiltInModel`            | Suppression de modèles amont obsolètes plus indice d’erreur facultatif visible par l’utilisateur              | Le provider doit masquer des lignes amont obsolètes ou les remplacer par un indice fournisseur                                               |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                          | Le provider a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                    |
| 33  | `resolveThinkingProfile`          | Ensemble de niveaux `/think`, libellés d’affichage et valeur par défaut spécifiques au modèle                 | Le provider expose une échelle Thinking personnalisée ou un libellé binaire pour des modèles sélectionnés                                    |
| 34  | `isBinaryThinking`                | Hook de compatibilité pour bascule de raisonnement on/off                                                      | Le provider n’expose qu’un Thinking binaire on/off                                                                                            |
| 35  | `supportsXHighThinking`           | Hook de compatibilité pour la prise en charge du raisonnement `xhigh`                                          | Le provider veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                           |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                       | Le provider possède la politique `/think` par défaut pour une famille de modèles                                                              |
| 37  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profil en direct et la sélection des smoke tests             | Le provider possède la correspondance des modèles préférés pour le direct/smoke                                                              |
| 38  | `prepareRuntimeAuth`              | Échange un identifiant configuré contre le vrai jeton/clé de runtime juste avant l’inférence                 | Le provider a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                    |
| 39  | `resolveUsageAuth`                | Résout les identifiants d’usage/facturation pour `/usage` et les surfaces d’état associées                   | Le provider a besoin d’une analyse personnalisée des jetons d’usage/quota ou d’un identifiant d’usage différent                             |
| 40  | `fetchUsageSnapshot`              | Récupère et normalise des instantanés d’usage/quota spécifiques au provider après résolution de l’authentification | Le provider a besoin d’un point de terminaison d’usage spécifique au provider ou d’un parseur de charge utile                              |
| 41  | `createEmbeddingProvider`         | Construit un adaptateur d’embeddings appartenant au provider pour la mémoire/recherche                        | Le comportement d’embeddings mémoire appartient au plugin provider                                                                            |
| 42  | `buildReplayPolicy`               | Renvoie une politique de relecture contrôlant la gestion de transcription pour le provider                    | Le provider a besoin d’une politique de transcription personnalisée (par exemple retrait des blocs Thinking)                                 |
| 43  | `sanitizeReplayHistory`           | Réécrit l’historique de relecture après le nettoyage générique de transcription                               | Le provider a besoin de réécritures spécifiques au provider au-delà des assistants partagés de Compaction                                    |
| 44  | `validateReplayTurns`             | Validation finale ou remodelage des tours de relecture avant l’exécuteur intégré                              | Le transport provider a besoin d’une validation plus stricte des tours après l’assainissement générique                                      |
| 45  | `onModelSelected`                 | Exécute des effets de bord post-sélection appartenant au provider                                             | Le provider a besoin de télémétrie ou d’un état appartenant au provider lorsqu’un modèle devient actif                                       |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin provider correspondant, puis parcourent les autres plugins provider capables de hooks
jusqu’à ce que l’un d’eux modifie réellement l’ID de modèle ou le transport/la configuration. Cela permet aux shims provider d’alias/compatibilité de fonctionner sans obliger l’appelant à savoir quel plugin intégré possède la réécriture. Si aucun hook provider ne réécrit une entrée de configuration prise en charge de la famille Google, le normaliseur de configuration Google intégré applique quand même ce nettoyage de compatibilité.

Si le provider a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requête personnalisé,
il s’agit d’une autre catégorie d’extension. Ces hooks servent au comportement provider
qui s’exécute toujours sur la boucle d’inférence normale d’OpenClaw.

### Exemple de provider

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

Les plugins provider intégrés combinent les hooks ci-dessus pour répondre aux besoins de chaque fournisseur en matière de catalogue,
d’authentification, de Thinking, de relecture et d’usage. L’ensemble faisant autorité des hooks vit avec
chaque plugin sous `extensions/` ; cette page illustre les formes plutôt que de
dupliquer la liste.

<AccordionGroup>
  <Accordion title="Providers de catalogue pass-through">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer les ID de modèle amont
    en amont du catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="Providers d’OAuth et de point de terminaison d’usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` à `resolveUsageAuth` +
    `fetchUsageSnapshot` pour gérer l’échange de jeton et l’intégration `/usage`.
  </Accordion>
  <Accordion title="Familles de relecture et nettoyage de transcription">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux providers d’opter pour
    une politique de transcription via `buildReplayPolicy` au lieu que chaque plugin
    réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Providers catalogue uniquement">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` et
    `volcengine` enregistrent uniquement `catalog` et s’appuient sur la boucle d’inférence partagée.
  </Accordion>
  <Accordion title="Assistants de flux spécifiques à Anthropic">
    Les en-têtes bêta, `/fast` / `serviceTier`, et `context1m` vivent dans le
    seam public `api.ts` / `contract-api.ts` du plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Assistants runtime

Les plugins peuvent accéder à certains assistants du cœur via `api.runtime`. Pour TTS :

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

- `textToSpeech` renvoie la charge utile normale de sortie TTS du cœur pour les surfaces de fichier/note vocale.
- Utilise la configuration et la sélection de provider `messages.tts` du cœur.
- Renvoie un tampon audio PCM + fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les providers.
- `listVoices` est facultatif par provider. Utilisez-le pour les sélecteurs de voix ou flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches comme la locale, le genre et des tags de personnalité pour des sélecteurs conscients du provider.
- OpenAI et ElevenLabs prennent actuellement en charge la téléphonie. Microsoft non.

Les plugins peuvent aussi enregistrer des providers speech via `api.registerSpeechProvider(...)`.

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

- Conservez la politique TTS, le fallback et la livraison de réponse dans le cœur.
- Utilisez les providers speech pour le comportement de synthèse appartenant au fournisseur.
- L’entrée historique Microsoft `edge` est normalisée vers l’ID provider `microsoft`.
- Le modèle de propriété préféré est centré sur l’entreprise : un plugin fournisseur peut posséder
  les providers texte, voix, image et futurs médias à mesure qu’OpenClaw ajoute ces contrats
  de capacité.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un provider typé unique
de compréhension des médias au lieu d’un sac clé/valeur générique :

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

- Conservez l’orchestration, le fallback, la configuration et le câblage des canaux dans le cœur.
- Conservez le comportement fournisseur dans le plugin provider.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même schéma :
  - le cœur possède le contrat de capacité et l’assistant runtime
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants runtime de compréhension des médias, les plugins peuvent appeler :

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
soit l’alias historique STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facultatif lorsque le MIME ne peut pas être déduit de façon fiable :
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour
  la compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du cœur (`tools.media.audio`) et l’ordre de fallback des providers.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
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

- `provider` et `model` sont des surcharges facultatives par exécution, pas des changements persistants de session.
- OpenClaw ne respecte ces champs de surcharge que pour les appelants de confiance.
- Pour les exécutions de repli appartenant au plugin, les opérateurs doivent faire un opt-in avec `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement toute cible.
- Les exécutions de sous-agent des plugins non fiables fonctionnent quand même, mais les demandes de surcharge sont rejetées au lieu de revenir silencieusement à un fallback.

Pour la recherche web, les plugins peuvent consommer l’assistant runtime partagé au lieu
de se brancher directement dans le câblage de l’outil agent :

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

Les plugins peuvent aussi enregistrer des providers de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Conservez la sélection du provider, la résolution des identifiants et la sémantique de requête partagée dans le cœur.
- Utilisez les providers de recherche web pour des transports de recherche spécifiques au fournisseur.
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

- `generate(...)` : génère une image en utilisant la chaîne configurée de providers de génération d’images.
- `listProviders(...)` : liste les providers disponibles de génération d’images et leurs capacités.

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

- `path` : chemin de route sous le serveur HTTP de la gateway.
- `auth` : obligatoire. Utilisez `"gateway"` pour exiger l’authentification gateway normale, ou `"plugin"` pour une authentification/validation de Webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoyer `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec différents niveaux `auth` sont rejetées. Conservez les chaînes de retombée `exact`/`prefix` uniquement au même niveau d’authentification.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime operator. Elles sont destinées aux Webhooks/validations de signature gérés par plugin, pas aux appels privilégiés aux assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) garde les portées runtime des routes plugin épinglées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP fiables porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une ingress privée) n’honorent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route plugin porteuses d’identité, la portée runtime revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route plugin avec auth gateway soit implicitement une surface admin. Si votre route a besoin d’un comportement réservé à l’administration, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite d’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK plugin

Utilisez des sous-chemins SDK étroits plutôt que le barrel racine monolithique `openclaw/plugin-sdk`
lorsque vous écrivez de nouveaux plugins. Sous-chemins du cœur :

| Sous-chemin                         | Rôle                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de plugin              |
| `openclaw/plugin-sdk/channel-core`  | Assistants d’entrée/construction de canal          |
| `openclaw/plugin-sdk/core`          | Assistants partagés génériques et contrat ombrelle |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent parmi une famille de seams étroits — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
sur un unique contrat `approvalCapability` au lieu de se mélanger entre des champs
de plugin sans rapport. Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les assistants runtime et configuration vivent sous des sous-chemins `*-runtime`
correspondants (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` est obsolète — c’est un shim de compatibilité pour
les anciens plugins. Le nouveau code doit importer des primitives génériques plus étroites à la place.
</Info>

Points d’entrée internes au dépôt (par racine de paquet de plugin intégré) :

- `index.js` — entrée du plugin intégré
- `api.js` — barrel d’assistants/types
- `runtime-api.js` — barrel runtime uniquement
- `setup-entry.js` — entrée du plugin de configuration

Les plugins externes doivent uniquement importer des sous-chemins `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` d’un autre paquet de plugin depuis le cœur ou depuis un autre plugin.
Les points d’entrée chargés via façade préfèrent l’instantané actif de configuration du runtime lorsqu’il existe,
puis reviennent au fichier de configuration résolu sur disque.

Les sous-chemins spécifiques à une capacité comme `image-generation`, `media-understanding`
et `speech` existent parce que les plugins intégrés les utilisent aujourd’hui. Ils ne sont pas
automatiquement des contrats externes figés à long terme — consultez la page de référence SDK
pertinente avant de vous appuyer dessus.

## Schémas d’outil de message

Les plugins doivent posséder les contributions de schéma `describeMessageTool(...)` spécifiques au canal
pour les primitives non liées au message telles que les réactions, lectures et sondages.
La présentation partagée d’envoi doit utiliser le contrat générique `MessagePresentation`
au lieu des champs natifs au provider pour boutons, composants, blocs ou cartes.
Voir [Message Presentation](/fr/plugins/message-presentation) pour le contrat,
les règles de fallback, le mapping provider et la checklist pour auteurs de plugin.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent rendre via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il faut rendre la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires UI natives au provider depuis l’outil de message générique.
Les assistants SDK obsolètes pour d’anciens schémas natifs restent exportés pour les
plugins tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique des cibles spécifiques au canal. Gardez l’hôte sortant partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles provider :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type ID au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le fallback du plugin lorsque
  le cœur a besoin d’une résolution finale appartenant au provider après normalisation ou après un échec de recherche dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au provider
  une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un ID de cible explicite/native ».
- Utilisez `resolveTarget` pour le fallback de normalisation spécifique au provider, pas pour
  une recherche large dans l’annuaire.
- Conservez les ID natifs au provider comme ID de chat, ID de fil, JID, handles et ID de salon
  dans les valeurs `target` ou les paramètres spécifiques au provider, pas dans les champs génériques du SDK.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire depuis la configuration doivent conserver cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration comme :

- des pairs DM pilotés par liste d’autorisation
- des mappings canal/groupe configurés
- des fallbacks d’annuaire statiques limités au compte

Les assistants partagés de `directory-runtime` ne gèrent que des opérations génériques :

- filtrage des requêtes
- application des limites
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ID doivent rester dans l’implémentation du plugin.

## Catalogues de providers

Les plugins provider peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée provider
- `{ providers }` pour plusieurs entrées provider

Utilisez `catalog` lorsque le plugin possède des ID de modèle spécifiques au provider, des valeurs par défaut de `baseUrl`, ou des métadonnées de modèle dépendantes de l’authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne par rapport aux
providers implicites intégrés d’OpenClaw :

- `simple` : providers simples pilotés par clé API ou environnement
- `profile` : providers qui apparaissent lorsque des profils d’authentification existent
- `paired` : providers qui synthétisent plusieurs entrées provider liées
- `late` : dernier passage, après les autres providers implicites

Les providers plus tardifs l’emportent en cas de collision de clé, de sorte que les plugins peuvent intentionnellement remplacer une entrée provider intégrée avec le même ID provider.

Compatibilité :

- `discovery` fonctionne toujours comme alias historique
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection de canal en lecture seule

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin runtime. Il est autorisé à supposer que les identifiants
  sont entièrement matérialisés et peut échouer immédiatement lorsque les secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/réparation de configuration
  ne doivent pas avoir à matérialiser des identifiants runtime simplement pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Retourner uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure des champs source/statut d’identifiant lorsque c’est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons uniquement pour signaler une
  disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant)
  suffit pour les commandes de type status.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande » au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

## Packs de paquets

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

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’ID du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Barrière de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui s’échappent du répertoire de paquet sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances du plugin avec un
`npm install --omit=dev --ignore-scripts` local au projet (pas de scripts de cycle de vie,
pas de dépendances dev à l’exécution), en ignorant les paramètres globaux hérités d’installation npm.
Gardez les arbres de dépendances de plugin « JS/TS purs » et évitez les paquets qui exigent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger de configuration uniquement.
Lorsque OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela garde le démarrage et la configuration plus légers
lorsque votre entrée principale du plugin câble aussi des outils, hooks ou autre code runtime uniquement.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un plugin de canal au même chemin `setupEntry` pendant la phase
de démarrage pre-listen de la gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement lorsque `setupEntry` couvre complètement la surface de démarrage qui doit exister
avant que la gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer toute capacité appartenant au canal dont le démarrage dépend, comme :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la gateway ne commence à écouter
- toute méthode gateway, outil ou service qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger
l’entrée complète au démarrage.

Les canaux intégrés peuvent aussi publier des assistants de surface de contrat uniquement pour la configuration que le cœur
peut consulter avant le chargement complet du runtime du canal. La surface actuelle de promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une ancienne configuration de canal à compte unique
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple intégré actuel : il déplace uniquement les clés d’auth/bootstrap dans un
compte nommé promu lorsque des comptes nommés existent déjà, et il peut préserver une clé
de compte par défaut configurée non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent paresseuse la découverte de surface de contrat des plugins intégrés.
Le temps d’importation reste léger ; la surface de promotion n’est chargée qu’au premier usage au lieu de
réentrer dans le démarrage du canal intégré lors de l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, gardez-les sur un
préfixe spécifique au plugin. Les espaces de noms admin du cœur (`config.*`,
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
des indices d’installation via `openclaw.install`. Cela permet au cœur de ne contenir aucune donnée de catalogue.

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
      "blurb": "Discussion auto-hébergée via les bots Webhook Nextcloud Talk.",
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
- `preferOver` : ID de plugin/canal de priorité plus basse que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de texte pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il vaut `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsqu’il vaut `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : anciens alias encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait opter le canal au flux standard quickstart `allowFrom`
- `forceAccountBinding` : exige un binding explicite de compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple une
exportation de registre MPM). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme anciens alias de la clé `"entries"`.

Les entrées générées de catalogue de canaux et les entrées de catalogue d’installation provider exposent
des faits normalisés sur la source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés identifient si la spécification npm est une version exacte ou un sélecteur flottant, si des métadonnées d’intégrité attendues sont présentes et si un chemin source local est aussi disponible. Lorsque l’identité du catalogue/paquet est connue, les faits normalisés avertissent si le nom de paquet npm analysé dérive de cette identité.
Ils avertissent aussi lorsque `defaultChoice` est invalide ou pointe vers une source qui n’est
pas disponible, et lorsque des métadonnées d’intégrité npm sont présentes sans source npm valide.
Les consommateurs doivent traiter `installSource` comme un champ facultatif additif afin que
les entrées construites à la main et les shims de catalogue n’aient pas à le synthétiser.
Cela permet à l’onboarding et aux diagnostics d’expliquer l’état du plan de source sans
importer le runtime du plugin.

Les entrées npm externes officielles doivent préférer un `npmSpec` exact plus
`expectedIntegrity`. Les noms de paquet nus et les dist-tags fonctionnent encore pour
compatibilité, mais ils affichent des avertissements de plan de source afin que le catalogue puisse évoluer
vers des installations épinglées avec vérification d’intégrité sans casser les plugins existants.
Lorsque l’onboarding installe depuis un chemin de catalogue local, il enregistre une entrée d’index de plugin géré
avec `source: "path"` et un `sourcePath`
relatif à l’espace de travail lorsque c’est possible. Le chemin de chargement opérationnel absolu reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer les chemins de station de travail locale
dans la configuration persistante. Cela garde les installations de développement local visibles pour les diagnostics du plan de source sans ajouter une seconde surface brute de divulgation de chemin du système de fichiers.
L’index persistant de plugins `plugins/installs.json` est la source de vérité pour les installations et peut être rafraîchi sans charger les modules runtime de plugin.
Sa map `installRecords` est durable même lorsqu’un manifeste de plugin est manquant ou invalide ; son tableau `plugins` est une vue de manifeste/cache reconstructible.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin a besoin de remplacer ou d’étendre le pipeline de contexte par défaut
plutôt que d’ajouter simplement une recherche mémoire ou des hooks.

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

Si votre moteur ne possède **pas** l’algorithme de Compaction, gardez `compact()`
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

## Ajouter une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de plugins via une intrusion privée. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez du comportement partagé que le cœur doit posséder : politique, fallback, fusion de configuration,
   cycle de vie, sémantique orientée canal et forme de l’assistant runtime.
2. ajouter des surfaces typées d’enregistrement/runtime de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite surface de capacité typée utile.
3. câbler le cœur + les consommateurs canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseurs enregistrent ensuite leurs backends sur cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la forme de propriété et d’enregistrement reste explicite dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la vision du monde
d’un seul provider. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une checklist concrète de fichiers et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher
ensemble ces surfaces :

- les types de contrat du cœur dans `src/<capability>/types.ts`
- le runner/l’assistant runtime du cœur dans `src/<capability>/runtime.ts`
- la surface d’enregistrement de l’API plugin dans `src/plugins/types.ts`
- le câblage du registre de plugins dans `src/plugins/registry.ts`
- l’exposition runtime de plugin dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal
  doivent la consommer
- les assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- les assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- la documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité
n’est pas encore complètement intégrée.

### Modèle de capacité

Schéma minimal :

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

// assistant runtime partagé pour les plugins de fonctionnalité/canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Schéma de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseurs possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les assistants runtime
- les tests de contrat gardent la propriété explicite

## Connexe

- [Architecture des plugins](/fr/plugins/architecture) — modèle public des capacités et formes
- [Sous-chemins du SDK plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
