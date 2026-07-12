---
read_when:
    - Vous créez un nouveau plugin de fournisseur de modèles
    - Vous souhaitez ajouter à OpenClaw un proxy compatible avec OpenAI ou un LLM personnalisé
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les hooks d’exécution.
sidebarTitle: Provider plugins
summary: Guide étape par étape pour créer un Plugin de fournisseur de modèles pour OpenClaw
title: Création de plugins de fournisseur
x-i18n:
    generated_at: "2026-07-12T15:47:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Créez un plugin de fournisseur pour ajouter un fournisseur de modèles (LLM) à OpenClaw : un
catalogue de modèles, une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Vous découvrez les plugins OpenClaw ? Commencez par lire [Bien
  démarrer](/fr/plugins/building-plugins) pour comprendre la structure des paquets et la
  configuration du manifeste.
</Info>

<Tip>
  Les plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le
  modèle doit s’exécuter par l’intermédiaire d’un démon d’agent natif qui gère les fils, la Compaction
  ou les événements d’outils, associez le fournisseur à un [environnement
  d’exécution d’agent](/fr/plugins/sdk-agent-harness) au lieu d’intégrer les détails du protocole
  du démon au cœur.
</Tip>

## Guide pas à pas

<Steps>
  <Step title="Paquet et manifeste">
    ### Étape 1 : paquet et manifeste

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

    `setup.providers[].envVars` permet à OpenClaw de détecter les identifiants sans
    charger l’environnement d’exécution de votre plugin. Ajoutez `providerAuthAliases` lorsqu’une variante de
    fournisseur doit réutiliser l’authentification associée à l’identifiant d’un autre fournisseur. `modelSupport` est
    facultatif et permet à OpenClaw de charger automatiquement votre plugin de fournisseur à partir
    d’identifiants de modèles abrégés tels que `acme-large`, avant que les hooks d’exécution
    n’existent. `openclaw.compat` et `openclaw.build` dans `package.json` sont requis pour la
    publication sur ClawHub (`openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`
    sont les deux champs requis ; `minGatewayVersion` utilise
    `openclaw.install.minHostVersion` comme valeur de repli lorsqu’il est omis).

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur de texte minimal nécessite un `id`, un `label`, une `auth` et un `catalog`.
    `catalog` est le hook d’exécution et de configuration appartenant au fournisseur ; il peut appeler les API
    actives du fournisseur et renvoie des entrées `models.providers`.

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
    pour les interfaces utilisateur de liste, d’aide et de sélection, couvrant les lignes `text`, `voice`, `image_generation`,
    `video_generation` et `music_generation`. Conservez les appels aux points de terminaison du fournisseur
    et la mise en correspondance des réponses dans le plugin ; OpenClaw gère la structure partagée des lignes,
    les libellés de source et le rendu de l’aide.

    Vous disposez maintenant d’un fournisseur fonctionnel. Les utilisateurs peuvent exécuter
    `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    ### Découverte des modèles en direct

    Si votre fournisseur expose une API de type `/models`, conservez dans votre plugin le
    point de terminaison propre au fournisseur et la projection des lignes, et utilisez
    `openclaw/plugin-sdk/provider-catalog-live-runtime` pour le cycle de récupération
    partagé. L’utilitaire fournit des requêtes HTTP protégées, des en-têtes d’authentification du fournisseur,
    des erreurs HTTP structurées, une mise en cache avec TTL et un comportement de repli statique sans
    intégrer la politique du fournisseur au cœur d’OpenClaw.

    Utilisez `buildLiveModelProviderConfig` lorsque l’API en direct vous indique uniquement quels
    éléments du catalogue statique appartenant au fournisseur sont actuellement disponibles :

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

    Utilisez `getCachedLiveProviderModelRows` lorsque l’API du fournisseur renvoie des
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

    `run` doit rester conditionné par l’authentification et renvoyer `null` lorsqu’aucun identifiant utilisable
    n’est disponible. Conservez un `staticRun` hors ligne ou un mécanisme de repli statique afin que la configuration, la documentation,
    les tests et les surfaces de sélection ne dépendent pas d’un accès réseau actif. Utilisez un TTL
    adapté à la fréquence d’actualisation de la liste des modèles, évitez d’interroger le système de fichiers à chaque requête
    et transmettez un `readRows` / `readModelId` propre au fournisseur uniquement lorsque la
    réponse en amont ne présente pas une structure compatible avec OpenAI `{ data: [{ id, object }] }`.

    Si le fournisseur en amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
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

    `input` réécrit l’invite système finale et le contenu des messages textuels avant
    le transport. `output` réécrit les deltas de texte de l’assistant et le texte final avant
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou n’effectue la remise au canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur de texte avec une authentification par clé API
    et un environnement d’exécution unique adossé à un catalogue, privilégiez l’utilitaire plus ciblé
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

    `buildProvider` est le chemin du catalogue dynamique utilisé lorsqu’OpenClaw peut résoudre
    une authentification réelle du fournisseur. Il peut effectuer une détection propre au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les entrées hors ligne qui peuvent être affichées en toute sécurité avant que
    l’authentification soit configurée ; il ne doit pas nécessiter d’identifiants ni effectuer de requêtes réseau.
    L’affichage de `models list --all` d’OpenClaw n’exécute actuellement les catalogues statiques
    que pour les plugins de fournisseur intégrés, avec une configuration vide, un environnement vide et aucun
    chemin d’agent ou d’espace de travail.

    Si votre flux d’authentification doit également modifier `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’intégration, utilisez les assistants de préréglage de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsque le point de terminaison natif d’un fournisseur prend en charge les blocs d’utilisation diffusés sur le
    transport `openai-completions` normal, préférez les assistants de catalogue partagés de
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur
    des vérifications d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la
    carte des capacités du point de terminaison, afin que les points de terminaison natifs de type Moonshot/DashScope
    puissent toujours l’activer même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

    Les exemples de détection dynamique ci-dessus couvrent les API de fournisseur de type `/models`. Conservez
    cette détection dans `catalog.run`, conditionnée par une authentification utilisable, et maintenez
    `staticRun` sans accès réseau pour la génération de catalogues hors ligne.

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

    Si la résolution nécessite un appel réseau, utilisez `prepareDynamicModel` pour le
    préchauffage asynchrone ; `resolveDynamicModel` s’exécute de nouveau une fois celui-ci terminé.

  </Step>

  <Step title="Ajouter des hooks d’exécution (selon les besoins)">
    La plupart des fournisseurs ont uniquement besoin de `catalog` + `resolveDynamicModel`. Ajoutez les hooks
    progressivement, selon les besoins de votre fournisseur.

    Les générateurs d’assistants partagés couvrent désormais les familles les plus courantes de compatibilité
    de rejeu et d’outils, de sorte que les plugins n’ont généralement pas besoin de raccorder manuellement chaque hook un par un :

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

    Familles de rejeu actuellement disponibles :

    | Famille | Fonctionnalités raccordées | Exemples intégrés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de rejeu partagée de type OpenAI pour les transports compatibles avec OpenAI, notamment l’assainissement des identifiants d’appel d’outil, la correction de l’ordre imposant l’assistant en premier et la validation générique des tours Gemini lorsque le transport l’exige | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de rejeu tenant compte de Claude, choisie selon `modelId`, afin que les transports de messages Anthropic ne reçoivent le nettoyage des blocs de réflexion propre à Claude que lorsque le modèle résolu est effectivement un identifiant Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Même politique Claude par modèle que `anthropic-by-model`, avec en plus l’assainissement des identifiants d’appel d’outil et la préservation des identifiants natifs d’utilisation d’outil Anthropic pour les transports qui doivent conserver les identifiants natifs du fournisseur | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Politique de rejeu native Gemini avec assainissement du rejeu d’amorçage. La famille partagée conserve une sortie textuelle Gemini CLI avec un raisonnement balisé ; le fournisseur direct `google` remplace `resolveReasoningOutputMode` par `native`, car la réflexion de l’API Gemini arrive sous forme de parties de pensée natives. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles avec OpenAI ; n’active ni la validation native du rejeu Gemini ni les réécritures d’amorçage | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui combinent, dans un même plugin, des surfaces de modèles utilisant les messages Anthropic et des surfaces compatibles avec OpenAI ; la suppression facultative des blocs de réflexion propres à Claude reste limitée au côté Anthropic | `minimax` |

    Familles de flux actuellement disponibles :

    | Famille | Fonctionnalités raccordées | Exemples intégrés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation des charges utiles de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Enveloppe de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée | `kilocode` |
    | `moonshot-thinking` | Mappage de la charge utile binaire de réflexion native Moonshot à partir de la configuration et du niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle en mode rapide MiniMax sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Enveloppes natives OpenAI/Codex Responses partagées : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche Web native Codex, mise en forme des charges utiles pour la compatibilité du raisonnement et gestion du contexte Responses | `openai` |
    | `openrouter-thinking` | Enveloppe de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des modèles non pris en charge et des contournements `auto` | `openrouter` |
    | `tool-stream-default-on` | Enveloppe `tool_stream` activée par défaut pour les fournisseurs tels que Z.AI qui souhaitent diffuser les outils sauf désactivation explicite | `zai` |

    <Accordion title="Points d’extension du SDK alimentant les générateurs de familles">
      Chaque générateur de famille est composé d’assistants publics de plus bas niveau exportés depuis le même paquet, que vous pouvez utiliser lorsqu’un fournisseur doit s’écarter du modèle commun :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` et les générateurs de rejeu bruts (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte également les assistants de rejeu Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et les assistants de point de terminaison/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ainsi que les enveloppes OpenAI/Codex partagées (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), l’enveloppe DeepSeek V4 compatible avec OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), le nettoyage du préremplissage de réflexion Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), la compatibilité des appels d’outil en texte brut (`createPlainTextToolCallCompatWrapper`) et les enveloppes partagées de proxy/fournisseur (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — enveloppes légères de charges utiles et d’événements pour les chemins de fournisseur critiques, notamment `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` et `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` et les assistants sous-jacents de schéma de fournisseur.

      Pour les fournisseurs de la famille Gemini, veillez à aligner le mode de sortie du raisonnement sur
      le transport. Les fournisseurs utilisant directement l’API Google Gemini doivent employer la sortie de raisonnement
      `native` afin qu’OpenClaw consomme les parties de pensée natives sans ajouter
      de directives d’invite `<think>` / `<final>`. Les moteurs de type Gemini CLI uniquement textuels
      qui analysent une réponse JSON/textuelle finale peuvent conserver le contrat balisé partagé
      `google-gemini`.

      Certains assistants de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les générateurs d’enveloppes Anthropic de plus bas niveau dans son propre point d’extension public `api.ts` / `contract-api.ts`, car ils encodent la gestion des fonctionnalités bêta OAuth de Claude et le contrôle de `context1m`. Le plugin xAI conserve de même la mise en forme native de xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage des outils stricts non pris en charge, suppression de la charge utile de raisonnement propre à xAI).

      Le même modèle de racine de paquet prend également en charge `@openclaw/openai-provider` (générateurs de fournisseur, assistants de modèle par défaut, générateurs de fournisseur en temps réel) et `@openclaw/openrouter-provider` (générateur de fournisseur avec assistants d’intégration et de configuration).
    </Accordion>

    <Tabs>
      <Tab title="Échange de jetons">
        Pour les fournisseurs qui nécessitent un échange de jetons avant chaque appel d’inférence :

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
      <Tab title="Identité du transport natif">
        Pour les fournisseurs qui nécessitent des en-têtes ou des métadonnées natifs de requête/session sur
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
        Pour les fournisseurs qui exposent des données d’utilisation/de facturation :

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` peut produire trois résultats. Renvoyez
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` lorsque le
        fournisseur dispose d’un identifiant d’utilisation/de facturation (les champs
        facultatifs transmettent les métadonnées non secrètes de l’offre depuis le profil
        résolu vers `fetchUsageSnapshot`). Renvoyez
        `{ handled: true }` uniquement lorsque le fournisseur a définitivement traité
        l’authentification de l’utilisation, mais ne dispose d’aucun jeton d’utilisation
        exploitable, et qu’OpenClaw doit ignorer le mécanisme de secours générique par
        clé d’API/OAuth. Renvoyez `null` ou `undefined` lorsque le fournisseur n’a pas
        traité la requête et qu’OpenClaw doit poursuivre avec le mécanisme de secours générique.

        Déclarez l’identifiant du fournisseur dans `contracts.usageProviders`. Lorsque ce
        contrat de manifeste et les **deux** hooks sont présents, OpenClaw inclut
        automatiquement le fournisseur dans la collecte des données d’utilisation sans
        charger de plugins de fournisseur sans rapport. Aucune mise à jour de la liste
        d’autorisation du cœur n’est requise.
        `fetchUsageSnapshot` renvoie la structure partagée indépendante du fournisseur :

        - `plan` : abonnement ou libellé de clé indiqué par le fournisseur
        - `windows` : fenêtres de quota réinitialisables sous forme de pourcentages utilisés
        - `billing` : entrées typées `balance`, `spend` ou `budget` ; `unit` peut être
          une devise ISO ou une unité du fournisseur telle que `credits`
        - `summary` : contexte compact propre au fournisseur qui ne rentre pas dans ces
          champs structurés

        Conservez exactement la sémantique des devises. Un crédit fournisseur n’est pas
        un montant en USD sauf si le contrat en amont l’indique. Un plugin qui implémente
        uniquement `fetchUsageSnapshot` reste disponible pour les appelants explicites/synthétiques,
        mais n’est pas découvert automatiquement, car OpenClaw ne peut pas résoudre son
        identifiant d’utilisation.
      </Tab>
    </Tabs>

    <Accordion title="Hooks courants des fournisseurs">
      OpenClaw appelle les hooks approximativement dans cet ordre pour les plugins de
      modèle/fournisseur. La plupart des fournisseurs n’en utilisent que 2 à 3. Il ne
      s’agit pas du contrat `ProviderPlugin` complet : consultez
      [Éléments internes : hooks d’exécution des
      fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks) pour obtenir
      la liste complète et actuellement exacte des hooks ainsi que les remarques sur les
      mécanismes de secours.
      Les champs de fournisseur réservés à la compatibilité qu’OpenClaw n’appelle plus,
      tels que `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont pas
      répertoriés ici.

      | Hook | Quand l’utiliser |
      | --- | --- |
      | `catalog` | Catalogue de modèles ou valeurs par défaut de l’URL de base |
      | `applyConfigDefaults` | Valeurs globales par défaut détenues par le fournisseur lors de la matérialisation de la configuration |
      | `normalizeModelId` | Nettoyage des alias d’identifiants de modèles hérités/en préversion avant la recherche |
      | `normalizeTransport` | Nettoyage de `api` / `baseUrl` propre à la famille de fournisseurs avant l’assemblage générique du modèle |
      | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Réécritures natives de compatibilité de l’utilisation en streaming pour les fournisseurs configurés |
      | `resolveConfigApiKey` | Résolution de l’authentification par marqueur d’environnement détenue par le fournisseur |
      | `resolveSyntheticAuth` | Authentification synthétique locale/auto-hébergée ou fondée sur la configuration |
      | `resolveExternalAuthProfiles` | Superposer les profils d’authentification externes détenus par le fournisseur pour les identifiants gérés par la CLI/l’application |
      | `shouldDeferSyntheticProfileAuth` | Placer les espaces réservés synthétiques des profils stockés derrière l’authentification par environnement/configuration |
      | `resolveDynamicModel` | Accepter des identifiants de modèles en amont arbitraires |
      | `prepareDynamicModel` | Récupération asynchrone des métadonnées avant la résolution |
      | `normalizeResolvedModel` | Réécritures du transport avant l’exécuteur |
      | `normalizeToolSchemas` | Nettoyage des schémas d’outils détenu par le fournisseur avant l’enregistrement |
      | `inspectToolSchemas` | Diagnostics des schémas d’outils détenus par le fournisseur |
      | `resolveReasoningOutputMode` | Contrat de sortie du raisonnement balisé ou natif |
      | `prepareExtraParams` | Paramètres de requête par défaut |
      | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | `wrapStreamFn` | Enveloppes personnalisées d’en-têtes/de corps sur le chemin de streaming normal |
      | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | `resolveWebSocketSessionPolicy` | En-têtes/délai de récupération natifs de session WS |
      | `formatApiKey` | Structure personnalisée du jeton d’exécution |
      | `refreshOAuth` | Actualisation OAuth personnalisée |
      | `buildAuthDoctorHint` | Conseils de réparation de l’authentification |
      | `matchesContextOverflowError` | Détection du dépassement détenue par le fournisseur |
      | `classifyFailoverReason` | Classification des limites de débit/surcharges détenue par le fournisseur |
      | `isCacheTtlEligible` | Conditionnement de la durée de vie du cache des prompts |
      | `buildMissingAuthMessage` | Indication personnalisée d’authentification manquante |
      | `augmentModelCatalog` | Entrées synthétiques de compatibilité ascendante (obsolète — préférez `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Ensemble d’options `/think` propre au modèle |
      | `isBinaryThinking` | Compatibilité d’activation/désactivation binaire de la réflexion (obsolète — préférez `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibilité de la prise en charge du raisonnement `xhigh` (obsolète — préférez `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibilité de la politique `/think` par défaut (obsolète — préférez `resolveThinkingProfile`) |
      | `isModernModelRef` | Correspondance des modèles pour les tests en direct/de validation rapide |
      | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | `resolveUsageAuth` | Analyse personnalisée des identifiants d’utilisation |
      | `fetchUsageSnapshot` | Point de terminaison d’utilisation personnalisé |
      | `createEmbeddingProvider` | Adaptateur d’intégration vectorielle détenu par le fournisseur pour la mémoire/recherche |
      | `buildReplayPolicy` | Politique personnalisée de relecture/Compaction de la transcription |
      | `sanitizeReplayHistory` | Réécritures de la relecture propres au fournisseur après le nettoyage générique |
      | `validateReplayTurns` | Validation stricte des tours de relecture avant l’exécuteur intégré |
      | `onModelSelected` | Rappel après la sélection (par ex. télémétrie) |

      Remarques sur les mécanismes de secours à l’exécution :

      - `normalizeConfig` résout un plugin propriétaire par identifiant de fournisseur (d’abord les fournisseurs intégrés, puis le plugin d’exécution correspondant) et appelle uniquement ce hook : aucune analyse des autres fournisseurs n’est effectuée. Le hook `normalizeConfig` propre à Google est celui qui normalise les entrées de configuration `google` / `google-vertex` / `google-antigravity` ; il ne s’agit pas d’un mécanisme de secours distinct du cœur.
      - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu’il est exposé. Amazon Bedrock conserve la résolution des marqueurs d’environnement AWS dans son plugin de fournisseur ; l’authentification à l’exécution utilise toujours la chaîne par défaut du SDK AWS lorsqu’elle est configurée avec `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` reçoit les valeurs `provider` et `modelId` sélectionnées, l’indication de catalogue `reasoning` fusionnée facultative et les faits `compat` fusionnés facultatifs du modèle. Utilisez `compat` uniquement pour sélectionner l’interface/le profil de réflexion du fournisseur.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des instructions d’invite système tenant compte du cache pour une famille de modèles. Préférez-le au hook hérité `before_prompt_build` à l’échelle du plugin lorsque le comportement appartient à une seule famille de fournisseur/modèle et doit préserver la séparation stable/dynamique du cache.

    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    ### Étape 5 : ajouter des capacités supplémentaires

    Un plugin de fournisseur peut enregistrer les intégrations vectorielles, la parole,
    la transcription en temps réel, la voix en temps réel, la compréhension des médias,
    la génération d’images, la génération de vidéos, la récupération web et la recherche
    web en plus de l’inférence de texte. OpenClaw classe ce type de plugin comme un plugin
    à **capacités hybrides** : il s’agit du modèle recommandé pour les plugins d’entreprise
    (un plugin par fournisseur). Consultez
    [Éléments internes : propriété des capacités](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` parallèlement à votre appel
    `api.registerProvider(...)` existant. Sélectionnez uniquement les onglets nécessaires :

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

        Utilisez `assertOkOrThrowProviderError(...)` pour les échecs HTTP du fournisseur afin
        que les plugins partagent la lecture plafonnée du corps des erreurs, l’analyse des
        erreurs JSON et les suffixes d’identifiant de requête.
      </Tab>
      <Tab title="Transcription en temps réel">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` : l’utilitaire partagé
        gère la capture du proxy, le délai exponentiel de reconnexion, le vidage à la
        fermeture, les négociations de disponibilité, la mise en file d’attente de l’audio
        et les diagnostics des événements de fermeture. Votre plugin ne fait que mapper
        les événements en amont.

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

        Les fournisseurs STT par lots qui envoient de l’audio multipart via POST doivent utiliser
        `buildAudioTranscriptionFormData(...)` depuis
        `openclaw/plugin-sdk/provider-http`. Cette fonction d’assistance normalise les noms
        de fichiers téléversés, notamment les fichiers AAC qui nécessitent un nom de fichier
        de type M4A pour être compatibles avec les API de transcription.
      </Tab>
      <Tab title="Voix en temps réel">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
        ```
        ```typescript
          label: "Voix en temps réel Acme",
        ```
        ```typescript
          capabilities: {
        ```
        ```typescript
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
        ```
        ```typescript
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
        ```
        ```typescript
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
        ```
        ```typescript
            // Définissez ceci uniquement si le fournisseur accepte plusieurs réponses d’outils pour
        ```
        ```typescript
            // un appel, par exemple une réponse immédiate indiquant « en cours », suivie de
        ```
        ```typescript
            // le résultat final.
        ```
        ```typescript
            supportsToolResultContinuation: false,
            connect: async () => {},
        ```
        ```typescript
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
        ```
        ```typescript
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
        Déclarez `capabilities` afin que `talk.catalog` puisse exposer les modes,
        les transports, les formats audio et les indicateurs de fonctionnalité valides aux clients Talk
        Web et natifs. Implémentez `handleBargeIn` lorsqu’un transport peut détecter qu’un
        humain interrompt la lecture de l’assistant et que le fournisseur prend en charge
        la troncature ou l’effacement de la réponse audio active.
        `submitToolResult` peut renvoyer `void` pour une soumission synchrone, ou une
        `Promise<void>` pour une limite d’achèvement asynchrone que la passerelle du fournisseur
        peut exposer. Les sessions de relais du Gateway attendent cette promesse avant de
        confirmer un résultat final ou d’effacer l’exécution liée ; rejetez-la lorsque
        la soumission échoue.
        Définissez `supportsToolResultSuppression: false` lorsque le fournisseur ne peut pas
        respecter `options.suppressResponse`. OpenClaw évite alors la suppression pour
        les résultats internes de consultation forcée et d’annulation, et rejette les demandes directes
        de résultats supprimés au lieu de démarrer silencieusement une réponse.
        Les consommateurs de `createRealtimeVoiceBridgeSession` peuvent également renvoyer une
        promesse depuis `onToolCall` ; les levées d’exception synchrones et les rejets sont acheminés
        vers le rappel `onError` de la session.
        Définissez `handlesInputAudioBargeIn` uniquement lorsque la VAD du fournisseur confirme une
        interruption en appelant `onClearAudio("barge-in")`. Les fournisseurs qui omettent
        l’indicateur utilisent la détection de secours locale d’OpenClaw pour l’audio d’entrée.
      </Tab>
      <Tab title="Compréhension des médias">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
        ```
        ```typescript
          describeImage: async (req) => ({ text: "Une photo de..." }),
        ```
        ```typescript
          transcribeAudio: async (req) => ({ text: "Transcription..." }),
        ```
        ```typescript
        });
        ```
        Les fournisseurs de médias locaux ou auto-hébergés qui ne nécessitent intentionnellement aucun identifiant peuvent exposer `resolveAuth` et renvoyer `kind: "none"`.
        OpenClaw conserve néanmoins le contrôle d’authentification habituel pour les fournisseurs qui ne l’activent pas explicitement. Les fournisseurs existants peuvent continuer à lire `req.apiKey` ; les nouveaux fournisseurs doivent privilégier `req.auth`.

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

        Déclarez le même identifiant dans `contracts.embeddingProviders`. Il s'agit du
        contrat général d'embedding pour la génération réutilisable de vecteurs, notamment
        pour la recherche en mémoire. `registerMemoryEmbeddingProvider(...)` est une
        compatibilité obsolète destinée aux adaptateurs existants propres à la mémoire.
      </Tab>
      <Tab title="Génération d’images et de vidéos">
        Les fonctionnalités d’image et de vidéo utilisent une structure **tenant compte du mode**. Les
        fournisseurs d’images déclarent les blocs de fonctionnalités obligatoires `generate` et `edit` ;
        les fournisseurs de vidéos déclarent `generate`, `imageToVideo` et
        `videoToVideo`. Les champs agrégés plats tels que `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` ne suffisent pas à indiquer
        clairement la prise en charge des modes de transformation ou les modes désactivés. La génération musicale
        suit le même modèle `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Images Acme",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Vidéo Acme",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` est requis pour les deux types de fournisseurs ; `edit` et les
        blocs de transformation vidéo (`imageToVideo`, `videoToVideo`) nécessitent toujours
        un indicateur `enabled` explicite.

        Utilisez `catalogByModel` lorsque les modes ou capacités statiques d’un modèle répertorié
        diffèrent des valeurs par défaut du fournisseur. Ces métadonnées garantissent l’exactitude de
        `video_generate action=list` et des catalogues de modèles sans
        invoquer le code du fournisseur. La recherche et l’application des capacités
        au moment de la requête relèvent toujours de `resolveModelCapabilities` et de `generateVideo` ; réutilisez
        si possible la même constante de capacité pour les deux chemins.
      </Tab>
      <Tab title="Récupération et recherche sur le Web">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Récupération Acme",
          hint: "Récupérez des pages via le moteur de rendu d’Acme.",
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
            description: "Récupérez une page via Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Recherche Acme",
          hint: "Recherchez sur le Web via le moteur de recherche d’Acme.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Recherchez sur le Web via Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Les deux types de fournisseurs partagent la même structure de raccordement des identifiants :
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` et `createTool` sont tous
        requis.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### Étape 6 : tester

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportez l’objet de configuration de votre fournisseur depuis index.ts ou un fichier dédié
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

      it("renvoie un catalogue nul en l’absence de clé", async () => {
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

`clawhub skill publish <path>` est une commande différente destinée à publier un
dossier de skill, et non un paquet de plugin ; ne l’utilisez pas ici.

## Structure des fichiers

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Métadonnées openclaw.providers
├── openclaw.plugin.json      # Manifeste avec les métadonnées d’authentification du fournisseur
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Point de terminaison d’utilisation (facultatif)
```

## Référence de l’ordre du catalogue

`catalog.order` détermine quand votre catalogue est fusionné par rapport aux fournisseurs
intégrés :

| Ordre     | Quand          | Cas d’utilisation                                        |
| --------- | -------------- | -------------------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs utilisant une simple clé d’API              |
| `profile` | Après simple    | Fournisseurs soumis à l’utilisation de profils d’authentification |
| `paired`  | Après profile   | Synthétiser plusieurs entrées associées                  |
| `late`    | Dernier passage | Remplacer les fournisseurs existants (prioritaire en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - si votre plugin fournit également un canal
- [Runtime du SDK](/fr/plugins/sdk-runtime) - utilitaires `api.runtime` (TTS, recherche, sous-agent)
- [Présentation du SDK](/fr/plugins/sdk-overview) - référence complète des importations de sous-chemins
- [Fonctionnement interne des plugins](/fr/plugins/architecture-internals#provider-runtime-hooks) - détails des hooks et exemples intégrés

## Ressources connexes

- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
- [Création de plugins de canal](/fr/plugins/sdk-channel-plugins)
