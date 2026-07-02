---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: zestawy unit/e2e/live, uruchamiacze Docker oraz zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-07-02T08:53:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy Vitest (unit/integration, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Jakie polecenia uruchamiać dla typowych przepływów pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają poświadczenia i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, live transport lanes)** jest udokumentowany osobno:

- [Przegląd QA](/pl/concepts/qa-e2e-automation) - architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) - dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Karta dojrzałości](/pl/maturity/scorecard) - jak dowody QA z wydań wspierają decyzje o stabilności i LTS.
- [Kanał QA](/pl/channels/qa-channel) - syntetyczny transportowy Plugin używany przez scenariusze oparte na repozytorium.

Ta strona opisuje uruchamianie standardowych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużą ilością zasobów: `pnpm test:max`
- Bezpośrednia pętla obserwowania Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie pliku obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Podczas iterowania nad pojedynczą awarią najpierw preferuj uruchomienia ukierunkowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Pas QA oparty na VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

## Katalogi tymczasowe testów

Preferuj współdzielone helpery w `test/helpers/temp-dir.ts` dla należących do testów
katalogów tymczasowych. Jawnie określają własność i utrzymują sprzątanie w tym samym
cyklu życia testu:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` celowo nie udostępnia ręcznej metody sprzątania; Vitest
zarządza sprzątaniem po każdym teście. Istniejące helpery niższego poziomu pozostają dla testów, które
jeszcze nie zostały przeniesione, ale nowe i migrowane testy powinny używać automatycznie czyszczącego
trackera. Unikaj nowego użycia ręcznych `makeTempDir`, `cleanupTempDirs` lub
`createTempDirTracker` oraz nowych bezpośrednich wywołań `fs.mkdtemp*` w testach,
chyba że przypadek wyraźnie weryfikuje surowe zachowanie katalogu tymczasowego. Dodaj audytowalny
komentarz zezwalający z konkretnym powodem, gdy test celowo potrzebuje bezpośredniego katalogu
tymczasowego:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Dla widoczności migracji `node scripts/report-test-temp-creations.mjs` raportuje
nowe bezpośrednie tworzenie katalogów tymczasowych i nowe ręczne użycie współdzielonych helperów w dodanych liniach
diff bez blokowania istniejących stylów sprzątania. Jego zakres plików celowo
podąża za tą samą klasyfikacją ścieżek testów, której używa `scripts/changed-lanes.mjs`,
zamiast utrzymywać osobną heurystykę nazw plików helperów testowych, pomijając
samą implementację współdzielonego helpera. `check:changed` uruchamia ten raport dla
zmienionych ścieżek testowych jako sygnał CI tylko z ostrzeżeniami; ustalenia są adnotacjami ostrzeżeń
GitHub, a nie awariami.

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche ukierunkowanie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności runtime: wywołaj `OpenClaw Performance` z
  `live_openai_candidate=true` dla rzeczywistego przebiegu agenta `openai/gpt-5.5` albo
  `deep_profile=true` dla artefaktów CPU/sterty/trace Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty pasów mock-provider, deep-profile i GPT 5.5 do
  `openclaw/clawgrit-reports`, gdy skonfigurowane jest `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider zawiera także liczby dotyczące uruchomienia Gateway na poziomie źródeł, pamięci,
  obciążenia Plugin, powtarzanej pętli hello-loop fałszywego modelu oraz startu CLI.
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz przebieg tekstowy oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też mały przebieg obrazowy.
    Wyłącz dodatkowe sondy przez `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` i ręczne
    `OpenClaw Release Checks` wywołują wielokrotnego użytku workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live Docker
    podzielone według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    zaplanowanych/release wywołujących.
- Natywny smoke bound-chat Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia pas Docker live względem ścieżki app-server Codex, wiąże syntetyczną
    wiadomość prywatną Slack za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje zwykłą odpowiedź i załącznik obrazowy
    przechodzące przez natywne wiązanie Plugin zamiast ACP.
- Smoke harnessa app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia przebiegi agentów Gateway przez należący do Plugin harness app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    Cron MCP, sub-agenta i Guardian. Wyłącz sondę sub-agenta przez
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla ukierunkowanego sprawdzenia sub-agenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie sub-agenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke instalacji Codex na żądanie: `pnpm test:docker:codex-on-demand`
  - Instaluje spakowany tarball OpenClaw w Docker, uruchamia onboarding klucza API OpenAI
    i weryfikuje, że Plugin Codex oraz zależność `@openai/codex`
    zostały pobrane na żądanie do zarządzanego katalogu głównego projektu npm.
