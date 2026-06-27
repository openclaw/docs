---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: pakiety unit/e2e/live, uruchamiacze Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-06-27T17:41:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (jednostkowe/integracyjne, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed wypchnięciem, debugowanie).
- Jak testy live wykrywają dane uwierzytelniające i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, ścieżki transportu live)** jest udokumentowany osobno:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) - architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Macierz QA](/pl/concepts/qa-matrix) - dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Karta wyników dojrzałości](/pl/maturity/scorecard) - jak dowody QA z wydań wspierają decyzje o stabilności i LTS.
- [Kanał QA](/pl/channels/qa-channel) - syntetyczny plugin transportowy używany przez scenariusze oparte na repozytorium.

Ta strona opisuje uruchamianie zwykłych zestawów testów oraz runnerów Docker/Parallels. Poniższa sekcja dotycząca runnerów QA ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed wypchnięciem): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużymi zasobami: `pnpm test:max`
- Bezpośrednia pętla obserwacji Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj ukierunkowane uruchomienia.
- Witryna QA oparta na Dockerze: `pnpm qa:lab:up`
- Ścieżka QA oparta na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów lub chcesz większej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw e2e: `pnpm test:e2e`

## Tymczasowe katalogi testowe

Preferuj współdzielone helpery z `test/helpers/temp-dir.ts` dla należących do testów
katalogów tymczasowych. Jawnie określają własność i utrzymują sprzątanie w tym samym
cyklu życia testu:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

Używaj `makeTempDir(tempDirs, prefix)` i `cleanupTempDirs(tempDirs)`, gdy test
już posiada tablicę lub zbiór ścieżek. Unikaj nowych gołych wywołań `fs.mkdtemp*` w
testach, chyba że przypadek wyraźnie weryfikuje surowe zachowanie katalogu tymczasowego. Dodaj
audytowalny komentarz zezwalający z konkretnym powodem, gdy test celowo potrzebuje
gołego katalogu tymczasowego:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Dla widoczności migracji `node scripts/report-test-temp-creations.mjs` raportuje
nowe gołe tworzenie katalogów tymczasowych w dodanych liniach diffu, bez blokowania istniejących
stylów sprzątania. Jego zakres plików celowo stosuje tę samą klasyfikację ścieżek testowych,
której używa `scripts/changed-lanes.mjs`, zamiast utrzymywać osobną heurystykę nazw
plików helperów testowych, pomijając samą implementację współdzielonego helpera.
`check:changed` uruchamia ten raport dla zmienionych ścieżek testowych jako sygnał CI
tylko z ostrzeżeniem; znaleziska są adnotacjami ostrzeżeń GitHub, a nie awariami.

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych danych uwierzytelniających):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche wskazanie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności runtime: wyślij `OpenClaw Performance` z
  `live_openai_candidate=true` dla rzeczywistej tury agenta `openai/gpt-5.5` lub
  `deep_profile=true` dla artefaktów CPU/sterty/śladu Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty ścieżek mock-provider, deep-profile i GPT 5.5 do
  `openclaw/clawgrit-reports`, gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider obejmuje także liczby dla uruchomienia Gateway na poziomie źródeł, pamięci,
  plugin-pressure, powtarzanej pętli hello-loop z fałszywym modelem oraz startu CLI.
- Przemiatanie modeli live w Dockerze: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też małą turę z obrazem.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` i ręczne
    `OpenClaw Release Checks` wywołują współużywany przepływ pracy live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live Docker
    podzielone według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI wyślij `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokim sygnale do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    zaplanowanych/release'owych wywołań.
- Smoke test natywnego czatu powiązanego Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia ścieżkę live Docker względem ścieżki serwera aplikacji Codex, wiąże syntetyczną
    wiadomość prywatną Slack za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje zwykłą odpowiedź i trasę załącznika obrazu
    przez natywne powiązanie pluginu zamiast ACP.
- Smoke test harnessa serwera aplikacji Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agentów Gateway przez należący do pluginu harness serwera aplikacji Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    Cron MCP, podagenta i Guardian. Wyłącz sondę podagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    serwera aplikacji Codex. Dla ukierunkowanego sprawdzenia podagenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Kończy działanie po sondzie podagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke test instalacji Codex na żądanie: `pnpm test:docker:codex-on-demand`
  - Instaluje spakowany tarball OpenClaw w Dockerze, uruchamia onboarding klucza API OpenAI
    i weryfikuje, że plugin Codex oraz zależność `@openai/codex`
    zostały pobrane na żądanie do zarządzanego katalogu głównego projektu npm.
- Smoke test zależności narzędzi pluginu live: `pnpm test:docker:live-plugin-tool`
  - Pakuje fixture plugin z rzeczywistą zależnością `slugify`, instaluje go przez
    `npm-pack:`, weryfikuje zależność w zarządzanym katalogu głównym projektu npm,
    a następnie prosi model OpenAI live o wywołanie narzędzia pluginu i zwrócenie ukrytego
    sluga.
