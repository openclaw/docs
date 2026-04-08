---
read_when:
    - Potrzebujesz referencji konfiguracji modeli dla poszczególnych dostawców
    - Chcesz zobaczyć przykładowe konfiguracje lub polecenia wdrożeniowe CLI dla dostawców modeli
summary: Przegląd dostawców modeli z przykładowymi konfiguracjami + przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-04-08T06:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 558ac9e34b67fcc3dd6791a01bebc17e1c34152fa6c5611593d681e8cfa532d9
    source_path: concepts/model-providers.md
    workflow: 15
---

# Dostawcy modeli

Ta strona opisuje **dostawców LLM/modeli** (a nie kanały czatu, takie jak WhatsApp/Telegram).
Zasady wyboru modeli znajdziesz na stronie [/concepts/models](/pl/concepts/models).

## Szybkie zasady

- Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- Jeśli ustawisz `agents.defaults.models`, stanie się to listą dozwolonych modeli.
- Narzędzia pomocnicze CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Zasady awaryjne środowiska uruchomieniowego, sondy cooldown oraz trwałość nadpisań sesji
  są udokumentowane na stronie [/concepts/model-failover](/pl/concepts/model-failover).
- `models.providers.*.models[].contextWindow` to natywne metadane modelu;
  `models.providers.*.models[].contextTokens` to efektywny limit środowiska uruchomieniowego.
- Wtyczki dostawców mogą wstrzykiwać katalogi modeli przez `registerProvider({ catalog })`;
  OpenClaw scala to wyjście z `models.providers` przed zapisaniem
  `models.json`.
- Manifesty dostawców mogą deklarować `providerAuthEnvVars`, aby ogólne sondy
  uwierzytelniania oparte na zmiennych środowiskowych nie musiały ładować środowiska uruchomieniowego wtyczki. Pozostała mapowanie zmiennych środowiskowych w rdzeniu
  służy teraz tylko dostawcom spoza wtyczek/z rdzenia oraz kilku przypadkom
  ogólnego priorytetu, takim jak wdrażanie Anthropic z preferencją klucza API.
- Wtyczki dostawców mogą również przejmować zachowanie dostawcy w środowisku uruchomieniowym przez
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, oraz
  `onModelSelected`.
