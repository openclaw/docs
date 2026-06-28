---
read_when:
    - Uruchamianie smoke testów macierzy modeli live / backendu CLI / ACP / media-provider
    - Debugowanie rozpoznawania poświadczeń testów live
    - Dodawanie nowego testu live specyficznego dla providera
sidebarTitle: Live tests
summary: 'Testy live (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, poświadczenia'
title: 'Testowanie: zestawy testów na żywo'
x-i18n:
    generated_at: "2026-06-28T20:43:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

Szybki start, uruchamiacze QA, zestawy testów jednostkowych/integracyjnych oraz przepływy Docker opisuje
[Testowanie](/pl/help/testing). Ta strona omawia **live** (korzystające z sieci) zestawy
testów: macierz modeli, backendy CLI, ACP i testy live dostawców mediów oraz
obsługę poświadczeń.

## Live: lokalne polecenia smoke

Przed doraźnymi testami live wyeksportuj wymagany klucz dostawcy w środowisku
procesu.

Bezpieczny smoke mediów:

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
Plivo udane sprawdzenie gotowości wymaga publicznego adresu URL webhooka; lokalne
mechanizmy awaryjne loopback/prywatne są odrzucane zgodnie z projektem.

## Live: przegląd możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde aktualnie ogłaszane polecenie** przez połączony węzeł Android i potwierdzić zachowanie kontraktu poleceń.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw testów nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja `node.invoke` w Gateway polecenie po poleceniu dla wybranego węzła Android.
- Wymagana konfiguracja wstępna:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie zostały przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profili)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle odpowiada przy użyciu danego klucza.
- „Smoke Gateway” mówi nam, czy pełny potok Gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxa itd.).

### Warstwa 1: bezpośrednie uzupełnianie modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie to potrzebne)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern`, `small` albo `all` (alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, żeby `pnpm test:live` pozostało skupione na smoke Gateway
- Jak wybrać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small`, aby uruchomić ograniczoną listę dozwolonych małych modeli (trasy Qwen 8B/9B kompatybilne lokalnie, Ollama Gemma, OpenRouter Qwen/GLM oraz Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem nowoczesnej listy dozwolonych
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista dozwolonych rozdzielona przecinkami)
  - Lokalne uruchomienia małych modeli Ollama domyślnie używają `http://127.0.0.1:11434`; ustaw `OPENCLAW_LIVE_OLLAMA_BASE_URL` tylko dla punktów końcowych LAN, niestandardowych lub Ollama Cloud.
  - Przeglądy modern/all i small domyślnie używają swoich dobranych limitów; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego przeglądu wybranych profili albo liczbę dodatnią dla mniejszego limitu.
  - Wyczerpujące przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu całego testu modelu bezpośredniego. Domyślnie: 60 minut.
  - Sondy modelu bezpośredniego domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby to nadpisać.
