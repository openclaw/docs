---
read_when:
    - Implémenter des hooks d’exécution de fournisseur, le cycle de vie d’un canal ou des packs de paquets
    - Déboguer l’ordre de chargement des Plugins ou l’état du registre
    - Ajouter une nouvelle capacité de Plugin ou un Plugin de moteur de contexte
summary: 'Architecture interne des Plugins : pipeline de chargement, registre, hooks d’exécution, routes HTTP et tables de référence'
title: Architecture interne des Plugins
x-i18n:
    generated_at: "2026-04-25T13:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Pour le modèle public de capacités, les formes de Plugin et les contrats de propriété/exécution,
voir [Architecture des Plugins](/fr/plugins/architecture). Cette page est la
référence pour les mécanismes internes : pipeline de chargement, registre, hooks d’exécution,
routes HTTP Gateway, chemins d’import et tables de schéma.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines candidates de Plugin
2. lit les manifestes natifs ou de bundles compatibles et les métadonnées de paquet
3. rejette les candidats dangereux
4. normalise la configuration des Plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation pour chaque candidat
6. charge les modules natifs activés : les modules inclus déjà construits utilisent un chargeur natif ;
   les Plugins natifs non construits utilisent jiti
7. appelle les hooks natifs `register(api)` et collecte les enregistrements dans le registre de Plugins
8. expose le registre aux surfaces de commandes/d’exécution

<Note>
`activate` est un alias historique de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même moment. Tous les Plugins inclus utilisent `register` ; préférez `register` pour les nouveaux Plugins.
</Note>

Les garde-fous de sécurité ont lieu **avant** l’exécution à l’exécution. Les candidats sont bloqués
lorsque l’entrée s’échappe de la racine du Plugin, que le chemin est accessible en écriture par tous, ou que la
propriété du chemin semble suspecte pour les Plugins non inclus.

### Comportement centré sur le manifeste

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le Plugin
- découvrir les canaux/Skills/schéma de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de Control UI
- afficher les métadonnées d’installation/catalogue
- préserver des descripteurs d’activation et de configuration économiques sans charger le runtime du Plugin

Pour les Plugins natifs, le module d’exécution est la partie plan de données. Il enregistre
le comportement réel comme les hooks, outils, commandes ou flux provider.

Les blocs facultatifs de manifeste `activation` et `setup` restent sur le plan de contrôle.
Ce sont des descripteurs à métadonnées seules pour la planification d’activation et la découverte de configuration ;
ils ne remplacent pas l’enregistrement à l’exécution, `register(...)` ou `setupEntry`.
Les premiers consommateurs d’activation vivante utilisent maintenant les indices de manifeste sur commandes, canaux et providers
pour réduire le chargement des Plugins avant une matérialisation plus large du registre :

- le chargement CLI se limite aux Plugins qui possèdent la commande primaire demandée
- la résolution de configuration/résolution de Plugin de canal se limite aux Plugins qui possèdent l’identifiant
  de canal demandé
- la résolution explicite de configuration/runtime de provider se limite aux Plugins qui possèdent l’identifiant
  de provider demandé

Le planificateur d’activation expose à la fois une API d’identifiants seuls pour les appelants existants et une
API de plan pour les nouveaux diagnostics. Les entrées de plan indiquent pourquoi un Plugin a été sélectionné,
en séparant les indices explicites de planificateur `activation.*` du repli de propriété basé sur le manifeste
comme `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` et hooks. Cette séparation des raisons est la limite de compatibilité :
les métadonnées de Plugin existantes continuent de fonctionner, tandis que le nouveau code peut détecter des indices larges
ou un comportement de repli sans modifier la sémantique de chargement à l’exécution.

La découverte de configuration préfère maintenant des identifiants possédés par le descripteur tels que `setup.providers` et
`setup.cliBackends` pour réduire les Plugins candidats avant de revenir à
`setup-api` pour les Plugins qui ont encore besoin de hooks de runtime de configuration. Le flux de configuration de provider utilise
d’abord le manifeste `providerAuthChoices`, puis revient aux choix d’assistant à l’exécution et aux choix de catalogue d’installation pour
compatibilité. `setup.requiresRuntime: false` explicite est un point d’arrêt à descripteur seul ; un
`requiresRuntime` omis conserve le repli historique `setup-api` pour compatibilité. Si plus
d’un Plugin découvert revendique le même identifiant normalisé de provider de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de
découverte. Lorsque le runtime de configuration s’exécute effectivement, les diagnostics du registre signalent une dérive entre
`setup.providers` / `setup.cliBackends` et les providers ou backends CLI enregistrés par `setup-api` sans bloquer les Plugins historiques.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en mémoire pour le processus pour :

