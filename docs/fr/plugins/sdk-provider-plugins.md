---
read_when:
    - Vous créez un nouveau plugin de fournisseur de modèles
    - Vous voulez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous avez besoin de comprendre l'authentification des fournisseurs, les catalogues et les hooks d'exécution
sidebarTitle: Provider Plugins
summary: Guide étape par étape pour créer un plugin de fournisseur de modèles pour OpenClaw
title: Créer des plugins de fournisseur
x-i18n:
    generated_at: "2026-04-09T01:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38d9af522dc19e49c81203a83a4096f01c2398b1df771c848a30ad98f251e9e1
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Créer des plugins de fournisseur

Ce guide vous accompagne dans la création d'un plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous disposerez d'un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n'avez encore jamais créé de plugin OpenClaw, lisez d'abord
  [Getting Started](/fr/plugins/building-plugins) pour comprendre la structure de base
  du package et la configuration du manifeste.
</Info>

## Procédure détaillée

<Steps>
  <a id="step-1-package-and-manifest"></a>
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

    Le manifeste déclare `providerAuthEnvVars` afin qu'OpenClaw puisse détecter
    les identifiants sans charger l'exécution de votre plugin. Ajoutez `providerAuthAliases`
    lorsqu'une variante de fournisseur doit réutiliser l'authentification d'un autre identifiant de fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre plugin de fournisseur à partir
    d'identifiants de modèles abrégés comme `acme-large` avant que les hooks d'exécution n'existent. Si vous publiez le
    fournisseur sur ClawHub, les champs `openclaw.compat` et `openclaw.build`
    sont obligatoires dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin d'un `id`, d'un `label`, de `auth` et d'un `catalog` :

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

    Il s'agit d'un fournisseur fonctionnel. Les utilisateurs peuvent maintenant
    exécuter `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    Pour les fournisseurs groupés qui n'enregistrent qu'un seul fournisseur texte avec une
    authentification par clé API et un seul runtime adossé à un catalogue, préférez l'assistant plus ciblé
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
        },
      },
    });
    ```

    Si votre flux d'authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l'agent pendant l'onboarding, utilisez les assistants prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu'un point de terminaison natif de fournisseur prend en charge des blocs d'usage en streaming sur le
    transport normal `openai-completions`, préférez les assistants de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur des vérifications d'identifiant
    de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la table des capacités du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope
    s'activent toujours même lorsqu'un plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
    Si votre fournisseur accepte des identifiants de modèle arbitraires (comme un proxy ou un routeur),
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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour un
    préchauffage asynchrone — `resolveDynamicModel` s'exécute à nouveau une fois celui-ci terminé.

  </Step>

  <Step title="Ajouter des hooks d'exécution (si nécessaire)">
    La plupart des fournisseurs n'ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement selon les besoins de votre fournisseur.

    Les constructeurs d'assistants partagés couvrent désormais les familles les plus courantes de compatibilité relecture/outils,
    donc les plugins n'ont généralement pas besoin de câbler chaque hook un par un :

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

    Familles de relecture disponibles aujourd'hui :

    | Famille | Ce qu'elle câble |
    | --- | --- |
    | `openai-compatible` | Politique de relecture partagée de type OpenAI pour les transports compatibles OpenAI, y compris la sanitation de tool-call-id, les corrections d'ordre assistant-first et la validation générique des tours Gemini lorsque le transport en a besoin |
    | `anthropic-by-model` | Politique de relecture orientée Claude choisie par `modelId`, afin que les transports de messages Anthropic n'obtiennent le nettoyage spécifique aux blocs de réflexion Claude que lorsque le modèle résolu est réellement un identifiant Claude |
    | `google-gemini` | Politique de relecture Gemini native plus sanitation de la relecture d'amorçage et mode de sortie de raisonnement balisé |
    | `passthrough-gemini` | Sanitation des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n'active pas la validation native de relecture Gemini ni les réécritures d'amorçage |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles de messages Anthropic et compatibles OpenAI dans un même plugin ; la suppression facultative des blocs de réflexion réservés à Claude reste limitée au côté Anthropic |

    Exemples groupés réels :

    - `google` et `google-gemini-cli` : `google-gemini`
    - `openrouter`, `kilocode`, `opencode` et `opencode-go` : `passthrough-gemini`
    - `amazon-bedrock` et `anthropic-vertex` : `anthropic-by-model`
    - `minimax` : `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` et `zai` : `openai-compatible`

    Familles de flux disponibles aujourd'hui :

    | Famille | Ce qu'elle câble |
    | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de flux partagé |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée |
    | `moonshot-thinking` | Mappage de la charge utile native de réflexion binaire Moonshot à partir de la configuration + niveau `/think` |
    | `minimax-fast-mode` | Réécriture de modèle fast-mode MiniMax sur le chemin de flux partagé |
    | `openai-responses-defaults` | Wrappers natifs partagés OpenAI/Codex Responses : en-têtes d'attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web Codex native, mise en forme de la charge utile de compatibilité de raisonnement et gestion du contexte Responses |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec les sauts pour modèles non pris en charge/`auto` gérés de manière centralisée |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d'outils sauf en cas de désactivation explicite |

    Exemples groupés réels :

    - `google` et `google-gemini-cli` : `google-thinking`
    - `kilocode` : `kilocode-thinking`
    - `moonshot` : `moonshot-thinking`
    - `minimax` et `minimax-portal` : `minimax-fast-mode`
    - `openai` et `openai-codex` : `openai-responses-defaults`
    - `openrouter` : `openrouter-thinking`
    - `zai` : `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exporte aussi l'énumération de familles de relecture
    ainsi que les assistants partagés à partir desquels ces familles sont construites. Les exportations publiques courantes
    incluent :

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - des constructeurs de relecture partagés tels que `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` et
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - des assistants de relecture Gemini tels que `sanitizeGoogleGeminiReplayHistory(...)`
      et `resolveTaggedReasoningOutputMode()`
    - des assistants de point de terminaison/modèle tels que `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` et
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expose à la fois le constructeur de famille et
    les assistants de wrapper publics que ces familles réutilisent. Les exportations publiques courantes
    incluent :

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - des wrappers partagés OpenAI/Codex tels que
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` et
      `createCodexNativeWebSearchWrapper(...)`
    - des wrappers partagés proxy/fournisseur tels que `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` et `createMinimaxFastModeWrapper(...)`

    Certains assistants de flux restent volontairement locaux au fournisseur. Exemple
    groupé actuel : `@openclaw/anthropic-provider` exporte
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les
    constructeurs de wrappers Anthropic de plus bas niveau depuis son point d'entrée public `api.ts` /
    `contract-api.ts`. Ces assistants restent spécifiques à Anthropic parce
    qu'ils codent aussi la gestion bêta Claude OAuth et le contrôle `context1m`.

    D'autres fournisseurs groupés conservent également des wrappers spécifiques au transport en local lorsque
    le comportement n'est pas partagé proprement entre plusieurs familles. Exemple actuel : le
    plugin xAI groupé conserve la mise en forme native xAI Responses dans son propre
    `wrapStreamFn`, y compris les réécritures d'alias `/fast`, `tool_stream` par défaut,
    le nettoyage des outils stricts non pris en charge et la
    suppression des charges utiles de raisonnement spécifiques à xAI.

    `openclaw/plugin-sdk/provider-tools` expose actuellement une famille partagée
    de schéma d'outil ainsi que des assistants partagés de schéma/compatibilité :

    - `ProviderToolCompatFamily` documente aujourd'hui l'inventaire des familles partagées.
    - `buildProviderToolCompatFamilyHooks("gemini")` câble le nettoyage des schémas Gemini
      + les diagnostics pour les fournisseurs qui ont besoin de schémas d'outils sûrs pour Gemini.
    - `normalizeGeminiToolSchemas(...)` et `inspectGeminiToolSchemas(...)`
      sont les assistants publics sous-jacents pour les schémas Gemini.
    - `resolveXaiModelCompatPatch()` renvoie le correctif de compatibilité xAI groupé :
      `toolSchemaProfile: "xai"`, mots-clés de schéma non pris en charge, prise en charge native de
      `web_search` et décodage des arguments d'appel d'outil avec entités HTML.
    - `applyXaiModelCompat(model)` applique ce même correctif de compatibilité xAI à un
      modèle résolu avant qu'il n'atteigne le runner.

    Exemple groupé réel : le plugin xAI utilise `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` pour garder ces métadonnées de compatibilité sous la responsabilité
    du fournisseur plutôt que de coder en dur les règles xAI dans le cœur.

    Le même modèle de racine de package prend aussi en charge d'autres fournisseurs groupés :

    - `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de fournisseur,
      des assistants de modèle par défaut et des constructeurs de fournisseur temps réel
    - `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur de fournisseur
      ainsi que les assistants d'onboarding/configuration

    <Tabs>
      <Tab title="Échange de jetons">
        Pour les fournisseurs qui nécessitent un échange de jetons avant chaque appel d'inférence :

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
        Pour les fournisseurs qui nécessitent des en-têtes de requête personnalisés ou des modifications du corps :

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
        Pour les fournisseurs qui nécessitent des en-têtes ou métadonnées de requête/session natifs sur
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
      <Tab title="Usage et facturation">
        Pour les fournisseurs qui exposent des données d'usage/facturation :

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
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n'en utilisent que 2 ou 3 :

      | # | Hook | Quand l'utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut d'URL de base |
      | 2 | `applyConfigDefaults` | Valeurs par défaut globales appartenant au fournisseur lors de la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d'identifiants de modèle hérités/de préversion avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage de la famille de fournisseur `api` / `baseUrl` avant l'assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d'usage du streaming natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d'authentification par marqueur d'environnement appartenant au fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/autohébergée ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Reléguer les espaces réservés de profil stocké synthétique derrière l'authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle en amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |

    Remarques sur le secours d'exécution :

    - `normalizeConfig` vérifie d'abord le fournisseur correspondant, puis les autres
      plugins de fournisseur capables de hook jusqu'à ce que l'un d'eux modifie réellement la configuration.
      Si aucun hook de fournisseur ne réécrit une entrée de configuration de la famille Google prise en charge, le
      normaliseur de configuration Google groupé s'applique quand même.
    - `resolveConfigApiKey` utilise le hook de fournisseur lorsqu'il est exposé. Le chemin groupé
      `amazon-bedrock` dispose aussi ici d'un résolveur intégré de marqueur d'environnement AWS,
      même si l'authentification d'exécution Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour les modèles fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Sac statique de capacités hérité ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d'outils appartenant au fournisseur avant enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics des schémas d'outils appartenant au fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisé vs natif |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers personnalisés d'en-têtes/corps sur le chemin de flux normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs / délai de récupération |
      | 23 | `formatApiKey` | Forme personnalisée du jeton d'exécution |
      | 24 | `refreshOAuth` | Actualisation OAuth personnalisée |
      | 25 | `buildAuthDoctorHint` | Conseils de réparation de l'authentification |
      | 26 | `matchesContextOverflowError` | Détection de débordement appartenant au fournisseur |
      | 27 | `classifyFailoverReason` | Classification des limitations de débit/surcharges appartenant au fournisseur |
      | 28 | `isCacheTtlEligible` | Contrôle du TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Conseil personnalisé en cas d'authentification manquante |
      | 30 | `suppressBuiltInModel` | Masquer les lignes en amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 32 | `isBinaryThinking` | Réflexion binaire activée/désactivée |
      | 33 | `supportsXHighThinking` | Prise en charge du raisonnement `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Politique `/think` par défaut |
      | 35 | `isModernModelRef` | Correspondance de modèle live/smoke |
      | 36 | `prepareRuntimeAuth` | Échange de jetons avant l'inférence |
      | 37 | `resolveUsageAuth` | Analyse personnalisée des identifiants d'usage |
      | 38 | `fetchUsageSnapshot` | Point de terminaison d'usage personnalisé |
      | 39 | `createEmbeddingProvider` | Adaptateur d'embedding appartenant au fournisseur pour la mémoire/la recherche |
      | 40 | `buildReplayPolicy` | Politique personnalisée de relecture/compactage du transcript |
      | 41 | `sanitizeReplayHistory` | Réécritures spécifiques au fournisseur après le nettoyage générique |
      | 42 | `validateReplayTurns` | Validation stricte des tours de relecture avant le runner embarqué |
      | 43 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarque sur le réglage du prompt :

      - `resolveSystemPromptContribution` permet à un fournisseur d'injecter
        des instructions de prompt système tenant compte du cache pour une famille de modèles. Préférez-le à
        `before_prompt_build` lorsque le comportement appartient à un fournisseur/une famille de modèles
        et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, consultez
      [Internals: Provider Runtime Hooks](/fr/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin de fournisseur peut enregistrer la parole, la transcription en temps réel, la voix en temps réel,
    la compréhension multimédia, la génération d'images, la génération vidéo, la récupération web
    et la recherche web en plus de l'inférence de texte :

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw classe cela comme un plugin à **capacités hybrides**. C'est le
    modèle recommandé pour les plugins d'entreprise (un plugin par fournisseur). Consultez
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

    Pour la génération vidéo, préférez la forme de capacités sensible au mode montrée ci-dessus :
    `generate`, `imageToVideo` et `videoToVideo`. Des champs agrégés plats tels
    que `maxInputImages`, `maxInputVideos` et `maxDurationSeconds` ne
    suffisent pas pour annoncer proprement la prise en charge du mode transformation ou les modes désactivés.

    Les fournisseurs de génération musicale doivent suivre le même modèle :
    `generate` pour la génération à partir de prompt uniquement et `edit` pour la génération
    basée sur une image de référence. Des champs agrégés plats tels que `maxInputImages`,
    `supportsLyrics` et `supportsFormat` ne suffisent pas à annoncer la prise en charge de l'édition ;
    des blocs `generate` / `edit` explicites constituent le contrat attendu.

  </Step>

  <Step title="Tester">
    <a id="step-6-test"></a>
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

Les plugins de fournisseur se publient de la même façon que n'importe quel autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N'utilisez pas ici l'ancien alias de publication réservé aux Skills ; les packages de plugin doivent utiliser
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

## Référence sur l'ordre des catalogues

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Ordre     | Quand         | Cas d'utilisation                               |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples à clé API                |
| `profile` | Après simple  | Fournisseurs conditionnés par des profils d'authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées             |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Channel Plugins](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) — assistants `api.runtime` (TTS, recherche, sous-agent)
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports de sous-chemins
- [Plugin Internals](/fr/plugins/architecture#provider-runtime-hooks) — détails des hooks et exemples groupés
