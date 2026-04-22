---
read_when:
    - Tworzysz nowy plugin dostawcy modeli
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy LLM
    - Musisz zrozumieć auth dostawcy, katalogi i hooki runtime
sidebarTitle: Provider Plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu dostawcy modeli dla OpenClaw
title: Tworzenie pluginów dostawców
x-i18n:
    generated_at: "2026-04-22T04:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Tworzenie pluginów dostawców

Ten przewodnik pokazuje krok po kroku, jak zbudować plugin dostawcy, który dodaje dostawcę modeli
(LLM) do OpenClaw. Na końcu będziesz mieć dostawcę z katalogiem modeli,
auth przez klucz API i dynamicznym rozstrzyganiem modeli.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy dostawców dodają modele do zwykłej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywnego demona agenta, który zarządza wątkami,
  Compaction albo zdarzeniami narzędzi, połącz dostawcę z [agent harness](/pl/plugins/sdk-agent-harness)
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

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
    poświadczenia bez ładowania runtime Twojego pluginu. Dodaj `providerAuthAliases`,
    gdy wariant dostawcy ma ponownie używać auth innego identyfikatora dostawcy. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie ładować plugin dostawcy na podstawie skróconych
    identyfikatorów modeli takich jak `acme-large`, zanim będą dostępne hooki runtime. Jeśli publikujesz
    dostawcę w ClawHub, te pola `openclaw.compat` i `openclaw.build`
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
              promptMessage: "Wprowadź klucz API Acme AI",
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

    Jeśli upstream dostawcy używa innych tokenów sterujących niż OpenClaw, dodaj
    małą dwukierunkową transformację tekstu zamiast zastępować ścieżkę stream:

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

    `input` przepisuje końcowy system prompt i zawartość wiadomości tekstowych przed
    transportem. `output` przepisuje delty tekstu asystenta i końcowy tekst, zanim
    OpenClaw sparsuje własne znaczniki sterujące albo dostarczenie do kanału.

    Dla dołączonych dostawców, którzy rejestrują tylko jednego dostawcę tekstowego z
    auth przez klucz API oraz pojedynczy runtime oparty o katalog, preferuj węższy
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
            promptMessage: "Wprowadź klucz API Acme AI",
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

    `buildProvider` to ścieżka katalogu na żywo używana wtedy, gdy OpenClaw potrafi rozstrzygnąć rzeczywiste
    auth dostawcy. Może wykonywać wykrywanie specyficzne dla dostawcy. Używaj
    `buildStaticProvider` tylko dla offline’owych wierszy, które można bezpiecznie pokazać przed konfiguracją auth;
    nie może ono wymagać poświadczeń ani wykonywać żądań sieciowych.
    Wyświetlanie `models list --all` w OpenClaw obecnie wykonuje statyczne katalogi
    tylko dla dołączonych pluginów dostawców, z pustym config, pustym env i bez
    ścieżek agenta/obszaru roboczego.

    Jeśli przepływ auth musi też patchować `models.providers.*`, aliasy i
    domyślny model agenta podczas onboardingu, użyj helperów presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` oraz
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint dostawcy obsługuje streamowane bloki usage na
    zwykłym transporcie `openai-completions`, preferuj współdzielone helpery katalogów z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast kodowania na sztywno sprawdzeń
    identyfikatorów dostawców. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu,
    dzięki czemu natywne endpointy w stylu Moonshot/DashScope nadal się włączają, nawet gdy plugin używa niestandardowego identyfikatora dostawcy.

  </Step>

  <Step title="Dodaj dynamiczne rozstrzyganie modeli">
    Jeśli Twój dostawca akceptuje dowolne identyfikatory modeli (jak proxy albo router),
    dodaj `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog z przykładu powyżej

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

    Jeśli rozstrzyganie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    przygotowania — po jego zakończeniu `resolveDynamicModel` uruchomi się ponownie.

  </Step>

  <Step title="Dodaj hooki runtime (w razie potrzeby)">
    Większość dostawców potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, w miarę jak wymaga tego Twój dostawca.

    Współdzielone helpery builderów obejmują teraz najczęstsze rodziny zgodności replay/tool,
    więc pluginy zwykle nie muszą ręcznie okablować każdego hooka osobno:

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
    | `openai-compatible` | Współdzielone zasady replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzację tool-call-id, poprawki kolejności assistant-first oraz ogólną walidację tur Gemini tam, gdzie wymaga tego transport |
    | `anthropic-by-model` | Zasady replay świadome Claude wybierane według `modelId`, dzięki czemu transporty wiadomości Anthropic dostają czyszczenie bloków thinking specyficzne dla Claude tylko wtedy, gdy rozstrzygnięty model jest rzeczywiście identyfikatorem Claude |
    | `google-gemini` | Natywne zasady replay Gemini plus sanityzacja bootstrap replay i tagowany tryb wyjścia reasoning |
    | `passthrough-gemini` | Sanityzacja thought-signature Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisów bootstrap |
    | `hybrid-anthropic-openai` | Hybrydowe zasady dla dostawców, którzy łączą powierzchnie modeli wiadomości Anthropic i zgodnych z OpenAI w jednym pluginie; opcjonalne porzucanie bloków thinking tylko dla Claude pozostaje ograniczone do strony Anthropic |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` i `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` i `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` i `zai`: `openai-compatible`

    Obecnie dostępne rodziny stream:

    | Rodzina | Co okablowuje |
    | --- | --- |
    | `google-thinking` | Normalizację ładunku thinking Gemini na współdzielonej ścieżce stream |
    | `kilocode-thinking` | Otok reasoning Kilo na współdzielonej ścieżce stream proxy, z `kilo/auto` i nieobsługiwanymi identyfikatorami reasoning proxy pomijającymi wstrzykiwany thinking |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku thinking Moonshot z config + poziomu `/think` |
    | `minimax-fast-mode` | Przepisanie modelu MiniMax fast-mode na współdzielonej ścieżce stream |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie webowe Codex, kształtowanie ładunku zgodności reasoning i zarządzanie kontekstem Responses |
    | `openrouter-thinking` | Otok reasoning OpenRouter dla tras proxy, z centralnie obsługiwanymi pominięciami dla nieobsługiwanych modeli/`auto` |
    | `tool-stream-default-on` | Wrapper `tool_stream` domyślnie włączony dla dostawców takich jak Z.AI, którzy chcą streamowania narzędzi, chyba że zostanie to jawnie wyłączone |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` i `minimax-portal`: `minimax-fast-mode`
    - `openai` i `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` eksportuje także enum rodziny
    replay oraz współdzielone helpery, z których te rodziny są budowane. Typowe publiczne
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
    publiczne helpery wrapperów, których te rodziny ponownie używają. Typowe publiczne eksporty
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
      `createToolStreamWrapper(...)` i `createMinimaxFastModeWrapper(...)`

    Niektóre helpery stream celowo pozostają lokalne dla dostawcy. Obecny dołączony
    przykład: `@openclaw/anthropic-provider` eksportuje
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz
    niższopoziomowe buildery wrapperów Anthropic z publicznej powierzchni `api.ts` /
    `contract-api.ts`. Te helpery pozostają specyficzne dla Anthropic, ponieważ
    kodują także obsługę beta Claude OAuth i ograniczanie `context1m`.

    Inni dołączeni dostawcy również utrzymują wrappery specyficzne dla transportu lokalnie, gdy
    zachowanie nie daje się czysto współdzielić między rodzinami. Obecny przykład:
    dołączony plugin xAI utrzymuje natywne kształtowanie xAI Responses we własnym
    `wrapStreamFn`, w tym przepisywanie aliasów `/fast`, domyślne `tool_stream`,
    czyszczenie nieobsługiwanych strict-tool oraz usuwanie
    ładunku reasoning specyficznego dla xAI.

    `openclaw/plugin-sdk/provider-tools` obecnie udostępnia jedną współdzieloną
    rodzinę schematów narzędzi oraz współdzielone helpery schema/compat:

    - `ProviderToolCompatFamily` dokumentuje obecny zestaw współdzielonych rodzin.
    - `buildProviderToolCompatFamilyHooks("gemini")` okablowuje czyszczenie schematów Gemini
      + diagnostykę dla dostawców, którzy potrzebują bezpiecznych dla Gemini schematów narzędzi.
    - `normalizeGeminiToolSchemas(...)` i `inspectGeminiToolSchemas(...)`
      to bazowe publiczne helpery schematów Gemini.
    - `resolveXaiModelCompatPatch()` zwraca dołączony patch zgodności xAI:
      `toolSchemaProfile: "xai"`, nieobsługiwane słowa kluczowe schematu, natywną
      obsługę `web_search` oraz dekodowanie argumentów wywołań narzędzi z encji HTML.
    - `applyXaiModelCompat(model)` stosuje ten sam patch zgodności xAI do
      rozstrzygniętego modelu, zanim trafi on do runnera.

    Rzeczywisty dołączony przykład: plugin xAI używa `normalizeResolvedModel` plus
    `contributeResolvedModelCompat`, aby metadane zgodności pozostały własnością
    dostawcy zamiast kodowania reguł xAI na sztywno w rdzeniu.

    Ten sam wzorzec root pakietu wspiera też innych dołączonych dostawców:

    - `@openclaw/openai-provider`: `api.ts` eksportuje buildery dostawców,
      helpery modeli domyślnych i buildery dostawców realtime
    - `@openclaw/openrouter-provider`: `api.ts` eksportuje builder dostawcy
      plus helpery onboardingu/config

    <Tabs>
      <Tab title="Wymiana tokenu">
        Dla dostawców, którzy wymagają wymiany tokenu przed każdym wywołaniem inferencji:

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
        Dla dostawców, którzy wymagają niestandardowych nagłówków żądań albo modyfikacji body:

        ```typescript
        // wrapStreamFn zwraca StreamFn pochodzący z ctx.streamFn
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
      <Tab title="Natywna tożsamość transportu">
        Dla dostawców, którzy potrzebują natywnych nagłówków żądań/sesji lub metadanych na
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
      <Tab title="Użycie i rozliczenia">
        Dla dostawców, którzy udostępniają dane użycia/rozliczeń:

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
      OpenClaw wywołuje hooki w tej kolejności. Większość dostawców używa tylko 2-3:

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli albo wartości domyślne base URL |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne należące do dostawcy podczas materializacji config |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/podglądowych identyfikatorów modeli przed lookup |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny dostawcy przed złożeniem ogólnego modelu |
      | 5 | `normalizeConfig` | Normalizacja config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisy zgodności natywnego streamowania usage dla dostawców konfiguracyjnych |
      | 7 | `resolveConfigApiKey` | Rozstrzyganie auth markerów env należące do dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne auth lokalne/samohostowane lub oparte na config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie priorytetu syntetycznych placeholderów przechowywanych profili względem auth env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozstrzygnięciem |
      | 12 | `normalizeResolvedModel` | Przepisy transportu przed runnerem |

    Uwagi o fallbacku runtime:

    - `normalizeConfig` najpierw sprawdza dopasowanego dostawcę, a potem innych
      dostawców pluginów obsługujących hooki, dopóki któryś faktycznie nie zmieni config.
      Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu config rodziny Google,
      nadal stosowany jest dołączony normalizator config Google.
    - `resolveConfigApiKey` używa hooka dostawcy, gdy jest udostępniony. Dołączona
      ścieżka `amazon-bedrock` ma tutaj także wbudowany resolver markerów env AWS,
      mimo że auth runtime Bedrock nadal używa domyślnego łańcucha AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawców działających za innym zgodnym transportem |
      | 14 | `capabilities` | Starszy statyczny zbiór możliwości; tylko zgodność |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do dostawcy przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | 17 | `resolveReasoningOutputMode` | Kontrakt tagowanego vs natywnego wyjścia reasoning |
      | 18 | `prepareExtraParams` | Domyślne parametry żądań |
      | 19 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 20 | `wrapStreamFn` | Wrappery niestandardowych nagłówków/body na zwykłej ścieżce stream |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane per tura |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/cool-down |
      | 23 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy auth |
      | 26 | `matchesContextOverflowError` | Wykrywanie overflow należące do dostawcy |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate-limit/overload należąca do dostawcy |
      | 28 | `isCacheTtlEligible` | Ograniczanie TTL cache promptów |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka o brakującym auth |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych wierszy upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze forward-compat |
      | 32 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 33 | `isBinaryThinking` | Zgodność binarnego thinking włącz/wyłącz |
      | 34 | `supportsXHighThinking` | Zgodność obsługi reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 36 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 37 | `prepareRuntimeAuth` | Wymiana tokenu przed inferencją |
      | 38 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń usage |
      | 39 | `fetchUsageSnapshot` | Niestandardowy endpoint usage |
      | 40 | `createEmbeddingProvider` | Adapter embedding dostawcy dla pamięci/wyszukiwania |
      | 41 | `buildReplayPolicy` | Niestandardowe zasady replay/Compaction transkryptu |
      | 42 | `sanitizeReplayHistory` | Przepisy replay specyficzne dla dostawcy po ogólnym czyszczeniu |
      | 43 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 44 | `onModelSelected` | Callback po wyborze modelu (np. telemetry) |

      Uwaga o dostrajaniu promptów:

      - `resolveSystemPromptContribution` pozwala dostawcy wstrzykiwać
        świadome cache wskazówki do system promptu dla rodziny modeli. Preferuj to zamiast
        `before_prompt_build`, gdy zachowanie należy do jednej rodziny dostawcy/modelu
        i powinno zachować stabilny/dynamiczny podział cache.

      Szczegółowe opisy i przykłady z rzeczywistych wdrożeń znajdziesz w
      [Internals: hooki runtime dostawcy](/pl/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin dostawcy może rejestrować speech, realtime transcription, realtime
    voice, rozumienie multimediów, generowanie obrazów, generowanie wideo, web fetch
    oraz web search obok inferencji tekstowej:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* dane PCM */),
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
        describeImage: async (req) => ({ text: "Zdjęcie przedstawiające..." }),
        transcribeAudio: async (req) => ({ text: "Transkrypcja..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* wynik obrazu */ }),
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
    }
    ```

    OpenClaw klasyfikuje to jako plugin o **hybrydowych możliwościach**. To jest
    zalecany wzorzec dla pluginów firmowych (jeden plugin na dostawcę). Zobacz
    [Internals: Ownership możliwości](/pl/plugins/architecture#capability-ownership-model).

    Dla generowania wideo preferuj pokazany wyżej kształt możliwości świadomy trybu:
    `generate`, `imageToVideo` i `videoToVideo`. Płaskie pola agregujące, takie
    jak `maxInputImages`, `maxInputVideos` i `maxDurationSeconds`, nie
    wystarczają do czystego reklamowania obsługi trybów transformacji lub trybów wyłączonych.

    Dostawcy generowania muzyki powinni stosować ten sam wzorzec:
    `generate` dla generowania wyłącznie z promptu i `edit` dla generowania
    opartego na obrazie referencyjnym. Płaskie pola agregujące, takie jak `maxInputImages`,
    `supportsLyrics` i `supportsFormat`, nie wystarczają do reklamowania obsługi
    edycji; oczekiwanym kontraktem są jawne bloki `generate` / `edit`.

  </Step>

  <Step title="Test">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Wyeksportuj obiekt config dostawcy z index.ts albo z osobnego pliku
    import { acmeProvider } from "./provider.js";

    describe("dostawca acme-ai", () => {
      it("rozstrzyga dynamiczne modele", () => {
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
├── package.json              # metadane openclaw.providers
├── openclaw.plugin.json      # Manifest z metadanymi auth dostawcy
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testy
    └── usage.ts              # Endpoint usage (opcjonalnie)
```

## Dokumentacja referencyjna kolejności katalogów

`catalog.order` kontroluje, kiedy Twój katalog scala się względem wbudowanych
dostawców:

| Kolejność | Kiedy         | Zastosowanie                                   |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Pierwsze przejście | Prości dostawcy z kluczem API                |
| `profile` | Po simple     | Dostawcy ograniczeni przez profile auth        |
| `paired`  | Po profile    | Syntetyzowanie wielu powiązanych wpisów        |
| `late`    | Ostatnie przejście | Nadpisywanie istniejących dostawców (wygrywa przy kolizji) |

## Kolejne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli Twój plugin dostarcza także kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — helpery `api.runtime` (TTS, search, subagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [Wnętrze pluginów](/pl/plugins/architecture#provider-runtime-hooks) — szczegóły hooków i dołączone przykłady
