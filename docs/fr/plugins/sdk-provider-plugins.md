---
read_when:
    - Vous créez un nouveau Plugin de fournisseur de modèles
    - Vous souhaitez ajouter un proxy compatible avec OpenAI ou un LLM personnalisé à OpenClaw
    - Vous devez comprendre l’authentification des fournisseurs, les catalogues et les hooks d’exécution
sidebarTitle: Provider plugins
summary: Guide étape par étape pour créer un Plugin de fournisseur de modèles pour OpenClaw
title: Créer des Plugins de fournisseur
x-i18n:
    generated_at: "2026-05-11T20:49:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Ce guide explique comment créer un plugin de fournisseur qui ajoute un fournisseur de modèles
(LLM) à OpenClaw. À la fin, vous aurez un fournisseur avec un catalogue de modèles,
une authentification par clé API et une résolution dynamique des modèles.

<Info>
  Si vous n’avez encore créé aucun plugin OpenClaw, lisez d’abord
  [Bien démarrer](/fr/plugins/building-plugins) pour comprendre la structure de base du package
  et la configuration du manifeste.
</Info>

<Tip>
  Les plugins de fournisseur ajoutent des modèles à la boucle d’inférence normale d’OpenClaw. Si le modèle
  doit passer par un démon d’agent natif qui possède les fils de discussion, la compaction ou les événements
  d’outils, associez le fournisseur à un [harnais d’agent](/fr/plugins/sdk-agent-harness)
  plutôt que de placer les détails du protocole du démon dans le noyau.
</Tip>

## Procédure pas à pas