- Smoke test polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne, dodatkowe sprawdzenie powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke test planisty Crestodian w Dockerze: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback planisty przekłada się na audytowany typowany
    zapis konfiguracji.
- Smoke test pierwszego uruchomienia Crestodian w Dockerze: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, weryfikuje nowoczesny punkt wejścia onboard
    Crestodian, stosuje zapisy setup/model/agent/plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0
    jest także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke test kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypt asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego zawodzącego przypadku, preferuj zawężanie testów live za pomocą zmiennych środowiskowych listy dozwolonych opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia są używane obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych przepływach pracy. Parzystość agentowa jest zagnieżdżona pod
`QA-Lab - All Lanes` oraz walidacją wydania, a nie jako samodzielny przepływ pracy PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA release-checks. Stabilne/domyślne sprawdzenia wydania
trzymają wyczerpujące soak testy live/Docker za `run_release_soak=true`; profil
`full` wymusza soak. `QA-Lab - All Lanes`
uruchamia się nocą na `main` oraz z ręcznego wywołania ze ścieżką parzystości mock, ścieżką live
Matrix, zarządzaną przez Convex ścieżką live Telegram i zarządzaną przez Convex ścieżką live Discord
jako zadaniami równoległymi. Zaplanowane QA i sprawdzenia wydań przekazują Matrix
`--profile fast` jawnie, podczas gdy CLI Matrix i ręczne wejście przepływu pracy
pozostają domyślnie `all`; ręczne wywołanie może podzielić `all` na zadania
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parzystość oraz szybkie ścieżki Matrix i Telegram przed zatwierdzeniem
wydania, używając `mock-openai/gpt-5.5` do sprawdzeń transportu wydania, aby pozostały
deterministyczne i unikały normalnego startu pluginu dostawcy. Te Gatewaye transportu live
wyłączają wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez zestawy
parzystości QA.