- Uwaga: środowiskowe `capabilities` dostawcy to współdzielone metadane wykonawcy (rodzina dostawcy,
  niuanse transkryptu/narzędzi, wskazówki dotyczące transportu/pamięci podręcznej). To nie jest
  to samo co [publiczny model możliwości](/pl/plugins/architecture#public-capability-model),
  który opisuje, co rejestruje wtyczka (wnioskowanie tekstowe, mowa itd.).

## Zachowanie dostawcy należące do wtyczki

Wtyczki dostawców mogą teraz przejmować większość logiki specyficznej dla dostawcy, podczas gdy OpenClaw zachowuje
ogólną pętlę wnioskowania.

Typowy podział:

- `auth[].run` / `auth[].runNonInteractive`: dostawca odpowiada za przepływy wdrożenia/logowania
  dla `openclaw onboard`, `openclaw models auth` i konfiguracji bezobsługowej
- `wizard.setup` / `wizard.modelPicker`: dostawca odpowiada za etykiety wyboru uwierzytelniania,
  starsze aliasy, wskazówki dotyczące listy dozwolonych modeli podczas wdrażania oraz wpisy konfiguracji w selektorach wdrażania/modeli
- `catalog`: dostawca pojawia się w `models.providers`
- `normalizeModelId`: dostawca normalizuje starsze/poglądowe identyfikatory modeli przed
  wyszukiwaniem lub kanonizacją
- `normalizeTransport`: dostawca normalizuje rodzinę transportu `api` / `baseUrl`
  przed ogólnym składaniem modelu; OpenClaw sprawdza najpierw dopasowanego dostawcę,
  a następnie inne wtyczki dostawców obsługujące hooki, aż jedna rzeczywiście zmieni
  transport
- `normalizeConfig`: dostawca normalizuje konfigurację `models.providers.<id>` zanim
  środowisko uruchomieniowe jej użyje; OpenClaw sprawdza najpierw dopasowanego dostawcę, a potem inne
  wtyczki dostawców obsługujące hooki, aż jedna rzeczywiście zmieni konfigurację. Jeśli żadna
  wtyczka dostawcy nie przepisze konfiguracji, dołączone helpery rodziny Google nadal
  normalizują obsługiwane wpisy dostawców Google.
- `applyNativeStreamingUsageCompat`: dostawca stosuje przepisania zgodności natywnego użycia strumieniowania oparte na punktach końcowych dla dostawców konfiguracyjnych
- `resolveConfigApiKey`: dostawca rozwiązuje uwierzytelnianie znacznikami zmiennych środowiskowych dla dostawców konfiguracyjnych
  bez wymuszania pełnego ładowania uwierzytelniania w środowisku uruchomieniowym. `amazon-bedrock` ma tutaj również
  wbudowany resolver znaczników środowiskowych AWS, mimo że uwierzytelnianie środowiska uruchomieniowego Bedrock korzysta z
  domyślnego łańcucha AWS SDK.
- `resolveSyntheticAuth`: dostawca może ujawniać dostępność uwierzytelniania lokalnego/samohostowanego lub innego
  opartego na konfiguracji bez utrwalania jawnych sekretów
- `shouldDeferSyntheticProfileAuth`: dostawca może oznaczać zapisane syntetyczne profile-zastępniki
  jako niższy priorytet niż uwierzytelnianie oparte na środowisku/konfiguracji
- `resolveDynamicModel`: dostawca akceptuje identyfikatory modeli, których nie ma jeszcze w lokalnym
  statycznym katalogu
- `prepareDynamicModel`: dostawca potrzebuje odświeżenia metadanych przed ponowną próbą
  dynamicznego rozwiązania modelu
- `normalizeResolvedModel`: dostawca wymaga przepisania transportu lub bazowego URL
- `contributeResolvedModelCompat`: dostawca wnosi flagi zgodności dla swoich
  modeli dostawcy, nawet gdy docierają one przez inny zgodny transport
- `capabilities`: dostawca publikuje niuanse transkryptu/narzędzi/rodziny dostawcy
- `normalizeToolSchemas`: dostawca czyści schematy narzędzi, zanim zobaczy je
  osadzony wykonawca
- `inspectToolSchemas`: dostawca ujawnia ostrzeżenia dotyczące schematu specyficzne dla transportu
  po normalizacji
- `resolveReasoningOutputMode`: dostawca wybiera natywne lub tagowane
  kontrakty wyjścia rozumowania
- `prepareExtraParams`: dostawca ustawia domyślnie lub normalizuje parametry żądania dla poszczególnych modeli
- `createStreamFn`: dostawca zastępuje zwykłą ścieżkę strumienia całkowicie
  niestandardowym transportem
- `wrapStreamFn`: dostawca stosuje opakowania zgodności nagłówków/treści/modelu żądania
- `resolveTransportTurnState`: dostawca dostarcza natywne nagłówki lub metadane transportu
  dla poszczególnych tur
- `resolveWebSocketSessionPolicy`: dostawca dostarcza natywne nagłówki sesji WebSocket
  lub politykę cooldown sesji
- `createEmbeddingProvider`: dostawca przejmuje zachowanie osadzeń pamięci, gdy
  należy ono do wtyczki dostawcy zamiast do przełącznika osadzeń rdzenia
- `formatApiKey`: dostawca formatuje zapisane profile uwierzytelniania do postaci
  ciągu `apiKey` oczekiwanego przez transport w środowisku uruchomieniowym
- `refreshOAuth`: dostawca przejmuje odświeżanie OAuth, gdy współdzielone
  mechanizmy odświeżania `pi-ai` nie wystarczają
- `buildAuthDoctorHint`: dostawca dołącza wskazówki naprawcze, gdy odświeżanie OAuth
  kończy się niepowodzeniem
- `matchesContextOverflowError`: dostawca rozpoznaje błędy przepełnienia
  okna kontekstu specyficzne dla dostawcy, których ogólne heurystyki by nie wykryły
- `classifyFailoverReason`: dostawca mapuje surowe błędy transportu/API specyficzne dla dostawcy
  na przyczyny przełączenia awaryjnego, takie jak limit szybkości lub przeciążenie
- `isCacheTtlEligible`: dostawca decyduje, które identyfikatory modeli upstream obsługują TTL pamięci podręcznej promptów
- `buildMissingAuthMessage`: dostawca zastępuje ogólny błąd magazynu uwierzytelniania
  wskazówką odzyskiwania specyficzną dla dostawcy
- `suppressBuiltInModel`: dostawca ukrywa nieaktualne wiersze upstream i może zwrócić
  błąd należący do dostawcy w przypadku bezpośrednich niepowodzeń rozwiązywania
- `augmentModelCatalog`: dostawca dołącza syntetyczne/końcowe wiersze katalogu po
  wykryciu i scaleniu konfiguracji
- `isBinaryThinking`: dostawca przejmuje UX binarnego myślenia włącz/wyłącz
- `supportsXHighThinking`: dostawca włącza wybrane modele do `xhigh`
- `resolveDefaultThinkingLevel`: dostawca przejmuje domyślną politykę `/think` dla
  rodziny modeli
- `applyConfigDefaults`: dostawca stosuje globalne domyślne wartości specyficzne dla dostawcy
  podczas materializacji konfiguracji na podstawie trybu uwierzytelniania, środowiska lub rodziny modeli
- `isModernModelRef`: dostawca przejmuje dopasowywanie preferowanych modeli live/smoke
- `prepareRuntimeAuth`: dostawca zamienia skonfigurowane poświadczenie na krótkożyjący
  token środowiska uruchomieniowego
- `resolveUsageAuth`: dostawca rozwiązuje poświadczenia użycia/limitu dla `/usage`
  i powiązanych powierzchni statusu/raportowania
- `fetchUsageSnapshot`: dostawca przejmuje pobieranie/parsowanie punktu końcowego użycia, podczas gdy
  rdzeń nadal odpowiada za powłokę podsumowania i formatowanie
- `onModelSelected`: dostawca uruchamia skutki uboczne po wyborze modelu, takie jak
  telemetria lub księgowanie sesji należące do dostawcy

Aktualne dołączone przykłady:

- `anthropic`: zgodne w przód przejście awaryjne dla Claude 4.6, wskazówki naprawy uwierzytelniania, pobieranie z
  punktu końcowego użycia, metadane TTL pamięci podręcznej/rodziny dostawcy oraz
  globalne domyślne wartości konfiguracji zależne od uwierzytelniania
- `amazon-bedrock`: należące do dostawcy dopasowywanie przepełnienia kontekstu i klasyfikacja
  przyczyn przełączenia awaryjnego dla specyficznych dla Bedrock błędów throttling/not-ready, plus
  współdzielona rodzina odtwarzania `anthropic-by-model` dla ochrony zasad odtwarzania tylko-Claude
  na ruchu Anthropic
- `anthropic-vertex`: ochrona zasad odtwarzania tylko-Claude na ruchu
  `anthropic-message`
- `openrouter`: przekazywane identyfikatory modeli, opakowania żądań, wskazówki dotyczące możliwości dostawcy,
  sanityzacja sygnatur myślenia Gemini na ruchu proxy Gemini, wstrzykiwanie rozumowania proxy przez rodzinę strumienia `openrouter-thinking`,
  przekazywanie metadanych routingu oraz polityka TTL pamięci podręcznej
- `github-copilot`: wdrażanie/logowanie urządzenia, zgodne w przód przejście awaryjne modeli,
  wskazówki transkryptu myślenia Claude, wymiana tokenów środowiska uruchomieniowego oraz pobieranie z
  punktu końcowego użycia
- `openai`: zgodne w przód przejście awaryjne dla GPT-5.4, bezpośrednia normalizacja transportu OpenAI,
  wskazówki brakującego uwierzytelniania uwzględniające Codex, tłumienie Spark, syntetyczne
  wiersze katalogu OpenAI/Codex, polityka myślenia/modeli live, normalizacja aliasów tokenów użycia
  (`input` / `output` oraz rodziny `prompt` / `completion`), współdzielona rodzina strumienia `openai-responses-defaults`
  dla natywnych opakowań OpenAI/Codex, metadane rodziny dostawcy, dołączona rejestracja dostawcy generowania obrazów
  dla `gpt-image-1` oraz dołączona rejestracja dostawcy generowania wideo
  dla `sora-2`
- `google` i `google-gemini-cli`: zgodne w przód przejście awaryjne dla Gemini 3.1,
  natywna walidacja odtwarzania Gemini, sanityzacja odtwarzania rozruchowego, tagowany
  tryb wyjścia rozumowania, dopasowywanie nowoczesnych modeli, dołączona rejestracja dostawcy generowania obrazów
  dla modeli Gemini image-preview oraz dołączona
  rejestracja dostawcy generowania wideo dla modeli Veo; OAuth Gemini CLI również
  przejmuje formatowanie tokenów profilu uwierzytelniania, parsowanie tokenów użycia oraz pobieranie z
  punktu końcowego limitów dla powierzchni użycia
- `moonshot`: współdzielony transport, normalizacja ładunku myślenia należąca do wtyczki
- `kilocode`: współdzielony transport, nagłówki żądań należące do wtyczki, normalizacja ładunku rozumowania,
  sanityzacja sygnatur myślenia proxy-Gemini oraz polityka TTL pamięci podręcznej
- `zai`: zgodne w przód przejście awaryjne dla GLM-5, domyślne `tool_stream`, polityka TTL pamięci podręcznej,
  polityka binarnego myślenia/modeli live oraz uwierzytelnianie użycia + pobieranie limitów;
  nieznane identyfikatory `glm-5*` są syntetyzowane z dołączonego szablonu `glm-4.7`
- `xai`: natywna normalizacja transportu Responses, przepisania aliasów `/fast` dla
  szybkich wariantów Grok, domyślne `tool_stream`, porządkowanie schematu narzędzi /
  ładunku rozumowania specyficzne dla xAI oraz dołączona rejestracja dostawcy generowania wideo
  dla `grok-imagine-video`
- `mistral`: metadane możliwości należące do wtyczki
- `opencode` i `opencode-go`: metadane możliwości należące do wtyczki oraz
  sanityzacja sygnatur myślenia proxy-Gemini
- `alibaba`: należący do wtyczki katalog generowania wideo dla bezpośrednich referencji modeli Wan
  takich jak `alibaba/wan2.6-t2v`
- `byteplus`: katalogi należące do wtyczki oraz dołączona rejestracja dostawcy generowania wideo
  dla modeli Seedance text-to-video/image-to-video
- `fal`: dołączona rejestracja dostawcy generowania wideo dla hostowanych modeli innych firm
  oraz rejestracja dostawcy generowania obrazów dla modeli FLUX, plus dołączona
  rejestracja dostawcy generowania wideo dla hostowanych modeli wideo innych firm
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` i `volcengine`:
  tylko katalogi należące do wtyczki
- `qwen`: katalogi należące do wtyczki dla modeli tekstowych oraz współdzielone
  rejestracje dostawców rozumienia mediów i generowania wideo dla jego
  powierzchni multimodalnych; generowanie wideo Qwen korzysta ze standardowych punktów końcowych wideo DashScope
  z dołączonymi modelami Wan, takimi jak `wan2.6-t2v` i `wan2.7-r2v`
- `runway`: należąca do wtyczki rejestracja dostawcy generowania wideo dla natywnych
  modeli zadaniowych Runway, takich jak `gen4.5`
- `minimax`: katalogi należące do wtyczki, dołączona rejestracja dostawcy generowania wideo
  dla modeli Hailuo, dołączona rejestracja dostawcy generowania obrazów
  dla `image-01`, hybrydowy wybór zasad odtwarzania Anthropic/OpenAI
  oraz logika uwierzytelniania/migawki użycia
- `together`: katalogi należące do wtyczki oraz dołączona rejestracja dostawcy generowania wideo
  dla modeli wideo Wan
- `xiaomi`: katalogi należące do wtyczki oraz logika uwierzytelniania/migawki użycia

Dołączona wtyczka `openai` obsługuje teraz oba identyfikatory dostawców: `openai` i
`openai-codex`.

To obejmuje dostawców, którzy nadal mieszczą się w zwykłych transportach OpenClaw. Dostawca,
który potrzebuje całkowicie niestandardowego wykonawcy żądań, to osobna, głębsza powierzchnia
rozszerzeń.

## Rotacja kluczy API

- Obsługuje ogólną rotację dostawcy dla wybranych dostawców.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze aktywne nadpisanie, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz podstawowy)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)
- Dla dostawców Google `GOOGLE_API_KEY` jest również uwzględniany jako rozwiązanie awaryjne.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa zduplikowane wartości.
- Żądania są ponawiane z następnym kluczem tylko w odpowiedzi na ograniczenia szybkości
  (na przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` lub okresowe komunikaty o limicie użycia).