<Steps>
  <Step title="Package and manifest">
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
    lorsqu’une variante de fournisseur doit réutiliser l’authentification d’un autre identifiant de fournisseur. `modelSupport`
    est facultatif et permet à OpenClaw de charger automatiquement votre plugin de fournisseur à partir
    d’identifiants de modèle abrégés comme `acme-large` avant l’existence des hooks runtime. Si vous publiez le
    fournisseur sur ClawHub, ces champs `openclaw.compat` et `openclaw.build`
    sont requis dans `package.json`.

  </Step>

  <Step title="Register the provider">
    Un fournisseur de texte minimal a besoin d’un `id`, d’un `label`, d’une `auth` et d’un `catalog`.
    `catalog` est le hook de runtime/configuration détenu par le fournisseur ; il peut appeler des API
    de fournisseurs en direct et retourne des entrées `models.providers`.

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

    `registerModelCatalogProvider` est la surface de catalogue de plan de contrôle la plus récente
    pour l’interface de liste/aide/sélecteur. Utilisez-la pour les lignes de texte, de génération d’images,
    de génération de vidéos et de génération de musique. Conservez les appels aux points de terminaison du fournisseur et
    le mappage des réponses dans le plugin ; OpenClaw possède la forme partagée des lignes, les libellés
    de source et le rendu de l’aide.

    C’est un fournisseur fonctionnel. Les utilisateurs peuvent désormais
    `openclaw onboard --acme-ai-api-key <key>` et sélectionner
    `acme-ai/acme-large` comme modèle.

    Si le fournisseur amont utilise des jetons de contrôle différents de ceux d’OpenClaw, ajoutez une
    petite transformation de texte bidirectionnelle plutôt que de remplacer le chemin du flux :

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
    qu’OpenClaw n’analyse ses propres marqueurs de contrôle ou la livraison au canal.

    Pour les fournisseurs intégrés qui n’enregistrent qu’un seul fournisseur de texte avec authentification
    par clé API plus un runtime unique adossé à un catalogue, préférez l’aide plus ciblée
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

    `buildProvider` est le chemin de catalogue en direct utilisé lorsqu’OpenClaw peut résoudre une vraie
    authentification de fournisseur. Il peut effectuer une découverte propre au fournisseur. Utilisez
    `buildStaticProvider` uniquement pour les lignes hors ligne qu’il est sûr d’afficher avant que l’authentification
    soit configurée ; il ne doit pas exiger d’identifiants ni effectuer de requêtes réseau.
    L’affichage `models list --all` d’OpenClaw exécute actuellement les catalogues statiques
    uniquement pour les plugins de fournisseur intégrés, avec une configuration vide, un environnement vide et aucun
    chemin d’agent/espace de travail.

    Si votre flux d’authentification doit aussi corriger `models.providers.*`, les alias et
    le modèle par défaut de l’agent pendant l’onboarding, utilisez les aides de préréglage de
    `openclaw/plugin-sdk/provider-onboard`. Les aides les plus ciblées sont
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` et
    `createModelCatalogPresetAppliers(...)`.

    Lorsqu’un point de terminaison natif de fournisseur prend en charge les blocs d’utilisation diffusés sur le
    transport normal `openai-completions`, préférez les aides de catalogue partagées dans
    `openclaw/plugin-sdk/provider-catalog-shared` plutôt que de coder en dur
    des vérifications d’identifiant de fournisseur. `supportsNativeStreamingUsageCompat(...)` et
    `applyProviderNativeStreamingUsageCompat(...)` détectent la prise en charge à partir de la
    carte des capacités du point de terminaison, de sorte que les points de terminaison natifs de style Moonshot/DashScope
    s’activent tout de même, même lorsqu’un plugin utilise un identifiant de fournisseur personnalisé.

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

    Si la résolution exige un appel réseau, utilisez `prepareDynamicModel` pour le préchauffage
    asynchrone - `resolveDynamicModel` s’exécute de nouveau une fois celui-ci terminé.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    La plupart des fournisseurs n’ont besoin que de `catalog` + `resolveDynamicModel`. Ajoutez des hooks
    progressivement à mesure que votre fournisseur les exige.

    Les générateurs d’aides partagés couvrent désormais les familles les plus courantes de rejeu/compatibilité
    d’outils, si bien que les plugins n’ont généralement pas besoin de câbler chaque hook un par un :

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

    Familles de rejeu disponibles aujourd’hui :

    | Famille | Ce qu’elle intègre | Exemples groupés |
    | --- | --- | --- |
    | `openai-compatible` | Politique de rejeu partagée de style OpenAI pour les transports compatibles avec OpenAI, y compris l’assainissement des identifiants d’appels d’outils, les corrections d’ordre plaçant l’assistant en premier et la validation générique des tours Gemini lorsque le transport en a besoin | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Politique de rejeu compatible avec Claude, choisie par `modelId`, afin que les transports de messages Anthropic ne reçoivent le nettoyage des blocs de réflexion propre à Claude que lorsque le modèle résolu est effectivement un identifiant Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Politique de rejeu Gemini native avec assainissement du rejeu d’amorçage et mode de sortie de raisonnement balisé | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Assainissement des signatures de pensée Gemini pour les modèles Gemini exécutés via des transports proxy compatibles avec OpenAI ; n’active pas la validation de rejeu Gemini native ni les réécritures d’amorçage | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Politique hybride pour les fournisseurs qui combinent des surfaces de modèle Anthropic-message et compatibles avec OpenAI dans un seul plugin ; la suppression facultative des blocs de réflexion limitée à Claude reste cantonnée au côté Anthropic | `minimax` |

    Familles de flux disponibles aujourd’hui :

    | Famille | Ce qu’elle intègre | Exemples groupés |
    | --- | --- | --- |
    | `google-thinking` | Normalisation des charges utiles de réflexion Gemini sur le chemin de flux partagé | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Enveloppe de raisonnement Kilo sur le chemin de flux proxy partagé, avec `kilo/auto` et les identifiants de raisonnement proxy non pris en charge qui ignorent la réflexion injectée | `kilocode` |
    | `moonshot-thinking` | Mappage de charge utile native-thinking binaire Moonshot depuis la configuration + le niveau `/think` | `moonshot` |
    | `minimax-fast-mode` | Réécriture du modèle en mode rapide MiniMax sur le chemin de flux partagé | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Enveloppes Responses OpenAI/Codex natives partagées : en-têtes d’attribution, `/fast`/`serviceTier`, verbosité du texte, recherche web Codex native, mise en forme de charge utile compatible avec le raisonnement et gestion du contexte Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Enveloppe de raisonnement OpenRouter pour les routes proxy, avec les ignorés de modèles non pris en charge/`auto` gérés de façon centralisée | `openrouter` |
    | `tool-stream-default-on` | Enveloppe `tool_stream` activée par défaut pour les fournisseurs comme Z.AI qui veulent le streaming d’outils sauf désactivation explicite | `zai` |

    <Accordion title="Seams SDK alimentant les générateurs de famille">
      Chaque générateur de famille est composé à partir d’assistants publics de plus bas niveau exportés depuis le même package, auxquels vous pouvez faire appel lorsqu’un fournisseur doit sortir du modèle commun :

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, et les générateurs de rejeu bruts (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exporte également les assistants de rejeu Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) et les assistants de point de terminaison/modèle (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, ainsi que les enveloppes OpenAI/Codex partagées (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), l’enveloppe compatible OpenAI DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), le nettoyage du préremplissage de réflexion Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) et les enveloppes proxy/fournisseur partagées (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, et les assistants de schéma Gemini sous-jacents (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`).

      Certains assistants de flux restent volontairement locaux au fournisseur. `@openclaw/anthropic-provider` conserve `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` et les générateurs d’enveloppes Anthropic de plus bas niveau dans son propre seam public `api.ts` / `contract-api.ts`, car ils encodent la gestion des bêtas OAuth Claude et la protection `context1m`. Le plugin xAI conserve de même la mise en forme native xAI Responses dans son propre `wrapStreamFn` (alias `/fast`, `tool_stream` par défaut, nettoyage des outils stricts non pris en charge, suppression de charge utile de raisonnement propre à xAI).

      Le même modèle à la racine du package sous-tend aussi `@openclaw/openai-provider` (générateurs de fournisseurs, assistants de modèle par défaut, générateurs de fournisseurs temps réel) et `@openclaw/openrouter-provider` (générateur de fournisseur plus assistants d’onboarding/configuration).
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
      Les champs de fournisseur uniquement conservés pour la compatibilité, qu’OpenClaw n’appelle plus, comme
      `ProviderPlugin.capabilities` et `suppressBuiltInModel`, ne sont pas listés
      ici.

      | # | Hook | Quand l’utiliser |
      | --- | --- | --- |
      | 1 | `catalog` | Catalogue de modèles ou valeurs par défaut de l’URL de base |
      | 2 | `applyConfigDefaults` | Valeurs par défaut globales propres au fournisseur pendant la matérialisation de la configuration |
      | 3 | `normalizeModelId` | Nettoyage des alias d’ID de modèle hérités/en aperçu avant la recherche |
      | 4 | `normalizeTransport` | Nettoyage de `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle |
      | 5 | `normalizeConfig` | Normaliser la configuration `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Réécritures de compatibilité d’utilisation du streaming natif pour les fournisseurs de configuration |
      | 7 | `resolveConfigApiKey` | Résolution d’authentification par marqueur d’environnement propre au fournisseur |
      | 8 | `resolveSyntheticAuth` | Authentification synthétique locale/auto-hébergée ou basée sur la configuration |
      | 9 | `shouldDeferSyntheticProfileAuth` | Abaisser les espaces réservés de profil stocké synthétiques derrière l’authentification env/config |
      | 10 | `resolveDynamicModel` | Accepter des ID de modèles amont arbitraires |
      | 11 | `prepareDynamicModel` | Récupération asynchrone des métadonnées avant la résolution |
      | 12 | `normalizeResolvedModel` | Réécritures de transport avant le runner |
      | 13 | `contributeResolvedModelCompat` | Indicateurs de compatibilité pour les modèles de fournisseurs derrière un autre transport compatible |
      | 14 | `normalizeToolSchemas` | Nettoyage des schémas d’outils propre au fournisseur avant l’enregistrement |
      | 15 | `inspectToolSchemas` | Diagnostics des schémas d’outils propres au fournisseur |
      | 16 | `resolveReasoningOutputMode` | Contrat de sortie de raisonnement balisée ou native |
      | 17 | `prepareExtraParams` | Paramètres de requête par défaut |
      | 18 | `createStreamFn` | Transport StreamFn entièrement personnalisé |
      | 19 | `wrapStreamFn` | Enveloppes d’en-têtes/de corps personnalisées sur le chemin de stream normal |
      | 20 | `resolveTransportTurnState` | En-têtes/métadonnées natifs par tour |
      | 21 | `resolveWebSocketSessionPolicy` | En-têtes/refroidissement de session WS natifs |
      | 22 | `formatApiKey` | Forme de jeton d’exécution personnalisée |
      | 23 | `refreshOAuth` | Actualisation OAuth personnalisée |
      | 24 | `buildAuthDoctorHint` | Conseils de réparation de l’authentification |
      | 25 | `matchesContextOverflowError` | Détection de dépassement propre au fournisseur |
      | 26 | `classifyFailoverReason` | Classification des limites de débit/surcharges propre au fournisseur |
      | 27 | `isCacheTtlEligible` | Contrôle d’éligibilité du TTL du cache de prompt |
      | 28 | `buildMissingAuthMessage` | Indice personnalisé d’authentification manquante |
      | 29 | `augmentModelCatalog` | Lignes synthétiques de compatibilité ascendante |
      | 30 | `resolveThinkingProfile` | Jeu d’options `/think` spécifique au modèle |
      | 31 | `isBinaryThinking` | Compatibilité marche/arrêt de la réflexion binaire |
      | 32 | `supportsXHighThinking` | Compatibilité de la prise en charge du raisonnement `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Compatibilité de la politique `/think` par défaut |
      | 34 | `isModernModelRef` | Correspondance de modèles live/smoke |
      | 35 | `prepareRuntimeAuth` | Échange de jetons avant l’inférence |
      | 36 | `resolveUsageAuth` | Analyse personnalisée des identifiants d’utilisation |
      | 37 | `fetchUsageSnapshot` | Point de terminaison d’utilisation personnalisé |
      | 38 | `createEmbeddingProvider` | Adaptateur d’embeddings propre au fournisseur pour la mémoire/recherche |
      | 39 | `buildReplayPolicy` | Politique personnalisée de relecture/compaction de transcript |
      | 40 | `sanitizeReplayHistory` | Réécritures de relecture spécifiques au fournisseur après le nettoyage générique |
      | 41 | `validateReplayTurns` | Validation stricte des tours de relecture avant le runner intégré |
      | 42 | `onModelSelected` | Callback après sélection (par exemple télémétrie) |

      Notes sur les fallbacks d’exécution :

      - `normalizeConfig` vérifie d’abord le fournisseur correspondant, puis les autres plugins de fournisseur capables de hooks jusqu’à ce que l’un d’eux modifie réellement la configuration. Si aucun hook de fournisseur ne réécrit une entrée de configuration de la famille Google prise en charge, le normaliseur de configuration Google fourni continue de s’appliquer.
      - `resolveConfigApiKey` utilise le hook de fournisseur lorsqu’il est exposé. Le chemin `amazon-bedrock` fourni dispose également ici d’un résolveur intégré de marqueurs d’environnement AWS, même si l’authentification d’exécution Bedrock elle-même utilise toujours la chaîne par défaut du SDK AWS.
      - `resolveSystemPromptContribution` permet à un fournisseur d’injecter des conseils de prompt système tenant compte du cache pour une famille de modèles. Préférez-le à `before_prompt_build` lorsque le comportement appartient à un fournisseur/une famille de modèles et doit préserver la séparation stable/dynamique du cache.

      Pour des descriptions détaillées et des exemples concrets, consultez [Internes : hooks d’exécution des fournisseurs](/fr/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Ajouter des capacités supplémentaires (facultatif)">
    ### Étape 5 : Ajouter des capacités supplémentaires

    Un plugin fournisseur peut enregistrer la synthèse vocale, la transcription en temps réel, la voix en temps réel, la compréhension des médias, la génération d’images, la génération de vidéos, la récupération web et la recherche web aux côtés de l’inférence textuelle. OpenClaw classe cela comme un plugin à **capacité hybride** - le modèle recommandé pour les plugins d’entreprise (un plugin par fournisseur). Consultez [Internals : propriété des capacités](/fr/plugins/architecture#capability-ownership-model).

    Enregistrez chaque capacité dans `register(api)` avec votre appel `api.registerProvider(...)` existant. Choisissez uniquement les onglets dont vous avez besoin :

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

        Utilisez `assertOkOrThrowProviderError(...)` pour les échecs HTTP du fournisseur afin que les plugins partagent les lectures limitées des corps d’erreur, l’analyse des erreurs JSON et les suffixes d’identifiant de requête.
      </Tab>
      <Tab title="Transcription en temps réel">
        Préférez `createRealtimeTranscriptionWebSocketSession(...)` - l’assistant partagé gère la capture de proxy, le délai de reconnexion, le vidage à la fermeture, les handshakes prêts, la mise en file d’attente audio et les diagnostics d’événements de fermeture. Votre plugin ne fait que mapper les événements amont.

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

        Les fournisseurs STT par lot qui envoient de l’audio multipart via POST doivent utiliser `buildAudioTranscriptionFormData(...)` depuis `openclaw/plugin-sdk/provider-http`. L’assistant normalise les noms de fichiers téléversés, y compris les téléversements AAC qui nécessitent un nom de fichier de style M4A pour les API de transcription compatibles.
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

        Déclarez `capabilities` afin que `talk.catalog` puisse exposer les modes, transports, formats audio et indicateurs de fonctionnalité valides aux clients Talk de navigateur et natifs. Implémentez `handleBargeIn` lorsqu’un transport peut détecter qu’un humain interrompt la lecture de l’assistant et que le fournisseur prend en charge la troncature ou l’effacement de la réponse audio active.
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
        Les capacités vidéo utilisent une forme **sensible au mode** : `generate`, `imageToVideo` et `videoToVideo`. Les champs agrégés plats comme `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ne suffisent pas à annoncer proprement la prise en charge du mode transformation ou les modes désactivés. La génération de musique suit le même modèle avec des blocs explicites `generate` / `edit`.

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
    ### Étape 6 : tester

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

