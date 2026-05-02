---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw do testowania: zestawy testów jednostkowych/e2e/live, uruchamiacze Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-05-02T09:53:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy Vitest (jednostkowe/integracyjne, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Jakie polecenia uruchamiać dla typowych przepływów pracy (lokalnie, przed push, podczas debugowania).
- Jak testy live wykrywają poświadczenia i wybierają modele/providerów.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/providerami.

<Note>
**Stos QA (qa-lab, qa-channel, ścieżki transportu live)** jest udokumentowany osobno:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) — dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny Plugin transportowy używany przez scenariusze wspierane repozytorium.

Ta strona opisuje uruchamianie standardowych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużymi zasobami: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia celowane.
- Witryna QA wspierana przez Docker: `pnpm qa:lab:up`
- Ścieżka QA wspierana przez maszynę VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz większej pewności:

- Bramka coverage: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych providerów/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Dockerowy sweep modeli live: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też minimalną turę obrazową.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii providera.
  - Zakres CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują reużywalny workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne dockerowe zadania macierzy modeli live
    shardowane według providera.
  - Do celowanych ponownych uruchomień CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodawaj nowe sekrety providerów o wysokiej wartości sygnału do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań harmonogramu/release.
- Smoke natywnego bound-chat Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia dockerową ścieżkę live względem ścieżki app-server Codex, wiąże syntetyczną
    wiadomość prywatną Slack za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne powiązanie Plugin zamiast ACP.
- Smoke harnessa app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należący do Plugin harness app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    cron MCP, sub-agenta i Guardian. Wyłącz sondę sub-agenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla celowanej kontroli sub-agenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie sub-agenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke komendy ratunkowej Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalna, redundantna kontrola powierzchni komendy ratunkowej kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Dockerowy smoke planisty Crestodian: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback planisty przekłada się na audytowany zapis
    typowanej konfiguracji.
- Dockerowy smoke pierwszego uruchomienia Crestodian: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, kieruje gołe `openclaw` do
    Crestodian, stosuje zapisy konfiguracji/modelu/agenta/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    też pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztu Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON zgłasza Moonshot/K2.6, a
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live przez zmienne środowiskowe allowlist opisane poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. `Parity gate` działa na pasujących PR-ach oraz
z ręcznego dispatch z mock providerami. `QA-Lab - All Lanes` działa co noc na
`main` oraz z ręcznego dispatch z mock parity gate, ścieżką live Matrix,
zarządzaną przez Convex ścieżką live Telegram i zarządzaną przez Convex ścieżką live Discord jako
zadaniami równoległymi. Zaplanowane QA i kontrole release przekazują Matrix `--profile fast`
jawnie, podczas gdy domyślne wartości wejścia Matrix CLI i ręcznego workflow pozostają
`all`; ręczny dispatch może shardować `all` na zadania `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` i `e2ee-cli`. `OpenClaw Release Checks` uruchamia parity oraz
szybkie ścieżki Matrix i Telegram przed zatwierdzeniem release, używając
`mock-openai/gpt-5.5` dla kontroli transportu release, aby pozostały deterministyczne
i unikały normalnego startu provider-plugin. Te Gatewaye transportu live wyłączają
wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez zestawy QA parity.