- Smoke zależności narzędzia Plugin live: `pnpm test:docker:live-plugin-tool`
  - Pakuje fixture Plugin z rzeczywistą zależnością `slugify`, instaluje ją przez
    `npm-pack:`, weryfikuje zależność pod zarządzanym katalogiem głównym projektu npm,
    a następnie prosi model OpenAI live o wywołanie narzędzia Plugin i zwrócenie ukrytego
    sluga.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne sprawdzenie typu belt-and-suspenders dla powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback planera przekłada się na audytowany typowany
    zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Zaczyna od pustego katalogu stanu OpenClaw, weryfikuje nowoczesny punkt wejścia onboard
    Crestodian, stosuje zapisy setup/model/agent/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0
    jest także objęta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, następnie uruchom izolowany
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypcja asystenta przechowuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego awaryjnego przypadku, preferuj zawężanie testów live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. Parzystość agentowa jest zagnieżdżona pod
`QA-Lab - All Lanes` i walidacją wydania, a nie jako samodzielny workflow PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA release-checks. Stabilne/domyślne sprawdzenia wydań
trzymają wyczerpujący soak live/Docker za `run_release_soak=true`; profil
`full` wymusza soak. `QA-Lab - All Lanes`
uruchamia się nocą na `main` i z ręcznego wywołania z pasem mock parity, pasem live
Matrix, zarządzanym przez Convex pasem live Telegram oraz zarządzanym przez Convex pasem live Discord
jako równoległymi zadaniami. Zaplanowane QA i sprawdzenia wydań przekazują Matrix
`--profile fast` jawnie, podczas gdy CLI Matrix i ręczne wejście workflow
domyślnie pozostają `all`; ręczne wywołanie może podzielić `all` na zadania `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parity oraz szybkie pasy Matrix i Telegram przed zatwierdzeniem wydania,
używając `mock-openai/gpt-5.5` dla sprawdzeń transportu wydania, aby pozostały
deterministyczne i unikały normalnego startu Plugin dostawcy. Te Gatewaye transportu live
wyłączają wyszukiwanie pamięci; zachowanie pamięci pozostaje objęte przez zestawy QA parity.

Shardy live media pełnego wydania używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów Docker live używają współdzielonego
obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` budowanego raz dla wybranego
commita, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
wewnątrz każdego sharda.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Zapisuje artefakty najwyższego poziomu `qa-evidence.json`, `qa-suite-summary.json` i
    `qa-suite-report.md` dla wybranego zestawu scenariuszy, w tym
    wybory scenariuszy przepływów mieszanych, Vitest i Playwright.
  - Gdy jest uruchamiane przez `pnpm openclaw qa run --qa-profile <profile>`, osadza
    kartę wyników wybranego profilu taksonomii w tym samym `qa-evidence.json`.
    `smoke-ci` zapisuje odchudzone dowody, co ustawia `evidenceMode: "slim"` i pomija
    `execution` dla poszczególnych wpisów. `release` obejmuje wyselekcjonowany wycinek gotowości do wydania;
    `all` wybiera każdą aktywną kategorię dojrzałości i jest przeznaczone do jawnych
    uruchomień przepływu pracy QA Profile Evidence, gdy potrzebny jest pełny artefakt
    karty wyników.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    przez liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić
    liczbę workerów, lub `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy działanie kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu wyjścia.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture'ów i makiet protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Przeszukuje identyfikatory scenariuszy, tytuły, powierzchnie, identyfikatory pokrycia, odwołania do dokumentacji, odwołania do kodu,
    pluginy i wymagania dostawców, a następnie wypisuje pasujące cele pakietu.
  - Użyj tego przed uruchomieniem QA Lab, gdy znasz zmieniane zachowanie lub ścieżkę pliku,
    ale nie najmniejszy scenariusz. To wyłącznie wskazówka; nadal wybierz dowód mock,
    live, Multipass, Matrix lub transportowy na podstawie zmienianego zachowania.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia pełny live test gauntlet pluginu OpenAI Kitchen Sink przez QA Lab. Instaluje
    zewnętrzny pakiet Kitchen Sink, weryfikuje inwentarz powierzchni plugin SDK,
    sonduje `/healthz` i `/readyz`, zapisuje dowody CPU/RSS Gateway,
    uruchamia live turę OpenAI i sprawdza diagnostykę adwersarialną.
    Wymaga live uwierzytelnienia OpenAI, takiego jak `OPENAI_API_KEY`. W uwodnionych sesjach Testbox
    automatycznie wczytuje profil live-auth Testbox, gdy obecny jest helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet scenariuszy mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje wysokiego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki,
    bez wyglądania jak wielominutowa regresja zawieszenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma jeszcze
    świeżych wyników runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz jednorazowej maszyny wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelnienia QA, które są praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje normalny raport i podsumowanie QA oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Dockerze witrynę QA do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime pluginu ładuje się bez naprawy zależności podczas startu,
    uruchamia doctor i uruchamia jedną lokalną turę agenta względem
    zamockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietu
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke Dockera dla zbudowanej aplikacji dotyczący osadzonych transkryptów kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony session JSONL i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydata pakietu OpenClaw w Dockerze, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    live ścieżki Telegram QA z tym zainstalowanym pakietem jako testowanym Gateway SUT.
  - Wrapper montuje tylko źródła harnessu `qa-lab` z checkoutu; zainstalowany
    pakiet jest właścicielem `dist`, `openclaw/plugin-sdk` i runtime dołączonych pluginów,
    więc ścieżka nie miesza pluginów z bieżącego checkoutu z pakietem
    pod testem.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` lub
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby przetestować rozwiązany lokalny tarball zamiast
    instalowania z rejestru.
  - Domyślnie emituje powtarzane pomiary czasu RTT w `qa-evidence.json` z
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Nadpisz
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` lub
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, aby dostroić przebieg RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` przyjmuje rozdzielaną przecinkami listę
    identyfikatorów kontroli Telegram QA do próbkowania; gdy nie jest ustawione, domyślna kontrola
    obsługująca RTT to `telegram-mentioned-message-reply`.
  - Używa tych samych poświadczeń env Telegram lub źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Dockera automatycznie wybiera Convex.
  - Wrapper weryfikuje env poświadczeń Telegram lub Convex na hoście przed
    pracą build/install Dockera. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko podczas celowego debugowania konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki. Gdy wybrane są poświadczenia Convex,
    a rola nie jest ustawiona, wrapper używa `ci` w CI i
    `maintainer` poza CI.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow opiekuna
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa
    środowiska `qa-live-shared` oraz dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia też `Package Acceptance` dla pobocznego dowodu produktowego
  względem jednego kandydata pakietu. Przyjmuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full lub custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić workflow
  Telegram QA względem tego samego artefaktu `package-under-test`.
  - Najnowszy dowód produktowy beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Dowód dokładnego URL tarballa wymaga digestu i używa publicznej polityki bezpieczeństwa URL:

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

