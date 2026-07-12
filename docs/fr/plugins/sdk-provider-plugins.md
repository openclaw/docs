---
read_when:
    - Vous développez un nouveau plugin de fournisseur de modèles
    - Vous souhaitez ajouter à OpenClaw un proxy compatible avec OpenAI ou un LLM personnalisé
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les hooks d’exécution.
sidebarTitle: Provider plugins
summary: Guide pas à pas pour créer un Plugin de fournisseur de modèles pour OpenClaw
title: Création de plugins de fournisseur
x-i18n:
    generated_at: "2026-07-12T03:11:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Créez un Plugin de fournisseur pour ajouter un fournisseur de modèles (LLM) à OpenClaw : un
catalogue de modèles, une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Vous découvrez les plugins OpenClaw ? Lisez d’abord [Bien démarrer](/fr/plugins/building-plugins)
  pour découvrir la structure des paquets et la configuration du manifeste.
</Info>

<Tip>
  Les plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le
  modèle doit s’exécuter via un démon d’agent natif qui gère les fils de discussion, la Compaction
  ou les événements d’outils, associez le fournisseur à un [environnement
  d’exécution d’agent](/fr/plugins/sdk-agent-harness) plutôt que d’intégrer les détails du protocole
  du démon au cœur.
</Tip>