Pełne release'owe shardy mediów live używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live Docker używają współdzielonego
obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commita, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
wewnątrz każdego sharda.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Zapisuje najwyższego poziomu artefakty `qa-evidence.json`, `qa-suite-summary.json` i
    `qa-suite-report.md` dla wybranego zestawu scenariuszy, w tym wybory
    scenariuszy przepływu mieszanego, Vitest i Playwright.
  - Gdy uruchamiane przez `pnpm openclaw qa run --qa-profile <profile>`, osadza
    kartę wyników wybranego profilu taksonomii w tym samym `qa-evidence.json`.
    `smoke-ci` zapisuje odchudzone dowody, co ustawia `evidenceMode: "slim"` i pomija
    `execution` dla każdego wpisu. `release` obejmuje wyselekcjonowany wycinek gotowości do wydania;
    `all` wybiera każdą aktywną kategorię dojrzałości i jest przeznaczone do jawnych uruchomień
    workflow QA Profile Evidence, gdy potrzebny jest pełny artefakt karty wyników.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy działanie kodem niezerowym, gdy dowolny scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez niepowodzenia kodu wyjścia.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock na potrzeby eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Przeszukuje identyfikatory scenariuszy, tytuły, powierzchnie, identyfikatory pokrycia, odwołania do dokumentacji, odwołania do kodu,
    pluginy i wymagania dostawców, a następnie wypisuje pasujące cele pakietu.
  - Użyj tego przed uruchomieniem QA Lab, gdy znasz zmieniane zachowanie lub ścieżkę pliku,
    ale nie znasz najmniejszego scenariusza. Ma to wyłącznie charakter doradczy; nadal wybieraj dowód mock,
    live, Multipass, Matrix albo transportowy na podstawie zmienianego zachowania.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia live zestaw prób pluginu OpenAI Kitchen Sink przez QA Lab. Instaluje
    zewnętrzny pakiet Kitchen Sink, weryfikuje inwentarz powierzchni SDK pluginów,
    sonduje `/healthz` i `/readyz`, zapisuje dowody CPU/RSS Gateway,
    uruchamia live turę OpenAI i sprawdza diagnostykę adwersarialną.
    Wymaga live uwierzytelnienia OpenAI, takiego jak `OPENAI_API_KEY`. W nawodnionych sesjach Testbox
    automatycznie pobiera profil live-auth Testbox, gdy obecny jest helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia test porównawczy startu Gateway oraz mały pakiet mock scenariuszy QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    pod `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje gorącego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie piki startowe są zapisywane jako metryki
    bez sprawiania wrażenia wielominutowej regresji obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma już
    świeżego wyjścia runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz jednorazowej maszyny wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane dane wejściowe uwierzytelniania QA, które są praktyczne dla gościa:
    klucze dostawców oparte na zmiennych env, ścieżkę konfiguracji live dostawcy QA oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje normalny raport i podsumowanie QA oraz logi Multipass pod
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Dockerze witrynę QA do pracy QA w stylu operatora.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime pluginu ładuje się bez naprawy zależności
    przy starcie, uruchamia doctor i wykonuje jedną lokalną turę agenta względem
    zamockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietu
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke Docker zbudowanej aplikacji dla osadzonych transkryptów kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydujący pakiet OpenClaw w Dockerze, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    live ścieżki QA Telegram z tym zainstalowanym pakietem jako Gateway SUT.
  - Wrapper montuje tylko źródło harnessu `qa-lab` z checkoutu; zainstalowany pakiet
    posiada `dist`, `openclaw/plugin-sdk` i runtime dołączonych pluginów,
    więc ścieżka nie miesza bieżących pluginów z checkoutu z testowanym pakietem.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` albo
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby przetestować rozwiązany lokalny tarball zamiast
    instalacji z rejestru.
  - Domyślnie emituje powtarzane pomiary RTT w `qa-evidence.json` z
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Nadpisz
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` albo
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostroić przebieg RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` akceptuje rozdzieloną przecinkami listę
    identyfikatorów kontroli QA Telegram do próbkowania; gdy nie jest ustawione, domyślną kontrolą
    obsługującą RTT jest `telegram-mentioned-message-reply`.
  - Używa tych samych poświadczeń env Telegram albo źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker automatycznie wybiera Convex.
  - Wrapper waliduje env poświadczeń Telegram albo Convex na hoście przed
    pracą build/install Docker. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko podczas celowego debugowania konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki. Gdy wybrane są poświadczenia Convex
    i nie ustawiono roli, wrapper używa `ci` w CI oraz
    `maintainer` poza CI.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainera
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia także `Package Acceptance` dla pobocznego dowodu produktu
  względem jednego pakietu kandydującego. Akceptuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full albo custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić workflow QA Telegram
  względem tego samego artefaktu `package-under-test`.
  - Najnowszy dowód produktu beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Dowód dokładnego URL tarballa wymaga skrótu i używa polityki bezpieczeństwa publicznych URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/prywatne mirrory tarballi używają jawnej polityki zaufanego źródła:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` czyta `.github/package-trusted-sources.json` z zaufanego refa workflow i nie akceptuje poświadczeń URL ani obejścia sieci prywatnej z wejścia workflow. Jeśli nazwana polityka deklaruje uwierzytelnianie bearer, skonfiguruj stały sekret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

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
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane pobieralne pluginy nieobecne,
    pierwsza skonfigurowana naprawa doctor jawnie instaluje każdy brakujący pobieralny
    plugin, a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje także znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że poaktualizacyjny doctor kandydata
    czyści pozostałości zależności legacy pluginów bez naprawy postinstall po stronie harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia smoke aktualizacji natywnej instalacji pakietowej na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json` dla ścieżki artefaktu podsumowania i
    statusu każdej ścieżki.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` dla dowodu live tury agenta.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owiń długie lokalne uruchomienia timeoutem hosta, aby zacięcia transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek pod `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`,
    zanim założysz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut w poaktualizacyjnym doctorze i pracy
    aktualizacji pakietów na zimnym gościu; nadal jest to zdrowe, gdy zagnieżdżony log debug npm
    postępuje.
  - Nie uruchamiaj tego agregującego wrappera równolegle z indywidualnymi ścieżkami smoke Parallels
    macOS, Windows albo Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietów albo stanie Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonych pluginów, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API runtime nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów smoke
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę live QA Matrix wobec jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródeł - instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów: [Matrix QA](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę live QA Telegram wobec prawdziwej grupy prywatnej z użyciem tokenów bota sterownika i SUT ze środowiska.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu środowiskowego albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Domyślne ustawienia obejmują canary, bramkowanie wzmianek, adresowanie poleceń, `/status`, wspomniane odpowiedzi bot-do-bota oraz odpowiedzi podstawowych poleceń natywnych. Domyślne ustawienia `mock-openai` obejmują też deterministyczne regresje łańcucha odpowiedzi i strumieniowania końcowej wiadomości Telegram. Użyj `--list-scenarios`, aby zobaczyć opcjonalne sondy, takie jak `session_status`.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu wyjścia.
  - Wymaga dwóch różnych botów w tej samej grupie prywatnej, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Aby uzyskać stabilną obserwację bot-do-bota, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i `qa-evidence.json` w `.artifacts/qa-e2e/...`. Scenariusze z odpowiedziami obejmują RTT od żądania wysłania przez sterownik do zaobserwowanej odpowiedzi SUT.

`Mantis Telegram Live` to wrapper dowodowy PR wokół tej ścieżki. Uruchamia
ref kandydujący z poświadczeniami Telegram dzierżawionymi przez Convex, renderuje zredagowany
pakiet raportu/dowodów QA w przeglądarce pulpitu Crabbox, nagrywa dowód MP4,
generuje GIF przycięty do ruchu, przesyła pakiet artefaktów i publikuje wbudowany dowód PR
przez Mantis GitHub App, gdy ustawiono `pr_number`. Maintainerzy mogą
uruchomić go z interfejsu Actions przez `Mantis Scenario` (`scenario_id:
telegram-live`) albo bezpośrednio z komentarza pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` to agentowy natywny wrapper Telegram Desktop
przed/po do wizualnego dowodu PR. Uruchom go z interfejsu Actions z
dowolnymi `instructions`, przez `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) albo z komentarza PR:

```text
@openclaw-mantis telegram desktop proof
```

Agent Mantis czyta PR, decyduje, jakie widoczne w Telegram zachowanie dowodzi
zmiany, uruchamia ścieżkę dowodową Crabbox Telegram Desktop prawdziwego użytkownika na refach bazowym i
kandydującym, iteruje, aż natywne GIF-y są użyteczne, zapisuje sparowany
manifest `motionPreview` i publikuje tę samą 2-kolumnową tabelę GIF przez
Mantis GitHub App, gdy ustawiono `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Dzierżawi albo ponownie używa pulpitu Linux Crabbox, instaluje natywny Telegram Desktop, konfiguruje OpenClaw z dzierżawionym tokenem bota SUT Telegram, uruchamia Gateway i nagrywa dowody w postaci zrzutu ekranu/MP4 z widocznego pulpitu VNC.
  - Domyślnie używa `--credential-source convex`, więc workflow potrzebują tylko sekretu brokera Convex. Użyj `--credential-source env` z tymi samymi zmiennymi `OPENCLAW_QA_TELEGRAM_*` co `pnpm openclaw qa telegram`.
  - Telegram Desktop nadal potrzebuje logowania/profilu użytkownika. Token bota konfiguruje tylko OpenClaw. Użyj `--telegram-profile-archive-env <name>` dla archiwum profilu `.tgz` base64 albo użyj `--keep-lease` i zaloguj się raz ręcznie przez VNC.
  - Zapisuje `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` i `telegram-desktop-builder.mp4` w katalogu wyjściowym.

