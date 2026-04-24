---
read_when:
    - Potrzebujesz dokumentacji referencyjnej konfiguracji modeli dla poszczególnych dostawców
    - Chcesz przykładowych konfiguracji lub poleceń wdrożenia CLI dla dostawców modeli
summary: Przegląd dostawców modeli z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-04-24T09:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

Ta strona dotyczy **dostawców LLM/modeli** (a nie kanałów czatu, takich jak WhatsApp/Telegram).
Zasady wyboru modeli znajdziesz w [/concepts/models](/pl/concepts/models).

## Szybkie zasady

- Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- `agents.defaults.models` działa jako lista dozwolonych, gdy jest ustawione.
- Pomocnicze polecenia CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` to natywne metadane modelu; `contextTokens` to skuteczny limit runtime.
- Zasady fallbacku, sondowania cooldown i utrwalanie nadpisań sesji: [Model failover](/pl/concepts/model-failover).
- Trasy rodziny OpenAI są specyficzne dla prefiksu: `openai/<model>` używa bezpośredniego
  dostawcy klucza API OpenAI w PI, `openai-codex/<model>` używa OAuth Codex w PI,
  a `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` używa natywnego harnessu app-server Codex. Zobacz [OpenAI](/pl/providers/openai)
  oraz [Codex harness](/pl/plugins/codex-harness).
- Automatyczne włączanie Pluginów podąża za tą samą granicą: `openai-codex/<model>` należy
  do Pluginu OpenAI, natomiast Plugin Codex jest włączany przez
  `embeddedHarness.runtime: "codex"` lub starsze referencje `codex/<model>`.
- GPT-5.5 jest obecnie dostępny przez trasy subskrypcji/OAuth:
  `openai-codex/gpt-5.5` w PI lub `openai/gpt-5.5` z harness app-server Codex. Bezpośrednia trasa klucza API dla `openai/gpt-5.5` będzie obsługiwana,
  gdy OpenAI udostępni GPT-5.5 w publicznym API; do tego czasu używaj modeli
  dostępnych przez API, takich jak `openai/gpt-5.4`, w konfiguracjach `OPENAI_API_KEY`.

## Zachowanie dostawców należące do Pluginów

Większość logiki specyficznej dla dostawców znajduje się w Pluginach dostawców (`registerProvider(...)`), podczas gdy OpenClaw zachowuje ogólną pętlę inferencji. Pluginy odpowiadają za onboarding, katalogi modeli, mapowanie zmiennych środowiskowych uwierzytelniania, normalizację transportu/konfiguracji, oczyszczanie schematów narzędzi, klasyfikację failover, odświeżanie OAuth, raportowanie użycia, profile thinking/reasoning i inne.

Pełna lista haków provider-SDK i przykłady dołączonych Pluginów znajdują się w [Provider plugins](/pl/plugins/sdk-provider-plugins). Dostawca, który wymaga całkowicie niestandardowego wykonawcy żądań, korzysta z osobnej, głębszej powierzchni rozszerzeń.

<Note>
`capabilities` runtime dostawcy to współdzielone metadane runnera (rodzina dostawcy, niuanse transkryptu/narzędzi, wskazówki dotyczące transportu/cache). To nie to samo co [public capability model](/pl/plugins/architecture#public-capability-model), który opisuje, co Plugin rejestruje (inferencja tekstu, mowa itd.).
</Note>

## Rotacja kluczy API

- Obsługuje ogólną rotację kluczy dostawców dla wybranych dostawców.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze aktywne nadpisanie, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz główny)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)
- Dla dostawców Google jako fallback uwzględniane jest również `GOOGLE_API_KEY`.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.
- Żądania są ponawiane z następnym kluczem tylko przy odpowiedziach z limitem szybkości (na
  przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` lub okresowych komunikatach o limicie użycia).
