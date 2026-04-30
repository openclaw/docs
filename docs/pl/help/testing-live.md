---
read_when:
    - Uruchamianie testów dymnych macierzy modeli na żywo / backendu CLI / ACP / media-provider
    - Debugowanie rozpoznawania poświadczeń testów na żywo
    - Dodawanie nowego testu na żywo specyficznego dla dostawcy
sidebarTitle: Live tests
summary: 'Testy live (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, poświadczenia'
title: 'Testowanie: pakiety testów na żywo'
x-i18n:
    generated_at: "2026-04-30T09:59:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Szybki start, runnery QA, zestawy testów jednostkowych/integracyjnych i przepływy Docker opisano w
[Testowanie](/pl/help/testing). Ta strona obejmuje **żywe** (korzystające z sieci) zestawy testów:
macierz modeli, backendy CLI, ACP oraz żywe testy dostawców multimediów, a także
obsługę poświadczeń.

## Żywe: lokalne polecenia smoke profilu

Przed doraźnymi żywymi sprawdzeniami załaduj `~/.profile`, aby klucze dostawców i lokalne ścieżki narzędzi
były zgodne z Twoją powłoką:

```bash
source ~/.profile
```

Bezpieczny media smoke:

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

`voicecall smoke` jest przebiegiem próbnym, chyba że podano także `--yes`. Używaj `--yes` tylko wtedy,
gdy celowo chcesz wykonać prawdziwe połączenie powiadamiające. W przypadku Twilio, Telnyx i
Plivo udane sprawdzenie gotowości wymaga publicznego adresu URL Webhook; lokalne
fallbacki loopback/prywatne są odrzucane zgodnie z założeniem.

## Żywe: przegląd możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie aktualnie reklamowane** przez połączony węzeł Android i potwierdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego węzła Android.
- Wymagana wcześniejsza konfiguracja:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie zostały udzielone dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Żywe: model smoke (klucze profilu)

Żywe testy są podzielone na dwie warstwy, aby można było izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle może odpowiedzieć z podanym kluczem.
- „Gateway smoke” mówi nam, czy dla danego modelu działa pełny potok gateway+agent (sesje, historia, narzędzia, polityka sandbox itp.).