Les plugins fournisseurs se publient de la même manière que tout autre plugin de code externe :

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

N’utilisez pas ici l’ancien alias de publication réservé aux skills ; les paquets de plugins doivent utiliser `clawhub package publish`.

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

`catalog.order` contrôle le moment où votre catalogue fusionne par rapport aux fournisseurs intégrés :

| Ordre     | Moment        | Cas d’utilisation                              |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Premier passage | Fournisseurs à clé d’API simple              |
| `profile` | Après simple  | Fournisseurs conditionnés par des profils d’authentification |
| `paired`  | Après profile | Synthétiser plusieurs entrées liées           |
| `late`    | Dernier passage | Remplacer les fournisseurs existants (gagne en cas de collision) |

## Étapes suivantes

- [Plugins de canal](/fr/plugins/sdk-channel-plugins) - si votre plugin fournit aussi un canal
- [Runtime du SDK](/fr/plugins/sdk-runtime) - assistants `api.runtime` (TTS, recherche, sous-agent)
- [Présentation du SDK](/fr/plugins/sdk-overview) - référence complète des importations de sous-chemins
- [Internals de Plugin](/fr/plugins/architecture-internals#provider-runtime-hooks) - détails des hooks et exemples groupés

## Connexe

- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
- [Créer des plugins de canal](/fr/plugins/sdk-channel-plugins)
