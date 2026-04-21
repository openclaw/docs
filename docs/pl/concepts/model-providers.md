---
read_when:
    - Potrzebujesz dokumentacji konfiguracji modeli dla każdego dostawcy osobno.
    - Chcesz przykładowe konfiguracje lub polecenia wdrożeniowe CLI dla dostawców modeli.
summary: Przegląd dostawców modeli z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-04-21T09:53:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# Dostawcy modeli

Ta strona dotyczy **dostawców LLM/modeli** (a nie kanałów czatu, takich jak WhatsApp/Telegram).
Zasady wyboru modeli znajdziesz w [/concepts/models](/pl/concepts/models).

## Szybkie zasady

- Odwołania do modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- Jeśli ustawisz `agents.defaults.models`, stanie się to listą dozwolonych modeli.
- Pomocniki CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Reguły zapasowego środowiska uruchomieniowego, sondy cooldown i trwałość nadpisań sesji są udokumentowane w [/concepts/model-failover](/pl/concepts/model-failover).
- `models.providers.*.models[].contextWindow` to natywne metadane modelu; `models.providers.*.models[].contextTokens` to efektywny limit środowiska uruchomieniowego.
- Plugin dostawcy może wstrzykiwać katalogi modeli przez `registerProvider({ catalog })`; OpenClaw scala te dane wyjściowe z `models.providers` przed zapisaniem `models.json`.
- Manifesty dostawców mogą deklarować `providerAuthEnvVars` i `providerAuthAliases`, aby ogólne sondy uwierzytelniania oparte na zmiennych środowiskowych oraz warianty dostawców nie musiały ładować środowiska uruchomieniowego Plugin. Pozostała mapa zmiennych środowiskowych core jest teraz używana tylko dla dostawców spoza Plugin/core i kilku przypadków ogólnego pierwszeństwa, takich jak wdrażanie Anthropic z priorytetem klucza API.
- Plugin dostawcy mogą także posiadać zachowanie środowiska uruchomieniowego dostawcy przez `normalizeModelId`, `normalizeTransport`, `normalizeConfig`, `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`, `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`, `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`, `contributeResolvedModelCompat`, `capabilities`, `normalizeToolSchemas`, `inspectToolSchemas`, `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`, `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`, `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`, `buildAuthDoctorHint`, `matchesContextOverflowError`, `classifyFailoverReason`, `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`, `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`, `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` i `onModelSelected`.
- Uwaga: dostawcze `capabilities` środowiska uruchomieniowego to współdzielone metadane runnera (rodzina dostawcy, specyfika transkrypcji/narzędzi, wskazówki dotyczące transportu/cache). To nie to samo co [publiczny model możliwości](/pl/plugins/architecture#public-capability-model), który opisuje, co rejestruje Plugin (wnioskowanie tekstowe, mowa itd.).
- Dołączony dostawca `codex` jest sparowany z dołączonym harness agenta Codex. Użyj `codex/gpt-*`, gdy chcesz korzystać z logowania zarządzanego przez Codex, wykrywania modeli, natywnego wznawiania wątków i wykonywania na serwerze aplikacji. Zwykłe odwołania `openai/gpt-*` nadal używają dostawcy OpenAI i standardowego transportu dostawcy OpenClaw. Wdrożenia tylko z Codex mogą wyłączyć automatyczny fallback do PI przez `agents.defaults.embeddedHarness.fallback: "none"`; zobacz [Codex Harness](/pl/plugins/codex-harness).

## Zachowanie dostawcy należące do Plugin

Plugin dostawcy mogą teraz posiadać większość logiki specyficznej dla dostawcy, podczas gdy OpenClaw zachowuje ogólną pętlę wnioskowania.

Typowy podział:

- `auth[].run` / `auth[].runNonInteractive`: dostawca posiada przepływy wdrażania/logowania dla `openclaw onboard`, `openclaw models auth` i konfiguracji bezgłowej
- `wizard.setup` / `wizard.modelPicker`: dostawca posiada etykiety wyboru uwierzytelniania, starsze aliasy, wskazówki dotyczące listy dozwolonych przy wdrażaniu i wpisy konfiguracji w kreatorach wdrażania/wyboru modelu
- `catalog`: dostawca pojawia się w `models.providers`
- `normalizeModelId`: dostawca normalizuje starsze/poglądowe identyfikatory modeli przed wyszukiwaniem lub kanonikalizacją
- `normalizeTransport`: dostawca normalizuje `api` / `baseUrl` rodziny transportu przed ogólnym składaniem modelu; OpenClaw najpierw sprawdza dopasowanego dostawcę, a następnie inne Plugin dostawców obsługujące hooki, dopóki któryś rzeczywiście nie zmieni transportu
- `normalizeConfig`: dostawca normalizuje konfigurację `models.providers.<id>` zanim użyje jej środowisko uruchomieniowe; OpenClaw najpierw sprawdza dopasowanego dostawcę, a następnie inne Plugin dostawców obsługujące hooki, dopóki któryś rzeczywiście nie zmieni konfiguracji. Jeśli żaden hook dostawcy nie przepisze konfiguracji, dołączone pomocniki rodziny Google nadal normalizują obsługiwane wpisy dostawców Google.
- `applyNativeStreamingUsageCompat`: dostawca stosuje zgodności natywnego użycia streamingu oparte na endpointach dla dostawców konfiguracyjnych
- `resolveConfigApiKey`: dostawca rozwiązuje uwierzytelnianie znacznikami zmiennych środowiskowych dla dostawców konfiguracyjnych bez wymuszania pełnego ładowania uwierzytelniania środowiska uruchomieniowego. `amazon-bedrock` ma tu także wbudowany resolver znaczników środowiskowych AWS, mimo że uwierzytelnianie środowiska uruchomieniowego Bedrock używa domyślnego łańcucha AWS SDK.
- `resolveSyntheticAuth`: dostawca może ujawniać dostępność uwierzytelniania lokalnego/self-hosted lub innego opartego na konfiguracji bez utrwalania jawnych sekretów
- `shouldDeferSyntheticProfileAuth`: dostawca może oznaczać zapisane syntetyczne placeholdery profili jako mające niższy priorytet niż uwierzytelnianie oparte na env/config
- `resolveDynamicModel`: dostawca akceptuje identyfikatory modeli, których nie ma jeszcze w lokalnym statycznym katalogu
- `prepareDynamicModel`: dostawca potrzebuje odświeżenia metadanych przed ponowną próbą dynamicznego rozstrzygnięcia
- `normalizeResolvedModel`: dostawca wymaga przepisania transportu lub podstawowego URL
- `contributeResolvedModelCompat`: dostawca dostarcza flagi zgodności dla swoich modeli dostawcy nawet wtedy, gdy docierają przez inny zgodny transport
- `capabilities`: dostawca publikuje specyfikę transkrypcji/narzędzi/rodziny dostawcy
- `normalizeToolSchemas`: dostawca oczyszcza schematy narzędzi, zanim zobaczy je osadzony runner
- `inspectToolSchemas`: dostawca ujawnia ostrzeżenia schematów specyficzne dla transportu po normalizacji
- `resolveReasoningOutputMode`: dostawca wybiera natywny lub oznaczony kontrakt danych wyjściowych rozumowania
- `prepareExtraParams`: dostawca ustawia wartości domyślne lub normalizuje parametry żądań per model
- `createStreamFn`: dostawca zastępuje zwykłą ścieżkę streamingu całkowicie niestandardowym transportem
- `wrapStreamFn`: dostawca stosuje wrappery zgodności dla nagłówków/treści żądań/modeli
- `resolveTransportTurnState`: dostawca dostarcza natywne nagłówki lub metadane transportu dla danej tury
- `resolveWebSocketSessionPolicy`: dostawca dostarcza natywne nagłówki sesji WebSocket lub politykę cooldown sesji
- `createEmbeddingProvider`: dostawca posiada zachowanie osadzeń pamięci, gdy powinno należeć do Plugin dostawcy zamiast do przełącznika osadzeń core
- `formatApiKey`: dostawca formatuje zapisane profile uwierzytelniania do ciągu `apiKey` oczekiwanego przez transport w środowisku uruchomieniowym
- `refreshOAuth`: dostawca posiada odświeżanie OAuth, gdy współdzielone mechanizmy odświeżania `pi-ai` nie wystarczają
- `buildAuthDoctorHint`: dostawca dołącza wskazówki naprawy, gdy odświeżenie OAuth się nie powiedzie
- `matchesContextOverflowError`: dostawca rozpoznaje błędy przepełnienia okna kontekstu specyficzne dla dostawcy, które mogłyby zostać pominięte przez ogólne heurystyki
- `classifyFailoverReason`: dostawca mapuje surowe błędy transportu/API specyficzne dla dostawcy na przyczyny failover, takie jak limit szybkości lub przeciążenie
- `isCacheTtlEligible`: dostawca decyduje, które identyfikatory modeli upstream obsługują TTL cache promptów
- `buildMissingAuthMessage`: dostawca zastępuje ogólny błąd magazynu uwierzytelniania wskazówką odzyskiwania specyficzną dla dostawcy
- `suppressBuiltInModel`: dostawca ukrywa nieaktualne wiersze upstream i może zwrócić błąd należący do dostawcy dla bezpośrednich niepowodzeń rozstrzygania
- `augmentModelCatalog`: dostawca dołącza syntetyczne/końcowe wiersze katalogu po wykrywaniu i scalaniu konfiguracji
- `resolveThinkingProfile`: dostawca posiada dokładny zestaw poziomów `/think`, opcjonalne etykiety wyświetlania i domyślny poziom dla wybranego modelu
- `isBinaryThinking`: hook zgodności dla binarnego UX myślenia włącz/wyłącz
- `supportsXHighThinking`: hook zgodności dla wybranych modeli `xhigh`
- `resolveDefaultThinkingLevel`: hook zgodności dla domyślnej polityki `/think`
- `applyConfigDefaults`: dostawca stosuje globalne wartości domyślne specyficzne dla dostawcy podczas materializacji konfiguracji na podstawie trybu uwierzytelniania, env lub rodziny modeli
- `isModernModelRef`: dostawca posiada dopasowanie preferowanego modelu dla live/smoke
- `prepareRuntimeAuth`: dostawca zamienia skonfigurowane poświadczenie na krótkotrwały token środowiska uruchomieniowego
- `resolveUsageAuth`: dostawca rozwiązuje poświadczenia użycia/limitu dla `/usage` i powiązanych powierzchni statusu/raportowania
- `fetchUsageSnapshot`: dostawca posiada pobieranie/parsowanie endpointu użycia, podczas gdy core nadal posiada powłokę podsumowania i formatowanie
- `onModelSelected`: dostawca uruchamia skutki uboczne po wyborze modelu, takie jak telemetria lub księgowanie sesji należące do dostawcy

Obecnie dołączone przykłady:

- `anthropic`: fallback zgodności w przód dla Claude 4.6, wskazówki naprawy uwierzytelniania, pobieranie endpointu użycia, metadane cache-TTL/rodziny dostawcy oraz globalne domyślne ustawienia konfiguracji zależne od uwierzytelniania
- `amazon-bedrock`: dopasowywanie przepełnienia kontekstu należące do dostawcy i klasyfikacja przyczyn failover dla specyficznych dla Bedrock błędów throttle/not-ready, plus współdzielona rodzina odtwarzania `anthropic-by-model` dla guardów polityki odtwarzania tylko dla Claude na ruchu Anthropic
- `anthropic-vertex`: guardy polityki odtwarzania tylko dla Claude na ruchu wiadomości Anthropic
- `openrouter`: identyfikatory modeli przekazywane bez zmian, wrappery żądań, wskazówki dotyczące możliwości dostawcy, sanityzacja thought-signature Gemini na proxowanym ruchu Gemini, wstrzykiwanie rozumowania proxy przez rodzinę streamów `openrouter-thinking`, przekazywanie metadanych routingu i polityka cache-TTL
- `github-copilot`: wdrażanie/logowanie urządzenia, fallback modeli zgodny w przód, wskazówki transkrypcji Claude-thinking, wymiana tokenów środowiska uruchomieniowego i pobieranie endpointu użycia
- `openai`: fallback zgodności w przód dla GPT-5.4, normalizacja bezpośredniego transportu OpenAI, wskazówki brakującego uwierzytelniania świadome Codex, tłumienie Spark, syntetyczne wiersze katalogu OpenAI/Codex, polityka thinking/live-model, normalizacja aliasów tokenów użycia (`input` / `output` oraz rodziny `prompt` / `completion`), współdzielona rodzina streamów `openai-responses-defaults` dla natywnych wrapperów OpenAI/Codex, metadane rodziny dostawcy, rejestracja dołączonego dostawcy generowania obrazów dla `gpt-image-1` oraz rejestracja dołączonego dostawcy generowania wideo dla `sora-2`
- `google` i `google-gemini-cli`: fallback zgodności w przód dla Gemini 3.1, natywna walidacja odtwarzania Gemini, sanityzacja bootstrap replay, tryb oznaczonych danych wyjściowych rozumowania, dopasowanie nowoczesnych modeli, rejestracja dołączonego dostawcy generowania obrazów dla modeli Gemini image-preview oraz rejestracja dołączonego dostawcy generowania wideo dla modeli Veo; OAuth Gemini CLI posiada również formatowanie tokenów profilu uwierzytelniania, parsowanie tokenów użycia i pobieranie endpointu limitów dla powierzchni użycia
- `moonshot`: współdzielony transport, normalizacja ładunku thinking należąca do Plugin
- `kilocode`: współdzielony transport, nagłówki żądań należące do Plugin, normalizacja ładunku rozumowania, sanityzacja thought-signature proxy-Gemini i polityka cache-TTL
- `zai`: fallback zgodności w przód dla GLM-5, domyślne `tool_stream`, polityka cache-TTL, polityka binarnego thinking/live-model oraz uwierzytelnianie użycia + pobieranie limitów; nieznane identyfikatory `glm-5*` są syntetyzowane na podstawie dołączonego szablonu `glm-4.7`
- `xai`: natywna normalizacja transportu Responses, przepisywanie aliasów `/fast` dla szybkich wariantów Grok, domyślne `tool_stream`, czyszczenie schematu narzędzi / ładunku rozumowania specyficzne dla xAI oraz rejestracja dołączonego dostawcy generowania wideo dla `grok-imagine-video`
- `mistral`: metadane możliwości należące do Plugin
- `opencode` i `opencode-go`: metadane możliwości należące do Plugin plus sanityzacja thought-signature proxy-Gemini
- `alibaba`: należący do Plugin katalog generowania wideo dla bezpośrednich odwołań do modeli Wan, takich jak `alibaba/wan2.6-t2v`
- `byteplus`: katalogi należące do Plugin plus rejestracja dołączonego dostawcy generowania wideo dla modeli Seedance text-to-video/image-to-video
- `fal`: rejestracja dołączonego dostawcy generowania wideo dla hostowanych modeli wideo innych firm oraz rejestracja dołączonego dostawcy generowania obrazów dla modeli obrazów FLUX
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`, `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` i `volcengine`: tylko katalogi należące do Plugin
- `qwen`: katalogi należące do Plugin dla modeli tekstowych plus współdzielone rejestracje dostawców rozumienia mediów i generowania wideo dla jego powierzchni multimodalnych; generowanie wideo Qwen używa standardowych endpointów wideo DashScope z dołączonymi modelami Wan, takimi jak `wan2.6-t2v` i `wan2.7-r2v`
- `runway`: rejestracja dostawcy generowania wideo należąca do Plugin dla natywnych modeli opartych na zadaniach Runway, takich jak `gen4.5`
- `minimax`: katalogi należące do Plugin, rejestracja dołączonego dostawcy generowania wideo dla modeli wideo Hailuo, rejestracja dołączonego dostawcy generowania obrazów dla `image-01`, hybrydowy wybór polityki odtwarzania Anthropic/OpenAI oraz logika uwierzytelniania/migawki użycia
- `together`: katalogi należące do Plugin plus rejestracja dołączonego dostawcy generowania wideo dla modeli wideo Wan
- `xiaomi`: katalogi należące do Plugin plus logika uwierzytelniania/migawki użycia

Dołączony Plugin `openai` posiada teraz oba identyfikatory dostawcy: `openai` i `openai-codex`.

To obejmuje dostawców, którzy nadal mieszczą się w normalnych transportach OpenClaw. Dostawca wymagający całkowicie niestandardowego wykonawcy żądań to osobna, głębsza powierzchnia rozszerzeń.

## Rotacja kluczy API

- Obsługuje ogólną rotację dostawców dla wybranych dostawców.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze aktywne nadpisanie, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz główny)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, na przykład `<PROVIDER>_API_KEY_1`)
- Dla dostawców Google `GOOGLE_API_KEY` jest także uwzględniany jako fallback.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.
- Żądania są ponawiane z następnym kluczem tylko przy odpowiedziach z limitem szybkości (na przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` lub okresowych komunikatach o limicie użycia).
- Błędy inne niż limity szybkości kończą się natychmiast; nie jest podejmowana próba rotacji klucza.
- Gdy wszystkie kandydackie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi‑ai. Ci dostawcy nie wymagają konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` oraz `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie per model przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewanie OpenAI Responses WebSocket jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` na `api.openai.com`
- Użyj `params.serviceTier`, gdy chcesz jawnego poziomu zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są stosowane tylko do natywnego ruchu OpenAI do `api.openai.com`, a nie do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują także `store` Responses, wskazówki cache promptów i kształtowanie ładunku zgodności rozumowania OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo tłumiony w OpenClaw, ponieważ aktywne API OpenAI go odrzuca; Spark jest traktowany jako wyłącznie Codex

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
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniany kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dozwolone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Token konfiguracji Anthropic nadal pozostaje obsługiwaną ścieżką tokena OpenClaw, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

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
- Nadpisanie per model przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest także przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są dołączane tylko do natywnego ruchu Codex do `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` pozostaje dostępne, gdy katalog OAuth Codex je udostępnia; zależne od uprawnień
- `openai-codex/gpt-5.4` zachowuje natywne `contextWindow = 1050000` i domyślne środowiskowe `contextTokens = 272000`; nadpisz limit środowiska uruchomieniowego przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca polityki: OAuth OpenAI Codex jest jawnie wspierane dla zewnętrznych narzędzi/przepływów pracy takich jak OpenClaw.

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

- [Qwen Cloud](/pl/providers/qwen): powierzchnia dostawcy Qwen Cloud plus mapowanie endpointów Alibaba DashScope i Coding Plan
- [MiniMax](/pl/providers/minimax): dostęp OAuth lub klucz API do MiniMax Coding Plan
- [GLM Models](/pl/providers/glm): endpointy Z.AI Coding Plan lub ogólne endpointy API

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
- Bezpośrednie uruchomienia Gemini akceptują również `agents.defaults.models["google/<model>"].params.cachedContent` (lub starsze `cached_content`) do przekazania natywnego uchwytu dostawcy `cachedContents/...`; trafienia cache Gemini są widoczne jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów zewnętrznych. Przejrzyj warunki Google i użyj konta niekrytycznego, jeśli zdecydujesz się kontynuować.
- OAuth Gemini CLI jest dostarczane jako część dołączonego Plugin `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Domyślny model: `google-gemini-cli/gemini-3-flash-preview`
  - Uwaga: **nie** wklejasz client id ani secret do `openclaw.json`. Przepływ logowania CLI zapisuje tokeny w profilach uwierzytelniania na hoście Gateway.
  - Jeśli żądania kończą się błędem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway.
  - Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie wraca do `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
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
- Statyczny katalog zapasowy zawiera `kilocode/kilo/auto`; aktywne wykrywanie `https://api.kilo.ai/api/gateway/models` może dodatkowo rozszerzyć katalog środowiska uruchomieniowego.
- Dokładny routing upstream za `kilocode/kilo/auto` jest własnością Kilo Gateway, a nie jest na stałe zakodowany w OpenClaw.

