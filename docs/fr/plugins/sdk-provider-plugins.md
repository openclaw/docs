---
read_when:
    - Vous créez un nouveau Plugin de fournisseur de modèles
    - Vous souhaitez ajouter un proxy compatible avec OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les points d’accroche d’exécution
sidebarTitle: Provider plugins
summary: Guide pas à pas pour créer un plugin de fournisseur de modèle pour OpenClaw
title: Créer des plugins de fournisseur
x-i18n:
    generated_at: "2026-04-30T07:40:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Ce guide explique comment créer un Plugin fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous disposerez d’un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore créé aucun Plugin OpenClaw, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour comprendre la structure de base du package
  et la configuration du manifeste.
</Info>

<Tip>
  Les Plugins fournisseurs ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit passer par un démon d’agent natif qui possède les fils, la compaction ou les événements
  d’outils, associez le fournisseur à un [harnais d’agent](/fr/plugins/sdk-agent-harness)
  au lieu de placer les détails du protocole du démon dans le cœur.
</Tip>

## Procédure pas à pas

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
    lorsqu’une variante de fournisseur doit réutiliser l’authentification de l’identifiant d’un autre fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre Plugin fournisseur à partir
    d’identifiants de modèles abrégés comme `acme-large` avant que les hooks de runtime existent. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur minimal nécessite un `id`, un `label`, une `auth` et un `catalog` :

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

    C’est un fournisseur fonctionnel. Les utilisateurs peuvent maintenant exécuter
    `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    Si le fournisseur amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
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

    Pour les fournisseurs intégrés qui enregistrent uniquement un fournisseur de texte avec authentification par clé API
    plus un seul runtime adossé au catalogue, préférez l’assistant plus ciblé
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

    `buildProvider` est le chemin de catalogue live utilisé lorsqu’OpenClaw peut résoudre une véritable
    authentification fournisseur. Il peut effectuer une découverte propre au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les lignes hors ligne qu’il est sûr d’afficher avant que l’authentification
    soit configurée ; il ne doit pas nécessiter d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les Plugins fournisseurs intégrés, avec une configuration vide, un env vide et aucun
    chemin d’agent/espace de travail.

    Si votre flux d’authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les assistants de préréglage de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu’un endpoint natif de fournisseur prend en charge des blocs d’utilisation diffusés sur le
    transport normal `openai-completions`, préférez les assistants de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur
    des vérifications d’identifiants de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la
    carte des capacités de l’endpoint, de sorte que les endpoints natifs de type Moonshot/DashScope
    s’activent quand même, même lorsqu’un Plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour le préchauffage
    asynchrone — `resolveDynamicModel` s’exécute de nouveau après sa fin.

  </Step>

  <Step title="Ajouter des hooks de runtime (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement à mesure que votre fournisseur en a besoin.

    Les constructeurs d’assistants partagés couvrent désormais les familles les plus courantes de compatibilité
    replay/outils, de sorte que les Plugins n’ont généralement pas besoin de câbler chaque hook un par un :

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

    | Famille | Ce qu’elle câble | Exemples intégrés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de replay partagée de style OpenAI pour les transports compatibles OpenAI, y compris l’assainissement des identifiants d’appels d’outils, les corrections d’ordre assistant en premier et la validation générique des tours Gemini lorsque le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de replay compatible Claude choisie par `modelId`, afin que les transports de messages Anthropic ne reçoivent le nettoyage des blocs de réflexion propres à Claude que lorsque le modèle résolu est réellement un ID Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique de replay Gemini native plus assainissement du replay de bootstrap et mode de sortie de raisonnement balisée | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation de replay Gemini native ni les réécritures de bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles à messages Anthropic et compatibles OpenAI dans un seul Plugin ; la suppression facultative des blocs de réflexion Claude uniquement reste limitée au côté Anthropic | `minimax` |

    Familles de flux disponibles aujourd’hui :

    | Famille | Ce qu’elle câble | Exemples intégrés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation des payloads de raisonnement Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les ids de raisonnement proxy non pris en charge qui ignorent le raisonnement injecté | `kilocode` |
    | `moonshot-thinking` | Mappage des payloads binaires de raisonnement natif Moonshot depuis la configuration + niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle MiniMax en mode rapide sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers Responses OpenAI/Codex natifs partagés : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web native Codex, mise en forme des payloads compatibles avec le raisonnement et gestion du contexte Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec les sauts pour modèles non pris en charge/`auto` gérés de manière centralisée | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite | `zai` |

    <Accordion title="Seams SDK alimentant les générateurs de familles">
      Chaque générateur de famille est composé à partir d’aides publiques de plus bas niveau exportées depuis le même package, que vous pouvez utiliser lorsqu’un fournisseur doit s’écarter du schéma commun :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, et les générateurs de relecture bruts (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte aussi les aides de relecture Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et les aides de point de terminaison/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus les wrappers OpenAI/Codex partagés (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), le wrapper compatible OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), le nettoyage du préremplissage de raisonnement Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) et les wrappers proxy/fournisseur partagés (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, les aides de schéma Gemini sous-jacentes (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) et les aides de compatibilité xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Le Plugin xAI intégré utilise `normalizeResolvedModel` + `contributeResolvedModelCompat` avec celles-ci pour que les règles xAI restent détenues par le fournisseur.

      Certaines aides de flux restent volontairement locales au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les générateurs de wrappers Anthropic de plus bas niveau dans son propre seam public `api.ts` / `contract-api.ts`, car ils encodent la gestion bêta OAuth Claude et le verrouillage `context1m`. Le Plugin xAI conserve de même la mise en forme native xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage strict-tool non pris en charge, suppression des payloads de raisonnement propres à xAI).

      Le même modèle de racine de package soutient aussi `@openclaw/openai-provider` (générateurs de fournisseurs, aides de modèle par défaut, générateurs de fournisseurs temps réel) et `@openclaw/openrouter-provider` (générateur de fournisseur plus aides d’intégration/configuration).
    </Accordion>

    <Tabs>
      <Tab title="Échange de jeton">
        Pour les fournisseurs qui nécessitent un échange de jeton avant chaque appel d’inférence :

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
        Pour les fournisseurs qui ont besoin d’en-têtes de requête/session natifs ou de métadonnées sur
        les transports HTTP ou WebSocket génériques :

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
        Pour les fournisseurs qui exposent des données d’utilisation/facturation :

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
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n’en utilisent que 2 ou 3 :
      Les champs de fournisseur réservés à la compatibilité qu’OpenClaw n’appelle plus, comme
      `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont pas listés
      ici.

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut d’URL de base |
      | 2 | `applyConfigDefaults` | Valeurs globales par défaut détenues par le fournisseur pendant la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’id de modèle hérités/preview avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` de famille de fournisseur avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d’utilisation du streaming natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d’authentification par marqueur d’environnement détenue par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/auto-hébergée ou basée sur la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abaisser les placeholders de profil stocké synthétique derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des ids de modèles amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant la résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour les modèles de vendeurs derrière un autre transport compatible |
      | 14 | `normalizeToolSchemas` | Nettoyage des schémas d’outils détenu par le fournisseur avant l’enregistrement |
      | 15 | `inspectToolSchemas` | Diagnostics des schémas d’outils détenus par le fournisseur |
      | 16 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement tagué ou natif |
      | 17 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 18 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 19 | `wrapStreamFn` | Wrappers d’en-têtes/corps personnalisés sur le chemin de flux normal |
      | 20 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 21 | `resolveWebSocketSessionPolicy` | En-têtes/cool-down de session WS natifs |
      | 22 | `formatApiKey` | Forme de jeton d’exécution personnalisée |
      | 23 | `refreshOAuth` | Actualisation OAuth personnalisée |
      | 24 | `buildAuthDoctorHint` | Conseils de réparation d’authentification |
      | 25 | `matchesContextOverflowError` | Détection de dépassement détenue par le fournisseur |
      | 26 | `classifyFailoverReason` | Classification de limite de débit/surcharge détenue par le fournisseur |
      | 27 | `isCacheTtlEligible` | Verrouillage du TTL du cache de prompts |
      | 28 | `buildMissingAuthMessage` | Indice personnalisé d’authentification manquante |
      | 29 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 30 | `resolveThinkingProfile` | Ensemble d’options `/think` propres au modèle |
      | 31 | `isBinaryThinking` | Compatibilité d’activation/désactivation du raisonnement binaire |
      | 32 | `supportsXHighThinking` | Compatibilité avec la prise en charge du raisonnement `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilité de la politique `/think` par défaut |
      | 34 | `isModernModelRef` | Correspondance de modèle live/smoke |
      | 35 | `prepareRuntimeAuth` | Échange de jeton avant l’inférence |
      | 36 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’utilisation |
      | 37 | `fetchUsageSnapshot` | Point de terminaison d’utilisation personnalisé |
      | 38 | `createEmbeddingProvider` | Adaptateur d’embeddings détenu par le fournisseur pour la mémoire/recherche |
      | 39 | `buildReplayPolicy` | Politique personnalisée de relecture/Compaction de transcript |
      | 40 | `sanitizeReplayHistory` | Réécritures de relecture propres au fournisseur après le nettoyage générique |
      | 41 | `validateReplayTurns` | Validation stricte des tours de relecture avant le runner embarqué |
      | 42 | `onModelSelected` | Rappel après sélection (par ex. télémétrie) |

      Notes de fallback à l’exécution :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres Plugins fournisseurs capables de hooks jusqu’à ce que l’un d’eux modifie réellement la configuration. Si aucun hook de fournisseur ne réécrit une entrée de configuration de famille Google prise en charge, le normaliseur de configuration Google intégré s’applique quand même.
      - `resolveConfigApiKey` utilise le hook de fournisseur lorsqu’il est exposé. Le chemin `amazon-bedrock` intégré dispose aussi ici d’un résolveur de marqueur d’environnement AWS intégré, même si l’authentification d’exécution Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des consignes de prompt système tenant compte du cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à un seul fournisseur/une seule famille de modèles et doit préserver la séparation cache stable/dynamique.

      Pour des descriptions détaillées et des exemples réels, consultez [Internes : hooks d’exécution de fournisseur](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    Un Plugin fournisseur peut enregistrer la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de vidéos, la récupération web et la recherche web en plus de l’inférence textuelle. OpenClaw classe cela comme un Plugin à **capacité hybride** — le modèle recommandé pour les Plugins d’entreprise (un Plugin par vendeur). Consultez
    [Internes : propriété des capacités](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` avec votre appel
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
        Privilégiez `createRealtimeTranscriptionWebSocketSession(...)` : l’utilitaire partagé
        gère la capture de proxy, le délai progressif de reconnexion, le vidage à la fermeture, les
        handshakes de disponibilité, la mise en file d’attente de l’audio et les diagnostics des événements
        de fermeture. Votre plugin ne fait que mapper les événements amont.

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

        Les fournisseurs STT par lots qui envoient de l’audio multipart avec POST doivent utiliser
        `buildAudioTranscriptionFormData(...)` depuis
        `openclaw/plugin-sdk/provider-http`. L’utilitaire normalise les noms de fichiers téléversés,
        y compris les téléversements AAC qui nécessitent un nom de fichier de type M4A pour
        les API de transcription compatibles.
      </Tab>
      <Tab title="Voix en temps réel">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
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
        Les capacités vidéo utilisent une forme **adaptée aux modes** : `generate`,
        `imageToVideo` et `videoToVideo`. Les champs agrégés plats comme
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent pas
        pour déclarer proprement la prise en charge des modes de transformation ou les modes désactivés.
        La génération de musique suit le même schéma avec des blocs explicites `generate` /
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

  <Step title="Test">
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

Les plugins de fournisseur se publient de la même manière que tout autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux Skills ; les packages de plugin doivent utiliser
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

## Référence de l’ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue fusionne par rapport aux
fournisseurs intégrés :

| Ordre     | Quand         | Cas d’utilisation                              |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs simples avec clé d’API          |
| `profile` | Après simple  | Fournisseurs conditionnés par des profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées associées        |
| `late`    | Dernier passage | Remplacer des fournisseurs existants (l’emporte en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [Environnement d’exécution du SDK](/fr/plugins/sdk-runtime) — utilitaires `api.runtime` (TTS, recherche, sous-agent)
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des importations de sous-chemins
- [Fonctionnement interne des plugins](/fr/plugins/architecture-internals#provider-runtime-hooks) — détails des points d’accroche et exemples intégrés

## Articles connexes

- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins)
