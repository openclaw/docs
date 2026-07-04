---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: pakiety testów jednostkowych/e2e/live, runnerzy Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-07-04T04:10:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (jednostkowe/integracyjne, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Jakie polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed wypchnięciem, podczas debugowania).
- Jak testy live wykrywają dane uwierzytelniające i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, pasma transportu live)** jest udokumentowany osobno:

- [Przegląd QA](/pl/concepts/qa-e2e-automation) - architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) - dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Karta dojrzałości](/pl/maturity/scorecard) - jak dowody QA z wydań wspierają decyzje o stabilności i LTS.
- [Kanał QA](/pl/channels/qa-channel) - syntetyczny plugin transportowy używany przez scenariusze oparte na repozytorium.

Ta strona obejmuje uruchamianie zwykłych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed wypchnięciem): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na przestronnej maszynie: `pnpm test:max`
- Bezpośrednia pętla obserwowania Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia ukierunkowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Pasmo QA oparte na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów lub chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

## Katalogi tymczasowe testów

Preferuj współdzielone helpery w `test/helpers/temp-dir.ts` dla katalogów
tymczasowych należących do testów. Jawnie określają właścicielstwo i utrzymują sprzątanie w tym samym
cyklu życia testu:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` celowo nie udostępnia ręcznej metody sprzątania; Vitest
jest właścicielem sprzątania po każdym teście. Istniejące helpery niższego poziomu pozostają dla testów, które
jeszcze nie zostały przeniesione, ale nowe i migrowane testy powinny używać automatycznie czyszczącego
trackera. Unikaj nowego użycia ręcznych `makeTempDir`, `cleanupTempDirs` lub
`createTempDirTracker` oraz unikaj nowych bezpośrednich wywołań `fs.mkdtemp*` w testach,
chyba że przypadek jawnie weryfikuje surowe zachowanie temp-dir. Dodaj audytowalny
komentarz zezwalający z konkretnym powodem, gdy test celowo potrzebuje bezpośredniego katalogu
tymczasowego:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Dla widoczności migracji `node scripts/report-test-temp-creations.mjs` raportuje
nowe bezpośrednie tworzenie temp-dir i nowe ręczne użycie współdzielonych helperów w dodanych liniach
diffu, bez blokowania istniejących stylów sprzątania. Jego zakres plików celowo
stosuje tę samą klasyfikację ścieżek testów, której używa `scripts/changed-lanes.mjs`,
zamiast utrzymywać oddzielną heurystykę nazw plików helperów testowych, pomijając
samą implementację współdzielonego helpera. `check:changed` uruchamia ten raport dla
zmienionych ścieżek testów jako sygnał CI tylko z ostrzeżeniem; ustalenia są adnotacjami ostrzegawczymi
GitHub, a nie awariami.

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych danych uwierzytelniających):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ukierunkowanie jednego pliku live w trybie cichym: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności runtime: wywołaj `OpenClaw Performance` z
  `live_openai_candidate=true` dla rzeczywistego przebiegu agenta `openai/gpt-5.5` albo
  `deep_profile=true` dla artefaktów CPU/sterty/śledzenia Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty pasm mock-provider, deep-profile i GPT 5.5 do
  `openclaw/clawgrit-reports`, gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany. Raport
  mock-provider obejmuje również liczby dotyczące rozruchu Gateway na poziomie źródeł, pamięci,
  obciążenia pluginów, powtarzanej pętli hello-loop fałszywego modelu oraz startu CLI.
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz przebieg tekstowy oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też mały przebieg obrazowy.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` i ręczne
    `OpenClaw Release Checks` oba wywołują wielokrotnego użytku workflow live/E2E z
    `include_live_suites: true`, który obejmuje osobne zadania macierzy modeli live w Docker
    podzielone na shardy według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokim sygnale do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    zaplanowanych/wywoływanych przez wydanie callerów.
- Smoke test natywnego powiązanego czatu Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia pasmo live Docker względem ścieżki app-server Codex, wiąże syntetyczny
    Slack DM za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje zwykłą odpowiedź i trasę załącznika obrazu
    przez natywne powiązanie pluginu zamiast ACP.
- Smoke test uprzęży app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia przebiegi agenta Gateway przez należącą do pluginu uprząż app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    cron MCP, sub-agenta i Guardian. Wyłącz sondę sub-agenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla ukierunkowanego sprawdzenia sub-agenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie sub-agenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke test instalacji Codex na żądanie: `pnpm test:docker:codex-on-demand`
  - Instaluje spakowany tarball OpenClaw w Docker, uruchamia onboarding z kluczem API OpenAI
    i weryfikuje, że plugin Codex oraz zależność `@openai/codex`
    zostały pobrane na żądanie do zarządzanego katalogu głównego projektu npm.
- Smoke test zależności narzędzia pluginu live: `pnpm test:docker:live-plugin-tool`
  - Pakuje fixture plugin z rzeczywistą zależnością `slugify`, instaluje go przez
    `npm-pack:`, weryfikuje zależność pod zarządzanym katalogiem głównym projektu npm,
    a następnie prosi model OpenAI live o wywołanie narzędzia pluginu i zwrócenie ukrytego
    sluga.
