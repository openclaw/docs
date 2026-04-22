---
read_when:
    - Potrzebujesz referencji konfiguracji modeli dla każdego dostawcy osobno
    - Chcesz przykładowych konfiguracji lub poleceń onboardingu CLI dla dostawców modeli
summary: Przegląd dostawców modeli z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-04-22T04:22:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Dostawcy modeli

Ta strona dotyczy **dostawców LLM/modeli** (a nie kanałów czatu takich jak WhatsApp/Telegram).
Zasady wyboru modeli znajdziesz w [/concepts/models](/pl/concepts/models).

## Szybkie zasady

- Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- Jeśli ustawisz `agents.defaults.models`, stanie się to listą dozwolonych modeli.
- Pomocniki CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Zasady zapasowego działania runtime, sondy cooldown i trwałość nadpisań sesji
  są udokumentowane w [/concepts/model-failover](/pl/concepts/model-failover).
- `models.providers.*.models[].contextWindow` to natywne metadane modelu;
  `models.providers.*.models[].contextTokens` to efektywny limit runtime.
- Pluginy dostawców mogą wstrzykiwać katalogi modeli przez `registerProvider({ catalog })`;
  OpenClaw scala ten wynik z `models.providers` przed zapisaniem
  `models.json`.
- Manifesty dostawców mogą deklarować `providerAuthEnvVars` i
  `providerAuthAliases`, dzięki czemu ogólne sondy uwierzytelniania oparte na zmiennych środowiskowych i warianty dostawców
  nie muszą ładować runtime pluginu. Pozostała mapa zmiennych środowiskowych w core służy teraz
  tylko dostawcom spoza pluginów/core oraz kilku przypadkom ogólnego pierwszeństwa, takich
  jak onboarding Anthropic z kluczem API jako priorytetem.
