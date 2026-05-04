---
read_when:
    - Uruchamianie testów smoke macierzy modeli na żywo / backendu CLI / ACP / media-provider
    - Debugowanie ustalania poświadczeń testów na żywo
    - Dodawanie nowego testu na żywo dla konkretnego dostawcy
sidebarTitle: Live tests
summary: 'Testy live (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy mediów, poświadczenia'
title: 'Testowanie: pakiety testów na żywo'
x-i18n:
    generated_at: "2026-05-04T18:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

Szybki start, narzędzia uruchamiające QA, zestawy testów jednostkowych/integracyjnych i przepływy Docker opisano w sekcji
[Testowanie](/pl/help/testing). Ta strona obejmuje **live** (dotykające sieci) zestawy
testów: macierz modeli, backendy CLI, ACP i testy live dostawców multimediów, a także
obsługę poświadczeń.

## Live: lokalne polecenia dymne profilu

Przed doraźnymi kontrolami live wykonaj `source ~/.profile`, aby klucze dostawców i lokalne ścieżki
narzędzi pasowały do Twojej powłoki:

```bash
source ~/.profile
```

Bezpieczny test dymny multimediów:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Bezpieczny test dymny gotowości połączenia głosowego:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` działa jako próba sucha, chyba że podano też `--yes`. Używaj `--yes` tylko
wtedy, gdy celowo chcesz wykonać rzeczywiste połączenie powiadamiające. Dla Twilio, Telnyx i
Plivo pomyślna kontrola gotowości wymaga publicznego adresu URL webhooka; wyłącznie lokalne
fallbacki loopback/prywatne są odrzucane z założenia.

## Live: przegląd możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde obecnie reklamowane polecenie** przez połączony węzeł Android i potwierdzić zachowanie kontraktu polecenia.
- Zakres:
  - Warunkowa/ręczna konfiguracja wstępna (zestaw nie instaluje/uruchamia/paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego węzła Android.
- Wymagana konfiguracja wstępna:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja jest utrzymywana na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie zostały przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: test dymny modeli (klucze profilu)

Testy live są podzielone na dwie warstwy, abyśmy mogli izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć z podanym kluczem.
- „Test dymny Gateway” mówi nam, czy pełny potok gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka piaskownicy itd.).

### Warstwa 1: Bezpośrednie uzupełnianie modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby rzeczywiście uruchomić ten zestaw; w przeciwnym razie jest pomijany, aby `pnpm test:live` skupiał się na teście dymnym Gateway
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonych
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista dozwolonych rozdzielana przecinkami)
  - Przeglądy modern/all domyślnie używają dobranego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego nowoczesnego przeglądu albo liczbę dodatnią dla mniejszego limitu.
  - Wyczerpujące przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu dla całego testu modelu bezpośredniego. Domyślnie: 60 minut.
  - Próby modelu bezpośredniego domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby ją nadpisać.
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profilu i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profilu**
- Po co to istnieje:
  - Oddziela „API dostawcy jest zepsute / klucz jest nieprawidłowy” od „potok agenta Gateway jest zepsuty”
  - Zawiera małe, izolowane regresje (przykład: odtwarzanie rozumowania OpenAI Responses/Codex Responses + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + test dymny agenta deweloperskiego (co faktycznie robi "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu dla każdego uruchomienia)
  - Iterować po modelach z kluczami i potwierdzić:
    - „sensowną” odpowiedź (bez narzędzi)
    - działa rzeczywiste wywołanie narzędzia (próba odczytu)
    - opcjonalne dodatkowe próby narzędzi (próba exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → kontynuacja) nadal działają
- Szczegóły prób (aby szybko wyjaśnić awarie):
  - próba `read`: test zapisuje plik nonce w obszarze roboczym i prosi agenta, aby go `read` oraz odesłał nonce.
  - próba `exec+read`: test prosi agenta, aby przez `exec` zapisał nonce do pliku tymczasowego, a potem odczytał go przez `read`.
  - próba obrazu: test dołącza wygenerowany PNG (cat + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Odniesienie implementacji: `src/gateway/gateway-models.profiles.live.test.ts` i `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna lista dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonych
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przeglądy Gateway modern/all domyślnie używają dobranego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego nowoczesnego przeglądu albo liczbę dodatnią dla mniejszego limitu.
- Jak wybierać dostawców (unikaj „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych rozdzielana przecinkami)
- Próby narzędzi + obrazów są zawsze włączone w tym teście live:
  - próba `read` + próba `exec+read` (obciążenie narzędzi)
  - próba obrazu działa, gdy model deklaruje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dopuszczalne)

