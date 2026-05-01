---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway i agenta
summary: 'Zestaw testowy: zestawy unit/e2e/live, uruchamiacze Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-05-01T09:59:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (jednostkowe/integracyjne, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw testów (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać dla typowych przepływów pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają dane uwierzytelniające i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, ścieżki transportu live)** jest udokumentowany osobno:

- [Przegląd QA](/pl/concepts/qa-e2e-automation) — architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) — dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny Plugin transportowy używany przez scenariusze oparte na repozytorium.

Ta strona opisuje uruchamianie standardowych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większości dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na maszynie z dużymi zasobami: `pnpm test:max`
- Bezpośrednia pętla obserwacji Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki pluginów/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Podczas iteracji nad pojedynczą awarią najpierw wybieraj uruchomienia ukierunkowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Ścieżka QA oparta na maszynie VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów lub chcesz dodatkowej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych danych uwierzytelniających):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche wskazanie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Przegląd modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają także małą turę obrazową.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienny `OpenClaw Scheduled Live And E2E Checks` oraz ręczny
    `OpenClaw Release Checks` wywołują wielokrotnego użytku workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live Docker,
    podzielone według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI uruchom `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodawaj nowe, wartościowe sekrety dostawców do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań zaplanowanych/release.
- Smoke natywnego czatu powiązanego Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia ścieżkę live Docker względem ścieżki app-server Codex, wiąże syntetyczną
    wiadomość DM Slack przez `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazowy
    przechodzą przez natywne powiązanie Plugin zamiast ACP.
- Smoke harnessa app-server Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należący do Plugin harness app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    cron MCP, subagenta i Guardian. Wyłącz sondę subagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla ukierunkowanego sprawdzenia subagenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie subagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne, dodatkowe sprawdzenie powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu, odpowiada
    `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Smoke planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyty fallback planera przekłada się na audytowany typowany
    zapis konfiguracji.
- Smoke pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, przekierowuje samo `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także objęta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke kosztu Moonshot/Kimi: z ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON zgłasza Moonshot/K2.6, a
  transkrypt asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, zawężaj testy live za pomocą zmiennych środowiskowych listy dozwolonych opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych workflow. `Parity gate` działa na pasujących PR-ach oraz
z ręcznego uruchomienia z mockowanymi dostawcami. `QA-Lab - All Lanes` działa nocą na
`main` oraz z ręcznego uruchomienia z bramką parzystości mocków, ścieżką live Matrix,
zarządzaną przez Convex ścieżką live Telegram i zarządzaną przez Convex ścieżką live Discord jako
zadaniami równoległymi. Zaplanowane QA i kontrole release przekazują Matrix `--profile fast`
jawnie, podczas gdy domyślne wartości wejścia CLI Matrix i ręcznego workflow pozostają
`all`; ręczne uruchomienie może podzielić `all` na zadania `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` i `e2ee-cli`. `OpenClaw Release Checks` uruchamia parzystość oraz
szybkie ścieżki Matrix i Telegram przed zatwierdzeniem release, używając
`mock-openai/gpt-5.5` dla kontroli transportu release, aby pozostały deterministyczne
i omijały normalne uruchamianie Plugin dostawcy. Te Gateway transportu live wyłączają
wyszukiwanie pamięci; zachowanie pamięci pozostaje objęte zestawami parzystości QA.

