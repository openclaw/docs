---
read_when:
    - Potrzebujesz dokumentacji referencyjnej konfiguracji modeli z podziałem na dostawców
    - Potrzebujesz przykładowych konfiguracji lub poleceń wdrażania CLI dla dostawców modeli
sidebarTitle: Model providers
summary: Omówienie dostawcy modeli z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-05-02T09:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02494bfb71c0e0449eacd9ec028316e7a1479e51c6591aea5885baf3941272d5
    source_path: concepts/model-providers.md
    workflow: 16
---

Dokumentacja referencyjna dla **dostawców LLM/modeli** (nie kanałów czatu takich jak WhatsApp/Telegram). Reguły wyboru modelu znajdziesz w [Modele](/pl/concepts/models).

## Szybkie reguły

<AccordionGroup>
  <Accordion title="Referencje modeli i pomocniki CLI">
    - Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` działa jako lista dozwolonych, gdy jest ustawione.
    - Pomocniki CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ustawiają wartości domyślne na poziomie dostawcy; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` nadpisują je dla poszczególnych modeli.
    - Reguły przełączania awaryjnego, sondy cooldown i trwałość nadpisań sesji: [Przełączanie awaryjne modelu](/pl/concepts/model-failover).

  </Accordion>
  <Accordion title="Dodanie uwierzytelniania dostawcy nie zmienia głównego modelu">
    `openclaw configure` zachowuje istniejące `agents.defaults.model.primary`, gdy dodajesz dostawcę lub ponownie uwierzytelniasz dostawcę. Pluginy dostawców nadal mogą zwrócić rekomendowany model domyślny w swojej poprawce konfiguracji uwierzytelniania, ale configure traktuje to jako „udostępnij ten model”, gdy model główny już istnieje, a nie jako „zastąp bieżący model główny”.

    Aby celowo przełączyć model domyślny, użyj `openclaw models set <provider/model>` albo `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Rozdział dostawcy i runtime OpenAI">
    Trasy rodziny OpenAI są specyficzne dla prefiksu:

    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` używa natywnego harnessu serwera aplikacji Codex. To typowa konfiguracja subskrypcji ChatGPT/Codex.
    - `openai-codex/<model>` używa OAuth Codex w PI.
    - `openai/<model>` bez nadpisania runtime Codex używa bezpośredniego dostawcy klucza API OpenAI w PI.

    Zobacz [OpenAI](/pl/providers/openai) i [Harness Codex](/pl/plugins/codex-harness). Jeśli rozdział dostawcy i runtime jest mylący, najpierw przeczytaj [Runtime’y agentów](/pl/concepts/agent-runtimes).

    Automatyczne włączanie Pluginów podąża za tą samą granicą: `openai-codex/<model>` należy do Pluginu OpenAI, natomiast Plugin Codex jest włączany przez `agentRuntime.id: "codex"` albo starsze referencje `codex/<model>`.

    GPT-5.5 jest dostępny przez natywny harness serwera aplikacji Codex, gdy ustawione jest `agentRuntime.id: "codex"`, przez `openai-codex/gpt-5.5` w PI dla OAuth Codex oraz przez `openai/gpt-5.5` w PI dla bezpośredniego ruchu z kluczem API, gdy Twoje konto go udostępnia.

  </Accordion>
  <Accordion title="Runtime’y CLI">
    Runtime’y CLI używają tego samego rozdziału: wybierz kanoniczne referencje modeli, takie jak `anthropic/claude-*`, `google/gemini-*` albo `openai/gpt-*`, a następnie ustaw `agents.defaults.agentRuntime.id` na `claude-cli`, `google-gemini-cli` albo `codex-cli`, gdy chcesz użyć lokalnego backendu CLI.

    Starsze referencje `claude-cli/*`, `google-gemini-cli/*` i `codex-cli/*` migrują z powrotem do kanonicznych referencji dostawcy z runtime zapisanym osobno.

  </Accordion>
</AccordionGroup>

## Zachowanie dostawcy należące do Pluginu