<Tip>
Aby zobaczyć, co możesz testować na swoim komputerze (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: test dymny backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zwalidować potok Gateway + agent z użyciem lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne wartości testu dymnego specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do właścicielskiego pluginu.
- Włącz:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych właścicielskiego Plugin backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu). Receptury Docker domyślnie wyłączają to, chyba że jawnie tego zażądano.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zwalidować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć próbę ciągłości w tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Receptury Docker domyślnie wyłączają to dla niezawodności zbiorczej.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć próbę MCP/narzędzia local loopback. Receptury Docker domyślnie wyłączają to, chyba że jawnie tego zażądano.

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Tani test dymny konfiguracji Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Nie prosi to Gemini o wygenerowanie odpowiedzi. Zapisuje te same ustawienia systemowe,
które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby udowodnić, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do kształtu HTTP MCP Gemini
i może połączyć się z lokalnym serwerem MCP streamable-HTTP.

Receptura Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receptury Docker dla pojedynczych dostawców:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia test dymny live backendu CLI wewnątrz obrazu Docker repo jako użytkownik `node` bez uprawnień roota.
- Rozwiązuje metadane testu dymnego CLI z właścicielskiego rozszerzenia, a następnie instaluje pasujący pakiet CLI dla Linuksa (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) w buforowanym zapisywalnym prefiksie pod `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Docker, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza API Anthropic. Ta ścieżka subskrypcyjna domyślnie wyłącza próby Claude MCP/narzędzi i obrazów, ponieważ Claude obecnie kieruje użycie aplikacji firm trzecich przez rozliczenia dodatkowego użycia zamiast zwykłych limitów planu subskrypcji.
- Test dymny live backendu CLI wykonuje teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez Gateway CLI.
- Domyślny test dymny Claude łata też sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: osiągalność proxy APNs HTTP/2

- Test: `src/infra/push-apns-http2.live.test.ts`
- Cel: tunelować przez lokalny proxy HTTP CONNECT do endpointu sandbox APNs Apple, wysłać żądanie walidacyjne APNs HTTP/2 i potwierdzić, że rzeczywista odpowiedź Apple `403 InvalidProviderToken` wraca ścieżką proxy.
- Włącz:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Opcjonalny limit czasu:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: test dymny bindowania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ wiązania konwersacji ACP z agentem ACP na żywo:
  - wyślij `/acp spawn <agent> --bind here`
  - powiąż syntetyczną konwersację kanału wiadomości w miejscu
  - wyślij zwykłą wiadomość uzupełniającą w tej samej konwersacji
  - sprawdź, czy wiadomość uzupełniająca trafia do transkrypcji powiązanej sesji ACP
- Włącz:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Wartości domyślne:
  - Agenci ACP w Docker: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Kanał syntetyczny: kontekst konwersacji w stylu wiadomości bezpośredniej Slack
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
  - Ta ścieżka używa powierzchni `chat.send` Gateway z polami syntetycznej trasy pochodzenia dostępnymi tylko dla administratorów, aby testy mogły dołączać kontekst kanału wiadomości bez udawania dostarczania na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów osadzonego Pluginu `acpx` dla wybranego agenta uprzęży ACP.
  - Tworzenie MCP Cron powiązanej sesji jest domyślnie podejmowane w trybie best-effort, ponieważ zewnętrzne uprzęże ACP mogą anulować wywołania MCP po przejściu dowodu powiązania/obrazu; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby ta sonda Cron po powiązaniu była rygorystyczna.

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

Uwagi dotyczące Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke wiązania ACP sekwencyjnie względem zagregowanych agentów CLI na żywo: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Wczytuje `~/.profile`, przygotowuje pasujące materiały uwierzytelniania CLI w kontenerze, a następnie instaluje żądany CLI na żywo (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli go brakuje. Sam backend ACP to osadzony pakiet `acpx/runtime` z oficjalnego Pluginu `acpx`.
- Wariant Droid Docker przygotowuje `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant OpenCode Docker to rygorystyczna ścieżka regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`) po wczytaniu `~/.profile`, a `pnpm test:docker:live-acp-bind:opencode` wymaga powiązanej transkrypcji asystenta zamiast akceptować ogólne pominięcie po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ścieżką ręczną/obejściem do porównywania zachowania poza Gateway. Smoke wiązania ACP w Docker sprawdza osadzony backend runtime `acpx` OpenClaw.

## Live: smoke uprzęży serwera aplikacji Codex

- Cel: zweryfikować uprząż Codex należącą do Pluginu przez normalną metodę Gateway
  `agent`:
  - załaduj dołączony Plugin `codex`
  - wybierz `OPENCLAW_AGENT_RUNTIME=codex`
  - wyślij pierwszą turę agenta Gateway do `openai/gpt-5.5` z wymuszoną uprzężą Codex
  - wyślij drugą turę do tej samej sesji OpenClaw i sprawdź, czy wątek serwera aplikacji
    może zostać wznowiony
  - uruchom `/codex status` i `/codex models` przez tę samą ścieżkę poleceń Gateway
  - opcjonalnie uruchom dwie eskalowane sondy powłoki oceniane przez Guardian: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, i jedno przesłanie fałszywego sekretu, które powinno
    zostać odrzucone, tak aby agent zapytał ponownie
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włącz: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna sonda Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke używa `agentRuntime.id: "codex"`, aby uszkodzona uprząż Codex nie mogła
  przejść przez ciche wycofanie do PI.
- Uwierzytelnianie: uwierzytelnianie serwera aplikacji Codex z lokalnego logowania subskrypcji Codex. Smoke w Docker
  mogą też przekazywać `OPENAI_API_KEY` dla sond innych niż Codex, gdy ma to zastosowanie,
  plus opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

Przepis lokalny:

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

Uwagi dotyczące Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Wczytuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  uwierzytelniania Codex CLI, gdy są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródłowe, a następnie uruchamia tylko test na żywo uprzęży Codex.
- Docker domyślnie włącza sondy obrazu, MCP/narzędzia i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego uruchomienia debugowania.
- Docker używa tej samej jawnej konfiguracji runtime Codex, więc starsze aliasy lub wycofanie do PI
  nie mogą ukryć regresji uprzęży Codex.

### Zalecane przepisy live

Wąskie, jawne listy dozwolonych elementów są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke myślenia adaptacyjnego Google:
  - Jeśli lokalne klucze znajdują się w profilu powłoki: `source ~/.profile`
  - Dynamiczna wartość domyślna Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostu Antigravity OAuth (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na twojej maszynie (osobne uwierzytelnianie i osobliwości narzędzi).
- Gemini API kontra Gemini CLI:
  - API: OpenClaw wywołuje hostowane API Gemini Google przez HTTP (klucz API / uwierzytelnianie profilu); to właśnie większość użytkowników rozumie przez „Gemini”.
  - CLI: OpenClaw uruchamia lokalny plik binarny `gemini` przez powłokę; ma własne uwierzytelnianie i może zachowywać się inaczej (obsługa streamingu/narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opcjonalne), ale to są **zalecane** modele do regularnego pokrywania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To uruchomienie „typowych modeli”, którego działania oczekujemy:

- OpenAI (nie-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke Gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Bazowy zestaw: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden na rodzinę dostawców:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4.3` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden włączony model obsługujący „tools”)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące vision itd.), aby wykonać sondę obrazu.

