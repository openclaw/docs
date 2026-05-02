---
read_when:
    - Uruchamianie testów dymnych macierzy modeli na żywo / backendu CLI / ACP / media-provider
    - Debugowanie ustalania danych uwierzytelniających dla testów na żywo
    - Dodawanie nowego testu na żywo dla konkretnego dostawcy
sidebarTitle: Live tests
summary: 'Testy na żywo (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, dane uwierzytelniające'
title: 'Testowanie: zestawy testów na żywo'
x-i18n:
    generated_at: "2026-05-02T09:53:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

Szybki start, uruchamiacze QA, zestawy testów jednostkowych/integracyjnych oraz przepływy Docker opisuje
[Testowanie](/pl/help/testing). Ta strona obejmuje zestawy testów **live** (dotykające sieci):
macierz modeli, backendy CLI, ACP oraz testy live dostawców multimediów, a także
obsługę poświadczeń.

## Live: lokalne polecenia smoke dla profilu

Wczytaj `~/.profile` przed doraźnymi kontrolami live, aby klucze dostawców i ścieżki lokalnych narzędzi
były zgodne z Twoją powłoką:

```bash
source ~/.profile
```

Bezpieczny smoke multimediów:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Bezpieczny smoke gotowości połączeń głosowych:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` jest przebiegiem próbnym, chyba że podano także `--yes`. Używaj `--yes` tylko
wtedy, gdy celowo chcesz wykonać rzeczywiste połączenie powiadamiające. W przypadku Twilio, Telnyx i
Plivo pomyślna kontrola gotowości wymaga publicznego adresu URL Webhook; fallbacki wyłącznie lokalne
loopback/prywatne są celowo odrzucane.

## Live: przegląd możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde obecnie reklamowane polecenie** przez połączony węzeł Android i potwierdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja `node.invoke` w Gateway polecenie po poleceniu dla wybranego węzła Android.
- Wymagana konfiguracja wstępna:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja jest utrzymywana na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profilu)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć z podanym kluczem.
- „Smoke Gateway” mówi nam, czy pełny potok gateway+agent działa dla tego modelu (sesje, historia, narzędzia, zasady piaskownicy itd.).

### Warstwa 1: bezpośrednie uzupełnienie modelu (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz celowane regresje tam, gdzie są potrzebne)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, aby `pnpm test:live` pozostał skoncentrowany na smoke Gateway
- Jak wybrać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonych
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista dozwolonych rozdzielona przecinkami)
  - Przeglądy modern/all domyślnie używają dobranego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego przeglądu modern albo dodatnią liczbę dla mniejszego limitu.
  - Wyczerpujące przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu całego testu modeli bezpośrednich. Domyślnie: 60 minut.
  - Próby modeli bezpośrednich domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby ją nadpisać.
- Jak wybrać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych rozdzielona przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profilu i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profilu**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest zepsute / klucz jest nieprawidłowy” od „potok agenta Gateway jest zepsuty”
  - Zawiera małe, izolowane regresje (przykład: odtwarzanie rozumowania OpenAI Responses/Codex Responses + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + smoke agenta dev (co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu na przebieg)
  - Przejść przez modele z kluczami i potwierdzić:
    - „sensowna” odpowiedź (bez narzędzi)
    - działa rzeczywiste wywołanie narzędzia (próba odczytu)
    - opcjonalne dodatkowe próby narzędzi (próba exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → kontynuacja) nadal działają
- Szczegóły prób (aby szybko wyjaśniać awarie):
  - Próba `read`: test zapisuje plik z nonce w obszarze roboczym i prosi agenta, aby go `read` oraz zwrócił nonce.
  - Próba `exec+read`: test prosi agenta, aby przez `exec` zapisał nonce do pliku tymczasowego, a następnie go `read`.
  - Próba obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Odniesienie implementacyjne: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybrać modele:
  - Domyślnie: nowoczesna lista dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonych
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzieloną przecinkami), aby zawęzić
  - Przeglądy Gateway modern/all domyślnie używają dobranego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego przeglądu modern albo dodatnią liczbę dla mniejszego limitu.
- Jak wybrać dostawców (unikając „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych rozdzielona przecinkami)
- Próby narzędzi i obrazów są zawsze włączone w tym teście live:
  - Próba `read` + próba `exec+read` (obciążenie narzędzi)
  - Próba obrazu uruchamia się, gdy model deklaruje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: dopuszczalne drobne błędy)

<Tip>
Aby zobaczyć, co możesz przetestować na swojej maszynie (oraz dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować potok Gateway + agent przy użyciu lokalnego backendu CLI bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do właścicielskiego pluginu.
- Włączenie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie poleceń/argumentów/obrazów pochodzi z metadanych właścicielskiego Plugin backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu). Przepisy Docker domyślnie wyłączają to, chyba że wyraźnie zażądano inaczej.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować, jak przekazywane są argumenty obrazów, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznawiania.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć próbę ciągłości tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Przepisy Docker domyślnie wyłączają to dla niezawodności agregatów.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć próbę MCP/narzędzi loopback. Przepisy Docker domyślnie wyłączają to, chyba że wyraźnie zażądano inaczej.

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Tani smoke konfiguracji Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

To nie prosi Gemini o wygenerowanie odpowiedzi. Zapisuje te same ustawienia systemowe,
które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby udowodnić, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do kształtu HTTP MCP Gemini
i może połączyć się z lokalnym serwerem streamable-HTTP MCP.

Przepis Docker:

```bash
pnpm test:docker:live-cli-backend
```

Przepisy Docker dla pojedynczych dostawców:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Uruchamiacz Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repozytorium jako nie-rootowy użytkownik `node`.
- Rozwiązuje metadane smoke CLI z właścicielskiego rozszerzenia, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) w buforowanym zapisywalnym prefiksie w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Docker, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza API Anthropic. Ta ścieżka subskrypcyjna domyślnie wyłącza próby MCP/narzędzi i obrazu Claude, ponieważ Claude obecnie kieruje użycie aplikacji zewnętrznych przez rozliczanie dodatkowego użycia zamiast normalnych limitów planu subskrypcyjnego.
- Smoke live backendu CLI wykonuje teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia `cron` MCP zweryfikowane przez CLI Gateway.
- Domyślny smoke Claude łata też sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke wiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ powiązania konwersacji ACP z działającym agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną konwersację kanału wiadomości w miejscu
  - wysłać zwykłą wiadomość uzupełniającą w tej samej konwersacji
  - zweryfikować, że wiadomość uzupełniająca trafia do transkrypcji powiązanej sesji ACP
- Włącz:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne wartości:
  - Agenci ACP w Dockerze: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Kanał syntetyczny: kontekst konwersacji w stylu wiadomości DM Slack
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Uwagi:
  - Ta ścieżka używa interfejsu Gateway `chat.send` z syntetycznymi polami trasy źródłowej tylko dla administratora, aby testy mogły dołączyć kontekst kanału wiadomości bez udawania dostarczenia na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów osadzonego Pluginu `acpx` dla wybranego agenta uprzęży ACP.
  - Tworzenie MCP Cron dla powiązanej sesji domyślnie odbywa się na zasadzie najlepszych starań, ponieważ zewnętrzne uprzęże ACP mogą anulować wywołania MCP po przejściu dowodu powiązania/obrazu; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby ta próba Cron po powiązaniu była rygorystyczna.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receptura Docker:

```bash
pnpm test:docker:live-acp-bind
```

Receptury Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia dymny test powiązania ACP kolejno wobec zagregowanych agentów CLI live: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Wczytuje `~/.profile`, przenosi pasujący materiał uwierzytelniania CLI do kontenera, a następnie instaluje żądany CLI live (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli go brakuje. Sam backend ACP to osadzony pakiet `acpx/runtime` z oficjalnego Pluginu `acpx`.
- Wariant Docker dla Droid przenosi `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie OAuth/keyring Factory nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant Docker dla OpenCode to rygorystyczna ścieżka regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`) po wczytaniu `~/.profile`, a `pnpm test:docker:live-acp-bind:opencode` wymaga transkrypcji powiązanego asystenta zamiast akceptować ogólne pominięcie po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ścieżką ręczną/obejściową do porównywania zachowania poza Gateway. Dymny test powiązania ACP w Dockerze ćwiczy osadzony backend runtime `acpx` OpenClaw.

## Na żywo: dymny test uprzęży serwera aplikacji Codex

- Cel: zweryfikować uprząż Codex należącą do Pluginu przez normalną metodę Gateway
  `agent`:
  - załadować dołączony Plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę agenta Gateway do `openai/gpt-5.5` z wymuszoną uprzężą Codex
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek serwera aplikacji
    może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę poleceń Gateway
  - opcjonalnie uruchomić dwie eskalowane próby powłoki sprawdzane przez Guardian: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, i jedno przesłanie fałszywego sekretu, które powinno
    zostać odrzucone, aby agent zapytał ponownie
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włącz: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalna próba obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna próba MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna próba Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Test dymny ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzona uprząż Codex
  nie mogła przejść przez ciche wycofanie do Pi.
- Uwierzytelnianie: uwierzytelnianie serwera aplikacji Codex z lokalnego logowania subskrypcji Codex. Testy
  dymne Docker mogą także podać `OPENAI_API_KEY` dla prób innych niż Codex, gdy ma to zastosowanie,
  plus opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

Receptura lokalna:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receptura Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Wczytuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki uwierzytelniania CLI Codex,
  gdy są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródeł, a następnie uruchamia tylko test live uprzęży Codex.
- Docker domyślnie włącza próby obrazu, MCP/narzędzia i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego przebiegu debugowania.
- Docker eksportuje także `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją testu live,
  aby starsze aliasy lub wycofanie do Pi nie mogły ukryć regresji uprzęży Codex.