`source=trusted-url` odczytuje `.github/package-trusted-sources.json` z zaufanego refa workflow i nie akceptuje poświadczeń URL ani obejścia prywatnej sieci przez wejście workflow. Jeśli nazwana polityka deklaruje uwierzytelnianie bearer, skonfiguruj stały sekret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

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
  - Weryfikuje, że wykrywanie setupu pozostawia nieskonfigurowane pluginy do pobrania jako nieobecne,
    pierwsza skonfigurowana naprawa doctor jawnie instaluje każdy brakujący plugin do pobrania,
    a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po aktualizacji
    czyści pozostałości zależności starszych pluginów bez
    naprawy postinstall po stronie harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji instalacji pakietu na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` lub `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json` dla ścieżki artefaktu podsumowania i
    statusu każdej ścieżki.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` do live dowodu tury agenta.
    Przekaż `--model <provider/model>` lub ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo weryfikujesz inny
    model OpenAI.
  - Owiń długie lokalne uruchomienia timeoutem hosta, aby zacięcia transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` lub `linux-update.log`,
    zanim założysz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut w doctorze po aktualizacji i pracy
    aktualizacji pakietów na zimnym gościu; to nadal prawidłowe, gdy zagnieżdżony log debug npm
    postępuje.
  - Nie uruchamiaj tego agregującego wrappera równolegle z indywidualnymi ścieżkami smoke Parallels
    macOS, Windows lub Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietu lub stanie Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonych pluginów, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API runtime nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów dymnych
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę live QA Matrix wobec jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródłowy - instalacje pakietowe nie zawierają `qa-lab`.
  - Pełny CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów: [Matrix QA](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę live QA Telegram wobec rzeczywistej prywatnej grupy przy użyciu tokenów bota sterownika i bota SUT ze środowiska.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Domyślne ustawienia obejmują canary, bramkowanie wzmianek, adresowanie poleceń, `/status`, wspomniane odpowiedzi bot-do-bota oraz natywne odpowiedzi poleceń rdzenia. Domyślne ustawienia `mock-openai` obejmują także deterministyczne regresje łańcucha odpowiedzi i strumieniowania końcowej wiadomości Telegram. Użyj `--list-scenarios` dla opcjonalnych prób, takich jak `session_status`.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu wyjścia.
  - Wymaga dwóch odrębnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Aby zapewnić stabilną obserwację bot-do-bota, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport Telegram QA, podsumowanie i `qa-evidence.json` w `.artifacts/qa-e2e/...`. Scenariusze z odpowiedziami obejmują RTT od żądania wysłania sterownika do zaobserwowanej odpowiedzi SUT.

`Mantis Telegram Live` to wrapper dowodów PR wokół tej ścieżki. Uruchamia
ref kandydata z poświadczeniami Telegram dzierżawionymi przez Convex, renderuje zredagowany pakiet raportu/dowodów QA
w przeglądarce desktopowej Crabbox, nagrywa dowód MP4,
generuje GIF przycięty do ruchu, przesyła pakiet artefaktów i publikuje dowody PR
inline przez Mantis GitHub App, gdy ustawiono `pr_number`. Maintainerzy mogą
uruchomić go z interfejsu Actions przez `Mantis Scenario` (`scenario_id:
telegram-live`) albo bezpośrednio z komentarza do pull requesta:

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
zmiany, uruchamia ścieżkę dowodu rzeczywistego użytkownika Crabbox Telegram Desktop na refach bazowym i
kandydata, iteruje, aż natywne GIF-y są użyteczne, zapisuje sparowany
manifest `motionPreview` i publikuje tę samą dwukolumnową tabelę GIF przez
Mantis GitHub App, gdy ustawiono `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Dzierżawi lub ponownie używa desktopu Linux Crabbox, instaluje natywny Telegram Desktop, konfiguruje OpenClaw z dzierżawionym tokenem bota Telegram SUT, uruchamia gateway i nagrywa dowody w postaci zrzutu ekranu/MP4 z widocznego desktopu VNC.
  - Domyślnie używa `--credential-source convex`, więc workflow potrzebują tylko sekretu brokera Convex. Użyj `--credential-source env` z tymi samymi zmiennymi `OPENCLAW_QA_TELEGRAM_*` co `pnpm openclaw qa telegram`.
  - Telegram Desktop nadal potrzebuje logowania/profilu użytkownika. Token bota konfiguruje tylko OpenClaw. Użyj `--telegram-profile-archive-env <name>` dla archiwum profilu `.tgz` w base64 albo użyj `--keep-lease` i zaloguj się raz ręcznie przez VNC.
  - Zapisuje `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` i `telegram-desktop-builder.mp4` w katalogu wyjściowym.