### Agregatory / alternatywne bramy

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia i obraz)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (chmura/API), plus dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie wpisuj na sztywno „wszystkich modeli” w dokumentacji. Autorytatywna lista to wszystko, co `discoverModels(...)` zwraca na twojej maszynie, plus dostępne klucze.
</Tip>

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy na żywo powinny znaleźć te same klucze.
- Jeśli test na żywo zgłasza „brak poświadczeń”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania dla agentów: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „klucze profilu” w testach na żywo)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog starszego stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego testów na żywo, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia na żywo domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` dla agentów, starsze `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego katalogu domowego testu; przygotowane katalogi domowe na żywo pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby próby nie dotykały rzeczywistego obszaru roboczego na hoście.

Jeśli chcesz polegać na kluczach ze zmiennych środowiskowych (np. wyeksportowanych w `~/.profile`), uruchom testy lokalne po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą zamontować `~/.profile` w kontenerze).

## Deepgram na żywo (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączenie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan kodowania BytePlus na żywo

- Test: `extensions/byteplus/live.test.ts`
- Włączenie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Multimedia przepływu pracy ComfyUI na żywo

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Ćwiczy dołączone ścieżki obrazu, wideo i `music_generate` comfy
  - Pomija każdą możliwość, jeśli `plugins.entries.comfy.config.<capability>` nie jest skonfigurowane
  - Przydatne po zmianie przesyłania przepływów pracy comfy, odpytywania, pobierania lub rejestracji pluginu

