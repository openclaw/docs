---
read_when:
    - Uruchamianie testów smoke macierzy modeli na żywo / backendu CLI / ACP / dostawcy multimediów
    - Debugowanie rozpoznawania poświadczeń w testach na żywo
    - Dodawanie nowego testu na żywo dla konkretnego dostawcy
sidebarTitle: Live tests
summary: 'Testy na żywo (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, poświadczenia'
title: 'Testowanie: zestawy testów na żywo'
x-i18n:
    generated_at: "2026-05-03T09:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

Wprowadzenie, uruchamiacze QA, zestawy testów jednostkowych/integracyjnych i przepływy Docker opisuje
[Testowanie](/pl/help/testing). Ta strona obejmuje zestawy testów **live** (dotykające sieci):
macierz modeli, backendy CLI, ACP i testy live dostawców multimediów, a także
obsługę danych uwierzytelniających.

## Live: lokalne polecenia smoke profilu

Przed doraźnymi sprawdzeniami live wczytaj `~/.profile`, aby klucze dostawców i lokalne ścieżki narzędzi
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

`voicecall smoke` jest suchym przebiegiem, chyba że podano również `--yes`. Używaj `--yes` tylko
wtedy, gdy celowo chcesz wykonać rzeczywiste połączenie powiadamiające. Dla Twilio, Telnyx i
Plivo pomyślne sprawdzenie gotowości wymaga publicznego URL-a Webhook; lokalne
fallbacki local loopback/prywatne są odrzucane zgodnie z projektem.

## Live: przegląd możliwości Android Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde obecnie ogłaszane polecenie** przez połączony Android Node i potwierdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw nie instaluje/nie uruchamia/nie paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego Android Node.
- Wymagana konfiguracja wstępna:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja jest utrzymywana na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Androida: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profilu)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć z podanym kluczem.
- „Smoke Gateway” mówi nam, czy pełny potok gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka piaskownicy itd.).

### Warstwa 1: bezpośrednie ukończenie modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz dane uwierzytelniające
  - Uruchomić małe ukończenie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie trzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie zostanie pominięty, aby `pnpm test:live` skupiał się na smoke Gateway
- Jak wybrać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem nowoczesnej listy dozwolonych
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista dozwolonych rozdzielana przecinkami)
  - Przeglądy modern/all domyślnie używają wyselekcjonowanego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_MAX_MODELS=0`, aby wykonać wyczerpujący nowoczesny przegląd, albo dodatnią liczbę, aby ustawić mniejszy limit.
  - Wyczerpujące przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu dla całego testu modelu bezpośredniego. Domyślnie: 60 minut.
  - Próby modelu bezpośredniego domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby to nadpisać.
- Jak wybrać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest uszkodzone / klucz jest nieprawidłowy” od „potok agenta Gateway jest uszkodzony”
  - Zawiera małe, izolowane regresje (przykład: przepływy OpenAI Responses/Codex Responses z odtwarzaniem rozumowania + wywołaniami narzędzi)

### Warstwa 2: smoke Gateway + agent deweloperski (co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu na przebieg)
  - Przejść przez modele-z-kluczami i potwierdzić:
    - „znaczącą” odpowiedź (bez narzędzi)
    - działa rzeczywiste wywołanie narzędzia (próba odczytu)
    - opcjonalne dodatkowe próby narzędzi (próba exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → kontynuacja) nadal działają
- Szczegóły prób (aby szybko wyjaśnić awarie):
  - próba `read`: test zapisuje plik nonce w przestrzeni roboczej i prosi agenta, aby go `read` i odesłał nonce.
  - próba `exec+read`: test prosi agenta, aby przez `exec` zapisał nonce do pliku tymczasowego, a następnie odczytał go z powrotem przez `read`.
  - próba obrazu: test załącza wygenerowany PNG (cat + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Odniesienie implementacyjne: `src/gateway/gateway-models.profiles.live.test.ts` i `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybrać modele:
  - Domyślnie: nowoczesna lista dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem nowoczesnej listy dozwolonych
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przeglądy Gateway modern/all domyślnie używają wyselekcjonowanego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, aby wykonać wyczerpujący nowoczesny przegląd, albo dodatnią liczbę, aby ustawić mniejszy limit.
- Jak wybrać dostawców (unikaj „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych rozdzielana przecinkami)
- Próby narzędzi + obrazów są zawsze włączone w tym teście live:
  - próba `read` + próba `exec+read` (obciążenie narzędzi)
  - próba obrazu działa, gdy model ogłasza obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowy kod (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy dozwolone)

