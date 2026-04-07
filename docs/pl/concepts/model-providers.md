---
read_when:
    - Potrzebujesz referencji konfiguracji modeli dla poszczególnych dostawców
    - Chcesz zobaczyć przykładowe konfiguracje lub polecenia onboardingu CLI dla dostawców modeli
summary: Przegląd dostawców modeli z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-04-07T09:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26b36a2bc19a28a7ef39aa8e81a0050fea1d452ac4969122e5cdf8755e690258
    source_path: concepts/model-providers.md
    workflow: 15
---

# Dostawcy modeli

Ta strona opisuje **dostawców LLM/modeli** (a nie kanały czatu, takie jak WhatsApp/Telegram).
Zasady wyboru modeli znajdziesz w [/concepts/models](/pl/concepts/models).

## Szybkie zasady

- Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- Jeśli ustawisz `agents.defaults.models`, stanie się to listą dozwolonych modeli.
- Pomocnicze polecenia CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Zasady działania zapasowego środowiska wykonawczego, sondy cooldown i trwałość nadpisań sesji
  są opisane w [/concepts/model-failover](/pl/concepts/model-failover).
- `models.providers.*.models[].contextWindow` to natywne metadane modelu;
  `models.providers.*.models[].contextTokens` to efektywny limit środowiska wykonawczego.
- Pluginy dostawców mogą wstrzykiwać katalogi modeli przez `registerProvider({ catalog })`;
  OpenClaw scala ten wynik z `models.providers` przed zapisaniem
  `models.json`.
- Manifesty dostawców mogą deklarować `providerAuthEnvVars`, aby ogólne sondy
  uwierzytelniania oparte na zmiennych środowiskowych nie musiały ładować środowiska wykonawczego pluginu. Pozostała podstawowa mapa zmiennych środowiskowych
  dotyczy teraz tylko dostawców niebędących pluginami/podstawowych oraz kilku przypadków ogólnego priorytetu,
  takich jak onboarding Anthropic z preferencją klucza API.