Szczegóły konfiguracji znajdziesz w [/providers/kilocode](/pl/providers/kilocode).

### Inne dołączone Plugin dostawców

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Przykładowy model: `openrouter/auto`
- OpenClaw stosuje udokumentowane nagłówki atrybucji aplikacji OpenRouter tylko wtedy, gdy żądanie rzeczywiście trafia do `openrouter.ai`
- Znaczniki `cache_control` specyficzne dla Anthropic w OpenRouter są podobnie ograniczone do zweryfikowanych tras OpenRouter, a nie do dowolnych adresów proxy URL
- OpenRouter pozostaje na ścieżce proxy w stylu zgodnym z OpenAI, więc natywne kształtowanie żądań tylko dla OpenAI (`serviceTier`, Responses `store`, wskazówki cache promptów, ładunki zgodności rozumowania OpenAI) nie jest przekazywane dalej
- Odwołania OpenRouter oparte na Gemini zachowują tylko sanityzację thought-signature proxy-Gemini; natywna walidacja odtwarzania Gemini i przepisywanie bootstrap pozostają wyłączone
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Przykładowy model: `kilocode/kilo/auto`
- Odwołania Kilo oparte na Gemini zachowują tę samą ścieżkę sanityzacji thought-signature proxy-Gemini; `kilocode/kilo/auto` i inne wskazówki proxy bez obsługi rozumowania pomijają wstrzykiwanie rozumowania proxy
- MiniMax: `minimax` (klucz API) i `minimax-portal` (OAuth)
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`
- Przykładowy model: `minimax/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7`
- Wdrażanie MiniMax/konfiguracja klucza API zapisuje jawne definicje modeli M2.7 z `input: ["text", "image"]`; dołączony katalog dostawcy utrzymuje odwołania czatu jako tylko tekstowe, dopóki konfiguracja tego dostawcy nie zostanie zmaterializowana
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
  - `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`
  - `tool_stream` jest domyślnie włączone; ustaw `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby je wyłączyć
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Przykładowy model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modele GLM w Cerebras używają identyfikatorów `zai-glm-4.7` i `zai-glm-4.6`.
  - Base URL zgodny z OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Przykładowy model Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Zobacz [Hugging Face (Inference)](/pl/providers/huggingface).