- Pluginy dostawców mogą też przejąć zachowanie runtime dostawcy przez
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` oraz
  `onModelSelected`.
- Uwaga: runtime `capabilities` dostawcy to współdzielone metadane runnera (rodzina dostawcy,
  osobliwości transkryptu/narzędzi, wskazówki dotyczące transportu/pamięci podręcznej). To nie jest
  to samo co [publiczny model możliwości](/pl/plugins/architecture#public-capability-model),
  który opisuje, co plugin rejestruje (wnioskowanie tekstowe, mowa itd.).
- Dołączony dostawca `codex` jest sparowany z dołączoną uprzężą agenta Codex.
  Używaj `codex/gpt-*`, gdy chcesz logowania zarządzanego przez Codex, wykrywania modeli,
  natywnego wznawiania wątków i wykonania przez serwer aplikacji. Zwykłe referencje `openai/gpt-*`
  nadal używają dostawcy OpenAI i standardowego transportu dostawcy OpenClaw.
  Wdrożenia tylko z Codex mogą wyłączyć automatyczny zapasowy fallback do PI przez
  `agents.defaults.embeddedHarness.fallback: "none"`; zobacz
  [Uprząż Codex](/pl/plugins/codex-harness).

## Zachowanie dostawcy zarządzane przez plugin

Pluginy dostawców mogą teraz przejąć większość logiki specyficznej dla dostawcy, podczas gdy OpenClaw zachowuje
ogólną pętlę wnioskowania.

Typowy podział:

- `auth[].run` / `auth[].runNonInteractive`: dostawca zarządza przepływami onboardingu/logowania
  dla `openclaw onboard`, `openclaw models auth` i konfiguracji bez interakcji
- `wizard.setup` / `wizard.modelPicker`: dostawca zarządza etykietami wyboru uwierzytelniania,
  starszymi aliasami, wskazówkami dotyczącymi listy dozwolonych dla onboardingu oraz wpisami
  konfiguracji w selektorach onboardingu/modeli
- `catalog`: dostawca pojawia się w `models.providers`
- `normalizeModelId`: dostawca normalizuje starsze/poglądowe identyfikatory modeli przed
  wyszukiwaniem lub kanonizacją
- `normalizeTransport`: dostawca normalizuje rodzinę transportu `api` / `baseUrl`
  przed ogólnym składaniem modelu; OpenClaw najpierw sprawdza dopasowanego dostawcę,
  a następnie inne pluginy dostawców obsługujące hooki, aż któryś faktycznie zmieni
  transport
- `normalizeConfig`: dostawca normalizuje konfigurację `models.providers.<id>` zanim
  runtime jej użyje; OpenClaw najpierw sprawdza dopasowanego dostawcę, a następnie inne
  pluginy dostawców obsługujące hooki, aż któryś faktycznie zmieni konfigurację. Jeśli żaden
  hook dostawcy nie przepisze konfiguracji, dołączone helpery rodziny Google nadal
  normalizują obsługiwane wpisy dostawców Google.
- `applyNativeStreamingUsageCompat`: dostawca stosuje przepisania zgodności natywnego użycia strumieniowania sterowane punktami końcowymi dla dostawców konfiguracji
- `resolveConfigApiKey`: dostawca rozwiązuje uwierzytelnianie znacznikami środowiskowymi dla dostawców konfiguracji
  bez wymuszania pełnego ładowania runtime auth. `amazon-bedrock` ma też tutaj
  wbudowany resolver znaczników środowiskowych AWS, mimo że runtime auth Bedrock używa
  domyślnego łańcucha AWS SDK.
- `resolveSyntheticAuth`: dostawca może udostępniać dostępność uwierzytelniania lokalnego/self-hosted lub innego
  opartego na konfiguracji bez utrwalania jawnych sekretów
- `shouldDeferSyntheticProfileAuth`: dostawca może oznaczyć zapisane syntetyczne profile-zastępniki
  jako mające niższy priorytet niż uwierzytelnianie oparte na env/konfiguracji
- `resolveDynamicModel`: dostawca akceptuje identyfikatory modeli, których jeszcze nie ma
  w lokalnym statycznym katalogu
- `prepareDynamicModel`: dostawca wymaga odświeżenia metadanych przed ponowną próbą
  dynamicznego rozwiązania
- `normalizeResolvedModel`: dostawca wymaga przepisania transportu lub bazowego URL
- `contributeResolvedModelCompat`: dostawca dostarcza flagi zgodności dla swoich
  modeli dostawcy nawet wtedy, gdy docierają przez inny kompatybilny transport
- `capabilities`: dostawca publikuje osobliwości transkryptu/narzędzi/rodziny dostawcy
- `normalizeToolSchemas`: dostawca czyści schematy narzędzi, zanim zobaczy je osadzony
  runner
- `inspectToolSchemas`: dostawca ujawnia ostrzeżenia schematów specyficzne dla transportu
  po normalizacji
- `resolveReasoningOutputMode`: dostawca wybiera natywne lub tagowane
  kontrakty wyjścia rozumowania
- `prepareExtraParams`: dostawca ustawia domyślne wartości lub normalizuje parametry żądania dla danego modelu
- `createStreamFn`: dostawca zastępuje zwykłą ścieżkę strumieniowania w pełni
  niestandardowym transportem
- `wrapStreamFn`: dostawca stosuje opakowania zgodności nagłówków/treści/modelu dla żądań
- `resolveTransportTurnState`: dostawca dostarcza natywne nagłówki transportowe
  lub metadane dla poszczególnych tur
- `resolveWebSocketSessionPolicy`: dostawca dostarcza natywne nagłówki sesji WebSocket
  lub politykę cooldown sesji
- `createEmbeddingProvider`: dostawca zarządza zachowaniem embeddingów pamięci, gdy
  należy ono do pluginu dostawcy zamiast do przełącznicy embeddingów core
- `formatApiKey`: dostawca formatuje zapisane profile auth do postaci ciągu runtime
  `apiKey` oczekiwanej przez transport
- `refreshOAuth`: dostawca zarządza odświeżaniem OAuth, gdy współdzielone refreshery `pi-ai`
  nie są wystarczające
- `buildAuthDoctorHint`: dostawca dołącza wskazówki naprawcze, gdy odświeżanie OAuth
  kończy się niepowodzeniem
- `matchesContextOverflowError`: dostawca rozpoznaje błędy przepełnienia okna kontekstu
  specyficzne dla dostawcy, które ogólne heurystyki mogłyby przeoczyć
- `classifyFailoverReason`: dostawca mapuje surowe błędy transportu/API specyficzne dla dostawcy
  na powody przełączenia awaryjnego, takie jak limit szybkości lub przeciążenie
- `isCacheTtlEligible`: dostawca decyduje, które nadrzędne identyfikatory modeli obsługują TTL pamięci podręcznej promptów
- `buildMissingAuthMessage`: dostawca zastępuje ogólny błąd magazynu auth
  wskazówką odzyskiwania specyficzną dla dostawcy
- `suppressBuiltInModel`: dostawca ukrywa nieaktualne wiersze upstream i może zwrócić
  błąd zarządzany przez dostawcę przy bezpośrednich niepowodzeniach rozwiązania
- `augmentModelCatalog`: dostawca dołącza syntetyczne/końcowe wiersze katalogu po
  wykryciu i scaleniu konfiguracji
- `resolveThinkingProfile`: dostawca zarządza dokładnym zestawem poziomów `/think`,
  opcjonalnymi etykietami wyświetlania i domyślnym poziomem dla wybranego modelu
- `isBinaryThinking`: hook zgodności dla binarnego UX myślenia włącz/wyłącz
- `supportsXHighThinking`: hook zgodności dla wybranych modeli `xhigh`
- `resolveDefaultThinkingLevel`: hook zgodności dla domyślnej polityki `/think`
- `applyConfigDefaults`: dostawca stosuje globalne wartości domyślne specyficzne dla dostawcy
  podczas materializacji konfiguracji na podstawie trybu auth, env lub rodziny modeli
- `isModernModelRef`: dostawca zarządza dopasowaniem preferowanego modelu live/smoke
- `prepareRuntimeAuth`: dostawca przekształca skonfigurowane dane uwierzytelniające w krótkożyjący
  token runtime
- `resolveUsageAuth`: dostawca rozwiązuje dane uwierzytelniające użycia/limitów dla `/usage`
  i powiązanych powierzchni statusu/raportowania
- `fetchUsageSnapshot`: dostawca zarządza pobieraniem/parsowaniem punktu końcowego użycia, podczas gdy
  core nadal zarządza powłoką podsumowania i formatowaniem
- `onModelSelected`: dostawca uruchamia efekty uboczne po wyborze modelu, takie jak
  telemetria lub zarządzanie sesją po stronie dostawcy

Aktualne dołączone przykłady:

- `anthropic`: zapasowy fallback zgodny wprzód dla Claude 4.6, wskazówki naprawy uwierzytelniania, pobieranie
  punktu końcowego użycia, metadane cache-TTL/rodziny dostawcy oraz globalne
  domyślne ustawienia konfiguracji świadome uwierzytelniania
- `amazon-bedrock`: dopasowywanie przepełnienia kontekstu zarządzane przez dostawcę i klasyfikacja
  powodów failover dla specyficznych dla Bedrock błędów throttle/not-ready, plus
  współdzielona rodzina odtwarzania `anthropic-by-model` dla guardów polityki odtwarzania
  tylko dla Claude na ruchu Anthropic
- `anthropic-vertex`: guardy polityki odtwarzania tylko dla Claude na ruchu
  komunikatów Anthropic
- `openrouter`: identyfikatory modeli przekazywane bez zmian, opakowania żądań, wskazówki dotyczące możliwości dostawcy,
  sanityzacja sygnatury myślenia Gemini na proxyowanym ruchu Gemini, wstrzykiwanie
  rozumowania proxy przez rodzinę strumieni `openrouter-thinking`, przekazywanie
  metadanych routingu oraz polityka cache-TTL
- `github-copilot`: onboarding/logowanie urządzenia, zapasowy fallback modeli zgodny wprzód,
  wskazówki transkryptu dla Claude-thinking, wymiana tokenów runtime i pobieranie
  punktu końcowego użycia
- `openai`: zapasowy fallback zgodny wprzód dla GPT-5.4, bezpośrednia normalizacja
  transportu OpenAI, wskazówki brakującego uwierzytelniania świadome Codex, tłumienie Spark,
  syntetyczne wiersze katalogu OpenAI/Codex, polityka thinking/live-model, normalizacja aliasów tokenów użycia
  (`input` / `output` oraz rodziny `prompt` / `completion`), współdzielona
  rodzina strumieni `openai-responses-defaults` dla natywnych opakowań OpenAI/Codex,
  metadane rodziny dostawcy, rejestracja dołączonego dostawcy generowania obrazów
  dla `gpt-image-2` oraz dołączona rejestracja dostawcy generowania wideo
  dla `sora-2`
- `google` i `google-gemini-cli`: zapasowy fallback zgodny wprzód dla Gemini 3.1,
  natywna walidacja odtwarzania Gemini, sanityzacja odtwarzania bootstrap,
  tagowany tryb wyjścia rozumowania, dopasowywanie nowoczesnych modeli, dołączona rejestracja dostawcy generowania obrazów
  dla modeli Gemini image-preview oraz dołączona
  rejestracja dostawcy generowania wideo dla modeli Veo; OAuth Gemini CLI zarządza też
  formatowaniem tokenów profilu uwierzytelniania, parsowaniem tokenów użycia oraz pobieraniem
  punktu końcowego limitów dla powierzchni użycia
- `moonshot`: współdzielony transport, normalizacja ładunku thinking zarządzana przez plugin
- `kilocode`: współdzielony transport, nagłówki żądań zarządzane przez plugin, normalizacja ładunku rozumowania,
  sanityzacja sygnatury myślenia proxy-Gemini i polityka cache-TTL
- `zai`: zapasowy fallback zgodny wprzód dla GLM-5, domyślne `tool_stream`, polityka cache-TTL,
  polityka binarnego thinking/live-model oraz uwierzytelnianie użycia + pobieranie limitów;
  nieznane identyfikatory `glm-5*` są syntetyzowane z dołączonego szablonu `glm-4.7`
- `xai`: natywna normalizacja transportu Responses, przepisywanie aliasów `/fast` dla
  szybkich wariantów Grok, domyślne `tool_stream`, czyszczenie schematu narzędzi /
  ładunku rozumowania specyficzne dla xAI oraz dołączona rejestracja dostawcy generowania wideo
  dla `grok-imagine-video`
- `mistral`: metadane możliwości zarządzane przez plugin
- `opencode` i `opencode-go`: metadane możliwości zarządzane przez plugin plus
  sanityzacja sygnatury myślenia proxy-Gemini
- `alibaba`: katalog generowania wideo zarządzany przez plugin dla bezpośrednich referencji modeli Wan
  takich jak `alibaba/wan2.6-t2v`
- `byteplus`: katalogi zarządzane przez plugin plus dołączona rejestracja dostawcy generowania wideo
  dla modeli Seedance text-to-video/image-to-video
- `fal`: dołączona rejestracja dostawcy generowania wideo dla hostowanych modeli innych firm,
  rejestracja dostawcy generowania obrazów dla modeli obrazów FLUX oraz dołączona
  rejestracja dostawcy generowania wideo dla hostowanych modeli wideo innych firm
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` i `volcengine`:
  tylko katalogi zarządzane przez plugin
