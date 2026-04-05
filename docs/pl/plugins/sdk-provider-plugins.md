---
read_when:
    - Tworzysz nową wtyczkę providera modeli
    - Chcesz dodać zgodne z OpenAI proxy lub niestandardowy LLM do OpenClaw
    - Musisz zrozumieć uwierzytelnianie providerów, katalogi i hooki runtime
sidebarTitle: Provider Plugins
summary: Przewodnik krok po kroku po tworzeniu wtyczki providera modeli dla OpenClaw
title: Tworzenie wtyczek providerów
x-i18n:
    generated_at: "2026-04-05T14:02:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9411ebf96c1eef0baecee9b743925440edc6714a8947da7712fed2b9ef1405cb
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Tworzenie wtyczek providerów

Ten przewodnik pokazuje, jak utworzyć wtyczkę providera, która dodaje providera modeli
(LLM) do OpenClaw. Na końcu będziesz mieć providera z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozwiązywaniem modeli.

<Info>
  Jeśli wcześniej nie tworzyłeś żadnej wtyczki OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

## Przewodnik

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
    poświadczenia bez ładowania runtime Twojej wtyczki. `modelSupport` jest opcjonalne
    i pozwala OpenClaw automatycznie ładować Twoją wtyczkę providera na podstawie skróconych identyfikatorów modeli,
    takich jak `acme-large`, zanim pojawią się hooki runtime. Jeśli publikujesz
    providera w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Zarejestruj providera">
    Minimalny provider wymaga `id`, `label`, `auth` i `catalog`:

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

    To jest działający provider. Użytkownicy mogą teraz wykonać
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    Dla dołączonych providerów, które rejestrują tylko jednego providera tekstowego z
    uwierzytelnianiem kluczem API oraz pojedynczym runtime opartym na katalogu, preferuj
    węższy helper `defineSingleProviderPluginEntry(...)`:

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

    Jeśli Twój przepływ uwierzytelniania musi również aktualizować `models.providers.*`, aliasy i
    domyślny model agenta podczas onboardingu, użyj gotowych helperów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` i
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint providera obsługuje strumieniowane bloki użycia w
    zwykłym transporcie `openai-completions`, preferuj współdzielone helpery katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast wpisywać na sztywno sprawdzenia identyfikatorów providerów.
    `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie mapy możliwości endpointu,
    dzięki czemu natywne endpointy w stylu Moonshot/DashScope nadal mogą się włączyć,
    nawet jeśli wtyczka używa niestandardowego identyfikatora providera.

  </Step>

  <Step title="Dodaj dynamiczne rozwiązywanie modeli">
    Jeśli Twój provider akceptuje dowolne identyfikatory modeli (jak proxy lub router),
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

    Jeśli rozwiązywanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    przygotowania — po jego zakończeniu `resolveDynamicModel` zostanie uruchomione ponownie.

  </Step>

  <Step title="Dodaj hooki runtime (w razie potrzeby)">
    Większość providerów potrzebuje tylko `catalog` i `resolveDynamicModel`. Dodawaj hooki
    stopniowo, zgodnie z potrzebami providera.

    Współdzielone konstruktory helperów obejmują teraz najczęstsze rodziny
    zgodności replay/narzędzi, więc wtyczki zwykle nie muszą ręcznie podłączać każdego hooka osobno:

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

    Dostępne obecnie rodziny replay:

    | Family | Co podłączają |
    | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzacja `tool-call-id`, poprawki kolejności assistant-first oraz ogólna walidacja tur Gemini tam, gdzie wymaga jej transport |
    | `anthropic-by-model` | Polityka replay uwzględniająca Claude, wybierana na podstawie `modelId`, dzięki czemu transporty komunikatów Anthropic dostają czyszczenie bloków myślenia specyficzne dla Claude tylko wtedy, gdy rozpoznany model jest rzeczywiście identyfikatorem Claude |
    | `google-gemini` | Natywna polityka replay Gemini wraz z sanityzacją bootstrap replay i oznaczonym trybem reasoning-output |
    | `passthrough-gemini` | Sanityzacja podpisu myśli Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisania bootstrap |
    | `hybrid-anthropic-openai` | Hybrydowa polityka dla providerów, którzy łączą w jednej wtyczce powierzchnie modeli komunikatów Anthropic i zgodnych z OpenAI; opcjonalne odrzucanie bloków myślenia tylko dla Claude pozostaje ograniczone do strony Anthropic |

    Rzeczywiste przykłady dołączone do projektu:

    - `google` i `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` i `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` i `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` i `zai`: `openai-compatible`

    Dostępne obecnie rodziny strumieni:

    | Family | Co podłączają |
    | --- | --- |
    | `google-thinking` | Normalizacja ładunku myślenia Gemini na współdzielonej ścieżce strumienia |
    | `kilocode-thinking` | Wrapper rozumowania Kilo na współdzielonej ścieżce strumienia proxy, z pomijaniem wstrzykniętego myślenia dla `kilo/auto` i nieobsługiwanych identyfikatorów rozumowania proxy |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku myślenia Moonshot z konfiguracji i poziomu `/think` |
    | `minimax-fast-mode` | Przepisanie modelu MiniMax fast-mode na współdzielonej ścieżce strumienia |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie internetowe Codex, kształtowanie ładunku zgodności reasoning i zarządzanie kontekstem Responses |
    | `openrouter-thinking` | Wrapper rozumowania OpenRouter dla tras proxy, z centralnie obsługiwanym pomijaniem nieobsługiwanych modeli i `auto` |
    | `tool-stream-default-on` | Domyślnie włączony wrapper `tool_stream` dla providerów takich jak Z.AI, którzy chcą strumieniowania narzędzi, o ile nie zostanie ono jawnie wyłączone |

    Rzeczywiste przykłady dołączone do projektu:

    - `google` i `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` i `minimax-portal`: `minimax-fast-mode`
    - `openai` i `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` eksportuje także enum rodziny replay
    oraz współdzielone helpery, z których te rodziny są budowane. Typowe publiczne eksporty
    obejmują:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - współdzielone konstruktory replay, takie jak `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` i
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helpery replay Gemini, takie jak `sanitizeGoogleGeminiReplayHistory(...)`
      oraz `resolveTaggedReasoningOutputMode()`
    - helpery endpointów/modeli, takie jak `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` i
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` udostępnia zarówno konstruktor rodziny,
    jak i publiczne helpery wrapperów, które te rodziny wykorzystują ponownie. Typowe publiczne eksporty
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
    - współdzielone wrappery proxy/providerów, takie jak `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` i `createMinimaxFastModeWrapper(...)`

    Niektóre helpery strumieniowe celowo pozostają lokalne dla providera. Obecny dołączony
    przykład: `@openclaw/anthropic-provider` eksportuje
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz
    niższopoziomowe konstruktory wrapperów Anthropic ze swojego publicznego interfejsu `api.ts` /
    `contract-api.ts`. Te helpery pozostają specyficzne dla Anthropic, ponieważ
    kodują także obsługę beta Claude OAuth i bramkowanie `context1m`.

    Inni dołączeni providerzy również przechowują lokalnie wrappery specyficzne dla transportu, gdy
    zachowanie nie jest współdzielone w czysty sposób między rodzinami. Obecny przykład: dołączona
    wtyczka xAI zachowuje natywne kształtowanie xAI Responses we własnym
    `wrapStreamFn`, w tym przepisania aliasów `/fast`, domyślne `tool_stream`,
    czyszczenie nieobsługiwanych ścisłych narzędzi oraz usuwanie ładunku
    rozumowania specyficznego dla xAI.

    `openclaw/plugin-sdk/provider-tools` obecnie udostępnia jedną współdzieloną
    rodzinę schematów narzędzi oraz współdzielone helpery schematów/zgodności:

    - `ProviderToolCompatFamily` dokumentuje aktualny zestaw współdzielonych rodzin.
    - `buildProviderToolCompatFamilyHooks("gemini")` podłącza czyszczenie schematów Gemini
      i diagnostykę dla providerów, które potrzebują schematów narzędzi bezpiecznych dla Gemini.
    - `normalizeGeminiToolSchemas(...)` i `inspectGeminiToolSchemas(...)`
      to bazowe publiczne helpery schematów Gemini.
    - `resolveXaiModelCompatPatch()` zwraca dołączoną łatkę zgodności xAI:
      `toolSchemaProfile: "xai"`, nieobsługiwane słowa kluczowe schematu, natywne
      wsparcie `web_search` oraz dekodowanie argumentów wywołań narzędzi z encji HTML.
    - `applyXaiModelCompat(model)` stosuje tę samą łatkę zgodności xAI do
      rozpoznanego modelu, zanim trafi on do runnera.

    Rzeczywisty przykład dołączony do projektu: wtyczka xAI używa `normalizeResolvedModel` oraz
    `contributeResolvedModelCompat`, aby zachować własność tych metadanych zgodności po stronie
    providera zamiast wpisywać reguły xAI na sztywno w core.

    Ten sam wzorzec katalogu głównego pakietu wspiera także innych dołączonych providerów:

    - `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory providerów,
      helpery modeli domyślnych i konstruktory providerów realtime
    - `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor providera
      oraz helpery onboardingu/konfiguracji

    <Tabs>
      <Tab title="Wymiana tokenów">
        Dla providerów, które wymagają wymiany tokena przed każdym wywołaniem inferencji:

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
        Dla providerów, które wymagają niestandardowych nagłówków żądań lub modyfikacji body:

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
        Dla providerów, które potrzebują natywnych nagłówków lub metadanych żądania/sesji w
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
        Dla providerów, którzy udostępniają dane o użyciu/rozliczeniach:

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

    <Accordion title="Wszystkie dostępne hooki providerów">
      OpenClaw wywołuje hooki w tej kolejności. Większość providerów używa tylko 2–3:

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości `baseUrl` |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne będące własnością providera podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów legacy/preview model-id przed wyszukaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny providerów przed ogólnym złożeniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisania zgodności natywnego strumieniowania użycia dla providerów konfiguracyjnych |
      | 7 | `resolveConfigApiKey` | Rozwiązywanie uwierzytelniania znaczników env będące własnością providera |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne/self-hosted lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie priorytetu syntetycznych placeholderów przechowywanych profili względem uwierzytelniania env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozpoznaniem |
      | 12 | `normalizeResolvedModel` | Przepisania transportu przed runnerem |

    Uwagi dotyczące fallbacków runtime:

    - `normalizeConfig` najpierw sprawdza dopasowanego providera, a następnie inne
      wtyczki providerów obsługujące hooki, dopóki któraś rzeczywiście nie zmieni konfiguracji.
      Jeśli żaden hook providera nie przepisze obsługiwanej konfiguracji rodziny Google,
      nadal zostanie zastosowany dołączony normalizator konfiguracji Google.
    - `resolveConfigApiKey` używa hooka providera, jeśli jest udostępniony. Dołączona ścieżka
      `amazon-bedrock` ma tu także wbudowany resolver znaczników środowiskowych AWS,
      mimo że samo uwierzytelnianie runtime Bedrock nadal używa domyślnego
      łańcucha AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawcy za innym zgodnym transportem |
      | 14 | `capabilities` | Starszy statyczny zestaw możliwości; tylko zgodność |
      | 15 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi będące własnością providera przed rejestracją |
      | 16 | `inspectToolSchemas` | Diagnostyka schematów narzędzi będąca własnością providera |
      | 17 | `resolveReasoningOutputMode` | Kontrakt tagged vs native dla reasoning-output |
      | 18 | `prepareExtraParams` | Domyślne parametry żądania |
      | 19 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 20 | `wrapStreamFn` | Wrappery niestandardowych nagłówków/body na zwykłej ścieżce strumienia |
      | 21 | `resolveTransportTurnState` | Natywne nagłówki/metadane dla pojedynczej tury |
      | 22 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS / okres schładzania |
      | 23 | `formatApiKey` | Niestandardowy kształt tokena runtime |
      | 24 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 25 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 26 | `matchesContextOverflowError` | Wykrywanie przepełnienia będące własnością providera |
      | 27 | `classifyFailoverReason` | Klasyfikacja rate limit / przeciążenia będąca własnością providera |
      | 28 | `isCacheTtlEligible` | Bramka TTL pamięci podręcznej promptu |
      | 29 | `buildMissingAuthMessage` | Niestandardowa wskazówka dla brakującego uwierzytelniania |
      | 30 | `suppressBuiltInModel` | Ukrywanie nieaktualnych wierszy upstream |
      | 31 | `augmentModelCatalog` | Syntetyczne wiersze zgodności wprzód |
      | 32 | `isBinaryThinking` | Binarne thinking włączone/wyłączone |
      | 33 | `supportsXHighThinking` | Obsługa rozumowania `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Domyślna polityka `/think` |
      | 35 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 36 | `prepareRuntimeAuth` | Wymiana tokena przed inferencją |
      | 37 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 38 | `fetchUsageSnapshot` | Niestandardowy endpoint użycia |
      | 39 | `createEmbeddingProvider` | Adapter embeddingów będący własnością providera dla pamięci/wyszukiwania |
      | 40 | `buildReplayPolicy` | Niestandardowa polityka replay/kompaktowania transkrypcji |
      | 41 | `sanitizeReplayHistory` | Przepisania replay specyficzne dla providera po ogólnym czyszczeniu |
      | 42 | `validateReplayTurns` | Ścisła walidacja tur replay przed osadzonym runnerem |
      | 43 | `onModelSelected` | Callback po wyborze modelu (np. telemetria) |

      Uwaga dotycząca strojenia promptów:

      - `resolveSystemPromptContribution` pozwala providerowi wstrzykiwać
        wskazówki system-prompt świadome cache dla rodziny modeli. Preferuj to zamiast
        `before_prompt_build`, gdy zachowanie należy do jednej rodziny provider/model
        i powinno zachować stabilny/dynamiczny podział cache.

      Szczegółowe opisy i przykłady z praktyki znajdziesz w
      [Elementy wewnętrzne: Hooki runtime providerów](/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    <a id="step-5-add-extra-capabilities"></a>
    Wtyczka providera może rejestrować mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
    rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie treści z internetu
    i wyszukiwanie w internecie obok inferencji tekstowej:

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
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
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

    OpenClaw klasyfikuje to jako wtyczkę o **hybrydowych możliwościach**. Jest to
    zalecany wzorzec dla wtyczek firmowych (jedna wtyczka na dostawcę). Zobacz
    [Elementy wewnętrzne: Własność możliwości](/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Testuj">
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

## Publikowanie w ClawHub

Wtyczki providerów publikuje się tak samo jak każdy inny zewnętrzny pakiet kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starego aliasu publikacji tylko dla skills; pakiety wtyczek powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Manifest with providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Dokumentacja `catalog.order`

`catalog.order` określa, kiedy Twój katalog jest scalany względem wbudowanych
providerów:

| Order     | Kiedy          | Przypadek użycia                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Pierwsze przejście    | Prości providerzy z kluczem API                         |
| `profile` | Po `simple`  | Providerzy zależni od profili uwierzytelniania                |
| `paired`  | Po `profile` | Syntetyzowanie wielu powiązanych wpisów             |
| `late`    | Ostatnie przejście     | Nadpisywanie istniejących providerów (wygrywa przy kolizji) |

## Następne kroki

- [Wtyczki kanałów](/plugins/sdk-channel-plugins) — jeśli Twoja wtyczka udostępnia także kanał
- [SDK Runtime](/plugins/sdk-runtime) — helpery `api.runtime` (TTS, wyszukiwanie, subagent)
- [Przegląd SDK](/plugins/sdk-overview) — pełna dokumentacja importów subpath
- [Elementy wewnętrzne wtyczek](/plugins/architecture#provider-runtime-hooks) — szczegóły hooków i przykłady dołączone do projektu
