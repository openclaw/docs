---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie działania Gateway i agenta
summary: 'Zestaw testowy: testy jednostkowe/e2e/live, środowiska uruchomieniowe Docker i zakres poszczególnych testów'
title: Testowanie
x-i18n:
    generated_at: "2026-07-12T15:12:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (jednostkowe/integracyjne, e2e i live) oraz mechanizmy uruchamiające Docker. Ta strona opisuje zakres każdego zestawu, polecenia odpowiednie dla poszczególnych przepływów pracy, sposób wykrywania danych uwierzytelniających przez testy live oraz dodawanie testów regresji dla rzeczywistych błędów dostawców i modeli.

<Note>
**Stos QA (qa-lab, qa-channel, ścieżki transportowe live)** opisano oddzielnie:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — architektura, zestaw poleceń i tworzenie scenariuszy.
- [Macierz QA](/pl/concepts/qa-matrix) — dokumentacja referencyjna polecenia `pnpm openclaw qa matrix`.
- [Karta oceny dojrzałości](/pl/maturity/scorecard) — sposób, w jaki dowody QA wydania wspierają decyzje dotyczące stabilności i LTS.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny plugin transportowy używany przez scenariusze oparte na repozytorium.

Ta strona opisuje standardowe zestawy testów oraz mechanizmy uruchamiające Docker/Parallels. Sekcja [Mechanizmy uruchamiające przeznaczone dla QA](#qa-specific-runners) poniżej zawiera konkretne wywołania `qa` i odsyła do powyższej dokumentacji.
</Note>

## Szybki start

W większości przypadków:

- Pełna bramka (oczekiwana przed wysłaniem zmian): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużą ilością zasobów: `pnpm test:max`
- Bezpośrednia pętla obserwowania zmian Vitest: `pnpm test:watch`
- Bezpośrednie wskazanie pliku obsługuje również ścieżki pluginów/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Podczas pracy nad pojedynczym błędem najpierw wybieraj ukierunkowane uruchomienia.
- Środowisko QA oparte na Dockerze: `pnpm qa:lab:up`
- Ścieżka QA oparta na maszynie wirtualnej z systemem Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy modyfikujesz testy lub potrzebujesz większej pewności:

- Informacyjny raport pokrycia V8: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

## Katalogi tymczasowe testów

Używaj współdzielonych funkcji pomocniczych z `test/helpers/temp-dir.ts` dla należących do testów katalogów tymczasowych, aby własność była jednoznaczna, a sprzątanie pozostawało częścią cyklu życia testu:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` celowo nie udostępnia ręcznej metody sprzątania — Vitest odpowiada za sprzątanie po każdym teście. Starsze funkcje pomocnicze niższego poziomu (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) nadal istnieją dla testów, które nie zostały jeszcze zmigrowane; unikaj ich w nowym kodzie oraz nowych bezpośrednich wywołań `fs.mkdtemp*`, chyba że test jawnie sprawdza podstawowe zachowanie katalogu tymczasowego. Gdy bezpośrednio utworzony katalog tymczasowy jest rzeczywiście potrzebny, dodaj możliwy do skontrolowania komentarz zezwalający wraz z uzasadnieniem:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` raportuje nowe bezpośrednie tworzenie katalogów tymczasowych oraz nowe przypadki ręcznego użycia współdzielonych funkcji pomocniczych w dodanych wierszach różnic, bez blokowania istniejących sposobów sprzątania. Stosuje tę samą klasyfikację ścieżek testów co `scripts/changed-lanes.mjs` i pomija samą implementację współdzielonej funkcji pomocniczej. `check:changed` uruchamia ten raport dla zmienionych ścieżek testów jako sygnał CI zawierający wyłącznie ostrzeżenia (adnotacje ostrzegawcze GitHub, a nie błędy).

## Przepływy pracy live i Docker/Parallels

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych danych uwierzytelniających):