- `qwen`: katalogi zarządzane przez plugin dla modeli tekstowych plus współdzielone
  rejestracje dostawców rozumienia multimediów i generowania wideo dla jego
  powierzchni multimodalnych; generowanie wideo Qwen używa standardowych punktów końcowych DashScope video
  z dołączonymi modelami Wan, takimi jak `wan2.6-t2v` i `wan2.7-r2v`
- `runway`: rejestracja dostawcy generowania wideo zarządzana przez plugin dla natywnych modeli Runway
  opartych na zadaniach, takich jak `gen4.5`
- `minimax`: katalogi zarządzane przez plugin, dołączona rejestracja dostawcy generowania wideo
  dla modeli wideo Hailuo, dołączona rejestracja dostawcy generowania obrazów
  dla `image-01`, hybrydowy wybór polityki odtwarzania Anthropic/OpenAI oraz logika uwierzytelniania/użycia snapshotów
- `together`: katalogi zarządzane przez plugin plus dołączona rejestracja dostawcy generowania wideo
  dla modeli wideo Wan
- `xiaomi`: katalogi zarządzane przez plugin plus logika uwierzytelniania/użycia snapshotów

Dołączony plugin `openai` zarządza teraz oboma identyfikatorami dostawców: `openai` i
`openai-codex`.

