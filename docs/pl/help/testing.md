---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: zestawy testów jednostkowych/e2e/na żywo, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-05-06T09:16:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (unit/integration, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, podczas debugowania).
- Jak testy live wykrywają dane uwierzytelniające i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, pasma transportu live)** jest udokumentowany osobno:

- [Przegląd QA](/pl/concepts/qa-e2e-automation) - architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) - dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) - syntetyczny Plugin transportowy używany przez scenariusze wspierane przez repozytorium.

Ta strona obejmuje uruchamianie zwykłych zestawów testów oraz runnerów Docker/Parallels. Poniższa sekcja dotycząca runnerów specyficznych dla QA ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większości dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużymi zasobami: `pnpm test:max`
- Bezpośrednia pętla obserwowania Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia celowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Pasmo QA oparte na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz większej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych danych uwierzytelniających):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności runtime: uruchom `OpenClaw Performance` z
  `live_gpt54=true` dla rzeczywistego obrotu agenta `openai/gpt-5.4` albo
  `deep_profile=true` dla artefaktów CPU/sterty/trace Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty pasm mock-provider, deep-profile i GPT 5.4 do
  `openclaw/clawgrit-reports`, gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider zawiera także źródłowe liczby dotyczące uruchamiania Gateway, pamięci,
  obciążenia Pluginów, powtarzanej pętli hello-loop fałszywego modelu i startu CLI.
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model wykonuje teraz obrót tekstowy oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, wykonują także mały obrót obrazowy.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` albo
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` i ręczne
    `OpenClaw Release Checks` wywołują wielokrotnego użytku workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy Docker live model
    podzielone według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI uruchom `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    zaplanowanych/release'owych wywołań.
- Natywny smoke bound-chat Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia pasmo Docker live dla ścieżki app-server Codex, wiąże syntetyczną
    wiadomość prywatną Slack za pomocą `/codex bind`, ćwiczy `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne powiązanie Pluginu zamiast ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia obroty agenta Gateway przez należący do Pluginu harness app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie ćwiczy sondy obrazu,
    cron MCP, subagenta i Guardian. Wyłącz sondę subagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla ukierunkowanego sprawdzenia subagenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Kończy działanie po sondzie subagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne, dodatkowo zabezpieczające sprawdzenie powierzchni polecenia ratunkowego kanału wiadomości.
    Ćwiczy `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback planera przekłada się na audytowany typowany
    zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, kieruje samo `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztu Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  dla `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypcja asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live za pomocą opisanych niżej zmiennych środowiskowych listy dozwolonych.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. Parity agentowe jest zagnieżdżone pod
`QA-Lab - All Lanes` i walidacją release, a nie osobnym workflow PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA release-checks. Stabilne/domyślne sprawdzenia release
trzymają wyczerpujący soak live/Docker za `run_release_soak=true`; profil
`full` wymusza soak. `QA-Lab - All Lanes`
uruchamia się co noc na `main` oraz z ręcznego uruchomienia, z pasmem mock parity, pasmem live
Matrix, zarządzanym przez Convex pasmem live Telegram i zarządzanym przez Convex pasmem live Discord
jako zadaniami równoległymi. Zaplanowane QA i sprawdzenia release jawnie przekazują Matrix
`--profile fast`, podczas gdy CLI Matrix i domyślne wejście ręcznego workflow
pozostają `all`; ręczne uruchomienie może podzielić `all` na zadania `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parity oraz szybkie pasma Matrix i Telegram przed zatwierdzeniem release,
używając `mock-openai/gpt-5.5` dla sprawdzeń transportu release, dzięki czemu pozostają
deterministyczne i omijają normalne uruchamianie Pluginu dostawcy. Te bramy transportu live
wyłączają wyszukiwanie w pamięci; zachowanie pamięci pozostaje pokryte przez zestawy QA parity.

