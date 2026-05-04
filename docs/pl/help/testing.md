---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway i agenta
summary: 'Zestaw testowy: zestawy testów jednostkowych/e2e/live, runnery Docker i co obejmuje każdy test'
title: Testowanie
x-i18n:
    generated_at: "2026-05-04T07:04:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy Vitest (jednostkowe/integracyjne, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają poświadczenia i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, tory transportu live)** jest udokumentowany osobno:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) — dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny plugin transportu używany przez scenariusze oparte na repozytorium.

Ta strona obejmuje uruchamianie zwykłych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużą ilością zasobów: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia zawężone.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Tor QA oparty na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz większej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche wskazanie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności runtime: uruchom `OpenClaw Performance` z
  `live_gpt54=true` dla rzeczywistej tury agenta `openai/gpt-5.4` albo
  `deep_profile=true` dla artefaktów CPU/sterty/śledzenia Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty torów mock-provider, deep-profile i GPT 5.4 do
  `openclaw/clawgrit-reports`, gdy skonfigurowany jest `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider obejmuje też liczby dotyczące uruchamiania Gateway na poziomie źródeł, pamięci,
  obciążenia pluginami, powtarzanej pętli hello-loop fałszywego modelu oraz startu CLI.
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też małą turę obrazu.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` albo
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują wielokrotnego użytku workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live Docker
    shardingowane według dostawcy.
  - Dla zawężonych ponownych uruchomień CI uruchom `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe sekrety dostawców o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań zaplanowanych/release.
- Smoke natywnego czatu powiązanego Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia tor live Docker względem ścieżki app-server Codex, wiąże syntetyczny
    DM Slack za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne powiązanie pluginu zamiast ACP.
- Smoke harnessa app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należący do pluginu harness app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    cron MCP, sub-agenta i Guardian. Wyłącz sondę sub-agenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla zawężonego sprawdzenia sub-agenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Kończy działanie po sondzie sub-agenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne sprawdzenie z dodatkowym zabezpieczeniem dla powierzchni polecenia ratunkowego
    kanału wiadomości. Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że przybliżony fallback planera przekłada się na audytowany, typowany
    zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, kieruje samo `openclaw` do
    Crestodian, stosuje zapisy konfiguracji setup/model/agent/plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    też objęta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztów Moonshot/Kimi: z ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypt asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. Parity agentowe jest zagnieżdżone pod
`QA-Lab - All Lanes` i walidacją release, a nie jako osobny workflow PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA release-checks. `QA-Lab - All Lanes`
uruchamia się nocą na `main` oraz z ręcznego wywołania z torem mock parity, torem live
Matrix, zarządzanym przez Convex torem live Telegram oraz zarządzanym przez Convex torem live Discord
jako równoległe zadania. Zaplanowane QA i sprawdzenia release przekazują Matrix
`--profile fast` jawnie, podczas gdy domyślne wartości wejścia Matrix CLI i ręcznego workflow
pozostają `all`; ręczne wywołanie może podzielić `all` na zadania `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parity oraz szybkie tory Matrix i Telegram przed zatwierdzeniem release,
używając `mock-openai/gpt-5.5` do sprawdzeń transportu release, aby pozostały
deterministyczne i unikały normalnego startu provider-plugin. Te Gateway transportu live
wyłączają wyszukiwanie pamięci; zachowanie pamięci pozostaje objęte przez zestawy QA parity.

