---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: zestawy testów jednostkowych/e2e/na żywo, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-05-02T20:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (unit/integration, e2e, live) i niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, podczas debugowania).
- Jak testy live wykrywają poświadczenia i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, live transport lanes)** jest udokumentowany osobno:

- [Przegląd QA](/pl/concepts/qa-e2e-automation) — architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [QA Matrix](/pl/concepts/qa-matrix) — dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny Plugin transportowy używany przez scenariusze oparte na repozytorium.

Ta strona omawia uruchamianie standardowych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większości dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużymi zasobami: `pnpm test:max`
- Bezpośrednia pętla obserwowania Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Podczas iterowania nad pojedynczą awarią najpierw preferuj uruchomienia celowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Pas QA oparty na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów lub chcesz uzyskać dodatkową pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności środowiska uruchomieniowego: wyślij `OpenClaw Performance` z
  `live_gpt54=true` dla rzeczywistej tury agenta `openai/gpt-5.4` albo
  `deep_profile=true` dla artefaktów CPU/heap/trace Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty pasów mock-provider, deep-profile i GPT 5.4 do
  `openclaw/clawgrit-reports`, gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider obejmuje także liczby na poziomie źródeł dotyczące startu Gateway, pamięci,
  obciążenia pluginami, powtarzanej pętli hello-loop fałszywego modelu oraz startu CLI.
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają także małą turę obrazową.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują współużywany workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live Docker
    podzielone według dostawcy.
  - Do skoncentrowanych ponownych uruchomień CI wyślij `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodawaj nowe sekrety dostawców o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań zaplanowanych/release.
- Smoke test natywnego czatu bound-chat Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia pas live Docker względem ścieżki app-server Codex, wiąże syntetyczny
    Slack DM za pomocą `/codex bind`, ćwiczy `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne wiązanie Plugin zamiast ACP.
- Smoke test uprzęży app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należącą do Plugin uprząż app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie ćwiczy sondy obrazu,
    cron MCP, subagenta i Guardian. Wyłącz sondę subagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Aby wykonać skoncentrowaną kontrolę subagenta, wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie subagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke test polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalna kontrola z dodatkowym zabezpieczeniem dla powierzchni polecenia ratunkowego message-channel.
    Ćwiczy `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke test planisty Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback planisty przekłada się na audytowany typowany
    zapis konfiguracji.
- Smoke test pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, kieruje samo `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Discord plugin + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke test kosztów Moonshot/Kimi: z ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live za pomocą opisanych poniżej zmiennych środowiskowych allowlist.
</Tip>

## Runnery specyficzne dla QA

