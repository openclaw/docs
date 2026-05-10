---
read_when:
    - Uruchamianie testów smoke macierzy modeli na żywo / backendu CLI / ACP / media-provider
    - Debugowanie rozpoznawania poświadczeń testów na żywo
    - Dodawanie nowego testu live specyficznego dla dostawcy
sidebarTitle: Live tests
summary: 'Testy na żywo (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, dane uwierzytelniające'
title: 'Testowanie: zestawy testów na żywo'
x-i18n:
    generated_at: "2026-05-10T19:40:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

For szybki start, uruchamiacze QA, zestawy testów jednostkowych/integracyjnych i przepływy Docker zobacz
[Testowanie](/pl/help/testing). Ta strona obejmuje **live** (dotykające sieci) zestawy testów:
macierz modeli, backendy CLI, ACP i testy live dostawców multimediów oraz
obsługę poświadczeń.

## Live: polecenia smoke lokalnego profilu

Wczytaj `~/.profile` przed doraźnymi kontrolami live, aby klucze dostawców i ścieżki
lokalnych narzędzi były zgodne z Twoją powłoką:

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

`voicecall smoke` jest próbą suchą, chyba że obecne jest też `--yes`. Używaj `--yes` tylko
wtedy, gdy celowo chcesz wykonać prawdziwe połączenie powiadamiające. W przypadku Twilio, Telnyx i
Plivo pomyślna kontrola gotowości wymaga publicznego adresu URL Webhook; lokalne
fallbacki loopback/prywatne są odrzucane zgodnie z projektem.

## Live: sweep możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde aktualnie reklamowane polecenie** przez połączony węzeł Android i potwierdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw nie instaluje/uruchamia/paruje aplikacji).
  - Walidacja `node.invoke` w Gateway, polecenie po poleceniu, dla wybranego węzła Android.
- Wymagana wcześniejsza konfiguracja:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie zostały przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` albo `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profilu)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle odpowiada z danym kluczem.
- „Smoke Gateway” mówi nam, czy pełny potok gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka piaskownicy itd.).