- Smoke test polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne, dodatkowo zabezpieczające sprawdzenie powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke test plannera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback plannera przekłada się na audytowany typowany
    zapis konfiguracji.
- Smoke test pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, weryfikuje nowoczesny punkt wejścia onboard
    Crestodian, stosuje zapisy setup/model/agent/plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0
    jest również objęta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke test kosztów Moonshot/Kimi: z ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowany
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego failing case, preferuj zawężanie testów live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. Parzystość agentowa jest zagnieżdżona pod
`QA-Lab - All Lanes` i walidacją wydania, a nie jako samodzielny workflow PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA release-checks. Stabilne/domyślne sprawdzenia wydania
utrzymują wyczerpujący soak live/Docker za `run_release_soak=true`; profil
`full` wymusza włączenie soak. `QA-Lab - All Lanes`
uruchamia się nocą na `main` oraz z ręcznego wywołania z pasmem mock parity, pasmem live
Matrix, pasmem live Telegram zarządzanym przez Convex i pasmem live Discord
zarządzanym przez Convex jako zadaniami równoległymi. Zaplanowane QA i sprawdzenia wydań przekazują Matrix
`--profile fast` jawnie, podczas gdy domyślne wartości wejścia CLI Matrix i ręcznego workflow
pozostają `all`; ręczne wywołanie może podzielić `all` na zadania `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parzystość oraz szybkie pasma Matrix i Telegram przed zatwierdzeniem
wydania, używając `mock-openai/gpt-5.5` dla sprawdzeń transportu wydania, aby pozostały
deterministyczne i omijały normalny start pluginu dostawcy. Te Gateway transportu live
wyłączają wyszukiwanie w pamięci; zachowanie pamięci pozostaje objęte przez zestawy
QA parity.

Shardy pełnego wydania live media używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live Docker używają współdzielonego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commita, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
w każdym shardzie.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Zapisuje artefakty najwyższego poziomu `qa-evidence.json`, `qa-suite-summary.json` i
    `qa-suite-report.md` dla wybranego zestawu scenariuszy, w tym
    wybory scenariuszy mixed flow, Vitest i Playwright.
  - Gdy jest uruchamiane przez `pnpm openclaw qa run --qa-profile <profile>`, osadza
    kartę wyników wybranego profilu taksonomii w tym samym `qa-evidence.json`.
    `smoke-ci` zapisuje odchudzone dowody, co ustawia `evidenceMode: "slim"` i pomija
    `execution` dla poszczególnych wpisów. `release` obejmuje wybrany wycinek gotowości do wydania;
    `all` wybiera każdą aktywną kategorię dojrzałości i jest przeznaczone do jawnych uruchomień workflow
    QA Profile Evidence, gdy potrzebny jest pełny artefakt karty wyników.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    liczbą wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy się kodem różnym od zera, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu wyjścia.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania ścieżki
    `mock-openai` świadomej scenariuszy.
- `pnpm openclaw qa coverage --match <query>`
  - Przeszukuje identyfikatory scenariuszy, tytuły, powierzchnie, identyfikatory pokrycia, odwołania do dokumentacji, odwołania do kodu,
    plugins i wymagania dostawców, a następnie wypisuje pasujące cele zestawu.
  - Użyj tego przed uruchomieniem QA Lab, gdy znasz zmieniane zachowanie lub ścieżkę pliku,
    ale nie znasz najmniejszego scenariusza. Ma to wyłącznie charakter doradczy; nadal wybierz dowód mock,
    live, Multipass, Matrix lub transportowy na podstawie zmienianego zachowania.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia pełny live zestaw prób Plugin OpenAI Kitchen Sink przez QA Lab. Instaluje
    zewnętrzny pakiet Kitchen Sink, weryfikuje inwentarz powierzchni plugin SDK,
    sprawdza `/healthz` i `/readyz`, rejestruje dowody CPU/RSS Gateway,
    uruchamia live turę OpenAI i sprawdza diagnostykę adwersarialną.
    Wymaga live uwierzytelnienia OpenAI, takiego jak `OPENAI_API_KEY`. W uwodnionych sesjach Testbox
    automatycznie pobiera profil live-auth Testbox, gdy obecny jest helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet scenariuszy QA Lab z mockami
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje wysokiego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są rejestrowane jako metryki
    bez wyglądania jak wielominutowa regresja obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma jeszcze
    świeżego wyjścia runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA w jednorazowej maszynie wirtualnej Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane dane wejściowe uwierzytelniania QA, które są praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje normalny raport QA i podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Dockerze stronę QA do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime plugin ładuje się bez naprawy zależności przy starcie,
    uruchamia doctor i uruchamia jedną lokalną turę agenta wobec
    zamockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietu
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke Docker zbudowanej aplikacji dla osadzonych transkryptów kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlany komunikat niestandardowy zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydujący pakiet OpenClaw w Dockerze, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    live ścieżki QA Telegram z tym zainstalowanym pakietem jako testowanym Gateway SUT.
  - Wrapper montuje z checkoutu tylko źródło harnessa `qa-lab`; zainstalowany
    pakiet jest właścicielem `dist`, `openclaw/plugin-sdk` i runtime bundled plugin,
    więc ścieżka nie miesza plugins z bieżącego checkoutu do testowanego pakietu.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` albo
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby zamiast instalacji z rejestru testować rozwiązany lokalny tarball.
  - Domyślnie emituje powtarzane pomiary czasu RTT w `qa-evidence.json` z
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Nadpisz
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` albo
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostroić uruchomienie RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` przyjmuje rozdzieloną przecinkami listę
    identyfikatorów kontroli QA Telegram do próbkowania; gdy nie jest ustawione, domyślną kontrolą
    obsługującą RTT jest `telegram-mentioned-message-reply`.
  - Używa tych samych poświadczeń env Telegram albo źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` oraz sekret roli Convex są obecne w CI,
    wrapper Docker wybiera Convex automatycznie.
  - Wrapper waliduje env poświadczeń Telegram albo Convex na hoście przed
    pracą build/install Docker. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko podczas celowego debugowania konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki. Gdy wybrane są poświadczenia Convex
    i nie ustawiono roli, wrapper używa `ci` w CI oraz
    `maintainer` poza CI.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainerów
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia także `Package Acceptance` dla pobocznego dowodu produktu
  wobec jednego kandydującego pakietu. Przyjmuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący harmonogram Docker E2E z profilami ścieżek smoke, package, product, full albo custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić workflow QA Telegram
  wobec tego samego artefaktu `package-under-test`.
  - Najnowszy dowód produktu beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Dowód dokładnego URL tarballa wymaga skrótu i używa publicznej polityki bezpieczeństwa URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Firmowe/prywatne mirrory tarballi używają jawnej polityki zaufanego źródła:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` odczytuje `.github/package-trusted-sources.json` z zaufanego ref workflow i nie akceptuje poświadczeń URL ani obejścia sieci prywatnej przez dane wejściowe workflow. Jeśli nazwana polityka deklaruje uwierzytelnianie bearer, skonfiguruj stały sekret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Dowód artefaktu pobiera artefakt tarballa z innego uruchomienia Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pakuje i instaluje bieżący build OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza bundled channel/plugins przez edycje konfiguracji.
  - Weryfikuje, że odkrywanie konfiguracji pozostawia nieskonfigurowane pobieralne plugins nieobecne,
    pierwsza skonfigurowana naprawa doctor instaluje jawnie każdy brakujący pobieralny
    plugin, a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje także znany starszy baseline npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po aktualizacji
    czyści pozostałości zależności legacy plugin bez naprawy postinstall po stronie harnessa.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji instalacji pakietu na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json`, aby uzyskać ścieżkę artefaktu podsumowania i
    status każdej ścieżki.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` dla live dowodu tury agenta.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owiń długie lokalne uruchomienia timeoutem hosta, aby zastoje transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`
    przed założeniem, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić od 10 do 15 minut w doctor po aktualizacji i pracach
    aktualizacji pakietów na zimnym gościu; nadal jest to zdrowy stan, gdy zagnieżdżony log debug npm
    postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi ścieżkami smoke Parallels
    macOS, Windows albo Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietu albo stanie Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię bundled plugin, ponieważ
    fasady capability, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez API bundled runtime nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer providera AIMock do bezpośrednich testów smoke
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę QA Matrix na żywo względem jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródłowy - instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów: [QA Matrix](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę QA Telegram na żywo względem rzeczywistej grupy prywatnej, używając tokenów bota sterownika i bota SUT ze środowiska.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Domyślne ustawienia obejmują canary, bramkowanie wzmianek, adresowanie poleceń, `/status`, wspomniane odpowiedzi bot-bot oraz natywne odpowiedzi poleceń rdzenia. Domyślne ustawienia `mock-openai` obejmują także deterministyczne regresje łańcucha odpowiedzi i streamingu końcowej wiadomości Telegram. Użyj `--list-scenarios`, aby zobaczyć opcjonalne sondy, takie jak `session_status`.
  - Kończy działanie z kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
  - Wymaga dwóch różnych botów w tej samej grupie prywatnej, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Aby stabilnie obserwować komunikację bot-bot, włącz tryb komunikacji bot-bot w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i `qa-evidence.json` w `.artifacts/qa-e2e/...`. Scenariusze z odpowiedziami zawierają RTT od żądania wysłania sterownika do zaobserwowanej odpowiedzi SUT.

`Mantis Telegram Live` to wrapper dowodowy PR wokół tej ścieżki. Uruchamia
ref kandydujący z poświadczeniami Telegram dzierżawionymi przez Convex, renderuje zredagowany pakiet raportu/dowodów QA w przeglądarce desktopowej Crabbox, nagrywa dowód MP4,
generuje GIF przycięty do ruchu, przesyła pakiet artefaktów i publikuje dowód PR
inline przez aplikację Mantis GitHub App, gdy ustawiono `pr_number`. Maintainerzy mogą
uruchomić go z interfejsu Actions przez `Mantis Scenario` (`scenario_id:
telegram-live`) albo bezpośrednio z komentarza pull requesta:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` to agentowy natywny wrapper Telegram Desktop
przed/po dla wizualnego dowodu PR. Uruchom go z interfejsu Actions z
dowolnymi `instructions`, przez `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) albo z komentarza PR:

```text
@openclaw-mantis telegram desktop proof
```

Agent Mantis czyta PR, decyduje, jakie widoczne w Telegram zachowanie dowodzi
zmiany, uruchamia ścieżkę dowodową rzeczywistego użytkownika Crabbox Telegram Desktop na refach bazowym i
kandydującym, iteruje, aż natywne GIF-y będą użyteczne, zapisuje sparowany
manifest `motionPreview` i publikuje tę samą 2-kolumnową tabelę GIF przez
aplikację Mantis GitHub App, gdy ustawiono `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Dzierżawi lub ponownie używa desktopu Linux Crabbox, instaluje natywny Telegram Desktop, konfiguruje OpenClaw z dzierżawionym tokenem bota SUT Telegram, uruchamia Gateway i nagrywa dowody w postaci zrzutu ekranu/MP4 z widocznego desktopu VNC.
  - Domyślnie używa `--credential-source convex`, więc workflowy potrzebują tylko sekretu brokera Convex. Użyj `--credential-source env` z tymi samymi zmiennymi `OPENCLAW_QA_TELEGRAM_*` co `pnpm openclaw qa telegram`.
  - Telegram Desktop nadal potrzebuje logowania/profilu użytkownika. Token bota konfiguruje tylko OpenClaw. Użyj `--telegram-profile-archive-env <name>` dla archiwum profilu `.tgz` w base64 albo użyj `--keep-lease` i zaloguj się ręcznie przez VNC raz.
  - Zapisuje `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` i `telegram-desktop-builder.mp4` w katalogu wyjściowym.