- Zestaw live (modele oraz sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności środowiska uruchomieniowego: uruchom `OpenClaw Performance` z `live_openai_candidate=true`, aby wykonać rzeczywistą turę agenta `openai/gpt-5.6-luna`, albo z `deep_profile=true`, aby uzyskać artefakty procesora, sterty i śledzenia Kova. Codzienne zaplanowane uruchomienia publikują raporty ścieżek fikcyjnego dostawcy, profilowania szczegółowego oraz GPT-5.6 Luna w `openclaw/clawgrit-reports` za pomocą oddzielnego zadania publikującego, które przetwarza artefakty; brakujące lub nieprawidłowe uwierzytelnienie publikatora powoduje niepowodzenie uruchomień zaplanowanych oraz uruchomień z `profile=release`. Ręczne uruchomienia niebędące wydaniami zachowują artefakty GitHub i traktują publikację raportu jako opcjonalną. Raport fikcyjnego dostawcy zawiera również pomiary uruchamiania Gateway na poziomie kodu źródłowego, pamięci, obciążenia pluginami, powtarzanej pętli powitalnej fikcyjnego modelu oraz uruchamiania CLI.
- Przegląd modeli live w Dockerze: `pnpm test:docker:live-models`
  - Każdy wybrany model wykonuje turę tekstową oraz niewielką sondę przypominającą odczyt pliku. Modele, których metadane deklarują wejście `image`, wykonują również niewielką turę z obrazem. Podczas izolowania awarii dostawcy wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`.
  - Pokrycie CI: codzienny przepływ `OpenClaw Scheduled Live And E2E Checks` oraz ręczny `OpenClaw Release Checks` wywołują wielokrotnego użytku przepływ live/E2E z `include_live_suites: true`, który obejmuje zadania macierzy modeli live w Dockerze podzielone na fragmenty według dostawcy.
  - Aby wykonać ukierunkowane ponowne uruchomienie CI, uruchom `OpenClaw Live And E2E Checks (Reusable)` z `include_live_suites: true` i `live_models_only: true`.
  - Dodawaj nowe sekrety dostawców o wysokiej wartości diagnostycznej do `scripts/ci-hydrate-live-auth.sh`, `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` oraz wywołujących go przepływów zaplanowanych i wydaniowych.
- Test dymny natywnego powiązanego czatu Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia ścieżkę live w Dockerze względem ścieżki serwera aplikacji Codex, wiąże syntetyczną wiadomość prywatną Slack poleceniem `/codex bind`, sprawdza `/codex fast` i `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź oraz załącznik graficzny są kierowane przez natywne powiązanie pluginu zamiast przez ACP.
- Test dymny środowiska testowego serwera aplikacji Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należące do pluginu środowisko testowe serwera aplikacji Codex, weryfikuje `/codex status` i `/codex models`, a domyślnie sprawdza sondy obrazu, MCP Cron, podagenta oraz Guardian. Podczas izolowania innych awarii wyłącz sondę podagenta za pomocą `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`. Aby wykonać ukierunkowaną kontrolę podagenta, wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Proces kończy się po sondzie podagenta, chyba że ustawiono `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Test dymny instalacji Codex na żądanie: `pnpm test:docker:codex-on-demand`
  - Instaluje spakowane archiwum OpenClaw w Dockerze, przeprowadza konfigurację początkową z kluczem API OpenAI i sprawdza, czy plugin Codex oraz zależność `@openai/codex` zostały na żądanie pobrane do katalogu głównego zarządzanego projektu npm.
- Test dymny zależności narzędzia pluginu live: `pnpm test:docker:live-plugin-tool`
  - Pakuje plugin testowy z rzeczywistą zależnością `slugify`, instaluje go przez `npm-pack:`, weryfikuje zależność w katalogu głównym zarządzanego projektu npm, a następnie prosi model OpenAI live o wywołanie narzędzia pluginu i zwrócenie ukrytego uproszczonego identyfikatora.
- Test dymny polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalna, redundantna kontrola zestawu poleceń ratunkowych kanału wiadomości. Sprawdza `/crestodian status`, umieszcza trwałą zmianę modelu w kolejce, odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Test dymny pierwszego uruchomienia Crestodian w Dockerze: `pnpm test:docker:crestodian-first-run`
  - Rozpoczyna od pustego katalogu stanu OpenClaw i najpierw potwierdza, że spakowane polecenie CLI `openclaw crestodian` bezpiecznie odmawia działania bez inferencji. Następnie testuje i aktywuje fikcyjny model Claude za pomocą spakowanego modułu aktywacji. Dopiero później nieprecyzyjne żądanie spakowanego CLI dociera do planera i zostaje przekształcone w typowaną konfigurację, po której następują jednorazowe operacje na modelu, agencie, pluginie Discord i SecretRef. Test weryfikuje konfigurację oraz wpisy audytu. Jest to pomocniczy dowód działania bramki i operacji, a nie dowód interaktywnej konfiguracji początkowej ani działania agenta, narzędzia lub zatwierdzania Crestodian. Ta sama ścieżka jest dostępna w QA Lab przez `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Test dymny kosztów Moonshot/Kimi: po ustawieniu `MOONSHOT_API_KEY` uruchom `openclaw models list --provider moonshot --json`, a następnie wykonaj izolowane polecenie `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` względem `moonshot/kimi-k2.6`. Sprawdź, czy dane JSON wskazują Moonshot/K2.6, a transkrypcja asystenta przechowuje znormalizowane `usage.cost`.

<Tip>
Jeśli potrzebujesz tylko jednego przypadku zakończonego niepowodzeniem, zawężaj testy live za pomocą opisanych poniżej zmiennych środowiskowych listy dozwolonych wartości.
</Tip>

## Mechanizmy uruchamiające przeznaczone dla QA

Te polecenia uzupełniają główne zestawy testów, gdy potrzebujesz realizmu środowiska QA Lab.

CI uruchamia QA Lab w dedykowanych przepływach pracy. Zgodność agentowa jest częścią `QA-Lab - All Lanes` oraz walidacji wydania, a nie osobnego przepływu pracy PR. Szeroka walidacja powinna używać `Full Release Validation` z `rerun_group=qa-parity` albo grupy QA kontroli wydania. Kontrole wydania stabilnego/domyślnego pozostawiają wyczerpujące długotrwałe testy live/Docker za opcją `run_release_soak=true`; profil `full` wymusza ich włączenie. `QA-Lab - All Lanes` uruchamia się każdej nocy na `main` oraz ręcznie, wykonując równolegle ścieżkę zgodności z fikcyjnym dostawcą, ścieżkę Matrix live, zarządzaną przez Convex ścieżkę Telegram live oraz zarządzaną przez Convex ścieżkę Discord live. Zaplanowane QA i kontrole wydania jawnie przekazują do Matrix opcję `--profile fast`, natomiast domyślną wartością CLI Matrix i ręcznego wejścia przepływu pracy pozostaje `all`; ręczne uruchomienie może podzielić `all` na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release Checks` uruchamia sprawdzenie zgodności oraz szybkie ścieżki Matrix i Telegram przed zatwierdzeniem wydania, używając `mock-openai/gpt-5.6-luna` do wydaniowych kontroli transportu, dzięki czemu pozostają deterministyczne i unikają standardowego uruchamiania pluginu dostawcy. Te bramy transportowe live wyłączają wyszukiwanie w pamięci; zachowanie pamięci pozostaje objęte zestawami zgodności QA.

Fragmenty multimediów live pełnego wydania używają `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który zawiera już `ffmpeg` i `ffprobe`. Fragmenty modeli/zaplecza live w Dockerze używają współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>`, budowanego raz dla każdego wybranego commitu, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać go wewnątrz każdego fragmentu.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze kontroli jakości oparte na repozytorium bezpośrednio na hoście.
  - Zapisuje artefakty najwyższego poziomu `qa-evidence.json`, `qa-suite-summary.json` oraz
    `qa-suite-report.md` dla wybranego zestawu scenariuszy, w tym
    wybrane scenariusze przepływów mieszanych, Vitest i Playwright.
  - Po uruchomieniu przez `pnpm openclaw qa run --qa-profile <profile>` osadza
    kartę wyników wybranego profilu taksonomii w tym samym pliku `qa-evidence.json`.
    `smoke-ci` zapisuje uproszczone dowody (`evidenceMode: "slim"`, bez
    `execution` dla poszczególnych wpisów). `release` obejmuje wyselekcjonowany zakres
    gotowości do wydania; `all` wybiera wszystkie aktywne kategorie dojrzałości
    i jest przeznaczony do jawnego uruchamiania przepływu pracy QA Profile
    Evidence, gdy potrzebny jest pełny artefakt karty wyników.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle przy użyciu
    izolowanych procesów roboczych Gateway. Dla `qa-channel` domyślna współbieżność
    wynosi 4 (ograniczona liczbą wybranych scenariuszy). Użyj
    `--concurrency <count>`, aby dostosować liczbę procesów roboczych, albo
    `--concurrency 1`, aby użyć starszej ścieżki szeregowej.
  - Kończy działanie kodem różnym od zera, jeśli którykolwiek scenariusz zakończy się niepowodzeniem. Użyj
    `--allow-failures`, aby uzyskać artefakty bez kodu zakończenia oznaczającego błąd.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` oraz `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock w celu
    eksperymentalnego testowania fikstur i atrap protokołu bez zastępowania
    ścieżki `mock-openai` uwzględniającej scenariusze.
- `pnpm openclaw qa coverage --match <query>`
  - Przeszukuje identyfikatory i tytuły scenariuszy, powierzchnie, identyfikatory pokrycia, odwołania
    do dokumentacji i kodu, pluginy oraz wymagania dostawców, a następnie wyświetla
    pasujące cele zestawów testów.
  - Użyj tego przed uruchomieniem QA Lab, gdy znasz zmieniane zachowanie lub ścieżkę
    pliku, ale nie znasz najmniejszego odpowiedniego scenariusza. Wynik ma wyłącznie charakter doradczy —
    nadal wybierz dowód oparty na atrapach, środowisku rzeczywistym, Multipass, Matrix lub transporcie
    zgodnie ze zmienianym zachowaniem.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia pełny zestaw rzeczywistych testów pluginu OpenAI Kitchen Sink za pośrednictwem QA Lab.
    Instaluje zewnętrzny pakiet Kitchen Sink, weryfikuje spis powierzchni SDK
    pluginu, sonduje `/healthz` i `/readyz`, rejestruje dowody dotyczące
    CPU/RSS Gateway, wykonuje rzeczywistą turę OpenAI i sprawdza diagnostykę
    w warunkach wrogich. Wymaga rzeczywistych danych uwierzytelniających OpenAI, takich jak
    `OPENAI_API_KEY`. W przygotowanych sesjach Testbox automatycznie wczytuje
    profil rzeczywistego uwierzytelniania Testbox, gdy dostępny jest pomocnik
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia test wydajności uruchamiania Gateway wraz z małym zestawem scenariuszy QA Lab opartych na atrapach
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji
    CPU w katalogu `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie oznacza tylko utrzymujące się wysokie użycie CPU (`--cpu-core-warn`,
    domyślnie `0.9`; `--hot-wall-warn-ms`, domyślnie `30000`), dzięki czemu krótkie
    skoki podczas uruchamiania są rejestrowane jako metryki, ale nie wyglądają jak
    regresja powodująca wielominutowe maksymalne obciążenie Gateway.
  - Działa na zbudowanych artefaktach `dist`; najpierw uruchom kompilację, jeśli
    kopia robocza nie zawiera jeszcze aktualnych wyników środowiska uruchomieniowego.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw testów kontroli jakości wewnątrz jednorazowej maszyny wirtualnej Multipass z systemem Linux,
    zachowując te same flagi wyboru scenariuszy oraz dostawcy/modelu co `qa suite`.
  - Rzeczywiste uruchomienia przekazują dane uwierzytelniające QA, które mogą być użyte
    w systemie gościa: klucze dostawców oparte na zmiennych środowiskowych, ścieżkę konfiguracji
    rzeczywistego dostawcy QA oraz `CODEX_HOME`, jeśli jest dostępna.
  - Katalogi wyjściowe muszą znajdować się w katalogu głównym repozytorium, aby system gościa
    mógł zapisywać wyniki przez zamontowaną przestrzeń roboczą.
  - Zapisuje standardowy raport i podsumowanie QA oraz dzienniki Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia witrynę QA opartą na Dockerze do pracy kontrolnej w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje archiwum npm z bieżącej kopii roboczej, instaluje je globalnie w
    Dockerze, wykonuje nieinteraktywną konfigurację początkową z kluczem API OpenAI,
    domyślnie konfiguruje Telegram, sprawdza, czy środowisko uruchomieniowe spakowanego
    pluginu ładuje się bez naprawiania zależności podczas uruchamiania, uruchamia doctor
    i wykonuje jedną lokalną turę agenta z atrapą punktu końcowego OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę
    instalacji pakietu z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny test dymny zbudowanej aplikacji w Dockerze dla transkrypcji
    osadzonego kontekstu środowiska uruchomieniowego. Sprawdza, czy ukryty kontekst środowiska
    uruchomieniowego OpenClaw jest zachowywany jako niewyświetlana wiadomość niestandardowa,
    zamiast przedostawać się do widocznej tury użytkownika, a następnie umieszcza uszkodzony
    plik JSONL sesji dotkniętej problemem i sprawdza, czy `openclaw doctor --fix`
    przepisuje go do aktywnej gałęzi oraz tworzy kopię zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydujący pakiet OpenClaw w Dockerze, wykonuje konfigurację początkową
    zainstalowanego pakietu, konfiguruje Telegram za pomocą zainstalowanego CLI,
    a następnie ponownie wykorzystuje rzeczywistą ścieżkę QA Telegram z tym
    zainstalowanym pakietem jako testowanym Gateway.
  - Skrypt opakowujący montuje z kopii roboczej wyłącznie kod zestawu testowego `qa-lab`;
    zainstalowany pakiet jest właścicielem `dist`, `openclaw/plugin-sdk` oraz
    środowiska uruchomieniowego dołączonych pluginów, dzięki czemu ścieżka nie miesza pluginów
    z bieżącej kopii roboczej z testowanym pakietem.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` lub
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby zamiast instalacji z rejestru przetestować
    rozpoznane lokalne archiwum.
  - Domyślnie zapisuje wielokrotne pomiary RTT w `qa-evidence.json` z
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Zmień
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` lub
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostosować uruchomienie.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` przyjmuje rozdzielaną przecinkami listę
    identyfikatorów kontroli QA Telegram do próbkowania; jeśli nie jest ustawiona,
    domyślną kontrolą obsługującą RTT jest `telegram-mentioned-message-reply`.
  - Używa tych samych danych uwierzytelniających Telegram ze zmiennych środowiskowych lub źródła
    danych uwierzytelniających Convex co `pnpm openclaw qa telegram`. Na potrzeby automatyzacji
    CI/wydania ustaw `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` wraz z
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekretem roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są dostępne w
    CI, skrypt opakowujący Dockera automatycznie wybiera Convex.
  - Skrypt opakowujący sprawdza na hoście zmienne środowiskowe danych uwierzytelniających Telegram
    lub Convex przed rozpoczęciem budowania i instalacji w Dockerze. Ustaw
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` tylko podczas
    świadomego debugowania konfiguracji poprzedzającej udostępnienie danych uwierzytelniających.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` zastępuje
    współdzielone `OPENCLAW_QA_CREDENTIAL_ROLE` wyłącznie dla tej ścieżki. Gdy wybrano
    dane uwierzytelniające Convex i nie ustawiono roli, skrypt opakowujący używa `ci` w CI,
    a `maintainer` poza CI.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny przepływ pracy opiekuna
    `NPM Telegram Beta E2E`. Nie jest ona uruchamiana podczas scalania. Przepływ pracy używa
    środowiska `qa-live-shared` oraz dzierżaw danych uwierzytelniających Convex CI.
- GitHub Actions udostępnia również `Package Acceptance` do dodatkowej weryfikacji produktu
  względem jednego kandydującego pakietu. Przyjmuje odwołanie Git, opublikowaną specyfikację npm,
  adres URL HTTPS archiwum wraz z SHA-256, zasady zaufanych adresów URL lub artefakt archiwum
  z innego uruchomienia (`source=ref|npm|url|trusted-url|artifact`), przesyła
  znormalizowany plik `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący harmonogram kompleksowych testów Dockera z profilami ścieżek `smoke`, `package`,
  `product`, `full` lub `custom`. Ustaw `telegram_mode=mock-openai` albo
  `live-frontier`, aby uruchomić przepływ pracy QA Telegram względem tego samego
  artefaktu `package-under-test`.
  - Weryfikacja produktu dla najnowszej wersji beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Weryfikacja dokładnego adresu URL archiwum wymaga skrótu i korzysta z publicznych zasad bezpieczeństwa adresów URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Firmowe/prywatne serwery lustrzane archiwów używają jawnych zasad zaufanego źródła:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` odczytuje `.github/package-trusted-sources.json` z zaufanego odwołania przepływu pracy i nie akceptuje danych uwierzytelniających w adresie URL ani obejścia sieci prywatnej przekazanego jako parametr wejściowy przepływu pracy. Jeśli wskazane zasady deklarują uwierzytelnianie za pomocą tokenu Bearer, skonfiguruj stały sekret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Weryfikacja artefaktu pobiera artefakt archiwum z innego uruchomienia Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pakuje i instaluje bieżącą kompilację OpenClaw w Dockerze, uruchamia
    Gateway ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez
    modyfikacje konfiguracji.
  - Sprawdza, czy wykrywanie podczas konfiguracji nie instaluje nieskonfigurowanych pluginów
    dostępnych do pobrania, czy pierwsza skonfigurowana naprawa przez doctor jawnie instaluje
    każdy brakujący plugin dostępny do pobrania oraz czy drugie ponowne uruchomienie nie wykonuje
    ukrytej naprawy zależności.
  - Instaluje również znaną starszą wersję bazową npm, włącza Telegram przed
    uruchomieniem `openclaw update --tag <candidate>` i sprawdza, czy
    doctor kandydata po aktualizacji usuwa pozostałości starszych zależności pluginów
    bez naprawy wykonywanej po instalacji przez zestaw testowy.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny test dymny aktualizacji instalacji pakietu na systemach gościa Parallels.
    Każda wybrana platforma najpierw instaluje żądany pakiet bazowy,
    następnie uruchamia zainstalowane polecenie `openclaw update` w tym samym systemie gościa
    i sprawdza zainstalowaną wersję, stan aktualizacji, gotowość Gateway oraz
    jedną lokalną turę agenta.
  - Podczas pracy nad jednym systemem gościa użyj `--platform macos`, `--platform windows`
    lub `--platform linux`. Użyj `--json`, aby uzyskać ścieżkę artefaktu podsumowania
    i stan poszczególnych ścieżek.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.6-luna` do rzeczywistej
    weryfikacji tury agenta. Przekaż `--model <provider/model>` lub ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, aby zweryfikować inny model OpenAI.
  - Obejmuj długie lokalne uruchomienia limitem czasu hosta, aby zawieszenia
    transportu Parallels nie zużyły pozostałego czasu przeznaczonego na testy:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone dzienniki ścieżek w
    `/tmp/openclaw-parallels-npm-update.*`. Sprawdź `windows-update.log`,
    `macos-update.log` lub `linux-update.log`, zanim uznasz, że zewnętrzny
    skrypt opakowujący się zawiesił.
  - Aktualizacja systemu Windows może spędzić od 10 do 15 minut na działaniu doctor
    po aktualizacji i aktualizowaniu pakietu w zimnym systemie gościa; działanie nadal
    przebiega prawidłowo, jeśli zagnieżdżony dziennik debugowania npm jest aktualizowany.
  - Nie uruchamiaj tego zbiorczego skryptu opakowującego równolegle z osobnymi ścieżkami
    testów dymnych Parallels dla macOS, Windows lub Linux. Współdzielą one stan maszyny wirtualnej
    i mogą kolidować podczas przywracania migawki, udostępniania pakietu lub korzystania
    ze stanu Gateway systemu gościa.
  - Weryfikacja po aktualizacji uruchamia standardową powierzchnię dołączonych pluginów, ponieważ
    fasady funkcji, takich jak mowa, generowanie obrazów i rozumienie
    multimediów, są ładowane przez dołączone interfejsy API środowiska uruchomieniowego, nawet jeśli sama
    tura agenta sprawdza jedynie prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów
    dymnych protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę testów QA na żywo dla Matrix względem jednorazowego,
    opartego na Dockerze serwera domowego Tuwunel. Dostępne tylko z kodu
    źródłowego — instalacje pakietowe nie zawierają `qa-lab`.
  - Pełny opis CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ
    artefaktów: [QA Matrix](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę testów QA na żywo dla Telegram względem rzeczywistej
    grupy prywatnej, używając tokenów bota sterownika i testowanego systemu
    ze zmiennych środowiskowych.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być
    numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych danych
    uwierzytelniających z puli. Domyślnie używaj trybu zmiennych
    środowiskowych albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby
    korzystać z dzierżaw puli.
  - Domyślne ustawienia obejmują wersję canary, bramkowanie wzmianek,
    adresowanie poleceń, `/status`, odpowiedzi między botami ze wzmianką
    oraz odpowiedzi podstawowych poleceń natywnych. Domyślne ustawienia
    `mock-openai` obejmują również deterministyczne regresje łańcucha
    odpowiedzi i strumieniowania wiadomości końcowej Telegram. Użyj
    `--list-scenarios`, aby wyświetlić opcjonalne testy, takie jak
    `session_status`.
  - Kończy działanie kodem różnym od zera, jeśli którykolwiek scenariusz
    zakończy się niepowodzeniem. Użyj `--allow-failures`, aby wygenerować
    artefakty bez kodu wyjścia wskazującego niepowodzenie.
  - Wymaga dwóch różnych botów w tej samej grupie prywatnej, przy czym bot
    testowanego systemu musi mieć nazwę użytkownika Telegram.
  - Aby zapewnić stabilną obserwację komunikacji między botami, włącz
    Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się,
    że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie oraz `qa-evidence.json`
    w `.artifacts/qa-e2e/...`. Scenariusze z odpowiedziami uwzględniają RTT
    od żądania wysłania przez sterownik do zaobserwowanej odpowiedzi
    testowanego systemu.

`Mantis Telegram Live` to otoka tej ścieżki służąca do dostarczania dowodów
dla PR. Uruchamia wskazaną wersję kandydującą z danymi uwierzytelniającymi
Telegram dzierżawionymi przez Convex, renderuje zredagowany pakiet
raportu i dowodów QA w przeglądarce pulpitu Crabbox, nagrywa dowód MP4,
generuje plik GIF przycięty pod kątem ruchu, przesyła pakiet artefaktów
i publikuje dowody bezpośrednio w PR za pomocą aplikacji Mantis GitHub App,
gdy ustawiono `pr_number`. Opiekunowie mogą uruchomić ją z poziomu Actions UI
za pomocą `Mantis Scenario` (`scenario_id: telegram-live`) lub bezpośrednio
z komentarza w pull requeście:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` to agentowa otoka natywnej aplikacji
Telegram Desktop wykonująca dowód wizualny PR przed zmianą i po niej.
Uruchom ją z poziomu Actions UI, podając dowolne `instructions`, za pomocą
`Mantis Scenario` (`scenario_id: telegram-desktop-proof`) albo z komentarza
w PR:

```text
@openclaw-mantis telegram desktop proof
```

Agent Mantis odczytuje PR, ustala, jakie zachowanie widoczne w Telegram
potwierdza zmianę, uruchamia ścieżkę dowodową Crabbox z Telegram Desktop
dla rzeczywistego użytkownika na wersji bazowej i kandydującej, iteruje,
aż natywne pliki GIF będą użyteczne, zapisuje sparowany manifest
`motionPreview` i publikuje tę samą dwukolumnową tabelę plików GIF za pomocą
aplikacji Mantis GitHub App, gdy ustawiono `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Dzierżawi lub ponownie wykorzystuje pulpit Linux Crabbox, instaluje
    natywną aplikację Telegram Desktop, konfiguruje OpenClaw przy użyciu
    dzierżawionego tokenu bota Telegram testowanego systemu, uruchamia
    Gateway oraz rejestruje zrzuty ekranu i dowody MP4 z widocznego pulpitu
    VNC.
  - Domyślnie używa `--credential-source convex`, dzięki czemu przepływy pracy
    potrzebują tylko sekretu brokera Convex. Użyj
    `--credential-source env` z tymi samymi zmiennymi
    `OPENCLAW_QA_TELEGRAM_*` co w przypadku
    `pnpm openclaw qa telegram`.
  - Telegram Desktop nadal wymaga zalogowania użytkownika lub profilu. Token
    bota konfiguruje tylko OpenClaw. Użyj
    `--telegram-profile-archive-env <name>` dla archiwum profilu `.tgz`
    zakodowanego w base64 albo użyj `--keep-lease` i zaloguj się ręcznie
    przez VNC jeden raz.
  - Zapisuje `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` oraz `telegram-desktop-builder.mp4`
    w katalogu wyjściowym.

Ścieżki transportu na żywo korzystają ze wspólnego standardowego kontraktu,
aby nowe transporty nie zaczęły się różnić; macierz pokrycia poszczególnych
ścieżek znajduje się w
[przeglądzie QA — pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` jest szerokim zestawem testów syntetycznych i nie należy do tej
macierzy.

### Współdzielone dane uwierzytelniające Telegram za pośrednictwem Convex (v1)

Gdy dla testów QA transportu na żywo włączono
`--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
laboratorium QA pozyskuje wyłączną dzierżawę ze wspieranej przez Convex puli,
wysyła Heartbeat dla tej dzierżawy podczas działania ścieżki i zwalnia ją
przy zamykaniu. Nazwa sekcji pochodzi sprzed dodania obsługi Discord, Slack
i WhatsApp; kontrakt dzierżawy jest wspólny dla wszystkich rodzajów.

Referencyjny szkielet projektu Convex: `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli danych uwierzytelniających:
  - CLI: `--credential-role maintainer|ci`
  - Wartość domyślna ze środowiska: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex `http://`
  korzystające z local loopback wyłącznie podczas lokalnego programowania.

W normalnym działaniu `OPENCLAW_QA_CONVEX_SITE_URL` powinien używać
`https://`.

Polecenia administracyjne opiekunów (dodawanie, usuwanie i wyświetlanie puli)
wymagają konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla opiekunów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Przed uruchomieniami na żywo użyj `doctor`, aby sprawdzić adres URL witryny
Convex, sekrety brokera, prefiks punktu końcowego, limit czasu HTTP oraz
dostępność funkcji administracyjnych i wyświetlania listy bez drukowania
wartości sekretów. Użyj `--json`, aby uzyskać dane wyjściowe odczytywalne
maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt punktu końcowego
(`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Żądania uwierzytelniają się nagłówkiem
`Authorization: Bearer <role secret>`; poniższe treści żądań pomijają ten
nagłówek:

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Powodzenie: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpanie puli/możliwość ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Powodzenie: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Powodzenie: `{ status: "ok" }` (lub pusta odpowiedź `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Powodzenie: `{ status: "ok" }` (lub pusta odpowiedź `2xx`)
- `POST /admin/add` (tylko sekret opiekuna)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Powodzenie: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret opiekuna)
  - Żądanie: `{ credentialId, actorId }`
  - Powodzenie: `{ status: "ok", changed, credential }`
  - Ochrona aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret opiekuna)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Powodzenie: `{ status: "ok", credentials, count }`

Struktura danych dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być ciągiem znaków zawierającym numeryczny identyfikator
  czatu Telegram.
- `admin/add` sprawdza tę strukturę dla `kind: "telegram"` i odrzuca
  nieprawidłowe dane.

Struktura danych dla rodzaju rzeczywistego użytkownika Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` oraz `telegramApiId` muszą być ciągami
  numerycznymi.
- `tdlibArchiveSha256` oraz `desktopTdataArchiveSha256` muszą być ciągami
  szesnastkowymi SHA-256.
- `kind: "telegram-user"` jest zarezerwowany dla przepływu pracy dowodu
  Mantis Telegram Desktop. Ogólne ścieżki laboratorium QA nie mogą go
  pozyskiwać.

Weryfikowane przez brokera dane dla wielu kanałów:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Ścieżki Slack również mogą dzierżawić dane z puli, ale walidacja danych Slack
znajduje się obecnie w programie uruchamiającym QA Slack, a nie w brokerze.
Dla wpisów Slack używaj
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`.

### Dodawanie kanału do QA

Architektura i nazwy funkcji pomocniczych scenariuszy dla nowych adapterów
kanałów znajdują się w
[przeglądzie QA — dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel).
Minimalne wymagania: zaimplementuj program uruchamiający transport na
wspólnym punkcie integracji hosta `qa-lab`, dodaj `adapterFactory` dla
współdzielonych scenariuszy, zadeklaruj `qaRunners` w manifeście pluginu,
zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w
`qa/scenarios/`.

## Zestawy testów (co jest uruchamiane i gdzie)

Traktuj zestawy jako zapewniające „coraz większy realizm” (a zarazem coraz
większą niestabilność i wyższy koszt).

### Testy jednostkowe/integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia bez określonego celu używają zestawu fragmentów
  `vitest.full-*.config.ts` i mogą rozwijać fragmenty wieloprojektowe do
  konfiguracji poszczególnych projektów w celu równoległego planowania
- Pliki: podstawowe/jednostkowe zestawy w `src/**/*.test.ts`,
  `packages/**/*.test.ts` oraz `test/**/*.test.ts`; testy jednostkowe UI są
  uruchamiane w dedykowanym fragmencie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne wewnątrz procesu (uwierzytelnianie Gateway, routing,
    narzędzia, analizowanie składni, konfiguracja)
  - Deterministyczne testy regresji znanych błędów
- Oczekiwania:
  - Uruchamiane w CI
  - Nie wymagają rzeczywistych kluczy
  - Powinny być szybkie i stabilne
  - Testy mechanizmu rozwiązywania i programu ładującego powierzchnię
    publiczną muszą potwierdzać szerokie działanie mechanizmu rezerwowego
    `api.js` i `runtime-api.js` przy użyciu wygenerowanych, minimalnych
    atrap pluginów, a nie rzeczywistych źródłowych interfejsów API
    dołączonych pluginów. Ładowanie rzeczywistych interfejsów API pluginów
    należy do zestawów kontraktowych/integracyjnych będących własnością
    danego pluginu.

Zasady dotyczące zależności natywnych:

- Domyślne instalacje testowe pomijają opcjonalne natywne kompilacje Opus
  dla Discord. Głos Discord używa dołączonego `libopus-wasm`, a
  `@discordjs/opus` pozostaje wyłączony w `allowBuilds`, dzięki czemu testy
  lokalne i ścieżki Testbox nie kompilują natywnego dodatku.
- Porównuj wydajność natywnego Opus w repozytorium benchmarków
  `libopus-wasm`, a nie w domyślnych cyklach instalacji/testów OpenClaw.
  Nie ustawiaj `@discordjs/opus` na `true` w domyślnym `allowBuilds`;
  powoduje to kompilowanie kodu natywnego przez niezwiązane z nim cykle
  instalacji/testów.

<AccordionGroup>
  <Accordion title="Projekty, fragmenty i ścieżki o ograniczonym zakresie">

    - Nieukierunkowane uruchomienia `pnpm test` korzystają z trzynastu mniejszych konfiguracji fragmentów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe użycie RSS na obciążonych maszynach i zapobiega odbieraniu zasobów niepowiązanym zestawom testów przez zadania auto-reply/Plugin.
    - `pnpm test --watch` nadal korzysta z natywnego grafu projektów `vitest.config.ts` w katalogu głównym, ponieważ pętla obserwująca wiele fragmentów jest niepraktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawnie wskazane pliki lub katalogi do pasujących zakresowo ścieżek, dzięki czemu `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nie ponosi pełnego kosztu uruchomienia projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git do niedrogich, dopasowanych zakresowo ścieżek: bezpośrednio zmienionych testów, sąsiednich plików `*.test.ts`, jawnych mapowań źródeł oraz lokalnych elementów zależnych w grafie importów. Zmiany konfiguracji, inicjalizacji lub pakietów nie uruchamiają szerokiego zestawu testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to standardowa inteligentna lokalna bramka kontroli dla zmian o wąskim zakresie. Klasyfikuje różnice na rdzeń, testy rdzenia, plugins, testy plugins, aplikacje, dokumentację, metadane wydania, narzędzia aktywnego środowiska Docker i pozostałe narzędzia, a następnie uruchamia odpowiednie polecenia sprawdzania typów, lintowania i zabezpieczeń. Nie uruchamia testów Vitest; do potwierdzenia testami wywołaj `pnpm test:changed` lub jawne `pnpm test <target>`. Zmiany wyłącznie wersji w metadanych wydania uruchamiają ukierunkowane kontrole wersji, konfiguracji i zależności głównych, wraz z zabezpieczeniem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Zmiany w aktywnym środowisku testowym Docker ACP uruchamiają ukierunkowane kontrole: składni powłoki skryptów uwierzytelniania aktywnego środowiska Docker oraz próbne uruchomienie harmonogramu aktywnego środowiska Docker. Zmiany w `package.json` są uwzględniane tylko wtedy, gdy różnice ograniczają się do `scripts["test:docker:live-*"]`; zmiany zależności, eksportów, wersji i innych elementów powierzchni pakietu nadal korzystają z szerszych zabezpieczeń.
    - Lekkie pod względem importów testy jednostkowe agentów, poleceń, plugins, pomocniczych elementów auto-reply, `plugin-sdk` i podobnych obszarów zawierających czyste narzędzia są kierowane do ścieżki `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe lub mocno zależne od środowiska uruchomieniowego pozostają w dotychczasowych ścieżkach.
    - Wybrane pliki źródłowe funkcji pomocniczych `plugin-sdk` i `commands` również mapują uruchomienia w trybie zmian na jawne sąsiednie testy w tych lekkich ścieżkach, dzięki czemu zmiany funkcji pomocniczych nie powodują ponownego uruchomienia całego ciężkiego zestawu dla danego katalogu.
    - `auto-reply` ma osobne grupy dla głównych funkcji pomocniczych rdzenia, testów integracyjnych najwyższego poziomu `reply.*` oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo odpowiedzi na fragmenty obsługi agentów, dystrybucji oraz poleceń/routingu stanu, aby jedna grupa z dużą liczbą importów nie zajmowała całej końcowej części wykonania Node.
    - Standardowy CI dla PR/main celowo pomija zbiorcze testowanie dołączonych plugins oraz fragment `agentic-plugins` przeznaczony wyłącznie dla wydań. Pełna walidacja wydania uruchamia oddzielny podrzędny przepływ pracy `Plugin Prerelease` dla tych zestawów mocno obciążonych plugins na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie wbudowanego modułu uruchamiającego">

    - Gdy zmieniasz dane wejściowe wykrywania narzędzi wiadomości lub kontekst środowiska uruchomieniowego Compaction, zachowaj oba poziomy pokrycia.
    - Dodaj ukierunkowane testy regresji funkcji pomocniczych dla granic czystego routingu i normalizacji.
    - Utrzymuj sprawność zestawów integracyjnych wbudowanego modułu uruchamiającego:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy sprawdzają, czy identyfikatory ograniczone do zakresu i zachowanie Compaction nadal przechodzą przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie funkcji pomocniczych nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślna pula i izolacja Vitest">

    - Podstawowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i korzysta z nieizolowanego modułu uruchamiającego w projektach głównych oraz konfiguracjach e2e i aktywnego środowiska.
    - Główna ścieżka interfejsu użytkownika zachowuje konfigurację i optymalizator `jsdom`, ale również działa we współdzielonym nieizolowanym module uruchamiającym.
    - Każdy fragment `pnpm test` dziedziczy te same ustawienia domyślne `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` do podrzędnych procesów Node Vitest, aby ograniczyć nakład kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać działanie ze standardowym zachowaniem V8.
    - `scripts/run-vitest.mjs` kończy jawne uruchomienia Vitest poza trybem obserwacji po 5 minutach bez danych wyjściowych stdout lub stderr. Ustaw `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, aby wyłączyć mechanizm nadzorujący na potrzeby celowo cichego badania.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wywołują zmiany.
    - Hak pre-commit wykonuje tylko formatowanie. Ponownie dodaje sformatowane pliki do obszaru przejściowego i nie uruchamia lintowania, sprawdzania typów ani testów.
    - Jawnie uruchom `pnpm check:changed` przed przekazaniem pracy lub wysłaniem zmian, gdy potrzebujesz inteligentnej lokalnej bramki kontroli.
    - `pnpm test:changed` domyślnie kieruje zadania przez niedrogie ścieżki dopasowane zakresowo. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent uzna, że zmiana środowiska testowego, konfiguracji, pakietu lub kontraktu rzeczywiście wymaga szerszego pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują ten sam sposób routingu, ale z wyższym limitem procesów roboczych.
    - Automatyczne skalowanie lokalnych procesów roboczych jest celowo zachowawcze i ogranicza liczbę procesów, gdy średnie obciążenie hosta jest już wysokie, dzięki czemu wiele równoległych uruchomień Vitest domyślnie powoduje mniej zakłóceń.
    - Podstawowa konfiguracja Vitest oznacza pliki projektów/konfiguracji jako `forceRerunTriggers`, dzięki czemu ponowne uruchomienia w trybie zmian pozostają poprawne po zmianie połączeń testowych.
    - Konfiguracja pozostawia włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, aby wskazać jedną jawną lokalizację pamięci podręcznej na potrzeby bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu importów Vitest oraz szczegółowy podział importów.
    - `pnpm test:perf:imports:changed` ogranicza ten sam widok profilowania do plików zmienionych od `origin/main`.
    - Dane czasowe fragmentów są zapisywane w `.artifacts/vitest-shard-timings.json`. Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; fragmenty CI z wzorcem uwzględniania dołączają nazwę fragmentu, aby filtrowane fragmenty można było śledzić oddzielnie.
    - Gdy jeden intensywny test nadal spędza większość czasu na importach uruchomieniowych, umieść ciężkie zależności za wąską lokalną granicą `*.runtime.ts` i bezpośrednio imituj tę granicę, zamiast głęboko importować funkcje pomocnicze środowiska uruchomieniowego tylko po to, by przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje kierowane `test:changed` z natywną ścieżką projektu głównego dla zatwierdzonych różnic oraz wyświetla czas rzeczywisty i maksymalne RSS w systemie macOS.
    - `pnpm test:perf:changed:bench -- --worktree` mierzy wydajność bieżącego drzewa z niezapisanymi zmianami, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla narzutu uruchamiania i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU i sterty modułu uruchamiającego dla zestawu jednostkowego z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (Gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` i `test/vitest/vitest.infra.config.ts`, każda wymuszona do jednego procesu roboczego
- Zakres:
  - Uruchamia rzeczywisty Gateway local loopback z domyślnie włączoną diagnostyką
  - Generuje syntetyczną rotację wiadomości Gateway, pamięci i dużych ładunków przez ścieżkę zdarzeń diagnostycznych
  - Wysyła zapytania do `diagnostics.stability` przez RPC WS Gateway
  - Obejmuje funkcje pomocnicze utrwalania pakietu diagnostyki stabilności
  - Sprawdza, czy rejestrator zachowuje ograniczony rozmiar, syntetyczne próbki RSS pozostają poniżej budżetu obciążenia, a głębokości kolejek poszczególnych sesji wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i niewymagające kluczy
  - Wąska ścieżka do dalszego badania regresji stabilności, a nie zamiennik pełnego zestawu Gateway

### E2E (zbiorczo dla repozytorium)

- Polecenie: `pnpm test:e2e`
- Zakres:
  - Uruchamia ścieżkę testów E2E typu smoke dla Gateway
  - Uruchamia ścieżkę testów E2E przeglądarki z imitacją Control UI
- Oczekiwania:
  - Bezpieczne dla CI i niewymagające kluczy
  - Wymaga zainstalowanego Playwright Chromium

### E2E (test smoke Gateway)

- Polecenie: `pnpm test:e2e:gateway`
- Konfiguracja: `test/vitest/vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych plugins w `extensions/`
- Domyślne ustawienia środowiska uruchomieniowego:
  - Korzysta z `threads` Vitest z `isolate: false`, zgodnie z resztą repozytorium.
  - Korzysta z adaptacyjnej liczby procesów roboczych (CI: maksymalnie 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut operacji wejścia/wyjścia konsoli.
- Przydatne ustawienia zastępujące:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę procesów roboczych (maksymalnie 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe dane wyjściowe konsoli.
- Zakres:
  - Kompleksowe zachowanie wielu instancji Gateway
  - Powierzchnie WebSocket/HTTP, parowanie Node i bardziej złożone operacje sieciowe
- Oczekiwania:
  - Działa w CI (gdy jest włączone w potoku)
  - Nie wymaga rzeczywistych kluczy
  - Więcej elementów ruchomych niż w testach jednostkowych (może działać wolniej)

### E2E (przeglądarka z imitacją Control UI)

- Polecenie: `pnpm test:ui:e2e`
- Konfiguracja: `test/vitest/vitest.ui-e2e.config.ts`
- Pliki: `ui/src/**/*.e2e.test.ts`
- Zakres:
  - Uruchamia Control UI Vite
  - Steruje rzeczywistą stroną Chromium za pomocą Playwright
  - Zastępuje WebSocket Gateway deterministycznymi imitacjami w przeglądarce
- Oczekiwania:
  - Działa w CI jako część `pnpm test:e2e`
  - Nie wymaga rzeczywistego Gateway, agentów ani kluczy dostawców
  - Zależność przeglądarki musi być dostępna (`pnpm --dir ui exec playwright install chromium`)

### E2E: test smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Ponownie wykorzystuje aktywny lokalny Gateway OpenShell
  - Tworzy piaskownicę z tymczasowego lokalnego pliku Dockerfile
  - Testuje backend OpenShell systemu OpenClaw za pomocą rzeczywistych `sandbox ssh-config` i wykonywania przez SSH
  - Weryfikuje kanoniczne zachowanie zdalnego systemu plików przez most systemu plików piaskownicy
- Oczekiwania:
  - Tylko opcjonalnie; nie należy do domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Wymaga aktywnego lokalnego Gateway OpenShell i jego źródła konfiguracji
  - Korzysta z izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy piaskownicę testową
- Przydatne ustawienia zastępujące:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy plik binarny CLI lub skrypt opakowujący
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`, aby udostępnić zarejestrowaną konfigurację Gateway izolowanemu testowi
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`, aby zastąpić adres IP Gateway Docker używany przez dane testowe zasad hosta

### Aktywne testy (rzeczywiści dostawcy i rzeczywiste modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `test/vitest/vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy na żywo wbudowanych pluginów w katalogu `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model rzeczywiście działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wykrywanie zmian formatów dostawców, niuansów wywoływania narzędzi, problemów z uwierzytelnianiem oraz zachowania limitów szybkości
- Założenia:
  - Z założenia brak stabilności w CI (rzeczywiste sieci, rzeczywiste zasady dostawców, limity, awarie)
  - Generuje koszty / wykorzystuje limity szybkości
  - Zaleca się uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia na żywo korzystają z już wyeksportowanych kluczy API i przygotowanych profili uwierzytelniania.
- Domyślnie uruchomienia na żywo nadal izolują `HOME` oraz kopiują konfigurację i materiały uwierzytelniające do tymczasowego katalogu domowego testów, aby fixtury testów jednostkowych nie mogły zmodyfikować rzeczywistego katalogu `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, aby testy na żywo korzystały z rzeczywistego katalogu domowego.
- `pnpm test:live` domyślnie działa w cichszym trybie: zachowuje komunikaty postępu `[live] ...`, a wycisza dzienniki uruchamiania Gateway i komunikaty Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz ponownie wyświetlać pełne dzienniki uruchamiania.
- Rotacja kluczy API (zależna od dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) lub nadpisanie dla uruchomienia na żywo przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby po odpowiedziach o przekroczeniu limitu szybkości.
- Komunikaty postępu/Heartbeat:
  - Zestawy testów na żywo wysyłają wiersze postępu do stderr, dzięki czemu długie wywołania dostawców pozostają widocznie aktywne, nawet gdy przechwytywanie konsoli przez Vitest jest wyciszone.
  - `test/vitest/vitest.live.config.ts` wyłącza przechwytywanie konsoli przez Vitest, dzięki czemu wiersze postępu dostawcy/Gateway są natychmiast wyświetlane podczas uruchomień na żywo.
  - Dostosuj częstotliwość Heartbeat bezpośrednich modeli za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj częstotliwość Heartbeat Gateway/sond za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw testów należy uruchomić?

Skorzystaj z tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zakres zmian był duży)
- Zmiany w komunikacji sieciowej Gateway / protokole WS / parowaniu: dodaj `pnpm test:e2e`
- Diagnozowanie problemu „mój bot nie działa” / błędów właściwych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy na żywo (korzystające z sieci)

Informacje o macierzy modeli na żywo, testach dymnych zaplecza CLI, testach dymnych ACP, środowisku testowym serwera aplikacji Codex oraz wszystkich testach na żywo dostawców multimediów (Deepgram, BytePlus, ComfyUI, obrazy, muzyka, wideo, środowisko testowe multimediów), a także obsłudze danych uwierzytelniających podczas uruchomień na żywo:

- zobacz [Testowanie zestawów na żywo](/pl/help/testing-live). Dedykowana lista kontrolna weryfikacji aktualizacji i pluginów znajduje się w sekcji
  [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

## Programy uruchamiające Docker (opcjonalne kontrole „czy działa w systemie Linux”)

Te programy uruchamiające Docker dzielą się na dwie grupy:

- Programy uruchamiające modele na żywo: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają w obrazie Docker repozytorium tylko odpowiadający im plik na żywo z kluczami profili (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji, obszar roboczy i opcjonalny plik środowiskowy profilu. Odpowiadające im lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Programy uruchamiające Docker na żywo zachowują własne praktyczne ograniczenia tam, gdzie są potrzebne:
  `test:docker:live-models` domyślnie używa wyselekcjonowanego, obsługiwanego zestawu zapewniającego wyraźne sygnały, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ustaw `OPENCLAW_LIVE_MAX_MODELS`
  lub zmienne środowiskowe Gateway, gdy celowo potrzebujesz mniejszego limitu albo szerszego skanowania.
- `test:docker:all` jednokrotnie buduje obraz Docker do testów na żywo za pomocą `test:docker:live-build`, jednokrotnie pakuje OpenClaw jako archiwum npm za pośrednictwem `scripts/package-openclaw-for-docker.mjs`, a następnie buduje lub ponownie wykorzystuje dwa obrazy `scripts/e2e/Dockerfile`. Podstawowy obraz zawiera tylko środowisko uruchomieniowe Node/Git dla ścieżek instalacji/aktualizacji/zależności pluginów; ścieżki te montują wcześniej zbudowane archiwum. Obraz funkcjonalny instaluje to samo archiwum w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planisty znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregator używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` określa liczbę miejsc na procesy, natomiast limity zasobów zapobiegają jednoczesnemu uruchamianiu wszystkich wymagających ścieżek na żywo, instalacji npm i ścieżek wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram nadal może ją uruchomić, gdy pula jest pusta, a następnie pozostawia ją jako jedyną uruchomioną do czasu ponownego udostępnienia zasobów. Wartości domyślne to 10 miejsc, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostosuj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (oraz inne nadpisania `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) tylko wtedy, gdy host Docker ma większy zapas zasobów. Program uruchamiający domyślnie przeprowadza kontrolę wstępną Docker, usuwa nieaktualne kontenery E2E OpenClaw, wyświetla stan co 30 sekund, zapisuje czasy pomyślnie wykonanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i wykorzystuje je do wcześniejszego uruchamiania dłuższych ścieżek podczas kolejnych uruchomień. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wyświetlić ważony manifest ścieżek bez budowania ani uruchamiania Docker, lub `node scripts/test-docker-all.mjs --plan-json`, aby wyświetlić plan CI dla wybranych ścieżek, wymagania dotyczące pakietów/obrazów i dane uwierzytelniające.
- `Package Acceptance` to natywna dla GitHub kontrola pakietu odpowiadająca na pytanie „czy to instalowalne archiwum działa jako produkt?”. Wyznacza jeden pakiet kandydujący ze źródła `source=npm`, `source=ref`, `source=url`, `source=trusted-url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki E2E Docker dla dokładnie tego archiwum zamiast ponownie pakować wybrane odwołanie. Profile są uporządkowane według zakresu: `smoke`, `package`, `product` i `full` (oraz `custom` dla jawnej listy ścieżek). Zobacz [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietów/aktualizacji/pluginów, macierz zachowania stanu po opublikowanej aktualizacji, ustawienia domyślne wydań i diagnostykę błędów.
- Kontrole kompilacji i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Mechanizm ochronny przechodzi statyczny graf zbudowanych zależności od `dist/entry.js` i `dist/cli/run-main.js` oraz zgłasza błąd, jeśli ten graf uruchamiania przed przekazaniem sterowania statycznie importuje jakikolwiek pakiet zewnętrzny (Commander, interfejs monitów, undici, rejestrowanie i podobne zależności obciążające uruchamianie są brane pod uwagę) przed przekazaniem polecenia; ogranicza także rozmiar pakietowanego fragmentu uruchomieniowego Gateway do 70 KB i odrzuca z tego fragmentu statyczne importy znanych rzadko używanych ścieżek Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`). `scripts/release-check.ts` niezależnie przeprowadza testy dymne spakowanego CLI za pomocą `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` i `models list --provider openai`.
- Zgodność wsteczna `Package Acceptance` jest ograniczona do wersji `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tej wersji granicznej środowisko testowe toleruje wyłącznie luki w metadanych opublikowanych pakietów: pominięte wpisy prywatnego spisu QA, brak `gateway install --wrapper`, brak plików poprawek w fixturze Git utworzonej z archiwum, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji pluginów, brak utrwalania rekordów instalacji z marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. W przypadku pakietów nowszych niż `2026.4.25` ścieżki te powodują bezwzględne błędy.
- Programy uruchamiające testy dymne kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają co najmniej jeden rzeczywisty kontener oraz weryfikują ścieżki integracji wyższego poziomu.
- Ścieżki E2E Docker/Bash, które instalują spakowane archiwum OpenClaw za pośrednictwem `scripts/lib/openclaw-e2e-instance.sh`, ograniczają czas `npm install` za pomocą `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (domyślnie `600s`; ustaw `0`, aby wyłączyć opakowanie na potrzeby debugowania).

Programy uruchamiające Docker dla modeli na żywo montują również tylko niezbędne katalogi domowe uwierzytelniania CLI
(lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego
kontenera przed uruchomieniem, dzięki czemu OAuth zewnętrznego CLI może odświeżać tokeny
bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Test dymny powiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, a ścisłe pokrycie Droid/OpenCode zapewniają `pnpm test:docker:live-acp-bind:droid` oraz `pnpm test:docker:live-acp-bind:opencode`)
- Test dymny zaplecza CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Test dymny środowiska testowego serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Testy dymne obserwowalności: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` i `pnpm qa:observability:smoke` są prywatnymi ścieżkami QA dla kopii roboczej kodu źródłowego. Celowo nie należą do ścieżek wydania pakietu Docker, ponieważ archiwum npm pomija QA Lab.
- Test dymny Open WebUI na żywo: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator wdrażania (TTY, pełne tworzenie struktury): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Test dymny wdrażania/kanału/agenta z archiwum npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje globalnie spakowane archiwum OpenClaw w Docker, domyślnie konfiguruje OpenAI za pośrednictwem wdrażania z odwołaniem do zmiennej środowiskowej oraz Telegram, uruchamia doctor, a następnie wykonuje jedną pozorowaną turę agenta OpenAI. Ponownie wykorzystaj wcześniej zbudowane archiwum za pomocą `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń ponowną kompilację na hoście za pomocą `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo zmień kanał za pomocą `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Test dymny ścieżki użytkownika wydania: `pnpm test:docker:release-user-journey` instaluje globalnie spakowane archiwum tar OpenClaw w czystym katalogu domowym Dockera, uruchamia proces wdrożeniowy, konfiguruje atrapę dostawcy OpenAI, wykonuje turę agenta, instaluje i odinstalowuje zewnętrzne pluginy, konfiguruje ClickClack względem lokalnej fixtury, weryfikuje komunikację wychodzącą i przychodzącą, ponownie uruchamia Gateway oraz uruchamia diagnostykę.
- Test dymny wydania z typowanym procesem wdrożeniowym: `pnpm test:docker:release-typed-onboarding` instaluje spakowane archiwum tar, przeprowadza `openclaw onboard` przez rzeczywisty TTY, konfiguruje OpenAI jako dostawcę odwołującego się do zmiennej środowiskowej, weryfikuje, że surowy klucz nie jest utrwalany, oraz wykonuje turę agenta z atrapą.
- Test dymny multimediów i pamięci wydania: `pnpm test:docker:release-media-memory` instaluje spakowane archiwum tar, weryfikuje rozumienie obrazu z załącznika PNG, wynik generowania obrazu zgodnego z OpenAI, przywoływanie przez wyszukiwanie w pamięci oraz zachowanie możliwości przywoływania po ponownym uruchomieniu Gateway.
- Test dymny ścieżki użytkownika podczas uaktualnienia wydania: `pnpm test:docker:release-upgrade-user-journey` domyślnie instaluje najnowszą opublikowaną wersję bazową starszą od kandydującego archiwum tar, konfiguruje stan dostawcy, pluginu i ClickClack w opublikowanym pakiecie, uaktualnia go do kandydującego archiwum tar, a następnie ponownie wykonuje podstawową ścieżkę agenta, pluginu i kanału. Jeśli nie istnieje starsza opublikowana wersja bazowa, ponownie wykorzystuje wersję kandydującą. Wersję bazową można zastąpić za pomocą `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Test dymny sklepu z pluginami wydania: `pnpm test:docker:release-plugin-marketplace` instaluje plugin z lokalnej fixtury sklepu, aktualizuje zainstalowany plugin, odinstalowuje go i weryfikuje, że CLI pluginu znika wraz z usunięciem metadanych instalacji.
- Test dymny instalowania Skills: `pnpm test:docker:skill-install` instaluje globalnie spakowane archiwum tar OpenClaw w Dockerze, wyłącza w konfiguracji instalowanie przesłanych archiwów, ustala na podstawie wyszukiwania aktualny identyfikator działającego Skill w ClawHub, instaluje go za pomocą `openclaw skills install` oraz weryfikuje zainstalowany Skill wraz z metadanymi pochodzenia i blokady `.clawhub`.
- Test dymny zmiany kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje globalnie spakowane archiwum tar OpenClaw w Dockerze, przełącza się z pakietu `stable` na gitowy kanał `dev`, weryfikuje utrwalony kanał i działanie pluginu po aktualizacji, a następnie przełącza się z powrotem na pakiet `stable` i sprawdza stan aktualizacji.
- Test dymny zachowania stanu po uaktualnieniu: `pnpm test:docker:upgrade-survivor` instaluje spakowane archiwum tar OpenClaw na nieuporządkowanej fixturze starego użytkownika, zawierającej agentów, konfigurację kanału, listy dozwolonych pluginów, nieaktualny stan zależności pluginów oraz istniejące pliki przestrzeni roboczej i sesji. Uruchamia aktualizację pakietu oraz nieinteraktywną diagnostykę bez aktywnych kluczy dostawcy lub kanału, następnie uruchamia Gateway w local loopback i sprawdza zachowanie konfiguracji oraz stanu, a także limity czasu uruchamiania i pobierania stanu.
- Test dymny zachowania stanu po uaktualnieniu opublikowanej wersji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, tworzy realistyczne pliki istniejącego użytkownika, konfiguruje tę wersję bazową przy użyciu wbudowanej sekwencji poleceń, sprawdza wynikową konfigurację, aktualizuje tę opublikowaną instalację do kandydującego archiwum tar, uruchamia nieinteraktywną diagnostykę, zapisuje `.artifacts/upgrade-survivor/summary.json`, a następnie uruchamia Gateway w local loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchamianie, `/healthz`, `/readyz` oraz limity czasu stanu RPC. Jedną wersję bazową można zastąpić za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`; można polecić zbiorczemu harmonogramowi rozwinięcie dokładnych lokalnych wersji bazowych za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, na przykład `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oraz rozwinięcie fixtur odpowiadających zgłoszeniom za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, na przykład `reported-issues`; zestaw zgłoszonych problemów obejmuje `configured-plugin-installs`, służące do automatycznej naprawy instalacji zewnętrznych pluginów OpenClaw. Akceptacja pakietu udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje metatokeny wersji bazowych, takie jak `last-stable-4` lub `all-since-2026.4.23`, a pełna walidacja wydania rozwija bramkę pakietową długotrwałego testu wydania do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` wraz z `reported-issues`.
- Test dymny kontekstu środowiska wykonawczego sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego kontekstu środowiska wykonawczego w transkrypcji oraz naprawę przez diagnostykę powiązanych, zduplikowanych gałęzi przepisywania promptów.
- Test dymny globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je za pomocą `bun install -g` w odizolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca wbudowanych dostawców obrazów zamiast się zawieszać. Wstępnie zbudowane archiwum tar można ponownie wykorzystać za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pominąć kompilację na hoście za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` lub skopiować `dist/` ze zbudowanego obrazu Dockera za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test dymny instalatora w Dockerze: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami głównym, aktualizacyjnym i bezpośredniego npm. Test dymny aktualizacji domyślnie używa wersji npm `latest` jako stabilnej wersji bazowej przed uaktualnieniem do kandydującego archiwum tar. Lokalnie można ją zastąpić za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, a w GitHubie za pomocą parametru `update_baseline_version` przepływu pracy Install Smoke. Kontrole instalatora bez uprawnień użytkownika root zachowują odizolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do użytkownika root nie maskowały zachowania instalacji lokalnej dla użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej głównego, aktualizacyjnego i bezpośredniego npm podczas lokalnych powtórzeń.
- CI Install Smoke pomija zduplikowaną bezpośrednią globalną aktualizację npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Test dymny CLI usuwania przez agentów współdzielonej przestrzeni roboczej: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego pliku Dockerfile, tworzy dwóch agentów korzystających z jednej przestrzeni roboczej w odizolowanym katalogu domowym kontenera, uruchamia `agents delete --json` oraz weryfikuje poprawny JSON i zachowanie pozostawionej przestrzeni roboczej. Obraz testu instalacji można ponownie wykorzystać za pomocą `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway i cykl życia hosta: `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`) zachowuje dwukontenerowy test dymny uwierzytelniania i kondycji WebSocket w sieci LAN, a następnie używa administracyjnego interfejsu HTTP w local loopback, aby potwierdzić blokadę przygotowania, dostęp z zachowaniem kontroli, odzyskiwanie po wznowieniu oraz przygotowane zatrzymanie i uruchomienie w tym samym kontenerze. Kontrola ponownego uruchomienia musi zakończyć się przed wygaśnięciem pierwotnej dzierżawy; weryfikuje, że stan zawieszenia jest lokalny dla procesu, podczas gdy utrwalona konfiguracja Gateway i tożsamość kontenera zostają zachowane, oraz generuje możliwy do odczytu maszynowego plik JSON z czasami faz.
- Test dymny migawki CDP przeglądarki: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E wraz z warstwą Chromium, uruchamia Chromium z bezpośrednim CDP, wykonuje `browser doctor --deep` i weryfikuje, że migawki ról CDP obejmują adresy URL odnośników, elementy klikalne wykryte za pomocą kursora, odwołania do ramek iframe oraz metadane ramek.
- Regresja minimalnego poziomu wnioskowania dla `web_search` w OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia atrapę serwera OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, czy surowe szczegóły pojawiają się w dziennikach Gateway.
- Most kanałów MCP (Gateway ze wstępnie utworzonym stanem + most stdio + test dymny surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu OpenClaw (rzeczywisty serwer MCP stdio + test dymny zezwalania i blokowania we wbudowanym profilu OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (skrypt: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP dla Cron i podagentów (rzeczywisty Gateway + zamykanie procesu potomnego MCP stdio po odizolowanych uruchomieniach Cron i jednorazowych uruchomieniach podagentów): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (test dymny instalacji i aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, nieprawidłowych metadanych pakietu npm, ruchomych odwołań git, kompleksowej fixtury ClawHub, aktualizacji sklepu oraz włączania i inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo zastąp domyślną parę kompleksowego pakietu i środowiska wykonawczego za pomocą `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` oraz `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixtury ClawHub.
- Test dymny aktualizacji niezmienionego pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test dymny macierzy cyklu życia pluginu: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowane archiwum tar OpenClaw w pustym kontenerze, instaluje plugin npm, przełącza jego stan włączenia i wyłączenia, uaktualnia go i obniża jego wersję za pośrednictwem lokalnego rejestru npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa nieaktualny stan, jednocześnie zapisując metryki RSS i CPU dla każdej fazy cyklu życia.
- Test dymny metadanych ponownego wczytywania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje testy dymne instalacji i aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych odwołań git, fixtur ClawHub, aktualizacji sklepu oraz włączania i inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie aktualizacji bez zmian dla zainstalowanych pluginów. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje monitorowane pod względem zasobów instalowanie, włączanie, wyłączanie, uaktualnianie, obniżanie wersji i odinstalowywanie pluginu npm z brakującym kodem.

Aby ręcznie wstępnie zbudować i ponownie wykorzystywać współdzielony obraz funkcjonalny:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Ustawienia zastępujące obraz dla poszczególnych zestawów, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje zdalny obraz współdzielony, skrypty pobierają go, jeśli nie jest jeszcze dostępny lokalnie. Testy QR i instalatora w Dockerze zachowują własne pliki Dockerfile, ponieważ weryfikują zachowanie pakietu i instalacji, a nie środowisko wykonawcze współdzielonej zbudowanej aplikacji.

Mechanizmy uruchamiające modele aktywne w Dockerze również montują bieżące drzewo robocze w trybie tylko do odczytu
i przygotowują je w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu
obraz środowiska wykonawczego pozostaje niewielki, a Vitest nadal działa dokładnie na lokalnych
źródłach i konfiguracji. Etap przygotowania pomija duże pamięci podręczne używane wyłącznie lokalnie oraz wyniki
kompilacji aplikacji, takie jak `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, a także
lokalne dla aplikacji katalogi wynikowe `.build` lub Gradle, dzięki czemu aktywne uruchomienia w Dockerze nie
poświęcają wielu minut na kopiowanie artefaktów specyficznych dla danego komputera. Ustawiają również
`OPENCLAW_SKIP_CHANNELS=1`, aby aktywne sondy Gateway nie uruchamiały rzeczywistych
procesów roboczych kanałów Telegram, Discord itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, dlatego przekaż również
`OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić lub wykluczyć aktywne testy Gateway
z tej ścieżki Dockera.

`test:docker:openwebui` to test zgodności wyższego poziomu: uruchamia kontener
Gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI połączony z tym Gateway, loguje się
przez Open WebUI, sprawdza, czy `/api/models` udostępnia `openclaw/default`,
a następnie wysyła rzeczywiste żądanie czatu przez serwer proxy
`/api/chat/completions` Open WebUI. Ustaw `OPENWEBUI_SMOKE_MODE=models` dla
kontroli CI ścieżki wydania, które powinny zakończyć się po zalogowaniu do
Open WebUI i wykryciu modelu, bez oczekiwania na odpowiedź aktywnego modelu.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może
wymagać pobrania obrazu Open WebUI, a Open WebUI może wymagać ukończenia
własnej konfiguracji po zimnym starcie. Ta ścieżka wymaga użytecznego klucza
aktywnego modelu, udostępnionego przez środowisko procesu, przygotowane profile
uwierzytelniania lub jawny plik `OPENCLAW_PROFILE_FILE`. Pomyślne uruchomienia
wyświetlają niewielki ładunek JSON, taki jak
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia kontener Gateway
ze wstępnie przygotowanymi danymi, a następnie drugi kontener, który uruchamia
`openclaw mcp serve`, po czym sprawdza kierowane wykrywanie konwersacji, odczyt
transkrypcji, metadane załączników, zachowanie kolejki zdarzeń na żywo,
kierowanie wysyłania wychodzącego oraz powiadomienia w stylu Claude dotyczące
kanałów i uprawnień przez rzeczywisty most MCP stdio. Kontrola powiadomień
bezpośrednio analizuje surowe ramki MCP stdio, dzięki czemu test sprawdza to,
co most faktycznie emituje, a nie tylko to, co akurat udostępnia określony
zestaw SDK klienta.

`test:docker:agent-bundle-mcp-tools` jest deterministyczny i nie wymaga
klucza aktywnego modelu. Buduje obraz Docker repozytorium, uruchamia wewnątrz
kontenera rzeczywisty serwer sondujący MCP stdio, materializuje ten serwer
przez osadzone środowisko uruchomieniowe MCP pakietu OpenClaw, wykonuje
narzędzie, a następnie sprawdza, czy `coding` i `messaging` zachowują narzędzia
`bundle-mcp`, natomiast `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.

`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza
aktywnego modelu. Uruchamia Gateway ze wstępnie przygotowanymi danymi oraz
rzeczywistym serwerem sondującym MCP stdio, wykonuje izolowaną turę cron i
jednorazową turę potomną `sessions_spawn`, a następnie sprawdza, czy proces
potomny MCP kończy działanie po każdym uruchomieniu.

Ręczny test wątku ACP z użyciem języka naturalnego (poza CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt na potrzeby procedur regresyjnych i debugowania. Może być ponownie potrzebny do weryfikacji kierowania wątków ACP, dlatego nie należy go usuwać.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowany w `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowany w `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montowany i wczytywany przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby sprawdzać wyłącznie zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów konfiguracji i obszaru roboczego oraz bez zewnętrznych montowań uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`, chyba że uruchomienie korzysta już z katalogu montowania zarządzanego lub CI) montowany w `/home/node/.npm-global` na potrzeby buforowanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi i pliki uwierzytelniania CLI w `$HOME` są montowane tylko do odczytu w `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi (używane, gdy uruchomienie nie jest ograniczone do określonych dostawców): `.factory`, `.gemini`, `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Uruchomienia ograniczone do dostawców montują tylko wymagane katalogi i pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Można to ręcznie zastąpić przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listę rozdzielaną przecinkami, taką jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców wewnątrz kontenera
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie wykorzystać istniejący obraz `openclaw:local-live` w kolejnych uruchomieniach, które nie wymagają ponownego budowania
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że dane uwierzytelniające pochodzą z magazynu profili, a nie ze środowiska
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway na potrzeby testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby zastąpić monit kontroli wartości jednorazowej używany przez test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby zastąpić przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Po edycji dokumentacji uruchom kontrole dokumentacji: `pnpm check:docs`.
Gdy potrzebne jest również sprawdzenie nagłówków wewnątrz stron, uruchom pełną walidację kotwic Mintlify: `pnpm docs:check-links:anchors`.

## Regresje offline (bezpieczne dla CI)

Są to regresje „rzeczywistego potoku” bez rzeczywistych dostawców:

- Wywoływanie narzędzi przez Gateway (atrapa OpenAI, rzeczywisty Gateway i pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (`wizard.start`/`wizard.next` przez WS, zapisuje konfigurację i wymusza uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Testy oceniające niezawodność agenta (Skills)

Mamy już kilka testów bezpiecznych dla CI, które działają jak „testy oceniające niezawodność agenta”:

- Pozorowane wywoływanie narzędzi przez rzeczywisty Gateway i pętlę agenta (`src/gateway/gateway.test.ts`).
- Kompleksowe przepływy kreatora, które sprawdzają powiązanie sesji i skutki konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje w przypadku Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** czy agent wybiera właściwą umiejętność, gdy umiejętności są wymienione w monicie, lub unika nieistotnych?
- **Zgodność:** czy agent przed użyciem odczytuje `SKILL.md` i wykonuje wymagane kroki oraz przekazuje wymagane argumenty?
- **Kontrakty przepływów pracy:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice piaskownicy.

Przyszłe testy oceniające powinny być przede wszystkim deterministyczne:

- Program uruchamiający scenariusze, który używa pozorowanych dostawców do sprawdzania wywołań narzędzi i ich kolejności, odczytów plików umiejętności oraz powiązania sesji.
- Niewielki zestaw scenariuszy dotyczących umiejętności: użycie lub pominięcie, blokady i wstrzykiwanie monitów.
- Opcjonalne testy oceniające na żywo (włączane jawnie i kontrolowane zmiennymi środowiskowymi) dopiero po przygotowaniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (struktura Pluginów i kanałów)

Testy kontraktowe sprawdzają, czy każdy zarejestrowany Plugin i kanał jest zgodny
ze swoim kontraktem interfejsu. Iterują po wszystkich wykrytych Pluginach i
uruchamiają zestaw asercji dotyczących struktury oraz zachowania. Domyślna
ścieżka testów jednostkowych `pnpm test` celowo pomija te współdzielone pliki
granic i testów integracyjnych; po zmianie współdzielonych powierzchni kanałów
lub dostawców uruchom jawnie polecenia testów kontraktowych.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`. Obecne
kategorie najwyższego poziomu:

- **katalog kanałów** — metadane wpisów katalogu kanałów wbudowanych i pochodzących z rejestru
- **Plugin** (oparty na rejestrze, podzielony na fragmenty) — podstawowa struktura rejestracji Pluginu
- **tylko powierzchnie** (oparte na rejestrze, podzielone na fragmenty) — kontrole struktury poszczególnych powierzchni dla `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` i `gateway`
- **powiązanie sesji** (oparte na rejestrze) — zachowanie powiązania sesji
- **ładunek wychodzący** — struktura i normalizacja ładunku wiadomości
- **zasady grupy** (rozwiązanie rezerwowe) — wymuszanie domyślnych zasad grupy dla każdego kanału
- **wątki** (oparte na rejestrze, podzielone na fragmenty) — obsługa identyfikatorów wątków
- **katalog** (oparty na rejestrze, podzielony na fragmenty) — API katalogu i listy użytkowników
- **rejestr** i **rdzeń Pluginów.\*** — rejestr Pluginów kanałów, moduł ładujący i wewnętrzne mechanizmy autoryzacji zapisu konfiguracji

Pomocnicze mechanizmy przechwytywania wysyłania przychodzącego i ładunku
wychodzącego używane przez te zestawy są udostępniane wewnętrznie przez
`src/plugin-sdk/channel-contract-testing.ts` (wyłączony z npm, nie jest
publiczną podścieżką SDK); w tym katalogu nie ma samodzielnego pliku
`inbound.contract.test.ts`.

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`. Obecne kategorie
obejmują:

- **struktura** — struktura manifestu Pluginu, API i eksportów środowiska uruchomieniowego
- **rejestracja Pluginu** (+ równoległa) — przypadki rejestracji manifestu
- **manifest pakietu** — wymagania dotyczące manifestu pakietu
- **moduł ładujący** — zachowanie konfiguracji i zwalniania zasobów modułu ładującego Pluginy
- **rejestr** — zawartość i wyszukiwanie w rejestrze kontraktów Pluginów
- **dostawcy** — współdzielone zachowanie dostawców wśród dostawców wbudowanych oraz dostawców wyszukiwania internetowego
- **wybór uwierzytelniania** — metadane wyboru uwierzytelniania i zachowanie konfiguracji
- **wycofanie katalogu dostawców** — metadane wycofanych elementów katalogu dostawców
- **rozstrzyganie wyboru kreatora**, **selektor modelu kreatora**, **opcje konfiguracji kreatora** — kontrakty kreatora konfiguracji dostawców
- **dostawca osadzania**, **dostawca osadzania pamięci**, **dostawca pobierania z internetu**, **synteza mowy** — kontrakty dostawców właściwe dla poszczególnych możliwości
- **akcje sesji**, **załączniki sesji**, **projekcja wpisu sesji** — kontrakty stanu sesji będące własnością Pluginu
- **zaplanowane tury** — metadane zaplanowanych tur Pluginu i zakresy znaczników czasu
- **punkty zaczepienia hosta**, **cykl życia kontekstu uruchomienia**, **skutki uboczne importu środowiska uruchomieniowego**, **granice środowiska uruchomieniowego** — kontrakty cyklu życia hosta i środowiska uruchomieniowego Pluginu oraz granic importu
- **zależności środowiska uruchomieniowego rozszerzeń** — rozmieszczenie zależności środowiska uruchomieniowego rozszerzeń

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek `plugin-sdk`
- Po dodaniu lub zmodyfikowaniu Pluginu kanału albo dostawcy
- Po refaktoryzacji rejestracji lub wykrywania Pluginów

Testy kontraktowe działają w CI i nie wymagają rzeczywistych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem z dostawcą lub modelem wykryty podczas działania na żywo:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI: pozorowanego dostawcę, atrapę dostawcy lub przechwycenie dokładnego przekształcenia struktury żądania
- Jeśli problem z natury występuje tylko na żywo, na przykład w przypadku limitów szybkości lub zasad uwierzytelniania, test na żywo powinien mieć wąski zakres i być włączany jawnie za pomocą zmiennych środowiskowych
- Preferuj testowanie najmniejszej warstwy, która wykrywa błąd:
  - błąd konwersji lub ponownego odtwarzania żądania dostawcy -> bezpośredni test modeli
  - błąd sesji, historii lub potoku narzędzi Gateway -> test Gateway na żywo albo bezpieczny dla CI test Gateway z atrapą
- Zabezpieczenie przechodzenia po SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel dla każdej klasy SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, czy identyfikatory wykonania z segmentami przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef z `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem w przypadku niesklasyfikowanych identyfikatorów celów, aby nowe klasy nie mogły zostać po cichu pominięte.

## Powiązane

- [Testowanie na żywo](/pl/help/testing-live)
- [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
