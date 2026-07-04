---
read_when:
    - Potrzebujesz dokumentacji konfiguracji modeli według dostawcy
    - Chcesz przykładowe konfiguracje lub polecenia wdrażania CLI dla dostawców modeli
sidebarTitle: Model providers
summary: Omówienie dostawcy modelu z przykładowymi konfiguracjami i przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-07-04T04:10:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Dokumentacja referencyjna dla **dostawców LLM/modeli** (nie kanałów czatu, takich jak WhatsApp/Telegram). Reguły wyboru modelu opisano w [Modelach](/pl/concepts/models).

## Szybkie reguły

<AccordionGroup>
  <Accordion title="Odwołania do modeli i pomocnicze polecenia CLI">
    - Odwołania do modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` działa jako lista dozwolonych wartości, gdy jest ustawione.
    - Pomocnicze polecenia CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ustawiają domyślne wartości na poziomie dostawcy; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` nadpisują je dla konkretnego modelu.
    - Reguły przełączania awaryjnego, sondy czasu odnowienia i trwałość nadpisań sesji: [Przełączanie awaryjne modeli](/pl/concepts/model-failover).

  </Accordion>
  <Accordion title="Dodanie uwierzytelniania dostawcy nie zmienia modelu podstawowego">
    `openclaw configure` zachowuje istniejące `agents.defaults.model.primary`, gdy dodajesz lub ponownie uwierzytelniasz dostawcę. `openclaw models auth login` robi to samo, chyba że przekażesz `--set-default`. Pluginy dostawców nadal mogą zwrócić zalecany model domyślny w swojej poprawce konfiguracji uwierzytelniania, ale gdy model podstawowy już istnieje, OpenClaw traktuje to jako „udostępnij ten model”, a nie „zastąp bieżący model podstawowy”.

    Aby celowo przełączyć model domyślny, użyj `openclaw models set <provider/model>` albo `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Podział dostawcy i środowiska uruchomieniowego OpenAI">
    Trasy z rodziny OpenAI zależą od prefiksu:

    - `openai/<model>` domyślnie używa natywnego harnessu serwera aplikacji Codex do tur agenta. To typowa konfiguracja subskrypcji ChatGPT/Codex.
    - starsze odwołania do modeli Codex są starszą konfiguracją, którą doctor przepisuje na `openai/<model>`.
    - `openai/<model>` plus `agentRuntime.id: "openclaw"` dostawcy/modelu używa wbudowanego środowiska uruchomieniowego OpenClaw dla jawnych tras klucza API lub zgodności.

    Zobacz [OpenAI](/pl/providers/openai) i [harness Codex](/pl/plugins/codex-harness). Jeśli podział dostawcy i środowiska uruchomieniowego jest niejasny, najpierw przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

    Automatyczne włączanie Pluginów działa według tej samej granicy: odwołania agentów `openai/*` włączają Plugin Codex dla domyślnej trasy, a jawne `agentRuntime.id: "codex"` dostawcy/modelu lub starsze odwołania `codex/<model>` również go wymagają.

    GPT-5.5 jest domyślnie dostępny przez natywny harness serwera aplikacji Codex w `openai/gpt-5.5` oraz przez środowisko uruchomieniowe OpenClaw, gdy zasada środowiska uruchomieniowego dostawcy/modelu jawnie wybiera `openclaw`.

  </Accordion>
  <Accordion title="Środowiska uruchomieniowe CLI">
    Środowiska uruchomieniowe CLI używają tego samego podziału: wybierz kanoniczne odwołania do modeli, takie jak `anthropic/claude-*` lub `google/gemini-*`, a następnie ustaw zasadę środowiska uruchomieniowego dostawcy/modelu na `claude-cli` lub `google-gemini-cli`, gdy chcesz użyć lokalnego backendu CLI.

    Starsze odwołania `claude-cli/*` i `google-gemini-cli/*` migrują z powrotem do kanonicznych odwołań dostawców, z osobno zapisaną informacją o środowisku uruchomieniowym. Starsze odwołania `codex-cli/*` migrują do `openai/*` i używają trasy serwera aplikacji Codex; OpenClaw nie utrzymuje już dołączonego backendu CLI Codex.

  </Accordion>
</AccordionGroup>

## Zachowanie dostawcy należące do Pluginu

Większość logiki specyficznej dla dostawcy znajduje się w Pluginach dostawców (`registerProvider(...)`), podczas gdy OpenClaw utrzymuje ogólną pętlę wnioskowania. Pluginy są właścicielami wdrażania, katalogów modeli, mapowania zmiennych środowiskowych uwierzytelniania, normalizacji transportu/konfiguracji, czyszczenia schematu narzędzi, klasyfikacji przełączania awaryjnego, odświeżania OAuth, raportowania użycia, profili myślenia/rozumowania i innych elementów.

Pełna lista hooków SDK dostawcy oraz przykłady dołączonych Pluginów znajdują się w [Pluginach dostawców](/pl/plugins/sdk-provider-plugins). Dostawca, który wymaga całkowicie niestandardowego wykonawcy żądań, jest osobną, głębszą powierzchnią rozszerzeń.

<Note>
Zachowanie runnera należące do dostawcy znajduje się w jawnych hookach dostawcy, takich jak zasada odtwarzania, normalizacja schematu narzędzi, opakowywanie strumienia oraz pomocnicze funkcje transportu/żądań. Starsza statyczna torba `ProviderPlugin.capabilities` służy wyłącznie zgodności i nie jest już odczytywana przez współdzieloną logikę runnera.
</Note>

## Rotacja kluczy API

<AccordionGroup>
  <Accordion title="Źródła kluczy i priorytet">
    Skonfiguruj wiele kluczy przez:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie na żywo, najwyższy priorytet)
    - `<PROVIDER>_API_KEYS` (lista rozdzielona przecinkami lub średnikami)
    - `<PROVIDER>_API_KEY` (klucz podstawowy)
    - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)

    W przypadku dostawców Google `GOOGLE_API_KEY` jest także uwzględniany jako zapasowy. Kolejność wyboru kluczy zachowuje priorytet i deduplikuje wartości.

  </Accordion>
  <Accordion title="Kiedy uruchamia się rotacja">
    - Żądania są ponawiane z następnym kluczem wyłącznie przy odpowiedziach limitu szybkości (na przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` lub okresowych komunikatach limitu użycia).
    - Błędy inne niż limit szybkości kończą się natychmiast niepowodzeniem; rotacja kluczy nie jest podejmowana.
    - Gdy wszystkie klucze kandydujące zawiodą, zwracany jest końcowy błąd z ostatniej próby.

  </Accordion>
</AccordionGroup>

## Oficjalne Pluginy dostawców

Oficjalne Pluginy dostawców publikują własne wiersze katalogu modeli. Ci dostawcy **nie** wymagają wpisów modeli `models.providers`; włącz Plugin dostawcy, ustaw uwierzytelnianie i wybierz model. Używaj `models.providers` tylko dla jawnych niestandardowych dostawców lub wąskich ustawień żądań, takich jak limity czasu.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Zweryfikuj dostępność konta/modelu za pomocą `openclaw models list --provider openai`, jeśli konkretna instalacja lub klucz API zachowuje się inaczej.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto`; OpenClaw przekazuje wybór transportu do współdzielonego środowiska uruchomieniowego modeli.
- Nadpisz dla konkretnego modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` w `api.openai.com`
- Użyj `params.serviceTier`, gdy chcesz jawnie wskazać poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) mają zastosowanie tylko do natywnego ruchu OpenAI do `api.openai.com`, nie do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują także `store` Responses, wskazówki cache promptów i kształtowanie payloadów zgodności rozumowania OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest dostępny przez uwierzytelnianie subskrypcji OAuth ChatGPT/Codex, gdy Twoje zalogowane konto go udostępnia; OpenClaw nadal wyłącza bezpośrednie trasy klucza API OpenAI i klucza API Azure dla tego modelu, ponieważ te transporty go odrzucają

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Dostawca: `anthropic`
- Uwierzytelnianie: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch z kluczem API i uwierzytelniony przez OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na `service_tier` Anthropic (`auto` kontra `standard_only`)
- Preferowana konfiguracja Claude CLI zachowuje kanoniczne odwołanie do modelu i wybiera backend CLI osobno: `anthropic/claude-opus-4-8` z zakresem modelu `agentRuntime.id: "claude-cli"`. Starsze odwołania `claude-cli/claude-opus-4-7` nadal działają dla zgodności.

<Note>
Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę. Token konfiguracji Anthropic pozostaje dostępny jako obsługiwana ścieżka tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Dostawca: `openai`
- Uwierzytelnianie: OAuth (ChatGPT)
- Starsze odwołanie do modelu OpenAI Codex: `openai/gpt-5.5`
- Odwołanie do natywnego harnessu serwera aplikacji Codex: `openai/gpt-5.5`
- Dokumentacja natywnego harnessu serwera aplikacji Codex: [harness Codex](/pl/plugins/codex-harness)
- Starsze odwołania do modeli: `codex/gpt-*`
- Granica Pluginu: `openai/*` ładuje Plugin OpenAI; natywny Plugin serwera aplikacji Codex jest wybierany przez środowisko uruchomieniowe harnessu Codex.
- CLI: `openclaw onboard --auth-choice openai` lub `openclaw models auth login --provider openai`
- Domyślny transport to `auto` (najpierw WebSocket, zapasowo SSE)
- Nadpisz dla konkretnego modelu OpenAI Codex przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest także przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`) są dołączane tylko do natywnego ruchu Codex do `chatgpt.com/backend-api`, nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai/gpt-5.5` używa natywnego katalogu Codex `contextWindow = 400000` i domyślnego środowiska uruchomieniowego `contextTokens = 272000`; nadpisz limit środowiska uruchomieniowego za pomocą `models.providers.openai.models[].contextTokens`
- Uwaga dotycząca polityki: OpenAI Codex OAuth jest jawnie obsługiwany dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.
- W typowej trasie subskrypcji plus natywnego środowiska uruchomieniowego Codex zaloguj się uwierzytelnianiem `openai` i skonfiguruj `openai/gpt-5.5`; tury agenta OpenAI domyślnie wybierają Codex.
- Użyj `agentRuntime.id: "openclaw"` dostawcy/modelu tylko wtedy, gdy chcesz użyć wbudowanej trasy OpenClaw; w przeciwnym razie pozostaw `openai/gpt-5.5` na domyślnym harnessie Codex.
- starsze odwołania GPT Codex są starszym stanem, a nie aktywną trasą dostawcy. Użyj `openai/gpt-5.5` w natywnym środowisku uruchomieniowym Codex dla nowej konfiguracji agenta i uruchom `openclaw doctor --fix`, aby zmigrować stare starsze odwołania do modeli Codex na kanoniczne odwołania `openai/*`.

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
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Inne hostowane opcje w stylu subskrypcji

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/pl/providers/zai">
    Plan kodowania Z.AI lub ogólne punkty końcowe API.
  </Card>
  <Card title="MiniMax" href="/pl/providers/minimax">
    OAuth planu kodowania MiniMax lub dostęp przez klucz API.
  </Card>
  <Card title="Qwen Cloud" href="/pl/providers/qwen">
    Powierzchnia dostawcy Qwen Cloud plus mapowanie punktów końcowych Alibaba DashScope i planu kodowania.
  </Card>
</CardGroup>

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`)
- Dostawca środowiska uruchomieniowego Zen: `opencode`
- Dostawca środowiska uruchomieniowego Go: `opencode-go`
- Przykładowe modele: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (klucz API)

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY`
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, zapasowe `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` jest akceptowany i normalizowany do aktywnego identyfikatora Gemini API Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Myślenie: `/think adaptive` używa dynamicznego myślenia Google. Gemini 3/3.1 pomijają stałe `thinkingLevel`; Gemini 2.5 wysyła `thinkingBudget: -1`.
- Bezpośrednie uruchomienia Gemini akceptują też `agents.defaults.models["google/<model>"].params.cachedContent` (lub starsze `cached_content`), aby przekazać natywny dla dostawcy uchwyt `cachedContents/...`; trafienia pamięci podręcznej Gemini są widoczne w OpenClaw jako `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa swojego przepływu OAuth

<Warning>
Gemini CLI OAuth w OpenClaw jest nieoficjalną integracją. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów zewnętrznych. Zapoznaj się z warunkami Google i użyj konta niekrytycznego, jeśli zdecydujesz się kontynuować.
</Warning>

Gemini CLI OAuth jest dostarczany jako część dołączonego pluginu `google`.

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
  <Step title="Włącz plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Zaloguj się">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Model domyślny: `google-gemini-cli/gemini-3-flash-preview`. **Nie** wklejasz identyfikatora klienta ani sekretu do `openclaw.json`. Przepływ logowania CLI przechowuje tokeny w profilach uwierzytelniania na hoście gateway.

  </Step>
  <Step title="Ustaw projekt (jeśli potrzebne)">
    Jeśli żądania kończą się niepowodzeniem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway.
  </Step>
</Steps>

Gemini CLI domyślnie używa `stream-json`. OpenClaw odczytuje komunikaty strumienia asystenta
i normalizuje `stats.cached` do `cacheRead`; starsze nadpisania
`--output-format json` nadal odczytują tekst odpowiedzi z `response`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Odwołania do modeli używają kanonicznego identyfikatora dostawcy `zai/*`.
  - `zai-api-key` automatycznie wykrywa pasujący punkt końcowy Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają konkretną powierzchnię

### Vercel AI Gateway

- Dostawca: `vercel-ai-gateway`
- Uwierzytelnianie: `AI_GATEWAY_API_KEY`
- Przykładowe modele: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Inne dołączone pluginy dostawców

| Dostawca                                | Id                               | Zmienna środowiskowa uwierzytelniania                | Przykładowy model                                          |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`               | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/pl/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth lub `OPENROUTER_API_KEY`            | `openrouter/auto`                                          |
| [Qwen OAuth](/pl/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth lub `XAI_API_KEY`          | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Warto znać osobliwości

<AccordionGroup>
  <Accordion title="OpenRouter">
    Stosuje nagłówki atrybucji aplikacji i znaczniki Anthropic `cache_control` tylko na zweryfikowanych trasach `openrouter.ai`. Odwołania DeepSeek, Moonshot i ZAI kwalifikują się do TTL pamięci podręcznej dla zarządzanego przez OpenRouter buforowania promptów, ale nie otrzymują znaczników pamięci podręcznej Anthropic. Jako ścieżka proxy zgodna z OpenAI pomija kształtowanie właściwe wyłącznie natywnemu OpenAI (`serviceTier`, Responses `store`, wskazówki pamięci podręcznej promptów, zgodność rozumowania OpenAI). Odwołania oparte na Gemini zachowują tylko oczyszczanie sygnatur myśli proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Odwołania oparte na Gemini używają tej samej ścieżki oczyszczania proxy-Gemini; `kilocode/kilo/auto` i inne odwołania proxy bez obsługi rozumowania pomijają wstrzykiwanie rozumowania proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding za pomocą klucza API zapisuje jawne definicje modeli czatu M3 i M2.7; rozumienie obrazów pozostaje w należącym do pluginu dostawcy multimediów `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Identyfikatory modeli używają przestrzeni nazw `nvidia/<vendor>/<model>` (na przykład `nvidia/nvidia/nemotron-...` obok `nvidia/moonshotai/kimi-k2.5`); selektory zachowują dosłowną kompozycję `<provider>/<model-id>`, podczas gdy kanoniczny klucz wysyłany do API pozostaje z pojedynczym prefiksem.
  </Accordion>
  <Accordion title="xAI">
    Używa ścieżki xAI Responses. Zalecaną ścieżką jest SuperGrok/X Premium OAuth; klucze API nadal działają przez `XAI_API_KEY` lub konfigurację pluginu, a `web_search` Grok ponownie używa tego samego profilu uwierzytelniania przed awaryjnym użyciem klucza API. `grok-4.3` jest dołączonym domyślnym modelem czatu, a `grok-build-0.1` można wybrać do pracy skupionej na budowaniu/kodowaniu. `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`. `tool_stream` jest domyślnie włączone; wyłącz przez `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Dostawcy przez `models.providers` (niestandardowy/bazowy URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców albo proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych pluginów dostawców publikuje już domyślny katalog. Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz zastąpić domyślny bazowy URL, nagłówki lub listę modeli.

Kontrole możliwości modeli Gateway odczytują także jawne metadane `models.providers.<id>.models[]`. Jeśli model niestandardowy lub proxy akceptuje obrazy, ustaw `input: ["text", "image"]` dla tego modelu, aby ścieżki załączników z WebChat i pochodzące z Node przekazywały obrazy jako natywne wejścia modelu zamiast referencji do multimediów wyłącznie tekstowych.

`agents.defaults.models["provider/model"]` steruje tylko widocznością modeli, aliasami i metadanymi poszczególnych modeli dla agentów. Samo w sobie nie rejestruje nowego modelu uruchomieniowego. Dla niestandardowych modeli dostawcy dodaj także `models.providers.<provider>.models[]` z co najmniej pasującym `id`.

### Moonshot AI (Kimi)

Zainstaluj `@openclaw/moonshot-provider` przed wdrożeniem. Dodaj jawny wpis `models.providers.moonshot` tylko wtedy, gdy musisz zastąpić bazowy URL lub metadane modelu:

- Dostawca: `moonshot`
- Uwierzytelnianie: `MOONSHOT_API_KEY`
- Przykładowy model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` albo `openclaw onboard --auth-choice moonshot-api-key-cn`

Identyfikatory modeli Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

Kimi Coding używa punktu końcowego Moonshot AI zgodnego z Anthropic:

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

Starsze `kimi/kimi-code` i `kimi/k2p5` pozostają akceptowane jako identyfikatory modeli zgodności i normalizują się do stabilnego identyfikatora modelu API Kimi.

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

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania Volcengine preferuje zarówno wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie zostały jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do providera.

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

### BytePlus (międzynarodowe)

BytePlus ARK zapewnia użytkownikom międzynarodowym dostęp do tych samych modeli co Volcano Engine.

- Provider: `byteplus` (kodowanie: `byteplus-plan`)
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

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania BytePlus preferuje zarówno wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie zostały jeszcze załadowane, OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty selektor ograniczony do providera.

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

Synthetic udostępnia modele zgodne z Anthropic za providerem `synthetic`:

- Provider: `synthetic`
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
- MiniMax OAuth (Chiny): `--auth-choice minimax-cn-oauth`
- Klucz API MiniMax (globalny): `--auth-choice minimax-global-api`
- Klucz API MiniMax (Chiny): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji znajdziesz w [/providers/minimax](/pl/providers/minimax).

<Note>
Na zgodnej z Anthropic ścieżce strumieniowania MiniMax OpenClaw domyślnie wyłącza myślenie dla rodziny M2.x, chyba że ustawisz je jawnie; MiniMax-M3 (i M3.x) domyślnie pozostaje na pominiętej/adaptacyjnej ścieżce myślenia providera. `/fast on` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
</Note>

Podział możliwości należący do pluginu:

- Domyślne ustawienia tekstu/czatu pozostają przy `minimax/MiniMax-M3`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to należący do pluginu `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje na identyfikatorze providera `minimax`

### LM Studio

LM Studio jest dostarczany jako wbudowany Plugin providera, który używa natywnego API:

- Provider: `lmstudio`
- Uwierzytelnianie: `LM_API_TOKEN`
- Domyślny bazowy URL inferencji: `http://localhost:1234/v1`

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw używa natywnych endpointów LM Studio `/api/v1/models` i `/api/v1/models/load` do wykrywania i automatycznego ładowania, a domyślnie `/v1/chat/completions` do inferencji. Jeśli chcesz, aby ładowanie JIT, TTL i automatyczne usuwanie z pamięci LM Studio zarządzały cyklem życia modelu, ustaw `models.providers.lmstudio.params.preload: false`. Konfigurację i rozwiązywanie problemów znajdziesz w [/providers/lmstudio](/pl/providers/lmstudio).

### Ollama

Ollama jest dostarczana jako wbudowany Plugin providera i używa natywnego API Ollama:

- Provider: `ollama`
- Uwierzytelnianie: niewymagane (lokalny serwer)
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

Ollama jest wykrywana lokalnie pod adresem `http://127.0.0.1:11434`, gdy włączysz ją za pomocą `OLLAMA_API_KEY`, a wbudowany Plugin providera dodaje Ollama bezpośrednio do `openclaw onboard` i selektora modeli. Onboarding, tryb chmurowy/lokalny i konfigurację niestandardową znajdziesz w [/providers/ollama](/pl/providers/ollama).

### vLLM

vLLM jest dostarczany jako wbudowany Plugin providera dla lokalnych/samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Provider: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby lokalnie włączyć automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

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

SGLang jest dostarczany jako wbudowany Plugin providera dla szybkich, samodzielnie hostowanych serwerów zgodnych z OpenAI:

- Provider: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby lokalnie włączyć automatyczne wykrywanie (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania):

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
    Dla niestandardowych providerów `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne. Gdy zostaną pominięte, OpenClaw domyślnie przyjmuje:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Zalecane: ustaw jawne wartości zgodne z limitami swojego proxy/modelu.

  </Accordion>
  <Accordion title="Reguły kształtowania tras proxy">
    - Dla `api: "openai-completions"` na endpointach nienatywnych (dowolny niepusty `baseUrl`, którego hostem nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 providera dla nieobsługiwanych ról `developer`.
    - Trasy proxy zgodne ze stylem OpenAI pomijają też natywne kształtowanie żądań specyficzne tylko dla OpenAI: bez `service_tier`, bez `store` Responses, bez `store` Completions, bez wskazówek pamięci podręcznej promptów, bez kształtowania ładunku zgodności rozumowania OpenAI i bez ukrytych nagłówków atrybucji OpenClaw.
    - W przypadku proxy Completions zgodnych z OpenAI, które wymagają pól specyficznych dla dostawcy, ustaw `agents.defaults.models["provider/model"].params.extra_body` (lub `extraBody`), aby scalić dodatkowy JSON z wychodzącym ciałem żądania.
    - W przypadku kontrolek szablonu czatu vLLM ustaw `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Wbudowany Plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true` dla `vllm/nemotron-3-*`, gdy poziom myślenia sesji jest wyłączony.
    - W przypadku wolnych modeli lokalnych lub zdalnych hostów LAN/tailnet ustaw `models.providers.<id>.timeoutSeconds`. Rozszerza to obsługę żądań HTTP modeli providera, w tym połączenie, nagłówki, strumieniowanie ciała oraz całkowite przerwanie guarded-fetch, bez zwiększania limitu czasu całego działania agenta. Jeśli `agents.defaults.timeoutSeconds` albo limit czasu konkretnego uruchomienia jest niższy, podnieś także ten pułap; limity czasu providera nie mogą wydłużyć całego uruchomienia.
    - Wywołania HTTP providera modeli dopuszczają odpowiedzi DNS fake-IP Surge, Clash i sing-box w `198.18.0.0/15` oraz `fc00::/7` tylko dla skonfigurowanej nazwy hosta `baseUrl` providera. Niestandardowe/lokalne endpointy providera ufają też dokładnie skonfigurowanemu originowi `scheme://host:port` dla chronionych żądań modeli, w tym hostom loopback, LAN i tailnet. To nie jest nowa opcja konfiguracji; skonfigurowany `baseUrl` rozszerza politykę żądań tylko dla tego originu. Dopuszczenie nazwy hosta fake-IP i zaufanie dokładnemu originowi to niezależne mechanizmy. Inne prywatne, loopback, link-local, metadata destinations i inne porty nadal wymagają jawnego włączenia `models.providers.<id>.request.allowPrivateNetwork: true`. Ustaw `models.providers.<id>.request.allowPrivateNetwork: false`, aby zrezygnować z zaufania dokładnemu originowi.
    - Jeśli `baseUrl` jest pusty/pominięty, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
    - Ze względów bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na nienatywnych endpointach `openai-completions`.
    - Dla `api: "anthropic-messages"` na endpointach niebezpośrednich (dowolny provider inny niż kanoniczny `anthropic` albo niestandardowy `models.providers.anthropic.baseUrl`, którego host nie jest publicznym endpointem `api.anthropic.com`) OpenClaw tłumi niejawne nagłówki beta Anthropic, takie jak `claude-code-20250219`, `interleaved-thinking-2025-05-14` i znaczniki OAuth, aby niestandardowe proxy zgodne z Anthropic nie odrzucały nieobsługiwanych flag beta. Ustaw jawnie `models.providers.<id>.headers["anthropic-beta"]`, jeśli Twoje proxy potrzebuje konkretnych funkcji beta.

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

- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) - klucze konfiguracji modelu
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover) - łańcuchy awaryjne i zachowanie ponowień
- [Modele](/pl/concepts/models) - konfiguracja modeli i aliasy
- [Providerzy](/pl/providers) - przewodniki konfiguracji dla poszczególnych providerów