Większość logiki specyficznej dla dostawcy znajduje się w Pluginach dostawców (`registerProvider(...)`), podczas gdy OpenClaw zachowuje ogólną pętlę inferencji. Pluginy odpowiadają za onboarding, katalogi modeli, mapowanie zmiennych środowiskowych uwierzytelniania, normalizację transportu/konfiguracji, czyszczenie schematów narzędzi, klasyfikację przełączania awaryjnego, odświeżanie OAuth, raportowanie użycia, profile myślenia/rozumowania i więcej.

Pełna lista hooków provider-SDK i przykładów dołączonych Pluginów znajduje się w [Pluginy dostawców](/pl/plugins/sdk-provider-plugins). Dostawca, który potrzebuje całkowicie niestandardowego wykonawcy żądań, jest osobną, głębszą powierzchnią rozszerzeń.

<Note>
Zachowanie runnera należące do dostawcy znajduje się w jawnych hookach dostawcy, takich jak polityka odtwarzania, normalizacja schematów narzędzi, opakowywanie strumienia oraz pomocniki transportu/żądań. Starszy statyczny zbiór `ProviderPlugin.capabilities` służy wyłącznie zgodności i nie jest już odczytywany przez współdzieloną logikę runnera.
</Note>

## Rotacja kluczy API

