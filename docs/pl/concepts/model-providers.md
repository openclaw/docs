---
read_when:
    - Potrzebujesz dokumentacji referencyjnej konfiguracji modeli dla poszczególnych dostawców
    - Chcesz przykładowe konfiguracje lub polecenia wdrażania CLI dla dostawców modeli
sidebarTitle: Model providers
summary: Omówienie dostawców modeli z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-05-11T20:28:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

Odniesienie dla **dostawców LLM/modeli** (nie kanałów czatu takich jak WhatsApp/Telegram). Zasady wyboru modeli znajdziesz w [Modele](/pl/concepts/models).

## Szybkie zasady

<AccordionGroup>
  <Accordion title="Referencje modeli i pomocnicze narzędzia CLI">
    - Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` działa jako lista dozwolonych pozycji, gdy jest ustawione.
    - Pomocnicze narzędzia CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ustawiają wartości domyślne na poziomie dostawcy; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` nadpisują je dla danego modelu.
    - Zasady awaryjnego przełączania, sondy schładzania i utrwalanie nadpisań sesji: [Awaryjne przełączanie modeli](/pl/concepts/model-failover).

  </Accordion>
  <Accordion title="Dodanie uwierzytelniania dostawcy nie zmienia modelu głównego">
    `openclaw configure` zachowuje istniejące `agents.defaults.model.primary`, gdy dodajesz dostawcę lub ponownie wykonujesz uwierzytelnienie dostawcy. `openclaw models auth login` robi to samo, chyba że przekażesz `--set-default`. Pluginy dostawców nadal mogą zwracać zalecany model domyślny w poprawce konfiguracji uwierzytelniania, ale OpenClaw traktuje to jako „udostępnij ten model”, gdy model główny już istnieje, a nie jako „zastąp bieżący model główny”.

    Aby celowo przełączyć model domyślny, użyj `openclaw models set <provider/model>` albo `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Podział dostawcy i środowiska uruchomieniowego OpenAI">
    Trasy z rodziny OpenAI zależą od prefiksu:

    - `openai/<model>` domyślnie używa natywnego app-server harness Codex do tur agenta. To typowa konfiguracja subskrypcji ChatGPT/Codex.
    - `openai-codex/<model>` to starsza konfiguracja, którą doctor przepisuje na `openai/<model>`.
    - `openai/<model>` plus `agentRuntime.id: "pi"` dostawcy/modelu używa PI dla jawnych tras z kluczem API lub tras zgodności.

    Zobacz [OpenAI](/pl/providers/openai) i [Codex harness](/pl/plugins/codex-harness). Jeśli podział dostawcy i środowiska uruchomieniowego jest niejasny, najpierw przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

    Automatyczne włączanie Pluginów podąża tą samą granicą: referencje agentów `openai/*` włączają Plugin Codex dla trasy domyślnej, a jawne `agentRuntime.id: "codex"` dostawcy/modelu lub starsze referencje `codex/<model>` także go wymagają.

    GPT-5.5 jest domyślnie dostępny przez natywny app-server harness Codex na `openai/gpt-5.5`, a przez PI tylko wtedy, gdy polityka środowiska uruchomieniowego dostawcy/modelu jawnie wybiera `pi`.

  </Accordion>
  <Accordion title="Środowiska uruchomieniowe CLI">
    Środowiska uruchomieniowe CLI używają tego samego podziału: wybierz kanoniczne referencje modeli, takie jak `anthropic/claude-*`, `google/gemini-*` lub `openai/gpt-*`, a następnie ustaw politykę środowiska uruchomieniowego dostawcy/modelu na `claude-cli`, `google-gemini-cli` albo `codex-cli`, gdy chcesz użyć lokalnego backendu CLI.

    Starsze referencje `claude-cli/*`, `google-gemini-cli/*` i `codex-cli/*` migrują z powrotem do kanonicznych referencji dostawców z osobno zapisaną informacją o środowisku uruchomieniowym.

  </Accordion>
</AccordionGroup>

## Zachowanie dostawców należące do Pluginów

Większość logiki specyficznej dla dostawcy znajduje się w Pluginach dostawców (`registerProvider(...)`), podczas gdy OpenClaw utrzymuje ogólną pętlę wnioskowania. Pluginy odpowiadają za wdrażanie, katalogi modeli, mapowanie zmiennych środowiskowych uwierzytelniania, normalizację transportu/konfiguracji, czyszczenie schematów narzędzi, klasyfikację awaryjnego przełączania, odświeżanie OAuth, raportowanie użycia, profile myślenia/rozumowania i więcej.

Pełna lista hooków provider-SDK i przykładów dołączonych Pluginów znajduje się w [Pluginy dostawców](/pl/plugins/sdk-provider-plugins). Dostawca, który potrzebuje całkowicie niestandardowego wykonawcy żądań, korzysta z osobnej, głębszej powierzchni rozszerzeń.

<Note>
Zachowanie runnera należące do dostawcy znajduje się w jawnych hookach dostawcy, takich jak polityka odtwarzania, normalizacja schematów narzędzi, opakowywanie strumieni oraz pomocnicze funkcje transportu/żądań. Starsza statyczna torba `ProviderPlugin.capabilities` służy wyłącznie zgodności i nie jest już odczytywana przez współdzieloną logikę runnera.
</Note>

## Rotacja kluczy API

<AccordionGroup>
  <Accordion title="Źródła kluczy i priorytet">
    Skonfiguruj wiele kluczy przez:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie live, najwyższy priorytet)
    - `<PROVIDER>_API_KEYS` (lista rozdzielona przecinkami lub średnikami)
    - `<PROVIDER>_API_KEY` (klucz główny)
    - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)

    Dla dostawców Google `GOOGLE_API_KEY` jest także uwzględniany jako fallback. Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.

  </Accordion>
  <Accordion title="Kiedy uruchamia się rotacja">
    - Żądania są ponawiane z następnym kluczem tylko po odpowiedziach dotyczących limitów szybkości (na przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` albo okresowych komunikatach o limitach użycia).
    - Błędy niezwiązane z limitami szybkości kończą się niepowodzeniem natychmiast; rotacja kluczy nie jest podejmowana.
    - Gdy wszystkie klucze kandydujące zawiodą, zwracany jest końcowy błąd z ostatniej próby.

  </Accordion>
</AccordionGroup>

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi-ai. Ci dostawcy **nie** wymagają konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` oraz `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Zweryfikuj dostępność konta/modelu za pomocą `openclaw models list --provider openai`, jeśli konkretna instalacja lub klucz API zachowuje się inaczej.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto`; OpenClaw przekazuje wybór transportu do pi-ai.
- Nadpisz dla danego modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Przetwarzanie priorytetowe OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` na `api.openai.com`
- Użyj `params.serviceTier`, gdy chcesz jawny poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) mają zastosowanie tylko do natywnego ruchu OpenAI do `api.openai.com`, a nie do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują także `store` Responses, wskazówki pamięci podręcznej promptów oraz kształtowanie ładunku zgodne z rozumowaniem OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo pomijany w OpenClaw, ponieważ żądania live do API OpenAI go odrzucają, a bieżący katalog Codex go nie udostępnia

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Dostawca: `anthropic`
- Uwierzytelnianie: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` oraz `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch z kluczem API i uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Preferowana konfiguracja Claude CLI zachowuje kanoniczną referencję modelu i wybiera backend CLI osobno: `anthropic/claude-opus-4-7` z modelowym `agentRuntime.id: "claude-cli"`. Starsze referencje `claude-cli/claude-opus-4-7` nadal działają dla zgodności.

<Note>
Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę. Token setup-token Anthropic pozostaje dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw obecnie preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI Codex

- Dostawca: `openai-codex`
- Uwierzytelnianie: OAuth (ChatGPT)
- Starsza referencja modelu PI: `openai-codex/gpt-5.5`
- Natywna referencja app-server harness Codex: `openai/gpt-5.5`
- Dokumentacja natywnego app-server harness Codex: [Codex harness](/pl/plugins/codex-harness)
- Starsze referencje modeli: `codex/gpt-*`
- Granica Pluginu: `openai-codex/*` ładuje Plugin OpenAI; natywny Plugin app-server Codex jest wybierany tylko przez środowisko uruchomieniowe Codex harness albo starsze referencje `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` albo `openclaw models auth login --provider openai-codex`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisz dla danego modelu PI przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest także przekazywane w natywnych żądaniach Responses Codex (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są dołączane tylko do natywnego ruchu Codex do `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli tę samą konfigurację przełącznika `/fast` i `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.5` używa natywnego `contextWindow = 400000` z katalogu Codex i domyślnego runtime `contextTokens = 272000`; nadpisz limit runtime przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca polityki: OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.
- Dla typowej trasy subskrypcji plus natywnego środowiska uruchomieniowego Codex zaloguj się uwierzytelnianiem `openai-codex`, ale skonfiguruj `openai/gpt-5.5`; tury agenta OpenAI domyślnie wybierają Codex.
- Użyj `agentRuntime.id: "pi"` dostawcy/modelu tylko wtedy, gdy chcesz trasę zgodności przez PI; w przeciwnym razie pozostaw `openai/gpt-5.5` na domyślnym Codex harness.
- Starsze referencje `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` i `openai-codex/gpt-5.3*` są pomijane, ponieważ konta OAuth ChatGPT/Codex je odrzucają; zamiast tego użyj `openai-codex/gpt-5.5` albo natywnej trasy środowiska uruchomieniowego Codex.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
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

### Inne hostowane opcje w stylu subskrypcji

<CardGroup cols={3}>
  <Card title="Modele GLM" href="/pl/providers/glm">
    Z.AI Coding Plan albo ogólne punkty końcowe API.
  </Card>
  <Card title="MiniMax" href="/pl/providers/minimax">
    OAuth MiniMax Coding Plan albo dostęp przez klucz API.
  </Card>
  <Card title="Qwen Cloud" href="/pl/providers/qwen">
    Powierzchnia dostawcy Qwen Cloud oraz mapowanie punktów końcowych Alibaba DashScope i Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`)
- Dostawca środowiska uruchomieniowego Zen: `opencode`
- Dostawca środowiska uruchomieniowego Go: `opencode-go`
- Przykładowe modele: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` albo `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (klucz API)

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY`
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, awaryjne użycie `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` jest akceptowany i normalizowany do aktywnego identyfikatora Google Gemini API, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Myślenie: `/think adaptive` używa dynamicznego myślenia Google. Gemini 3/3.1 pomijają stały `thinkingLevel`; Gemini 2.5 wysyła `thinkingBudget: -1`.
- Bezpośrednie uruchomienia Gemini akceptują także `agents.defaults.models["google/<model>"].params.cachedContent` (lub starsze `cached_content`) w celu przekazania natywnego dla dostawcy uchwytu `cachedContents/...`; trafienia w pamięć podręczną Gemini pojawiają się jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth

<Warning>
Gemini CLI OAuth w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia konta Google po użyciu klientów firm trzecich. Przejrzyj warunki Google i użyj konta niekrytycznego, jeśli zdecydujesz się kontynuować.
</Warning>

Gemini CLI OAuth jest dostarczany jako część dołączonego Plugin `google`.

<Steps>
  <Step title="Install Gemini CLI">
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
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Domyślny model: `google-gemini-cli/gemini-3-flash-preview`. **Nie** wklejasz identyfikatora klienta ani sekretu do `openclaw.json`. Przepływ logowania CLI zapisuje tokeny w profilach uwierzytelniania na hoście gateway.

  </Step>
  <Step title="Set project (if needed)">
    Jeśli żądania nie działają po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway.
  </Step>
</Steps>

Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie awaryjnie korzysta ze `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` normalizują się do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają konkretną powierzchnię

### Vercel AI Gateway

- Dostawca: `vercel-ai-gateway`
- Uwierzytelnianie: `AI_GATEWAY_API_KEY`
- Przykładowe modele: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Dostawca: `kilocode`
- Uwierzytelnianie: `KILOCODE_API_KEY`
- Przykładowy model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog awaryjny dostarcza `kilocode/kilo/auto`; wykrywanie na żywo `https://api.kilo.ai/api/gateway/models` może dodatkowo rozszerzyć katalog środowiska uruchomieniowego.
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway, nie jest zakodowany na stałe w OpenClaw.

Zobacz [/providers/kilocode](/pl/providers/kilocode), aby uzyskać szczegóły konfiguracji.

### Inne dołączone Plugin dostawców

| Dostawca                | Id                               | Zmienna środowiskowa uwierzytelniania                        | Przykładowy model                             |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` lub `KIMICODE_API_KEY`                        | `kimi/kimi-for-coding`                        |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Niuanse, które warto znać

<AccordionGroup>
  <Accordion title="OpenRouter">
    Stosuje nagłówki atrybucji aplikacji i znaczniki Anthropic `cache_control` tylko na zweryfikowanych trasach `openrouter.ai`. Referencje DeepSeek, Moonshot i ZAI kwalifikują się do TTL pamięci podręcznej przy buforowaniu promptów zarządzanym przez OpenRouter, ale nie otrzymują znaczników pamięci podręcznej Anthropic. Jako ścieżka zgodna z OpenAI w stylu proxy pomija kształtowanie właściwe tylko dla natywnego OpenAI (`serviceTier`, Responses `store`, wskazówki pamięci podręcznej promptów, zgodność rozumowania OpenAI). Referencje oparte na Gemini zachowują tylko sanityzację sygnatur myślenia proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referencje oparte na Gemini używają tej samej ścieżki sanityzacji proxy-Gemini; `kilocode/kilo/auto` i inne referencje proxy bez obsługi rozumowania pomijają wstrzykiwanie rozumowania proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding z kluczem API zapisuje jawne definicje modelu czatu M2.7 wyłącznie tekstowego; rozumienie obrazów pozostaje w należącym do pluginu dostawcy mediów `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Identyfikatory modeli używają przestrzeni nazw `nvidia/<vendor>/<model>` (na przykład `nvidia/nvidia/nemotron-...` obok `nvidia/moonshotai/kimi-k2.5`); selektory zachowują dosłowną kompozycję `<provider>/<model-id>`, podczas gdy klucz kanoniczny wysyłany do API pozostaje z jednym prefiksem.
  </Accordion>
  <Accordion title="xAI">
    Używa ścieżki xAI Responses. `grok-4.3` to dołączony domyślny model czatu. `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`. `tool_stream` jest domyślnie włączone; wyłącz przez `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Dostarczany jako dołączony Plugin dostawcy `cerebras`. GLM używa `zai-glm-4.7`; bazowy URL zgodny z OpenAI to `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Dostawcy przez `models.providers` (niestandardowy/bazowy URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców albo proxy zgodne z OpenAI/Anthropic.

Wiele poniższych dołączonych pluginów dostawców publikuje już domyślny katalog. Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać domyślny bazowy URL, nagłówki lub listę modeli.

Kontrole możliwości modeli Gateway odczytują także jawne metadane `models.providers.<id>.models[]`. Jeśli model niestandardowy lub proxy akceptuje obrazy, ustaw `input: ["text", "image"]` dla tego modelu, aby WebChat i ścieżki załączników pochodzące z węzła przekazywały obrazy jako natywne dane wejściowe modelu zamiast tekstowych referencji mediów.

`agents.defaults.models["provider/model"]` kontroluje tylko widoczność modelu, aliasy i metadane poszczególnych modeli dla agentów. Samo w sobie nie rejestruje nowego modelu runtime. Dla niestandardowych modeli dostawców dodaj także `models.providers.<provider>.models[]` z co najmniej pasującym `id`.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony Plugin dostawcy. Domyślnie używaj wbudowanego dostawcy i dodawaj jawny wpis `models.providers.moonshot` tylko wtedy, gdy musisz nadpisać bazowy URL lub metadane modelu:

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

### Kodowanie Kimi

Kimi Coding używa punktu końcowego zgodnego z Anthropic od Moonshot AI:

- Dostawca: `kimi`
- Uwierzytelnianie: `KIMI_API_KEY`
- Przykładowy model: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Starsze `kimi/kimi-code` i `kimi/k2p5` pozostają akceptowane jako identyfikatory modeli zgodności i są normalizowane do stabilnego identyfikatora modelu API Kimi.

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

Onboarding domyślnie używa powierzchni kodowania, ale ogólny katalog `volcengine/*` jest rejestrowany w tym samym czasie.

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania Volcengine preferuje wiersze `volcengine/*` i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do dostawcy.

<Tabs>
  <Tab title="Modele standardowe">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modele do kodowania (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (międzynarodowy)

BytePlus ARK zapewnia użytkownikom międzynarodowym dostęp do tych samych modeli co Volcano Engine.

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

Onboarding domyślnie używa powierzchni kodowania, ale ogólny katalog `byteplus/*` jest rejestrowany w tym samym czasie.

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania BytePlus preferuje wiersze `byteplus/*` i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do dostawcy.

<Tabs>
  <Tab title="Modele standardowe">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modele do kodowania (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic zapewnia modele zgodne z Anthropic za dostawcą `synthetic`:

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
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`

Zobacz [/providers/minimax](/pl/providers/minimax), aby poznać szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji.

<Note>
Na ścieżce strumieniowania zgodnej z Anthropic MiniMax OpenClaw domyślnie wyłącza myślenie, chyba że ustawisz je jawnie, a `/fast on` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
</Note>

Podział możliwości należących do Pluginu:

- Domyślne ustawienia tekstu/czatu pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów należy do Pluginu `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
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

OpenClaw używa natywnych `/api/v1/models` i `/api/v1/models/load` LM Studio do wykrywania i automatycznego ładowania, a domyślnie `/v1/chat/completions` do inferencji. Jeśli chcesz, aby ładowanie JIT, TTL i automatyczne usuwanie LM Studio zarządzały cyklem życia modelu, ustaw `models.providers.lmstudio.params.preload: false`. Zobacz [/providers/lmstudio](/pl/providers/lmstudio), aby poznać konfigurację i rozwiązywanie problemów.

### Ollama

Ollama jest dostarczana jako dołączony Plugin dostawcy i używa natywnego API Ollama:

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

Ollama jest wykrywana lokalnie pod `http://127.0.0.1:11434`, gdy włączysz ją przez `OLLAMA_API_KEY`, a dołączony Plugin dostawcy dodaje Ollama bezpośrednio do `openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama), aby poznać onboarding, tryb chmurowy/lokalny i konfigurację niestandardową.

### vLLM

vLLM jest dostarczany jako dołączony Plugin dostawcy dla lokalnych/samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby włączyć lokalne automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

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

SGLang jest dostarczany jako dołączony Plugin dostawcy dla szybkich, samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby włączyć lokalne automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

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
        timeoutSeconds: 300,
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
    Dla dostawców niestandardowych `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne. Gdy zostaną pominięte, OpenClaw domyślnie używa:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Zalecane: ustaw jawne wartości zgodne z limitami proxy/modelu.

  </Accordion>
  <Accordion title="Reguły kształtowania tras proxy">
    - Dla `api: "openai-completions"` na nienatywnych punktach końcowych (dowolny niepusty `baseUrl`, którego hostem nie jest `api.openai.com`), OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 dostawcy dla nieobsługiwanych ról `developer`.
    - Trasy proxy zgodne z OpenAI pomijają także natywne kształtowanie żądań tylko dla OpenAI: brak `service_tier`, brak Responses `store`, brak Completions `store`, brak wskazówek pamięci podręcznej promptów, brak kształtowania ładunku zgodności rozumowania OpenAI i brak ukrytych nagłówków atrybucji OpenClaw.
    - Dla proxy Completions zgodnych z OpenAI, które wymagają pól specyficznych dla dostawcy, ustaw `agents.defaults.models["provider/model"].params.extra_body` (lub `extraBody`), aby scalić dodatkowy JSON z wychodzącą treścią żądania.
    - Dla kontrolek szablonu czatu vLLM ustaw `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Dołączony Plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true` dla `vllm/nemotron-3-*`, gdy poziom myślenia sesji jest wyłączony.
    - Dla wolnych modeli lokalnych lub zdalnych hostów LAN/tailnet ustaw `models.providers.<id>.timeoutSeconds`. Wydłuża to obsługę żądań HTTP modelu dostawcy, w tym połączenie, nagłówki, strumieniowanie treści i całkowite przerwanie chronionego pobierania, bez zwiększania limitu czasu całego środowiska uruchomieniowego agenta.
    - Wywołania HTTP dostawcy modeli dopuszczają odpowiedzi DNS fake-IP Surge, Clash i sing-box w `198.18.0.0/15` oraz `fc00::/7` tylko dla skonfigurowanej nazwy hosta `baseUrl` dostawcy. Inne cele prywatne, loopback, link-local i metadanych nadal wymagają jawnego włączenia `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Jeśli `baseUrl` jest pusty/pominięty, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje do `api.openai.com`).
    - Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na nienatywnych punktach końcowych `openai-completions`.
    - Dla `api: "anthropic-messages"` na punktach końcowych innych niż bezpośrednie (dowolny dostawca inny niż kanoniczny `anthropic` albo niestandardowy `models.providers.anthropic.baseUrl`, którego host nie jest publicznym punktem końcowym `api.anthropic.com`), OpenClaw tłumi niejawne nagłówki beta Anthropic, takie jak `claude-code-20250219`, `interleaved-thinking-2025-05-14` i znaczniki OAuth, aby niestandardowe proxy zgodne z Anthropic nie odrzucały nieobsługiwanych flag beta. Ustaw jawnie `models.providers.<id>.headers["anthropic-beta"]`, jeśli Twoje proxy potrzebuje określonych funkcji beta.

  </Accordion>
</AccordionGroup>

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz także: [Konfiguracja](/pl/gateway/configuration), aby uzyskać pełne przykłady konfiguracji.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) - klucze konfiguracji modeli
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) - łańcuchy fallback i zachowanie ponawiania
- [Modele](/pl/concepts/models) - konfiguracja modeli i aliasy
- [Dostawcy](/pl/providers) - przewodniki konfiguracji dla poszczególnych dostawców