Shardy live media pełnego release używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Dockerowe shardy modeli/backendów live używają wspólnego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commitu, a potem pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
w każdym shardzie.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA wspierane przez repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy z kodem niezerowym, gdy jakikolwiek scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez końcowego kodu awarii.
  - Obsługuje tryby providerów `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer providera oparty na AIMock do eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia bench startu Gateway oraz mały pakiet mock scenariuszy QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje wysokiego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki przy starcie są rejestrowane jako metryki
    bez wyglądania jak regresja wielominutowego zablokowania Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma jeszcze
    świeżego wyniku runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej maszyny VM Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Reużywa tych samych flag wyboru providera/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia auth QA praktyczne dla gościa:
    klucze providerów oparte na env, ścieżkę konfiguracji providera QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod rootem repo, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje standardowy raport QA + podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia wspieraną przez Docker witrynę QA do operatorskiej pracy QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime Plugin ładuje się bez naprawy zależności
    przy starcie, uruchamia doctor i wykonuje jedną lokalną turę agenta względem
    zamockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietu
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny dockerowy smoke zbudowanej aplikacji dla transkryptów osadzonego kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasila dotknięty problemem uszkodzony session JSONL i weryfikuje, że
    `openclaw doctor --fix` przepisuje go na aktywną gałąź z backupem.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydata pakietu OpenClaw w Docker, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie reużywa
    ścieżki QA live Telegram z tym zainstalowanym pakietem jako Gateway SUT.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` albo
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby testować rozwiązany lokalny tarball zamiast
    instalować z rejestru.
  - Używa tych samych poświadczeń env Telegram lub źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/release ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` oraz sekret roli Convex są obecne w CI,
    wrapper Docker wybiera Convex automatycznie.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainerów
    `NPM Telegram Beta E2E`. Nie działa przy merge. Workflow używa środowiska
    `qa-live-shared` oraz dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia też `Package Acceptance` jako boczny dowód produktu
  względem jednego kandydata pakietu. Akceptuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS wraz z SHA-256 albo artefakt tarballa z innego uruchomienia, wysyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full albo custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić workflow
  Telegram QA względem tego samego artefaktu `package-under-test`.
  - Najnowszy dowód produktu beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Dowód dokładnego URL tarballa wymaga digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Dowód artefaktu pobiera artefakt tarball z innego uruchomienia Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Pakuje i instaluje bieżącą kompilację OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez
    edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane pluginy
    do pobrania jako nieobecne, pierwsza skonfigurowana naprawa doctor instaluje
    jawnie każdy brakujący Plugin do pobrania, a drugie ponowne uruchomienie nie
    uruchamia ukrytej naprawy zależności.
  - Instaluje też znaną starszą bazę odniesienia npm, włącza Telegram przed
    uruchomieniem `openclaw update --tag <candidate>` i weryfikuje, że doctor
    po aktualizacji kandydata czyści pozostałości po zależnościach starszego
    Plugin bez naprawy postinstall po stronie harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji instalacji pakietowej na gościach
    Parallels. Każda wybrana platforma najpierw instaluje żądany pakiet bazowy,
    następnie uruchamia zainstalowane polecenie `openclaw update` na tym samym
    gościu i weryfikuje zainstalowaną wersję, status aktualizacji, gotowość
    Gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` lub `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json`, aby uzyskać ścieżkę artefaktu
    podsumowania i status poszczególnych torów.
  - Tor OpenAI domyślnie używa `openai/gpt-5.5` do dowodu tury agenta na żywo.
    Przekaż `--model <provider/model>` lub ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny model OpenAI.
  - Opakuj długie lokalne uruchomienia limitem czasu hosta, aby zacięcia
    transportu Parallels nie zużyły reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi torów pod `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` lub `linux-update.log`,
    zanim założysz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut na doctorze po aktualizacji
    i pracy aktualizacji pakietów na zimnym gościu; nadal jest to poprawne, gdy
    zagnieżdżony log debug npm postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi torami
    smoke Parallels macOS, Windows lub Linux. Współdzielą stan VM i mogą
    kolidować przy przywracaniu snapshotu, serwowaniu pakietów lub stanie
    Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonych pluginów,
    ponieważ fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie
    mediów, są ładowane przez dołączone runtime API nawet wtedy, gdy sama tura
    agenta sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośredniego testowania smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia tor QA Matrix na żywo wobec jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródłowy — instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełny CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów: [QA Matrix](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia tor QA Telegram na żywo wobec rzeczywistej prywatnej grupy przy użyciu tokenów bota sterownika i bota SUT ze środowiska.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych, pulowanych danych uwierzytelniających. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Kończy działanie z kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez nieudanego kodu wyjścia.
  - Wymaga dwóch odrębnych botów w tej samej prywatnej grupie, z botem SUT udostępniającym nazwę użytkownika Telegram.
  - Aby uzyskać stabilną obserwację bot-do-bota, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages pod `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi zawierają RTT od żądania wysłania przez sterownik do zaobserwowanej odpowiedzi SUT.

Tory transportu na żywo współdzielą jeden standardowy kontrakt, aby nowe transporty nie rozjeżdżały się; macierz pokrycia dla poszczególnych torów znajduje się w [Przegląd QA → Pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki syntetyczny zestaw testów i nie jest częścią tej macierzy.

### Współdzielone dane uwierzytelniające Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, laboratorium QA pobiera wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
tej dzierżawy podczas działania toru i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli danych uwierzytelniających:
  - CLI: `--credential-role maintainer|ci`
  - Domyślne env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na adresy URL Convex `http://` przez local loopback wyłącznie do lokalnego programowania.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` podczas normalnej pracy.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami na żywo, aby sprawdzić adres URL witryny Convex, sekrety brokera,
prefiks endpointu, limit czasu HTTP oraz dostępność admin/list bez drukowania
wartości sekretów. Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowo uformowane payloady.

### Dodawanie kanału do QA

Architektura i nazwy helperów scenariuszy dla nowych adapterów kanałów znajdują się w [Przegląd QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym szwie hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze pod `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Traktuj zestawy jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: nietargetowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/unit pod `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Działa w CI
  - Nie wymaga rzeczywistych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallback
    `api.js` i `runtime-api.js` za pomocą wygenerowanych małych fixture’ów pluginów, a nie
    rzeczywistych źródłowych API dołączonych pluginów. Rzeczywiste ładowania API pluginów należą do
    zestawów kontraktowych/integracyjnych właściciela pluginu.

<AccordionGroup>
  <Accordion title="Projekty, shardy i tory zakresowe">

    - Niedoprecyzowane uruchomienie `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega odbieraniu zasobów niepowiązanym zestawom przez zadania auto-reply/extension.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ pętla obserwacji z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` kierują jawne cele plików/katalogów najpierw przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika płacenia pełnego kosztu startu projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git do tanich zakresowych ścieżek: bezpośrednie edycje testów, siostrzane pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności z grafu importów. Edycje konfiguracji/setupu/pakietów nie uruchamiają szeroko testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzania dla wąskich zmian. Klasyfikuje diff na core, testy core, rozszerzenia, testy rozszerzeń, aplikacje, dokumentację, metadane wydań, narzędzia live Docker i narzędzia, a następnie uruchamia pasujące polecenia typecheck, lint i guard. Nie uruchamia testów Vitest; użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego. Podbicia wersji obejmujące wyłącznie metadane wydań uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności katalogu głównego, z zabezpieczeniem odrzucającym zmiany pakietu poza polem wersji na najwyższym poziomie.
    - Edycje harnessa live Docker ACP uruchamiają ukierunkowane sprawdzenia: składnię powłoki dla skryptów uwierzytelniania live Docker oraz próbny przebieg harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zmiany zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych zabezpieczeń.
    - Lekkie importowo testy jednostkowe z agentów, poleceń, Pluginów, pomocników auto-reply, `plugin-sdk` i podobnych obszarów czystych narzędzi przechodzą przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` mapują także uruchomienia w trybie changed na jawne siostrzane testy w tych lekkich ścieżkach, więc edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla pomocników core najwyższego poziomu, testów integracyjnych `reply.*` najwyższego poziomu oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch i commands/state-routing, aby jeden importowo ciężki koszyk nie posiadał pełnego ogona Node.
    - Normalne CI dla PR/main celowo pomija zbiorczy przegląd rozszerzeń i wyłącznie wydaniowy shard `agentic-plugins`. Pełna walidacja wydania uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych zestawów silnie obciążających Pluginy/rozszerzenia na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie osadzonego runnera">

    - Gdy zmieniasz dane wejściowe wykrywania narzędzi wiadomości lub kontekst runtime
      Compaction, utrzymuj oba poziomy pokrycia.
    - Dodawaj ukierunkowane regresje pomocników dla czystych granic routingu i normalizacji.
    - Utrzymuj w zdrowym stanie zestawy integracyjne osadzonego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` i
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że zakresowe identyfikatory i zachowanie Compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy tylko dla pomocników
      nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Pula Vitest i domyślna izolacja">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Wspólna konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swój setup `jsdom` i optymalizator, ale także działa na
      wspólnym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne wartości `threads` + `isolate: false`
      ze wspólnej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla potomnych procesów Node
      Vitest, aby ograniczyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać z podstawowym zachowaniem V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala diff.
    - Hook pre-commit dotyczy tylko formatowania. Ponownie stage'uje sformatowane pliki i
      nie uruchamia lintu, typechecku ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub pushowaniem, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzania.
    - `pnpm test:changed` domyślnie przechodzi przez tanie zakresowe ścieżki. Używaj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harnessa, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Lokalne autoskalowanie workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele współbieżnych
      uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostawały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu importów Vitest oraz
      wynik rozbicia importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI
      z wzorcem include dołączają nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym szwem `*.runtime.ts` i
      mockuj ten szew bezpośrednio, zamiast głęboko importować pomocniki runtime tylko po to,
      aby przepuścić je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas zegarowy oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startowego i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu jednostkowego z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (Gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszona do jednego workera
- Zakres:
  - Domyślnie uruchamia rzeczywisty loopback Gateway z włączoną diagnostyką
  - Przepuszcza syntetyczny churn wiadomości Gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez RPC WS Gateway
  - Obejmuje pomocniki utrwalania pakietu stabilności diagnostycznej
  - Asercje sprawdzają, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek na sesję wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka dla działań po regresji stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Pluginów pod `extensions/`
- Domyślne wartości runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby ograniczyć narzut konsolowego I/O.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji Gateway
  - Powierzchnie WebSocket/HTTP, parowanie node i cięższa sieć
- Oczekiwania:
  - Działa w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż w testach jednostkowych (może być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany Gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + SSH exec
  - Weryfikuje zdalnie kanoniczne zachowanie systemu plików przez mostek fs sandboxa
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy Gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny plik CLI lub skrypt wrappera

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Pluginów pod `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dziś_ z prawdziwymi poświadczeniami?”
  - Wychwytuje zmiany formatu dostawców, osobliwości wywoływania narzędzi, problemy z uwierzytelnianiem i zachowanie limitów szybkości
- Oczekiwania:
  - Z założenia nie jest stabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live źródłują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracyjne/uwierzytelniające do tymczasowego testowego katalogu domowego, aby fixture'y jednostkowe nie mogły modyfikować prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale tłumi dodatkowy komunikat `~/.profile` i wycisza logi bootstrapu Gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają po odpowiedziach limitu szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, dzięki czemu linie postępu dostawcy/Gateway są strumieniowane natychmiast podczas uruchomień live.
  - Dostrój bezpośrednie Heartbeat modeli za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój Heartbeat Gateway/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla providera / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Macierz modeli live, testy smoke backendu CLI, testy smoke ACP, harness serwera aplikacji Codex
oraz wszystkie testy live providerów mediów (Deepgram, BytePlus, ComfyUI, obrazy,
muzyka, wideo, harness mediów) — a także obsługę poświadczeń dla uruchomień live — opisuje
[Testowanie zestawów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i
walidacji Pluginów opisuje
[Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne sprawdzenia „działa w Linux”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczem profilu wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i workspace (oraz wczytując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery live Docker domyślnie używają mniejszego limitu smoke, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  wyraźnie chcesz większego, wyczerpującego skanowania.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz bazowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności Pluginów; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego schedulera: `OPENCLAW_DOCKER_ALL_PARALLELISM` steruje slotami procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, npm-install i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, scheduler nadal może ją uruchomić, gdy pula jest pusta, a następnie utrzymuje ją jako jedyną uruchomioną do czasu ponownej dostępności zasobów. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas zasobów. Runner domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery E2E OpenClaw, wypisuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby przy kolejnych uruchomieniach najpierw startować dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania lub uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietu/obrazu i poświadczeń.
- `Package Acceptance` to natywna dla GitHub bramka pakietu odpowiadająca na pytanie „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden kandydacki pakiet z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według zakresu: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/Pluginów, macierz przetrwania opublikowanej aktualizacji, domyślne ustawienia wydań i triage awarii.
- Sprawdzenia build i release uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` oraz kończy się niepowodzeniem, jeśli start przed dispatch importuje zależności pakietu, takie jak Commander, prompt UI, undici lub logowanie przed dispatch komendy; utrzymuje też zbundlowany chunk uruchomieniowy Gateway w budżecie i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Smoke spakowanego CLI obejmuje także główną pomoc, pomoc onboard, pomoc doctor, status, schemat konfiguracji i komendę listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego punktu granicznego harness toleruje tylko luki metadanych wysłanego pakietu: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brak plików patch w fixturze git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Pluginów, brak trwałości rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi awariami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live bind-montują również tylko potrzebne katalogi domowe autoryzacji CLI (lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez mutowania magazynu autoryzacji hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` oraz `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA dla checkoutu źródłowego. Celowo nie jest częścią ścieżek wydania pakietu Docker, ponieważ tarball npm pomija QA Lab.
- Smoke test Open WebUI na żywo: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne szkielety): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding z odwołaniem do zmiennych środowiskowych oraz domyślnie Telegram, uruchamia doctor i wykonuje jedną zamockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta za pomocą `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał za pomocą `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Docker, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał oraz działanie plugina po aktualizacji, a następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na zabrudzonym fiksturze starego użytkownika z agentami, konfiguracją kanału, allowlistami pluginów, przestarzałym stanem zależności pluginów oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy dostawcy ani kanału na żywo, potem startuje Gateway loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety startu/statusu.
- Smoke test przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasiewa realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę przy użyciu wbudowanej receptury poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do tarballa kandydata, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, a następnie startuje Gateway loopback i sprawdza skonfigurowane intencje, zachowanie stanu, start, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś agregujący harmonogram o rozwinięcie dokładnych baz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` i rozwiń fikstury w kształcie zgłoszeń za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takich jak `reported-issues`; Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` oraz `published_upgrade_survivor_scenarios`.
- Smoke test kontekstu środowiska uruchomieniowego sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego kontekstu środowiska uruchomieniowego w transkrypcie oraz naprawę przez doctor dotkniętych zduplikowanych gałęzi przepisywania promptów.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast zawieszać się. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń kompilację hosta za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do tarballa kandydata. Nadpisz lokalnie za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo za pomocą wejścia `update_baseline_version` przepływu Install Smoke w GitHub. Kontrole instalatora bez uprawnień roota utrzymują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do roota nie maskowały zachowania instalacji lokalnej dla użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie użyć pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace przez agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasiewa dwóch agentów z jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke za pomocą `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + stan zdrowia): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test migawki CDP przeglądarki: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E plus warstwę Chromium, startuje Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP obejmują adresy URL linków, elementy klikalne promowane kursorem, referencje iframe oraz metadane ramek.
- Regresja minimalnego wnioskowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (zasiany Gateway + most stdio + smoke test surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer MCP stdio + smoke test allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagenta (rzeczywisty Gateway + sprzątanie procesu potomnego MCP stdio po izolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, pełnego zestawu ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/środowisko uruchomieniowe pełnego zestawu za pomocą `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fikstury ClawHub.
- Smoke test niezmienionej aktualizacji plugina: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fikstur ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji zainstalowanych pluginów.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy QR i instalatora Docker zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielone środowisko uruchomieniowe zbudowanej aplikacji.

Uruchamiacze Docker modeli na żywo również montują bieżący checkout tylko do odczytu i
przygotowują go w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu obraz
środowiska uruchomieniowego pozostaje lekki, a Vitest nadal działa na dokładnym lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże lokalne pamięci podręczne i wyjścia kompilacji aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
katalogi wyjściowe Gradle, dzięki czemu uruchomienia Docker na żywo nie spędzają minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają także `OPENCLAW_SKIP_CHANNELS=1`, aby próby Gateway na żywo nie startowały
rzeczywistych workerów kanałów Telegram/Discord/itp. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż również
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić albo wykluczyć pokrycie Gateway
na żywo z tej ścieżki Docker.
`test:docker:openwebui` jest smoke testem kompatybilności wyższego poziomu: startuje
kontener Gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
startuje przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować dokończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje użytecznego klucza modelu na żywo, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem jego dostarczenia w uruchomieniach w Docker.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener Gateway,
startuje drugi kontener, który tworzy `openclaw mcp serve`, a następnie
weryfikuje odkrywanie trasowanych konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń na żywo, trasowanie wysyłania wychodzącego oraz powiadomienia kanału +
uprawnień w stylu Claude przez rzeczywisty most MCP stdio. Kontrola powiadomień
bezpośrednio sprawdza surowe ramki MCP stdio, więc smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat eksponuje konkretny klient SDK.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu na żywo.
Buduje obraz Docker repozytorium, startuje rzeczywisty serwer sondy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzone środowisko uruchomieniowe MCP pakietu Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` oraz `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu na żywo.
Startuje zasiany Gateway z rzeczywistym serwerem sondy MCP stdio, uruchamia
izolowaną turę cron oraz jednorazową turę procesu potomnego `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy się po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji trasowania wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowany w `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowany w `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowany w `/home/node/.profile` i wczytywany przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby weryfikować tylko zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montowań uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowany w `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi/pliki uwierzytelniania CLI w `$HOME` są montowane tylko do odczytu w `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listy rozdzielonej przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że dane uwierzytelniające pochodzą z magazynu profilu (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla testu smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez test smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz również kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego potoku” bez rzeczywistych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: „uruchamia wywołanie narzędzia mock OpenAI end-to-end przez pętlę agenta gateway”)
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + egzekwuje uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: „uruchamia kreator przez ws i zapisuje konfigurację tokenu uwierzytelniającego”)

## Ewaluacje niezawodności agenta (skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mock wywoływania narzędzi przez prawdziwy gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla skills (zobacz [Skills](/pl/tools/skills)):

- **Decydowanie:** gdy skills są wymienione w prompcie, czy agent wybiera właściwą umiejętność (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice piaskownicy.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do sprawdzania wywołań narzędzi + kolejności, odczytów plików umiejętności i okablowania sesji.
- Mały zestaw scenariuszy skoncentrowanych na umiejętnościach (użycie vs unikanie, bramkowanie, wstrzyknięcie promptu).
- Opcjonalne ewaluacje live (opt-in, bramkowane zmiennymi środowiskowymi) dopiero po przygotowaniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt plugin i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw asercji kształtu oraz zachowania. Domyślna jednostkowa ścieżka `pnpm test` celowo pomija te współdzielone pliki styku i smoke; uruchamiaj polecenia kontraktowe jawnie, gdy dotykasz współdzielonych powierzchni kanałów lub dostawców.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt plugin (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy uczestników
- **group-policy** - Egzekwowanie zasad grupy

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
- Po dodaniu albo zmodyfikowaniu kanału lub plugin dostawcy
- Po refaktoryzacji rejestracji lub wykrywania plugin

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty na żywo:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest to z natury tylko live (limity szybkości, zasady uwierzytelniania), utrzymuj test live jako wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wychwytuje błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd potoku sesji/historii/narzędzi gateway → test smoke gateway live albo bezpieczny dla CI test mock gateway
- Bariera ochronna przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że identyfikatory exec z segmentami przechodzenia są odrzucane.
  - Jeśli dodajesz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem dla niesklasyfikowanych identyfikatorów celów, aby nowe klasy nie mogły zostać po cichu pominięte.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i plugin](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