- Jak wybrać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych rozdzielona przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i awaryjne wartości env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest uszkodzone / klucz jest nieprawidłowy” od „potok agenta Gateway jest uszkodzony”
  - Zawiera małe, izolowane regresje (przykład: odtwarzanie reasoning OpenAI Responses/Codex Responses + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + smoke agenta dev (co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/poprawić sesję `agent:dev:*` (nadpisanie modelu na przebieg)
  - Przejść przez modele z kluczami i potwierdzić:
    - „sensowną” odpowiedź (bez narzędzi)
    - działa rzeczywiste wywołanie narzędzia (sonda odczytu)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → kontynuacja) nadal działają
- Szczegóły sond (aby szybko wyjaśniać awarie):
  - Sonda `read`: test zapisuje plik z nonce w obszarze roboczym i prosi agenta, aby go `read` oraz zwrócił nonce.
  - Sonda `exec+read`: test prosi agenta, aby przez `exec` zapisał nonce do pliku tymczasowego, a potem odczytał go przez `read`.
  - Sonda obrazu: test dołącza wygenerowany PNG (cat + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `test/helpers/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybrać modele:
  - Domyślnie: nowoczesna lista dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`, aby uruchomić tę samą ograniczoną listę dozwolonych małych modeli przez pełny potok Gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem nowoczesnej listy dozwolonych
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzieloną przecinkami), aby zawęzić
  - Przeglądy Gateway modern/all i small domyślnie używają swoich dobranych limitów; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego wybranego przeglądu albo liczbę dodatnią dla mniejszego limitu.
- Jak wybrać dostawców (unikaj „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych rozdzielona przecinkami)
- Sondy narzędzi i obrazów są w tym teście live zawsze włączone:
  - Sonda `read` + sonda `exec+read` (obciążenie narzędzi)
  - Sonda obrazu uruchamia się, gdy model ogłasza obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`test/helpers/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy dozwolone)

<Tip>
Aby zobaczyć, co możesz testować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backendu CLI (Claude, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zwalidować potok Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne wartości smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącego rozszerzenia.
- Włącz:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych Plugin backendu CLI należącego właściciela.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu). Receptury Docker domyślnie to wyłączają, chyba że wyraźnie zażądano inaczej.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zwalidować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć sondę ciągłości tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Receptury Docker domyślnie to wyłączają dla niezawodności zbiorczej.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć sondę MCP/narzędziowego loopback. Receptury Docker domyślnie to wyłączają, chyba że wyraźnie zażądano inaczej.

Przykład:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Tani smoke konfiguracji MCP Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

To nie prosi Gemini o wygenerowanie odpowiedzi. Zapisuje te same ustawienia
systemowe, które OpenClaw przekazuje Gemini, a potem uruchamia `gemini --debug mcp list`, aby dowieść, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do kształtu HTTP MCP
Gemini i może połączyć się z lokalnym serwerem MCP streamable-HTTP.

Receptura Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receptury Docker dla pojedynczych dostawców:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Uruchamiacz Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke backendu CLI live w obrazie Docker repo jako użytkownik `node` bez uprawnień root.
- Rozwiązuje metadane smoke CLI z należącego rozszerzenia, a potem instaluje pasujący pakiet CLI dla Linux (`@anthropic-ai/claude-code` albo `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw dowodzi bezpośredniego `claude -p` w Docker, a potem uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza API Anthropic. Ta ścieżka subskrypcji domyślnie wyłącza sondy Claude MCP/narzędzi i obrazu, ponieważ zużywa limity użycia zalogowanej subskrypcji, a Anthropic może zmienić zachowanie rozliczeń i limitów szybkości Claude Agent SDK / `claude -p` bez wydania OpenClaw.
- Smoke backendu CLI live wykonuje teraz ten sam przepływ end-to-end dla Claude i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez CLI Gateway.
- Domyślny smoke Claude poprawia też sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: osiągalność proxy APNs HTTP/2

- Test: `src/infra/push-apns-http2.live.test.ts`
- Cel: tunelować przez lokalny proxy HTTP CONNECT do punktu końcowego sandbox APNs Apple, wysłać żądanie walidacji APNs HTTP/2 i potwierdzić, że rzeczywista odpowiedź Apple `403 InvalidProviderToken` wraca ścieżką proxy.
- Włącz:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Opcjonalny limit czasu:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke wiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ powiązania rozmowy ACP z żywym agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną rozmowę kanału wiadomości w miejscu
  - wysłać zwykłą wiadomość uzupełniającą w tej samej rozmowie
  - sprawdzić, że wiadomość uzupełniająca trafia do transkryptu powiązanej sesji ACP
- Włącz:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Wartości domyślne:
  - Agenci ACP w Dockerze: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Kanał syntetyczny: kontekst rozmowy w stylu DM Slack
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
  - Ta ścieżka używa powierzchni `chat.send` Gateway z polami syntetycznej trasy pochodzenia dostępnymi tylko dla administratora, aby testy mogły dołączyć kontekst kanału wiadomości bez udawania dostarczania na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów osadzonego Pluginu `acpx` dla wybranego agenta uprzęży ACP.
  - Tworzenie MCP Cron powiązanej sesji jest domyślnie best-effort, ponieważ zewnętrzne uprzęże ACP mogą anulować wywołania MCP po przejściu dowodu powiązania/obrazu; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby zaostrzyć tę sondę Cron po powiązaniu.

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
- Domyślnie uruchamia smoke powiązania ACP kolejno względem zagregowanych żywych agentów CLI: `claude`, `codex`, a potem `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Przygotowuje pasujący materiał uwierzytelniania CLI w kontenerze, a następnie instaluje żądany żywy CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli go brakuje. Sam backend ACP to osadzony pakiet `acpx/runtime` z oficjalnego Pluginu `acpx`.
- Wariant Docker Droid przygotowuje `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant Docker OpenCode jest rygorystyczną ścieżką regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`), a `pnpm test:docker:live-acp-bind:opencode` wymaga transkryptu powiązanego asystenta zamiast akceptować ogólne pominięcie po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ręczną/obejściową ścieżką porównywania zachowania poza Gateway. Smoke powiązania ACP w Dockerze ćwiczy osadzony backend runtime `acpx` OpenClaw.

## Live: smoke uprzęży serwera aplikacji Codex

- Cel: zweryfikować należącą do Pluginu uprząż Codex przez normalną metodę Gateway
  `agent`:
  - załadować dołączony Plugin `codex`
  - wybrać `openai/gpt-5.5`, co domyślnie kieruje tury agenta OpenAI przez Codex
  - wysłać pierwszą turę agenta Gateway do `openai/gpt-5.5` z wybraną uprzężą Codex
  - wysłać drugą turę do tej samej sesji OpenClaw i sprawdzić, że wątek serwera aplikacji
    może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę poleceń Gateway
  - opcjonalnie uruchomić dwie sondy powłoki z eskalacją przejrzane przez Guardian: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, oraz jeden przesył fałszywego sekretu, który powinien zostać
    odrzucony, aby agent zapytał z powrotem
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włącz: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna sonda Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke wymusza dostawcę/model `agentRuntime.id: "codex"`, więc zepsuta uprząż Codex
  nie może przejść przez cichy powrót do OpenClaw.
- Uwierzytelnianie: uwierzytelnianie serwera aplikacji Codex z lokalnego logowania subskrypcji Codex. Smoke w Dockerze
  może też przekazać `OPENAI_API_KEY` dla sond innych niż Codex, gdy ma to zastosowanie,
  plus opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

Przepis lokalny:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Przepis Docker:

```bash
pnpm test:docker:live-codex-harness
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Przekazuje `OPENAI_API_KEY`, kopiuje pliki uwierzytelniania CLI Codex, gdy są obecne, instaluje
  `@openai/codex` w zapisywalnym zamontowanym prefiksie
  npm, przygotowuje drzewo źródłowe, a następnie uruchamia tylko test live uprzęży Codex.
- Docker domyślnie włącza sondy obrazu, MCP/narzędzia i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego przebiegu
  debugowania.
- Docker używa tej samej jawnej konfiguracji runtime Codex, więc starsze aliasy ani powrót do OpenClaw
  nie mogą ukryć regresji uprzęży Codex.

### Zalecane przepisy live

Wąskie, jawne listy dozwolonych elementów są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Bezpośredni profil małego modelu:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil małego modelu przez Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Pojedynczy model, smoke przez Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Bezpośredni smoke Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Fokus Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptacyjnego Thinking Google:
  - Domyślne dynamiczne Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostu Antigravity OAuth (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego CLI Gemini na Twojej maszynie (oddzielne uwierzytelnianie + osobliwości narzędzi).
- API Gemini kontra CLI Gemini:
  - API: OpenClaw wywołuje hostowane API Gemini Google przez HTTP (klucz API / uwierzytelnianie profilu); to większość użytkowników rozumie przez „Gemini”.
  - CLI: OpenClaw wywołuje lokalny plik binarny `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (obsługa streamingu/narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opcjonalne), ale są to **zalecane** modele do regularnego obejmowania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To przebieg „wspólnych modeli”, którego działanie zamierzamy utrzymywać:

- OpenAI (bez Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (ogólne API) lub `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Uruchom smoke Gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Punkt odniesienia: wywoływanie narzędzi (Read + opcjonalny Exec)

Wybierz co najmniej jeden na rodzinę dostawcy:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (ogólne API) lub `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4.3` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model obsługujący „tools”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI z obsługą wizji itd.), aby przećwiczyć sondę obrazu.

### Agregatory / alternatywne Gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia+obrazy)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowane: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (chmura/API) oraz dowolny serwer pośredniczący zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie wpisuj na sztywno „wszystkich modeli” w dokumentacji. Autorytatywną listą jest to, co `discoverModels(...)` zwraca na Twojej maszynie, oraz dostępne klucze.
</Tip>

## Dane uwierzytelniające (nigdy ich nie zatwierdzaj)

Testy na żywo wykrywają dane uwierzytelniające tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy na żywo powinny znaleźć te same klucze.
- Jeśli test na żywo zgłasza „brak danych uwierzytelniających”, debuguj tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania dla agenta: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „klucze profilu” w testach na żywo)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego testu na żywo, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia na żywo domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` dla agentów, starsze `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego katalogu domowego testu; przygotowane katalogi domowe na żywo pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby próby nie trafiały do rzeczywistego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach środowiskowych, wyeksportuj je przed lokalnymi testami albo użyj
poniższych runnerów Docker z jawnym `OPENCLAW_PROFILE_FILE`.

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
  - Uruchamia dołączone ścieżki obrazu, wideo i `music_generate` comfy
  - Pomija każdą funkcję, chyba że skonfigurowano `plugins.entries.comfy.config.<capability>`
  - Przydatne po zmianie wysyłania przepływu pracy comfy, odpytywania, pobierania lub rejestracji Plugin

