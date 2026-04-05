---
read_when:
    - Potrzebujesz dokumentacji konfiguracji modeli dla poszczególnych dostawców
    - Chcesz zobaczyć przykładowe konfiguracje lub polecenia CLI do onboardingu dostawców modeli
summary: Przegląd dostawców modeli z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-04-05T13:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# Dostawcy modeli

Ta strona dotyczy **dostawców LLM/modeli** (a nie kanałów czatu takich jak WhatsApp/Telegram).
Zasady wyboru modeli znajdziesz w [/concepts/models](/concepts/models).

## Szybkie zasady

- Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- Jeśli ustawisz `agents.defaults.models`, stanie się to listą dozwolonych.
- Pomocniki CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Zapasowe reguły środowiska uruchomieniowego, sondy cooldown i utrwalanie nadpisań sesji są
  opisane w [/concepts/model-failover](/concepts/model-failover).
- `models.providers.*.models[].contextWindow` to natywne metadane modelu;
  `models.providers.*.models[].contextTokens` to efektywny limit środowiska uruchomieniowego.
- Pluginy dostawców mogą wstrzykiwać katalogi modeli przez `registerProvider({ catalog })`;
  OpenClaw scala te dane do `models.providers` przed zapisaniem
  `models.json`.
- Manifesty dostawców mogą deklarować `providerAuthEnvVars`, dzięki czemu ogólne sondy
  uwierzytelniania opartego na env nie muszą ładować środowiska uruchomieniowego pluginu. Pozostała mapą zmiennych env w rdzeniu
  jest teraz tylko dla dostawców niebędących pluginami / dostawców rdzeniowych oraz kilku przypadków
  ogólnego pierwszeństwa, takich jak onboarding Anthropic z kluczem API jako pierwszym wyborem.
