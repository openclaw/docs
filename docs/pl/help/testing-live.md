---
read_when:
    - Uruchamianie testów dymnych macierzy modeli live / backendu CLI / ACP / media-provider
    - Debugowanie ustalania poświadczeń dla testów na żywo
    - Dodawanie nowego testu live specyficznego dla dostawcy
sidebarTitle: Live tests
summary: 'Testy live (dotykające sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, dane uwierzytelniające'
title: 'Testowanie: zestawy testów na żywo'
x-i18n:
    generated_at: "2026-06-27T17:40:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Na potrzeby szybkiego startu, runnerów QA, zestawów testów jednostkowych/integracyjnych i przepływów Docker zobacz
[Testowanie](/pl/help/testing). Ta strona obejmuje **live** (korzystające z sieci) zestawy testów:
macierz modeli, backendy CLI, ACP oraz testy live dostawców multimediów, a także
obsługę poświadczeń.

## Live: lokalne polecenia smoke

Przed doraźnymi testami live wyeksportuj wymagany klucz dostawcy w środowisku
procesu.

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

`voicecall smoke` jest próbą bez wykonywania działania, chyba że podano również `--yes`. Używaj `--yes` tylko
wtedy, gdy celowo chcesz wykonać prawdziwe połączenie powiadamiające. W przypadku Twilio, Telnyx i
Plivo pomyślna kontrola gotowości wymaga publicznego adresu URL webhooka; wyłącznie lokalne
fallbacki local loopback/prywatne są celowo odrzucane.

## Live: przegląd możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde aktualnie ogłaszane polecenie** przez połączony węzeł Android i sprawdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw testów nie instaluje/uruchamia/paruje aplikacji).
  - Walidacja `node.invoke` polecenie po poleceniu w gatewayu dla wybranego węzła Android.
- Wymagana wstępna konfiguracja:
  - Aplikacja Android jest już połączona i sparowana z gatewayem.
  - Aplikacja pozostaje na pierwszym planie.
  - Przyznano uprawnienia/zgodę na przechwytywanie dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profili)

Testy live są podzielone na dwie warstwy, abyśmy mogli izolować awarie:

- „Model bezpośredni” mówi nam, czy dostawca/model w ogóle odpowiada z danym kluczem.
- „Gateway smoke” mówi nam, czy pełny potok gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxa itd.).