### Warstwa 1: bezpośrednie uzupełnianie modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, aby `pnpm test:live` koncentrował się na gateway smoke
- Jak wybrać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlistę (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlista rozdzielana przecinkami)
  - Przeglądy modern/all domyślnie używają kuratorskiego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_MAX_MODELS=0`, aby wykonać wyczerpujący nowoczesny przegląd, albo dodatnią liczbę, aby użyć mniejszego limitu.
  - Wyczerpujące przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu całego testu modelu bezpośredniego. Domyślnie: 60 minut.
  - Sondy modeli bezpośrednich domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby ją nadpisać.
- Jak wybrać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlista rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profilu i fallbacki środowiskowe
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profilu**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest uszkodzone / klucz jest nieprawidłowy” od „potok agenta Gateway jest uszkodzony”
  - Zawiera małe, izolowane regresje (przykład: OpenAI Responses/Codex Responses reasoning replay + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + dev agent smoke (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu na przebieg)
  - Przejść po modelach z kluczami i potwierdzić:
    - „znacząca” odpowiedź (bez narzędzi)
    - działa prawdziwe wywołanie narzędzia (sonda odczytu)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → kontynuacja) nadal działają
- Szczegóły sond (aby można było szybko wyjaśniać awarie):
  - sonda `read`: test zapisuje plik z nonce w obszarze roboczym i prosi agenta o jego `read` oraz zwrócenie tego nonce.
  - sonda `exec+read`: test prosi agenta o zapisanie nonce przez `exec` do pliku tymczasowego, a następnie odczytanie go przez `read`.
  - sonda obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` i `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybrać modele:
  - Domyślnie: nowoczesna allowlista (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przeglądy Gateway modern/all domyślnie używają kuratorskiego limitu o wysokiej wartości sygnału; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, aby wykonać wyczerpujący nowoczesny przegląd, albo dodatnią liczbę, aby użyć mniejszego limitu.
- Jak wybrać dostawców (unikaj „OpenRouter wszystkiego”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlista rozdzielana przecinkami)
- Sondy narzędzi i obrazu są zawsze włączone w tym żywym teście:
  - sonda `read` + sonda `exec+read` (obciążenie narzędzi)
  - sonda obrazu działa, gdy model deklaruje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne pomyłki dozwolone)

<Tip>
Aby zobaczyć, co możesz testować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Żywe: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować potok Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne wartości smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącego Plugin.
- Włącz:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych backendu CLI należącego Plugin.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać prawdziwy załącznik obrazowy (ścieżki są wstrzykiwane do promptu). Receptury Docker domyślnie to wyłączają, chyba że wyraźnie zażądano inaczej.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznawiania.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć sondę ciągłości w tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Receptury Docker domyślnie to wyłączają dla zbiorczej niezawodności.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć sondę local loopback MCP/narzędzia. Receptury Docker domyślnie to wyłączają, chyba że wyraźnie zażądano inaczej.

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
które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby dowieść, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do kształtu HTTP MCP Gemini
i może połączyć się z lokalnym serwerem MCP streamable-HTTP.

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
- Uruchamia żywy smoke backendu CLI wewnątrz obrazu Docker repozytorium jako użytkownik `node` bez uprawnień root.
- Rozwiązuje metadane smoke CLI z należącego rozszerzenia, a następnie instaluje pasujący pakiet CLI dla Linuksa (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw dowodzi bezpośredniego `claude -p` w Docker, a potem uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych środowiskowych klucza API Anthropic. Ta ścieżka subskrypcji domyślnie wyłącza sondy Claude MCP/narzędzia i obrazu, ponieważ Claude obecnie kieruje użycie aplikacji zewnętrznych przez rozliczanie dodatkowego użycia zamiast przez normalne limity planu subskrypcji.
- Żywy smoke backendu CLI wykonuje teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez CLI Gateway.
- Domyślny smoke Claude łata także sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Żywe: ACP bind smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ wiązania konwersacji ACP z żywym agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną konwersację kanału wiadomości w miejscu
  - wysłać zwykłą wiadomość uzupełniającą w tej samej konwersacji
  - sprawdzić, czy wiadomość uzupełniająca trafia do transkrypcji powiązanej sesji ACP
- Włączenie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne ustawienia:
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
  - Ta ścieżka używa powierzchni Gateway `chat.send` z syntetycznymi polami originating-route dostępnymi tylko dla administratora, aby testy mogły dołączać kontekst kanału wiadomości bez udawania zewnętrznego dostarczania.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów osadzonego Pluginu `acpx` dla wybranego agenta uprzęży ACP.
  - Tworzenie MCP dla Cron powiązanej sesji jest domyślnie best-effort, ponieważ zewnętrzne uprzęże ACP mogą anulować wywołania MCP po przejściu dowodu wiązania/obrazu; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby ten próbnik Cron po wiązaniu był rygorystyczny.

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
- Domyślnie uruchamia smoke wiązania ACP kolejno względem zagregowanych żywych agentów CLI: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Źródłuje `~/.profile`, przygotowuje pasujący materiał uwierzytelniania CLI w kontenerze, a następnie instaluje żądany żywy CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli go brakuje. Sam backend ACP to dołączony osadzony pakiet `acpx/runtime` z Pluginu `acpx`.
- Wariant Docker dla Droid przygotowuje `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant Docker dla OpenCode jest rygorystyczną ścieżką regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`) po źródłowaniu `~/.profile`, a `pnpm test:docker:live-acp-bind:opencode` wymaga transkrypcji powiązanego asystenta zamiast akceptować ogólne pominięcie po wiązaniu.
- Bezpośrednie wywołania CLI `acpx` są wyłącznie ręczną/obejściową ścieżką do porównywania zachowania poza Gateway. Smoke wiązania ACP w Dockerze ćwiczy osadzony backend runtime `acpx` OpenClaw.

## Live: smoke uprzęży serwera aplikacji Codex

- Cel: zweryfikować uprząż Codex należącą do Pluginu przez normalną metodę Gateway
  `agent`:
  - załadować dołączony Plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę agenta Gateway do `openai/gpt-5.5` z wymuszoną uprzężą Codex
  - wysłać drugą turę do tej samej sesji OpenClaw i sprawdzić, czy wątek serwera aplikacji
    może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę poleceń Gateway
  - opcjonalnie uruchomić dwa sprawdzone przez Guardian eskalowane próbniki powłoki: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, i jedno fałszywe przesłanie sekretu, które powinno zostać
    odrzucone, tak aby agent zapytał z powrotem
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalny próbnik obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalny próbnik MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalny próbnik Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzona uprząż Codex
  nie mogła przejść przez ciche przełączenie awaryjne na PI.
- Uwierzytelnianie: uwierzytelnianie serwera aplikacji Codex z lokalnego logowania subskrypcji Codex. Smoke w Dockerze
  mogą też udostępnić `OPENAI_API_KEY` dla próbników spoza Codex, gdy ma to zastosowanie,
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
- Źródłuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  uwierzytelniania CLI Codex, gdy są obecne, instaluje `@openai/codex` w zapisywalnym zamontowanym prefiksie npm,
  przygotowuje drzewo źródłowe, a następnie uruchamia tylko żywy test uprzęży Codex.
- Docker domyślnie włącza próbniki obrazu, MCP/narzędzia i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego przebiegu
  debugowania.
- Docker eksportuje również `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją żywego
  testu, aby starsze aliasy lub przełączenie awaryjne PI nie mogły ukryć regresji
  uprzęży Codex.

### Zalecane receptury live