<Tip>
Aby zobaczyć, co możesz przetestować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować potok Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącego Plugin.
- Włączenie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych Plugin właściciela backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu). Receptury Docker domyślnie to wyłączają, chyba że jawnie tego zażądano.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować, jak przekazywane są argumenty obrazów, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć próbę ciągłości tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Receptury Docker domyślnie wyłączają to dla niezawodności agregacji.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć próbę MCP/narzędzia loopback. Receptury Docker domyślnie wyłączają to, chyba że jawnie tego zażądano.

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Tani smoke konfiguracji MCP Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

To nie prosi Gemini o wygenerowanie odpowiedzi. Zapisuje te same ustawienia systemowe,
które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby udowodnić, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do kształtu HTTP MCP Gemini
i może połączyć się z lokalnym serwerem streamable-HTTP MCP.

Receptura Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receptury Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repozytorium jako użytkownik `node` bez uprawnień root.
- Rozwiązuje metadane smoke CLI z należącego Plugin, a następnie instaluje pasujący pakiet CLI dla Linuksa (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) w buforowanym zapisywalnym prefiksie w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw udowadnia bezpośrednie `claude -p` w Docker, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza API Anthropic. Ta ścieżka subskrypcji domyślnie wyłącza próby Claude MCP/narzędzi i obrazów, ponieważ Claude obecnie kieruje użycie aplikacji firm trzecich przez rozliczenia dodatkowego użycia zamiast normalnych limitów planu subskrypcji.
- Smoke live backendu CLI ćwiczy teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez Gateway CLI.
- Domyślny smoke Claude łata też sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke wiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ wiązania konwersacji ACP z żywym agentem ACP:
  - wyślij `/acp spawn <agent> --bind here`
  - powiąż syntetyczną konwersację kanału wiadomości w miejscu
  - wyślij zwykłą wiadomość uzupełniającą w tej samej konwersacji
  - zweryfikuj, że wiadomość uzupełniająca trafia do transkryptu powiązanej sesji ACP
- Włącz:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Wartości domyślne:
  - Agenci ACP w Dockerze: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Kanał syntetyczny: kontekst konwersacji w stylu DM Slack
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
  - Ta ścieżka używa powierzchni Gateway `chat.send` z syntetycznymi polami trasy źródłowej tylko dla administratora, aby testy mogły dołączać kontekst kanału wiadomości bez udawania dostarczania na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów wbudowanego Pluginu `acpx` dla wybranego agenta uprzęży ACP.
  - Tworzenie MCP cron dla powiązanej sesji jest domyślnie podejmowane na zasadzie najlepszych starań, ponieważ zewnętrzne uprzęże ACP mogą anulować wywołania MCP po przejściu dowodu wiązania/obrazu; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby zaostrzyć tę próbę cron po powiązaniu.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Przepis Docker:

```bash
pnpm test:docker:live-acp-bind
```