### Warstwa 1: bezpośrednie uzupełnianie modelu (bez gatewaya)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, do których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern`, `small` albo `all` (alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, aby `pnpm test:live` pozostał skupiony na gateway smoke
- Jak wybrać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwolonych modeli (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small`, aby uruchomić ograniczoną listę dozwolonych małych modeli (trasy Qwen 8B/9B zgodne lokalnie, Ollama Gemma, OpenRouter Qwen/GLM oraz Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem nowoczesnej listy dozwolonych modeli
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista dozwolonych rozdzielana przecinkami)
  - Lokalne uruchomienia małych modeli Ollama domyślnie używają `http://127.0.0.1:11434`; ustaw `OPENCLAW_LIVE_OLLAMA_BASE_URL` tylko dla punktów końcowych LAN, niestandardowych lub Ollama Cloud.
  - Przeglądy modern/all i small domyślnie używają swoich wybranych limitów; ustaw `OPENCLAW_LIVE_MAX_MODELS=0`, aby wykonać wyczerpujący przegląd wybranych profili, albo liczbę dodatnią, aby zastosować mniejszy limit.
  - Wyczerpujące przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu całego testu modelu bezpośredniego. Domyślnie: 60 minut.
  - Próby modelu bezpośredniego domyślnie uruchamiają się z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby nadpisać.
- Jak wybrać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest zepsute / klucz jest nieprawidłowy” od „potok agenta gatewaya jest zepsuty”
  - Zawiera małe, izolowane regresje (przykład: odtwarzanie reasoning OpenAI Responses/Codex Responses + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + smoke agenta dev (co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić gateway w tym samym procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu dla każdego uruchomienia)
  - Przejść przez modele z kluczami i sprawdzić:
    - „sensowną” odpowiedź (bez narzędzi)
    - działanie prawdziwego wywołania narzędzia (próba odczytu)
    - opcjonalne dodatkowe próby narzędzi (próba exec+read)
    - ścieżki regresji OpenAI (tylko wywołanie narzędzia → follow-up) nadal działają
- Szczegóły prób (aby można było szybko wyjaśniać awarie):
  - Próba `read`: test zapisuje plik z nonce w workspace i prosi agenta, aby go `read` i odesłał nonce.
  - Próba `exec+read`: test prosi agenta, aby przez `exec` zapisał nonce do pliku tymczasowego, a następnie `read` go z powrotem.
  - Próba obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `test/helpers/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybrać modele:
  - Domyślnie: nowoczesna lista dozwolonych modeli (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`, aby uruchomić tę samą ograniczoną listę dozwolonych małych modeli przez pełny potok gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem nowoczesnej listy dozwolonych modeli
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przeglądy gatewaya modern/all i small domyślnie używają swoich wybranych limitów; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, aby wykonać wyczerpujący wybrany przegląd, albo liczbę dodatnią, aby zastosować mniejszy limit.
- Jak wybrać dostawców (unikaj „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych rozdzielana przecinkami)
- Próby narzędzi i obrazów są zawsze włączone w tym teście live:
  - Próba `read` + próba `exec+read` (stress narzędzi)
  - próba obrazu uruchamia się, gdy model deklaruje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`test/helpers/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
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
- Cel: zweryfikować potok Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącego rozszerzenia.
- Włącz:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazu pochodzi z metadanych Plugin backendu CLI będącego właścicielem.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać prawdziwy załącznik obrazu (ścieżki są wstrzykiwane do promptu). Receptury Docker domyślnie wyłączają to, chyba że wyraźnie zażądano.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazów, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznawiania.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć próbę ciągłości w tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Receptury Docker domyślnie wyłączają to dla niezawodności zbiorczej.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć próbę MCP/tool local loopback. Receptury Docker domyślnie wyłączają to, chyba że wyraźnie zażądano.

Przykład:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Tani smoke konfiguracji Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

To nie prosi Gemini o wygenerowanie odpowiedzi. Zapisuje te same ustawienia
systemowe, które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby udowodnić, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do kształtu HTTP MCP
Gemini i może połączyć się z lokalnym serwerem MCP streamable-HTTP.

Receptura Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receptury Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repozytorium jako użytkownik `node` bez uprawnień roota.
- Rozwiązuje metadane smoke CLI z należącego rozszerzenia, a następnie instaluje pasujący pakiet CLI dla Linuksa (`@anthropic-ai/claude-code` lub `@google/gemini-cli`) w buforowanym zapisywalnym prefiksie pod `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw udowadnia bezpośrednie `claude -p` w Docker, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza API Anthropic. Ta ścieżka subskrypcyjna domyślnie wyłącza próby MCP/tool i obrazów Claude, ponieważ Claude obecnie kieruje użycie aplikacji firm trzecich przez rozliczanie dodatkowego użycia zamiast przez normalne limity planu subskrypcyjnego.
- Smoke live backendu CLI wykonuje teraz ten sam pełny przepływ end-to-end dla Claude i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez CLI gatewaya.
- Domyślny smoke Claude łata też sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: osiągalność proxy APNs HTTP/2

- Test: `src/infra/push-apns-http2.live.test.ts`
- Cel: tunelować przez lokalny proxy HTTP CONNECT do punktu końcowego APNs sandbox Apple, wysłać żądanie walidacyjne APNs HTTP/2 i sprawdzić, że prawdziwa odpowiedź Apple `403 InvalidProviderToken` wraca przez ścieżkę proxy.
- Włącz:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Opcjonalny limit czasu:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke bindowania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ conversation-bind ACP z agentem ACP na żywo:
  - wyślij `/acp spawn <agent> --bind here`
  - powiąż syntetyczną konwersację kanału wiadomości w miejscu
  - wyślij zwykłą wiadomość uzupełniającą w tej samej konwersacji
  - sprawdź, czy wiadomość uzupełniająca trafia do transkrypcji powiązanej sesji ACP
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
  - Ta ścieżka używa powierzchni Gateway `chat.send` z syntetycznymi polami trasy pochodzenia dostępnymi tylko dla administratora, aby testy mogły dołączyć kontekst kanału wiadomości bez udawania zewnętrznego dostarczenia.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów osadzonego Pluginu `acpx` dla wybranego agenta harness ACP.
  - Tworzenie MCP cron dla powiązanej sesji jest domyślnie best-effort, ponieważ zewnętrzne harnessy ACP mogą anulować wywołania MCP po zaliczeniu dowodu bind/image; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby ta sonda cron po powiązaniu była rygorystyczna.

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
- Domyślnie uruchamia smoke ACP bind kolejno względem zagregowanych agentów live CLI: `claude`, `codex`, następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Przygotowuje pasujący materiał uwierzytelniania CLI w kontenerze, a następnie instaluje wymagane live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli go brakuje. Sam backend ACP to osadzony pakiet `acpx/runtime` z oficjalnego Pluginu `acpx`.
- Wariant Docker dla Droid przygotowuje `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant Docker dla OpenCode jest rygorystyczną ścieżką regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`), a `pnpm test:docker:live-acp-bind:opencode` wymaga transkrypcji powiązanego asystenta zamiast akceptować ogólne pominięcie po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ręczną/obejściową ścieżką do porównywania zachowania poza Gateway. Smoke Docker ACP bind sprawdza osadzony backend runtime `acpx` OpenClaw.

## Live: smoke harnessu app-server Codex

- Cel: zweryfikować należący do Pluginu harness Codex przez normalną metodę gateway
  `agent`:
  - załaduj dołączony Plugin `codex`
  - wybierz `openai/gpt-5.5`, co domyślnie kieruje tury agenta OpenAI przez Codex
  - wyślij pierwszą turę agenta gateway do `openai/gpt-5.5` z wybranym harnessem Codex
  - wyślij drugą turę do tej samej sesji OpenClaw i sprawdź, czy wątek app-server
    może zostać wznowiony
  - uruchom `/codex status` i `/codex models` przez tę samą ścieżkę poleceń gateway
  - opcjonalnie uruchom dwie zweryfikowane przez Guardiana eskalowane sondy shell: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, i jeden fałszywy upload sekretu, który powinien zostać
    odrzucony, aby agent dopytał
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włącz: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.5`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/narzędzi: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna sonda Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke wymusza provider/model `agentRuntime.id: "codex"`, więc zepsuty harness Codex
  nie może przejść przez ciche cofnięcie do OpenClaw.
- Uwierzytelnianie: uwierzytelnianie Codex app-server z lokalnego logowania subskrypcji Codex. Smoke Docker
  mogą też podać `OPENAI_API_KEY` dla sond innych niż Codex, gdy ma to zastosowanie,
  oraz opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

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
  npm, przygotowuje drzewo źródłowe, a następnie uruchamia tylko test live harnessu Codex.
- Docker domyślnie włącza sondy obrazu, MCP/narzędzi i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego
  uruchomienia debugowania.
- Docker używa tej samej jawnej konfiguracji runtime Codex, więc starsze aliasy lub fallback OpenClaw
  nie mogą ukryć regresji harnessu Codex.

### Zalecane przepisy live

Wąskie, jawne allowlisty są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Bezpośredni profil małego modelu:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil gateway małego modelu:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Pojedynczy model, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku providerów:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Bezpośredni smoke Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Fokus Google (klucz Gemini API + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke Google adaptive thinking:
  - Domyślna dynamika Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa Gemini API (klucz API).
- `google-antigravity/...` używa mostka Antigravity OAuth (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twojej maszynie (osobne uwierzytelnianie i osobliwości narzędzi).
- Gemini API a Gemini CLI:
  - API: OpenClaw wywołuje hostowane Gemini API Google przez HTTP (klucz API / uwierzytelnianie profilu); to ma na myśli większość użytkowników, mówiąc „Gemini”.
  - CLI: OpenClaw uruchamia lokalny plik binarny `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego pokrycia na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest uruchomienie „common models”, które powinno stale działać:

- OpenAI (bez Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (ogólne API) lub `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Uruchom smoke gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Punkt odniesienia: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden dla każdej rodziny providerów:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (ogólne API) lub `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4.3` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden włączony model obsługujący „tools”)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Wizja: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące wizję itd.), aby sprawdzić sondę obrazu.

### Agregatory / alternatywne gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia i obraz)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej providerów, które możesz uwzględnić w macierzy live (jeśli masz dane uwierzytelniające/konfigurację):

- Wbudowane: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe endpointy): `minimax` (chmura/API) oraz dowolne proxy zgodne z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie wpisuj na stałe „wszystkich modeli” w dokumentacji. Autorytatywna lista to wszystko, co `discoverModels(...)` zwraca na Twojej maszynie, plus wszystkie dostępne klucze.
</Tip>

## Dane uwierzytelniające (nigdy nie commituj)

Testy live wykrywają dane uwierzytelniające tak samo jak CLI. Praktyczne skutki:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live zgłasza „no creds”, debuguj tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania dla agentów: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog starego stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu home testów live, gdy istnieje, ale nie jest głównym magazynem kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` dla agentów, stare `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego katalogu home testów; przygotowane katalogi home live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby próby nie dotykały prawdziwego obszaru roboczego na Twoim hoście.

Jeśli chcesz polegać na kluczach env, wyeksportuj je przed lokalnymi testami albo użyj
poniższych runnerów Docker z jawnym `OPENCLAW_PROFILE_FILE`.

## Deepgram live (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączenie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `extensions/byteplus/live.test.ts`
- Włączenie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Testuje ścieżki dołączonego comfy dla obrazów, wideo oraz `music_generate`
  - Pomija każdą funkcję, o ile `plugins.entries.comfy.config.<capability>` nie jest skonfigurowane
  - Przydatne po zmianach w przesyłaniu workflow comfy, odpytywaniu, pobieraniu lub rejestracji pluginu

## Image generation live

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany plugin dostawcy generowania obrazów
  - Przed próbami używa już wyeksportowanych zmiennych env dostawcy
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych danych uwierzytelniających powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie z env

Dla dostarczonej ścieżki CLI dodaj smoke `infer` po tym, jak test live
dostawcy/środowiska wykonawczego przejdzie:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to parsowanie argumentów CLI, rozwiązywanie konfiguracji/domyślnego agenta, aktywację dołączonego
pluginu, współdzielone środowisko wykonawcze generowania obrazów oraz żądanie live
do dostawcy. Zależności pluginu powinny być obecne przed załadowaniem środowiska wykonawczego.

## Music generation live

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Testuje współdzieloną ścieżkę dołączonego dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Przed próbami używa już wyeksportowanych zmiennych env dostawcy
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych danych uwierzytelniających powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby środowiska wykonawczego, gdy są dostępne:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie z env

## Video generation live

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Testuje współdzieloną ścieżkę dołączonego dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki smoke: dostawcy inni niż FAL, jedno żądanie tekst-na-wideo na dostawcę, jednosekundowy prompt z homarem oraz limit operacji dla dostawcy z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `--video-providers fal` albo `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Przed próbami używa już wyeksportowanych zmiennych env dostawcy
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, więc nieaktualne klucze testowe w `auth-profiles.json` nie maskują prawdziwych danych uwierzytelniających powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje w tym współdzielonym przebiegu lokalne wejście obrazu oparte na buforze
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje w tym współdzielonym przebiegu lokalne wejście wideo oparte na buforze
  - Obecni zadeklarowani, ale pomijani dostawcy `imageToVideo` we współdzielonym przebiegu:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia tekst-na-wideo `veo3` oraz ścieżkę `kling`, która domyślnie używa fixture ze zdalnym URL obrazu
  - Obecne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybranym modelem jest `runway/gen4_aleph`
  - Obecni zadeklarowani, ale pomijani dostawcy `videoToVideo` we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych URL referencyjnych `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ obecna współdzielona ścieżka nie ma gwarancji dostępu do edycji wideo specyficznych dla organizacji
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit każdej operacji dostawcy dla agresywnego przebiegu smoke
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania wyłącznie z env

## Media live harness

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live obrazów, muzyki i wideo przez jeden natywny dla repo punkt wejścia
  - Używa już wyeksportowanych zmiennych env dostawcy
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy obecnie mają użyteczne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) - zestawy jednostkowe, integracyjne, QA i Docker
