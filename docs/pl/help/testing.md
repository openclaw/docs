---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw do testowania: zestawy testów jednostkowych/e2e/live, uruchamianie w Dockerze i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-30T09:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy Vitest (jednostkowy/integracyjny, e2e, live) oraz mały zestaw
runnerów Docker. Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, podczas debugowania).
- Jak testy live odnajdują poświadczenia i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, ścieżki transportu live)** jest udokumentowany osobno:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) — dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny Plugin transportowy używany przez scenariusze oparte na repozytorium.

Ta strona opisuje uruchamianie standardowych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużymi zasobami: `pnpm test:max`
- Bezpośrednia pętla obserwacji Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia ukierunkowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Ścieżka QA oparta na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz dodatkowej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche ukierunkowanie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają także małą turę obrazową.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują współużywany przepływ pracy live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live
    Docker podzielone według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI wyślij `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe, wysokosygnałowe sekrety dostawców do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołujących dla harmonogramu/wydania.
- Smoke natywnego czatu Codex z wiązaniem: `pnpm test:docker:live-codex-bind`
  - Uruchamia ścieżkę Docker live względem ścieżki serwera aplikacji Codex, wiąże syntetyczną
    wiadomość bezpośrednią Slack za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje zwykłą odpowiedź i załącznik obrazu
    przechodzące przez natywne wiązanie Plugin zamiast ACP.
- Smoke uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należącą do Plugin uprząż serwera aplikacji Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    cron MCP, subagenta i Guardian. Wyłącz sondę subagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    serwera aplikacji Codex. Aby wykonać ukierunkowane sprawdzenie subagenta, wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie subagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne, dodatkowe sprawdzenie powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke planisty Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że przybliżony fallback planisty przekłada się na audytowany typowany
    zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Zaczyna od pustego katalogu stanu OpenClaw, kieruje gołe `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON zgłasza Moonshot/K2.6, a
  transkrypcja asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA Lab:

CI uruchamia QA Lab w dedykowanych przepływach pracy. `Parity gate` uruchamia się na pasujących PR-ach oraz
z ręcznego dispatch z dostawcami mock. `QA-Lab - All Lanes` uruchamia się nocą na
`main` oraz z ręcznego dispatch z bramką zgodności mock, ścieżką Matrix live,
zarządzaną przez Convex ścieżką live Telegram i zarządzaną przez Convex ścieżką live Discord jako
zadaniami równoległymi. Zaplanowane QA i kontrole wydania przekazują Matrix `--profile fast`
jawnie, podczas gdy CLI Matrix i domyślna wartość wejścia ręcznego przepływu pracy pozostają
`all`; ręczny dispatch może podzielić `all` na zadania `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` i `e2ee-cli`. `OpenClaw Release Checks` uruchamia zgodność oraz
szybkie ścieżki Matrix i Telegram przed zatwierdzeniem wydania, używając
`mock-openai/gpt-5.5` dla kontroli transportu wydania, aby pozostały deterministyczne
i unikały normalnego startu Plugin dostawcy. Te Gatewaye transportu live wyłączają
wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez zestawy zgodności QA.