To obejmuje dostawców, którzy nadal mieszczą się w zwykłych transportach OpenClaw. Dostawca,
który potrzebuje całkowicie niestandardowego wykonawcy żądań, to osobna, głębsza powierzchnia rozszerzeń.

## Rotacja kluczy API

- Obsługuje ogólną rotację dostawców dla wybranych dostawców.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie live, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielona przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz główny)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)
- Dla dostawców Google jako zapasowy uwzględniany jest także `GOOGLE_API_KEY`.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.
- Żądania są ponawiane z następnym kluczem tylko przy odpowiedziach z limitem szybkości (na
  przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` lub okresowych komunikatach o limicie użycia).
- Błędy inne niż limity szybkości kończą się natychmiast; nie podejmuje się rotacji kluczy.
- Gdy wszystkie kandydackie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi‑ai. Ci dostawcy **nie wymagają**
konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, zapasowo SSE)
- Nadpisz dla modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewanie OpenAI Responses WebSocket jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` na `api.openai.com`
- Użyj `params.serviceTier`, gdy chcesz jawny poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są stosowane tylko przy natywnym ruchu OpenAI do `api.openai.com`, a nie
  do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują także `store` dla Responses, wskazówki pamięci podręcznej promptów oraz
  kształtowanie ładunku zgodności rozumowania OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo tłumiony w OpenClaw, ponieważ API OpenAI live je odrzuca; Spark jest traktowany jako tylko dla Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Dostawca: `anthropic`
- Uwierzytelnianie: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują także współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniany kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dozwolone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Token konfiguracyjny Anthropic pozostaje dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Dostawca: `openai-codex`
- Uwierzytelnianie: OAuth (ChatGPT)
- Przykładowy model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` lub `openclaw models auth login --provider openai-codex`
- Domyślny transport to `auto` (najpierw WebSocket, zapasowo SSE)
- Nadpisz dla modelu przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest także przekazywane przy natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są dołączane tylko do natywnego ruchu Codex do
  `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` pozostaje dostępny, gdy katalog OAuth Codex go udostępnia; zależne od uprawnień
- `openai-codex/gpt-5.4` zachowuje natywne `contextWindow = 1050000` i domyślne runtime `contextTokens = 272000`; nadpisz limit runtime przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca polityki: OAuth OpenAI Codex jest jawnie obsługiwane dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Inne hostowane opcje w stylu subskrypcyjnym

- [Qwen Cloud](/pl/providers/qwen): powierzchnia dostawcy Qwen Cloud plus mapowanie punktów końcowych Alibaba DashScope i Coding Plan
- [MiniMax](/pl/providers/minimax): dostęp do MiniMax Coding Plan przez OAuth lub klucz API
- [GLM Models](/pl/providers/glm): Z.AI Coding Plan lub ogólne punkty końcowe API

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`)
- Dostawca runtime Zen: `opencode`
- Dostawca runtime Go: `opencode-go`
- Przykładowe modele: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (klucz API)

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY`
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, zapasowy `GOOGLE_API_KEY` i `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Bezpośrednie uruchomienia Gemini akceptują także `agents.defaults.models["google/<model>"].params.cachedContent`
  (lub starsze `cached_content`) do przekazania natywnego dla dostawcy
  uchwytu `cachedContents/...`; trafienia pamięci podręcznej Gemini są widoczne jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów firm trzecich. Przed kontynuacją zapoznaj się z warunkami Google i użyj konta niekrytycznego, jeśli zdecydujesz się przejść dalej.