### Zalecane receptury testów na żywo

Wąskie, jawne listy dozwolonych elementów są najszybsze i najmniej niestabilne:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, dymny test Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Dymny test adaptacyjnego myślenia Google:
  - Jeśli lokalne klucze znajdują się w profilu powłoki: `source ~/.profile`
  - Dynamiczna wartość domyślna Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa Gemini API (klucza API).
- `google-antigravity/...` używa mostka OAuth Antigravity (punktu końcowego agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na twojej maszynie (osobne uwierzytelnianie i osobliwości narzędzi).
- Gemini API kontra Gemini CLI:
  - API: OpenClaw wywołuje hostowane przez Google Gemini API przez HTTP (klucz API / uwierzytelnianie profilu); to właśnie większość użytkowników rozumie przez „Gemini”.
  - CLI: OpenClaw wywołuje przez powłokę lokalny binarny `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Na żywo: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (testy na żywo są opcjonalne), ale poniższe modele są **zalecane** do regularnego pokrywania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw testów dymnych (wywoływanie narzędzi + obraz)

To jest przebieg „wspólnych modeli”, który ma nadal działać:

- OpenAI (nie-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom dymny test Gateway z narzędziami i obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linia bazowa: wywoływanie narzędzi (Read + opcjonalny Exec)

Wybierz co najmniej jeden model na rodzinę dostawców:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4.3` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model obsługujący „tools”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Wizja: wysłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące wizję itd.), aby uruchomić próbę obrazową.