Shardy live media pełnego release używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live Docker używają współdzielonego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commitu, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
w każdym shardzie.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle, z izolowanymi
    pracownikami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    pracowników, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu zakończenia.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixtur i atrap protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet scenariuszy QA Lab z atrapami
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie oznacza tylko utrzymujące się obserwacje gorącego CPU (`--cpu-core-warn`
    oraz `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki
    bez wyglądania jak regresja wielominutowego obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, jeśli checkout nie ma
    jeszcze świeżych wyników środowiska uruchomieniowego.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej maszyny VM Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA praktyczne dla gościa:
    klucze dostawców z env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany obszar roboczy.
  - Zapisuje normalny raport QA i podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia witrynę QA opartą na Dockerze do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje paczkę tarball npm z bieżącego checkoutu, instaluje ją globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowane środowisko uruchomieniowe Plugin ładuje się bez naprawy zależności
    podczas startu, uruchamia doctor i wykonuje jedną lokalną turę agenta wobec
    atrapionego punktu końcowego OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji spakowanej
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke test zbudowanej aplikacji w Dockerze dla osadzonych transkryptów kontekstu środowiska uruchomieniowego.
    Weryfikuje, że ukryty kontekst środowiska uruchomieniowego OpenClaw jest utrwalany jako
    niestandardowa wiadomość niewyświetlana, zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydata paczki OpenClaw w Dockerze, uruchamia onboarding zainstalowanej paczki,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    ścieżki QA Telegram live z tą zainstalowaną paczką jako Gateway SUT.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` albo
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby zamiast instalacji z rejestru przetestować
    rozwiązany lokalny tarball.
  - Używa tych samych poświadczeń env Telegram lub źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker automatycznie wybiera Convex.
  - Wrapper waliduje env poświadczeń Telegram lub Convex na hoście przed
    pracą build/install Dockera. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko podczas celowego debugowania konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainerów
    `NPM Telegram Beta E2E`. Nie uruchamia się przy scaleniu. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia również `Package Acceptance` dla bocznego dowodu produktowego
  wobec jednej paczki kandydującej. Akceptuje zaufany ref, opublikowaną specyfikację npm,
  adres URL tarballa HTTPS wraz z SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący harmonogram Docker E2E z profilami ścieżek smoke, package, product, full albo custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić workflow QA Telegram
  wobec tego samego artefaktu `package-under-test`.
  - Najnowszy dowód produktowy beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Dowód z dokładnego adresu URL tarballa wymaga skrótu:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Dowód z artefaktu pobiera artefakt tarballa z innego uruchomienia Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pakuje i instaluje bieżący build OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez edycje
    konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieobecne nieskonfigurowane pluginy do pobrania,
    pierwsza skonfigurowana naprawa doctor jawnie instaluje każdy brakujący plugin do pobrania,
    a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po aktualizacji
    czyści pozostałości zależności starszych pluginów bez naprawy postinstall po stronie
    harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke test aktualizacji instalacji spakowanej na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądaną paczkę bazową, a następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną
    turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json` dla ścieżki artefaktu podsumowania i
    statusu każdej ścieżki.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` dla dowodu live tury agenta.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owiń długie lokalne uruchomienia limitem czasu hosta, aby zacięcia transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`
    przed założeniem, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut w doctor po aktualizacji i pracy
    aktualizacji paczek na zimnym gościu; to nadal zdrowy stan, gdy zagnieżdżony log debug npm
    posuwa się naprzód.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi ścieżkami smoke Parallels
    macOS, Windows albo Linux. Współdzielą stan VM i mogą kolidować podczas
    przywracania snapshotu, serwowania paczek albo stanu Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonych pluginów, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API środowiska uruchomieniowego nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich smoke testów
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę QA Matrix live wobec jednorazowego serwera domowego Tuwunel opartego na Dockerze. Tylko checkout źródeł — instalacje spakowane nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [QA Matrix](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę QA Telegram live wobec prawdziwej prywatnej grupy, używając tokenów bota sterownika i bota SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu zakończenia.
  - Wymaga dwóch odrębnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-do-bota włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt zaobserwowanych wiadomości w `.artifacts/qa-e2e/...`. Scenariusze odpowiadania obejmują RTT od żądania wysłania przez sterownik do zaobserwowanej odpowiedzi SUT.

Ścieżki transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie dryfowały; macierz pokrycia dla poszczególnych ścieżek znajduje się w [przeglądzie QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` jest szerokim zestawem syntetycznym i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (albo `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab pobiera wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
dla tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na adresy URL Convex `http://` przez loopback tylko do lokalnego rozwoju.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` w normalnym działaniu.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić URL witryny Convex, sekrety brokera,
prefiks punktu końcowego, limit czasu HTTP oraz dostępność admin/list bez drukowania
wartości sekretów. Użyj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt punktu końcowego (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/ponawialne: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukces: `{ status: "ok" }` (lub puste `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukces: `{ status: "ok" }` (lub puste `2xx`)
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

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym ciągiem identyfikatora czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowo sformatowane payloady.

### Dodawanie kanału do QA

Architektura i nazwy helperów scenariuszy dla nowych adapterów kanałów znajdują się w [omówieniu QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym seamie hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Traktuj zestawy jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Jednostkowe / integracyjne (domyślnie)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia bez celu używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wielu projektów do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI uruchamiają się w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, trasowanie, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallback dla `api.js` i
    `runtime-api.js` przy użyciu generowanych małych fikstur Plugin, a nie
    prawdziwych źródłowych API dołączonych Pluginów. Prawdziwe ładowania API Plugin należą do
    należących do Plugin zestawów kontraktowych/integracyjnych.

<AccordionGroup>
  <Accordion title="Projekty, shardy i zakresowane ścieżki">

    - `pnpm test` bez celu uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowy RSS na obciążonych maszynach i zapobiega wygładzaniu pracy auto-reply/rozszerzeń kosztem niepowiązanych zestawów.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` kierują jawne cele plików/katalogów najpierw przez zakresowane ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika pełnego kosztu startu projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git do tanich zakresowanych ścieżek: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności grafu importów. Edycje konfiguracji/setupu/pakietu nie uruchamiają szerokich testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzająca dla wąskiej pracy. Klasyfikuje diff do core, testów core, rozszerzeń, testów rozszerzeń, aplikacji, dokumentacji, metadanych wydania, live narzędzi Docker i narzędzi, a następnie uruchamia pasujące polecenia typecheck, lint i strażników. Nie uruchamia testów Vitest; wywołaj `pnpm test:changed` lub jawne `pnpm test <target>` jako dowód testowy. Podbicia wersji wyłącznie w metadanych wydania uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności root, ze strażnikiem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje live uprzęży Docker ACP uruchamiają skupione sprawdzenia: składnię powłoki dla live skryptów uwierzytelniania Docker oraz przebieg próbny planisty live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zależności, eksporty, wersje i inne edycje powierzchni pakietu nadal używają szerszych strażników.
    - Lekkie importowo testy jednostkowe z agentów, poleceń, pluginów, helperów auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych trafiają przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia w trybie changed na jawne sąsiednie testy w tych lekkich ścieżkach, więc edycje helperów unikają ponownego uruchamiania całego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane kubełki dla helperów core najwyższego poziomu, testów integracyjnych `reply.*` najwyższego poziomu oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch i commands/state-routing, aby jeden kubełek ciężki importowo nie obejmował całego ogona Node.
    - Normalne CI PR/main celowo pomija wsadowe przemiatanie rozszerzeń i shard `agentic-plugins` tylko dla wydań. Pełna walidacja wydania dispatchuje osobny potomny workflow `Plugin Prerelease` dla tych zestawów ciężkich pod względem pluginów/rozszerzeń na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie osadzonego runnera">

    - Gdy zmieniasz wejścia odkrywania narzędzia wiadomości lub runtime kontekstu Compaction,
      utrzymuj oba poziomy pokrycia.
    - Dodawaj skupione regresje helperów dla czystych granic trasowania i normalizacji.
    - Utrzymuj w dobrej kondycji zestawy integracyjne osadzonego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że zakresowane identyfikatory i zachowanie Compaction nadal przepływają
      przez prawdziwe ścieżki `run.ts` / `compact.ts`; testy wyłącznie helperów
      nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli i izolacji Vitest">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach root, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swój setup i optymalizator `jsdom`, ale również działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla potomnych procesów Node
      Vitest, aby ograniczyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym
      zachowaniem V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala diff.
    - Hook pre-commit dotyczy wyłącznie formatowania. Ponownie stage’uje sformatowane pliki i
      nie uruchamia lintu, typecheck ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub push, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowane ścieżki. Użyj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      zdecyduje, że edycja uprzęży, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie trasowania,
      tylko z wyższym limitem workerów.
    - Automatyczne skalowanie lokalnych workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych
      uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostawały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      dane wyjściowe rozbicia importów.
    - `pnpm test:perf:imports:changed` zakresuje ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI
      z wzorcem include dopisują nazwę shardu, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu w importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym seamem `*.runtime.ts` i
      mockuj ten seam bezpośrednio zamiast głęboko importować helpery runtime tylko
      po to, aby przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje trasowane
      `test:changed` z natywną ścieżką projektu root dla tego zatwierdzonego
      diffa i drukuje czas ścienny oraz maksymalny RSS na macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje aktualne
      brudne drzewo, trasując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu jednostkowego z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (Gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszona na jednego workera
- Zakres:
  - Uruchamia prawdziwy Gateway loopback z diagnostyką domyślnie włączoną
  - Przepuszcza syntetyczny churn wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje helpery utrwalania pakietu stabilności diagnostycznej
  - Asercje sprawdzają, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek per sesja wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka do dalszej pracy nad regresjami stabilności, a nie zamiennik pełnego zestawu Gateway

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych pluginów w `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnej liczby workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut konsolowego I/O.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end Gateway w wielu instancjach
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższa obsługa sieci
- Oczekiwania:
  - Działa w CI (gdy jest włączone w potoku)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż w testach jednostkowych (może być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany Gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Sprawdza backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zdalnie kanoniczne zachowanie systemu plików przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy Gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego pakietu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niedomyślny binarny plik CLI lub skrypt opakowujący

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wykrywanie zmian formatu dostawców, osobliwości wywoływania narzędzi, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / używa limitów szybkości
  - Lepiej uruchamiać zawężone podzbiory zamiast „wszystkiego”
- Uruchomienia live źródłują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracyjne/uwierzytelniające do tymczasowego testowego katalogu domowego, aby fixture’y jednostkowe nie mogły zmodyfikować prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie używa teraz cichszego trybu: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi startowe Gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz odzyskać pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie dla live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach z limitem szybkości.
- Wyjście postępu/Heartbeat:
  - Pakiety live emitują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, aby linie postępu dostawcy/Gateway były strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj Heartbeat modeli bezpośrednich za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj Heartbeat Gateway/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Informacje o macierzy modeli live, smoke’ach backendu CLI, smoke’ach ACP, harnessie serwera aplikacji Codex oraz wszystkich testach live dostawców multimediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, harness multimediów) — plus obsługa poświadczeń dla uruchomień live — znajdziesz w
[Testowanie pakietów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i walidacji pluginów znajdziesz w
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne kontrole „działa w Linux”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live kluczy profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i workspace (oraz źródłując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  celowo chcesz większego, wyczerpującego skanowania.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz bare jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności pluginów; te ścieżki montują wcześniej zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` steruje slotami procesów, a limity zasobów zapobiegają jednoczesnemu startowi wszystkich ciężkich ścieżek live, npm-install i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram może ją nadal uruchomić, gdy pula jest pusta, a następnie utrzymuje ją jako jedyną uruchomioną, dopóki pojemność znów nie będzie dostępna. Wartości domyślne to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, drukuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w kolejnych uruchomieniach startować dłuższe ścieżki jako pierwsze. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować ważony manifest ścieżek bez budowania ani uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wydrukować plan CI dla wybranych ścieżek, potrzeb pakietów/obrazów i poświadczeń.
- `Package Acceptance` to natywna dla GitHub bramka pakietu dla pytania „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` albo `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według szerokości: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/pluginów, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydań i triage awarii.
- Kontrole budowania i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` i kończy się błędem, jeśli start przed dispatch importuje zależności pakietów, takie jak Commander, UI promptów, undici albo logowanie przed dispatch polecenia; utrzymuje także dołączony chunk uruchomienia Gateway poniżej budżetu i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Smoke spakowanego CLI obejmuje również pomoc główną, pomoc onboard, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (w tym `2026.4.25-beta.*`). Do tego progu harness toleruje wyłącznie luki metadanych wysłanego pakietu: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brak plików patchy w fixture git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji pluginów, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi awariami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live montują także tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test powiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA dla checkoutu źródeł. Celowo nie jest częścią ścieżek wydania Docker pakietu, ponieważ tarball npm pomija QA Lab.
- Smoke test live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne tworzenie szkieletu): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding z odwołaniami do zmiennych środowiskowych oraz domyślnie Telegram, uruchamia doctor i wykonuje jedną mockowaną turę agenta OpenAI. Użyj ponownie wcześniej zbudowanego tarballa z `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta za pomocą `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo zmień kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test przełączenia kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Dockerze, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie plugin po aktualizacji, a następnie przełącza z powrotem na pakiet `stable` i sprawdza stan aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na zabrudzonej fiksturze starego użytkownika z agentami, konfiguracją kanałów, listami dozwolonych pluginów, przestarzałym stanem zależności pluginów oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy dostawcy live ani kanału, potem startuje Gateway przez local loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchamiania/statusu.
- Smoke test przetrwania aktualizacji opublikowanej wersji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę za pomocą wbudowanej receptury poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do tarballa kandydata, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, a następnie startuje Gateway przez local loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchomienie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś agregujący harmonogram o rozwinięcie dokładnych baz przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `all-since-2026.4.23`, oraz rozwiń fikstury w kształcie zgłoszeń przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takie jak `reported-issues`; zestaw reported-issues zawiera `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych pluginów OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`.
- Smoke test kontekstu środowiska wykonawczego sesji: `pnpm test:docker:session-runtime-context` weryfikuje ukrytą trwałość transkryptu kontekstu środowiska wykonawczego oraz naprawę doctor dla dotkniętych zduplikowanych gałęzi przepisywania promptu.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast się zawieszać. Użyj ponownie wcześniej zbudowanego tarballa z `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, aktualizacji i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do tarballa kandydata. Nadpisz lokalnie przez `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo przez wejście `update_baseline_version` workflow Install Smoke na GitHubie. Testy instalatora bez roota zachowują izolowaną pamięć podręczną npm, aby wpisy cache należące do roota nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać cache root/update/direct-npm między lokalnymi powtórzeniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshotu CDP przeglądarki: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje obraz źródłowy E2E oraz warstwę Chromium, uruchamia Chromium z surowym CDP, wykonuje `browser doctor --deep` i weryfikuje, że snapshoty ról CDP obejmują URL-e linków, klikalne elementy promowane kursorem, odwołania iframe oraz metadane ramek.
- Regresja minimalnego reasoning dla OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowe szczegóły pojawiają się w logach Gateway.
- Most kanału MCP (zasilony Gateway + most stdio + surowy smoke test ramki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer MCP stdio + smoke test allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie Cron/subagenta MCP (rzeczywisty Gateway + rozmontowanie procesu potomnego MCP stdio po izolowanym cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, pełnego zestawu ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/środowisko wykonawcze kitchen-sink przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fikstur ClawHub.
- Smoke test aktualizacji Plugin bez zmian: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test macierzy cyklu życia Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowany tarball OpenClaw w pustym kontenerze, instaluje plugin npm, przełącza włączenie/wyłączenie, aktualizuje go i cofa wersję przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa przestarzały stan, logując metryki RSS/CPU dla każdej fazy cyklu życia.
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie aktualizacji bez zmian dla zainstalowanych pluginów. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje śledzone zasobowo instalowanie, włączanie, wyłączanie, aktualizowanie, cofanie wersji i odinstalowanie brakującego kodu pluginu npm.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów właściwe dla pakietu testów, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy Docker dla QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielone środowisko wykonawcze zbudowanej aplikacji.

Runnery Dockera z modelami live montują także bieżący checkout tylko do odczytu i
przenoszą go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje lekki, a Vitest nadal działa na dokładnym lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże lokalne pamięci podręczne i wyjścia buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
katalogi wyjściowe Gradle, aby uruchomienia live w Dockerze nie traciły minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają także `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Dockera.
`test:docker:openwebui` to smoke test zgodności wyższego poziomu: uruchamia kontener
Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować zakończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest głównym sposobem jego dostarczenia w uruchomieniach zdockeryzowanych.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasilony danymi kontener Gateway,
uruchamia drugi kontener, który spawnuje `openclaw mcp serve`, a następnie
weryfikuje odkrywanie routowanych konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia kanałowe i uprawnień w stylu Claude
przez rzeczywisty most stdio MCP. Sprawdzenie powiadomień
bezpośrednio inspektuje surowe ramki stdio MCP, więc smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu live.
Buduje obraz Docker repozytorium, uruchamia rzeczywisty serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime MCP pakietu Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia zasilony danymi Gateway z rzeczywistym serwerem sondy stdio MCP, wykonuje
izolowaną turę cron i jednorazową turę potomną `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy działanie po każdym uruchomieniu.

Manualny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla workflow regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i wczytywane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów config/workspace i bez zewnętrznych montowań auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache'owanych instalacji CLI w Dockerze
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listę rozdzielaną przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że dane uwierzytelniające pochodzą z magazynu profilu (nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Sanityzacja dokumentacji

Uruchom sprawdzenia dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz także sprawdzeń nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „rzeczywistego pipeline'u” bez prawdziwych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, rzeczywisty Gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymusza auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agentów (skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agentów”:

- Mock wywoływania narzędzi przez rzeczywisty Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwą skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do sprawdzania wywołań narzędzi + kolejności, odczytów plików skill i okablowania sesji.
- Mały zestaw scenariuszy skoncentrowanych na skillach (użyj vs unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt plugina i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał spełnia swój
kontrakt interfejsu. Iterują po wszystkich odkrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka unit `pnpm test` celowo
pomija te wspólne pliki smoke i seam; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz wspólnych powierzchni kanałów lub dostawców.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Zlokalizowane w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt plugina (id, nazwa, capabilities)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy członków
- **group-policy** - Egzekwowanie polityki grupowej

### Kontrakty statusu dostawców

Zlokalizowane w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru pluginów

### Kontrakty dostawców

Zlokalizowane w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Odkrywanie pluginów
- **loader** - Ładowanie pluginów
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs plugina
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu albo zmodyfikowaniu kanału lub plugina dostawcy
- Po refaktoryzacji rejestracji lub odkrywania pluginów

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem z dostawcą/modelem odkryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest z natury tylko live (limity szybkości, polityki auth), utrzymaj test live wąski i opt-in przez zmienne env
- Preferuj celowanie w najmniejszą warstwę, która wykrywa błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd pipeline'u sesji/historii/narzędzi Gateway → smoke live Gateway albo bezpieczny dla CI mock test Gateway
- Guardrail traversowania SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że exec ids z segmentami traversowania są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem na niesklasyfikowanych identyfikatorach celów, aby nowe klasy nie mogły zostać po cichu pominięte.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