Shardy live media pełnego release używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów Docker live używają współdzielonego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commita, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
wewnątrz każdego sharda.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    liczbą wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić
    liczbę workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez niepowodującego kodu zakończenia.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia przez QA Lab live gauntlet Plugin OpenAI Kitchen Sink. 
    Instaluje zewnętrzny pakiet Kitchen Sink, weryfikuje inwentarz powierzchni SDK Plugin,
    sprawdza `/healthz` i `/readyz`, zapisuje dowody CPU/RSS Gateway,
    uruchamia live turę OpenAI i sprawdza diagnostykę adwersarialną.
    Wymaga live uwierzytelnienia OpenAI, takiego jak `OPENAI_API_KEY`. W nawodnionych sesjach Testbox
    automatycznie ładuje profil live-auth Testbox, gdy dostępny jest helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet mockowanych scenariuszy QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie oznacza tylko utrzymujące się obserwacje gorącego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki
    bez wyglądania jak regresja wielominutowego przeciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma
    już świeżego wyjścia runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz jednorazowej maszyny VM Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA praktyczne dla gościa:
    klucze dostawcy oparte na env, ścieżkę konfiguracji live dostawcy QA oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod korzeniem repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje normalny raport QA i podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia wspieraną przez Docker witrynę QA do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime Plugin ładuje się bez naprawy zależności przy starcie,
    uruchamia doctor i uruchamia jedną lokalną turę agenta przeciwko
    mockowanemu endpointowi OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietu
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke Docker zbudowanej aplikacji dla osadzonych transkryptów kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydata pakietu OpenClaw w Dockerze, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    live ścieżki QA Telegram z tym zainstalowanym pakietem jako Gateway SUT.
  - Domyślnie `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` albo
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby zamiast instalacji z rejestru testować rozwiązany lokalny tarball.
  - Używa tych samych poświadczeń env Telegram albo źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` oraz sekret roli Convex są obecne w CI,
    wrapper Docker automatycznie wybiera Convex.
  - Wrapper waliduje env poświadczeń Telegram albo Convex na hoście przed
    pracą build/install Docker. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko podczas celowego debugowania konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainera
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa środowiska
    `qa-live-shared` i dzierżaw poświadczeń CI Convex.
- GitHub Actions udostępnia także `Package Acceptance` dla dodatkowego dowodu produktu
  względem jednego kandydata pakietu. Przyjmuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, wysyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący harmonogram Docker E2E z profilami ścieżek smoke, package, product, full lub custom.
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

- Dowód dokładnego URL tarballa wymaga skrótu:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

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
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/Plugin przez edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane Plugin do pobrania nieobecne,
    pierwsza skonfigurowana naprawa doctor jawnie instaluje każdy brakujący
    Plugin do pobrania, a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje także znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po aktualizacji
    czyści pozostałości zależności starszego Plugin bez naprawy postinstall po stronie harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji instalacji pakietowej na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json` dla ścieżki artefaktu podsumowania i
    statusu poszczególnych ścieżek.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` dla live dowodu tury agenta.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Opakuj długie lokalne uruchomienia w timeout hosta, aby zastoje transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`
    przed założeniem, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut w doctor po aktualizacji i pracy
    aktualizacji pakietu na zimnym gościu; to nadal jest zdrowe, gdy zagnieżdżony log debug npm
    postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z indywidualnymi ścieżkami smoke Parallels
    macOS, Windows albo Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietu albo stanie Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną dołączoną powierzchnię Plugin, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API runtime nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia live ścieżkę QA Matrix względem jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródłowy - instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [QA Matrix](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia live ścieżkę QA Telegram względem rzeczywistej prywatnej grupy, używając tokenów bota drivera i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń pulowanych. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy pulowane.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy chcesz
    uzyskać artefakty bez niepowodującego kodu zakończenia.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-to-bot włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot drivera może obserwować ruch botów grupy.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt obserwowanych wiadomości w `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi obejmują RTT od żądania wysłania drivera do zaobserwowanej odpowiedzi SUT.

Live ścieżki transportu współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia poszczególnych ścieżek znajduje się w [Przegląd QA → Pokrycie live transportu](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` jest szerokim pakietem syntetycznym i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (albo `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab pozyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu.

Referencyjny scaffold projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślne env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na URL-e Convex `http://` przez loopback tylko do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` podczas normalnej pracy.

Polecenia administracyjne dla maintainerów (dodawanie/usuwanie/listowanie puli) wymagają konkretnie
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić adres URL witryny Convex, sekrety brokera,
prefiks punktu końcowego, limit czasu HTTP oraz osiągalność admin/list bez wypisywania
wartości sekretów. Użyj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo w skryptach i
narzędziach CI.

Domyślny kontrakt punktu końcowego (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Powodzenie: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/możliwe do ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Powodzenie: `{ status: "ok" }` (lub puste `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Powodzenie: `{ status: "ok" }` (lub puste `2xx`)
- `POST /admin/add` (tylko sekret maintainera)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Powodzenie: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret maintainera)
  - Żądanie: `{ credentialId, actorId }`
  - Powodzenie: `{ status: "ok", changed, credential }`
  - Ochrona aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret maintainera)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Powodzenie: `{ status: "ok", credentials, count }`

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym ciągiem identyfikatora czatu Telegram.
- `admin/add` weryfikuje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe payloady.

### Dodawanie kanału do QA

Architektura i nazwy pomocników scenariuszy dla nowych adapterów kanałów znajdują się w [omówieniu QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym seam hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Traktuj te zestawy jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Unit / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia bez wskazanego celu używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje znanych błędów
- Oczekiwania:
  - Działa w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallbacków `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych małych fixture’ów Plugin, a nie
    prawdziwych API źródeł dołączonych Plugin. Prawdziwe ładowania API Plugin należą do
    zestawów kontraktowych/integracyjnych należących do Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` bez wskazanego celu uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu root. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega temu, aby praca auto-reply/extensions zagłodziła niepowiązane zestawy.
    - `pnpm test --watch` nadal używa natywnego grafu projektu root `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez pasy o zawężonym zakresie, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika płacenia pełnego kosztu startowego projektu root.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git do tanich pasów o zawężonym zakresie: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności z grafu importów. Edycje konfiguracji/setupu/pakietów nie uruchamiają szeroko testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to zwykła inteligentna lokalna bramka sprawdzająca dla wąskich zmian. Klasyfikuje diff na core, testy core, extensions, testy extension, aplikacje, dokumentację, metadane wydania, narzędzia live Docker i tooling, a następnie uruchamia pasujące polecenia typecheck, lint i guard. Nie uruchamia testów Vitest; użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego. Podbicia wersji wyłącznie w metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności root, z guardem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje harnessu live Docker ACP uruchamiają skoncentrowane kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker i próbne uruchomienie schedulera live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zależności, eksporty, wersje i inne edycje powierzchni pakietu nadal używają szerszych guardów.
    - Lekkie importowo testy jednostkowe z agentów, poleceń, plugins, pomocników auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych są kierowane przez pas `unit-fast`, który pomija `test/setup-openclaw-runtime.ts`; pliki ze stanem/ciężkim runtime pozostają na istniejących pasach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` również mapują uruchomienia w trybie changed na jawne sąsiednie testy w tych lekkich pasach, więc edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane kubełki dla pomocników core najwyższego poziomu, testów integracyjnych najwyższego poziomu `reply.*` oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch i commands/state-routing, aby jeden ciężki importowo kubełek nie posiadał całego ogona Node.
    - Normalne CI dla PR/main celowo pomija wsadowy sweep extension i wyłącznie wydaniowy shard `agentic-plugins`. Full Release Validation uruchamia osobny workflow potomny `Plugin Prerelease` dla tych ciężkich w plugins/extensions zestawów na kandydatach do wydania.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Gdy zmieniasz wejścia odkrywania narzędzia wiadomości albo kontekst runtime compaction,
      zachowaj oba poziomy pokrycia.
    - Dodaj skoncentrowane regresje pomocników dla czystych granic routingu i normalizacji.
    - Utrzymuj zestawy integracyjne embedded runnera w dobrym stanie:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że identyfikatory o zawężonym zakresie i zachowanie compaction nadal przepływają
      przez prawdziwe ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocników
      nie są wystarczającym zamiennikiem dla tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Podstawowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach root, konfiguracjach e2e i live.
    - Pas UI root zachowuje swój setup `jsdom` i optimizer, ale również działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same wartości domyślne `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Node
      Vitest, aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać z bazowym zachowaniem V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` pokazuje, które pasy architektoniczne uruchamia diff.
    - Hook pre-commit wykonuje tylko formatowanie. Ponownie dodaje sformatowane pliki do stagingu i
      nie uruchamia lint, typecheck ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem pracy lub push, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie kieruje przez tanie pasy o zawężonym zakresie. Użyj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harnessu, konfiguracji, pakietu albo kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Lokalne automatyczne skalowanie workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych
      uruchomień Vitest domyślnie powoduje mniej szkód.
    - Podstawowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostawały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` włączone na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      dane wyjściowe rozbicia importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI
      z wzorcem include dopisują nazwę shardu, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu w importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym seamem `*.runtime.ts` i
      mockuj ten seam bezpośrednio zamiast deep-importować pomocniki runtime tylko
      po to, by przepuścić je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje kierowane
      `test:changed` z natywną ścieżką projektu root dla tego skomitowanego
      diffu i wypisuje czas rzeczywisty oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i konfigurację root Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu jednostkowego z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (Gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszony jeden worker
- Zakres:
  - Uruchamia prawdziwy Gateway loopback z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny churn komunikatów gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki trwałości pakietu stabilności diagnostycznej
  - Asercje sprawdzają, że recorder pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek per sesja wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąski pas do dalszej pracy nad regresjami stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (dymny test Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Plugin w `extensions/`
- Domyślne ustawienia środowiska uruchomieniowego:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych procesów roboczych (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` wymusza liczbę procesów roboczych (maksymalnie 16).
  - `OPENCLAW_E2E_VERBOSE=1` ponownie włącza szczegółowe wyjście konsoli.
- Zakres:
  - Wieloinstancyjne zachowanie Gateway end-to-end
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższa obsługa sieci
- Oczekiwania:
  - Uruchamia się w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż w testach jednostkowych (może być wolniejsze)

### E2E: smoke test backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany Gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zachowanie systemu plików w formie zdalno-kanonicznej przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy Gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1` włącza test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` wskazuje niedomyślny binarny plik CLI lub skrypt opakowujący

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Plugin w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wykrywanie zmian formatów dostawców, osobliwości wywoływania narzędzi, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Celowo nie jest stabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live źródłują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracyjne/uwierzytelniające do tymczasowego katalogu domowego testu, aby fixture testów jednostkowych nie mogły zmodyfikować prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi bootstrapu Gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz odzyskać pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) lub nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby po odpowiedziach limitu szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, aby linie postępu dostawcy/Gateway strumieniowały się natychmiast podczas uruchomień live.
  - Dostosuj Heartbeat modeli bezpośrednich za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj Heartbeat Gateway/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Dla macierzy modeli live, smoke testów backendu CLI, smoke testów ACP, harnessu serwera aplikacji Codex
oraz wszystkich testów live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, harness mediów) - plus obsługi poświadczeń dla uruchomień live - zobacz
[Testowanie zestawów live](/pl/help/testing-live). Dla dedykowanej listy kontrolnej aktualizacji i
walidacji Plugin zobacz
[Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne kontrole „działa w Linuksie”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko swój odpowiadający plik live kluczy profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i obszar roboczy (oraz źródłując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny sweep Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` i
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  wyraźnie chcesz większego, wyczerpującego skanu.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Surowy obraz jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności Plugin; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, npm-install i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram nadal może ją uruchomić, gdy pula jest pusta, a potem utrzymuje ją jako jedyną działającą, dopóki pojemność znów nie będzie dostępna. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, drukuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w późniejszych uruchomieniach zaczynać od dłuższych ścieżek. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować ważony manifest ścieżek bez budowania ani uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wydrukować plan CI dla wybranych ścieżek, potrzeb pakietów/obrazów i poświadczeń.
- `Package Acceptance` to natywna dla GitHub bramka pakietu odpowiadająca na pytanie „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według szerokości: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/Plugin, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydania i triage awarii.
- Kontrole build i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` i kończy się niepowodzeniem, jeśli importy startowe przed dispatch polecenia ładują zależności pakietów, takie jak Commander, prompt UI, undici lub logowanie; utrzymuje też dołączony chunk uruchomieniowy Gateway w budżecie i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Smoke test spakowanego CLI obejmuje też główną pomoc, pomoc onboard, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego progu harness toleruje tylko luki metadanych wysłanych pakietów: pominięte prywatne wpisy inwentarza QA, brakujące `gateway install --wrapper`, brakujące pliki łatek w fixture git pochodzącej z tarballa, brakujące utrwalone `update.channel`, starsze lokalizacje rekordów instalacji Plugin, brakujące utrwalanie rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi awariami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live montują też przez bind-mount tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez mutowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA z checkoutem źródeł. Celowo nie jest częścią ścieżek wydania pakietu Docker, ponieważ tarball npm pomija QA Lab.
- Smoke test live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne rusztowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding z odwołaniem do zmiennych środowiskowych oraz domyślnie Telegram, uruchamia doctor i wykonuje jedną zamockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę na hoście przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Dockerze, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie pluginu po aktualizacji, następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw nad zanieczyszczoną fixture starego użytkownika z agentami, konfiguracją kanału, listami dozwolonych pluginów, przestarzałym stanem zależności pluginów oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez live kluczy dostawcy ani kanału, następnie uruchamia Gateway loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchamiania/statusu.
- Smoke test przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasiewa realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę za pomocą wbudowanego przepisu poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do tarballa kandydata, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchamianie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś harmonogram agregujący o rozwinięcie dokładnych lokalnych baz przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, i rozwiń fixture w kształcie zgłoszeń przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takie jak `reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych pluginów OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje tokeny metabaseline, takie jak `last-stable-4` lub `all-since-2026.4.23`, a Full Release Validation rozszerza pakietową bramkę release-soak do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke test kontekstu środowiska wykonawczego sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego kontekstu środowiska wykonawczego w transkrypcie oraz naprawę przez doctor dotkniętych zduplikowanych gałęzi prompt-rewrite.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca wbudowanych dostawców obrazów zamiast zawieszać się. Użyj ponownie wstępnie zbudowanego tarballa przez `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build na hoście przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do tarballa kandydata. Nadpisz lokalnie przez `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo przez wejście `update_baseline_version` workflow Install Smoke na GitHubie. Sprawdzenia instalatora bez roota zachowują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do roota nie maskowały zachowania instalacji lokalnej dla użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- CI Install Smoke pomija zduplikowaną globalną aktualizację direct-npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace przez agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasiewa dwóch agentów z jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test zrzutu Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E plus warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że zrzuty ról CDP obejmują URL-e linków, elementy klikalne wypromowane kursorem, odwołania iframe i metadane ramek.
- Regresja minimalnego rozumowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, czy surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (zasiany Gateway + most stdio + smoke test surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (prawdziwy serwer MCP stdio + smoke test wbudowanego profilu Pi allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagent (prawdziwy Gateway + demontaż procesu potomnego MCP stdio po izolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z podniesionymi zależnościami, ruchomych referencji git, pełnego ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/środowisko wykonawcze kitchen-sink przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixture ClawHub.
- Smoke test niezmienionej aktualizacji pluginu: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test macierzy cyklu życia pluginu: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowany tarball OpenClaw w pustym kontenerze, instaluje plugin npm, przełącza włączanie/wyłączanie, aktualizuje i cofa jego wersję przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa przestarzały stan, jednocześnie logując metryki RSS/CPU dla każdej fazy cyklu życia.
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z podniesionymi zależnościami, ruchomych referencji git, fixture ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji zainstalowanych pluginów. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje śledzone zasobowo instalowanie, włączanie, wyłączanie, aktualizowanie, cofanie wersji i odinstalowywanie przy brakującym kodzie pluginu npm.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazu specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny obraz współdzielony, skrypty pobierają go, jeśli nie jest już lokalny. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielone środowisko wykonawcze zbudowanej aplikacji.

Uruchamiacze Docker dla modeli live również montują bieżące pobranie repozytorium w trybie tylko do odczytu i
przenoszą je do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje mały, a Vitest nadal uruchamia się względem dokładnie Twojego lokalnego źródła/konfiguracji.
Krok przygotowania pomija duże lokalne pamięci podręczne i wyjścia kompilacji aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyjściowe `.build` lub
Gradle, aby uruchomienia live w Dockerze nie spędzały minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają także `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itp. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy trzeba zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Docker.
`test:docker:openwebui` to test dymny kompatybilności wyższego poziomu: uruchamia
kontener Gateway OpenClaw z włączonymi punktami końcowymi HTTP kompatybilnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć ukończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(`~/.profile` domyślnie) jest głównym sposobem jego dostarczenia w uruchomieniach w Dockerze.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie potrzebuje
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener Gateway,
uruchamia drugi kontener, który spawnuje `openclaw mcp serve`, a następnie
weryfikuje trasowane wykrywanie rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, trasowanie wysyłki wychodzącej oraz powiadomienia kanałowe +
uprawnień w stylu Claude przez rzeczywisty most stdio MCP. Kontrola powiadomień
bezpośrednio sprawdza surowe ramki stdio MCP, więc test dymny waliduje to, co
most faktycznie emituje, a nie tylko to, co przypadkiem ujawnia konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie potrzebuje klucza modelu live.
Buduje obraz Docker repozytorium, uruchamia rzeczywisty serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime pakietu Pi
MCP, wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie potrzebuje klucza modelu live.
Uruchamia zasiany Gateway z rzeczywistym serwerem sondy stdio MCP, wykonuje
izolowaną turę cron i jednorazową turę dziecka `/subagents spawn`, a następnie weryfikuje,
że proces dziecka MCP kończy działanie po każdym uruchomieniu.

Ręczny test dymny wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji trasowania wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i ładowane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe załadowane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montaży uwierzytelnienia CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelnienia CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia providerów montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listy rozdzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować providerów w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowania
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profilu (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla testu dymnego Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt kontroli nonce używany przez test dymny Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz także kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „rzeczywistego pipeline’u” bez rzeczywistych providerów:

- Wywoływanie narzędzi Gateway (mock OpenAI, rzeczywisty Gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: „uruchamia wywołanie narzędzia mock OpenAI end-to-end przez pętlę agenta Gateway”)
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + egzekwuje uwierzytelnienie): `src/gateway/gateway.test.ts` (przypadek: „uruchamia kreator przez ws i zapisuje konfigurację tokenu uwierzytelniającego”)

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez rzeczywisty Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują połączenie sesji i skutki konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przeniesienie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych providerów do sprawdzania wywołań narzędzi + kolejności, odczytów plików skills i połączenia sesji.
- Mały zestaw scenariuszy skoncentrowanych na skills (użyj kontra unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane env) dopiero po przygotowaniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt Plugin i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany Plugin i kanał są zgodne ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu oraz zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
pomija te współdzielone pliki szwów i testów dymnych; uruchamiaj polecenia kontraktowe jawnie,
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
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie zasad grupy

### Kontrakty statusu providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru Plugin

### Kontrakty providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu uwierzytelniania
- **auth-choice** - Wybór/selekcja uwierzytelnienia
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie Plugin
- **loader** - Ładowanie Plugin
- **runtime** - Runtime providera
- **shape** - Kształt/interfejs Plugin
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub zmodyfikowaniu kanału albo providera Plugin
- Po refaktoryzacji rejestracji lub wykrywania Plugin

Testy kontraktowe uruchamiają się w CI i nie wymagają rzeczywistych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub providera albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest to z natury tylko live (limity szybkości, polityki uwierzytelniania), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wychwytuje błąd:
  - błąd konwersji/odtwarzania żądania providera → bezpośredni test modeli
  - błąd pipeline’u sesji/historii/narzędzi Gateway → test dymny live Gateway lub bezpieczny dla CI mock test Gateway
- Guardrail przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza po jednym próbkowanym celu na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że id wykonania z segmentami przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem dla niesklasyfikowanych id celów, aby nowych klas nie dało się cicho pominąć.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
