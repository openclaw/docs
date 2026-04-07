---
read_when:
    - Tworzysz nowy plugin dostawcy modeli
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy LLM
    - Musisz zrozumieć uwierzytelnianie dostawcy, katalogi i hooki runtime
sidebarTitle: Provider Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu dostawcy modeli dla OpenClaw
title: Tworzenie pluginów dostawców
x-i18n:
    generated_at: "2026-04-07T09:49:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da82a353e1bf4fe6dc09e14b8614133ac96565679627de51415926014bd3990
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Tworzenie pluginów dostawców

Ten przewodnik przeprowadza przez tworzenie pluginu dostawcy, który dodaje do OpenClaw dostawcę modeli
(LLM). Na końcu będziesz mieć dostawcę z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozpoznawaniem modeli.

<Info>
  Jeśli nie tworzono wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Getting Started](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Instrukcja krok po kroku

<Steps>
  <a id="step-1-package-and-manifest"></a>
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
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
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

    Manifest deklaruje `providerAuthEnvVars`, aby OpenClaw mógł wykrywać
    poświadczenia bez ładowania runtime Twojego pluginu. `modelSupport` jest opcjonalne
    i pozwala OpenClaw automatycznie ładować plugin dostawcy na podstawie skróconych identyfikatorów modeli,
    takich jak `acme-large`, zanim pojawią się hooki runtime. Jeśli publikujesz
    dostawcę w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Zarejestruj dostawcę">
    Minimalny dostawca potrzebuje pól `id`, `label`, `auth` i `catalog`:

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

    To jest działający dostawca. Użytkownicy mogą teraz użyć
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    Dla bundlowanych dostawców, którzy rejestrują tylko jednego dostawcę tekstowego z
    uwierzytelnianiem kluczem API oraz pojedynczym runtime opartym na katalogu, preferuj węższy
    helper `defineSingleProviderPluginEntry(...)`:

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

    Jeśli przepływ uwierzytelniania musi także modyfikować `models.providers.*`, aliasy i
    domyślny model agenta podczas onboardingu, użyj helperów presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` oraz
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint dostawcy obsługuje strumieniowane bloki użycia na
    zwykłym transporcie `openai-completions`, preferuj współdzielone helpery katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast hardkodować sprawdzenia identyfikatorów
    dostawców. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu,
    więc natywne endpointy w stylu Moonshot/DashScope nadal optują się do tego mechanizmu,
    nawet gdy plugin używa niestandardowego identyfikatora dostawcy.

  </Step>

  <Step title="Dodaj dynamiczne rozpoznawanie modeli">
    Jeśli dostawca akceptuje dowolne identyfikatory modeli (jak proxy lub router),
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

    Jeśli rozpoznanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    rozgrzania — po jego zakończeniu `resolveDynamicModel` uruchamia się ponownie.

  </Step>

  <Step title="Dodaj hooki runtime (w razie potrzeby)">
    Większość dostawców potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, zależnie od wymagań dostawcy.

    Współdzielone buildery helperów obejmują teraz najczęstsze rodziny zgodności replay/tool,
    więc pluginy zwykle nie muszą ręcznie okablowywać każdego hooka jeden po drugim:

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

    | Rodzina | Co okablowuje |
    | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzację `tool-call-id`, poprawki kolejności assistant-first oraz ogólną walidację tur Gemini tam, gdzie transport tego wymaga |
    | `anthropic-by-model` | Świadoma Claude polityka replay wybierana według `modelId`, dzięki czemu transporty wiadomości Anthropic dostają czyszczenie bloków thinking specyficzne dla Claude tylko wtedy, gdy rozpoznany model jest rzeczywiście identyfikatorem Claude |
    | `google-gemini` | Natywna polityka replay Gemini plus sanityzacja replay bootstrap i oznaczony tryb wyjścia reasoning |
    | `passthrough-gemini` | Sanityzacja sygnatur thought Gemini dla modeli Gemini uruchamianych przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisywania bootstrap |
    | `hybrid-anthropic-openai` | Hybrydowa polityka dla dostawców, którzy mieszają powierzchnie modeli wiadomości Anthropic i transportów zgodnych z OpenAI w jednym pluginie; opcjonalne usuwanie bloków thinking tylko dla Claude pozostaje ograniczone do strony Anthropic |

    Rzeczywiste bundlowane przykłady:

    - `google` i `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` i `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` i `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` i `zai`: `openai-compatible`

    Obecnie dostępne rodziny stream:

    | Rodzina | Co okablowuje |
    | --- | --- |
    | `google-thinking` | Normalizację ładunku thinking Gemini we współdzielonej ścieżce stream |
    | `kilocode-thinking` | Wrapper reasoning Kilo we współdzielonej ścieżce stream proxy, przy czym `kilo/auto` i nieobsługiwane identyfikatory reasoning proxy pomijają wstrzykiwane thinking |
    | `moonshot-thinking` | Mapowanie natywnego binarnego ładunku thinking Moonshot na podstawie konfiguracji + poziomu `/think` |
    | `minimax-fast-mode` | Przepisywanie modelu MiniMax fast-mode we współdzielonej ścieżce stream |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie w sieci Codex, kształtowanie ładunku zgodności reasoning oraz zarządzanie kontekstem Responses |
    | `openrouter-thinking` | Wrapper reasoning OpenRouter dla tras proxy, z centralnie obsługiwanym pomijaniem dla nieobsługiwanych modeli/`auto` |
    | `tool-stream-default-on` | Wrapper domyślnie włączający `tool_stream` dla dostawców takich jak Z.AI, którzy chcą strumieniowania narzędzi, o ile nie zostanie ono jawnie wyłączone |

    Rzeczywiste bundlowane przykłady:

    - `google` i `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` i `minimax-portal`: `minimax-fast-mode`
    - `openai` i `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` eksportuje też enum rodziny replay
    oraz współdzielone helpery, z których te rodziny są zbudowane. Typowe publiczne
    eksporty obejmują:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - współdzielone buildery replay, takie jak `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` oraz
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpery replay Gemini, takie jak `sanitizeGoogleGeminiReplayHistory(...)`
      i `resolveTaggedReasoningOutputMode()`
    - helpery endpointów/modeli, takie jak `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` oraz
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` udostępnia zarówno builder rodziny, jak i
    publiczne helpery wrapperów, których te rodziny używają ponownie. Typowe publiczne eksporty
    obejmują:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - współdzielone wrappery OpenAI/Codex, takie jak
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` oraz
      `createCodexNativeWebSearchWrapper(...)`
    - współdzielone wrappery proxy/dostawców, takie jak `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` oraz `createMinimaxFastModeWrapper(...)`

    Niektóre helpery stream celowo pozostają lokalne dla dostawcy. Obecny bundlowany
    przykład: `@openclaw/anthropic-provider` eksportuje
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz
    buildery wrapperów Anthropic niższego poziomu przez publiczny interfejs `api.ts` /
    `contract-api.ts`. Te helpery pozostają specyficzne dla Anthropic, ponieważ
    kodują też obsługę beta dla Claude OAuth i bramkowanie `context1m`.

    Inni bundlowani dostawcy również trzymają wrappery specyficzne dla transportu lokalnie, gdy
    zachowanie nie daje się czysto współdzielić między rodzinami. Obecny przykład: bundlowany
    plugin xAI przechowuje natywne kształtowanie xAI Responses we własnym
    `wrapStreamFn`, w tym przepisywanie aliasów `/fast`, domyślne `tool_stream`,
    czyszczenie nieobsługiwanych strict-tool oraz usuwanie
    ładunku reasoning specyficznego dla xAI.

    `openclaw/plugin-sdk/provider-tools` obecnie udostępnia jedną współdzieloną
    rodzinę schematów narzędzi oraz współdzielone helpery schematów/zgodności:

    - `ProviderToolCompatFamily` dokumentuje obecny zestaw współdzielonych rodzin.
    - `buildProviderToolCompatFamilyHooks("gemini")` okablowuje czyszczenie
      schematów Gemini + diagnostykę dla dostawców, którzy potrzebują schematów narzędzi bezpiecznych dla Gemini.
    - `normalizeGeminiToolSchemas(...)` i `inspectGeminiToolSchemas(...)`
      to bazowe publiczne helpery schematów Gemini.
    - `resolveXaiModelCompatPatch()` zwraca bundlowaną łatkę zgodności xAI:
      `toolSchemaProfile: "xai"`, nieobsługiwane słowa kluczowe schematu, natywne wsparcie
      `web_search` oraz dekodowanie argumentów wywołań narzędzi z encji HTML.
    - `applyXaiModelCompat(model)` stosuje tę samą łatkę zgodności xAI do rozpoznanego
      modelu, zanim trafi on do runnera.

    Rzeczywisty bundlowany przykład: plugin xAI używa `normalizeResolvedModel` oraz
    `contributeResolvedModelCompat`, aby zachować metadane zgodności po stronie dostawcy
    zamiast hardkodować reguły xAI w rdzeniu.

    Ten sam wzorzec katalogu głównego pakietu wspiera też innych bundlowanych dostawców:

    - `@openclaw/openai-provider`: `api.ts` eksportuje buildery dostawców,
      helpery modeli domyślnych i buildery dostawców realtime
    - `@openclaw/openrouter-provider`: `api.ts` eksportuje builder dostawcy
      oraz helpery onboardingu/konfiguracji

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
        Dla dostawców, którzy potrzebują niestandardowych nagłówków żądania lub modyfikacji body:

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
        Dla dostawców, którzy potrzebują natywnych nagłówków lub metadanych żądania/sesji
        przy ogólnych transportach HTTP lub WebSocket:

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
      <Tab title="Użycie i rozliczenia">
        Dla dostawców, którzy udostępniają dane o użyciu/rozliczeniach:

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

    <Accordion title="Wszystkie dostępne hooki dostawcy">
      OpenClaw wywołuje hooki w tej kolejności. Większość dostawców używa tylko 2–3:

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości `baseUrl` |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne należące do dostawcy podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/podglądowych identyfikatorów modeli przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` dla rodziny dostawców przed ogólnym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizuje konfigurację `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisania zgodności natywnego użycia strumieniowego dla dostawców konfiguracyjnych |
      | 7 | `resolveConfigApiKey` | Rozpoznawanie auth z markerów env należące do dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne auth lokalne/self-hosted lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniża priorytet syntetycznych placeholderów zapisanych profili względem auth z env/konfiguracji |
      | 10 | `resolveDynamicModel` | Akceptuje dowolne identyfikatory modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozpoznaniem |
      | 12 | `normalizeResolvedModel` | Przepisania transportu przed runnerem |

      Uwagi o fallback runtime:

      - `normalizeConfig` najpierw sprawdza dopasowanego dostawcę, a potem inne
        pluginy dostawców z hookami, dopóki któryś rzeczywiście nie zmieni konfiguracji.
        Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu konfiguracji rodziny Google,
        nadal zostanie zastosowany bundlowany normalizator konfiguracji Google.
      - `resolveConfigApiKey` używa hooka dostawcy, gdy jest on udostępniony. Bundlowana
        ścieżka `amazon-bedrock` ma też tutaj wbudowany resolver auth z markerów env AWS,
        mimo że auth runtime Bedrock nadal używa domyślnego łańcucha AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawców działających za innym zgodnym transportem |
      | 14 | `capabilities` | Starszy statyczny zestaw możliwości; tylko zgodność |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do dostawcy przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | 17 | `resolveReasoningOutputMode` | Kontrakt oznaczonego vs natywnego wyjścia reasoning |
      | 18 | `prepareExtraParams` | Domyślne parametry żądań |
      | 19 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 20 | `wrapStreamFn` | Wrappery niestandardowych nagłówków/body na zwykłej ścieżce stream |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane dla każdej tury |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/cool-down |
      | 23 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy auth |
      | 26 | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do dostawcy |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate-limit/overload należąca do dostawcy |
      | 28 | `isCacheTtlEligible` | Bramka TTL cache promptów |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka braku auth |
      | 30 | `suppressBuiltInModel` | Ukrywa nieaktualne wiersze upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze forward-compat |
      | 32 | `isBinaryThinking` | Binarne włączanie/wyłączanie thinking |
      | 33 | `supportsXHighThinking` | Obsługa reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Domyślna polityka `/think` |
      | 35 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 36 | `prepareRuntimeAuth` | Wymiana tokenu przed inferencją |
      | 37 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 38 | `fetchUsageSnapshot` | Niestandardowy endpoint użycia |
      | 39 | `createEmbeddingProvider` | Adapter embeddingów należący do dostawcy dla memory/search |
      | 40 | `buildReplayPolicy` | Niestandardowa polityka replay/kompaktowania transkryptu |
      | 41 | `sanitizeReplayHistory` | Przepisania replay specyficzne dla dostawcy po ogólnym czyszczeniu |
      | 42 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 43 | `onModelSelected` | Callback po wyborze modelu (np. telemetria) |

      Uwaga o dostrajaniu promptów:

      - `resolveSystemPromptContribution` pozwala dostawcy wstrzykiwać świadome cache
        wskazówki do promptu systemowego dla rodziny modeli. Preferuj to zamiast
        `before_prompt_build`, gdy zachowanie należy do jednej rodziny dostawcy/modeli
        i powinno zachować stabilny/dynamiczny podział cache.

      Szczegółowe opisy i rzeczywiste przykłady znajdziesz w
      [Internals: Provider Runtime Hooks](/pl/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin dostawcy może rejestrować mowę, transkrypcję realtime, głos realtime,
    rozumienie mediów, generowanie obrazów, generowanie wideo, web fetch
    i web search obok inferencji tekstowej:

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

    OpenClaw klasyfikuje to jako plugin **hybrid-capability**. Jest to
    zalecany wzorzec dla pluginów firmowych (jeden plugin na dostawcę). Zobacz
    [Internals: Capability Ownership](/pl/plugins/architecture#capability-ownership-model).

    Dla generowania wideo preferuj pokazany wyżej kształt możliwości świadomy trybów:
    `generate`, `imageToVideo` i `videoToVideo`. Płaskie pola zagregowane, takie
    jak `maxInputImages`, `maxInputVideos` i `maxDurationSeconds`, nie
    wystarczają, aby czytelnie reklamować obsługę trybów transformacji lub wyłączonych trybów.

    Dostawcy generowania muzyki powinni stosować ten sam wzorzec:
    `generate` dla generowania wyłącznie z promptu oraz `edit` dla
    generowania na podstawie obrazu referencyjnego. Płaskie pola zagregowane, takie jak `maxInputImages`,
    `supportsLyrics` i `supportsFormat`, nie wystarczają do reklamowania obsługi
    edycji; oczekiwanym kontraktem są jawne bloki `generate` / `edit`.

  </Step>

  <Step title="Test">
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

## Publikacja w ClawHub

Pluginy dostawców publikuje się tak samo jak każdy inny zewnętrzny plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starszego aliasu publikacji tylko dla Skills; pakiety pluginów powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Opis kolejności katalogu

`catalog.order` określa, kiedy katalog jest scalany względem wbudowanych
dostawców:

| Kolejność | Kiedy        | Przypadek użycia                              |
| --------- | ------------ | --------------------------------------------- |
| `simple`  | Pierwsze przejście | Prości dostawcy z kluczem API           |
| `profile` | Po `simple`  | Dostawcy zależni od profili auth              |
| `paired`  | Po `profile` | Syntetyzowanie wielu powiązanych wpisów       |
| `late`    | Ostatnie przejście | Nadpisywanie istniejących dostawców (wygrywa przy kolizji) |

## Kolejne kroki

- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — jeśli plugin dostarcza także kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — helpery `api.runtime` (TTS, search, subagent)
- [SDK Overview](/pl/plugins/sdk-overview) — pełne odniesienie do importów subpath
- [Plugin Internals](/pl/plugins/architecture#provider-runtime-hooks) — szczegóły hooków i bundlowane przykłady