Ścieżki transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia dla poszczególnych ścieżek znajduje się w [przeglądzie QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki pakiet syntetyczny i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
QA transportu live, laboratorium QA pozyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła heartbeat dla tej
dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu. Nazwa sekcji poprzedza
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
  - Domyślne środowisko: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex `http://` loopback tylko do lokalnego programowania.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` w normalnym działaniu.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić URL witryny Convex, sekrety brokera,
prefiks endpointu, limit czasu HTTP oraz dostępność admin/list bez drukowania
wartości sekretów. Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i
narzędziach CI.

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
  - Sukces: `{ status: "ok" }` (lub pusty `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukces: `{ status: "ok" }` (lub pusty `2xx`)
- `POST /admin/add` (tylko sekret maintainera)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Sukces: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret maintainera)
  - Żądanie: `{ credentialId, actorId }`
  - Sukces: `{ status: "ok", changed, credential }`
  - Strażnik aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret maintainera)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Sukces: `{ status: "ok", credentials, count }`

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym ciągiem identyfikatora czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe payloady.

Kształt payloadu dla rodzaju rzeczywistego użytkownika Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` i `telegramApiId` muszą być ciągami numerycznymi.
- `tdlibArchiveSha256` i `desktopTdataArchiveSha256` muszą być szesnastkowymi ciągami SHA-256.
- `kind: "telegram-user"` jest zarezerwowany dla workflow dowodu Mantis Telegram Desktop. Ogólne ścieżki QA Lab nie mogą go pozyskiwać.

Payloady wielokanałowe walidowane przez brokera:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Ścieżki Slack mogą także dzierżawić z puli, ale walidacja payloadu Slack obecnie
znajduje się w runnerze Slack QA, a nie w brokerze. Użyj
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
dla wierszy Slack.

### Dodawanie kanału do QA

Architektura i nazwy helperów scenariuszy dla nowych adapterów kanałów znajdują się w [przeglądzie QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym połączeniu hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Pakiety testów (co działa gdzie)

Traktuj pakiety jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: nieukierunkowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozszerzać shardy wieloprojektowe do konfiguracji per projekt dla równoległego planowania
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Działa w CI
  - Nie wymaga rzeczywistych kluczy
  - Powinien być szybki i stabilny
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallback `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych małych fixture’ów Plugin, a nie
    rzeczywistych źródłowych API bundlowanego Plugin. Rzeczywiste ładowania API Plugin należą do
    pakietów kontraktowych/integracyjnych właściciela Plugin.

Polityka zależności natywnych:

- Domyślne instalacje testowe pomijają opcjonalne natywne buildy Discord opus. Głos Discord używa bundlowanego `libopus-wasm`, a `@discordjs/opus` pozostaje wyłączone w `allowBuilds`, aby lokalne testy i ścieżki Testbox nie kompilowały natywnego dodatku.
- Porównuj wydajność natywnego opus w repozytorium benchmarków `libopus-wasm`, a nie w domyślnych pętlach instalacji/testów OpenClaw. Nie ustawiaj `@discordjs/opus` na `true` w domyślnym `allowBuilds`; to powoduje, że niepowiązane pętle instalacji/testów kompilują kod natywny.