Pełne shardy mediów live dla wydania używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live Docker używają współużywanego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz na wybrany
commit, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
wewnątrz każdego sharda.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz artefaktów bez kodu wyjścia oznaczającego niepowodzenie.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fikstur i mocków protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet scenariuszy mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje gorącego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki startowe są zapisywane jako metryki
    bez wyglądania jak minutowa regresja przybijająca Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma
    już świeżego wyjścia runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej maszyny wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy live QA oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje normalny raport + podsumowanie QA oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Docker witrynę QA dla pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że włączenie Plugin instaluje zależności runtime na żądanie,
    uruchamia doctor i uruchamia jedną lokalną turę agenta względem mockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietowej
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke zbudowanej aplikacji w Docker dla transkrypcji osadzonego kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony session JSONL i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydujący pakiet OpenClaw w Docker, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    ścieżki live Telegram QA z tym zainstalowanym pakietem jako Gateway SUT.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` lub
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby testować rozwiązany lokalny tarball zamiast
    instalowania z rejestru.
  - Używa tych samych poświadczeń env Telegram lub źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker wybiera Convex automatycznie.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współużywane
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny przepływ pracy maintainer
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Przepływ pracy używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia także `Package Acceptance` dla bocznego dowodu produktu
  względem jednego kandydującego pakietu. Przyjmuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full albo custom.
  Ustaw `telegram_mode=mock-openai` lub `live-frontier`, aby uruchomić przepływ pracy
  Telegram QA względem tego samego artefaktu `package-under-test`.
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

- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżącą kompilację OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/plugins przez
    edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieobecne nieskonfigurowane
    zależności uruchomieniowe plugin, pierwszy skonfigurowany Gateway lub uruchomienie
    doctor instaluje zależności uruchomieniowe każdego dołączonego plugin na żądanie,
    a drugi restart nie instaluje ponownie zależności, które zostały już aktywowane.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor po aktualizacji kandydata
    naprawia dołączone zależności uruchomieniowe kanału bez naprawy postinstall po stronie
    uprzęży testowej.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji instalacji pakietowej na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną turę lokalnego agenta.
  - Użyj `--platform macos`, `--platform windows` lub `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json`, aby uzyskać ścieżkę artefaktu podsumowania i
    status dla poszczególnych ścieżek.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` do dowodu tury agenta na żywo.
    Przekaż `--model <provider/model>` lub ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owiń długie lokalne uruchomienia limitem czasu hosta, aby zacięcia transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` lub `linux-update.log`
    przed założeniem, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić od 10 do 15 minut na naprawie doctor/zależności
    uruchomieniowych po aktualizacji na zimnym gościu; nadal jest to zdrowy stan, gdy zagnieżdżony
    log debug npm postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi ścieżkami smoke Parallels
    dla macOS, Windows lub Linux. Współdzielą stan VM i mogą kolidować podczas
    przywracania migawki, serwowania pakietów lub stanu Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonego plugin, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API uruchomieniowe nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośredniego testowania smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę QA na żywo Matrix względem jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródeł — instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [QA Matrix](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę QA na żywo Telegram względem prawdziwej prywatnej grupy, używając tokenów bota sterownika i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Kończy się niezerowym kodem, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez błędnego kodu wyjścia.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Aby zapewnić stabilną obserwację bot-bot, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt zaobserwowanych wiadomości w `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi obejmują RTT od żądania wysłania sterownika do zaobserwowanej odpowiedzi SUT.

