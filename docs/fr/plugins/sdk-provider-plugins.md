---
read_when:
    - Vous créez un nouveau Plugin de fournisseur de modèle
    - Vous souhaitez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification du fournisseur, les catalogues et les hooks d’exécution.
sidebarTitle: Provider plugins
summary: Guide étape par étape pour créer un Plugin de fournisseur de modèle pour OpenClaw
title: Créer des Plugins de fournisseur
x-i18n:
    generated_at: "2026-04-26T11:35:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Ce guide vous explique comment créer un Plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous disposerez d’un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore créé aucun Plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour comprendre la structure de base
  du package et la configuration du manifeste.
</Info>

<Tip>
  Les Plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un daemon d’agent natif qui gère les threads, la Compaction ou les événements d’outils,
  associez le fournisseur à un [agent harness](/fr/plugins/sdk-agent-harness)
  au lieu d’intégrer les détails du protocole du daemon dans le cœur.
</Tip>

## Guide pas à pas

<Steps>
  <Step title="Package et manifeste">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Le manifeste déclare `providerAuthEnvVars` afin qu’OpenClaw puisse détecter
    les identifiants sans charger le runtime de votre Plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification d’un autre identifiant de fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre Plugin de fournisseur à partir
    d’identifiants de modèle abrégés comme `acme-large` avant même que les hooks de runtime n’existent. Si vous publiez le
    fournisseur sur ClawHub, les champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin d’un `id`, d’un `label`, de `auth` et de `catalog` :

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    Il s’agit d’un fournisseur fonctionnel. Les utilisateurs peuvent maintenant
    exécuter `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    Si le fournisseur en amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation de texte bidirectionnelle au lieu de remplacer le chemin de streaming :

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` réécrit le prompt système final et le contenu textuel des messages avant
    le transport. `output` réécrit les deltas de texte de l’assistant et le texte final avant
    qu’OpenClaw analyse ses propres marqueurs de contrôle ou effectue la livraison au canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur de texte avec une authentification par clé API
    plus un seul runtime adossé à un catalogue, utilisez de préférence l’assistant plus ciblé
    `defineSingleProviderPluginEntry(...)` :

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` est le chemin du catalogue actif utilisé lorsqu’OpenClaw peut résoudre une
    authentification réelle du fournisseur. Il peut effectuer une découverte spécifique au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour des lignes hors ligne qu’il est sûr d’afficher avant que l’authentification
    soit configurée ; il ne doit ni exiger d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les Plugins de fournisseur intégrés, avec une configuration vide, un environnement vide et aucun
    chemin d’agent/espace de travail.

    Si votre flux d’authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les assistants prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsque le point de terminaison natif d’un fournisseur prend en charge des blocs d’usage en streaming sur le
    transport normal `openai-completions`, utilisez de préférence les assistants de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` au lieu de coder en dur des vérifications d’identifiant de
    fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la carte de capacités
    du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope optent toujours
    pour cette compatibilité même lorsqu’un Plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
    Si votre fournisseur accepte des identifiants de modèle arbitraires (comme un proxy ou un routeur),
    ajoutez `resolveDynamicModel` :

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour un
    préchauffage asynchrone — `resolveDynamicModel` est exécuté de nouveau une fois celui-ci terminé.

  </Step>

  <Step title="Ajouter des hooks de runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement selon les besoins de votre fournisseur.

    Les constructeurs d’assistants partagés couvrent désormais les familles les plus courantes de
    rejeu/compatibilité des outils, donc les Plugins n’ont généralement pas besoin de raccorder chaque hook manuellement :

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Familles de rejeu actuellement disponibles :

    | Famille | Ce qu’elle configure | Exemples intégrés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de rejeu partagée de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement des identifiants d’appel d’outil, les corrections d’ordre assistant-en-premier et la validation générique des tours Gemini lorsque le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de rejeu sensible à Claude choisie par `modelId`, de sorte que les transports de messages Anthropic n’obtiennent le nettoyage spécifique aux blocs de réflexion de Claude que lorsque le modèle résolu est réellement un identifiant Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique de rejeu Gemini native plus assainissement du rejeu d’amorçage et mode de sortie de raisonnement balisé | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation native du rejeu Gemini ni les réécritures d’amorçage | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles de type messages Anthropic et compatibles OpenAI dans un même Plugin ; la suppression facultative des blocs de réflexion réservée à Claude reste limitée au côté Anthropic | `minimax` |

    Familles de streaming actuellement disponibles :

    | Famille | Ce qu’elle configure | Exemples intégrés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de streaming partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de streaming proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée | `kilocode` |
    | `moonshot-thinking` | Mappage de la charge utile native-thinking binaire de Moonshot à partir de la configuration + du niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle fast-mode de MiniMax sur le chemin de streaming partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers Responses natifs OpenAI/Codex partagés : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web Codex native, mise en forme de la charge utile de compatibilité de raisonnement et gestion du contexte Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec la gestion centralisée des sauts pour les modèles non pris en charge/`auto` | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf en cas de désactivation explicite | `zai` |

    <Accordion title="Points d’extension SDK qui alimentent les constructeurs de familles">
      Chaque constructeur de famille est composé d’assistants publics de plus bas niveau exportés depuis le même package, que vous pouvez utiliser lorsqu’un fournisseur doit sortir du schéma commun :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` et les constructeurs bruts de rejeu (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte également des assistants de rejeu Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ainsi que des assistants d’endpoint/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus les wrappers OpenAI/Codex partagés (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), le wrapper compatible OpenAI de DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) et les wrappers proxy/fournisseur partagés (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, les assistants sous-jacents de schéma Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) et les assistants de compatibilité xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Le Plugin xAI intégré utilise `normalizeResolvedModel` + `contributeResolvedModelCompat` avec ceux-ci afin que les règles xAI restent gérées par le fournisseur.

      Certains assistants de streaming restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs de wrappers Anthropic de plus bas niveau dans son propre point d’extension public `api.ts` / `contract-api.ts`, car ils encodent la gestion bêta de l’OAuth Claude et le contrôle `context1m`. Le Plugin xAI conserve de manière similaire la mise en forme native des Responses xAI dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage des outils stricts non pris en charge, suppression des charges utiles de raisonnement spécifiques à xAI).

      Le même schéma à la racine du package sous-tend également `@openclaw/openai-provider` (constructeurs de fournisseur, assistants de modèle par défaut, constructeurs de fournisseur temps réel) et `@openclaw/openrouter-provider` (constructeur de fournisseur plus assistants d’onboarding/configuration).
    </Accordion>

    <Tabs>
      <Tab title="Échange de jetons">
        Pour les fournisseurs qui ont besoin d’un échange de jetons avant chaque appel d’inférence :

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="En-têtes personnalisés">
        Pour les fournisseurs qui ont besoin d’en-têtes de requête personnalisés ou de modifications du corps de requête :

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Identité du transport natif">
        Pour les fournisseurs qui ont besoin d’en-têtes ou de métadonnées natifs de requête/session sur
        des transports HTTP ou WebSocket génériques :

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Utilisation et facturation">
        Pour les fournisseurs qui exposent des données d’utilisation/facturation :

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Tous les hooks de fournisseur disponibles">
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n’en utilisent que 2 ou 3 :

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de `baseUrl` |
      | 2 | `applyConfigDefaults` | Valeurs globales par défaut gérées par le fournisseur lors de la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’identifiant de modèle legacy/preview avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage de la famille de fournisseur `api` / `baseUrl` avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d’utilisation de streaming natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d’authentification par marqueur d’environnement gérée par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/autohébergée ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Faire passer les espaces réservés de profils stockés synthétiques après l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone des métadonnées avant la résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour les modèles d’un fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Sac statique de capacités legacy ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d’outils géré par le fournisseur avant l’enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics des schémas d’outils gérés par le fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisé vs natif |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport `StreamFn` entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers d’en-têtes/corps personnalisés sur le chemin de streaming normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs/refroidissement |
      | 23 | `formatApiKey` | Format personnalisé du jeton au runtime |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Indications de réparation d’authentification |
      | 26 | `matchesContextOverflowError` | Détection de dépassement de contexte gérée par le fournisseur |
      | 27 | `classifyFailoverReason` | Classification de limitation de débit/surcharge gérée par le fournisseur |
      | 28 | `isCacheTtlEligible` | Contrôle TTL du cache de prompts |
      | 29 | `buildMissingAuthMessage` | Indication personnalisée pour auth manquante |
      | 30 | `suppressBuiltInModel` | Masquer les lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité anticipée |
      | 32 | `resolveThinkingProfile` | Ensemble d’options `/think` spécifique au modèle |
      | 33 | `isBinaryThinking` | Compatibilité réflexion binaire activée/désactivée |
      | 34 | `supportsXHighThinking` | Compatibilité de prise en charge du raisonnement `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilité de la politique `/think` par défaut |
      | 36 | `isModernModelRef` | Correspondance de modèles live/smoke |
      | 37 | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | 38 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’utilisation |
      | 39 | `fetchUsageSnapshot` | Endpoint d’utilisation personnalisé |
      | 40 | `createEmbeddingProvider` | Adaptateur d’embedding géré par le fournisseur pour la mémoire/recherche |
      | 41 | `buildReplayPolicy` | Politique personnalisée de rejeu/Compaction de transcript |
      | 42 | `sanitizeReplayHistory` | Réécritures de rejeu spécifiques au fournisseur après le nettoyage générique |
      | 43 | `validateReplayTurns` | Validation stricte des tours de rejeu avant le runner embarqué |
      | 44 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarques sur le fallback du runtime :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres Plugins de fournisseur capables de hooks jusqu’à ce qu’un de ceux-ci modifie effectivement la configuration. Si aucun hook de fournisseur ne réécrit une entrée de configuration prise en charge de la famille Google, le normaliseur de configuration Google intégré continue de s’appliquer.
      - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu’il est exposé. Le chemin intégré `amazon-bedrock` dispose également ici d’un résolveur interne de marqueur d’environnement AWS, même si l’authentification runtime Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des indications de prompt système conscientes du cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à une seule famille fournisseur/modèle et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, voir [Internals: Provider Runtime Hooks](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    Un Plugin de fournisseur peut enregistrer la parole, la transcription temps réel, la
    voix temps réel, la compréhension des médias, la génération d’images, la génération de vidéos, la récupération web
    et la recherche web en plus de l’inférence texte. OpenClaw classe cela comme un
    Plugin **hybrid-capability** — le schéma recommandé pour les Plugins d’entreprise
    (un Plugin par fournisseur). Voir
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` à côté de votre appel existant
    `api.registerProvider(...)`. Choisissez uniquement les onglets dont vous avez besoin :

    <Tabs>
      <Tab title="Parole (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        Utilisez `assertOkOrThrowProviderError(...)` pour les échecs HTTP du fournisseur afin que
        les Plugins partagent des lectures plafonnées du corps d’erreur, l’analyse des erreurs JSON et
        les suffixes d’identifiant de requête.
      </Tab>
      <Tab title="Transcription temps réel">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` — l’assistant partagé
        gère la capture proxy, le backoff de reconnexion, la purge à la fermeture, les handshakes de disponibilité,
        la mise en file d’attente audio et les diagnostics d’événements de fermeture. Votre Plugin
        ne fait que mapper les événements amont.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Les fournisseurs STT par lot qui envoient de l’audio multipart en POST doivent utiliser
        `buildAudioTranscriptionFormData(...)` depuis
        `openclaw/plugin-sdk/provider-http`. L’assistant normalise les noms de fichiers
        envoyés, y compris les envois AAC qui nécessitent un nom de fichier de type M4A pour
        les API de transcription compatibles.
      </Tab>
      <Tab title="Voix temps réel">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
      </Tab>
      <Tab title="Compréhension des médias">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Génération d’images et de vidéos">
        Les capacités vidéo utilisent une forme **sensible au mode** : `generate`,
        `imageToVideo` et `videoToVideo`. Des champs agrégés plats comme
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent pas
        à indiquer clairement la prise en charge des modes de transformation ou les modes désactivés.
        La génération musicale suit le même schéma avec des blocs explicites `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Récupération web et recherche">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Récupérer des pages via le backend de rendu d’Acme.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Récupérer une page via Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Tester">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publier sur ClawHub

Les Plugins de fournisseur se publient de la même manière que n’importe quel autre Plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’alias de publication hérité réservé aux Skills ; les packages de Plugin doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # manifeste avec métadonnées d’authentification du fournisseur
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # tests
    └── usage.ts              # endpoint d’utilisation (facultatif)
```

## Référence sur l’ordre des catalogues

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Ordre     | Moment        | Cas d’usage                                     |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Première passe | Fournisseurs simples avec clé API               |
| `profile` | Après simple  | Fournisseurs conditionnés par des profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées             |
| `late`    | Dernière passe | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Channel Plugins](/fr/plugins/sdk-channel-plugins) — si votre Plugin fournit aussi un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) — assistants `api.runtime` (TTS, recherche, sous-agent)
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugin Internals](/fr/plugins/architecture-internals#provider-runtime-hooks) — détails des hooks et exemples intégrés

## Lié

- [Plugin SDK setup](/fr/plugins/sdk-setup)
- [Building plugins](/fr/plugins/building-plugins)
- [Building channel plugins](/fr/plugins/sdk-channel-plugins)