- Pluginy dostawców mogą również posiadać logikę środowiska wykonawczego dostawcy przez
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
- Uwaga: `capabilities` środowiska wykonawczego dostawcy to współdzielone metadane runnera (rodzina dostawcy,
  osobliwości transkryptu/narzędzi, wskazówki dotyczące transportu/pamięci podręcznej). To nie to samo co [publiczny model możliwości](/pl/plugins/architecture#public-capability-model),
  który opisuje, co rejestruje plugin (wnioskowanie tekstowe, mowa itd.).

## Zachowanie dostawcy należące do pluginu

Pluginy dostawców mogą teraz posiadać większość logiki specyficznej dla dostawcy, podczas gdy OpenClaw zachowuje
ogólną pętlę wnioskowania.

Typowy podział:

- `auth[].run` / `auth[].runNonInteractive`: dostawca obsługuje przepływy onboardingu/logowania
  dla `openclaw onboard`, `openclaw models auth` oraz konfiguracji bezgłowej
- `wizard.setup` / `wizard.modelPicker`: dostawca obsługuje etykiety wyboru uwierzytelniania,
  starsze aliasy, wskazówki dotyczące list dozwolonych w onboardingu oraz wpisy konfiguracji w selektorach onboardingu/modeli
- `catalog`: dostawca pojawia się w `models.providers`
- `normalizeModelId`: dostawca normalizuje starsze/podglądowe identyfikatory modeli przed
  wyszukiwaniem lub kanonikalizacją
- `normalizeTransport`: dostawca normalizuje rodzinę transportu `api` / `baseUrl`
  przed ogólnym składaniem modelu; OpenClaw najpierw sprawdza dopasowanego dostawcę,
  a następnie inne pluginy dostawców obsługujące hooki, aż jeden z nich rzeczywiście zmieni
  transport
- `normalizeConfig`: dostawca normalizuje konfigurację `models.providers.<id>` przed
  użyciem jej przez środowisko wykonawcze; OpenClaw najpierw sprawdza dopasowanego dostawcę, a następnie inne
  pluginy dostawców obsługujące hooki, aż jeden z nich rzeczywiście zmieni konfigurację. Jeśli żaden
  hook dostawcy nie przepisze konfiguracji, dołączone helpery rodziny Google nadal
  normalizują obsługiwane wpisy dostawców Google.
- `applyNativeStreamingUsageCompat`: dostawca stosuje przepisywanie zgodności natywnego użycia streamingu sterowane przez endpoint dla dostawców konfiguracji
- `resolveConfigApiKey`: dostawca rozwiązuje uwierzytelnianie przez znaczniki środowiskowe dla dostawców konfiguracji
  bez wymuszania pełnego ładowania uwierzytelniania środowiska wykonawczego. `amazon-bedrock` ma tu także
  wbudowany resolver znaczników środowiskowych AWS, mimo że uwierzytelnianie środowiska wykonawczego Bedrock używa
  domyślnego łańcucha AWS SDK.
- `resolveSyntheticAuth`: dostawca może udostępniać lokalną/self-hosted lub inną
  dostępność uwierzytelniania opartą na konfiguracji bez utrwalania jawnych sekretów
- `shouldDeferSyntheticProfileAuth`: dostawca może oznaczać zapisane syntetyczne placeholdery profili
  jako mające niższy priorytet niż uwierzytelnianie oparte na środowisku/konfiguracji
- `resolveDynamicModel`: dostawca akceptuje identyfikatory modeli, których nie ma jeszcze w lokalnym
  statycznym katalogu
- `prepareDynamicModel`: dostawca wymaga odświeżenia metadanych przed ponowną próbą
  dynamicznego rozpoznania
- `normalizeResolvedModel`: dostawca wymaga przepisania transportu lub bazowego URL
- `contributeResolvedModelCompat`: dostawca wnosi flagi zgodności dla swoich
  modeli producenta, nawet jeśli przychodzą one przez inny zgodny transport
- `capabilities`: dostawca publikuje osobliwości transkryptu/narzędzi/rodziny dostawcy
- `normalizeToolSchemas`: dostawca czyści schematy narzędzi, zanim zobaczy je
  osadzony runner
- `inspectToolSchemas`: dostawca ujawnia ostrzeżenia schematów specyficzne dla transportu
  po normalizacji
- `resolveReasoningOutputMode`: dostawca wybiera natywne lub tagowane
  kontrakty wyjścia rozumowania
- `prepareExtraParams`: dostawca ustawia wartości domyślne lub normalizuje parametry żądań dla modeli
- `createStreamFn`: dostawca zastępuje normalną ścieżkę streamingu całkowicie
  niestandardowym transportem
- `wrapStreamFn`: dostawca stosuje wrappery zgodności nagłówków/ciała/modelu żądania
- `resolveTransportTurnState`: dostawca dostarcza natywne nagłówki lub metadane
  transportu dla każdego kroku
- `resolveWebSocketSessionPolicy`: dostawca dostarcza natywne nagłówki sesji WebSocket
  lub politykę cooldown sesji
- `createEmbeddingProvider`: dostawca obsługuje zachowanie embeddingów pamięci, gdy
  należy ono do pluginu dostawcy zamiast do podstawowego przełącznika embeddingów
- `formatApiKey`: dostawca formatuje zapisane profile uwierzytelniania do ciągu
  `apiKey` oczekiwanego przez transport w środowisku wykonawczym
- `refreshOAuth`: dostawca obsługuje odświeżanie OAuth, gdy współdzielone mechanizmy odświeżania `pi-ai`
  nie wystarczają
- `buildAuthDoctorHint`: dostawca dołącza wskazówki naprawcze, gdy odświeżenie OAuth
  się nie powiedzie
- `matchesContextOverflowError`: dostawca rozpoznaje błędy przepełnienia okna kontekstu
  specyficzne dla dostawcy, których nie wykryją ogólne heurystyki
- `classifyFailoverReason`: dostawca mapuje surowe błędy transportu/API specyficzne dla dostawcy
  na powody przełączenia awaryjnego, takie jak limit szybkości lub przeciążenie
- `isCacheTtlEligible`: dostawca decyduje, które identyfikatory modeli upstream obsługują TTL pamięci podręcznej promptów
- `buildMissingAuthMessage`: dostawca zastępuje ogólny błąd magazynu uwierzytelniania
  wskazówką naprawczą specyficzną dla dostawcy
- `suppressBuiltInModel`: dostawca ukrywa nieaktualne wiersze upstream i może zwrócić
  błąd należący do producenta przy bezpośrednich niepowodzeniach rozpoznania
- `augmentModelCatalog`: dostawca dołącza syntetyczne/końcowe wiersze katalogu po
  wykrywaniu i scalaniu konfiguracji
- `isBinaryThinking`: dostawca obsługuje UX binarnego włączania/wyłączania myślenia
- `supportsXHighThinking`: dostawca włącza dla wybranych modeli tryb `xhigh`
- `resolveDefaultThinkingLevel`: dostawca obsługuje domyślną politykę `/think` dla
  rodziny modeli
- `applyConfigDefaults`: dostawca stosuje globalne wartości domyślne specyficzne dla dostawcy
  podczas materializacji konfiguracji na podstawie trybu uwierzytelniania, środowiska lub rodziny modeli
- `isModernModelRef`: dostawca obsługuje dopasowywanie preferowanych modeli na żywo/smoke
- `prepareRuntimeAuth`: dostawca przekształca skonfigurowane poświadczenie w krótkożyjący
  token środowiska wykonawczego
- `resolveUsageAuth`: dostawca rozwiązuje poświadczenia użycia/limitu dla `/usage`
  i powiązanych powierzchni statusu/raportowania
- `fetchUsageSnapshot`: dostawca obsługuje pobieranie/parsowanie endpointu użycia, podczas gdy
  podstawowy system nadal obsługuje powłokę podsumowania i formatowanie
- `onModelSelected`: dostawca uruchamia efekty uboczne po wyborze modelu, takie jak
  telemetria lub księgowanie sesji należące do dostawcy

Aktualne dołączone przykłady:

- `anthropic`: fallback zgodności w przód dla Claude 4.6, wskazówki naprawy uwierzytelniania, pobieranie
  endpointu użycia, metadane TTL pamięci podręcznej/rodziny dostawcy oraz globalne
  domyślne konfiguracji zależne od uwierzytelniania
- `amazon-bedrock`: logika dopasowywania przepełnienia kontekstu należąca do dostawcy oraz klasyfikacja
  powodów failover dla błędów throttling/not-ready specyficznych dla Bedrock, plus
  współdzielona rodzina replay `anthropic-by-model` dla strażników polityki replay tylko dla Claude
  dla ruchu Anthropic
- `anthropic-vertex`: strażnicy polityki replay tylko dla Claude dla ruchu
  Anthropic-message
- `openrouter`: przekazywane identyfikatory modeli, wrappery żądań, wskazówki możliwości dostawcy,
  sanityzacja thought-signature Gemini na ruchu proxy Gemini, wstrzykiwanie rozumowania proxy przez rodzinę streamów `openrouter-thinking`,
  przekazywanie metadanych routingu oraz polityka TTL pamięci podręcznej
- `github-copilot`: onboarding/logowanie urządzenia, fallback modelu zgodności w przód,
  wskazówki transkryptu Claude-thinking, wymiana tokenów środowiska wykonawczego oraz pobieranie endpointu użycia
- `openai`: fallback zgodności w przód dla GPT-5.4, bezpośrednia normalizacja
  transportu OpenAI, wskazówki brakującego uwierzytelniania świadome Codex, ukrywanie Spark, syntetyczne
  wiersze katalogu OpenAI/Codex, polityka thinking/live-model, normalizacja aliasów tokenów użycia
  (`input` / `output` oraz rodziny `prompt` / `completion`), współdzielona
  rodzina streamów `openai-responses-defaults` dla natywnych wrapperów OpenAI/Codex,
  metadane rodziny dostawcy, dołączona rejestracja dostawcy generowania obrazów
  dla `gpt-image-1` oraz dołączona rejestracja dostawcy generowania wideo
  dla `sora-2`
- `google` i `google-gemini-cli`: fallback zgodności w przód dla Gemini 3.1,
  natywna walidacja replay Gemini, sanityzacja replay bootstrap, tagowany
  tryb wyjścia rozumowania, dopasowywanie nowoczesnych modeli, dołączona rejestracja dostawcy generowania obrazów dla modeli Gemini image-preview oraz dołączona
  rejestracja dostawcy generowania wideo dla modeli Veo; OAuth Gemini CLI obsługuje też
  formatowanie tokenów profilu uwierzytelniania, parsowanie tokenów użycia oraz pobieranie endpointu limitów dla powierzchni użycia
- `moonshot`: współdzielony transport, normalizacja payloadu myślenia należąca do pluginu
- `kilocode`: współdzielony transport, nagłówki żądań należące do pluginu, normalizacja payloadu rozumowania,
  sanityzacja thought-signature proxy-Gemini oraz polityka TTL pamięci podręcznej
- `zai`: fallback zgodności w przód dla GLM-5, domyślne `tool_stream`, polityka TTL pamięci podręcznej,
  polityka binary-thinking/live-model oraz uwierzytelnianie użycia + pobieranie limitów;
  nieznane identyfikatory `glm-5*` są syntetyzowane z dołączonego szablonu `glm-4.7`
- `xai`: natywna normalizacja transportu Responses, przepisywanie aliasów `/fast` dla
  szybkich wariantów Grok, domyślne `tool_stream`, czyszczenie schematów narzędzi /
  payloadu rozumowania specyficzne dla xAI oraz dołączona rejestracja dostawcy generowania wideo
  dla `grok-imagine-video`
- `mistral`: metadane możliwości należące do pluginu
- `opencode` i `opencode-go`: metadane możliwości należące do pluginu oraz
  sanityzacja thought-signature proxy-Gemini
- `alibaba`: katalog generowania wideo należący do pluginu dla bezpośrednich referencji modeli Wan
  takich jak `alibaba/wan2.6-t2v`
- `byteplus`: katalogi należące do pluginu oraz dołączona rejestracja dostawcy generowania wideo
  dla modeli Seedance text-to-video/image-to-video
- `fal`: dołączona rejestracja dostawcy generowania wideo dla hostowanych modeli innych firm,
  rejestracja dostawcy generowania obrazów dla modeli FLUX oraz dołączona
  rejestracja dostawcy generowania wideo dla hostowanych modeli wideo innych firm
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` i `volcengine`:
  tylko katalogi należące do pluginów
- `qwen`: katalogi należące do pluginu dla modeli tekstowych oraz współdzielone
  rejestracje dostawców media-understanding i generowania wideo dla jego powierzchni multimodalnych; generowanie wideo Qwen używa standardowych endpointów DashScope video z dołączonymi modelami Wan, takimi jak `wan2.6-t2v` i `wan2.7-r2v`
- `runway`: rejestracja dostawcy generowania wideo należąca do pluginu dla natywnych modeli Runway opartych na zadaniach,
  takich jak `gen4.5`
- `minimax`: katalogi należące do pluginu, dołączona rejestracja dostawcy generowania wideo
  dla modeli wideo Hailuo, dołączona rejestracja dostawcy generowania obrazów
  dla `image-01`, hybrydowy wybór polityki replay Anthropic/OpenAI oraz logika uwierzytelniania/użycia snapshotów
- `together`: katalogi należące do pluginu oraz dołączona rejestracja dostawcy generowania wideo
  dla modeli wideo Wan
- `xiaomi`: katalogi należące do pluginu oraz logika uwierzytelniania/użycia snapshotów

Dołączony plugin `openai` obsługuje teraz oba identyfikatory dostawców: `openai` i
`openai-codex`.

To obejmuje dostawców, którzy nadal pasują do normalnych transportów OpenClaw. Dostawca,
który potrzebuje całkowicie niestandardowego wykonawcy żądań, to osobna, głębsza
powierzchnia rozszerzeń.

## Rotacja kluczy API

- Obsługuje ogólną rotację dostawców dla wybranych dostawców.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie live, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz główny)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)
- Dla dostawców Google jako fallback uwzględniany jest także `GOOGLE_API_KEY`.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.
- Żądania są ponawiane z następnym kluczem tylko przy odpowiedziach z limitem szybkości (na
  przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` lub okresowych komunikatach o limicie użycia).