## Procédure détaillée

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

    `setup.providers[].envVars` permet à OpenClaw de détecter les identifiants sans
    charger l’environnement d’exécution de votre Plugin. Ajoutez `providerAuthAliases` lorsqu’une variante
    de fournisseur doit réutiliser l’identifiant d’authentification d’un autre fournisseur. `modelSupport` est
    facultatif et permet à OpenClaw de charger automatiquement votre Plugin de fournisseur à partir d’identifiants
    abrégés de modèles tels que `acme-large`, avant que les hooks d’exécution n’existent. `openclaw.compat`
    et `openclaw.build` dans `package.json` sont obligatoires pour la publication sur ClawHub
    (`openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`
    sont les deux champs obligatoires ; `minGatewayVersion` utilise par défaut
    `openclaw.install.minHostVersion` lorsqu’il est omis).

  </Step>

  <Step title="Enregistrer le fournisseur">
    Un fournisseur de texte minimal nécessite un `id`, un `label`, une configuration `auth` et un `catalog`.
    `catalog` est le hook d’exécution et de configuration géré par le fournisseur ; il peut appeler les API
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
    pour les interfaces de liste, d’aide et de sélection ; elle couvre les lignes `text`, `voice`, `image_generation`,
    `video_generation` et `music_generation`. Conservez les appels aux points de terminaison
    du fournisseur et la mise en correspondance des réponses dans le Plugin ; OpenClaw gère la structure
    partagée des lignes, les libellés de source et le rendu de l’aide.

    Vous disposez maintenant d’un fournisseur fonctionnel. Les utilisateurs peuvent exécuter
    `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    ### Découverte dynamique des modèles

    Si votre fournisseur expose une API de type `/models`, conservez le point de terminaison propre au
    fournisseur et la projection des lignes dans votre Plugin, puis utilisez
    `openclaw/plugin-sdk/provider-catalog-live-runtime` pour le cycle de récupération
    partagé. Cet utilitaire fournit des requêtes HTTP protégées, des en-têtes d’authentification du fournisseur,
    des erreurs HTTP structurées, une mise en cache avec durée de vie et un comportement de repli statique, sans
    intégrer de règles propres au fournisseur dans le cœur d’OpenClaw.

    Utilisez `buildLiveModelProviderConfig` lorsque l’API dynamique vous indique uniquement quels
    éléments du catalogue statique géré par le fournisseur sont actuellement disponibles :

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
    métadonnées plus riches et que le Plugin doit lui-même projeter les lignes dans les définitions
    de modèles OpenClaw :

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

    `run` doit rester conditionné à l’authentification et renvoyer `null` lorsqu’aucun identifiant
    utilisable n’est disponible. Conservez un `staticRun` hors ligne ou une solution de repli statique afin que la configuration, la documentation,
    les tests et les interfaces de sélection ne dépendent pas d’un accès réseau actif. Utilisez une durée de vie
    adaptée à la fraîcheur de la liste des modèles, évitez d’interroger le système de fichiers à chaque requête
    et transmettez des fonctions `readRows` / `readModelId` propres au fournisseur uniquement lorsque la
    réponse en amont n’adopte pas une structure compatible avec OpenAI de la forme `{ data: [{ id, object }] }`.

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

    `input` réécrit l’invite système finale et le contenu textuel du message avant
    le transport. `output` réécrit les fragments de texte de l’assistant et le texte final avant
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou n’effectue la remise au canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur de texte avec une authentification
    par clé API et un environnement d’exécution unique adossé à un catalogue, privilégiez l’utilitaire plus ciblé
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
    l’authentification réelle du fournisseur. Il peut effectuer une détection propre au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les entrées hors ligne qui peuvent être affichées sans risque avant que
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
    transport `openai-completions` standard, préférez les assistants de catalogue partagés de
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur
    des vérifications d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la
    carte des capacités du point de terminaison, de sorte que les points de terminaison natifs de type Moonshot/DashScope
    puissent toujours l’activer même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

    Les exemples de détection dynamique ci-dessus couvrent les API de fournisseur de type `/models`. Conservez
    cette détection dans `catalog.run`, conditionnée par la présence d’une authentification utilisable, et veillez à ce que
    `staticRun` n’utilise pas le réseau pour la génération hors ligne du catalogue.

  </Step>

  <Step title="Add dynamic model resolution">
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
    préchauffage asynchrone — `resolveDynamicModel` s’exécute à nouveau une fois celui-ci terminé.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement, selon les besoins de votre fournisseur.

    Les générateurs d’assistants partagés couvrent désormais les familles les plus courantes de compatibilité
    de relecture et d’outils, de sorte que les plugins n’ont généralement pas besoin de connecter manuellement chaque hook :

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

    Familles de relecture actuellement disponibles :

    | Famille | Éléments qu’elle connecte | Exemples intégrés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de relecture partagée de style OpenAI pour les transports compatibles avec OpenAI, notamment l’assainissement des identifiants d’appels d’outils, les corrections d’ordre plaçant l’assistant en premier et la validation générique des tours Gemini lorsque le transport l’exige | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de relecture tenant compte de Claude, choisie selon `modelId`, afin que les transports de messages Anthropic n’appliquent le nettoyage des blocs de réflexion propre à Claude que lorsque le modèle résolu est réellement un identifiant Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Même politique Claude par modèle que `anthropic-by-model`, avec en plus l’assainissement des identifiants d’appels d’outils et la préservation des identifiants natifs d’utilisation d’outils Anthropic pour les transports qui doivent conserver les identifiants natifs du fournisseur | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Politique de relecture native Gemini avec assainissement de la relecture d’amorçage. La famille partagée conserve le raisonnement balisé pour la CLI Gemini à sortie textuelle ; le fournisseur direct `google` remplace `resolveReasoningOutputMode` par `native`, car la réflexion de l’API Gemini arrive sous forme de parties de pensée natives. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles avec OpenAI ; n’active ni la validation native de la relecture Gemini ni les réécritures d’amorçage | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride destinée aux fournisseurs qui combinent des surfaces de modèles à messages Anthropic et compatibles avec OpenAI dans un même plugin ; la suppression facultative des blocs de réflexion réservée à Claude reste limitée au côté Anthropic | `minimax` |

    Familles de flux actuellement disponibles :

    | Famille | Éléments qu’elle connecte | Exemples intégrés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation des charges utiles de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Enveloppe de raisonnement Kilo sur le chemin de flux proxy partagé, avec omission de la réflexion injectée pour `kilo/auto` et les identifiants de raisonnement proxy non pris en charge | `kilocode` |
    | `moonshot-thinking` | Mappage de la charge utile binaire de réflexion native Moonshot à partir de la configuration et du niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle en mode rapide MiniMax sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Enveloppes Responses natives OpenAI/Codex partagées : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche Web native Codex, mise en forme de la charge utile pour la compatibilité du raisonnement et gestion du contexte Responses | `openai` |
    | `openrouter-thinking` | Enveloppe de raisonnement OpenRouter pour les routes proxy, avec gestion centralisée des omissions pour les modèles non pris en charge et `auto` | `openrouter` |
    | `tool-stream-default-on` | Enveloppe `tool_stream` activée par défaut pour les fournisseurs comme Z.AI qui souhaitent diffuser les outils sauf désactivation explicite | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Chaque générateur de famille est composé d’assistants publics de plus bas niveau exportés depuis le même paquet, que vous pouvez utiliser lorsqu’un fournisseur doit s’écarter du modèle commun :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` et les générateurs de relecture bruts (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte également les assistants de relecture Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ainsi que les assistants de point de terminaison et de modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ainsi que les enveloppes OpenAI/Codex partagées (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), l’enveloppe DeepSeek V4 compatible avec OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), le nettoyage du préremplissage de réflexion des messages Anthropic (`createAnthropicThinkingPrefillPayloadWrapper`), la compatibilité des appels d’outils en texte brut (`createPlainTextToolCallCompatWrapper`) et les enveloppes partagées de proxy et de fournisseur (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — enveloppes légères de charges utiles et d’événements pour les chemins critiques des fournisseurs, notamment `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` et `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` et les assistants sous-jacents de schéma de fournisseur.

      Pour les fournisseurs de la famille Gemini, veillez à ce que le mode de sortie du raisonnement corresponde
      au transport. Les fournisseurs directs de l’API Google Gemini doivent utiliser la sortie de raisonnement
      `native` afin qu’OpenClaw consomme les parties de pensée natives sans ajouter
      de directives d’invite `<think>` / `<final>`. Les moteurs de type CLI Gemini
      exclusivement textuels qui analysent une réponse finale JSON ou textuelle peuvent conserver le contrat balisé
      partagé `google-gemini`.

      Certains assistants de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les générateurs d’enveloppes Anthropic de plus bas niveau dans sa propre interface publique `api.ts` / `contract-api.ts`, car ils encodent la gestion des versions bêta OAuth de Claude et le contrôle de `context1m`. De même, le plugin xAI conserve la mise en forme native de Responses xAI dans sa propre fonction `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage des outils stricts non pris en charge et suppression de la charge utile de raisonnement propre à xAI).

      Le même modèle à la racine du paquet sous-tend également `@openclaw/openai-provider` (générateurs de fournisseurs, assistants de modèle par défaut et générateurs de fournisseurs en temps réel) et `@openclaw/openrouter-provider` (générateur de fournisseur avec assistants d’intégration et de configuration).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
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
      <Tab title="Custom headers">
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
      <Tab title="Native transport identity">
        Pour les fournisseurs qui nécessitent des en-têtes ou des métadonnées natifs de requête ou de session sur
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
        Pour les fournisseurs qui exposent des données d’utilisation et de facturation :

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` a trois résultats possibles. Renvoyez
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` lorsque le
        fournisseur dispose d’un identifiant d’utilisation ou de facturation (les
        champs facultatifs transmettent les métadonnées non secrètes de l’offre
        depuis le profil résolu vers `fetchUsageSnapshot`). Renvoyez
        `{ handled: true }` uniquement lorsque le fournisseur a définitivement
        traité l’authentification pour l’utilisation, mais ne dispose d’aucun jeton
        d’utilisation exploitable, et qu’OpenClaw doit ignorer le mécanisme de
        repli générique par clé API/OAuth. Renvoyez `null` ou `undefined` lorsque le
        fournisseur n’a pas traité la requête et qu’OpenClaw doit poursuivre avec
        le mécanisme de repli générique.

        Déclarez l’identifiant du fournisseur dans `contracts.usageProviders`.
        Lorsque ce contrat de manifeste et les **deux** hooks sont présents,
        OpenClaw inclut automatiquement le fournisseur dans la collecte des
        données d’utilisation sans charger de plugins de fournisseur sans rapport.
        Aucune mise à jour de la liste d’autorisation du cœur n’est requise.
        `fetchUsageSnapshot` renvoie la structure partagée indépendante du fournisseur :

        - `plan` : abonnement ou libellé de clé indiqué par le fournisseur
        - `windows` : fenêtres de quota réinitialisables exprimées en pourcentages utilisés
        - `billing` : entrées typées `balance`, `spend` ou `budget` ; `unit` peut être
          une devise ISO ou une unité du fournisseur telle que `credits`
        - `summary` : contexte compact propre au fournisseur qui ne tient pas dans ces
          champs structurés

        Préservez exactement la sémantique des devises. Un crédit fournisseur
        n’est pas un dollar américain, sauf si le contrat en amont l’indique. Un
        plugin qui implémente uniquement `fetchUsageSnapshot` reste disponible pour
        les appelants explicites ou synthétiques, mais n’est pas détecté
        automatiquement, car OpenClaw ne peut pas résoudre son identifiant
        d’utilisation.
      </Tab>
    </Tabs>

    <Accordion title="Hooks courants des fournisseurs">
      OpenClaw appelle les hooks approximativement dans cet ordre pour les plugins
      de modèle ou de fournisseur. La plupart des fournisseurs n’en utilisent que
      2 ou 3. Il ne s’agit pas du contrat `ProviderPlugin` complet : consultez
      [Fonctionnement interne : hooks d’exécution des
      fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks) pour
      obtenir la liste complète et actuellement exacte des hooks ainsi que les
      remarques sur les mécanismes de repli. Les champs de fournisseur réservés à
      la compatibilité qu’OpenClaw n’appelle plus, tels que
      `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont pas
      répertoriés ici.

      | Hook | Quand l’utiliser |
      | --- | --- |
      | `catalog` | Catalogue de modèles ou valeurs par défaut de l’URL de base |
      | `applyConfigDefaults` | Valeurs globales par défaut appartenant au fournisseur lors de la matérialisation de la configuration |
      | `normalizeModelId` | Nettoyage des alias d’identifiants de modèles anciens ou en préversion avant la recherche |
      | `normalizeTransport` | Nettoyage de `api` / `baseUrl` propre à la famille de fournisseurs avant l’assemblage générique du modèle |
      | `normalizeConfig` | Normalisation de la configuration `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Réécritures natives de compatibilité de l’utilisation en streaming pour les fournisseurs configurés |
      | `resolveConfigApiKey` | Résolution de l’authentification par marqueur d’environnement appartenant au fournisseur |
      | `resolveSyntheticAuth` | Authentification synthétique locale, auto-hébergée ou basée sur la configuration |
      | `resolveExternalAuthProfiles` | Superposition des profils d’authentification externes appartenant au fournisseur pour les identifiants gérés par la CLI ou l’application |
      | `shouldDeferSyntheticProfileAuth` | Abaissement de la priorité des espaces réservés synthétiques des profils stockés derrière l’authentification par environnement ou configuration |
      | `resolveDynamicModel` | Acceptation d’identifiants arbitraires de modèles en amont |
      | `prepareDynamicModel` | Récupération asynchrone des métadonnées avant la résolution |
      | `normalizeResolvedModel` | Réécritures du transport avant l’exécuteur |
      | `normalizeToolSchemas` | Nettoyage des schémas d’outils appartenant au fournisseur avant l’enregistrement |
      | `inspectToolSchemas` | Diagnostics des schémas d’outils appartenant au fournisseur |
      | `resolveReasoningOutputMode` | Contrat de sortie du raisonnement balisé ou natif |
      | `prepareExtraParams` | Paramètres de requête par défaut |
      | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | `wrapStreamFn` | Enveloppes personnalisées d’en-têtes ou de corps sur le chemin de streaming normal |
      | `resolveTransportTurnState` | En-têtes et métadonnées natifs par tour |
      | `resolveWebSocketSessionPolicy` | En-têtes et délai de récupération natifs de session WS |
      | `formatApiKey` | Structure personnalisée du jeton d’exécution |
      | `refreshOAuth` | Actualisation OAuth personnalisée |
      | `buildAuthDoctorHint` | Conseils de réparation de l’authentification |
      | `matchesContextOverflowError` | Détection des dépassements appartenant au fournisseur |
      | `classifyFailoverReason` | Classification des limitations de débit ou surcharges appartenant au fournisseur |
      | `isCacheTtlEligible` | Contrôle de l’éligibilité au TTL du cache de prompts |
      | `buildMissingAuthMessage` | Indication personnalisée d’authentification manquante |
      | `augmentModelCatalog` | Entrées synthétiques de compatibilité ascendante (obsolète : préférez `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Ensemble d’options `/think` propre au modèle |
      | `isBinaryThinking` | Compatibilité d’activation ou de désactivation binaire de la réflexion (obsolète : préférez `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Compatibilité avec le raisonnement `xhigh` (obsolète : préférez `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Compatibilité avec la politique `/think` par défaut (obsolète : préférez `resolveThinkingProfile`) |
      | `isModernModelRef` | Correspondance des modèles en conditions réelles ou pour les tests de fumée |
      | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | `resolveUsageAuth` | Analyse personnalisée de l’identifiant d’utilisation |
      | `fetchUsageSnapshot` | Point de terminaison d’utilisation personnalisé |
      | `createEmbeddingProvider` | Adaptateur de plongements appartenant au fournisseur pour la mémoire et la recherche |
      | `buildReplayPolicy` | Politique personnalisée de relecture et de Compaction des transcriptions |
      | `sanitizeReplayHistory` | Réécritures de relecture propres au fournisseur après le nettoyage générique |
      | `validateReplayTurns` | Validation stricte des tours de relecture avant l’exécuteur intégré |
      | `onModelSelected` | Rappel après sélection (par exemple, télémétrie) |

      Remarques sur les mécanismes de repli à l’exécution :

      - `normalizeConfig` résout un seul plugin propriétaire par identifiant de fournisseur (d’abord les fournisseurs intégrés, puis le plugin d’exécution correspondant) et n’appelle que ce hook : aucune analyse des autres fournisseurs n’est effectuée. Le hook `normalizeConfig` propre à Google est celui qui normalise les entrées de configuration `google` / `google-vertex` / `google-antigravity` ; il ne s’agit pas d’un mécanisme de repli distinct du cœur.
      - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu’il est exposé. Amazon Bedrock conserve la résolution des marqueurs d’environnement AWS dans son plugin de fournisseur ; l’authentification à l’exécution continue toutefois d’utiliser la chaîne par défaut du SDK AWS lorsqu’elle est configurée avec `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` reçoit les valeurs sélectionnées `provider` et `modelId`, l’indication facultative `reasoning` issue du catalogue fusionné, ainsi que les informations facultatives `compat` du modèle fusionné. Utilisez `compat` uniquement pour sélectionner l’interface ou le profil de réflexion du fournisseur.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des instructions d’invite système tenant compte du cache pour une famille de modèles. Préférez-le à l’ancien hook global au plugin `before_prompt_build` lorsque le comportement appartient à une famille de fournisseurs ou de modèles et doit préserver la séparation stable/dynamique du cache.

    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    ### Étape 5 : ajouter des capacités supplémentaires

    Un plugin de fournisseur peut enregistrer les plongements, la synthèse vocale,
    la transcription en temps réel, la voix en temps réel, la compréhension des
    médias, la génération d’images, la génération de vidéos, la récupération web
    et la recherche web parallèlement à l’inférence de texte. OpenClaw classe cela
    comme un plugin à **capacités hybrides** : le modèle recommandé pour les
    plugins d’entreprise (un plugin par fournisseur). Consultez
    [Fonctionnement interne : propriété des capacités](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` avec votre appel
    `api.registerProvider(...)` existant. Sélectionnez uniquement les onglets dont
    vous avez besoin :

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

        Utilisez `assertOkOrThrowProviderError(...)` pour les échecs HTTP du
        fournisseur afin que les plugins partagent la lecture plafonnée du corps
        des erreurs, l’analyse des erreurs JSON et les suffixes d’identifiant de
        requête.
      </Tab>
      <Tab title="Transcription en temps réel">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` : l’utilitaire
        partagé gère la capture du proxy, le délai exponentiel de reconnexion, la
        vidange lors de la fermeture, les négociations de disponibilité, la mise
        en file d’attente de l’audio et les diagnostics des événements de
        fermeture. Votre plugin se contente de mapper les événements en amont.

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
        `openclaw/plugin-sdk/provider-http`. Cet utilitaire normalise les noms
        de fichiers téléversés, y compris les téléversements AAC qui nécessitent
        un nom de fichier de type M4A pour les API de transcription compatibles.
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
            handlesInputAudioBargeIn: true,
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
        transports, formats audio et indicateurs de fonctionnalités valides aux
        clients Talk dans le navigateur et natifs. Implémentez `handleBargeIn`
        lorsqu’un transport peut détecter qu’une personne interrompt la lecture
        de l’assistant et que le fournisseur prend en charge la troncature ou
        l’effacement de la réponse audio active.
        `submitToolResult` peut renvoyer `void` pour une soumission synchrone ou
        une `Promise<void>` pour une limite d’achèvement asynchrone que le pont
        du fournisseur peut exposer. Les sessions de relais du Gateway attendent
        cette promesse avant de confirmer un résultat final ou d’effacer
        l’exécution associée ; rejetez-la si la soumission échoue.
        Définissez `supportsToolResultSuppression: false` lorsque le fournisseur
        ne peut pas respecter `options.suppressResponse`. OpenClaw évite alors
        la suppression pour les résultats internes de consultation forcée et
        d’annulation, et rejette les demandes directes de résultats supprimés
        au lieu de démarrer silencieusement une réponse.
        Les consommateurs de `createRealtimeVoiceBridgeSession` peuvent
        également renvoyer une promesse depuis `onToolCall` ; les exceptions
        synchrones et les rejets sont transmis au rappel `onError` de la session.
        Définissez `handlesInputAudioBargeIn` uniquement lorsque la VAD du
        fournisseur confirme une interruption en appelant
        `onClearAudio("barge-in")`. Les fournisseurs qui omettent cet indicateur
        utilisent la détection de secours locale d’OpenClaw sur l’audio entrant.
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

        Les fournisseurs de médias locaux ou auto-hébergés qui, par conception,
        ne nécessitent pas d’identifiants peuvent exposer `resolveAuth` et
        renvoyer `kind: "none"`. OpenClaw conserve néanmoins le contrôle
        d’authentification normal pour les fournisseurs qui ne choisissent pas
        explicitement cette option. Les fournisseurs existants peuvent
        continuer à lire `req.apiKey` ; les nouveaux fournisseurs doivent
        privilégier `req.auth`.

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
      <Tab title="Plongements vectoriels">
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

        Déclarez le même identifiant dans `contracts.embeddingProviders`.
        Il s’agit du contrat général de plongement vectoriel pour la génération
        réutilisable de vecteurs, notamment pour la recherche en mémoire.
        `registerMemoryEmbeddingProvider(...)` est une compatibilité obsolète
        destinée aux adaptateurs existants propres à la mémoire.
      </Tab>
      <Tab title="Génération d’images et de vidéos">
        Les fonctionnalités d’image et de vidéo utilisent une structure
        **tenant compte du mode**. Les fournisseurs d’images déclarent les blocs
        de fonctionnalités obligatoires `generate` et `edit` ; les fournisseurs
        de vidéos déclarent `generate`, `imageToVideo` et `videoToVideo`.
        Les champs agrégés plats tels que `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` ne suffisent pas à annoncer
        clairement la prise en charge des modes de transformation ou les modes
        désactivés. La génération musicale suit le même modèle `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
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

        `capabilities` est obligatoire pour les deux types de fournisseurs ;
        `edit` et les blocs de transformation vidéo (`imageToVideo`,
        `videoToVideo`) nécessitent toujours un indicateur `enabled` explicite.

        Utilisez `catalogByModel` lorsque les modes ou fonctionnalités statiques
        d’un modèle répertorié diffèrent des valeurs par défaut du fournisseur.
        Ces métadonnées permettent à `video_generate action=list` et aux
        catalogues de modèles de rester exacts sans appeler le code du
        fournisseur. La résolution et l’application des fonctionnalités au
        moment de la requête relèvent toujours de `resolveModelCapabilities` et
        de `generateVideo` ; réutilisez si possible la même constante de
        fonctionnalités pour les deux chemins.
      </Tab>
      <Tab title="Récupération et recherche sur le Web">
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
          hint: "Search the web through Acme's search backend.",
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
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Les deux types de fournisseurs partagent la même structure de
        raccordement des identifiants : `hint`, `envVars`, `placeholder`,
        `signupUrl`, `credentialPath`, `getCredentialValue`,
        `setCredentialValue` et `createTool` sont tous obligatoires.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Tester">
    ### Étape 6 : Tester

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

Les Plugins de fournisseurs se publient de la même manière que n’importe quel
autre Plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` est une autre commande, destinée à publier un
dossier de skill et non un paquet de Plugin ; ne l’utilisez pas ici.

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

`catalog.order` détermine le moment où votre catalogue est fusionné par rapport
aux fournisseurs intégrés :

| Ordre     | Quand          | Cas d’usage                                         |
| --------- | -------------- | --------------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs utilisant une simple clé d’API         |
| `profile` | Après simple    | Fournisseurs conditionnés par des profils d’authentification |
| `paired`  | Après profile   | Synthétiser plusieurs entrées associées             |
| `late`    | Dernier passage | Remplacer les fournisseurs existants (prioritaire en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - si votre plugin fournit également un canal
- [Environnement d’exécution du SDK](/fr/plugins/sdk-runtime) - utilitaires `api.runtime` (synthèse vocale, recherche, sous-agent)
- [Présentation du SDK](/fr/plugins/sdk-overview) - référence complète des importations par sous-chemin
- [Fonctionnement interne des plugins](/fr/plugins/architecture-internals#provider-runtime-hooks) - détails des hooks et exemples intégrés

## Ressources connexes

- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
- [Création de plugins de canal](/fr/plugins/sdk-channel-plugins)