## Generowanie obrazów na żywo

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany plugin dostawcy generowania obrazów
  - Wczytuje brakujące zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed próbą
  - Domyślnie używa kluczy API live/ze środowiska przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia każdego skonfigurowanego dostawcę przez współdzielone środowisko uruchomieniowe generowania obrazów:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie ze środowiska

Dla dostarczanej ścieżki CLI dodaj smoke `infer` po przejściu testu live dostawcy/środowiska uruchomieniowego:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to parsowanie argumentów CLI, rozwiązywanie konfiguracji/domyślnego agenta, aktywację dołączonego pluginu, współdzielone środowisko uruchomieniowe generowania obrazów oraz żądanie do dostawcy na żywo. Oczekuje się, że zależności pluginu będą obecne przed załadowaniem środowiska uruchomieniowego.

## Generowanie muzyki na żywo

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Ćwiczy współdzieloną ścieżkę dołączonego dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Wczytuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed próbą
  - Domyślnie używa kluczy API live/ze środowiska przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby środowiska uruchomieniowego, gdy są dostępne:
    - `generate` z wejściem zawierającym tylko prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Obecne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: oddzielny plik live Comfy, nie ten współdzielony przebieg
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie ze środowiska

## Generowanie wideo na żywo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Ćwiczy współdzieloną ścieżkę dołączonego dostawcy generowania wideo
  - Domyślnie używa smoke path bezpiecznej dla wydania: dostawcy spoza FAL, jedno żądanie tekst-na-wideo na dostawcę, jednosekundowy prompt z homarem oraz limit operacji dla dostawcy z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `--video-providers fal` albo `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Wczytuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed próbą
  - Domyślnie używa kluczy API live/ze środowiska przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przebiegu
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu
  - Obecni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `vydra`, ponieważ dołączone `veo3` obsługuje tylko tekst, a dołączone `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia tekst-na-wideo `veo3` oraz ścieżkę `kling`, która domyślnie używa fixture ze zdalnym URL obrazu
  - Obecne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Obecni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych URL referencyjnych `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ obecna współdzielona ścieżka nie ma gwarancji dostępu do specyficznych dla organizacji funkcji inpaint/remix wideo
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit każdej operacji dostawcy dla agresywnego przebiegu smoke
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie ze środowiska

## Harness multimediów na żywo

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live obrazów, muzyki i wideo przez jeden natywny dla repozytorium punkt wejścia
  - Automatycznie wczytuje brakujące zmienne środowiskowe dostawcy z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy obecnie mają użyteczne uwierzytelnianie
  - Używa ponownie `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) — zestawy jednostkowe, integracyjne, QA i Docker