- Błędy inne niż limity szybkości kończą się natychmiast; nie podejmuje się rotacji kluczy.
- Gdy wszystkie kandydujące klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw dostarczany jest z katalogiem pi‑ai. Ci dostawcy nie wymagają
konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` oraz `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie dla modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewka WebSocket OpenAI Responses jest domyślnie włączona przez `params.openaiWsWarmup` (`true`/`false`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` oraz `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` na `api.openai.com`
- Użyj `params.serviceTier`, jeśli chcesz jawnie ustawić poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są stosowane tylko w natywnym ruchu OpenAI do `api.openai.com`, a nie
  do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują też `store` w Responses, wskazówki pamięci podręcznej promptów i
  kształtowanie payloadu zgodności rozumowania OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo ukryty w OpenClaw, ponieważ aktywne API OpenAI go odrzuca; Spark jest traktowany wyłącznie jako Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Dostawca: `anthropic`
- Uwierzytelnianie: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` oraz `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, zarówno dla ruchu uwierzytelnionego kluczem API, jak i OAuth wysyłanego do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dozwolone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
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
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie dla modelu przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest także przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są dołączane tylko w natywnym ruchu Codex do
  `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` pozostaje dostępny, gdy katalog OAuth Codex go ujawnia; zależny od uprawnień
- `openai-codex/gpt-5.4` zachowuje natywne `contextWindow = 1050000` i domyślne środowiskowe `contextTokens = 272000`; nadpisz limit środowiska wykonawczego przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca polityki: OAuth OpenAI Codex jest jawnie wspierane dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.

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

- [Qwen Cloud](/pl/providers/qwen): powierzchnia dostawcy Qwen Cloud oraz mapowanie endpointów Alibaba DashScope i Coding Plan
- [MiniMax](/pl/providers/minimax): dostęp przez OAuth lub klucz API do MiniMax Coding Plan
- [GLM Models](/pl/providers/glm): Z.AI Coding Plan lub ogólne endpointy API

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`)
- Dostawca środowiska wykonawczego Zen: `opencode`
- Dostawca środowiska wykonawczego Go: `opencode-go`
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
- Bezpośrednie uruchomienia Gemini akceptują także `agents.defaults.models["google/<model>"].params.cachedContent`
  (lub starsze `cached_content`) do przekazania natywnego
  uchwytu `cachedContents/...`; trafienia w pamięć podręczną Gemini są raportowane jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów zewnętrznych. Zapoznaj się z warunkami Google i użyj konta niekrytycznego, jeśli zdecydujesz się kontynuować.
