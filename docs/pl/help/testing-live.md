---
read_when:
    - Uruchamianie testów smoke macierzy modeli na żywo / backendu CLI / ACP / media-provider
    - Debugowanie ustalania poświadczeń testów na żywo
    - Dodawanie nowego testu na żywo specyficznego dla dostawcy
sidebarTitle: Live tests
summary: 'Testy rzeczywiste (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy mediów, poświadczenia'
title: 'Testowanie: zestawy testów na żywo'
x-i18n:
    generated_at: "2026-05-06T09:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

Aby szybko zacząć, sprawdzić uruchomienia QA, zestawy testów jednostkowych/integracyjnych oraz przepływy Docker, zobacz
[Testowanie](/pl/help/testing). Ta strona obejmuje zestawy testów **na żywo** (dotykające sieci):
macierz modeli, backendy CLI, ACP oraz testy na żywo dostawców multimediów, a także
obsługę poświadczeń.

## Na żywo: lokalne polecenia smoke dla profilu

Wczytaj `~/.profile` przed doraźnymi testami na żywo, aby klucze dostawców i ścieżki
lokalnych narzędzi odpowiadały Twojej powłoce:

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

`voicecall smoke` jest suchym przebiegiem, chyba że podano też `--yes`. Używaj `--yes` tylko
wtedy, gdy celowo chcesz wykonać prawdziwe połączenie powiadamiające. W przypadku Twilio, Telnyx i
Plivo pomyślny test gotowości wymaga publicznego adresu URL webhooka; lokalne
fallbacki typu loopback/prywatne są celowo odrzucane.

## Na żywo: przegląd możliwości Android Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie obecnie reklamowane** przez połączony Android Node i potwierdzić zachowanie kontraktu poleceń.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja Gateway `node.invoke` polecenie po poleceniu dla wybranego Android Node.
- Wymagana konfiguracja wstępna:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Przyznano uprawnienia/zgodę na przechwytywanie dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Na żywo: smoke modeli (klucze profilu)

Testy na żywo są podzielone na dwie warstwy, aby można było izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć z danym kluczem.
- „Smoke Gateway” mówi nam, czy pełny potok gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka piaskownicy itd.).

