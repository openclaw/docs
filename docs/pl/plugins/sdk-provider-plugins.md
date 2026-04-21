---
read_when:
    - Tworzysz nowy Plugin dostawcy modeli.
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy LLM.
    - Musisz zrozumieć uwierzytelnianie dostawcy, katalogi i hooki środowiska uruchomieniowego.
sidebarTitle: Provider Plugins
summary: Przewodnik krok po kroku po tworzeniu Plugin dostawcy modeli dla OpenClaw
title: Tworzenie Plugin dostawców modeli
x-i18n:
    generated_at: "2026-04-21T09:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Tworzenie Plugin dostawców modeli

Ten przewodnik prowadzi krok po kroku przez tworzenie Plugin dostawcy, który dodaje dostawcę modeli
(LLM) do OpenClaw. Po jego ukończeniu będziesz mieć dostawcę z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozwiązywaniem modeli.

<Info>
  Jeśli nie tworzyłeś wcześniej żadnego Plugin OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Plugin dostawców dodają modele do zwykłej pętli wnioskowania OpenClaw. Jeśli model
  musi działać przez natywny daemon agenta, który posiada wątki, Compaction lub
  zdarzenia narzędzi, sparuj dostawcę z [agent harness](/pl/plugins/sdk-agent-harness),
  zamiast umieszczać szczegóły protokołu daemona w core.
</Tip>