- OAuth Gemini CLI jest dostarczany jako część dołączonego pluginu `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Domyślny model: `google-gemini-cli/gemini-3-flash-preview`
  - Uwaga: **nie** wklejasz client id ani secret do `openclaw.json`. Przepływ logowania CLI zapisuje
    tokeny w profilach uwierzytelniania na hoście gateway.
  - Jeśli żądania nie działają po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway.
  - Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie jako fallback bierze się z
    `stats`, przy czym `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

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
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog fallback zawiera `kilocode/kilo/auto`; aktywne
  wykrywanie `https://api.kilo.ai/api/gateway/models` może dalej rozszerzać katalog środowiska wykonawczego.
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway,
  a nie jest zakodowany na sztywno w OpenClaw.

Szczegóły konfiguracji znajdziesz w [/providers/kilocode](/pl/providers/kilocode).

### Inne dołączone pluginy dostawców

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Przykładowy model: `openrouter/auto`
- OpenClaw stosuje udokumentowane nagłówki atrybucji aplikacji OpenRouter tylko wtedy, gdy
  żądanie rzeczywiście trafia do `openrouter.ai`
- Specyficzne dla OpenRouter znaczniki Anthropic `cache_control` są podobnie ograniczone do
  zweryfikowanych tras OpenRouter, a nie dowolnych URL proxy