Przepisy Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke wiązania ACP kolejno względem zbiorczych żywych agentów CLI: `claude`, `codex`, a potem `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` albo `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Wczytuje `~/.profile`, umieszcza pasujący materiał uwierzytelniania CLI w kontenerze, a następnie instaluje żądany żywy CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` albo `opencode-ai`), jeśli go brakuje. Sam backend ACP to wbudowany pakiet `acpx/runtime` z oficjalnego Pluginu `acpx`.
- Wariant Docker dla Droid umieszcza `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant Docker dla OpenCode to ścisła ścieżka regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`) po wczytaniu `~/.profile`, a `pnpm test:docker:live-acp-bind:opencode` wymaga powiązanego transkryptu asystenta zamiast akceptować ogólne pominięcie po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ręczną ścieżką/obejściem do porównywania zachowania poza Gateway. Smoke wiązania ACP w Dockerze ćwiczy wbudowany backend runtime `acpx` OpenClaw.

## Live: smoke uprzęży serwera aplikacji Codex

- Cel: zweryfikować należącą do Pluginu uprząż Codex przez zwykłą metodę Gateway
  `agent`:
  - załaduj dołączony Plugin `codex`
  - wybierz `OPENCLAW_AGENT_RUNTIME=codex`
  - wyślij pierwszy turn agenta Gateway do `openai/gpt-5.5` z wymuszoną uprzężą Codex
  - wyślij drugi turn do tej samej sesji OpenClaw i zweryfikuj, że wątek serwera aplikacji
    może zostać wznowiony
  - uruchom `/codex status` i `/codex models` przez tę samą ścieżkę polecenia Gateway
  - opcjonalnie uruchom dwie eskalowane próby powłoki sprawdzone przez Guardian: jedno łagodne
    polecenie, które powinno zostać zatwierdzone, i jedno przesłanie fałszywego sekretu, które powinno zostać
    odrzucone, aby agent zapytał z powrotem
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włącz: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalna próba obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna próba MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna próba Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke używa `agentRuntime.id: "codex"`, więc zepsuta uprząż Codex nie może
  przejść przez ciche cofnięcie do PI.
- Uwierzytelnianie: uwierzytelnianie serwera aplikacji Codex z lokalnego logowania subskrypcji Codex. Smoke w Dockerze
  może też podać `OPENAI_API_KEY` dla prób innych niż Codex, gdy ma to zastosowanie,
  oraz opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

Lokalny przepis:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Przepis Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Wczytuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  uwierzytelniania CLI Codex, gdy są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródłowe, a potem uruchamia tylko test live uprzęży Codex.
- Docker domyślnie włącza próby obrazu, MCP/narzędzia i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego uruchomienia
  debugowania.
- Docker używa tej samej jawnej konfiguracji runtime Codex, więc starsze aliasy albo cofnięcie do PI
  nie mogą ukryć regresji uprzęży Codex.

### Zalecane przepisy live