## Generowanie obrazów na żywo

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Mechanizm testowy: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy generowania obrazów
  - Używa już wyeksportowanych zmiennych środowiskowych dostawcy przed próbowaniem
  - Domyślnie używa kluczy API z trybu na żywo/środowiska przed zapisanymi profilami uwierzytelniania, więc przestarzałe klucze testowe w `auth-profiles.json` nie przesłaniają rzeczywistych danych uwierzytelniających powłoki
  - Pomija dostawców bez używalnego uwierzytelniania/profilu/modelu
  - Uruchamia każdego skonfigurowanego dostawcę przez współdzielone środowisko wykonawcze generowania obrazów:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie środowiskowe

Dla dostarczanej ścieżki CLI dodaj szybki test kontrolny `infer` po zaliczeniu testu na żywo dostawcy/środowiska wykonawczego:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to parsowanie argumentów CLI, rozpoznawanie konfiguracji/domyślnego agenta, aktywację dołączonego
Plugin, współdzielone środowisko wykonawcze generowania obrazów oraz żądanie do dostawcy na żywo.
Oczekuje się, że zależności Plugin będą obecne przed załadowaniem środowiska wykonawczego.

## Generowanie muzyki na żywo

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Mechanizm testowy: `pnpm test:live:media music`
- Zakres:
  - Uruchamia współdzieloną ścieżkę dołączonego dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Używa już wyeksportowanych zmiennych środowiskowych dostawcy przed próbowaniem
  - Domyślnie używa kluczy API z trybu na żywo/środowiska przed zapisanymi profilami uwierzytelniania, więc przestarzałe klucze testowe w `auth-profiles.json` nie przesłaniają rzeczywistych danych uwierzytelniających powłoki
  - Pomija dostawców bez używalnego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby środowiska wykonawczego, gdy są dostępne:
    - `generate` z wejściem zawierającym tylko prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Obecny zakres współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: oddzielny plik Comfy na żywo, nie ten współdzielony przegląd
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie środowiskowe