Pełne shardy mediów live dla release używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który już ma
`ffmpeg` i `ffprobe`. Shardy modeli/backendów live Docker używają współdzielonego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>`, budowanego raz na wybrany commit,
a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
w każdym shardzie.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    liczbą wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`,
    gdy chcesz uzyskać artefakty bez kodu wyjścia oznaczającego awarię.
  - Obsługuje tryby dostawców `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet mockowanych scenariuszy QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje gorącego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki
    i nie wyglądają jak wielominutowa regresja obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma jeszcze
    świeżych danych wyjściowych runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej maszyny VM Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA praktyczne dla gościa:
    klucze dostawców z env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod korzeniem repozytorium, aby gość mógł zapisywać
    z powrotem przez zamontowany workspace.
  - Zapisuje normalny raport QA + podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Docker witrynę QA do pracy QA w stylu operatora.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że włączenie Plugin instaluje zależności runtime na żądanie,
    uruchamia doctor i wykonuje jedną lokalną turę agenta względem mockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietu
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke zbudowanej aplikacji w Docker dla osadzonych transkryptów kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako niewyświetlana wiadomość niestandardowa,
    zamiast wyciekać do widocznej tury użytkownika, następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje,
    że `openclaw doctor --fix` przepisuje go na aktywną gałąź z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydata pakietu OpenClaw w Docker, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    ścieżki QA live Telegram z tym zainstalowanym pakietem jako SUT Gateway.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` lub
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby testować rozwiązany lokalny tarball zamiast
    instalować z rejestru.
  - Używa tych samych danych uwierzytelniających env Telegram lub źródła danych uwierzytelniających Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/release ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker wybiera Convex automatycznie.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainera
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa środowiska
    `qa-live-shared` i dzierżaw danych uwierzytelniających Convex CI.
- GitHub Actions udostępnia także `Package Acceptance` jako poboczny dowód produktu
  względem jednego pakietu kandydującego. Akceptuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full lub custom.
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

- Dowód z artefaktu pobiera artefakt tarball z innego uruchomienia Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżący build OpenClaw w Dockerze, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez
    edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane zależności
    środowiska uruchomieniowego pluginu nieobecne, pierwsze skonfigurowane uruchomienie
    Gateway lub doctor instaluje zależności środowiska uruchomieniowego każdego
    dołączonego pluginu na żądanie, a drugi restart nie instaluje ponownie
    zależności, które zostały już aktywowane.
  - Instaluje również znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po
    aktualizacji naprawia zależności środowiska uruchomieniowego dołączonego
    kanału bez naprawy postinstall po stronie harnessu.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke test aktualizacji instalacji pakietowej na gościach
    Parallels. Każda wybrana platforma najpierw instaluje żądany pakiet bazowy,
    potem uruchamia zainstalowane polecenie `openclaw update` w tym samym gościu
    i weryfikuje zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz
    jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iterowania na jednym gościu. Użyj `--json`, aby uzyskać ścieżkę artefaktu
    podsumowania i status każdej ścieżki.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` do dowodu tury agenta na żywo.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny model OpenAI.
  - Owijaj długie lokalne uruchomienia timeoutem hosta, aby zastoje transportu
    Parallels nie zużyły reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek pod `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`,
    zanim uznasz, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut w naprawie doctor/zależności
    środowiska uruchomieniowego po aktualizacji na zimnym gościu; to nadal zdrowy
    stan, gdy zagnieżdżony log debug npm postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi ścieżkami
    smoke Parallels dla macOS, Windows albo Linux. Współdzielą stan VM i mogą
    kolidować przy przywracaniu snapshotów, serwowaniu pakietów albo stanie
    Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię dołączonych pluginów,
    ponieważ fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie
    mediów, są ładowane przez dołączone API środowiska uruchomieniowego nawet
    wtedy, gdy sama tura agenta sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer providera AIMock do bezpośrednich smoke testów
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę QA na żywo Matrix względem jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródeł — instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [Matrix QA](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę QA na żywo Telegram względem prawdziwej prywatnej grupy, używając tokenów bota drivera i bota SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grupy musi być numerycznym id czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kodu wyjścia oznaczającego błąd.
  - Wymaga dwóch odrębnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Aby uzyskać stabilną obserwację bot-bot, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot drivera może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages pod `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi obejmują RTT od żądania wysłania drivera do zaobserwowanej odpowiedzi SUT.