- Błędy niezwiązane z limitem szybkości kończą się natychmiastowym niepowodzeniem; nie podejmuje się rotacji kluczy.
- Gdy wszystkie kandydackie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi‑ai. Ci dostawcy nie wymagają
konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, awaryjnie SSE)
- Nadpisanie dla modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewanie WebSocket OpenAI Responses jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` w `api.openai.com`
- Użyj `params.serviceTier`, jeśli chcesz jawnego poziomu zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są stosowane tylko do natywnego ruchu OpenAI do `api.openai.com`, a nie
  do ogólnych serwerów proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują również `store` w Responses, wskazówki pamięci podręcznej promptów oraz
  kształtowanie ładunku zgodności rozumowania OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo ukryty w OpenClaw, ponieważ aktywne API OpenAI go odrzuca; Spark jest traktowany jako tylko-Codex

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
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniony kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Token konfiguracji Anthropic pozostaje dostępną obsługiwaną ścieżką tokena OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

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
- Domyślny transport to `auto` (najpierw WebSocket, awaryjnie SSE)
- Nadpisanie dla modelu przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest również przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są dołączane tylko do natywnego ruchu Codex do
  `chatgpt.com/backend-api`, a nie do ogólnych serwerów proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` pozostaje dostępny, gdy katalog OAuth Codex go ujawnia; zależne od uprawnień
