---
read_when:
    - Uruchamianie testów dymnych macierzy modeli na żywo / backendu CLI / ACP / dostawcy multimediów
    - Debugowanie rozpoznawania danych uwierzytelniających w testach na żywo
    - Dodawanie nowego testu na żywo specyficznego dla dostawcy
sidebarTitle: Live tests
summary: 'Testy na żywo (korzystające z sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, dane uwierzytelniające'
title: 'Testowanie: zestawy testów na żywo'
x-i18n:
    generated_at: "2026-07-12T15:11:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Szybki start, procedury QA, zestawy testów jednostkowych/integracyjnych i przepływy Docker opisano w sekcji
[Testowanie](/pl/help/testing). Ta strona dotyczy testów **na żywo** (korzystających z sieci):
macierzy modeli, backendów CLI, ACP, dostawców multimediów i obsługi danych uwierzytelniających.

## Na żywo: lokalne polecenia testów dymnych

Przed doraźnymi testami na żywo wyeksportuj wymagany klucz dostawcy w środowisku procesu.

Bezpieczny test dymny multimediów:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Bezpieczny test dymny gotowości połączeń głosowych:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` wykonuje próbę na sucho, chyba że podano również `--yes`; używaj `--yes` tylko
wtedy, gdy zamierzasz nawiązać rzeczywiste połączenie. W przypadku Twilio, Telnyx i Plivo
pomyślna kontrola gotowości wymaga publicznego adresu URL webhooka — lokalne/prywatne
adresy URL local loopback są odrzucane, ponieważ ci dostawcy nie mogą się z nimi połączyć.

## Na żywo: przegląd możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde aktualnie udostępniane polecenie** podłączonego węzła Android i sprawdzić zachowanie kontraktu poleceń.
- Zakres:
  - Wymagana konfiguracja wstępna/ręczna (zestaw nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego węzła Android.
- Wymagana konfiguracja wstępna:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Przyznano uprawnienia/zgodę na przechwytywanie dla możliwości, które mają przejść test.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Androida: [Aplikacja Android](/pl/platforms/android)

## Na żywo: test dymny modeli (klucze profili)

Testy modeli na żywo są podzielone na dwie warstwy, aby izolować awarie:

- „Model bezpośredni” informuje, czy dostawca/model w ogóle może odpowiedzieć przy użyciu danego klucza.
- „Test dymny Gateway” informuje, czy pełny potok Gateway+agent działa z tym modelem (sesje, historia, narzędzia, zasady piaskownicy itd.).

Poniższe wyselekcjonowane listy modeli znajdują się w `src/agents/live-model-filter.ts` i
zmieniają się z czasem; jako źródło prawdy traktuj znajdujące się tam tablice, a nie tę
stronę.

MiniMax M3 używa `minimax/MiniMax-M3` jako domyślnego odwołania dostawca/model.

### Warstwa 1: Bezpośrednie uzupełnianie przez model (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz dane uwierzytelniające
  - Uruchomić krótkie uzupełnianie dla każdego modelu (oraz ukierunkowane testy regresji, gdy są potrzebne)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - Ustaw `OPENCLAW_LIVE_MODELS=modern`, `small` lub `all` (alias `modern`), aby faktycznie uruchomić ten zestaw; w przeciwnym razie jest pomijany, dzięki czemu samo `pnpm test:live` pozostaje skoncentrowane na teście dymnym Gateway.
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern` uruchamia wyselekcjonowaną listę priorytetowych modeli o wysokiej wartości diagnostycznej (zobacz [Na żywo: macierz modeli](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` uruchamia wyselekcjonowaną listę priorytetowych małych modeli
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem `modern`
  - lub `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (lista dozwolonych wartości rozdzielona przecinkami)
  - Lokalne uruchomienia małych modeli Ollama domyślnie używają `http://127.0.0.1:11434`; ustawiaj `OPENCLAW_LIVE_OLLAMA_BASE_URL` tylko dla punktów końcowych w sieci LAN, niestandardowych lub Ollama Cloud.
  - Przeglądy modern/all i small domyślnie mają limit równy długości odpowiedniej wyselekcjonowanej listy; ustaw `OPENCLAW_LIVE_MAX_MODELS=0`, aby wykonać pełny przegląd wybranych profili, lub dodatnią liczbę, aby ustawić niższy limit.
  - Pełne przeglądy używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako limitu czasu całego testu modeli bezpośrednich. Wartość domyślna: 60 minut.
  - Próby modeli bezpośrednich domyślnie działają z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby ją nadpisać.
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista dozwolonych wartości rozdzielona przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i wartości rezerwowe ze środowiska
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić używanie **wyłącznie magazynu profili**
- Dlaczego to istnieje:
  - Oddziela „interfejs API dostawcy jest uszkodzony / klucz jest nieprawidłowy” od „potok agenta Gateway jest uszkodzony”
  - Zawiera małe, odizolowane testy regresji (przykład: odtwarzanie rozumowania OpenAI Responses/Codex Responses i przepływy wywołań narzędzi)

### Warstwa 2: Gateway + test dymny agenta deweloperskiego (co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway wewnątrz procesu
  - Utworzyć/zmodyfikować sesję `agent:dev:*` (nadpisanie modelu dla każdego uruchomienia)
  - Iterować po modelach z kluczami i sprawdzić:
    - „sensowną” odpowiedź (bez narzędzi)
    - działanie rzeczywistego wywołania narzędzia (próba odczytu)
    - opcjonalne dodatkowe próby narzędzi (próba wykonania+odczytu)
    - ciągłość działania ścieżek regresji OpenAI (tylko wywołanie narzędzia -> kontynuacja)
- Szczegóły prób (aby można było szybko wyjaśnić awarie):
  - Próba `read`: test zapisuje plik z wartością nonce w obszarze roboczym i prosi agenta o użycie `read` do jego odczytania oraz zwrócenie wartości nonce.
  - Próba `exec+read`: test prosi agenta o użycie `exec` do zapisania wartości nonce w pliku tymczasowym, a następnie o jej odczytanie za pomocą `read`.
  - Próba obrazu: test dołącza wygenerowany plik PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Odwołanie do implementacji: `src/gateway/gateway-models.profiles.live.test.ts` i `test/helpers/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: wyselekcjonowana priorytetowa lista o wysokiej wartości diagnostycznej (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` uruchamia wyselekcjonowaną listę małych modeli w pełnym potoku Gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem `modern`
  - Możesz też ustawić `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzieloną przecinkami), aby zawęzić wybór
  - Przeglądy Gateway modern/all i small domyślnie mają limit równy długości odpowiedniej wyselekcjonowanej listy; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, aby wykonać pełny wybrany przegląd, lub dodatnią liczbę, aby ustawić niższy limit.
- Jak wybierać dostawców (aby uniknąć „wszystkiego przez OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista dozwolonych wartości rozdzielona przecinkami)
- Próby narzędzi i obrazów są zawsze włączone w tym teście na żywo:
  - Próba `read` + próba `exec+read` (obciążenie narzędzi)
  - Próba obrazu jest uruchamiana, gdy model deklaruje obsługę obrazów wejściowych
  - Przepływ (ogólnie):
    - Test generuje mały plik PNG z napisem „CAT” i losowym kodem (`test/helpers/live-image-probe.ts`)
    - Wysyła go przez `agent` jako `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway przetwarza załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Sprawdzenie: odpowiedź zawiera `cat` i kod (tolerancja OCR: dopuszczalne są drobne błędy)

<Tip>
Aby zobaczyć, co możesz przetestować na swoim komputerze (oraz dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Na żywo: test dymny backendu CLI (Claude, Gemini lub inne lokalne interfejsy CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować potok Gateway + agent przy użyciu lokalnego backendu CLI bez modyfikowania domyślnej konfiguracji.
- Domyślne ustawienia testu dymnego specyficzne dla backendu znajdują się w należącej do odpowiedniego Pluginu definicji `cli-backend.ts`.
- Włączanie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Ustawienia domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie polecenia/argumentów/obrazów pochodzi z metadanych właścicielskiego Pluginu backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik graficzny (ścieżki są wstrzykiwane do promptu). Domyślnie wyłączone w procedurach Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwać je do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazów, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznawiania.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć próbę ciągłości w tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje model docelowy przełączenia. Domyślnie wyłączone, również w procedurach Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć próbę MCP/pętli narzędzi local loopback. Domyślnie wyłączone w procedurach Docker.

Przykład:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Lekki test dymny konfiguracji MCP Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Nie wymaga to od Gemini wygenerowania odpowiedzi. Test zapisuje te same ustawienia systemowe,
które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby wykazać,
że zapisany serwer `transport: "streamable-http"` jest normalizowany do formatu HTTP MCP Gemini
i może połączyć się z lokalnym serwerem MCP używającym strumieniowego HTTP.

Procedura Docker:

```bash
pnpm test:docker:live-cli-backend
```

Procedury Docker dla pojedynczych dostawców:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Procedura uruchamiająca Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia ona test dymny backendu CLI na żywo wewnątrz obrazu Docker repozytorium jako użytkownik `node` bez uprawnień administratora.
- Pobiera metadane testu dymnego CLI z właścicielskiego Pluginu, a następnie instaluje odpowiedni pakiet CLI dla systemu Linux (`@anthropic-ai/claude-code` lub `@google/gemini-cli`) w buforowanym prefiksie z prawem zapisu pod adresem `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` nie jest już dołączonym backendem CLI; zamiast niego używaj `openai/*` ze środowiskiem uruchomieniowym serwera aplikacji Codex (zobacz [Na żywo: test dymny infrastruktury serwera aplikacji Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego uwierzytelniania OAuth subskrypcji Claude Code przez plik `~/.claude/.credentials.json` z polem `claudeAiOauth.subscriptionType` albo zmienną `CLAUDE_CODE_OAUTH_TOKEN` uzyskaną z `claude setup-token`. Najpierw potwierdza bezpośrednie działanie `claude -p` w Dockerze, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych środowiskowych klucza API Anthropic. Ta ścieżka subskrypcyjna domyślnie wyłącza próby MCP/narzędzi i obrazów Claude, ponieważ zużywa limity użycia zalogowanej subskrypcji, a Anthropic może zmieniać sposób rozliczania i ograniczania liczby żądań w Claude Agent SDK / `claude -p` bez wydania nowej wersji OpenClaw.
- Claude i Gemini obsługują ten sam zestaw prób (tura tekstowa, klasyfikacja obrazu, wywołanie narzędzia MCP `cron`, ciągłość po przełączeniu modelu) za pomocą powyższych flag, ale żadna z tych prób nie jest uruchamiana domyślnie — włączaj je w razie potrzeby odpowiednimi flagami.

## Na żywo: osiągalność serwera proxy APNs przez HTTP/2

- Test: `src/infra/push-apns-http2.live.test.ts`
- Cel: utworzyć tunel przez lokalny serwer proxy HTTP CONNECT do punktu końcowego środowiska testowego APNs firmy Apple, wysłać żądanie walidacyjne APNs przez HTTP/2 i sprawdzić, czy rzeczywista odpowiedź Apple `403 InvalidProviderToken` wraca ścieżką przez serwer proxy.
- Włączanie:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Opcjonalny limit czasu:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Na żywo: test dymny powiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikowanie rzeczywistego przepływu wiązania konwersacji ACP z aktywnym agentem ACP:
  - wysłanie `/acp spawn <agent> --bind here`
  - powiązanie w miejscu syntetycznej konwersacji kanału wiadomości
  - wysłanie zwykłej kolejnej wiadomości w tej samej konwersacji
  - sprawdzenie, czy kolejna wiadomość trafia do transkrypcji powiązanej sesji ACP
- Włączenie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Wartości domyślne:
  - agenci ACP w Dockerze: `claude,codex,gemini`
  - agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - kanał syntetyczny: kontekst konwersacji w stylu wiadomości prywatnej Slacka
  - zaplecze ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (lub `on`/`true`/`yes`), aby wymusić włączenie próby obrazu; każda inna wartość wymusza jej wyłączenie. Domyślnie jest uruchamiana dla każdego agenta oprócz `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Uwagi:
  - Ta ścieżka używa powierzchni `chat.send` Gateway z dostępnymi wyłącznie dla administratora syntetycznymi polami trasy źródłowej, dzięki czemu testy mogą dołączać kontekst kanału wiadomości bez pozorowania dostarczenia na zewnątrz.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawiona, test używa wbudowanego rejestru agentów osadzonego pluginu `acpx` dla wybranego agenta środowiska testowego ACP.
  - Tworzenie MCP Cron dla powiązanej sesji jest domyślnie wykonywane na zasadzie najlepszych starań, ponieważ zewnętrzne środowiska testowe ACP mogą anulować wywołania MCP po pomyślnym przejściu weryfikacji powiązania/obrazu; ustaw `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`, aby ta próba Cron po powiązaniu była rygorystyczna.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Procedura dla Dockera:

```bash
pnpm test:docker:live-acp-bind
```

Procedury dla pojedynczych agentów w Dockerze:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Uwagi dotyczące Dockera:

- Skrypt uruchamiający Dockera znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia test dymny wiązania ACP kolejno dla zbiorczych aktywnych agentów CLI: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Umieszcza w kontenerze odpowiednie dane uwierzytelniające CLI, a następnie, jeśli jej brakuje, instaluje żądaną aktywną aplikację CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`). Samym zapleczem ACP jest osadzony pakiet `acpx/runtime` z oficjalnego pluginu `acpx`.
- Wariant Droid dla Dockera umieszcza `~/.factory` na potrzeby ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalnego uwierzytelniania Factory przez OAuth/pęk kluczy nie można przenieść do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant OpenCode dla Dockera jest rygorystyczną ścieżką regresyjną dla pojedynczego agenta. Zapisuje tymczasowy model domyślny `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`).
- Bezpośrednie wywołania CLI `acpx` stanowią jedynie ręczną/obejściową ścieżkę do porównywania zachowania poza Gateway. Test dymny wiązania ACP w Dockerze korzysta z osadzonego zaplecza środowiska uruchomieniowego `acpx` w OpenClaw.

## Na żywo: test dymny środowiska testowego serwera aplikacji Codex

- Cel: zweryfikowanie środowiska testowego Codex należącego do pluginu za pomocą standardowej metody Gateway
  `agent`:
  - załadowanie dołączonego pluginu `codex`
  - wybranie modelu OpenAI za pomocą `/model <ref> --runtime codex`
  - wysłanie pierwszej tury agenta Gateway z żądanym poziomem rozumowania
  - wysłanie drugiej tury do tej samej sesji OpenClaw i sprawdzenie, czy wątek serwera aplikacji
    może zostać wznowiony
  - uruchomienie `/codex status` i `/codex models` tą samą ścieżką poleceń
    Gateway
  - opcjonalne uruchomienie dwóch eskalowanych prób powłoki sprawdzanych przez Guardian: jednego nieszkodliwego
    polecenia, które powinno zostać zatwierdzone, oraz jednego przesłania fałszywego sekretu, które powinno zostać
    odrzucone, aby agent poprosił o wyjaśnienie
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Bazowy model środowiska testowego: `openai/gpt-5.6-luna`
- Domyślny wybór przy użyciu nowego klucza API OpenAI: `openai/gpt-5.6`
- Domyślny poziom rozumowania: `low`
- Nadpisanie modelu: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Nadpisanie poziomu rozumowania: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Nadpisanie macierzy: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Tryb uwierzytelniania: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (domyślny) używa
  skopiowanego logowania Codex; `api-key` używa `OPENAI_API_KEY` przez serwer aplikacji Codex.
- Opcjonalna próba obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna próba MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalna próba Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Test dymny wymusza `agentRuntime.id: "codex"` dostawcy/modelu, aby uszkodzone środowisko testowe Codex
  nie mogło przejść testu przez ciche przełączenie awaryjne na OpenClaw.
- Uwierzytelnianie: uwierzytelnianie serwera aplikacji Codex z lokalnego logowania subskrypcyjnego Codex lub
  `OPENAI_API_KEY`, gdy `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker może
  skopiować `~/.codex/auth.json` i `~/.codex/config.toml` na potrzeby uruchomień subskrypcyjnych.

Procedura lokalna:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Procedura dla Dockera:

```bash
pnpm test:docker:live-codex-harness
```

Natywna macierz Codex dla GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Domyślna konfiguracja z nowym kluczem API OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Ta weryfikacja pozostawia `OPENCLAW_LIVE_GATEWAY_MODELS` bez ustawienia, rozpoznaje model przez
nowy punkt wyboru wnioskowania podczas wdrażania, sprawdza `openai/gpt-5.6`, a następnie
uruchamia rzeczywistą turę Gateway z rozpoznanym modelem.

Osadzona macierz OpenClaw dla GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Uwagi dotyczące Dockera:

- Skrypt uruchamiający Dockera znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Przekazuje `OPENAI_API_KEY`, kopiuje pliki uwierzytelniania CLI Codex, gdy są dostępne, instaluje
  `@openai/codex` w zamontowanym zapisywalnym prefiksie
  npm, umieszcza drzewo źródłowe, a następnie uruchamia wyłącznie test na żywo środowiska testowego Codex.
- Docker domyślnie włącza próby obrazu, MCP/narzędzia i Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego uruchomienia
  diagnostycznego.
- Docker używa tej samej jawnej konfiguracji środowiska uruchomieniowego Codex, więc starsze aliasy ani przełączenie awaryjne
  na OpenClaw nie mogą ukryć regresji środowiska testowego Codex.
- Cele macierzy są uruchamiane kolejno w jednym kontenerze. Skrypt Dockera skaluje
  domyślny 35-minutowy limit czasu według liczby celów; każdy zewnętrzny limit czasu powłoki lub CI musi
  dopuszczać taki sam łączny czas. Kanoniczna konfiguracja CI utrzymuje każdy cel GPT-5.6 w osobnym fragmencie.

### Zalecane procedury testów na żywo

Wąskie, jawne listy dozwolonych elementów są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Bezpośredni profil małych modeli:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil małych modeli dla Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Test dymny API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Pojedynczy model, test dymny Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Bezpośredni test dymny Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Testy skoncentrowane na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Test dymny adaptacyjnego rozumowania Google (`qa manual` z prywatnego CLI QA — wymaga `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` i kopii roboczej źródeł; zobacz [omówienie QA](/pl/concepts/qa-e2e-automation)):
  - Dynamiczna wartość domyślna Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Dynamiczny budżet Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego CLI Gemini na Twoim komputerze (oddzielne uwierzytelnianie i specyficzne zachowania narzędzi).
- API Gemini a CLI Gemini:
  - API: OpenClaw wywołuje hostowane przez Google API Gemini przez HTTP (klucz API / uwierzytelnianie profilu); to właśnie większość użytkowników rozumie przez „Gemini”.
  - CLI: OpenClaw uruchamia lokalny plik binarny `gemini` w powłoce; ma on własne uwierzytelnianie i może zachowywać się inaczej (strumieniowanie/obsługa narzędzi/rozbieżności wersji).

## Na żywo: macierz modeli (co obejmujemy)

Testy na żywo są opcjonalne, więc nie istnieje stała „lista modeli CI”. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (oraz ich alias `all`) uruchamiają wyselekcjonowaną listę priorytetową z `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` w `src/agents/live-model-filter.ts`, w następującej kolejności priorytetów:

| Dostawca/model                                | Uwagi      |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

Wyselekcjonowana lista **małych modeli** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`) z `SMALL_LIVE_MODEL_PRIORITY`:

| Dostawca/model               |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Uwagi dotyczące nowoczesnej listy:

- Dostawcy `codex` i `codex-cli` są wykluczeni z domyślnego nowoczesnego przebiegu (obejmują zachowanie zaplecza CLI/ACP, testowane osobno powyżej). Sam `openai/gpt-5.5` jest domyślnie kierowany przez środowisko testowe serwera aplikacji Codex; zobacz [Test na żywo: test dymny środowiska serwera aplikacji Codex](#live-codex-app-server-harness-smoke).
- Dostawcy `fireworks`, `google`, `openrouter` i `xai` uruchamiają w nowoczesnym przebiegu tylko jawnie wyselekcjonowane identyfikatory modeli (bez automatycznego rozszerzania na „każdy model tego dostawcy”).
- Uwzględnij co najmniej jeden model obsługujący obrazy (warianty wizyjne rodziny Claude/Gemini/OpenAI itd.) w `OPENCLAW_LIVE_GATEWAY_MODELS`, aby wykonać test obrazu.

Uruchom test dymny Gateway z narzędziami i obrazem dla ręcznie wybranego zestawu obejmującego wielu dostawców:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Opcjonalne dodatkowe pokrycie poza wyselekcjonowanymi listami (warto mieć; wybierz włączony model obsługujący narzędzia):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (jeśli masz dostęp)
- LM Studio: `lmstudio/...` (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Agregatory / alternatywne bramy

Jeśli masz włączone klucze, możesz również testować przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć modele obsługujące narzędzia i obrazy)
- OpenCode: `opencode/...` dla Zen oraz `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Dodatkowi dostawcy, których możesz uwzględnić w macierzy testów na żywo (jeśli masz dane uwierzytelniające lub konfigurację):

- Wbudowani: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (chmura/API) oraz dowolne proxy zgodne z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

<Tip>
Nie wpisuj na stałe „wszystkich modeli” w dokumentacji. Źródłem prawdy jest lista zwracana przez `discoverModels(...)` na Twoim komputerze, uzupełniona o modele dostępne za pomocą posiadanych kluczy.
</Tip>

## Dane uwierzytelniające (nigdy ich nie zatwierdzaj w repozytorium)

Testy na żywo wykrywają dane uwierzytelniające w taki sam sposób jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy na żywo powinny znaleźć te same klucze.
- Jeśli test na żywo zgłasza „brak danych uwierzytelniających”, diagnozuj problem tak samo jak w przypadku `openclaw models list` / wyboru modelu.

- Profile uwierzytelniania poszczególnych agentów: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „klucze profilu” w testach na żywo)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog starszego mechanizmu OAuth: `~/.openclaw/credentials/` (jeśli istnieje, jest kopiowany do przygotowanego katalogu domowego testów na żywo, ale nie stanowi głównego magazynu kluczy profilu)
- Lokalne przebiegi na żywo kopiują aktywną konfigurację (z usuniętymi nadpisaniami `agents.*.workspace` / `agentDir`) oraz plik `auth-profiles.json` każdego agenta — bez pozostałej części katalogu tego agenta, dzięki czemu dane z `workspace/` i `sandboxes/` nigdy nie trafiają do przygotowanego katalogu domowego — a także katalog starszego mechanizmu `credentials/` oraz obsługiwane pliki i katalogi uwierzytelniania zewnętrznych narzędzi CLI (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) do tymczasowego katalogu domowego testu.

Jeśli chcesz polegać na kluczach ze zmiennych środowiskowych, wyeksportuj je przed testami lokalnymi albo użyj poniższych mechanizmów uruchamiania Docker z jawnym `OPENCLAW_PROFILE_FILE`.

## Test Deepgram na żywo (transkrypcja dźwięku)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włącz: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Test planu programistycznego BytePlus na żywo

- Test: `extensions/byteplus/live.test.ts`
- Włącz: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Test multimediów przepływu pracy ComfyUI na żywo

- Test: `extensions/comfy/comfy.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Wykonuje ścieżki obrazu, wideo i `music_generate` w dołączonym comfy
  - Pomija każdą funkcję, jeśli `plugins.entries.comfy.config.<capability>` nie jest skonfigurowane
  - Przydatny po zmianie przesyłania przepływu pracy comfy, odpytywania, pobierania lub rejestracji pluginu

## Test generowania obrazów na żywo

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Środowisko testowe: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany plugin dostawcy generowania obrazów
  - Przed sprawdzaniem używa już wyeksportowanych zmiennych środowiskowych dostawcy
  - Domyślnie używa kluczy API testów na żywo lub ze środowiska przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie przesłaniają rzeczywistych danych uwierzytelniających powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania, profilu lub modelu
  - Uruchamia każdego skonfigurowanego dostawcę przez współdzielone środowisko uruchomieniowe generowania obrazów:
    - `<provider>:generate`
    - `<provider>:edit`, gdy dostawca deklaruje obsługę edycji
- Obecnie objęci wbudowani dostawcy:
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

W przypadku dostarczanej ścieżki CLI dodaj test dymny `infer` po pomyślnym zakończeniu testu dostawcy i środowiska uruchomieniowego na żywo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimalny płaski obraz testowy: jeden niebieski kwadrat na białym tle, bez tekstu." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Obejmuje to analizowanie argumentów CLI, rozwiązywanie konfiguracji i domyślnego agenta, aktywację wbudowanego pluginu, współdzielone środowisko uruchomieniowe generowania obrazów oraz żądanie do dostawcy na żywo. Oczekuje się, że zależności pluginu będą dostępne przed załadowaniem środowiska uruchomieniowego.

## Test generowania muzyki na żywo

- Test: `extensions/music-generation-providers.live.test.ts`
- Włącz: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Środowisko testowe: `pnpm test:live:media music`
- Zakres:
  - Wykonuje współdzieloną ścieżkę wbudowanych dostawców generowania muzyki
  - Obecnie obejmuje `fal`, `google`, `minimax` i `openrouter`
  - Przed sprawdzaniem używa już wyeksportowanych zmiennych środowiskowych dostawcy
  - Domyślnie używa kluczy API testów na żywo lub ze środowiska przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie przesłaniają rzeczywistych danych uwierzytelniających powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania, profilu lub modelu
  - Uruchamia oba zadeklarowane tryby środowiska uruchomieniowego, gdy są dostępne:
    - `generate` z danymi wejściowymi zawierającymi tylko opis
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - `comfy` ma własny, oddzielny plik testów na żywo i nie jest częścią tego współdzielonego przebiegu
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne tylko w środowisku

## Test generowania wideo na żywo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Mechanizm testowy: `pnpm test:live:media video`
- Zakres:
  - Testuje wspólną ścieżkę dołączonych dostawców generowania wideo dla `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Domyślnie używa bezpiecznej dla wydania ścieżki testu dymnego: jedno żądanie zamiany tekstu na wideo na dostawcę, prompt z homarem i jednosekundowym czasem trwania oraz limit czasu operacji dla każdego dostawcy określony przez `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może zdominować czas wydania; przekaż `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (lub wyczyść listę pomijanych dostawców), aby uruchomić go jawnie
  - Przed sondowaniem używa już wyeksportowanych zmiennych środowiskowych dostawcy
  - Domyślnie używa kluczy API ze środowiska testów na żywo przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie przesłaniają rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania, profilu lub modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać również zadeklarowane tryby przekształcania, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca i model akceptują w ramach wspólnego przebiegu lokalny obraz wejściowy przechowywany w buforze
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca i model akceptują w ramach wspólnego przebiegu lokalne wideo wejściowe przechowywane w buforze
  - Dostawca `imageToVideo`, który jest obecnie zadeklarowany, ale pomijany we wspólnym przebiegu:
    - `vydra` (lokalny obraz wejściowy przechowywany w buforze nie jest obsługiwany w tej ścieżce)
  - Testy specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Ten plik uruchamia zamianę tekstu na wideo przy użyciu `veo3` oraz ścieżkę zamiany obrazu na wideo przy użyciu `kling`, która domyślnie korzysta z testowego zdalnego adresu URL obrazu (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` umożliwia jego zastąpienie).
  - Testy specyficzne dla dostawcy xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Klasyczny przypadek najpierw generuje kwadratową lokalną pierwszą klatkę PNG, pomija geometrię, żąda jednosekundowego klipu zamiany obrazu na wideo, odpytuje do ukończenia i weryfikuje pobrany bufor.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Przypadek 1.5 generuje lokalną pierwszą klatkę PNG, żąda jednosekundowego klipu zamiany obrazu na wideo w rozdzielczości 1080P, odpytuje do ukończenia i weryfikuje pobrany bufor.
  - Obecny zakres testów `videoToVideo` na żywo:
    - tylko `runway`, gdy wybrany model jest rozpoznawany jako `gen4_aleph`
  - Dostawcy `videoToVideo`, którzy są obecnie zadeklarowani, ale pomijani we wspólnym przebiegu:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, ponieważ te ścieżki wymagają obecnie zdalnych referencyjnych adresów URL `http(s)` zamiast lokalnych danych wejściowych przechowywanych w buforze
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit czasu każdej operacji dostawcy na potrzeby agresywnego testu dymnego
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania dostępne wyłącznie w zmiennych środowiskowych

## Mechanizm testów multimediów na żywo

- Polecenie: `pnpm test:live:media`
- Punkt wejścia: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, który uruchamia `pnpm test:live -- <suite-test-file>` dla każdego wybranego zestawu, dzięki czemu zachowanie Heartbeat i trybu cichego pozostaje spójne z innymi uruchomieniami `pnpm test:live`.
- Cel:
  - Uruchamia współdzielone zestawy testów obrazów, muzyki i wideo na żywo za pośrednictwem jednego punktu wejścia zgodnego z repozytorium
  - Automatycznie wczytuje brakujące zmienne środowiskowe dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy mają obecnie użyteczne dane uwierzytelniające
- Flagi:
  - `--providers <csv>` — globalny filtr dostawców; `--image-providers` / `--music-providers` / `--video-providers` ograniczają filtr do jednego zestawu
  - `--all-providers` pomija automatyczne filtrowanie na podstawie uwierzytelniania
  - `--allow-empty` kończy działanie z kodem `0`, gdy po filtrowaniu nie pozostają żadni dostawcy możliwi do uruchomienia
  - `--quiet` / `--no-quiet` są przekazywane do `test:live`
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) — zestawy testów jednostkowych, integracyjnych, QA i Docker