Ścieżki transportu na żywo współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia dla poszczególnych ścieżek znajduje się w [przeglądzie QA → Pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki zestaw syntetyczny i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, laboratorium QA uzyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
tej dzierżawy, gdy ścieżka działa, i zwalnia dzierżawę przy zamykaniu.

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na loopback URL-e Convex `http://` wyłącznie do lokalnego rozwoju.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` podczas normalnej pracy.

Polecenia administracyjne maintainer (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami na żywo, aby sprawdzić URL witryny Convex, sekrety brokera,
prefiks punktu końcowego, limit czasu HTTP oraz dostępność admin/list bez wypisywania
wartości sekretów. Użyj `--json`, aby uzyskać wyjście czytelne maszynowo w skryptach i
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
- `POST /admin/add` (tylko sekret maintainer)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Powodzenie: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret maintainer)
  - Żądanie: `{ credentialId, actorId }`
  - Powodzenie: `{ status: "ok", changed, credential }`
  - Ochrona aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret maintainer)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Powodzenie: `{ status: "ok", credentials, count }`

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być numerycznym ciągiem identyfikatora czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowo uformowane payloady.

### Dodawanie kanału do QA

Architektura i nazwy pomocników scenariuszy dla nowych adapterów kanałów znajdują się w [przeglądzie QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonej seam hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście plugin, zamontuj jako `openclaw qa <runner>` i napisz scenariusze w `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Traktuj zestawy jako „coraz większy realizm” (oraz rosnącą niestabilność/koszt):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: nieukierunkowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać wieloprojektowe shardy do konfiguracji per projekt w celu równoległego harmonogramowania
- Pliki: inwentarze core/jednostkowe w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallback `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych małych fixture plugin, a nie
    prawdziwych API źródłowych dołączonego plugin. Prawdziwe ładowania API plugin należą do
    kontraktowych/integracyjnych zestawów należących do plugin.

<AccordionGroup>
  <Accordion title="Projekty, shardy i ścieżki zakresowe">

    - Niekierunkowe `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega zagłodzeniu niepowiązanych zestawów przez zadania auto-reply/extension.
    - `pnpm test --watch` nadal używa natywnego głównego grafu projektu `vitest.config.ts`, ponieważ pętla obserwowania z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` kierują jawne cele plików/katalogów najpierw przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` pozwala uniknąć pełnego kosztu startowego projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git na tanie zakresowe ścieżki: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i zależne lokalnego grafu importów. Edycje konfiguracji/setupu/pakietu nie uruchamiają szeroko testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to standardowa inteligentna lokalna bramka sprawdzania dla wąskich prac. Klasyfikuje diff na core, testy core, extensions, testy extension, aplikacje, dokumentację, metadane wydania, narzędzia live Docker i narzędzia, a następnie uruchamia pasujące polecenia sprawdzania typów, lintowania i strażników. Nie uruchamia testów Vitest; użyj `pnpm test:changed` albo jawnego `pnpm test <target>` jako dowodu testowego. Zmiany wersji dotyczące wyłącznie metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych, ze strażnikiem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje harnessa live Docker ACP uruchamiają ukierunkowane kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker i przebieg próbny harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; edycje zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych strażników.
    - Lekkie importowo testy jednostkowe agentów, poleceń, plugins, pomocników auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych są kierowane przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe i mocno runtime’owe pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` również mapują uruchomienia trybu changed na jawne sąsiednie testy w tych lekkich ścieżkach, więc edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane kubełki dla pomocników core najwyższego poziomu, testów integracyjnych `reply.*` najwyższego poziomu oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch i commands/state-routing, aby jeden kubełek z ciężkimi importami nie obejmował całego ogona Node.
    - Normalne CI dla PR/main celowo pomija zbiorczy sweep extension i shard `agentic-plugins` tylko dla wydań. Pełna walidacja wydania uruchamia osobny workflow podrzędny `Plugin Prerelease` dla tych ciężkich zestawów plugin/extension na kandydatach do wydania.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Gdy zmieniasz wejścia wykrywania narzędzi wiadomości albo kontekst runtime compaction, utrzymuj oba poziomy pokrycia.
    - Dodawaj ukierunkowane regresje pomocników dla czystych granic routingu i normalizacji.
    - Utrzymuj w dobrym stanie zestawy integracyjne osadzonego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` i
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że zakresowe identyfikatory i zachowanie compaction nadal przepływają przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy tylko pomocników nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Wspólna konfiguracja Vitest ustawia `isolate: false` i używa nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swój setup i optymalizator `jsdom`, ale również działa na wspólnym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false` ze wspólnej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów podrzędnych Vitest Node, aby zmniejszyć narzut kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym zachowaniem V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wywołuje diff.
    - Hook pre-commit dotyczy tylko formatowania. Ponownie stage’uje sformatowane pliki i nie uruchamia lintowania, sprawdzania typów ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub pushem, gdy potrzebujesz inteligentnej lokalnej bramki sprawdzania.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowe ścieżki. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent uzna, że edycja harnessa, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu, tylko z wyższym limitem workerów.
    - Lokalne automatyczne skalowanie workerów jest celowo konserwatywne i wycofuje się, gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracji jako `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostawały poprawne, gdy zmienia się okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz jedną jawną lokalizację cache dla bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz wyjście import-breakdown.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`. Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI z wzorcami include dodają nazwę sharda, aby filtrowane shardy można było śledzić osobno.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych, trzymaj ciężkie zależności za wąskim lokalnym szwem `*.runtime.ts` i mockuj ten szew bezpośrednio, zamiast głęboko importować pomocniki runtime tylko po to, aby przepuścić je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego diffu i wypisuje czas zegarowy oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla narzutu startowego i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla zestawu jednostkowego z wyłączonym paralelizmem plików.

  </Accordion>
</AccordionGroup>

### Stabilność (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszone na jednego workera
- Zakres:
  - Uruchamia prawdziwy loopback Gateway z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny churn wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki trwałości pakietu stabilności diagnostycznej
  - Asercje sprawdzają, że recorder pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek na sesję wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka dla dalszej pracy nad regresją stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (gateway smoke)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E bundled-plugin w `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1` aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie wielu instancji gateway end-to-end
  - Powierzchnie WebSocket/HTTP, parowanie node i cięższe sieciowanie
- Oczekiwania:
  - Działa w CI (gdy włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż testy jednostkowe (może być wolniejsze)

### E2E: OpenShell backend smoke

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego pliku Dockerfile
  - Testuje backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zachowanie systemu plików remote-canonical przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1` aby włączyć test przy ręcznym uruchamianiu szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` aby wskazać niestandardowy binarny CLI lub skrypt wrappera

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live bundled-plugin w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wyłapywanie zmian formatu dostawców, osobliwości tool-calling, problemów z auth i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live źródłują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracji/auth do tymczasowego testowego katalogu domowego, aby fixture’y jednostkowe nie mogły zmienić prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale wycisza dodatkowy komunikat `~/.profile` oraz logi startowe gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz odzyskać pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach limitu szybkości.
- Wyjście postępu/heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, więc długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc linie postępu dostawcy/gateway streamują natychmiast podczas uruchomień live.
  - Dostrój heartbeat modeli bezpośrednich za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój heartbeat gateway/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Zmiany w sieci Gateway / protokole WS / parowaniu: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (korzystające z sieci)

Informacje o macierzy modeli live, testach smoke backendu CLI, testach smoke ACP, uprzęży serwera aplikacji Codex oraz wszystkich testach live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz, muzyka, wideo, uprząż mediów) — a także o obsłudze poświadczeń dla przebiegów live — znajdziesz w [Testowanie — zestawy live](/pl/help/testing-live).

## Runner’y Docker (opcjonalne kontrole „działa w Linuksie”)

Te runner’y Docker dzielą się na dwie grupy:

- Runner’y modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczem profilu w obrazie Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i obszar roboczy (oraz wczytując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runner’y Docker live domyślnie używają mniejszego limitu smoke, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  wyraźnie potrzebujesz większego, wyczerpującego skanowania.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz podstawowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności Plugin; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, instalacji npm i wielu usług. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram nadal może ją uruchomić, gdy pula jest pusta, a następnie utrzymuje ją jako jedyną działającą, aż pojemność znów będzie dostępna. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` oraz `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje wstępną kontrolę Docker, usuwa nieaktualne kontenery E2E OpenClaw, wypisuje status co 30 sekund, zapisuje czasy zakończonych powodzeniem ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w kolejnych przebiegach najpierw uruchamiać dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania lub uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietów/obrazów i poświadczeń.
- `Package Acceptance` to natywna dla GitHub bramka pakietu sprawdzająca „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. `workflow_ref` wybiera zaufane skrypty workflow/uprzęży, a `package_ref` wybiera commit/gałąź/tag źródłowy do spakowania, gdy `source=ref`; pozwala to bieżącej logice akceptacji walidować starsze zaufane commity. Profile są uporządkowane według zakresu: `smoke` to szybka instalacja/kanał/agent plus Gateway/konfiguracja, `package` to kontrakt pakietu/aktualizacji/Plugin i domyślny natywny zamiennik dla większości pokrycia pakietu/aktualizacji Parallels, `product` dodaje kanały MCP, czyszczenie cron/subagent, wyszukiwanie internetowe OpenAI i OpenWebUI, a `full` uruchamia fragmenty Docker ze ścieżki wydania z OpenWebUI. Walidacja wydania uruchamia niestandardową deltę pakietu (`bundled-channel-deps-compat plugins-offline`) plus QA pakietu Telegram, ponieważ fragmenty Docker ze ścieżki wydania już pokrywają nakładające się ścieżki pakietu/aktualizacji/Plugin. Docelowe polecenia ponownego uruchomienia Docker w GitHub, generowane z artefaktów, zawierają wcześniejszy artefakt pakietu i przygotowane wejścia obrazów, gdy są dostępne, dzięki czemu nieudane ścieżki mogą uniknąć ponownego budowania pakietu i obrazów.
- Kontrole budowania i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` i kończy się niepowodzeniem, jeśli uruchomienie przed dyspozycją importuje zależności pakietów, takie jak Commander, interfejs promptów, undici lub logowanie, przed dyspozycją polecenia; utrzymuje też zbudowany fragment uruchomienia Gateway w limicie i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Smoke spakowanego CLI obejmuje też pomoc root, pomoc onboard, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tej granicy uprząż toleruje tylko luki w metadanych wysłanych pakietów: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brak plików poprawek w fixture git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Plugin, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi niepowodzeniami.
- Runner’y smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` oraz `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runner’y Docker modeli live montują też tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy przebieg nie jest zawężony), a następnie kopiują je do katalogu domowego kontenera przed przebiegiem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test harnessu serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA z checkoutu źródeł. Celowo nie jest częścią ścieżek wydania pakietu Docker, ponieważ tarball npm pomija QA Lab.
- Live smoke test Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test tarballa npm dla onboardingu/kanału/agenta: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding z odwołaniem do env oraz domyślnie Telegram, sprawdza, czy doctor naprawił aktywowane zależności środowiska runtime Plugin, i uruchamia jedną zamockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Dockerze, przełącza z pakietowego `stable` na gitowy `dev`, weryfikuje utrwalony kanał i działanie Plugin po aktualizacji, a następnie przełącza z powrotem na pakietowy `stable` i sprawdza status aktualizacji.
- Smoke test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie transkryptu ukrytego kontekstu runtime oraz naprawę doctor dla dotkniętych zduplikowanych gałęzi przepisywania promptu.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca wbudowanych dostawców obrazów zamiast zawieszać się. Użyj ponownie wstępnie zbudowanego tarballa przez `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Dockera przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jeden cache npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazowej wersji przed aktualizacją do kandydującego tarballa. Nadpisz lokalnie przez `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo w GitHubie przez wejście `update_baseline_version` workflow Install Smoke. Testy instalatora bez roota zachowują izolowany cache npm, aby wpisy cache należące do roota nie maskowały zachowania instalacji lokalnej dla użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać cache root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej env, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace przez agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje główny obraz Dockerfile, zasila dwóch agentów jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshotu CDP przeglądarki: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje obraz źródłowy E2E oraz warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że snapshoty ról CDP obejmują adresy URL linków, elementy klikalne promowane kursorem, referencje iframe i metadane ramek.
- Regresja OpenAI Responses web_search z minimalnym reasoning: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, a następnie wymusza odrzucenie schematu dostawcy i sprawdza, czy surowe szczegóły pojawiają się w logach Gateway.
- Most kanałów MCP (zasiany Gateway + most stdio + smoke test surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer stdio MCP + smoke test allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagenta (rzeczywisty Gateway + wygaszanie procesu potomnego stdio MCP po izolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji, instalacja/odinstalowanie typu kitchen-sink w ClawHub, aktualizacje marketplace oraz włączanie/inspekcja pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixture ClawHub.
- Smoke test niezmienionej aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Zależności runtime wbudowanego Plugin: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Dockera, buduje i pakuje OpenClaw raz na hoście, a następnie montuje ten tarball w każdym scenariuszu instalacji Linuksa. Użyj ponownie obrazu przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżym lokalnym buildzie przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` albo wskaż istniejący tarball przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Pełny agregat Docker i fragmenty ścieżki wydania bundled-channel wstępnie pakują ten tarball raz, a następnie dzielą kontrole wbudowanych kanałów na niezależne ścieżki, w tym osobne ścieżki aktualizacji dla Telegram, Discord, Slack, Feishu, memory-lancedb i ACPX. Fragmenty wydania dzielą smoke testy kanałów, cele aktualizacji oraz kontrakty setup/runtime na `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` i `bundled-channels-contracts`; agregat `bundled-channels` pozostaje dostępny do ręcznych ponownych uruchomień. Workflow wydania dzieli też fragmenty instalatora dostawców oraz fragmenty instalacji/odinstalowania wbudowanego Plugin; starsze fragmenty `package-update`, `plugins-runtime` i `plugins-integrations` pozostają aliasami agregatów do ręcznych ponownych uruchomień. Użyj `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, aby zawęzić macierz kanałów przy bezpośrednim uruchamianiu tej ścieżki, albo `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, aby zawęzić scenariusz aktualizacji. Uruchomienia Dockera dla poszczególnych scenariuszy domyślnie używają `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; scenariusz aktualizacji wielu celów domyślnie używa `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Ścieżka weryfikuje też, że `channels.<id>.enabled=false` i `plugins.entries.<id>.enabled=false` blokują naprawę doctor/zależności runtime.
- Zawężaj zależności runtime wbudowanego Plugin podczas iteracji, wyłączając niepowiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów właściwe dla pakietów, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy QR i instalatora Docker zachowują własne Dockerfile, ponieważ weryfikują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnery Dockera live-model montują też bieżący checkout tylko do odczytu i
etapują go w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje mały, a Vitest nadal działa na dokładnie lokalnym źródle/konfiguracji.
Krok etapowania pomija duże lokalne cache i wyniki buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyników `.build` lub
Gradle, aby uruchomienia live w Dockerze nie spędzały minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Docker.
`test:docker:openwebui` to smoke test zgodności wyższego poziomu: uruchamia
kontener Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` eksponuje `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć dokończyć własny zimny start.
Ta ścieżka oczekuje użytecznego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem przekazania go w uruchomieniach zdockeryzowanych.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener Gateway,
uruchamia drugi kontener, który spawnuje `openclaw mcp serve`, a następnie
weryfikuje wykrywanie trasowanych rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, trasowanie wysyłki wychodzącej oraz powiadomienia kanałów w stylu Claude +
uprawnienia przez rzeczywisty most stdio MCP. Kontrola powiadomień
bezpośrednio sprawdza surowe ramki stdio MCP, więc smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat eksponuje konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu live.
Buduje obraz Dockera repozytorium, uruchamia rzeczywisty serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime MCP pakietu Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia zasiany Gateway z rzeczywistym serwerem sondy stdio MCP, wykonuje
izolowaną turę cron oraz jednorazową turę potomną `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy działanie po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i ładowane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe ładowane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów konfiguracji/obszaru roboczego i bez zewnętrznych montowań uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelniania CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listy rozdzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że dane uwierzytelniające pochodzą z magazynu profilu (nie ze zmiennych środowiskowych)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model wystawiany przez Gateway dla testu smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez test smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz także kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego potoku” bez prawdziwych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymuszone uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mock wywoływania narzędzi przez prawdziwy gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwą Skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice piaskownicy.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Uruchamiacz scenariuszy używający mockowanych dostawców do sprawdzania wywołań narzędzi + kolejności, odczytów plików Skills i okablowania sesji.
- Mały zestaw scenariuszy skoncentrowanych na Skills (użycie kontra unikanie, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane zmiennymi środowiskowymi) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna jednostkowa ścieżka `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktowe jawnie,
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
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy osób
- **group-policy** - Egzekwowanie polityki grupowej

### Kontrakty statusu dostawców

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
- Po dodaniu lub zmodyfikowaniu kanału albo pluginu dostawcy
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty w trybie live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli to z natury tylko live (limity szybkości, polityki uwierzytelniania), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wykrywa błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd potoku sesji/historii/narzędzi gateway → smoke live gateway albo bezpieczny dla CI mock test gateway
- Bariera ochronna przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że identyfikatory exec z segmentami przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem dla niesklasyfikowanych identyfikatorów celów, aby nowe klasy nie mogły być pomijane po cichu.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [CI](/pl/ci)