- Pluginy dostawców mogą też przejąć zachowanie środowiska uruchomieniowego dostawcy przez
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
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` oraz
  `onModelSelected`.
- Uwaga: środowiskowe `capabilities` dostawcy to współdzielone metadane runnera (rodzina dostawcy,
  specyfika transkryptu/narzędzi, wskazówki transportu/cache). To nie jest to samo co [publiczny model możliwości](/plugins/architecture#public-capability-model),
  który opisuje, co rejestruje plugin (wnioskowanie tekstowe, mowa itd.).

## Zachowanie dostawcy należące do pluginu

Pluginy dostawców mogą teraz przejąć większość logiki specyficznej dla dostawcy, podczas gdy OpenClaw zachowuje
ogólną pętlę wnioskowania.

Typowy podział:

- `auth[].run` / `auth[].runNonInteractive`: dostawca kontroluje przepływy onboarding/login
  dla `openclaw onboard`, `openclaw models auth` i konfiguracji bezgłowej
- `wizard.setup` / `wizard.modelPicker`: dostawca kontroluje etykiety wyboru uwierzytelniania,
  starsze aliasy, wskazówki listy dozwolonych dla onboardingu oraz wpisy konfiguracji w selektorach onboarding/model
- `catalog`: dostawca pojawia się w `models.providers`
- `normalizeModelId`: dostawca normalizuje starsze/podglądowe ID modeli przed
  wyszukaniem lub kanonizacją
- `normalizeTransport`: dostawca normalizuje rodzinę transportu `api` / `baseUrl`
  przed ogólnym składaniem modelu; OpenClaw najpierw sprawdza dopasowanego dostawcę,
  potem inne pluginy dostawców obsługujące hooki, aż jeden faktycznie zmieni
  transport
- `normalizeConfig`: dostawca normalizuje konfigurację `models.providers.<id>` zanim
  środowisko uruchomieniowe jej użyje; OpenClaw najpierw sprawdza dopasowanego dostawcę, potem inne
  pluginy dostawców obsługujące hooki, aż jeden faktycznie zmieni konfigurację. Jeśli żaden
  hook dostawcy nie przepisze konfiguracji, bundlowane pomocniki rodziny Google nadal
  normalizują obsługiwane wpisy dostawców Google.
- `applyNativeStreamingUsageCompat`: dostawca stosuje zgodnościowe przepisania użycia natywnego streamingu zależne od endpointu dla dostawców konfiguracyjnych
- `resolveConfigApiKey`: dostawca rozwiązuje uwierzytelnianie env-marker dla dostawców konfiguracyjnych
  bez wymuszania pełnego ładowania środowiska uruchomieniowego uwierzytelniania. `amazon-bedrock` ma też
  wbudowany resolver env-marker AWS, mimo że uwierzytelnianie środowiska uruchomieniowego Bedrock używa
  domyślnego łańcucha AWS SDK.
- `resolveSyntheticAuth`: dostawca może ujawniać dostępność lokalnego/self-hosted lub innego
  uwierzytelniania opartego na konfiguracji bez utrwalania sekretów w jawnym tekście
- `shouldDeferSyntheticProfileAuth`: dostawca może oznaczyć zapisane syntetyczne placeholdery profili
  jako mające niższe pierwszeństwo niż uwierzytelnianie oparte na env/konfiguracji
- `resolveDynamicModel`: dostawca akceptuje ID modeli, których jeszcze nie ma w lokalnym
  statycznym katalogu
- `prepareDynamicModel`: dostawca wymaga odświeżenia metadanych przed ponowną próbą
  dynamicznego rozpoznania
- `normalizeResolvedModel`: dostawca wymaga przepisania transportu lub base URL
- `contributeResolvedModelCompat`: dostawca wnosi flagi zgodności dla swoich
  modeli producenta nawet wtedy, gdy docierają przez inny kompatybilny transport
- `capabilities`: dostawca publikuje specyfikę transkryptu/narzędzi/rodziny dostawcy
- `normalizeToolSchemas`: dostawca czyści schematy narzędzi, zanim osadzony
  runner je zobaczy
- `inspectToolSchemas`: dostawca pokazuje ostrzeżenia o schematach specyficzne dla transportu
  po normalizacji
- `resolveReasoningOutputMode`: dostawca wybiera natywne lub otagowane
  kontrakty wyjścia reasoning
- `prepareExtraParams`: dostawca ustawia wartości domyślne lub normalizuje parametry żądania dla modelu
- `createStreamFn`: dostawca zastępuje zwykłą ścieżkę streamingu całkowicie
  niestandardowym transportem
- `wrapStreamFn`: dostawca stosuje opakowania zgodności nagłówków/treści/modelu żądania
- `resolveTransportTurnState`: dostawca dostarcza natywne nagłówki lub metadane transportu
  dla każdej tury
- `resolveWebSocketSessionPolicy`: dostawca dostarcza natywne nagłówki sesji WebSocket
  lub zasady cooldown sesji
- `createEmbeddingProvider`: dostawca kontroluje zachowanie embeddingów memory, gdy
  powinno należeć do pluginu dostawcy zamiast do przełącznika embeddingów w rdzeniu
- `formatApiKey`: dostawca formatuje zapisane profile uwierzytelniania do postaci
  ciągu `apiKey` oczekiwanego przez transport
- `refreshOAuth`: dostawca kontroluje odświeżanie OAuth, gdy współdzielone
  refreshery `pi-ai` nie wystarczają
- `buildAuthDoctorHint`: dostawca dopisuje wskazówki naprawcze, gdy odświeżanie OAuth
  się nie powiedzie
- `matchesContextOverflowError`: dostawca rozpoznaje błędy przepełnienia okna kontekstu
  specyficzne dla dostawcy, których ogólna heurystyka mogłaby nie wykryć
- `classifyFailoverReason`: dostawca mapuje specyficzne dla dostawcy surowe błędy transportu/API
  na przyczyny failover, takie jak limit szybkości lub przeciążenie
- `isCacheTtlEligible`: dostawca decyduje, które ID modeli upstream obsługują TTL pamięci podręcznej promptów
- `buildMissingAuthMessage`: dostawca zastępuje ogólny błąd magazynu uwierzytelniania
  wskazówką naprawczą specyficzną dla dostawcy
- `suppressBuiltInModel`: dostawca ukrywa nieaktualne wiersze upstream i może zwrócić
  błąd należący do producenta przy bezpośrednim niepowodzeniu rozpoznania
- `augmentModelCatalog`: dostawca dopisuje syntetyczne/końcowe wiersze katalogu po
  wykryciu i scaleniu konfiguracji
- `isBinaryThinking`: dostawca kontroluje UX myślenia binarnego włącz/wyłącz
- `supportsXHighThinking`: dostawca włącza `xhigh` dla wybranych modeli
- `resolveDefaultThinkingLevel`: dostawca kontroluje domyślne zasady `/think` dla
  rodziny modeli
- `applyConfigDefaults`: dostawca stosuje globalne wartości domyślne specyficzne dla dostawcy
  podczas materializacji konfiguracji na podstawie trybu uwierzytelniania, env lub rodziny modeli
- `isModernModelRef`: dostawca kontroluje dopasowanie preferowanych modeli live/smoke
- `prepareRuntimeAuth`: dostawca zamienia skonfigurowane poświadczenie na krótkożyjący
  token środowiska uruchomieniowego
- `resolveUsageAuth`: dostawca rozwiązuje poświadczenia użycia/kwot dla `/usage`
  i powiązanych powierzchni statusu/raportowania
- `fetchUsageSnapshot`: dostawca kontroluje pobieranie/parsowanie endpointu użycia, podczas gdy
  rdzeń nadal kontroluje powłokę podsumowania i formatowanie
- `onModelSelected`: dostawca uruchamia efekty uboczne po wyborze modelu, takie jak
  telemetria lub księgowanie sesji należące do dostawcy

Obecne bundlowane przykłady:

- `anthropic`: zapasowa zgodność do przodu Claude 4.6, wskazówki naprawy uwierzytelniania, pobieranie
  endpointu użycia, metadane cache-TTL/rodziny dostawcy i globalne wartości domyślne
  zależne od uwierzytelniania
- `amazon-bedrock`: dopasowywanie przepełnienia kontekstu należące do dostawcy i klasyfikacja
  przyczyn failover dla błędów throttling/not-ready specyficznych dla Bedrock, plus
  współdzielona rodzina powtórek `anthropic-by-model` dla ochrony zasad replay tylko dla Claude
  na ruchu Anthropic
- `anthropic-vertex`: ochrona zasad replay tylko dla Claude na ruchu
  Anthropic-message
- `openrouter`: przepuszczanie ID modeli, opakowania żądań, wskazówki możliwości dostawcy,
  sanityzacja sygnatur myśli Gemini na ruchu proxy Gemini, wstrzykiwanie reasoning proxy
  przez rodzinę streamingu `openrouter-thinking`, przekazywanie metadanych routingu
  i zasady cache-TTL
- `github-copilot`: onboarding/logowanie urządzenia, zapasowy model zgodny do przodu,
  wskazówki transkryptu Claude-thinking, wymiana tokena środowiska uruchomieniowego i pobieranie
  endpointu użycia
- `openai`: zapasowa zgodność do przodu GPT-5.4, normalizacja bezpośredniego transportu OpenAI,
  wskazówki brakującego uwierzytelniania uwzględniające Codex, tłumienie Spark, syntetyczne
  wiersze katalogu OpenAI/Codex, zasady thinking/live-model, normalizacja aliasów tokenów użycia
  (`input` / `output` oraz rodziny `prompt` / `completion`), współdzielona
  rodzina streamingu `openai-responses-defaults` dla natywnych opakowań OpenAI/Codex
  i metadane rodziny dostawcy
- `google` i `google-gemini-cli`: zapasowa zgodność do przodu Gemini 3.1,
  natywna walidacja replay Gemini, sanityzacja replay bootstrap, otagowany
  tryb wyjścia reasoning i dopasowanie nowoczesnych modeli; Gemini CLI OAuth kontroluje też
  formatowanie tokenów profilu uwierzytelniania, parsowanie tokenów użycia i pobieranie
  endpointu kwot dla powierzchni użycia
- `moonshot`: współdzielony transport, normalizacja ładunku thinking należąca do pluginu
- `kilocode`: współdzielony transport, nagłówki żądań należące do pluginu, normalizacja ładunku reasoning,
  sanityzacja sygnatur myśli proxy-Gemini i zasady cache-TTL
- `zai`: zapasowa zgodność do przodu GLM-5, wartości domyślne `tool_stream`, zasady cache-TTL,
  zasady binary-thinking/live-model oraz uwierzytelnianie użycia + pobieranie kwot;
  nieznane ID `glm-5*` są syntetyzowane z bundlowanego szablonu `glm-4.7`
- `xai`: normalizacja natywnego transportu Responses, przepisania aliasów `/fast` dla
  szybkich wariantów Grok, domyślne `tool_stream` oraz czyszczenie schematów narzędzi /
  ładunku reasoning specyficzne dla xAI
- `mistral`: metadane możliwości należące do pluginu
- `opencode` i `opencode-go`: metadane możliwości należące do pluginu oraz
  sanityzacja sygnatur myśli proxy-Gemini
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` i `volcengine`: tylko katalogi należące do pluginów
- `qwen`: katalogi należące do pluginu dla modeli tekstowych oraz współdzielone
  rejestracje dostawców media-understanding i video-generation dla jego powierzchni multimodalnych;
  generowanie wideo Qwen używa standardowych endpointów wideo DashScope z bundlowanymi modelami Wan,
  takimi jak `wan2.6-t2v` i `wan2.7-r2v`
