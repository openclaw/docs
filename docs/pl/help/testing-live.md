---
read_when:
    - Uruchamianie testów smoke dla macierzy modeli live / backendów CLI / ACP / dostawców multimediów
    - Debugowanie rozwiązywania poświadczeń testów live
    - Dodawanie nowego testu live specyficznego dla dostawcy
sidebarTitle: Live tests
summary: 'Testy live (dotykające sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, poświadczenia'
title: 'Testowanie: zestawy live'
x-i18n:
    generated_at: "2026-04-24T09:14:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

Aby szybko zacząć, poznać runnery QA, zestawy unit/integration i przepływy Docker, zobacz
[Testing](/pl/help/testing). Ta strona obejmuje zestawy testów **live** (dotykających sieci):
macierz modeli, backendy CLI, ACP i testy live dostawców multimediów, a także
obsługę poświadczeń.

## Live: przegląd możliwości Android Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie aktualnie ogłaszane** przez podłączony Android Node i potwierdzić zachowanie kontraktu poleceń.
- Zakres:
  - Konfiguracja wstępna/ręczna (zestaw nie instaluje/nie uruchamia/nie paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego Android Node.
- Wymagana konfiguracja wstępna:
  - Aplikacja Android jest już połączona z gateway i sparowana.
  - Aplikacja jest utrzymywana na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie są przyznane dla możliwości, które mają przejść test.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Androida: [Android App](/pl/platforms/android)

## Live: smoke modeli (klucze profilów)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Direct model” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć przy użyciu danego klucza.
- „Gateway smoke” mówi nam, czy pełny potok gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxa itd.).

### Warstwa 1: bezpośrednie zakończenie modelu (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, do których masz poświadczenia
  - Uruchomić małe zakończenie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie to potrzebne)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby rzeczywiście uruchomić ten zestaw; w przeciwnym razie zostanie pominięty, aby utrzymać fokus `pnpm test:live` na gateway smoke
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną listę dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonych
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (lista dozwolonych rozdzielana przecinkami)
  - Przebiegi modern/all domyślnie używają kuratorowanego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla pełnego przebiegu modern albo dodatnią liczbę dla mniejszego limitu.
  - Pełne przebiegi używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu dla całego testu direct-model. Domyślnie: 60 minut.
  - Sondy direct-model działają domyślnie z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby to nadpisać.
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić tylko **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest zepsute / klucz jest nieprawidłowy” od „potok agenta gateway jest zepsuty”
  - Zawiera małe, odizolowane regresje (na przykład odtwarzanie reasoning OpenAI Responses/Codex Responses + przepływy wywołań narzędzi)

### Warstwa 2: Gateway + smoke agenta dev (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić in-process gateway
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu per uruchomienie)
  - Iterować po modelach-z-kluczami i potwierdzić:
    - „sensowną” odpowiedź (bez narzędzi)
    - że działa rzeczywiste wywołanie narzędzia (sonda odczytu)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - że ścieżki regresji OpenAI (tylko tool-call → follow-up) nadal działają