- `openai-codex/gpt-5.4` zachowuje natywne `contextWindow = 1050000` i domyślne środowiskowe `contextTokens = 272000`; nadpisz limit środowiska przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca zasad: OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.

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

- [Qwen Cloud](/pl/providers/qwen): powierzchnia dostawcy Qwen Cloud oraz mapowanie punktów końcowych Alibaba DashScope i Coding Plan
- [MiniMax](/pl/providers/minimax): dostęp OAuth lub kluczem API do MiniMax Coding Plan
- [GLM Models](/pl/providers/glm): Z.AI Coding Plan lub ogólne punkty końcowe API

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
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, rozwiązanie awaryjne `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Bezpośrednie uruchomienia Gemini akceptują również `agents.defaults.models["google/<model>"].params.cachedContent`
  (lub starsze `cached_content`) do przekazania natywnego dla dostawcy
  uchwytu `cachedContents/...`; trafienia pamięci podręcznej Gemini są widoczne jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów innych firm. Zapoznaj się z warunkami Google i użyj niekrytycznego konta, jeśli zdecydujesz się kontynuować.
- OAuth Gemini CLI jest dostarczany jako część dołączonej wtyczki `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
  - Uwaga: **nie** wklejasz identyfikatora klienta ani sekretu do `openclaw.json`. Przepływ logowania CLI zapisuje
    tokeny w profilach uwierzytelniania na hoście bramy.
  - Jeśli żądania nie działają po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście bramy.
  - Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie awaryjnie korzysta z
    `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` są normalizowane do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają określoną powierzchnię

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
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog awaryjny zawiera `kilocode/kilo/auto`; aktywne
  wykrywanie `https://api.kilo.ai/api/gateway/models` może dalej rozszerzyć katalog
  środowiska uruchomieniowego.
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway,
  a nie jest zakodowany na stałe w OpenClaw.