- OpenRouter pozostaje na ścieżce proxy zgodnej z OpenAI, więc natywne
  kształtowanie żądań tylko dla OpenAI (`serviceTier`, `store` w Responses,
  wskazówki pamięci podręcznej promptów, payloady zgodności rozumowania OpenAI) nie jest przekazywane
- Referencje OpenRouter oparte na Gemini zachowują tylko sanityzację thought-signature proxy-Gemini;
  natywna walidacja replay Gemini i przepisywanie bootstrap pozostają wyłączone
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Przykładowy model: `kilocode/kilo/auto`
- Referencje Kilo oparte na Gemini zachowują tę samą ścieżkę sanityzacji thought-signature
  proxy-Gemini; `kilocode/kilo/auto` i inne wskazówki proxy bez obsługi rozumowania
  pomijają wstrzykiwanie rozumowania proxy
- MiniMax: `minimax` (klucz API) i `minimax-portal` (OAuth)
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`
- Przykładowy model: `minimax/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7`
- Onboarding MiniMax/konfiguracja klucza API zapisuje jawne definicje modelu M2.7 z
  `input: ["text", "image"]`; dołączony katalog dostawcy utrzymuje referencje czatu
  jako tylko tekstowe, dopóki konfiguracja dostawcy nie zostanie zmaterializowana
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
  - `/fast` lub `params.fastMode: true` przepisują `grok-3`, `grok-3-mini`,
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

## Dostawcy przez `models.providers` (niestandardowy/base URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców lub
proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych pluginów dostawców publikuje już domyślny katalog.
Jawnych wpisów `models.providers.<id>` używaj tylko wtedy, gdy chcesz nadpisać
domyślny base URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony plugin dostawcy. Domyślnie używaj
wbudowanego dostawcy, a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy
musisz nadpisać base URL lub metadane modelu:

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

Kimi Coding używa endpointu Anthropic-compatible Moonshot AI:

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

Starszy `kimi/k2p5` pozostaje akceptowanym identyfikatorem modelu zgodności.

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

MiniMax jest konfigurowany przez `models.providers`, ponieważ używa niestandardowych endpointów:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub
  `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji znajdziesz w [/providers/minimax](/pl/providers/minimax).