## Przewodnik krok po kroku

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
    poświadczenia bez ładowania środowiska uruchomieniowego Twojego Plugin. Dodaj `providerAuthAliases`,
    gdy wariant dostawcy ma ponownie używać identyfikatora uwierzytelniania innego dostawcy. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie ładować Twój Plugin dostawcy na podstawie skróconych
    identyfikatorów modeli, takich jak `acme-large`, zanim pojawią się hooki środowiska uruchomieniowego. Jeśli publikujesz
    dostawcę w ClawHub, pola `openclaw.compat` i `openclaw.build`
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
    `acme-ai/acme-large` jako model.

    Jeśli dostawca upstream używa innych tokenów sterujących niż OpenClaw, dodaj
    małą dwukierunkową transformację tekstu zamiast zastępować ścieżkę streamingu:

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
    OpenClaw przetworzy własne znaczniki sterujące lub dostarczanie do kanału.

    Dla dołączonych dostawców, którzy rejestrują tylko jednego dostawcę tekstowego z
    uwierzytelnianiem kluczem API oraz pojedynczym środowiskiem uruchomieniowym opartym na katalogu, preferuj węższy
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
        },
      },
    });
    ```

    Jeśli przepływ uwierzytelniania musi także poprawiać `models.providers.*`, aliasy i
    domyślny model agenta podczas wdrażania, użyj gotowych helperów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` i
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint dostawcy obsługuje streamowane bloki użycia na zwykłym
    transporcie `openai-completions`, preferuj współdzielone helpery katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast twardo kodować sprawdzenia
    identyfikatora dostawcy. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu,
    więc natywne endpointy w stylu Moonshot/DashScope nadal się kwalifikują, nawet gdy Plugin używa
    niestandardowego identyfikatora dostawcy.

  </Step>

  <Step title="Dodaj dynamiczne rozwiązywanie modeli">
    Jeśli Twój dostawca akceptuje dowolne identyfikatory modeli (jak proxy lub router),
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
    rozgrzania — `resolveDynamicModel` uruchomi się ponownie po jego zakończeniu.

  </Step>

  <Step title="Dodaj hooki środowiska uruchomieniowego (w razie potrzeby)">
    Większość dostawców potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, zależnie od potrzeb dostawcy.

    Współdzielone buildery helperów obejmują teraz najczęstsze rodziny zgodności
    replay/tool, więc Plugin zwykle nie muszą ręcznie podłączać każdego hooka osobno:

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

    | Rodzina | Co podłącza |
    | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzacja tool-call-id, poprawki kolejności assistant-first oraz ogólna walidacja tur Gemini tam, gdzie wymaga tego transport |
    | `anthropic-by-model` | Polityka replay świadoma Claude wybierana według `modelId`, dzięki czemu transporty wiadomości Anthropic dostają czyszczenie bloków thinking specyficzne dla Claude tylko wtedy, gdy rozstrzygnięty model jest rzeczywiście identyfikatorem Claude |
    | `google-gemini` | Natywna polityka replay Gemini plus sanityzacja bootstrap replay i tryb oznaczonych danych wyjściowych rozumowania |
    | `passthrough-gemini` | Sanityzacja thought-signature Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisania bootstrap |
    | `hybrid-anthropic-openai` | Hybrydowa polityka dla dostawców, którzy mieszają powierzchnie modeli wiadomości Anthropic i zgodnych z OpenAI w jednym Plugin; opcjonalne usuwanie bloków thinking tylko dla Claude pozostaje ograniczone do strony Anthropic |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` i `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` i `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` i `zai`: `openai-compatible`

    Obecnie dostępne rodziny streamów:

    | Rodzina | Co podłącza |
    | --- | --- |
    | `google-thinking` | Normalizacja ładunku thinking Gemini na współdzielonej ścieżce streamingu |
    | `kilocode-thinking` | Wrapper rozumowania Kilo na współdzielonej ścieżce streamingu proxy, z pomijaniem wstrzykiwanego thinking dla `kilo/auto` i nieobsługiwanych identyfikatorów rozumowania proxy |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku thinking Moonshot na podstawie konfiguracji i poziomu `/think` |
    | `minimax-fast-mode` | Przepisywanie modelu MiniMax fast-mode na współdzielonej ścieżce streamingu |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie w sieci Codex, kształtowanie ładunku zgodności rozumowania i zarządzanie kontekstem Responses |
    | `openrouter-thinking` | Wrapper rozumowania OpenRouter dla tras proxy, z centralnie obsługiwanym pomijaniem dla nieobsługiwanych modeli/`auto` |
    | `tool-stream-default-on` | Domyślnie włączony wrapper `tool_stream` dla dostawców takich jak Z.AI, którzy chcą streamingu narzędzi, jeśli nie został jawnie wyłączony |

    Rzeczywiste dołączone przykłady:

    - `google` i `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` i `minimax-portal`: `minimax-fast-mode`
    - `openai` i `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` eksportuje także enum rodziny
    replay oraz współdzielone helpery, na których te rodziny są zbudowane. Typowe publiczne
    eksporty obejmują:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - współdzielone buildery replay, takie jak `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` i
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpery replay Gemini, takie jak `sanitizeGoogleGeminiReplayHistory(...)`
      i `resolveTaggedReasoningOutputMode()`
    - helpery endpointów/modeli, takie jak `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` i
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
      `createOpenAIResponsesContextManagementWrapper(...)` i
      `createCodexNativeWebSearchWrapper(...)`
    - współdzielone wrappery proxy/dostawcy, takie jak `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` i `createMinimaxFastModeWrapper(...)`

    Niektóre helpery streamingu celowo pozostają lokalne dla dostawcy. Obecny dołączony
    przykład: `@openclaw/anthropic-provider` eksportuje
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz
    niższopoziomowe buildery wrapperów Anthropic ze swojej publicznej powierzchni `api.ts` /
    `contract-api.ts`. Te helpery pozostają specyficzne dla Anthropic, ponieważ
    kodują także obsługę beta Claude OAuth i bramkowanie `context1m`.

    Inni dołączeni dostawcy również utrzymują wrappery specyficzne dla transportu lokalnie, gdy
    zachowanie nie jest czysto współdzielone między rodzinami. Obecny przykład: dołączony
    Plugin xAI utrzymuje natywne kształtowanie xAI Responses we własnym
    `wrapStreamFn`, w tym przepisywanie aliasów `/fast`, domyślne `tool_stream`,
    czyszczenie nieobsługiwanych strict-tool oraz usuwanie ładunku
    rozumowania specyficznego dla xAI.

    `openclaw/plugin-sdk/provider-tools` obecnie udostępnia jedną współdzieloną
    rodzinę schematów narzędzi oraz współdzielone helpery schematów/zgodności:

    - `ProviderToolCompatFamily` dokumentuje aktualny stan współdzielonych rodzin.
    - `buildProviderToolCompatFamilyHooks("gemini")` podłącza czyszczenie
      schematów Gemini + diagnostykę dla dostawców, którzy potrzebują bezpiecznych dla Gemini schematów narzędzi.
    - `normalizeGeminiToolSchemas(...)` i `inspectGeminiToolSchemas(...)`
      to bazowe publiczne helpery schematów Gemini.
    - `resolveXaiModelCompatPatch()` zwraca dołączoną poprawkę zgodności xAI:
      `toolSchemaProfile: "xai"`, nieobsługiwane słowa kluczowe schematu, natywne
      wsparcie `web_search` i dekodowanie argumentów wywołań narzędzi z encji HTML.
    - `applyXaiModelCompat(model)` stosuje tę samą poprawkę zgodności xAI do
      rozstrzygniętego modelu, zanim trafi on do runnera.

    Rzeczywisty dołączony przykład: Plugin xAI używa `normalizeResolvedModel` oraz
    `contributeResolvedModelCompat`, aby te metadane zgodności należały do
    dostawcy zamiast twardo kodować reguły xAI w core.

    Ten sam wzorzec katalogu głównego pakietu wspiera także innych dołączonych dostawców:

    - `@openclaw/openai-provider`: `api.ts` eksportuje buildery dostawcy,
      helpery domyślnego modelu i buildery dostawców realtime
    - `@openclaw/openrouter-provider`: `api.ts` eksportuje builder dostawcy
      oraz helpery wdrażania/konfiguracji

    <Tabs>
      <Tab title="Wymiana tokenów">
        Dla dostawców, którzy potrzebują wymiany tokena przed każdym wywołaniem wnioskowania:

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
        Dla dostawców, którzy potrzebują niestandardowych nagłówków żądania lub modyfikacji treści:

        ```typescript
        // wrapStreamFn zwraca StreamFn pochodne z ctx.streamFn
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
        Dla dostawców, którzy potrzebują natywnych nagłówków żądania/sesji lub metadanych na
        ogólnych transportach HTTP lub WebSocket:

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
      | 1 | `catalog` | Katalog modeli lub domyślne wartości base URL |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne należące do dostawcy podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/poglądowych identyfikatorów modeli przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny dostawcy przed ogólnym złożeniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisania zgodności natywnego użycia streamingu dla dostawców konfiguracyjnych |
      | 7 | `resolveConfigApiKey` | Rozwiązywanie uwierzytelniania znacznikami env należące do dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne/self-hosted lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie priorytetu syntetycznych placeholderów zapisanych profili względem uwierzytelniania env/config |
      | 10 | `resolveDynamicModel` | Akceptacja dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozstrzygnięciem |
      | 12 | `normalizeResolvedModel` | Przepisania transportu przed runnerem |

    Uwagi o fallback środowiska uruchomieniowego:

    - `normalizeConfig` najpierw sprawdza dopasowanego dostawcę, a następnie innych
      dostawców Plugin obsługujących hooki, dopóki któryś rzeczywiście nie zmieni konfiguracji.
      Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu konfiguracji rodziny Google,
      nadal zostanie zastosowany dołączony normalizator konfiguracji Google.
    - `resolveConfigApiKey` używa hooka dostawcy, gdy jest dostępny. Dołączona
      ścieżka `amazon-bedrock` ma tu również wbudowany resolver znaczników env AWS,
      mimo że samo uwierzytelnianie środowiska uruchomieniowego Bedrock nadal używa
      domyślnego łańcucha AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawcy działających za innym zgodnym transportem |
      | 14 | `capabilities` | Starszy statyczny worek możliwości; tylko dla zgodności |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do dostawcy przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | 17 | `resolveReasoningOutputMode` | Oznaczony vs natywny kontrakt danych wyjściowych rozumowania |
      | 18 | `prepareExtraParams` | Domyślne parametry żądań |
      | 19 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 20 | `wrapStreamFn` | Niestandardowe wrappery nagłówków/treści na zwykłej ścieżce streamingu |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane per tura |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/cool-down |
      | 23 | `formatApiKey` | Niestandardowy kształt tokena środowiska uruchomieniowego |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 26 | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do dostawcy |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate-limit/przeciążenia należąca do dostawcy |
      | 28 | `isCacheTtlEligible` | Bramkowanie TTL cache promptów |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka o brakującym uwierzytelnianiu |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych wierszy upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze zgodności w przód |
      | 32 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 33 | `isBinaryThinking` | Zgodność z binarnym trybem thinking włącz/wyłącz |
      | 34 | `supportsXHighThinking` | Zgodność wsparcia rozumowania `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 36 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 37 | `prepareRuntimeAuth` | Wymiana tokena przed wnioskowaniem |
      | 38 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 39 | `fetchUsageSnapshot` | Niestandardowy endpoint użycia |
      | 40 | `createEmbeddingProvider` | Adapter osadzeń należący do dostawcy dla pamięci/wyszukiwania |
      | 41 | `buildReplayPolicy` | Niestandardowa polityka replay/Compaction transkryptu |
      | 42 | `sanitizeReplayHistory` | Przepisania replay specyficzne dla dostawcy po ogólnym czyszczeniu |
      | 43 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 44 | `onModelSelected` | Callback po wyborze modelu (np. telemetria) |

      Uwaga dotycząca dostrajania promptu:

      - `resolveSystemPromptContribution` pozwala dostawcy wstrzyknąć wskazówki
        system prompt świadome cache dla rodziny modeli. Preferuj to zamiast
        `before_prompt_build`, gdy zachowanie należy do jednej rodziny dostawcy/modelu
        i powinno zachować stabilny/dynamiczny podział cache.

      Szczegółowe opisy i przykłady z praktyki znajdziesz w
      [Internals: Provider Runtime Hooks](/pl/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin dostawcy może rejestrować mowę, transkrypcję realtime, głos realtime,
    rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci
    i wyszukiwanie w sieci obok wnioskowania tekstowego:

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
        describeImage: async (req) => ({ text: "Zdjęcie przedstawia..." }),
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

    OpenClaw klasyfikuje to jako Plugin o **hybrid-capability**. To
    zalecany wzorzec dla Plugin firmowych (jeden Plugin na dostawcę). Zobacz
    [Internals: Capability Ownership](/pl/plugins/architecture#capability-ownership-model).

    Dla generowania wideo preferuj pokazany wyżej kształt możliwości świadomy trybu:
    `generate`, `imageToVideo` i `videoToVideo`. Płaskie agregowane pola, takie
    jak `maxInputImages`, `maxInputVideos` i `maxDurationSeconds`, nie
    wystarczają do czystego reklamowania wsparcia trybów transformacji lub trybów wyłączonych.

    Dostawcy generowania muzyki powinni stosować ten sam wzorzec:
    `generate` dla generowania wyłącznie na podstawie promptu i `edit` dla
    generowania na podstawie obrazów referencyjnych. Płaskie agregowane pola, takie jak `maxInputImages`,
    `supportsLyrics` i `supportsFormat`, nie wystarczają do reklamowania wsparcia edycji;
    oczekiwanym kontraktem są jawne bloki `generate` / `edit`.

  </Step>

  <Step title="Test">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Wyeksportuj obiekt konfiguracji dostawcy z index.ts lub dedykowanego pliku
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

## Publikacja w ClawHub

Plugin dostawców publikuje się tak samo jak każdy inny zewnętrzny Plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starszego aliasu publikacji tylko dla Skills; pakiety Plugin powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadane openclaw.providers
├── openclaw.plugin.json      # Manifest z metadanymi uwierzytelniania dostawcy
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testy
    └── usage.ts              # Endpoint użycia (opcjonalnie)
```

## Dokumentacja kolejności katalogu

`catalog.order` kontroluje, kiedy Twój katalog jest scalany względem
wbudowanych dostawców:

| Kolejność | Kiedy        | Przypadek użycia                               |
| --------- | ------------ | ---------------------------------------------- |
| `simple`  | Pierwsze przejście | Zwykli dostawcy z kluczem API           |
| `profile` | Po `simple`  | Dostawcy zależni od profili uwierzytelniania   |
| `paired`  | Po `profile` | Syntezowanie wielu powiązanych wpisów          |
| `late`    | Ostatnie przejście | Nadpisywanie istniejących dostawców (wygrywa przy kolizji) |

## Następne kroki

- [Plugin kanałów](/pl/plugins/sdk-channel-plugins) — jeśli Twój Plugin udostępnia także kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — helpery `api.runtime` (TTS, wyszukiwanie, podagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [Wnętrze Plugin](/pl/plugins/architecture#provider-runtime-hooks) — szczegóły hooków i dołączone przykłady