<AccordionGroup>
  <Accordion title="Projekty, shardy i zakresowe ścieżki">

    - Nieukierunkowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega zagładzaniu niepowiązanych zestawów testów przez prace auto-reply/extension.
    - `pnpm test --watch` nadal używa natywnego głównego grafu projektu `vitest.config.ts`, ponieważ pętla obserwacji z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika pełnego kosztu uruchomienia projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git na tanie zakresowe ścieżki: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności grafu importów. Edycje konfiguracji/setupu/pakietów nie uruchamiają szeroko testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzania dla wąskich zmian. Klasyfikuje diff na core, testy core, extensions, testy extension, apps, docs, metadane wydań, narzędzia live Docker i narzędzia, a następnie uruchamia pasujące polecenia typecheck, lint i guard. Nie uruchamia testów Vitest; użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego. Zmiany wersji obejmujące wyłącznie metadane wydań uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności głównych, z zabezpieczeniem odrzucającym zmiany pakietów poza polem wersji najwyższego poziomu.
    - Edycje harnessa live Docker ACP uruchamiają skoncentrowane sprawdzenia: składnię powłoki dla skryptów uwierzytelniania live Docker i próbny przebieg harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zależności, eksporty, wersje i inne edycje powierzchni pakietu nadal używają szerszych zabezpieczeń.
    - Lekkie importowo testy jednostkowe z obszarów agents, commands, plugins, pomocników auto-reply, `plugin-sdk` i podobnych czystych narzędzi przechodzą przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/intensywnie używające runtime pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` mapują także przebiegi w trybie changed na jawne sąsiednie testy w tych lekkich ścieżkach, dzięki czemu edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane kubełki dla najwyższego poziomu pomocników core, najwyższego poziomu testów integracyjnych `reply.*` i poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch oraz commands/state-routing, aby jeden kubełek z dużą liczbą importów nie odpowiadał za cały ogon Node.
    - Normalne CI dla PR/main celowo pomija zbiorczy przebieg extension i shard `agentic-plugins` przeznaczony tylko dla wydań. Full Release Validation uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych zestawów mocno obciążonych pluginami/extension na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie wbudowanego runnera">

    - Gdy zmieniasz wejścia odkrywania narzędzi wiadomości lub kontekst runtime
      Compaction, utrzymaj oba poziomy pokrycia.
    - Dodaj skoncentrowane regresje pomocników dla granic czystego routingu i normalizacji.
    - Utrzymuj w dobrej kondycji zestawy integracyjne wbudowanego runnera:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że zakresowe identyfikatory i zachowanie Compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocników
      nie są wystarczającym substytutem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli i izolacji Vitest">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Wspólna konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swój setup i optymalizator `jsdom`, ale również działa na
      wspólnym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze wspólnej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Node
      Vitest, aby zmniejszyć narzut kompilacji V8 podczas dużych lokalnych przebiegów.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym zachowaniem V8.
    - `scripts/run-vitest.mjs` kończy jawne przebiegi Vitest bez watch po
      5 minutach bez wyjścia stdout lub stderr. Ustaw
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, aby wyłączyć watchdog dla
      celowo cichego badania.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala diff.
    - Hook pre-commit służy wyłącznie formatowaniu. Ponownie dodaje sformatowane pliki do stage
      i nie uruchamia lint, typecheck ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub pushem, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzania.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowe ścieżki. Użyj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harnessa, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Lokalne automatyczne skalowanie workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych
      przebiegów Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, aby ponowne przebiegi w trybie changed pozostawały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` włączone na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      wyjście import-breakdown.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Przebiegi całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI
      z wzorcem include dopisują nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym połączeniem `*.runtime.ts` i
      mockuj to połączenie bezpośrednio zamiast głęboko importować pomocniki runtime tylko
      po to, aby przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje kierowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas zegarowy oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu unit z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszone na jednego workera
- Zakres:
  - Uruchamia rzeczywisty loopback Gateway z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny ruch wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki utrwalania pakietu stabilności diagnostycznej
  - Sprawdza, że recorder pozostaje ograniczony, syntetyczne próbki RSS pozostają poniżej budżetu presji, a głębokości kolejek na sesję wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka dla dalszej pracy nad regresjami stabilności, nie substytut pełnego zestawu Gateway

### E2E (agregat repozytorium)

- Polecenie: `pnpm test:e2e`
- Zakres:
  - Uruchamia ścieżkę E2E smoke Gateway
  - Uruchamia mockowaną ścieżkę E2E przeglądarki Control UI
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wymaga zainstalowanego Playwright Chromium

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e:gateway`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E bundled-plugin w `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1` aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie gateway end-to-end dla wielu instancji
  - Powierzchnie WebSocket/HTTP, parowanie node i cięższe sieciowanie
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
  - Zastępuje Gateway WebSocket deterministycznymi mockami w przeglądarce
- Oczekiwania:
  - Działa w CI jako część `pnpm test:e2e`
  - Nie wymaga rzeczywistego Gateway, agentów ani kluczy providerów
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
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` aby wskazać niedomyślny binarny CLI lub skrypt wrappera
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` aby udostępnić zarejestrowaną konfigurację gateway izolowanemu testowi
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` aby nadpisać IP gateway Docker używane przez fixture polityki hosta