### Warstwa 1: bezpośrednie uzupełnianie modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz ukierunkowane regresje, gdzie to potrzebne)
- Jak włączyć:
  - `pnpm test:live` (albo `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (albo `all`, alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, aby `pnpm test:live` pozostawał skoncentrowany na smoke Gateway
- Jak wybrać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwoloną (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonej
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista dozwolona rozdzielona przecinkami)
  - Sweepy modern/all domyślnie używają starannie dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego sweepu modern albo dodatnią liczbę dla mniejszego limitu.
  - Wyczerpujące sweepy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu całego testu modeli bezpośrednich. Domyślnie: 60 minut.
  - Próby modeli bezpośrednich domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby nadpisać.
- Jak wybrać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolona rozdzielona przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profilu i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profilu**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest uszkodzone / klucz jest nieprawidłowy” od „potok agenta Gateway jest uszkodzony”
  - Zawiera małe, izolowane regresje (przykład: OpenAI Responses/Codex Responses reasoning replay + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + smoke agenta dev (co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu dla każdego przebiegu)
  - Iterować po modelach z kluczami i potwierdzić:
    - „znaczącą” odpowiedź (bez narzędzi)
    - działa prawdziwe wywołanie narzędzia (próba odczytu)
    - opcjonalne dodatkowe próby narzędzi (próba exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → kontynuacja) nadal działają
- Szczegóły prób (aby można było szybko wyjaśniać awarie):
  - Próba `read`: test zapisuje plik z wartością nonce w obszarze roboczym i prosi agenta, aby go `read` i odesłał nonce.
  - Próba `exec+read`: test prosi agenta, aby przez `exec` zapisał nonce do pliku tymczasowego, a następnie odczytał go z powrotem przez `read`.
  - Próba obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` i `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (albo `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybrać modele:
  - Domyślnie: nowoczesna lista dozwolona (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonej
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (albo listę rozdzieloną przecinkami), aby zawęzić
  - Sweepy Gateway modern/all domyślnie używają starannie dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego sweepu modern albo dodatnią liczbę dla mniejszego limitu.
- Jak wybrać dostawców (unikaj „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolona rozdzielona przecinkami)
- Próby narzędzi i obrazów są zawsze włączone w tym teście live:
  - próba `read` + próba `exec+read` (obciążenie narzędzi)
  - próba obrazu uruchamia się, gdy model deklaruje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowy kod (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: dozwolone drobne pomyłki)

<Tip>
Aby zobaczyć, co możesz testować na swojej maszynie (oraz dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backendu CLI (Claude, Codex, Gemini albo inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować potok Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącego Plugin.
- Włączenie:
  - `pnpm test:live` (albo `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych należącego Plugin backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać prawdziwy załącznik obrazu (ścieżki są wstrzykiwane do promptu). Przepisy Docker domyślnie wyłączają to, chyba że jawnie tego zażądano.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (albo `"list"`), aby kontrolować, jak przekazywane są argumenty obrazów, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznawiania.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć próbę ciągłości tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Przepisy Docker domyślnie wyłączają to dla niezawodności zbiorczej.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć próbę loopback MCP/narzędzi. Przepisy Docker domyślnie wyłączają to, chyba że jawnie tego zażądano.

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
i może połączyć się z lokalnym serwerem MCP streamable-HTTP.

Przepis Docker:

```bash
pnpm test:docker:live-cli-backend
```

Przepisy Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notatki:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repozytorium jako użytkownik `node` bez uprawnień root.
- Rozwiązuje metadane smoke CLI z należącego Plugin, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` albo `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw udowadnia bezpośrednie `claude -p` w Docker, a potem uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env kluczy API Anthropic. Ten tor subskrypcji domyślnie wyłącza próby Claude MCP/narzędzi i obrazów, ponieważ Claude obecnie kieruje użycie aplikacji zewnętrznych przez rozliczenia dodatkowego użycia zamiast normalnych limitów planu subskrypcyjnego.
- Smoke live backendu CLI teraz wykonuje ten sam przepływ end-to-end dla Claude, Codex i Gemini: turę tekstową, turę klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez CLI Gateway.
- Domyślny smoke Claude łata też sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: osiągalność proxy APNs HTTP/2

- Test: `src/infra/push-apns-http2.live.test.ts`
- Cel: tunelować przez lokalny proxy HTTP CONNECT do sandboxowego endpointu APNs Apple, wysłać żądanie walidacyjne APNs HTTP/2 i potwierdzić, że prawdziwa odpowiedź Apple `403 InvalidProviderToken` wraca przez ścieżkę proxy.
- Włączenie:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Opcjonalny limit czasu:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke bindowania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ wiązania konwersacji ACP z żywym agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną konwersację kanału wiadomości w miejscu
  - wysłać zwykłą wiadomość uzupełniającą w tej samej konwersacji
  - zweryfikować, że wiadomość uzupełniająca trafia do transkrypcji powiązanej sesji ACP
- Włącz:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne:
  - Agenci ACP w Docker: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Kanał syntetyczny: kontekst konwersacji w stylu Slack DM
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
  - Ta ścieżka używa powierzchni `chat.send` Gateway z syntetycznymi polami trasy pochodzenia tylko dla administratorów, aby testy mogły dołączać kontekst kanału wiadomości bez udawania dostarczenia na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów osadzonego Plugin `acpx` dla wybranego agenta harnessa ACP.
  - Tworzenie MCP Cron powiązanej sesji jest domyślnie best-effort, ponieważ zewnętrzne harnessy ACP mogą anulować wywołania MCP po przejściu dowodu bind/image; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby zaostrzyć tę sondę Cron po powiązaniu.

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
- Domyślnie uruchamia smoke ACP bind kolejno względem zbiorczych żywych agentów CLI: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Wczytuje `~/.profile`, umieszcza pasujący materiał uwierzytelniający CLI w kontenerze, a następnie instaluje żądane żywe CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli go brakuje. Sam backend ACP to osadzony pakiet `acpx/runtime` z oficjalnego Plugin `acpx`.
- Wariant Droid Docker umieszcza `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant OpenCode Docker jest ścisłą ścieżką regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`) po wczytaniu `~/.profile`, a `pnpm test:docker:live-acp-bind:opencode` wymaga powiązanej transkrypcji asystenta zamiast akceptować ogólne pominięcie po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ręczną ścieżką/obejściem do porównywania zachowania poza Gateway. Smoke ACP bind w Docker sprawdza osadzony backend runtime `acpx` OpenClaw.

## Live: smoke harnessa app-server Codex

- Cel: zweryfikować należący do Plugin harness Codex przez normalną metodę Gateway
  `agent`:
  - załadować dołączony Plugin `codex`
  - wybrać `openai/gpt-5.5`, który domyślnie kieruje tury agenta OpenAI przez Codex
  - wysłać pierwszą turę agenta Gateway do `openai/gpt-5.5` z wybranym harnessem Codex
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek app-server
    może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę poleceń Gateway
  - opcjonalnie uruchomić dwie sondy powłoki z eskalacją sprawdzoną przez Guardian: jedno łagodne
    polecenie, które powinno zostać zatwierdzone, oraz jedno przesłanie fałszywego sekretu, które powinno zostać
    odrzucone, tak aby agent zapytał z powrotem
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włącz: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna sonda Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke wymusza provider/model `agentRuntime.id: "codex"`, aby uszkodzony harness Codex
  nie mógł przejść przez ciche cofnięcie do PI.
- Uwierzytelnianie: uwierzytelnianie app-server Codex z lokalnego logowania subskrypcji Codex. Smoke w Docker
  mogą też dostarczyć `OPENAI_API_KEY` dla sond innych niż Codex, gdy ma to zastosowanie,
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

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Wczytuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki uwierzytelniania CLI Codex,
  gdy są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  umieszcza drzewo źródeł, a następnie uruchamia tylko żywy test harnessa Codex.
- Docker domyślnie włącza sondy obrazu, MCP/narzędzia i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego uruchomienia
  debugowania.
- Docker używa tej samej jawnej konfiguracji runtime Codex, więc starsze aliasy ani cofnięcie do PI
  nie mogą ukryć regresji harnessa Codex.

### Zalecane przepisy live

Wąskie, jawne listy dozwolonych elementów są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku providerów:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptacyjnego myślenia Google:
  - Jeśli lokalne klucze znajdują się w profilu powłoki: `source ~/.profile`
  - Dynamiczna wartość domyślna Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa Gemini API (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twoim komputerze (osobne uwierzytelnianie + osobliwości narzędzi).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane przez Google Gemini API przez HTTP (klucz API / uwierzytelnianie profilu); to właśnie większość użytkowników rozumie przez „Gemini”.
  - CLI: OpenClaw uruchamia lokalny binarny `gemini` przez powłokę; ma własne uwierzytelnianie i może zachowywać się inaczej (obsługa strumieniowania/narzędzi/rozjazd wersji).

## Live: macierz modeli (co pokrywamy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale są to **zalecane** modele do regularnego pokrywania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest uruchomienie „wspólnych modeli”, którego działanie chcemy utrzymać:

- OpenAI (bez Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke Gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Bazowy poziom: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden z każdej rodziny providerów:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (mile widziane):

- xAI: `xai/grok-4.3` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model obsługujący „tools”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Wizja: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące wizję itd.), aby przetestować sondę obrazu.

### Agregatory / alternatywne bramy

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia+obraz)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej providerów, których możesz uwzględnić w macierzy live (jeśli masz dane uwierzytelniające/konfigurację):

- Wbudowane: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe endpointy): `minimax` (chmura/API), plus dowolny proxy kompatybilny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie hardkoduj „wszystkich modeli” w dokumentacji. Autorytatywna lista to to, co `discoverModels(...)` zwraca na Twoim komputerze, plus dostępne klucze.
</Tip>

## Dane uwierzytelniające (nigdy nie commituj)

Testy live wykrywają dane uwierzytelniające tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live zgłasza „no creds”, debuguj go tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznacza „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (albo `OPENCLAW_CONFIG_PATH`)
- Katalog stanu legacy: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, legacy `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego katalogu domowego testów; przygotowane katalogi domowe live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie dotykały rzeczywistego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach env (np. wyeksportowanych w `~/.profile`), uruchom lokalne testy po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą zamontować `~/.profile` w kontenerze).

## Testy live Deepgram (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączenie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Test live planu kodowania BytePlus

- Test: `extensions/byteplus/live.test.ts`
- Włączenie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Testy live mediów przepływu pracy ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Ćwiczy dołączone ścieżki comfy dla obrazów, wideo oraz `music_generate`
  - Pomija każdą capability, chyba że `plugins.entries.comfy.config.<capability>` jest skonfigurowane
  - Przydatne po zmianie przesyłania przepływu pracy comfy, odpytywania, pobrań albo rejestracji pluginu

## Testy live generowania obrazów

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany plugin dostawcy generowania obrazów
  - Ładuje brakujące zmienne env dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały prawdziwych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia każdego skonfigurowanego dostawcę przez współdzielone środowisko uruchomieniowe generowania obrazów:
    - `<provider>:generate`
    - `<provider>:edit`, gdy dostawca deklaruje obsługę edycji
- Aktualnie objęci dołączeni dostawcy:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie z env

Dla dostarczonej ścieżki CLI dodaj smoke test `infer` po zaliczeniu testu live dostawcy/środowiska uruchomieniowego:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to parsowanie argumentów CLI, rozwiązywanie konfiguracji/domyślnego agenta, aktywację dołączonego pluginu, współdzielone środowisko uruchomieniowe generowania obrazów oraz żądanie do dostawcy live. Oczekuje się, że zależności pluginu będą obecne przed załadowaniem środowiska uruchomieniowego.

## Testy live generowania muzyki

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Ćwiczy współdzieloną ścieżkę dołączonego dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne env dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały prawdziwych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby środowiska uruchomieniowego, gdy są dostępne:
    - `generate` z wejściem zawierającym tylko prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Aktualne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony sweep
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie z env

## Testy live generowania wideo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Ćwiczy współdzieloną ścieżkę dołączonego dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki smoke: dostawcy spoza FAL, jedno żądanie text-to-video na dostawcę, jednosekundowy prompt z homarem oraz limit operacji per dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `--video-providers fal` albo `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne env dostawcy z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały prawdziwych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym sweep
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym sweep
  - Aktualni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym sweep:
    - `vydra`, ponieważ dołączone `veo3` jest tylko tekstowe, a dołączone `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa fixture ze zdalnym URL obrazu
  - Aktualne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Aktualni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym sweep:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych URL-i referencyjnych `http(s)` / MP4
    - `google`, ponieważ aktualna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym sweep
    - `openai`, ponieważ aktualna współdzielona ścieżka nie ma gwarancji dostępu do specyficznego dla organizacji inpaint/remix wideo
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym sweep, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit każdej operacji dostawcy dla agresywnego smoke testu
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie z env

## Harness live mediów

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live dla obrazów, muzyki i wideo przez jeden natywny dla repo punkt wejścia
  - Automatycznie ładuje brakujące zmienne env dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy obecnie mają użyteczne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, dzięki czemu zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) - zestawy jednostkowe, integracyjne, QA i Docker
