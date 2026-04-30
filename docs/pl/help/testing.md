---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: zestawy testów jednostkowych/e2e/live, runnery Docker oraz zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-30T18:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (jednostkowe/integracyjne, e2e, live) i mały zestaw
runnerów Docker. Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać dla typowych przepływów pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają dane uwierzytelniające oraz wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, live transport lanes)** jest udokumentowany oddzielnie:

- [Przegląd QA](/pl/concepts/qa-e2e-automation) — architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) — referencja dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny Plugin transportu używany przez scenariusze wspierane przez repozytorium.

Ta strona opisuje uruchamianie zwykłych zestawów testów oraz runnerów Docker/Parallels. Sekcja dotycząca runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych referencji.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużą ilością zasobów: `pnpm test:max`
- Bezpośrednia pętla obserwowania Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia zawężone.
- Witryna QA wspierana przez Docker: `pnpm qa:lab:up`
- Lane QA wspierana przez maszynę wirtualną Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz większej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania prawdziwych dostawców/modeli (wymaga prawdziwych danych uwierzytelniających):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają także małą turę obrazową.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` albo
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienny `OpenClaw Scheduled Live And E2E Checks` oraz ręczny
    `OpenClaw Release Checks` wywołują wielokrotnego użytku przepływ live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live w Docker
    podzielone według dostawcy.
  - Dla zawężonych ponownych uruchomień CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe, wysokosygnałowe sekrety dostawców do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań harmonogramu/wydania.
- Natywny smoke Codex dla powiązanego czatu: `pnpm test:docker:live-codex-bind`
  - Uruchamia lane Docker live przeciwko ścieżce app-server Codex, wiąże syntetyczny
    Slack DM z `/codex bind`, ćwiczy `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazowy
    przechodzą przez natywne powiązanie Pluginu zamiast ACP.
- Smoke harnessa app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez harness app-server Codex należący do Pluginu,
    weryfikuje `/codex status` i `/codex models`, a domyślnie ćwiczy sondy obrazu,
    cron MCP, sub-agenta i Guardian. Wyłącz sondę sub-agenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla zawężonego sprawdzenia sub-agenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie sub-agenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne sprawdzenie „pas i szelki” dla powierzchni polecenia ratunkowego kanału wiadomości.
    Ćwiczy `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback planera przekłada się na audytowany, typowany
    zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Zaczyna od pustego katalogu stanu OpenClaw, kieruje samo `openclaw` do
    Crestodian, stosuje zapisy konfiguracji/setup/model/agent/Pluginu Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  przeciwko `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypt asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia są obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych przepływach pracy. `Parity gate` działa na pasujących PR-ach i
z ręcznego wywołania z mockowanymi dostawcami. `QA-Lab - All Lanes` działa co noc na
`main` i z ręcznego wywołania z mockowaną bramką parytetu, lane live Matrix,
zarządzaną przez Convex lane live Telegram i zarządzaną przez Convex lane live Discord jako
zadaniami równoległymi. Zaplanowane QA i kontrole wydań przekazują Matrix `--profile fast`
jawnie, podczas gdy domyślne wartości CLI Matrix i ręcznego wejścia przepływu pracy pozostają
`all`; ręczne wywołanie może podzielić `all` na zadania `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` i `e2ee-cli`. `OpenClaw Release Checks` uruchamia parytet oraz
szybkie lane Matrix i Telegram przed zatwierdzeniem wydania, używając
`mock-openai/gpt-5.5` dla kontroli transportu wydania, aby pozostały deterministyczne
i unikały normalnego uruchamiania Pluginu dostawcy. Te Gatewaye transportu live wyłączają
wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez zestawy parytetu QA.

