---
read_when:
    - Tworzysz nowy Plugin dostawcy modeli.
    - Chcesz dodać zgodne z OpenAI proxy albo niestandardowy LLM do OpenClaw.
    - Musisz zrozumieć auth dostawcy, katalogi i hooki runtime.
sidebarTitle: Provider plugins
summary: Przewodnik krok po kroku po tworzeniu Pluginu dostawcy modeli dla OpenClaw
title: Tworzenie Pluginów dostawców моделей
x-i18n:
    generated_at: "2026-04-24T09:24:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Ten przewodnik pokazuje krok po kroku, jak zbudować Plugin dostawcy, który dodaje
dostawcę modeli (LLM) do OpenClaw. Na końcu będziesz mieć dostawcę z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozwiązywaniem modeli.

<Info>
  Jeśli nie budowałeś wcześniej żadnego Pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy dostawców dodają modele do normalnej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywny demon agenta, który zarządza wątkami, Compaction albo zdarzeniami narzędzi,
  połącz dostawcę z [agent harness](/pl/plugins/sdk-agent-harness),
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

## Przewodnik

<Steps>
  <Step title="Pakiet i manifest">
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
      "description": "Dostawca modeli Acme AI",
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
          "choiceLabel": "Klucz API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Klucz API Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Manifest deklaruje `providerAuthEnvVars`, aby OpenClaw mógł wykrywać
    poświadczenia bez ładowania runtime twojego Pluginu. Dodaj `providerAuthAliases`,
    gdy wariant dostawcy ma ponownie używać identyfikatora auth innego dostawcy. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie ładować Plugin twojego dostawcy z
    uproszczonych identyfikatorów modeli, takich jak `acme-large`, jeszcze zanim pojawią się hooki runtime. Jeśli publikujesz dostawcę w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Zarejestruj dostawcę">
    Minimalny dostawca potrzebuje `id`, `label`, `auth` i `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Dostawca modeli Acme AI",
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
              label: "Klucz API Acme AI",
              hint: "Klucz API z panelu Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Wpisz swój klucz API Acme AI",
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

    To jest działający dostawca. Użytkownicy mogą teraz uruchomić
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    Jeśli dostawca upstream używa innych tokenów sterujących niż OpenClaw, dodaj
    małą dwukierunkową transformację tekstu zamiast zastępować ścieżkę strumienia:

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

    `input` przepisuje końcowy prompt systemowy i treść wiadomości tekstowych przed
    transportem. `output` przepisuje delty tekstu asystenta i końcowy tekst, zanim
    OpenClaw sparsuje własne znaczniki sterujące albo dostarczenie kanału.

    W przypadku dołączonych dostawców, którzy rejestrują tylko jednego dostawcę tekstowego z
    auth kluczem API plus jeden runtime oparty na katalogu, preferuj węższy
    helper `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Dostawca modeli Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Klucz API Acme AI",
            hint: "Klucz API z panelu Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Wpisz swój klucz API Acme AI",
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

    `buildProvider` to ścieżka katalogu live używana, gdy OpenClaw może rozwiązać rzeczywiste
    auth dostawcy. Może wykonywać wykrywanie specyficzne dla dostawcy. Używaj
    `buildStaticProvider` tylko dla wierszy offline, które można bezpiecznie pokazać przed
    skonfigurowaniem auth; nie może wymagać poświadczeń ani wykonywać żądań sieciowych.
    Wyświetlanie `models list --all` w OpenClaw wykonuje obecnie katalogi statyczne
    tylko dla dołączonych Pluginów dostawców, z pustą konfiguracją, pustym env i bez
    ścieżek agenta/workspace.

    Jeśli twój przepływ auth musi także łatkować `models.providers.*`, aliasy i
    domyślny model agenta podczas onboardingu, użyj helperów presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` i
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint dostawcy obsługuje strumieniowane bloki usage na
    zwykłym transporcie `openai-completions`, preferuj współdzielone helpery katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast kodować na sztywno kontrole identyfikatora dostawcy. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu, więc natywne endpointy w stylu Moonshot/DashScope nadal
    mogą zostać włączone, nawet gdy Plugin używa niestandardowego identyfikatora dostawcy.

  </Step>

  <Step title="Dodaj dynamiczne rozwiązywanie modelu">
    Jeśli twój dostawca akceptuje arbitralne identyfikatory modeli (jak proxy albo router),
    dodaj `resolveDynamicModel`:

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

    Jeśli rozwiązywanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do
    asynchronicznego rozgrzania — `resolveDynamicModel` uruchomi się ponownie po jego zakończeniu.

  </Step>

  <Step title="Dodaj hooki runtime (w razie potrzeby)">
    Większość dostawców potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, zgodnie z potrzebami twojego dostawcy.

    Współdzielone buildery helperów obejmują teraz najczęstsze rodziny replay/tool-compat,
    więc Pluginy zwykle nie muszą ręcznie podłączać każdego hooka po kolei:

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

    Obecnie dostępne rodziny replay:

    | Rodzina | Co podłącza | Przykłady dołączone |
    | --- | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzacja tool-call-id, poprawki kolejności assistant-first i ogólna walidacja tur Gemini tam, gdzie transport tego wymaga | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Polityka replay świadoma Claude wybierana przez `modelId`, dzięki czemu transporty wiadomości Anthropic dostają czyszczenie bloków thinking specyficzne dla Claude tylko wtedy, gdy rozwiązany model jest rzeczywiście identyfikatorem Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Natywna polityka replay Gemini plus sanityzacja bootstrap replay i tryb tagowanego wyniku reasoning | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanityzacja sygnatur thought Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisania bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Polityka hybrydowa dla dostawców, którzy mieszają powierzchnie modeli wiadomości Anthropic i kompatybilnych z OpenAI w jednym Pluginie; opcjonalne porzucanie bloków thinking tylko dla Claude pozostaje ograniczone do strony Anthropic | `minimax` |

    Obecnie dostępne rodziny stream:

    | Rodzina | Co podłącza | Przykłady dołączone |
    | --- | --- | --- |
    | `google-thinking` | Normalizacja ładunku thinking Gemini na współdzielonej ścieżce strumienia | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper reasoning Kilo na współdzielonej ścieżce strumienia proxy, z pomijaniem wstrzykniętego thinking dla `kilo/auto` i nieobsługiwanych identyfikatorów reasoning proxy | `kilocode` |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku thinking Moonshot z konfiguracji + poziomu `/think` | `moonshot` |
    | `minimax-fast-mode` | Przepisywanie modelu MiniMax fast-mode na współdzielonej ścieżce strumienia | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie WWW Codex, kształtowanie ładunku kompatybilności reasoning i zarządzanie kontekstem Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter dla tras proxy, z centralnie obsługiwanymi pominięciami dla nieobsługiwanych modeli/`auto` | `openrouter` |
    | `tool-stream-default-on` | Domyślnie włączony wrapper `tool_stream` dla dostawców takich jak z.ai, którzy chcą streamingu narzędzi, chyba że zostanie jawnie wyłączony | `zai` |

    <Accordion title="SDK seams zasilające buildery rodzin">
      Każdy builder rodziny jest złożony z pomocników publicznych niższego poziomu eksportowanych z tego samego pakietu, po które możesz sięgnąć, gdy dostawca musi wyjść poza wspólny wzorzec:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` i surowe buildery replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Eksportuje też helpery replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) oraz helpery endpointów/modeli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, plus współdzielone wrappery OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) i współdzielone wrappery proxy/dostawców (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, bazowe helpery schematów Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) oraz helpery kompatybilności xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Dołączony Plugin xAI używa z nimi `normalizeResolvedModel` + `contributeResolvedModelCompat`, aby reguły xAI pozostawały własnością dostawcy.

      Niektóre helpery strumieni pozostają celowo lokalne dla dostawcy. `@openclaw/anthropic-provider` trzyma `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższego poziomu buildery wrapperów Anthropic we własnym publicznym łączu `api.ts` / `contract-api.ts`, ponieważ kodują obsługę beta Claude OAuth i bramkowanie `context1m`. Plugin xAI podobnie trzyma natywne kształtowanie xAI Responses we własnym `wrapStreamFn` (aliasy `/fast`, domyślne `tool_stream`, czyszczenie nieobsługiwanego strict-tool, usuwanie ładunku reasoning specyficznego dla xAI).

      Ten sam wzorzec katalogu głównego pakietu wspiera również `@openclaw/openai-provider` (buildery dostawców, helpery modeli domyślnych, buildery dostawców realtime) oraz `@openclaw/openrouter-provider` (builder dostawcy plus helpery onboardingu/konfiguracji).
    </Accordion>

    <Tabs>
      <Tab title="Wymiana tokenu">
        Dla dostawców, którzy potrzebują wymiany tokenu przed każdym wywołaniem inferencji:

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
      <Tab title="Niestandardowe nagłówki">
        Dla dostawców, którzy potrzebują niestandardowych nagłówków żądania albo modyfikacji treści:

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
      <Tab title="Tożsamość natywnego transportu">
        Dla dostawców, którzy potrzebują natywnych nagłówków lub metadanych żądań/sesji na
        ogólnych transportach HTTP albo WebSocket:

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
      <Tab title="Użycie i billing">
        Dla dostawców, którzy udostępniają dane usage/billing:

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

    <Accordion title="Wszystkie dostępne hooki dostawców">
      OpenClaw wywołuje hooki w tej kolejności. Większość dostawców używa tylko 2-3:

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli albo domyślne `baseUrl` |
      | 2 | `applyConfigDefaults` | Globalne ustawienia domyślne należące do dostawcy podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/podglądowych `modelId` przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Natywne przepisania kompatybilności streaming-usage dla dostawców konfiguracji |
      | 7 | `resolveConfigApiKey` | Rozwiązywanie auth markerów env należące do dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne auth lokalne/self-hosted albo oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie priorytetu syntetycznych placeholderów zapisanych profili względem auth env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie arbitralnych upstreamowych identyfikatorów modeli |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozwiązywaniem |
      | 12 | `normalizeResolvedModel` | Przepisania transportu przed runnerem |
      | 13 | `contributeResolvedModelCompat` | Flagi kompatybilności dla modeli dostawcy działających za innym kompatybilnym transportem |
      | 14 | `capabilities` | Starszy statyczny zestaw możliwości; tylko dla kompatybilności |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do dostawcy przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | 17 | `resolveReasoningOutputMode` | Kontrakt oznaczanego vs natywnego wyjścia reasoning |
      | 18 | `prepareExtraParams` | Domyślne parametry żądania |
      | 19 | `createStreamFn` | W pełni niestandardowy transport `StreamFn` |
      | 20 | `wrapStreamFn` | Wrappery niestandardowych nagłówków/treści na zwykłej ścieżce strumienia |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane per tura |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/cool-down |
      | 23 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy auth |
      | 26 | `matchesContextOverflowError` | Wykrywanie overflow należące do dostawcy |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate-limit/przeciążenia należąca do dostawcy |
      | 28 | `isCacheTtlEligible` | Bramkowanie TTL cache promptu |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka o brakującym auth |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych wierszy upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze forward-compat |
      | 32 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 33 | `isBinaryThinking` | Kompatybilność binarnego thinking włącz/wyłącz |
      | 34 | `supportsXHighThinking` | Kompatybilność wsparcia reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Kompatybilność domyślnej polityki `/think` |
      | 36 | `isModernModelRef` | Dopasowywanie modeli live/smoke |
      | 37 | `prepareRuntimeAuth` | Wymiana tokenu przed inferencją |
      | 38 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń usage |
      | 39 | `fetchUsageSnapshot` | Niestandardowy endpoint usage |
      | 40 | `createEmbeddingProvider` | Adapter embeddingów należący do dostawcy dla memory/search |
      | 41 | `buildReplayPolicy` | Niestandardowa polityka replay/Compaction transkryptu |
      | 42 | `sanitizeReplayHistory` | Przepisania replay specyficzne dla dostawcy po ogólnym czyszczeniu |
      | 43 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 44 | `onModelSelected` | Callback po wyborze (np. telemetria) |

      Uwagi o fallbacku runtime:

      - `normalizeConfig` najpierw sprawdza dopasowanego dostawcę, a potem inne Pluginy dostawców z hookami, aż któryś faktycznie zmieni konfigurację. Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu konfiguracji rodziny Google, nadal stosowany jest dołączony normalizator konfiguracji Google.
      - `resolveConfigApiKey` używa hooka dostawcy, gdy jest udostępniony. Dołączona ścieżka `amazon-bedrock` ma tutaj również wbudowany resolver markerów env AWS, mimo że auth runtime Bedrock nadal używa domyślnego łańcucha AWS SDK.
      - `resolveSystemPromptContribution` pozwala dostawcy wstrzykiwać wskazówki do promptu systemowego świadome cache dla rodziny modeli. Preferuj to zamiast `before_prompt_build`, gdy zachowanie należy do jednego dostawcy/rodziny modeli i powinno zachować stabilny/dynamiczny podział cache.

      Szczegółowe opisy i przykłady z praktyki znajdziesz w [Internals: Hooki runtime dostawców](/pl/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    Plugin dostawcy może rejestrować speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    i web search obok inferencji tekstu. OpenClaw klasyfikuje to jako Plugin
    **hybrid-capability** — zalecany wzorzec dla firmowych Pluginów
    (jeden Plugin na dostawcę). Zobacz
    [Internals: Ownership możliwości](/pl/plugins/architecture#capability-ownership-model).

    Rejestruj każdą możliwość wewnątrz `register(api)` obok istniejącego
    wywołania `api.registerProvider(...)`. Wybierz tylko karty, których potrzebujesz:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Realtime transcription">
        Preferuj `createRealtimeTranscriptionWebSocketSession(...)` — współdzielony
        helper obsługuje przechwytywanie proxy, reconnect backoff, flush przy zamknięciu, handshake gotowości, kolejkowanie audio i diagnostykę zdarzeń zamknięcia. Twój Plugin
        mapuje tylko zdarzenia upstream.

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

        Dostawcy STT batch, którzy wysyłają multipart audio przez POST, powinni używać
        `buildAudioTranscriptionFormData(...)` z
        `openclaw/plugin-sdk/provider-http`. Helper normalizuje nazwy plików
        uploadu, w tym uploady AAC, które potrzebują nazwy w stylu M4A dla
        zgodnych API transkrypcji.
      </Tab>
      <Tab title="Realtime voice">
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
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Zdjęcie przedstawiające..." }),
          transcribeAudio: async (req) => ({ text: "Transkrypcja..." }),
        });
        ```
      </Tab>
      <Tab title="Generowanie obrazów i wideo">
        Możliwości wideo używają kształtu **mode-aware**: `generate`,
        `imageToVideo` i `videoToVideo`. Płaskie pola agregujące, takie jak
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`, nie
        wystarczają, aby czysto reklamować obsługę trybów transformacji albo wyłączone tryby.
        Generowanie muzyki podąża za tym samym wzorcem z jawnymi blokami `generate` /
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
      <Tab title="Web fetch i search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Pobieraj strony przez backend renderujący Acme.",
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
            description: "Pobierz stronę przez Acme Fetch.",
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

    describe("dostawca acme-ai", () => {
      it("rozwiązuje modele dynamiczne", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("zwraca katalog, gdy klucz jest dostępny", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("zwraca null katalogu, gdy brak klucza", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publikacja do ClawHub

Pluginy dostawców publikuje się tak samo jak każdy inny zewnętrzny Plugin kodowy:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starszego aliasu publikacji tylko dla Skills; pakiety Pluginów powinny używać
`clawhub package publish`.

## Struktura plików

```text
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Dokumentacja kolejności katalogu

`catalog.order` kontroluje, kiedy twój katalog jest scalany względem wbudowanych
dostawców:

| Kolejność | Kiedy        | Przypadek użycia                              |
| --------- | ------------ | -------------------------------------------- |
| `simple`  | Pierwsze przejście | Prości dostawcy z kluczem API          |
| `profile` | Po `simple`  | Dostawcy zależni od profili auth             |
| `paired`  | Po `profile` | Synteza wielu powiązanych wpisów             |
| `late`    | Ostatnie przejście | Nadpisywanie istniejących dostawców (wygrywa przy kolizji) |

## Kolejne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli twój Plugin dostarcza także kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — helpery `api.runtime` (TTS, search, subagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów podścieżek
- [Wewnętrzne mechanizmy Pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks) — szczegóły hooków i przykłady dołączone

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie Pluginów](/pl/plugins/building-plugins)
- [Budowanie Pluginów kanałów](/pl/plugins/sdk-channel-plugins)