### Warstwa 1: bezpośrednie uzupełnianie modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, żeby `pnpm test:live` pozostawał skupiony na smoke Gateway
- Jak wybrać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwolonych modeli (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem nowoczesnej listy dozwolonych modeli
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista dozwolonych rozdzielona przecinkami)
  - Przeglądy modern/all domyślnie używają wyselekcjonowanego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_MAX_MODELS=0`, aby wykonać wyczerpujący przegląd modern, albo liczbę dodatnią dla mniejszego limitu.
  - Wyczerpujące przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu całego testu bezpośredniego modelu. Domyślnie: 60 minut.
  - Próby bezpośredniego modelu domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby to nadpisać.
- Jak wybrać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych rozdzielona przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profilu i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profilu**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest zepsute / klucz jest nieprawidłowy” od „potok agenta Gateway jest zepsuty”
  - Zawiera małe, izolowane regresje (przykład: OpenAI Responses/Codex Responses, odtwarzanie reasoning + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + smoke agenta dev (co naprawdę robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu na każde uruchomienie)
  - Iterować po modelach z kluczami i potwierdzić:
    - „sensowną” odpowiedź (bez narzędzi)
    - działa prawdziwe wywołanie narzędzia (próba odczytu)
    - opcjonalne dodatkowe próby narzędzi (próba exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → follow-up) nadal działają
- Szczegóły prób (aby szybko wyjaśniać awarie):
  - Próba `read`: test zapisuje plik nonce w workspace i prosi agenta o `read` oraz zwrócenie nonce.
  - Próba `exec+read`: test prosi agenta o zapisanie nonce do pliku tymczasowego przez `exec`, a potem odczytanie go przez `read`.
  - Próba obrazu: test dołącza wygenerowany PNG (cat + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` i `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybrać modele:
  - Domyślnie: nowoczesna lista dozwolonych modeli (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem nowoczesnej listy dozwolonych modeli
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzieloną przecinkami), aby zawęzić
  - Przeglądy Gateway modern/all domyślnie używają wyselekcjonowanego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, aby wykonać wyczerpujący przegląd modern, albo liczbę dodatnią dla mniejszego limitu.
- Jak wybrać dostawców (unikaj „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych rozdzielona przecinkami)
- Próby narzędzi + obrazu są w tym teście na żywo zawsze włączone:
  - próba `read` + próba `exec+read` (obciążenie narzędzi)
  - próba obrazu działa, gdy model deklaruje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne pomyłki dozwolone)

<Tip>
Aby zobaczyć, co możesz przetestować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Na żywo: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować potok Gateway + agent z użyciem lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne wartości smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do właściwego Plugin.
- Włącz:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych Plugin backendu CLI należącego do właściciela.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać prawdziwy załącznik obrazowy (ścieżki są wstrzykiwane do promptu). Receptury Docker domyślnie to wyłączają, chyba że wyraźnie tego zażądano.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznawiania.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć próbę ciągłości tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Receptury Docker domyślnie to wyłączają dla zbiorczej niezawodności.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć próbę loopback MCP/narzędzi. Receptury Docker domyślnie to wyłączają, chyba że wyraźnie tego zażądano.

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
które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby potwierdzić, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do formatu HTTP MCP
Gemini i może połączyć się z lokalnym serwerem MCP streamable-HTTP.

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
- Uruchamia smoke backendu CLI na żywo wewnątrz obrazu Docker repozytorium jako użytkownik `node` bez uprawnień root.
- Rozwiązuje metadane smoke CLI z rozszerzenia właściciela, a następnie instaluje pasujący pakiet CLI dla Linux (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Docker, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza API Anthropic. Ten tor subskrypcji domyślnie wyłącza próby Claude MCP/narzędzi i obrazu, ponieważ Claude obecnie kieruje użycie aplikacji zewnętrznych przez rozliczanie dodatkowego użycia zamiast normalnych limitów planu subskrypcyjnego.
- Smoke backendu CLI na żywo wykonuje teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: turę tekstową, turę klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez CLI Gateway.
- Domyślny smoke Claude łata też sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Na żywo: osiągalność proxy APNs HTTP/2

- Test: `src/infra/push-apns-http2.live.test.ts`
- Cel: tunelować przez lokalny proxy HTTP CONNECT do endpointu sandbox APNs Apple, wysłać żądanie walidacyjne APNs HTTP/2 i potwierdzić, że prawdziwa odpowiedź Apple `403 InvalidProviderToken` wraca przez ścieżkę proxy.
- Włącz:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Opcjonalny limit czasu:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Na żywo: smoke bindowania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ wiązania konwersacji ACP z żywym agentem ACP:
  - wyślij `/acp spawn <agent> --bind here`
  - powiąż syntetyczną konwersację kanału wiadomości w miejscu
  - wyślij zwykłą wiadomość uzupełniającą w tej samej konwersacji
  - sprawdź, czy wiadomość uzupełniająca trafia do transkryptu powiązanej sesji ACP
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
  - Ta ścieżka używa powierzchni `chat.send` Gateway z syntetycznymi polami trasy źródłowej tylko dla administratora, aby testy mogły dołączać kontekst kanału wiadomości bez udawania dostarczania na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów w osadzonym Plugin `acpx` dla wybranego agenta uprzęży ACP.
  - Tworzenie MCP cron powiązanej sesji jest domyślnie best-effort, ponieważ zewnętrzne uprzęże ACP mogą anulować wywołania MCP po przejściu dowodu powiązania/obrazu; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby ten po-powiązaniowy próbnik cron był rygorystyczny.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recepty Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke wiązania ACP przeciwko zagregowanym żywym agentom CLI po kolei: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Źródłuje `~/.profile`, przygotowuje pasujące materiały uwierzytelniania CLI w kontenerze, a następnie instaluje żądane żywe CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli go brakuje. Sam backend ACP to osadzony pakiet `acpx/runtime` z oficjalnego Plugin `acpx`.
- Wariant Docker dla Droid przygotowuje `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant Docker dla OpenCode to rygorystyczna ścieżka regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`) po źródłowaniu `~/.profile`, a `pnpm test:docker:live-acp-bind:opencode` wymaga transkryptu powiązanego asystenta zamiast akceptowania ogólnego pominięcia po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ręczną/obejściową ścieżką do porównywania zachowania poza Gateway. Smoke wiązania ACP w Docker ćwiczy osadzony backend runtime `acpx` OpenClaw.

## Live: smoke uprzęży serwera aplikacji Codex

- Cel: zweryfikować należącą do Plugin uprząż Codex przez zwykłą metodę Gateway
  `agent`:
  - załaduj dołączony Plugin `codex`
  - wybierz `OPENCLAW_AGENT_RUNTIME=codex`
  - wyślij pierwszą turę agenta Gateway do `openai/gpt-5.5` z wymuszoną uprzężą Codex
  - wyślij drugą turę do tej samej sesji OpenClaw i sprawdź, czy wątek serwera aplikacji
    może zostać wznowiony
  - uruchom `/codex status` i `/codex models` przez tę samą ścieżkę poleceń Gateway
  - opcjonalnie uruchom dwa przejrzane przez Guardian eskalowane próbniki powłoki: jedno łagodne
    polecenie, które powinno zostać zatwierdzone, i jedno wysłanie fałszywego sekretu, które powinno zostać
    odrzucone, aby agent zapytał z powrotem
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włącz: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalny próbnik obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalny próbnik MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalny próbnik Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke używa `agentRuntime.id: "codex"`, więc uszkodzona uprząż Codex nie może
  przejść przez ciche wycofanie do PI.
- Uwierzytelnianie: uwierzytelnianie serwera aplikacji Codex z lokalnego logowania subskrypcji Codex. Smoke Docker
  mogą też dostarczyć `OPENAI_API_KEY` dla próbników innych niż Codex, gdy ma to zastosowanie,
  oraz opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

Recepta lokalna:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recepta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Źródłuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  uwierzytelniania Codex CLI, gdy są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródłowe, a następnie uruchamia tylko żywy test uprzęży Codex.
- Docker domyślnie włącza próbniki obrazu, MCP/narzędzi i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego przebiegu debugowania.
- Docker używa tej samej jawnej konfiguracji runtime Codex, więc starsze aliasy lub
  wycofanie PI nie mogą ukryć regresji uprzęży Codex.

### Zalecane recepty live

Wąskie, jawne listy dozwolonych elementów są najszybsze i najmniej niestabilne:

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
- `google-antigravity/...` używa mostu Antigravity OAuth (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twoim komputerze (osobne uwierzytelnianie + osobliwości narzędzi).
- Gemini API a Gemini CLI:
  - API: OpenClaw wywołuje hostowane przez Google API Gemini przez HTTP (klucz API / uwierzytelnianie profilu); to ma na myśli większość użytkowników, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalny plik binarny `gemini` przez powłokę; ma on własne uwierzytelnianie i może zachowywać się inaczej (obsługa streamingu/narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego obejmowania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest przebieg „typowych modeli”, który ma nadal działać:

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

### Punkt odniesienia: wywoływanie narzędzi (Read + opcjonalny Exec)

Wybierz co najmniej jeden dla każdej rodziny dostawców:

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

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące vision itd.), aby ćwiczyć próbnik obrazu.

### Agregatory / alternatywne Gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia+obrazy)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowane: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (chmura/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie koduj na stałe „wszystkich modeli” w dokumentacji. Autorytatywna lista to to, co zwraca `discoverModels(...)` na Twojej maszynie, plus dostępne klucze.
</Tip>

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „no creds”, debuguj tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania dla poszczególnych agentów: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznacza „klucze profilu” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu starszego typu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` poszczególnych agentów, starszy katalog `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego testowego katalogu domowego; przygotowane katalogi domowe live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby próby nie dotykały rzeczywistego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach ze zmiennych środowiskowych (np. wyeksportowanych w `~/.profile`), uruchom lokalne testy po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą zamontować `~/.profile` w kontenerze).

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
  - Sprawdza dołączone ścieżki comfy dla obrazów, wideo i `music_generate`
  - Pomija każdą możliwość, chyba że skonfigurowano `plugins.entries.comfy.config.<capability>`
  - Przydatne po zmianach w przesyłaniu workflow comfy, odpytywaniu, pobieraniu lub rejestracji Plugin

## Generowanie obrazów live

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy generowania obrazów
  - Ładuje brakujące zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/ze zmiennych środowiskowych przed zapisanymi profilami uwierzytelniania, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne tylko przez zmienne środowiskowe

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

Obejmuje to parsowanie argumentów CLI, rozwiązywanie konfiguracji/domyślnego agenta, aktywację dołączonego Plugin, współdzielony runtime generowania obrazów oraz żądanie live do dostawcy. Oczekuje się, że zależności Plugin będą obecne przed załadowaniem runtime.

## Generowanie muzyki live

- Test: `extensions/music-generation-providers.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Sprawdza współdzieloną ścieżkę dołączonego dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/ze zmiennych środowiskowych przed zapisanymi profilami uwierzytelniania, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba deklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem zawierającym tylko prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Obecne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony sweep
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne tylko przez zmienne środowiskowe