- Błędy inne niż limit szybkości kończą się natychmiast; nie jest podejmowana rotacja kluczy.
- Gdy wszystkie kandydackie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw zawiera katalog pi‑ai. Ci dostawcy **nie wymagają**
konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` oraz `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Bezpośrednia obsługa GPT-5.5 przez API będzie tu gotowa na przyszłość, gdy OpenAI udostępni GPT-5.5 w API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie per model przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewka OpenAI Responses WebSocket jest domyślnie włączona przez `params.openaiWsWarmup` (`true`/`false`)
- Przetwarzanie priorytetowe OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania `openai/*` Responses do `service_tier=priority` na `api.openai.com`
- Użyj `params.serviceTier`, jeśli chcesz jawnego poziomu zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są stosowane tylko do natywnego ruchu OpenAI na `api.openai.com`, a nie
  do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują też Responses `store`, wskazówki prompt-cache i
  kształtowanie payloadu reasoning-compat OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo ukryty w OpenClaw, ponieważ aktywne żądania OpenAI API go odrzucają, a bieżący katalog Codex go nie udostępnia

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
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniony kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to do Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Token konfiguracyjny Anthropic pozostaje dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Dostawca: `openai-codex`
- Uwierzytelnianie: OAuth (ChatGPT)
- Referencja modelu PI: `openai-codex/gpt-5.5`
- Referencja natywnego harnessu app-server Codex: `openai/gpt-5.5` z `agents.defaults.embeddedHarness.runtime: "codex"`
- Starsze referencje modeli: `codex/gpt-*`
- Granica Pluginu: `openai-codex/*` ładuje Plugin OpenAI; natywny
  Plugin app-server Codex jest wybierany tylko przez runtime harnessu Codex lub starsze
  referencje `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` lub `openclaw models auth login --provider openai-codex`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie per model PI przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest też przekazywane przy natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są dołączane tylko do natywnego ruchu Codex do
  `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to do `service_tier=priority`
- `openai-codex/gpt-5.5` zachowuje natywne `contextWindow = 1000000` i domyślne runtime `contextTokens = 272000`; nadpisz limit runtime przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca polityki: OpenAI Codex OAuth jest jawnie wspierany dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.
- Bieżący dostęp do GPT-5.5 używa tej trasy OAuth/subskrypcji, dopóki OpenAI nie włączy GPT-5.5 w publicznym API.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Inne hostowane opcje w stylu subskrypcyjnym

- [Qwen Cloud](/pl/providers/qwen): powierzchnia dostawcy Qwen Cloud oraz mapowanie endpointów Alibaba DashScope i Coding Plan
- [MiniMax](/pl/providers/minimax): dostęp MiniMax Coding Plan przez OAuth lub klucz API
- [GLM Models](/pl/providers/glm): endpointy Z.AI Coding Plan lub ogólnego API

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
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Bezpośrednie uruchomienia Gemini akceptują też `agents.defaults.models["google/<model>"].params.cachedContent`
  (lub starsze `cached_content`) do przekazania natywnego dla dostawcy
  uchwytu `cachedContents/...`; trafienia cache Gemini są ujawniane jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów zewnętrznych. Zapoznaj się z warunkami Google i użyj niekrytycznego konta, jeśli zdecydujesz się kontynuować.
- OAuth Gemini CLI jest dostarczany jako część dołączonego Pluginu `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
  - Uwaga: **nie** wklejasz identyfikatora klienta ani sekretu do `openclaw.json`. Przepływ logowania CLI zapisuje
    tokeny w profilach uwierzytelniania na hoście gateway.
  - Jeśli żądania zawodzą po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway.
  - Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie awaryjnie pobierane jest z
    `stats`, przy czym `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` są normalizowane do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają konkretną powierzchnię

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
- Statyczny katalog fallback dostarcza `kilocode/kilo/auto`; wykrywanie na żywo
  `https://api.kilo.ai/api/gateway/models` może dodatkowo rozszerzyć katalog runtime.
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway,
  a nie jest zakodowany na stałe w OpenClaw.

Szczegóły konfiguracji znajdziesz w [/providers/kilocode](/pl/providers/kilocode).

### Inne dołączone Pluginy dostawców

| Dostawca                | Id                               | Env uwierzytelniania                                        | Przykładowy model                               |
| ----------------------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                          | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                          | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                             | —                                               |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`        | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                              | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                          | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` lub `KIMICODE_API_KEY`                       | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                   | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                           | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                          | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                            | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                        | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                           | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                           | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                          | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                            | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                        | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                    | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                               | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                            | `xiaomi/mimo-v2-flash`                          |

Warto znać następujące niuanse:

- **OpenRouter** stosuje swoje nagłówki atrybucji aplikacji i znaczniki Anthropic `cache_control` tylko na zweryfikowanych trasach `openrouter.ai`. Jako ścieżka proxy zgodna z OpenAI pomija kształtowanie specyficzne tylko dla natywnego OpenAI (`serviceTier`, Responses `store`, wskazówki prompt-cache, zgodność reasoning OpenAI). Referencje oparte na Gemini zachowują tylko oczyszczanie thought-signature dla proxy-Gemini.
- **Kilo Gateway** dla referencji opartych na Gemini stosuje tę samą ścieżkę oczyszczania proxy-Gemini; `kilocode/kilo/auto` i inne referencje proxy bez obsługi reasoning pomijają wstrzykiwanie proxy reasoning.
- **MiniMax** onboarding z kluczem API zapisuje jawne definicje modeli M2.7 z `input: ["text", "image"]`; dołączony katalog utrzymuje referencje czatu jako tylko tekstowe, dopóki ta konfiguracja nie zostanie zmaterializowana.
- **xAI** używa ścieżki xAI Responses. `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`. `tool_stream` jest domyślnie włączone; wyłącz przez `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** modele GLM używają `zai-glm-4.7` / `zai-glm-4.6`; bazowy URL zgodny z OpenAI to `https://api.cerebras.ai/v1`.