Ścieżki transportu na żywo współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia dla poszczególnych ścieżek znajduje się w [przeglądzie QA → Pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki syntetyczny zestaw i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (albo `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, QA lab pozyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła
Heartbeat dla tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamykaniu.

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex `http://` loopback tylko do lokalnego rozwoju.

`OPENCLAW_QA_CONVEX_SITE_URL` powinien używać `https://` podczas normalnej pracy.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami na żywo, aby sprawdzić URL strony Convex, sekrety brokera,
prefiks endpointu, timeout HTTP i osiągalność admin/list bez drukowania
wartości sekretów. Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i
narzędziach CI.

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
- `groupId` musi być numerycznym ciągiem id czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca niepoprawne payloady.

### Dodawanie kanału do QA

Architektura i nazwy helperów scenariuszy dla nowych adapterów kanałów znajdują się w [przeglądzie QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym hoście `qa-lab`, zadeklaruj `qaRunners` w manifeście pluginu, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze pod `qa/scenarios/`.

## Zestawy testów (co działa gdzie)

Myśl o zestawach jako o „rosnącym realizmie” (oraz rosnącej niestabilności/koszcie):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia bez targetu używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/unit pod `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, tooling, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Działa w CI
  - Nie wymaga prawdziwych kluczy
  - Powinno być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą dowodzić szerokiego zachowania fallbacków `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych małych fixture’ów pluginów, a nie
    rzeczywistych API źródłowych dołączonych pluginów. Rzeczywiste ładowania API pluginów należą do
    zestawów kontraktowych/integracyjnych należących do pluginów.

<AccordionGroup>
  <Accordion title="Projekty, shardy i ścieżki o ograniczonym zakresie">

    - Nieukierunkowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega temu, by prace auto-reply/rozszerzeń zagłodziły niepowiązane zestawy testów.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ wieloshardowa pętla obserwowania nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` kierują jawne cele plików/katalogów najpierw przez zakresowe pasy, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika płacenia pełnego kosztu startowego projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git na tanie zakresowe pasy: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności z grafu importów. Edycje konfiguracji, setupu i pakietów nie uruchamiają szeroko testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzająca dla wąskich prac. Klasyfikuje diff na core, testy core, rozszerzenia, testy rozszerzeń, aplikacje, dokumentację, metadane wydań, narzędzia live Docker i narzędzia, a następnie uruchamia pasujące polecenia sprawdzania typów, lintingu i strażników. Nie uruchamia testów Vitest; wywołaj `pnpm test:changed` albo jawne `pnpm test <target>` jako dowód testowy. Zmiany wersji obejmujące wyłącznie metadane wydań uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych, ze strażnikiem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje live Docker ACP harness uruchamiają skoncentrowane kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker oraz próbny przebieg harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; edycje zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych strażników.
    - Lekkie importowo testy jednostkowe z agentów, poleceń, Pluginów, pomocników auto-reply, `plugin-sdk` i podobnych obszarów czystych narzędzi są kierowane przez pas `unit-fast`, który pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących pasach.
    - Wybrane pliki źródłowe pomocników `plugin-sdk` i `commands` również mapują przebiegi trybu changed na jawne sąsiednie testy w tych lekkich pasach, więc edycje pomocników unikają ponownego uruchamiania pełnego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla pomocników core najwyższego poziomu, testów integracyjnych najwyższego poziomu `reply.*` i poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch i commands/state-routing, aby jeden koszyk ciężki importowo nie obejmował całego ogona Node.
    - Normalne CI PR/main celowo pomija zbiorczy przegląd rozszerzeń i shard `agentic-plugins` przeznaczony tylko do wydań. Pełna Release Validation uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych zestawów ciężkich od Pluginów/rozszerzeń na kandydatach do wydania.

  </Accordion>

  <Accordion title="Pokrycie osadzonego runnera">

    - Gdy zmieniasz wejścia wykrywania narzędzi wiadomości lub kontekst runtime compaction,
      utrzymaj oba poziomy pokrycia.
    - Dodaj skoncentrowane regresje pomocników dla granic czystego routingu i normalizacji.
    - Utrzymuj w dobrym stanie zestawy integracyjne osadzonego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy sprawdzają, że identyfikatory zakresowe i zachowanie compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie pomocników
      nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Domyślne ustawienia puli i izolacji Vitest">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główny pas UI zachowuje swój setup `jsdom` i optymalizator, ale również działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Node
      Vitest, aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych przebiegów.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym zachowaniem V8.

  </Accordion>

  <Accordion title="Szybka lokalna iteracja">

    - `pnpm changed:lanes` pokazuje, które pasy architektoniczne wyzwala diff.
    - Hook pre-commit zajmuje się tylko formatowaniem. Ponownie stage'uje sformatowane pliki i
      nie uruchamia lintingu, sprawdzania typów ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub push, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowe pasy. Używaj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harness, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Lokalna autoskalacja workerów jest celowo konserwatywna i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych
      przebiegów Vitest domyślnie powoduje mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracji jako
      `forceRerunTriggers`, aby ponowne przebiegi trybu changed pozostawały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Debugowanie wydajności">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      dane rozbicia importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Przebiegi całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI
      ze wzorcem include dopisują nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym szwem `*.runtime.ts` i
      mockuj ten szew bezpośrednio, zamiast głęboko importować pomocniki runtime tylko
      po to, by przepuścić je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas rzeczywisty oraz maksymalne RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
      `scripts/test-projects.mjs` i główną konfigurację Vitest.
    - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
      narzutu startu i transformacji Vitest/Vite.
    - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
      zestawu jednostkowego z wyłączonym równolegleniem plików.

  </Accordion>
</AccordionGroup>

### Stabilność (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszone użycie jednego workera
- Zakres:
  - Domyślnie uruchamia rzeczywisty loopback Gateway z włączoną diagnostyką
  - Przepuszcza syntetyczny churn wiadomości gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje pomocniki utrwalania pakietu stabilności diagnostycznej
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek na sesję wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąski pas dla działań następczych przy regresjach stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (gateway smoke)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Pluginów w `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, tak jak reszta repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie cichym, aby ograniczyć narzut wejścia/wyjścia konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end gateway z wieloma instancjami
  - Powierzchnie WebSocket/HTTP, parowanie node i cięższa sieć
- Oczekiwania:
  - Działa w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż w testach jednostkowych (może być wolniejsze)

### E2E: OpenShell backend smoke

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany OpenShell gateway na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zdalnie kanoniczne zachowanie systemu plików przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego przebiegu `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny CLI lub skrypt wrappera

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model rzeczywiście działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wychwytuje zmiany formatów dostawców, osobliwości wywoływania narzędzi, problemy z uwierzytelnianiem i zachowanie limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Przebiegi live źródłują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie przebiegi live nadal izolują `HOME` i kopiują materiały konfiguracyjne/uwierzytelniające do tymczasowego domu testowego, aby fixture'y jednostkowe nie mogły modyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie przechodzi teraz w cichszy tryb: zachowuje wyjście postępu `[live] ...`, ale wycisza dodatkową informację `~/.profile` i logi bootstrapu gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) lub nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach limitu szybkości.
- Wyjście postępu/heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc linie postępu dostawcy/gateway są strumieniowane natychmiast podczas przebiegów live.
  - Dostosuj heartbeaty modeli bezpośrednich przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj heartbeaty gateway/probe przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Modyfikowanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężony `pnpm test:live`

## Testy live (dotykające sieci)

Macierz modeli live, dymy backendu CLI, dymy ACP, uprząż serwera aplikacji Codex
oraz wszystkie testy live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, uprząż mediów), a także obsługę poświadczeń dla uruchomień live, opisano w
[Testowanie — zestawy live](/pl/help/testing-live).

## Runnery Docker (opcjonalne sprawdzenia „działa w Linuksie”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczem profilu wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i obszar roboczy (oraz wczytując `~/.profile`, jeśli jest zamontowany). Odpowiadające im lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu dymnego, aby pełny przegląd Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  jawnie chcesz większego, wyczerpującego skanowania.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako archiwum npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz podstawowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności Plugin; te ścieżki montują wstępnie zbudowane archiwum. Obraz funkcjonalny instaluje to samo archiwum w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, instalacji npm i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram nadal może ją uruchomić, gdy pula jest pusta, a potem utrzymuje ją jako jedyną działającą, dopóki pojemność znów nie będzie dostępna. Wartości domyślne to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje wstępne sprawdzenie Docker, usuwa nieaktualne kontenery OpenClaw E2E, wypisuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w kolejnych uruchomieniach najpierw startować dłuższe ścieżki. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania ani uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietu/obrazu i poświadczeń.
- `Package Acceptance` to natywna bramka pakietu GitHub dla pytania „czy to instalowalne archiwum działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego archiwum zamiast przepakowywać wybrany ref. `workflow_ref` wybiera zaufane skrypty workflow/uprzęży, a `package_ref` wybiera commit/gałąź/tag źródłowy do spakowania, gdy `source=ref`; dzięki temu bieżąca logika akceptacji może weryfikować starsze zaufane commity. Profile są uporządkowane według zakresu: `smoke` to szybka instalacja/kanał/agent plus Gateway/konfiguracja, `package` to kontrakt pakietu/aktualizacji/Plugin plus fixture przetrwania aktualizacji bez klucza, ścieżka przetrwania aktualizacji opublikowanej linii bazowej oraz domyślny natywny zamiennik dla większości pokrycia pakietu/aktualizacji Parallels, `product` dodaje kanały MCP, sprzątanie cron/subagent, wyszukiwanie web OpenAI i OpenWebUI, a `full` uruchamia fragmenty Docker ścieżki wydania z OpenWebUI. Dla `published-upgrade-survivor` Package Acceptance zawsze używa `package-under-test` jako kandydata i `published_upgrade_survivor_baseline` jako zapasowej opublikowanej linii bazowej, domyślnie `openclaw@latest`; ustaw `published_upgrade_survivor_baselines=release-history`, aby podzielić ścieżkę na zdeduplikowaną macierz ostatnich sześciu wydań stabilnych, `2026.4.23` i ostatniego wydania stabilnego sprzed `2026-03-15`. Opublikowana ścieżka konfiguruje swoją linię bazową za pomocą wbudowanej receptury polecenia `openclaw config set`, a potem zapisuje kroki receptury w podsumowaniu ścieżki. Walidacja wydania uruchamia niestandardową deltę pakietu (`bundled-channel-deps-compat plugins-offline`) plus QA pakietu Telegram, ponieważ fragmenty Docker ścieżki wydania już pokrywają nakładające się ścieżki pakietu/aktualizacji/Plugin. Ukierunkowane polecenia ponownego uruchomienia GitHub Docker wygenerowane z artefaktów obejmują wcześniejszy artefakt pakietu, przygotowane wejścia obrazów i listę linii bazowych przetrwania opublikowanej aktualizacji, gdy jest dostępna, dzięki czemu ścieżki zakończone niepowodzeniem mogą uniknąć ponownego budowania pakietu i obrazów.
- Sprawdzenia budowania i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` i kończy niepowodzeniem, jeśli start przed dyspozycją polecenia importuje zależności pakietu, takie jak Commander, UI promptów, undici lub logowanie, zanim nastąpi dyspozycja polecenia; utrzymuje też zbundlowany fragment uruchomieniowy Gateway w budżecie i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Dym pakietowanego CLI pokrywa też pomoc główną, pomoc onboardingu, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego punktu granicznego uprząż toleruje tylko luki metadanych wysłanego pakietu: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brak plików patch w fixture git pochodzącej z archiwum, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji Plugin, brak utrwalania rekordu instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi niepowodzeniami.
- Runnery dymne kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` i `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live montują też tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA dla checkoutu źródeł. Celowo nie jest częścią ścieżek wydań pakietów Docker, ponieważ archiwum npm tarball pomija QA Lab.
- Smoke test na żywo Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne szkieletowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboardingu/kanału/agenta z archiwum npm tarball: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowane archiwum OpenClaw tarball globalnie w Docker, konfiguruje OpenAI przez onboarding z odwołaniem do env oraz domyślnie Telegram, weryfikuje, że doctor naprawił aktywowane zależności runtime Plugin, i uruchamia jedną zamockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego archiwum tarball przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowane archiwum OpenClaw tarball globalnie w Docker, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie Plugin po aktualizacji, następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowane archiwum OpenClaw tarball na zabrudzonej fiksturze starego użytkownika z agentami, konfiguracją kanału, listami dozwolonych Plugin, przestarzałym stanem zależności runtime Plugin oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywnego doctora bez kluczy dostawcy ani kanału na żywo, następnie uruchamia Gateway na loopbacku i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchamiania/statusu.
- Smoke test przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje ten punkt bazowy za pomocą wbudowanej receptury poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do kandydującego archiwum tarball, uruchamia nieinteraktywnego doctora, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway na loopbacku i sprawdza skonfigurowane intencje, zachowanie stanu, uruchamianie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jeden punkt bazowy przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś zbiorczy harmonogram o rozwinięcie dokładnych punktów bazowych przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` i rozwiń fikstury w kształcie zgłoszeń przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takie jak `reported-issues`; Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`.
- Smoke test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie transkrypcji ukrytego kontekstu runtime oraz naprawę przez doctora dotkniętych zduplikowanych gałęzi przepisywania promptów.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast się zawieszać. Użyj ponownie wstępnie zbudowanego archiwum tarball przez `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń budowanie na hoście przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jeden cache npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnego punktu bazowego przed aktualizacją do kandydującego archiwum tarball. Nadpisz lokalnie przez `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo przez wejście `update_baseline_version` workflow Install Smoke na GitHub. Kontrole instalatora bez roota zachowują izolowany cache npm, aby wpisy cache należące do roota nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby używać ponownie cache root/update/direct-npm między lokalnymi ponownymi uruchomieniami.
- CI Install Smoke pomija zduplikowaną globalną aktualizację direct-npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tego env, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów jednym workspace w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje prawidłowy JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke przez `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, autoryzacja WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test migawki Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E oraz warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP obejmują adresy URL linków, klikalne elementy promowane kursorem, referencje iframe i metadane ramek.
- Regresja minimalnego rozumowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (zasiany Gateway + most stdio + smoke test surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (prawdziwy serwer MCP stdio + smoke test wbudowanego profilu Pi allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagent (prawdziwy Gateway + zamykanie dziecka MCP stdio po izolowanych uruchomieniach cron i jednorazowych uruchomieniach subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji, instalacja/deinstalacja ClawHub kitchen-sink, aktualizacje marketplace oraz włączanie/inspekcja pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fikstury ClawHub.
- Smoke test niezmienionej aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadanych ponownego ładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Dołączone zależności runtime Plugin: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Docker, buduje i pakuje OpenClaw raz na hoście, a następnie montuje to archiwum tarball do każdego scenariusza instalacji Linux. Użyj ponownie obrazu przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżym lokalnym buildzie przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` albo wskaż istniejące archiwum tarball przez `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Pełny agregat Docker i fragmenty bundled-channel ścieżki wydania wstępnie pakują to archiwum tarball raz, a następnie dzielą kontrole dołączonych kanałów na niezależne ścieżki, w tym osobne ścieżki aktualizacji dla Telegram, Discord, Slack, Feishu, memory-lancedb i ACPX. Fragmenty wydania dzielą smoke testy kanałów, cele aktualizacji oraz kontrakty setup/runtime na `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` i `bundled-channels-contracts`; zbiorczy fragment `bundled-channels` pozostaje dostępny do ręcznych ponownych uruchomień. Workflow wydania dzieli także fragmenty instalatora dostawców oraz fragmenty instalacji/deinstalacji dołączonych Plugin; starsze fragmenty `package-update`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami do ręcznych ponownych uruchomień. Użyj `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, aby zawęzić macierz kanałów podczas bezpośredniego uruchamiania ścieżki dołączonej, albo `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, aby zawęzić scenariusz aktualizacji. Uruchomienia Docker dla poszczególnych scenariuszy domyślnie używają `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; scenariusz aktualizacji z wieloma celami domyślnie używa `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Ścieżka weryfikuje także, że `channels.<id>.enabled=false` i `plugins.entries.<id>.enabled=false` wyłączają naprawę zależności doctor/runtime.
- Zawęź dołączone zależności runtime Plugin podczas iteracji, wyłączając niepowiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie wstępnie zbudować i użyć ponownie współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla zestawu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnerzy Dockera dla modeli live montują też bieżący checkout w trybie tylko do odczytu i
przenoszą go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje lekki, a Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Etap przygotowania pomija duże lokalne cache i wyniki buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wynikowe `.build` lub
Gradle, dzięki czemu uruchomienia Docker live nie tracą minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż też
`OPENCLAW_LIVE_GATEWAY_*`, gdy trzeba zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Dockera.
`test:docker:openwebui` to smoke test zgodności wyższego poziomu: uruchamia
kontener Gateway OpenClaw z włączonymi zgodnymi z OpenAI endpointami HTTP,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, sprawdza, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać obraz
Open WebUI, a Open WebUI może musieć zakończyć własną konfigurację po zimnym starcie.
Ta ścieżka oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach zdokeryzowanych.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia wypełniony danymi kontener
Gateway, uruchamia drugi kontener, który spawnuje `openclaw mcp serve`, a następnie
weryfikuje wykrywanie trasowanych rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, trasowanie wysyłki wychodzącej oraz powiadomienia kanału +
uprawnień w stylu Claude przez rzeczywisty most MCP stdio. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki MCP stdio, więc smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu live.
Buduje obraz Dockera repozytorium, uruchamia rzeczywisty serwer sondy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzony runtime MCP pakietu Pi,
wykonuje narzędzie, a następnie sprawdza, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia wypełniony danymi Gateway z rzeczywistym serwerem sondy MCP stdio, wykonuje
izolowaną turę cron i jednorazową turę potomną `/subagents spawn`, a następnie sprawdza,
że proces potomny MCP kończy się po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji trasowania wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i wczytywane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montaży uwierzytelnienia CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache'owanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelnienia CLI pod `$HOME` są montowane w trybie tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listy rozdzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profilu (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzający nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentacji: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz też kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

Są to regresje „rzeczywistego pipeline'u” bez rzeczywistych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, rzeczywisty gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez rzeczywisty gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i przestrzega wymaganych kroków/argumentów?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które asercjami obejmują kolejność narzędzi, przenoszenie historii sesji i granice sandboksa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do asercji wywołań narzędzi + kolejności, odczytów plików skill i okablowania sesji.
- Mały zestaw scenariuszy skoncentrowanych na skillach (użyj kontra unikaj, bramkowanie, wstrzyknięcie promptu).
- Opcjonalne ewaluacje live (opt-in, bramkowane zmiennymi środowiskowymi) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginów i kanałów)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
pomija te współdzielone pliki smoke i wspólnych granic; uruchamiaj polecenia kontraktowe jawnie,
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
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie zasad grupy

### Kontrakty statusu dostawcy

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
- Po dodaniu lub zmodyfikowaniu kanału albo pluginu dostawcy
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe działają w CI i nie wymagają rzeczywistych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub dostawcy albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest to z natury tylko live (limity szybkości, zasady uwierzytelniania), utrzymaj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która łapie błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd pipeline'u sesji/historii/narzędzi gateway → smoke test live gateway albo bezpieczny dla CI test mock gateway
- Ochrona przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asercjami sprawdza, że exec id z segmentami przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo nie przechodzi na niesklasyfikowanych identyfikatorach celów, aby nowych klas nie dało się po cichu pominąć.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [CI](/pl/ci)