<AccordionGroup>
  <Accordion title="Źródła kluczy i priorytet">
    Skonfiguruj wiele kluczy przez:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie live, najwyższy priorytet)
    - `<PROVIDER>_API_KEYS` (lista rozdzielona przecinkami lub średnikami)
    - `<PROVIDER>_API_KEY` (klucz główny)
    - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)

    Dla dostawców Google jako fallback uwzględniany jest także `GOOGLE_API_KEY`. Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.

  </Accordion>
  <Accordion title="Kiedy włącza się rotacja">
    - Żądania są ponawiane następnym kluczem tylko przy odpowiedziach limitu szybkości (na przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` albo okresowych komunikatach limitu użycia).
    - Błędy inne niż limit szybkości kończą się natychmiastową porażką; rotacja kluczy nie jest podejmowana.
    - Gdy wszystkie klucze kandydujące zawiodą, końcowy błąd jest zwracany z ostatniej próby.

  </Accordion>
</AccordionGroup>

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi‑ai. Ci dostawcy **nie** wymagają konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` plus `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Zweryfikuj dostępność konta/modelu za pomocą `openclaw models list --provider openai`, jeśli konkretna instalacja lub klucz API zachowuje się inaczej.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, fallback SSE)
- Nadpisz dla modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` albo `"auto"`)
- Rozgrzewanie OpenAI Responses WebSocket jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Przetwarzanie priorytetowe OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` w `api.openai.com`
- Użyj `params.serviceTier`, gdy chcesz jawny poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) stosują się tylko do natywnego ruchu OpenAI do `api.openai.com`, a nie do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują także `store` Responses, wskazówki cache promptów i kształtowanie payloadów zgodności rozumowania OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo ukryty w OpenClaw, ponieważ żądania live API OpenAI go odrzucają, a bieżący katalog Codex go nie udostępnia

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Dostawca: `anthropic`
- Uwierzytelnianie: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch z kluczem API i uwierzytelniony OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Preferowana konfiguracja Claude CLI zachowuje kanoniczną referencję modelu i wybiera backend CLI osobno: `anthropic/claude-opus-4-7` z `agents.defaults.agentRuntime.id: "claude-cli"`. Starsze referencje `claude-cli/claude-opus-4-7` nadal działają dla zgodności.

<Note>
Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, dlatego OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę. Token konfiguracji Anthropic pozostaje dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Dostawca: `openai-codex`
- Uwierzytelnianie: OAuth (ChatGPT)
- Referencja modelu PI: `openai-codex/gpt-5.5`
- Referencja natywnego harnessu serwera aplikacji Codex: `openai/gpt-5.5` z `agents.defaults.agentRuntime.id: "codex"`
- Dokumentacja natywnego harnessu serwera aplikacji Codex: [Harness Codex](/pl/plugins/codex-harness)
- Starsze referencje modeli: `codex/gpt-*`
- Granica Pluginu: `openai-codex/*` ładuje Plugin OpenAI; natywny Plugin serwera aplikacji Codex jest wybierany tylko przez runtime harnessu Codex albo starsze referencje `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` albo `openclaw models auth login --provider openai-codex`
- Domyślny transport to `auto` (najpierw WebSocket, fallback SSE)
- Nadpisz dla modelu PI przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` albo `"auto"`)
- `params.serviceTier` jest także przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są dołączane tylko do natywnego ruchu Codex do `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli tę samą konfigurację przełącznika `/fast` i `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje ją na `service_tier=priority`
- `openai-codex/gpt-5.5` używa natywnego `contextWindow = 400000` katalogu Codex i domyślnego runtime `contextTokens = 272000`; nadpisz limit runtime przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca polityki: OpenAI Codex OAuth jest jawnie obsługiwany dla narzędzi/przepływów pracy zewnętrznych, takich jak OpenClaw.
- Dla typowej trasy subskrypcji plus natywnego runtime Codex zaloguj się uwierzytelnianiem `openai-codex`, ale skonfiguruj `openai/gpt-5.5` plus `agents.defaults.agentRuntime.id: "codex"`.
- Użyj `openai-codex/gpt-5.5` tylko wtedy, gdy chcesz trasę OAuth/subskrypcji Codex przez PI; użyj `openai/gpt-5.5` bez nadpisania runtime Codex, gdy Twoja konfiguracja klucza API i lokalny katalog udostępniają publiczną trasę API.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex", fallback: "none" },
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

### Inne hostowane opcje w stylu subskrypcyjnym

<CardGroup cols={3}>
  <Card title="Modele GLM" href="/pl/providers/glm">
    Plan Z.AI Coding Plan albo ogólne endpointy API.
  </Card>
  <Card title="MiniMax" href="/pl/providers/minimax">
    Dostęp OAuth MiniMax Coding Plan albo dostęp z kluczem API.
  </Card>
  <Card title="Qwen Cloud" href="/pl/providers/qwen">
    Powierzchnia dostawcy Qwen Cloud plus mapowanie endpointów Alibaba DashScope i Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`)
- Dostawca runtime Zen: `opencode`
- Dostawca runtime Go: `opencode-go`
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
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, zapasowy `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` jest akceptowany i normalizowany do aktywnego identyfikatora API Gemini firmy Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Myślenie: `/think adaptive` używa dynamicznego myślenia Google. Gemini 3/3.1 pomijają stały `thinkingLevel`; Gemini 2.5 wysyła `thinkingBudget: -1`.
- Bezpośrednie uruchomienia Gemini akceptują także `agents.defaults.models["google/<model>"].params.cachedContent` (lub starsze `cached_content`), aby przekazać natywny dla dostawcy uchwyt `cachedContents/...`; trafienia pamięci podręcznej Gemini są widoczne w OpenClaw jako `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth

<Warning>
Gemini CLI OAuth w OpenClaw jest nieoficjalną integracją. Niektórzy użytkownicy zgłaszali ograniczenia konta Google po użyciu klientów zewnętrznych. Przejrzyj warunki Google i użyj konta niekrytycznego, jeśli zdecydujesz się kontynuować.
</Warning>

Gemini CLI OAuth jest dostarczany jako część dołączonego Pluginu `google`.

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

    Model domyślny: `google-gemini-cli/gemini-3-flash-preview`. **Nie** wklejasz identyfikatora klienta ani sekretu do `openclaw.json`. Przepływ logowania CLI zapisuje tokeny w profilach uwierzytelniania na hoście Gateway.

  </Step>
  <Step title="Ustaw projekt (w razie potrzeby)">
    Jeśli żądania po zalogowaniu się nie powiodą, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway.
  </Step>
</Steps>

Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie korzysta awaryjnie z `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

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
- Przykładowe modele: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Dostawca: `kilocode`
- Uwierzytelnianie: `KILOCODE_API_KEY`
- Przykładowy model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog zapasowy zawiera `kilocode/kilo/auto`; wykrywanie na żywo `https://api.kilo.ai/api/gateway/models` może dalej rozszerzyć katalog środowiska uruchomieniowego.
- Dokładny upstream routing za `kilocode/kilo/auto` należy do Kilo Gateway i nie jest zakodowany na stałe w OpenClaw.

Szczegóły konfiguracji znajdziesz w [/providers/kilocode](/pl/providers/kilocode).

### Inne dołączone Pluginy dostawców

| Dostawca                | Id                               | Env uwierzytelniania                                        | Przykładowy model                             |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` lub `KIMICODE_API_KEY`                        | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Osobliwości, które warto znać

<AccordionGroup>
  <Accordion title="OpenRouter">
    Stosuje nagłówki atrybucji aplikacji i znaczniki Anthropic `cache_control` tylko na zweryfikowanych trasach `openrouter.ai`. Referencje DeepSeek, Moonshot i ZAI kwalifikują się do cache-TTL dla buforowania promptów zarządzanego przez OpenRouter, ale nie otrzymują znaczników cache Anthropic. Jako ścieżka proxy zgodna z OpenAI pomija kształtowanie właściwe tylko dla natywnego OpenAI (`serviceTier`, Responses `store`, wskazówki pamięci podręcznej promptów, zgodność rozumowania OpenAI). Referencje oparte na Gemini zachowują tylko sanityzację sygnatur myślenia proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Referencje oparte na Gemini używają tej samej ścieżki sanityzacji proxy-Gemini; `kilocode/kilo/auto` i inne referencje proxy bez obsługi rozumowania pomijają wstrzykiwanie rozumowania proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding z kluczem API zapisuje jawne definicje tekstowych modeli czatu M2.7; rozumienie obrazów pozostaje w należącym do pluginu dostawcy mediów `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Identyfikatory modeli używają przestrzeni nazw `nvidia/<vendor>/<model>` (na przykład `nvidia/nvidia/nemotron-...` obok `nvidia/moonshotai/kimi-k2.5`); selektory zachowują dosłowną kompozycję `<provider>/<model-id>`, podczas gdy kanoniczny klucz wysyłany do API pozostaje z pojedynczym prefiksem.
  </Accordion>
  <Accordion title="xAI">
    Używa ścieżki xAI Responses. `grok-4.3` jest dołączonym domyślnym modelem czatu. `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`. `tool_stream` jest domyślnie włączone; wyłącz przez `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Dostarczany jako dołączony Plugin dostawcy `cerebras`. GLM używa `zai-glm-4.7`; podstawowy adres URL zgodny z OpenAI to `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Dostawcy przez `models.providers` (niestandardowy/podstawowy adres URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców albo proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych pluginów dostawców publikuje już domyślny katalog. Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać domyślny podstawowy adres URL, nagłówki lub listę modeli.

Sprawdzanie możliwości modeli przez Gateway odczytuje także jawne metadane `models.providers.<id>.models[]`. Jeśli model niestandardowy lub proxy przyjmuje obrazy, ustaw `input: ["text", "image"]` na tym modelu, aby WebChat i ścieżki załączników pochodzących z węzłów przekazywały obrazy jako natywne wejścia modelu zamiast tekstowych referencji do mediów.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony Plugin dostawcy. Domyślnie używaj wbudowanego dostawcy i dodawaj jawny wpis `models.providers.moonshot` tylko wtedy, gdy musisz nadpisać podstawowy adres URL lub metadane modelu:

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

### Programowanie z Kimi

Kimi Coding używa punktu końcowego Moonshot AI zgodnego z Anthropic:

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

Onboarding domyślnie używa powierzchni kodowania, ale ogólny katalog `volcengine/*` jest rejestrowany w tym samym czasie.

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania Volcengine preferuje zarówno wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do dostawcy.

<Tabs>
  <Tab title="Modele standardowe">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modele kodowania (volcengine-plan)">
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

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania BytePlus preferuje zarówno wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do dostawcy.

<Tabs>
  <Tab title="Modele standardowe">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modele kodowania (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

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
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`

Zobacz [/providers/minimax](/pl/providers/minimax), aby uzyskać szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji.

<Note>
Na ścieżce strumieniowania zgodnej z Anthropic w MiniMax OpenClaw domyślnie wyłącza myślenie, chyba że jawnie je ustawisz, a `/fast on` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
</Note>

Podział możliwości należący do Pluginu:

- Domyślne ustawienia tekstu/czatu pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to należący do Pluginu `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje na identyfikatorze dostawcy `minimax`

### LM Studio

LM Studio jest dostarczane jako dołączany Plugin dostawcy, który używa natywnego API:

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

OpenClaw używa natywnych endpointów LM Studio `/api/v1/models` i `/api/v1/models/load` do wykrywania i automatycznego ładowania, z `/v1/chat/completions` domyślnie używanym do wnioskowania. Jeśli chcesz, aby ładowanie JIT, TTL i automatyczne usuwanie LM Studio zarządzały cyklem życia modelu, ustaw `models.providers.lmstudio.params.preload: false`. Zobacz [/providers/lmstudio](/pl/providers/lmstudio), aby uzyskać instrukcję konfiguracji i rozwiązywania problemów.

### Ollama

Ollama jest dostarczana jako dołączany Plugin dostawcy i używa natywnego API Ollama:

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

Ollama jest wykrywana lokalnie pod adresem `http://127.0.0.1:11434`, gdy włączysz ją przez `OLLAMA_API_KEY`, a dołączany Plugin dostawcy dodaje Ollama bezpośrednio do `openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama), aby uzyskać informacje o onboardingu, trybie chmurowym/lokalnym i konfiguracji niestandardowej.

### vLLM

vLLM jest dostarczany jako dołączany Plugin dostawcy dla lokalnych/samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

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

Zobacz [/providers/vllm](/pl/providers/vllm), aby uzyskać szczegóły.

### SGLang

SGLang jest dostarczany jako dołączany Plugin dostawcy dla szybkich, samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

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

Zobacz [/providers/sglang](/pl/providers/sglang), aby uzyskać szczegóły.

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
    Dla niestandardowych dostawców `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne. Gdy zostaną pominięte, OpenClaw używa domyślnie:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Zalecane: ustaw jawne wartości odpowiadające limitom Twojego proxy/modelu.

  </Accordion>
  <Accordion title="Reguły kształtowania tras proxy">
    - Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`), OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 dostawcy przy nieobsługiwanych rolach `developer`.
    - Trasy zgodne z OpenAI w stylu proxy pomijają też natywne kształtowanie żądań specyficzne tylko dla OpenAI: bez `service_tier`, bez Responses `store`, bez Completions `store`, bez wskazówek prompt-cache, bez kształtowania ładunku zgodności rozumowania OpenAI i bez ukrytych nagłówków atrybucji OpenClaw.
    - Dla proxy Completions zgodnych z OpenAI, które wymagają pól specyficznych dla dostawcy, ustaw `agents.defaults.models["provider/model"].params.extra_body` (lub `extraBody`), aby scalić dodatkowy JSON z wychodzącym ciałem żądania.
    - Dla kontrolek szablonu czatu vLLM ustaw `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Dołączany Plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true` dla `vllm/nemotron-3-*`, gdy poziom myślenia sesji jest wyłączony.
    - Dla wolnych modeli lokalnych lub zdalnych hostów LAN/tailnet ustaw `models.providers.<id>.timeoutSeconds`. Wydłuża to obsługę żądań HTTP modelu dostawcy, w tym połączenie, nagłówki, strumieniowanie ciała i całkowite przerwanie chronionego pobierania, bez zwiększania limitu czasu całego środowiska uruchomieniowego agenta.
    - Jeśli `baseUrl` jest pusty/pominięty, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
    - Ze względów bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na nienatywnych endpointach `openai-completions`.
    - Dla `api: "anthropic-messages"` na endpointach niebezpośrednich (dowolny dostawca inny niż kanoniczny `anthropic` albo niestandardowy `models.providers.anthropic.baseUrl`, którego host nie jest publicznym endpointem `api.anthropic.com`), OpenClaw tłumi niejawne nagłówki beta Anthropic, takie jak `claude-code-20250219`, `interleaved-thinking-2025-05-14` i znaczniki OAuth, aby niestandardowe proxy zgodne z Anthropic nie odrzucały nieobsługiwanych flag beta. Ustaw jawnie `models.providers.<id>.headers["anthropic-beta"]`, jeśli Twoje proxy wymaga określonych funkcji beta.

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

- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modelu
- [Awaryjne przełączanie modeli](/pl/concepts/model-failover) — łańcuchy fallback i zachowanie ponawiania
- [Modele](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Dostawcy](/pl/providers) — przewodniki konfiguracji dla poszczególnych dostawców