- Szczegóły sond (aby można było szybko wyjaśniać awarie):
  - Sonda `read`: test zapisuje plik nonce w obszarze roboczym i prosi agenta o jego `read` oraz odesłanie nonce.
  - Sonda `exec+read`: test prosi agenta o zapisanie nonce do pliku tymczasowego przez `exec`, a następnie odczytanie go przez `read`.
  - Sonda obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna lista dozwolonych (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej listy dozwolonych
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przebiegi gateway modern/all domyślnie używają kuratorowanego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla pełnego przebiegu modern albo dodatnią liczbę dla mniejszego limitu.
- Jak wybierać dostawców (unikaj „OpenRouter everything”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych rozdzielana przecinkami)
- Sondy narzędzi i obrazu są zawsze włączone w tym teście live:
  - sonda `read` + sonda `exec+read` (stres test dla narzędzi)
  - sonda obrazu działa, gdy model deklaruje obsługę wejścia obrazu
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z napisem „CAT” + losowy kod (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje wiadomość użytkownika multimodalną do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dozwolone)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (oraz dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować potok Gateway + agent przy użyciu lokalnego backendu CLI, bez naruszania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do odpowiedniego rozszerzenia.
- Włączanie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie command/args/image pochodzi z metadanych Pluginu backendu CLI będącego właścicielem.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazów, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, aby wyłączyć domyślną sondę ciągłości tej samej sesji Claude Sonnet -> Opus (ustaw `1`, aby wymusić jej włączenie, gdy wybrany model obsługuje cel przełączenia).

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recepty Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia test smoke live CLI-backend wewnątrz obrazu Docker repo jako użytkownik nie-root `node`.
- Rozwiązuje metadane smoke CLI z rozszerzenia będącego właścicielem, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu pod `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Dockerze, a następnie uruchamia dwie tury Gateway CLI-backend bez zachowywania zmiennych env klucza API Anthropic. Ta ścieżka subskrypcji domyślnie wyłącza sondy Claude MCP/tool i image, ponieważ Claude obecnie kieruje użycie aplikacji firm trzecich przez dodatkowe rozliczanie użycia zamiast przez zwykłe limity planu subskrypcji.
- Test smoke live CLI-backend wykonuje teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez gateway CLI.
- Domyślny smoke Claude dodatkowo łata sesję z Sonnet do Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke powiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ powiązania konwersacji ACP z aktywnym agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną konwersację message-channel na miejscu
  - wysłać zwykły follow-up w tej samej konwersacji
  - zweryfikować, że follow-up trafia do transkryptu powiązanej sesji ACP
- Włączanie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne:
  - Agenci ACP w Dockerze: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Syntetyczny kanał: kontekst konwersacji w stylu Slack DM
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Uwagi:
  - Ta ścieżka używa powierzchni gateway `chat.send` z polami admin-only synthetic originating-route, dzięki czemu testy mogą dołączać kontekst message-channel bez udawania dostarczania na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` jest nieustawione, test używa wbudowanego rejestru agentów Pluginu `acpx` dla wybranego agenta harness ACP.

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
pnpm test:docker:live-acp-bind:gemini
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke powiązania ACP kolejno dla wszystkich obsługiwanych aktywnych agentów CLI: `claude`, `codex`, potem `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, aby zawęzić macierz.
- Ładuje `~/.profile`, przygotowuje odpowiedni materiał uwierzytelniania CLI do kontenera, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje żądane aktywne CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`), jeśli go brakuje.
- Wewnątrz Dockera runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, aby acpx zachowywał zmienne env dostawcy ze wczytanego profilu dostępne dla podrzędnego harness CLI.

## Live: smoke harnessu app-server Codex

- Cel: zweryfikować należący do Pluginu harness Codex przez zwykłą metodę gateway
  `agent`:
  - załadować dołączony Plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę agenta gateway do `openai/gpt-5.2` z wymuszonym harness Codex
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek
    app-server może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę poleceń
    gateway
  - opcjonalnie uruchomić dwie sondy powłoki z eskalacją poddane przeglądowi Guardian: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, oraz jedno fałszywe wysłanie sekretu,
    które powinno zostać odrzucone, tak aby agent poprosił o potwierdzenie
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `openai/gpt-5.2`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/narzędzi: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna sonda Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Ten smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzony harness Codex
  nie mógł przejść testu przez ciche przejście awaryjne do PI.
- Uwierzytelnianie: uwierzytelnianie app-server Codex z lokalnego logowania subskrypcji Codex. Testy smoke w Dockerze
  mogą również przekazać `OPENAI_API_KEY` dla sond nie-Codex, gdy ma to zastosowanie,
  plus opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

Lokalna recepta:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recepta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Ładuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  uwierzytelniania CLI Codex, jeśli są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródłowe, a następnie uruchamia tylko test live harnessu Codex.
- Docker domyślnie włącza sondy obrazu, MCP/narzędzi i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` albo
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego przebiegu debugowania.
- Docker eksportuje też `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją
  testu live, aby starsze aliasy lub fallback do PI nie mogły ukryć regresji
  harnessu Codex.

### Zalecane recepty live

Wąskie, jawne listy dozwolonych są najszybsze i najmniej podatne na błędy:

- Pojedynczy model, bezpośrednio (bez gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi dla kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Uwagi:

- `google/...` używa Gemini API (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twojej maszynie (oddzielne uwierzytelnianie + niuanse narzędzi).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane Gemini API Google przez HTTP (klucz API / uwierzytelnianie profilu); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalny binarny plik `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (obsługa strumieniowania/narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opcjonalne), ale poniżej znajdują się **zalecane** modele do regularnego sprawdzania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest przebieg „typowych modeli”, który powinien pozostać sprawny:

- OpenAI (nie-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom gateway smoke z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baza: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden model z każdej rodziny dostawców:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (mile widziane):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model „tools” obsługujący narzędzia, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/warianty OpenAI obsługujące vision itd.), aby wykonać sondę obrazu.

### Agregatory / alternatywne gateway

Jeśli masz włączone klucze, obsługujemy także testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia+obrazy)
- OpenCode: `opencode/...` dla Zen oraz `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe endpointy): `minimax` (cloud/API) oraz dowolne proxy zgodne z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj wpisywać na sztywno „wszystkich modeli” w dokumentacji. Autorytatywna lista to to, co zwraca `discoverModels(...)` na Twojej maszynie + wszystkie dostępne klucze.

## Poświadczenia (nigdy nie zapisuj do repozytorium)

Testy live wykrywają poświadczenia tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli działa CLI, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „no creds”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, jeśli istnieje, ale nie jest to główny magazyn kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, starszy katalog `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego katalogu domowego testu; przygotowane katalogi domowe live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie dotykały Twojego rzeczywistego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach env (np. wyeksportowanych w `~/.profile`), uruchamiaj lokalne testy po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą montować `~/.profile` do kontenera).

## Live Deepgram (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączanie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `extensions/byteplus/live.test.ts`
- Włączanie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live multimediów workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Wykonuje dołączone ścieżki comfy image, video i `music_generate`
  - Pomija każdą możliwość, chyba że skonfigurowano `models.providers.comfy.<capability>`
  - Przydatne po zmianach w przesyłaniu workflow comfy, odpytywaniu, pobieraniu lub rejestracji Pluginu

## Live generowania obrazów

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy generowania obrazów
  - Ładuje brakujące zmienne env dostawcy z Twojej powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa aktywnych/env kluczy API przed zapisanymi profilami uwierzytelniania, aby przestarzałe klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia standardowe warianty generowania obrazów przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Obecnie objęci dołączeni dostawcy:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko-env

## Live generowania muzyki

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Wykonuje współdzieloną dołączoną ścieżkę dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne env dostawcy z Twojej powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa aktywnych/env kluczy API przed zapisanymi profilami uwierzytelniania, aby przestarzałe klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem opartym wyłącznie na promptcie
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Obecne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przebieg
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko-env

## Live generowania wideo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Wykonuje współdzieloną dołączoną ścieżkę dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydań ścieżki smoke: dostawcy inni niż FAL, jedno żądanie text-to-video na dostawcę, jednosekundowy prompt z homarem oraz limit operacji per dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne env dostawcy z Twojej powłoki logowania (`~/.profile`) przed sondowaniem
  - Domyślnie używa aktywnych/env kluczy API przed zapisanymi profilami uwierzytelniania, aby przestarzałe klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać również zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przebiegu
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu
  - Obecni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `vydra`, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa fixture zdalnego URL obrazu
  - Bieżące pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Obecni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL-i `http(s)` / MP4
    - `google`, ponieważ bieżąca współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ bieżąca współdzielona ścieżka nie gwarantuje dostępu do video inpaint/remix specyficznego dla organizacji
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji dla każdego dostawcy przy agresywnym przebiegu smoke
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko-env

## Harness live multimediów

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live obrazów, muzyki i wideo przez jeden natywny dla repo punkt wejścia
  - Automatycznie ładuje brakujące zmienne env dostawcy z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy obecnie mają użyteczne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, dzięki czemu zachowanie heartbeat i quiet mode pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testing](/pl/help/testing) — zestawy unit, integration, QA i Docker