## Generowanie wideo live

- Test: `extensions/video-generation-providers.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Sprawdza współdzieloną ścieżkę dołączonego dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki smoke: dostawcy inni niż FAL, jedno żądanie tekst-na-wideo na dostawcę, jednosekundowy prompt z homarem oraz limit operacji na dostawcę z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `--video-providers fal` albo `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne środowiskowe dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/ze zmiennych środowiskowych przed zapisanymi profilami uwierzytelniania, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać także deklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje w współdzielonym sweep lokalne wejście obrazu oparte na buforze
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje w współdzielonym sweep lokalne wejście wideo oparte na buforze
  - Obecni dostawcy `imageToVideo` deklarowani, ale pomijani we współdzielonym sweep:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia tekst-na-wideo `veo3` oraz ścieżkę `kling`, która domyślnie używa fixture ze zdalnym URL obrazu
  - Obecne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Obecni dostawcy `videoToVideo` deklarowani, ale pomijani we współdzielonym sweep:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych URL referencyjnych `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym sweep
    - `openai`, ponieważ obecnej współdzielonej ścieżce brakuje gwarancji dostępu specyficznego dla organizacji do wypełniania/remiksu wideo
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym sweep, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji każdego dostawcy na potrzeby agresywnego uruchomienia smoke
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne tylko przez zmienne środowiskowe

## Media live harness

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live dla obrazów, muzyki i wideo przez jeden natywny dla repo punkt wejścia
  - Automatycznie ładuje brakujące zmienne środowiskowe dostawcy z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy obecnie mają użyteczne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) - zestawy jednostkowe, integracyjne, QA i Docker