## Dostawcy przez `models.providers` (custom/base URL)

Używaj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców lub
proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych Pluginów dostawców publikuje już domyślny katalog.
Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać
domyślny bazowy URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony Plugin dostawcy. Domyślnie używaj wbudowanego dostawcy,
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

Starsze `kimi/k2p5` pozostaje akceptowane jako zgodnościowy identyfikator modelu.

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

Onboarding domyślnie używa powierzchni kodowania, ale ogólny katalog `volcengine/*`
jest rejestrowany w tym samym czasie.

W selektorach modeli onboarding/configure wybór uwierzytelniania Volcengine preferuje zarówno
wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do katalogu bez filtrowania zamiast pokazywać pusty
selektor ograniczony do dostawcy.

Dostępne modele:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modele kodowania (`volcengine-plan`):

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

Onboarding domyślnie używa powierzchni kodowania, ale ogólny katalog `byteplus/*`
jest rejestrowany w tym samym czasie.

W selektorach modeli onboarding/configure wybór uwierzytelniania BytePlus preferuje zarówno
wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do katalogu bez filtrowania zamiast pokazywać pusty
selektor ograniczony do dostawcy.

Dostępne modele:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modele kodowania (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic udostępnia modele zgodne z Anthropic za pośrednictwem dostawcy `synthetic`:

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
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub
  `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji znajdziesz w [/providers/minimax](/pl/providers/minimax).

Na ścieżce strumieniowania MiniMax zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking,
chyba że jawnie go ustawisz, a `/fast on` przepisuje
`MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział możliwości należący do Pluginu:

- Domyślne tekst/czat pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to należący do Pluginu `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje na identyfikatorze dostawcy `minimax`

### LM Studio

LM Studio jest dostarczane jako dołączony Plugin dostawcy, który używa natywnego API:

- Dostawca: `lmstudio`
- Uwierzytelnianie: `LM_API_TOKEN`
- Domyślny bazowy URL inferencji: `http://localhost:1234/v1`

Następnie ustaw model (zastąp jednym z identyfikatorów zwracanych przez `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw używa natywnych endpointów LM Studio `/api/v1/models` i `/api/v1/models/load` do wykrywania + automatycznego ładowania, a domyślnie `/v1/chat/completions` do inferencji.
Zobacz [/providers/lmstudio](/pl/providers/lmstudio), aby poznać konfigurację i rozwiązywanie problemów.

### Ollama

Ollama jest dostarczana jako dołączony Plugin dostawcy i używa natywnego API Ollama:

- Dostawca: `ollama`
- Uwierzytelnianie: niewymagane (serwer lokalny)
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

Ollama jest wykrywana lokalnie pod `http://127.0.0.1:11434`, gdy wyrazisz zgodę przez
`OLLAMA_API_KEY`, a dołączony Plugin dostawcy dodaje Ollama bezpośrednio do
`openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama),
aby poznać onboarding, tryb cloud/local oraz niestandardową konfigurację.

### vLLM

vLLM jest dostarczany jako dołączony Plugin dostawcy dla lokalnych/samodzielnie hostowanych
serwerów zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

```bash
export VLLM_API_KEY="vllm-local"
```

Następnie ustaw model (zastąp jednym z identyfikatorów zwracanych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/vllm](/pl/providers/vllm).

### SGLang

SGLang jest dostarczany jako dołączony Plugin dostawcy dla szybkich, samodzielnie hostowanych
serwerów zgodnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli Twój serwer nie
wymusza uwierzytelniania):

```bash
export SGLANG_API_KEY="sglang-local"
```

Następnie ustaw model (zastąp jednym z identyfikatorów zwracanych przez `/v1/models`):

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
  Jeśli zostaną pominięte, OpenClaw przyjmuje domyślnie:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecenie: ustaw jawne wartości zgodne z limitami Twojego proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 dostawcy dla nieobsługiwanych ról `developer`.
- Trasy proxy zgodne z OpenAI pomijają też kształtowanie żądań specyficzne wyłącznie dla natywnego OpenAI:
  brak `service_tier`, brak Responses `store`, brak wskazówek prompt-cache, brak
  kształtowania payloadu reasoning-compat OpenAI i brak ukrytych nagłówków
  atrybucji OpenClaw.
- Jeśli `baseUrl` jest puste/pominięte, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
- Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` jest nadal nadpisywane na nienatywnych endpointach `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz też: [/gateway/configuration](/pl/gateway/configuration), aby poznać pełne przykłady konfiguracji.

## Powiązane

- [Modele](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Model Failover](/pl/concepts/model-failover) — łańcuchy fallbacku i zachowanie ponawiania
- [Configuration Reference](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Providers](/pl/providers) — przewodniki konfiguracji dla poszczególnych dostawców
