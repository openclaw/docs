---
read_when:
    - Tworzysz nowy Plugin dostawcy modeli
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy LLM
    - Musisz rozumieć uwierzytelnianie dostawców, katalogi i hooki środowiska wykonawczego
sidebarTitle: Provider plugins
summary: Przewodnik krok po kroku po tworzeniu Plugin dostawcy modeli dla OpenClaw
title: Tworzenie pluginów dostawców
x-i18n:
    generated_at: "2026-05-02T22:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez tworzenie pluginu providera, który dodaje providera modelu
(LLM) do OpenClaw. Na końcu będziesz mieć providera z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozpoznawaniem modelu.

<Info>
  Jeśli nie tworzono wcześniej żadnego pluginu OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy providerów dodają modele do standardowej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywny demon agenta, który zarządza wątkami, kompakcją lub zdarzeniami
  narzędzi, połącz providera z [uprzężą agenta](/pl/plugins/sdk-agent-harness)
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

## Przewodnik

<Steps>
  <Step title="Pakiet i manifest">
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

    Manifest deklaruje `providerAuthEnvVars`, dzięki czemu OpenClaw może wykrywać
    poświadczenia bez ładowania środowiska uruchomieniowego pluginu. Dodaj `providerAuthAliases`,
    gdy wariant providera powinien ponownie używać uwierzytelniania innego identyfikatora providera. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie ładować plugin providera ze skróconych
    identyfikatorów modeli, takich jak `acme-large`, zanim będą istnieć haki środowiska uruchomieniowego. Jeśli publikujesz
    providera w ClawHub, pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Zarejestruj providera">
    Minimalny provider potrzebuje `id`, `label`, `auth` i `catalog`:

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

    To jest działający provider. Użytkownicy mogą teraz uruchomić
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    Jeśli nadrzędny provider używa innych tokenów sterujących niż OpenClaw, dodaj
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
    OpenClaw sparsuje własne znaczniki sterujące lub dostarczanie kanałem.

    W przypadku dołączonych providerów, którzy rejestrują tylko jednego providera tekstowego z uwierzytelnianiem
    kluczem API oraz pojedynczym środowiskiem uruchomieniowym opartym na katalogu, preferuj węższy
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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` to ścieżka katalogu na żywo używana, gdy OpenClaw może rozpoznać rzeczywiste
    uwierzytelnianie providera. Może wykonywać wykrywanie specyficzne dla providera. Używaj
    `buildStaticProvider` tylko dla wierszy offline, które można bezpiecznie pokazać przed skonfigurowaniem
    uwierzytelniania; nie może ono wymagać poświadczeń ani wykonywać żądań sieciowych.
    Widok `models list --all` w OpenClaw obecnie wykonuje katalogi statyczne
    tylko dla dołączonych pluginów providerów, z pustą konfiguracją, pustym env i bez
    ścieżek agenta/przestrzeni roboczej.

    Jeśli przepływ uwierzytelniania musi także modyfikować `models.providers.*`, aliasy oraz
    domyślny model agenta podczas onboardingu, użyj helperów presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe helpery to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` oraz
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint providera obsługuje strumieniowane bloki użycia w
    standardowym transporcie `openai-completions`, preferuj współdzielone helpery katalogu w
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast zakodowanych na stałe
    sprawdzeń identyfikatora providera. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę z mapy możliwości
    endpointu, więc natywne endpointy w stylu Moonshot/DashScope nadal
    włączają się, nawet gdy plugin używa niestandardowego identyfikatora providera.

  </Step>

  <Step title="Dodaj dynamiczne rozpoznawanie modelu">
    Jeśli provider akceptuje dowolne identyfikatory modeli (jak proxy lub router),
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
    rozgrzania — `resolveDynamicModel` uruchomi się ponownie po jego zakończeniu.

  </Step>

  <Step title="Dodaj haki środowiska uruchomieniowego (w razie potrzeby)">
    Większość providerów potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj haki
    stopniowo, gdy provider ich wymaga.

    Współdzielone buildery helperów obejmują teraz najczęstsze rodziny zgodności replay/narzędzi,
    więc pluginy zwykle nie muszą ręcznie podłączać każdego haka osobno:

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

    | Rodzina | Co podłącza | Dołączone przykłady |
    | --- | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym sanityzacja identyfikatorów wywołań narzędzi, poprawki kolejności z asystentem na początku oraz ogólna walidacja tur Gemini tam, gdzie transport jej wymaga | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Polityka replay świadoma Claude wybierana przez `modelId`, dzięki czemu transporty wiadomości Anthropic otrzymują czyszczenie bloków myślenia specyficzne dla Claude tylko wtedy, gdy rozpoznany model faktycznie jest identyfikatorem Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Natywna polityka replay Gemini oraz sanityzacja bootstrap replay i tagowany tryb reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Sanityzacja sygnatur myśli Gemini dla modeli Gemini działających przez zgodne z OpenAI transporty proxy; nie włącza natywnej walidacji replay Gemini ani przepisywania bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Polityka hybrydowa dla providerów, którzy mieszają powierzchnie modeli wiadomości Anthropic i zgodne z OpenAI w jednym pluginie; opcjonalne usuwanie bloków myślenia tylko dla Claude pozostaje ograniczone do strony Anthropic | `minimax` |

    Dostępne obecnie rodziny strumieni:

    | Rodzina | Co podłącza | Dołączone przykłady |
    | --- | --- | --- |
    | `google-thinking` | Normalizacja ładunku myślenia Gemini we współdzielonej ścieżce strumienia | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper rozumowania Kilo we współdzielonej ścieżce strumienia proxy, z pomijaniem wstrzykniętego myślenia przez `kilo/auto` i nieobsługiwane identyfikatory rozumowania proxy | `kilocode` |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku myślenia Moonshot z konfiguracji + poziomu `/think` | `moonshot` |
    | `minimax-fast-mode` | Przepisywanie modelu szybkiego trybu MiniMax we współdzielonej ścieżce strumienia | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie w sieci Codex, kształtowanie ładunku zgodnego z rozumowaniem oraz zarządzanie kontekstem Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Wrapper rozumowania OpenRouter dla tras proxy, z centralną obsługą pominięć dla nieobsługiwanych modeli/`auto` | `openrouter` |
    | `tool-stream-default-on` | Domyślnie włączony wrapper `tool_stream` dla dostawców takich jak Z.AI, którzy chcą strumieniowania narzędzi, chyba że zostanie jawnie wyłączone | `zai` |

    <Accordion title="Szwy SDK zasilające konstruktory rodzin">
      Każdy konstruktor rodziny składa się z publicznych helperów niższego poziomu eksportowanych z tego samego pakietu, po które możesz sięgnąć, gdy dostawca musi odejść od wspólnego wzorca:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` oraz surowe konstruktory odtwarzania (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Eksportuje też helpery odtwarzania Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) oraz helpery punktów końcowych/modeli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, a także współdzielone wrappery OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper zgodny z OpenAI dla DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), czyszczenie wypełnienia myślenia Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) oraz współdzielone wrappery proxy/dostawcy (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, bazowe helpery schematów Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) oraz helpery zgodności xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Dołączony Plugin xAI używa z nimi `normalizeResolvedModel` + `contributeResolvedModelCompat`, aby reguły xAI pozostawały własnością dostawcy.

      Niektóre helpery strumieni pozostają celowo lokalne dla dostawcy. `@openclaw/anthropic-provider` trzyma `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższopoziomowe konstruktory wrapperów Anthropic we własnym publicznym szwie `api.ts` / `contract-api.ts`, ponieważ kodują obsługę bety Claude OAuth i bramkowanie `context1m`. Plugin xAI podobnie trzyma natywne kształtowanie xAI Responses we własnym `wrapStreamFn` (aliasy `/fast`, domyślny `tool_stream`, czyszczenie nieobsługiwanych narzędzi ścisłych, usuwanie ładunku rozumowania specyficznego dla xAI).

      Ten sam wzorzec katalogu głównego pakietu wspiera także `@openclaw/openai-provider` (konstruktory dostawcy, helpery modeli domyślnych, konstruktory dostawcy realtime) oraz `@openclaw/openrouter-provider` (konstruktor dostawcy oraz helpery onboardingu/konfiguracji).
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
        Dla dostawców, którzy potrzebują niestandardowych nagłówków żądań lub modyfikacji treści:

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
        generycznych transportach HTTP albo WebSocket:

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
        Dla dostawców, którzy ujawniają dane użycia/rozliczeń:

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
      Pola dostawcy wyłącznie zgodnościowe, których OpenClaw już nie wywołuje, takie jak
      `ProviderPlugin.capabilities` i `suppressBuiltInModel`, nie są tutaj wymienione.

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości bazowego adresu URL |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne należące do dostawcy podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów starszych/podglądowych identyfikatorów modeli przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny dostawców przed generycznym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Natywne przepisywania zgodności użycia strumieniowego dla dostawców konfiguracji |
      | 7 | `resolveConfigApiKey` | Rozwiązywanie uwierzytelniania znaczników env należące do dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne/samodzielnie hostowane lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie syntetycznych symboli zastępczych przechowywanego profilu za uwierzytelnianie env/konfiguracji |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobranie metadanych przed rozwiązywaniem |
      | 12 | `normalizeResolvedModel` | Przepisywania transportu przed runnerem |
      | 13 | `contributeResolvedModelCompat` | Flagi zgodności dla modeli dostawcy za innym zgodnym transportem |
      | 14 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do dostawcy przed rejestracją |
      | 15 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | 16 | `resolveReasoningOutputMode` | Kontrakt oznaczonego vs natywnego wyjścia rozumowania |
      | 17 | `prepareExtraParams` | Domyślne parametry żądania |
      | 18 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 19 | `wrapStreamFn` | Niestandardowe wrappery nagłówków/treści w normalnej ścieżce strumienia |
      | 20 | `resolveTransportTurnState` | Natywne nagłówki/metadane na turę |
      | 21 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/cool-down |
      | 22 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 23 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 24 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 25 | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do dostawcy |
      | 26 | `classifyFailoverReason` | Klasyfikacja limitu szybkości/przeciążenia należąca do dostawcy |
      | 27 | `isCacheTtlEligible` | Bramkowanie TTL pamięci podręcznej promptów |
      | 28 | `buildMissingAuthMessage` | Niestandardowa podpowiedź brakującego uwierzytelniania |
      | 29 | `augmentModelCatalog` | Syntetyczne wiersze zgodności w przód |
      | 30 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 31 | `isBinaryThinking` | Zgodność włączania/wyłączania binarnego myślenia |
      | 32 | `supportsXHighThinking` | Zgodność obsługi rozumowania `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 34 | `isModernModelRef` | Dopasowanie modeli live/smoke |
      | 35 | `prepareRuntimeAuth` | Wymiana tokenu przed inferencją |
      | 36 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 37 | `fetchUsageSnapshot` | Niestandardowy punkt końcowy użycia |
      | 38 | `createEmbeddingProvider` | Adapter osadzania należący do dostawcy dla pamięci/wyszukiwania |
      | 39 | `buildReplayPolicy` | Niestandardowa polityka odtwarzania/Compaction transkryptu |
      | 40 | `sanitizeReplayHistory` | Przepisywania odtwarzania specyficzne dla dostawcy po generycznym czyszczeniu |
      | 41 | `validateReplayTurns` | Ścisła walidacja tur odtwarzania przed osadzonym runnerem |
      | 42 | `onModelSelected` | Wywołanie zwrotne po wyborze (np. telemetria) |

      Uwagi dotyczące awaryjnego zachowania runtime:

      - `normalizeConfig` sprawdza najpierw dopasowanego dostawcę, a potem inne Pluginy dostawców obsługujące hooki, aż któryś faktycznie zmieni konfigurację. Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu konfiguracji rodziny Google, dołączony normalizator konfiguracji Google nadal się zastosuje.
      - `resolveConfigApiKey` używa hooka dostawcy, gdy jest ujawniony. Dołączona ścieżka `amazon-bedrock` ma tutaj także wbudowany resolver znaczników env AWS, mimo że samo uwierzytelnianie runtime Bedrock nadal używa domyślnego łańcucha AWS SDK.
      - `resolveSystemPromptContribution` pozwala dostawcy wstrzyknąć wskazówki promptu systemowego świadome pamięci podręcznej dla rodziny modeli. Preferuj go zamiast `before_prompt_build`, gdy zachowanie należy do jednej rodziny dostawcy/modelu i powinno zachować stabilny/dynamiczny podział pamięci podręcznej.

      Szczegółowe opisy i rzeczywiste przykłady znajdziesz w [Internals: Provider Runtime Hooks](/pl/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    ### Krok 5: Dodaj dodatkowe możliwości

    Plugin dostawcy może rejestrować mowę, transkrypcję realtime, głos realtime,
    rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci,
    oraz wyszukiwanie w sieci obok inferencji tekstu. OpenClaw klasyfikuje to jako
    Plugin **hybrid-capability** — zalecany wzorzec dla Pluginów firmowych
    (jeden Plugin na dostawcę). Zobacz
    [Internals: Capability Ownership](/pl/plugins/architecture#capability-ownership-model).

    Zarejestruj każdą możliwość wewnątrz `register(api)` obok istniejącego wywołania
    `api.registerProvider(...)`. Wybierz tylko potrzebne karty:

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

        Używaj `assertOkOrThrowProviderError(...)` w przypadku błędów HTTP dostawcy, aby
        pluginy współdzieliły ograniczone odczyty treści błędów, parsowanie błędów JSON oraz
        sufiksy identyfikatorów żądań.
      </Tab>
      <Tab title="Realtime transcription">
        Preferuj `createRealtimeTranscriptionWebSocketSession(...)` — współdzielony
        helper obsługuje przechwytywanie proxy, opóźnienia ponownego łączenia, opróżnianie przy zamykaniu, uzgadnianie gotowości,
        kolejkowanie audio oraz diagnostykę zdarzeń zamknięcia. Twój plugin
        tylko mapuje zdarzenia upstream.

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

        Dostawcy wsadowego STT, którzy wysyłają audio multipart metodą POST, powinni używać
        `buildAudioTranscriptionFormData(...)` z
        `openclaw/plugin-sdk/provider-http`. Helper normalizuje nazwy plików przesyłanych danych,
        w tym przesyłane pliki AAC, które wymagają nazwy pliku w stylu M4A dla
        zgodnych API transkrypcji.
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

        Zaimplementuj `handleBargeIn`, gdy transport może wykryć, że człowiek
        przerywa odtwarzanie asystenta, a dostawca obsługuje skracanie lub
        czyszczenie aktywnej odpowiedzi audio.
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
        Funkcje wideo używają kształtu **świadomego trybu**: `generate`,
        `imageToVideo` i `videoToVideo`. Płaskie pola zbiorcze, takie jak
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`, nie
        wystarczają do klarownego deklarowania obsługi trybu transformacji lub wyłączonych trybów.
        Generowanie muzyki działa według tego samego wzorca z jawnymi blokami `generate` /
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

## Referencja kolejności katalogu

`catalog.order` kontroluje, kiedy Twój katalog jest scalany względem wbudowanych
dostawców:

| Kolejność | Kiedy         | Przypadek użycia                                |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Pierwszy przebieg | Prości dostawcy z kluczem API                   |
| `profile` | Po simple     | Dostawcy ograniczeni profilami uwierzytelniania |
| `paired`  | Po profile    | Synteza wielu powiązanych wpisów                |
| `late`    | Ostatni przebieg | Nadpisywanie istniejących dostawców (wygrywa przy kolizji) |

## Następne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli Twój plugin udostępnia także kanał
- [SDK Runtime](/pl/plugins/sdk-runtime) — helpery `api.runtime` (TTS, wyszukiwanie, subagent)
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna referencja importów ścieżek podrzędnych
- [Wnętrze Pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks) — szczegóły hooków i dołączone przykłady

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Tworzenie pluginów kanałów](/pl/plugins/sdk-channel-plugins)