Szczegóły konfiguracji znajdziesz na stronie [/providers/kilocode](/pl/providers/kilocode).

### Inne dołączone wtyczki dostawców

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Przykładowy model: `openrouter/auto`
- OpenClaw stosuje udokumentowane nagłówki atrybucji aplikacji OpenRouter tylko wtedy, gdy
  żądanie rzeczywiście trafia do `openrouter.ai`
- Specyficzne dla OpenRouter znaczniki Anthropic `cache_control` są podobnie ograniczone do
  zweryfikowanych tras OpenRouter, a nie dowolnych adresów proxy
- OpenRouter pozostaje na ścieżce proxy zgodnej z OpenAI, więc natywne
  kształtowanie żądań tylko dla OpenAI (`serviceTier`, `store` w Responses,
  wskazówki pamięci podręcznej promptów, ładunki zgodności rozumowania OpenAI) nie jest przekazywane
- Referencje OpenRouter oparte na Gemini zachowują tylko sanityzację sygnatur myślenia proxy-Gemini;
  natywna walidacja odtwarzania Gemini i przepisania rozruchowe pozostają wyłączone
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Przykładowy model: `kilocode/kilo/auto`
- Referencje Kilo oparte na Gemini zachowują tę samą ścieżkę sanityzacji sygnatur myślenia
  proxy-Gemini; `kilocode/kilo/auto` i inne wskazówki proxy bez obsługi rozumowania
  pomijają wstrzykiwanie rozumowania proxy