- OAuth Gemini CLI jest dostarczany jako część dołączonego pluginu `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
  - Uwaga: **nie** wklejasz client id ani sekretu do `openclaw.json`. Przepływ logowania CLI zapisuje
    tokeny w profilach uwierzytelniania na hoście Gateway.
  - Jeśli żądania kończą się niepowodzeniem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway.
  - Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie wraca zapasowo do
    `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` są normalizowane do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają konkretną powierzchnię

### Vercel AI Gateway

- Dostawca: `vercel-ai-gateway`
- Uwierzytelnianie: `AI_GATEWAY_API_KEY`
- Przykładowe modele: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Dostawca: `kilocode`
- Uwierzytelnianie: `KILOCODE_API_KEY`
- Przykładowy model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny zapasowy katalog zawiera `kilocode/kilo/auto`; wykrywanie live z
  `https://api.kilo.ai/api/gateway/models` może dalej rozszerzać katalog
  runtime.
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway,
  nie jest zakodowany na stałe w OpenClaw.

Szczegóły konfiguracji znajdziesz w [/providers/kilocode](/pl/providers/kilocode).

### Inne dołączone pluginy dostawców

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Przykładowe modele: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- OpenClaw stosuje udokumentowane nagłówki atrybucji aplikacji OpenRouter tylko wtedy, gdy
  żądanie faktycznie trafia do `openrouter.ai`