- les résultats de découverte
- les données du registre de manifeste
- les registres de Plugins chargés

Ces caches réduisent les pics de démarrage et le coût des commandes répétées. Il est sûr
de les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Remarque de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les Plugins chargés ne modifient pas directement des globales cœur arbitraires. Ils s’enregistrent dans un
registre central de Plugins.

Le registre suit :

- les enregistrements de Plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks historiques et les hooks typés
- les canaux
- les providers
- les gestionnaires RPC Gateway
- les routes HTTP
- les registrars CLI
- les services d’arrière-plan
- les commandes possédées par le Plugin

Les fonctionnalités cœur lisent ensuite depuis ce registre au lieu de parler directement aux modules Plugin.
Cela garde un chargement à sens unique :

- module Plugin -> enregistrement dans le registre
- runtime cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces cœur n’ont
besoin que d’un seul point d’intégration : « lire le registre », pas « gérer spécialement chaque
module Plugin ».

## Callbacks de liaison de conversation

Les Plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une demande de liaison
a été approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Une liaison existe maintenant pour ce Plugin + cette conversation.
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

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indication de détachement, l’identifiant d’expéditeur et les
  métadonnées de conversation

Ce callback est uniquement une notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation du cœur.

## Hooks d’exécution de provider

Les Plugins provider ont trois couches :

- **Métadonnées de manifeste** pour une recherche économique avant runtime :
  `setup.providers[].envVars`, la compatibilité dépréciée `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` et `channelEnvVars`.
- **Hooks au moment de la configuration** : `catalog` (ancien `discovery`) plus
  `applyConfigDefaults`.
