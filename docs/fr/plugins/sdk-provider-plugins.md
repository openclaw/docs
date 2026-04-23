---
read_when:
    - Vous créez un nouveau plugin fournisseur de modèles
    - Vous souhaitez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification du fournisseur, les catalogues et les hooks d’exécution
sidebarTitle: Provider Plugins
summary: Guide pas à pas pour créer un plugin fournisseur de modèles pour OpenClaw
title: Création de plugins fournisseur
x-i18n:
    generated_at: "2026-04-23T07:07:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Création de plugins fournisseur

Ce guide explique pas à pas comment créer un plugin fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous aurez un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore jamais créé de plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour la structure de package de base
  et la configuration du manifest.
</Info>

<Tip>
  Les plugins fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un daemon d’agent natif qui possède les fils, la Compaction ou les
  événements d’outils, associez le fournisseur à un [harnais d’agent](/fr/plugins/sdk-agent-harness)
  au lieu de mettre les détails du protocole du daemon dans le cœur.
</Tip>

## Procédure

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifest">
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
      "description": "Fournisseur de modèles Acme AI",
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
          "choiceLabel": "Clé API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Clé API Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Le manifest déclare `providerAuthEnvVars` afin qu’OpenClaw puisse détecter
    les identifiants sans charger le runtime de votre plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification d’un autre identifiant de fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre plugin fournisseur à partir
    d’identifiants de modèle abrégés comme `acme-large` avant l’existence de hooks de runtime. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin de `id`, `label`, `auth` et `catalog` :

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Fournisseur de modèles Acme AI",
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
              label: "Clé API Acme AI",
              hint: "Clé API depuis votre tableau de bord Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Entrez votre clé API Acme AI",
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

    Si le fournisseur amont utilise des tokens de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation de texte bidirectionnelle au lieu de remplacer le chemin du flux :

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
    transport. `output` réécrit les deltas de texte assistant et le texte final avant
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou n’effectue la livraison par canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur texte avec
    authentification par clé API plus un seul runtime adossé à un catalogue, préférez le helper plus étroit
    `defineSingleProviderPluginEntry(...)` :

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Fournisseur de modèles Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Clé API Acme AI",
            hint: "Clé API depuis votre tableau de bord Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Entrez votre clé API Acme AI",
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

    `buildProvider` est le chemin du catalogue live utilisé lorsque OpenClaw peut résoudre une vraie
    authentification fournisseur. Il peut effectuer une découverte spécifique au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour des lignes hors ligne qu’il est sûr d’afficher avant que l’authentification
    soit configurée ; il ne doit pas nécessiter d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les plugins fournisseur intégrés, avec une configuration vide, un environnement vide et aucun
    chemin d’agent/espace de travail.

    Si votre flux d’authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les helpers prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les helpers les plus étroits sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu’un point de terminaison natif de fournisseur prend en charge des blocs d’usage streamés sur le
    transport normal `openai-completions`, préférez les helpers de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` au lieu de coder en dur des vérifications sur l’identifiant du fournisseur.
    `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la carte de capacités du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope s’activent toujours même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique de modèle">
    Si votre fournisseur accepte des identifiants de modèles arbitraires (comme un proxy ou un routeur),
    ajoutez `resolveDynamicModel` :

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog ci-dessus

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
    préchauffage asynchrone — `resolveDynamicModel` s’exécute de nouveau après sa fin.

  </Step>

  <Step title="Ajouter des hooks d’exécution (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez les hooks
    progressivement selon les besoins de votre fournisseur.

    Les builders helpers partagés couvrent maintenant les familles de compatibilité replay/tool les plus courantes,
    donc les plugins n’ont généralement pas besoin de câbler chaque hook un par un à la main :

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

    Familles de replay disponibles actuellement :

    | Famille | Ce qu’elle câble |
    | --- | --- |
    | `openai-compatible` | Politique de replay partagée de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement de tool-call-id, les corrections d’ordre assistant-first et la validation générique des tours Gemini lorsque le transport en a besoin |
    | `anthropic-by-model` | Politique de replay adaptée à Claude choisie par `modelId`, afin que les transports de messages Anthropic n’obtiennent le nettoyage des thinking-blocks propre à Claude que lorsque le modèle résolu est réellement un identifiant Claude |
    | `google-gemini` | Politique de replay Gemini native plus assainissement du replay bootstrap et mode de sortie de raisonnement balisé |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation de replay Gemini native ni les réécritures bootstrap |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent dans un même plugin des surfaces de modèles en messages Anthropic et compatibles OpenAI ; la suppression facultative des thinking-blocks propre à Claude reste limitée au côté Anthropic |

    Exemples intégrés réels :

    - `google` et `google-gemini-cli` : `google-gemini`
    - `openrouter`, `kilocode`, `opencode` et `opencode-go` : `passthrough-gemini`
    - `amazon-bedrock` et `anthropic-vertex` : `anthropic-by-model`
    - `minimax` : `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` et `zai` : `openai-compatible`

    Familles de stream disponibles aujourd’hui :

    | Famille | Ce qu’elle câble |
    | --- | --- |
    | `google-thinking` | Normalisation des charges utiles de réflexion Gemini sur le chemin de stream partagé |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de stream proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée |
    | `moonshot-thinking` | Mapping des charges utiles binaires de réflexion native Moonshot à partir de la config + du niveau `/think` |
    | `minimax-fast-mode` | Réécriture de modèle fast-mode MiniMax sur le chemin de stream partagé |
    | `openai-responses-defaults` | Wrappers Responses natifs OpenAI/Codex partagés : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web Codex native, mise en forme des charges utiles reasoning-compat et gestion du contexte Responses |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec la gestion centralisée des modèles non pris en charge / `auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite |

    Exemples intégrés réels :

    - `google` et `google-gemini-cli` : `google-thinking`
    - `kilocode` : `kilocode-thinking`
    - `moonshot` : `moonshot-thinking`
    - `minimax` et `minimax-portal` : `minimax-fast-mode`
    - `openai` et `openai-codex` : `openai-responses-defaults`
    - `openrouter` : `openrouter-thinking`
    - `zai` : `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exporte aussi l’enum de
    famille de replay ainsi que les helpers partagés à partir desquels ces familles sont construites. Les
    exports publics courants incluent :

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - des builders de replay partagés comme `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` et
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - des helpers de replay Gemini comme `sanitizeGoogleGeminiReplayHistory(...)`
      et `resolveTaggedReasoningOutputMode()`
    - des helpers d’endpoint/modèle comme `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` et
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expose à la fois le builder de famille et
    les helpers wrapper publics réutilisés par ces familles. Les exports publics courants
    incluent :

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - des wrappers OpenAI/Codex partagés comme
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` et
      `createCodexNativeWebSearchWrapper(...)`
    - des wrappers proxy/fournisseur partagés comme `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` et `createMinimaxFastModeWrapper(...)`

    Certains helpers de stream restent volontairement locaux au fournisseur. Exemple
    intégré actuel : `@openclaw/anthropic-provider` exporte
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les
    builders wrapper Anthropic de niveau inférieur depuis sa surface publique `api.ts` /
    `contract-api.ts`. Ces helpers restent spécifiques à Anthropic parce
    qu’ils encodent aussi la gestion bêta de l’OAuth Claude et le filtrage
    `context1m`.

    D’autres fournisseurs intégrés conservent aussi des wrappers spécifiques au transport en local lorsque
    le comportement ne se partage pas proprement entre familles. Exemple actuel : le
    plugin xAI intégré conserve en propre la mise en forme Responses xAI native dans son
    `wrapStreamFn`, y compris les réécritures d’alias `/fast`, le `tool_stream` par défaut,
    le nettoyage strict-tool non pris en charge et la suppression des charges utiles de raisonnement
    spécifiques à xAI.

    `openclaw/plugin-sdk/provider-tools` expose actuellement une famille partagée de
    schéma d’outil ainsi que des helpers partagés de schéma/compat :

    - `ProviderToolCompatFamily` documente l’inventaire des familles partagées actuelles.
    - `buildProviderToolCompatFamilyHooks("gemini")` câble le nettoyage du schéma Gemini
      + les diagnostics pour les fournisseurs qui ont besoin de schémas d’outils sûrs pour Gemini.
    - `normalizeGeminiToolSchemas(...)` et `inspectGeminiToolSchemas(...)`
      sont les helpers publics Gemini sous-jacents.
    - `resolveXaiModelCompatPatch()` renvoie le correctif de compat xAI intégré :
      `toolSchemaProfile: "xai"`, mots-clés de schéma non pris en charge, prise en charge
      native de `web_search`, et décodage des arguments d’appel d’outil avec entités HTML.
    - `applyXaiModelCompat(model)` applique ce même correctif de compat xAI à un
      modèle résolu avant qu’il n’atteigne le runner.

    Exemple intégré réel : le plugin xAI utilise `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` pour garder ces métadonnées de compat sous la responsabilité du
    fournisseur au lieu de coder en dur les règles xAI dans le cœur.

    Le même modèle à la racine du package sert aussi à d’autres fournisseurs intégrés :

    - `@openclaw/openai-provider` : `api.ts` exporte des builders de fournisseur,
      des helpers de modèle par défaut et des builders de fournisseur realtime
    - `@openclaw/openrouter-provider` : `api.ts` exporte le builder de fournisseur
      ainsi que des helpers d’onboarding/configuration

    <Tabs>
      <Tab title="Échange de token">
        Pour les fournisseurs qui nécessitent un échange de token avant chaque appel d’inférence :

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
        Pour les fournisseurs qui ont besoin d’en-têtes ou de métadonnées de requête/session natives sur
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
        Pour les fournisseurs qui exposent des données d’usage/facturation :

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

    <Accordion title="Tous les hooks fournisseur disponibles">
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n’en utilisent que 2 ou 3 :

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de base URL |
      | 2 | `applyConfigDefaults` | Valeurs globales par défaut appartenant au fournisseur lors de la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’identifiant de modèle legacy/preview avant recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` de famille fournisseur avant assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compat streaming-usage natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution auth par marqueur d’environnement appartenant au fournisseur |
      | 8 | `resolveSyntheticAuth` | Auth synthétique locale/self-hosted ou adossée à la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Reléguer les placeholders synthétiques de profil stocké derrière l’auth env/config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |

    Notes sur le repli d’exécution :

    - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres
      plugins fournisseur capables de hooks jusqu’à ce que l’un d’eux modifie réellement la configuration.
      Si aucun hook fournisseur ne réécrit une entrée de configuration de famille Google prise en charge, le
      normaliseur de configuration Google intégré s’applique quand même.
    - `resolveConfigApiKey` utilise le hook fournisseur lorsqu’il est exposé. Le chemin intégré
      `amazon-bedrock` possède aussi ici un résolveur interne de marqueur d’environnement AWS,
      même si l’auth d’exécution Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      | 13 | `contributeResolvedModelCompat` | Drapeaux de compat pour des modèles fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Ancien sac de capacités statiques ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage des schémas d’outils appartenant au fournisseur avant enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics de schémas d’outils appartenant au fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisé vs natif |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers personnalisés d’en-têtes/corps sur le chemin de stream normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natives par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs / délai de refroidissement |
      | 23 | `formatApiKey` | Forme personnalisée du token d’exécution |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Aide à la réparation de l’authentification |
      | 26 | `matchesContextOverflowError` | Détection de dépassement appartenant au fournisseur |
      | 27 | `classifyFailoverReason` | Classification appartenant au fournisseur des limites de débit/surcharges |
      | 28 | `isCacheTtlEligible` | Filtrage TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Indication personnalisée pour auth manquante |
      | 30 | `suppressBuiltInModel` | Masquer des lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compat ascendante |
      | 32 | `resolveThinkingProfile` | Ensemble d’options `/think` spécifique au modèle |
      | 33 | `isBinaryThinking` | Compatibilité réflexion binaire activée/désactivée |
      | 34 | `supportsXHighThinking` | Compatibilité de prise en charge du raisonnement `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilité de la politique `/think` par défaut |
      | 36 | `isModernModelRef` | Correspondance de modèles live/smoke |
      | 37 | `prepareRuntimeAuth` | Échange de token avant inférence |
      | 38 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 39 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 40 | `createEmbeddingProvider` | Adaptateur d’embedding appartenant au fournisseur pour mémoire/recherche |
      | 41 | `buildReplayPolicy` | Politique personnalisée de replay/Compaction de transcription |
      | 42 | `sanitizeReplayHistory` | Réécritures de replay spécifiques au fournisseur après nettoyage générique |
      | 43 | `validateReplayTurns` | Validation stricte des tours de replay avant le runner intégré |
      | 44 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarque sur l’ajustement des prompts :

      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des
        indications de prompt système tenant compte du cache pour une famille de modèles. Préférez-le à
        `before_prompt_build` lorsque le comportement appartient à une seule famille
        fournisseur/modèle et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, voir
      [Internals: Provider Runtime Hooks](/fr/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    <a id="step-5-add-extra-capabilities"></a>
    Un plugin fournisseur peut enregistrer la parole, la transcription temps réel, la voix temps réel,
    la compréhension des médias, la génération d’images, la génération de vidéo, le fetch web
    et la recherche web en plus de l’inférence de texte :

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* données PCM */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

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
        describeImage: async (req) => ({ text: "Une photo de..." }),
        transcribeAudio: async (req) => ({ text: "Transcription..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* résultat image */ }),
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
    }
    ```

    OpenClaw classe cela comme un plugin à **capacité hybride**. C’est le
    modèle recommandé pour les plugins d’entreprise (un plugin par fournisseur). Voir
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

    Pour la génération vidéo, préférez la forme de capacités sensible au mode montrée ci-dessus :
    `generate`, `imageToVideo` et `videoToVideo`. Les champs agrégés plats comme
    `maxInputImages`, `maxInputVideos` et `maxDurationSeconds` ne
    suffisent pas pour annoncer proprement la prise en charge des modes de transformation ou les modes désactivés.

    Préférez le helper WebSocket partagé pour les fournisseurs STT en streaming. Il garde
    la capture proxy, le backoff de reconnexion, la purge à la fermeture, les handshakes ready, la mise en file
    de l’audio et les diagnostics d’événements de fermeture cohérents entre fournisseurs, tout en
    laissant au code du fournisseur la seule responsabilité du mapping des événements amont.

    Les fournisseurs STT batch qui POSTent de l’audio multipart doivent utiliser
    `buildAudioTranscriptionFormData(...)` depuis
    `openclaw/plugin-sdk/provider-http` avec les helpers de requête HTTP du fournisseur.
    Le helper de formulaire normalise les noms de fichiers envoyés, y compris les téléversements AAC
    qui nécessitent un nom de fichier de type M4A pour les API de transcription compatibles.

    Les fournisseurs de génération musicale doivent suivre le même modèle :
    `generate` pour la génération à partir d’un prompt uniquement et `edit` pour la génération basée sur
    une image de référence. Les champs agrégés plats comme `maxInputImages`,
    `supportsLyrics` et `supportsFormat` ne suffisent pas à annoncer la prise en charge de l’édition ;
    des blocs explicites `generate` / `edit` sont le contrat attendu.

  </Step>

  <Step title="Tester">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportez votre objet de configuration fournisseur depuis index.ts ou un fichier dédié
    import { acmeProvider } from "./provider.js";

    describe("fournisseur acme-ai", () => {
      it("résout les modèles dynamiques", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("renvoie le catalogue lorsqu’une clé est disponible", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("renvoie un catalogue null lorsqu’il n’y a pas de clé", async () => {
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

Les plugins fournisseur se publient de la même manière que tout autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les packages de plugin doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # Manifest avec métadonnées d’authentification fournisseur
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Point de terminaison d’usage (facultatif)
```

## Référence de l’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue fusionne par rapport aux
fournisseurs intégrés :

| Ordre     | Moment          | Cas d’usage                                      |
| --------- | --------------- | ------------------------------------------------ |
| `simple`  | Premier passage | Fournisseurs simples à clé API                   |
| `profile` | Après simple    | Fournisseurs dépendant de profils d’authentification |
| `paired`  | Après profile   | Synthétiser plusieurs entrées liées              |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) — helpers `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Internals des plugins](/fr/plugins/architecture#provider-runtime-hooks) — détails des hooks et exemples intégrés