### Live (rzeczywi providerzy + rzeczywiste modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - "Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?"
  - Wychwytywanie zmian formatu dostawcy, osobliwości wywoływania narzędzi, problemów z uwierzytelnianiem oraz zachowania limitów szybkości
- Oczekiwania:
  - Z założenia nie jest stabilne w CI (prawdziwe sieci, prawdziwe zasady dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast "wszystkiego"
- Uruchomienia live używają już wyeksportowanych kluczy API oraz przygotowanych profili uwierzytelniania.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracji/uwierzytelniania do tymczasowego katalogu domowego testu, aby fikstury jednostkowe nie mogły zmodyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa w cichszym trybie: zachowuje wyjście postępu `[live] ...` i wycisza logi startowe Gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie dla danego uruchomienia live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach o limicie szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz wiersze postępu do stderr, więc długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli przez Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, aby wiersze postępu dostawcy/Gateway były strumieniowane natychmiast podczas uruchomień live.
  - Dostrój Heartbeat modeli bezpośrednich przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój Heartbeat Gateway/sondy przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie "mój bot nie działa" / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Macierz modeli live, smoke testy backendu CLI, smoke testy ACP, harness serwera aplikacji Codex oraz wszystkie testy live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz, muzyka, wideo, harness mediów) - plus obsługa danych uwierzytelniających dla uruchomień live - opisuje [Testowanie zestawów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i walidacji Pluginów znajdziesz w [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins).

## Uruchamiacze Docker (opcjonalne sprawdzenia "działa w Linuksie")

Te uruchamiacze Docker dzielą się na dwie grupy:

- Uruchamiacze modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczami profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji, obszar roboczy i opcjonalny plik środowiskowy profilu. Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Uruchamiacze Docker live utrzymują własne praktyczne limity tam, gdzie jest to potrzebne:
  `test:docker:live-models` domyślnie używa wyselekcjonowanego, obsługiwanego zestawu o wysokiej wartości sygnału, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ustaw `OPENCLAW_LIVE_MAX_MODELS`
  lub zmienne środowiskowe Gateway, gdy wyraźnie chcesz mniejszy limit albo większe skanowanie.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz bazowy jest tylko uruchamiaczem Node/Git dla ścieżek instalacji/aktualizacji/zależności Pluginów; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planisty znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów uniemożliwiają jednoczesny start wszystkich ciężkich ścieżek live, npm-install i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram nadal może ją uruchomić, gdy pula jest pusta, a potem utrzymuje ją jako jedyną działającą, aż pojemność znów będzie dostępna. Domyślnie jest to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` oraz `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas zasobów. Uruchamiacz domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, drukuje status co 30 sekund, zapisuje czasy zakończonych sukcesem ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w późniejszych uruchomieniach zaczynać od dłuższych ścieżek. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować ważony manifest ścieżek bez budowania lub uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wydrukować plan CI dla wybranych ścieżek, potrzeb pakietów/obrazów oraz danych uwierzytelniających.
- `Package Acceptance` to natywna dla GitHub bramka pakietu sprawdzająca "czy ten instalowalny tarball działa jako produkt?". Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E przeciwko dokładnie temu tarballowi zamiast ponownie pakować wybrany ref. Profile są uporządkowane według szerokości: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/Pluginu, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydań i triage awarii.
- Sprawdzenia budowania i wydań uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi statyczny zbudowany graf od `dist/entry.js` i `dist/cli/run-main.js` i kończy się błędem, jeśli start przed rozesłaniem polecenia importuje zależności pakietów, takie jak Commander, UI promptów, undici lub logowanie, zanim nastąpi rozesłanie polecenia; utrzymuje też dołączony fragment uruchomienia Gateway w budżecie i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Smoke test spakowanego CLI obejmuje również główną pomoc, pomoc onboard, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego punktu odcięcia harness toleruje tylko luki metadanych w opublikowanym pakiecie: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brakujące pliki poprawek w fiksturze git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Pluginów, brak utrwalania rekordów instalacji z marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi błędami.
- Uruchamiacze smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracyjne wyższego poziomu.
- Ścieżki Docker/Bash E2E, które instalują spakowany tarball OpenClaw przez `scripts/lib/openclaw-e2e-instance.sh`, ograniczają `npm install` przez `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (domyślnie `600s`; ustaw `0`, aby wyłączyć wrapper do debugowania).

Uruchamiacze Docker modeli live montują również tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez mutowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke testy obserwowalności: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` oraz `pnpm qa:observability:smoke` to prywatne ścieżki QA z checkoutu źródłowego. Celowo nie są częścią pakietowych ścieżek wydań Docker, ponieważ tarball npm pomija QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne rusztowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding env-ref oraz domyślnie Telegram, uruchamia doctor i wykonuje jedną zamockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Dymny test ścieżki użytkownika wydania: `pnpm test:docker:release-user-journey` instaluje spakowany tarball OpenClaw globalnie w czystym katalogu domowym Docker, uruchamia onboarding, konfiguruje zamockowanego dostawcę OpenAI, wykonuje turę agenta, instaluje/odinstalowuje zewnętrzne pluginy, konfiguruje ClickClack względem lokalnej fixtury, weryfikuje komunikację wychodzącą/przychodzącą, restartuje Gateway i uruchamia doctor.
- Dymny test typowanego onboardingu wydania: `pnpm test:docker:release-typed-onboarding` instaluje spakowany tarball, prowadzi `openclaw onboard` przez prawdziwy TTY, konfiguruje OpenAI jako dostawcę z odwołaniem do env, weryfikuje brak utrwalania surowego klucza i uruchamia zamockowaną turę agenta.
- Dymny test mediów/pamięci wydania: `pnpm test:docker:release-media-memory` instaluje spakowany tarball, weryfikuje rozumienie obrazu z załącznika PNG, wynik generowania obrazów zgodny z OpenAI, przypominanie wyszukiwania w pamięci oraz przetrwanie przypominania po restarcie Gateway.
- Dymny test ścieżki użytkownika aktualizacji wydania: `pnpm test:docker:release-upgrade-user-journey` domyślnie instaluje najnowszą opublikowaną wersję bazową starszą niż tarball kandydata, konfiguruje stan dostawcy/pluginu/ClickClack na opublikowanym pakiecie, aktualizuje do tarballa kandydata, a następnie ponownie uruchamia podstawową ścieżkę agenta/pluginu/kanału. Jeśli nie istnieje starsza opublikowana wersja bazowa, ponownie używa wersji kandydata. Nadpisz wersję bazową za pomocą `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Dymny test marketplace pluginów wydania: `pnpm test:docker:release-plugin-marketplace` instaluje z lokalnego marketplace fixtur, aktualizuje zainstalowany plugin, odinstalowuje go i weryfikuje, że CLI pluginu znika wraz z przyciętymi metadanymi instalacji.
- Dymny test instalacji Skills: `pnpm test:docker:skill-install` instaluje spakowany tarball OpenClaw globalnie w Docker, wyłącza instalacje przesłanych archiwów w konfiguracji, rozwiązuje bieżący aktywny slug umiejętności ClawHub z wyszukiwania, instaluje go za pomocą `openclaw skills install` i weryfikuje zainstalowaną umiejętność oraz metadane pochodzenia/blokady `.clawhub`.
- Dymny test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Docker, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie pluginu po aktualizacji, a następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Dymny test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na brudnej fixturze starego użytkownika z agentami, konfiguracją kanałów, listami dozwolonych pluginów, przestarzałym stanem zależności pluginów oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez aktywnego dostawcy ani kluczy kanału, a następnie uruchamia Gateway loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchomienia/statusu.
- Dymny test przetrwania aktualizacji z opublikowanej wersji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje tę wersję bazową z wbudowaną receptą poleceń, weryfikuje wynikową konfigurację, aktualizuje tę opublikowaną instalację do tarballa kandydata, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, a następnie uruchamia Gateway loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchomienie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną wersję bazową za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś zbiorczy scheduler o rozwinięcie dokładnych lokalnych wersji bazowych za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oraz rozwiń fixtury w kształcie zgłoszeń za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takich jak `reported-issues`; zestaw reported-issues zawiera `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych pluginów OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje tokeny bazowe meta, takie jak `last-stable-4` lub `all-since-2026.4.23`, a Full Release Validation rozwija bramkę pakietu release-soak do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Dymny test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego transkryptu kontekstu runtime oraz naprawę przez doctor dotkniętych zduplikowanych gałęzi przepisywania promptów.
- Dymny test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je za pomocą `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast się zawieszać. Użyj ponownie wcześniej zbudowanego tarballa za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń budowanie na hoście za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Dymny test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Dymny test aktualizacji domyślnie używa npm `latest` jako stabilnej wersji bazowej przed aktualizacją do tarballa kandydata. Nadpisz lokalnie za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo wejściem `update_baseline_version` workflow Install Smoke w GitHub. Kontrole instalatora bez root zachowują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do root nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- CI Install Smoke pomija zduplikowaną globalną aktualizację direct-npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tego env, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Dymny test CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje prawidłowy JSON oraz zachowanie zatrzymanego workspace. Użyj ponownie obrazu install-smoke za pomocą `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Dymny test snapshotu CDP przeglądarki: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E plus warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że snapshoty ról CDP obejmują URL-e linków, elementy klikalne promowane kursorem, referencje iframe oraz metadane ramek.
- Regresja minimalnego rozumowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, a następnie wymusza odrzucenie przez schemat dostawcy i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (zasilony Gateway + most stdio + dymny test surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu OpenClaw (prawdziwy serwer MCP stdio + wbudowany dymny test allow/deny profilu OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (skrypt: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagent (prawdziwy Gateway + zamykanie procesu potomnego MCP stdio po izolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (dymny test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, zniekształconych metadanych pakietu npm, ruchomych refów git, kitchen-sink ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink za pomocą `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixtury ClawHub.
- Dymny test niezmienionej aktualizacji pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Dymny test macierzy cyklu życia pluginu: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowany tarball OpenClaw w pustym kontenerze, instaluje plugin npm, przełącza włączenie/wyłączenie, aktualizuje i obniża jego wersję przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa przestarzały stan, logując metryki RSS/CPU dla każdej fazy cyklu życia.
- Dymny test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje dymny test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych refów git, fixtur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji dla zainstalowanych pluginów. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje śledzone zasobowo instalowanie, włączanie, wyłączanie, aktualizację, obniżanie wersji i odinstalowanie z brakującym kodem pluginu npm.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadal wygrywają ustawione nadpisania obrazów specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest już lokalny. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ weryfikują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runery Docker dla modeli live montują też bieżący checkout tylko do odczytu i
kopiują go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje mały, a Vitest nadal działa na dokładnym lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże, wyłącznie lokalne pamięci podręczne i wyjścia buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyjściowe `.build` lub
Gradle, aby uruchomienia live w Dockerze nie spędzały minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Docker.
`test:docker:openwebui` to wyższego poziomu smoke test zgodności: uruchamia kontener
OpenClaw gateway z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego gateway, loguje się przez
Open WebUI, sprawdza, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Ustaw `OPENWEBUI_SMOKE_MODE=models` dla kontroli CI w ścieżce wydania, które powinny zatrzymać się
po zalogowaniu do Open WebUI i wykryciu modeli, bez czekania na ukończenie modelu live.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć zakończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza modelu live. Podaj go przez środowisko
procesu, przygotowane profile auth albo jawny `OPENCLAW_PROFILE_FILE`.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia zaszczepiony kontener Gateway,
uruchamia drugi kontener, który odpala `openclaw mcp serve`, a następnie
weryfikuje routowane wykrywanie konwersacji, odczyty transkryptu, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia kanału +
uprawnień w stylu Claude przez prawdziwy most stdio MCP. Kontrola powiadomień
inspektuje bezpośrednio surowe ramki stdio MCP, więc smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.
`test:docker:agent-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu live.
Buduje obraz Docker repozytorium, uruchamia prawdziwy serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime OpenClaw bundle
MCP, wykonuje narzędzie, a następnie sprawdza, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia zaszczepiony Gateway z prawdziwym serwerem sondy stdio MCP, wykonuje
izolowany przebieg cron oraz jednorazowy przebieg potomny `sessions_spawn`, a następnie sprawdza,
że proces potomny MCP kończy działanie po każdym przebiegu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być znów potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` montowane i ładowane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów config/workspace i bez zewnętrznych montaży auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listę rozdzieloną przecinkami, taką jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla powtórek, które nie wymagają przebudowania
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profili (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt kontroli nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentacji: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz także kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego pipeline'u” bez prawdziwych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje config + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez prawdziwy Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwą skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływów pracy:** scenariusze wieloturowe, które asercją sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do asercji wywołań narzędzi + kolejności, odczytów plików skill i okablowania sesji.
- Mały zestaw scenariuszy skupionych na skillach (użycie vs unikanie, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane przez env) dopiero po przygotowaniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
pomija te współdzielone pliki styku i smoke testów; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub dostawców.

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
- **threading** - Obsługa ID wątków
- **directory** - API katalogu/listy członków
- **group-policy** - Wymuszanie polityki grup

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanałów
- **registry** - Kształt rejestru pluginów

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie pluginów
- **loader** - Ładowanie pluginów
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub modyfikacji kanału albo pluginu dostawcy
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty w live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest z natury wyłącznie live (limity szybkości, polityki auth), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która łapie błąd:
  - błąd konwersji/powtórzenia żądania dostawcy → bezpośredni test modeli
  - błąd pipeline'u sesji/historii/narzędzi gateway → smoke test gateway live albo bezpieczny dla CI test mock Gateway
- Poręcz ochronna przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza po jednym próbkowanym celu na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asercją sprawdza, że exec id z segmentem przejścia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem na niesklasyfikowanych target id, aby nowych klas nie dało się po cichu pominąć.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