Te polecenia działają obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. Równoważność agentowa jest zagnieżdżona pod
`QA-Lab - All Lanes` i walidacją release, a nie w samodzielnym workflow PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA release-checks. `QA-Lab - All Lanes`
uruchamia się co noc na `main` oraz z ręcznego dispatch z pasem mock parity, pasem live
Matrix, zarządzanym przez Convex pasem live Telegram i zarządzanym przez Convex pasem live Discord
jako zadaniami równoległymi. Zaplanowane QA i kontrole release przekazują Matrix
`--profile fast` jawnie, natomiast CLI Matrix i domyślna wartość ręcznego wejścia workflow
pozostają `all`; ręczny dispatch może podzielić `all` na zadania `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia równoważność oraz szybkie pasy Matrix i Telegram przed zatwierdzeniem
release, używając `mock-openai/gpt-5.5` do kontroli transportu release, aby pozostały
deterministyczne i uniknęły normalnego startu provider-plugin. Te bramy transportu live
wyłączają wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez zestawy
QA parity.

Pełne shardy live media release używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live Docker używają współużywanego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commitu, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
wewnątrz każdego sharda.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    liczbą wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić
    liczbę workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy działanie z kodem niezerowym, gdy jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock na potrzeby eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet scenariuszy mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie oznacza tylko utrzymujące się obserwacje gorącego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki przy starcie są rejestrowane jako metryki
    bez wyglądania jak trwająca wiele minut regresja obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma
    jeszcze świeżego wyjścia runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA w jednorazowej maszynie wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Używa ponownie tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla gościa:
    klucze dostawców z env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod rootem repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje standardowy raport QA i podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Docker stronę QA do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime pluginu ładuje się bez naprawy zależności
    przy starcie, uruchamia doctor i wykonuje jedną lokalną turę agenta względem
    mockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę packaged-install
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny Docker smoke zbudowanej aplikacji dla transkryptów osadzonego kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydujący pakiet OpenClaw w Docker, uruchamia onboarding
    zainstalowanego pakietu, konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    ścieżki QA live Telegram z tym zainstalowanym pakietem jako SUT Gateway.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` lub
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby zamiast instalowania z rejestru przetestować
    rozstrzygnięty lokalny tarball.
  - Używa tych samych poświadczeń env Telegram lub źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/release ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker automatycznie wybiera Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainerów
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia też `Package Acceptance` dla bocznego dowodu produktu
  względem jednego pakietu kandydującego. Akceptuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full lub custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić workflow QA
  Telegram względem tego samego artefaktu `package-under-test`.
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
  - Pakuje i instaluje bieżący build OpenClaw w Docker, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez edycje
    konfiguracji.
  - Weryfikuje, że odkrywanie setup pozostawia nieskonfigurowane pobieralne pluginy nieobecne,
    pierwsza skonfigurowana naprawa doctor jawnie instaluje każdy brakujący pobieralny
    plugin, a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje także znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że post-update doctor kandydata
    czyści pozostałości po legacy zależnościach pluginów bez
    naprawy postinstall po stronie harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji packaged-install na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną
    turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json` dla ścieżki artefaktu podsumowania i
    statusu poszczególnych ścieżek.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` dla dowodu live agent-turn.
    Przekaż `--model <provider/model>` lub ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owijaj długie lokalne uruchomienia host timeoutem, aby zacięcia transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`,
    zanim założysz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut w post-update doctor i pracy
    aktualizacji pakietów na zimnym gościu; to nadal jest zdrowe, gdy zagnieżdżony log debug
    npm się przesuwa.
  - Nie uruchamiaj tego zagregowanego wrappera równolegle z pojedynczymi ścieżkami smoke
    Parallels macOS, Windows albo Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietu albo stanie Gateway gościa.
  - Dowód post-update uruchamia normalną powierzchnię dołączonych pluginów, ponieważ
    fasady capability, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API runtime, nawet gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośredniego testowania smoke
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę QA live Matrix względem jednorazowego homeservera Tuwunel opartego na Docker. Tylko source-checkout — instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [Matrix QA](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę QA live Telegram względem prawdziwej prywatnej grupy, używając tokenów bota drivera i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Kończy działanie z kodem niezerowym, gdy jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-bot włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot drivera może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages w `.artifacts/qa-e2e/...`. Scenariusze odpowiadania obejmują RTT od żądania wysłania drivera do zaobserwowanej odpowiedzi SUT.

Ścieżki transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie dryfowały; macierz pokrycia poszczególnych ścieżek znajduje się w [Przegląd QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` jest szerokim syntetycznym zestawem i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (albo `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab pozyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu.

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex `http://` przez loopback tylko do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno używać `https://` w normalnym działaniu.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicy CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić URL strony Convex, sekrety brokera,
prefiks endpointu, timeout HTTP i osiągalność admin/list bez drukowania
wartości sekretów. Użyj `--json` dla czytelnego maszynowo wyjścia w skryptach i narzędziach
CI.

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

Kształt ładunku dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym identyfikatorem czatu Telegram zapisanym jako ciąg znaków.
- `admin/add` sprawdza ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe ładunki.

### Dodawanie kanału do QA

Architektura i nazwy pomocników scenariuszy dla nowych adapterów kanałów znajdują się w [omówieniu QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny wymagany poziom: zaimplementuj runner transportu na współdzielonym styku hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście pluginu, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Traktuj zestawy jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia bez wskazania celu używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji poszczególnych projektów na potrzeby równoległego planowania
- Pliki: inwentarze core/jednostkowe w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI uruchamiają się w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania awaryjnego `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych małych fikstur pluginów, a nie
    prawdziwych interfejsów API źródła dołączonych pluginów. Prawdziwe ładowania API pluginów należą do
    należących do pluginów zestawów kontraktowych/integracyjnych.

<AccordionGroup>
  <Accordion title="Projekty, shardy i zakresowe ścieżki">

    - `pnpm test` bez wskazania celu uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe zużycie RSS na obciążonych maszynach i zapobiega zagładzaniu niepowiązanych zestawów przez prace auto-reply/extension.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ pętla obserwacji z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika kosztu startu pełnego projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git do tanich ścieżek zakresowych: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności z grafu importów. Edycje konfiguracji/ustawień/pakietów nie uruchamiają szerokich testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` jest normalną inteligentną lokalną bramką sprawdzającą dla wąskich prac. Klasyfikuje różnicę na core, testy core, extensions, testy extension, aplikacje, dokumentację, metadane wydań, narzędzia live Docker i narzędzia, a następnie uruchamia odpowiadające polecenia sprawdzania typów, lint i strażników. Nie uruchamia testów Vitest; użyj `pnpm test:changed` lub jawnego `pnpm test <target>` jako dowodu testowego. Zmiany wersji obejmujące tylko metadane wydań uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych, ze strażnikiem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje live Docker ACP harness uruchamiają skoncentrowane kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker oraz suchy przebieg harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy różnica ogranicza się do `scripts["test:docker:live-*"]`; edycje zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych strażników.
    - Lekkie importowo testy jednostkowe z obszarów agentów, poleceń, pluginów, pomocników auto-reply, `plugin-sdk` i podobnych czystych narzędzi przechodzą przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie środowiskowo pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` mapują też uruchomienia w trybie zmian na jawne sąsiednie testy w tych lekkich ścieżkach, więc edycje pomocników unikają ponownego uruchamiania całego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla pomocników core najwyższego poziomu, testów integracyjnych najwyższego poziomu `reply.*` i poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch oraz commands/state-routing, żeby jeden koszyk ciężki importowo nie przejmował całego końca Node.
    - Zwykłe CI dla PR/main celowo pomija wsadowy przegląd extension i shard wyłącznie wydaniowy `agentic-plugins`. Pełna walidacja wydania uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych ciężkich pluginowo/extension zestawów na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie osadzonego runnera">

    - Gdy zmieniasz dane wejściowe wykrywania message-tool albo kontekst środowiskowy Compaction,
      utrzymaj oba poziomy pokrycia.
    - Dodaj skoncentrowane regresje pomocników dla czystych granic routingu i normalizacji.
    - Utrzymuj zestawy integracyjne osadzonego runnera w dobrym stanie:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy sprawdzają, że identyfikatory zakresowe i zachowanie Compaction nadal przepływają
      przez prawdziwe ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocników
      nie są wystarczającym zamiennikiem dla tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli i izolacji Vitest">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swoje ustawienia `jsdom` i optymalizator, ale także działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla podrzędnych procesów Node Vitest,
      aby ograniczyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym
      zachowaniem V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala różnica.
    - Hak pre-commit wykonuje tylko formatowanie. Ponownie stage’uje sformatowane pliki i
      nie uruchamia lint, sprawdzania typów ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub wypchnięciem, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie przechodzi przez tanie ścieżki zakresowe. Używaj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harness, konfiguracji, pakietu lub kontraktu rzeczywiście wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Automatyczne skalowanie lokalnych workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych
      uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracji jako
      `forceRerunTriggers`, aby ponowne uruchomienia w trybie zmian pozostały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jednej jawnej lokalizacji pamięci podręcznej do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      wynik rozbicia importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI z wzorcami uwzględniania
      dopisują nazwę shardu, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym stykiem `*.runtime.ts` i
      mockuj ten styk bezpośrednio, zamiast głęboko importować pomocniki runtime tylko
      po to, by przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
      `test:changed` z natywną ścieżką projektu głównego dla tej zatwierdzonej
      różnicy i wypisuje czas rzeczywisty oraz maksymalne RSS w macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, routując listę zmienionych plików przez
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
  - Uruchamia prawdziwy Gateway loopback z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny komunikat Gateway, pamięć i churn dużych ładunków przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki trwałego zapisu pakietu stabilności diagnostycznej
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek na sesję wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka dla dalszych prac nad regresjami stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (dymny test Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych pluginów w `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut wejścia/wyjścia konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Kompleksowe zachowanie wielu instancji Gateway
  - Powierzchnie WebSocket/HTTP, parowanie węzłów i cięższa sieć
- Oczekiwania:
  - Uruchamia się w CI (gdy jest włączone w potoku)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż w testach jednostkowych (może być wolniejsze)

### E2E: dymny test backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany OpenShell gateway na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego pliku Dockerfile
  - Testuje backend OpenClaw OpenShell przez rzeczywiste `sandbox ssh-config` + wykonywanie poleceń SSH
  - Weryfikuje zachowanie systemu plików w formie zdalnie kanonicznej przez mostek fs sandboxa
- Oczekiwania:
  - Tylko po włączeniu; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niedomyślny plik binarny CLI lub skrypt opakowujący

### Live (rzeczywi dostawcy + rzeczywiste modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Plugin w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model rzeczywiście działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wychwytuje zmiany formatu dostawców, osobliwości wywoływania narzędzi, problemy z uwierzytelnianiem i zachowanie limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (rzeczywiste sieci, rzeczywiste zasady dostawców, limity, awarie)
  - Kosztuje pieniądze / używa limitów szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live wczytują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał konfiguracyjny/uwierzytelniający do tymczasowego katalogu domowego testu, aby fixture’y jednostkowe nie mogły zmodyfikować Twojego rzeczywistego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego rzeczywistego katalogu domowego.
- `pnpm test:live` domyślnie używa teraz cichszego trybu: zachowuje wyjście postępu `[live] ...`, ale wycisza dodatkową informację o `~/.profile` oraz logi rozruchu gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie rozdzielanym przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie dla danego live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próbę po odpowiedziach limitu szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, aby linie postępu dostawcy/gateway były strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj Heartbeat modeli bezpośrednich przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj Heartbeat gateway/sond przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykanie sieci gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Macierz modeli live, smoke’y backendu CLI, smoke’y ACP, uprząż serwera aplikacji Codex
oraz wszystkie testy live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, uprząż mediów) — plus obsługę danych uwierzytelniających dla uruchomień live — opisano w
[Testowanie zestawów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i
walidacji Plugin opisano w
[Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne sprawdzenia „działa w Linux”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live klucza profilu wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując Twój lokalny katalog konfiguracji i workspace (oraz wczytując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie używa `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie używa `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  wyraźnie chcesz większego, wyczerpującego skanowania.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz podstawowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności Plugin; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramisty: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów powstrzymują ciężkie ścieżki live, npm-install i wielousługowe przed jednoczesnym startem. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogramista nadal może ją uruchomić, gdy pula jest pusta, a następnie utrzymuje ją jako jedyną uruchomioną do czasu ponownej dostępności pojemności. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` oraz `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostosuj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma więcej zapasu. Runner domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, drukuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w kolejnych uruchomieniach najpierw startować dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wydrukować ważony manifest ścieżek bez budowania lub uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wydrukować plan CI dla wybranych ścieżek, potrzeb pakietu/obrazu i danych uwierzytelniających.
- `Package Acceptance` to natywna bramka GitHub dla pakietu: „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według szerokości: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/Plugin, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydań i triage awarii.
- Sprawdzenia budowania i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi statyczny zbudowany graf od `dist/entry.js` i `dist/cli/run-main.js` i kończy niepowodzeniem, jeśli importy startowe przed wysłaniem polecenia importują zależności pakietu, takie jak Commander, interfejs promptów, undici lub logowanie przed wysłaniem polecenia; utrzymuje także dołączony fragment uruchomieniowy gateway w budżecie i odrzuca statyczne importy znanych zimnych ścieżek gateway. Smoke spakowanego CLI obejmuje też główną pomoc, pomoc onboardingu, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna `Package Acceptance` jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego punktu granicznego uprząż toleruje wyłącznie luki metadanych wysłanego pakietu: pominięte prywatne wpisy inwentarza QA, brakujące `gateway install --wrapper`, brakujące pliki łatek w fixture git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Plugin, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi błędami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` i `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live montują też tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test zaplecza CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA dla checkoutu źródłowego. Celowo nie jest częścią ścieżek wydania Docker dla pakietu, ponieważ tarball npm pomija QA Lab.
- Smoke test live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne szkieletowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding z odwołaniem do env oraz domyślnie Telegram, uruchamia doctor i wykonuje jeden zamockowany przebieg agenta OpenAI. Użyj ponownie wcześniej zbudowanego tarballa z `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta z `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo zmień kanał za pomocą `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Dockerze, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie Plugin po aktualizacji, następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na brudnym fixturze starego użytkownika z agentami, konfiguracją kanału, listami dozwolonych Plugin, nieaktualnym stanem zależności Plugin oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy dostawcy live ani kanału, następnie uruchamia Gateway loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety startu/statusu.
- Smoke test przetrwania aktualizacji opublikowanej wersji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę za pomocą wbudowanej receptury poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do kandydującego tarballa, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway loopback i sprawdza skonfigurowane intencje, zachowanie stanu, start, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś agregujący harmonogram o rozwinięcie dokładnych baz przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, np. `all-since-2026.4.23`, oraz rozwiń fixtury w kształcie zgłoszeń przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, np. `reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznego Plugin OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`.
- Smoke test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego kontekstu runtime w transkrypcie oraz naprawę doctor dla dotkniętych zduplikowanych gałęzi przepisywania promptu.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu home i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast się zawieszać. Użyj ponownie wcześniej zbudowanego tarballa z `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta z `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do kandydującego tarballa. Nadpisz lokalnie za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo przez wejście `update_baseline_version` workflow Install Smoke na GitHub. Kontrole instalatora bez roota zachowują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do roota nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tego env, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów z jednym workspace w izolowanym kontenerowym home, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie pozostawionego workspace. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + zdrowie): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshotu Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E oraz warstwę Chromium, uruchamia Chromium z surowym CDP, wykonuje `browser doctor --deep` i weryfikuje, że snapshoty ról CDP obejmują URL-e linków, elementy klikalne promowane przez kursor, referencje iframe i metadane ramek.
- Regresja minimalnego reasoning dla OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowe szczegóły pojawiają się w logach Gateway.
- Most kanału MCP (zasiany Gateway + most stdio + surowy smoke test ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (prawdziwy serwer MCP stdio + smoke test wbudowanego profilu Pi allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagenta (prawdziwy Gateway + sprzątanie procesu potomnego MCP stdio po izolowanym cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji/aktualizacji dla lokalnej ścieżki, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, ClawHub kitchen-sink, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixture ClawHub.
- Smoke test niezmienionej aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla lokalnej ścieżki, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fixture ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji dla zainstalowanych Plugin.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest już dostępny lokalnie. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnery Docker modeli live montują również bieżący checkout w trybie tylko do odczytu i
przenoszą go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje mały, a Vitest nadal działa na dokładnym lokalnym źródle/konfiguracji.
Krok przenoszenia pomija duże lokalne pamięci podręczne i wyjścia buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
katalogi wyjściowe Gradle, aby uruchomienia live Docker nie traciły minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby live probe Gateway nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż również
`OPENCLAW_LIVE_GATEWAY_*`, gdy trzeba zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Docker.
`test:docker:openwebui` to smoke test zgodności wyższego poziomu: uruchamia kontener
Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać obraz
Open WebUI, a Open WebUI może musieć zakończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest głównym sposobem jego dostarczenia w uruchomieniach zdockeryzowanych.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener
Gateway, uruchamia drugi kontener, który spawnuje `openclaw mcp serve`, a następnie
weryfikuje wykrywanie routowanych konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia kanału +
uprawnień w stylu Claude przez prawdziwy most MCP stdio. Kontrola powiadomień
bezpośrednio analizuje surowe ramki MCP stdio, dzięki czemu smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat pokazuje konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza
modelu live. Buduje obraz Docker repo, uruchamia prawdziwy serwer probe MCP stdio
wewnątrz kontenera, materializuje ten serwer przez wbudowany runtime MCP pakietu Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu
live. Uruchamia zasiany Gateway z prawdziwym serwerem probe MCP stdio, wykonuje
izolowany przebieg cron i jednorazowy przebieg procesu potomnego `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy działanie po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla workflow regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowany do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowany do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowany do `/home/node/.profile` i wczytywany przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby weryfikować tylko zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montowań uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowany do `/home/node/.npm-global` na potrzeby buforowanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi/pliki uwierzytelniania CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listy rozdzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` przy ponownych uruchomieniach, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że dane uwierzytelniające pochodzą z magazynu profilu (a nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla testu dymnego Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzenia nonce używany przez test dymny Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentacji: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz także sprawdzeń nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego potoku” bez prawdziwych dostawców:

- Wywoływanie narzędzi przez Gateway (mock OpenAI, prawdziwa pętla Gateway + agent): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymuszane uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mock wywoływania narzędzi przez prawdziwy Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwą Skills (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które asercjami sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice piaskownicy.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mocków dostawców do asercji wywołań narzędzi + kolejności, odczytów plików Skills i okablowania sesji.
- Mały zestaw scenariuszy skupionych na Skills (użyj kontra unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane zmiennymi środowiskowymi) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt Plugin i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany Plugin i kanał są zgodne ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych Plugin i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka testów jednostkowych `pnpm test`
celowo pomija te współdzielone pliki styku i testów dymnych; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanału lub dostawcy.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt Plugin (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy
- **group-policy** - Wymuszanie zasad grupy

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru Plugin

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu uwierzytelniania
- **auth-choice** - Wybór/selekcja uwierzytelniania
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie Plugin
- **loader** - Ładowanie Plugin
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs Plugin
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu albo zmodyfikowaniu kanału lub Plugin dostawcy
- Po refaktoryzacji rejestracji lub wykrywania Plugin

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest to z natury tylko live (limity szybkości, zasady uwierzytelniania), utrzymaj test live jako wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wykrywa błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd potoku sesji/historii/narzędzi Gateway → test dymny Gateway live albo bezpieczny dla CI mock test Gateway
- Bariera traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asercjami sprawdza, że exec ids z segmentami traversal są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem na niesklasyfikowanych target ids, aby nowe klasy nie mogły zostać po cichu pominięte.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