## Generowanie wideo na żywo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Mechanizm testowy: `pnpm test:live:media video`
- Zakres:
  - Uruchamia współdzieloną ścieżkę dołączonego dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki szybkiego testu kontrolnego: dostawcy inni niż FAL, jedno żądanie tekst-do-wideo na dostawcę, jednosekundowy prompt z homarem oraz limit operacji na dostawcę z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `--video-providers fal` albo `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Używa już wyeksportowanych zmiennych środowiskowych dostawcy przed próbowaniem
  - Domyślnie używa kluczy API z trybu na żywo/środowiska przed zapisanymi profilami uwierzytelniania, więc przestarzałe klucze testowe w `auth-profiles.json` nie przesłaniają rzeczywistych danych uwierzytelniających powłoki
  - Pomija dostawców bez używalnego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przeglądzie
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przeglądzie
  - Obecni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przeglądzie:
    - `vydra`, ponieważ dołączone `veo3` obsługuje tylko tekst, a dołączone `kling` wymaga zdalnego adresu URL obrazu
  - Zakres specyficzny dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik domyślnie uruchamia `veo3` tekst-do-wideo oraz ścieżkę `kling`, która używa zdalnego adresu URL obrazu jako fixtury
  - Obecny zakres `videoToVideo` na żywo:
    - tylko `runway`, gdy wybranym modelem jest `runway/gen4_aleph`
  - Obecni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przeglądzie:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych adresów URL referencji `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przeglądzie
    - `openai`, ponieważ obecnej współdzielonej ścieżce brakuje gwarancji dostępu do edycji wideo specyficznych dla organizacji
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przeglądzie, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit każdej operacji dostawcy dla agresywnego szybkiego testu kontrolnego
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie środowiskowe

## Mechanizm testowy multimediów na żywo

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy testów obrazu, muzyki i wideo na żywo przez jeden natywny dla repozytorium punkt wejścia
  - Używa już wyeksportowanych zmiennych środowiskowych dostawcy
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy obecnie mają używalne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) - zestawy testów jednostkowych, integracyjnych, QA i Docker