Ścieżki transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia poszczególnych ścieżek znajduje się w [przegląd QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` jest szerokim pakietem syntetycznym i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
live transport QA, QA lab pozyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat tej
dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamykaniu. Nazwa sekcji pochodzi sprzed
obsługi Discord, Slack i WhatsApp; kontrakt dzierżawy jest współdzielony między rodzajami.

Referencyjny scaffold projektu Convex:

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na adresy URL Convex `http://` local loopback wyłącznie do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` w normalnym działaniu.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocniki CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić URL witryny Convex, sekrety brokera,
prefiks endpointu, timeout HTTP oraz dostępność admin/list bez drukowania
wartości sekretów. Użyj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo w skryptach i narzędziach
CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym ciągiem identyfikatora czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca zniekształcone payloady.

Kształt payloadu dla rodzaju prawdziwego użytkownika Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` i `telegramApiId` muszą być numerycznymi ciągami.
- `tdlibArchiveSha256` i `desktopTdataArchiveSha256` muszą być szesnastkowymi ciągami SHA-256.
- `kind: "telegram-user"` jest zarezerwowany dla workflow dowodu Mantis Telegram Desktop. Generyczne ścieżki QA Lab nie mogą go pozyskiwać.

Payloady wielokanałowe walidowane przez brokera:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Ścieżki Slack mogą też dzierżawić z puli, ale walidacja payloadu Slack obecnie
znajduje się w runnerze Slack QA, a nie w brokerze. Użyj
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
dla wierszy Slack.

### Dodawanie kanału do QA

Architektura i nazwy pomocników scenariuszy dla nowych adapterów kanałów znajdują się w [przegląd QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym seam hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Pakiety testów (co uruchamia się gdzie)

Myśl o pakietach jako o „rosnącym realizmie” (i rosnącej niestabilności/koszcie):

### Unit / integration (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: nieukierunkowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozszerzać shardy wieloprojektowe do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga prawdziwych kluczy
  - Powinien być szybki i stabilny
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallback `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych małych fixture'ów Plugin, a nie
    prawdziwych źródłowych API dołączonego Plugin. Prawdziwe ładowania API Plugin należą do
    pakietów kontraktowych/integracyjnych właściciela Plugin.

Polityka zależności natywnych:

- Domyślne instalacje testowe pomijają opcjonalne natywne buildy opus Discord. Głos Discord używa dołączonego `libopus-wasm`, a `@discordjs/opus` pozostaje wyłączony w `allowBuilds`, aby lokalne testy i ścieżki Testbox nie kompilowały natywnego addona.
- Porównuj wydajność natywnego opus w repo benchmarku `libopus-wasm`, a nie w domyślnych pętlach install/test OpenClaw. Nie ustawiaj `@discordjs/opus` na `true` w domyślnym `allowBuilds`; to sprawia, że niepowiązane pętle install/test kompilują kod natywny.

<AccordionGroup>
  <Accordion title="Projekty, shardy i ścieżki ograniczone">

    - Niekierunkowe `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega zagładzaniu niepowiązanych zestawów testów przez prace auto-reply/extension.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ pętla obserwacji z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika pełnego kosztu startu projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git na tanie zakresowe ścieżki: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności z grafu importów. Edycje konfiguracji/setupu/pakietów nie uruchamiają szerokiego zestawu testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzająca dla wąskich zmian. Klasyfikuje diff na core, testy core, extensions, testy extension, aplikacje, dokumentację, metadane wydań, narzędzia live Docker i narzędzia, a następnie uruchamia pasujące polecenia typecheck, lint i guard. Nie uruchamia testów Vitest; wywołaj `pnpm test:changed` albo jawne `pnpm test <target>` jako dowód testowy. Zmiany wersji obejmujące tylko metadane wydań uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych, z zabezpieczeniem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje harnessu live Docker ACP uruchamiają skoncentrowane kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker i przebieg próbny harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zmiany zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych zabezpieczeń.
    - Lekkie importowo testy jednostkowe z obszarów agents, commands, plugins, pomocników auto-reply, `plugin-sdk` i podobnych czystych narzędziowych obszarów trafiają przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe lub ciężkie runtime pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` mapują też przebiegi w trybie zmian na jawne sąsiednie testy w tych lekkich ścieżkach, więc edycje pomocników unikają ponownego uruchamiania całego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla pomocników core najwyższego poziomu, testów integracyjnych najwyższego poziomu `reply.*` i poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch oraz commands/state-routing, aby jeden importowo ciężki koszyk nie posiadał całego ogona Node.
    - Normalne CI dla PR/main celowo pomija zbiorczy przebieg rozszerzeń i shard `agentic-plugins` przeznaczony tylko dla wydań. Pełna walidacja wydania uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych zestawów silnie obciążonych pluginami/rozszerzeniami na kandydatach do wydania.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Gdy zmieniasz wejścia wykrywania narzędzi wiadomości lub kontekst runtime compaction,
      zachowaj oba poziomy pokrycia.
    - Dodaj skoncentrowane regresje pomocników dla granic czystego routingu i normalizacji.
    - Utrzymuj zestawy integracyjne osadzonego runnera w dobrym stanie:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że zakresowe identyfikatory i zachowanie compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy samych pomocników
      nie są wystarczającym zamiennikiem dla tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Wspólna konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swój setup `jsdom` i optymalizator, ale także działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze wspólnej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Node
      Vitest, aby zmniejszyć narzut kompilacji V8 podczas dużych lokalnych przebiegów.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym
      zachowaniem V8.
    - `scripts/run-vitest.mjs` kończy jawne przebiegi Vitest bez trybu watch po
      5 minutach bez wyjścia stdout lub stderr. Ustaw
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, aby wyłączyć watchdog dla
      celowo cichego dochodzenia.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne uruchamia diff.
    - Hook pre-commit obejmuje tylko formatowanie. Ponownie stage’uje sformatowane pliki i
      nie uruchamia lint, typecheck ani testów.
    - Uruchom `pnpm check:changed` jawnie przed przekazaniem lub pushem, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowe ścieżki. Użyj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harnessu, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Lokalne autoskalowanie workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele współbieżnych
      przebiegów Vitest domyślnie powoduje mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, aby ponowne przebiegi w trybie zmian pozostały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` włączone na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jednej jawnej lokalizacji cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      wyjście z rozbiciem importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Przebiegi całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI
      z wzorcem include dopisują nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu w importach startowych,
      trzymaj ciężkie zależności za wąską lokalną granicą `*.runtime.ts` i
      mockuj tę granicę bezpośrednio zamiast deep-importować pomocniki runtime tylko
      po to, by przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje kierowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas rzeczywisty oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU wątku głównego dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu jednostkowego z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszone użycie jednego workera
- Zakres:
  - Uruchamia rzeczywisty loopback Gateway z diagnostyką domyślnie włączoną
  - Przepuszcza syntetyczny ruch wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki utrwalania pakietu stabilności diagnostycznej
  - Potwierdza, że recorder pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek per sesja wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka do dalszych prac nad regresjami stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (agregat repozytorium)

- Polecenie: `pnpm test:e2e`
- Zakres:
  - Uruchamia ścieżkę E2E smoke gateway
  - Uruchamia ścieżkę E2E przeglądarki mockowanego Control UI
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wymaga zainstalowanego Playwright Chromium

### E2E (gateway smoke)

- Polecenie: `pnpm test:e2e:gateway`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E bundled-plugin w `extensions/`
- Domyślne ustawienia runtime:
  - Używa `threads` Vitest z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` aby wymusić liczbę workerów (ograniczoną do 16).
  - `OPENCLAW_E2E_VERBOSE=1` aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wieloinstancyjnego gateway
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższa sieć
- Oczekiwania:
  - Działa w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż testy jednostkowe (może być wolniejsze)

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
  - Nie wymaga prawdziwego Gateway, agentów ani kluczy providerów
  - Zależność przeglądarkowa musi być obecna (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Ponownie używa aktywnego lokalnego gateway OpenShell
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zdalnie kanoniczne zachowanie systemu plików przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego przebiegu `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Wymaga aktywnego lokalnego gateway OpenShell i jego źródła konfiguracji
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy sandbox testowy
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1` aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` aby wskazać niestandardowy binarny plik CLI lub skrypt wrappera
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` aby udostępnić zarejestrowaną konfigurację gateway izolowanemu testowi
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` aby nadpisać IP gateway Docker używany przez fixture zasad hosta

### Live (prawdziwi providerzy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wykrywanie zmian formatu dostawcy, osobliwości wywoływania narzędzi, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live używają już wyeksportowanych kluczy API i przygotowanych profili uwierzytelniania.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracji/uwierzytelniania do tymczasowego katalogu domowego testu, aby fixture'y jednostkowe nie mogły zmodyfikować prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa w cichszym trybie: zachowuje wyjście postępu `[live] ...` i wycisza logi rozruchu gatewaya oraz komunikaty Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie dla live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próbę przy odpowiedziach z limitem szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, więc długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli przez Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli przez Vitest, dzięki czemu linie postępu dostawcy/gatewaya są strumieniowane natychmiast podczas uruchomień live.
  - Dostrój Heartbeat bezpośrednich modeli za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój Heartbeat gatewaya/sondy za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykanie sieci gatewaya / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Macierz modeli live, testy smoke backendu CLI, testy smoke ACP, harness serwera aplikacji Codex oraz wszystkie testy live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, harness mediów) - wraz z obsługą danych uwierzytelniających dla uruchomień live - opisuje
[Testowanie zestawów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i walidacji
Pluginów znajdziesz w
[Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne kontrole „działa w Linuksie”)

Te runnery Docker dzielą się na dwa koszyki:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live kluczy profili w obrazie Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji, workspace i opcjonalny plik env profilu. Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live zachowują własne praktyczne limity tam, gdzie to potrzebne:
  `test:docker:live-models` domyślnie używa wybranego, obsługiwanego zestawu o wysokim sygnale, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ustaw `OPENCLAW_LIVE_MAX_MODELS`
  albo zmienne środowiskowe gatewaya, gdy wyraźnie chcesz mniejszy limit lub większe skanowanie.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz bazowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności Pluginów; te ścieżki montują wcześniej zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, instalacji npm i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram może nadal uruchomić ją, gdy pula jest pusta, a następnie utrzymuje ją jako jedyną działającą do czasu ponownej dostępności pojemności. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, wypisuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby przy późniejszych uruchomieniach najpierw startować dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania ani uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietu/obrazu i danych uwierzytelniających.
- `Package Acceptance` to natywna dla GitHuba bramka pakietu odpowiadająca na pytanie „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według szerokości: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/Pluginu, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydań i triage awarii.
- Kontrole budowania i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` oraz kończy się niepowodzeniem, jeśli start przed dyspozycją polecenia importuje zależności pakietu, takie jak Commander, UI promptów, undici lub logowanie, zanim nastąpi dyspozycja polecenia; utrzymuje też dołączony fragment uruchomienia gatewaya w budżecie i odrzuca statyczne importy znanych zimnych ścieżek gatewaya. Test smoke spakowanego CLI obejmuje również pomoc główną, pomoc onboardingu, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność starszej kompatybilności Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego punktu granicznego harness toleruje tylko luki metadanych wysłanych pakietów: pominięte prywatne wpisy inwentarza QA, brakujące `gateway install --wrapper`, brakujące pliki łatek w fixture git wyprowadzonym z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Pluginów, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi awariami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracji wyższego poziomu.
- Ścieżki Docker/Bash E2E, które instalują spakowany tarball OpenClaw przez `scripts/lib/openclaw-e2e-instance.sh`, ograniczają `npm install` za pomocą `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (domyślnie `600s`; ustaw `0`, aby wyłączyć wrapper na potrzeby debugowania).

Runnery Docker modeli live bind-mountują także tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez mutowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Test smoke bindowania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Test smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Test smoke harnessu serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Testy smoke obserwowalności: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` i `pnpm qa:observability:smoke` to prywatne ścieżki QA dla checkoutu źródłowego. Celowo nie są częścią pakietowych ścieżek wydania Docker, ponieważ tarball npm pomija QA Lab.
- Test smoke live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffolding): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Test smoke onboardingu/kanału/agenta tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding env-ref oraz domyślnie Telegram, uruchamia doctor i wykonuje jeden zamockowany przebieg agenta OpenAI. Użyj ponownie wcześniej zbudowanego tarballa za pomocą `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał za pomocą `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke test ścieżki użytkownika wydania: `pnpm test:docker:release-user-journey` instaluje spakowany tarball OpenClaw globalnie w czystym katalogu domowym Docker, uruchamia onboarding, konfiguruje mockowanego dostawcę OpenAI, wykonuje turę agenta, instaluje/odinstalowuje zewnętrzne plugins, konfiguruje ClickClack względem lokalnej fikstury, weryfikuje wiadomości wychodzące/przychodzące, restartuje Gateway i uruchamia doctor.
- Smoke test typowanego onboardingu wydania: `pnpm test:docker:release-typed-onboarding` instaluje spakowany tarball, prowadzi `openclaw onboard` przez prawdziwy TTY, konfiguruje OpenAI jako dostawcę env-ref, weryfikuje brak utrwalania surowego klucza i uruchamia mockowaną turę agenta.
- Smoke test mediów/pamięci wydania: `pnpm test:docker:release-media-memory` instaluje spakowany tarball, weryfikuje rozumienie obrazu z załącznika PNG, wynik generowania obrazu zgodnego z OpenAI, przywołanie z wyszukiwania w pamięci oraz przetrwanie przywołania po restarcie Gateway.
- Smoke test ścieżki użytkownika aktualizacji wydania: `pnpm test:docker:release-upgrade-user-journey` domyślnie instaluje najnowszą opublikowaną bazę starszą niż tarball kandydata, konfiguruje stan dostawcy/pluginu/ClickClack w opublikowanym pakiecie, aktualizuje do tarballa kandydata, a następnie ponownie uruchamia główną ścieżkę agenta/pluginu/kanału. Jeśli nie istnieje starsza opublikowana baza, ponownie używa wersji kandydata. Nadpisz bazę za pomocą `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke test marketplace pluginów wydania: `pnpm test:docker:release-plugin-marketplace` instaluje z lokalnej fikstury marketplace, aktualizuje zainstalowany plugin, odinstalowuje go i weryfikuje, że CLI pluginu znika po przycięciu metadanych instalacji.
- Smoke test instalacji Skills: `pnpm test:docker:skill-install` instaluje spakowany tarball OpenClaw globalnie w Docker, wyłącza instalacje przesłanych archiwów w konfiguracji, rozwiązuje bieżący aktywny slug Skills z ClawHub z wyszukiwania, instaluje go za pomocą `openclaw skills install` i weryfikuje zainstalowaną Skills oraz metadane źródła/blokady `.clawhub`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Docker, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie pluginu po aktualizacji, następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw nad brudną fiksturą starego użytkownika z agentami, konfiguracją kanału, listami dozwolonych pluginów, nieaktualnym stanem zależności pluginów i istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez aktywnego dostawcy ani kluczy kanałów, a następnie uruchamia loopback Gateway i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchamiania/statusu.
- Smoke test przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasiewa realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę za pomocą wbudowanego przepisu poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do tarballa kandydata, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, a następnie uruchamia loopback Gateway i sprawdza skonfigurowane intencje, zachowanie stanu, uruchamianie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś agregujący harmonogram o rozwinięcie dokładnych lokalnych baz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oraz rozwiń fikstury w kształcie zgłoszeń za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takich jak `reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych plugins OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje metatokeny baz, takie jak `last-stable-4` lub `all-since-2026.4.23`, a Full Release Validation rozwija bramkę pakietu release-soak do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke test kontekstu wykonawczego sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytej transkrypcji kontekstu wykonawczego oraz naprawę doctor dotkniętych zduplikowanych gałęzi prompt-rewrite.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je za pomocą `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca wbudowanych dostawców obrazów zamiast się zawieszać. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do tarballa kandydata. Nadpisz lokalnie za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo za pomocą wejścia `update_baseline_version` workflow Install Smoke w GitHub. Testy instalatora bez root zachowują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do root nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie użyć pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasiewa dwóch agentów z jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zatrzymanego workspace. Użyj ponownie obrazu install-smoke za pomocą `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, autoryzacja WS + stan zdrowia): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test migawki Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje obraz źródłowy E2E plus warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP obejmują adresy URL linków, klikalne elementy promowane kursorem, referencje iframe i metadane ramek.
- Regresja minimalnego reasoning dla OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowe szczegóły pojawiają się w logach Gateway.
- Most kanałów MCP (zasiany Gateway + most stdio + smoke test surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu OpenClaw (prawdziwy serwer MCP stdio + smoke test allow/deny osadzonego profilu OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (skrypt: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Czyszczenie Cron/subagent MCP (prawdziwy Gateway + zamknięcie procesu potomnego MCP stdio po izolowanym Cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke test instalacji/aktualizacji dla lokalnej ścieżki, `file:`, rejestru npm z wyniesionymi zależnościami, zniekształconych metadanych pakietu npm, ruchomych referencji git, kitchen-sink ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink za pomocą `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fikstury ClawHub.
- Smoke test niezmienionej aktualizacji pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test macierzy cyklu życia pluginu: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowany tarball OpenClaw w pustym kontenerze, instaluje plugin npm, przełącza włączanie/wyłączanie, aktualizuje go i obniża jego wersję przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa nieaktualny stan, jednocześnie rejestrując metryki RSS/CPU dla każdej fazy cyklu życia.
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla lokalnej ścieżki, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji dla zainstalowanych plugins. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje śledzone pod kątem zasobów instalowanie, włączanie, wyłączanie, aktualizację, obniżanie wersji i odinstalowanie z brakującym kodem pluginu npm.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest już lokalny. Testy QR i instalatora Docker zachowują własne Dockerfiles, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnerzy Docker dla modeli live montują również bieżący checkout tylko do odczytu i
przenoszą go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje niewielki, a Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże, wyłącznie lokalne pamięci podręczne i wyniki kompilacji aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyjściowe `.build` lub
Gradle, aby uruchomienia live w Dockerze nie spędzały minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają one również `OPENCLAW_SKIP_CHANNELS=1`, aby próby live gateway nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy trzeba zawęzić lub wykluczyć pokrycie live gateway
z tej ścieżki Docker.
`test:docker:openwebui` to wyższego poziomu smoke test zgodności: uruchamia
kontener Gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Ustaw `OPENWEBUI_SMOKE_MODE=models` dla kontroli CI ścieżki wydania, które powinny zakończyć się
po logowaniu do Open WebUI i wykryciu modelu, bez oczekiwania na ukończenie przez model live.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć ukończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje użytecznego klucza modelu live. Przekaż go przez środowisko
procesu, przygotowane profile uwierzytelniania albo jawny `OPENCLAW_PROFILE_FILE`.
Udane uruchomienia wypisują mały ładunek JSON podobny do `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener Gateway,
uruchamia drugi kontener, który spawnuje `openclaw mcp serve`, a następnie
weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia kanału +
uprawnień w stylu Claude przez rzeczywisty most stdio MCP. Kontrola powiadomień
bezpośrednio sprawdza surowe ramki stdio MCP, więc smoke test weryfikuje to, co
most faktycznie emituje, a nie tylko to, co przypadkiem ujawnia konkretny SDK klienta.
`test:docker:agent-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza
modelu live. Buduje obraz Docker repozytorium, uruchamia rzeczywisty serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime MCP pakietu OpenClaw,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia zasiany Gateway z rzeczywistym serwerem sondy stdio MCP, wykonuje
izolowaną turę cron i jednorazową turę potomną `sessions_spawn`, a następnie weryfikuje,
że proces potomny MCP kończy działanie po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla workflow regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montowany i wczytywany przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować wyłącznie zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montaży uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelniania CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia providerów montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listy oddzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować providerów w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby zapewnić, że dane uwierzytelniające pochodzą z magazynu profili (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt kontroli nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentacji: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz także kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „rzeczywistego pipeline’u” bez rzeczywistych providerów:

- Wywoływanie narzędzi Gateway (mock OpenAI, rzeczywisty gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymusza auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Oceny niezawodności agentów (Skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „oceny niezawodności agentów”:

- Mock wywoływania narzędzi przez rzeczywisty gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i skutki konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe, które asercjami sprawdzają kolejność narzędzi, przeniesienie historii sesji i granice sandboxa.

Przyszłe oceny powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych providerów do asercji wywołań narzędzi + kolejności, odczytów plików skills i okablowania sesji.
- Mały zestaw scenariuszy skupionych na skills (użyj kontra unikaj, bramkowanie, prompt injection).
- Opcjonalne oceny live (opt-in, bramkowane zmiennymi środowiskowymi) dopiero po przygotowaniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał spełnia swój
kontrakt interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
pomija te wspólne pliki styku i smoke testów; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub providerów.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty providerów: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt pluginu (id, nazwa, capabilities)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grupy

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

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu albo zmodyfikowaniu pluginu kanału lub providera
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe działają w CI i nie wymagają rzeczywistych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub providera albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest z natury wyłącznie live (limity szybkości, polityki auth), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wychwytuje błąd:
  - błąd konwersji/odtworzenia żądania providera → bezpośredni test modeli
  - błąd pipeline’u sesji/historii/narzędzi gateway → smoke test live gateway albo bezpieczny dla CI mock test gateway
- Bariera ochronna przechodzenia po SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asercją sprawdza, że exec ids z segmentami przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem przy niesklasyfikowanych ID celów, aby nowe klasy nie mogły zostać po cichu pominięte.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
