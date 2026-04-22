---
read_when:
    - Vous créez un nouveau Plugin fournisseur de modèles
    - Vous voulez ajouter un proxy compatible OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification fournisseur, les catalogues et les hooks runtime
sidebarTitle: Provider Plugins
summary: Guide étape par étape pour créer un Plugin fournisseur de modèles pour OpenClaw
title: Création de Plugins fournisseur
x-i18n:
    generated_at: "2026-04-22T04:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Création de Plugins fournisseur

Ce guide explique comment créer un Plugin fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous aurez un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore jamais créé de Plugin OpenClaw, lisez d’abord
  [Prise en main](/fr/plugins/building-plugins) pour la structure de package de base
  et la configuration du manifest.
</Info>

<Tip>
  Les plugins fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un daemon d’agent natif qui gère les threads, la Compaction ou les événements
  d’outil, associez le fournisseur à un [harnais d’agent](/fr/plugins/sdk-agent-harness)
  au lieu de placer les détails du protocole du daemon dans le core.
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

    Le manifest déclare `providerAuthEnvVars` afin qu’OpenClaw puisse détecter les
    identifiants sans charger le runtime de votre Plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification d’un autre identifiant de fournisseur. `modelSupport`
    est optionnel et permet à OpenClaw de charger automatiquement votre Plugin fournisseur à partir d’identifiants
    abrégés de modèle comme `acme-large` avant l’existence des hooks runtime. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal a besoin de `id`, `label`, `auth` et `catalog` :

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
              promptMessage: "Saisissez votre clé API Acme AI",
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

    `input` réécrit le prompt système final et le contenu des messages texte avant
    le transport. `output` réécrit les deltas de texte de l’assistant et le texte final avant
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou la distribution par canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur texte avec
    une authentification par clé API plus un runtime unique adossé à un catalogue, préférez le helper plus ciblé
    `defineSingleProviderPluginEntry(...)` :

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
            promptMessage: "Saisissez votre clé API Acme AI",
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

    `buildProvider` est le chemin du catalogue live utilisé lorsqu’OpenClaw peut résoudre une
    authentification réelle du fournisseur. Il peut effectuer une découverte spécifique au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les lignes hors ligne qui peuvent être affichées sans risque avant la configuration de l’authentification ;
    il ne doit nécessiter ni identifiants ni requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les plugins fournisseur intégrés, avec une configuration vide, un environnement vide et sans
    chemins d’agent/espace de travail.

    Si votre flux d’authentification doit aussi modifier `models.providers.*`, les alias, et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les helpers prédéfinis de
    `openclaw/plugin-sdk/provider-onboard`. Les helpers les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsque le point de terminaison natif d’un fournisseur prend en charge des blocs d’usage en streaming sur le
    transport normal `openai-completions`, préférez les helpers de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` au lieu de coder en dur des vérifications sur les identifiants de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la map de capacités du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope s’activent toujours même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

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
    préchauffage asynchrone — `resolveDynamicModel` s’exécute de nouveau après sa fin.

  </Step>

  <Step title="Ajouter des hooks runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement selon les besoins de votre fournisseur.

    Les builders helpers partagés couvrent maintenant les familles de compatibilité relecture/outils les plus courantes,
    donc les plugins n’ont généralement pas besoin de câbler chaque hook à la main :

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

    Familles de relecture disponibles aujourd’hui :

    | Family | Ce qu’elle câble |
    | --- | --- |
    | `openai-compatible` | Politique de relecture partagée de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement des identifiants d’appel d’outil, les corrections d’ordre assistant-first et la validation générique des tours Gemini lorsque le transport en a besoin |
    | `anthropic-by-model` | Politique de relecture tenant compte de Claude, choisie par `modelId`, de sorte que les transports de messages Anthropic ne reçoivent le nettoyage spécifique des blocs de réflexion de Claude que lorsque le modèle résolu est réellement un identifiant Claude |
    | `google-gemini` | Politique de relecture Gemini native plus assainissement de la relecture au bootstrap et mode de sortie de raisonnement balisé |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation native de relecture Gemini ni les réécritures de bootstrap |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent dans un même plugin des surfaces de modèle en messages Anthropic et compatibles OpenAI ; la suppression optionnelle des blocs de réflexion réservée à Claude reste limitée au côté Anthropic |

    Exemples intégrés réels :

    - `google` et `google-gemini-cli` : `google-gemini`
    - `openrouter`, `kilocode`, `opencode` et `opencode-go` : `passthrough-gemini`
    - `amazon-bedrock` et `anthropic-vertex` : `anthropic-by-model`
    - `minimax` : `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` et `zai` : `openai-compatible`

    Familles de flux disponibles aujourd’hui :

    | Family | Ce qu’elle câble |
    | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de flux partagé |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée |
    | `moonshot-thinking` | Mappage Moonshot binaire de charge utile native de réflexion à partir de la configuration + du niveau `/think` |
    | `minimax-fast-mode` | Réécriture de modèle MiniMax fast-mode sur le chemin de flux partagé |
    | `openai-responses-defaults` | Wrappers natifs partagés OpenAI/Codex Responses : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche Web Codex native, mise en forme de charge utile de compatibilité de raisonnement, et gestion du contexte Responses |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des sauts pour modèles non pris en charge/`auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour des fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite |

    Exemples intégrés réels :

    - `google` et `google-gemini-cli` : `google-thinking`
    - `kilocode` : `kilocode-thinking`
    - `moonshot` : `moonshot-thinking`
    - `minimax` et `minimax-portal` : `minimax-fast-mode`
    - `openai` et `openai-codex` : `openai-responses-defaults`
    - `openrouter` : `openrouter-thinking`
    - `zai` : `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exporte également l’enum de famille de relecture
    plus les helpers partagés à partir desquels ces familles sont construites. Les
    exports publics courants incluent :

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - des builders partagés de relecture comme `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)`, et
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - des helpers de relecture Gemini comme `sanitizeGoogleGeminiReplayHistory(...)`
      et `resolveTaggedReasoningOutputMode()`
    - des helpers de point de terminaison/modèle comme `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)`, et
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` expose à la fois le builder de famille et
    les helpers publics de wrapper que ces familles réutilisent. Les exports publics
    courants incluent :

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - des wrappers partagés OpenAI/Codex comme
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)`, et
      `createCodexNativeWebSearchWrapper(...)`
    - des wrappers proxy/fournisseur partagés comme `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)`, et `createMinimaxFastModeWrapper(...)`

    Certains helpers de flux restent volontairement locaux au fournisseur. Exemple
    intégré actuel : `@openclaw/anthropic-provider` exporte
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, ainsi que les
    builders Anthropic de plus bas niveau depuis sa surface publique `api.ts` /
    `contract-api.ts`. Ces helpers restent spécifiques à Anthropic parce
    qu’ils encodent aussi la gestion bêta Claude OAuth et le filtrage
    `context1m`.

    D’autres fournisseurs intégrés conservent aussi des wrappers spécifiques au transport en local lorsque
    le comportement ne se partage pas proprement entre familles. Exemple actuel : le
    plugin xAI intégré conserve la mise en forme native xAI Responses dans son propre
    `wrapStreamFn`, y compris les réécritures d’alias `/fast`, le `tool_stream` par défaut,
    le nettoyage des outils stricts non pris en charge, et la suppression de charges utiles
    de raisonnement spécifiques à xAI.

    `openclaw/plugin-sdk/provider-tools` expose actuellement une famille partagée
    de schéma d’outil plus des helpers partagés de schéma/compatibilité :

    - `ProviderToolCompatFamily` documente aujourd’hui l’inventaire des familles partagées.
    - `buildProviderToolCompatFamilyHooks("gemini")` câble le nettoyage de schéma Gemini
      + les diagnostics pour les fournisseurs qui ont besoin de schémas d’outil sûrs pour Gemini.
    - `normalizeGeminiToolSchemas(...)` et `inspectGeminiToolSchemas(...)`
      sont les helpers publics Gemini sous-jacents.
    - `resolveXaiModelCompatPatch()` renvoie le patch de compatibilité xAI intégré :
      `toolSchemaProfile: "xai"`, mots-clés de schéma non pris en charge, prise en charge native de
      `web_search`, et décodage des arguments d’appel d’outil avec entités HTML.
    - `applyXaiModelCompat(model)` applique ce même patch de compatibilité xAI à un
      modèle résolu avant qu’il n’atteigne le runner.

    Exemple intégré réel : le plugin xAI utilise `normalizeResolvedModel` plus
    `contributeResolvedModelCompat` pour garder ces métadonnées de compatibilité prises en charge par le
    fournisseur au lieu de coder en dur les règles xAI dans le core.

    Le même modèle de racine de package prend aussi en charge d’autres fournisseurs intégrés :

    - `@openclaw/openai-provider` : `api.ts` exporte des builders de fournisseur,
      des helpers de modèle par défaut et des builders de fournisseur temps réel
    - `@openclaw/openrouter-provider` : `api.ts` exporte le builder de fournisseur
      plus des helpers de configuration/onboarding

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
        Pour les fournisseurs qui nécessitent des en-têtes de requête personnalisés ou des modifications du corps :

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
      <Tab title="Identité de transport native">
        Pour les fournisseurs qui nécessitent des en-têtes de requête/session natifs ou des métadonnées sur
        les transports HTTP ou WebSocket génériques :

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

    <Accordion title="Tous les hooks fournisseur disponibles">
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n’en utilisent que 2 ou 3 :

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de l’URL de base |
      | 2 | `applyConfigDefaults` | Valeurs globales par défaut prises en charge par le fournisseur lors de la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’identifiant de modèle hérités/preview avant recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` de la famille de fournisseur avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d’usage en streaming natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d’authentification par marqueur d’environnement prise en charge par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/autohébergée ou soutenue par la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abaisser la priorité des placeholders de profil synthétique stockés derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |

    Remarques sur les replis runtime :

    - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres
      plugins fournisseur capables de hooks jusqu’à ce que l’un d’eux modifie réellement la configuration.
      Si aucun hook fournisseur ne réécrit une entrée de configuration prise en charge de la famille Google,
      le normaliseur de configuration Google intégré s’applique encore.
    - `resolveConfigApiKey` utilise le hook fournisseur lorsqu’il est exposé. Le chemin intégré
      `amazon-bedrock` possède également ici un résolveur intégré de marqueurs d’environnement AWS,
      même si l’authentification runtime Bedrock elle-même utilise toujours la chaîne par défaut
      du SDK AWS.
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour les modèles fournisseur derrière un autre transport compatible |
      | 14 | `capabilities` | Sac de capacités statiques hérité ; compatibilité uniquement |
      | 15 | `normalizeToolSchemas` | Nettoyage de schéma d’outil pris en charge par le fournisseur avant enregistrement |
      | 16 | `inspectToolSchemas` | Diagnostics de schéma d’outil pris en charge par le fournisseur |
      | 17 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisé vs natif |
      | 18 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 19 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 20 | `wrapStreamFn` | Wrappers d’en-têtes/corps personnalisés sur le chemin de flux normal |
      | 21 | `resolveTransportTurnState` | En-têtes/métadonnées natives par tour |
      | 22 | `resolveWebSocketSessionPolicy` | En-têtes de session WS natifs / cooldown |
      | 23 | `formatApiKey` | Forme personnalisée du jeton runtime |
      | 24 | `refreshOAuth` | Rafraîchissement OAuth personnalisé |
      | 25 | `buildAuthDoctorHint` | Conseils de réparation d’authentification |
      | 26 | `matchesContextOverflowError` | Détection de dépassement prise en charge par le fournisseur |
      | 27 | `classifyFailoverReason` | Classification prise en charge par le fournisseur des limitations de débit/surcharges |
      | 28 | `isCacheTtlEligible` | Filtrage TTL du cache de prompt |
      | 29 | `buildMissingAuthMessage` | Conseil personnalisé d’authentification manquante |
      | 30 | `suppressBuiltInModel` | Masquer des lignes amont obsolètes |
      | 31 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 32 | `resolveThinkingProfile` | Ensemble d’options `/think` spécifique au modèle |
      | 33 | `isBinaryThinking` | Compatibilité réflexion binaire activé/désactivé |
      | 34 | `supportsXHighThinking` | Compatibilité de prise en charge du raisonnement `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Compatibilité de politique `/think` par défaut |
      | 36 | `isModernModelRef` | Correspondance de modèles live/smoke |
      | 37 | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | 38 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’usage |
      | 39 | `fetchUsageSnapshot` | Point de terminaison d’usage personnalisé |
      | 40 | `createEmbeddingProvider` | Adaptateur d’embedding pris en charge par le fournisseur pour mémoire/recherche |
      | 41 | `buildReplayPolicy` | Politique personnalisée de relecture/Compaction de transcription |
      | 42 | `sanitizeReplayHistory` | Réécritures de relecture spécifiques au fournisseur après nettoyage générique |
      | 43 | `validateReplayTurns` | Validation stricte des tours de relecture avant le runner intégré |
      | 44 | `onModelSelected` | Callback post-sélection (par ex. télémétrie) |

      Remarque sur l’ajustement des prompts :

      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des
        indications de prompt système tenant compte du cache pour une famille de modèles. Préférez-le à
        `before_prompt_build` lorsque le comportement appartient à une seule famille fournisseur/modèle
        et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, voir
      [Internals: Provider Runtime Hooks](/fr/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (optionnel)">
    <a id="step-5-add-extra-capabilities"></a>
    Un Plugin fournisseur peut enregistrer la parole, la transcription temps réel, la
    voix temps réel, la compréhension des médias, la génération d’images, la génération vidéo, la récupération Web,
    et la recherche Web en plus de l’inférence de texte :

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

    OpenClaw classe cela comme un Plugin à **capacité hybride**. C’est le
    modèle recommandé pour les plugins d’entreprise (un plugin par fournisseur). Voir
    [Internals: Capability Ownership](/fr/plugins/architecture#capability-ownership-model).

    Pour la génération vidéo, préférez la forme de capacité sensible au mode montrée ci-dessus :
    `generate`, `imageToVideo` et `videoToVideo`. Les champs agrégés plats tels
    que `maxInputImages`, `maxInputVideos` et `maxDurationSeconds` ne
    suffisent pas pour annoncer proprement la prise en charge des modes de transformation ou les modes désactivés.

    Les fournisseurs de génération musicale doivent suivre le même modèle :
    `generate` pour la génération basée uniquement sur un prompt et `edit` pour la génération basée
    sur une image de référence. Les champs agrégés plats tels que `maxInputImages`,
    `supportsLyrics` et `supportsFormat` ne suffisent pas pour annoncer la prise en charge de l’édition ;
    des blocs explicites `generate` / `edit` constituent le contrat attendu.

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

Les plugins fournisseur se publient de la même manière que n’importe quel autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les packages de Plugin doivent utiliser
`clawhub package publish`.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # métadonnées openclaw.providers
├── openclaw.plugin.json      # Manifest avec métadonnées d’authentification du fournisseur
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Point de terminaison d’usage (optionnel)
```

## Référence de l’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Order     | Moment        | Cas d’usage                                      |
| --------- | ------------- | ------------------------------------------------ |
| `simple`  | Premier passage | Fournisseurs simples par clé API               |
| `profile` | Après simple  | Fournisseurs conditionnés par des profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées              |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [SDK Runtime](/fr/plugins/sdk-runtime) — helpers `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Internes des Plugins](/fr/plugins/architecture#provider-runtime-hooks) — détails des hooks et exemples intégrés
