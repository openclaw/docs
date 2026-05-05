---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway i agenta
summary: 'Zestaw testowy: zestawy testów jednostkowych/e2e/na żywo, runnery Dockera i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-05-05T06:18:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (jednostkowe/integracyjne, e2e, live) oraz mały zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać dla typowych przepływów pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają poświadczenia i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, pasy transportu live)** jest udokumentowany oddzielnie:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Macierz QA](/pl/concepts/qa-matrix) — referencja dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny Plugin transportu używany przez scenariusze oparte na repozytorium.

Ta strona obejmuje uruchamianie standardowych zestawów testów oraz runnerów Docker/Parallels. Poniższa sekcja dotycząca runnerów specyficznych dla QA ([Runnery specyficzne dla QA](#qa-specific-runners)) zawiera konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na mocnej maszynie: `pnpm test:max`
- Bezpośrednia pętla obserwowania Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia ukierunkowane.
- Strona QA oparta na Docker: `pnpm qa:lab:up`
- Pas QA oparty na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów lub chcesz uzyskać dodatkową pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga rzeczywistych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche wskazanie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności runtime: wywołaj `OpenClaw Performance` z
  `live_gpt54=true` dla rzeczywistej tury agenta `openai/gpt-5.4` albo
  `deep_profile=true` dla artefaktów CPU/sterty/trace Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty pasów mock-provider, deep-profile oraz GPT 5.4 do
  `openclaw/clawgrit-reports`, gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider zawiera także źródłowe metryki uruchomienia Gateway, pamięci,
  obciążenia Pluginów, powtarzanej pętli hello-loop fałszywego modelu oraz startu CLI.
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane ogłaszają wejście `image`, uruchamiają także małą turę obrazową.
    Wyłącz dodatkowe sondy przez `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, gdy izolujesz awarie dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują współużywany workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live Docker
    shardowane według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań zaplanowanych/wydaniowych.
- Smoke natywnego czatu powiązanego Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia pas live Docker względem ścieżki app-server Codex, wiąże syntetyczny
    Slack DM za pomocą `/codex bind`, wykonuje `/codex fast` oraz
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne powiązanie Pluginu zamiast ACP.
- Smoke harnessu app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należący do Pluginu harness app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    cron MCP, subagenta oraz Guardian. Wyłącz sondę subagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, gdy izolujesz inne awarie
    app-server Codex. Dla ukierunkowanego sprawdzenia subagenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Kończy działanie po sondzie subagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne sprawdzenie typu „pasek i szelki” dla powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkowuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że fuzzy planner fallback przekłada się na audytowany, typowany
    zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, kieruje samo `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypcja asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live za pomocą zmiennych środowiskowych listy dozwolonych opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia działają obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. Parity agentowa jest zagnieżdżona pod
`QA-Lab - All Lanes` oraz walidacją wydania, a nie jako samodzielny workflow PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` lub grupy QA release-checks. Stabilne/domyślne kontrole wydania
trzymają wyczerpujący soak live/Docker za `run_release_soak=true`; profil
`full` wymusza soak. `QA-Lab - All Lanes`
uruchamia się co noc na `main` oraz z ręcznego wywołania z pasem mock parity, pasem live
Matrix, pasem live Telegram zarządzanym przez Convex i pasem live Discord
zarządzanym przez Convex jako zadaniami równoległymi. Zaplanowane QA i kontrole wydania przekazują Matrix
`--profile fast` jawnie, podczas gdy CLI Matrix oraz ręczne wejście workflow
pozostają domyślnie `all`; ręczne wywołanie może podzielić `all` na zadania
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parity oraz szybkie pasy Matrix i Telegram przed zatwierdzeniem wydania,
używając `mock-openai/gpt-5.5` do kontroli transportu wydania, aby pozostały
deterministyczne i uniknęły normalnego startu provider-plugin. Te Gateway transportu live
wyłączają wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez zestawy QA parity.

Shardy live media pełnego wydania używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live Docker używają współdzielonego
obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` budowanego raz dla wybranego
commita, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
wewnątrz każdego sharda.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia równolegle wiele wybranych scenariuszy z izolowanymi
    procesami roboczymi Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    procesów roboczych, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy działanie z kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu wyjścia.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock na potrzeby eksperymentalnego
    pokrycia fikstur i atrap protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia pełny live zestaw prób OpenAI Kitchen Sink Plugin przez QA Lab. Instaluje
    zewnętrzny pakiet Kitchen Sink, weryfikuje inwentarz powierzchni Plugin SDK,
    sprawdza `/healthz` i `/readyz`, zapisuje dowody CPU/RSS Gateway,
    uruchamia live turę OpenAI i sprawdza diagnostykę kontradyktoryjną.
    Wymaga live uwierzytelniania OpenAI, takiego jak `OPENAI_API_KEY`. W uwodnionych sesjach Testbox
    automatycznie ładuje profil live-auth Testbox, gdy pomocnik
    `openclaw-testbox-env` jest obecny.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet scenariuszy QA Lab z atrapami
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie oznacza tylko utrzymujące się obserwacje wysokiego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki
    bez wyglądania jak regresja wielominutowego obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma
    jeszcze świeżego wyniku runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA w jednorazowej maszynie wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Live uruchomienia przekazują obsługiwane wejścia uwierzytelniania QA praktyczne dla gościa:
    klucze dostawcy oparte na env, ścieżkę konfiguracji live dostawcy QA oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostawać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany obszar roboczy.
  - Zapisuje normalny raport QA i podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Dockerze stronę QA do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding z kluczem API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime Plugin ładuje się bez naprawy zależności
    podczas startu, uruchamia doctor i uruchamia jedną lokalną turę agenta przeciwko
    atrapowanemu endpointowi OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietowej
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny dymny test Docker zbudowanej aplikacji dla transkryptów osadzonego kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niestandardowa wiadomość niewyświetlana zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydujący pakiet OpenClaw w Dockerze, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowany CLI, a następnie ponownie używa
    live ścieżki QA Telegram z tym zainstalowanym pakietem jako SUT Gateway.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` lub
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby zamiast instalowania z rejestru testować rozwiązany lokalny tarball.
  - Używa tych samych poświadczeń env Telegram lub źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/release ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker wybiera Convex automatycznie.
  - Wrapper weryfikuje env poświadczeń Telegram lub Convex na hoście przed
    pracą build/install Dockera. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko podczas celowego debugowania konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow utrzymującego
    `NPM Telegram Beta E2E`. Nie działa przy merge. Workflow używa środowiska
    `qa-live-shared` i dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia też `Package Acceptance` do bocznego dowodu produktowego
  względem jednego kandydującego pakietu. Przyjmuje zaufany ref, opublikowany spec npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full lub custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić workflow QA Telegram
  względem tego samego artefaktu `package-under-test`.
  - Najnowszy dowód produktowy beta:

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
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/Pluginy przez edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane pobieralne Pluginy nieobecne,
    pierwsza skonfigurowana naprawa doctor instaluje każdy brakujący pobieralny
    Plugin jawnie, a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po aktualizacji
    czyści pozostałości zależności starszego Plugin bez
    naprawy postinstall po stronie harnessa.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny dymny test aktualizacji instalacji pakietowej na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` lub `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json` dla ścieżki artefaktu podsumowania i
    statusu poszczególnych ścieżek.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` do dowodu live tury agenta.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owijaj długie lokalne uruchomienia w timeout hosta, aby zastoje transportu Parallels nie
    zużyły reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` lub `linux-update.log`
    przed założeniem, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut na doctor po aktualizacji i pracy
    aktualizacji pakietu na zimnym gościu; nadal jest to zdrowy stan, gdy zagnieżdżony log debug
    npm postępuje.
  - Nie uruchamiaj tego wrappera agregującego równolegle z pojedynczymi ścieżkami dymnymi Parallels
    macOS, Windows lub Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietu lub stanie gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonego Plugin, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API runtime, nawet gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich dymnych testów protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia live ścieżkę QA Matrix względem jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródłowy — instalacje pakietowe nie wysyłają `qa-lab`.
  - Pełny CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [Matrix QA](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia live ścieżkę QA Telegram względem rzeczywistej prywatnej grupy przy użyciu tokenów bota sterownika i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Kończy działanie z kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy chcesz
    uzyskać artefakty bez błędnego kodu wyjścia.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-bot włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt obserwowanych wiadomości w `.artifacts/qa-e2e/...`. Scenariusze z odpowiedziami obejmują RTT od żądania wysłania przez sterownik do zaobserwowanej odpowiedzi SUT.

Live ścieżki transportowe współdzielą jeden standardowy kontrakt, aby nowe transporty nie dryfowały; macierz pokrycia dla poszczególnych ścieżek znajduje się w [przeglądzie QA → Live transport coverage](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` jest szerokim syntetycznym zestawem i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab pobiera wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamykaniu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślnie env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex `http://` przez local loopback wyłącznie do rozwoju lokalnego.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` podczas normalnej pracy.

Polecenia administracyjne dla opiekunów (dodawanie/usuwanie/lista puli) wymagają konkretnie
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla opiekunów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami na żywo, aby sprawdzić adres URL witryny Convex, sekrety brokera,
prefiks punktu końcowego, limit czasu HTTP oraz dostępność admin/list bez drukowania
wartości sekretów. Użyj `--json`, aby uzyskać wynik czytelny maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt punktów końcowych (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/ponawialne: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukces: `{ status: "ok" }` (lub pusty `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukces: `{ status: "ok" }` (lub pusty `2xx`)
- `POST /admin/add` (tylko sekret opiekuna)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Sukces: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret opiekuna)
  - Żądanie: `{ credentialId, actorId }`
  - Sukces: `{ status: "ok", changed, credential }`
  - Ochrona aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret opiekuna)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Sukces: `{ status: "ok", credentials, count }`

Kształt ładunku dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym ciągiem identyfikatora czatu Telegram.
- `admin/add` sprawdza ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowo sformowane ładunki.

### Dodawanie kanału do QA

Architektura i nazwy pomocników scenariuszy dla nowych adapterów kanałów znajdują się w [omówieniu QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym szwie hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i twórz scenariusze w `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Traktuj zestawy jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia bez wskazanego celu używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/jednostkowe pod `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą potwierdzać szerokie zachowanie fallbacków `api.js` i
    `runtime-api.js` za pomocą wygenerowanych małych fixture'ów Plugin, a nie
    rzeczywistych źródłowych API wbudowanych Plugin. Rzeczywiste ładowanie API Plugin należy do
    zestawów kontraktowych/integracyjnych utrzymywanych przez Plugin.

<AccordionGroup>
  <Accordion title="Projekty, shardy i zakresowe ścieżki">

    - `pnpm test` bez wskazanego celu uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego dużego natywnego procesu projektu głównego. Zmniejsza to szczytowy RSS na obciążonych maszynach i zapobiega temu, aby prace auto-reply/rozszerzeń zagłodziły niepowiązane zestawy.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika płacenia pełnego kosztu startu projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git do tanich ścieżek zakresowych: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł oraz lokalne zależności grafu importów. Edycje konfiguracji/setupu/pakietów nie uruchamiają szeroko testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzająca dla wąskich prac. Klasyfikuje diff na core, testy core, rozszerzenia, testy rozszerzeń, aplikacje, dokumentację, metadane wydań, narzędzia live Docker i narzędzia, a następnie uruchamia pasujące polecenia sprawdzania typów, lint i guard. Nie uruchamia testów Vitest; wywołaj `pnpm test:changed` lub jawne `pnpm test <target>` jako dowód testowy. Zmiany wersji dotyczące wyłącznie metadanych wydań uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych, z guardem, który odrzuca zmiany pakietów poza polem wersji najwyższego poziomu.
    - Edycje harnessu live Docker ACP uruchamiają skoncentrowane kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker oraz próbny przebieg planisty live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zmiany zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych guardów.
    - Lekkie importowo testy jednostkowe z agentów, poleceń, Plugin, pomocników auto-reply, `plugin-sdk` i podobnych obszarów czysto narzędziowych przechodzą przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` także mapują uruchomienia w trybie changed na jawne sąsiednie testy w tych lekkich ścieżkach, więc edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla pomocników core najwyższego poziomu, testów integracyjnych najwyższego poziomu `reply.*` oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch i commands/state-routing, aby jeden ciężki importowo koszyk nie posiadał całego ogona Node.
    - Normalne CI PR/main celowo pomija wsadowy sweep rozszerzeń i shard wyłącznie wydaniowy `agentic-plugins`. Pełna walidacja wydania uruchamia osobny potomny przepływ pracy `Plugin Prerelease` dla tych ciężkich zestawów Plugin/rozszerzeń na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie wbudowanego runnera">

    - Gdy zmieniasz wejścia wykrywania narzędzia wiadomości lub kontekst runtime
      Compaction, zachowaj oba poziomy pokrycia.
    - Dodaj skoncentrowane regresje pomocników dla granic czystego routingu i normalizacji.
    - Utrzymuj zdrowie zestawów integracyjnych wbudowanego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` i
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy sprawdzają, że zakresowe identyfikatory i zachowanie Compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocników
      nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli Vitest i izolacji">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, e2e i konfiguracjach live.
    - Główna ścieżka UI zachowuje swój setup `jsdom` i optymalizator, ale także działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same ustawienia domyślne `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla potomnych procesów Node
      Vitest, aby zmniejszyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać z zachowaniem standardowego V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne uruchamia diff.
    - Hook pre-commit służy wyłącznie do formatowania. Ponownie stage'uje sformatowane pliki i
      nie uruchamia lint, sprawdzania typów ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub push, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie przechodzi przez tanie ścieżki zakresowe. Użyj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      zdecyduje, że edycja harnessu, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Automatyczne skalowanie lokalnych workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych
      uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, dzięki czemu ponowne uruchomienia w trybie changed pozostają poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jednej jawnej lokalizacji cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      wynik rozbicia importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI z wzorcem include
      doklejają nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu w importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym szwem `*.runtime.ts` i
      mockuj ten szew bezpośrednio zamiast wykonywać głębokie importy pomocników runtime tylko
      po to, aby przepuścić je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje trasowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas ścienny oraz maksymalny RSS na macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu jednostkowego z wyłączonym paralelizmem plików.

  </Accordion>
</AccordionGroup>

### Stabilność (Gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszona na jednego workera
- Zakres:
  - Uruchamia rzeczywisty Gateway przez local loopback z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny ruch wiadomości Gateway, pamięci i dużych ładunków przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki utrwalania pakietu stabilności diagnostycznej
  - Potwierdza, że recorder pozostaje ograniczony, syntetyczne próbki RSS pozostają poniżej budżetu presji, a głębokości kolejek per sesja wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka do follow-upów regresji stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (dymny test Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Plugin w `extensions/`
- Domyślne ustawienia środowiska uruchomieniowego:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnej liczby workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby zmniejszyć narzut wejścia/wyjścia konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (ograniczoną do 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji Gateway
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższe operacje sieciowe
- Oczekiwania:
  - Działa w CI (gdy jest włączone w pipeline)
  - Nie wymaga rzeczywistych kluczy
  - Więcej ruchomych części niż w testach jednostkowych (może być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany OpenShell gateway na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Sprawdza backend OpenClaw OpenShell przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zachowanie systemu plików z kanoniczną ścieżką zdalną przez mostek sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny plik CLI lub skrypt opakowujący

### Live (rzeczywi dostawcy + rzeczywiste modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Plugin w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z rzeczywistymi danymi uwierzytelniającymi?”
  - Wykrywanie zmian formatów dostawców, osobliwości wywoływania narzędzi, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia nie jest stabilne w CI (rzeczywiste sieci, rzeczywiste zasady dostawców, limity, awarie)
  - Kosztuje pieniądze / używa limitów szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live wczytują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał konfiguracyjny/uwierzytelniający do tymczasowego katalogu domowego testu, aby fixtures testów jednostkowych nie mogły zmodyfikować Twojego rzeczywistego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego rzeczywistego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale tłumi dodatkowy komunikat `~/.profile` i wycisza logi rozruchu Gateway / komunikaty Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) lub nadpisanie dla danego uruchomienia live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próbę po odpowiedziach z limitem szybkości.
- Wyjście postępu/heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, więc długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, aby linie postępu dostawcy/Gateway były strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj heartbeat modeli bezpośrednich za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj heartbeat Gateway/sond za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Macierz modeli live, smoke backendu CLI, smoke ACP, harness serwera aplikacji Codex
oraz wszystkie testy live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, harness mediów) — a także obsługę danych uwierzytelniających dla uruchomień live — opisano w
[Testowanie zestawów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i
walidacji Plugin znajdziesz w
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne kontrole „działa w Linux”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live kluczy profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i workspace (oraz wczytując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny przegląd Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  celowo chcesz większego, wyczerpującego skanowania.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz bare to tylko runner Node/Git dla ścieżek instalacji/aktualizacji/zależności pluginów; te ścieżki montują wcześniej zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego schedulera: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, npm-install i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, scheduler nadal może ją uruchomić, gdy pula jest pusta, a następnie utrzymuje ją jako jedyną uruchomioną do czasu ponownej dostępności pojemności. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostosuj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje preflight Docker, usuwa nieaktualne kontenery OpenClaw E2E, wypisuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w kolejnych uruchomieniach najpierw startować dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania lub uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietu/obrazu i danych uwierzytelniających.
- `Package Acceptance` to natywna dla GitHub bramka pakietu dla pytania „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według szerokości: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/pluginu, macierz przetrwania opublikowanej aktualizacji, domyślne ustawienia wydania i triage awarii.
- Kontrole budowania i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Guard przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` i kończy się niepowodzeniem, jeśli importy startowe przed dispatch polecenia importują zależności pakietu, takie jak Commander, UI promptów, undici lub logowanie, zanim nastąpi dispatch polecenia; utrzymuje też dołączony chunk uruchomieniowy Gateway poniżej budżetu i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Smoke spakowanego CLI obejmuje też główną pomoc, pomoc onboard, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (w tym `2026.4.25-beta.*`). Do tego punktu harness toleruje tylko luki metadanych wysłanych pakietów: pominięte prywatne wpisy inwentarza QA, brakujące `gateway install --wrapper`, brakujące pliki patch w fixture git pochodzącym z tarballa, brakujące utrwalone `update.channel`, starsze lokalizacje rekordów instalacji Plugin, brakujące utrwalanie rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi awariami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują integracje wyższego poziomu.

Runnery Docker modeli live montują też tylko potrzebne katalogi domowe uwierzytelniania CLI (lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez mutowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Test dymny wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Test dymny backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Test dymny uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Test dymny obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka kontroli źródłowego checkoutu QA. Celowo nie jest częścią ścieżek wydania Docker pakietu, ponieważ archiwum tarball npm pomija QA Lab.
- Test dymny live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne szkielety): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Test dymny onboardingu/kanału/agenta z archiwum tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowane archiwum tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding z odwołaniem do zmiennej środowiskowej oraz domyślnie Telegram, uruchamia doctor i wykonuje jeden zamockowany przebieg agenta OpenAI. Użyj ponownie wcześniej zbudowanego archiwum tarball przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo zmień kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Test dymny przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowane archiwum tarball OpenClaw globalnie w Dockerze, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie Plugin po aktualizacji, następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Test dymny przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowane archiwum tarball OpenClaw na zabrudzonym fiksturze starego użytkownika z agentami, konfiguracją kanału, listami dozwolonych Plugin, przestarzałym stanem zależności Plugin oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy live dostawcy ani kanału, następnie uruchamia Gateway przez loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchomienia/statusu.
- Test dymny przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę przez wbudowaną receptę polecenia, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do kandydującego archiwum tarball, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway przez loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchomienie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś zbiorczy scheduler o rozwinięcie dokładnych lokalnych baz przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oraz rozwiń fikstury w kształcie zgłoszeń przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takie jak `reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych Plugin OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje tokeny metabas, takie jak `last-stable-4` lub `all-since-2026.4.23`, a Pełna walidacja wydania rozszerza bramkę pakietu release-soak do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Test dymny kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje ukryte utrwalanie transkryptu kontekstu runtime oraz naprawę doctor dla dotkniętych zduplikowanych gałęzi przepisywania promptu.
- Test dymny globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca wbudowanych dostawców obrazów zamiast zawieszać się. Użyj ponownie wcześniej zbudowanego archiwum tarball przez `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń budowanie na hoście przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test dymny instalatora w Dockerze: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, aktualizacji i bezpośredniego npm. Test dymny aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do kandydującego archiwum tarball. Nadpisz lokalnie przez `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo przez wejście `update_baseline_version` workflow Install Smoke na GitHubie. Kontrole instalatora bez roota utrzymują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do roota nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Test dymny CLI usuwania agentów ze współdzielonego workspace: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + zdrowie): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Test dymny zrzutu przeglądarki CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E plus warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że zrzuty ról CDP obejmują adresy URL linków, klikalne elementy wypromowane przez kursor, referencje iframe oraz metadane ramek.
- Regresja minimalnego rozumowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowe szczegóły pojawiają się w logach Gateway.
- Most kanałów MCP (zasiany Gateway + most stdio + surowy test dymny ramki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer MCP stdio + test dymny allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagenta (rzeczywisty Gateway + teardown procesu potomnego MCP stdio po izolowanym Cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test dymny instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, pełnego zestawu ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime pełnego zestawu przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fikstur ClawHub.
- Test dymny niezmienionej aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test dymny macierzy cyklu życia Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowane archiwum tarball OpenClaw w pustym kontenerze, instaluje Plugin npm, przełącza włączenie/wyłączenie, aktualizuje i obniża jego wersję przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa przestarzały stan, logując metryki RSS/CPU dla każdej fazy cyklu życia.
- Test dymny metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` obejmuje test dymny instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji dla zainstalowanych plugins. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje śledzone zasobowo instalowanie, włączanie, wyłączanie, aktualizację, obniżanie wersji i odinstalowanie przy brakującym kodzie Plugin npm.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazu specyficzne dla zestawu testów, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny obraz współdzielony, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Uruchamiacze Docker dla modeli live także montują bieżący checkout w trybie tylko do odczytu i
przenoszą go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje lekki, a Vitest nadal działa na dokładnie Twoich lokalnych źródłach/konfiguracji.
Krok przenoszenia pomija duże lokalne pamięci podręczne i wyniki buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
katalogi wyników Gradle, dzięki czemu uruchomienia live w Dockerze nie spędzają minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają także `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live gateway nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj również
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie live gateway
z tej ścieżki Docker.
`test:docker:openwebui` to smoke test kompatybilności wyższego poziomu: uruchamia
kontener Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI podłączony do tego gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć dokończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach zdockeryzowanych.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener Gateway,
uruchamia drugi kontener, który tworzy `openclaw mcp serve`, a następnie
weryfikuje odkrywanie trasowanych konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, trasowanie wysyłki wychodzącej oraz powiadomienia kanałowe +
uprawnieniowe w stylu Claude przez prawdziwy most MCP stdio. Kontrola powiadomień
bezpośrednio sprawdza surowe ramki MCP stdio, więc smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu live.
Buduje obraz Docker repozytorium, uruchamia prawdziwy serwer sondy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime MCP pakietu Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` oraz `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia zasiany Gateway z prawdziwym serwerem sondy MCP stdio, wykonuje
izolowaną turę cron oraz jednorazową turę potomną `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy się po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (poza CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla workflow regresji/debugowania. Może być ponownie potrzebny do walidacji trasowania wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i ładowane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby weryfikować tylko zmienne środowiskowe załadowane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów config/workspace i bez zewnętrznych montowań uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelniania CLI pod `$HOME` są montowane w trybie tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listy rozdzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profilu (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt kontroli nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz także kontroli nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego pipeline'u” bez prawdziwych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "uruchamia mockowe wywołanie narzędzia OpenAI end-to-end przez pętlę agenta gateway")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymusza uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: "uruchamia kreator przez ws i zapisuje konfigurację tokena auth")

## Ewaluacje niezawodności agenta (skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowe wywoływanie narzędzi przez prawdziwy gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują połączenie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla skills (zobacz [Skills](/pl/tools/skills)):

- **Decydowanie:** gdy skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe, które asercjami sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowych dostawców do asercji wywołań narzędzi + kolejności, odczytów plików skill i połączenia sesji.
- Mały zestaw scenariuszy skupionych na skillach (użycie vs unikanie, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane zmiennymi środowiskowymi) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt Plugin i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany Plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich odkrytych pluginach i uruchamiają zestaw
asercji kształtu oraz zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
pomija te współdzielone pliki smoke i pliki wspólnych interfejsów; uruchamiaj komendy kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanału lub dostawcy.

### Komendy

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Zlokalizowane w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt Plugin (id, nazwa, capabilities)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie powiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy kontaktów
- **group-policy** - Egzekwowanie polityki grup

### Kontrakty statusu dostawcy

Zlokalizowane w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru Plugin

### Kontrakty dostawcy

Zlokalizowane w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu uwierzytelniania
- **auth-choice** - Wybór/selekcja uwierzytelniania
- **catalog** - API katalogu modeli
- **discovery** - Odkrywanie Plugin
- **loader** - Ładowanie Plugin
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs Plugin
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub modyfikacji Plugin kanału albo dostawcy
- Po refaktoryzacji rejestracji lub odkrywania Plugin

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu odkryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest to z natury tylko live (limity szybkości, polityki auth), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która łapie błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd pipeline'u sesji/historii/narzędzi gateway → smoke test live gateway albo bezpieczny dla CI mock test gateway
- Bariera ochronna przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza po jednym próbkowanym celu dla każdej klasy SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asercją sprawdza, że identyfikatory exec z segmentami przejścia są odrzucane.
  - Jeśli dodajesz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo zawodzi na niesklasyfikowanych identyfikatorach celów, aby nowe klasy nie mogły zostać cicho pominięte.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