- **Hooks d’exécution** : plus de 40 hooks facultatifs couvrant l’authentification, la résolution de modèle,
  l’enveloppement de flux, les niveaux de réflexion, la politique de relecture et les points de terminaison d’usage. Voir
  la liste complète sous [Ordre et usage des hooks](#hook-order-and-usage).

OpenClaw continue à posséder la boucle générique d’agent, le failover, la gestion des transcriptions et la
politique des outils. Ces hooks sont la surface d’extension pour le comportement spécifique au provider sans
nécessiter tout un transport d’inférence personnalisé.

Utilisez le manifeste `setup.providers[].envVars` lorsque le provider possède des
crédentials basés sur env que les chemins génériques d’authentification/statut/sélecteur de modèle doivent voir sans
charger le runtime du Plugin. Le champ déprécié `providerAuthEnvVars` est toujours lu par l’adaptateur
de compatibilité pendant la fenêtre de dépréciation, et les Plugins non inclus qui l’utilisent reçoivent un diagnostic de manifeste. Utilisez le manifeste `providerAuthAliases` lorsqu’un identifiant
de provider doit réutiliser les variables env, profils d’authentification,
authentification adossée à la configuration et choix d’onboarding par clé d’API d’un autre identifiant de provider. Utilisez le manifeste
`providerAuthChoices` lorsque les surfaces CLI d’onboarding/choix d’authentification doivent connaître l’identifiant de choix du provider, les libellés de groupe et le câblage simple d’authentification en un seul indicateur sans
charger le runtime du provider. Conservez dans le runtime du provider
`envVars` les indications destinées aux opérateurs comme les libellés d’onboarding ou les variables de configuration du
client-id/client-secret OAuth.

Utilisez le manifeste `channelEnvVars` lorsqu’un canal possède une authentification ou une configuration pilotée par env que
le repli générique shell-env, les vérifications de config/statut ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre et usage des hooks

Pour les Plugins modèle/provider, OpenClaw appelle les hooks dans cet ordre approximatif.
La colonne « Quand l’utiliser » est le guide de décision rapide.

| #   | Hook                              | Ce qu’il fait                                                                                                  | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publie la configuration provider dans `models.providers` pendant la génération de `models.json`               | Le provider possède un catalogue ou des valeurs par défaut d’URL de base                                                                      |
| 2   | `applyConfigDefaults`             | Applique les valeurs par défaut globales possédées par le provider pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’environnement ou de la sémantique de famille de modèles du provider        |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal de registre/catalogue                                                 | _(pas un hook de Plugin)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normalise les alias historiques ou de préversion d’identifiants de modèle avant la recherche                  | Le provider possède le nettoyage des alias avant la résolution canonique du modèle                                                            |
| 4   | `normalizeTransport`              | Normalise `api` / `baseUrl` de famille de provider avant l’assemblage générique du modèle                     | Le provider possède le nettoyage du transport pour des identifiants de provider personnalisés dans la même famille de transport               |
| 5   | `normalizeConfig`                 | Normalise `models.providers.<id>` avant la résolution runtime/provider                                         | Le provider a besoin d’un nettoyage de configuration qui doit vivre avec le Plugin ; les helpers intégrés de la famille Google servent aussi de garde-fou pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Applique des réécritures de compatibilité d’usage du streaming natif aux providers configurés                 | Le provider a besoin de correctifs de métadonnées d’usage du streaming natif pilotés par point de terminaison                                |
| 7   | `resolveConfigApiKey`             | Résout l’authentification par marqueur env pour les providers configurés avant le chargement de l’authentification runtime | Le provider possède sa propre résolution de clé d’API par marqueur env ; `amazon-bedrock` possède aussi ici un résolveur intégré de marqueurs env AWS |
| 8   | `resolveSyntheticAuth`            | Expose une authentification locale/autohébergée ou adossée à la configuration sans persister de texte en clair | Le provider peut fonctionner avec un marqueur de crédentials synthétique/local                                                                |
| 9   | `resolveExternalAuthProfiles`     | Superpose les profils d’authentification externes possédés par le provider ; la valeur par défaut `persistence` est `runtime-only` pour les crédentials possédés par CLI/app | Le provider réutilise des crédentials d’authentification externes sans persister des jetons de rafraîchissement copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Abaisse les placeholders de profil synthétique stockés derrière l’authentification adossée à env/config       | Le provider stocke des profils placeholder synthétiques qui ne doivent pas gagner en priorité                                                 |
| 11  | `resolveDynamicModel`             | Repli synchrone pour les identifiants de modèle possédés par le provider qui ne sont pas encore dans le registre local | Le provider accepte des identifiants arbitraires de modèles amont                                                                             |
| 12  | `prepareDynamicModel`             | Échauffement asynchrone, puis `resolveDynamicModel` s’exécute de nouveau                                       | Le provider a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                        |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner intégré n’utilise le modèle résolu                                       | Le provider a besoin de réécritures de transport mais utilise encore un transport cœur                                                        |
| 14  | `contributeResolvedModelCompat`   | Contribue des indicateurs de compatibilité pour des modèles fournisseur derrière un autre transport compatible | Le provider reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du provider                                       |
| 15  | `capabilities`                    | Métadonnées de transcription/outillage possédées par le provider utilisées par la logique cœur partagée       | Le provider a besoin d’anomalies propres aux familles de provider/transcription                                                               |
| 16  | `normalizeToolSchemas`            | Normalise les schémas d’outil avant que le runner intégré ne les voie                                          | Le provider a besoin d’un nettoyage de schéma propre à la famille de transport                                                                |
| 17  | `inspectToolSchemas`              | Expose des diagnostics de schéma possédés par le provider après normalisation                                  | Le provider veut des avertissements de mots-clés sans apprendre au cœur des règles spécifiques au provider                                   |
| 18  | `resolveReasoningOutputMode`      | Sélectionne le contrat de sortie de raisonnement natif ou balisé                                               | Le provider a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                       |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                        | Le provider a besoin de paramètres de requête par défaut ou d’un nettoyage de paramètres par provider                                         |
| 20  | `createStreamFn`                  | Remplace complètement le chemin normal du flux par un transport personnalisé                                   | Le provider a besoin d’un protocole sur le fil personnalisé, pas seulement d’un wrapper                                                      |
| 21  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                                                      | Le provider a besoin de wrappers de compatibilité d’en-têtes/corps/modèle sans transport personnalisé                                        |
| 22  | `resolveTransportTurnState`       | Attache des en-têtes ou métadonnées natives par tour de transport                                              | Le provider veut que les transports génériques envoient une identité de tour native au provider                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Attache des en-têtes WebSocket natifs ou une politique de délai de refroidissement de session                  | Le provider veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                                  |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne runtime `apiKey`                  | Le provider stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée                 |
| 25  | `refreshOAuth`                    | Surcharge du rafraîchissement OAuth pour des points de terminaison de rafraîchissement personnalisés ou une politique d’échec de rafraîchissement | Le provider ne correspond pas aux rafraîchisseurs partagés `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Indication de réparation ajoutée lorsque le rafraîchissement OAuth échoue                                      | Le provider a besoin d’une indication de réparation d’authentification qui lui est propre après un échec de rafraîchissement                |
| 27  | `matchesContextOverflowError`     | Correspondance des dépassements de fenêtre de contexte possédée par le provider                                | Le provider a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                 |
| 28  | `classifyFailoverReason`          | Classification des raisons de failover possédée par le provider                                                | Le provider peut mapper des erreurs API/transport brutes vers rate-limit/surcharge/etc.                                                      |
| 29  | `isCacheTtlEligible`              | Politique de cache d’invite pour les providers proxy/backhaul                                                  | Le provider a besoin d’un filtrage TTL de cache spécifique au proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                 | Le provider a besoin d’une indication de récupération spécifique en cas d’authentification manquante                                          |
| 31  | `suppressBuiltInModel`            | Suppression de modèles amont obsolètes plus indication d’erreur facultative destinée à l’utilisateur          | Le provider a besoin de masquer des lignes amont obsolètes ou de les remplacer par une indication fournisseur                                |
| 32  | `augmentModelCatalog`             | Lignes synthétiques/finales de catalogue ajoutées après découverte                                             | Le provider a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                     |
| 33  | `resolveThinkingProfile`          | Ensemble de niveaux `/think`, libellés d’affichage et valeur par défaut spécifiques au modèle                 | Le provider expose une échelle de réflexion personnalisée ou un libellé binaire pour des modèles sélectionnés                                |
| 34  | `isBinaryThinking`                | Hook de compatibilité du basculement de raisonnement on/off                                                    | Le provider n’expose qu’un raisonnement binaire activé/désactivé                                                                              |
| 35  | `supportsXHighThinking`           | Hook de compatibilité de prise en charge du raisonnement `xhigh`                                               | Le provider veut `xhigh` seulement sur un sous-ensemble de modèles                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité du niveau `/think` par défaut                                                            | Le provider possède la politique `/think` par défaut pour une famille de modèles                                                              |
| 37  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profil en direct et la sélection smoke                   | Le provider possède la correspondance de modèle préféré en direct/smoke                                                                       |
| 38  | `prepareRuntimeAuth`              | Échange un crédential configuré contre le véritable jeton/clé runtime juste avant l’inférence                 | Le provider a besoin d’un échange de jeton ou d’un crédential de requête de courte durée                                                     |
| 39  | `resolveUsageAuth`                | Résout les crédentials d’usage/facturation pour `/usage` et les surfaces de statut associées                 | Le provider a besoin d’une analyse personnalisée du jeton d’usage/quota ou d’un crédential d’usage différent                                 |
| 40  | `fetchUsageSnapshot`              | Récupère et normalise des snapshots d’usage/quota spécifiques au provider une fois l’authentification résolue | Le provider a besoin d’un point de terminaison d’usage spécifique ou d’un parseur de charge utile                                            |
| 41  | `createEmbeddingProvider`         | Construit un adaptateur d’embedding possédé par le provider pour mémoire/recherche                            | Le comportement d’embedding mémoire appartient au Plugin provider                                                                             |
| 42  | `buildReplayPolicy`               | Renvoie une politique de relecture contrôlant la gestion de transcription pour le provider                    | Le provider a besoin d’une politique de transcription personnalisée (par exemple, suppression des blocs de réflexion)                         |
| 43  | `sanitizeReplayHistory`           | Réécrit l’historique de relecture après le nettoyage générique de transcription                               | Le provider a besoin de réécritures spécifiques au provider au-delà des helpers partagés de Compaction                                       |
| 44  | `validateReplayTurns`             | Validation finale ou remodelage des tours de relecture avant le runner intégré                                | Le transport du provider a besoin d’une validation de tour plus stricte après l’assainissement générique                                     |
| 45  | `onModelSelected`                 | Exécute des effets de bord post-sélection possédés par le provider                                            | Le provider a besoin de télémétrie ou d’état possédé par le provider lorsqu’un modèle devient actif                                           |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
Plugin provider correspondant, puis parcourent les autres Plugins provider capables de hooks
jusqu’à ce qu’un d’eux modifie réellement l’identifiant de modèle ou le transport/la configuration. Cela permet
aux shims de compatibilité/provider d’alias de fonctionner sans obliger l’appelant à savoir quel
Plugin inclus possède la réécriture. Si aucun hook provider ne réécrit une entrée de configuration
prise en charge de la famille Google, le normaliseur intégré de configuration Google applique quand même
ce nettoyage de compatibilité.

Si le provider a besoin d’un protocole sur le fil entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
c’est une autre classe d’extension. Ces hooks concernent un comportement provider qui
s’exécute toujours sur la boucle d’inférence normale d’OpenClaw.

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

Les Plugins provider inclus combinent les hooks ci-dessus pour répondre aux besoins de chaque fournisseur en matière de catalogue,
authentification, réflexion, relecture et usage. L’ensemble de hooks faisant autorité vit avec
chaque Plugin sous `extensions/` ; cette page illustre les formes plutôt que de
reproduire la liste.

<AccordionGroup>
  <Accordion title="Providers de catalogue en passage direct">
    OpenRouter, Kilocode, Z.AI, xAI enregistrent `catalog` plus
    `resolveDynamicModel` / `prepareDynamicModel` afin de pouvoir exposer des
    identifiants de modèle amont avant le catalogue statique d’OpenClaw.
  </Accordion>
  <Accordion title="Providers OAuth et point de terminaison d’usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associent
    `prepareRuntimeAuth` ou `formatApiKey` avec `resolveUsageAuth` +
    `fetchUsageSnapshot` pour posséder l’échange de jeton et l’intégration `/usage`.
  </Accordion>
  <Accordion title="Familles de relecture et nettoyage de transcription">
    Les familles nommées partagées (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettent aux providers d’opter pour
    une politique de transcription via `buildReplayPolicy` au lieu que chaque Plugin
    réimplémente le nettoyage.
  </Accordion>
  <Accordion title="Providers catalogue uniquement">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, et
    `volcengine` enregistrent uniquement `catalog` et utilisent la boucle d’inférence partagée.
  </Accordion>
  <Accordion title="Helpers de flux spécifiques à Anthropic">
    Les en-têtes bêta, `/fast` / `serviceTier`, et `context1m` vivent dans la
    jonction publique `api.ts` / `contract-api.ts` du Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans
    le SDK générique.
  </Accordion>
</AccordionGroup>

## Helpers d’exécution

Les Plugins peuvent accéder à certains helpers cœur sélectionnés via `api.runtime`. Pour TTS :

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

- `textToSpeech` renvoie la charge utile de sortie TTS cœur normale pour les surfaces fichier/note vocale.
- Utilise la configuration cœur `messages.tts` et la sélection de provider.
- Renvoie un tampon audio PCM + un taux d’échantillonnage. Les Plugins doivent rééchantillonner/encoder pour les providers.
- `listVoices` est facultatif selon le provider. Utilisez-le pour des sélecteurs de voix ou des flux de configuration possédés par le fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que locale, genre et tags de personnalité pour des sélecteurs sensibles au provider.
- OpenAI et ElevenLabs prennent en charge la téléphonie aujourd’hui. Microsoft non.

Les Plugins peuvent aussi enregistrer des providers de parole via `api.registerSpeechProvider(...)`.

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
- Utilisez les providers de parole pour le comportement de synthèse possédé par le fournisseur.
- L’entrée historique Microsoft `edge` est normalisée vers l’identifiant provider `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un seul Plugin fournisseur peut posséder
  des providers texte, parole, image et futurs médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension d’image/audio/vidéo, les Plugins enregistrent un provider typé
de compréhension des médias au lieu d’un sac générique clé/valeur :

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

- Gardez dans le cœur l’orchestration, le repli, la configuration et le câblage des canaux.
- Gardez le comportement fournisseur dans le Plugin provider.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et le helper d’exécution
  - les Plugins fournisseur enregistrent `api.registerVideoGenerationProvider(...)`
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

Pour la transcription audio, les Plugins peuvent utiliser soit le runtime de compréhension des médias
soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facultatif lorsque le type MIME ne peut pas être déduit de manière fiable :
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension image/audio/vidéo.
- Utilise la configuration audio cœur de compréhension des médias (`tools.media.audio`) et l’ordre de repli des providers.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

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

Remarques :

- `provider` et `model` sont des surcharges facultatives par exécution, pas des changements persistants de session.
- OpenClaw ne respecte ces champs de surcharge que pour des appelants de confiance.
- Pour les exécutions de repli possédées par le Plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour limiter les Plugins de confiance à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement toute cible.
- Les exécutions de sous-agents de Plugins non fiables fonctionnent toujours, mais les demandes de surcharge sont rejetées au lieu de revenir silencieusement à un repli.

Pour la recherche web, les Plugins peuvent consommer le helper d’exécution partagé au lieu
de s’immiscer dans le câblage des outils d’agent :

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

Les Plugins peuvent aussi enregistrer des providers de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Gardez dans le cœur la sélection de provider, la résolution de crédentials et la sémantique partagée de requête.
- Utilisez les providers de recherche web pour les transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les Plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil d’agent.

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

- `generate(...)` : génère une image en utilisant la chaîne configurée de providers de génération d’image.
- `listProviders(...)` : liste les providers disponibles de génération d’image et leurs capacités.

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

- `path` : chemin de route sous le serveur HTTP de la Gateway.
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification normale de la Gateway, ou `"plugin"` pour une authentification/validation de Webhook gérée par le Plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même Plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoyer `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement de Plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de Plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un Plugin ne peut pas remplacer la route d’un autre Plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de repli `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime opérateur. Elles sont destinées aux Webhooks/à la vérification de signature gérés par le Plugin, pas aux appels privilégiés aux helpers Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservative :
  - l’authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées runtime des routes de Plugin fixées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) respectent `x-openclaw-scopes` uniquement lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de Plugin porteuses d’identité, la portée runtime revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de Plugin authentifiée par la Gateway soit implicitement une surface admin. Si votre route a besoin d’un comportement réservé aux administrateurs, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’import du SDK Plugin

