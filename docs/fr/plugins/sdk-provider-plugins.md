---
read_when:
    - Vous créez un nouveau plugin de fournisseur de modèles
    - Vous voulez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les hooks de runtime
sidebarTitle: Provider plugins
summary: Guide étape par étape pour créer un plugin de fournisseur de modèles pour OpenClaw
title: Création de plugins de fournisseur
x-i18n:
    generated_at: "2026-04-25T13:53:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Ce guide explique comment créer un plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous aurez un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore créé aucun plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour la structure de package
  de base et la configuration du manifeste.
</Info>

<Tip>
  Les plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un démon d’agent natif qui gère les fils, la compaction ou les
  événements d’outils, associez le fournisseur à un [harnais d’agent](/fr/plugins/sdk-agent-harness)
  au lieu de placer les détails du protocole du démon dans le cœur.
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
    les identifiants sans charger le runtime de votre plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification d’un autre identifiant fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre plugin fournisseur à partir
    d’identifiants de modèle abrégés comme `acme-large` avant même l’existence de hooks de runtime. Si vous publiez le
    fournisseur sur ClawHub, les champs `openclaw.compat` et `openclaw.build`
    sont obligatoires dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin d’un `id`, `label`, `auth` et `catalog` :

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

    C’est un fournisseur fonctionnel. Les utilisateurs peuvent maintenant
    `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    Si le fournisseur amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation de texte bidirectionnelle au lieu de remplacer le chemin de flux :

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

    `input` réécrit le prompt système final et le contenu du message texte avant
    le transport. `output` réécrit les deltas de texte de l’assistant et le texte final avant
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou la distribution sur canal.

    Pour les fournisseurs inclus qui n’enregistrent qu’un seul fournisseur de texte avec
    authentification par clé API plus un runtime unique basé sur catalogue, préférez le helper plus ciblé
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

    `buildProvider` est le chemin de catalogue live utilisé lorsqu’OpenClaw peut résoudre une
    authentification réelle de fournisseur. Il peut effectuer une découverte spécifique au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les lignes hors ligne sûres à afficher avant configuration de l’authentification ;
    il ne doit pas exiger d’identifiants ni faire de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw n’exécute actuellement les catalogues statiques
    que pour les plugins de fournisseur inclus, avec une configuration vide, un environnement vide et sans
    chemins agent/espace de travail.

    Si votre flux d’authentification doit aussi modifier `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les helpers preset depuis
    `openclaw/plugin-sdk/provider-onboard`. Les helpers les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu’un point de terminaison natif de fournisseur prend en charge des blocs d’usage diffusés sur le
    transport normal `openai-completions`, préférez les helpers de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur des vérifications d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la map de capacités du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope s’activent toujours même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique de modèles">
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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour le
    préchauffage asynchrone — `resolveDynamicModel` s’exécute de nouveau après sa fin.

  </Step>

  <Step title="Ajouter des hooks de runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez les hooks
    progressivement, selon les besoins de votre fournisseur.

    Les builders de helpers partagés couvrent désormais les familles les plus courantes de compatibilité
    replay/outils, de sorte que les plugins n’ont généralement pas besoin de câbler chaque hook à la main :

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

    Familles de replay disponibles aujourd’hui :

    | Famille | Ce qu’elle câble | Exemples inclus |
    | --- | --- | --- |
    | `openai-compatible` | Politique partagée de replay de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement des tool-call-id, les corrections d’ordre assistant-first, et la validation générique des tours Gemini lorsque le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de replay aware de Claude choisie par `modelId`, afin que les transports de messages Anthropic ne reçoivent le nettoyage spécifique des blocs de réflexion Claude que lorsque le modèle résolu est réellement un identifiant Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique native de replay Gemini plus assainissement bootstrap du replay et mode de sortie de raisonnement balisé | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement de la signature de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation native du replay Gemini ni les réécritures bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles de messages Anthropic et compatibles OpenAI dans un même plugin ; la suppression facultative des blocs de réflexion propres à Claude reste limitée à la partie Anthropic | `minimax` |

    Familles de flux disponibles aujourd’hui :

    | Famille | Ce qu’elle câble | Exemples inclus |
    | --- | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et des identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée | `kilocode` |
    | `moonshot-thinking` | Mappage de la charge utile native de réflexion binaire Moonshot à partir de la configuration + du niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle fast-mode MiniMax sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers natifs partagés OpenAI/Codex Responses : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web Codex native, mise en forme de charge utile de compatibilité du raisonnement, et gestion de contexte Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des exclusions des modèles non pris en charge/`auto` | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite | `zai` |

    <Accordion title="Coutures SDK qui alimentent les builders de famille">
      Chaque builder de famille est composé de helpers publics de plus bas niveau exportés depuis le même package, que vous pouvez utiliser lorsqu’un fournisseur doit sortir du modèle commun :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, et les builders bruts de replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte aussi les helpers de replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et les helpers endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus les wrappers partagés OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) et les wrappers partagés proxy/fournisseur (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, les helpers sous-jacents de schéma Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), et les helpers de compatibilité xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Le plugin xAI inclus utilise `normalizeResolvedModel` + `contributeResolvedModelCompat` avec ceux-ci afin de garder les règles xAI détenues par le fournisseur.

      Certains helpers de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, et les builders de wrappers Anthropic de plus bas niveau dans sa propre couture publique `api.ts` / `contract-api.ts` parce qu’ils encodent la gestion bêta de Claude OAuth et la restriction `context1m`. Le plugin xAI conserve de même la mise en forme native xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage des outils stricts non pris en charge, suppression de charge utile de raisonnement spécifique à xAI).

      Le même modèle à racine de package alimente aussi `@openclaw/openai-provider` (builders de fournisseur, helpers de modèles par défaut, builders de fournisseur realtime) et `@openclaw/openrouter-provider` (builder de fournisseur plus helpers d’onboarding/configuration).
    </Accordion>

    <Tabs>
      <Tab title="Échange de jetons">
        Pour les fournisseurs qui nécessitent un échange de jetons avant chaque appel d’inférence :

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
        // wrapStreamFn renvoie un StreamFn dérivé de ctx.streamFn
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
        Pour les fournisseurs qui ont besoin d’en-têtes ou de métadonnées de requête/session natifs sur
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
      <Tab title="Usage et facturation">
        Pour les fournisseurs qui exposent des données d’usage/facturation :

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
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut d’URL de base |
      | 2 | `applyConfigDefaults` | Valeurs globales par défaut détenues par le fournisseur lors de la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’identifiant de modèle hérités/preview avant recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` par famille de fournisseur avant assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité native d’usage diffusé pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution auth des marqueurs d’environnement détenue par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/autohébergée ou soutenue par la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abaisser les espaces réservés synthétiques de profil stocké derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant l’exécuteur |
      | 13 | `contributeResolvedModelCompat` | Drapeaux de compatibilité pour les modèles d’un fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Sac statique de capacités hérité ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d’outils détenu par le fournisseur avant enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics des schémas d’outils détenus par le fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisée vs native |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers d’en-têtes/corps personnalisés sur le chemin de flux normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs / refroidissement |
      | 23 | `formatApiKey` | Forme personnalisée du jeton de runtime |
      | 24 | `refreshOAuth` | Actualisation OAuth personnalisée |
      | 25 | `buildAuthDoctorHint` | Indication de réparation auth |
      | 26 | `matchesContextOverflowError` | Détection de dépassement détenue par le fournisseur |
      | 27 | `classifyFailoverReason` | Classification de limite de débit/surcharge détenue par le fournisseur |
      | 28 | `isCacheTtlEligible` | Contrôle TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Indication personnalisée d’authentification manquante |
      | 30 | `suppressBuiltInModel` | Masquer les lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité future |
      | 32 | `resolveThinkingProfile` | Ensemble d’options `/think` spécifique au modèle |
      | 33 | `isBinaryThinking` | Compatibilité réflexion binaire activée/désactivée |
      | 34 | `supportsXHighThinking` | Compatibilité de prise en charge du raisonnement `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilité de politique `/think` par défaut |
      | 36 | `isModernModelRef` | Correspondance de modèle live/smoke |
      | 37 | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | 38 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 39 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 40 | `createEmbeddingProvider` | Adaptateur d’embeddings détenu par le fournisseur pour mémoire/recherche |
      | 41 | `buildReplayPolicy` | Politique personnalisée de replay/compaction de transcription |
      | 42 | `sanitizeReplayHistory` | Réécritures de replay spécifiques au fournisseur après nettoyage générique |
      | 43 | `validateReplayTurns` | Validation stricte des tours replay avant l’exécuteur embarqué |
      | 44 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarques sur le repli du runtime :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres plugins de fournisseur capables de hooks jusqu’à ce que l’un modifie réellement la configuration. Si aucun hook fournisseur ne réécrit une entrée de configuration de famille Google prise en charge, le normaliseur de configuration Google inclus continue de s’appliquer.
      - `resolveConfigApiKey` utilise le hook fournisseur lorsqu’il est exposé. Le chemin `amazon-bedrock` inclus dispose aussi ici d’un résolveur intégré de marqueurs d’environnement AWS, même si l’authentification runtime Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter une contribution de prompt système sensible au cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à une seule famille fournisseur/modèle et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, voir [Internals: Provider Runtime Hooks](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des fonctionnalités supplémentaires (facultatif)">
    Un plugin de fournisseur peut enregistrer la parole, la transcription en temps réel, la
    voix en temps réel, la compréhension des médias, la génération d’images, la génération vidéo, la récupération web
    et la recherche web en plus de l’inférence textuelle. OpenClaw classe cela comme un plugin à
    **fonctionnalités hybrides** — le modèle recommandé pour les plugins d’entreprise
    (un plugin par fournisseur). Voir
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque fonctionnalité dans `register(api)` à côté de votre appel existant
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
        les plugins partagent les lectures plafonnées du corps d’erreur, l’analyse des erreurs JSON et
        les suffixes d’identifiant de requête.
      </Tab>
      <Tab title="Transcription en temps réel">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` — le helper partagé
        gère la capture proxy, le backoff de reconnexion, la purge à la fermeture, les handshakes ready,
        la mise en file d’attente audio et les diagnostics d’événement de fermeture. Votre plugin
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

        Les fournisseurs STT par lot qui POSTent de l’audio multipart doivent utiliser
        `buildAudioTranscriptionFormData(...)` depuis
        `openclaw/plugin-sdk/provider-http`. Le helper normalise les noms de
        fichiers uploadés, y compris les uploads AAC qui nécessitent un nom de fichier de type M4A pour
        les API de transcription compatibles.
      </Tab>
      <Tab title="Voix en temps réel">
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
        Les fonctionnalités vidéo utilisent une forme **sensible au mode** :
        `generate`, `imageToVideo` et `videoToVideo`. Des champs agrégés plats comme
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent pas pour
        annoncer proprement la prise en charge des modes de transformation ou les modes désactivés.
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
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Récupération et recherche web">
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

  <Step title="Tester">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportez votre objet de configuration fournisseur depuis index.ts ou un fichier dédié
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

Les plugins de fournisseur se publient comme n’importe quel autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les packages de plugin doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # Manifeste avec métadonnées d’authentification du fournisseur
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Point de terminaison d’usage (facultatif)
```

## Référence sur l’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue fusionne par rapport aux
fournisseurs intégrés :

| Ordre     | Quand         | Cas d’usage                                     |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples à clé API                |
| `profile` | Après simple  | Fournisseurs conditionnés par des profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées             |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) — helpers `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Internals des plugins](/fr/plugins/architecture-internals#provider-runtime-hooks) — détails des hooks et exemples inclus

## Voir aussi

- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
- [Création de plugins de canal](/fr/plugins/sdk-channel-plugins)
