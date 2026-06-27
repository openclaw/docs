---
read_when:
    - Vous créez un nouveau Plugin de fournisseur de modèle
    - Vous souhaitez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les hooks d’exécution
sidebarTitle: Provider plugins
summary: Guide pas à pas pour créer un plugin de fournisseur de modèle pour OpenClaw
title: Créer des Plugins de fournisseurs
x-i18n:
    generated_at: "2026-06-27T17:59:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Ce guide explique comment créer un plugin fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous disposerez d’un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore créé aucun plugin OpenClaw, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour comprendre la structure de package
  de base et la configuration du manifeste.
</Info>

<Tip>
  Les plugins fournisseurs ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un daemon d’agent natif qui possède les fils, la compaction ou les
  événements d’outils, associez le fournisseur à un [harnais d’agent](/fr/plugins/sdk-agent-harness)
  au lieu de placer les détails du protocole du daemon dans le cœur.
</Tip>

## Procédure pas à pas

<Steps>
  <Step title="Package et manifeste">
    ### Étape 1 : Package et manifeste

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
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
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

    Le manifeste déclare `setup.providers[].envVars` afin qu’OpenClaw puisse détecter
    les identifiants sans charger l’exécution de votre plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification de l’id d’un autre fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre plugin fournisseur à partir d’identifiants
    de modèle abrégés comme `acme-large` avant que les hooks d’exécution existent. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur de texte minimal nécessite un `id`, un `label`, une `auth` et un `catalog`.
    `catalog` est le hook d’exécution/configuration détenu par le fournisseur ; il peut appeler des
    API fournisseur en direct et retourne des entrées `models.providers`.

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

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` est la nouvelle surface de catalogue du plan de contrôle
    pour l’interface de liste/aide/sélection. Utilisez-la pour les lignes de texte, de génération d’images,
    de génération de vidéos et de génération de musique. Gardez les appels aux points de terminaison fournisseur et
    le mappage des réponses dans le plugin ; OpenClaw possède la forme de ligne partagée, les libellés
    de source et le rendu de l’aide.

    Il s’agit d’un fournisseur fonctionnel. Les utilisateurs peuvent maintenant exécuter
    `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    ### Découverte de modèles en direct

    Si votre fournisseur expose une API de type `/models`, conservez le point de terminaison
    spécifique au fournisseur et la projection des lignes dans votre plugin, puis utilisez
    `openclaw/plugin-sdk/provider-catalog-live-runtime` pour le cycle de vie de récupération partagé.
    L’assistant vous donne des récupérations HTTP protégées, des en-têtes d’authentification fournisseur,
    des erreurs HTTP structurées, une mise en cache TTL et un comportement de repli statique sans
    placer la politique fournisseur dans le cœur d’OpenClaw.

    Utilisez `buildLiveModelProviderConfig` lorsque l’API en direct vous indique uniquement quelles
    lignes du catalogue statique détenu par le fournisseur sont actuellement disponibles :

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    Utilisez `getCachedLiveProviderModelRows` lorsque l’API du fournisseur retourne des
    métadonnées plus riches et que le plugin doit lui-même projeter les lignes dans les
    définitions de modèles OpenClaw :

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` doit rester protégé par l’authentification et retourner `null` lorsqu’aucun identifiant utilisable
    n’est disponible. Conservez un `staticRun` hors ligne ou un repli statique afin que les surfaces de configuration,
    de documentation, de tests et de sélection ne dépendent pas d’un accès réseau en direct. Utilisez un TTL
    adapté à la fraîcheur de la liste des modèles, évitez l’interrogation du système de fichiers au moment des requêtes,
    et passez un `readRows` / `readModelId` spécifique au fournisseur uniquement lorsque la
    réponse en amont n’est pas une forme compatible OpenAI `{ data: [{ id, object }] }`.

    Si le fournisseur en amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation de texte bidirectionnelle au lieu de remplacer le chemin de flux :

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

    `input` réécrit le prompt système final et le contenu des messages texte avant
    le transport. `output` réécrit les deltas de texte de l’assistant et le texte final avant
    qu’OpenClaw analyse ses propres marqueurs de contrôle ou la livraison au canal.

    Pour les fournisseurs groupés qui enregistrent uniquement un fournisseur de texte avec une authentification
    par clé API et une seule exécution adossée à un catalogue, préférez l’assistant plus étroit
    `defineSingleProviderPluginEntry(...)` :

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

    `buildProvider` est le chemin de catalogue en direct utilisé quand OpenClaw peut résoudre une véritable
    authentification de fournisseur. Il peut effectuer une découverte propre au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les lignes hors ligne qui peuvent être affichées sans risque avant que l’authentification
    soit configurée ; il ne doit pas exiger d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les plugins de fournisseurs intégrés, avec une configuration vide, un environnement vide et aucun
    chemin d’agent/espace de travail.

    Si votre flux d’authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les assistants de préréglage de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Quand l’endpoint natif d’un fournisseur prend en charge les blocs d’utilisation en streaming sur le
    transport `openai-completions` normal, préférez les assistants de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur des vérifications
    d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la
    carte des capacités d’endpoint, de sorte que les endpoints natifs de style Moonshot/DashScope
    s’activent toujours même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

    Les exemples de découverte en direct ci-dessus couvrent les API de fournisseur de style `/models`. Gardez
    cette découverte dans `catalog.run`, protégée par une authentification utilisable, et gardez
    `staticRun` sans réseau pour la génération de catalogue hors ligne.

  </Step>

  <Step title="Ajouter la résolution dynamique de modèle">
    Si votre fournisseur accepte des ID de modèle arbitraires (comme un proxy ou un routeur),
    ajoutez `resolveDynamicModel` :

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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour un préchauffage
    asynchrone - `resolveDynamicModel` s’exécute de nouveau une fois celui-ci terminé.

  </Step>

  <Step title="Ajouter des hooks d’exécution (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement, selon les besoins de votre fournisseur.

    Les constructeurs d’assistants partagés couvrent désormais les familles de replay/compatibilité d’outils
    les plus courantes, de sorte que les plugins n’ont généralement pas besoin de câbler chaque hook un par un :

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

    Familles de replay disponibles aujourd’hui :

    | Famille | Ce que cela connecte | Exemples intégrés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de replay partagée de style OpenAI pour les transports compatibles OpenAI, incluant l’assainissement des ID d’appels d’outils, les corrections d’ordre assistant-first et la validation générique des tours Gemini là où le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de replay compatible Claude choisie par `modelId`, afin que les transports de messages Anthropic n’obtiennent le nettoyage des blocs de réflexion propre à Claude que lorsque le modèle résolu est réellement un ID Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique de replay Gemini native plus assainissement du replay d’amorçage. La famille partagée garde le CLI Gemini à sortie texte sur le raisonnement balisé ; le fournisseur direct `google` remplace `resolveReasoningOutputMode` par `native`, car la réflexion de l’API Gemini arrive sous forme de parties de pensée natives. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation native de replay Gemini ni les réécritures d’amorçage | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles de messages Anthropic et compatibles OpenAI dans un même plugin ; la suppression optionnelle des blocs de réflexion réservée à Claude reste limitée au côté Anthropic | `minimax` |

    Familles de flux disponibles aujourd’hui :

    | Famille | Ce que cela connecte | Exemples intégrés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Enveloppe de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les ID de raisonnement proxy non pris en charge ignorant la réflexion injectée | `kilocode` |
    | `moonshot-thinking` | Mappage de charge utile native-thinking binaire Moonshot depuis la configuration + le niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture de modèle en mode rapide MiniMax sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Enveloppes Responses natives OpenAI/Codex partagées : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web native Codex, mise en forme de charge utile compatible raisonnement et gestion du contexte Responses | `openai` |
    | `openrouter-thinking` | Enveloppe de raisonnement OpenRouter pour les routes proxy, avec les exclusions de modèles non pris en charge/`auto` gérées de manière centralisée | `openrouter` |
    | `tool-stream-default-on` | Enveloppe `tool_stream` activée par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite | `zai` |

    <Accordion title="Seams SDK qui alimentent les constructeurs de familles">
      Chaque constructeur de famille est composé à partir d’assistants publics de plus bas niveau exportés par le même package, que vous pouvez utiliser quand un fournisseur doit sortir du schéma commun :

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` et les constructeurs de replay bruts (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte aussi les assistants de replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et les assistants d’endpoint/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ainsi que les enveloppes OpenAI/Codex partagées (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), l’enveloppe compatible OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), le nettoyage de préremplissage de réflexion Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), la compatibilité d’appels d’outils en texte brut (`createPlainTextToolCallCompatWrapper`) et les enveloppes proxy/fournisseur partagées (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - enveloppes légères de charge utile et d’événements pour les chemins de fournisseurs critiques, incluant `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` et `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` et les assistants de schéma de fournisseur sous-jacents.

      Pour les fournisseurs de la famille Gemini, gardez le mode de sortie de raisonnement aligné sur
      le transport. Les fournisseurs directs de l’API Google Gemini doivent utiliser une sortie de raisonnement
      `native`, afin qu’OpenClaw consomme les parties de pensée natives sans ajouter de directives de prompt
      `<think>` / `<final>`. Les backends de style CLI Gemini à texte seul
      qui analysent une réponse finale JSON/texte peuvent conserver le contrat balisé
      `google-gemini` partagé.

      Certains assistants de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` garde `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les constructeurs d’enveloppes Anthropic de plus bas niveau dans son propre seam public `api.ts` / `contract-api.ts`, car ils encodent la gestion des bêtas OAuth Claude et le contrôle de `context1m`. Le plugin xAI garde de même la mise en forme native xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage strict-tool non pris en charge, suppression de charge utile de raisonnement propre à xAI).

      Le même schéma de racine de package prend aussi en charge `@openclaw/openai-provider` (constructeurs de fournisseur, assistants de modèle par défaut, constructeurs de fournisseur realtime) et `@openclaw/openrouter-provider` (constructeur de fournisseur plus assistants d’onboarding/configuration).
    </Accordion>

    <Tabs>
      <Tab title="Échange de jeton">
        Pour les fournisseurs qui ont besoin d’un échange de jeton avant chaque appel d’inférence :

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
        Pour les fournisseurs qui ont besoin d’en-têtes de requête personnalisés ou de modifications du corps :

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
      <Tab title="Identité de transport native">
        Pour les fournisseurs qui ont besoin d’en-têtes de requête/session natifs ou de métadonnées sur
        des transports HTTP ou WebSocket génériques :

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
        Pour les fournisseurs qui exposent des données d'utilisation/facturation :

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` a trois résultats possibles. Retournez `{ token, accountId? }`
        lorsque le fournisseur dispose d'un identifiant d'utilisation/facturation. Retournez
        `{ handled: true }` uniquement lorsque le fournisseur a définitivement géré
        l'authentification d'utilisation, mais n'a aucun jeton d'utilisation exploitable,
        et qu'OpenClaw doit ignorer la solution de repli générique par clé d'API/OAuth.
        Retournez `null` ou `undefined` lorsque le fournisseur n'a pas
        traité la requête et qu'OpenClaw doit poursuivre avec la solution de repli générique.
      </Tab>
    </Tabs>

    <Accordion title="Tous les hooks de fournisseur disponibles">
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n'en utilisent que 2 ou 3 :
      les champs de fournisseur réservés à la compatibilité qu'OpenClaw n'appelle plus, tels que
      `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont pas répertoriés
      ici.

      | # | Hook | Quand l'utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de l'URL de base |
      | 2 | `applyConfigDefaults` | Valeurs globales par défaut détenues par le fournisseur lors de la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d'ID de modèle hérités/en préversion avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage de `api` / `baseUrl` pour une famille de fournisseurs avant l'assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d'utilisation en streaming natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d'authentification par marqueur d'environnement détenue par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/auto-hébergée ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abaisser les espaces réservés de profils stockés synthétiques derrière l'authentification par environnement/configuration |
      | 10 | `resolveDynamicModel` | Accepter des ID de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone des métadonnées avant la résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant l'exécuteur |
      | 13 | `normalizeToolSchemas` | Nettoyage des schémas d'outils détenu par le fournisseur avant l'enregistrement |
      | 14 | `inspectToolSchemas` | Diagnostics des schémas d'outils détenus par le fournisseur |
      | 15 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisée ou native |
      | 16 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 17 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 19 | `wrapStreamFn` | Enveloppes d'en-têtes/corps personnalisées sur le chemin de flux normal |
      | 20 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 21 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs/temps de récupération |
      | 22 | `formatApiKey` | Forme personnalisée du jeton d'exécution |
      | 23 | `refreshOAuth` | Actualisation OAuth personnalisée |
      | 24 | `buildAuthDoctorHint` | Conseils de réparation d'authentification |
      | 25 | `matchesContextOverflowError` | Détection de dépassement détenue par le fournisseur |
      | 26 | `classifyFailoverReason` | Classification des limites de débit/surcharges détenue par le fournisseur |
      | 27 | `isCacheTtlEligible` | Contrôle du TTL du cache de prompts |
      | 28 | `buildMissingAuthMessage` | Indication personnalisée d'authentification manquante |
      | 29 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 30 | `resolveThinkingProfile` | Ensemble d'options `/think` propre au modèle |
      | 31 | `isBinaryThinking` | Compatibilité de réflexion binaire activée/désactivée |
      | 32 | `supportsXHighThinking` | Compatibilité de prise en charge du raisonnement `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilité de la stratégie `/think` par défaut |
      | 34 | `isModernModelRef` | Correspondance de modèle en direct/smoke |
      | 35 | `prepareRuntimeAuth` | Échange de jeton avant l'inférence |
      | 36 | `resolveUsageAuth` | Analyse personnalisée des identifiants d'utilisation |
      | 37 | `fetchUsageSnapshot` | Point de terminaison d'utilisation personnalisé |
      | 38 | `createEmbeddingProvider` | Adaptateur d'embeddings détenu par le fournisseur pour la mémoire/recherche |
      | 39 | `buildReplayPolicy` | Stratégie personnalisée de relecture/compaction de transcript |
      | 40 | `sanitizeReplayHistory` | Réécritures de relecture propres au fournisseur après le nettoyage générique |
      | 41 | `validateReplayTurns` | Validation stricte des tours de relecture avant l'exécuteur intégré |
      | 42 | `onModelSelected` | Rappel après sélection, par exemple pour la télémétrie |

      Notes sur la solution de repli du runtime :

      - `normalizeConfig` vérifie d'abord le fournisseur correspondant, puis les autres plugins de fournisseur capables d'exposer ce hook jusqu'à ce que l'un d'eux modifie réellement la configuration. Si aucun hook de fournisseur ne réécrit une entrée de configuration prise en charge de la famille Google, le normalisateur de configuration Google intégré s'applique quand même.
      - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu'il est exposé. Amazon Bedrock conserve la résolution des marqueurs d'environnement AWS dans son plugin de fournisseur ; l'authentification du runtime elle-même utilise toujours la chaîne par défaut du SDK AWS lorsqu'elle est configurée avec `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` reçoit le `provider` sélectionné, `modelId`, l'indication facultative de catalogue `reasoning` fusionnée, et les faits `compat` facultatifs du modèle fusionnés. Utilisez `compat` uniquement pour sélectionner l'interface ou le profil de réflexion du fournisseur.
      - `resolveSystemPromptContribution` permet à un fournisseur d'injecter des conseils de prompt système compatibles avec le cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à un fournisseur ou une famille de modèles et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, consultez [Internes : hooks de runtime des fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    ### Étape 5 : Ajouter des capacités supplémentaires

    Un plugin de fournisseur peut enregistrer des embeddings, la synthèse vocale, la transcription en temps réel,
    la voix en temps réel, la compréhension des médias, la génération d'images, la génération de vidéos,
    la récupération web et la recherche web en plus de l'inférence de texte. OpenClaw classe cela comme un
    plugin à **capacité hybride** - le modèle recommandé pour les plugins d'entreprise
    (un plugin par fournisseur). Consultez
    [Internes : propriété des capacités](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` à côté de votre appel
    `api.registerProvider(...)` existant. Choisissez uniquement les onglets dont vous avez besoin :

    <Tabs>
      <Tab title="Synthèse vocale (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
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
        les plugins partagent des lectures plafonnées des corps d'erreur, l'analyse des erreurs JSON et
        les suffixes d'ID de requête.
      </Tab>
      <Tab title="Transcription en temps réel">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` - l'assistant partagé
        gère la capture par proxy, le délai de reconnexion, le vidage à la fermeture, les poignées de main
        de disponibilité, la mise en file d'attente audio et les diagnostics d'événements de fermeture. Votre plugin
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

        Les fournisseurs STT par lot qui envoient de l'audio multipart via POST doivent utiliser
        `buildAudioTranscriptionFormData(...)` depuis
        `openclaw/plugin-sdk/provider-http`. L'assistant normalise les noms de fichiers téléversés,
        y compris les téléversements AAC qui nécessitent un nom de fichier de style M4A pour
        les API de transcription compatibles.
      </Tab>
      <Tab title="Voix en temps réel">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Déclarez `capabilities` afin que `talk.catalog` puisse exposer les modes,
        transports, formats audio et indicateurs de fonctionnalités valides aux clients Talk
        navigateur et natifs. Implémentez `handleBargeIn` lorsqu’un transport peut détecter qu’un
        humain interrompt la lecture de l’assistant et que le fournisseur prend en charge
        la troncature ou l’effacement de la réponse audio active.
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Les fournisseurs multimédias locaux ou auto-hébergés qui, intentionnellement, ne nécessitent pas
        d’identifiants peuvent exposer `resolveAuth` et renvoyer `kind: "none"`.
        OpenClaw conserve tout de même le contrôle d’authentification normal pour les fournisseurs qui ne
        choisissent pas explicitement cette option. Les fournisseurs existants peuvent continuer à lire `req.apiKey` ;
        les nouveaux fournisseurs devraient préférer `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        Déclarez le même identifiant dans `contracts.embeddingProviders`. Il s’agit du
        contrat général d’embeddings pour la génération réutilisable de vecteurs, y compris
        la recherche en mémoire. `registerMemoryEmbeddingProvider(...)` est une compatibilité obsolète
        pour les adaptateurs existants propres à la mémoire.
      </Tab>
      <Tab title="Image and video generation">
        Les capacités vidéo utilisent une forme **sensible au mode** : `generate`,
        `imageToVideo` et `videoToVideo`. Les champs agrégés plats comme
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent pas
        pour annoncer proprement la prise en charge des modes de transformation ou les modes désactivés.
        La génération musicale suit le même modèle avec des blocs explicites `generate` /
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
          defaultTimeoutMs: 600_000,
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
      <Tab title="Web fetch and search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
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
            description: "Fetch a page through Acme Fetch.",
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

  <Step title="Test">
    ### Étape 6 : tester

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

Les Plugins de fournisseurs se publient de la même manière que n’importe quel autre Plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les packages de Plugin doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Référence d’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux fournisseurs
intégrés :

| Ordre     | Quand         | Cas d’utilisation                              |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples à clé API                 |
| `profile` | Après simple  | Fournisseurs soumis aux profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées            |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Prochaines étapes

- [Plugins de canaux](/fr/plugins/sdk-channel-plugins) - si votre Plugin fournit également un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) - assistants `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) - référence complète des imports de sous-chemins
- [Internes du Plugin](/fr/plugins/architecture-internals#provider-runtime-hooks) - détails des hooks et exemples intégrés

## Associé

- [Configuration du Plugin SDK](/fr/plugins/sdk-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Créer des Plugins de canaux](/fr/plugins/sdk-channel-plugins)
