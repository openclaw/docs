---
read_when:
    - Tworzysz nowy Plugin dostawcy modeli
    - Chcesz dodać do OpenClaw serwer proxy zgodny z OpenAI lub niestandardowy LLM
    - Musisz rozumieć uwierzytelnianie dostawców, katalogi i hooki czasu wykonywania.
sidebarTitle: Provider plugins
summary: Przewodnik krok po kroku po tworzeniu Plugin dostawcy modeli dla OpenClaw
title: Tworzenie pluginów dostawców
x-i18n:
    generated_at: "2026-05-06T09:24:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez tworzenie Plugin dostawcy, który dodaje dostawcę modeli
(LLM) do OpenClaw. Na końcu będziesz mieć dostawcę z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozpoznawaniem modeli.

<Info>
  Jeśli nie tworzono wcześniej żadnego Plugin OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Plugin dostawcy dodaje modele do standardowej pętli wnioskowania OpenClaw. Jeśli model
  musi działać przez natywny demon agenta, który zarządza wątkami, Compaction lub zdarzeniami
  narzędzi, połącz dostawcę z [wiązką agenta](/pl/plugins/sdk-agent-harness)
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

## Przewodnik krok po kroku

<Steps>
  <Step title="Package and manifest">
    ### Krok 1: Pakiet i manifest

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

    Manifest deklaruje `providerAuthEnvVars`, aby OpenClaw mógł wykrywać
    dane uwierzytelniające bez ładowania środowiska uruchomieniowego Plugin. Dodaj `providerAuthAliases`,
    gdy wariant dostawcy powinien ponownie używać uwierzytelniania innego identyfikatora dostawcy. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie ładować Plugin dostawcy na podstawie skróconych
    identyfikatorów modeli, takich jak `acme-large`, zanim istnieją hooki środowiska uruchomieniowego. Jeśli publikujesz
    dostawcę w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Register the provider">
    Minimalny dostawca potrzebuje `id`, `label`, `auth` i `catalog`:

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

    To działający dostawca. Użytkownicy mogą teraz uruchomić
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    Jeśli nadrzędny dostawca używa innych tokenów sterujących niż OpenClaw, dodaj
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

    `input` przepisuje końcowy prompt systemowy i treść wiadomości tekstowej przed
    transportem. `output` przepisuje delty tekstu asystenta i tekst końcowy, zanim
    OpenClaw sparsuje własne znaczniki sterujące lub dostarczenie kanałem.

    W przypadku wbudowanych dostawców, którzy rejestrują tylko jednego dostawcę tekstu z uwierzytelnianiem
    kluczem API oraz pojedynczym środowiskiem uruchomieniowym opartym na katalogu, preferuj węższy
    pomocnik `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` to ścieżka katalogu live używana, gdy OpenClaw może rozpoznać rzeczywiste
    uwierzytelnianie dostawcy. Może wykonywać wykrywanie specyficzne dla dostawcy. Używaj
    `buildStaticProvider` tylko dla wierszy offline, które można bezpiecznie pokazać przed skonfigurowaniem
    uwierzytelniania; nie może wymagać danych uwierzytelniających ani wykonywać żądań sieciowych.
    Widok `models list --all` w OpenClaw obecnie wykonuje statyczne katalogi
    tylko dla wbudowanych Plugin dostawców, z pustą konfiguracją, pustym środowiskiem i bez
    ścieżek agenta/przestrzeni roboczej.

    Jeśli przepływ uwierzytelniania musi także poprawiać `models.providers.*`, aliasy i
    domyślny model agenta podczas onboardingu, użyj pomocników presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe pomocniki to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` i
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint dostawcy obsługuje strumieniowane bloki użycia w
    zwykłym transporcie `openai-completions`, preferuj współdzielone pomocniki katalogu w
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast zakodowanych na stałe
    sprawdzeń identyfikatora dostawcy. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie
    mapy możliwości endpointu, więc natywne endpointy w stylu Moonshot/DashScope nadal
    włączają tę opcję, nawet gdy Plugin używa niestandardowego identyfikatora dostawcy.

  </Step>

  <Step title="Add dynamic model resolution">
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

    Jeśli rozpoznawanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    przygotowania - `resolveDynamicModel` uruchomi się ponownie po jego zakończeniu.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Większość dostawców potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, gdy dostawca ich wymaga.

    Współdzielone konstruktory pomocników obejmują teraz najczęstsze rodziny replay/tool-compat,
    więc Plugin zwykle nie musi ręcznie podłączać każdego hooka osobno:

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

    | Rodzina | Co podłącza | Wbudowane przykłady |
    | --- | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym oczyszczanie tool-call-id, poprawki kolejności assistant-first oraz ogólna walidacja tur Gemini tam, gdzie transport jej potrzebuje | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Polityka replay świadoma Claude, wybierana przez `modelId`, dzięki czemu transporty komunikatów Anthropic otrzymują czyszczenie bloków myślenia specyficzne dla Claude tylko wtedy, gdy rozpoznany model faktycznie jest identyfikatorem Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Natywna polityka replay Gemini oraz oczyszczanie replay przy bootstrapie i tryb oznaczonych wyników rozumowania | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Oczyszczanie podpisów myśli Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisywania bootstrapu | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Polityka hybrydowa dla dostawców, którzy łączą powierzchnie modeli komunikatów Anthropic i zgodne z OpenAI w jednym Plugin; opcjonalne usuwanie bloków myślenia tylko dla Claude pozostaje ograniczone do strony Anthropic | `minimax` |

    Dostępne obecnie rodziny strumieni:

    | Rodzina | Co podłącza | Dołączone przykłady |
    | --- | --- | --- |
    | `google-thinking` | Normalizacja ładunku myślenia Gemini na współdzielonej ścieżce strumienia | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Opakowanie rozumowania Kilo na współdzielonej ścieżce strumienia proxy, z pomijaniem wstrzykiwanego myślenia dla `kilo/auto` i nieobsługiwanych identyfikatorów rozumowania proxy | `kilocode` |
    | `moonshot-thinking` | Mapowanie natywnego binarnego ładunku myślenia Moonshot z konfiguracji i poziomu `/think` | `moonshot` |
    | `minimax-fast-mode` | Przepisywanie modelu trybu szybkiego MiniMax na współdzielonej ścieżce strumienia | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Współdzielone opakowania natywnych OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie w sieci Codex, kształtowanie ładunku zgodności rozumowania oraz zarządzanie kontekstem Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Opakowanie rozumowania OpenRouter dla tras proxy, ze scentralizowaną obsługą pominięć dla nieobsługiwanych modeli i `auto` | `openrouter` |
    | `tool-stream-default-on` | Domyślnie włączone opakowanie `tool_stream` dla dostawców takich jak Z.AI, którzy oczekują strumieniowania narzędzi, chyba że zostanie ono jawnie wyłączone | `zai` |

    <Accordion title="Punkty integracji SDK zasilające konstruktory rodzin">
      Każdy konstruktor rodziny składa się z publicznych helperów niższego poziomu eksportowanych z tego samego pakietu, po które możesz sięgnąć, gdy dostawca musi wyjść poza wspólny wzorzec:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` oraz surowe konstruktory odtwarzania (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Eksportuje też helpery odtwarzania Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) oraz helpery endpointów/modeli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, a także współdzielone opakowania OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), zgodne z OpenAI opakowanie DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), czyszczenie wstępnego wypełnienia myślenia Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) oraz współdzielone opakowania proxy/dostawców (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, bazowe helpery schematów Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) oraz helpery zgodności xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Dołączony plugin xAI używa z nimi `normalizeResolvedModel` + `contributeResolvedModelCompat`, aby reguły xAI pozostawały własnością dostawcy.

      Niektóre helpery strumieni celowo pozostają lokalne dla dostawcy. `@openclaw/anthropic-provider` trzyma `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz konstruktory opakowań Anthropic niższego poziomu we własnym publicznym punkcie integracji `api.ts` / `contract-api.ts`, ponieważ kodują obsługę Claude OAuth beta i bramkowanie `context1m`. Plugin xAI podobnie trzyma natywne kształtowanie xAI Responses we własnym `wrapStreamFn` (aliasy `/fast`, domyślne `tool_stream`, czyszczenie nieobsługiwanych narzędzi ścisłych, usuwanie ładunku rozumowania specyficzne dla xAI).

      Ten sam wzorzec katalogu głównego pakietu wspiera też `@openclaw/openai-provider` (konstruktory dostawcy, helpery modelu domyślnego, konstruktory dostawcy realtime) i `@openclaw/openrouter-provider` (konstruktor dostawcy oraz helpery wdrażania/konfiguracji).
    </Accordion>

    <Tabs>
      <Tab title="Wymiana tokenu">
        Dla dostawców, którzy przed każdym wywołaniem inferencji potrzebują wymiany tokenu:

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
      <Tab title="Natywna tożsamość transportu">
        Dla dostawców, którzy potrzebują natywnych nagłówków żądania/sesji lub metadanych w
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
      Pola dostawcy wyłącznie dla zgodności, których OpenClaw już nie wywołuje, takie jak
      `ProviderPlugin.capabilities` i `suppressBuiltInModel`, nie są tutaj wymienione.

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości bazowego URL |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne będące własnością dostawcy podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie starszych/podglądowych aliasów identyfikatorów modeli przed wyszukaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisywanie zgodności natywnego użycia strumieniowania dla dostawców z konfiguracji |
      | 7 | `resolveConfigApiKey` | Rozpoznawanie uwierzytelnienia znacznika env będące własnością dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnienie lokalne/samodzielnie hostowane lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżanie syntetycznych placeholderów przechowywanego profilu za uwierzytelnienie env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobranie metadanych przed rozpoznaniem |
      | 12 | `normalizeResolvedModel` | Przepisywanie transportu przed runnerem |
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawców za innym zgodnym transportem |
      | 14 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi będące własnością dostawcy przed rejestracją |
      | 15 | `inspectToolSchemas` | Diagnostyka schematów narzędzi będąca własnością dostawcy |
      | 16 | `resolveReasoningOutputMode` | Kontrakt tagowanego i natywnego wyjścia rozumowania |
      | 17 | `prepareExtraParams` | Domyślne parametry żądania |
      | 18 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 19 | `wrapStreamFn` | Niestandardowe opakowania nagłówków/treści na normalnej ścieżce strumienia |
      | 20 | `resolveTransportTurnState` | Natywne nagłówki/metadane dla każdej tury |
      | 21 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/cool-down |
      | 22 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 23 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 24 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelnienia |
      | 25 | `matchesContextOverflowError` | Wykrywanie przepełnienia będące własnością dostawcy |
      | 26 | `classifyFailoverReason` | Klasyfikacja limitów szybkości/przeciążenia będąca własnością dostawcy |
      | 27 | `isCacheTtlEligible` | Bramkowanie TTL pamięci podręcznej promptów |
      | 28 | `buildMissingAuthMessage` | Niestandardowa wskazówka brakującego uwierzytelnienia |
      | 29 | `augmentModelCatalog` | Syntetyczne wiersze zgodności w przód |
      | 30 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 31 | `isBinaryThinking` | Zgodność włączania/wyłączania myślenia binarnego |
      | 32 | `supportsXHighThinking` | Zgodność obsługi rozumowania `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 34 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 35 | `prepareRuntimeAuth` | Wymiana tokenu przed inferencją |
      | 36 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 37 | `fetchUsageSnapshot` | Niestandardowy endpoint użycia |
      | 38 | `createEmbeddingProvider` | Adapter embeddingów do pamięci/wyszukiwania będący własnością dostawcy |
      | 39 | `buildReplayPolicy` | Niestandardowa polityka odtwarzania/Compaction transkryptu |
      | 40 | `sanitizeReplayHistory` | Przepisywanie odtwarzania specyficzne dla dostawcy po ogólnym czyszczeniu |
      | 41 | `validateReplayTurns` | Ścisła walidacja tur odtwarzania przed wbudowanym runnerem |
      | 42 | `onModelSelected` | Callback po wyborze (np. telemetria) |

      Uwagi o awaryjnym zachowaniu runtime:

      - `normalizeConfig` najpierw sprawdza dopasowanego dostawcę, a następnie inne pluginy dostawców obsługujące hooki, aż któryś faktycznie zmieni konfigurację. Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu konfiguracji z rodziny Google, nadal stosowany jest dołączony normalizator konfiguracji Google.
      - `resolveConfigApiKey` używa hooka dostawcy, gdy jest udostępniony. Dołączona ścieżka `amazon-bedrock` ma tutaj też wbudowany resolver znaczników env AWS, mimo że samo uwierzytelnienie runtime Bedrock nadal używa domyślnego łańcucha AWS SDK.
      - `resolveSystemPromptContribution` pozwala dostawcy wstrzyknąć wskazówki promptu systemowego świadome pamięci podręcznej dla rodziny modeli. Preferuj go zamiast `before_prompt_build`, gdy zachowanie należy do jednej rodziny dostawcy/modelu i powinno zachować stabilny/dynamiczny podział pamięci podręcznej.

      Szczegółowe opisy i przykłady z praktyki znajdziesz w [Mechanizmach wewnętrznych: Hooki runtime dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    ### Krok 5: Dodaj dodatkowe możliwości

    Plugin dostawcy może rejestrować mowę, transkrypcję realtime, głos realtime, rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci
    i wyszukiwanie w sieci obok inferencji tekstu. OpenClaw klasyfikuje to jako
    plugin **hybrid-capability** - zalecany wzorzec dla pluginów firmowych
    (jeden plugin na dostawcę). Zobacz
    [Mechanizmy wewnętrzne: Własność możliwości](/pl/plugins/architecture#capability-ownership-model).

    Zarejestruj każdą możliwość wewnątrz `register(api)` obok istniejącego
    wywołania `api.registerProvider(...)`. Wybierz tylko te karty, których potrzebujesz:

    <Tabs>
      <Tab title="Synteza mowy (TTS)">
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

        Użyj `assertOkOrThrowProviderError(...)` dla błędów HTTP dostawcy, aby
        pluginy korzystały ze wspólnego mechanizmu limitowanego odczytu treści błędu,
        parsowania błędów JSON i sufiksów request-id.
      </Tab>
      <Tab title="Transkrypcja w czasie rzeczywistym">
        Preferuj `createRealtimeTranscriptionWebSocketSession(...)` - wspólna
        funkcja pomocnicza obsługuje przechwytywanie proxy, backoff ponownego
        łączenia, opróżnianie przy zamknięciu, uzgadnianie gotowości,
        kolejkowanie audio i diagnostykę zdarzeń zamknięcia. Twój plugin
        tylko mapuje zdarzenia z usługi nadrzędnej.

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

        Dostawcy STT działający wsadowo, którzy wysyłają audio multipart przez POST,
        powinni używać `buildAudioTranscriptionFormData(...)` z
        `openclaw/plugin-sdk/provider-http`. Funkcja pomocnicza normalizuje nazwy
        przesyłanych plików, w tym uploady AAC, które wymagają nazwy pliku w stylu
        M4A dla zgodnych API transkrypcji.
      </Tab>
      <Tab title="Głos w czasie rzeczywistym">
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

        Zadeklaruj `capabilities`, aby `talk.catalog` mógł udostępniać poprawne
        tryby, transporty, formaty audio i flagi funkcji klientom Talk w
        przeglądarce oraz klientom natywnym. Zaimplementuj `handleBargeIn`, gdy
        transport potrafi wykryć, że człowiek przerywa odtwarzanie asystenta, a
        dostawca obsługuje skracanie lub czyszczenie aktywnej odpowiedzi audio.
      </Tab>
      <Tab title="Rozumienie multimediów">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Generowanie obrazów i wideo">
        Możliwości wideo używają struktury **świadomej trybu**: `generate`,
        `imageToVideo` i `videoToVideo`. Płaskie pola zbiorcze, takie jak
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`, nie
        wystarczają, aby czytelnie ogłosić obsługę trybu transformacji albo
        wyłączone tryby. Generowanie muzyki stosuje ten sam wzorzec z jawnymi
        blokami `generate` / `edit`.

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
      <Tab title="Pobieranie i wyszukiwanie w sieci">
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
    ### Krok 6: Test

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

Pluginy dostawców publikuje się tak samo jak każdy inny zewnętrzny plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Nie używaj tutaj starszego aliasu publikowania przeznaczonego tylko dla Skills; pakiety pluginów powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Odniesienie kolejności katalogu

`catalog.order` kontroluje, kiedy Twój katalog jest scalany względem wbudowanych
dostawców:

| Kolejność | Kiedy      | Przypadek użycia                               |
| --------- | ---------- | ---------------------------------------------- |
| `simple`  | Pierwszy przebieg | Zwykli dostawcy z kluczem API                  |
| `profile` | Po simple  | Dostawcy ograniczeni profilami uwierzytelniania |
| `paired`  | Po profile | Synteza wielu powiązanych wpisów               |
| `late`    | Ostatni przebieg | Zastępowanie istniejących dostawców (wygrywa przy kolizji) |

## Następne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - jeśli Twój plugin udostępnia także kanał
- [Środowisko wykonawcze SDK](/pl/plugins/sdk-runtime) - funkcje pomocnicze `api.runtime` (TTS, wyszukiwanie, subagent)
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełne odniesienie importów subpath
- [Wewnętrzne mechanizmy Plugin](/pl/plugins/architecture-internals#provider-runtime-hooks) - szczegóły hooków i dołączone przykłady

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Tworzenie pluginów kanałów](/pl/plugins/sdk-channel-plugins)