### Agregatory / alternatywne Gateway

Jeśli masz włączone klucze, obsługujemy także testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia i obrazy)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy na żywo (jeśli masz dane uwierzytelniające/konfigurację):

- Wbudowane: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (chmura/API), plus dowolne proxy zgodne z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie wpisuj w dokumentacji na sztywno „wszystkich modeli”. Autorytatywną listą jest to, co `discoverModels(...)` zwraca na twojej maszynie, plus dostępne klucze.
</Tip>

## Dane uwierzytelniające (nigdy nie dołączaj do commitów)

Testy live wykrywają dane uwierzytelniające tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live zgłasza „no creds”, debuguj tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu starszego typu: `~/.openclaw/credentials/` (kopiowany do przygotowanego środowiska home testów live, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, starsze `credentials/` oraz obsługiwane katalogi uwierzytelniania zewnętrznych CLI do tymczasowego testowego katalogu home; przygotowane katalogi home live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie dotykały rzeczywistego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach ze zmiennych środowiskowych (np. wyeksportowanych w `~/.profile`), uruchom testy lokalne po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą zamontować `~/.profile` w kontenerze).

## Deepgram live (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włącz: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `extensions/byteplus/live.test.ts`
- Włącz: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Ćwiczy dołączone ścieżki comfy dla obrazów, wideo i `music_generate`
  - Pomija każdą funkcję, chyba że skonfigurowano `plugins.entries.comfy.config.<capability>`
  - Przydatne po zmianach w przesyłaniu workflow comfy, odpytywaniu, pobieraniu albo rejestracji Plugin

## Generowanie obrazów live

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy generowania obrazów
  - Wczytuje brakujące zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/środowiskowych przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia każdego skonfigurowanego dostawcę przez współdzielone środowisko runtime generowania obrazów:
    - `<provider>:generate`
    - `<provider>:edit`, gdy dostawca deklaruje obsługę edycji
- Obecnie objęci dołączeni dostawcy:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie ze zmiennych środowiskowych

Dla dostarczanej ścieżki CLI dodaj smoke `infer` po przejściu testu live dostawcy/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to parsowanie argumentów CLI, rozwiązywanie konfiguracji/domyślnego agenta, aktywację dołączonego Plugin, współdzielone środowisko runtime generowania obrazów oraz żądanie do dostawcy live. Oczekuje się, że zależności Plugin będą obecne przed załadowaniem runtime.

## Generowanie muzyki live

- Test: `extensions/music-generation-providers.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Ćwiczy współdzieloną ścieżkę dołączonego dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Wczytuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/środowiskowych przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem zawierającym tylko prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Obecne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przebieg
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie ze zmiennych środowiskowych

## Generowanie wideo live

- Test: `extensions/video-generation-providers.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Ćwiczy współdzieloną ścieżkę dołączonego dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki smoke: dostawcy inni niż FAL, jedno żądanie tekst-na-wideo na dostawcę, jednosekundowy prompt z homarem oraz limit operacji per dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `--video-providers fal` albo `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Wczytuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/środowiskowych przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przebiegu
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu
  - Obecni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia tekst-na-wideo `veo3` oraz ścieżkę `kling`, która domyślnie używa fixture ze zdalnym URL obrazu
  - Obecne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Obecni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych URL referencyjnych `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ obecna współdzielona ścieżka nie ma gwarancji dostępu do wypełniania/remiksowania wideo specyficznych dla organizacji
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit każdej operacji dostawcy na potrzeby agresywnego przebiegu smoke
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie ze zmiennych środowiskowych

## Harness media live

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone pakiety live dla obrazów, muzyki i wideo przez jeden natywny dla repo punkt wejścia
  - Automatycznie wczytuje brakujące zmienne środowiskowe dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy pakiet do dostawców, którzy obecnie mają użyteczne uwierzytelnianie
  - Ponownie wykorzystuje `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) — pakiety jednostkowe, integracyjne, QA i Docker