Pełne shardy live media dla wydania używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który już ma
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live w Docker używają wspólnego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commita, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
wewnątrz każdego sharda.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA wspierane przez repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1` dla starszej lane szeregowej.
  - Kończy z kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kodu wyjścia oznaczającego awarię.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    lane `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet mockowanych scenariuszy QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje gorącego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki
    bez wyglądania jak regresja wielominutowego obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma
    jeszcze świeżego wyniku runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej maszyny wirtualnej Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod korzeniem repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje normalny raport QA + podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia witrynę QA wspieraną przez Docker do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że włączenie Pluginu instaluje zależności runtime na żądanie,
    uruchamia doctor i uruchamia jedną lokalną turę agenta przeciwko mockowanemu
    endpointowi OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą lane instalacji pakietu
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke zbudowanej aplikacji w Docker dla osadzonych transkryptów kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go na aktywną gałąź z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydata pakietu OpenClaw w Docker, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    lane QA live Telegram z tym zainstalowanym pakietem jako SUT Gateway.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` albo
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby przetestować rozwiązany lokalny tarball zamiast
    instalować z rejestru.
  - Używa tych samych danych uwierzytelniających env Telegram albo źródła danych uwierzytelniających Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker wybiera Convex automatycznie.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej lane.
  - GitHub Actions udostępnia tę lane jako ręczny przepływ pracy maintainerów
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Przepływ pracy używa środowiska
    `qa-live-shared` i dzierżaw danych uwierzytelniających CI z Convex.
- GitHub Actions udostępnia także `Package Acceptance` dla pobocznego dowodu produktu
  względem jednego kandydata pakietu. Akceptuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS wraz z SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami lane smoke, package, product, full albo custom.
  Ustaw `telegram_mode=mock-openai` albo `live-frontier`, aby uruchomić przepływ pracy QA Telegram
  względem tego samego artefaktu `package-under-test`.
  - Dowód produktu dla najnowszej beta:

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

- Dowód artefaktu pobiera artefakt tarball z innego uruchomienia Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżącą kompilację OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez edycje
    konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane zależności wykonawcze pluginów
    nieobecne, pierwsze skonfigurowane uruchomienie Gateway lub doctor instaluje na żądanie zależności
    wykonawcze każdego dołączonego pluginu, a drugi restart nie
    reinstaluje zależności, które zostały już aktywowane.
  - Instaluje także znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor po aktualizacji kandydata
    naprawia zależności wykonawcze dołączonego kanału bez naprawy postinstall
    po stronie uprzęży.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji spakowanej instalacji na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną turę agenta.
  - Używaj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json`, aby uzyskać ścieżkę artefaktu podsumowania i
    status dla każdej lane.
  - Lane OpenAI domyślnie używa `openai/gpt-5.5` do dowodu tury agenta na żywo.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo weryfikujesz inny
    model OpenAI.
  - Owijaj długie lokalne uruchomienia limitem czasu hosta, aby zacięcia transportu Parallels nie
    zużyły reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi lane pod `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`,
    zanim założysz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić od 10 do 15 minut w naprawie doctor/zależności
    wykonawczych po aktualizacji na zimnym gościu; to nadal zdrowy stan, gdy zagnieżdżony
    log debugowania npm postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi lane smoke Parallels
    dla macOS, Windows albo Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu migawki, serwowaniu pakietów albo stanie Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonych pluginów, ponieważ
    fasady zdolności, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API wykonawcze nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośredniego testu smoke
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia lane QA Matrix na żywo przeciwko jednorazowemu homeserverowi Tuwunel opartemu na Dockerze. Tylko checkout źródeł — spakowane instalacje nie dostarczają `qa-lab`.
  - Pełny CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów: [QA Matrix](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia lane QA Telegram na żywo przeciwko prawdziwej prywatnej grupie, używając tokenów bota sterownika i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
    chcesz artefaktów bez niezerowego kodu wyjścia.
  - Wymaga dwóch odrębnych botów w tej samej prywatnej grupie, przy czym bot SUT musi ujawniać nazwę użytkownika Telegram.
  - Aby uzyskać stabilną obserwację między botami, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot sterownika może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt zaobserwowanych wiadomości pod `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi obejmują RTT od żądania wysłania przez sterownik do zaobserwowanej odpowiedzi SUT.

Lane transportu na żywo współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia dla poszczególnych lane znajduje się w [przeglądzie QA → Pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki syntetyczny zestaw i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (albo `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab pozyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat
tej dzierżawy podczas działania lane i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślna wartość env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex `http://` przez local loopback wyłącznie do lokalnego rozwoju.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` podczas normalnego działania.

Polecenia administratora maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicy CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami na żywo, aby sprawdzić adres URL witryny Convex, sekrety brokera,
prefiks endpointu, limit czasu HTTP oraz osiągalność admin/list bez wypisywania
wartości sekretów. Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/ponawialne: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowo uformowane payloady.

### Dodawanie kanału do QA

Architektura i nazwy pomocników scenariuszy dla nowych adapterów kanałów znajdują się w [przeglądzie QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym styku hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście pluginu, zamontuj jako `openclaw qa <runner>` i napisz scenariusze pod `qa/scenarios/`.

## Zestawy testów (co działa gdzie)

Myśl o zestawach jak o „rosnącym realizmie” (i rosnącej niestabilności/koszcie):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: nieukierunkowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt dla równoległego planowania
- Pliki: inwentarze core/jednostkowe pod `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Działa w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą udowodnić szerokie zachowanie fallbacków `api.js` i
    `runtime-api.js` z wygenerowanymi małymi fixturami pluginów, a nie
    prawdziwymi źródłowymi API dołączonych pluginów. Ładowania prawdziwego API pluginów należą do
    należących do pluginów zestawów kontraktowych/integracyjnych.

<AccordionGroup>
  <Accordion title="Projekty, shardy i lane o zawężonym zakresie">

    - Nieukierunkowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji fragmentów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega temu, by praca auto-reply/rozszerzeń zagłodziła niepowiązane zestawy testów.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ pętla obserwacji wielu fragmentów nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` kierują jawne cele plików/katalogów najpierw przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika płacenia pełnego kosztu startu projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git do tanich zakresowych ścieżek: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności grafu importów. Edycje konfiguracji/setupu/pakietów nie uruchamiają szerokiego zestawu testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzania dla wąskiej pracy. Klasyfikuje diff na core, testy core, rozszerzenia, testy rozszerzeń, aplikacje, dokumentację, metadane wydania, narzędzia live Docker i tooling, a następnie uruchamia pasujące polecenia typecheck, lint i guard. Nie uruchamia testów Vitest; wywołaj `pnpm test:changed` albo jawne `pnpm test <target>` jako dowód testowy. Zmiany wersji obejmujące wyłącznie metadane wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych, z guardem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje harnessu live Docker ACP uruchamiają skupione kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker oraz próbne uruchomienie harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff jest ograniczony do `scripts["test:docker:live-*"]`; edycje zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych guardów.
    - Lekkie importowo testy jednostkowe z agentów, poleceń, plugins, pomocników auto-reply, `plugin-sdk` i podobnych obszarów czysto użytkowych są kierowane przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` mapują również uruchomienia w trybie zmienionym na jawne sąsiednie testy w tych lekkich ścieżkach, więc edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla pomocników core najwyższego poziomu, testów integracyjnych najwyższego poziomu `reply.*` oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na fragmenty agent-runner, dispatch i commands/state-routing, aby jeden koszyk ciężki importowo nie posiadał całego ogona Node.
    - Normalne CI dla PR/main celowo pomija wsadowy przegląd rozszerzeń i przeznaczony tylko dla wydań fragment `agentic-plugins`. Full Release Validation uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych ciężkich od plugins/rozszerzeń zestawów na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie osadzonego runnera">

    - Gdy zmieniasz dane wejściowe wykrywania narzędzi wiadomości albo kontekst runtime Compaction, zachowaj oba poziomy pokrycia.
    - Dodaj skupione regresje pomocników dla granic czystego routingu i normalizacji.
    - Utrzymuj w dobrym stanie zestawy integracyjne osadzonego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy sprawdzają, że zakresowe identyfikatory i zachowanie Compaction nadal przepływają przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocników nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli i izolacji Vitest">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swój setup i optymalizator `jsdom`, ale także działa na współdzielonym nieizolowanym runnerze.
    - Każdy fragment `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów podrzędnych Node Vitest, aby ograniczyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym zachowaniem V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala diff.
    - Hook pre-commit służy wyłącznie do formatowania. Ponownie stage’uje sformatowane pliki i nie uruchamia lint, typecheck ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub push, gdy potrzebujesz inteligentnej lokalnej bramki sprawdzania.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowe ścieżki. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent uzna, że edycja harnessu, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu, tylko z wyższym limitem workerów.
    - Lokalne automatyczne skalowanie workerów jest celowo konserwatywne i wycofuje się, gdy średnie obciążenie hosta jest już wysokie, więc wiele współbieżnych uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracji jako `forceRerunTriggers`, aby ponowne uruchomienia w trybie zmienionym pozostawały poprawne, gdy zmienia się okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz wyjście import-breakdown.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do plików zmienionych od `origin/main`.
    - Dane czasów fragmentów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; fragmenty CI z wzorcem include dopisują nazwę fragmentu, aby odfiltrowane fragmenty można było śledzić osobno.
    - Gdy jeden gorący test nadal spędza większość czasu w importach startowych, trzymaj ciężkie zależności za wąską lokalną granicą `*.runtime.ts` i mockuj tę granicę bezpośrednio zamiast głęboko importować pomocniki runtime tylko po to, by przepuścić je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego diffa i wypisuje czas rzeczywisty oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo, routując listę zmienionych plików przez `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla narzutów startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla zestawu jednostkowego z wyłączoną równoległością plików.

  </Accordion>
</AccordionGroup>

### Stabilność (Gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszona na jednego workera
- Zakres:
  - Domyślnie uruchamia rzeczywisty Gateway loopback z włączoną diagnostyką
  - Przepuszcza syntetyczny churn wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki utrwalania pakietu stabilności diagnostycznej
  - Sprawdza, że recorder pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek na sesję spadają z powrotem do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka do dalszego śledzenia regresji stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E bundled-plugin pod `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (ograniczoną do 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wieloinstancyjnego gateway
  - Powierzchnie WebSocket/HTTP, parowanie node i cięższa sieć
- Oczekiwania:
  - Działa w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż testy jednostkowe (może być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + SSH exec
  - Weryfikuje zachowanie systemu plików w formie remote-canonical przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niedomyślny binarny plik CLI lub skrypt opakowujący

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live bundled-plugin pod `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wychwytywanie zmian formatu dostawców, osobliwości tool-calling, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live wczytują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracji/uwierzytelniania do tymczasowego testowego home, aby fixture’y jednostkowe nie mogły zmodyfikować twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały twojego prawdziwego katalogu home.
- `pnpm test:live` teraz domyślnie używa cichszego trybu: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkowe powiadomienie `~/.profile` i wycisza logi bootstrap Gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają przy odpowiedziach limitu szybkości.
- Wyjście postępu/heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, więc długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc linie postępu dostawcy/gateway strumieniują natychmiast podczas uruchomień live.
  - Dostrój heartbeats modeli bezpośrednich za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój heartbeats gateway/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Macierz modeli live, testy dymne backendu CLI, testy dymne ACP, harness serwera aplikacji Codex oraz wszystkie testy live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz, muzyka, wideo, media harness) — a także obsługę poświadczeń dla uruchomień live — opisuje [Testowanie — zestawy live](/pl/help/testing-live).