- MiniMax: `minimax` (klucz API) i `minimax-portal` (OAuth)
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`
- Przykładowy model: `minimax/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7`
- Wdrożenie MiniMax/konfiguracja klucza API zapisuje jawne definicje modeli M2.7 z
  `input: ["text", "image"]`; dołączony katalog dostawcy zachowuje referencje czatu
  jako tylko tekstowe, dopóki ta konfiguracja dostawcy nie zostanie zmaterializowana
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
  - Natywne dołączone żądania xAI używają ścieżki xAI Responses
  - `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`,
    `grok-4` i `grok-4-0709` na ich warianty `*-fast`
  - `tool_stream` jest domyślnie włączone; ustaw
    `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
    je wyłączyć
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Przykładowy model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modele GLM w Cerebras używają identyfikatorów `zai-glm-4.7` i `zai-glm-4.6`.
  - Bazowy URL zgodny z OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Przykładowy model Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Zobacz [Hugging Face (Inference)](/pl/providers/huggingface).

## Dostawcy przez `models.providers` (niestandardowy/bazowy URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców lub
proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych wtyczek dostawców publikuje już domyślny katalog.
Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać
domyślny bazowy URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączona wtyczka dostawcy. Domyślnie używaj wbudowanego dostawcy,
a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy
musisz nadpisać bazowy URL lub metadane modelu:

- Dostawca: `moonshot`
- Uwierzytelnianie: `MOONSHOT_API_KEY`
- Przykładowy model: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` lub `openclaw onboard --auth-choice moonshot-api-key-cn`

Identyfikatory modeli Kimi K2:

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

Kimi Coding używa zgodnego z Anthropic punktu końcowego Moonshot AI:

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

Starszy `kimi/k2p5` pozostaje akceptowanym identyfikatorem modelu ze względów zgodności.

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

Wdrożenie domyślnie używa powierzchni coding, ale ogólny katalog `volcengine/*`
jest rejestrowany w tym samym czasie.

W selektorach modeli wdrażania/konfiguracji wybór uwierzytelniania Volcengine preferuje zarówno
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

### BytePlus (międzynarodowy)

BytePlus ARK zapewnia międzynarodowym użytkownikom dostęp do tych samych modeli co Volcano Engine.

- Dostawca: `byteplus` (kodowanie: `byteplus-plan`)
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

Wdrożenie domyślnie używa powierzchni coding, ale ogólny katalog `byteplus/*`
jest rejestrowany w tym samym czasie.

W selektorach modeli wdrażania/konfiguracji wybór uwierzytelniania BytePlus preferuje zarówno
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

- MiniMax OAuth (globalny): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Klucz API MiniMax (globalny): `--auth-choice minimax-global-api`
- Klucz API MiniMax (CN): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub
  `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji znajdziesz na stronie [/providers/minimax](/pl/providers/minimax).

Na ścieżce strumieniowania MiniMax zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie,
chyba że ustawisz je jawnie, a `/fast on` przepisuje
`MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział możliwości należących do wtyczki:

- Domyślne ustawienia tekstu/czatu pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to należący do wtyczki `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje przy identyfikatorze dostawcy `minimax`

### Ollama

Ollama jest dostarczana jako dołączona wtyczka dostawcy i używa natywnego API Ollama:

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
`OLLAMA_API_KEY`, a dołączona wtyczka dostawcy dodaje Ollama bezpośrednio do
`openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama),
aby poznać szczegóły wdrażania, trybu chmurowego/lokalnego i konfiguracji niestandardowej.

### vLLM

vLLM jest dostarczane jako dołączona wtyczka dostawcy dla lokalnych/samohostowanych
serwerów zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby lokalnie włączyć automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

```bash
export VLLM_API_KEY="vllm-local"
```

Następnie ustaw model (zamień na jeden z identyfikatorów zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Szczegóły znajdziesz na stronie [/providers/vllm](/pl/providers/vllm).

### SGLang

SGLang jest dostarczany jako dołączona wtyczka dostawcy dla szybkich, samohostowanych
serwerów zgodnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby lokalnie włączyć automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie
wymusza uwierzytelniania):

```bash
export SGLANG_API_KEY="sglang-local"
```

Następnie ustaw model (zamień na jeden z identyfikatorów zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Szczegóły znajdziesz na stronie [/providers/sglang](/pl/providers/sglang).

### Lokalne proxy (LM Studio, vLLM, LiteLLM itd.)

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

- W przypadku dostawców niestandardowych `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne.
  Gdy zostaną pominięte, OpenClaw domyślnie przyjmuje:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecane: ustaw jawne wartości odpowiadające limitom Twojego proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych punktach końcowych (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 dostawcy dla nieobsługiwanych ról `developer`.
- Trasy proxy zgodne z OpenAI również pomijają natywne kształtowanie żądań tylko dla OpenAI:
  brak `service_tier`, brak `store` w Responses, brak wskazówek pamięci podręcznej promptów, brak
  kształtowania ładunku zgodności rozumowania OpenAI i brak ukrytych nagłówków
  atrybucji OpenClaw.
- Jeśli `baseUrl` jest pusty/pominięty, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
- Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` jest nadal nadpisywane na nienatywnych punktach końcowych `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz także: [/gateway/configuration](/pl/gateway/configuration), aby poznać pełne przykłady konfiguracji.

## Powiązane

- [Models](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Model Failover](/pl/concepts/model-failover) — łańcuchy przełączeń awaryjnych i zachowanie ponawiania prób
- [Configuration Reference](/pl/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
- [Providers](/pl/providers) — przewodniki konfiguracji dla poszczególnych dostawców