Na ścieżce streamingu Anthropic-compatible MiniMax OpenClaw domyślnie wyłącza thinking,
chyba że ustawisz je jawnie, a `/fast on` przepisuje
`MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział możliwości należących do pluginu:

- Domyślne tekst/czat pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to należący do pluginu `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje na identyfikatorze dostawcy `minimax`

### Ollama

Ollama jest dostarczana jako dołączony plugin dostawcy i używa natywnego API Ollama:

- Dostawca: `ollama`
- Uwierzytelnianie: niewymagane (serwer lokalny)
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

Ollama jest wykrywana lokalnie pod adresem `http://127.0.0.1:11434`, gdy włączysz ją przez
`OLLAMA_API_KEY`, a dołączony plugin dostawcy dodaje Ollama bezpośrednio do
`openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama),
aby poznać onboarding, tryb cloud/local i konfigurację niestandardową.

### vLLM

vLLM jest dostarczany jako dołączony plugin dostawcy dla lokalnych/self-hosted
serwerów zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby włączyć auto-wykrywanie lokalnie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

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
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby włączyć auto-wykrywanie lokalnie (dowolna wartość działa, jeśli serwer nie
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
  Gdy są pominięte, OpenClaw domyślnie przyjmuje:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecane: ustaw jawne wartości zgodne z limitami proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego hostem nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 od dostawców, którzy nie obsługują ról `developer`.
- Trasy proxy zgodne z OpenAI pomijają też natywne kształtowanie żądań tylko dla OpenAI:
  brak `service_tier`, brak `store` w Responses, brak wskazówek pamięci podręcznej promptów, brak
  kształtowania payloadu zgodności rozumowania OpenAI i brak ukrytych nagłówków
  atrybucji OpenClaw.
- Jeśli `baseUrl` jest pusty/pominięty, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
- Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na `false` dla nienatywnych endpointów `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz też: [/gateway/configuration](/pl/gateway/configuration), aby uzyskać pełne przykłady konfiguracji.

## Powiązane

- [Models](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Model Failover](/pl/concepts/model-failover) — łańcuchy fallback i zachowanie ponawiania
- [Configuration Reference](/pl/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
- [Providers](/pl/providers) — przewodniki konfiguracji dla poszczególnych dostawców
