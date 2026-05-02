---
read_when:
    - Vous créez un nouveau Plugin de fournisseur de modèles
    - Vous souhaitez ajouter un proxy compatible avec OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les hooks d’exécution
sidebarTitle: Provider plugins
summary: Guide pas à pas pour créer un Plugin de fournisseur de modèles pour OpenClaw
title: Création de plugins de fournisseur
x-i18n:
    generated_at: "2026-05-02T22:21:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Ce guide explique comment créer un Plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous disposerez d’un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore créé aucun Plugin OpenClaw, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour comprendre la structure de base
  du paquet et la configuration du manifeste.
</Info>

<Tip>
  Les Plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit s’exécuter via un démon d’agent natif qui possède les fils de discussion, la Compaction ou les événements
  d’outils, associez le fournisseur à un [harnais d’agent](/fr/plugins/sdk-agent-harness)
  au lieu de placer les détails du protocole du démon dans le cœur.
</Tip>

## Procédure pas à pas

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
    les identifiants sans charger l’exécution de votre Plugin. Ajoutez `providerAuthAliases`
    lorsqu’une variante de fournisseur doit réutiliser l’authentification de l’identifiant d’un autre fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre Plugin de fournisseur à partir d’identifiants
    de modèles abrégés comme `acme-large` avant que les hooks d’exécution n’existent. Si vous publiez le
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
    `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

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

    `input` réécrit l’invite système finale et le contenu des messages texte avant
    le transport. `output` réécrit les deltas de texte de l’assistant et le texte final avant
    qu’OpenClaw analyse ses propres marqueurs de contrôle ou la livraison au canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur de texte avec une authentification
    par clé API et une seule exécution adossée au catalogue, préférez l’assistant plus ciblé
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
    `buildStaticProvider` uniquement pour les lignes hors ligne qui peuvent être affichées en toute sécurité avant que l’authentification
    soit configurée ; il ne doit pas nécessiter d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les Plugins de fournisseur intégrés, avec une configuration vide, un environnement vide et aucun
    chemin d’agent ni d’espace de travail.

    Si votre flux d’authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les assistants de préréglage de
    `openclaw/plugin-sdk/provider-onboard`. Les assistants les plus ciblés sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu’un point de terminaison natif du fournisseur prend en charge les blocs d’usage diffusés sur le
    transport normal `openai-completions`, préférez les assistants de catalogue partagés dans
    `openclaw/plugin-sdk/provider-catalog-shared` au lieu de coder en dur
    des vérifications d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la
    carte des capacités du point de terminaison, de sorte que les points de terminaison natifs de style Moonshot/DashScope
    s’activent toujours même lorsqu’un Plugin utilise un identifiant de fournisseur personnalisé.

  </Step>

  <Step title="Ajouter la résolution dynamique des modèles">
    Si votre fournisseur accepte des identifiants de modèles arbitraires (comme un proxy ou un routeur),
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
    préchauffage asynchrone — `resolveDynamicModel` s’exécute de nouveau une fois terminé.

  </Step>

  <Step title="Ajouter des hooks d’exécution (si nécessaire)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez les hooks
    progressivement, au fur et à mesure que votre fournisseur les exige.

    Les générateurs d’assistants partagés couvrent maintenant les familles de compatibilité relecture/outils
    les plus courantes, de sorte que les Plugins n’ont généralement pas besoin de câbler chaque hook un par un :

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

    Familles de relecture disponibles aujourd’hui :

    | Famille | Ce qu’elle câble | Exemples intégrés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de relecture partagée de style OpenAI pour les transports compatibles OpenAI, incluant l’assainissement des identifiants d’appels d’outils, les corrections d’ordre assistant-en-premier et la validation générique des tours Gemini lorsque le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de relecture compatible Claude choisie par `modelId`, de sorte que les transports à messages Anthropic ne reçoivent le nettoyage des blocs de réflexion propre à Claude que lorsque le modèle résolu est effectivement un identifiant Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique de relecture Gemini native, plus assainissement de la relecture d’amorçage et mode de sortie de raisonnement étiqueté | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles OpenAI ; n’active pas la validation de relecture Gemini native ni les réécritures d’amorçage | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui mélangent des surfaces de modèles à messages Anthropic et compatibles OpenAI dans un seul Plugin ; l’abandon facultatif des blocs de réflexion propres à Claude reste limité au côté Anthropic | `minimax` |

    Familles de flux disponibles aujourd’hui :

    | Famille | Ce qu’elle raccorde | Exemples inclus |
    | --- | --- | --- |
    | `google-thinking` | Normalisation de la charge utile de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée | `kilocode` |
    | `moonshot-thinking` | Mappage de la charge utile de réflexion native binaire Moonshot depuis la configuration + le niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle en mode rapide MiniMax sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Wrappers Responses natifs partagés OpenAI/Codex : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web native Codex, mise en forme de charge utile compatible raisonnement et gestion du contexte Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper de raisonnement OpenRouter pour les routes proxy, avec les ignorances de modèles non pris en charge/`auto` gérées de manière centralisée | `openrouter` |
    | `tool-stream-default-on` | Wrapper `tool_stream` activé par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite | `zai` |

    <Accordion title="Seams SDK alimentant les générateurs de familles">
      Chaque générateur de famille est composé à partir d’assistants publics de plus bas niveau exportés depuis le même paquet, que vous pouvez utiliser lorsqu’un fournisseur doit s’écarter du modèle courant :

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` et les générateurs de replay bruts (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte aussi les assistants de replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et les assistants de point de terminaison/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ainsi que les wrappers OpenAI/Codex partagés (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), le wrapper compatible OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), le nettoyage du préremplissage de réflexion Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) et les wrappers proxy/fournisseur partagés (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, les assistants de schéma Gemini sous-jacents (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) et les assistants de compatibilité xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Le Plugin xAI inclus utilise `normalizeResolvedModel` + `contributeResolvedModelCompat` avec ceux-ci pour que les règles xAI restent détenues par le fournisseur.

      Certains assistants de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les générateurs de wrappers Anthropic de plus bas niveau dans son propre seam public `api.ts` / `contract-api.ts`, parce qu’ils encodent la gestion de la bêta OAuth Claude et le contrôle d’accès `context1m`. Le Plugin xAI conserve de la même façon la mise en forme native xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage des outils stricts non pris en charge, suppression de charge utile de raisonnement spécifique à xAI).

      Le même modèle à la racine de paquet soutient aussi `@openclaw/openai-provider` (générateurs de fournisseurs, assistants de modèle par défaut, générateurs de fournisseur temps réel) et `@openclaw/openrouter-provider` (générateur de fournisseur plus assistants d’onboarding/configuration).
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
        Pour les fournisseurs qui ont besoin d’en-têtes ou de métadonnées de requête/session natifs sur
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
      </Tab>
    </Tabs>

    <Accordion title="Tous les hooks de fournisseur disponibles">
      OpenClaw appelle les hooks dans cet ordre. La plupart des fournisseurs n’en utilisent que 2 ou 3 :
      Les champs de fournisseur uniquement destinés à la compatibilité qu’OpenClaw n’appelle plus, comme
      `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont pas listés
      ici.

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut d’URL de base |
      | 2 | `applyConfigDefaults` | Valeurs par défaut globales détenues par le fournisseur pendant la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias hérités/de prévisualisation d’identifiant de modèle avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage `api` / `baseUrl` de famille de fournisseur avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité de l’utilisation en streaming native pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d’authentification par marqueur d’environnement détenue par le fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/auto-hébergée ou basée sur la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abaisser les placeholders synthétiques de profil stocké derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des identifiants de modèle amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone de métadonnées avant la résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour les modèles de fournisseurs derrière un autre transport compatible |
      | 14 | `normalizeToolSchemas` | Nettoyage des schémas d’outils détenu par le fournisseur avant l’enregistrement |
      | 15 | `inspectToolSchemas` | Diagnostics des schémas d’outils détenus par le fournisseur |
      | 16 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisée ou native |
      | 17 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 18 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 19 | `wrapStreamFn` | Wrappers d’en-têtes/corps personnalisés sur le chemin de flux normal |
      | 20 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 21 | `resolveWebSocketSessionPolicy` | En-têtes/cooldown de session WS natifs |
      | 22 | `formatApiKey` | Forme de jeton d’exécution personnalisée |
      | 23 | `refreshOAuth` | Actualisation OAuth personnalisée |
      | 24 | `buildAuthDoctorHint` | Conseils de réparation de l’authentification |
      | 25 | `matchesContextOverflowError` | Détection de dépassement détenue par le fournisseur |
      | 26 | `classifyFailoverReason` | Classification de limite de débit/surcharge détenue par le fournisseur |
      | 27 | `isCacheTtlEligible` | Contrôle d’accès du TTL de cache de prompt |
      | 28 | `buildMissingAuthMessage` | Indication personnalisée d’authentification manquante |
      | 29 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 30 | `resolveThinkingProfile` | Jeu d’options `/think` propre au modèle |
      | 31 | `isBinaryThinking` | Compatibilité activation/désactivation de la réflexion binaire |
      | 32 | `supportsXHighThinking` | Compatibilité de prise en charge du raisonnement `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilité de la politique `/think` par défaut |
      | 34 | `isModernModelRef` | Correspondance de modèles live/smoke |
      | 35 | `prepareRuntimeAuth` | Échange de jeton avant l’inférence |
      | 36 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’utilisation |
      | 37 | `fetchUsageSnapshot` | Point de terminaison d’utilisation personnalisé |
      | 38 | `createEmbeddingProvider` | Adaptateur d’embeddings détenu par le fournisseur pour la mémoire/recherche |
      | 39 | `buildReplayPolicy` | Politique personnalisée de replay/Compaction de transcription |
      | 40 | `sanitizeReplayHistory` | Réécritures de replay propres au fournisseur après le nettoyage générique |
      | 41 | `validateReplayTurns` | Validation stricte des tours de replay avant le runner intégré |
      | 42 | `onModelSelected` | Rappel après sélection (par exemple, télémétrie) |

      Notes de repli à l’exécution :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres Plugins de fournisseur capables de hooks jusqu’à ce que l’un modifie réellement la configuration. Si aucun hook de fournisseur ne réécrit une entrée de configuration de famille Google prise en charge, le normaliseur de configuration Google inclus s’applique quand même.
      - `resolveConfigApiKey` utilise le hook du fournisseur lorsqu’il est exposé. Le chemin `amazon-bedrock` inclus dispose aussi ici d’un résolveur intégré de marqueurs d’environnement AWS, même si l’authentification d’exécution Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des consignes de prompt système sensibles au cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à un fournisseur/une famille de modèles et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, consultez [Internes : hooks d’exécution des fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    ### Étape 5 : Ajouter des capacités supplémentaires

    Un Plugin de fournisseur peut enregistrer la parole, la transcription temps réel, la voix temps réel, la compréhension
    multimédia, la génération d’images, la génération vidéo, la récupération web
    et la recherche web en plus de l’inférence textuelle. OpenClaw classe cela comme un
    Plugin à **capacité hybride** — le modèle recommandé pour les Plugins d’entreprise
    (un Plugin par fournisseur). Consultez
    [Internes : propriété des capacités](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` aux côtés de votre appel
    `api.registerProvider(...)` existant. Ne choisissez que les onglets dont vous avez besoin :

    <Tabs>
      <Tab title="Speech (TTS)">
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
        les plugins partagent des lectures plafonnées du corps d'erreur, l'analyse des erreurs JSON et
        les suffixes d'identifiant de requête.
      </Tab>
      <Tab title="Realtime transcription">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` : l'assistant partagé
        gère la capture du proxy, le délai de reconnexion, le vidage à la fermeture, les négociations
        d'initialisation, la mise en file d'attente audio et les diagnostics d'événements de fermeture. Votre plugin
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

        Les fournisseurs STT par lot qui publient de l'audio multipart doivent utiliser
        `buildAudioTranscriptionFormData(...)` depuis
        `openclaw/plugin-sdk/provider-http`. L'assistant normalise les noms de fichiers téléversés,
        y compris les téléversements AAC qui nécessitent un nom de fichier de style M4A pour
        les API de transcription compatibles.
      </Tab>
      <Tab title="Realtime voice">
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
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Implémentez `handleBargeIn` lorsqu'un transport peut détecter qu'un humain
        interrompt la lecture de l'assistant et que le fournisseur prend en charge la troncature ou
        l'effacement de la réponse audio active.
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
      </Tab>
      <Tab title="Image and video generation">
        Les capacités vidéo utilisent une forme **adaptée au mode** : `generate`,
        `imageToVideo` et `videoToVideo`. Les champs d'agrégation plats comme
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent pas
        à annoncer proprement la prise en charge du mode de transformation ou les modes désactivés.
        La génération musicale suit le même modèle avec des blocs `generate` /
        `edit` explicites.

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

Les Plugins de fournisseur se publient de la même manière que tout autre Plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N'utilisez pas ici l'ancien alias de publication réservé aux Skills ; les packages de Plugin doivent utiliser
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

## Référence de l'ordre du catalogue

`catalog.order` contrôle le moment où votre catalogue est fusionné par rapport aux
fournisseurs intégrés :

| Ordre     | Quand          | Cas d'utilisation                              |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs à clé API simple                 |
| `profile` | Après simple  | Fournisseurs conditionnés par des profils d'authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées           |
| `late`    | Dernier passage | Remplacer les fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — si votre plugin fournit aussi un canal
- [Runtime du SDK](/fr/plugins/sdk-runtime) — assistants `api.runtime` (TTS, recherche, sous-agent)
- [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des importations de sous-chemins
- [Internes des Plugins](/fr/plugins/architecture-internals#provider-runtime-hooks) — détails des hooks et exemples intégrés

## Associé

- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins)