- Znaczniki `cache_control` specyficzne dla Anthropic w OpenRouter są podobnie ograniczone do
  zweryfikowanych tras OpenRouter, a nie dowolnych adresów proxy
- OpenRouter pozostaje na ścieżce proxy w stylu zgodnym z OpenAI, więc natywne
  kształtowanie żądań tylko dla OpenAI (`serviceTier`, `store` dla Responses,
  wskazówki pamięci podręcznej promptów, ładunki zgodności rozumowania OpenAI) nie jest przekazywane
- Referencje OpenRouter oparte na Gemini zachowują tylko sanityzację sygnatury myślenia proxy-Gemini;
  natywna walidacja odtwarzania Gemini i przepisania bootstrap pozostają wyłączone
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Przykładowy model: `kilocode/kilo/auto`
- Referencje Kilo oparte na Gemini zachowują tę samą ścieżkę sanityzacji sygnatury myślenia proxy-Gemini;
  wskazówki `kilocode/kilo/auto` i inne wskazówki nieobsługujące rozumowania proxy
  pomijają wstrzykiwanie rozumowania proxy
- MiniMax: `minimax` (klucz API) i `minimax-portal` (OAuth)
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`
- Przykładowy model: `minimax/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7`
- Konfiguracja onboardingu/klucza API MiniMax zapisuje jawne definicje modeli M2.7 z
  `input: ["text", "image"]`; dołączony katalog dostawcy zachowuje referencje czatu
  jako tylko tekstowe, dopóki ta konfiguracja dostawcy nie zostanie zmaterializowana
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Przykładowy model: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` lub `KIMICODE_API_KEY`)
- Przykładowy model: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Przykładowy model: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` lub `DASHSCOPE_API_KEY`)
- Przykładowy model: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Przykładowy model: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Przykładowe modele: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Przykładowy model: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Przykładowy model: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Przykładowy model: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Przykładowy model: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Natywne dołączone żądania xAI używają ścieżki xAI Responses
  - `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`,
    `grok-4` i `grok-4-0709` na ich warianty `*-fast`
  - `tool_stream` jest domyślnie włączone; ustaw
    `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
    to wyłączyć
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Przykładowy model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modele GLM w Cerebras używają identyfikatorów `zai-glm-4.7` i `zai-glm-4.6`.
  - Bazowy URL zgodny z OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Przykładowy model Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Zobacz [Hugging Face (Inference)](/pl/providers/huggingface).

## Dostawcy przez `models.providers` (niestandardowy/base URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców lub
proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych pluginów dostawców publikuje już domyślny katalog.
Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać
domyślny bazowy URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony plugin dostawcy. Domyślnie używaj wbudowanego dostawcy,
a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy
musisz nadpisać bazowy URL lub metadane modelu:

- Dostawca: `moonshot`
- Uwierzytelnianie: `MOONSHOT_API_KEY`
- Przykładowy model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` lub `openclaw onboard --auth-choice moonshot-api-key-cn`

Identyfikatory modeli Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding używa punktu końcowego zgodnego z Anthropic od Moonshot AI:

- Dostawca: `kimi`
- Uwierzytelnianie: `KIMI_API_KEY`
- Przykładowy model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Starszy `kimi/k2p5` pozostaje akceptowany jako identyfikator modelu zgodności.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) zapewnia dostęp do Doubao i innych modeli w Chinach.

- Dostawca: `volcengine` (kodowanie: `volcengine-plan`)
- Uwierzytelnianie: `VOLCANO_ENGINE_API_KEY`
- Przykładowy model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding domyślnie używa powierzchni coding, ale ogólny katalog `volcengine/*`
jest rejestrowany jednocześnie.

W selektorach modeli onboarding/configure wybór uwierzytelniania Volcengine preferuje zarówno
wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty
selektor ograniczony do dostawcy.

Dostępne modele:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modele coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (międzynarodowy)

BytePlus ARK zapewnia międzynarodowym użytkownikom dostęp do tych samych modeli co Volcano Engine.

- Dostawca: `byteplus` (coding: `byteplus-plan`)
- Uwierzytelnianie: `BYTEPLUS_API_KEY`
- Przykładowy model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding domyślnie używa powierzchni coding, ale ogólny katalog `byteplus/*`
jest rejestrowany jednocześnie.

W selektorach modeli onboarding/configure wybór uwierzytelniania BytePlus preferuje zarówno
wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty
selektor ograniczony do dostawcy.

Dostępne modele:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modele coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic udostępnia modele zgodne z Anthropic za dostawcą `synthetic`:

- Dostawca: `synthetic`
- Uwierzytelnianie: `SYNTHETIC_API_KEY`
- Przykładowy model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax jest konfigurowany przez `models.providers`, ponieważ używa niestandardowych punktów końcowych:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Klucz API MiniMax (Global): `--auth-choice minimax-global-api`
- Klucz API MiniMax (CN): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub
  `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji znajdziesz w [/providers/minimax](/pl/providers/minimax).

Na ścieżce strumieniowania MiniMax zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking,
chyba że ustawisz je jawnie, a `/fast on` przepisuje
`MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział możliwości zarządzanych przez plugin:

- Domyślne ustawienia tekstu/czatu pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to zarządzany przez plugin `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje przy identyfikatorze dostawcy `minimax`

### LM Studio

LM Studio jest dostarczane jako dołączony plugin dostawcy, który używa natywnego API:

- Dostawca: `lmstudio`
- Uwierzytelnianie: `LM_API_TOKEN`
- Domyślny bazowy URL wnioskowania: `http://localhost:1234/v1`

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw używa natywnych punktów końcowych LM Studio `/api/v1/models` i `/api/v1/models/load`
do wykrywania i automatycznego ładowania, a domyślnie używa `/v1/chat/completions` do wnioskowania.
Szczegóły konfiguracji i rozwiązywania problemów znajdziesz w [/providers/lmstudio](/pl/providers/lmstudio).

### Ollama

Ollama jest dostarczana jako dołączony plugin dostawcy i używa natywnego API Ollama:

- Dostawca: `ollama`
- Uwierzytelnianie: nie jest wymagane (serwer lokalny)
- Przykładowy model: `ollama/llama3.3`
- Instalacja: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama jest wykrywana lokalnie pod adresem `http://127.0.0.1:11434`, gdy włączysz ją przez
`OLLAMA_API_KEY`, a dołączony plugin dostawcy dodaje Ollama bezpośrednio do
`openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama),
aby poznać onboarding, tryb chmurowy/lokalny i konfigurację niestandardową.

### vLLM

vLLM jest dostarczany jako dołączony plugin dostawcy dla lokalnych/self-hosted serwerów
zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli twój serwer nie wymusza uwierzytelniania):

```bash
export VLLM_API_KEY="vllm-local"
```

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/vllm](/pl/providers/vllm).

### SGLang

SGLang jest dostarczany jako dołączony plugin dostawcy dla szybkich self-hosted
serwerów zgodnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli twój serwer nie
wymusza uwierzytelniania):

```bash
export SGLANG_API_KEY="sglang-local"
```

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/sglang](/pl/providers/sglang).

### Lokalne proxy (LM Studio, vLLM, LiteLLM itp.)

Przykład (zgodny z OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Uwagi:

- Dla dostawców niestandardowych `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne.
  Gdy zostaną pominięte, OpenClaw domyślnie używa:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecane: ustaw jawne wartości zgodne z limitami twojego proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych punktach końcowych (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 od dostawcy dla nieobsługiwanych ról `developer`.
- Trasy proxy zgodne z OpenAI pomijają także natywne kształtowanie żądań tylko dla OpenAI:
  brak `service_tier`, brak `store` dla Responses, brak wskazówek pamięci podręcznej promptów, brak
  kształtowania ładunku zgodności rozumowania OpenAI i brak ukrytych nagłówków atrybucji OpenClaw.
- Jeśli `baseUrl` jest puste/pominięte, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
- Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` jest nadal nadpisywane na nienatywnych punktach końcowych `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz też: [/gateway/configuration](/pl/gateway/configuration), aby zapoznać się z pełnymi przykładami konfiguracji.

## Powiązane

- [Modele](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Failover modeli](/pl/concepts/model-failover) — łańcuchy fallback i zachowanie ponawiania
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
- [Dostawcy](/pl/providers) — przewodniki konfiguracji dla poszczególnych dostawców
