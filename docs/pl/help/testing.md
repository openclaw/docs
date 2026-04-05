---
read_when:
    - Uruchamiasz testy lokalnie lub w CI
    - Dodajesz regresje dla błędów modeli/providerów
    - Debugujesz zachowanie gateway + agenta
summary: 'Zestaw testów: pakiety unit/e2e/live, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-05T13:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854a39ae261d8749b8d8d82097b97a7c52cf2216d1fe622e302d830a888866ab
    source_path: help/testing.md
    workflow: 15
---

# Testowanie

OpenClaw ma trzy pakiety Vitest (unit/integration, e2e, live) oraz niewielki zestaw runnerów Docker.

Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy pakiet (i czego celowo _nie_ obejmuje)
- Jakie polecenia uruchamiać dla typowych przepływów pracy (lokalnie, przed push, debugowanie)
- Jak testy live wykrywają dane uwierzytelniające i wybierają modele/providery
- Jak dodawać regresje dla rzeczywistych problemów z modelami/providerami

## Szybki start

Na co dzień:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm test`
- Szybsze lokalne uruchomienie pełnego pakietu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest (nowoczesna konfiguracja projektów): `pnpm test:watch`
- Bezpośrednie targetowanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Gdy dotykasz testów lub chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Pakiet E2E: `pnpm test:e2e`

Gdy debugujesz rzeczywistych providerów/modele (wymaga prawdziwych danych uwierzytelniających):

- Pakiet live (modele + sondy narzędzi/obrazów gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Wskazówka: gdy potrzebujesz tylko jednego nieudanego przypadku, zawężaj testy live za pomocą zmiennych env allowlisty opisanych poniżej.

## Pakiety testów (co działa gdzie)

Myśl o pakietach jako o „rosnącym realizmie” (i rosnącej niestabilności/koszcie):

### Unit / integration (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: natywne `projects` Vitest przez `vitest.config.ts`
- Pliki: główne zbiory unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dozwolone testy węzłowe `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne in-process (uwierzytelnianie gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamiane w CI
  - Nie wymagają prawdziwych kluczy
  - Powinny być szybkie i stabilne
- Uwaga o projektach:
  - `pnpm test`, `pnpm test:watch` i `pnpm test:changed` korzystają teraz z tej samej natywnej konfiguracji głównych `projects` Vitest.
  - Bezpośrednie filtry plików przechodzą natywnie przez główny graf projektów, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` działa bez niestandardowego wrappera.
- Uwaga o osadzonym runnerze:
  - Gdy zmieniasz wejścia wykrywania message-tool lub kontekst runtime kompaktowania,
    utrzymuj oba poziomy pokrycia.
  - Dodawaj skupione regresje pomocnicze dla czystych granic routingu/normalizacji.
  - Utrzymuj też w dobrym stanie pakiety integracyjne osadzonego runnera:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Te pakiety weryfikują, że ograniczone identyfikatory i zachowanie kompaktowania nadal przechodzą
    przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocnicze nie są
    wystarczającym zamiennikiem tych ścieżek integracyjnych.
- Uwaga o puli:
  - Bazowa konfiguracja Vitest domyślnie używa teraz `threads`.
  - Współdzielona konfiguracja Vitest ustawia też `isolate: false` i używa runnera bez izolacji w głównych projektach, konfiguracjach e2e i live.
  - Główna ścieżka UI zachowuje konfigurację `jsdom` i optymalizator, ale teraz również działa na współdzielonym runnerze bez izolacji.
  - `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false` z głównej konfiguracji `projects` w `vitest.config.ts`.
  - Współdzielony launcher `scripts/run-vitest.mjs` domyślnie dodaje teraz także `--no-maglev` dla podrzędnych procesów Node Vitest, aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, jeśli chcesz porównać działanie ze standardowym V8.
- Uwaga o szybkiej iteracji lokalnej:
  - `pnpm test:changed` uruchamia natywną konfigurację projektów z `--changed origin/main`.
  - `pnpm test:max` i `pnpm test:changed:max` zachowują tę samą natywną konfigurację projektów, tylko z wyższym limitem workerów.
  - Lokalne autoskalowanie workerów jest teraz celowo zachowawcze i dodatkowo wycofuje się, gdy średnie obciążenie hosta jest już wysokie, dzięki czemu wiele równoległych uruchomień Vitest domyślnie powoduje mniej szkód.
  - Bazowa konfiguracja Vitest oznacza pliki projektów/konfiguracji jako `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostawały poprawne przy zmianach okablowania testów.
  - Konfiguracja pozostawia włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz mieć jedną jawną lokalizację cache do bezpośredniego profilowania.
- Uwaga o debugowaniu wydajności:
  - `pnpm test:perf:imports` włącza raportowanie czasu importu Vitest oraz dane wyjściowe z podziałem importów.
  - `pnpm test:perf:imports:changed` ogranicza ten sam widok profilowania do plików zmienionych od `origin/main`.
  - `pnpm test:perf:profile:main` zapisuje profil CPU wątku głównego dla narzutu startu i transformacji Vitest/Vite.
  - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla pakietu unit przy wyłączonej równoległości plików.

### E2E (smoke gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Domyślne ustawienia runtime:
  - Używa `threads` Vitest z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` wymusza liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1` ponownie włącza szczegółowe dane wyjściowe konsoli.
- Zakres:
  - Zachowanie end-to-end gateway w wielu instancjach
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższa komunikacja sieciowa
- Oczekiwania:
  - Uruchamiane w CI (gdy są włączone w pipeline)
  - Nie wymagają prawdziwych kluczy
  - Mają więcej ruchomych części niż testy jednostkowe (mogą być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `test/openshell-sandbox.e2e.test.ts`
- Zakres:
  - Uruchamia odizolowany gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + SSH exec
  - Weryfikuje zachowanie zdalnego kanonicznego systemu plików przez most fs sandbox
- Oczekiwania:
  - Wyłącznie opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa odizolowanego `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1` włącza test podczas ręcznego uruchamiania szerszego pakietu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` wskazuje niestandardową binarkę CLI lub skrypt wrappera

### Live (prawdziwi providerzy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten provider/model rzeczywiście działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wyłapuje zmiany formatu u providera, osobliwości wywoływania narzędzi, problemy z auth i zachowanie limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki providerów, limity, awarie)
  - Kosztują pieniądze / zużywają limity szybkości
  - Lepiej uruchamiać zawężone podzbiory niż „wszystko”
- Uruchomienia live pobierają `~/.profile`, aby dobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują konfigurację/materiały auth do tymczasowego katalogu testowego home, aby fixture’y unit nie mogły modyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, aby testy live używały Twojego prawdziwego katalogu home.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje dane wyjściowe postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi bootstrapu gateway / szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz z powrotem pełne logi startowe.
- Rotacja kluczy API (specyficzna dla providera): ustaw `*_API_KEYS` w formacie rozdzielanym przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) lub nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach z limitem szybkości.
- Dane wyjściowe postępu/heartbeat:
  - Pakiety live emitują teraz linie postępu do stderr, dzięki czemu długie wywołania do providerów są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli przez Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli przez Vitest, dzięki czemu linie postępu provider/gateway są natychmiast strumieniowane podczas uruchomień live.
  - Dostosuj heartbeat modeli bezpośrednich przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj heartbeat gateway/sond przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet powinienem uruchomić?

Użyj tej tabeli decyzji:

- Edytujesz logikę/testy: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykasz komunikacji sieciowej gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugujesz „mój bot nie działa” / błędy specyficzne dla providera / wywoływanie narzędzi: uruchom zawężone `pnpm test:live`

## Live: przegląd możliwości węzła Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde aktualnie ogłaszane polecenie** z podłączonego węzła Android i potwierdzić zachowanie kontraktu poleceń.
- Zakres:
  - Ręczne przygotowanie jako warunek wstępny (pakiet nie instaluje/nie uruchamia/nie paruje aplikacji).
  - Walidacja `node.invoke` gateway polecenie po poleceniu dla wybranego węzła Android.
- Wymagane przygotowanie:
  - Aplikacja Android jest już podłączona i sparowana z gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgody na przechwytywanie zostały przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Android App](/platforms/android)

## Live: smoke modeli (klucze profili)

Testy live są podzielone na dwie warstwy, aby łatwiej izolować awarie:

- „Direct model” mówi nam, czy provider/model w ogóle potrafi odpowiedzieć przy danym kluczu.
- „Gateway smoke” mówi nam, czy cały pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandbox itp.).

### Warstwa 1: bezpośrednie completion modelu (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, do których masz dane uwierzytelniające
  - Uruchomić małe completion dla każdego modelu (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby rzeczywiście uruchomić ten pakiet; w przeciwnym razie zostanie pominięty, aby `pnpm test:live` pozostawało skupione na smoke gateway
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlistę (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlista rozdzielana przecinkami)
- Jak wybierać providerów:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlista rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API providera jest zepsute / klucz jest nieprawidłowy” od „pipeline agenta gateway jest zepsuty”
  - Zawiera małe, izolowane regresje (na przykład OpenAI Responses/Codex Responses reasoning replay + przepływy tool-call)

### Warstwa 2: smoke gateway + agenta dev (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić gateway in-process
  - Utworzyć/zaaktualizować sesję `agent:dev:*` (nadpisanie modelu dla każdego uruchomienia)
  - Iterować po modelach-z-kluczami i potwierdzać:
    - „sensowną” odpowiedź (bez narzędzi)
    - działanie prawdziwego wywołania narzędzia (sonda odczytu)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - dalsze działanie ścieżek regresji OpenAI (tylko tool-call → follow-up)
- Szczegóły sond (aby można było szybko wyjaśniać awarie):
  - sonda `read`: test zapisuje plik z nonce w obszarze roboczym i prosi agenta o jego `read` oraz odesłanie nonce.
  - sonda `exec+read`: test prosi agenta o zapisanie nonce przez `exec` do pliku tymczasowego, a następnie o jego odczyt przez `read`.
  - sonda obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Dokumentacja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlista (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - Lub ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (albo listę rozdzielaną przecinkami), aby zawęzić
- Jak wybierać providerów (unikaj „wszystko z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlista rozdzielana przecinkami)
- Sondy narzędzi + obrazów są zawsze włączone w tym teście live:
  - sonda `read` + sonda `exec+read` (obciążenie narzędzi)
  - sonda obrazu uruchamia się, gdy model deklaruje obsługę wejścia obrazu
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje do modelu multimodalną wiadomość użytkownika
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dozwolone)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (oraz dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude CLI lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować pipeline Gateway + agent z użyciem lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Włączenie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne ustawienia:
  - Model: `claude-cli/claude-sonnet-4-6`
  - Polecenie: `claude`
  - Argumenty: `["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]`
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać prawdziwy załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazu jako argumenty CLI zamiast przez wstrzyknięcie do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ resume.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`, aby pozostawić konfigurację MCP Claude CLI włączoną (domyślnie wstrzykiwany jest tymczasowy, ścisły pusty `--mcp-config`, aby globalne/otoczeniowe serwery MCP pozostawały wyłączone podczas smoke).

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repozytorium jako nie-rootowy użytkownik `node`, ponieważ Claude CLI odrzuca `bypassPermissions`, gdy jest uruchamiany jako root.
- Dla `claude-cli` instaluje linuxowy pakiet `@anthropic-ai/claude-code` do zapisywalnego prefiksu cache w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- Dla `claude-cli` smoke live wstrzykuje ścisłą pustą konfigurację MCP, chyba że ustawisz `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`.
- Kopiuje `~/.claude` do kontenera, gdy jest dostępne, ale na maszynach, gdzie auth Claude opiera się na `ANTHROPIC_API_KEY`, zachowuje też `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_OLD` dla podrzędnego Claude CLI przez `OPENCLAW_LIVE_CLI_BACKEND_PRESERVE_ENV`.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ conversation-bind ACP z agentem ACP live:
  - wyślij `/acp spawn <agent> --bind here`
  - przypnij syntetyczną konwersację kanału wiadomości w miejscu
  - wyślij zwykły follow-up na tej samej konwersacji
  - zweryfikuj, że follow-up trafia do transkryptu powiązanej sesji ACP
- Włączenie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne ustawienia:
  - Agent ACP: `claude`
  - Kanał syntetyczny: kontekst rozmowy w stylu Slack DM
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`
- Uwagi:
  - Ta ścieżka używa powierzchni `chat.send` gateway z syntetycznymi polami originating-route dostępnymi tylko dla administratora, dzięki czemu testy mogą dołączać kontekst kanału wiadomości bez udawania zewnętrznego dostarczania.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND` nie jest ustawione, test używa skonfigurowanego/wbudowanego polecenia acpx. Jeśli auth Twojego harness zależy od zmiennych env z `~/.profile`, preferuj niestandardowe polecenie `acpx`, które zachowuje env providera.

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

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Pobiera `~/.profile`, kopiuje odpowiedni katalog auth CLI (`~/.claude` lub `~/.codex`) do kontenera, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje żądane live CLI (`@anthropic-ai/claude-code` lub `@openai/codex`), jeśli go brakuje.
- W Docker runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, dzięki czemu acpx zachowuje zmienne env providera z pobranego profilu dostępne dla podrzędnego CLI harness.

### Zalecane recepty live

Wąskie, jawne allowlisty są najszybsze i najmniej zawodne:

- Jeden model, bezpośrednio (bez gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Jeden model, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi przez kilku providerów:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twojej maszynie (osobne auth + osobliwości narzędzi).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane API Gemini Google przez HTTP (klucz API / auth profilu); to zwykle właśnie użytkownicy mają na myśli mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalną binarkę `gemini`; ma własne auth i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazdy wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego pokrywania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest uruchomienie „popularnych modeli”, które powinno stale działać:

- OpenAI (nie-Codex): `openai/gpt-5.4` (opcjonalnie: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Bazowy zestaw: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden model z każdej rodziny providerów:

- OpenAI: `openai/gpt-5.4` (lub `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model obsługujący „tools”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij przynajmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/warianty OpenAI z obsługą vision itp.), aby przetestować sondę obrazu.

### Agregatory / alternatywne gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących tools+image)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (auth przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej providerów, których możesz użyć w macierzy live (jeśli masz dane uwierzytelniające/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (własne endpointy): `minimax` (cloud/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itp.)

Wskazówka: nie próbuj wpisywać na sztywno „wszystkich modeli” w dokumentacji. Autorytatywna lista to to, co zwraca `discoverModels(...)` na Twojej maszynie + dostępne klucze.

## Dane uwierzytelniające (nigdy nie commituj)

Testy live wykrywają dane uwierzytelniające tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli działa CLI, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „brak danych uwierzytelniających”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile auth dla poszczególnych agentów: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „klucze profili” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu home live, jeśli istnieje, ale nie jest głównym magazynem kluczy profili)
- Lokalnie uruchamiane testy live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` poszczególnych agentów, starsze `credentials/` oraz obsługiwane zewnętrzne katalogi auth CLI do tymczasowego katalogu testowego home; nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane w tej przygotowanej konfiguracji, aby sondy nie dotykały prawdziwego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach env (na przykład wyeksportowanych w `~/.profile`), uruchamiaj lokalne testy po `source ~/.profile` albo użyj runnerów Docker poniżej (mogą montować `~/.profile` do kontenera).

## Deepgram live (transkrypcja audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Włączenie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Włączenie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Image generation live

- Test: `src/image-generation/runtime.live.test.ts`
- Polecenie: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Zakres:
  - Wylicza każdą zarejestrowaną wtyczkę providera generowania obrazów
  - Przed sondowaniem ładuje brakujące zmienne env providera z login shell (`~/.profile`)
  - Domyślnie preferuje klucze API live/env zamiast zapisanych profili auth, dzięki czemu nieaktualne testowe klucze w `auth-profiles.json` nie maskują prawdziwych danych powłoki
  - Pomija providerów bez użytecznego auth/profilu/modelu
  - Uruchamia standardowe warianty generowania obrazów przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktualnie objęci wbudowani providerzy:
  - `openai`
  - `google`
- Opcjonalne zawężenie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko z env

## Runnery Docker (opcjonalne kontrole typu „działa na Linuxie”)

Te runnery Docker dzielą się na dwa zbiory:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczami profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i obszar roboczy (oraz pobierając `~/.profile`, jeśli jest zamontowane). Odpowiadające lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie mają mniejszy limit smoke, aby pełny przegląd Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  celowo chcesz większy, wyczerpujący skan.
- `test:docker:all` buduje obraz live Docker raz przez `test:docker:live-build`, a następnie używa go ponownie dla dwóch ścieżek Docker live.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` i `test:docker:plugins` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracyjne wyższego poziomu.

Runnery modeli live Docker również montują bind tylko potrzebnych katalogów auth CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu home kontenera przed uruchomieniem, aby zewnętrzne OAuth CLI mogło odświeżać tokeny bez modyfikowania magazynu auth hosta:

- Bezpośrednie modele: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Sieć gateway (dwa kontenery, uwierzytelnianie WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Most kanałów MCP (przygotowany Gateway + most stdio + surowy smoke ramek powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)

Runnery modeli live Docker również montują bieżące checkout repozytorium tylko do odczytu i
przygotowują je do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje mały, a Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Ustawiają także `OPENCLAW_SKIP_CHANNELS=1`, aby sondy gateway live nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż też
`OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić lub wykluczyć pokrycie gateway
live z tej ścieżki Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia
kontener gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` ujawnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować ukończyć własny zimny start.
Ta ścieżka oczekuje użytecznego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyslnie `~/.profile`) jest podstawowym sposobem jego dostarczenia w uruchomieniach z Dockerem.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczne i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia przygotowany kontener
Gateway, startuje drugi kontener, który uruchamia `openclaw mcp serve`, a następnie
weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia kanału + uprawnień
w stylu Claude przez prawdziwy most stdio MCP. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki stdio MCP, dzięki czemu smoke waliduje to, co most
faktycznie emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.

Ręczny smoke wątku ACP w plain language (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być znowu potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi auth CLI w `$HOME` są montowane tylko do odczytu pod `/host-auth/...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślnie: montowane są wszystkie obsługiwane katalogi (`.codex`, `.claude`, `.minimax`)
  - Zawężone uruchomienia providerów montują tylko potrzebne katalogi wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ręczne nadpisanie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listę rozdzielaną przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować providerów w kontenerze
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić pobieranie danych uwierzytelniających z magazynu profili (a nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model ujawniany przez gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Sprawdzenie dokumentacji

Po edycji dokumentacji uruchom kontrole dokumentacji: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz też kontroli nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To regresje „prawdziwego pipeline” bez prawdziwych providerów:

- Wywoływanie narzędzi gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator gateway (WS `wizard.start`/`wizard.next`, zapisuje config + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewalucje niezawodności agentów (Skills)

Mamy już kilka testów bezpiecznych dla CI, które działają jak „evale niezawodności agentów”:

- Mockowane wywoływanie narzędzi przez prawdziwy gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwą Skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które potwierdzają kolejność narzędzi, przenoszenie historii sesji i granice sandbox.

Przyszłe evale powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mock providerów do potwierdzania wywołań narzędzi + ich kolejności, odczytów plików Skill i okablowania sesji.
- Mały pakiet scenariuszy skoncentrowanych na Skills (użyj vs unikaj, gating, prompt injection).
- Opcjonalne evale live (opt-in, sterowane env) dopiero po wdrożeniu pakietu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginów i kanałów)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub providerów.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty providerów: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt pluginu (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa identyfikatorów wątków
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grup

### Kontrakty statusu providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru pluginów

### Kontrakty providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie pluginów
- **loader** - Ładowanie pluginów
- **runtime** - Runtime providera
- **shape** - Kształt/interfejs pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub subścieżek plugin-sdk
- Po dodaniu lub modyfikacji pluginu kanału albo providera
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe są uruchamiane w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty w live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (provider mock/stub albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury da się to sprawdzić tylko live (limity szybkości, polityki auth), utrzymaj test live wąski i opt-in przez zmienne env
- Preferuj celowanie w najmniejszą warstwę, która wyłapuje błąd:
  - błąd konwersji/odtwarzania żądania providera → test modeli bezpośrednich
  - błąd pipeline sesji/historii/narzędzi gateway → smoke gateway live albo bezpieczny dla CI test mock gateway
- Ograniczenie ochronne dla przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel dla każdej klasy SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie potwierdza, że identyfikatory exec z segmentami traversal są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem przy niesklasyfikowanych identyfikatorach celów, aby nowe klasy nie mogły zostać cicho pominięte.