Wąskie, jawne listy dozwolone są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptacyjnego myślenia Google:
  - Jeśli lokalne klucze znajdują się w profilu powłoki: `source ~/.profile`
  - Dynamiczna wartość domyślna Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostka Antigravity OAuth (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego CLI Gemini na Twojej maszynie (osobne uwierzytelnianie + osobliwości narzędzi).
- Gemini API kontra Gemini CLI:
  - API: OpenClaw wywołuje hostowane API Gemini Google przez HTTP (klucz API / uwierzytelnianie profilu); to większość użytkowników rozumie przez „Gemini”.
  - CLI: OpenClaw uruchamia lokalny plik binarny `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (obsługa streamingu/narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opcjonalne), ale są to **zalecane** modele do regularnego obejmowania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To uruchomienie „wspólnych modeli”, którego działania oczekujemy:

- OpenAI (nie-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (albo `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke Gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linia bazowa: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden dla każdej rodziny dostawców:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (albo `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (albo `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4.3` (albo najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model zdolny do „tools”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące vision itd.), aby przećwiczyć próbę obrazu.

### Agregatory / alternatywne bramy

Jeśli masz włączone klucze, wspieramy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia+obrazy)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowane: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (chmura/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie wpisuj na stałe „wszystkich modeli” w dokumentacji. Autorytatywną listą jest to, co `discoverModels(...)` zwraca na Twojej maszynie, plus dostępne klucze.
</Tip>

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. Praktyczne skutki:

- Jeśli CLI działa, testy na żywo powinny znaleźć te same klucze.
- Jeśli test na żywo zgłasza „brak poświadczeń”, debuguj go tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania na agenta: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznacza „klucze profilu” w testach na żywo)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu starszej wersji: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego testów na żywo, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia na żywo domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` na agenta, starszy katalog `credentials/` oraz obsługiwane katalogi uwierzytelniania zewnętrznych CLI do tymczasowego katalogu domowego testów; przygotowane katalogi domowe testów na żywo pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby próby nie dotykały prawdziwego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach środowiskowych (np. wyeksportowanych w `~/.profile`), uruchom lokalne testy po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą zamontować `~/.profile` w kontenerze).

## Deepgram na żywo (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączenie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus na żywo dla planu kodowania

- Test: `extensions/byteplus/live.test.ts`
- Włączenie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media przepływu pracy ComfyUI na żywo

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Sprawdza dołączone ścieżki obrazu, wideo i `music_generate` dla comfy
  - Pomija każdą możliwość, jeśli `plugins.entries.comfy.config.<capability>` nie jest skonfigurowane
  - Przydatne po zmianach w przesyłaniu przepływu pracy comfy, odpytywaniu, pobieraniu lub rejestracji pluginu

## Generowanie obrazów na żywo

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Środowisko testowe: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy generowania obrazów
  - Ładuje brakujące zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed próbkowaniem
  - Domyślnie używa kluczy API z trybu na żywo/środowiska przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia każdego skonfigurowanego dostawcę przez współdzielony runtime generowania obrazów:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne tylko w środowisku

Dla dostarczonej ścieżki CLI dodaj próbę dymną `infer` po pomyślnym przejściu testu na żywo dostawcy/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to parsowanie argumentów CLI, rozwiązywanie konfiguracji/domyślnego agenta, aktywację dołączonego pluginu, współdzielony runtime generowania obrazów oraz żądanie do dostawcy na żywo. Zależności pluginu powinny być obecne przed załadowaniem runtime.

## Generowanie muzyki na żywo

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Środowisko testowe: `pnpm test:live:media music`
- Zakres:
  - Sprawdza współdzieloną ścieżkę dołączonego dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed próbkowaniem
  - Domyślnie używa kluczy API z trybu na żywo/środowiska przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem zawierającym tylko prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Obecne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik Comfy na żywo, nie ten współdzielony przebieg
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne tylko w środowisku

## Generowanie wideo na żywo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Środowisko testowe: `pnpm test:live:media video`
- Zakres:
  - Sprawdza współdzieloną ścieżkę dołączonego dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki próby dymnej: dostawcy inni niż FAL, jedno żądanie tekst-na-wideo na dostawcę, jednosekundowy prompt z homarem oraz limit operacji na dostawcę z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienia kolejki po stronie dostawcy mogą zdominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed próbkowaniem
  - Domyślnie używa kluczy API z trybu na żywo/środowiska przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przebiegu
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu
  - Obecni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `vydra`, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego adresu URL obrazu
  - Pokrycie Vydra specyficzne dla dostawcy:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` tekst-na-wideo oraz ścieżkę `kling`, która domyślnie używa fixture ze zdalnym adresem URL obrazu
  - Obecne pokrycie na żywo `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Obecni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych adresów URL referencji `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ obecna współdzielona ścieżka nie ma gwarancji dostępu do organizacyjnie specyficznego wypełniania/remiksowania wideo
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit każdej operacji dostawcy dla agresywnej próby dymnej
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne tylko w środowisku

## Środowisko testowe multimediów na żywo

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy testów na żywo dla obrazów, muzyki i wideo przez jeden natywny dla repo punkt wejścia
  - Automatycznie ładuje brakujące zmienne środowiskowe dostawcy z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy obecnie mają użyteczne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) — zestawy testów jednostkowych, integracyjnych, QA i Docker