Utilisez des sous-chemins SDK étroits au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lors de l’écriture de nouveaux Plugins. Sous-chemins cœur :

| Sous-chemin                         | But                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de Plugin              |
| `openclaw/plugin-sdk/channel-core`  | Helpers d’entrée/construction de canal             |
| `openclaw/plugin-sdk/core`          | Helpers partagés génériques et contrat ombrelle    |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les Plugins de canal choisissent parmi une famille de jonctions étroites — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
sur un seul contrat `approvalCapability` plutôt que d’être mélangé à des champs de Plugin sans rapport.
Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).

Les helpers runtime et de configuration vivent sous des sous-chemins `*-runtime`
correspondants (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` est déprécié — c’est un shim de compatibilité pour
les anciens Plugins. Le nouveau code doit importer des primitives génériques plus étroites à la place.
</Info>

Points d’entrée internes au dépôt (par racine de paquet de Plugin inclus) :

- `index.js` — entrée de Plugin inclus
- `api.js` — barrel helpers/types
- `runtime-api.js` — barrel runtime uniquement
- `setup-entry.js` — entrée de Plugin de configuration

Les Plugins externes doivent importer uniquement des sous-chemins `openclaw/plugin-sdk/*`. N’importez
jamais le `src/*` d’un autre paquet Plugin depuis le cœur ou depuis un autre Plugin.
Les points d’entrée chargés via façade préfèrent le snapshot actif de configuration runtime lorsqu’il existe,
puis reviennent à la configuration résolue sur disque.

Les sous-chemins spécifiques à une capacité tels que `image-generation`, `media-understanding`,
et `speech` existent parce que les Plugins inclus les utilisent aujourd’hui. Ils ne sont pas
automatiquement des contrats externes figés à long terme — vérifiez la page de référence SDK pertinente
avant de vous y appuyer.

## Schémas de l’outil de message

Les Plugins doivent posséder les contributions de schéma `describeMessageTool(...)` spécifiques au canal
pour les primitives non message comme les réactions, lectures et sondages.
La présentation partagée d’envoi doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs provider de type bouton, composant, bloc ou carte.
Voir [Message Presentation](/fr/plugins/message-presentation) pour le contrat,
les règles de repli, le mappage provider et la liste de contrôle pour les auteurs de Plugin.

Les Plugins capables d’envoyer déclarent ce qu’ils peuvent afficher via les capacités de message :

- `presentation` pour les blocs de présentation sémantique (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il faut rendre la présentation nativement ou la dégrader en texte.
N’exposez pas d’échappatoires UI natives provider depuis l’outil de message générique.
Les helpers SDK dépréciés pour les anciens schémas natifs restent exportés pour les
Plugins tiers existants, mais les nouveaux Plugins ne doivent pas les utiliser.

## Résolution de cible de canal

Les Plugins de canal doivent posséder la sémantique spécifique au canal des cibles. Gardez l’hôte sortant partagé
générique et utilisez la surface d’adaptateur de messagerie pour les règles provider :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type identifiant au lieu d’une recherche d’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le repli Plugin lorsque
  le cœur a besoin d’une résolution finale possédée par le provider après normalisation ou après un
  échec de recherche dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route
  de session spécifique au provider une fois qu’une cible est résolue.

Répartition recommandée :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent avoir lieu avant
  la recherche des pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications « traiter ceci comme un identifiant de cible explicite/native ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au provider, pas pour une
  recherche large dans l’annuaire.
- Gardez les identifiants natifs provider comme les identifiants de chat, identifiants de fil, JID, handles et identifiants de salon
  à l’intérieur des valeurs `target` ou des paramètres spécifiques au provider, pas dans des champs SDK génériques.

## Annuaires adossés à la configuration

Les Plugins qui dérivent des entrées d’annuaire depuis la configuration doivent garder cette logique dans le
Plugin et réutiliser les helpers partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration tels que :

- pairs MP pilotés par une liste d’autorisation
- mappages configurés de canal/groupe
- replis d’annuaire statiques à portée de compte

Les helpers partagés de `directory-runtime` ne gèrent que des opérations génériques :

- filtrage de requête
- application des limites
- helpers de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte et la normalisation d’identifiant spécifiques au canal doivent rester dans
l’implémentation du Plugin.

## Catalogues de providers

Les Plugins provider peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de provider
- `{ providers }` pour plusieurs entrées de provider

Utilisez `catalog` lorsque le Plugin possède des identifiants de modèle spécifiques au provider, des valeurs par défaut d’URL de base ou des métadonnées de modèle filtrées par authentification.

`catalog.order` contrôle le moment où le catalogue d’un Plugin fusionne par rapport aux
providers implicites intégrés d’OpenClaw :

- `simple` : providers simples pilotés par clé API ou env
- `profile` : providers qui apparaissent lorsque des profils d’authentification existent
- `paired` : providers qui synthétisent plusieurs entrées de provider liées
- `late` : dernier passage, après les autres providers implicites

Les providers plus tardifs gagnent en cas de collision de clé, donc les Plugins peuvent intentionnellement remplacer une entrée de provider intégrée avec le même identifiant provider.

Compatibilité :

- `discovery` fonctionne encore comme alias historique
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection en lecture seule des canaux

Si votre Plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en parallèle de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d’exécution. Il est autorisé à supposer que les crédentials
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux de
  doctor/réparation de configuration ne devraient pas avoir besoin de matérialiser les crédentials d’exécution juste pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/statut des crédentials lorsque pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons juste pour signaler une disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant) suffit pour des commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un crédential est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande » au lieu de planter ou de signaler à tort que le compte n’est pas configuré.

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
après résolution des liens symboliques. Les entrées qui s’échappent du répertoire du paquet sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances de Plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances dev à l’exécution). Gardez les arbres de dépendances des Plugins en « JS/TS pur » et évitez les paquets qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsqu’OpenClaw a besoin de surfaces de configuration pour un Plugin de canal désactivé, ou
lorsqu’un Plugin de canal est activé mais toujours non configuré, il charge `setupEntry`
au lieu de l’entrée complète du Plugin. Cela allège le démarrage et la configuration
lorsque l’entrée principale du Plugin branche aussi des outils, hooks ou autre code réservé à l’exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire opter un Plugin de canal pour le même chemin `setupEntry` pendant la phase de
démarrage pré-écoute de la Gateway, même lorsque le canal est déjà configuré.

Utilisez ceci uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la Gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer toute capacité possédée par le canal dont le démarrage dépend, comme :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que la Gateway ne commence à écouter
- toute méthode Gateway, outil ou service qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
cet indicateur. Conservez le comportement par défaut du Plugin et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux inclus peuvent aussi publier des helpers de surface de contrat réservés à la configuration que le cœur
peut consulter avant que le runtime complet du canal ne soit chargé. La surface actuelle de
promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une ancienne configuration de canal mono-compte
vers `channels.<id>.accounts.*` sans charger l’entrée complète du Plugin.
Matrix est l’exemple intégré actuel : il déplace uniquement les clés d’authentification/initialisation
dans un compte nommé promu lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut configurée non canonique au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent paresseuse la découverte de la surface de contrat incluse. Le temps
d’importation reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal inclus à l’import du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC Gateway, gardez-les sur un
préfixe propre au Plugin. Les espaces de noms admin du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
vers `operator.admin`, même si un Plugin demande une portée plus étroite.

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

Les Plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela permet au catalogue cœur de rester sans données.

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

Champs utiles de `openclaw.channel` au-delà de l’exemple minimal :

- `detailLabel` : libellé secondaire pour des surfaces plus riches de catalogue/statut
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : identifiants de Plugin/canal de priorité plus basse que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de texte pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste de canaux configurés lorsqu’il vaut `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsque défini à `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias historiques encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait opter le canal pour le flux standard quickstart `allowFrom`
- `forceAccountBinding` : exige une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles announce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export de registre MPM).
Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias historiques de la clé `"entries"`.

Les entrées générées de catalogue de canaux et les entrées de catalogue d’installation de providers exposent
des faits normalisés de source d’installation à côté du bloc brut `openclaw.install`. Les
faits normalisés identifient si la spécification npm est une version exacte ou un sélecteur flottant,
si des métadonnées d’intégrité attendues sont présentes, et si un chemin source local est aussi disponible. Lorsque l’identité du catalogue/paquet est connue, les
faits normalisés avertissent si le nom du paquet npm analysé dérive de cette identité.
Ils avertissent aussi lorsque `defaultChoice` est invalide ou pointe vers une source qui
n’est pas disponible, et lorsque des métadonnées d’intégrité npm sont présentes sans source npm valide.
Les consommateurs doivent traiter `installSource` comme un champ facultatif additif afin que
les anciennes entrées construites à la main et les shims de compatibilité n’aient pas à le synthétiser.
Cela permet à l’onboarding et aux diagnostics d’expliquer l’état du plan source sans
importer le runtime du Plugin.

Les entrées npm externes officielles doivent préférer une valeur exacte `npmSpec` plus
`expectedIntegrity`. Les noms de paquet nus et les dist-tags continuent de fonctionner pour
compatibilité, mais ils affichent des avertissements de plan source afin que le catalogue puisse évoluer
vers des installations épinglées et vérifiées par intégrité sans casser les Plugins existants.
Lorsque l’onboarding installe depuis un chemin de catalogue local, il enregistre une
entrée `plugins.installs` avec `source: "path"` et un
`sourcePath` relatif à l’espace de travail lorsque c’est possible. Le chemin absolu de chargement opérationnel reste dans
`plugins.load.paths` ; l’enregistrement d’installation évite de dupliquer des chemins de poste local
dans la configuration durable. Cela rend visibles les installations de développement local pour les
diagnostics de plan source sans ajouter une seconde surface brute de divulgation de chemin système.

## Plugins de moteur de contexte

Les Plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre Plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre Plugin doit remplacer ou étendre le pipeline de contexte par défaut
plutôt que simplement ajouter une recherche mémoire ou des hooks.

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
implémenté et déléguez explicitement :

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

Lorsqu’un Plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de Plugins par un accès privé interne. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat cœur
   Décidez quel comportement partagé le cœur doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique côté canal, et forme du helper d’exécution.
2. ajouter des surfaces typées d’enregistrement/runtime de Plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la surface de capacité typée
   la plus petite utile.
3. câbler les consommateurs cœur + canal/fonctionnalité
   Les canaux et Plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les Plugins fournisseur enregistrent alors leurs backends contre cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste orienté sans devenir codé en dur sur la vision du monde d’un
provider unique. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une liste concrète de fichiers et un exemple complet.

### Liste de contrôle de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat cœur dans `src/<capability>/types.ts`
- runner cœur/helper d’exécution dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API Plugin dans `src/plugins/types.ts`
- câblage du registre Plugin dans `src/plugins/registry.ts`
- exposition du runtime Plugin dans `src/plugins/runtime/*` lorsque des Plugins de fonctionnalité/canal
  doivent la consommer
- helpers de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/Plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore complètement intégrée.

### Modèle de capacité

Modèle minimal :

```ts
// contrat cœur
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper d’exécution partagé pour les Plugins de fonctionnalité/canal
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
- les Plugins fournisseur possèdent les implémentations fournisseur
- les Plugins de fonctionnalité/canal consomment les helpers d’exécution
- les tests de contrat gardent la propriété explicite

## Lié

- [Architecture des Plugins](/fr/plugins/architecture) — modèle public de capacité et formes
- [Sous-chemins du SDK Plugin](/fr/plugins/sdk-subpaths)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