## Dostawcy przez `models.providers` (niestandardowi / base URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców albo proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych Plugin dostawców publikuje już domyślny katalog.
Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać domyślny base URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony Plugin dostawcy. Domyślnie używaj wbudowanego dostawcy, a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy musisz nadpisać base URL lub metadane modelu:

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

Kimi Coding używa endpointu Moonshot AI zgodnego z Anthropic:

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

Wdrażanie domyślnie używa powierzchni coding, ale ogólny katalog `volcengine/*` jest rejestrowany jednocześnie.

W selektorach modeli wdrażania/konfiguracji wybór uwierzytelniania Volcengine preferuje zarówno wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do dostawcy.

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

BytePlus ARK zapewnia użytkownikom międzynarodowym dostęp do tych samych modeli co Volcano Engine.

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

Wdrażanie domyślnie używa powierzchni coding, ale ogólny katalog `byteplus/*` jest rejestrowany jednocześnie.

W selektorach modeli wdrażania/konfiguracji wybór uwierzytelniania BytePlus preferuje zarówno wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do dostawcy.

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

- MiniMax OAuth (globalny): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Klucz API MiniMax (globalny): `--auth-choice minimax-global-api`
- Klucz API MiniMax (CN): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji znajdziesz w [/providers/minimax](/pl/providers/minimax).