## Runnery Docker (opcjonalne sprawdzenia „działa w Linuksie”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live klucza profilu wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i obszar roboczy (oraz źródłując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu testów dymnych, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  jawnie chcesz wykonać większy, wyczerpujący skan.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie wykorzystuje dwa obrazy `scripts/e2e/Dockerfile`. Obraz podstawowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności Plugin; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego schedulera: `OPENCLAW_DOCKER_ALL_PARALLELISM` steruje slotami procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, npm-install i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, scheduler nadal może ją uruchomić, gdy pula jest pusta, a potem utrzymuje ją jako jedyną uruchomioną, aż pojemność znów będzie dostępna. Wartości domyślne to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje preflight Docker, usuwa nieaktualne kontenery OpenClaw E2E, wypisuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w późniejszych uruchomieniach najpierw startować dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania lub uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietów/obrazów i poświadczeń.
- `Package Acceptance` jest natywną dla GitHub bramką pakietu dla pytania „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybraną referencję. `workflow_ref` wybiera zaufane skrypty workflow/harness, a `package_ref` wybiera commit/branch/tag źródłowy do spakowania, gdy `source=ref`; pozwala to bieżącej logice akceptacji walidować starsze zaufane commity. Profile są uporządkowane według zakresu: `smoke` to szybka instalacja/kanał/agent plus gateway/konfiguracja, `package` to kontrakt pakietu/aktualizacji/Plugin plus fixture keyless upgrade-survivor i domyślny natywny zamiennik większości pokrycia pakietu/aktualizacji w Parallels, `product` dodaje kanały MCP, czyszczenie cron/subagenta, wyszukiwanie WWW OpenAI i OpenWebUI, a `full` uruchamia fragmenty Docker ścieżki wydania z OpenWebUI. Walidacja wydania uruchamia niestandardową deltę pakietu (`bundled-channel-deps-compat plugins-offline`) plus QA pakietu Telegram, ponieważ fragmenty Docker ścieżki wydania już pokrywają nakładające się ścieżki pakietu/aktualizacji/Plugin. Docelowe polecenia ponownego uruchomienia GitHub Docker wygenerowane z artefaktów obejmują wcześniejszy artefakt pakietu i przygotowane wejścia obrazów, gdy są dostępne, dzięki czemu nieudane ścieżki mogą uniknąć ponownego budowania pakietu i obrazów.
- Sprawdzenia budowania i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi statyczny zbudowany graf od `dist/entry.js` i `dist/cli/run-main.js` i kończy się niepowodzeniem, jeśli start przed dispatch importuje zależności pakietu, takie jak Commander, prompt UI, undici lub logowanie przed dispatch polecenia; utrzymuje też zbudowany fragment uruchomienia Gateway poniżej budżetu i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Test dymny spakowanego CLI obejmuje też pomoc główną, pomoc onboard, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (w tym `2026.4.25-beta.*`). Do tej granicy harness toleruje tylko luki metadanych wysłanego pakietu: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brak plików patchy w fixture git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Plugin, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi niepowodzeniami.
- Runnery testów dymnych kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` i `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live montują też tylko potrzebne katalogi domowe uwierzytelniania CLI (lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA z checkoutem źródeł. Celowo nie jest częścią ścieżek wydania pakietu Docker, ponieważ tarball npm pomija QA Lab.
- Smoke test Open WebUI na żywo: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne rusztowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez onboarding z odwołaniami do zmiennych środowiskowych oraz domyślnie Telegram, sprawdza, czy doctor naprawił aktywowane zależności runtime Plugin, i uruchamia jeden zamockowany obrót agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Dockerze, przełącza z pakietu `stable` na git `dev`, sprawdza utrwalony kanał oraz działanie Plugin po aktualizacji, a następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na zabrudzonym fixture starego użytkownika z agentami, konfiguracją kanałów, listami dozwolonych Plugin, nieaktualnym stanem zależności runtime Plugin oraz istniejącymi plikami przestrzeni roboczej/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy dostawcy ani kanału na żywo, następnie uruchamia Gateway przez loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchamiania/statusu.
- Smoke test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` sprawdza utrwalanie ukrytego kontekstu runtime w transkrypcie oraz naprawę doctor dla dotkniętych zduplikowanych gałęzi przepisywania promptu.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i sprawdza, czy `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast się zawieszać. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń budowanie na hoście przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do kandydującego tarballa. Nadpisz lokalnie przez `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo na GitHubie przez wejście `update_baseline_version` workflow Install Smoke. Kontrole instalatora bez uprawnień root zachowują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do roota nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonej przestrzeni roboczej agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasiewa dwóch agentów z jedną przestrzenią roboczą w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i sprawdza poprawny JSON oraz zachowanie zachowanej przestrzeni roboczej. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + zdrowie): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test zrzutu przeglądarki CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E oraz warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i sprawdza, czy zrzuty ról CDP obejmują URL-e linków, elementy klikalne promowane kursorem, referencje iframe oraz metadane ramek.
- Regresja minimalnego rozumowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, sprawdza, czy `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, czy surowy szczegół pojawia się w logach Gateway.
- Most kanałów MCP (zasiany Gateway + most stdio + surowy smoke test ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer MCP stdio + smoke test allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagent (rzeczywisty Gateway + demontaż procesu potomnego MCP stdio po izolowanym cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji, instalacja/dezinstalacja ClawHub kitchen-sink, aktualizacje marketplace oraz włączanie/inspekcja pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink za pomocą `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixture ClawHub.
- Smoke test braku zmian przy aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Zależności runtime dołączonych Plugin: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Docker, buduje i pakuje OpenClaw raz na hoście, a następnie montuje ten tarball w każdym scenariuszu instalacji Linux. Użyj ponownie obrazu przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżym lokalnym buildzie przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` albo wskaż istniejący tarball przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Pełny agregat Docker oraz części bundled-channel ścieżki wydania pakują ten tarball wstępnie raz, a następnie dzielą kontrole dołączonych kanałów na niezależne ścieżki, w tym osobne ścieżki aktualizacji dla Telegram, Discord, Slack, Feishu, memory-lancedb i ACPX. Części wydania dzielą smoke testy kanałów, cele aktualizacji oraz kontrakty setup/runtime na `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` i `bundled-channels-contracts`; agregat `bundled-channels` pozostaje dostępny do ręcznych ponownych uruchomień. Workflow wydania dzieli też części instalatora dostawców oraz części instalacji/dezinstalacji dołączonych Plugin; starsze części `package-update`, `plugins-runtime` i `plugins-integrations` pozostają aliasami agregatów do ręcznych ponownych uruchomień. Użyj `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, aby zawęzić macierz kanałów przy bezpośrednim uruchamianiu dołączonej ścieżki, albo `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, aby zawęzić scenariusz aktualizacji. Uruchomienia Docker dla poszczególnych scenariuszy domyślnie używają `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; scenariusz aktualizacji wielu celów domyślnie używa `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Ścieżka sprawdza też, czy `channels.<id>.enabled=false` i `plugins.entries.<id>.enabled=false` wyłączają naprawę doctor/zależności runtime.
- Zawęź zależności runtime dołączonych Plugin podczas iteracji, wyłączając niepowiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest już lokalny. Testy Docker QR i instalatora zachowują własne pliki Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnery Docker dla modeli live również montują bieżący checkout w trybie tylko do odczytu i
przenoszą go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje lekki, a Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże lokalne pamięci podręczne i wyjścia buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyjściowe `.build` lub
Gradle, aby uruchomienia live w Dockerze nie spędzały minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Docker.
`test:docker:openwebui` to smoke test kompatybilności wyższego poziomu: uruchamia
kontener Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, sprawdza, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć dokończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje użytecznego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach w Dockerze.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia wstępnie zasilony kontener Gateway,
uruchamia drugi kontener, który spawnuje `openclaw mcp serve`, a następnie
weryfikuje wykrywanie routowanych konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routowanie wysyłania wychodzącego oraz powiadomienia kanału +
uprawnień w stylu Claude przez prawdziwy most MCP stdio. Sprawdzenie powiadomień
inspektuje bezpośrednio surowe ramki MCP stdio, dzięki czemu smoke test weryfikuje to, co
most faktycznie emituje, a nie tylko to, co przypadkowo eksponuje konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu live.
Buduje obraz Docker repozytorium, uruchamia prawdziwy serwer sondy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime pakietu Pi
MCP, wykonuje narzędzie, a następnie sprawdza, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia wstępnie zasilony Gateway z prawdziwym serwerem sondy MCP stdio, wykonuje
izolowaną turę Cron oraz jednorazową turę potomną `/subagents spawn`, a następnie sprawdza,
że proces potomny MCP kończy się po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji routowania wątków ACP, więc nie usuwaj go.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i source'owane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe source'owane z `OPENCLAW_PROFILE_FILE`, przy użyciu tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montowań auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listy rozdzielonej przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla powtórzeń, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profilu (nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzający nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola spójności dokumentacji

Uruchamiaj kontrole dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz także kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego pipeline'u” bez prawdziwych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy Gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez prawdziwy Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe, które asercjami sprawdzają kolejność narzędzi, przeniesienie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do asercji wywołań narzędzi + kolejności, odczytów plików skill i okablowania sesji.
- Mały zestaw scenariuszy skoncentrowanych na skillach (użyj vs unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu oraz zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
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
- **directory** - API katalogu/listy
- **group-policy** - Wymuszanie zasad grupy

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
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

Gdy naprawiasz problem dostawcy/modelu wykryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury jest to tylko live (limity szybkości, zasady auth), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która łapie błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd pipeline'u sesji/historii/narzędzi Gateway → smoke live Gateway albo bezpieczny dla CI mock test Gateway
- Guardrail przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza po jednym próbkowanym celu na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że exec ids z segmentem przejścia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem na niesklasyfikowanych id celów, aby nowych klas nie dało się po cichu pominąć.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [CI](/pl/ci)