Wąskie, jawne listy dozwolonych są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptacyjnego myślenia Google:
  - Jeśli lokalne klucze znajdują się w profilu powłoki: `source ~/.profile`
  - Dynamiczne ustawienie domyślne Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostka OAuth Antigravity (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego CLI Gemini na Twojej maszynie (oddzielne uwierzytelnianie i niuanse narzędzi).
- Gemini API a Gemini CLI:
  - API: OpenClaw wywołuje hostowane przez Google API Gemini przez HTTP (klucz API / uwierzytelnianie profilu); to większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw uruchamia lokalny plik binarny `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego obejmowania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest przebieg „popularnych modeli”, który powinien nadal działać:

- OpenAI (nie-Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke Gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Punkt odniesienia: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden z każdej rodziny dostawców:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (dobrze mieć):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model obsługujący „narzędzia”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące vision itd.), aby przećwiczyć próbnik obrazu.

### Agregatory / alternatywne Gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia i obraz)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz dane uwierzytelniające/konfigurację):

- Wbudowane: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (chmura/API), plus dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie koduj na sztywno „wszystkich modeli” w dokumentacji. Autorytatywna lista to to, co `discoverModels(...)` zwraca na Twojej maszynie, plus dostępne klucze.
</Tip>

## Dane uwierzytelniające (nigdy nie commituj)

Testy live wykrywają dane uwierzytelniające tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „no creds”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile auth dla poszczególnych agentów: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznacza „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu legacy: `~/.openclaw/credentials/` (kopiowany do tymczasowego katalogu home testu live, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` poszczególnych agentów, legacy `credentials/` oraz obsługiwane katalogi auth zewnętrznych CLI do tymczasowego katalogu home testu; przygotowane katalogi home live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie trafiały do rzeczywistego workspace na hoście.

Jeśli chcesz polegać na kluczach env (np. wyeksportowanych w `~/.profile`), uruchom testy lokalne po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą zamontować `~/.profile` w kontenerze).

## Deepgram live (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włącz: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan kodowania BytePlus live

- Test: `extensions/byteplus/live.test.ts`
- Włącz: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media przepływu pracy ComfyUI live

- Test: `extensions/comfy/comfy.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Sprawdza dołączone ścieżki comfy dla obrazu, wideo i `music_generate`
  - Pomija każdą możliwość, jeśli `plugins.entries.comfy.config.<capability>` nie jest skonfigurowane
  - Przydatne po zmianach w przesyłaniu przepływów pracy comfy, odpytywaniu, pobieraniu lub rejestracji Plugin

## Generowanie obrazów live

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany provider Plugin do generowania obrazów
  - Ładuje brakujące zmienne env providerów z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija providerów bez użytecznego auth/profilu/modelu
  - Uruchamia każdego skonfigurowanego providera przez współdzielony runtime generowania obrazów:
    - `<provider>:generate`
    - `<provider>:edit`, gdy provider deklaruje obsługę edycji
- Aktualnie objęci dołączeni providerzy:
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
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania dostępne tylko przez env

Dla dostarczanej ścieżki CLI dodaj smoke `infer` po pomyślnym przejściu testu live providera/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to parsowanie argumentów CLI, rozwiązywanie konfiguracji/domyślnego agenta, aktywację dołączonego Plugin, naprawę zależności runtime dołączonego Plugin na żądanie, współdzielony runtime generowania obrazów oraz żądanie live do providera.

## Generowanie muzyki live

- Test: `extensions/music-generation-providers.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Sprawdza współdzieloną ścieżkę dołączonych providerów generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne env providerów z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija providerów bez użytecznego auth/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem zawierającym tylko prompt
    - `edit`, gdy provider deklaruje `capabilities.edit.enabled`
  - Aktualne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przebieg
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania dostępne tylko przez env

## Generowanie wideo live

- Test: `extensions/video-generation-providers.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Sprawdza współdzieloną ścieżkę dołączonych providerów generowania wideo
  - Domyślnie używa ścieżki smoke bezpiecznej dla wydania: providerzy inni niż FAL, jedno żądanie text-to-video na providera, jednosekundowy prompt z homarem oraz limit operacji na providera z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie providera może zdominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne env providerów z powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija providerów bez użytecznego auth/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy provider deklaruje `capabilities.imageToVideo.enabled`, a wybrany provider/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przebiegu
    - `videoToVideo`, gdy provider deklaruje `capabilities.videoToVideo.enabled`, a wybrany provider/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu
  - Aktualnie zadeklarowani, ale pomijani providerzy `imageToVideo` we współdzielonym przebiegu:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla providera Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa fikstury ze zdalnym URL obrazu
  - Aktualne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybranym modelem jest `runway/gen4_aleph`
  - Aktualnie zadeklarowani, ale pomijani providerzy `videoToVideo` we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ obecnej współdzielonej ścieżce brakuje gwarancji dostępu do specyficznego dla organizacji inpaint/remix wideo
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego providera w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit każdej operacji providera dla agresywnego uruchomienia smoke
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania dostępne tylko przez env

## Harness media live

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live dla obrazu, muzyki i wideo przez jeden natywny entrypoint repozytorium
  - Automatycznie ładuje brakujące zmienne env providerów z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do providerów, którzy obecnie mają użyteczny auth
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu quiet pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) — zestawy testów jednostkowych, integracyjnych, QA i Docker