Na ścieżce streamingu MiniMax zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking, chyba że jawnie je ustawisz, a `/fast on` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział możliwości należących do Plugin:

- Domyślne ustawienia tekstu/czatu pozostają przy `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to należący do Plugin `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje przy identyfikatorze dostawcy `minimax`

### LM Studio

LM Studio jest dostarczane jako dołączony Plugin dostawcy, który używa natywnego API:

- Dostawca: `lmstudio`
- Uwierzytelnianie: `LM_API_TOKEN`
- Domyślny inference base URL: `http://localhost:1234/v1`

Następnie ustaw model (zastąp jedną z wartości ID zwróconych przez `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw używa natywnych endpointów LM Studio `/api/v1/models` i `/api/v1/models/load` do wykrywania + automatycznego ładowania, a domyślnie `/v1/chat/completions` do wnioskowania.
Zobacz [/providers/lmstudio](/pl/providers/lmstudio), aby poznać konfigurację i rozwiązywanie problemów.

### Ollama

Ollama jest dostarczana jako dołączony Plugin dostawcy i używa natywnego API Ollama:

- Dostawca: `ollama`
- Uwierzytelnianie: nie jest wymagane (serwer lokalny)
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

Ollama jest wykrywana lokalnie pod `http://127.0.0.1:11434`, gdy włączysz ją przez `OLLAMA_API_KEY`, a dołączony Plugin dostawcy dodaje Ollama bezpośrednio do `openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama), aby poznać wdrażanie, tryb chmurowy/lokalny i konfigurację niestandardową.

### vLLM

vLLM jest dostarczane jako dołączony Plugin dostawcy dla lokalnych/self-hosted serwerów zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny base URL: `http://127.0.0.1:8000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli Twój serwer nie wymusza uwierzytelniania):

```bash
export VLLM_API_KEY="vllm-local"
```

Następnie ustaw model (zastąp jedną z wartości ID zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/vllm](/pl/providers/vllm).

### SGLang

SGLang jest dostarczany jako dołączony Plugin dostawcy dla szybkich self-hosted serwerów zgodnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny base URL: `http://127.0.0.1:30000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli Twój serwer nie wymusza uwierzytelniania):

```bash
export SGLANG_API_KEY="sglang-local"
```

Następnie ustaw model (zastąp jedną z wartości ID zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/sglang](/pl/providers/sglang).

### Lokalne proxy (LM Studio, vLLM, LiteLLM itd.)

Przykład (zgodny z OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Lokalny" } },
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
            name: "Model lokalny",
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
  Jeśli zostaną pominięte, OpenClaw domyślnie używa:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecane: ustaw jawne wartości zgodne z limitami Twojego proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 od dostawcy dla nieobsługiwanych ról `developer`.
- Trasy proxy w stylu zgodnym z OpenAI również pomijają natywne kształtowanie żądań tylko dla OpenAI: brak `service_tier`, brak Responses `store`, brak wskazówek cache promptów, brak kształtowania ładunku zgodności rozumowania OpenAI i brak ukrytych nagłówków atrybucji OpenClaw.
- Jeśli `baseUrl` jest puste lub pominięte, OpenClaw zachowuje domyślne zachowanie OpenAI (które wskazuje na `api.openai.com`).
- Ze względów bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na `false` na nienatywnych endpointach `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz też: [/gateway/configuration](/pl/gateway/configuration), aby poznać pełne przykłady konfiguracji.

## Powiązane

- [Modele](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Model Failover](/pl/concepts/model-failover) — łańcuchy fallback i zachowanie ponawiania
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults) — klucze konfiguracji modeli
- [Dostawcy](/pl/providers) — przewodniki konfiguracji dla poszczególnych dostawców