Ścieżki transportu na żywo współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia poszczególnych ścieżek znajduje się w [przeglądzie QA → Pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki syntetyczny zestaw i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
QA transportu na żywo, QA lab uzyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat dla tej
dzierżawy w trakcie działania ścieżki i zwalnia dzierżawę przy zamykaniu. Nazwa sekcji poprzedza
obsługę Discord, Slack i WhatsApp; kontrakt dzierżawy jest współdzielony między rodzajami.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślnie ze środowiska: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na adresy URL Convex `http://` przez local loopback wyłącznie do lokalnego rozwoju.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno używać `https://` w normalnym działaniu.

Polecenia administracyjne maintainera (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami na żywo, aby sprawdzić adres URL witryny Convex, sekrety brokera,
prefiks punktu końcowego, limit czasu HTTP oraz osiągalność admin/list bez drukowania
wartości sekretów. Użyj `--json`, aby uzyskać wynik czytelny maszynowo w skryptach i narzędziach
CI.

Domyślny kontrakt punktu końcowego (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/ponawialne: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Sukces: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukces: `{ status: "ok" }` (albo puste `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukces: `{ status: "ok" }` (albo puste `2xx`)
- `POST /admin/add` (tylko sekret maintainera)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Sukces: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret maintainera)
  - Żądanie: `{ credentialId, actorId }`
  - Sukces: `{ status: "ok", changed, credential }`
  - Ochrona aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret maintainera)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Sukces: `{ status: "ok", credentials, count }`

Kształt ładunku dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym ciągiem identyfikatora czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe ładunki.

Kształt ładunku dla rodzaju rzeczywistego użytkownika Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` i `telegramApiId` muszą być ciągami numerycznymi.
- `tdlibArchiveSha256` i `desktopTdataArchiveSha256` muszą być ciągami szesnastkowymi SHA-256.
- `kind: "telegram-user"` jest zarezerwowane dla workflowu dowodowego Mantis Telegram Desktop. Ogólne ścieżki QA Lab nie mogą go pobierać.

Ładunki wielokanałowe walidowane przez brokera:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Ścieżki Slack mogą także dzierżawić z puli, ale walidacja ładunku Slack obecnie
znajduje się w runnerze QA Slack, a nie w brokerze. Użyj
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
dla wierszy Slack.

### Dodawanie kanału do QA

Architektura i nazwy helperów scenariuszy dla nowych adapterów kanałów znajdują się w [przeglądzie QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonej seam hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Myśl o zestawach jako o „rosnącym realizmie” (oraz rosnącej niestabilności/koszcie):

### Unit / integracja (domyślnie)

- Polecenie: `pnpm test`
- Konfiguracja: nietargetowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt w celu równoległego harmonogramowania
- Pliki: inwentarze unit rdzenia w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy unit UI uruchamiają się w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy unit
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga rzeczywistych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallback `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych minimalnych fixture'ów Plugin, a nie
    rzeczywistych API źródłowych bundled Plugin. Rzeczywiste ładowania API Plugin należą do
    zestawów kontraktowych/integracyjnych utrzymywanych przez właściciela Plugin.

Zasady dotyczące zależności natywnych:

- Domyślne instalacje testowe pomijają opcjonalne natywne buildy Discord opus. Głos Discord używa bundled `libopus-wasm`, a `@discordjs/opus` pozostaje wyłączone w `allowBuilds`, więc lokalne testy i ścieżki Testbox nie kompilują natywnego addonu.
- Porównuj wydajność natywnego opus w repo benchmarku `libopus-wasm`, a nie w domyślnych pętlach install/test OpenClaw. Nie ustawiaj `@discordjs/opus` na `true` w domyślnym `allowBuilds`; to sprawia, że niepowiązane pętle install/test kompilują kod natywny.

<AccordionGroup>
  <Accordion title="Projekty, shardy i ścieżki zakresowe">

    - Nieukierunkowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega zagłodzeniu niepowiązanych zestawów przez zadania auto-reply/rozszerzeń.
    - `pnpm test --watch` nadal używa natywnego głównego grafu projektu `vitest.config.ts`, ponieważ pętla obserwacji z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika płacenia pełnego kosztu startu projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git na tanie zakresowe ścieżki: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności grafu importów. Edycje konfiguracji/konfiguracji startowej/pakietów nie uruchamiają szerokiego zestawu testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzająca dla wąskich zmian. Klasyfikuje diff na rdzeń, testy rdzenia, rozszerzenia, testy rozszerzeń, aplikacje, dokumentację, metadane wydań, narzędzia Docker live i narzędzia, a następnie uruchamia pasujące polecenia sprawdzania typów, lintowania i strażników. Nie uruchamia testów Vitest; użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego. Podbicia wersji dotyczące wyłącznie metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównego pakietu, ze strażnikiem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje harnessu Docker ACP live uruchamiają skupione kontrole: składnię powłoki dla skryptów uwierzytelniania Docker live i próbny przebieg harmonogramu Docker live. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff jest ograniczony do `scripts["test:docker:live-*"]`; edycje zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych strażników.
    - Lekkie pod względem importów testy jednostkowe z obszarów agentów, poleceń, Pluginów, pomocników auto-reply, `plugin-sdk` i podobnych czystych narzędzi trafiają do ścieżki `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` także mapują uruchomienia w trybie zmian na jawne sąsiednie testy w tych lekkich ścieżkach, więc edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane kubełki dla pomocników rdzenia najwyższego poziomu, testów integracyjnych `reply.*` najwyższego poziomu i poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo odpowiedzi na shardy agent-runner, dispatch i commands/state-routing, aby jeden kubełek ciężki od importów nie posiadał całego ogona Node.
    - Normalne CI dla PR/main celowo pomija zbiorcze przemiatanie rozszerzeń i shard `agentic-plugins` tylko dla wydań. Pełna walidacja wydania uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych zestawów mocno obciążających Pluginy/rozszerzenia na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie osadzonego runnera">

    - Gdy zmieniasz wejścia wykrywania narzędzi wiadomości albo kontekst runtime
      Compaction, zachowaj oba poziomy pokrycia.
    - Dodaj skupione regresje pomocników dla granic czystego routingu i normalizacji.
    - Utrzymuj zestawy integracyjne osadzonego runnera w dobrym stanie:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` i
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że zakresowe identyfikatory i zachowanie Compaction nadal przechodzą
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocników
      nie są wystarczającym zamiennikiem dla tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli i izolacji Vitest">

    - Podstawowa konfiguracja Vitest domyślnie używa `threads`.
    - Wspólna konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, e2e i konfiguracjach live.
    - Główna ścieżka UI zachowuje swoje ustawienie `jsdom` i optymalizator, ale także działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Vitest w Node,
      aby zmniejszyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać z bazowym zachowaniem V8.
    - `scripts/run-vitest.mjs` kończy jawne uruchomienia Vitest bez trybu watch po
      5 minutach bez wyjścia stdout ani stderr. Ustaw
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, aby wyłączyć watchdog dla
      celowo cichego dochodzenia.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne uruchamia diff.
    - Hook pre-commit dotyczy tylko formatowania. Ponownie dodaje sformatowane pliki do stagingu i
      nie uruchamia lintowania, sprawdzania typów ani testów.
    - Uruchom `pnpm check:changed` jawnie przed przekazaniem lub wypchnięciem, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowe ścieżki. Użyj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      zdecyduje, że edycja harnessu, konfiguracji, pakietu albo kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Automatyczne skalowanie lokalnych workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoległych
      uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Podstawowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, aby ponowne uruchomienia w trybie zmian pozostawały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache dla bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      wyjście rozbicia importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI z wzorcem include
      dopisują nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu w importach startowych,
      trzymaj ciężkie zależności za wąską lokalną granicą `*.runtime.ts` i
      mockuj tę granicę bezpośrednio zamiast importować głęboko pomocniki runtime tylko
      po to, aby przepuścić je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas rzeczywisty oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu jednostkowego z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszona na jednego workera
- Zakres:
  - Uruchamia rzeczywisty loopback Gateway z diagnostyką domyślnie włączoną
  - Przepuszcza syntetyczny ruch wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki utrwalania pakietu stabilności diagnostycznej
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek na sesję wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka dla działań następczych po regresji stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (agregat repozytorium)

- Polecenie: `pnpm test:e2e`
- Zakres:
  - Uruchamia ścieżkę E2E smoke Gateway
  - Uruchamia ścieżkę E2E przeglądarki mockowanego Control UI
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wymaga zainstalowanego Playwright Chromium

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e:gateway`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Pluginów pod `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` do wymuszenia liczby workerów (ograniczone do 16).
  - `OPENCLAW_E2E_VERBOSE=1` do ponownego włączenia szczegółowego wyjścia konsoli.
- Zakres:
  - Zachowanie gateway end-to-end dla wielu instancji
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższa obsługa sieci
- Oczekiwania:
  - Działa w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż w testach jednostkowych (może być wolniejsze)

### E2E (mockowana przeglądarka Control UI)

- Polecenie: `pnpm test:ui:e2e`
- Konfiguracja: `test/vitest/vitest.ui-e2e.config.ts`
- Pliki: `ui/src/**/*.e2e.test.ts`
- Zakres:
  - Uruchamia Vite Control UI
  - Steruje rzeczywistą stroną Chromium przez Playwright
  - Zastępuje WebSocket Gateway deterministycznymi mockami w przeglądarce
- Oczekiwania:
  - Działa w CI jako część `pnpm test:e2e`
  - Nie wymaga prawdziwego Gateway, agentów ani kluczy dostawców
  - Zależność przeglądarki musi być obecna (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Ponownie używa aktywnego lokalnego gateway OpenShell
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje kanoniczne zdalnie zachowanie systemu plików przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Wymaga aktywnego lokalnego gateway OpenShell i jego źródła konfiguracji
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1` do włączenia testu podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` do wskazania niedomyślnego binarium CLI albo skryptu opakowującego
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` do wystawienia zarejestrowanej konfiguracji gateway dla izolowanego testu
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` do nadpisania IP gateway Docker używanego przez fixture polityki hosta

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wychwytywanie zmian formatu dostawców, osobliwości wywoływania narzędzi, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia nie jest stabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / wykorzystuje limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live używają już wyeksportowanych kluczy API i przygotowanych profili uwierzytelniania.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracji/uwierzytelniania do tymczasowego katalogu domowego testów, aby fixtures jednostkowe nie mogły zmodyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa w cichszym trybie: zachowuje wyjście postępu `[live] ...` i wycisza logi uruchamiania gatewaya/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) lub nadpisanie dla pojedynczego live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby po odpowiedziach z limitem szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz wiersze postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli przez Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, dzięki czemu wiersze postępu dostawcy/gatewaya są strumieniowane natychmiast podczas uruchomień live.
  - Dostrój Heartbeat bezpośrednich modeli za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój Heartbeat gatewaya/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykanie sieci gatewaya / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Informacje o macierzy modeli live, smoke testach backendu CLI, smoke testach ACP, harnessie serwera aplikacji Codex oraz wszystkich testach live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, harness mediów) - plus obsługa danych uwierzytelniających dla uruchomień live - znajdziesz w
[Testowanie zestawów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i walidacji Pluginów znajdziesz w
[Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne sprawdzenia „działa w Linuksie”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczami profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji, workspace i opcjonalny plik env profilu. Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery live Docker zachowują własne praktyczne limity tam, gdzie są potrzebne:
  `test:docker:live-models` domyślnie używa kuratorowanego obsługiwanego zestawu o wysokiej wartości sygnału, a
  `test:docker:live-gateway` domyślnie używa `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ustaw `OPENCLAW_LIVE_MAX_MODELS`
  lub zmienne env gatewaya, gdy wyraźnie chcesz mniejszy limit albo większe skanowanie.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz bare jest tylko runnerem Node/Git dla ścieżek install/update/plugin-dependency; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego schedulera: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów powstrzymują ciężkie ścieżki live, npm-install i wielousługowe przed jednoczesnym startem. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, scheduler nadal może ją uruchomić, gdy pula jest pusta, a potem utrzymuje ją jako jedyną działającą, dopóki pojemność nie będzie ponownie dostępna. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, drukuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w późniejszych uruchomieniach najpierw startować dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować ważony manifest ścieżek bez budowania lub uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wydrukować plan CI dla wybranych ścieżek, potrzeb pakietów/obrazów i danych uwierzytelniających.
- `Package Acceptance` to natywna dla GitHuba bramka pakietu dla pytania „czy ten instalowalny tarball działa jako produkt?” Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E przeciwko dokładnie temu tarballowi zamiast ponownie pakować wybrany ref. Profile są uporządkowane według zakresu: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/Pluginu, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydań i triage awarii.
- Sprawdzenia budowania i wydań uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Guard przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` i kończy się niepowodzeniem, jeśli uruchamianie przed dispatch importuje zależności pakietów, takie jak Commander, interfejs promptów, undici albo logowanie, przed dispatch polecenia; utrzymuje także dołączony chunk uruchomienia gatewaya w budżecie i odrzuca statyczne importy znanych zimnych ścieżek gatewaya. Smoke pakietowanego CLI obejmuje także root help, onboard help, doctor help, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego punktu odcięcia harness toleruje tylko luki metadanych wysłanych pakietów: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brak plików patch w fixture git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Pluginów, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi niepowodzeniami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracji wyższego poziomu.
- Ścieżki Docker/Bash E2E, które instalują spakowany tarball OpenClaw przez `scripts/lib/openclaw-e2e-instance.sh`, ograniczają `npm install` do `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (domyślnie `600s`; ustaw `0`, aby wyłączyć wrapper do debugowania).

Runnery Docker modeli live montują przez bind także tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke bindowania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessa serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke testy obserwowalności: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` i `pnpm qa:observability:smoke` to prywatne ścieżki QA checkoutu źródeł. Celowo nie są częścią pakietowych ścieżek wydań Docker, ponieważ tarball npm pomija QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke onboardingu/kanału/agenta tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding env-ref oraz domyślnie Telegram, uruchamia doctor i uruchamia jedną mockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta za pomocą `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał za pomocą `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke test ścieżki użytkownika wydania: `pnpm test:docker:release-user-journey` instaluje spakowany tarball OpenClaw globalnie w czystym katalogu domowym Docker, uruchamia onboarding, konfiguruje mockowanego dostawcę OpenAI, wykonuje turę agenta, instaluje/odinstalowuje zewnętrzne pluginy, konfiguruje ClickClack względem lokalnego fixture, weryfikuje wiadomości wychodzące/przychodzące, restartuje Gateway i uruchamia doctor.
- Smoke test typowanego onboardingu wydania: `pnpm test:docker:release-typed-onboarding` instaluje spakowany tarball, prowadzi `openclaw onboard` przez prawdziwe TTY, konfiguruje OpenAI jako dostawcę z referencją do zmiennej środowiskowej, weryfikuje brak utrwalania surowego klucza i uruchamia mockowaną turę agenta.
- Smoke test mediów/pamięci wydania: `pnpm test:docker:release-media-memory` instaluje spakowany tarball, weryfikuje rozumienie obrazu z załącznika PNG, dane wyjściowe generowania obrazów zgodnego z OpenAI, przypominanie z wyszukiwania w pamięci oraz przetrwanie przypominania po restarcie Gateway.
- Smoke test ścieżki użytkownika aktualizacji wydania: `pnpm test:docker:release-upgrade-user-journey` domyślnie instaluje najnowszą opublikowaną wersję bazową starszą niż tarball kandydata, konfiguruje stan dostawcy/pluginu/ClickClack na opublikowanym pakiecie, aktualizuje do tarballa kandydata, a następnie ponownie uruchamia podstawową ścieżkę agenta/pluginu/kanału. Jeśli nie istnieje starsza opublikowana wersja bazowa, używa ponownie wersji kandydata. Nadpisz wersję bazową za pomocą `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke test marketplace pluginów wydania: `pnpm test:docker:release-plugin-marketplace` instaluje z lokalnego fixture marketplace, aktualizuje zainstalowany plugin, odinstalowuje go i weryfikuje, że CLI pluginu znika wraz z przycięciem metadanych instalacji.
- Smoke test instalacji Skills: `pnpm test:docker:skill-install` instaluje spakowany tarball OpenClaw globalnie w Docker, wyłącza instalacje przesłanych archiwów w konfiguracji, rozwiązuje bieżący aktywny slug Skills z ClawHub z wyszukiwania, instaluje go za pomocą `openclaw skills install` i weryfikuje zainstalowany Skills oraz metadane pochodzenia/blokady `.clawhub`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Docker, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie pluginu po aktualizacji, następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na zanieczyszczonym fixture starego użytkownika z agentami, konfiguracją kanału, listami dozwolonych pluginów, przestarzałym stanem zależności pluginów oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez aktywnego dostawcy ani kluczy kanału, następnie startuje Gateway w local loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchomienia/statusu.
- Smoke test przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje tę wersję bazową wbudowaną receptą poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do tarballa kandydata, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie startuje Gateway w local loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchomienie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną wersję bazową za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś agregujący scheduler o rozszerzenie dokładnych lokalnych wersji bazowych za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oraz rozszerz fixture w kształcie zgłoszeń za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takich jak `reported-issues`; zestaw reported-issues zawiera `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych pluginów OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje meta tokeny wersji bazowej, takie jak `last-stable-4` lub `all-since-2026.4.23`, a Full Release Validation rozszerza bramkę pakietu release-soak do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego transkryptu kontekstu runtime oraz naprawę przez doctor dotkniętych zduplikowanych gałęzi przepisywania promptu.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je za pomocą `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca wbudowanych dostawców obrazów zamiast zawieszać się. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej wersji bazowej przed aktualizacją do tarballa kandydata. Nadpisz lokalnie za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo przez wejście `update_baseline_version` workflow Install Smoke na GitHub. Kontrole instalatora bez roota zachowują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do roota nie maskowały lokalnego zachowania instalacji użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów z jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zatrzymanego workspace. Użyj ponownie obrazu install-smoke za pomocą `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test migawki CDP przeglądarki: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E plus warstwę Chromium, startuje Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP obejmują URL-e linków, elementy klikalne promowane przez kursor, referencje iframe i metadane ramek.
- Regresja minimalnego reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowe szczegóły pojawiają się w logach Gateway.
- Most kanału MCP (zasilony Gateway + most stdio + surowy smoke test ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu OpenClaw (prawdziwy serwer MCP stdio + osadzony smoke test allow/deny profilu OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (skrypt: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagenta (prawdziwy Gateway + sprzątanie procesu potomnego MCP stdio po izolowanym Cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, nieprawidłowych metadanych pakietu npm, ruchomych referencji git, pełnego fixture ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime pełnego fixture za pomocą `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixture ClawHub.
- Smoke test niezmienionej aktualizacji pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test macierzy cyklu życia pluginu: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowany tarball OpenClaw w pustym kontenerze, instaluje plugin npm, przełącza włączenie/wyłączenie, aktualizuje go i cofa wersję przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa przestarzały stan, jednocześnie logując metryki RSS/CPU dla każdej fazy cyklu życia.
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fixture ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje niezmienione zachowanie aktualizacji zainstalowanych pluginów. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje instalację pluginu npm ze śledzeniem zasobów, włączenie, wyłączenie, aktualizację, cofnięcie wersji oraz odinstalowanie przy brakującym kodzie.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazu specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny obraz współdzielony, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Bieżące runnery Dockera dla modeli live również montują bieżący checkout w trybie tylko do odczytu i
przygotowują go w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje smukły, a Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże, wyłącznie lokalne cache i wyniki budowania aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyjściowe `.build` lub
Gradle, aby uruchomienia live w Dockerze nie traciły minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live gatewaya nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itp. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie live gatewaya
z tej ścieżki Dockera.
`test:docker:openwebui` to wyższego poziomu smoke test zgodności: uruchamia
kontener gatewaya OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego gatewaya, loguje się przez
Open WebUI, sprawdza, czy `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Ustaw `OPENWEBUI_SMOKE_MODE=models` dla kontroli CI ścieżki wydania, które powinny zakończyć się
po zalogowaniu w Open WebUI i wykryciu modelu, bez czekania na ukończenie modelu live.
Pierwsze uruchomienie może być wyraźnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć dokończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza modelu live. Podaj go przez środowisko procesu,
przygotowane profile uwierzytelniania lub jawny `OPENCLAW_PROFILE_FILE`.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasilony danymi kontener Gateway,
startuje drugi kontener, który wywołuje `openclaw mcp serve`, a następnie
sprawdza routowane wykrywanie konwersacji, odczyty transkrypcji, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia kanału w stylu Claude +
uprawnień przez rzeczywisty most MCP stdio. Kontrola powiadomień
bezpośrednio analizuje surowe ramki MCP stdio, więc smoke test weryfikuje to, co
most rzeczywiście emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.
`test:docker:agent-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu live.
Buduje obraz Dockera repozytorium, uruchamia rzeczywisty serwer sondy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime pakietu OpenClaw
MCP, wykonuje narzędzie, a następnie sprawdza, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia zasilony danymi Gateway z rzeczywistym serwerem sondy MCP stdio, wykonuje
izolowany przebieg cron i jednorazowy przebieg podrzędny `sessions_spawn`, a następnie sprawdza,
czy proces podrzędny MCP kończy się po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montowane i wczytywane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montowań uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache'owanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelniania CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawcy montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listy rozdzielanej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowania
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profili (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzający nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz również kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „rzeczywistego potoku” bez rzeczywistych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, rzeczywisty gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymuszone uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez rzeczywisty gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują połączenie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Decyzyjność:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przeniesienie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do sprawdzania wywołań narzędzi + kolejności, odczytów plików skill i połączenia sesji.
- Mały zestaw scenariuszy skupionych na skillach (użyj vs unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu oraz zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
pomija te współdzielone pliki smoke i granic; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanału lub dostawcy.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt pluginu (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy
- **group-policy** - Wymuszanie polityki grupy

### Kontrakty statusu dostawcy

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru pluginów

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu uwierzytelniania
- **auth-choice** - Wybór/selekcja uwierzytelniania
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie pluginów
- **loader** - Ładowanie pluginów
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu albo zmodyfikowaniu pluginu kanału lub dostawcy
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe działają w CI i nie wymagają rzeczywistych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest z natury wyłącznie live (limity szybkości, polityki uwierzytelniania), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wykrywa błąd:
  - błąd konwersji/odtworzenia żądania dostawcy → bezpośredni test modeli
  - błąd potoku sesji/historii/narzędzi gatewaya → smoke test live gatewaya albo bezpieczny dla CI mockowy test gatewaya
- Bariera ochronna przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że exec id z segmentami przejścia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo zawodzi na niesklasyfikowanych identyfikatorach celów, aby nowe klasy nie mogły zostać po cichu pominięte.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