- `minimax`: katalogi należące do pluginu, hybrydowy wybór zasad replay Anthropic/OpenAI
  oraz logika uwierzytelniania/migawki użycia
- `xiaomi`: katalogi należące do pluginu oraz logika uwierzytelniania/migawki użycia

Bundlowany plugin `openai` kontroluje teraz oba ID dostawców: `openai` i
`openai-codex`.

To obejmuje dostawców, którzy nadal mieszczą się w zwykłych transportach OpenClaw. Dostawca,
który wymaga całkowicie niestandardowego wykonawcy żądań, jest osobną, głębszą
powierzchnią rozszerzeń.

## Rotacja kluczy API

- Obsługuje ogólną rotację dostawców dla wybranych dostawców.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze aktywne nadpisanie, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz główny)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)
- Dla dostawców Google `GOOGLE_API_KEY` jest też uwzględniany jako fallback.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.
- Żądania są ponawiane z następnym kluczem tylko przy odpowiedziach z limitem szybkości (na
  przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` lub okresowe komunikaty o limicie użycia).
- Błędy niezwiązane z limitem szybkości kończą się natychmiast; rotacja kluczy nie jest podejmowana.
- Gdy wszystkie kandydujące klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi-ai. Ci dostawcy nie wymagają
konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie dla modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewanie WebSocket OpenAI Responses jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania `openai/*` Responses na `service_tier=priority` na `api.openai.com`
- Użyj `params.serviceTier`, gdy chcesz jawny tier zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) mają zastosowanie tylko do natywnego ruchu OpenAI kierowanego do `api.openai.com`, nie do
  ogólnych proxy kompatybilnych z OpenAI
- Natywne trasy OpenAI zachowują też Responses `store`, wskazówki pamięci podręcznej promptów oraz
  kształtowanie ładunków zgodności reasoning OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo tłumiony w OpenClaw, ponieważ aktywne API OpenAI go odrzuca; Spark jest traktowany jako tylko Codex

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
- CLI: `openclaw onboard --auth-choice apiKey` lub `openclaw onboard --auth-choice anthropic-cli`
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniany kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga dotycząca rozliczeń: publiczna dokumentacja Claude Code Anthropic nadal uwzględnia bezpośrednie użycie Claude Code w terminalu w limitach planu Claude. Osobno Anthropic poinformował użytkowników OpenClaw w dniu **4 kwietnia 2026 o 12:00 PT / 20:00 BST**, że ścieżka logowania Claude w **OpenClaw** jest traktowana jako użycie zewnętrznego harnessu i wymaga **Extra Usage** rozliczanego oddzielnie od subskrypcji.
- Token konfiguracji Anthropic jest ponownie dostępny jako starsza/ręczna ścieżka OpenClaw. Używaj go ze świadomością, że Anthropic poinformował użytkowników OpenClaw, iż ta ścieżka wymaga **Extra Usage**.

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
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie dla modelu przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest też przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są dołączane tylko do natywnego ruchu Codex kierowanego do
  `chatgpt.com/backend-api`, nie do ogólnych proxy kompatybilnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` pozostaje dostępny, gdy katalog OAuth Codex go udostępnia; zależy od uprawnień
- `openai-codex/gpt-5.4` zachowuje natywne `contextWindow = 1050000` i domyślne środowiskowe `contextTokens = 272000`; nadpisz limit środowiska przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca zasad: OpenAI Codex OAuth jest jawnie obsługiwane dla zewnętrznych narzędzi/przepływów pracy takich jak OpenClaw.

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

- [Qwen Cloud](/providers/qwen): powierzchnia dostawcy Qwen Cloud oraz mapowanie endpointów Alibaba DashScope i Coding Plan
- [MiniMax](/providers/minimax): dostęp MiniMax Coding Plan przez OAuth lub klucz API
- [GLM Models](/providers/glm): Z.AI Coding Plan lub ogólne endpointy API

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`)
- Dostawca środowiska uruchomieniowego Zen: `opencode`
- Dostawca środowiska uruchomieniowego Go: `opencode-go`
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
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Bezpośrednie uruchomienia Gemini akceptują też `agents.defaults.models["google/<model>"].params.cachedContent`
  (lub starsze `cached_content`) do przekazania natywnego dla dostawcy
  uchwytu `cachedContents/...`; trafienia pamięci podręcznej Gemini pojawiają się jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: Gemini CLI OAuth w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów zewnętrznych. Przejrzyj warunki Google i użyj niekrytycznego konta, jeśli zdecydujesz się kontynuować.
- Gemini CLI OAuth jest dostarczane jako część bundlowanego pluginu `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model domyślny: `google-gemini-cli/gemini-3.1-pro-preview`
  - Uwaga: **nie** wklejasz client id ani secret do `openclaw.json`. Przepływ logowania CLI zapisuje
    tokeny w profilach uwierzytelniania na hoście gateway.
  - Jeśli żądania nie działają po logowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway.
  - Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie korzysta zapasowo z
    `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` są normalizowane do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają określoną powierzchnię

### Vercel AI Gateway

- Dostawca: `vercel-ai-gateway`
- Uwierzytelnianie: `AI_GATEWAY_API_KEY`
- Przykładowy model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Dostawca: `kilocode`
- Uwierzytelnianie: `KILOCODE_API_KEY`
- Przykładowy model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog fallback zawiera `kilocode/kilo/auto`; aktywne
  wykrywanie `https://api.kilo.ai/api/gateway/models` może dalej rozszerzać katalog
  środowiska uruchomieniowego.
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway,
  a nie jest zakodowany na stałe w OpenClaw.

Szczegóły konfiguracji znajdziesz w [/providers/kilocode](/providers/kilocode).

### Inne bundlowane pluginy dostawców

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Przykładowy model: `openrouter/auto`
- OpenClaw stosuje udokumentowane nagłówki atrybucji aplikacji OpenRouter tylko wtedy, gdy
  żądanie faktycznie trafia do `openrouter.ai`
- Znaczniki `cache_control` Anthropic specyficzne dla OpenRouter również są ograniczone do
  zweryfikowanych tras OpenRouter, a nie dowolnych URL-i proxy
- OpenRouter pozostaje na ścieżce w stylu proxy kompatybilnej z OpenAI, więc natywne
  kształtowanie żądań tylko OpenAI (`serviceTier`, Responses `store`,
  wskazówki pamięci podręcznej promptów, ładunki zgodności reasoning OpenAI) nie jest przekazywane
- Referencje OpenRouter oparte na Gemini zachowują tylko sanityzację sygnatur myśli proxy-Gemini;
  natywna walidacja replay Gemini i przepisania bootstrap pozostają wyłączone
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Przykładowy model: `kilocode/kilo/auto`
- Referencje Kilo oparte na Gemini zachowują tę samą ścieżkę sanityzacji sygnatur myśli
  proxy-Gemini; `kilocode/kilo/auto` i inne wskazówki proxy bez obsługi reasoning
  pomijają wstrzykiwanie reasoning proxy
- MiniMax: `minimax` (klucz API) i `minimax-portal` (OAuth)
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`
- Przykładowy model: `minimax/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7`
- Onboarding MiniMax / konfiguracja klucza API zapisuje jawne definicje modeli M2.7 z
  `input: ["text", "image"]`; bundlowany katalog dostawcy utrzymuje referencje czatu
  tylko tekstowe, dopóki konfiguracja dostawcy nie zostanie zmaterializowana
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Przykładowy model: `moonshot/kimi-k2.5`
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
  - Natywne bundlowane żądania xAI używają ścieżki xAI Responses
  - `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`,
    `grok-4` i `grok-4-0709` na warianty `*-fast`
  - `tool_stream` jest domyślnie włączone; ustaw
    `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
    je wyłączyć
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Przykładowy model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modele GLM w Cerebras używają ID `zai-glm-4.7` i `zai-glm-4.6`.
  - Base URL kompatybilny z OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Przykładowy model Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Zobacz [Hugging Face (Inference)](/providers/huggingface).

## Dostawcy przez `models.providers` (custom/base URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców lub
proxy kompatybilne z OpenAI/Anthropic.

Wiele bundlowanych pluginów dostawców poniżej już publikuje domyślny katalog.
Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać
domyślny base URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako bundlowany plugin dostawcy. Domyślnie używaj wbudowanego dostawcy,
a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy
musisz nadpisać base URL lub metadane modelu:

- Dostawca: `moonshot`
- Uwierzytelnianie: `MOONSHOT_API_KEY`
- Przykładowy model: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` lub `openclaw onboard --auth-choice moonshot-api-key-cn`

ID modeli Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding używa endpointu Moonshot AI kompatybilnego z Anthropic:

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

Starsze `kimi/k2p5` nadal jest akceptowane jako zgodnościowe ID modelu.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) zapewnia dostęp do Doubao i innych modeli w Chinach.

- Dostawca: `volcengine` (coding: `volcengine-plan`)
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
OpenClaw wraca do nieprzefiltrowanego katalogu zamiast pokazywać pusty
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

### BytePlus (International)

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
OpenClaw wraca do nieprzefiltrowanego katalogu zamiast pokazywać pusty
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

Synthetic udostępnia modele kompatybilne z Anthropic za dostawcą `synthetic`:

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

MiniMax jest konfigurowany przez `models.providers`, ponieważ używa niestandardowych endpointów:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub
  `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcji modeli i fragmentów konfiguracji znajdziesz w [/providers/minimax](/providers/minimax).

Na ścieżce streamingu MiniMax kompatybilnej z Anthropic OpenClaw domyślnie wyłącza thinking,
chyba że jawnie go ustawisz, a `/fast on` przepisuje
`MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział możliwości należących do pluginu:

- Domyślne tekst/czat pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazu to należący do pluginu `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje na ID dostawcy `minimax`

### Ollama

Ollama jest dostarczana jako bundlowany plugin dostawcy i używa natywnego API Ollama:

- Dostawca: `ollama`
- Uwierzytelnianie: brak wymagań (serwer lokalny)
- Przykładowy model: `ollama/llama3.3`
- Instalacja: [https://ollama.com/download](https://ollama.com/download)

```bash
# Zainstaluj Ollama, a następnie pobierz model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama jest wykrywana lokalnie pod `http://127.0.0.1:11434`, gdy włączysz ją przez
`OLLAMA_API_KEY`, a bundlowany plugin dostawcy dodaje Ollama bezpośrednio do
`openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/providers/ollama),
aby poznać onboarding, tryb cloud/local i konfigurację niestandardową.

### vLLM

vLLM jest dostarczane jako bundlowany plugin dostawcy dla lokalnych/self-hosted serwerów
kompatybilnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny base URL: `http://127.0.0.1:8000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

```bash
export VLLM_API_KEY="vllm-local"
```

Następnie ustaw model (zastąp jednym z ID zwracanych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/vllm](/providers/vllm).

### SGLang

SGLang jest dostarczany jako bundlowany plugin dostawcy dla szybkich self-hosted
serwerów kompatybilnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny base URL: `http://127.0.0.1:30000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli serwer nie
wymusza uwierzytelniania):

```bash
export SGLANG_API_KEY="sglang-local"
```

Następnie ustaw model (zastąp jednym z ID zwracanych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/sglang](/providers/sglang).

### Lokalne proxy (LM Studio, vLLM, LiteLLM itd.)

Przykład (kompatybilny z OpenAI):

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
        apiKey: "LMSTUDIO_KEY",
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

- Dla niestandardowych dostawców `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne.
  Gdy zostaną pominięte, OpenClaw domyślnie używa:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecane: ustaw jawne wartości zgodne z limitami Twojego proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 od dostawcy dla nieobsługiwanych ról `developer`.
- Trasy proxy kompatybilne z OpenAI pomijają też natywne kształtowanie żądań tylko OpenAI:
  bez `service_tier`, bez Responses `store`, bez wskazówek pamięci podręcznej promptów, bez
  kształtowania ładunków zgodności reasoning OpenAI i bez ukrytych nagłówków
  atrybucji OpenClaw.
- Jeśli `baseUrl` jest pusty lub pominięty, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
- Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na nienatywnych endpointach `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz też: [/gateway/configuration](/gateway/configuration), aby uzyskać pełne przykłady konfiguracji.

## Powiązane

- [Models](/concepts/models) — konfiguracja modeli i aliasy
- [Model Failover](/concepts/model-failover) — łańcuchy fallback i zachowanie ponownych prób
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
- [Providers](/providers) — przewodniki konfiguracji dla poszczególnych dostawców
