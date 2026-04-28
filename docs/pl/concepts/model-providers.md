---
read_when:
    - Potrzebujesz dokumentacji konfiguracji modeli dla każdego providera osobno
    - Chcesz przykładowe konfiguracje lub polecenia onboardingu CLI dla providerów modeli
sidebarTitle: Model providers
summary: Przegląd providerów modeli z przykładowymi konfiguracjami i przepływami CLI
title: Providerzy modeli
x-i18n:
    generated_at: "2026-04-26T11:27:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

Dokumentacja **providerów LLM/modeli** (nie kanałów czatu, takich jak WhatsApp/Telegram). Reguły wyboru modeli znajdziesz w [Modelach](/pl/concepts/models).

## Szybkie zasady

<AccordionGroup>
  <Accordion title="Odwołania do modeli i pomocniki CLI">
    - Odwołania do modeli używają `provider/model` (przykład: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` działa jako lista dozwolonych, gdy jest ustawione.
    - Pomocniki CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.models[].contextWindow` to natywne metadane modelu; `contextTokens` to efektywny limit środowiska uruchomieniowego.
    - Reguły fallbacku, sondy cooldown i trwałość nadpisań sesji: [Failover modeli](/pl/concepts/model-failover).

  </Accordion>
  <Accordion title="Podział providera/środowiska uruchomieniowego OpenAI">
    Trasy rodziny OpenAI są specyficzne dla prefiksu:

    - `openai/<model>` używa bezpośredniego providera klucza API OpenAI w PI.
    - `openai-codex/<model>` używa OAuth Codex w PI.
    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` używa natywnego harnessu serwera aplikacji Codex.

    Zobacz [OpenAI](/pl/providers/openai) i [Harness Codex](/pl/plugins/codex-harness). Jeśli podział providera/środowiska uruchomieniowego jest niejasny, najpierw przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

    Automatyczne włączanie Pluginów podąża za tą samą granicą: `openai-codex/<model>` należy do Plugin OpenAI, podczas gdy Plugin Codex jest włączany przez `agentRuntime.id: "codex"` lub starsze odwołania `codex/<model>`.

    GPT-5.5 jest dostępny przez `openai/gpt-5.5` dla bezpośredniego ruchu z kluczem API, `openai-codex/gpt-5.5` w PI dla OAuth Codex oraz przez natywny harness serwera aplikacji Codex, gdy ustawiono `agentRuntime.id: "codex"`.

  </Accordion>
  <Accordion title="Środowiska uruchomieniowe CLI">
    Środowiska uruchomieniowe CLI używają tego samego podziału: wybierz kanoniczne odwołania do modeli, takie jak `anthropic/claude-*`, `google/gemini-*` lub `openai/gpt-*`, a następnie ustaw `agents.defaults.agentRuntime.id` na `claude-cli`, `google-gemini-cli` lub `codex-cli`, gdy chcesz lokalny backend CLI.

    Starsze odwołania `claude-cli/*`, `google-gemini-cli/*` i `codex-cli/*` są migrowane z powrotem do kanonicznych odwołań providera, z osobno zapisywanym środowiskiem uruchomieniowym.

  </Accordion>
</AccordionGroup>

## Zachowanie providera należące do Pluginu

Większość logiki specyficznej dla providera znajduje się w Pluginach providerów (`registerProvider(...)`), podczas gdy OpenClaw zachowuje ogólną pętlę inferencji. Pluginy odpowiadają za onboarding, katalogi modeli, mapowanie zmiennych środowiskowych autoryzacji, normalizację transportu/konfiguracji, czyszczenie schematów narzędzi, klasyfikację failoveru, odświeżanie OAuth, raportowanie użycia, profile thinking/reasoning i inne.

Pełna lista hooków provider-SDK i przykłady dołączonych Pluginów znajdują się w [Pluginach providerów](/pl/plugins/sdk-provider-plugins). Provider, który potrzebuje całkowicie niestandardowego wykonawcy żądań, korzysta z osobnej, głębszej powierzchni rozszerzeń.

<Note>
Środowisko uruchomieniowe providera `capabilities` to współdzielone metadane runnera (rodzina providera, niuanse transkryptów/narzędzi, wskazówki transportu/cache). To nie jest to samo co [publiczny model możliwości](/pl/plugins/architecture#public-capability-model), który opisuje, co rejestruje Plugin (inferencja tekstu, mowa itd.).
</Note>

## Rotacja kluczy API

<AccordionGroup>
  <Accordion title="Źródła kluczy i priorytet">
    Skonfiguruj wiele kluczy przez:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze aktywne nadpisanie, najwyższy priorytet)
    - `<PROVIDER>_API_KEYS` (lista rozdzielona przecinkami lub średnikami)
    - `<PROVIDER>_API_KEY` (klucz podstawowy)
    - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)

    Dla providerów Google `GOOGLE_API_KEY` jest również uwzględniany jako fallback. Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.

  </Accordion>
  <Accordion title="Kiedy uruchamia się rotacja">
    - Żądania są ponawiane z następnym kluczem tylko przy odpowiedziach o ograniczeniu szybkości (na przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` lub okresowych komunikatach o limitach użycia).
    - Błędy inne niż ograniczenie szybkości kończą działanie natychmiast; nie jest podejmowana próba rotacji kluczy.
    - Gdy wszystkie klucze kandydackie zawiodą, zwracany jest końcowy błąd z ostatniej próby.

  </Accordion>
</AccordionGroup>

## Wbudowani providerzy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi‑ai. Ci providerzy **nie** wymagają konfiguracji `models.providers`; wystarczy ustawić autoryzację i wybrać model.

### OpenAI

- Provider: `openai`
- Autoryzacja: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Zweryfikuj dostępność konta/modelu za pomocą `openclaw models list --provider openai`, jeśli konkretna instalacja lub klucz API zachowuje się inaczej.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, fallback SSE)
- Nadpisanie per model przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewanie WebSocket OpenAI Responses jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` w `api.openai.com`
- Użyj `params.serviceTier`, gdy chcesz jawny poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są stosowane tylko do natywnego ruchu OpenAI do `api.openai.com`, a nie do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują też `store` Responses, wskazówki prompt cache oraz kształtowanie ładunku zgodne z reasoning OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo ukryty w OpenClaw, ponieważ aktywne żądania API OpenAI go odrzucają, a bieżący katalog Codex go nie udostępnia

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Autoryzacja: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniony kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Preferowana konfiguracja Claude CLI zachowuje kanoniczne odwołanie do modelu i osobno wybiera backend CLI: `anthropic/claude-opus-4-7` z `agents.defaults.agentRuntime.id: "claude-cli"`. Starsze odwołania `claude-cli/claude-opus-4-7` nadal działają dla zgodności.

<Note>
Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako autoryzowane dla tej integracji, chyba że Anthropic opublikuje nową politykę. Token konfiguracji Anthropic nadal pozostaje obsługiwaną ścieżką tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI Codex

- Provider: `openai-codex`
- Autoryzacja: OAuth (ChatGPT)
- Odwołanie modelu PI: `openai-codex/gpt-5.5`
- Odwołanie natywnego harnessu serwera aplikacji Codex: `openai/gpt-5.5` z `agents.defaults.agentRuntime.id: "codex"`
- Dokumentacja natywnego harnessu serwera aplikacji Codex: [Harness Codex](/pl/plugins/codex-harness)
- Starsze odwołania do modeli: `codex/gpt-*`
- Granica Pluginu: `openai-codex/*` ładuje Plugin OpenAI; natywny Plugin serwera aplikacji Codex jest wybierany tylko przez środowisko uruchomieniowe harnessu Codex lub starsze odwołania `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` lub `openclaw models auth login --provider openai-codex`
- Domyślny transport to `auto` (najpierw WebSocket, fallback SSE)
- Nadpisanie per model PI przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest również przekazywane przy natywnych żądaniach Responses Codex (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są dołączane tylko przy natywnym ruchu Codex do `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.5` używa natywnego katalogu Codex `contextWindow = 400000` i domyślnego runtime `contextTokens = 272000`; nadpisz limit runtime przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca zasad: OAuth OpenAI Codex jest jawnie wspierany dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.
- Użyj `openai-codex/gpt-5.5`, gdy chcesz trasy OAuth/subskrypcji Codex; użyj `openai/gpt-5.5`, gdy konfiguracja klucza API i lokalny katalog udostępniają publiczną trasę API.

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

<CardGroup cols={3}>
  <Card title="Modele GLM" href="/pl/providers/glm">
    Plan Z.AI Coding lub ogólne endpointy API.
  </Card>
  <Card title="MiniMax" href="/pl/providers/minimax">
    OAuth MiniMax Coding Plan lub dostęp przez klucz API.
  </Card>
  <Card title="Qwen Cloud" href="/pl/providers/qwen">
    Powierzchnia providera Qwen Cloud oraz mapowanie endpointów Alibaba DashScope i Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Autoryzacja: `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`)
- Provider środowiska uruchomieniowego Zen: `opencode`
- Provider środowiska uruchomieniowego Go: `opencode-go`
- Przykładowe modele: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (klucz API)

- Provider: `google`
- Autoryzacja: `GEMINI_API_KEY`
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` używa dynamic thinking Google. Gemini 3/3.1 pomija stałe `thinkingLevel`; Gemini 2.5 wysyła `thinkingBudget: -1`.
- Bezpośrednie uruchomienia Gemini akceptują też `agents.defaults.models["google/<model>"].params.cachedContent` (lub starsze `cached_content`) do przekazywania natywnego uchwytu providera `cachedContents/...`; trafienia cache Gemini są ujawniane jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Providerzy: `google-vertex`, `google-gemini-cli`
- Autoryzacja: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth

<Warning>
OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów firm trzecich. Przejrzyj warunki Google i użyj niekrytycznego konta, jeśli zdecydujesz się kontynuować.
</Warning>

OAuth Gemini CLI jest dostarczany jako część dołączonego Pluginu `google`.

<Steps>
  <Step title="Zainstaluj Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Włącz Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Zaloguj się">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Domyślny model: `google-gemini-cli/gemini-3-flash-preview`. **Nie** wklejasz identyfikatora klienta ani sekretu do `openclaw.json`. Przepływ logowania CLI zapisuje tokeny w profilach autoryzacji na hoście Gateway.

  </Step>
  <Step title="Ustaw projekt (jeśli potrzebne)">
    Jeśli żądania kończą się błędem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway.
  </Step>
</Steps>

Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie zapasowo bierze się z `stats`, przy czym `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Autoryzacja: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` są normalizowane do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają konkretną powierzchnię

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Autoryzacja: `AI_GATEWAY_API_KEY`
- Przykładowe modele: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Autoryzacja: `KILOCODE_API_KEY`
- Przykładowy model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog zapasowy zawiera `kilocode/kilo/auto`; aktywne wykrywanie `https://api.kilo.ai/api/gateway/models` może dodatkowo rozszerzyć katalog środowiska uruchomieniowego.
- Dokładne trasowanie upstream za `kilocode/kilo/auto` należy do Kilo Gateway, a nie jest zakodowane na sztywno w OpenClaw.

Zobacz [/providers/kilocode](/pl/providers/kilocode), aby poznać szczegóły konfiguracji.

### Inne dołączone Pluginy providerów

| Provider                | Id                               | Zmienna env autoryzacji                                     | Przykładowy model                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` lub `KIMICODE_API_KEY`                        | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

#### Warte znajomości niuanse

<AccordionGroup>
  <Accordion title="OpenRouter">
    Stosuje własne nagłówki atrybucji aplikacji i znaczniki Anthropic `cache_control` tylko na zweryfikowanych trasach `openrouter.ai`. Odwołania DeepSeek, Moonshot i ZAI kwalifikują się do TTL cache dla prompt cache zarządzanego przez OpenRouter, ale nie otrzymują znaczników cache Anthropic. Jako ścieżka proxy zgodna z OpenAI pomija kształtowanie specyficzne wyłącznie dla natywnego OpenAI (`serviceTier`, `store` Responses, wskazówki prompt cache, zgodność z reasoning OpenAI). Odwołania oparte na Gemini zachowują tylko sanityzację thought-signature dla proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Odwołania oparte na Gemini podążają tą samą ścieżką sanityzacji proxy-Gemini; `kilocode/kilo/auto` i inne odwołania proxy bez obsługi reasoning pomijają wstrzykiwanie reasoning proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding z kluczem API zapisuje jawne definicje modeli czatu M2.7 tylko dla tekstu; rozumienie obrazów pozostaje przy należącym do Pluginu providerze mediów `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="xAI">
    Używa ścieżki xAI Responses. `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`. `tool_stream` jest domyślnie włączone; wyłącz przez `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Modele GLM używają `zai-glm-4.7` / `zai-glm-4.6`; bazowy URL zgodny z OpenAI to `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Providerzy przez `models.providers` (custom/base URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** providerów albo proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych Pluginów providerów publikuje już domyślny katalog. Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać domyślny bazowy URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony Plugin providera. Domyślnie używaj wbudowanego providera, a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy musisz nadpisać bazowy URL lub metadane modelu:

- Provider: `moonshot`
- Autoryzacja: `MOONSHOT_API_KEY`
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

- Provider: `kimi`
- Autoryzacja: `KIMI_API_KEY`
- Przykładowy model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Starsze `kimi/k2p5` pozostaje akceptowane jako zgodny identyfikator modelu.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) zapewnia dostęp do Doubao i innych modeli w Chinach.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Autoryzacja: `VOLCANO_ENGINE_API_KEY`
- Przykładowy model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding domyślnie używa powierzchni coding, ale ogólny katalog `volcengine/*` jest rejestrowany jednocześnie.

W selektorach modeli onboarding/configure wybór autoryzacji Volcengine preferuje zarówno wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw przełącza się na niefiltrowany katalog zamiast pokazywać pusty selektor z zakresem providera.

<Tabs>
  <Tab title="Modele standardowe">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modele coding (`volcengine-plan`)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (międzynarodowy)

BytePlus ARK zapewnia międzynarodowym użytkownikom dostęp do tych samych modeli co Volcano Engine.

- Provider: `byteplus` (coding: `byteplus-plan`)
- Autoryzacja: `BYTEPLUS_API_KEY`
- Przykładowy model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding domyślnie używa powierzchni coding, ale ogólny katalog `byteplus/*` jest rejestrowany jednocześnie.

W selektorach modeli onboarding/configure wybór autoryzacji BytePlus preferuje zarówno wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw przełącza się na niefiltrowany katalog zamiast pokazywać pusty selektor z zakresem providera.

<Tabs>
  <Tab title="Modele standardowe">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modele coding (`byteplus-plan`)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic udostępnia modele zgodne z Anthropic przez providera `synthetic`:

- Provider: `synthetic`
- Autoryzacja: `SYNTHETIC_API_KEY`
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
- MiniMax klucz API (Global): `--auth-choice minimax-global-api`
- MiniMax klucz API (CN): `--auth-choice minimax-cn-api`
- Autoryzacja: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`

Zobacz [/providers/minimax](/pl/providers/minimax), aby poznać szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji.

<Note>
Na strumieniowej ścieżce MiniMax zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking, chyba że jawnie go ustawisz, a `/fast on` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
</Note>

Podział możliwości należących do Pluginu:

- Domyślne tekst/czat pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to należący do Pluginu `MiniMax-VL-01` na obu ścieżkach autoryzacji MiniMax
- Wyszukiwanie w sieci pozostaje na identyfikatorze providera `minimax`

### LM Studio

LM Studio jest dostarczane jako dołączony Plugin providera, który używa natywnego API:

- Provider: `lmstudio`
- Autoryzacja: `LM_API_TOKEN`
- Domyślny bazowy URL inferencji: `http://localhost:1234/v1`

Następnie ustaw model (zastąp jednym z identyfikatorów zwracanych przez `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw używa natywnych endpointów LM Studio `/api/v1/models` i `/api/v1/models/load` do wykrywania i automatycznego ładowania, a domyślnie `/v1/chat/completions` do inferencji. Zobacz [/providers/lmstudio](/pl/providers/lmstudio), aby poznać konfigurację i rozwiązywanie problemów.

### Ollama

Ollama jest dostarczana jako dołączony Plugin providera i używa natywnego API Ollama:

- Provider: `ollama`
- Autoryzacja: nie jest wymagana (serwer lokalny)
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

Ollama jest lokalnie wykrywana pod `http://127.0.0.1:11434`, gdy włączysz ją przez `OLLAMA_API_KEY`, a dołączony Plugin providera dodaje Ollama bezpośrednio do `openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama), aby poznać onboarding, tryb cloud/local i konfigurację niestandardową.

### vLLM

vLLM jest dostarczane jako dołączony Plugin providera dla lokalnych/samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Provider: `vllm`
- Autoryzacja: opcjonalna (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby włączyć lokalne automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie wymusza autoryzacji):

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

Zobacz [/providers/vllm](/pl/providers/vllm), aby poznać szczegóły.

### SGLang

SGLang jest dostarczane jako dołączony Plugin providera dla szybkich, samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Provider: `sglang`
- Autoryzacja: opcjonalna (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby włączyć lokalne automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie wymusza autoryzacji):

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

Zobacz [/providers/sglang](/pl/providers/sglang), aby poznać szczegóły.

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

<AccordionGroup>
  <Accordion title="Domyślne pola opcjonalne">
    Dla niestandardowych providerów pola `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne. Gdy są pominięte, OpenClaw domyślnie ustawia:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Zalecenie: ustaw jawne wartości zgodne z limitami proxy/modelu.

  </Accordion>
  <Accordion title="Reguły kształtowania tras proxy">
    - Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów providera 400 dla nieobsługiwanych ról `developer`.
    - Trasy proxy zgodne z OpenAI pomijają też kształtowanie żądań specyficzne wyłącznie dla natywnego OpenAI: brak `service_tier`, brak `store` Responses, brak `store` Completions, brak wskazówek prompt cache, brak kształtowania ładunku zgodnego z reasoning OpenAI oraz brak ukrytych nagłówków atrybucji OpenClaw.
    - Dla proxy Completions zgodnych z OpenAI, które potrzebują pól specyficznych dla dostawcy, ustaw `agents.defaults.models["provider/model"].params.extra_body` (lub `extraBody`), aby scalić dodatkowy JSON z wychodzącym ciałem żądania.
    - Dla sterowania szablonem czatu vLLM ustaw `agents.defaults.models["provider/model"].params.chat_template_kwargs`. OpenClaw automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true` dla `vllm/nemotron-3-*`, gdy poziom thinking sesji jest wyłączony.
    - Jeśli `baseUrl` jest puste lub pominięte, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
    - Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na nienatywnych endpointach `openai-completions`.

  </Accordion>
</AccordionGroup>

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz też: [Konfiguracja](/pl/gateway/configuration), aby poznać pełne przykłady konfiguracji.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Failover modeli](/pl/concepts/model-failover) — łańcuchy fallbacku i zachowanie ponawiania
- [Modele](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Providerzy](/pl/providers) — przewodniki konfiguracji dla poszczególnych providerów
